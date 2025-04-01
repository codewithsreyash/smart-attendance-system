require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// 1. Use CPU-only TensorFlow
const tf = require('@tensorflow/tfjs');
require('@tensorflow/tfjs-backend-cpu'); // Explicitly load CPU backend

// 2. Initialize face-api.js
const faceapi = require('face-api.js');
const { Canvas, Image, ImageData } = require('canvas');
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

const app = express();
let faceModelsLoaded = false;

async function initialize() {
  try {
    // 3. Set CPU backend explicitly
    await tf.setBackend('cpu');
    await tf.ready();
    console.log(`TensorFlow backend: ${tf.getBackend()}`);

    // 4. Load face models
    await loadFaceModels();
    
    // 5. Start server
    startServer();
  } catch (err) {
    console.error('Initialization failed:', err);
    process.exit(1);
  }
}

async function loadFaceModels() {
  const modelPath = path.join(__dirname, 'models');
  console.log(`Loading models from: ${modelPath}`);
  
  await Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath),
    faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath),
    faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath)
  ]);
  
  faceModelsLoaded = true;
  console.log('All models loaded successfully');
}

function startServer() {
  // Middleware
  app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));
  
  app.use(express.json());
  
  // Database
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/attendance', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }).then(() => console.log('MongoDB connected'));
  
  // Routes
  app.use('/api', require('./routes/api'));
  
  app.get('/', (req, res) => {
    res.json({ 
      status: 'running',
      backend: 'cpu',
      models: 'loaded'
    });
  });

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} (CPU mode)`);
  });
}

// Start everything
initialize();