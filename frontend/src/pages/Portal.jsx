import { useEffect, useState } from 'react';
import {
  User, Calendar, Stethoscope, Pill, FlaskConical, Share2, Bell, Heart
} from 'lucide-react';
import Layout from '../components/Layout';
import NemsuLogo from '../components/NemsuLogo';
import api from '../api/client';
import { Reveal } from '../components/Animated';

const tabs = [
  { id: 'overview', label: 'Overview', icon: Heart },
  { id: 'appointments', label: 'Appointments', icon: Calendar },
  { id: 'consultations', label: 'Consultations', icon: Stethoscope },
  { id: 'prescriptions', label: 'Prescriptions', icon: Pill },
  { id: 'labs', label: 'Lab Results', icon: FlaskConical },
  { id: 'referrals', label: 'Referrals', icon: Share2 },
];

export default function Portal() {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('overview');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/patients/me/portal')
      .then(r => setData(r.data))
      .catch(err => setError(err.response?.data?.error || 'Failed to load portal'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <Layout title="My Health Portal"><div className="text-center py-20 text-slate-400">Loading your records...</div></Layout>;
  }

  if (error || !data) {
    return (
      <Layout title="My Health Portal">
        <div className="glass rounded-2xl p-8 text-center max-w-lg mx-auto">
          <NemsuLogo size="lg" className="mx-auto mb-4" />
          <p className="text-slate-600">{error || 'No patient profile found.'}</p>
          <p className="text-sm text-slate-400 mt-2">Ask clinic staff to link your account to a patient record.</p>
        </div>
      </Layout>
    );
  }

  const { profile, appointments, consultations, prescriptions, labs, referrals, notifications } = data;

  return (
    <Layout title="My Health Portal">
      <Reveal>
        <div className="glass rounded-2xl p-6 mb-6 flex flex-col sm:flex-row gap-5 items-start sm:items-center">
          <NemsuLogo size="xl" className="!w-16 !h-16" />
          <div className="flex-1">
            <h2 className="font-display text-xl font-semibold text-[#0B3D91] tracking-tight">{profile.full_name || 'Patient'}</h2>
            <p className="text-sm text-slate-500 mt-1">
              ID: <span className="font-medium text-slate-700">{profile.school_id}</span>
              {' · '}
              <span className="capitalize">{profile.patient_type}</span>
              {profile.blood_type && <> · Blood type: <span className="font-medium text-[#C9A227]">{profile.blood_type}</span></>}
            </p>
            <p className="text-xs text-slate-400 mt-1">{profile.email}{profile.phone ? ` · ${profile.phone}` : ''}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="badge badge-completed">{appointments?.length || 0} visits</span>
            <span className="badge badge-pending">{prescriptions?.filter(p => p.status === 'active').length || 0} active Rx</span>
          </div>
        </div>
      </Reveal>

      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm transition-all ${
              tab === t.id
                ? 'bg-[#0B3D91]/10 text-[#0B3D91] border border-[#0B3D91]/20 font-medium'
                : 'text-slate-500 hover:bg-blue-50'
            }`}
          >
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <Reveal>
            <div className="glass rounded-2xl p-6">
              <h3 className="font-semibold text-[#0B3D91] mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-[#C9A227]" /> Health Profile
              </h3>
              <dl className="space-y-3 text-sm">
                {[
                  ['Birth date', profile.birth_date || '—'],
                  ['Gender', profile.gender || '—'],
                  ['Blood type', profile.blood_type || '—'],
                  ['Allergies', profile.allergies || 'None recorded'],
                  ['Emergency contact', profile.emergency_contact || '—'],
                  ['Emergency phone', profile.emergency_phone || '—'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 border-b border-blue-50 pb-2">
                    <dt className="text-slate-500">{k}</dt>
                    <dd className="text-slate-800 font-medium text-right capitalize">{v}</dd>
                  </div>
                ))}
              </dl>
              {profile.medical_history && (
                <div className="mt-4 p-3 rounded-xl bg-blue-50/80 text-sm text-slate-600">
                  <p className="text-xs text-[#0B3D91] font-semibold mb-1">Medical history</p>
                  {profile.medical_history}
                </div>
              )}
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="glass rounded-2xl p-6">
              <h3 className="font-semibold text-[#0B3D91] mb-4 flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#C9A227]" /> Recent Notices
              </h3>
              {notifications?.length ? (
                <div className="space-y-3">
                  {notifications.slice(0, 5).map(n => (
                    <div key={n.id} className="p-3 rounded-xl bg-blue-50/60 border border-blue-100">
                      <p className="text-sm font-medium text-slate-800">{n.subject || n.type}</p>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{n.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">No notifications yet</p>
              )}
            </div>
          </Reveal>
        </div>
      )}

      {tab === 'appointments' && (
        <Reveal>
          <div className="glass rounded-2xl overflow-hidden">
            <div className="table-wrap">
              <table>
                <thead><tr><th>Date</th><th>Time</th><th>Doctor</th><th>Reason</th><th>Status</th></tr></thead>
                <tbody>
                  {appointments.map(a => (
                    <tr key={a.id}>
                      <td>{a.visit_date}</td>
                      <td>{String(a.visit_time).slice(0, 5)}</td>
                      <td>{a.doctor_name || '—'}</td>
                      <td className="text-slate-500">{a.reason || '—'}</td>
                      <td><span className={`badge badge-${a.status}`}>{a.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!appointments.length && <p className="text-center text-slate-400 py-10">No appointments yet</p>}
            </div>
          </div>
        </Reveal>
      )}

      {tab === 'consultations' && (
        <Reveal>
          <div className="space-y-3">
            {consultations.map(c => (
              <div key={c.id} className="glass rounded-xl p-5">
                <div className="flex justify-between gap-3 mb-2">
                  <p className="font-medium text-[#0B3D91]">{c.diagnosis || 'Consultation'}</p>
                  <span className="text-xs text-slate-400">{new Date(c.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-slate-600"><span className="text-slate-400">Complaint:</span> {c.chief_complaint || '—'}</p>
                <p className="text-sm text-slate-600 mt-1"><span className="text-slate-400">Plan:</span> {c.treatment_plan || '—'}</p>
                <p className="text-xs text-slate-400 mt-2">Dr. {c.doctor_name}</p>
              </div>
            ))}
            {!consultations.length && <p className="text-center text-slate-400 py-10">No consultations yet</p>}
          </div>
        </Reveal>
      )}

      {tab === 'prescriptions' && (
        <Reveal>
          <div className="glass rounded-2xl overflow-hidden">
            <div className="table-wrap">
              <table>
                <thead><tr><th>Medication</th><th>Dosage</th><th>Frequency</th><th>Duration</th><th>Status</th></tr></thead>
                <tbody>
                  {prescriptions.map(p => (
                    <tr key={p.id}>
                      <td className="font-medium">{p.medication_name}</td>
                      <td>{p.dosage || '—'}</td>
                      <td>{p.frequency || '—'}</td>
                      <td>{p.duration || '—'}</td>
                      <td><span className={`badge badge-${p.status}`}>{p.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!prescriptions.length && <p className="text-center text-slate-400 py-10">No prescriptions yet</p>}
            </div>
          </div>
        </Reveal>
      )}

      {tab === 'labs' && (
        <Reveal>
          <div className="space-y-3">
            {labs.map(l => (
              <div key={l.id} className="glass rounded-xl p-5">
                <div className="flex justify-between gap-3 mb-2">
                  <p className="font-medium text-[#0B3D91]">{l.test_name}</p>
                  <span className={`badge badge-${l.status}`}>{l.status}</span>
                </div>
                <p className="text-xs text-slate-400 capitalize mb-2">{l.test_type} · {l.doctor_name}</p>
                {l.results ? (
                  <p className="text-sm text-slate-600 p-3 rounded-lg bg-blue-50/80">{l.results}</p>
                ) : (
                  <p className="text-sm text-slate-400">Results pending</p>
                )}
              </div>
            ))}
            {!labs.length && <p className="text-center text-slate-400 py-10">No lab requests yet</p>}
          </div>
        </Reveal>
      )}

      {tab === 'referrals' && (
        <Reveal>
          <div className="space-y-3">
            {referrals.map(r => (
              <div key={r.id} className="glass rounded-xl p-5">
                <div className="flex justify-between gap-3 mb-2">
                  <p className="font-medium text-[#0B3D91]">{r.facility_name}</p>
                  <span className={`badge badge-${r.status}`}>{r.status}</span>
                </div>
                <p className="text-sm text-slate-600">{r.specialist || 'Specialist'} · {r.reason || '—'}</p>
                <p className="text-xs text-slate-400 mt-2">Referred by {r.doctor_name}</p>
              </div>
            ))}
            {!referrals.length && <p className="text-center text-slate-400 py-10">No referrals yet</p>}
          </div>
        </Reveal>
      )}
    </Layout>
  );
}
