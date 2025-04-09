import requests
import os
import sys
from pathlib import Path

def register_face(image_path, name):
    """Register a face with the face recognition service."""
    url = "http://localhost:5001/register"
    
    # Check if file exists
    if not os.path.exists(image_path):
        print(f"Error: File {image_path} does not exist")
        return False
    
    try:
        with open(image_path, 'rb') as f:
            files = {
                'image': ('image.jpg', f, 'image/jpeg')
            }
            data = {
                'name': name
            }
            
            print(f"Registering {name}...")
            response = requests.post(url, files=files, data=data)
            
            if response.status_code == 200:
                result = response.json()
                if result.get('success'):
                    print(f"✓ Successfully registered {name}")
                    return True
                else:
                    print(f"✗ Failed to register {name}: {result.get('error', 'Unknown error')}")
            else:
                print(f"✗ Failed to register {name}: Server returned status code {response.status_code}")
                
    except Exception as e:
        print(f"✗ Error registering {name}: {str(e)}")
    
    return False

def register_faces_from_directory(directory_path):
    """Register all faces from a directory structure where each subdirectory is a person's name."""
    directory = Path(directory_path)
    if not directory.exists():
        print(f"Error: Directory {directory_path} does not exist")
        return
    
    successful = 0
    failed = 0
    
    # Iterate through all subdirectories
    for person_dir in directory.iterdir():
        if person_dir.is_dir():
            person_name = person_dir.name
            # Process each image file in the person's directory
            for image_file in person_dir.glob('*.jpg'):
                print(f"\nProcessing {image_file}...")
                if register_face(str(image_file), person_name):
                    successful += 1
                else:
                    failed += 1
    
    print(f"\nRegistration complete!")
    print(f"Successfully registered: {successful}")
    print(f"Failed registrations: {failed}")

def register_single_face():
    """Interactive function to register a single face."""
    print("\nRegister a Single Face")
    print("---------------------")
    
    # Get image path
    while True:
        image_path = input("Enter the path to the image file: ").strip()
        if os.path.exists(image_path):
            break
        print("Error: File does not exist. Please try again.")
    
    # Get person's name
    name = input("Enter the person's name: ").strip()
    
    # Register the face
    if register_face(image_path, name):
        print("\nRegistration successful!")
    else:
        print("\nRegistration failed. Please try again.")

def main():
    print("Face Registration System")
    print("======================")
    print("\nOptions:")
    print("1. Register a single face")
    print("2. Register all faces from a directory")
    print("3. Exit")
    
    while True:
        choice = input("\nEnter your choice (1-3): ").strip()
        
        if choice == "1":
            register_single_face()
        elif choice == "2":
            directory = input("\nEnter the directory path containing face images: ").strip()
            register_faces_from_directory(directory)
        elif choice == "3":
            print("\nGoodbye!")
            break
        else:
            print("Invalid choice. Please try again.")
        
        print("\nOptions:")
        print("1. Register a single face")
        print("2. Register all faces from a directory")
        print("3. Exit")

if __name__ == "__main__":
    main() 