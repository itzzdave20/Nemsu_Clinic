import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';
import { FloatingOrb } from '../components/Animated';
import NemsuLogo from '../components/NemsuLogo';

export default function Register() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    full_name: '', username: '', email: '', phone: '',
    school_id: '', patient_type: 'student', birth_date: '', gender: '',
    password: '', confirm_password: '',
  });

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm_password) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', form);
      setAuth(data.token, data.user);
      navigate('/portal');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen mesh-bg flex items-center justify-center p-4 py-10 relative overflow-hidden">
      <FloatingOrb className="w-96 h-96 bg-[#0B3D91]/12 -top-24 -left-24" />
      <FloatingOrb className="w-72 h-72 bg-[#C9A227]/15 bottom-0 right-0" delay={2} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl relative z-10"
      >
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex mb-4"><NemsuLogo size="lg" /></Link>
          <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#C9A227] mb-2">Patient Registration</p>
          <h1 className="font-display text-3xl font-semibold text-[#0B3D91]">Create your HealthHub account</h1>
          <p className="text-slate-500 text-sm mt-2">Register as a student, faculty, or staff member of NEMSU Cantilan.</p>
        </div>

        <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 sm:p-8 space-y-5">
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label-text">Full name *</label>
              <input className="input-field" required value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="Juan Dela Cruz" />
            </div>
            <div>
              <label className="label-text">Username *</label>
              <input className="input-field" required value={form.username} onChange={e => set('username', e.target.value)} placeholder="juan.delacruz" />
            </div>
            <div>
              <label className="label-text">School / Employee ID *</label>
              <input className="input-field" required value={form.school_id} onChange={e => set('school_id', e.target.value)} placeholder="2024-00123" />
            </div>
            <div>
              <label className="label-text">Email *</label>
              <input type="email" className="input-field" required value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@student.nemsu.edu.ph" />
            </div>
            <div>
              <label className="label-text">Phone</label>
              <input className="input-field" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="09xxxxxxxxx" />
            </div>
            <div>
              <label className="label-text">Patient type *</label>
              <select className="input-field" value={form.patient_type} onChange={e => set('patient_type', e.target.value)}>
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
                <option value="staff">Staff</option>
              </select>
            </div>
            <div>
              <label className="label-text">Gender</label>
              <select className="input-field" value={form.gender} onChange={e => set('gender', e.target.value)}>
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="label-text">Birth date</label>
              <input type="date" className="input-field" value={form.birth_date} onChange={e => set('birth_date', e.target.value)} />
            </div>
            <div>
              <label className="label-text">Password *</label>
              <div className="relative">
                <input className="input-field pr-10" type={showPass ? 'text' : 'password'} required minLength={6} value={form.password} onChange={e => set('password', e.target.value)} placeholder="At least 6 characters" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="label-text">Confirm password *</label>
              <input className="input-field" type={showPass ? 'text' : 'password'} required value={form.confirm_password} onChange={e => set('confirm_password', e.target.value)} placeholder="Re-enter password" />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
            {loading ? 'Creating account…' : <><CheckCircle2 className="w-4 h-4" /> Create account</>}
          </button>

          <p className="text-center text-sm text-slate-500">
            Already registered? <Link to="/login" className="font-semibold text-[#0B3D91] hover:underline">Sign in</Link>
          </p>
        </form>

        <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-slate-500 mt-5 hover:text-[#0B3D91]">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
        </Link>
      </motion.div>
    </div>
  );
}
