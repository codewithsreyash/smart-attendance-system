const path = require('path');

module.exports = {
    // Model paths
    modelPath: path.join(__dirname, '../models'),
    uploadDir: path.join(__dirname, '../uploads'),
    labeledImagesDir: path.join(__dirname, '../labeled_images'),
    
    // Face recognition settings
    faceDetection: {
        minConfidence: 0.5,
        maxResults: 1
    },
    
    // Face matching settings
    faceMatching: {
        distanceThreshold: 0.6,
        maxDescriptorsPerPerson: 2
    },
    
    // Image processing
    imageProcessing: {
        maxSize: 800,
        quality: 0.8,
        format: 'jpeg'
    },
    
    // Timeouts
    timeouts: {
        detection: 30000,
        matching: 10000
    }
};