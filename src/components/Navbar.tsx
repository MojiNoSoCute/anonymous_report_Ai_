/**
 * TrustLine Portal - Top Navigation Bar (Minimalist Left-Right Layout)
 * ดีไซน์แบบ Minimalist ชิดซ้าย-ขวา คลีน สบายตา ไม่ไว้ตรงกลาง
 */

import React from 'react';
import { Lock, FileText, Activity, LogIn, UserCheck, Sparkles, LayoutDashboard, Compass, LogOut } from 'lucide-react';
import { UserSession } from '../types';

interface NavbarProps {
  currentTab: 'submit' | 'track' | 'cases' | 'analytics' | 'code';
  setCurrentTab: (tab: 'submit' | 'track' | 'cases' | 'analytics' | 'code') => void;
  user: UserSession;
  onOpenLogin: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  user,
  onOpenLogin,
  onLogout
}) => {
  const logoUrl = '/npru_logo.png';

  // Public items
  const publicNavItems = [
    { id: 'submit' as const, label: 'สร้างรายงานใหม่', icon: FileText },
    { id: 'track' as const, label: 'ติดตามสถานะ', icon: Lock },
  ];

  // Admin / Staff items
  const adminNavItems = [
    { id: 'cases' as const, label: 'จัดการรายงานทั้งหมด', icon: LayoutDashboard },
    { id: 'analytics' as const, label: 'สถิติ & สรุปผล', icon: Activity },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md text-white border-b border-slate-800 shadow-xs">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-15 flex items-center justify-between gap-4">
        
        {/* LEFT ALIGNED: Logo & Brand Title */}
        <div 
          className="flex items-center gap-3 cursor-pointer group shrink-0" 
          onClick={() => setCurrentTab(user.isAuthenticated ? 'cases' : 'submit')}
        >
          <img 
            src={logoUrl} 
            alt="NPRU Logo" 
            className="h-10 w-auto object-contain bg-white p-1 rounded-lg border border-slate-700 transition-transform duration-200 group-hover:scale-105"
            referrerPolicy="no-referrer"
          />

          <div className="flex items-center gap-2">
            <span className="font-black text-base md:text-lg text-white tracking-tight leading-none">
              NPRU <span className="text-red-500 font-extrabold">Sentinel</span>
            </span>
            <span className="hidden sm:inline-flex items-center bg-rose-950/80 text-rose-300 border border-rose-800/60 text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide">
              <Sparkles className="w-2.5 h-2.5 mr-1 text-rose-400" />
              TrustLine
            </span>
          </div>
        </div>

        {/* RIGHT ALIGNED: Navigation Links & User Actions */}
        <div className="hidden md:flex items-center gap-6">
          
          {/* Main Navigation Menu */}
          <nav className="flex items-center gap-1 text-xs">
            {user.isAuthenticated ? (
              adminNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentTab(item.id)}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? 'bg-rose-900/90 text-white border border-rose-700/80 shadow-xs'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-rose-300' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })
            ) : (
              publicNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentTab(item.id)}
                    className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? 'bg-rose-900/90 text-white border border-rose-700/80 shadow-xs'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-rose-300' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })
            )}
          </nav>

          {/* User Account / Login Button */}
          <div className="flex items-center shrink-0">
            {user.isAuthenticated ? (
              <div className="flex items-center gap-2.5 pl-3 border-l border-slate-800">
                <div className="text-right">
                  <p className="text-xs font-bold text-white leading-tight">{user.name}</p>
                  <p className="text-[10px] text-rose-400 font-semibold leading-none mt-0.5">{user.role}</p>
                </div>
                <button
                  onClick={onLogout}
                  className="p-1.5 text-slate-400 hover:text-rose-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="ออกจากระบบ"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="bg-rose-900 hover:bg-rose-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 border border-rose-700/60"
              >
                <LogIn className="w-3.5 h-3.5 text-rose-200" />
                <span>เจ้าหน้าที่เข้าสู่ระบบ</span>
              </button>
            )}
          </div>

        </div>

      </div>

      {/* Mobile Bar */}
      <div className="md:hidden flex overflow-x-auto border-t border-slate-800/80 bg-slate-950 px-3 py-2 space-x-1 text-xs no-scrollbar">
        {user.isAuthenticated ? (
          adminNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-rose-900 text-white shadow-xs'
                    : 'bg-slate-900 text-slate-300 border border-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })
        ) : (
          publicNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`px-3.5 py-1.5 rounded-lg whitespace-nowrap font-medium cursor-pointer transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-rose-900 text-white font-bold'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })
        )}
      </div>
    </header>
  );
};
