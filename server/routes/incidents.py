"""
Incident Response Routes
GET    /api/incidents         - Get all incidents
POST   /api/incidents         - Create incident from alert
GET    /api/incidents/<id>    - Get incident details + history
PUT    /api/incidents/<id>    - Update incident (assign, notes, status)
"""
from flask import Blueprint, request, jsonify
from database.db import get_db
from utils.jwt_helper import token_required

incidents_bp = Blueprint('incidents', __name__)

@incidents_bp.route('', methods=['GET'])
@token_required
def get_incidents():
    """Get all incidents with filtering."""
    db = get_db()

    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    status = request.args.get('status', '').strip()
    priority = request.args.get('priority', '').strip()

    offset = (page - 1) * per_page
    conditions = []
    params = []

    if status:
        conditions.append("i.status = ?")
        params.append(status.lower())
    if priority:
        conditions.append("i.priority = ?")
        params.append(priority.lower())

    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    total = db.execute(f"SELECT COUNT(*) FROM incidents i {where_clause}", params).fetchone()[0]
    incidents = db.execute(f"""
        SELECT i.*, a.alert_name, a.severity, a.risk_score, a.source_ip, a.threat_type, a.mitre_technique
        FROM incidents i
        LEFT JOIN alerts a ON i.alert_id = a.id
        {where_clause}
        ORDER BY i.created_at DESC
        LIMIT ? OFFSET ?
    """, params + [per_page, offset]).fetchall()

    return jsonify({
        'incidents': [dict(i) for i in incidents],
        'total': total,
        'page': page,
        'per_page': per_page,
        'total_pages': (total + per_page - 1) // per_page,
    })

@incidents_bp.route('', methods=['POST'])
@token_required
def create_incident():
    """Create a new incident from an alert."""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body required'}), 400

    alert_id = data.get('alert_id')
    title = data.get('title', '').strip()

    if not alert_id or not title:
        return jsonify({'error': 'alert_id and title are required'}), 400

    db = get_db()

    # Check alert exists
    alert = db.execute("SELECT * FROM alerts WHERE id = ?", (alert_id,)).fetchone()
    if not alert:
        return jsonify({'error': 'Alert not found'}), 404

    # Derive priority from alert severity
    severity_to_priority = {
        'critical': 'critical',
        'high': 'high',
        'medium': 'medium',
        'low': 'low'
    }
    priority = severity_to_priority.get(alert['severity'], 'medium')

    cursor = db.execute("""
        INSERT INTO incidents (alert_id, title, assigned_to, status, priority, notes)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        alert_id,
        title,
        data.get('assigned_to', ''),
        'open',
        data.get('priority', priority),
        data.get('notes', '')
    ))
    incident_id = cursor.lastrowid

    # Update alert status to investigating
    db.execute("UPDATE alerts SET status = 'investigating' WHERE id = ?", (alert_id,))

    # Log the creation in history
    db.execute("""
        INSERT INTO incident_history (incident_id, action, performed_by, details)
        VALUES (?, ?, ?, ?)
    """, (incident_id, 'created', request.current_user['username'], f'Incident created from alert #{alert_id}'))

    db.commit()

    return jsonify({'message': 'Incident created', 'incident_id': incident_id}), 201

@incidents_bp.route('/<int:incident_id>', methods=['GET'])
@token_required
def get_incident(incident_id):
    """Get incident details with audit history."""
    db = get_db()

    incident = db.execute("""
        SELECT i.*, a.alert_name, a.severity, a.risk_score, a.source_ip, a.dest_ip,
               a.username, a.threat_type, a.mitre_technique, a.mitre_tactic,
               a.recommendation, a.created_at as alert_created_at
        FROM incidents i
        LEFT JOIN alerts a ON i.alert_id = a.id
        WHERE i.id = ?
    """, (incident_id,)).fetchone()

    if not incident:
        return jsonify({'error': 'Incident not found'}), 404

    history = db.execute(
        "SELECT * FROM incident_history WHERE incident_id = ? ORDER BY created_at ASC",
        (incident_id,)
    ).fetchall()

    result = dict(incident)
    result['history'] = [dict(h) for h in history]
    return jsonify(result)

@incidents_bp.route('/<int:incident_id>', methods=['PUT'])
@token_required
def update_incident(incident_id):
    """Update an incident — assign, add notes, change status."""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body required'}), 400

    db = get_db()
    incident = db.execute("SELECT * FROM incidents WHERE id = ?", (incident_id,)).fetchone()
    if not incident:
        return jsonify({'error': 'Incident not found'}), 404

    # Build update fields
    updates = []
    params = []
    history_actions = []

    if 'status' in data:
        valid_statuses = ['open', 'investigating', 'resolved', 'closed']
        if data['status'] not in valid_statuses:
            return jsonify({'error': f'Invalid status: {data["status"]}'}), 400
        updates.append("status = ?")
        params.append(data['status'])
        history_actions.append(f"Status changed to '{data['status']}'")

        # If resolved, also resolve the linked alert
        if data['status'] in ('resolved', 'closed'):
            db.execute(
                "UPDATE alerts SET status = 'resolved' WHERE id = ?",
                (incident['alert_id'],)
            )

    if 'assigned_to' in data:
        updates.append("assigned_to = ?")
        params.append(data['assigned_to'])
        history_actions.append(f"Assigned to '{data['assigned_to']}'")

    if 'notes' in data:
        updates.append("notes = ?")
        params.append(data['notes'])
        history_actions.append("Investigation notes updated")

    if 'priority' in data:
        updates.append("priority = ?")
        params.append(data['priority'])
        history_actions.append(f"Priority changed to '{data['priority']}'")

    if not updates:
        return jsonify({'error': 'No valid fields to update'}), 400

    updates.append("updated_at = CURRENT_TIMESTAMP")
    params.append(incident_id)

    db.execute(f"UPDATE incidents SET {', '.join(updates)} WHERE id = ?", params)

    # Log each change to audit trail
    for action in history_actions:
        db.execute("""
            INSERT INTO incident_history (incident_id, action, performed_by, details)
            VALUES (?, ?, ?, ?)
        """, (incident_id, 'updated', request.current_user['username'], action))

    db.commit()

    return jsonify({'message': f'Incident {incident_id} updated successfully'})
