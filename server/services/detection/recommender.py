"""
Security Recommendation Engine
Maps threat types to actionable recommendations
"""

RECOMMENDATIONS = {
    'brute_force': {
        'title': 'Brute Force Attack Recommendations',
        'actions': [
            'Block the source IP address immediately in your firewall',
            'Reset the password for the targeted account(s)',
            'Enable Multi-Factor Authentication (MFA) on all accounts',
            'Review and tighten SSH/RDP authentication policies',
            'Implement account lockout after 3–5 failed attempts',
            'Enable CAPTCHA or rate limiting on login endpoints',
            'Review authentication logs for the past 24 hours',
            'Check if the attacker successfully authenticated at any point',
        ],
        'severity': 'HIGH',
        'urgency': 'Immediate action required — lockout or block within minutes',
    },
    'port_scan': {
        'title': 'Port Scan Recommendations',
        'actions': [
            'Block the scanning source IP at the network perimeter',
            'Close all unused ports — follow principle of least privilege',
            'Review and update firewall rules to restrict unnecessary services',
            'Enable IDS/IPS alerts for sequential port access patterns',
            'Audit all exposed services and patch known vulnerabilities',
            'Consider network segmentation to limit lateral movement',
            'Monitor for subsequent exploitation attempts from the same IP',
        ],
        'severity': 'HIGH',
        'urgency': 'Block IP and review firewall rules within 1 hour',
    },
    'malicious_ip': {
        'title': 'Known Malicious IP Recommendations',
        'actions': [
            'Immediately block the malicious IP at the firewall level',
            'Isolate any internal systems that communicated with this IP',
            'Conduct forensic analysis of traffic logs with this IP',
            'Update threat intelligence feeds and blacklists',
            'Check for data exfiltration or command-and-control beaconing',
            'Scan affected systems for malware or backdoors',
            'Report the incident to your CSIRT/SOC team immediately',
        ],
        'severity': 'CRITICAL',
        'urgency': 'IMMEDIATE — Block and isolate within minutes',
    },
    'ddos': {
        'title': 'DDoS Attack Recommendations',
        'actions': [
            'Enable rate limiting on all public-facing endpoints immediately',
            'Block the attacking IP(s) at the network edge',
            'Activate DDoS protection / scrubbing service (CloudFlare, AWS Shield)',
            'Review and increase capacity or auto-scaling policies',
            'Contact upstream ISP for traffic blackholing if needed',
            'Enable geo-blocking for suspicious traffic origins',
            'Review firewall rules and enable SYN flood protection',
            'Document all affected services for incident report',
        ],
        'severity': 'CRITICAL',
        'urgency': 'IMMEDIATE — Activate DDoS mitigation now',
    },
    'suspicious_admin': {
        'title': 'Suspicious Admin Login Recommendations',
        'actions': [
            'Verify with the administrator if the login was intentional',
            'Require MFA for all administrative accounts',
            'Implement time-based access controls for admin accounts',
            'Review all actions performed during this session',
            'Enable privileged access management (PAM) alerts',
            'Check for signs of account compromise or credential theft',
            'Consider implementing Just-In-Time (JIT) admin access',
        ],
        'severity': 'MEDIUM',
        'urgency': 'Investigate within 2 hours and verify with user',
    },
    'impossible_travel': {
        'title': 'Impossible Travel Recommendations',
        'actions': [
            'Immediately suspend the affected user account pending investigation',
            'Contact the user through an out-of-band channel to verify activity',
            'Revoke all active sessions and tokens for the account',
            'Enable Conditional Access policies based on location',
            'Check for VPN or proxy usage that might explain the discrepancy',
            'Review account activity logs for unauthorized actions',
            'Implement geolocation-based authentication alerts',
        ],
        'severity': 'HIGH',
        'urgency': 'Suspend account and contact user within 30 minutes',
    },
    'privilege_escalation': {
        'title': 'Privilege Escalation Recommendations',
        'actions': [
            'Immediately isolate the source system from the network',
            'Block the source IP and terminate all active sessions',
            'Conduct full forensic analysis of the affected system',
            'Check sudo logs and system audit logs for successful escalation',
            'Patch any known vulnerabilities that could be exploited',
            'Implement application whitelisting and execution controls',
            'Review and restrict sudo/admin permissions (least privilege)',
            'Enable kernel security modules (SELinux, AppArmor)',
        ],
        'severity': 'CRITICAL',
        'urgency': 'IMMEDIATE — Isolate system and investigate now',
    },
}

def get_recommendations(threat_type):
    """Get formatted recommendations for a given threat type."""
    rec = RECOMMENDATIONS.get(threat_type, {
        'title': 'Security Incident Recommendations',
        'actions': [
            'Investigate the alert and collect relevant evidence',
            'Block any suspicious IPs or accounts involved',
            'Review system and application logs for context',
            'Escalate to senior security analyst if needed',
        ],
        'severity': 'MEDIUM',
        'urgency': 'Review within standard SLA timeframe',
    })
    return rec

def format_recommendation_text(threat_type):
    """Format recommendations as a single text string for storage."""
    rec = get_recommendations(threat_type)
    lines = [f"[{rec['severity']}] {rec['title']}", f"Urgency: {rec['urgency']}", ""]
    lines.extend([f"• {action}" for action in rec['actions']])
    return '\n'.join(lines)
