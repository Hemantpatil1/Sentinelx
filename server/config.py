"""
SentinelX Configuration
"""
import os
from datetime import timedelta

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'sentinelx-super-secret-key-2024-change-in-production')
    JWT_SECRET = os.environ.get('JWT_SECRET', 'sentinelx-jwt-secret-2024')
    JWT_EXPIRATION = timedelta(hours=8)

    DATABASE_PATH = os.environ.get('DATABASE_PATH', os.path.join(os.path.dirname(__file__), 'database', 'sentinelx.db'))
    UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER', os.path.join(os.path.dirname(__file__), 'uploads'))
    REPORTS_FOLDER = os.environ.get('REPORTS_FOLDER', os.path.join(os.path.dirname(__file__), 'generated_reports'))
    THREAT_INTEL_FOLDER = os.environ.get('THREAT_INTEL_FOLDER', os.path.join(os.path.dirname(__file__), 'threat_intel'))

    MAX_CONTENT_LENGTH = 50 * 1024 * 1024  # 50MB max upload

    ALLOWED_EXTENSIONS = {'csv', 'log', 'txt'}

    # Ensure directories exist
    for folder in [UPLOAD_FOLDER, REPORTS_FOLDER]:
        os.makedirs(folder, exist_ok=True)
