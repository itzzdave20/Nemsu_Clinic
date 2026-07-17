import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import Layout from '../components/Layout';
import api from '../api/client';
import { Reveal } from '../components/Animated';

export default function Inventory() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    api.get('/inventory').then(r => setItems(r.data));
  }, []);

  return (
    <Layout title="Inventory">
      <div className="mb-6">
        <p className="text-sm text-slate-500 leading-relaxed">
          Medicines and clinic supplies with reorder alerts for Cantilan Campus stockrooms.
        </p>
        <p className="text-xs text-slate-400 mt-1">{items.length} items tracked</p>
      </div>

      {!items.length && (
        <p className="text-sm text-slate-400 text-center py-16">No inventory items yet</p>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item, i) => {
          const low = item.quantity <= item.reorder_level;
          return (
            <Reveal key={item.id} delay={i * 0.05}>
              <div className={`glass rounded-2xl p-5 ${low ? 'border border-[#C9A227]/40' : ''}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="section-title !text-base">{item.item_name}</h3>
                    <p className="text-xs text-slate-500 capitalize mt-0.5">{item.item_type}</p>
                  </div>
                  {low && <AlertTriangle className="w-4 h-4 text-[#C9A227]" />}
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-bold text-[#0B3D91] tabular-nums">{item.quantity}</p>
                    <p className="text-xs text-slate-500">{item.unit}</p>
                  </div>
                  {item.expiry_date && (
                    <p className="text-xs text-slate-500">Exp: {String(item.expiry_date).slice(0, 10)}</p>
                  )}
                </div>
                {low && (
                  <p className="text-[11px] text-[#A8861A] mt-2 font-medium">Below reorder level ({item.reorder_level})</p>
                )}
                <div className="mt-3 h-1.5 rounded-full bg-blue-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${low ? 'bg-[#C9A227]' : 'bg-[#0B3D91]'}`}
                    style={{ width: `${Math.min(100, (item.quantity / Math.max(item.reorder_level * 3, 1)) * 100)}%` }}
                  />
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </Layout>
  );
}
