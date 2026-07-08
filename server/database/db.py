"""
Database initialization and connection management
"""
import sqlite3
import os
from flask import current_app, g

def get_db():
    """Get database connection from Flask g object."""
    if 'db' not in g:
        g.db = sqlite3.connect(
            current_app.config['DATABASE_PATH'],
            #detect_types=sqlite3.PARSE_DECLTYPES
        )
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys = ON")
    return g.db

def close_db(e=None):
    """Close database connection."""
    db = g.pop('db', None)
    if db is not None:
        db.close()

def init_db():
    """Initialize database schema and seed default data."""
    os.makedirs(os.path.dirname(current_app.config['DATABASE_PATH']), exist_ok=True)
    db = sqlite3.connect(current_app.config['DATABASE_PATH'])
    db.row_factory = sqlite3.Row
    db.execute("PRAGMA foreign_keys = ON")

    # Create tables
    db.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'analyst',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT NOT NULL,
            source_ip TEXT,
            dest_ip TEXT,
            username TEXT,
            timestamp TEXT,
            port INTEGER,
            protocol TEXT,
            status TEXT,
            action TEXT,
            raw_line TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            alert_name TEXT NOT NULL,
            threat_type TEXT NOT NULL,
            source_ip TEXT,
            dest_ip TEXT,
            username TEXT,
            severity TEXT NOT NULL,
            risk_score INTEGER NOT NULL,
            mitre_technique TEXT,
            mitre_tactic TEXT,
            recommendation TEXT,
            status TEXT NOT NULL DEFAULT 'open',
            log_id INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (log_id) REFERENCES logs(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS incidents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            alert_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            assigned_to TEXT,
            status TEXT NOT NULL DEFAULT 'open',
            priority TEXT NOT NULL DEFAULT 'medium',
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (alert_id) REFERENCES alerts(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS incident_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            incident_id INTEGER NOT NULL,
            action TEXT NOT NULL,
            performed_by TEXT NOT NULL,
            details TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            report_name TEXT NOT NULL,
            report_type TEXT NOT NULL,
            file_path TEXT,
            generated_by TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    # Seed default users if they don't exist
    from werkzeug.security import generate_password_hash
    users = [
        ('admin', 'admin@sentinelx.io', generate_password_hash('admin123'), 'admin'),
        ('analyst', 'analyst@sentinelx.io', generate_password_hash('analyst123'), 'analyst'),
        ('soc_lead', 'soclead@sentinelx.io', generate_password_hash('soclead123'), 'admin'),
    ]
    for user in users:
        try:
            db.execute(
                "INSERT OR IGNORE INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)",
                user
            )
        except Exception:
            pass

    db.commit()
    db.close()
    print("[SentinelX] Database initialized successfully.")
