"""
Alert Management Routes
GET  /api/alerts            - Get alerts (filtered, paginated)
PUT  /api/alerts/<id>/status - Update alert status
GET  /api/alerts/<id>       - Get specific alert
"""
from flask import Blueprint, request, jsonify
from database.db import get_db
from utils.jwt_helper import token_required

alerts_bp = Blueprint('alerts', __name__)

@alerts_bp.route('', methods=['GET'])
@token_required
def get_alerts():
    """Get all alerts with filtering and pagination."""
    db = get_db()

    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    severity = request.args.get('severity', '').strip()
    status = request.args.get('status', '').strip()
    search = request.args.get('search', '').strip()
    threat_type = request.args.get('threat_type', '').strip()

    offset = (page - 1) * per_page
    conditions = []
    params = []

    if severity:
        conditions.append("severity = ?")
        params.append(severity.lower())
    if status:
        conditions.append("status = ?")
        params.append(status.lower())
    if threat_type:
        conditions.append("threat_type = ?")
        params.append(threat_type)
    if search:
        conditions.append("(alert_name LIKE ? OR source_ip LIKE ? OR username LIKE ? OR mitre_technique LIKE ?)")
        params.extend([f'%{search}%'] * 4)

    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    total = db.execute(f"SELECT COUNT(*) FROM alerts {where_clause}", params).fetchone()[0]
    alerts = db.execute(
        f"SELECT * FROM alerts {where_clause} ORDER BY created_at DESC LIMIT ? OFFSET ?",
        params + [per_page, offset]
    ).fetchall()

    # Severity counts for summary
    severity_counts = {}
    for sev in ['critical', 'high', 'medium', 'low']:
        count = db.execute(
            "SELECT COUNT(*) FROM alerts WHERE severity = ?", (sev,)
        ).fetchone()[0]
        severity_counts[sev] = count

    return jsonify({
        'alerts': [dict(a) for a in alerts],
        'total': total,
        'page': page,
        'per_page': per_page,
        'total_pages': (total + per_page - 1) // per_page,
        'severity_counts': severity_counts
    })

@alerts_bp.route('/<int:alert_id>', methods=['GET'])
@token_required
def get_alert(alert_id):
    """Get specific alert details."""
    db = get_db()
    alert = db.execute("SELECT * FROM alerts WHERE id = ?", (alert_id,)).fetchone()
    if not alert:
        return jsonify({'error': 'Alert not found'}), 404

    alert_dict = dict(alert)

    # Include linked incident if any
    incident = db.execute(
        "SELECT * FROM incidents WHERE alert_id = ? ORDER BY created_at DESC LIMIT 1",
        (alert_id,)
    ).fetchone()
    alert_dict['incident'] = dict(incident) if incident else None

    return jsonify(alert_dict)

@alerts_bp.route('/<int:alert_id>/status', methods=['PUT'])
@token_required
def update_alert_status(alert_id):
    """Update the status of an alert."""
    data = request.get_json()
    new_status = data.get('status', '').lower()

    valid_statuses = ['open', 'investigating', 'resolved', 'false_positive']
    if new_status not in valid_statuses:
        return jsonify({'error': f'Invalid status. Choose from: {", ".join(valid_statuses)}'}), 400

    db = get_db()
    alert = db.execute("SELECT id FROM alerts WHERE id = ?", (alert_id,)).fetchone()
    if not alert:
        return jsonify({'error': 'Alert not found'}), 404

    db.execute("UPDATE alerts SET status = ? WHERE id = ?", (new_status, alert_id))
    db.commit()

    return jsonify({'message': f'Alert {alert_id} status updated to {new_status}', 'status': new_status})

@alerts_bp.route('/summary', methods=['GET'])
@token_required
def get_alerts_summary():
    """Get alert summary statistics."""
    db = get_db()

    # By severity
    by_severity = db.execute(
        "SELECT severity, COUNT(*) as count FROM alerts GROUP BY severity"
    ).fetchall()

    # By status
    by_status = db.execute(
        "SELECT status, COUNT(*) as count FROM alerts GROUP BY status"
    ).fetchall()

    # By threat type
    by_type = db.execute(
        "SELECT threat_type, COUNT(*) as count FROM alerts GROUP BY threat_type ORDER BY count DESC"
    ).fetchall()

    # Top attacker IPs
    top_ips = db.execute(
        "SELECT source_ip, COUNT(*) as count FROM alerts WHERE source_ip != '' GROUP BY source_ip ORDER BY count DESC LIMIT 10"
    ).fetchall()

    # Recent trend (last 7 days)
    trend = db.execute("""
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM alerts
        WHERE created_at >= DATE('now', '-7 days')
        GROUP BY DATE(created_at)
        ORDER BY date
    """).fetchall()

    return jsonify({
        'by_severity': [dict(r) for r in by_severity],
        'by_status': [dict(r) for r in by_status],
        'by_type': [dict(r) for r in by_type],
        'top_attacker_ips': [dict(r) for r in top_ips],
        'trend': [dict(r) for r in trend],
    })
