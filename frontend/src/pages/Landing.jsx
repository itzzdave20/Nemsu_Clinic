import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Shield, Brain, Calendar, Users, BarChart3,
  ArrowRight, Sparkles, Heart, ChevronRight
} from 'lucide-react';
import AnimatedCounter, { Reveal, FloatingOrb } from '../components/Animated';
import NemsuLogo from '../components/NemsuLogo';

const features = [
  { icon: Users, title: 'Patient Management', desc: 'Digital EHR for students, faculty & staff with complete medical histories.' },
  { icon: Calendar, title: 'Smart Scheduling', desc: 'Online booking, automated reminders, and optimized clinic staff allocation.' },
  { icon: Brain, title: 'AI Symptom Triage', desc: 'Intelligent symptom checker guides patients to appropriate care levels.' },
  { icon: BarChart3, title: 'Analytics Dashboard', desc: 'Data-driven insights on health trends, visits, and resource utilization.' },
  { icon: Shield, title: 'Privacy & Security', desc: 'HIPAA-like standards with encryption, access controls, and audit trails.' },
  { icon: Heart, title: 'Proactive Health', desc: 'Health advisories, preventive care reminders, and campus wellness campaigns.' },
];

export default function Landing() {
  return (
    <div className="min-h-screen mesh-bg relative overflow-hidden">
      <FloatingOrb className="w-96 h-96 bg-[#0B3D91]/15 top-20 -left-48" />
      <FloatingOrb className="w-80 h-80 bg-[#C9A227]/20 top-40 right-0" delay={2} />
      <FloatingOrb className="w-64 h-64 bg-[#1A6FBF]/15 bottom-20 left-1/3" delay={4} />

      <nav className="fixed top-0 inset-x-0 z-50 bg-[#0B3D91]/95 backdrop-blur-md border-b-2 border-[#C9A227]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <NemsuLogo size="sm" />
            <span className="font-bold text-lg text-white">NEMSU <span className="text-[#E8C547]">HealthHub</span></span>
          </Link>
          <div className="hidden sm:flex items-center gap-6 text-sm text-blue-100">
            <a href="#features" className="hover:text-[#E8C547] transition-colors">Features</a>
            <a href="#ai" className="hover:text-[#E8C547] transition-colors">AI</a>
            <a href="#about" className="hover:text-[#E8C547] transition-colors">About</a>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/register" className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-blue-100 border border-white/25 hover:border-[#E8C547] hover:text-[#E8C547] transition-colors">
              Register
            </Link>
            <Link to="/login" className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold bg-[#C9A227] text-[#0B3D91] hover:bg-[#E8C547] transition-colors">
              Sign In <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      <section className="pt-32 pb-20 px-4 sm:px-6 relative">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs text-[#0B3D91] mb-6 border border-[#C9A227]/30">
              <Sparkles className="w-3.5 h-3.5 text-[#C9A227]" /> AI-Powered Campus Healthcare
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6 text-[#0B3D91]">
              Next-Gen Clinic Management for{' '}
              <span className="font-[family-name:var(--font-display)] italic gradient-text">NEMSU Cantilan</span>
            </h1>
            <p className="text-slate-500 text-lg mb-8 max-w-lg leading-relaxed">
              Streamline campus health services with intelligent scheduling, electronic health records,
              and AI-driven triage — accessible from any device, anywhere on campus.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/register" className="btn-primary">
                Create Account <ChevronRight className="w-4 h-4" />
              </Link>
              <Link to="/login" className="btn-ghost">Staff Sign In</Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="glass rounded-3xl p-6 sm:p-8 relative z-10">
              <div className="flex justify-center mb-5">
                <NemsuLogo size="xl" className="!w-24 !h-24 shadow-lg" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Patients', value: 1240, color: 'from-[#0B3D91]/15 to-[#0B3D91]/5' },
                  { label: 'Appointments', value: 86, color: 'from-[#1A6FBF]/15 to-[#1A6FBF]/5' },
                  { label: 'Consultations', value: 3420, color: 'from-[#C9A227]/20 to-[#C9A227]/5' },
                  { label: 'AI Checks', value: 528, color: 'from-[#0B3D91]/10 to-[#C9A227]/10' },
                ].map((m, i) => (
                  <motion.div
                    key={m.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className={`rounded-2xl p-5 bg-gradient-to-br ${m.color} border border-blue-100`}
                  >
                    <p className="text-2xl sm:text-3xl font-bold text-[#0B3D91]">
                      <AnimatedCounter end={m.value} />
                    </p>
                    <p className="text-xs text-slate-500 mt-1">{m.label}</p>
                  </motion.div>
                ))}
              </div>
              <div className="mt-4 p-4 rounded-xl bg-[#0B3D91]/5 border border-[#C9A227]/25">
                <div className="flex items-center gap-2 text-[#0B3D91] text-sm font-medium">
                  <Brain className="w-4 h-4 text-[#C9A227]" />
                  <span>AI Triage Active — 3 patients assessed today</span>
                </div>
              </div>
            </div>
            <div className="absolute -inset-4 bg-gradient-to-r from-[#0B3D91]/10 to-[#C9A227]/15 rounded-3xl blur-2xl -z-10" />
          </motion.div>
        </div>
      </section>

      <section id="features" className="py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <Reveal className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-[#0B3D91]">
              Comprehensive <span className="gradient-text">Health Modules</span>
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              Every tool your campus clinic needs — from patient registration to predictive health analytics.
            </p>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <Reveal key={f.title} delay={i * 0.08}>
                <div className="glass glass-hover rounded-2xl p-6 h-full transition-all duration-300 hover:-translate-y-1">
                  <div className="w-12 h-12 rounded-xl bg-[#0B3D91]/10 flex items-center justify-center mb-4">
                    <f.icon className="w-6 h-6 text-[#0B3D91]" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2 text-slate-800">{f.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="ai" className="py-20 px-4 sm:px-6">
        <Reveal>
          <div className="max-w-6xl mx-auto glass rounded-3xl p-8 sm:p-12 relative overflow-hidden border border-blue-100">
            <FloatingOrb className="w-64 h-64 bg-[#C9A227]/15 -right-20 -top-20" />
            <div className="relative z-10 grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-4 text-[#0B3D91]">AI-Powered <span className="gradient-text">Health Intelligence</span></h2>
                <p className="text-slate-500 mb-6 leading-relaxed">
                  Our intelligent symptom checker analyzes patient inputs to provide urgency assessments,
                  care recommendations, and triage support — helping clinic staff prioritize cases effectively.
                </p>
                <ul className="space-y-3 text-sm">
                  {['Symptom analysis & urgency classification', 'Personalized health recommendations', 'Predictive illness trend detection', 'Optimized appointment scheduling'].map(item => (
                    <li key={item} className="flex items-center gap-2 text-slate-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#C9A227]" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="glass rounded-2xl p-6 border border-[#C9A227]/30">
                <p className="text-xs text-[#C9A227] mb-3 font-semibold tracking-wide">AI TRIAGE PREVIEW</p>
                <p className="text-sm text-slate-600 mb-4">"I have a persistent cough, mild fever, and body aches for 2 days"</p>
                <div className="flex items-center gap-2 mb-3">
                  <span className="badge badge-medium">Medium Urgency</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Schedule a clinic appointment within 24-48 hours. Monitor symptoms, rest well, and stay hydrated.
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <section id="about" className="py-20 px-4 sm:px-6 border-t border-blue-100">
        <div className="max-w-6xl mx-auto text-center">
          <Reveal>
            <div className="flex justify-center mb-6">
              <NemsuLogo size="xl" className="!w-20 !h-20" />
            </div>
            <h2 className="text-2xl font-bold mb-4 text-[#0B3D91]">Built for NEMSU Cantilan Campus</h2>
            <p className="text-slate-500 max-w-2xl mx-auto mb-8 text-sm leading-relaxed">
              Compliant with Philippine Data Privacy Act standards. Designed with RESTful APIs for integration
              with university SIS and HR systems. Cloud-ready architecture for campus-wide accessibility.
            </p>
            <Link to="/register" className="btn-primary">
              Register Patient Account <ArrowRight className="w-4 h-4" />
            </Link>
          </Reveal>
        </div>
      </section>

      <footer className="py-8 px-4 text-center text-xs text-blue-100 border-t border-[#C9A227]/40 bg-[#0B3D91]">
        &copy; 2026 NEMSU Cantilan Campus — HealthHub Clinic Management System
      </footer>
    </div>
  );
}
