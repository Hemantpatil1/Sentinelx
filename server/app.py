"""
SentinelX - Enterprise SIEM Platform
Flask Application Entry Point
"""
import os
from flask import Flask
from flask_cors import CORS
from database.db import init_db
from routes.auth import auth_bp
from routes.logs import logs_bp
from routes.alerts import alerts_bp
from routes.incidents import incidents_bp
from routes.reports import reports_bp
from routes.dashboard import dashboard_bp
from routes.threat_intel import threat_intel_bp
from services.detection.engine import DetectionEngine

def create_app():
    app = Flask(__name__)
    app.config.from_object('config.Config')

    # Enable CORS for React frontend
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Initialize database
    with app.app_context():
        init_db()

    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(logs_bp, url_prefix='/api/logs')
    app.register_blueprint(alerts_bp, url_prefix='/api/alerts')
    app.register_blueprint(incidents_bp, url_prefix='/api/incidents')
    app.register_blueprint(reports_bp, url_prefix='/api/reports')
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
    app.register_blueprint(threat_intel_bp, url_prefix='/api/threat-intel')

    # Health check
    @app.route('/api/health')
    def health():
        return {'status': 'ok', 'service': 'SentinelX API v1.0'}

    return app

app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=True, host='0.0.0.0', port=port)
