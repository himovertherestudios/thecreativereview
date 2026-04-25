import React from 'react';
import { testSupabaseConnection } from './lib/testSupabase';
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useLocation,
  Navigate,
} from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Camera,
  MessageSquare,
  User,
  Grid,
  PlusSquare,
  Flame,
  ShieldCheck,
  Bell,
} from 'lucide-react';

// Pages
import Landing from './pages/Landing';
import InviteCode from './pages/InviteCode';
import Signup from './pages/Signup';
import Consent from './pages/Consent';
import StarterUpload from './pages/StarterUpload';
import Dashboard from './pages/Dashboard';
import ReviewFeed from './pages/ReviewFeed';
import SubmitReview from './pages/SubmitReview';
import PhotoDetail from './pages/PhotoDetail';
import VentRoom from './pages/VentRoom';
import VentDetail from './pages/VentDetail';
import Profile from './pages/Profile';
import Supporter from './pages/Supporter';

type AppNavLinkProps = {
  to: string;
  icon: React.ElementType;
  label: string;
  active: boolean;
};

const AUTH_ROUTES = ['/', '/invite', '/signup', '/consent', '/starter-upload'];

function isActiveRoute(pathname: string, route: string) {
  if (route === '/feed') {
    return pathname === '/feed' || pathname.startsWith('/photo/');
  }

  if (route === '/vents') {
    return pathname === '/vents' || pathname.startsWith('/vents/');
  }

  return pathname === route;
}

function NavLink({ to, icon: Icon, label, active }: AppNavLinkProps) {
  return (
    <Link
      to={to}
      className={`flex flex-col items-center justify-center gap-1 transition-colors ${active ? 'text-brand-accent' : 'text-gray-500 hover:text-white'
        }`}
    >
      <Icon size={24} />
      <span className="text-[10px] uppercase font-bold tracking-wider">
        {label}
      </span>
    </Link>
  );
}

function DesktopNavLink({ to, icon: Icon, label, active }: AppNavLinkProps) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active
        ? 'bg-brand-accent text-brand-black font-bold uppercase'
        : 'text-gray-400 hover:bg-white/5 hover:text-white uppercase font-bold'
        }`}
    >
      <Icon size={20} />
      <span className="text-xs tracking-widest">{label}</span>
    </Link>
  );
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const hideNav = AUTH_ROUTES.includes(location.pathname);

  if (hideNav) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col min-h-screen pb-20 md:pb-0 md:pl-64">
      {/* Sidebar for Desktop */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-brand-gray border-r border-white/10 hidden md:flex flex-col p-6 z-40">
        <div className="mb-12">
          <h1 className="text-xl font-bold leading-tight flex items-center gap-2">
            <Flame className="text-brand-accent fill-brand-accent" size={24} />
            <span>
              The Creative <br /> Review
            </span>
          </h1>
        </div>

        <nav className="flex flex-col gap-2 flex-1">
          <DesktopNavLink
            to="/dashboard"
            icon={Grid}
            label="Today"
            active={isActiveRoute(location.pathname, '/dashboard')}
          />

          <DesktopNavLink
            to="/feed"
            icon={Camera}
            label="Feed"
            active={isActiveRoute(location.pathname, '/feed')}
          />

          <DesktopNavLink
            to="/submit"
            icon={PlusSquare}
            label="Critique Me"
            active={isActiveRoute(location.pathname, '/submit')}
          />

          <DesktopNavLink
            to="/vents"
            icon={MessageSquare}
            label="Vent Room"
            active={isActiveRoute(location.pathname, '/vents')}
          />
        </nav>

        <div className="mt-auto pt-6 border-t border-white/5 flex flex-col gap-2">
          <DesktopNavLink
            to="/profile"
            icon={User}
            label="Profile"
            active={isActiveRoute(location.pathname, '/profile')}
          />

          <DesktopNavLink
            to="/supporter"
            icon={ShieldCheck}
            label="Supporter"
            active={isActiveRoute(location.pathname, '/supporter')}
          />
        </div>
      </aside>

      {/* Header for Mobile */}
      <header className="md:hidden sticky top-0 bg-brand-black/80 backdrop-blur-md z-40 border-b border-white/10 px-4 h-16 flex items-center justify-between">
        <h1 className="text-sm font-bold flex items-center gap-2">
          <Flame className="text-brand-accent fill-brand-accent" size={18} />
          The Creative Review
        </h1>

        <div className="flex items-center gap-4">
          <Bell size={20} className="text-gray-400" />

          <div className="w-8 h-8 rounded-full bg-brand-accent/20 border border-brand-accent/30 overflow-hidden">
            <img
              src="https://picsum.photos/seed/alex/100/100"
              alt="Current user"
              className="w-full h-full object-cover"
              draggable={false}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Nav for Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-brand-gray/95 border-t border-white/10 px-6 h-20 grid grid-cols-5 items-center z-40 backdrop-blur-lg">
        <NavLink
          to="/dashboard"
          icon={Grid}
          label="Today"
          active={isActiveRoute(location.pathname, '/dashboard')}
        />

        <NavLink
          to="/feed"
          icon={Camera}
          label="Feed"
          active={isActiveRoute(location.pathname, '/feed')}
        />

        <div className="flex justify-center -mt-8">
          <Link
            to="/submit"
            className="w-14 h-14 rounded-2xl bg-brand-accent flex items-center justify-center text-brand-black shadow-lg shadow-brand-accent/20 ring-4 ring-brand-black"
            aria-label="Submit for review"
          >
            <PlusSquare size={28} />
          </Link>
        </div>

        <NavLink
          to="/vents"
          icon={MessageSquare}
          label="Vents"
          active={isActiveRoute(location.pathname, '/vents')}
        />

        <NavLink
          to="/profile"
          icon={User}
          label="Me"
          active={isActiveRoute(location.pathname, '/profile')}
        />
      </nav>
    </div>
  );
}

export default function App() {


  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/invite" element={<InviteCode />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/consent" element={<Consent />} />
          <Route path="/starter-upload" element={<StarterUpload />} />

          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/feed" element={<ReviewFeed />} />
          <Route path="/submit" element={<SubmitReview />} />
          <Route path="/photo/:id" element={<PhotoDetail />} />

          <Route path="/vents" element={<VentRoom />} />
          <Route path="/vents/:id" element={<VentDetail />} />

          <Route path="/profile" element={<Profile />} />
          <Route path="/supporter" element={<Supporter />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}