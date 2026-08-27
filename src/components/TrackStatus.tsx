/**
 * TrustLine Portal - Track Report Status & Secret Chat (หน้าติดตามสถานะและแชทลับ)
 * ตรวจสอบความคืบหน้ารายงานพร้อมช่องทางสนทนาลับและอัปโหลดหลักฐานเพิ่มเติม
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Lock, Check, Clock, AlertCircle, Send, UploadCloud, 
  Trash2, Shield, Calendar, MapPin, MessageSquare, Paperclip, FileText, File,
  Radio, Wifi, Sparkles
} from 'lucide-react';
import { ReportItem, ChatMessage, EvidenceFile } from '../types';
import { db } from '../db/sqlite';
import { realtimeService } from '../services/realtime';

interface TrackStatusProps {
  initialReportId?: string;
  initialPin?: string;
  onGoToSubmitReport?: () => void;
}

export const TrackStatus: React.FC<TrackStatusProps> = ({
  initialReportId = '',
  initialPin = '',
  onGoToSubmitReport
}) => {
  const [reportIdInput, setReportIdInput] = useState<string>(initialReportId);
  const [pinInput, setPinInput] = useState<string>(initialPin);
  const [activeReport, setActiveReport] = useState<ReportItem | null>(() => {
    if (initialReportId && initialPin) {
      return db.getReportByIdAndPin(initialReportId, initialPin) || null;
    }
    return null;
  });
  const [loginError, setLoginError] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return activeReport ? db.getMessages(activeReport.id) : [];
  });
  const [chatInput, setChatInput] = useState<string>('');
  const [isWsConnected, setIsWsConnected] = useState<boolean>(realtimeService.getIsConnected());
  const [otherUserTyping, setOtherUserTyping] = useState<string | null>(null);
  const typingTimeoutRef = useRef<any>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollMessagesToBottom = (smooth = false) => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
    if (messagesEndRef.current) {
      try {
        messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'end' });
      } catch {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      }
    }
  };

  // Subscribe to real-time updates when activeReport changes
  useEffect(() => {
    const unsubConn = realtimeService.onConnectionChange(setIsWsConnected);

    if (!activeReport) return unsubConn;

    // Join case room
    realtimeService.subscribe(activeReport.id, false);

    // Sync latest messages
    setMessages(db.getMessages(activeReport.id));

    // Jump to latest message immediately on case open
    requestAnimationFrame(() => scrollMessagesToBottom(false));
    const t1 = setTimeout(() => scrollMessagesToBottom(false), 50);
    const t2 = setTimeout(() => scrollMessagesToBottom(false), 150);
    const t3 = setTimeout(() => scrollMessagesToBottom(false), 300);

    // Listen for new messages in real-time
    const unsubMsg = realtimeService.onCaseMessage(activeReport.id, (newMsg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
      // Clear typing indicator when message arrives
      setOtherUserTyping(null);
    });

    // Listen for typing events
    const unsubTyping = realtimeService.onTyping(activeReport.id, (info) => {
      if (info.userRole === 'investigator') {
        if (info.isTyping) {
          setOtherUserTyping(info.userName || 'เจ้าหน้าที่สืบสวน');
        } else {
          setOtherUserTyping(null);
        }
      }
    });

    // Listen for report status updates in real-time
    const unsubReport = realtimeService.onReportUpdated((updatedReport) => {
      if (updatedReport.id.toLowerCase() === activeReport.id.toLowerCase()) {
        setActiveReport(updatedReport);
      }
    });

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      unsubConn();
      unsubMsg();
      unsubTyping();
      unsubReport();
    };
  }, [activeReport?.id]);

  // Auto-scroll chat to bottom on changes
  useEffect(() => {
    if (activeReport) {
      scrollMessagesToBottom(false);
    }
  }, [messages, otherUserTyping]);

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const found = db.getReportByIdAndPin(reportIdInput, pinInput);
    if (!found) {
      setLoginError('ไม่พบรหัสรายงาน หรือรหัสผ่าน (PIN) ไม่ถูกต้อง');
      return;
    }

    setActiveReport(found);
    setMessages(db.getMessages(found.id));

    // Instant jump to bottom
    requestAnimationFrame(() => scrollMessagesToBottom(false));
    setTimeout(() => scrollMessagesToBottom(false), 50);
    setTimeout(() => scrollMessagesToBottom(false), 150);
  };

  const handleChatInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChatInput(e.target.value);

    if (activeReport) {
      realtimeService.sendTyping(activeReport.id, 'reporter', 'คุณ (ผู้แจ้ง)', true);

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        if (activeReport) {
          realtimeService.sendTyping(activeReport.id, 'reporter', 'คุณ (ผู้แจ้ง)', false);
        }
      }, 1500);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const textToSend = chatInput.trim();
    if (!textToSend || !activeReport) return;

    // Send via WebSocket realtime service
    realtimeService.sendMessage(
      activeReport.id,
      'reporter',
      'คุณ (ผู้แจ้ง)',
      textToSend
    );

    // Stop typing
    realtimeService.sendTyping(activeReport.id, 'reporter', 'คุณ (ผู้แจ้ง)', false);
    setChatInput('');
  };

  const handleUploadAdditionalEvidence = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !activeReport) return;

    const file = e.target.files[0];
    const isImage = file.type.startsWith('image/');
    const previewUrl = isImage 
      ? URL.createObjectURL(file) 
      : 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&auto=format&fit=crop&q=80';

    const newEvidence: EvidenceFile = {
      id: `ev-${Date.now()}`,
      reportId: activeReport.id,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type || 'application/octet-stream',
      url: previewUrl,
      uploadedAt: new Date().toLocaleString('th-TH')
    };

    db.addEvidence(activeReport.id, newEvidence, 'Reporter');
    setActiveReport(db.getReportById(activeReport.id) || null);
  };

  const handleWithdrawReport = () => {
    if (!activeReport) return;
    if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการถอนรายงาน #${activeReport.id}? ข้อมูลทั้งหมดจะถูกลบถาวร`)) {
      db.deleteReport(activeReport.id, 'Reporter');
      setActiveReport(null);
      alert('ถอนรายงานเรียบร้อยแล้ว');
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 space-y-6">
      
      {/* Search / PIN Input Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
        <div className="text-center max-w-md mx-auto mb-5">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">ติดตามสถานะรายงาน (Track Status)</h1>
          <p className="text-xs text-slate-500 mt-1">กรอกรหัสอ้างอิงรายงานและ PIN เพื่อตรวจสอบความคืบหน้าและแชทกับเจ้าหน้าที่</p>
        </div>

        <form onSubmit={handleTrackSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3 max-w-2xl mx-auto">
          <div className="md:col-span-5 space-y-1">
            <label className="text-[11px] font-bold text-slate-700 block">รหัสรายงาน (Report ID)</label>
            <input
              type="text"
              placeholder="TL-XXXX-XXXX"
              value={reportIdInput}
              onChange={(e) => setReportIdInput(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-mono tracking-wider focus:border-rose-900 focus:ring-2 focus:ring-rose-900/10 outline-none uppercase font-bold bg-slate-50 focus:bg-white transition-all"
            />
          </div>

          <div className="md:col-span-4 space-y-1">
            <label className="text-[11px] font-bold text-slate-700 block">รหัสผ่านลับ (PIN)</label>
            <input
              type="password"
              placeholder="••••"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-mono tracking-widest focus:border-rose-900 focus:ring-2 focus:ring-rose-900/10 outline-none font-bold bg-slate-50 focus:bg-white transition-all"
            />
          </div>

          <div className="md:col-span-3 flex items-end">
            <button
              type="submit"
              className="w-full bg-rose-900 hover:bg-rose-800 text-white text-xs font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <Search className="w-4 h-4 text-rose-200" />
              <span>ตรวจสอบ</span>
            </button>
          </div>
        </form>

        {/* Quick Demo Cases Pills */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="text-slate-400 text-[11px] font-medium">รายงานตัวอย่างทดสอบ:</span>
          <button
            type="button"
            onClick={() => {
              setReportIdInput('TL-8942-XCVB');
              setPinInput('8942');
              const found = db.getReportByIdAndPin('TL-8942-XCVB', '8942');
              if (found) {
                setActiveReport(found);
                setMessages(db.getMessages(found.id));
              }
            }}
            className="px-2.5 py-1 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-900 border border-slate-200 rounded-lg text-[11px] font-mono font-bold transition-colors cursor-pointer"
          >
            TL-8942-XCVB (กำลังตรวจสอบ)
          </button>
          <button
            type="button"
            onClick={() => {
              setReportIdInput('TL-1092-AABB');
              setPinInput('1092');
              const found = db.getReportByIdAndPin('TL-1092-AABB', '1092');
              if (found) {
                setActiveReport(found);
                setMessages(db.getMessages(found.id));
              }
            }}
            className="px-2.5 py-1 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-900 border border-slate-200 rounded-lg text-[11px] font-mono font-bold transition-colors cursor-pointer"
          >
            TL-1092-AABB (การล่วงละเมิด)
          </button>
        </div>

        {loginError && (
          <div className="mt-3 text-center text-xs text-red-700 bg-red-50 p-2.5 rounded-xl border border-red-200 font-bold">
            {loginError}
          </div>
        )}
      </div>

      {/* Active Report Status View */}
      {activeReport ? (
        <div className="space-y-6">
          
          {/* Header Info */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs gap-3">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">รหัสอ้างอิงรายงาน</span>
              <h2 className="text-xl font-mono font-bold text-rose-900 tracking-wider">{activeReport.id}</h2>
            </div>

            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-2 bg-rose-50 text-rose-900 border border-rose-200 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-rose-700 animate-pulse"></span>
                <span>{activeReport.statusLabelTh}</span>
              </span>

              <button
                onClick={handleWithdrawReport}
                className="border border-slate-200 text-slate-600 text-xs font-bold px-3 py-1.5 rounded-xl hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors cursor-pointer"
              >
                ถอนรายงาน
              </button>
            </div>
          </div>

          {/* Stepper Timeline */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-6">ความคืบหน้าดำเนินการ (Status Timeline)</h3>
            
            <div className="relative pl-6 space-y-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              
              {/* Step 1: Received */}
              <div className="relative flex items-start gap-4">
                <div className="absolute -left-6 top-0 w-6 h-6 rounded-full bg-rose-900 text-white flex items-center justify-center text-xs font-bold z-10 shadow-xs">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-rose-900">1. รับเรื่องในระบบเรียบร้อย</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {activeReport.createdAt} - บันทึกรายงานเข้าสู่ระบบประมวลผลความปลอดภัย
                  </p>
                </div>
              </div>

              {/* Step 2: Investigating */}
              <div className="relative flex items-start gap-4">
                <div className={`absolute -left-6 top-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold z-10 ${
                  activeReport.status === 'investigating' || activeReport.status === 'disciplinary' || activeReport.status === 'closed'
                    ? 'bg-rose-900 text-white ring-4 ring-rose-100'
                    : 'bg-slate-100 text-slate-400 border border-slate-300'
                }`}>
                  <Search className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className={`text-xs font-bold ${
                    activeReport.status === 'investigating' ? 'text-rose-900 font-bold' : 'text-slate-800'
                  }`}>
                    2. กำลังตรวจสอบข้อเท็จจริง
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    เจ้าหน้าที่กำลังดำเนินการตรวจสอบข้อมูลเบื้องต้นและรวบรวมหลักฐาน ({activeReport.assignedTo})
                  </p>
                </div>
              </div>

              {/* Step 3: Disciplinary */}
              <div className="relative flex items-start gap-4">
                <div className={`absolute -left-6 top-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold z-10 ${
                  activeReport.status === 'disciplinary' || activeReport.status === 'closed'
                    ? 'bg-rose-900 text-white'
                    : 'bg-slate-100 text-slate-400 border border-slate-300'
                }`}>
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className={`text-xs font-bold ${
                    activeReport.status === 'disciplinary' ? 'text-rose-900 font-bold' : 'text-slate-500'
                  }`}>
                    3. ดำเนินการทางวินัย/กฎหมาย
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {activeReport.status === 'disciplinary' ? 'กำลังพิจารณาโทษทางวินัย' : 'รอดำเนินการ'}
                  </p>
                </div>
              </div>

              {/* Step 4: Closed */}
              <div className="relative flex items-start gap-4">
                <div className={`absolute -left-6 top-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold z-10 ${
                  activeReport.status === 'closed'
                    ? 'bg-rose-900 text-white'
                    : 'bg-slate-100 text-slate-400 border border-slate-300'
                }`}>
                  <Shield className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className={`text-xs font-bold ${
                    activeReport.status === 'closed' ? 'text-rose-900 font-bold' : 'text-slate-500'
                  }`}>
                    4. ปิดเรื่องเรียบร้อยแล้ว
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {activeReport.status === 'closed' ? 'กระบวนการสอบสวนเสร็จสิ้นแล้ว' : 'รอดำเนินการ'}
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Secret Chat & Details Bento Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Secret Chat */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col h-[480px] shadow-xs">
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-rose-900" />
                  <h3 className="text-sm font-bold text-slate-900">ช่องทางสนทนาลับ (Encrypted Chat)</h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${isWsConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`}></span>
                  <span className="text-[11px] font-bold text-slate-600">
                    {isWsConnected ? 'สนทนาสด Real-time' : 'กำลังเชื่อมต่อ'}
                  </span>
                </div>
              </div>

              {/* Chat Message List */}
              <div ref={messagesContainerRef} className="flex-1 overflow-y-auto space-y-3 pr-1">
                {messages.length === 0 ? (
                  <div className="text-center py-12 text-xs text-slate-400">
                    ยังไม่มีข้อความสนทนา พิมพ์ข้อความเพื่อสื่อสารกับเจ้าหน้าที่สืบสวน
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${
                        msg.senderRole === 'reporter' ? 'items-end' : 'items-start'
                      }`}
                    >
                      <span className="text-[10px] text-slate-400 mb-1 px-1">
                        {msg.senderName} - {msg.timestamp}
                      </span>
                      <div
                        className={`p-3 rounded-2xl max-w-[85%] text-xs leading-relaxed ${
                          msg.senderRole === 'reporter'
                            ? 'bg-rose-900 text-white rounded-tr-none shadow-2xs font-medium'
                            : 'bg-slate-100 text-slate-900 border border-slate-200 rounded-tl-none font-medium'
                        }`}
                      >
                        {msg.message}
                      </div>
                    </div>
                  ))
                )}

                {/* Real-time Typing Indicator */}
                {otherUserTyping && (
                  <div className="flex flex-col items-start animate-fade-in">
                    <span className="text-[10px] text-slate-400 mb-1 px-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-rose-600 animate-spin" />
                      <span>{otherUserTyping} กำลังพิมพ์...</span>
                    </span>
                    <div className="bg-slate-100 border border-slate-200 rounded-2xl rounded-tl-none px-3.5 py-2.5 flex items-center gap-1.5 shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <form onSubmit={handleSendMessage} className="mt-3 pt-3 border-t border-slate-100 flex gap-2">
                <input
                  type="text"
                  placeholder="พิมพ์ข้อความตอบกลับอย่างปลอดภัย..."
                  value={chatInput}
                  onChange={handleChatInputChange}
                  className="flex-1 border border-slate-200 bg-slate-50 rounded-xl p-2.5 text-xs focus:border-rose-900 focus:bg-white focus:ring-2 focus:ring-rose-900/10 outline-none transition-all"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="bg-rose-900 hover:bg-rose-800 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center cursor-pointer transition-all shadow-xs active:scale-95"
                >
                  <Send className="w-4 h-4 text-rose-200" />
                </button>
              </form>
            </div>

            {/* Evidence & Details Stack */}
            <div className="space-y-6">
              
              {/* Additional Evidence Upload */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
                  <UploadCloud className="w-4 h-4 text-rose-900" />
                  <span>อัปโหลดหลักฐานเพิ่มเติม</span>
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  ไฟล์ของท่านจะถูกเข้ารหัสก่อนส่งไปยังเซิร์ฟเวอร์
                </p>

                <label className="border-2 border-dashed border-slate-200 rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-rose-50/50 hover:border-rose-300 transition-all relative block group">
                  <input
                    type="file"
                    onChange={handleUploadAdditionalEvidence}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Paperclip className="w-7 h-7 text-rose-900 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-rose-900">
                    คลิกเพื่อเลือกไฟล์ หรือ ลากไฟล์มาวาง
                  </span>
                  <span className="text-[11px] text-slate-400 mt-1">
                    รองรับ PDF, JPG, PNG (สูงสุด 10MB)
                  </span>
                </label>

                {/* Evidence List Table */}
                {activeReport.evidenceFiles.length > 0 && (
                  <div className="mt-4 border-t border-slate-100 pt-3">
                    <span className="text-xs font-bold text-slate-800 block mb-2">
                      หลักฐานที่อัปโหลดแล้ว ({activeReport.evidenceFiles.length} ไฟล์):
                    </span>
                    <div className="space-y-2">
                      {activeReport.evidenceFiles.map((ev) => (
                        <div
                          key={ev.id}
                          className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                        >
                          <div className="flex items-center gap-2">
                            {ev.fileType.startsWith('image/') ? (
                              <img src={ev.url} alt={ev.fileName} className="w-8 h-8 object-cover rounded-lg border border-slate-200" />
                            ) : (
                              <File className="w-5 h-5 text-rose-900" />
                            )}
                            <span className="font-medium text-slate-800 truncate max-w-[200px]">{ev.fileName}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">{ev.uploadedAt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Report Summary */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 mb-3 border-b border-slate-100 pb-2">
                  สรุปข้อมูลการแจ้งเบาะแส
                </h3>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-slate-400 font-semibold block text-[11px]">หมวดหมู่:</span>
                    <p className="font-bold text-slate-800">{activeReport.categoryLabelTh}</p>
                  </div>

                  <div>
                    <span className="text-slate-400 font-semibold block text-[11px]">วันที่และสถานที่เกิดเหตุ:</span>
                    <p className="text-slate-800 font-medium">{activeReport.incidentDate} | {activeReport.location}</p>
                  </div>

                  <div>
                    <span className="text-slate-400 font-semibold block text-[11px]">รายละเอียด (ย่อ):</span>
                    <p className="text-slate-700 bg-slate-50 p-3 border border-slate-200/80 rounded-xl mt-1 leading-relaxed">
                      {activeReport.description}
                    </p>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>
      ) : (
        <div className="text-center py-12 px-6 bg-white border border-rose-100 rounded-2xl shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-red-700 border border-rose-200 flex items-center justify-center mx-auto shadow-xs">
            <Lock className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-lg font-black text-slate-900">ยังไม่มีข้อมูลรายงานที่เลือก</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              กรุณากรอก <span className="font-bold text-slate-800">รหัสรายงาน (Report ID)</span> และ <span className="font-bold text-slate-800">รหัส PIN</span> ด้านบนเพื่อตรวจสอบสถานะ หรือหากยังไม่ได้สร้างรายงาน สามารถสร้างเรื่องใหม่ได้ทันที
            </p>
          </div>

          {onGoToSubmitReport && (
            <div className="pt-2">
              <button
                onClick={onGoToSubmitReport}
                className="bg-gradient-to-r from-red-700 to-rose-700 hover:from-red-800 hover:to-rose-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md transition-all inline-flex items-center gap-2 cursor-pointer active:scale-95 border border-red-600/50"
              >
                <FileText className="w-4 h-4 text-rose-200" />
                <span>สร้างรายงานแจ้งเบาะแสใหม่</span>
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
