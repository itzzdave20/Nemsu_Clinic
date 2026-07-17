import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard, Users, Calendar, Stethoscope, Package,
  Brain, Megaphone, LogOut, Menu, Pill, Bell, Heart, FileBarChart2
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import NemsuLogo from './NemsuLogo';

const navItems = [
  { to: '/portal', icon: Heart, label: 'My Health', roles: ['patient'] },
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'doctor', 'nurse'] },
  { to: '/patients', icon: Users, label: 'Patients', roles: ['admin', 'doctor', 'nurse'] },
  { to: '/appointments', icon: Calendar, label: 'Appointments', roles: ['admin', 'doctor', 'nurse', 'patient'] },
  { to: '/consultations', icon: Stethoscope, label: 'Consultations', roles: ['admin', 'doctor'] },
  { to: '/clinical', icon: Pill, label: 'Clinical Records', roles: ['admin', 'doctor', 'nurse', 'patient'] },
  { to: '/reports', icon: FileBarChart2, label: 'Reports', roles: ['admin', 'doctor', 'nurse'] },
  { to: '/inventory', icon: Package, label: 'Inventory', roles: ['admin', 'doctor', 'nurse'] },
  { to: '/symptoms', icon: Brain, label: 'AI Triage', roles: ['admin', 'doctor', 'nurse', 'patient'] },
  { to: '/notifications', icon: Bell, label: 'Notifications', roles: ['admin', 'doctor', 'nurse', 'patient'] },
  { to: '/announcements', icon: Megaphone, label: 'Announcements', roles: ['admin', 'doctor', 'nurse', 'patient'] },
];

export default function Layout({ children, title }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const filtered = navItems.filter(n => n.roles.includes(user?.role));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sidebar = (
    <aside className="flex flex-col h-full bg-gradient-to-b from-[#0B3D91] via-[#0B3D91] to-[#0F2E6B] border-r border-[#C9A227]/30">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <NemsuLogo size="md" />
          <div>
            <h2 className="font-display font-semibold text-sm text-white tracking-tight">NEMSU</h2>
            <p className="text-xs text-[#E8C547] font-medium tracking-wide">HealthHub</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {filtered.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all ${
                isActive
                  ? 'bg-[#C9A227]/20 text-[#E8C547] border border-[#C9A227]/35 font-medium'
                  : 'text-blue-100/80 hover:text-white hover:bg-white/10'
              }`
            }
          >
            <Icon className="w-4 h-4" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-white/10">
        <div className="px-4 py-2 mb-2">
          <p className="text-sm font-medium truncate text-white">{user?.full_name}</p>
          <p className="text-xs text-[#E8C547] capitalize font-medium">{user?.role}</p>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm text-blue-100/70 hover:text-white hover:bg-white/10 transition-all">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen mesh-bg flex">
      <div className="hidden lg:block w-64 fixed h-full z-30 shadow-sm">
        {sidebar}
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[#0B3D91]/40 z-40 lg:hidden"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed left-0 top-0 h-full w-64 z-50 lg:hidden shadow-xl"
            >
              {sidebar}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 lg:ml-64">
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b-2 border-[#C9A227]/40 px-4 sm:px-6 py-4 flex items-center gap-4 shadow-sm">
          <button onClick={() => setOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-blue-50 text-[#0B3D91]">
            <Menu className="w-5 h-5" />
          </button>
          <NemsuLogo size="sm" className="hidden sm:inline-flex" />
          <h1 className="page-title">{title}</h1>
          <div className="ml-auto hidden sm:block h-1 w-16 rounded-full bg-gradient-to-r from-[#0B3D91] to-[#C9A227]" />
        </header>
        <main className="p-4 sm:p-6 max-w-7xl">{children}</main>
      </div>
    </div>
  );
}
