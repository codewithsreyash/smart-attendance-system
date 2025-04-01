import face_recognition

def encode_face(image_file):
    """
    Encodes a face from an image file.
    Returns a list of face encodings if a face is detected, else returns None.
    """
    # Load the image
    image = face_recognition.load_image_file(image_file)
    
    # Get face encodings
    encodings = face_recognition.face_encodings(image)
    
    # Return the first encoding found (assuming one face per image)
    if encodings:
        return encodings[0].tolist()  # Convert NumPy array to a list for JSON storage
    return None

# Test function (Run this script separately to test encoding)
if __name__ == "__main__":
    encoding = encode_face("backend\labeled_images\sreyash\WIN_20250330_23_09_07_Pro.jpg")  # Replace with actual image path
    if encoding:
        print("Face Encoding:", encoding)
    else:
        print("No face detected.")
