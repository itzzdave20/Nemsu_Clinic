import { useEffect, useState } from 'react';
import { Plus, Bell } from 'lucide-react';
import Layout from '../components/Layout';
import api from '../api/client';
import { Reveal } from '../components/Animated';
import { useAuthStore } from '../store/authStore';

export default function Appointments() {
  const { user } = useAuthStore();
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ patient_id: '', visit_date: '', visit_time: '', reason: '' });
  const isStaff = ['admin', 'doctor', 'nurse'].includes(user?.role);

  const load = () => api.get('/appointments').then(r => setAppointments(r.data));
  useEffect(() => {
    load();
    if (isStaff) api.get('/patients').then(r => setPatients(r.data));
  }, [isStaff]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post('/appointments', form);
    setShowForm(false);
    load();
  };

  const updateStatus = async (id, status) => {
    await api.patch(`/appointments/${id}/status`, { status });
    load();
  };

  const sendReminder = async (id) => {
    await api.post(`/notifications/remind/${id}`, { channel: 'in_app' });
    alert('Reminder sent to patient');
  };

  return (
    <Layout title="Appointments">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-sm text-slate-500 leading-relaxed">
            Schedule and manage clinic visits with status tracking and patient reminders.
          </p>
          <p className="text-xs text-slate-400 mt-1">{appointments.length} total appointments</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">
          <Plus className="w-4 h-4" /> Book Appointment
        </button>
      </div>

      {showForm && (
        <Reveal>
          <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 mb-6 grid sm:grid-cols-2 gap-4">
            {isStaff && (
              <div>
                <label className="label-text">Patient</label>
                <select className="input-field" required value={form.patient_id} onChange={e => setForm({ ...form, patient_id: e.target.value })}>
                  <option value="">Select patient</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.school_id} ({p.patient_type})</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="label-text">Date</label>
              <input type="date" className="input-field" required value={form.visit_date} onChange={e => setForm({ ...form, visit_date: e.target.value })} />
            </div>
            <div>
              <label className="label-text">Time</label>
              <input type="time" className="input-field" required value={form.visit_time} onChange={e => setForm({ ...form, visit_time: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="label-text">Reason</label>
              <input className="input-field" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} />
            </div>
            <button type="submit" className="btn-primary sm:col-span-2">Book</button>
          </form>
        </Reveal>
      )}

      <Reveal>
        <div className="glass rounded-2xl overflow-hidden">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Patient</th><th>Date</th><th>Time</th><th>Reason</th><th>Status</th>{isStaff && <th>Action</th>}</tr></thead>
              <tbody>
                {appointments.map(a => (
                  <tr key={a.id}>
                    <td>{a.school_id}</td>
                    <td>{a.visit_date}</td>
                    <td>{a.visit_time?.slice(0, 5)}</td>
                    <td className="text-slate-500">{a.reason || '—'}</td>
                    <td><span className={`badge badge-${a.status}`}>{a.status}</span></td>
                    {isStaff && (
                      <td className="space-x-2 whitespace-nowrap">
                        {a.status === 'pending' && (
                          <button onClick={() => updateStatus(a.id, 'confirmed')} className="text-xs text-[#0B3D91] hover:underline">Confirm</button>
                        )}
                        {a.status === 'confirmed' && (
                          <>
                            <button onClick={() => updateStatus(a.id, 'completed')} className="text-xs text-[#1A6FBF] hover:underline">Complete</button>
                            <button onClick={() => sendReminder(a.id)} className="text-xs text-[#C9A227] hover:underline ml-2 inline-flex items-center gap-1">
                              <Bell className="w-3 h-3" /> Remind
                            </button>
                          </>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Reveal>
    </Layout>
  );
}
