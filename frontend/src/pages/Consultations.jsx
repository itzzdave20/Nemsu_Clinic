import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import Layout from '../components/Layout';
import api from '../api/client';
import { Reveal } from '../components/Animated';

export default function Consultations() {
  const [consultations, setConsultations] = useState([]);
  const [patients, setPatients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ patient_id: '', chief_complaint: '', diagnosis: '', treatment_plan: '', bp: '', pulse: '', temp: '' });

  const load = () => api.get('/consultations').then(r => setConsultations(r.data));
  useEffect(() => {
    load();
    api.get('/patients').then(r => setPatients(r.data));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post('/consultations', {
      patient_id: form.patient_id,
      chief_complaint: form.chief_complaint,
      diagnosis: form.diagnosis,
      treatment_plan: form.treatment_plan,
      vital_signs: { bp: form.bp, pulse: form.pulse, temp: form.temp },
    });
    setShowForm(false);
    load();
  };

  return (
    <Layout title="Consultations">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-sm text-slate-500 leading-relaxed">
            Document encounters, vital signs, diagnoses, and treatment plans.
          </p>
          <p className="text-xs text-slate-400 mt-1">{consultations.length} consultation records</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">
          <Plus className="w-4 h-4" /> New Consultation
        </button>
      </div>

      {showForm && (
        <Reveal>
          <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 mb-6 grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label-text">Patient</label>
              <select className="input-field" required value={form.patient_id} onChange={e => setForm({ ...form, patient_id: e.target.value })}>
                <option value="">Select patient</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.school_id}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="label-text">Chief complaint</label>
              <textarea className="input-field" rows={2} value={form.chief_complaint} onChange={e => setForm({ ...form, chief_complaint: e.target.value })} placeholder="Primary reason for visit" />
            </div>
            <div>
              <label className="label-text">Blood pressure</label>
              <input className="input-field" placeholder="120/80" value={form.bp} onChange={e => setForm({ ...form, bp: e.target.value })} />
            </div>
            <div>
              <label className="label-text">Pulse</label>
              <input className="input-field" placeholder="72 bpm" value={form.pulse} onChange={e => setForm({ ...form, pulse: e.target.value })} />
            </div>
            <div>
              <label className="label-text">Temperature</label>
              <input className="input-field" placeholder="36.5°C" value={form.temp} onChange={e => setForm({ ...form, temp: e.target.value })} />
            </div>
            <div>
              <label className="label-text">Diagnosis</label>
              <input className="input-field" value={form.diagnosis} onChange={e => setForm({ ...form, diagnosis: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="label-text">Treatment plan</label>
              <textarea className="input-field" rows={2} value={form.treatment_plan} onChange={e => setForm({ ...form, treatment_plan: e.target.value })} />
            </div>
            <button type="submit" className="btn-primary sm:col-span-2">Save consultation</button>
          </form>
        </Reveal>
      )}

      <Reveal>
        <div className="glass rounded-2xl overflow-hidden">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Patient</th><th>Doctor</th><th>Complaint</th><th>Diagnosis</th><th>Date</th></tr></thead>
              <tbody>
                {consultations.map(c => (
                  <tr key={c.id}>
                    <td>{c.school_id}</td>
                    <td>{c.doctor_name}</td>
                    <td className="text-slate-500 max-w-[200px] truncate">{c.chief_complaint || '—'}</td>
                    <td>{c.diagnosis || '—'}</td>
                    <td className="text-slate-500">{new Date(c.created_at).toLocaleDateString('en-PH')}</td>
                  </tr>
                ))}
                {!consultations.length && (
                  <tr><td colSpan={5} className="text-center text-slate-400 py-12 text-sm">No consultations recorded yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Reveal>
    </Layout>
  );
}
