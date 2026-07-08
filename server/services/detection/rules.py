"""
SentinelX Threat Detection Rules
Implements all 7 detection rules with MITRE ATT&CK mapping
"""
from datetime import datetime, timedelta
from collections import defaultdict

# ─── MITRE ATT&CK Mappings ────────────────────────────────────────────────────
MITRE_MAP = {
    'brute_force':          {'technique': 'T1110', 'tactic': 'Credential Access'},
    'port_scan':            {'technique': 'T1046', 'tactic': 'Discovery'},
    'malicious_ip':         {'technique': 'T1071', 'tactic': 'Command and Control'},
    'ddos':                 {'technique': 'T1498', 'tactic': 'Impact'},
    'suspicious_admin':     {'technique': 'T1078', 'tactic': 'Defense Evasion'},
    'impossible_travel':    {'technique': 'T1078.004', 'tactic': 'Credential Access'},
    'privilege_escalation': {'technique': 'T1068', 'tactic': 'Privilege Escalation'},
}

def _parse_ts(ts_str):
    """Attempt to parse a timestamp string into a datetime object."""
    if not ts_str:
        return None
    formats = [
        '%Y-%m-%dT%H:%M:%S',
        '%Y-%m-%d %H:%M:%S',
        '%d/%b/%Y:%H:%M:%S',
        '%b %d %H:%M:%S',
        '%m/%d/%Y %H:%M:%S',
        '%Y-%m-%dT%H:%M:%SZ',
    ]
    for fmt in formats:
        try:
            return datetime.strptime(ts_str.strip()[:19], fmt[:len(ts_str.strip())])
        except ValueError:
            continue
    return None

def _group_by_ip(logs):
    """Group log entries by source IP."""
    groups = defaultdict(list)
    for log in logs:
        if log.get('source_ip'):
            groups[log['source_ip']].append(log)
    return groups

def _group_by_user(logs):
    """Group log entries by username."""
    groups = defaultdict(list)
    for log in logs:
        if log.get('username') and log['username'] not in ('', '-', 'unknown'):
            groups[log['username']].append(log)
    return groups


# ─── Rule 1: Brute Force Detection ───────────────────────────────────────────
def detect_brute_force(logs, window_seconds=60, threshold=5):
    """
    Detect brute force: >5 failed login attempts from same IP within 60 seconds.
    MITRE: T1110 - Brute Force
    """
    alerts = []
    by_ip = _group_by_ip(logs)

    for ip, entries in by_ip.items():
        # Filter failed logins
        failed = [e for e in entries if
                  e.get('status', '').upper() in ('FAILED', 'FAILURE', 'UNAUTHORIZED') and
                  e.get('action', '').upper() in ('LOGIN', 'AUTHENTICATION', 'AUTH', 'SSH_AUTH', 'FAILED_LOGIN')]

        if len(failed) < threshold:
            continue

        # Check time windows
        timestamps = sorted([_parse_ts(e.get('timestamp', '')) for e in failed if _parse_ts(e.get('timestamp', ''))])
        if not timestamps:
            # No parseable timestamps — still flag if count high
            if len(failed) >= threshold:
                representative = failed[0]
                alerts.append(_build_alert(
                    'Brute Force Attack Detected',
                    'brute_force',
                    ip,
                    representative.get('dest_ip', ''),
                    representative.get('username', ''),
                    'high',
                    90,
                    f"Detected {len(failed)} failed login attempts from IP {ip} (no timestamp data)",
                    representative.get('id')
                ))
            continue

        for i in range(len(timestamps)):
            window_end = timestamps[i] + timedelta(seconds=window_seconds)
            count = sum(1 for t in timestamps if timestamps[i] <= t <= window_end)
            if count >= threshold:
                representative = failed[0]
                alerts.append(_build_alert(
                    'Brute Force Attack Detected',
                    'brute_force',
                    ip,
                    representative.get('dest_ip', ''),
                    representative.get('username', ''),
                    'high',
                    90,
                    f"Detected {count} failed login attempts from IP {ip} within {window_seconds}s",
                    representative.get('id')
                ))
                break

    return alerts


# ─── Rule 2: Port Scan Detection ─────────────────────────────────────────────
def detect_port_scan(logs, window_seconds=30, port_threshold=10):
    """
    Detect port scan: single IP scanning >10 distinct ports within 30 seconds.
    MITRE: T1046 - Network Service Discovery
    """
    alerts = []
    by_ip = _group_by_ip(logs)

    for ip, entries in by_ip.items():
        ports_with_ts = [(e.get('port'), _parse_ts(e.get('timestamp', ''))) for e in entries if e.get('port')]
        ports_with_ts = [(p, t) for p, t in ports_with_ts if p and t]

        if len(ports_with_ts) < port_threshold:
            # No timestamps — check distinct port count
            distinct_ports = set(e.get('port') for e in entries if e.get('port'))
            if len(distinct_ports) >= port_threshold:
                representative = entries[0]
                alerts.append(_build_alert(
                    'Port Scan Detected',
                    'port_scan',
                    ip,
                    representative.get('dest_ip', ''),
                    representative.get('username', ''),
                    'high',
                    85,
                    f"IP {ip} scanned {len(distinct_ports)} distinct ports: {sorted(list(distinct_ports))[:10]}...",
                    representative.get('id')
                ))
            continue

        ports_with_ts.sort(key=lambda x: x[1])

        for i, (_, ts) in enumerate(ports_with_ts):
            window_end = ts + timedelta(seconds=window_seconds)
            window_entries = [(p, t) for p, t in ports_with_ts if ts <= t <= window_end]
            distinct_ports_in_window = set(p for p, _ in window_entries)
            if len(distinct_ports_in_window) >= port_threshold:
                representative = entries[0]
                alerts.append(_build_alert(
                    'Port Scan Detected',
                    'port_scan',
                    ip,
                    representative.get('dest_ip', ''),
                    representative.get('username', ''),
                    'high',
                    85,
                    f"IP {ip} scanned {len(distinct_ports_in_window)} ports within {window_seconds}s: {sorted(list(distinct_ports_in_window))[:10]}",
                    representative.get('id')
                ))
                break

    return alerts


# ─── Rule 3: Known Malicious IP ──────────────────────────────────────────────
def detect_malicious_ip(logs, blacklisted_ips):
    """
    Detect traffic from blacklisted IPs.
    MITRE: T1071 - Application Layer Protocol
    """
    alerts = []
    blacklisted_set = set(blacklisted_ips)

    for entry in logs:
        src_ip = entry.get('source_ip', '')
        if src_ip and src_ip in blacklisted_set:
            alerts.append(_build_alert(
                'Known Malicious IP Detected',
                'malicious_ip',
                src_ip,
                entry.get('dest_ip', ''),
                entry.get('username', ''),
                'critical',
                100,
                f"Traffic detected from blacklisted IP {src_ip}. Immediately block this IP and investigate all associated connections.",
                entry.get('id')
            ))

    # Deduplicate by source IP
    seen_ips = set()
    deduped = []
    for a in alerts:
        if a['source_ip'] not in seen_ips:
            seen_ips.add(a['source_ip'])
            deduped.append(a)
    return deduped


# ─── Rule 4: DDoS Detection ──────────────────────────────────────────────────
def detect_ddos(logs, window_seconds=30, request_threshold=100):
    """
    Detect DDoS: single IP sends >100 requests within 30 seconds.
    MITRE: T1498 - Network Denial of Service
    """
    alerts = []
    by_ip = _group_by_ip(logs)

    for ip, entries in by_ip.items():
        if len(entries) < request_threshold:
            continue

        timestamps = sorted([_parse_ts(e.get('timestamp', '')) for e in entries if _parse_ts(e.get('timestamp', ''))])

        if not timestamps:
            if len(entries) >= request_threshold:
                representative = entries[0]
                alerts.append(_build_alert(
                    'DDoS Attack Detected',
                    'ddos',
                    ip,
                    representative.get('dest_ip', ''),
                    representative.get('username', ''),
                    'critical',
                    95,
                    f"IP {ip} generated {len(entries)} requests (no timestamp data). Possible DDoS.",
                    representative.get('id')
                ))
            continue

        for i, ts in enumerate(timestamps):
            window_end = ts + timedelta(seconds=window_seconds)
            count = sum(1 for t in timestamps if ts <= t <= window_end)
            if count >= request_threshold:
                representative = entries[0]
                alerts.append(_build_alert(
                    'DDoS Attack Detected',
                    'ddos',
                    ip,
                    representative.get('dest_ip', ''),
                    representative.get('username', ''),
                    'critical',
                    95,
                    f"IP {ip} sent {count} requests within {window_seconds}s. Immediate DDoS mitigation required.",
                    representative.get('id')
                ))
                break

    return alerts


# ─── Rule 5: Suspicious Admin Login ──────────────────────────────────────────
def detect_suspicious_admin_login(logs, start_hour=23, end_hour=6):
    """
    Detect admin logins outside office hours (11PM - 6AM).
    MITRE: T1078 - Valid Accounts
    """
    alerts = []

    for entry in logs:
        username = entry.get('username', '').lower()
        action = entry.get('action', '').upper()
        status = entry.get('status', '').upper()

        is_admin = any(kw in username for kw in ['admin', 'root', 'administrator', 'superuser', 'sysadmin'])
        is_login = action in ('LOGIN', 'AUTHENTICATION', 'AUTH', 'SSH_AUTH', 'ADMIN_ACCESS')
        is_success = status in ('SUCCESS', 'ALLOWED', 'ACCEPTED')

        if not (is_admin and is_login and is_success):
            continue

        ts = _parse_ts(entry.get('timestamp', ''))
        if not ts:
            continue

        hour = ts.hour
        # Off-hours: >= 23 or < 6
        if hour >= start_hour or hour < end_hour:
            alerts.append(_build_alert(
                'Suspicious Admin Login — Off Hours',
                'suspicious_admin',
                entry.get('source_ip', ''),
                entry.get('dest_ip', ''),
                entry.get('username', ''),
                'medium',
                65,
                f"Admin account '{entry.get('username')}' logged in at {ts.strftime('%H:%M')} (outside office hours). Verify if this was authorized.",
                entry.get('id')
            ))

    return alerts


# ─── Rule 6: Impossible Travel Detection ─────────────────────────────────────
def detect_impossible_travel(logs, window_minutes=10):
    """
    Detect user logging in from two distant IPs within 10 minutes.
    MITRE: T1078.004 - Cloud Accounts
    """
    alerts = []
    by_user = _group_by_user(logs)

    for username, entries in by_user.items():
        logins = [e for e in entries if
                  e.get('action', '').upper() in ('LOGIN', 'AUTHENTICATION', 'AUTH', 'SSH_AUTH') and
                  e.get('status', '').upper() in ('SUCCESS', 'ALLOWED', 'ACCEPTED') and
                  e.get('source_ip')]

        if len(logins) < 2:
            continue

        # Sort by timestamp
        logins_with_ts = [(l, _parse_ts(l.get('timestamp', ''))) for l in logins]
        logins_with_ts = [(l, t) for l, t in logins_with_ts if t]
        logins_with_ts.sort(key=lambda x: x[1])

        for i in range(len(logins_with_ts)):
            for j in range(i + 1, len(logins_with_ts)):
                log_i, ts_i = logins_with_ts[i]
                log_j, ts_j = logins_with_ts[j]

                diff_minutes = (ts_j - ts_i).total_seconds() / 60
                if diff_minutes > window_minutes:
                    break

                ip_i = log_i.get('source_ip', '')
                ip_j = log_j.get('source_ip', '')

                # Check if IPs are in different subnets (simplified: first two octets differ)
                def get_subnet(ip):
                    parts = ip.split('.')
                    return '.'.join(parts[:2]) if len(parts) >= 2 else ip

                if ip_i != ip_j and get_subnet(ip_i) != get_subnet(ip_j):
                    alerts.append(_build_alert(
                        'Impossible Travel Detected',
                        'impossible_travel',
                        ip_i,
                        ip_j,
                        username,
                        'high',
                        88,
                        f"User '{username}' authenticated from {ip_i} and then {ip_j} within {diff_minutes:.1f} minutes. Account may be compromised.",
                        log_i.get('id')
                    ))
                    break

    return alerts


# ─── Rule 7: Privilege Escalation ────────────────────────────────────────────
def detect_privilege_escalation(logs, threshold=3):
    """
    Detect multiple failed admin access attempts (privilege escalation).
    MITRE: T1068 - Exploitation for Privilege Escalation
    """
    alerts = []
    by_ip = _group_by_ip(logs)

    for ip, entries in by_ip.items():
        priv_attempts = [e for e in entries if
                         e.get('action', '').upper() in ('PRIVILEGE_ESCALATION', 'ADMIN_ACCESS', 'SUDO', 'SU') or
                         (e.get('action', '').upper() in ('LOGIN', 'AUTH', 'AUTHENTICATION') and
                          any(kw in e.get('username', '').lower() for kw in ['admin', 'root', 'sudo']))]

        failed_priv = [e for e in priv_attempts if
                       e.get('status', '').upper() in ('FAILED', 'FAILURE', 'BLOCKED', 'DENIED', 'UNAUTHORIZED')]

        if len(failed_priv) >= threshold:
            representative = failed_priv[0]
            alerts.append(_build_alert(
                'Privilege Escalation Attempt',
                'privilege_escalation',
                ip,
                representative.get('dest_ip', ''),
                representative.get('username', ''),
                'critical',
                92,
                f"IP {ip} made {len(failed_priv)} failed privilege escalation attempts. Immediately isolate source and audit affected systems.",
                representative.get('id')
            ))

    return alerts


# ─── Alert Builder ────────────────────────────────────────────────────────────
def _build_alert(name, threat_type, source_ip, dest_ip, username, severity, risk_score, description, log_id=None):
    """Build a standardized alert dictionary."""
    mitre = MITRE_MAP.get(threat_type, {'technique': 'T0000', 'tactic': 'Unknown'})
    return {
        'alert_name': name,
        'threat_type': threat_type,
        'source_ip': source_ip or '',
        'dest_ip': dest_ip or '',
        'username': username or '',
        'severity': severity,
        'risk_score': risk_score,
        'mitre_technique': mitre['technique'],
        'mitre_tactic': mitre['tactic'],
        'recommendation': description,
        'status': 'open',
        'log_id': log_id,
        'created_at': datetime.utcnow().isoformat()
    }
