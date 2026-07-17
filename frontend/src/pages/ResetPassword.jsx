import { useMemo, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import api from '../api/client';
import { FloatingOrb } from '../components/Animated';
import NemsuLogo from '../components/NemsuLogo';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = useMemo(() => params.get('token') || '', [params]);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!token) {
      setError('Missing reset token. Request a new password reset link.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password, confirm_password: confirm });
      setDone(true);
      setTimeout(() => navigate('/login'), 2200);
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen mesh-bg flex items-center justify-center p-4 relative overflow-hidden">
      <FloatingOrb className="w-80 h-80 bg-[#0B3D91]/15 -top-16 -left-16" />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative z-10">
        <div className="text-center mb-7">
          <Link to="/" className="inline-flex mb-4"><NemsuLogo size="lg" /></Link>
          <h1 className="font-display text-3xl font-semibold text-[#0B3D91]">Set a new password</h1>
          <p className="text-slate-500 text-sm mt-2">Choose a strong password for your HealthHub account.</p>
        </div>

        <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 sm:p-8 space-y-5">
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
            </div>
          )}
          {done && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-[#0B3D91]/8 border border-[#0B3D91]/15 text-[#0B3D91] text-sm">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> Password updated. Redirecting to sign in…
            </div>
          )}

          {!done && (
            <>
              <div>
                <label className="label-text">New password</label>
                <div className="relative">
                  <input className="input-field pr-10" type={showPass ? 'text' : 'password'} required minLength={6} value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 6 characters" />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="label-text">Confirm new password</label>
                <input className="input-field" type={showPass ? 'text' : 'password'} required value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Re-enter password" />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
                {loading ? 'Updating…' : 'Update password'}
              </button>
            </>
          )}

          <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#0B3D91]">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
          </Link>
        </form>
      </motion.div>
    </div>
  );
}
