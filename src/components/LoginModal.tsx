/**
 * TrustLine Portal - Secure Login Modal
 * ป๊อปอัปเข้าสู่ระบบที่ปลอดภัยสำหรับผู้ดูแลระบบและเจ้าหน้าที่สืบสวน
 */

import React, { useState } from 'react';
import { Lock, Shield, X, AlertCircle } from 'lucide-react';
import { UserSession } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserSession) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('password123');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (username === 'admin' && password === 'password123') {
      onLoginSuccess({
        isAuthenticated: true,
        username: 'admin',
        name: 'เจ้าหน้าที่สืบสวน สมชาย (Admin)',
        role: 'admin'
      });
      onClose();
    } else {
      setErrorMsg('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง (ลองใช้: admin / password123)');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-2xl border border-rose-200 max-w-sm w-full p-6 shadow-2xl relative space-y-4">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 p-1.5 rounded-xl hover:bg-rose-50 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-1">
          <img 
            src="/npru_logo.png" 
            alt="NPRU Logo" 
            className="h-12 w-auto object-contain mx-auto mb-2 bg-white p-1 rounded-xl border border-rose-200 shadow-xs" 
            referrerPolicy="no-referrer" 
          />
          <h2 className="text-xl font-black text-slate-900">Secure Login</h2>
          <p className="text-xs text-slate-500 font-medium">เข้าสู่ระบบสำหรับเจ้าหน้าที่และผู้ดูแลระบบ</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-800 block">ชื่อผู้ใช้งาน (Username)</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:border-red-600 focus:ring-2 focus:ring-red-600/20 outline-none text-slate-900 font-medium"
              placeholder="admin"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-800 block">รหัสผ่าน (Password)</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:border-red-600 focus:ring-2 focus:ring-red-600/20 outline-none text-slate-900 font-medium"
              placeholder="••••••••"
            />
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-red-800 text-xs rounded-xl flex items-center gap-1.5 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="p-3 bg-rose-50/60 border border-rose-100 rounded-xl text-[11px] text-slate-600 font-medium">
            💡 <strong className="text-red-700">บัญชีทดสอบ:</strong> Username: <code className="font-mono text-slate-900 font-bold">admin</code> / Password: <code className="font-mono text-slate-900 font-bold">password123</code>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-red-700 to-rose-700 hover:from-red-800 hover:to-rose-800 text-white font-extrabold text-xs py-3 rounded-xl shadow-md transition-all cursor-pointer active:scale-95"
          >
            เข้าสู่ระบบ (Sign In)
          </button>
        </form>

      </div>
    </div>
  );
};
