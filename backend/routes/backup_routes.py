from flask import Blueprint, request, jsonify, send_file
import sqlite3
import os
import json
import shutil
import zipfile
from datetime import datetime

backup_bp = Blueprint('backup', __name__)

# Database path - adjust based on your structure
# Go up from routes folder to backend, then up to root, then into database
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'database', 'manufacturing.db')
BACKUP_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'backups')

# Create backup directory if it doesn't exist
os.makedirs(BACKUP_DIR, exist_ok=True)

@backup_bp.route('/api/backup/create', methods=['POST'])
def create_backup():
    """Create a full database backup"""
    try:
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_filename = f"backup_{timestamp}.db"
        backup_path = os.path.join(BACKUP_DIR, backup_filename)
        
        # Copy the database file
        shutil.copy2(DB_PATH, backup_path)
        
        # Create a zip file
        zip_filename = f"backup_{timestamp}.zip"
        zip_path = os.path.join(BACKUP_DIR, zip_filename)
        
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            zipf.write(backup_path, backup_filename)
        
        # Clean up the individual db file
        os.remove(backup_path)
        
        return jsonify({
            'success': True,
            'message': 'Backup created successfully',
            'filename': zip_filename,
            'timestamp': timestamp,
            'size': os.path.getsize(zip_path)
        })
        
    except Exception as e:
        print(f"Error creating backup: {e}")
        return jsonify({'error': str(e)}), 500

@backup_bp.route('/api/backup/list', methods=['GET'])
def list_backups():
    """List all available backups"""
    try:
        backups = []
        for filename in os.listdir(BACKUP_DIR):
            if filename.endswith('.zip'):
                filepath = os.path.join(BACKUP_DIR, filename)
                stat = os.stat(filepath)
                backups.append({
                    'filename': filename,
                    'size': stat.st_size,
                    'created': datetime.fromtimestamp(stat.st_ctime).isoformat(),
                    'size_mb': round(stat.st_size / (1024 * 1024), 2)
                })
        
        # Sort by created date (newest first)
        backups.sort(key=lambda x: x['created'], reverse=True)
        
        return jsonify({
            'success': True,
            'backups': backups
        })
        
    except Exception as e:
        print(f"Error listing backups: {e}")
        return jsonify({'error': str(e)}), 500

@backup_bp.route('/api/backup/download/<filename>', methods=['GET'])
def download_backup(filename):
    """Download a backup file"""
    try:
        filepath = os.path.join(BACKUP_DIR, filename)
        if not os.path.exists(filepath):
            return jsonify({'error': 'Backup file not found'}), 404
        
        return send_file(
            filepath,
            as_attachment=True,
            download_name=filename,
            mimetype='application/zip'
        )
        
    except Exception as e:
        print(f"Error downloading backup: {e}")
        return jsonify({'error': str(e)}), 500

@backup_bp.route('/api/backup/delete/<filename>', methods=['DELETE'])
def delete_backup(filename):
    """Delete a backup file"""
    try:
        filepath = os.path.join(BACKUP_DIR, filename)
        if not os.path.exists(filepath):
            return jsonify({'error': 'Backup file not found'}), 404
        
        os.remove(filepath)
        
        return jsonify({
            'success': True,
            'message': f'Backup {filename} deleted successfully'
        })
        
    except Exception as e:
        print(f"Error deleting backup: {e}")
        return jsonify({'error': str(e)}), 500

@backup_bp.route('/api/backup/restore', methods=['POST'])
def restore_backup():
    """Restore from a backup file"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not file.filename.endswith('.zip'):
            return jsonify({'error': 'Only .zip files are supported'}), 400
        
        # Save uploaded file temporarily
        temp_path = os.path.join(BACKUP_DIR, 'temp_restore.zip')
        file.save(temp_path)
        
        # Extract the zip file
        extract_dir = os.path.join(BACKUP_DIR, 'temp_extract')
        os.makedirs(extract_dir, exist_ok=True)
        
        with zipfile.ZipFile(temp_path, 'r') as zipf:
            zipf.extractall(extract_dir)
        
        # Find the .db file in extracted contents
        db_file = None
        for f in os.listdir(extract_dir):
            if f.endswith('.db'):
                db_file = os.path.join(extract_dir, f)
                break
        
        if not db_file:
            return jsonify({'error': 'No database file found in backup'}), 400
        
        # Create backup of current database before restore
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        pre_restore_backup = os.path.join(BACKUP_DIR, f"pre_restore_backup_{timestamp}.db")
        shutil.copy2(DB_PATH, pre_restore_backup)
        
        # Restore the database
        shutil.copy2(db_file, DB_PATH)
        
        # Clean up temp files
        os.remove(temp_path)
        shutil.rmtree(extract_dir)
        
        return jsonify({
            'success': True,
            'message': 'Database restored successfully',
            'pre_restore_backup': os.path.basename(pre_restore_backup)
        })
        
    except Exception as e:
        print(f"Error restoring backup: {e}")
        return jsonify({'error': str(e)}), 500