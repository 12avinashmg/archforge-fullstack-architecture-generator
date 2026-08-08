# ArchForge

**AI-Driven Full-Stack Fintech Architecture Generator**

ArchForge takes a plain-English description of a fintech app and instantly generates a complete architecture blueprint — from microservice breakdown to a working demo frontend — across multiple domains like Digital Wallets, P2P Payments, AI Lending, Bill Management, and Analytics.

---

## 🚀 Overview

Instead of manually designing system architecture for every new fintech idea, ArchForge automates it. A user describes what they want to build (e.g. *"I want a UPI payment app with fraud detection"*), and ArchForge:

1. Classifies the request into the right architectural domain using an ML/NLP pipeline
2. Maps functional requirements to specific software components and services
3. Generates a visual microservices architecture diagram
4. Scaffolds a corresponding frontend UI and backend structure based on the generated blueprint

## ✨ Features

- **Natural language to architecture** — describe an app idea in a sentence, get a full system design
- **15 selectable architecture options** across **5 fintech domains**: Digital Wallet, P2P Payment, AI Lending, Bill Manager, Analytics
  - **Individual Modules** — Login & Registration, Send Money (UPI Transfer), QR Code Payment, Wallet Balance & Top Up, Loan Application Form, Bill Payment (BBPS), Live NSE Price Feed
  - **Full Applications** — Digital Wallet App, P2P Payment Gateway, AI Lending Platform, Bill & Subscription Manager, Financial Analytics Dashboard
  - **Combinations** — Wallet + Payments, Payments + Lending, Complete Fintech Platform
- **Auto-generated microservices diagrams** — Auth, API Gateway, Payment/UPI, Fraud Engine, KYC, Credit Scoring, Notification, Event Bus, and more
- **Dual-backend support** — Java (Spring Boot) as the primary backend, Python (FastAPI) as an ML microservice
- **Configurable stack selection** — choose data layer (PostgreSQL, MySQL, Redis, Kafka) and security stack (JWT, BCrypt, OTP, Fraud ML, KYC)

## 🧠 How It Works (ML Pipeline)

1. **Dataset Curation** — Labeled training data built from industry-standard fintech terms (JWT, 2FA, UPI, KYC, etc.) used as classification labels
2. **Feature Extraction** — Text requirements are vectorized using **TF-IDF**
3. **Classification** — A **LinearSVC** model maps the vectorized text to the most relevant architectural components and domain
4. **Blueprint Generation** — Classified components are assembled into a full microservices architecture and rendered visually
5. **Code Generation** — A ready-to-run full-stack app (React frontend + backend) is scaffolded automatically

## 🏗️ Architecture

Example generated architecture for a **Complete Fintech Platform**:

```
Auth Vault        API Gateway         Wallet Service
UPI Payment Svc   QR Code Service     Fraud Engine
Loan Application  Credit Scoring ML   KYC Verification
BBPS Adapter      NACH Scheduler      Price Feed Service
WebSocket Server  Portfolio Tracker   NLP Categorizer
Kafka Event Bus   Notification Svc    PostgreSQL Immutable Ledger
```

Services communicate through an event-driven architecture backed by **Kafka**, with **PostgreSQL** used as an immutable ledger for transaction integrity.

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React |
| Primary Backend | Java (Spring Boot) |
| ML Microservice | Python (FastAPI) |
| Machine Learning | Scikit-learn (LinearSVC + TF-IDF) |
| Data Layer | PostgreSQL, MySQL, Redis, Kafka |
| Security | JWT, BCrypt, OTP, Fraud ML, KYC |

## 🖼️ Screenshots
<img width="1893" height="714" alt="Screenshot 2026-08-08 172508" src="https://github.com/user-attachments/assets/0c039f54-8fbb-4be5-8c13-75a11c53c2fa" />

<img width="1885" height="914" alt="Screenshot 2026-08-08 172538" src="https://github.com/user-attachments/assets/90a08615-7a21-40c3-b865-a9ee01d7f1a5" />

<img width="1866" height="912" alt="Screenshot 2026-08-08 172612" src="https://github.com/user-attachments/assets/57fff86a-dcea-4987-ba0a-4e61ce43ff15" />


## 🔧 Project Status

ArchForge is currently a **working prototype**. The architecture classification pipeline (TF-IDF + LinearSVC), diagram generation, and frontend UI scaffolding are functional. Full end-to-end backend integration for every generated microservice across all 32 configurations is still in progress.

## 📌 Key Highlights

- Developed an AI system using FastAPI and Spring Boot to dynamically generate custom full-stack blueprints across 15 architecture options and 5 fintech domains
- Engineered an NLP pipeline using TF-IDF vectorization and a LinearSVC model to map functional text requirements to specialized software components
- Curated a labeled dataset using industry-standard fintech terms as classification labels to train and refine the ML models
- Automated code generation to instantly output ready-to-run web applications with a responsive React frontend and a functional multi-service backend

*ArchForge — turning fintech ideas into architecture, instantly.*
