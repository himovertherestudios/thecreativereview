import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    Grid,
    Camera,
    MessageSquare,
    Flame,
    LogOut,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const navItems = [
    {
        label: 'Dashboard',
        to: '/dashboard',
        icon: Grid,
    },
    {
        label: 'Feed',
        to: '/feed',
        icon: Camera,
    },
    {
        label: 'Vent',
        to: '/vent-room',
        icon: MessageSquare,
    },
    {
        label: 'Challenge',
        to: '/challenge-suggestion',
        icon: Flame,
    },
];

export default function BottomNav() {
    const location = useLocation();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = '/login';
    };

    return (
        <nav className="fixed-bottom-nav md:hidden">
            <div className="mx-auto grid max-w-[430px] grid-cols-5 px-2 py-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.to;

                    return (
                        <Link
                            key={item.to}
                            to={item.to}
                            className={`flex flex-col items-center justify-center gap-1 rounded-2xl py-2 text-[10px] font-black uppercase tracking-wide transition ${isActive
                                    ? 'text-white'
                                    : 'text-white/45 hover:text-white'
                                }`}
                        >
                            <Icon size={19} />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}

                <button
                    type="button"
                    onClick={handleLogout}
                    className="flex flex-col items-center justify-center gap-1 rounded-2xl py-2 text-[10px] font-black uppercase tracking-wide text-white/45 transition hover:text-white"
                >
                    <LogOut size={19} />
                    <span>Logout</span>
                </button>
            </div>
        </nav>
    );
}