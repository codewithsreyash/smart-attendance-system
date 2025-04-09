const faceapi = require('face-api.js');
const path = require('path');
const fs = require('fs').promises;
const canvas = require('canvas');
const { Canvas, Image } = canvas;

// Initialize face-api.js with canvas
faceapi.env.monkeyPatch({ Canvas, Image });

class FaceRecognitionService {
    constructor() {
        this.modelsLoaded = false;
        this.labeledFaceDescriptors = null;
        this.modelPath = path.join(__dirname, '../models');
        this.labeledImagesPath = path.join(__dirname, '../labeled_images');
    }

    async initialize() {
        await this.loadModels();
        await this.loadLabeledImages();
    }

    async loadModels() {
        try {
            await Promise.all([
                faceapi.nets.ssdMobilenetv1.loadFromDisk(this.modelPath),
                faceapi.nets.faceLandmark68Net.loadFromDisk(this.modelPath),
                faceapi.nets.faceRecognitionNet.loadFromDisk(this.modelPath)
            ]);
            this.modelsLoaded = true;
            console.log('Face recognition models loaded successfully');
        } catch (error) {
            console.error('Error loading face recognition models:', error);
            throw error;
        }
    }

    async loadLabeledImages() {
        try {
            const labels = ['sreyash']; // Add more labels as needed
            const descriptors = await Promise.all(
                labels.map(async (label) => {
                    const descriptions = [];
                    const labelDir = path.join(this.labeledImagesPath, label);
                    
                    const files = await fs.readdir(labelDir);
                    const imageFiles = files.filter(file => /\.(jpg|jpeg|png)$/i.test(file));
                    
                    for (const file of imageFiles.slice(0, 2)) {
                        const imagePath = path.join(labelDir, file);
                        const img = await canvas.loadImage(imagePath);
                        const detection = await faceapi
                            .detectSingleFace(img)
                            .withFaceLandmarks()
                            .withFaceDescriptor();
                        
                        if (detection) {
                            descriptions.push(detection.descriptor);
                        }
                    }
                    
                    return new faceapi.LabeledFaceDescriptors(label, descriptions);
                })
            );
            
            this.labeledFaceDescriptors = descriptors.filter(d => d.descriptors.length > 0);
            console.log('Labeled faces loaded:', this.labeledFaceDescriptors.map(d => d.label));
        } catch (error) {
            console.error('Error loading labeled images:', error);
            throw error;
        }
    }

    async recognizeFace(image) {
        if (!this.modelsLoaded || !this.labeledFaceDescriptors) {
            throw new Error('Face recognition system not initialized');
        }

        const detection = await faceapi
            .detectSingleFace(image)
            .withFaceLandmarks()
            .withFaceDescriptor();

        if (!detection) {
            throw new Error('No face detected in image');
        }

        const faceMatcher = new faceapi.FaceMatcher(this.labeledFaceDescriptors, 0.6);
        const bestMatch = faceMatcher.findBestMatch(detection.descriptor);

        return {
            label: bestMatch.label,
            distance: bestMatch.distance,
            isRecognized: bestMatch.label !== 'unknown'
        };
    }
}

module.exports = new FaceRecognitionService();