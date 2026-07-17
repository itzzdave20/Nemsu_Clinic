# NEMSU HealthHub

**AI-Powered Clinic Management System** for NEMSU Cantilan Campus.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Tailwind CSS, Framer Motion |
| Backend | Node.js, Express, JWT Auth |
| Database | MySQL |
| Email | Nodemailer (SMTP) |
| SMS | Semaphore (Philippines) |
| Deploy | Docker Compose |

## Quick Start (Local)

### 1. Start MySQL (XAMPP)
Open XAMPP Control Panel and start **MySQL**.

### 2. Seed Database
```bash
cd backend
npm install
npm run seed
```

### 3. Start Backend API
```bash
npm run dev
```
API runs at `http://localhost:5000`

### 4. Start Frontend
```bash
cd frontend
npm install
npm run dev
```
App runs at `http://localhost:5173`

## Default Accounts

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | Admin |
| dr.santos | admin123 | Doctor |
| nurse.reyes | admin123 | Nurse |
| student.juan | admin123 | Patient |

## Modules

- **Patient Management** — EHR registration
- **Appointments** — Booking with reminders
- **Consultations** — Doctor workbench
- **Clinical Records** — Prescriptions, labs, referrals
- **Inventory** — Stock tracking
- **AI Symptom Triage** — Urgency assessment
- **Notifications** — In-app, email, SMS reminders
- **Announcements** — Health advisories
- **Dashboard** — Live analytics

---

## Email & SMS Setup

Copy values from `backend/.env.example` into `backend/.env`:

### Gmail SMTP
1. Enable 2FA on your Google account
2. Create an [App Password](https://myaccount.google.com/apppasswords)
3. Set `SMTP_USER`, `SMTP_PASS`, and `SMTP_HOST=smtp.gmail.com`

### Semaphore SMS (Philippines)
1. Register at [semaphore.co](https://semaphore.co/)
2. Get your API key
3. Set `SEMAPHORE_API_KEY` and `SEMAPHORE_SENDER` (max 11 chars)

### Automated Reminders
```env
REMINDER_CRON_ENABLED=true
REMINDER_CRON_SCHEDULE=0 8 * * *
REMINDER_DEFAULT_CHANNEL=email
```
Sends daily at 8 AM to patients with appointments in the next 24 hours.

In the Notifications page you can choose **In-App**, **Email**, **SMS**, or **All Channels**.

---

## Docker Deployment (Cloud / VPS) — optional

> **Skip this for local XAMPP development.** Use the Quick Start above instead.
> Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed.
> Run these commands from the **project root** (`NEMSU_Clinic/`), not from `backend/`.

```bash
# From NEMSU_Clinic/ (project root)
Copy-Item .env.docker.example .env
# Edit .env — set JWT_SECRET, DB_ROOT_PASSWORD, SMTP, Semaphore keys

docker compose up -d --build
# Open http://localhost
```

| Service | Port | Description |
|---------|------|-------------|
| web | 80 | React frontend (nginx) |
| api | 5000 | Node.js API |
| db | 3306 | MySQL 8 |

**VPS tip:** Install Docker, clone the repo, configure `.env`, then `docker compose up -d --build`. Add SSL with Certbot or Caddy.

---

## Security

- Change `JWT_SECRET` and `DB_ROOT_PASSWORD` in production
- Enable HTTPS (Let's Encrypt)
- Compliant with Philippine Data Privacy Act (RA 10173)
