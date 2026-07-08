"""
Log File Parser
Supports CSV, LOG, and TXT formats
Extracts: Timestamp, Source IP, Destination IP, Username, Port, Protocol, Status, Action
"""
import re
import csv
import io
from datetime import datetime

# Common IP pattern
IP_PATTERN = r'\b(?:\d{1,3}\.){3}\d{1,3}\b'

# Known log formats patterns
PATTERNS = [
    # Apache/Nginx combined log: IP - user [timestamp] "method url protocol" status bytes
    {
        'name': 'apache_combined',
        'regex': re.compile(
            r'(?P<source_ip>' + IP_PATTERN + r')\s+-\s+(?P<username>\S+)\s+\[(?P<timestamp>[^\]]+)\]\s+"(?P<action>[^"]+)"\s+(?P<status>\d{3})'
        )
    },
    # Syslog format: timestamp hostname service[pid]: message
    {
        'name': 'syslog',
        'regex': re.compile(
            r'(?P<timestamp>\w+\s+\d+\s+\d+:\d+:\d+)\s+\S+\s+\S+:\s+(?P<action>.*)'
        )
    },
    # Windows Event Log style: timestamp|source_ip|dest_ip|username|port|protocol|status|action
    {
        'name': 'sentinelx_csv',
        'regex': re.compile(
            r'(?P<timestamp>[^|]+)\|(?P<source_ip>[^|]+)\|(?P<dest_ip>[^|]+)\|(?P<username>[^|]+)\|(?P<port>[^|]+)\|(?P<protocol>[^|]+)\|(?P<status>[^|]+)\|(?P<action>[^|]+)'
        )
    },
    # Generic: IP ... IP format
    {
        'name': 'generic',
        'regex': re.compile(
            r'(?P<timestamp>\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}[^\s]*)\s+(?P<source_ip>' + IP_PATTERN + r').*?(?P<status>SUCCESS|FAILED|BLOCKED|ALLOWED|DROP|ACCEPT|REJECT)',
            re.IGNORECASE
        )
    }
]

def extract_ips(text):
    """Extract all IPs from text."""
    return re.findall(IP_PATTERN, text)

def extract_timestamp(text):
    """Try to extract timestamp from text."""
    patterns = [
        r'\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?',
        r'\d{2}/\w{3}/\d{4}:\d{2}:\d{2}:\d{2}',
        r'\w{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}',
        r'\d{2}/\d{2}/\d{4}\s+\d{2}:\d{2}:\d{2}',
    ]
    for p in patterns:
        m = re.search(p, text)
        if m:
            return m.group()
    return None

def extract_port(text):
    """Extract port number from text."""
    m = re.search(r'(?:port|Port|PORT|:)[\s:]*(\d{1,5})\b', text)
    if m:
        port = int(m.group(1))
        if 1 <= port <= 65535:
            return port
    return None

def extract_username(text):
    """Extract username from text."""
    patterns = [
        r'(?:user|User|USER|username|Username)[\s=:]+([^\s,;|]+)',
        r'for\s+user\s+([^\s]+)',
        r'login:\s+([^\s]+)',
    ]
    for p in patterns:
        m = re.search(p, text, re.IGNORECASE)
        if m:
            return m.group(1)
    return None

def extract_protocol(text):
    """Extract protocol from text."""
    protocols = ['HTTP', 'HTTPS', 'SSH', 'FTP', 'SMTP', 'DNS', 'TCP', 'UDP', 'ICMP', 'RDP', 'SNMP']
    for proto in protocols:
        if re.search(r'\b' + proto + r'\b', text, re.IGNORECASE):
            return proto.upper()
    return 'TCP'

def extract_status(text):
    """Extract status/result from text."""
    statuses = {
        'failed': 'FAILED',
        'failure': 'FAILED',
        'success': 'SUCCESS',
        'accepted': 'SUCCESS',
        'blocked': 'BLOCKED',
        'dropped': 'BLOCKED',
        'rejected': 'BLOCKED',
        'denied': 'BLOCKED',
        'allowed': 'ALLOWED',
        'permitted': 'ALLOWED',
    }
    lower = text.lower()
    for key, val in statuses.items():
        if key in lower:
            return val
    return 'UNKNOWN'

def extract_action(text):
    """Extract action from text."""
    actions = {
        'login': 'LOGIN',
        'logout': 'LOGOUT',
        'scan': 'PORT_SCAN',
        'connect': 'CONNECTION',
        'auth': 'AUTHENTICATION',
        'access': 'ACCESS',
        'upload': 'FILE_UPLOAD',
        'download': 'FILE_DOWNLOAD',
        'execute': 'EXECUTION',
        'admin': 'ADMIN_ACCESS',
        'sudo': 'PRIVILEGE_ESCALATION',
        'su ': 'PRIVILEGE_ESCALATION',
        'escalat': 'PRIVILEGE_ESCALATION',
    }
    lower = text.lower()
    for key, val in actions.items():
        if key in lower:
            return val
    return 'NETWORK_EVENT'

def parse_csv_log(content, filename):
    """Parse CSV format log files."""
    parsed = []
    try:
        reader = csv.DictReader(io.StringIO(content))
        for row in reader:
            entry = {
                'filename': filename,
                'source_ip': row.get('source_ip') or row.get('src_ip') or row.get('Source IP', ''),
                'dest_ip': row.get('dest_ip') or row.get('dst_ip') or row.get('Destination IP', ''),
                'username': row.get('username') or row.get('user') or row.get('Username', ''),
                'timestamp': row.get('timestamp') or row.get('time') or row.get('Timestamp', ''),
                'port': int(row.get('port') or row.get('Port') or 0) if (row.get('port') or row.get('Port', '0')).isdigit() else None,
                'protocol': (row.get('protocol') or row.get('Protocol') or 'TCP').upper(),
                'status': (row.get('status') or row.get('Status') or 'UNKNOWN').upper(),
                'action': (row.get('action') or row.get('Action') or 'NETWORK_EVENT').upper(),
                'raw_line': ','.join(str(v) for v in row.values())
            }
            parsed.append(entry)
    except Exception as e:
        print(f"[Parser] CSV parse error: {e}")
    return parsed

def parse_text_log(content, filename):
    """Parse text/log format files line by line."""
    parsed = []
    lines = content.split('\n')

    for line in lines:
        line = line.strip()
        if not line or line.startswith('#'):
            continue

        # Try pipe-delimited SentinelX format first
        if '|' in line and line.count('|') >= 5:
            parts = [p.strip() for p in line.split('|')]
            if len(parts) >= 7:
                entry = {
                    'filename': filename,
                    'timestamp': parts[0] if len(parts) > 0 else '',
                    'source_ip': parts[1] if len(parts) > 1 else '',
                    'dest_ip': parts[2] if len(parts) > 2 else '',
                    'username': parts[3] if len(parts) > 3 else '',
                    'port': int(parts[4]) if len(parts) > 4 and parts[4].isdigit() else None,
                    'protocol': parts[5].upper() if len(parts) > 5 else 'TCP',
                    'status': parts[6].upper() if len(parts) > 6 else 'UNKNOWN',
                    'action': parts[7].upper() if len(parts) > 7 else 'NETWORK_EVENT',
                    'raw_line': line
                }
                parsed.append(entry)
                continue

        # Generic extraction
        ips = extract_ips(line)
        entry = {
            'filename': filename,
            'source_ip': ips[0] if len(ips) > 0 else '',
            'dest_ip': ips[1] if len(ips) > 1 else '',
            'username': extract_username(line) or '',
            'timestamp': extract_timestamp(line) or '',
            'port': extract_port(line),
            'protocol': extract_protocol(line),
            'status': extract_status(line),
            'action': extract_action(line),
            'raw_line': line
        }
        parsed.append(entry)

    return parsed

def parse_log_file(file_content_bytes, filename):
    """
    Main entry point for parsing a log file.
    Returns list of parsed log dicts.
    """
    try:
        content = file_content_bytes.decode('utf-8', errors='replace')
    except Exception:
        content = str(file_content_bytes)

    ext = filename.lower().rsplit('.', 1)[-1] if '.' in filename else 'txt'

    if ext == 'csv':
        parsed = parse_csv_log(content, filename)
        # Fallback to text parsing if CSV header not recognized
        if not parsed:
            parsed = parse_text_log(content, filename)
    else:
        parsed = parse_text_log(content, filename)

    return parsed
