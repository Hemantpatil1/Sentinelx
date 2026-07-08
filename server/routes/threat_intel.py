"""
Threat Intelligence Routes
GET /api/threat-intel - Get threat intel lists and stats
"""
import os
from flask import Blueprint, request, jsonify, current_app
from utils.jwt_helper import token_required

threat_intel_bp = Blueprint('threat_intel', __name__)

def _load_ip_list(filepath):
    ips = []
    if not os.path.exists(filepath):
        return ips
    with open(filepath, 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#'):
                ips.append(line)
    return ips

@threat_intel_bp.route('', methods=['GET'])
@token_required
def get_threat_intel():
    """Get threat intelligence lists."""
    intel_folder = current_app.config['THREAT_INTEL_FOLDER']
    blacklist = _load_ip_list(os.path.join(intel_folder, 'blacklist.txt'))
    trusted = _load_ip_list(os.path.join(intel_folder, 'trusted_ips.txt'))

    return jsonify({
        'blacklisted_ips': blacklist,
        'trusted_ips': trusted,
        'blacklist_count': len(blacklist),
        'trusted_count': len(trusted),
    })

@threat_intel_bp.route('/check', methods=['POST'])
@token_required
def check_ip():
    """Check if an IP is blacklisted or trusted."""
    data = request.get_json()
    ip = data.get('ip', '').strip()

    if not ip:
        return jsonify({'error': 'IP address required'}), 400

    intel_folder = current_app.config['THREAT_INTEL_FOLDER']
    blacklist = set(_load_ip_list(os.path.join(intel_folder, 'blacklist.txt')))
    trusted = set(_load_ip_list(os.path.join(intel_folder, 'trusted_ips.txt')))

    return jsonify({
        'ip': ip,
        'is_blacklisted': ip in blacklist,
        'is_trusted': ip in trusted,
        'status': 'blacklisted' if ip in blacklist else ('trusted' if ip in trusted else 'unknown')
    })
