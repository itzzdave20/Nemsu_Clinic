import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';
import { FloatingOrb } from '../components/Animated';
import NemsuLogo from '../components/NemsuLogo';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { username, password });
      setAuth(data.token, data.user);
      navigate(data.user.role === 'patient' ? '/portal' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen mesh-bg flex items-center justify-center p-4 relative overflow-hidden">
      <FloatingOrb className="w-96 h-96 bg-[#0B3D91]/15 -top-32 -left-32" />
      <FloatingOrb className="w-80 h-80 bg-[#C9A227]/20 bottom-0 right-0" delay={3} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-7">
          <Link to="/" className="inline-flex flex-col items-center gap-3 mb-5">
            <NemsuLogo size="xl" className="!w-[4.5rem] !h-[4.5rem] shadow-lg" />
          </Link>
          <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#C9A227] mb-2">
            NEMSU Cantilan Campus
          </p>
          <h1 className="font-display text-3xl font-semibold text-[#0B3D91] tracking-tight">
            Sign in to HealthHub
          </h1>
          <p className="text-slate-500 text-sm mt-2 leading-relaxed">
            Access clinic services securely with your campus account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 sm:p-8 space-y-5">
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
            </div>
          )}

          <div>
            <label className="label-text">Username or email</label>
            <input
              className="input-field"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="e.g. student.juan"
              autoComplete="username"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="label-text !mb-0">Password</label>
              <Link to="/forgot-password" className="text-xs font-medium text-[#1A6FBF] hover:text-[#0B3D91]">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                className="input-field pr-10"
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0B3D91]" aria-label="Toggle password">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
            {loading ? 'Signing in…' : <>Sign in <ArrowRight className="w-4 h-4" /></>}
          </button>

          <p className="text-center text-sm text-slate-500 pt-1">
            New to the clinic?{' '}
            <Link to="/register" className="font-semibold text-[#0B3D91] hover:underline">Create an account</Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
}
