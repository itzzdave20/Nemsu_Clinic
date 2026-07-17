import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, ArrowLeft, Mail } from 'lucide-react';
import api from '../api/client';
import { FloatingOrb } from '../components/Animated';
import NemsuLogo from '../components/NemsuLogo';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen mesh-bg flex items-center justify-center p-4 relative overflow-hidden">
      <FloatingOrb className="w-80 h-80 bg-[#0B3D91]/15 -top-20 -left-20" />
      <FloatingOrb className="w-64 h-64 bg-[#C9A227]/15 bottom-10 right-0" delay={2} />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative z-10">
        <div className="text-center mb-7">
          <Link to="/" className="inline-flex mb-4"><NemsuLogo size="lg" /></Link>
          <h1 className="font-display text-3xl font-semibold text-[#0B3D91]">Forgot password</h1>
          <p className="text-slate-500 text-sm mt-2 leading-relaxed">
            Enter the email on your HealthHub account and we’ll send reset instructions.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 sm:p-8 space-y-5">
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
            </div>
          )}

          {result ? (
            <div className="space-y-4">
              <div className="flex items-start gap-2 p-3 rounded-xl bg-[#0B3D91]/8 border border-[#0B3D91]/15 text-[#0B3D91] text-sm leading-relaxed">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{result.message}</span>
              </div>
              {result.resetUrl && (
                <div className="p-3 rounded-xl bg-[#FFF8E7] border border-[#C9A227]/30 text-sm">
                  <p className="text-xs font-semibold text-[#A8861A] mb-2">{result.notice}</p>
                  <Link to={result.resetUrl.replace(/^https?:\/\/[^/]+/, '')} className="text-[#0B3D91] font-medium break-all hover:underline">
                    Continue to reset password
                  </Link>
                </div>
              )}
              {result.emailed && (
                <p className="text-xs text-slate-500">Check your inbox (and spam folder) for the reset email.</p>
              )}
            </div>
          ) : (
            <>
              <div>
                <label className="label-text">Email address</label>
                <input type="email" className="input-field" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@student.nemsu.edu.ph" />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
                {loading ? 'Sending…' : <><Mail className="w-4 h-4" /> Send reset link</>}
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
