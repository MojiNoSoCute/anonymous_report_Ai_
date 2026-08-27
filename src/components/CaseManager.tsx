/**
 * TrustLine Portal - Case Manager Dashboard (หน้าจัดการรายงานทั้งหมด สำหรับ Admin)
 * - รองรับการแก้ไขข้อมูลรายงาน (Edit Case)
 * - รองรับการลบรายงาน (Delete Case)
 * - รองรับการดูไฟล์รูปภาพและวิดีโอหลักฐาน (Media Lightbox Previewer - Images & Videos)
 * - โทนสีเดิม (Rich Crimson & Warm Accents)
 */

import React, { useState, useMemo } from 'react';
import { 
  Shield, Search, Download, ChevronLeft, ChevronRight, X, Eye, 
  MessageSquare, Trash2, Edit3, Save, Video, Image as ImageIcon, 
  FileText, Play, Upload, CheckCircle2, AlertTriangle, AlertOctagon, UserPlus, FileSpreadsheet
} from 'lucide-react';
import { ReportItem, ReportStatus, UrgencyLevel, CategoryType, EvidenceFile } from '../types';
import { db } from '../db/sqlite';

interface CaseManagerProps {
  onOpenChatWithCase?: (caseId: string) => void;
}

export const CaseManager: React.FC<CaseManagerProps> = ({ onOpenChatWithCase }) => {
  const [reports, setReports] = useState<ReportItem[]>(() => db.getReports());
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Modals state
  const [activeModalCase, setActiveModalCase] = useState<ReportItem | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Edit Form state
  const [editForm, setEditForm] = useState<{
    category: CategoryType;
    description: string;
    location: string;
    incidentDate: string;
    urgency: UrgencyLevel;
    status: ReportStatus;
    assignedTo: string;
  }>({
    category: 'fraud',
    description: '',
    location: '',
    incidentDate: '',
    urgency: 'medium',
    status: 'received',
    assignedTo: ''
  });

  // Media Lightbox State (For viewing image / video files in full modal)
  const [activeMedia, setActiveMedia] = useState<EvidenceFile | null>(null);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  // Refresh reports list from SQLite
  const refreshReports = () => {
    setReports(db.getReports());
  };

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      const matchSearch = 
        r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.assignedTo.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = selectedStatus === 'all' || r.status === selectedStatus;
      const matchPriority = selectedPriority === 'all' || r.urgency === selectedPriority;
      const matchCategory = selectedCategory === 'all' || r.category === selectedCategory;

      return matchSearch && matchStatus && matchPriority && matchCategory;
    });
  }, [reports, searchTerm, selectedStatus, selectedPriority, selectedCategory]);

  // Pagination
  const paginatedReports = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredReports.slice(start, start + pageSize);
  }, [filteredReports, currentPage]);

  const totalPages = Math.ceil(filteredReports.length / pageSize) || 1;

  // Open Edit Mode
  const handleStartEdit = (report: ReportItem) => {
    setEditForm({
      category: report.category,
      description: report.description,
      location: report.location,
      incidentDate: report.incidentDate,
      urgency: report.urgency,
      status: report.status,
      assignedTo: report.assignedTo || ''
    });
    setIsEditing(true);
  };

  // Save Edit Handler
  const handleSaveEdit = (reportId: string) => {
    db.updateReport(reportId, editForm, 'Admin_CaseManager');
    refreshReports();
    setIsEditing(false);
    
    // Update active modal view with fresh DB data
    const updated = db.getReportById(reportId);
    if (updated) {
      setActiveModalCase(updated);
    }
  };

  // Delete Handler
  const handleDeleteReport = (reportId: string) => {
    db.deleteReport(reportId, 'Admin_CaseManager');
    refreshReports();
    setDeleteConfirmId(null);
    if (activeModalCase && activeModalCase.id === reportId) {
      setActiveModalCase(null);
    }
  };

  // Quick Status update
  const handleUpdateStatus = (reportId: string, newStatus: ReportStatus) => {
    db.updateReportStatus(reportId, newStatus, 'Admin_CaseManager');
    refreshReports();
    if (activeModalCase && activeModalCase.id === reportId) {
      setActiveModalCase(db.getReportById(reportId) || null);
    }
  };

  // Upload Evidence File (Image or Video)
  const handleAdminFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !activeModalCase) return;
    const file = e.target.files[0];
    const isVid = file.type.startsWith('video/');
    const fileUrl = URL.createObjectURL(file);

    const newEvidence: EvidenceFile = {
      id: `ev-${Date.now()}`,
      reportId: activeModalCase.id,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      url: fileUrl,
      uploadedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    db.addEvidence(activeModalCase.id, newEvidence, 'Admin');
    refreshReports();
    setActiveModalCase(db.getReportById(activeModalCase.id) || null);
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Case ID', 'Date', 'Category', 'Priority', 'Status', 'Location', 'Assigned To'];
    const rows = filteredReports.map(r => [
      r.id,
      r.incidentDate,
      `"${r.categoryLabelTh}"`,
      r.urgency.toUpperCase(),
      `"${r.statusLabelTh}"`,
      `"${r.location}"`,
      `"${r.assignedTo || 'Unassigned'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `TrustLine_Admin_Reports_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getPriorityBadge = (urgency: UrgencyLevel) => {
    switch (urgency) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-700 text-white font-black text-[11px] shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
            Critical
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-100 text-red-900 border border-rose-300 font-bold text-[11px]">
            High
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200 font-bold text-[11px]">
            Medium
          </span>
        );
      case 'low':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-medium text-[11px]">
            Low
          </span>
        );
    }
  };

  const getStatusBadge = (status: ReportStatus) => {
    switch (status) {
      case 'investigating':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-rose-100 text-red-900 border border-rose-200 font-bold text-[11px]">
            กำลังตรวจสอบ
          </span>
        );
      case 'received':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-bold text-[11px]">
            รับเรื่องแล้ว
          </span>
        );
      case 'disciplinary':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200 font-bold text-[11px]">
            ดำเนินการทางวินัย
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200 font-bold text-[11px]">
            ปิดเรื่องเรียบร้อย
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 space-y-6">
      
      {/* Title & Actions Bar */}
      <div className="bg-white border border-rose-100 rounded-2xl p-6 shadow-md shadow-red-950/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Shield className="w-7 h-7 text-red-700" />
            <span>จัดการรายงานทั้งหมด (Case Manager Dashboard)</span>
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            ส่วนเจ้าหน้าที่สืบสวน/ผู้ดูแลระบบ: แก้ไข, ลบ, ตรวจสอบภาพและวิดีโอหลักฐาน (รวม {reports.length} รายการ)
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="bg-gradient-to-r from-red-700 to-rose-700 hover:from-red-800 hover:to-rose-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
        >
          <Download className="w-4 h-4 text-rose-200" />
          <span>ส่งออกไฟล์ CSV (Export Data)</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-md shadow-red-950/5 space-y-4">
        <div className="flex flex-col md:flex-row gap-3 justify-between items-center">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาด้วย Case ID, รายละเอียด, ผู้รับผิดชอบ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:border-red-600 focus:bg-white focus:ring-2 focus:ring-red-600/20 outline-none text-slate-900 font-medium"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
            <span className="font-black text-red-700 text-sm">{filteredReports.length}</span> รายการในมุมมองปัจจุบัน
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-3 border-t border-rose-100 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-500 uppercase text-[10px]">สถานะ:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-rose-50/60 border border-rose-200 text-slate-900 font-bold rounded-xl py-1 px-2.5 text-xs focus:border-red-600 outline-none"
            >
              <option value="all">ทั้งหมด (All)</option>
              <option value="received">รับเรื่องแล้ว (New)</option>
              <option value="investigating">กำลังตรวจสอบ (In Review)</option>
              <option value="disciplinary">ดำเนินการทางวินัย (Action)</option>
              <option value="closed">ปิดเรื่องแล้ว (Closed)</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-500 uppercase text-[10px]">ความเร่งด่วน:</span>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="bg-rose-50/60 border border-rose-200 text-slate-900 font-bold rounded-xl py-1 px-2.5 text-xs focus:border-red-600 outline-none"
            >
              <option value="all">ทั้งหมด (All)</option>
              <option value="critical">วิกฤต (Critical)</option>
              <option value="high">สูง (High)</option>
              <option value="medium">ปานกลาง (Medium)</option>
              <option value="low">ต่ำ (Low)</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-500 uppercase text-[10px]">หมวดหมู่:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-rose-50/60 border border-rose-200 text-slate-900 font-bold rounded-xl py-1 px-2.5 text-xs focus:border-red-600 outline-none"
            >
              <option value="all">ทั้งหมด (All)</option>
              <option value="fraud">การทุจริตทางการเงิน</option>
              <option value="harassment">การล่วงละเมิดในที่ทำงาน</option>
              <option value="teaching">รายงานเกี่ยวกับอาจารย์/การสอน</option>
              <option value="compliance">การปฏิบัติตามกฎระเบียบ</option>
              <option value="technical">ปัญหาทางเทคนิค/ความปลอดภัย</option>
              <option value="safety">ความปลอดภัย/สิ่งแวดล้อม</option>
              <option value="academic">การประพฤติผิดทางวิชาการ</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Reports Table */}
      <div className="bg-white rounded-2xl border border-rose-100 overflow-hidden shadow-md shadow-red-950/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gradient-to-r from-rose-50 via-rose-100/60 to-rose-50 border-b border-rose-200 text-slate-800">
                <th className="py-3.5 px-4 font-black">Case ID</th>
                <th className="py-3.5 px-4 font-black">วันที่เกิดเหตุ</th>
                <th className="py-3.5 px-4 font-black">หมวดหมู่</th>
                <th className="py-3.5 px-4 font-black">ความสำคัญ</th>
                <th className="py-3.5 px-4 font-black">สถานะ</th>
                <th className="py-3.5 px-4 font-black">หลักฐานภาพ/วิดีโอ</th>
                <th className="py-3.5 px-4 font-black text-right">การจัดการ (Actions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedReports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    ไม่พบรายการรายงานที่ตรงกับคำค้นหา
                  </td>
                </tr>
              ) : (
                paginatedReports.map((r) => {
                  const hasVideo = r.evidenceFiles.some(f => f.fileType.startsWith('video/'));
                  const hasImage = r.evidenceFiles.some(f => f.fileType.startsWith('image/'));

                  return (
                    <tr key={r.id} className="hover:bg-rose-50/50 transition-colors group">
                      <td className="py-3.5 px-4 font-mono font-black text-red-700 tracking-wider">
                        <button
                          onClick={() => {
                            setActiveModalCase(r);
                            setIsEditing(false);
                          }}
                          className="hover:underline cursor-pointer"
                        >
                          {r.id}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-slate-900 font-medium">{r.incidentDate}</td>
                      <td className="py-3.5 px-4 text-slate-900 max-w-[160px] truncate font-medium">
                        {r.categoryLabelTh}
                      </td>
                      <td className="py-3.5 px-4">{getPriorityBadge(r.urgency)}</td>
                      <td className="py-3.5 px-4">{getStatusBadge(r.status)}</td>
                      <td className="py-3.5 px-4">
                        {r.evidenceFiles.length > 0 ? (
                          <div className="flex items-center gap-1.5">
                            {hasImage && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-100 text-red-800 text-[10px] font-bold">
                                <ImageIcon className="w-3 h-3" />
                                รูปภาพ
                              </span>
                            )}
                            {hasVideo && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-100 text-purple-900 text-[10px] font-bold animate-pulse">
                                <Video className="w-3 h-3" />
                                วิดีโอ
                              </span>
                            )}
                            <span className="text-[11px] font-bold text-slate-600 ml-1">
                              ({r.evidenceFiles.length})
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">ไม่มีไฟล์</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          
                          {/* View Detail Button */}
                          <button
                            onClick={() => {
                              setActiveModalCase(r);
                              setIsEditing(false);
                            }}
                            className="p-1.5 text-slate-600 hover:text-red-700 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                            title="ดูรายละเอียด / ไฟล์สื่อ"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit Button */}
                          <button
                            onClick={() => {
                              setActiveModalCase(r);
                              handleStartEdit(r);
                            }}
                            className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer"
                            title="แก้ไขข้อมูลรายงาน"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Chat Secret Channel */}
                          {onOpenChatWithCase && (
                            <button
                              onClick={() => onOpenChatWithCase(r.id)}
                              className="p-1.5 text-slate-600 hover:text-red-700 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                              title="เปิดสนทนาลับ"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </button>
                          )}

                          {/* Delete Button */}
                          <button
                            onClick={() => setDeleteConfirmId(r.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="ลบรายงาน"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-rose-50/60 border-t border-rose-100 px-4 py-3 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-600 gap-2 font-medium">
          <span>
            แสดง {Math.min((currentPage - 1) * pageSize + 1, filteredReports.length)} ถึง{' '}
            {Math.min(currentPage * pageSize, filteredReports.length)} จากทั้งหมด {filteredReports.length} รายการ
          </span>

          <div className="flex items-center gap-1">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className="p-1 rounded-lg hover:bg-white disabled:opacity-40 cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentPage(idx + 1)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  currentPage === idx + 1
                    ? 'bg-gradient-to-r from-red-700 to-rose-700 text-white shadow-xs'
                    : 'hover:bg-white text-slate-700'
                }`}
              >
                {idx + 1}
              </button>
            ))}

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              className="p-1 rounded-lg hover:bg-white disabled:opacity-40 cursor-pointer transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Detail / Edit Case Modal */}
      {activeModalCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-rose-200 max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl p-6 space-y-5">
            
            <div className="flex justify-between items-center border-b border-rose-100 pb-3">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-rose-50 border border-rose-200 rounded-xl text-red-700">
                  <Shield className="w-5 h-5" />
                </span>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">
                    {isEditing ? 'โหมดแก้ไขรายงาน (Edit Case)' : 'รายละเอียดรายงาน (Case Details)'}
                  </span>
                  <h3 className="text-xl font-mono font-black text-red-700 tracking-wider">
                    {activeModalCase.id}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!isEditing ? (
                  <button
                    onClick={() => handleStartEdit(activeModalCase)}
                    className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>แก้ไขข้อมูล</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    ยกเลิกแก้ไข
                  </button>
                )}

                <button
                  onClick={() => {
                    setActiveModalCase(null);
                    setIsEditing(false);
                  }}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Editing Form OR View Details */}
            {isEditing ? (
              <div className="space-y-4 bg-rose-50/30 p-4 border border-rose-100 rounded-2xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1">หมวดหมู่รายงาน:</label>
                    <select
                      value={editForm.category}
                      onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value as CategoryType }))}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-bold text-slate-900 focus:border-red-600 outline-none"
                    >
                      <option value="fraud">การทุจริตทางการเงิน</option>
                      <option value="harassment">การล่วงละเมิดในที่ทำงาน</option>
                      <option value="teaching">รายงานเกี่ยวกับอาจารย์/การสอน</option>
                      <option value="compliance">การปฏิบัติตามกฎระเบียบ</option>
                      <option value="technical">ปัญหาทางเทคนิค/ความปลอดภัย</option>
                      <option value="safety">ความปลอดภัย/สิ่งแวดล้อม</option>
                      <option value="academic">การประพฤติผิดทางวิชาการ</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1">ระดับความเร่งด่วน:</label>
                    <select
                      value={editForm.urgency}
                      onChange={(e) => setEditForm(prev => ({ ...prev, urgency: e.target.value as UrgencyLevel }))}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-bold text-slate-900 focus:border-red-600 outline-none"
                    >
                      <option value="critical">วิกฤต (Critical)</option>
                      <option value="high">สูง (High)</option>
                      <option value="medium">ปานกลาง (Medium)</option>
                      <option value="low">ต่ำ (Low)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1">สถานะดำเนินการ:</label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value as ReportStatus }))}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-bold text-slate-900 focus:border-red-600 outline-none"
                    >
                      <option value="received">รับเรื่องแล้ว</option>
                      <option value="investigating">กำลังตรวจสอบข้อเท็จจริง</option>
                      <option value="disciplinary">ดำเนินการทางวินัย/กฎหมาย</option>
                      <option value="closed">ปิดเรื่องเรียบร้อยแล้ว</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1">เจ้าหน้าที่ผู้รับผิดชอบ:</label>
                    <input
                      type="text"
                      value={editForm.assignedTo}
                      onChange={(e) => setEditForm(prev => ({ ...prev, assignedTo: e.target.value }))}
                      placeholder="เช่น เจ้าหน้าที่สืบสวน สมชาย"
                      className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-bold text-slate-900 focus:border-red-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1">วันที่เกิดเหตุ:</label>
                    <input
                      type="date"
                      value={editForm.incidentDate}
                      onChange={(e) => setEditForm(prev => ({ ...prev, incidentDate: e.target.value }))}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-bold text-slate-900 focus:border-red-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1">สถานที่เกิดเหตุ:</label>
                    <input
                      type="text"
                      value={editForm.location}
                      onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-bold text-slate-900 focus:border-red-600 outline-none"
                    />
                  </div>

                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">รายละเอียดเหตุการณ์:</label>
                  <textarea
                    rows={4}
                    value={editForm.description}
                    onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:border-red-600 outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-300 transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={() => handleSaveEdit(activeModalCase.id)}
                    className="px-5 py-2 bg-gradient-to-r from-red-700 to-rose-700 hover:from-red-800 hover:to-rose-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                  >
                    <Save className="w-4 h-4 text-rose-200" />
                    <span>บันทึกการแก้ไข</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Normal View Mode */
              <div className="space-y-4">
                
                {/* Meta Overview */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-rose-50/60 p-3.5 rounded-xl text-xs border border-rose-100">
                  <div>
                    <span className="text-slate-500 block font-medium">วันที่เกิดเหตุ:</span>
                    <span className="font-bold text-slate-900">{activeModalCase.incidentDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-medium">สถานที่:</span>
                    <span className="font-bold text-slate-900">{activeModalCase.location}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-medium">ระดับความเร่งด่วน:</span>
                    <span>{getPriorityBadge(activeModalCase.urgency)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-medium">สถานะปัจจุบัน:</span>
                    <span>{getStatusBadge(activeModalCase.status)}</span>
                  </div>
                </div>

                {/* Quick Status & Urgency Setter for Admin */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-rose-100 pt-3">
                  {/* Quick Status Setter */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-900 block">เปลี่ยนสถานะด่วน (Admin):</span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { status: 'received', label: 'รับเรื่องแล้ว' },
                        { status: 'investigating', label: 'กำลังตรวจสอบ' },
                        { status: 'disciplinary', label: 'ดำเนินการทางวินัย' },
                        { status: 'closed', label: 'ปิดเรื่องเรียบร้อย' }
                      ].map((st) => (
                        <button
                          key={st.status}
                          onClick={() => handleUpdateStatus(activeModalCase.id, st.status as ReportStatus)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            activeModalCase.status === st.status
                              ? 'bg-red-700 text-white ring-2 ring-red-700/30 shadow-xs'
                              : 'bg-slate-100 text-slate-700 hover:bg-rose-100'
                          }`}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quick Urgency Setter for Admin */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-rose-900 flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5 text-rose-700" />
                      <span>ปรับระดับความเร่งด่วน (สิทธิ์ Admin เท่านั้น):</span>
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { level: 'low', label: 'ปกติ (Low)', color: 'bg-slate-100 text-slate-700' },
                        { level: 'medium', label: 'ปานกลาง (Med)', color: 'bg-amber-100 text-amber-900' },
                        { level: 'high', label: 'สูง (High)', color: 'bg-rose-100 text-rose-900' },
                        { level: 'critical', label: 'วิกฤต (Critical)', color: 'bg-red-100 text-red-900 font-bold' }
                      ].map((urg) => (
                        <button
                          key={urg.level}
                          onClick={() => {
                            db.updateReport(activeModalCase.id, { urgency: urg.level as UrgencyLevel }, 'Admin_QuickUrgency');
                            refreshReports();
                            setActiveModalCase(db.getReportById(activeModalCase.id) || null);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            activeModalCase.urgency === urg.level
                              ? 'bg-rose-900 text-white ring-2 ring-rose-900/30 shadow-xs'
                              : `${urg.color} hover:ring-1 hover:ring-rose-400`
                          }`}
                        >
                          {urg.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Assigned To */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                  <span className="text-slate-600 font-medium">ผู้รับผิดชอบสำนวน:</span>
                  <span className="font-bold text-slate-900 bg-white px-3 py-1 rounded-lg border border-slate-200">
                    {activeModalCase.assignedTo || 'ยังไม่ได้มอบหมาย'}
                  </span>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-900 block">รายละเอียดเหตุการณ์:</span>
                  <p className="text-xs text-slate-800 bg-rose-50/30 p-3.5 rounded-xl border border-rose-100 leading-relaxed font-normal">
                    {activeModalCase.description}
                  </p>
                </div>

                {/* Evidence Files & Media Viewer Section */}
                <div className="space-y-2 border-t border-rose-100 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-red-700" />
                      <span>หลักฐานภาพและวิดีโอแนบ ({activeModalCase.evidenceFiles.length} รายการ):</span>
                    </span>

                    {/* Admin Upload Additional Media Button */}
                    <label className="text-[11px] font-bold text-red-700 hover:text-red-800 bg-rose-50 hover:bg-rose-100 px-3 py-1 rounded-lg border border-rose-200 cursor-pointer transition-all flex items-center gap-1">
                      <Upload className="w-3 h-3" />
                      <span>อัปโหลดหลักฐานเพิ่ม</span>
                      <input
                        type="file"
                        accept="image/*,video/*,application/pdf"
                        onChange={handleAdminFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {activeModalCase.evidenceFiles.length === 0 ? (
                    <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl border border-slate-200">
                      ยังไม่มีไฟล์ภาพหรือวิดีโอแนบในรายงานนี้
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                      {activeModalCase.evidenceFiles.map((ev) => {
                        const isVid = ev.fileType.startsWith('video/');
                        const isImg = ev.fileType.startsWith('image/');

                        return (
                          <div
                            key={ev.id}
                            onClick={() => setActiveMedia(ev)}
                            className="group relative border border-rose-200 rounded-xl overflow-hidden bg-slate-900 cursor-pointer shadow-xs hover:border-red-600 transition-all"
                          >
                            {isImg ? (
                              <div className="h-28 w-full overflow-hidden bg-slate-950 relative">
                                <img
                                  src={ev.url}
                                  alt={ev.fileName}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <span className="absolute top-1.5 right-1.5 bg-slate-900/80 text-white text-[9px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs">
                                  ภาพ
                                </span>
                              </div>
                            ) : isVid ? (
                              <div className="h-28 w-full bg-slate-950 flex flex-col items-center justify-center relative group-hover:bg-slate-900 transition-colors">
                                <div className="w-10 h-10 rounded-full bg-red-700/90 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                                  <Play className="w-5 h-5 fill-current ml-0.5" />
                                </div>
                                <span className="absolute top-1.5 right-1.5 bg-purple-900/90 text-white text-[9px] font-bold px-2 py-0.5 rounded-md">
                                  วิดีโอ MP4
                                </span>
                              </div>
                            ) : (
                              <div className="h-28 w-full bg-slate-100 flex flex-col items-center justify-center text-slate-700">
                                <FileText className="w-8 h-8 text-red-700 mb-1" />
                                <span className="text-[10px] font-bold">เอกสาร PDF</span>
                              </div>
                            )}

                            <div className="p-2 bg-white text-slate-900 border-t border-rose-100">
                              <p className="text-[11px] font-bold truncate">{ev.fileName}</p>
                              <p className="text-[9px] text-slate-500 font-mono">{(ev.fileSize / 1024).toFixed(1)} KB • คลิกเพื่อดู</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* Modal Bottom Action Footer */}
            <div className="pt-3 border-t border-rose-100 flex items-center justify-between">
              <button
                onClick={() => {
                  setDeleteConfirmId(activeModalCase.id);
                }}
                className="text-xs bg-red-50 hover:bg-red-100 text-red-800 font-bold px-3.5 py-2 rounded-xl border border-rose-200 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-700" />
                <span>ลบรายงานนี้</span>
              </button>

              <button
                onClick={() => {
                  setActiveModalCase(null);
                  setIsEditing(false);
                }}
                className="bg-gradient-to-r from-red-700 to-rose-700 hover:from-red-800 hover:to-rose-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md cursor-pointer"
              >
                ปิดหน้าต่าง (Close)
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Media Lightbox / Video Viewer Modal */}
      {activeMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
          <div className="relative max-w-4xl w-full bg-slate-950 rounded-2xl border border-rose-900/60 overflow-hidden shadow-2xl flex flex-col">
            
            {/* Header */}
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                {activeMedia.fileType.startsWith('video/') ? (
                  <Video className="w-5 h-5 text-red-500" />
                ) : (
                  <ImageIcon className="w-5 h-5 text-rose-400" />
                )}
                <span className="font-bold text-sm truncate max-w-md">{activeMedia.fileName}</span>
              </div>

              <button
                onClick={() => setActiveMedia(null)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-red-900 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Media Content */}
            <div className="p-4 flex items-center justify-center min-h-[300px] max-h-[75vh] overflow-hidden bg-black">
              {activeMedia.fileType.startsWith('video/') ? (
                <video
                  src={activeMedia.url}
                  controls
                  autoPlay
                  className="max-h-[65vh] w-full object-contain rounded-xl shadow-2xl"
                >
                  เบราว์เซอร์ของท่านไม่รองรับการเล่นวิดีโอ
                </video>
              ) : activeMedia.fileType.startsWith('image/') ? (
                <img
                  src={activeMedia.url}
                  alt={activeMedia.fileName}
                  className="max-h-[65vh] w-auto object-contain rounded-xl shadow-2xl"
                />
              ) : (
                <div className="text-center py-12 text-slate-300">
                  <FileText className="w-16 h-16 mx-auto mb-3 text-red-500" />
                  <p className="font-bold text-base">{activeMedia.fileName}</p>
                  <a
                    href={activeMedia.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block mt-4 px-4 py-2 bg-red-700 text-white rounded-xl text-xs font-bold"
                  >
                    ดาวน์โหลดหรือเปิดไฟล์ PDF
                  </a>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-900 border-t border-slate-800 text-slate-400 text-xs flex justify-between items-center font-mono">
              <span>ขนาดไฟล์: {(activeMedia.fileSize / 1024).toFixed(1)} KB</span>
              <span>อัปโหลดเมื่อ: {activeMedia.uploadedAt}</span>
            </div>

          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-red-200 max-w-md w-full p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-700 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900">ยืนยันการลบรายงาน</h3>
              <p className="text-xs text-slate-600 mt-1">
                คุณต้องการลบรายงานรหัส <span className="font-mono font-bold text-red-700">{deleteConfirmId}</span> ออกจากระบบอย่างถาวรหรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => handleDeleteReport(deleteConfirmId)}
                className="flex-1 py-2.5 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                ยืนยันลบข้อมูล
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
