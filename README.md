# SentinelX — Enterprise Threat Detection & Incident Response Platform

SentinelX is a Security Information and Event Management (SIEM) platform designed for Security Operations Centers (SOC) to monitor, upload, parse, and analyze security event logs. Using an automated, rule-based detection engine mapped to the MITRE ATT&CK framework, it generates alerts and manages escalated incidents.

## 🚀 Key Modules
1. **Authentication:** JWT-secured login/logout for `Administrator` and `SOC Analyst` roles.
2. **SOC Dashboard:** Real-time metrics overview, Area trends timeline, distribution charts (using Recharts), live activity feed, and recent security alerts.
3. **Log Management:** Supports drag-and-drop log uploads (`.csv`, `.log`, `.txt`) with deletion and database registry.
4. **Log Parser:** Multi-format regex extraction of fields: timestamp, source/destination IPs, usernames, port, protocol, action, and status.
5. **Threat Detection Engine:** Mapped against 7 core rules (Brute Force, Port Scan, DDoS, Blacklisted IP lookup, Off-hours admin access, Impossible Travel, and Privilege Escalation).
6. **Alert Management:** Deep investigation view, severities (`Critical`, `High`, `Medium`, `Low`), status state management, and MITRE mapping.
7. **Incident Response:** Escalate alerts to tracked incidents, write journal entries, assign analysts, and review the chronological audit trail.
8. **Reports:** Compile dynamic, executive-style PDF documents using ReportLab or export complete alerts database lists to CSV.
9. **Threat Intelligence:** Cross-reference connections against whitelist/blacklist text files with quick rep checkers.

---

## 🛠️ Tech Stack & Directory Structure
* **Frontend:** React, Vite, TailwindCSS (glassmorphism design theme)
* **Backend:** Python Flask
* **Database:** SQLite3

---

## 🏁 Quick Start & Installation

### Option A: Using Docker Compose (Recommended)
Make sure you have Docker installed.

1. Clone or navigate to the project directory:
   ```bash
   cd C:\Users\LENOVO\.gemini\antigravity\scratch\sentinelx
   ```
2. Build and run containers:
   ```bash
   docker-compose up --build
   ```
3. Open your browser:
   * **Frontend Application:** `http://localhost:3000`
   * **Backend API Base:** `http://localhost:5000`

---

### Option B: Local Setup (Manual)

#### 1. Backend Setup
1. Navigate to the server folder:
   ```bash
   cd server
   ```
2. Install Python packages:
   ```bash
   pip install -r requirements.txt
   ```
3. Start the Flask server:
   ```bash
   python app.py
   ```
   *The server runs at `http://localhost:5000` and automatically initializes the database schema.*

#### 2. Frontend Setup
1. Navigate to the client folder:
   ```bash
   cd ../client
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Start the Vite dev server:
   ```bash
   npm run dev
   ```
   *Open `http://localhost:3000` to interact with the dashboard.*

---

## 🔐 Credentials (Demo Accounts)
* **Administrator:** `admin` / `admin123`
* **SOC Analyst:** `analyst` / `analyst123`
