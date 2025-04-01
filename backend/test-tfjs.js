const tf = require('@tensorflow/tfjs-node');

console.log('TensorFlow backend:', tf.getBackend());
console.log('TensorFlow version:', tf.version.tfjs);
