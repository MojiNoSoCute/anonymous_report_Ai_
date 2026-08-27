/**
 * TrustLine Portal - Create Report View (หน้าสร้างรายงานใหม่)
 * ฟอร์มแจ้งเบาะแสลับพร้อมระบบอัปโหลดไฟล์หลักฐาน และแสดงผลตารางไฟล์โต้ตอบได้
 */

import React, { useState } from 'react';
import { 
  Lock, Verified, EyeOff, ShieldCheck, FolderTree, AlertTriangle, FileText, 
  UploadCloud, Send, Save, CheckCircle2, LockKeyhole, Calendar, MapPin, Trash2, File,
  Copy, Check, Sparkles, Bot, Wand2, RefreshCw
} from 'lucide-react';
import { CategoryType, UrgencyLevel, EvidenceFile } from '../types';
import { db } from '../db/sqlite';
import { analyzeReportWithRealAI, analyzeReportWithAI, AIAnalysisResult } from '../lib/aiAnalyzer';

interface SubmitReportProps {
  onSuccessSubmit: (reportId: string, pin: string) => void;
}

export const SubmitReport: React.FC<SubmitReportProps> = ({ onSuccessSubmit }) => {
  const [category, setCategory] = useState<CategoryType>('harassment');
  const [urgency, setUrgency] = useState<UrgencyLevel>('medium');
  const [incidentDate, setIncidentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [location, setLocation] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [files, setFiles] = useState<EvidenceFile[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [createdReportInfo, setCreatedReportInfo] = useState<{ id: string; pin: string } | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // AI Categorization State
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  const [aiApplied, setAiApplied] = useState<boolean>(false);

  const handleRunAIAnalysis = async (targetText?: string, targetLoc?: string) => {
    const textToAnalyze = targetText !== undefined ? targetText : description;
    const locToAnalyze = targetLoc !== undefined ? targetLoc : location;

    if (!textToAnalyze.trim()) {
      alert('กรุณากรอกคำอธิบายเหตุการณ์ หรือเลือกข้อความตัวอย่างก่อนใช้ AI วิเคราะห์');
      return;
    }

    setIsAnalyzing(true);
    setAiApplied(false);

    try {
      const result = await analyzeReportWithRealAI(textToAnalyze, locToAnalyze);
      setAiResult(result);
      setCategory(result.category);
      setUrgency(result.urgency);
      setAiApplied(true);
    } catch (err) {
      console.error('Error during AI Analysis:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplySampleTemplate = (sampleText: string, sampleLoc: string) => {
    setDescription(sampleText);
    setLocation(sampleLoc);
    handleRunAIAnalysis(sampleText, sampleLoc);
  };

  const handleCopyCredentials = () => {
    if (!createdReportInfo) return;
    const textToCopy = `รหัสรายงาน: ${createdReportInfo.id}\nPIN: ${createdReportInfo.pin}`;
    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Handle Drag & Drop / File Input
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    let selectedFiles: FileList | File[] | null = null;
    
    if ('dataTransfer' in e && e.dataTransfer) {
      e.preventDefault();
      selectedFiles = e.dataTransfer.files;
    } else if ('target' in e && e.target && (e.target as HTMLInputElement).files) {
      selectedFiles = (e.target as HTMLInputElement).files;
    }

    if (!selectedFiles || selectedFiles.length === 0) return;

    setIsUploading(true);

    const newEvidenceList: EvidenceFile[] = [];
    Array.from(selectedFiles).forEach((file, index) => {
      const isImage = file.type.startsWith('image/');
      // Create object URL or fallback mock URL for preview table
      const previewUrl = isImage 
        ? URL.createObjectURL(file) 
        : 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&auto=format&fit=crop&q=80';

      newEvidenceList.push({
        id: `file-${Date.now()}-${index}`,
        reportId: '',
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type || 'application/octet-stream',
        url: previewUrl,
        uploadedAt: new Date().toLocaleString('th-TH')
      });
    });

    setTimeout(() => {
      setFiles(prev => [...prev, ...newEvidenceList]);
      setIsUploading(false);
    }, 600);
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      alert('กรุณากรอกคำอธิบายเหตุการณ์');
      return;
    }

    // Generate random 4-digit PIN
    const generatedPin = Math.floor(1000 + Math.random() * 9000).toString();

    const created = db.createReport({
      pin: generatedPin,
      category,
      categoryLabelTh: getCategoryLabel(category),
      urgency,
      incidentDate: incidentDate || new Date().toISOString().split('T')[0],
      location: location || 'ไม่ระบุ',
      description,
      evidenceFiles: files
    });

    setCreatedReportInfo({ id: created.id, pin: generatedPin });
    setShowSuccessModal(true);
  };

  const getCategoryLabel = (cat: CategoryType): string => {
    switch (cat) {
      case 'harassment': return 'การล่วงละเมิดและคุกคาม (Harassment & Bullying)';
      case 'compliance': return 'การปฏิบัติตามกฎระเบียบ (Compliance & Ethics)';
      case 'technical': return 'ปัญหาทางเทคนิค/ความปลอดภัย (Technical / Security)';
      case 'fraud': return 'การทุจริตทางการเงิน (Financial Fraud)';
      case 'safety': return 'ความปลอดภัยและสิ่งแวดล้อม (Safety)';
      case 'academic': return 'การประพฤติผิดทางวิชาการ (Academic Misconduct)';
      case 'teaching': return 'รายงานเกี่ยวกับอาจารย์ / คุณภาพการสอน (Teaching & Instructor Issues)';
      default: return 'อื่นๆ';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 space-y-6">
      
      {/* Portal Header / Welcome Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 md:p-8 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold px-2.5 py-1 rounded-full mb-3">
              <Lock className="w-3.5 h-3.5 text-rose-700" />
              <span>ระบบปลอดภัย เข้ารหัสความลับระดับสูง (AES-256)</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              ส่งรายงานเบาะแสลับ <span className="text-rose-900">(Anonymous Report)</span>
            </h1>
            <p className="text-xs md:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
              ช่องทางแจ้งเบาะแสและเรื่องร้องเรียน มหาวิทยาลัยราชภัฏนครปฐม ข้อมูลและตัวตนของคุณจะได้รับการปกป้องอย่างสมบูรณ์ ไม่มีการเก็บบันทึก IP Address หรือตัวตนผู้ส่ง
            </p>
          </div>

          <div className="hidden lg:flex flex-col gap-2 shrink-0 border-l border-slate-100 pl-6 text-xs text-slate-600">
            <div className="flex items-center gap-2 font-medium">
              <Verified className="w-4 h-4 text-emerald-600" />
              <span>ไม่ระบุตัวตน 100%</span>
            </div>
            <div className="flex items-center gap-2 font-medium">
              <EyeOff className="w-4 h-4 text-rose-700" />
              <span>ไม่มีการเก็บบันทึกคุกกี้</span>
            </div>
            <div className="flex items-center gap-2 font-medium">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>มีรหัส PIN สำหรับติดตาม</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Form Container */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 md:p-8 shadow-xs">
        
        {/* Form Title & Stepper Header */}
        <div className="mb-8 pb-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              แบบฟอร์มบันทึกข้อมูล (Report Form)
            </h2>
            <p className="text-xs text-slate-500">
              กรุณากรอกรายละเอียดเหตุการณ์ให้ครบถ้วนเพื่อประสิทธิภาพในการสืบสวน
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>สถานะระบบ: พร้อมรับเรื่องร้องเรียน</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* AI Helper Banner Card */}
          <div className="bg-gradient-to-r from-rose-900/90 via-red-900 to-slate-900 text-white rounded-2xl p-5 shadow-md border border-rose-700/50 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/10 text-rose-200 border border-white/20 flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5 text-rose-300" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                    <span>AI ช่วยวิเคราะห์หมวดหมู่และความเร่งด่วนอัตโนมัติ</span>
                    <span className="bg-rose-500/30 text-rose-200 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-400/30">
                      Smart Assistant
                    </span>
                  </h3>
                  <p className="text-xs text-rose-100/80 mt-0.5">
                    พิมพ์รายละเอียดเหตุการณ์ด้านล่าง แล้วกดปุ่มวิเคราะห์ ระบบ AI จะประมวลผลหมวดหมู่และระดับความเร่งด่วนที่เหมาะสมที่สุดให้ทันที
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleRunAIAnalysis()}
                disabled={isAnalyzing}
                className="bg-white hover:bg-rose-50 text-rose-950 font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer active:scale-95 border border-white/80 disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-rose-900" />
                    <span>กำลังวิเคราะห์...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 text-rose-800" />
                    <span>วิเคราะห์ด้วย AI</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Sample Presets for Testing */}
            <div className="pt-2 border-t border-white/10 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[11px] font-bold text-rose-200/90 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>ตัวอย่างทดลองใช้งาน AI:</span>
              </span>
              <button
                type="button"
                onClick={() => handleApplySampleTemplate('พบการเบิกจ่ายงบประมาณจัดซื้ออุปกรณ์เท็จ และยักยอกเงินโครงการจำนวนมากในสาขาวิชา', 'อาคารเรียนรวม คณะวิทยาศาสตร์')}
                className="bg-white/10 hover:bg-white/20 text-white text-[11px] font-medium px-2.5 py-1 rounded-lg transition-all border border-white/15 cursor-pointer"
              >
                💰 ทุจริตงบประมาณ
              </button>
              <button
                type="button"
                onClick={() => handleApplySampleTemplate('ถูกบุคคลในมหาวิทยาลัยข่มขู่ด่าทอ บูลลี่ และลวนลามด้วยวาจาอย่างรุนแรงจนรู้สึกไม่ปลอดภัย', 'หอพักนักศึกษา')}
                className="bg-white/10 hover:bg-white/20 text-white text-[11px] font-medium px-2.5 py-1 rounded-lg transition-all border border-white/15 cursor-pointer"
              >
                🚨 ถูกคุกคามข่มขู่
              </button>
              <button
                type="button"
                onClick={() => handleApplySampleTemplate('พบปลั๊กไฟชำรุดในห้องปฏิบัติการคอมพิวเตอร์ เกิดประกายไฟและกลิ่นไหม้รุนแรง เสี่ยงต่อไฟไหม้อาคาร', 'ศูนย์คอมพิวเตอร์ ชั้น 2')}
                className="bg-white/10 hover:bg-white/20 text-white text-[11px] font-medium px-2.5 py-1 rounded-lg transition-all border border-white/15 cursor-pointer"
              >
                ⚡ ไฟฟ้าลัดวงจร/อันตราย
              </button>
              <button
                type="button"
                onClick={() => handleApplySampleTemplate('พบนศ.แอบใช้โทรศัพท์มือถือลอกข้อสอบ และสั่งจ้างทำวิทยานิพนธ์ทางอินเทอร์เน็ต', 'ห้องสอบอาคาร 15')}
                className="bg-white/10 hover:bg-white/20 text-white text-[11px] font-medium px-2.5 py-1 rounded-lg transition-all border border-white/15 cursor-pointer"
              >
                📚 ทุจริตสอบ/จ้างทำวิจัย
              </button>
              <button
                type="button"
                onClick={() => handleApplySampleTemplate('อาจารย์ผู้สอนวิชาเทคโนโลยีสารสนเทศสอนไม่เข้าใจ สอนข้ามเนื้อหา มาสายเป็นประจำ และไม่เปิดโอกาสให้นักศึกษาสอบถามเพิ่มเติมในชั้นเรียน', 'อาคาร 10 ห้องเรียน 1024')}
                className="bg-white/10 hover:bg-white/20 text-white text-[11px] font-medium px-2.5 py-1 rounded-lg transition-all border border-white/15 cursor-pointer"
              >
                👨‍🏫 อาจารย์สอนไม่เข้าใจ/ไม่เข้าสอน
              </button>
            </div>

            {/* AI Result Banner when Active */}
            {aiApplied && aiResult && (
              <div className="bg-white/95 text-slate-900 rounded-xl p-3.5 shadow-sm border border-rose-300 space-y-1.5 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-xs font-bold text-slate-900">
                      ผลการวิเคราะห์โดย AI: <span className="text-rose-900 underline font-extrabold">{aiResult.categoryNameTh}</span> | ความเร่งด่วน: <span className="text-red-700 font-extrabold">{aiResult.urgencyNameTh}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] bg-rose-100 text-rose-900 font-extrabold px-2 py-0.5 rounded-full border border-rose-200 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      <span>Gemini 3.6 Flash AI</span>
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                      ความเชื่อมั่น {aiResult.confidence}%
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed pl-6">
                  💡 <span className="font-semibold text-slate-800">รายละเอียดเหตุผลของ AI:</span> {aiResult.reasoning}
                </p>
                {aiResult.keyTermsFound && aiResult.keyTermsFound.length > 0 && (
                  <div className="pl-6 flex items-center gap-1.5 text-[10px] text-slate-500">
                    <span className="font-bold text-slate-700">คำสำคัญที่พบ:</span>
                    <div className="flex flex-wrap gap-1">
                      {aiResult.keyTermsFound.map((term, i) => (
                        <span key={i} className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-slate-700">
                          {term}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 1: Category */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <div className="w-6 h-6 rounded-md bg-rose-900 text-white flex items-center justify-center text-xs font-extrabold">1</div>
              <span>เลือกหมวดหมู่เรื่องร้องเรียน (Category)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { id: 'harassment', title: 'การล่วงละเมิดและคุกคาม', sub: 'Harassment & Bullying' },
                { id: 'compliance', title: 'การปฏิบัติตามกฎระเบียบ', sub: 'Compliance & Ethics' },
                { id: 'teaching', title: 'รายงานเกี่ยวกับอาจารย์ / การสอน', sub: 'Teaching & Instructor Issues' },
                { id: 'technical', title: 'ปัญหาเทคนิค / ความปลอดภัย', sub: 'Technical & Security' },
                { id: 'fraud', title: 'การทุจริตทางการเงิน', sub: 'Financial Fraud' },
                { id: 'safety', title: 'ความปลอดภัยและสิ่งแวดล้อม', sub: 'Safety & Environment' },
                { id: 'academic', title: 'การประพฤติผิดทางวิชาการ', sub: 'Academic Misconduct' }
              ].map((item) => {
                const isSelected = category === item.id;
                return (
                  <label
                    key={item.id}
                    className={`p-4 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-rose-900 bg-rose-50/60 ring-2 ring-rose-900/10 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="text-xs font-bold text-slate-900 leading-tight">{item.title}</span>
                      <input
                        type="radio"
                        name="category"
                        value={item.id}
                        checked={isSelected}
                        onChange={() => setCategory(item.id as CategoryType)}
                        className="mt-0.5 text-rose-900 accent-rose-900 cursor-pointer"
                      />
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">{item.sub}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Step 2: Urgency Level (Auto-Analyzed by AI - Admin Only Edit) */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <div className="w-6 h-6 rounded-md bg-rose-900 text-white flex items-center justify-center text-xs font-extrabold">2</div>
                <span>ระดับความเร่งด่วน (Urgency Level)</span>
                <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-md border border-amber-300 flex items-center gap-1">
                  <Bot className="w-3 h-3 text-amber-700" />
                  <span>วิเคราะห์อัตโนมัติโดย AI Smart Assistant</span>
                </span>
              </div>

              <div className="flex items-center gap-1 text-[11px] text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                <Lock className="w-3.5 h-3.5 text-rose-800 shrink-0" />
                <span className="font-semibold text-rose-900">เฉพาะ Admin เท่านั้นที่สามารถแก้ไขระดับความเร่งด่วนได้</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { level: 'low', label: 'ปกติ (Low)', color: 'text-slate-700 bg-slate-100 border-slate-200' },
                { level: 'medium', label: 'ปานกลาง (Medium)', color: 'text-amber-800 bg-amber-50 border-amber-200' },
                { level: 'high', label: 'สูง (High)', color: 'text-rose-800 bg-rose-50 border-rose-200' },
                { level: 'critical', label: 'วิกฤต (Critical)', color: 'text-red-900 bg-red-100 border-red-300 font-bold' }
              ].map((item) => {
                const isSelected = urgency === item.level;
                return (
                  <div
                    key={item.level}
                    className={`py-3 px-3 rounded-xl border text-center text-xs font-bold transition-all relative flex flex-col items-center justify-center gap-1.5 ${
                      isSelected
                        ? 'border-rose-900 bg-rose-900 text-white shadow-sm ring-2 ring-rose-900/20'
                        : `${item.color} opacity-60`
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      {isSelected ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-rose-200" />
                      ) : (
                        <Lock className="w-3 h-3 text-slate-400" />
                      )}
                      <span>{item.label}</span>
                    </div>
                    {isSelected && (
                      <span className="text-[9px] bg-rose-950/80 text-rose-200 px-1.5 py-0.5 rounded-full font-normal border border-rose-700/50">
                        AI Smart Assistant ประมวลผลให้
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <p className="text-[11px] text-slate-500 bg-rose-50/50 border border-rose-100 p-2.5 rounded-xl flex items-start gap-2">
              <Bot className="w-4 h-4 text-rose-800 shrink-0 mt-0.5" />
              <span>
                <strong>การประมวลผลความเร่งด่วน:</strong> ระบบ AI Smart Assistant จะวิเคราะห์เนื้อหาและจัดระดับความเร่งด่วนให้อัตโนมัติ หากต้องการปรับเปลี่ยนระดับความเร่งด่วนหลังจากส่งรายงานแล้ว จะสามารถดำเนินการได้โดยเจ้าหน้าที่ Admin ผู้รับผิดชอบคดีเท่านั้น
              </span>
            </p>
          </div>

          {/* Step 3: Details */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <div className="w-6 h-6 rounded-md bg-rose-900 text-white flex items-center justify-center text-xs font-extrabold">3</div>
              <span>รายละเอียดเหตุการณ์ (Incident Details)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">วันที่เกิดเหตุ</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    value={incidentDate}
                    onChange={(e) => setIncidentDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-xs text-slate-900 focus:bg-white focus:border-rose-900 focus:ring-2 focus:ring-rose-900/10 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">สถานที่เกิดเหตุ</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="ระบุอาคาร / คณะ / บริเวณสถานที่"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-xs text-slate-900 focus:bg-white focus:border-rose-900 focus:ring-2 focus:ring-rose-900/10 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 block">คำอธิบายรายละเอียด *</label>
                <button
                  type="button"
                  onClick={() => handleRunAIAnalysis()}
                  disabled={isAnalyzing}
                  className="text-xs font-bold text-rose-900 hover:text-red-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Wand2 className="w-3.5 h-3.5 text-rose-700" />
                  <span>วิเคราะห์หมวดหมู่ด้วย AI</span>
                </button>
              </div>
              <textarea
                rows={5}
                required
                maxLength={5000}
                placeholder="อธิบายเหตุการณ์ บุคคลที่เกี่ยวข้อง หรือรายละเอียดเพิ่มเติม..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={() => {
                  if (description.trim().length > 10 && !isAnalyzing) {
                    handleRunAIAnalysis(description, location);
                  }
                }}
                className="w-full p-3.5 border border-slate-200 rounded-xl bg-slate-50 text-xs text-slate-900 focus:bg-white focus:border-rose-900 focus:ring-2 focus:ring-rose-900/10 outline-none resize-y transition-all"
              ></textarea>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="text-slate-500 font-medium">
                  💡 คำแนะนำ: พิมพ์รายละเอียดให้ชัดเจน AI จะช่วยเลือกหมวดหมู่และระดับความเร่งด่วนให้อัตโนมัติ
                </span>
                <span className="font-mono">{description.length} / 5000 ตัวอักษร</span>
              </div>
            </div>
          </div>

          {/* Step 4: Evidence Files */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <div className="w-6 h-6 rounded-md bg-rose-900 text-white flex items-center justify-center text-xs font-extrabold">4</div>
              <span>เอกสาร / หลักฐานประกอบ (Evidence Attachment)</span>
            </div>

            {/* Dropzone */}
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileUpload}
              className="border-2 border-dashed border-slate-200 hover:border-rose-900 rounded-2xl p-6 flex flex-col items-center justify-center bg-slate-50/60 hover:bg-rose-50/30 transition-all cursor-pointer relative group text-center"
            >
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="p-3 bg-white text-rose-900 border border-slate-200 rounded-full mb-2 group-hover:scale-105 transition-transform shadow-xs">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-slate-900 mb-1">
                ลากไฟล์มาวางที่นี่ หรือ <span className="text-rose-900 underline font-extrabold">คลิกเพื่อเลือกไฟล์</span>
              </p>
              <p className="text-[11px] text-slate-500">
                รองรับไฟล์ภาพ เอกสาร PDF, PNG, JPG (สูงสุด 50MB)
              </p>
            </div>

            {/* Evidence List */}
            {files.length > 0 && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                <div className="text-xs font-bold text-slate-700 px-1">
                  ไฟล์ที่แนบไว้ ({files.length} รายการ)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {files.map((file) => (
                    <div key={file.id} className="bg-white border border-slate-200 p-2.5 rounded-lg flex items-center justify-between gap-2 shadow-2xs">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <File className="w-4 h-4 text-rose-900 shrink-0" />
                        <span className="text-xs font-semibold text-slate-800 truncate">{file.fileName}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(file.id)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Form Submit Footer */}
          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>การกดส่งถือเป็นการยอมรับนโยบายคุ้มครองความปลอดภัยของผู้แจ้งเบาะแส</span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => alert('บันทึกร่างข้อมูลเรียบร้อยแล้ว')}
                className="px-4 py-2.5 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
              >
                บันทึกร่าง
              </button>

              <button
                type="submit"
                className="bg-rose-900 hover:bg-rose-800 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Send className="w-4 h-4 text-rose-200" />
                <span>ยืนยันส่งรายงานลับ</span>
              </button>
            </div>
          </div>

        </form>
      </div>

      {/* Success Modal */}
      {showSuccessModal && createdReportInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-xl text-center space-y-4">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-900">ส่งรายงานลับสำเร็จแล้ว!</h3>
              <p className="text-xs text-slate-500 mt-1">
                โปรดเก็บบันทึกรหัสรายงานและรหัส PIN ไว้เพื่อติดตามความคืบหน้า
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2 text-center">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">รหัสอ้างอิงรายงาน (Report ID)</span>
                <span className="text-xl font-mono font-bold text-rose-900 tracking-wider">{createdReportInfo.id}</span>
              </div>
              <div className="border-t border-slate-200 pt-2">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">รหัสผ่านลับ (PIN)</span>
                <span className="text-lg font-mono font-bold text-slate-900 tracking-wider">{createdReportInfo.pin}</span>
              </div>

              <button
                type="button"
                onClick={handleCopyCredentials}
                className="mt-2 w-full py-2 px-3 bg-white hover:bg-rose-50 text-rose-900 border border-rose-200 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">คัดลอกรหัสเรียบร้อยแล้ว</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-rose-900" />
                    <span>คัดลอกรหัสและ PIN</span>
                  </>
                )}
              </button>
            </div>

            <button
              onClick={() => {
                setShowSuccessModal(false);
                onSuccessSubmit(createdReportInfo.id, createdReportInfo.pin);
              }}
              className="w-full bg-rose-900 hover:bg-rose-800 text-white font-bold text-xs py-3 rounded-xl transition-all cursor-pointer shadow-xs"
            >
              ไปยังหน้าติดตามสถานะ (Track Status)
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
