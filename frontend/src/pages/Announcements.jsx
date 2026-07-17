import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../api/client';
import { Reveal } from '../components/Animated';

const typeColors = {
  general: 'text-slate-500',
  health_advisory: 'text-[#0B3D91]',
  emergency: 'text-rose-400',
  campaign: 'text-[#1A6FBF]',
};

export default function Announcements() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    api.get('/announcements').then(r => setItems(r.data));
  }, []);

  return (
    <Layout title="Announcements">
      <p className="text-sm text-slate-500 mb-6 leading-relaxed max-w-2xl">
        Official campus health advisories, wellness campaigns, and clinic updates from NEMSU Cantilan.
      </p>

      <div className="space-y-4">
        {items.map((a, i) => (
          <Reveal key={a.id} delay={i * 0.05}>
            <div className="glass rounded-2xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <h3 className="section-title !text-lg">{a.title}</h3>
                <span className={`text-[11px] font-semibold tracking-wide uppercase ${typeColors[a.type] || ''}`}>
                  {a.type?.replace('_', ' ')}
                </span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed mb-3">{a.content}</p>
              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span>{a.author_name || 'Clinic System'}</span>
                <span>{new Date(a.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
              </div>
            </div>
          </Reveal>
        ))}
        {!items.length && <p className="text-slate-400 text-center py-16 text-sm">No announcements posted yet</p>}
      </div>
    </Layout>
  );
}
