import os
import uuid
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename

upload_bp = Blueprint('upload_bp', __name__)

# Configure upload folder relative to the backend directory
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads', 'cheques')

# Ensure the upload folder exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'pdf'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@upload_bp.route('/api/upload-cheque', methods=['POST'])
def upload_cheque():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
        
    if file and allowed_file(file.filename):
        # Generate a unique filename using UUID to avoid collisions
        ext = file.filename.rsplit('.', 1)[1].lower()
        filename = f"cheque_{uuid.uuid4().hex}.{ext}"
        
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        
        # Return the relative path which can be stored in the DB
        # This will be served by a static route in app.py
        return jsonify({
            'message': 'File uploaded successfully',
            'filename': filename,
            'path': f'/uploads/cheques/{filename}'
        }), 200
        
    return jsonify({'error': 'File type not allowed'}), 400
