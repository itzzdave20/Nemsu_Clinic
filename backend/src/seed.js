import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sqlPath = path.join(__dirname, '../../database/nemsu-clinic.sql');

async function seed() {
  const rootConn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    multipleStatements: true,
  });

  try {
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await rootConn.query(sql);

    const hash = await bcrypt.hash('admin123', 10);
    const users = [
      ['admin', 'admin@nemsu.edu.ph', hash, 'admin', 'System Administrator', '09171234567'],
      ['dr.santos', 'santos@nemsu.edu.ph', hash, 'doctor', 'Dr. Maria Santos', '09181234567'],
      ['nurse.reyes', 'reyes@nemsu.edu.ph', hash, 'nurse', 'Nurse Ana Reyes', '09191234567'],
      ['student.juan', 'juan@student.nemsu.edu.ph', hash, 'patient', 'Juan Dela Cruz', '09201234567'],
    ];

    for (const u of users) {
      await rootConn.query(
        `INSERT INTO nemsu_clinic.users (username, email, password_hash, role, full_name, phone)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
        u
      );
    }

    const [[patientUser]] = await rootConn.query("SELECT id FROM nemsu_clinic.users WHERE username = 'student.juan'");
    const patients = [
      [patientUser?.id || null, '2021-00123', 'student', '2003-05-15', 'male', 'O+', 'Penicillin'],
      [null, '2020-00456', 'student', '2002-08-22', 'female', 'A+', null],
      [null, 'FAC-2019-01', 'faculty', '1985-03-10', 'male', 'B+', 'Shellfish'],
    ];
    for (const p of patients) {
      await rootConn.query(
        `INSERT INTO nemsu_clinic.patients (user_id, school_id, patient_type, birth_date, gender, blood_type, allergies)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE patient_type = VALUES(patient_type)`,
        p
      );
    }

    const inventory = [
      ['Paracetamol 500mg', 'medication', 500, 'tablets', 100, '2027-06-30'],
      ['Amoxicillin 250mg', 'medication', 200, 'capsules', 50, '2026-12-31'],
      ['Bandages', 'supply', 150, 'rolls', 30, null],
      ['Digital Thermometer', 'equipment', 8, 'units', 2, null],
      ['Face Masks', 'supply', 45, 'boxes', 20, null],
    ];
    for (const item of inventory) {
      await rootConn.query(
        `INSERT INTO nemsu_clinic.inventory (item_name, item_type, quantity, unit, reorder_level, expiry_date)
         SELECT ?, ?, ?, ?, ?, ? FROM DUAL
         WHERE NOT EXISTS (SELECT 1 FROM nemsu_clinic.inventory WHERE item_name = ?)`,
        [...item, item[0]]
      );
    }

    const [[admin]] = await rootConn.query("SELECT id FROM nemsu_clinic.users WHERE username = 'admin'");
    const announcements = [
      ['Flu Season Advisory', 'Practice good hygiene and get vaccinated. Visit the clinic for free flu shots.', 'health_advisory'],
      ['Clinic Hours Update', 'The campus clinic is open Mon-Fri 8AM-5PM, Sat 8AM-12PM.', 'general'],
    ];
    for (const [title, content, type] of announcements) {
      await rootConn.query(
        `INSERT INTO nemsu_clinic.announcements (title, content, type, author_id)
         SELECT ?, ?, ?, ? FROM DUAL
         WHERE NOT EXISTS (SELECT 1 FROM nemsu_clinic.announcements WHERE title = ?)`,
        [title, content, type, admin?.id, title]
      );
    }

    const [[doctor]] = await rootConn.query("SELECT id FROM nemsu_clinic.users WHERE username = 'dr.santos'");
    const [[patient1]] = await rootConn.query("SELECT id FROM nemsu_clinic.patients WHERE school_id = '2021-00123'");

    if (doctor?.id && patient1?.id) {
      await rootConn.query(
        `INSERT INTO nemsu_clinic.consultations (patient_id, doctor_id, chief_complaint, diagnosis, treatment_plan, vital_signs)
         SELECT ?, ?, 'Fever and cough', 'Upper Respiratory Tract Infection', 'Rest, fluids, paracetamol', '{"bp":"120/80","pulse":"78","temp":"37.8°C"}'
         FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM nemsu_clinic.consultations WHERE patient_id = ? AND diagnosis = 'Upper Respiratory Tract Infection')`,
        [patient1.id, doctor.id, patient1.id]
      );

      const [[existingConsult]] = await rootConn.query(
        "SELECT id FROM nemsu_clinic.consultations WHERE patient_id = ? LIMIT 1", [patient1.id]
      );
      const consultId = existingConsult?.id;

      const prescriptions = [
        [consultId, patient1.id, doctor.id, 'Paracetamol 500mg', '1 tablet', 'Every 6 hours', '5 days', 'Take after meals'],
        [consultId, patient1.id, doctor.id, 'Amoxicillin 250mg', '1 capsule', 'Every 8 hours', '7 days', 'Complete full course'],
      ];
      for (const pr of prescriptions) {
        await rootConn.query(
          `INSERT INTO nemsu_clinic.prescriptions (consultation_id, patient_id, doctor_id, medication_name, dosage, frequency, duration, instructions)
           SELECT ?, ?, ?, ?, ?, ?, ?, ? FROM DUAL
           WHERE NOT EXISTS (SELECT 1 FROM nemsu_clinic.prescriptions WHERE patient_id = ? AND medication_name = ?)`,
          [...pr, patient1.id, pr[3]]
        );
      }

      await rootConn.query(
        `INSERT INTO nemsu_clinic.lab_requests (consultation_id, patient_id, doctor_id, test_name, test_type, status)
         SELECT ?, ?, ?, 'Complete Blood Count', 'blood', 'pending' FROM DUAL
         WHERE NOT EXISTS (SELECT 1 FROM nemsu_clinic.lab_requests WHERE patient_id = ? AND test_name = 'Complete Blood Count')`,
        [consultId, patient1.id, doctor.id, patient1.id]
      );

      await rootConn.query(
        `INSERT INTO nemsu_clinic.referrals (consultation_id, patient_id, doctor_id, facility_name, specialist, reason, status)
         SELECT ?, ?, ?, 'Caraga Regional Hospital', 'Pulmonologist', 'Persistent cough > 2 weeks', 'pending' FROM DUAL
         WHERE NOT EXISTS (SELECT 1 FROM nemsu_clinic.referrals WHERE patient_id = ? AND facility_name = 'Caraga Regional Hospital')`,
        [consultId, patient1.id, doctor.id, patient1.id]
      );

      await rootConn.query(
        `INSERT INTO nemsu_clinic.appointments (patient_id, doctor_id, visit_date, visit_time, reason, status)
         SELECT ?, ?, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '09:00:00', 'Follow-up checkup', 'confirmed' FROM DUAL
         WHERE NOT EXISTS (SELECT 1 FROM nemsu_clinic.appointments WHERE patient_id = ? AND reason = 'Follow-up checkup')`,
        [patient1.id, doctor.id, patient1.id]
      );
    }

    console.log('Database seeded successfully!');
    console.log('Default login: admin / admin123');
  } finally {
    await rootConn.end();
    process.exit(0);
  }
}

seed().catch(err => { console.error(err); process.exit(1); });
