'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AdminHeader() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-sm text-slate-600">Manage your guest house</p>
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-3 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            <div className="w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center text-sm font-bold text-slate-700">
              {user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium text-slate-900">
                {user?.email?.split('@')[0] || 'User'}
              </p>
              <p className="text-xs text-slate-600">Owner</p>
            </div>
            <span className={`text-xs transition ${showMenu ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
              <div className="p-3 border-b border-slate-200">
                <p className="text-sm font-medium text-slate-900">
                  {user?.email}
                </p>
                <p className="text-xs text-slate-600">Owner Account</p>
              </div>
              <div className="p-2 space-y-1">
                <button
                  onClick={() => {
                    router.push('/admin/settings');
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded transition"
                >
                  Settings
                </button>
                <button
                  onClick={() => {
                    router.push('/');
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded transition"
                >
                  View Website
                </button>
              </div>
              <div className="p-2 border-t border-slate-200">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded transition"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
