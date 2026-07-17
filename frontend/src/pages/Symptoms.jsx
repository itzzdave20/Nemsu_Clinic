import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Send, Sparkles } from 'lucide-react';
import Layout from '../components/Layout';
import api from '../api/client';
import { Reveal } from '../components/Animated';

export default function Symptoms() {
  const [symptoms, setSymptoms] = useState('');
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadHistory = () => api.get('/symptoms/history').then(r => setHistory(r.data)).catch(() => {});

  const handleCheck = async (e) => {
    e.preventDefault();
    if (!symptoms.trim()) return;
    setLoading(true);
    try {
      const { data } = await api.post('/symptoms/check', { symptoms });
      setResult(data);
      loadHistory();
    } catch (err) {
      setResult({ error: err.response?.data?.error || 'Check failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="AI Symptom Triage">
      <p className="text-sm text-slate-500 mb-6 leading-relaxed max-w-2xl">
        Guided triage for campus patients — describe symptoms to receive an urgency assessment and care guidance.
        This does not replace a clinician’s evaluation.
      </p>
      <div className="grid lg:grid-cols-2 gap-6">
        <Reveal>
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#0B3D91]/10 flex items-center justify-center">
                <Brain className="w-5 h-5 text-[#0B3D91]" />
              </div>
              <div>
                <h3 className="section-title">Symptom checker</h3>
                <p className="text-xs text-slate-500 mt-0.5">Be specific about onset, severity, and duration</p>
              </div>
            </div>

            <form onSubmit={handleCheck}>
              <label className="label-text">Your symptoms</label>
              <textarea
                className="input-field mb-4"
                rows={5}
                placeholder="e.g. Persistent cough, mild fever, and body aches for 2 days…"
                value={symptoms}
                onChange={e => setSymptoms(e.target.value)}
              />
              <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
                {loading ? 'Analyzing…' : <><Sparkles className="w-4 h-4" /> Analyze symptoms</>}
              </button>
            </form>

            <AnimatePresence>
              {result?.error && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-sm text-rose-600">{result.error}</motion.p>
              )}
              {result && !result.error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-5 rounded-xl bg-[#0B3D91]/8 border border-[#0B3D91]/20"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`badge badge-${result.urgency_level}`}>{result.urgency_level} urgency</span>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">{result.ai_assessment}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="glass rounded-2xl p-6">
            <h3 className="section-title mb-4 flex items-center gap-2">
              <Send className="w-4 h-4 text-[#1A6FBF]" /> Assessment history
            </h3>
            {history.length ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {history.map(h => (
                  <div key={h.id} className="p-4 rounded-xl bg-blue-50/60 border border-blue-100">
                    <p className="text-sm text-slate-700 mb-2 leading-relaxed">{h.symptoms}</p>
                    <div className="flex items-center justify-between">
                      <span className={`badge badge-${h.urgency_level}`}>{h.urgency_level}</span>
                      <span className="text-xs text-slate-500">{new Date(h.created_at).toLocaleDateString('en-PH')}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-10">No assessments yet. Try the symptom checker.</p>
            )}
          </div>
        </Reveal>
      </div>
    </Layout>
  );
}
