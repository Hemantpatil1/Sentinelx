"""
SentinelX Threat Detection Engine
Orchestrates all detection rules against parsed log data
"""
import os
import sqlite3
from flask import current_app
from .rules import (
    detect_brute_force,
    detect_port_scan,
    detect_malicious_ip,
    detect_ddos,
    detect_suspicious_admin_login,
    detect_impossible_travel,
    detect_privilege_escalation,
)
from .recommender import format_recommendation_text

class ThreatIntelligence:
    """Loads and manages threat intelligence lists."""

    def __init__(self, intel_folder):
        self.intel_folder = intel_folder
        self.blacklisted_ips = set()
        self.trusted_ips = set()
        self.load()

    def load(self):
        """Load blacklist and trusted IPs from files."""
        blacklist_path = os.path.join(self.intel_folder, 'blacklist.txt')
        trusted_path = os.path.join(self.intel_folder, 'trusted_ips.txt')

        self.blacklisted_ips = self._load_ip_file(blacklist_path)
        self.trusted_ips = self._load_ip_file(trusted_path)
        print(f"[ThreatIntel] Loaded {len(self.blacklisted_ips)} blacklisted IPs, {len(self.trusted_ips)} trusted IPs")

    def _load_ip_file(self, path):
        """Load IPs from a file, ignoring comments and empty lines."""
        ips = set()
        if not os.path.exists(path):
            return ips
        with open(path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    ips.add(line)
        return ips

    def is_blacklisted(self, ip):
        return ip in self.blacklisted_ips

    def is_trusted(self, ip):
        return ip in self.trusted_ips


class DetectionEngine:
    """
    Main detection engine. Runs all rules against log entries
    and persists generated alerts to the database.
    """

    def run(self, db_path, intel_folder, log_ids=None):
        """
        Run all detection rules against logs.

        Args:
            db_path: Path to SQLite database
            intel_folder: Path to threat intelligence files
            log_ids: Optional list of specific log IDs to scan

        Returns:
            List of generated alert dicts
        """
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")

        try:
            # Fetch logs to scan
            if log_ids:
                placeholders = ','.join('?' * len(log_ids))
                rows = conn.execute(
                    f"SELECT * FROM logs WHERE id IN ({placeholders})", log_ids
                ).fetchall()
            else:
                rows = conn.execute("SELECT * FROM logs").fetchall()

            logs = [dict(row) for row in rows]

            if not logs:
                return []

            # Load threat intelligence
            intel = ThreatIntelligence(intel_folder)

            # Run all detection rules
            all_alerts = []
            all_alerts.extend(detect_brute_force(logs))
            all_alerts.extend(detect_port_scan(logs))
            all_alerts.extend(detect_malicious_ip(logs, intel.blacklisted_ips))
            all_alerts.extend(detect_ddos(logs))
            all_alerts.extend(detect_suspicious_admin_login(logs))
            all_alerts.extend(detect_impossible_travel(logs))
            all_alerts.extend(detect_privilege_escalation(logs))

            # Enrich recommendations and persist alerts
            saved_alerts = []
            for alert in all_alerts:
                # Enhance recommendation with full text
                alert['recommendation'] = format_recommendation_text(alert['threat_type'])

                # Save to database
                cursor = conn.execute("""
                    INSERT INTO alerts (
                        alert_name, threat_type, source_ip, dest_ip, username,
                        severity, risk_score, mitre_technique, mitre_tactic,
                        recommendation, status, log_id, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    alert['alert_name'],
                    alert['threat_type'],
                    alert['source_ip'],
                    alert['dest_ip'],
                    alert['username'],
                    alert['severity'],
                    alert['risk_score'],
                    alert['mitre_technique'],
                    alert['mitre_tactic'],
                    alert['recommendation'],
                    alert['status'],
                    alert.get('log_id'),
                    alert['created_at']
                ))
                alert['id'] = cursor.lastrowid
                saved_alerts.append(alert)

            conn.commit()
            print(f"[DetectionEngine] Generated {len(saved_alerts)} alerts from {len(logs)} log entries")
            return saved_alerts

        finally:
            conn.close()

    def get_stats(self, db_path):
        """Get threat detection statistics."""
        conn = sqlite3.connect(db_path)
        try:
            stats = {}
            for severity in ['critical', 'high', 'medium', 'low']:
                row = conn.execute(
                    "SELECT COUNT(*) as count FROM alerts WHERE severity = ?", (severity,)
                ).fetchone()
                stats[severity] = row[0] if row else 0
            return stats
        finally:
            conn.close()
