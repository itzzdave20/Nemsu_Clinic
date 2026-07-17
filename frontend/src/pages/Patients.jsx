import { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import Layout from '../components/Layout';
import api from '../api/client';
import { Reveal } from '../components/Animated';

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ school_id: '', patient_type: 'student', birth_date: '', gender: '', blood_type: '', allergies: '' });
  const [msg, setMsg] = useState('');

  const load = () => api.get('/patients').then(r => setPatients(r.data));
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/patients', form);
      setMsg('Patient registered successfully');
      setShowForm(false);
      setForm({ school_id: '', patient_type: 'student', birth_date: '', gender: '', blood_type: '', allergies: '' });
      load();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Failed to register');
    }
  };

  return (
    <Layout title="Patient Management">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-sm text-slate-500 leading-relaxed">
            Digital patient registry for students, faculty, and staff at Cantilan Campus.
          </p>
          <p className="text-xs text-slate-400 mt-1">{patients.length} registered records</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">
          {showForm ? <><X className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> Register Patient</>}
        </button>
      </div>

      {msg && <div className="mb-4 p-3 rounded-xl bg-[#0B3D91]/10 border border-[#0B3D91]/20 text-[#0B3D91] text-sm">{msg}</div>}

      {showForm && (
        <Reveal>
          <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 mb-6 grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label-text">School ID *</label>
              <input className="input-field" required value={form.school_id} onChange={e => setForm({ ...form, school_id: e.target.value })} />
            </div>
            <div>
              <label className="label-text">Type *</label>
              <select className="input-field" value={form.patient_type} onChange={e => setForm({ ...form, patient_type: e.target.value })}>
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
                <option value="staff">Staff</option>
              </select>
            </div>
            <div>
              <label className="label-text">Birth Date</label>
              <input type="date" className="input-field" value={form.birth_date} onChange={e => setForm({ ...form, birth_date: e.target.value })} />
            </div>
            <div>
              <label className="label-text">Gender</label>
              <select className="input-field" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="label-text">Blood Type</label>
              <input className="input-field" value={form.blood_type} onChange={e => setForm({ ...form, blood_type: e.target.value })} placeholder="O+" />
            </div>
            <div>
              <label className="label-text">Allergies</label>
              <input className="input-field" value={form.allergies} onChange={e => setForm({ ...form, allergies: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <button type="submit" className="btn-primary">Save Patient</button>
            </div>
          </form>
        </Reveal>
      )}

      <Reveal>
        <div className="glass rounded-2xl overflow-hidden">
          <div className="table-wrap">
            <table>
              <thead><tr><th>School ID</th><th>Type</th><th>Gender</th><th>Blood</th><th>Allergies</th></tr></thead>
              <tbody>
                {patients.map(p => (
                  <tr key={p.id}>
                    <td className="font-medium">{p.school_id}</td>
                    <td className="capitalize">{p.patient_type}</td>
                    <td className="capitalize">{p.gender || '—'}</td>
                    <td>{p.blood_type || '—'}</td>
                    <td className="text-slate-500">{p.allergies || 'None'}</td>
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
