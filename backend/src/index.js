import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import patientRoutes from './routes/patients.js';
import appointmentRoutes from './routes/appointments.js';
import consultationRoutes from './routes/consultations.js';
import inventoryRoutes from './routes/inventory.js';
import announcementRoutes from './routes/announcements.js';
import symptomRoutes from './routes/symptoms.js';
import prescriptionRoutes from './routes/prescriptions.js';
import labRoutes from './routes/labs.js';
import referralRoutes from './routes/referrals.js';
import notificationRoutes from './routes/notifications.js';
import reportRoutes from './routes/reports.js';
import { startReminderScheduler } from './scheduler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));

app.get('/api/health', (_, res) => res.json({ status: 'ok', service: 'NEMSU HealthHub API' }));

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/symptoms', symptomRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/labs', labRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`NEMSU HealthHub API running on http://localhost:${PORT}`);
  startReminderScheduler();
});
