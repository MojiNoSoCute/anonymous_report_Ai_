/**
 * TrustLine Whistleblower Portal - Main Application Component
 * ระบบแจ้งเบาะแสและจัดการข้อมูลอย่างเป็นระบบ ปลอดภัย และเข้ารหัส
 */

import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { SubmitReport } from './components/SubmitReport';
import { TrackStatus } from './components/TrackStatus';
import { CaseManager } from './components/CaseManager';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { PythonFlaskCodeView } from './components/PythonFlaskCodeView';
import { LoginModal } from './components/LoginModal';
import { UserSession } from './types';
import { Shield, Lock, FileCode, Heart } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'submit' | 'track' | 'cases' | 'analytics' | 'code'>('submit');
  const [user, setUser] = useState<UserSession>({
    isAuthenticated: false,
    username: '',
    name: '',
    role: 'guest'
  });
  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false);
  const [trackedReportState, setTrackedReportState] = useState<{ id: string; pin: string }>({
    id: '',
    pin: ''
  });

  const handleSuccessSubmit = (reportId: string, pin: string) => {
    setTrackedReportState({ id: reportId, pin });
    setCurrentTab('track');
  };

  const handleOpenChatWithCase = (caseId: string) => {
    setTrackedReportState(prev => ({ ...prev, id: caseId }));
    setCurrentTab('track');
  };

  const handleLogout = () => {
    setUser({
      isAuthenticated: false,
      username: '',
      name: '',
      role: 'guest'
    });
    if (currentTab === 'cases' || currentTab === 'analytics') {
      setCurrentTab('submit');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-[#1E293B]">
      
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        user={user}
        onOpenLogin={() => setIsLoginOpen(true)}
        onLogout={handleLogout}
      />

      {/* Dynamic Content Views */}
      <main className="flex-1 pb-12">
        {currentTab === 'submit' && (
          <SubmitReport onSuccessSubmit={handleSuccessSubmit} />
        )}

        {currentTab === 'track' && (
          <TrackStatus
            initialReportId={trackedReportState.id}
            initialPin={trackedReportState.pin}
            onGoToSubmitReport={() => setCurrentTab('submit')}
          />
        )}

        {currentTab === 'cases' && (
          user.isAuthenticated ? (
            <CaseManager onOpenChatWithCase={handleOpenChatWithCase} />
          ) : (
            <div className="max-w-md mx-auto my-16 p-8 bg-white border border-slate-200 rounded-2xl shadow-xs text-center">
              <Shield className="w-12 h-12 text-rose-900 mx-auto mb-3" />
              <h2 className="text-lg font-bold text-slate-900">สำหรับเจ้าหน้าที่เท่านั้น</h2>
              <p className="text-xs text-slate-500 mt-1 mb-6">กรุณาเข้าสู่ระบบด้วยบัญชีเจ้าหน้าที่เพื่อเข้าถึงส่วนจัดการรายงาน</p>
              <button
                onClick={() => setIsLoginOpen(true)}
                className="w-full bg-rose-900 hover:bg-rose-800 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                เข้าสู่ระบบเจ้าหน้าที่
              </button>
            </div>
          )
        )}

        {currentTab === 'analytics' && (
          user.isAuthenticated ? (
            <AnalyticsDashboard />
          ) : (
            <div className="max-w-md mx-auto my-16 p-8 bg-white border border-slate-200 rounded-2xl shadow-xs text-center">
              <Shield className="w-12 h-12 text-rose-900 mx-auto mb-3" />
              <h2 className="text-lg font-bold text-slate-900">สำหรับเจ้าหน้าที่เท่านั้น</h2>
              <p className="text-xs text-slate-500 mt-1 mb-6">กรุณาเข้าสู่ระบบด้วยบัญชีเจ้าหน้าที่เพื่อดูสถิติและรายงานสรุป</p>
              <button
                onClick={() => setIsLoginOpen(true)}
                className="w-full bg-rose-900 hover:bg-rose-800 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                เข้าสู่ระบบเจ้าหน้าที่
              </button>
            </div>
          )
        )}

        {currentTab === 'code' && (
          <PythonFlaskCodeView />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#1E0507] border-t border-rose-950/80 py-6 px-4 text-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-rose-200/70">
          
          <div className="flex items-center gap-2.5">
            <img 
              src="/npru_logo.png" 
              alt="NPRU Logo" 
              className="h-10 w-auto object-contain bg-white p-1 rounded-lg border border-rose-800/80 shadow-inner" 
              referrerPolicy="no-referrer" 
            />
            <div>
              <p className="font-bold text-rose-200">Anonymous Report Portal (NPRU Sentinel)</p>
              <p className="text-[11px] text-rose-300/60">ระบบแจ้งเบาะแสและจัดการข้อมูลอย่างเป็นระบบ ปลอดภัย และเข้ารหัส</p>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-4 text-[11px]">
            <span className="flex items-center gap-1.5 text-rose-200/80">
              <Lock className="w-3.5 h-3.5 text-rose-400" />
              <span>AES-256 Encryption</span>
            </span>
            <span className="flex items-center gap-1.5 text-rose-200/80">
              <FileCode className="w-3.5 h-3.5 text-rose-400" />
              <span>SQLite & Security Engine</span>
            </span>
          </div>

          <div className="text-[11px] text-rose-300/60 text-center md:text-right">
            © 2026 NPRU Sentinel Systems. All rights reserved.
          </div>

        </div>
      </footer>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={(loggedInUser) => {
          setUser(loggedInUser);
          // If logged in, navigate to Case Dashboard
          setCurrentTab('cases');
        }}
      />

    </div>
  );
}
