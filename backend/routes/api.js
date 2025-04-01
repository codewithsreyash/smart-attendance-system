//const tf = require('@tensorflow/tfjs-node'); 
// const faceapi = require('face-api.js');
const express = require("express");
const cors = require("cors");
const router = express.Router();
const authCtrl = require("../controllers/auth");
const studentsRouter = require("./students");
const multer = require('multer');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const path = require("path");
const { Canvas, Image, ImageData } = require("canvas");
const fs = require('fs').promises;

// Log TensorFlow backend information
//console.log(`TensorFlow backend: ${tf.getBackend()}`); // This should print 'tensorflow' if using tfjs-node
// console.log(`faceapi.tf.getBackend(): ${faceapi.tf.getBackend()}`); // Log face-api.js backend

// Initialize canvas and face-api.js
// const canvas = require('canvas');
// const { loadImage } = canvas;
// faceapi.env.monkeyPatch({ Canvas, Image, ImageData });


// Configuration
const MODEL_PATH = path.join(__dirname, '../models');
const UPLOAD_DIR = path.join(__dirname, '../uploads');  
const LABELED_IMAGES_DIR = path.join(__dirname, '../labeled_images');

// State management
let modelsLoaded = false;
let labeledFaceDescriptors = null;

// Initialize file storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// Load face recognition models
async function loadModels() {
    try {
        await Promise.all([
            faceapi.nets.ssdMobilenetv1.loadFromDisk(MODEL_PATH),
            faceapi.nets.faceLandmark68Net.loadFromDisk(MODEL_PATH),
            faceapi.nets.faceRecognitionNet.loadFromDisk(MODEL_PATH)
        ]);
        modelsLoaded = true;
        console.log('Face recognition models loaded successfully');
    } catch (err) {
        console.error('Failed to load face recognition models:', err);
        throw err;
    }
}

// Load labeled images
async function loadLabeledImages() {
    const labels = ['sreyash']; // Add more labels as needed
    
    try {
        const descriptors = await Promise.all(
            labels.map(async (label) => {
                const descriptions = [];
                const labelDir = path.join(LABELED_IMAGES_DIR, label);
                
                try {
                    const files = await fs.readdir(labelDir);
                    const imageFiles = files.filter(file => /\.(jpg|jpeg|png)$/i.test(file));
                    
                    for (const file of imageFiles.slice(0, 2)) { // Limit to 2 images per label
                        const imagePath = path.join(labelDir, file);
                        try {
                            const img = await loadImage(imagePath);
                            const detection = await faceapi
                                .detectSingleFace(img)
                                .withFaceLandmarks()
                                .withFaceDescriptor();
                            
                            if (detection) {
                                descriptions.push(detection.descriptor);
                            } else {
                                console.warn(`No face detected in ${label}/${file}`);
                            }
                        } catch (err) {
                            console.error(`Error processing ${label}/${file}:`, err.message);
                        }
                    }
                    
                    return new faceapi.LabeledFaceDescriptors(label, descriptions);
                } catch (err) {
                    console.error(`Error reading directory for ${label}:`, err.message);
                    return null;
                }
            })
        );
        
        return descriptors.filter(Boolean);
    } catch (err) {
        console.error('Error loading labeled images:', err);
        throw err;
    }
}

async function initializeFaceRecognition() {
    try {
        await loadModels();
        labeledFaceDescriptors = await loadLabeledImages();
        console.log('Face recognition system ready with labels:', labeledFaceDescriptors.map(ld => ld.label));
    } catch (err) {
        console.error('Failed to initialize face recognition:', err);
        process.exit(1);
    }
}


// Middleware
router.use(cors());
router.use(async (req, res, next) => {
    if (!modelsLoaded || !labeledFaceDescriptors) {
        return res.status(503).json({ 
            error: 'Face recognition system initializing',
            status: {
                modelsLoaded,
                labeledImagesLoaded: !!labeledFaceDescriptors
            }
        });
    }
    next();
});

// Routes
router.post("/register", authCtrl.register);
router.post("/login", authCtrl.login);

router.get("/attendance", async (req, res) => {
    try {
        const attendanceRecords = await Attendance.find().sort({ date: -1 });
        res.json(attendanceRecords);
    } catch (error) {
        console.error("Error fetching attendance:", error);
        res.status(500).json({ message: "Error fetching attendance data" });
    }
});

router.post("/encode", upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
    }

    const imgPath = path.join(UPLOAD_DIR, req.file.filename);
    
    try {
        const img = await loadImage(imgPath);
        const detection = await faceapi
            .detectSingleFace(img)
            .withFaceLandmarks()
            .withFaceDescriptor();

        if (!detection) {
            await fs.unlink(imgPath);
            return res.status(400).json({ success: false, message: "No faces detected" });
        }

        const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors);
        const bestMatch = faceMatcher.findBestMatch(detection.descriptor);
        
        await fs.unlink(imgPath);

        if (bestMatch.label === "unknown") {
            return res.status(401).json({ 
                success: false, 
                message: "Face not recognized",
                confidence: bestMatch.distance.toFixed(2)
            });
        }

        res.json({ 
            success: true, 
            userId: bestMatch.label,
            confidence: (1 - bestMatch.distance).toFixed(2),
            message: "Face recognition successful"
        });

    } catch (error) {
        console.error("Face recognition error:", error);
        try { await fs.unlink(imgPath); } catch {}
        res.status(500).json({ 
            success: false, 
            message: "Internal server error",
            error: error.message 
        });
    }
});

router.post("/markAttendance", async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ message: "User ID is required" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const attendance = new Attendance({
            userId: user._id,
            name: user.name,
            status: 'Present',
            date: new Date()
        });

        await attendance.save();
        res.json({ success: true, message: "Attendance marked successfully" });

    } catch (error) {
        console.error("Error marking attendance:", error);
        res.status(500).json({ message: "Error marking attendance" });
    }
});

router.use("/students", studentsRouter);

// Initialize the system
initializeFaceRecognition();

module.exports = router;
