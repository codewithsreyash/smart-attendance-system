import requests
import os
import sys

def register_face(image_path, name):
    url = "http://localhost:5001/register"
    
    # Print current working directory and file path
    print(f"Current working directory: {os.getcwd()}")
    print(f"Attempting to access file: {image_path}")
    print(f"Absolute file path: {os.path.abspath(image_path)}")
    
    # Check if file exists
    if not os.path.exists(image_path):
        print(f"Error: File {image_path} does not exist")
        return
    
    # Prepare the files and data
    try:
        with open(image_path, 'rb') as f:
            files = {
                'image': ('image.jpg', f, 'image/jpeg')
            }
            data = {
                'name': name
            }
            
            print("Sending request to server...")
            response = requests.post(url, files=files, data=data)
            print(f"Status Code: {response.status_code}")
            print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Error: {str(e)}")
        print(f"Error type: {type(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    # Register your face
    image_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 
                             "backend", "labeled_images", "sreyash", 
                             "WIN_20250330_23_09_07_Pro.jpg")
    name = "sreyash"
    register_face(image_path, name) 