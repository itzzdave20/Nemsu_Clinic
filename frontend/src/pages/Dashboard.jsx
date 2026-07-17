import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Calendar, Stethoscope, AlertTriangle, TrendingUp, Pill, FlaskConical } from 'lucide-react';
import Layout from '../components/Layout';
import api from '../api/client';
import { Reveal } from '../components/Animated';

const statCards = [
  { key: 'patients', label: 'Total Patients', icon: Users, color: 'blue' },
  { key: 'todayAppointments', label: "Today's Visits", icon: Calendar, color: 'sky' },
  { key: 'consultations', label: 'Consultations', icon: Stethoscope, color: 'gold' },
  { key: 'lowStock', label: 'Low Stock Items', icon: AlertTriangle, color: 'warn' },
  { key: 'activePrescriptions', label: 'Active Rx', icon: Pill, color: 'blue' },
  { key: 'pendingLabs', label: 'Pending Labs', icon: FlaskConical, color: 'gold' },
];

const colorMap = {
  blue: 'from-[#0B3D91]/15 to-[#0B3D91]/5 text-[#0B3D91]',
  sky: 'from-[#1A6FBF]/15 to-[#1A6FBF]/5 text-[#1A6FBF]',
  gold: 'from-[#C9A227]/20 to-[#C9A227]/5 text-[#A8861A]',
  warn: 'from-orange-500/15 to-orange-500/5 text-orange-600',
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/stats')
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout title="Dashboard"><div className="text-center py-20 text-slate-400 text-sm">Loading clinic overview…</div></Layout>;

  return (
    <Layout title="Dashboard">
      <p className="text-sm text-slate-500 mb-6 -mt-2 max-w-2xl leading-relaxed">
        Live overview of campus clinic activity, inventory alerts, and recent patient encounters.
      </p>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {statCards.map((card, i) => (
          <Reveal key={card.key} delay={i * 0.05}>
            <motion.div
              whileHover={{ y: -2 }}
              className={`glass rounded-2xl p-5 bg-gradient-to-br ${colorMap[card.color]}`}
            >
              <div className="flex items-center justify-between mb-3">
                <card.icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-slate-800 tabular-nums">{data?.stats?.[card.key] ?? 0}</p>
              <p className="text-xs text-slate-500 mt-1 tracking-wide">{card.label}</p>
            </motion.div>
          </Reveal>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Reveal delay={0.2}>
          <div className="glass rounded-2xl p-6">
            <h3 className="section-title mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#C9A227]" /> Recent Appointments
            </h3>
            {data?.recentAppointments?.length ? (
              <div className="space-y-3">
                {data.recentAppointments.map(a => (
                  <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-blue-50/50 border border-blue-100">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{a.school_id}</p>
                      <p className="text-xs text-slate-500">{a.visit_date} at {a.visit_time?.slice(0, 5)}</p>
                    </div>
                    <span className={`badge badge-${a.status}`}>{a.status}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-8">No appointments scheduled yet</p>
            )}
          </div>
        </Reveal>

        <Reveal delay={0.3}>
          <div className="glass rounded-2xl p-6">
            <h3 className="section-title mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#C9A227]" /> Common Diagnoses
            </h3>
            {data?.illnessTrends?.length ? (
              <div className="space-y-3">
                {data.illnessTrends.map((t, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1 text-slate-700">
                        <span>{t.diagnosis}</span>
                        <span className="text-slate-400 tabular-nums">{t.count}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-blue-100 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(t.count / data.illnessTrends[0].count) * 100}%` }}
                          transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                          className="h-full rounded-full bg-gradient-to-r from-[#0B3D91] to-[#C9A227]"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-8">No consultation data yet</p>
            )}
          </div>
        </Reveal>
      </div>
    </Layout>
  );
}
