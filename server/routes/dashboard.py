"""
Dashboard Metrics Route
GET /api/dashboard - Returns all dashboard KPIs and chart data
"""
from flask import Blueprint, request, jsonify
from database.db import get_db
from utils.jwt_helper import token_required

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('', methods=['GET'])
@token_required
def get_dashboard():
    """Return all dashboard metrics for the SOC overview."""
    db = get_db()

    # ─── KPI Cards ────────────────────────────────────────────────────────────
    total_logs = db.execute("SELECT COUNT(*) FROM logs").fetchone()[0]

    alert_counts = {}
    for sev in ['critical', 'high', 'medium', 'low']:
        alert_counts[sev] = db.execute(
            "SELECT COUNT(*) FROM alerts WHERE severity = ?", (sev,)
        ).fetchone()[0]

    total_alerts = db.execute("SELECT COUNT(*) FROM alerts").fetchone()[0]
    open_incidents = db.execute("SELECT COUNT(*) FROM incidents WHERE status = 'open'").fetchone()[0]
    resolved_incidents = db.execute("SELECT COUNT(*) FROM incidents WHERE status = 'resolved'").fetchone()[0]

    # ─── Attack Timeline (last 14 days) ───────────────────────────────────────
    timeline = db.execute("""
        SELECT DATE(created_at) as date,
               SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical,
               SUM(CASE WHEN severity = 'high' THEN 1 ELSE 0 END) as high,
               SUM(CASE WHEN severity = 'medium' THEN 1 ELSE 0 END) as medium,
               SUM(CASE WHEN severity = 'low' THEN 1 ELSE 0 END) as low,
               COUNT(*) as total
        FROM alerts
        WHERE created_at >= DATE('now', '-14 days')
        GROUP BY DATE(created_at)
        ORDER BY date
    """).fetchall()

    # ─── Threat Distribution ──────────────────────────────────────────────────
    threat_dist = db.execute("""
        SELECT threat_type, COUNT(*) as count
        FROM alerts
        GROUP BY threat_type
        ORDER BY count DESC
    """).fetchall()

    # ─── Top Attacker IPs ─────────────────────────────────────────────────────
    top_ips = db.execute("""
        SELECT source_ip, COUNT(*) as count, MAX(severity) as max_severity
        FROM alerts
        WHERE source_ip != ''
        GROUP BY source_ip
        ORDER BY count DESC
        LIMIT 10
    """).fetchall()

    # ─── Most Targeted Users ──────────────────────────────────────────────────
    targeted_users = db.execute("""
        SELECT username, COUNT(*) as count
        FROM alerts
        WHERE username != '' AND username != '-'
        GROUP BY username
        ORDER BY count DESC
        LIMIT 10
    """).fetchall()

    # ─── Severity Pie ─────────────────────────────────────────────────────────
    severity_pie = [
        {'name': 'Critical', 'value': alert_counts['critical'], 'color': '#ef4444'},
        {'name': 'High',     'value': alert_counts['high'],     'color': '#f97316'},
        {'name': 'Medium',   'value': alert_counts['medium'],   'color': '#eab308'},
        {'name': 'Low',      'value': alert_counts['low'],      'color': '#22c55e'},
    ]

    # ─── Recent Alerts ────────────────────────────────────────────────────────
    recent_alerts = db.execute("""
        SELECT id, alert_name, severity, risk_score, source_ip, status, created_at, mitre_technique
        FROM alerts
        ORDER BY created_at DESC
        LIMIT 10
    """).fetchall()

    # ─── Live Activity Feed ───────────────────────────────────────────────────
    activity_feed = db.execute("""
        SELECT 'alert' as type, alert_name as message, severity, created_at
        FROM alerts
        UNION ALL
        SELECT 'incident' as type, title as message, priority as severity, created_at
        FROM incidents
        ORDER BY created_at DESC
        LIMIT 20
    """).fetchall()

    # ─── MITRE ATT&CK heatmap data ────────────────────────────────────────────
    mitre_data = db.execute("""
        SELECT mitre_technique, mitre_tactic, COUNT(*) as count
        FROM alerts
        WHERE mitre_technique IS NOT NULL
        GROUP BY mitre_technique, mitre_tactic
        ORDER BY count DESC
        LIMIT 15
    """).fetchall()

    return jsonify({
        'kpis': {
            'total_logs': total_logs,
            'total_alerts': total_alerts,
            'critical_alerts': alert_counts['critical'],
            'high_alerts': alert_counts['high'],
            'medium_alerts': alert_counts['medium'],
            'low_alerts': alert_counts['low'],
            'open_incidents': open_incidents,
            'resolved_incidents': resolved_incidents,
        },
        'charts': {
            'attack_timeline': [dict(r) for r in timeline],
            'threat_distribution': [dict(r) for r in threat_dist],
            'top_attacker_ips': [dict(r) for r in top_ips],
            'targeted_users': [dict(r) for r in targeted_users],
            'severity_pie': severity_pie,
            'mitre_data': [dict(r) for r in mitre_data],
        },
        'recent_alerts': [dict(r) for r in recent_alerts],
        'activity_feed': [dict(r) for r in activity_feed],
    })
