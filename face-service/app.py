from flask import Flask, request, jsonify
from flask_cors import CORS
from face_utils.encoder import encode_face
import face_recognition
import numpy as np
import os
import json
from datetime import datetime

app = Flask(__name__)
# Configure CORS to allow requests from frontend
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:3000"],
        "methods": ["POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

# Directory to store known face encodings
KNOWN_FACES_DIR = os.path.join(os.path.dirname(__file__), 'known_faces')
os.makedirs(KNOWN_FACES_DIR, exist_ok=True)

# Store face data with metadata
FACE_DATA_FILE = os.path.join(KNOWN_FACES_DIR, 'face_data.json')
KNOWN_FACES = {}
MAX_IMAGES_PER_PERSON = 10

def save_face_data(name, encoding, timestamp=None):
    """Save face encoding and metadata."""
    if timestamp is None:
        timestamp = datetime.now().isoformat()

    # Load existing data
    face_data = {}
    if os.path.exists(FACE_DATA_FILE):
        with open(FACE_DATA_FILE, 'r') as f:
            face_data = json.load(f)

    # Initialize user data if not exists
    if name not in face_data:
        face_data[name] = []

    # Check if we've reached the maximum number of images
    if len(face_data[name]) >= MAX_IMAGES_PER_PERSON:
        return None  # Return None if max images reached

    # Add new encoding with metadata
    encoding_data = {
        'timestamp': timestamp,
        'encoding_file': f"{name}_{len(face_data[name])}.npy"
    }
    face_data[name].append(encoding_data)

    # Save metadata
    with open(FACE_DATA_FILE, 'w') as f:
        json.dump(face_data, f, indent=2)

    # Save encoding
    encoding_path = os.path.join(KNOWN_FACES_DIR, encoding_data['encoding_file'])
    np.save(encoding_path, encoding)

    return encoding_data

def load_known_faces():
    """Load known face encodings from files with metadata."""
    known_faces = {}
    if not os.path.exists(FACE_DATA_FILE):
        return known_faces

    with open(FACE_DATA_FILE, 'r') as f:
        face_data = json.load(f)

    for name, encodings in face_data.items():
        known_faces[name] = []
        for encoding_data in encodings:
            encoding_path = os.path.join(KNOWN_FACES_DIR, encoding_data['encoding_file'])
            if os.path.exists(encoding_path):
                encoding = np.load(encoding_path)
                known_faces[name].append(encoding)

    return known_faces

# Load known faces on startup
KNOWN_FACES = load_known_faces()

@app.route('/encode', methods=['POST'])
def encode_face_route():
    """Encodes a face from an uploaded image and returns the encoding."""
    if 'image' not in request.files:
        return jsonify({"error": "No image provided"}), 400

    try:
        file = request.files['image']
        # Load the image using face_recognition
        img = face_recognition.load_image_file(file)
        # Find face locations in the image
        face_locations = face_recognition.face_locations(img)
        
        if not face_locations:
            return jsonify({"error": "No face detected in the image"}), 400
            
        # Get face encodings
        face_encodings = face_recognition.face_encodings(img, face_locations)
        
        if not face_encodings:
            return jsonify({"error": "Could not encode face features"}), 400
            
        encoding = face_encodings[0]
        
        # Compare with known faces
        best_match = None
        best_distance = 0.6  # Threshold for face recognition
        
        for name, stored_encodings in KNOWN_FACES.items():
            for stored_encoding in stored_encodings:
                # Compare faces
                distance = face_recognition.face_distance([stored_encoding], encoding)[0]
                if distance < best_distance:
                    best_distance = distance
                    best_match = name
        
        if best_match:
            confidence = ((1 - best_distance) * 100)
            return jsonify({
                "success": True,
                "message": f"Welcome back, {best_match}!",
                "name": best_match,
                "confidence": f"{confidence:.1f}%"
            })
        
        # If no match found but we have a valid encoding
        return jsonify({
            "success": False,
            "message": "Face not recognized. Please register first.",
            "encoding": encoding.tolist()
        })

    except Exception as e:
        print(f"Error processing image: {str(e)}")
        return jsonify({"error": f"Error processing image: {str(e)}"}), 500

@app.route('/register', methods=['POST'])
def register_face():
    """Register a new face."""
    if 'image' not in request.files or 'name' not in request.form:
        return jsonify({"error": "Image and name are required"}), 400

    try:
        file = request.files['image']
        name = request.form['name']
        
        # Load and encode face
        img = face_recognition.load_image_file(file)
        face_locations = face_recognition.face_locations(img)
        
        if not face_locations:
            return jsonify({"error": "No face detected in the image"}), 400
            
        face_encodings = face_recognition.face_encodings(img, face_locations)
        
        if not face_encodings:
            return jsonify({"error": "Could not encode face features"}), 400
            
        encoding = face_encodings[0]
        
        # Check if this face already exists for any user
        for existing_name, stored_encodings in KNOWN_FACES.items():
            for stored_encoding in stored_encodings:
                distance = face_recognition.face_distance([stored_encoding], encoding)[0]
                if distance < 0.5:  # Stricter threshold for registration
                    return jsonify({
                        "error": f"This face is already registered under the name: {existing_name}"
                    }), 400
        
        # Save the new face encoding
        encoding_data = save_face_data(name, encoding)
        
        if encoding_data is None:
            return jsonify({
                "error": f"Maximum number of images ({MAX_IMAGES_PER_PERSON}) reached for {name}. Please delete some images first."
            }), 400
        
        # Update in-memory face data
        if name not in KNOWN_FACES:
            KNOWN_FACES[name] = []
        KNOWN_FACES[name].append(encoding)
        
        # Get current number of images for this person
        num_images = len(KNOWN_FACES[name])
        
        return jsonify({
            "success": True,
            "message": f"Successfully registered {name} (Image {num_images}/{MAX_IMAGES_PER_PERSON})"
        })

    except Exception as e:
        print(f"Error registering face: {str(e)}")
        return jsonify({"error": f"Error registering face: {str(e)}"}), 500

@app.route('/delete', methods=['POST'])
def delete_face():
    """Delete all face data for a given name."""
    if 'name' not in request.form:
        return jsonify({"error": "Name is required"}), 400

    try:
        name = request.form['name']
        
        # Load face data
        if os.path.exists(FACE_DATA_FILE):
            with open(FACE_DATA_FILE, 'r') as f:
                face_data = json.load(f)
            
            if name in face_data:
                # Delete encoding files
                for encoding_data in face_data[name]:
                    encoding_path = os.path.join(KNOWN_FACES_DIR, encoding_data['encoding_file'])
                    if os.path.exists(encoding_path):
                        os.remove(encoding_path)
                
                # Remove from face data
                del face_data[name]
                
                # Save updated face data
                with open(FACE_DATA_FILE, 'w') as f:
                    json.dump(face_data, f, indent=2)
                
                # Update in-memory data
                if name in KNOWN_FACES:
                    del KNOWN_FACES[name]
                
                return jsonify({
                    "success": True,
                    "message": f"Successfully deleted all face data for {name}"
                })
            
            return jsonify({"error": f"No face data found for {name}"}), 404
        
        return jsonify({"error": "No face data exists"}), 404

    except Exception as e:
        print(f"Error deleting face: {str(e)}")
        return jsonify({"error": f"Error deleting face: {str(e)}"}), 500

@app.route('/status', methods=['GET'])
def get_status():
    """Get the current status of registered faces."""
    try:
        if not os.path.exists(FACE_DATA_FILE):
            return jsonify({
                "success": True,
                "data": {
                    "total_users": 0,
                    "total_images": 0,
                    "users": []
                }
            })

        with open(FACE_DATA_FILE, 'r') as f:
            face_data = json.load(f)

        users = []
        total_images = 0

        for name, encodings in face_data.items():
            users.append({
                "name": name,
                "num_images": len(encodings),
                "last_updated": max(e['timestamp'] for e in encodings)
            })
            total_images += len(encodings)

        return jsonify({
            "success": True,
            "data": {
                "total_users": len(users),
                "total_images": total_images,
                "users": users
            }
        })

    except Exception as e:
        print(f"Error getting status: {str(e)}")
        return jsonify({"error": f"Error getting status: {str(e)}"}), 500

if __name__ == '__main__':
    # Ensure the application is accessible from other devices
    app.run(host='0.0.0.0', port=5001, debug=True)
