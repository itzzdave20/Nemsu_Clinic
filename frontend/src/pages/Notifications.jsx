import { useEffect, useState } from 'react';
import {
  Bell, Send, Calendar, Mail, MessageSquare, Smartphone, Settings,
  CheckCircle2, XCircle, Clock, User, Phone, AtSign, Loader2, ShieldCheck
} from 'lucide-react';
import Layout from '../components/Layout';
import NemsuLogo from '../components/NemsuLogo';
import api from '../api/client';
import { Reveal } from '../components/Animated';
import { useAuthStore } from '../store/authStore';

const channels = [
  { id: 'in_app', label: 'In-App', icon: Bell, hint: 'Saved in portal history' },
  { id: 'email', label: 'Email', icon: Mail, hint: 'Requires SMTP setup' },
  { id: 'sms', label: 'SMS', icon: Smartphone, hint: 'Requires Semaphore key' },
  { id: 'all', label: 'All', icon: MessageSquare, hint: 'In-app + email + SMS' },
];

function formatDisplayDate(dateStr, timeStr) {
  if (!dateStr) return '—';
  const raw = String(dateStr).slice(0, 10);
  const [y, m, d] = raw.split('-').map(Number);
  if (!y || !m || !d) return String(dateStr);
  const date = new Date(y, m - 1, d);
  const dateLabel = date.toLocaleDateString('en-PH', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });
  if (!timeStr) return dateLabel;
  const [hh, mm] = String(timeStr).slice(0, 5).split(':').map(Number);
  const period = hh >= 12 ? 'PM' : 'AM';
  const hour = hh % 12 || 12;
  return `${dateLabel} · ${hour}:${String(mm).padStart(2, '0')} ${period}`;
}

function formatHistoryTime(value) {
  if (!value) return '';
  // MySQL formatted 'YYYY-MM-DD HH:mm'
  if (/^\d{4}-\d{2}-\d{2}/.test(String(value))) {
    const [datePart, timePart = ''] = String(value).split(' ');
    const [y, m, d] = datePart.split('-').map(Number);
    const [hh = 0, mm = 0] = timePart.split(':').map(Number);
    const dt = new Date(y, m - 1, d, hh, mm);
    return dt.toLocaleString('en-PH', {
      month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
    });
  }
  return new Date(value).toLocaleString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

function ServiceCard({ title, ok, icon: Icon, detail, hint }) {
  return (
    <div className={`rounded-2xl p-4 border ${ok ? 'bg-[#0B3D91]/5 border-[#0B3D91]/15' : 'bg-[#C9A227]/8 border-[#C9A227]/25'}`}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${ok ? 'bg-[#0B3D91]/15 text-[#0B3D91]' : 'bg-[#C9A227]/20 text-[#A8861A]'}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-slate-800">{title}</p>
            {ok ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0B3D91]">
                <CheckCircle2 className="w-3.5 h-3.5" /> Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#A8861A]">
                <XCircle className="w-3.5 h-3.5" /> Not configured
              </span>
            )}
          </div>
          {detail && <p className="text-xs text-slate-500 mt-1 truncate">{detail}</p>}
          {!ok && hint && <p className="text-xs text-slate-400 mt-1 leading-relaxed">{hint}</p>}
        </div>
      </div>
    </div>
  );
}

export default function Notifications() {
  const { user } = useAuthStore();
  const isStaff = ['admin', 'doctor', 'nurse'].includes(user?.role);
  const isAdmin = user?.role === 'admin';
  const [notifications, setNotifications] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [channel, setChannel] = useState('in_app');
  const [serviceStatus, setServiceStatus] = useState(null);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('ok');
  const [loading, setLoading] = useState(false);
  const [smtpBusy, setSmtpBusy] = useState('');
  const [testTo, setTestTo] = useState('');

  const load = () => {
    api.get('/notifications').then(r => setNotifications(r.data));
    if (isStaff) api.get('/notifications/upcoming?days=2').then(r => setUpcoming(r.data));
    if (isAdmin) api.get('/notifications/status').then(r => {
      setServiceStatus(r.data);
      if (r.data?.smtp?.user && !testTo) {
        // leave testTo empty — user fills or defaults on server
      }
    }).catch(() => {});
  };
  useEffect(() => { load(); }, [isStaff, isAdmin]);

  const flash = (text, type = 'ok') => {
    setMsg(text);
    setMsgType(type);
  };

  const sendReminder = async (id) => {
    setLoading(true);
    flash('');
    try {
      const { data } = await api.post(`/notifications/remind/${id}`, { channel });
      flash(data.message, data.message?.toLowerCase().includes('fail') ? 'warn' : 'ok');
      load();
    } catch (err) {
      flash(err.response?.data?.error || 'Failed to send', 'err');
    } finally {
      setLoading(false);
    }
  };

  const sendAll = async () => {
    setLoading(true);
    flash('');
    try {
      const { data } = await api.post('/notifications/remind-all', { channel });
      flash(data.message, data.failed ? 'warn' : 'ok');
      load();
    } catch (err) {
      flash(err.response?.data?.error || 'Failed to send', 'err');
    } finally {
      setLoading(false);
    }
  };

  const runCron = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/notifications/cron/run');
      flash(`${data.message} — ${data.appointments} appointment(s)`, 'ok');
      load();
    } catch (err) {
      flash(err.response?.data?.error || 'Cron failed', 'err');
    } finally {
      setLoading(false);
    }
  };

  const verifySmtp = async () => {
    setSmtpBusy('verify');
    flash('');
    try {
      const { data } = await api.post('/notifications/smtp/verify');
      flash(data.message || data.error, data.success ? 'ok' : 'err');
      load();
    } catch (err) {
      flash(err.response?.data?.error || 'SMTP verify failed', 'err');
    } finally {
      setSmtpBusy('');
    }
  };

  const testSmtp = async () => {
    setSmtpBusy('test');
    flash('');
    try {
      const { data } = await api.post('/notifications/smtp/test', { to: testTo || undefined });
      flash(data.message || data.error, data.success ? 'ok' : 'err');
    } catch (err) {
      flash(err.response?.data?.error || 'Test email failed', 'err');
    } finally {
      setSmtpBusy('');
    }
  };

  const emailReady = serviceStatus?.email;
  const channelBlocked =
    (channel === 'email' || channel === 'all') && serviceStatus && !emailReady;

  return (
    <Layout title="Notifications">
      <p className="text-sm text-slate-500 mb-6 leading-relaxed max-w-2xl">
        Appointment reminders and clinic messages — delivered in-app, by email, or SMS when configured.
      </p>
      {isAdmin && (
        <Reveal>
          <div className="glass rounded-2xl p-5 sm:p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <NemsuLogo size="sm" />
                <div>
                  <h3 className="section-title flex items-center gap-2">
                    <Settings className="w-4 h-4 text-[#C9A227]" /> Delivery services
                  </h3>
                  <p className="text-xs text-slate-400">SMTP email, SMS, and scheduled reminders</p>
                </div>
              </div>
              <button onClick={runCron} disabled={loading} className="btn-ghost text-xs py-2 px-3 self-start">
                <Clock className="w-3.5 h-3.5" /> Run Reminders Now
              </button>
            </div>

            <div className="grid sm:grid-cols-3 gap-3 mb-5">
              <ServiceCard
                title="Email (SMTP)"
                ok={!!serviceStatus?.email}
                icon={Mail}
                detail={serviceStatus?.smtp?.configured ? `${serviceStatus.smtp.host} · ${serviceStatus.smtp.user}` : null}
                hint={serviceStatus?.setupHints?.email}
              />
              <ServiceCard
                title="SMS (Semaphore)"
                ok={!!serviceStatus?.sms}
                icon={Smartphone}
                detail={serviceStatus?.sms ? 'Semaphore PH' : null}
                hint={serviceStatus?.setupHints?.sms}
              />
              <ServiceCard
                title="Auto Cron"
                ok={!!serviceStatus?.cronEnabled}
                icon={Clock}
                detail={serviceStatus?.cronEnabled ? `Schedule: ${serviceStatus.cronSchedule}` : null}
                hint={serviceStatus?.setupHints?.cron}
              />
            </div>

            <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
              <p className="text-sm font-semibold text-[#0B3D91] mb-2 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#C9A227]" /> SMTP Tools
              </p>
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <input
                  className="input-field sm:max-w-xs"
                  type="email"
                  placeholder="Test recipient (optional)"
                  value={testTo}
                  onChange={e => setTestTo(e.target.value)}
                />
                <div className="flex flex-wrap gap-2">
                  <button onClick={verifySmtp} disabled={!!smtpBusy} className="btn-ghost text-xs py-2 px-3">
                    {smtpBusy === 'verify' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                    Verify Connection
                  </button>
                  <button onClick={testSmtp} disabled={!!smtpBusy} className="btn-primary text-xs py-2 px-3">
                    {smtpBusy === 'test' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                    Send Test Email
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Configure in <code className="text-[#0B3D91]">backend/.env</code> then restart the API. Gmail needs an App Password.
              </p>
            </div>
          </div>
        </Reveal>
      )}

      {isStaff && (
        <Reveal>
          <div className="glass rounded-2xl p-4 sm:p-5 mb-6">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Send reminders via</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {channels.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setChannel(c.id)}
                    className={`text-left p-3 rounded-xl border transition-all ${
                      channel === c.id
                        ? 'bg-[#0B3D91] text-white border-[#0B3D91] shadow-md'
                        : 'bg-white text-slate-600 border-blue-100 hover:border-[#C9A227]/50'
                    }`}
                  >
                    <c.icon className={`w-4 h-4 mb-1.5 ${channel === c.id ? 'text-[#E8C547]' : 'text-[#0B3D91]'}`} />
                    <p className="text-sm font-semibold">{c.label}</p>
                    <p className={`text-[10px] mt-0.5 ${channel === c.id ? 'text-blue-100' : 'text-slate-400'}`}>{c.hint}</p>
                  </button>
              ))}
            </div>
            {channelBlocked && (
              <p className="text-xs text-[#A8861A] mt-3">
                Email channel selected but SMTP is not configured — reminders will fail until you set up SMTP.
              </p>
            )}
          </div>
        </Reveal>
      )}

      {msg && (
        <div className={`mb-4 p-3 rounded-xl text-sm border ${
          msgType === 'err'
            ? 'bg-rose-50 border-rose-200 text-rose-700'
            : msgType === 'warn'
              ? 'bg-[#C9A227]/10 border-[#C9A227]/30 text-[#A8861A]'
              : 'bg-[#0B3D91]/10 border-[#0B3D91]/20 text-[#0B3D91]'
        }`}>{msg}</div>
      )}

      {isStaff && (
        <Reveal>
          <div className="glass rounded-2xl p-5 sm:p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <h3 className="font-semibold text-[#0B3D91] flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#C9A227]" /> Upcoming Appointments
                <span className="badge badge-confirmed ml-1">{upcoming.length}</span>
              </h3>
              <button onClick={sendAll} disabled={loading || !upcoming.length} className="btn-primary text-sm">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send All ({channel})
              </button>
            </div>

            {upcoming.length ? (
              <div className="space-y-3">
                {upcoming.map(a => (
                  <div key={a.id} className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-4 rounded-xl bg-gradient-to-r from-blue-50/80 to-white border border-blue-100">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-[#0B3D91]" />
                        {a.school_id} — {a.patient_name || 'Patient'}
                      </p>
                      <p className="text-xs text-[#0B3D91] font-medium mt-1.5">
                        {formatDisplayDate(a.visit_date, a.visit_time)}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">{a.reason || 'General consultation'} · {a.doctor_name || 'Unassigned'}</p>
                      <div className="flex flex-wrap gap-3 mt-2 text-[11px] text-slate-400">
                        {a.email && <span className="inline-flex items-center gap-1"><AtSign className="w-3 h-3" />{a.email}</span>}
                        {a.phone && <span className="inline-flex items-center gap-1"><Phone className="w-3 h-3" />{a.phone}</span>}
                      </div>
                    </div>
                    <button onClick={() => sendReminder(a.id)} disabled={loading} className="btn-ghost text-xs py-2 px-4 self-start lg:self-center shrink-0">
                      <Bell className="w-3.5 h-3.5" /> Remind
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-8">No upcoming appointments in the next 2 days</p>
            )}
          </div>
        </Reveal>
      )}

      <Reveal>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[#0B3D91] flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#C9A227]" /> Notification History
          </h3>
          <span className="text-xs text-slate-400">{notifications.length} recent</span>
        </div>
        <div className="space-y-3">
          {notifications.map(n => (
            <div key={n.id} className="glass rounded-xl p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                <span className="text-sm font-semibold text-slate-800">{n.subject || n.type?.replace(/_/g, ' ')}</span>
                <span className="text-xs text-slate-400 shrink-0">{formatHistoryTime(n.created_at)}</span>
              </div>
              <p className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">{n.message}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="badge badge-confirmed">{n.channel}</span>
                <span className={`badge badge-${n.status === 'sent' ? 'completed' : n.status === 'failed' ? 'cancelled' : 'pending'}`}>
                  {n.status}
                </span>
                {n.type && <span className="badge badge-pending">{String(n.type).replace(/_/g, ' ')}</span>}
              </div>
            </div>
          ))}
          {!notifications.length && (
            <div className="glass rounded-2xl p-10 text-center">
              <Bell className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No notifications yet</p>
              <p className="text-xs text-slate-400 mt-1">Send a reminder from upcoming appointments to get started</p>
            </div>
          )}
        </div>
      </Reveal>
    </Layout>
  );
}
