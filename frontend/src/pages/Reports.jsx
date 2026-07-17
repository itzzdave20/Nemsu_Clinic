import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileBarChart2, Users, Calendar, Stethoscope, Pill, Package, TrendingUp, AlertTriangle
} from 'lucide-react';
import Layout from '../components/Layout';
import NemsuLogo from '../components/NemsuLogo';
import api from '../api/client';
import { Reveal } from '../components/Animated';

function BarList({ items, color = '#0B3D91' }) {
  const max = Math.max(...(items?.map(i => Number(i.count) || 0) || [1]), 1);
  if (!items?.length) return <p className="text-sm text-slate-400 py-6 text-center">No data for this period</p>;
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={`${item.label}-${i}`}>
          <div className="flex justify-between gap-3 text-sm mb-1">
            <span className="text-slate-700 truncate font-medium">{item.label || item.status}</span>
            <span className="text-slate-400 tabular-nums">{item.count}</span>
          </div>
          <div className="h-2 rounded-full bg-blue-100 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(Number(item.count) / max) * 100}%` }}
              transition={{ duration: 0.7, delay: i * 0.05 }}
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${color}, #C9A227)` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Reports() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    api.get(`/reports/summary?days=${days}`)
      .then(r => setData(r.data))
      .catch(err => setError(err.response?.data?.error || 'Failed to load reports'))
      .finally(() => setLoading(false));
  }, [days]);

  const totals = data?.totals || {};

  const cards = [
    { label: 'Registered patients', value: totals.patients, icon: Users },
    { label: 'Appointments', value: totals.appointments, icon: Calendar },
    { label: 'Consultations', value: totals.consultations, icon: Stethoscope },
    { label: 'Active prescriptions', value: totals.activePrescriptions, icon: Pill },
    { label: 'Pending lab tests', value: totals.pendingLabs, icon: FileBarChart2 },
    { label: 'Low-stock items', value: totals.lowStock, icon: Package },
  ];

  return (
    <Layout title="Clinic Reports">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div className="flex items-start gap-3">
          <NemsuLogo size="md" />
          <div>
            <h2 className="font-display text-2xl font-semibold text-[#0B3D91] tracking-tight">Analytics & reports</h2>
            <p className="text-sm text-slate-500 mt-1 leading-relaxed max-w-xl">
              Operational overview for NEMSU Cantilan Campus Clinic — visits, diagnoses, inventory, and care trends.
            </p>
          </div>
        </div>
        <div>
          <label className="label-text">Reporting period</label>
          <select className="input-field !w-auto min-w-[160px]" value={days} onChange={e => setDays(Number(e.target.value))}>
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={365}>Last 12 months</option>
          </select>
        </div>
      </div>

      {error && <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">{error}</div>}
      {loading && <p className="text-slate-400 text-center py-16">Generating report…</p>}

      {!loading && data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
            {cards.map((c, i) => (
              <Reveal key={c.label} delay={i * 0.04}>
                <div className="glass rounded-2xl p-4 sm:p-5">
                  <c.icon className="w-4 h-4 text-[#C9A227] mb-2" />
                  <p className="text-2xl font-bold text-[#0B3D91] tabular-nums">{c.value ?? 0}</p>
                  <p className="text-xs text-slate-500 mt-1 leading-snug">{c.label}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-5 mb-5">
            <Reveal>
              <div className="glass rounded-2xl p-5 sm:p-6">
                <h3 className="section-title flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4 text-[#C9A227]" /> Top diagnoses
                </h3>
                <BarList items={data.topDiagnoses} />
              </div>
            </Reveal>
            <Reveal delay={0.05}>
              <div className="glass rounded-2xl p-5 sm:p-6">
                <h3 className="section-title flex items-center gap-2 mb-4">
                  <Pill className="w-4 h-4 text-[#C9A227]" /> Medication usage
                </h3>
                <BarList items={data.medicationUsage} color="#1A6FBF" />
              </div>
            </Reveal>
            <Reveal delay={0.08}>
              <div className="glass rounded-2xl p-5 sm:p-6">
                <h3 className="section-title flex items-center gap-2 mb-4">
                  <Users className="w-4 h-4 text-[#C9A227]" /> Patients by type
                </h3>
                <BarList items={data.patientsByType} />
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="glass rounded-2xl p-5 sm:p-6">
                <h3 className="section-title flex items-center gap-2 mb-4">
                  <Calendar className="w-4 h-4 text-[#C9A227]" /> Appointments by status
                </h3>
                <BarList items={(data.appointmentsByStatus || []).map(s => ({ label: s.status, count: s.count }))} />
              </div>
            </Reveal>
          </div>

          <div className="grid lg:grid-cols-2 gap-5">
            <Reveal>
              <div className="glass rounded-2xl p-5 sm:p-6">
                <h3 className="section-title flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-4 h-4 text-[#C9A227]" /> Inventory alerts
                </h3>
                {data.inventoryAlert?.length ? (
                  <div className="space-y-2">
                    {data.inventoryAlert.map((item, i) => (
                      <div key={i} className="flex justify-between gap-3 p-3 rounded-xl bg-[#FFF8E7] border border-[#C9A227]/25 text-sm">
                        <div>
                          <p className="font-medium text-slate-800">{item.item_name}</p>
                          <p className="text-xs text-slate-500 capitalize">{item.item_type}</p>
                        </div>
                        <p className="font-semibold text-[#A8861A] tabular-nums">{item.quantity} {item.unit}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 py-6 text-center">Stock levels look healthy</p>
                )}
              </div>
            </Reveal>

            <Reveal delay={0.05}>
              <div className="glass rounded-2xl p-5 sm:p-6">
                <h3 className="section-title flex items-center gap-2 mb-4">
                  <Stethoscope className="w-4 h-4 text-[#C9A227]" /> Recent consultations
                </h3>
                {data.recentConsultations?.length ? (
                  <div className="space-y-2">
                    {data.recentConsultations.map(c => (
                      <div key={c.id} className="p-3 rounded-xl bg-blue-50/70 border border-blue-100">
                        <div className="flex justify-between gap-2">
                          <p className="text-sm font-medium text-[#0B3D91]">{c.diagnosis || 'Consultation'}</p>
                          <span className="text-[11px] text-slate-400">{new Date(c.created_at).toLocaleDateString('en-PH')}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{c.school_id} · {c.doctor_name}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 py-6 text-center">No consultations recorded yet</p>
                )}
              </div>
            </Reveal>
          </div>

          <p className="text-[11px] text-slate-400 mt-6 text-right">
            Generated {new Date(data.generatedAt).toLocaleString('en-PH')} · Period: last {data.periodDays} days
          </p>
        </>
      )}
    </Layout>
  );
}
