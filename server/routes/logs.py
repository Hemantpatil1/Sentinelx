"""
Log Management Routes
POST   /api/logs/upload   - Upload log file
GET    /api/logs          - Get all logs (paginated, filtered)
DELETE /api/logs/<id>     - Delete a log entry
POST   /api/logs/scan     - Run threat detection on logs
"""
import os
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from database.db import get_db
from utils.jwt_helper import token_required
from utils.parser import parse_log_file
from services.detection.engine import DetectionEngine

logs_bp = Blueprint('logs', __name__)

ALLOWED_EXTENSIONS = {'csv', 'log', 'txt'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@logs_bp.route('/upload', methods=['POST'])
@token_required
def upload_log():
    """Upload and parse a log file."""
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']
    if not file.filename:
        return jsonify({'error': 'No file selected'}), 400

    if not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file type. Allowed: CSV, LOG, TXT'}), 400

    filename = secure_filename(file.filename)
    upload_folder = current_app.config['UPLOAD_FOLDER']
    os.makedirs(upload_folder, exist_ok=True)
    file_path = os.path.join(upload_folder, filename)
    file.save(file_path)

    # Parse the file
    file_content = open(file_path, 'rb').read()
    parsed_logs = parse_log_file(file_content, filename)

    if not parsed_logs:
        return jsonify({'error': 'No parseable log entries found in file', 'filename': filename}), 422

    # Store parsed logs in database
    db = get_db()
    inserted_ids = []
    for entry in parsed_logs:
        cursor = db.execute("""
            INSERT INTO logs (filename, source_ip, dest_ip, username, timestamp, port, protocol, status, action, raw_line)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            entry.get('filename', filename),
            entry.get('source_ip', ''),
            entry.get('dest_ip', ''),
            entry.get('username', ''),
            entry.get('timestamp', ''),
            entry.get('port'),
            entry.get('protocol', ''),
            entry.get('status', ''),
            entry.get('action', ''),
            entry.get('raw_line', '')[:2000]  # Limit raw line length
        ))
        inserted_ids.append(cursor.lastrowid)
    db.commit()

    return jsonify({
        'message': f'Successfully parsed {len(parsed_logs)} log entries',
        'filename': filename,
        'total_parsed': len(parsed_logs),
        'log_ids': inserted_ids
    })

@logs_bp.route('', methods=['GET'])
@token_required
def get_logs():
    """Get all logs with pagination and filtering."""
    db = get_db()

    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 50))
    search = request.args.get('search', '').strip()
    status_filter = request.args.get('status', '').strip()
    filename_filter = request.args.get('filename', '').strip()

    offset = (page - 1) * per_page
    conditions = []
    params = []

    if search:
        conditions.append("(source_ip LIKE ? OR dest_ip LIKE ? OR username LIKE ? OR action LIKE ?)")
        params.extend([f'%{search}%'] * 4)
    if status_filter:
        conditions.append("status = ?")
        params.append(status_filter.upper())
    if filename_filter:
        conditions.append("filename = ?")
        params.append(filename_filter)

    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    total = db.execute(f"SELECT COUNT(*) FROM logs {where_clause}", params).fetchone()[0]
    logs = db.execute(
        f"SELECT * FROM logs {where_clause} ORDER BY created_at DESC LIMIT ? OFFSET ?",
        params + [per_page, offset]
    ).fetchall()

    # Get distinct filenames
    filenames = db.execute("SELECT DISTINCT filename FROM logs ORDER BY filename").fetchall()

    return jsonify({
        'logs': [dict(l) for l in logs],
        'total': total,
        'page': page,
        'per_page': per_page,
        'total_pages': (total + per_page - 1) // per_page,
        'filenames': [row[0] for row in filenames]
    })

@logs_bp.route('/<int:log_id>', methods=['DELETE'])
@token_required
def delete_log(log_id):
    """Delete a specific log entry."""
    db = get_db()
    log = db.execute("SELECT id FROM logs WHERE id = ?", (log_id,)).fetchone()
    if not log:
        return jsonify({'error': 'Log not found'}), 404

    db.execute("DELETE FROM logs WHERE id = ?", (log_id,))
    db.commit()
    return jsonify({'message': f'Log {log_id} deleted successfully'})

@logs_bp.route('/scan', methods=['POST'])
@token_required
def scan_logs():
    """Run the threat detection engine on all or selected logs."""
    data = request.get_json() or {}
    log_ids = data.get('log_ids')  # Optional: scan specific log IDs

    engine = DetectionEngine()
    alerts = engine.run(
        db_path=current_app.config['DATABASE_PATH'],
        intel_folder=current_app.config['THREAT_INTEL_FOLDER'],
        log_ids=log_ids
    )

    return jsonify({
        'message': f'Scan complete. Generated {len(alerts)} alerts.',
        'alerts_generated': len(alerts),
        'alerts': alerts
    })

@logs_bp.route('/stats', methods=['GET'])
@token_required
def log_stats():
    """Get log statistics."""
    db = get_db()
    total = db.execute("SELECT COUNT(*) FROM logs").fetchone()[0]
    by_status = db.execute(
        "SELECT status, COUNT(*) as count FROM logs GROUP BY status"
    ).fetchall()
    by_file = db.execute(
        "SELECT filename, COUNT(*) as count FROM logs GROUP BY filename ORDER BY count DESC LIMIT 10"
    ).fetchall()
    return jsonify({
        'total': total,
        'by_status': [dict(r) for r in by_status],
        'by_file': [dict(r) for r in by_file]
    })
