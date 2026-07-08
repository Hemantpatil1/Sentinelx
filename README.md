# 🛡️ SentinelX – Enterprise Security Information and Event Management (SIEM) Platform

<div align="center">

![Python](https://img.shields.io/badge/Python-3.11-blue)
![Flask](https://img.shields.io/badge/Flask-3.0-green)
![React](https://img.shields.io/badge/React-18-61DAFB)
![SQLite](https://img.shields.io/badge/SQLite-Database-blue)
![JWT](https://img.shields.io/badge/JWT-Authentication-orange)
![License](https://img.shields.io/badge/License-MIT-success)

### Enterprise Cyber Security Monitoring & Threat Detection Platform

</div>

---

# 📌 Overview

**SentinelX** is a Security Information and Event Management (SIEM) platform designed to simulate the workflow of a modern Security Operations Center (SOC).

The platform collects security logs from multiple sources, analyzes them using custom threat detection rules, identifies malicious activities, generates security alerts, creates incidents, and provides real-time visualization through an interactive dashboard.

SentinelX demonstrates the core concepts used by enterprise SIEM solutions such as:

- Microsoft Sentinel
- IBM QRadar
- Splunk Enterprise Security
- Elastic Security

The project focuses on log analysis, attack detection, incident management, and security reporting.

---

# 🎯 Objectives

- Collect logs from enterprise systems
- Detect cyber attacks in real-time
- Generate security alerts
- Assist SOC analysts during investigations
- Reduce Mean Time To Detect (MTTD)
- Improve incident response workflow

---

# 🚀 Key Features

## 🔐 Authentication

- JWT Authentication
- Secure Login
- Role Based Access Control
- Session Management

---

## 📥 Log Management

Supports importing security logs in CSV format.

Each uploaded log contains:

- Timestamp
- Source IP
- Destination IP
- Username
- Port
- Protocol
- Status
- Action
- Raw Event

Uploaded logs are stored inside the SQLite database for further analysis.

---

# 🛡️ Threat Detection Engine

The Detection Engine continuously scans imported logs and automatically generates alerts whenever suspicious activity is detected.

---

## Detection Rules

### 🔴 Brute Force Detection

Detects multiple failed login attempts from the same IP address within a specific time window.

**Detection Logic**

- Failed Login Attempts ≥ 5
- Same Source IP
- Within 60 Seconds

---

### 🌐 Port Scan Detection

Detects attackers scanning multiple ports in a short period.

**Detection Logic**

- Unique Ports ≥ 10
- Same IP Address
- Within 30 Seconds

---

### ⚠️ Blacklisted IP Detection

Checks incoming traffic against a Threat Intelligence blacklist.

If the Source IP exists inside

```
blacklist.txt
```

an alert is immediately generated.

---

### 🚨 DDoS Detection

Detects unusually high request volumes from the same source.

**Detection Logic**

- Requests ≥ 100
- Same Source IP
- Within 30 Seconds

---

### 👨‍💻 Suspicious Admin Login

Detects administrator logins outside business hours.

Detection Time

```
11:00 PM – 06:00 AM
```

---

### 🌍 Impossible Travel Detection

Detects impossible geographic movement by comparing login locations.

Example

```
India
↓

2 Minutes

↓

USA
```

Such activity is considered suspicious.

---

### 🔓 Privilege Escalation Detection

Detects repeated failed attempts to access administrator or root privileges.

---

# 🚨 Alert Management

Every detected threat automatically generates an alert containing:

- Alert Name
- Threat Type
- Severity
- Risk Score
- Source IP
- Destination IP
- Username
- MITRE ATT&CK Technique
- MITRE ATT&CK Tactic
- Recommendation
- Timestamp

Alerts can be:

- Open
- Under Investigation
- Resolved

---

# 📊 Dashboard

The dashboard provides real-time security analytics.

### KPI Cards

- Total Logs
- Total Alerts
- Critical Alerts
- High Alerts
- Medium Alerts
- Low Alerts
- Open Incidents
- Resolved Incidents

---

### Interactive Charts

- Attack Timeline
- Severity Distribution
- Threat Distribution
- Top Attacker IPs
- Targeted Users
- MITRE ATT&CK Statistics

---

# 📁 Incident Management

Every critical alert can generate an incident.

Each incident includes:

- Incident Title
- Priority
- Status
- Assigned Analyst
- Investigation Notes
- Timeline
- Resolution Status

---

# 📄 Report Generation

Generate security reports including:

- Incident Reports
- Threat Reports
- Alert Reports

Supported Formats

- CSV
- PDF

---

# 🧠 Threat Intelligence

SentinelX supports external threat intelligence feeds.

Files

```
blacklist.txt
trusted_ips.txt
```

These files are loaded during application startup.

Blacklisted IPs automatically trigger security alerts.

---

# 🏗️ Project Architecture

```
               +----------------------+
               |    React Dashboard   |
               +----------+-----------+
                          |
                          |
                    REST API (JWT)
                          |
+------------------------------------------------+
|               Flask Backend                    |
|------------------------------------------------|
| Authentication                                 |
| Log Upload                                     |
| Detection Engine                               |
| Alert Management                               |
| Incident Management                            |
| Reporting                                      |
| Threat Intelligence                            |
+------------------------------------------------+
                          |
                    SQLite Database
                          |
      +-------------------------------+
      | Logs                          |
      | Alerts                        |
      | Incidents                     |
      | Reports                       |
      | Users                         |
      +-------------------------------+
```

---

# ⚙️ Technology Stack

## Frontend

- React.js
- TypeScript
- Tailwind CSS
- Axios
- Recharts

---

## Backend

- Python
- Flask
- Flask-CORS
- JWT Authentication

---

## Database

- SQLite

---

## Security

- Password Hashing
- JWT Authentication
- Threat Intelligence
- MITRE ATT&CK Mapping

---

# 📂 Project Structure

```
SentinelX/

client/
│
├── src/
├── pages/
├── components/
├── services/

server/
│
├── routes/
├── database/
├── services/
│     ├── detection/
│     ├── recommender.py
│     ├── rules.py
│
├── threat_intel/
│
├── uploads/
├── generated_reports/
├── app.py

README.md
```

---

# ▶️ Installation

## Clone Repository

```bash
git clone https://github.com/yourusername/SentinelX.git

cd SentinelX
```

---

## Backend

```bash
cd server

python -m venv venv

venv\Scripts\activate

pip install -r requirements.txt

python app.py
```

---

## Frontend

```bash
cd client

npm install

npm run dev
```

---

Backend

```
http://localhost:5000
```

Frontend

```
http://localhost:5173
```

---

# 🔑 Default Credentials

## Administrator

```
Username : admin
Password : admin123
```

## Analyst

```
Username : analyst
Password : analyst123
```

---

# 🧪 Demo Dataset

The repository includes a sample log dataset that demonstrates:

- Brute Force Attack
- Port Scan
- DDoS Attack
- Blacklisted IP Detection
- Privilege Escalation
- Impossible Travel
- Suspicious Administrator Login

Uploading the dataset automatically generates alerts and populates the dashboard.

---

# 📈 Future Enhancements

- Machine Learning Based Anomaly Detection
- Real-Time Log Streaming
- Kafka Integration
- Elasticsearch Integration
- GeoIP Attack Map
- Email & Slack Notifications
- Multi-Tenant Architecture
- Docker Deployment
- Kubernetes Support
- Cloud Deployment (AWS/Azure)

---

# 👨‍💻 Authors

**Hemant Patil**

Backend Development • Detection Engine • API Development

**Project Partner**

Cyber Security Rules • Threat Intelligence • Testing

---

# 📜 License

This project is developed for educational and research purposes.

MIT License.

---

# ⭐ If you found this project useful, consider giving it a Star.