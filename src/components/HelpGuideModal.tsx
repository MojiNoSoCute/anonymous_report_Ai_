/**
 * NPRU Sentinel - How to Use Guide Modal (คู่มือการใช้งานระบบ)
 */

import React, { useState } from 'react';
import { 
  X, BookOpen, Shield, Bot, Search, LayoutDashboard, Key, 
  CheckCircle2, AlertTriangle, FileText, Lock, Users, Terminal,
  ExternalLink, Sparkles, MessageSquare, ChevronRight
} from 'lucide-react';
import npruLogo from '../assets/images/npru_official_logo_1786581106005.jpg';

interface HelpGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab?: (tab: 'submit' | 'track' | 'cases' | 'analytics' | 'code') => void;
  onOpenLogin?: () => void;
}

export const HelpGuideModal: React.FC<HelpGuideModalProps> = ({
  isOpen,
  onClose,
  onNavigateToTab,
  onOpenLogin
}) => {
  const [activeSection, setActiveSection] = useState<'user' | 'admin' | 'ai' | 'developer'>('user');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-rose-950 via-rose-900 to-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-rose-900/60">
          <div className="flex items-center gap-3">
            <div className="bg-white p-1 rounded-xl flex items-center justify-center border border-white/20 shadow-xs">
              <img 
                src={npruLogo} 
                alt="NPRU Logo" 
                className="h-8 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">คู่มือการใช้งานระบบ (User Manual & README)</h2>
                <span className="bg-rose-800 text-rose-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  NPRU Sentinel
                </span>
              </div>
              <p className="text-xs text-rose-200/80 mt-0.5">
                คำแนะนำขั้นตอนการแจ้งเบาะแส การติดตามสถานะ และการจัดการคดีสำหรับเจ้าหน้าที่
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-rose-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Tabs */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2.5 flex flex-wrap gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveSection('user')}
            className={`px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSection === 'user'
                ? 'bg-rose-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>1. สำหรับผู้แจ้งเบาะแส (Whistleblower)</span>
          </button>

          <button
            onClick={() => setActiveSection('ai')}
            className={`px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSection === 'ai'
                ? 'bg-rose-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>2. ระบบ AI Smart Assistant</span>
          </button>

          <button
            onClick={() => setActiveSection('admin')}
            className={`px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSection === 'admin'
                ? 'bg-rose-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>3. สำหรับเจ้าหน้าที่ (Admin/Staff)</span>
          </button>

          <button
            onClick={() => setActiveSection('developer')}
            className={`px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSection === 'developer'
                ? 'bg-rose-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>4. ข้อมูลเชิงเทคนิค (Developer/Setup)</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs text-slate-700 leading-relaxed">
          
          {/* SECTION 1: WHISTLEBLOWER */}
          {activeSection === 'user' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3">
                <Shield className="w-5 h-5 text-rose-800 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-rose-950 text-sm">หลักการนิรนาม 100% (Anonymity Guaranteed)</h3>
                  <p className="text-rose-900/90 mt-1">
                    ระบบไม่มีการเก็บชื่อ นามสกุล รหัสนักศึกษา หรือ IP Address ของท่าน ข้อมูลรายงานและไฟล์หลักฐานจะถูกจัดเก็บอย่างปลอดภัย พร้อมสร้างรหัส <strong>Report ID</strong> และ <strong>PIN ลับ 6 หลัก</strong> สำหรับใช้ติดตามผลด้วยตัวท่านเอง
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-rose-900 text-white flex items-center justify-center text-[10px]">1</span>
                  <span>ขั้นตอนการส่งรายงานแจ้งเบาะแส</span>
                </h4>
                
                <ol className="list-decimal pl-5 space-y-2 text-slate-600">
                  <li>
                    <strong className="text-slate-900">เลือกหมวดหมู่เรื่องร้องเรียน:</strong> เช่น การล่วงละเมิด/คุกคาม, การทุจริต, ปัญหาเกี่ยวกับอาจารย์/การสอน, ความปลอดภัย หรือข้อบังคับวินัย (หรือปล่อยให้ AI ช่วยเลือกให้อัตโนมัติ)
                  </li>
                  <li>
                    <strong className="text-slate-900">กรอกสถานที่และรายละเอียดเหตุการณ์:</strong> อธิบายสิ่งที่พบเห็น บุคคลที่เกี่ยวข้อง หรือเวลาที่เกิดเหตุ
                  </li>
                  <li>
                    <strong className="text-slate-900">การวิเคราะห์อัตโนมัติ:</strong> เมื่อพิมพ์รายละเอียด ระบบ AI Smart Assistant จะประมวลผลหมวดหมู่และระดับความเร่งด่วนให้อัตโนมัติ
                  </li>
                  <li>
                    <strong className="text-slate-900">แนบไฟล์หลักฐาน (ไม่บังคับ):</strong> สามารถลากวางหรือเลือกไฟล์รูปภาพ เอกสาร PDF เพื่อประกอบการพิจารณา
                  </li>
                  <li>
                    <strong className="text-slate-900">กดปุ่ม "ส่งรายงานอย่างปลอดภัย":</strong> ระบบจะสร้างรหัสรายงาน (Report ID) และรหัส PIN ลับ 6 หลัก
                  </li>
                </ol>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center gap-2.5 text-amber-900 font-medium">
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                  <span><strong>ข้อควรจำ:</strong> บันทึกรหัส Report ID และ PIN ลับ 6 หลักไว้ทันที เพราะระบบไม่สามารถกู้คืนรหัส PIN ให้ได้หากสูญหาย</span>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-rose-900 text-white flex items-center justify-center text-[10px]">2</span>
                  <span>ขั้นตอนการติดตามสถานะและการแชทลับ</span>
                </h4>
                <p className="text-slate-600">
                  ไปที่เมนู <strong>"ติดตามสถานะ"</strong> กรอก Report ID และ PIN 6 หลัก จากนั้นกดตรวจสอบข้อมูล ท่านจะสามารถ:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  <li>ดูขั้นตอนการดำเนินงานของคดี (รับเรื่อง, กำลังตรวจสอบ, ดำเนินการทางวินัย, ปิดเรื่อง)</li>
                  <li>สนทนาแบบสองทางกับเจ้าหน้าที่ผู้รับผิดชอบคดี โดยไม่ต้องระบุตัวตน</li>
                  <li>ส่งหลักฐานหรือข้อมูลเพิ่มเติมให้เจ้าหน้าที่ได้ตลอดเวลา</li>
                </ul>
              </div>
            </div>
          )}

          {/* SECTION 2: AI SMART ASSISTANT */}
          {activeSection === 'ai' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-rose-800 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-rose-950 text-sm">การทำงานของ Gemini 3.6 Flash AI Smart Assistant</h3>
                  <p className="text-rose-900/90 mt-1">
                    ระบบเชื่อมต่อกับโมเดล <strong>Gemini 3.6 Flash</strong> ผ่านเซิร์ฟเวอร์แบบปลอดภัย (Server-Side Proxy) เพื่อวิเคราะห์บริบทภาษาไทย ทำความเข้าใจเจตนา และช่วยคัดกรองเบาะแสได้อย่างเที่ยงตรง
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-rose-900 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>การจัดหมวดหมู่อัตโนมัติ (Auto Categorization)</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    AI จะจำแนกหมวดหมู่ที่เหมาะสมที่สุดจาก 7 ประเภท ได้แก่ การล่วงละเมิด/คุกคาม, การทุจริต, ปัญหาเกี่ยวกับอาจารย์/การสอน, ความปลอดภัย, วิชาการ, ไซเบอร์ และกฎระเบียบวินัย
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-rose-900 font-bold text-xs">
                    <Lock className="w-4 h-4 text-rose-800" />
                    <span>การประเมินความเร่งด่วนและสิทธิ์แก้ไข (Urgency & Admin Lock)</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    AI ประเมินความเร่งด่วนเบื้องต้นเป็น <strong>ปกติ (Low)</strong>, <strong>ปานกลาง (Medium)</strong>, <strong>สูง (High)</strong>, หรือ <strong>วิกฤต (Critical)</strong> โดยในฟอร์มแจ้งเบาะแสจะล็อกไม่ให้ผู้แจ้งแก้ไขเองได้ และสงวนสิทธิ์ให้เฉพาะ <strong>Admin</strong> เป็นผู้ทบทวนแก้ไขเท่านั้น
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5 text-[11px]">
                <p className="font-bold text-slate-800">💡 การทดสอบ AI:</p>
                <p className="text-slate-600">
                  ในหน้า "สร้างรายงานใหม่" มีปุ่มตัวอย่างเรื่องร้องเรียนทดสอบ 4 สถานการณ์ (คุกคาม, ทุจริต, อาจารย์ไม่เข้าสอน, อุปกรณ์ชำรุด) ให้ท่านสามารถกดคลิกเพื่อทดสอบพลังการวิเคราะห์ของ Gemini AI ได้ทันที
                </p>
              </div>
            </div>
          )}

          {/* SECTION 3: ADMIN & STAFF */}
          {activeSection === 'admin' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="bg-slate-900 text-white rounded-xl p-4 space-y-2 border border-slate-800">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <Key className="w-4 h-4 text-rose-400" />
                    <span>ข้อมูลบัญชีเจ้าหน้าที่สำหรับทดสอบ (Test Accounts)</span>
                  </h3>
                  {onOpenLogin && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenLogin();
                      }}
                      className="bg-rose-900 hover:bg-rose-800 text-white text-[11px] font-bold px-3 py-1 rounded-lg transition-colors cursor-pointer"
                    >
                      เปิดหน้าเข้าสู่ระบบ
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs font-mono">
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <p className="text-rose-400 font-bold font-sans">1. บัญชี Admin (สิทธิ์สูงสุด)</p>
                    <p className="text-slate-300 mt-1">Username: <span className="text-amber-300">admin</span></p>
                    <p className="text-slate-300">Password: <span className="text-amber-300">admin123</span></p>
                    <p className="text-[10px] text-slate-400 font-sans mt-1">✓ แก้ไขความเร่งด่วนได้ ✓ เปลี่ยนสถานะได้ ✓ ดูสถิติและ Audit Logs</p>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <p className="text-rose-400 font-bold font-sans">2. บัญชี Officer (เจ้าหน้าที่ตรวจสอบ)</p>
                    <p className="text-slate-300 mt-1">Username: <span className="text-amber-300">officer1</span></p>
                    <p className="text-slate-300">Password: <span className="text-amber-300">officer123</span></p>
                    <p className="text-[10px] text-slate-400 font-sans mt-1">✓ ตรวจสอบข้อมูลคดี ✓ แชทตอบกลับผู้แจ้ง ✓ เปลี่ยนสถานะคดี</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-extrabold text-slate-900 text-sm">ฟังก์ชันในระบบจัดการคดี (Case Management Tools)</h4>
                
                <div className="space-y-2">
                  <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-start gap-3">
                    <LayoutDashboard className="w-4 h-4 text-rose-800 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 block">การกรองและค้นหาคดี:</strong>
                      <span className="text-slate-600 text-[11px]">สามารถค้นหาตามรหัสคดี, คำสำคัญ, กรองเฉพาะเรื่องด่วน (Critical/High), หรือกรองตามหมวดหมู่</span>
                    </div>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-start gap-3">
                    <Lock className="w-4 h-4 text-rose-800 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 block">การปรับระดับความเร่งด่วน (Admin Quick Urgency Setter):</strong>
                      <span className="text-slate-600 text-[11px]">เจ้าหน้าที่ Admin สามารถกดปุ่มปรับความเร่งด่วนของคดีได้ทันทีใน Modal รายละเอียด</span>
                    </div>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-start gap-3">
                    <MessageSquare className="w-4 h-4 text-rose-800 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 block">การแชทนิรนามกับผู้แจ้ง:</strong>
                      <span className="text-slate-600 text-[11px]">ส่งข้อความสอบถามพยานหลักฐานเพิ่มเติมโดยระบบจะรักษาความลับของผู้แจ้งอย่างเคร่งครัด</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: DEVELOPER & SETUP */}
          {activeSection === 'developer' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="bg-slate-950 text-slate-200 rounded-xl p-4 font-mono space-y-3 border border-slate-800 text-[11px]">
                <p className="font-bold text-rose-400 font-sans text-xs">🚀 วิธีรันโปรเจกต์ (Full-Stack Node.js)</p>
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-slate-300">
                  # 1. ติดตั้ง Dependencies<br />
                  npm install<br /><br />
                  # 2. ตั้งค่า Environment Variable ใน .env<br />
                  GEMINI_API_KEY="AIzaSy..."<br /><br />
                  # 3. รัน Development Server (Port 3000)<br />
                  npm run dev
                </div>

                <p className="font-bold text-rose-400 font-sans text-xs pt-2">🐍 วิธีรันเซิร์ฟเวอร์ Python Flask Alternative Backend</p>
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-slate-300">
                  python -m venv venv<br />
                  source venv/bin/activate  # บน Windows: venv\Scripts\activate<br />
                  pip install flask flask-cors<br />
                  python app.py
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
                <h4 className="font-bold text-slate-900 text-xs">เอกสาร README.md ในโปรเจกต์</h4>
                <p className="text-slate-600 text-[11px]">
                  ไฟล์ <code>README.md</code> ถูกจัดทำไว้ที่รากของโปรเจกต์เรียบร้อยแล้ว ท่านสามารถเปิดอ่านหรือ Export โปรเจกต์ผ่านเมนู Settings ของ Google AI Studio เพื่อนำไปใช้งานได้อย่างสมบูรณ์แบบ
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <Shield className="w-4 h-4 text-rose-900" />
            <span>NPRU Sentinel © 2026 Nakhon Pathom Rajabhat University</span>
          </div>

          <button
            onClick={onClose}
            className="bg-rose-900 hover:bg-rose-800 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer shadow-xs"
          >
            เข้าใจแล้ว / ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
};
