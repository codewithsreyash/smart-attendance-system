require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
// const port = process.env.PORT || 5000;
require('@tensorflow/tfjs-node'); // Use '@tensorflow/tfjs-node-gpu' if using GPU

const faceapi = require('face-api.js');
tf.setBackend('tensorflow').then(() => {
    console.log(`TensorFlow backend set to: ${tf.getBackend()}`);
});


// Face recognition setup

const { Canvas, Image, ImageData } = require('canvas');
const path = require('path');

// Initialize canvas and patch face-api.js
// faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

let faceModelsLoaded = false;

async function loadFaceModels() {
  try {
    const modelPath = path.join(__dirname, 'models');
    console.log(`Loading models from: ${modelPath}`);
    
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath).then(() => console.log("SSD MobileNetV1 loaded")),
      faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath).then(() => console.log("Face Landmark 68 Net loaded")),
      faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath).then(() => console.log("Face Recognition Net loaded"))
    ]);
    
    faceModelsLoaded = true;
    console.log('All face recognition models loaded successfully');
  } catch (err) {
    console.error('Failed to load face recognition models:', err);
    process.exit(1);
  }
}


// Create Express app
const app = express();

// Load models immediately when server starts
loadFaceModels();

// Debug: Verify environment variables (only in development)
if (process.env.NODE_ENV !== 'production') {
    console.log('Environment Variables:', {
        NODE_ENV: process.env.NODE_ENV,
        MONGODB_URI: process.env.MONGODB_URI ? '*****' : 'not set',
        PORT: process.env.PORT,
        faceModelsLoaded // Add model status to debug output
    });
}

// Middlewares
const corsOptions = {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/attendance';
const mongooseOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    retryWrites: true,
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000
};

mongoose.connect(mongoURI, mongooseOptions)
    .then(() => console.log(`Connected to MongoDB at: ${mongoURI.split('@')[1] || mongoURI}`))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

// Enhanced health check endpoint
app.get('/health', (req, res) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    res.status(200).json({
        status: 'up',
        database: dbStatus,
        faceModels: faceModelsLoaded ? 'loaded' : 'loading',
        timestamp: new Date()
    });
});

// Make faceapi available to routes
app.use((req, res, next) => {
    req.faceapi = faceapi;
    req.faceModelsLoaded = faceModelsLoaded;
    next();
});
// Routes
const routes = require('./routes/api'); // Import the routes from routes/api.js

app.use('/api', routes); // Mount the routes at the /api path


// Root route
app.get('/', (req, res) => {
    res.json({
        message: 'Smart Attendance System Backend is Running',
        version: '1.0.0',
        faceModels: faceModelsLoaded ? 'ready' : 'initializing',
        documentation: '/api-docs'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server only if models are loaded successfully
if (faceModelsLoaded) {
    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
        console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
        console.log(`Face models status: ${faceModelsLoaded ? 'Loaded' : 'Loading...'}`);
    });

     // Verify TensorFlow backend again after server starts
    //  console.log(`Using TensorFlow backend after startup: ${tf.getBackend()}`);
    

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
        console.error('Unhandled Rejection:', err);
        server.close(() => process.exit(1));
    });
} else {
    console.error("Face models failed to load. Server will not start.");
}
