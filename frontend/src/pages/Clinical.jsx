import { useEffect, useState } from 'react';
import { Pill, FlaskConical, Share2, Plus } from 'lucide-react';
import Layout from '../components/Layout';
import api from '../api/client';
import { Reveal } from '../components/Animated';
import { useAuthStore } from '../store/authStore';

const tabs = [
  { id: 'prescriptions', label: 'Prescriptions', icon: Pill },
  { id: 'labs', label: 'Lab Requests', icon: FlaskConical },
  { id: 'referrals', label: 'Referrals', icon: Share2 },
];

const statusBadge = (status) => `badge badge-${status === 'in_progress' ? 'confirmed' : status === 'sent' ? 'confirmed' : status === 'active' ? 'completed' : status}`;

export default function Clinical() {
  const { user } = useAuthStore();
  const isStaff = ['admin', 'doctor'].includes(user?.role);
  const canEditLabs = ['admin', 'doctor', 'nurse'].includes(user?.role);
  const [tab, setTab] = useState('prescriptions');
  const [items, setItems] = useState([]);
  const [patients, setPatients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({});
  const [msg, setMsg] = useState('');

  const endpoints = { prescriptions: '/prescriptions', labs: '/labs', referrals: '/referrals' };

  const load = () => api.get(endpoints[tab]).then(r => setItems(r.data));
  useEffect(() => { load(); setShowForm(false); setForm({}); }, [tab]);
  useEffect(() => { if (isStaff) api.get('/patients').then(r => setPatients(r.data)); }, [isStaff]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      await api.post(endpoints[tab], form);
      setMsg('Record created successfully');
      setShowForm(false);
      setForm({});
      load();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Failed to save');
    }
  };

  const updateStatus = async (id, status, extra = {}) => {
    if (tab === 'labs') await api.patch(`/labs/${id}`, { status, ...extra });
    else if (tab === 'prescriptions') await api.patch(`/prescriptions/${id}/status`, { status });
    else await api.patch(`/referrals/${id}/status`, { status });
    load();
  };

  const renderForm = () => {
    if (!isStaff) return null;
    const patientSelect = (
      <div>
        <label className="label-text">Patient *</label>
        <select className="input-field" required value={form.patient_id || ''} onChange={e => setForm({ ...form, patient_id: e.target.value })}>
          <option value="">Select patient</option>
          {patients.map(p => <option key={p.id} value={p.id}>{p.school_id}</option>)}
        </select>
      </div>
    );

    if (tab === 'prescriptions') return (
      <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 mb-6 grid sm:grid-cols-2 gap-4">
        {patientSelect}
        <div><label className="label-text">Medication *</label>
          <input className="input-field" required value={form.medication_name || ''} onChange={e => setForm({ ...form, medication_name: e.target.value })} /></div>
        <div><label className="label-text">Dosage</label>
          <input className="input-field" value={form.dosage || ''} onChange={e => setForm({ ...form, dosage: e.target.value })} placeholder="1 tablet" /></div>
        <div><label className="label-text">Frequency</label>
          <input className="input-field" value={form.frequency || ''} onChange={e => setForm({ ...form, frequency: e.target.value })} placeholder="Every 8 hours" /></div>
        <div><label className="label-text">Duration</label>
          <input className="input-field" value={form.duration || ''} onChange={e => setForm({ ...form, duration: e.target.value })} placeholder="7 days" /></div>
        <div className="sm:col-span-2"><label className="label-text">Instructions</label>
          <textarea className="input-field" rows={2} value={form.instructions || ''} onChange={e => setForm({ ...form, instructions: e.target.value })} /></div>
        <button type="submit" className="btn-primary sm:col-span-2">Issue prescription</button>
      </form>
    );

    if (tab === 'labs') return (
      <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 mb-6 grid sm:grid-cols-2 gap-4">
        {patientSelect}
        <div><label className="label-text">Test name *</label>
          <input className="input-field" required value={form.test_name || ''} onChange={e => setForm({ ...form, test_name: e.target.value })} /></div>
        <div><label className="label-text">Type</label>
          <select className="input-field" value={form.test_type || 'blood'} onChange={e => setForm({ ...form, test_type: e.target.value })}>
            <option value="blood">Blood</option><option value="urine">Urine</option><option value="imaging">Imaging</option><option value="other">Other</option>
          </select></div>
        <div className="sm:col-span-2"><label className="label-text">Notes</label>
          <input className="input-field" value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
        <button type="submit" className="btn-primary sm:col-span-2">Request lab test</button>
      </form>
    );

    return (
      <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 mb-6 grid sm:grid-cols-2 gap-4">
        {patientSelect}
        <div><label className="label-text">Facility *</label>
          <input className="input-field" required value={form.facility_name || ''} onChange={e => setForm({ ...form, facility_name: e.target.value })} /></div>
        <div><label className="label-text">Specialist</label>
          <input className="input-field" value={form.specialist || ''} onChange={e => setForm({ ...form, specialist: e.target.value })} /></div>
        <div className="sm:col-span-2"><label className="label-text">Reason</label>
          <textarea className="input-field" rows={2} value={form.reason || ''} onChange={e => setForm({ ...form, reason: e.target.value })} /></div>
        <button type="submit" className="btn-primary sm:col-span-2">Create referral</button>
      </form>
    );
  };

  return (
    <Layout title="Clinical Records">
      <p className="text-sm text-slate-500 mb-5 leading-relaxed max-w-2xl">
        Prescriptions, laboratory requests, and external referrals for coordinated campus care.
      </p>
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all ${
              tab === t.id ? 'bg-[#0B3D91]/10 text-[#0B3D91] border border-[#0B3D91]/20 font-medium' : 'text-slate-500 hover:bg-blue-50'
            }`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
        {isStaff && (
          <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm ml-auto">
            <Plus className="w-4 h-4" /> New
          </button>
        )}
      </div>

      {msg && <div className="mb-4 p-3 rounded-xl bg-[#0B3D91]/10 border border-[#0B3D91]/20 text-[#0B3D91] text-sm">{msg}</div>}
      {showForm && <Reveal>{renderForm()}</Reveal>}

      <Reveal>
        <div className="glass rounded-2xl overflow-hidden">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Patient</th>
                  {tab === 'prescriptions' && <><th>Medication</th><th>Dosage</th><th>Frequency</th><th>Status</th></>}
                  {tab === 'labs' && <><th>Test</th><th>Type</th><th>Status</th><th>Results</th></>}
                  {tab === 'referrals' && <><th>Facility</th><th>Specialist</th><th>Reason</th><th>Status</th></>}
                  <th>Doctor</th>
                  {(isStaff || canEditLabs) && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td className="font-medium">{item.school_id}</td>
                    {tab === 'prescriptions' && (
                      <>
                        <td>{item.medication_name}</td>
                        <td>{item.dosage || '—'}</td>
                        <td>{item.frequency || '—'}</td>
                        <td><span className={statusBadge(item.status)}>{item.status}</span></td>
                      </>
                    )}
                    {tab === 'labs' && (
                      <>
                        <td>{item.test_name}</td>
                        <td className="capitalize">{item.test_type}</td>
                        <td><span className={statusBadge(item.status)}>{item.status}</span></td>
                        <td className="text-slate-500 max-w-[150px] truncate">{item.results || '—'}</td>
                      </>
                    )}
                    {tab === 'referrals' && (
                      <>
                        <td>{item.facility_name}</td>
                        <td>{item.specialist || '—'}</td>
                        <td className="text-slate-500 max-w-[150px] truncate">{item.reason || '—'}</td>
                        <td><span className={statusBadge(item.status)}>{item.status}</span></td>
                      </>
                    )}
                    <td className="text-slate-500">{item.doctor_name}</td>
                    {(isStaff || canEditLabs) && (
                      <td className="space-x-2">
                        {tab === 'prescriptions' && item.status === 'active' && isStaff && (
                          <button onClick={() => updateStatus(item.id, 'completed')} className="text-xs text-[#0B3D91] hover:underline">Complete</button>
                        )}
                        {tab === 'labs' && item.status === 'pending' && canEditLabs && (
                          <button onClick={() => updateStatus(item.id, 'in_progress')} className="text-xs text-[#1A6FBF] hover:underline">Start</button>
                        )}
                        {tab === 'labs' && item.status === 'in_progress' && canEditLabs && (
                          <button onClick={() => {
                            const results = prompt('Enter lab results:');
                            if (results) updateStatus(item.id, 'completed', { results });
                          }} className="text-xs text-[#0B3D91] hover:underline">Add Results</button>
                        )}
                        {tab === 'referrals' && item.status === 'pending' && isStaff && (
                          <button onClick={() => updateStatus(item.id, 'sent')} className="text-xs text-[#1A6FBF] hover:underline">Mark Sent</button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {!items.length && <p className="text-center text-slate-400 py-12 text-sm">No {tab} on file yet</p>}
          </div>
        </div>
      </Reveal>
    </Layout>
  );
}
