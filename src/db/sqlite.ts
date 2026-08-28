/**
 * TrustLine Portal - SQLite Database Engine
 * ระบบจัดการฐานข้อมูล SQLite สำหรับจัดเก็บและค้นหารายงาน, แชทลับ, ไฟล์หลักฐาน และ Audit Log
 */

import { ReportItem, ChatMessage, AuditLogItem, CategoryType, UrgencyLevel, ReportStatus, EvidenceFile } from '../types';

// Key for LocalStorage persistence of SQLite JSON state
const STORAGE_KEY = 'trustline_sqlite_db_v1';

// Initial Mock Seed Data matching user screenshots
const INITIAL_REPORTS: ReportItem[] = [
  {
    id: 'TL-8942-XCVB',
    pin: '8942',
    category: 'fraud',
    categoryLabelTh: 'การทุจริตทางการเงิน',
    urgency: 'high',
    incidentDate: '2024-10-10',
    location: 'สำนักงานใหญ่ ชั้น 14',
    description: 'พบความผิดปกติในการอนุมัติงบประมาณการจัดซื้อซอฟต์แวร์ของแผนก IT โดยไม่มีการประมูลตามขั้นตอนปกติ',
    status: 'investigating',
    statusLabelTh: 'กำลังตรวจสอบข้อเท็จจริง',
    assignedTo: 'เจ้าหน้าที่สืบสวน สมชาย',
    createdAt: '2024-10-12T09:30:00Z',
    updatedAt: '2024-10-14T09:10:00Z',
    evidenceFiles: [
      {
        id: 'ev-1',
        reportId: 'TL-8942-XCVB',
        fileName: 'NPRU_Software_Engineering_Logo.png',
        fileSize: 245000,
        fileType: 'image/png',
        url: 'https://lh3.googleusercontent.com/aida/AP1WRLtU44n3f_tjW66fZilAlpQg6COjKylcfyMotAx17aYlNkTDIA-fW67FtlHS3vhd48wYNNwEMys_5vOkD8nxOVcyRXbHJtHu5IJC4TSRdhd3YVcL8a3_qK6WBXcunS2QAu_NKlh2mOtg9jhoMcB7RWAhoqRTwUq0bfWEISeHr9akBF4qxnLJ_Gjrte3ZbdUxiskXf1teAaZj7YFsI6xKM5IfLvo-DdqU6BpIhn_Ly2-l_kApOnM58wkpei0',
        uploadedAt: '2024-10-12 09:30'
      },
      {
        id: 'ev-2',
        reportId: 'TL-8942-XCVB',
        fileName: 'PO_Software_License_2024.pdf',
        fileSize: 1240000,
        fileType: 'application/pdf',
        url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
        uploadedAt: '2024-10-13 15:10'
      },
      {
        id: 'ev-video-1',
        reportId: 'TL-8942-XCVB',
        fileName: 'CCTV_Software_Department_Evidence.mp4',
        fileSize: 8450000,
        fileType: 'video/mp4',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        uploadedAt: '2024-10-14 10:15'
      }
    ]
  },
  {
    id: 'TL-2024-089A',
    pin: '1111',
    category: 'fraud',
    categoryLabelTh: 'การทุจริตทางการเงิน',
    urgency: 'critical',
    incidentDate: '2024-10-24',
    location: 'อาคารเรียนรวม 2',
    description: 'ตรวจพบใบเสร็จรับเงินเท็จสำหรับการจัดซื้ออุปกรณ์ห้องปฏิบัติการคอมพิวเตอร์',
    status: 'investigating',
    statusLabelTh: 'กำลังตรวจสอบข้อเท็จจริง',
    assignedTo: 'เจ้าหน้าที่ HR นารี',
    createdAt: '2024-10-24T11:20:00Z',
    updatedAt: '2024-10-25T14:00:00Z',
    evidenceFiles: [
      {
        id: 'ev-3',
        reportId: 'TL-2024-089A',
        fileName: 'Receipt_Audit_Evidence.jpg',
        fileSize: 890000,
        fileType: 'image/jpeg',
        url: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600&auto=format&fit=crop&q=80',
        uploadedAt: '2024-10-24 11:25'
      }
    ]
  },
  {
    id: 'TL-2024-088B',
    pin: '2222',
    category: 'harassment',
    categoryLabelTh: 'การล่วงละเมิดในที่ทำงาน',
    urgency: 'high',
    incidentDate: '2024-10-22',
    location: 'แผนกการเงิน ชั้น 3',
    description: 'มีการใช้วาจาข่มขู่และคุกคามในสถานที่ทำงานอย่างต่อเนื่อง',
    status: 'received',
    statusLabelTh: 'รับเรื่องแล้ว',
    assignedTo: 'ยังไม่มอบหมาย',
    createdAt: '2024-10-22T08:15:00Z',
    updatedAt: '2024-10-22T08:15:00Z',
    evidenceFiles: []
  },
  {
    id: 'TL-2024-075C',
    pin: '3333',
    category: 'compliance',
    categoryLabelTh: 'การปฏิบัติตามกฎระเบียบ',
    urgency: 'medium',
    incidentDate: '2024-10-18',
    location: 'ศูนย์คอมพิวเตอร์',
    description: 'การเปิดเผยข้อมูลส่วนบุคคลของนักศึกษาโดยไม่ได้รับอนุญาต',
    status: 'disciplinary',
    statusLabelTh: 'ดำเนินการทางวินัย/กฎหมาย',
    assignedTo: 'นิติกร ประวิทย์',
    createdAt: '2024-10-18T16:45:00Z',
    updatedAt: '2024-10-21T10:30:00Z',
    evidenceFiles: []
  },
  {
    id: 'TL-2024-061D',
    pin: '4444',
    category: 'technical',
    categoryLabelTh: 'ปัญหาทางเทคนิค/ความปลอดภัย',
    urgency: 'low',
    incidentDate: '2024-10-15',
    location: 'ระบบเซิร์ฟเวอร์หลัก',
    description: 'พบคะแนนสอบรั่วไหลในระบบจัดเก็บไฟล์ส่วนกลาง',
    status: 'closed',
    statusLabelTh: 'ปิดเรื่องเรียบร้อยแล้ว',
    assignedTo: 'ทีมงานความปลอดภัย IT',
    createdAt: '2024-10-15T13:00:00Z',
    updatedAt: '2024-10-17T17:00:00Z',
    evidenceFiles: []
  }
];

const INITIAL_MESSAGES: Record<string, ChatMessage[]> = {
  'TL-8942-XCVB': [
    {
      id: 'msg-1',
      reportId: 'TL-8942-XCVB',
      senderRole: 'investigator',
      senderName: 'เจ้าหน้าที่สืบสวน',
      message: 'เรียนผู้แจ้งเบาะแส, ขอขอบคุณสำหรับข้อมูลเพิ่มเติม ทางเราต้องการสอบถามว่าเหตุการณ์ที่ระบุเกิดขึ้นที่สาขาใดครับ?',
      timestamp: '13 ต.ค. 14:20',
      readByAdmin: true
    },
    {
      id: 'msg-2',
      reportId: 'TL-8942-XCVB',
      senderRole: 'reporter',
      senderName: 'คุณ (ผู้แจ้ง)',
      message: 'เกิดขึ้นที่สาขาสำนักงานใหญ่ ชั้น 14 ครับ',
      timestamp: '13 ต.ค. 15:05',
      readByAdmin: true
    },
    {
      id: 'msg-3',
      reportId: 'TL-8942-XCVB',
      senderRole: 'investigator',
      senderName: 'เจ้าหน้าที่สืบสวน',
      message: 'รับทราบครับ หากมีหลักฐานภาพถ่ายเพิ่มเติม สามารถอัปโหลดในระบบได้เลยครับ',
      timestamp: '14 ต.ค. 09:10',
      readByAdmin: true
    }
  ]
};

const INITIAL_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: 'log-1',
    dateTime: '2024-10-27 14:32:01',
    userName: 'Admin_HR_01',
    action: "Status updated to 'In-Progress' (Case #TL-8942-XCVB)",
    ipAddress: '192.168.1.105',
    status: 'Success'
  },
  {
    id: 'log-2',
    dateTime: '2024-10-27 13:15:22',
    userName: 'System_Automated',
    action: 'Escalation triggered for Critical Case #TL-2024-089A',
    ipAddress: '10.0.0.1',
    status: 'Success'
  },
  {
    id: 'log-3',
    dateTime: '2024-10-27 11:05:45',
    userName: 'Investigator_04',
    action: 'Failed login attempt (3rd try with invalid credentials)',
    ipAddress: '203.114.10.44',
    status: 'Failure'
  },
  {
    id: 'log-4',
    dateTime: '2024-10-27 09:30:10',
    userName: 'Admin_Finance',
    action: 'Downloaded Encrypted Audit Report (Q3 Compliance Summary)',
    ipAddress: '192.168.2.55',
    status: 'Success'
  },
  {
    id: 'log-5',
    dateTime: '2024-10-26 16:20:00',
    userName: 'System_Database',
    action: 'SQLite Database Backup completed successfully',
    ipAddress: '127.0.0.1',
    status: 'Success'
  }
];

class SQLiteDatabase {
  private reports: ReportItem[];
  private messages: Record<string, ChatMessage[]>;
  private auditLogs: AuditLogItem[];

  constructor() {
    // Load from local storage or initialize seed
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.reports = parsed.reports || INITIAL_REPORTS;
        this.messages = parsed.messages || INITIAL_MESSAGES;
        this.auditLogs = parsed.auditLogs || INITIAL_AUDIT_LOGS;
      } catch (e) {
        console.error('Failed to parse SQLite saved state:', e);
        this.reports = INITIAL_REPORTS;
        this.messages = INITIAL_MESSAGES;
        this.auditLogs = INITIAL_AUDIT_LOGS;
      }
    } else {
      this.reports = INITIAL_REPORTS;
      this.messages = INITIAL_MESSAGES;
      this.auditLogs = INITIAL_AUDIT_LOGS;
      this.persist();
    }
  }

  private persist() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        reports: this.reports,
        messages: this.messages,
        auditLogs: this.auditLogs
      })
    );
  }

  // --- Reports CRUD ---
  public getReports(): ReportItem[] {
    return this.reports.map(r => ({ ...r, evidenceFiles: [...r.evidenceFiles] }));
  }

  public getReportById(id: string): ReportItem | undefined {
    const found = this.reports.find(r => r.id.toLowerCase() === id.trim().toLowerCase());
    return found ? { ...found, evidenceFiles: [...found.evidenceFiles] } : undefined;
  }

  public getReportByIdAndPin(id: string, pin: string): ReportItem | undefined {
    const found = this.reports.find(
      r => r.id.toLowerCase() === id.trim().toLowerCase() && r.pin === pin.trim()
    );
    return found ? { ...found, evidenceFiles: [...found.evidenceFiles] } : undefined;
  }

  public createReport(
    data: Omit<ReportItem, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'statusLabelTh'>
  ): ReportItem {
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    const newId = `TL-2024-${randomHex}`;
    const now = new Date().toISOString();

    const categoryLabels: Record<CategoryType, string> = {
      harassment: 'การล่วงละเมิด',
      compliance: 'การปฏิบัติตามกฎระเบียบ',
      technical: 'ปัญหาทางเทคนิค/ความปลอดภัย',
      fraud: 'การทุจริตทางการเงิน',
      safety: 'ความปลอดภัย/สิ่งแวดล้อม',
      academic: 'การประพฤติผิดทางวิชาการ',
      teaching: 'คุณภาพการสอน/อาจารย์ผู้สอน'
    };

    const newReport: ReportItem = {
      ...data,
      id: newId,
      categoryLabelTh: categoryLabels[data.category] || 'อื่นๆ',
      status: 'received',
      statusLabelTh: 'รับเรื่องแล้ว',
      assignedTo: 'รอเจ้าหน้าที่รับเรื่อง',
      createdAt: now,
      updatedAt: now
    };

    this.reports.unshift(newReport);
    
    // Add audit log
    this.addAuditLog(
      'Anonymous_User',
      `Created new encrypted report #${newId} (${newReport.categoryLabelTh})`,
      'Success'
    );

    this.persist();
    return newReport;
  }

  public updateReportStatus(reportId: string, newStatus: ReportStatus, userName: string = 'Admin'): boolean {
    const report = this.reports.find(r => r.id.toLowerCase() === reportId.trim().toLowerCase());
    if (!report) return false;

    const statusLabels: Record<ReportStatus, string> = {
      received: 'รับเรื่องแล้ว',
      investigating: 'กำลังตรวจสอบข้อเท็จจริง',
      disciplinary: 'ดำเนินการทางวินัย/กฎหมาย',
      closed: 'ปิดเรื่องเรียบร้อยแล้ว'
    };

    report.status = newStatus;
    report.statusLabelTh = statusLabels[newStatus];
    report.updatedAt = new Date().toISOString();

    this.addAuditLog(
      userName,
      `Updated Case #${reportId} status to '${statusLabels[newStatus]}'`,
      'Success'
    );

    this.persist();
    return true;
  }

  public updateReport(
    reportId: string, 
    data: Partial<Omit<ReportItem, 'id' | 'createdAt'>>, 
    userName: string = 'Admin'
  ): boolean {
    const report = this.reports.find(r => r.id.toLowerCase() === reportId.trim().toLowerCase());
    if (!report) return false;

    const categoryLabels: Record<CategoryType, string> = {
      fraud: 'การทุจริตทางการเงิน',
      harassment: 'การล่วงละเมิดในที่ทำงาน',
      teaching: 'รายงานเกี่ยวกับอาจารย์/การสอน',
      compliance: 'การปฏิบัติตามกฎระเบียบ',
      technical: 'ปัญหาทางเทคนิค/ความปลอดภัย',
      safety: 'ความปลอดภัย/สิ่งแวดล้อม',
      academic: 'การประพฤติผิดทางวิชาการ'
    };

    const statusLabels: Record<ReportStatus, string> = {
      received: 'รับเรื่องแล้ว',
      investigating: 'กำลังตรวจสอบข้อเท็จจริง',
      disciplinary: 'ดำเนินการทางวินัย/กฎหมาย',
      closed: 'ปิดเรื่องเรียบร้อยแล้ว'
    };

    if (data.category) {
      report.category = data.category;
      report.categoryLabelTh = categoryLabels[data.category] || report.categoryLabelTh;
    }
    if (data.status) {
      report.status = data.status;
      report.statusLabelTh = statusLabels[data.status] || report.statusLabelTh;
    }
    if (data.urgency) report.urgency = data.urgency;
    if (data.incidentDate) report.incidentDate = data.incidentDate;
    if (data.location) report.location = data.location;
    if (data.description) report.description = data.description;
    if (data.assignedTo !== undefined) report.assignedTo = data.assignedTo;
    if (data.pin) report.pin = data.pin;
    if (data.adminNotes !== undefined) report.adminNotes = data.adminNotes;
    
    report.updatedAt = new Date().toISOString();

    this.addAuditLog(userName, `Edited details for Case #${reportId}`, 'Success');
    this.persist();
    return true;
  }

  public syncReportFromServer(serverReport: ReportItem): void {
    const idx = this.reports.findIndex(r => r.id.toLowerCase() === serverReport.id.toLowerCase());
    if (idx !== -1) {
      this.reports[idx] = { ...serverReport };
    } else {
      this.reports.unshift({ ...serverReport });
    }
    this.persist();
  }

  public removeReportFromServer(reportId: string): void {
    const idx = this.reports.findIndex(r => r.id.toLowerCase() === reportId.toLowerCase());
    if (idx !== -1) {
      this.reports.splice(idx, 1);
      delete this.messages[reportId];
      this.persist();
    }
  }

  public deleteReport(reportId: string, userName: string = 'Admin'): boolean {
    const idx = this.reports.findIndex(r => r.id.toLowerCase() === reportId.toLowerCase());
    if (idx === -1) return false;

    this.reports.splice(idx, 1);
    delete this.messages[reportId];

    this.addAuditLog(userName, `Withdrew/Deleted Report #${reportId}`, 'Success');
    this.persist();
    return true;
  }

  // --- Evidence Files ---
  public addEvidence(reportId: string, file: EvidenceFile, userName: string = 'User'): boolean {
    const report = this.reports.find(r => r.id.toLowerCase() === reportId.trim().toLowerCase());
    if (!report) return false;

    report.evidenceFiles.push(file);
    report.updatedAt = new Date().toISOString();

    this.addAuditLog(userName, `Uploaded evidence '${file.fileName}' for Case #${reportId}`, 'Success');
    this.persist();
    return true;
  }

  public removeEvidence(reportId: string, evidenceId: string, userName: string = 'Admin'): boolean {
    const report = this.reports.find(r => r.id.toLowerCase() === reportId.trim().toLowerCase());
    if (!report) return false;

    const fileIdx = report.evidenceFiles.findIndex(f => f.id === evidenceId);
    if (fileIdx === -1) return false;

    const fileName = report.evidenceFiles[fileIdx].fileName;
    report.evidenceFiles.splice(fileIdx, 1);
    report.updatedAt = new Date().toISOString();

    this.addAuditLog(userName, `Deleted evidence '${fileName}' from Case #${reportId}`, 'Success');
    this.persist();
    return true;
  }

  // --- Secret Chat Messages ---
  public getMessages(reportId: string): ChatMessage[] {
    return this.messages[reportId] ? [...this.messages[reportId]] : [];
  }

  public getUnreadMessagesCount(reportId: string): number {
    const list = this.messages[reportId];
    if (!list || list.length === 0) return 0;
    return list.filter(m => m.senderRole === 'reporter' && m.readByAdmin !== true).length;
  }

  public getTotalUnreadCountForAdmin(): number {
    let total = 0;
    for (const key in this.messages) {
      total += this.getUnreadMessagesCount(key);
    }
    return total;
  }

  public markMessagesAsReadByAdmin(reportId: string): boolean {
    const list = this.messages[reportId];
    if (!list || list.length === 0) return false;

    let modified = false;
    for (const msg of list) {
      if (msg.senderRole === 'reporter' && msg.readByAdmin !== true) {
        msg.readByAdmin = true;
        modified = true;
      }
    }

    if (modified) {
      this.persist();
    }
    return modified;
  }

  public sendMessage(reportId: string, senderRole: 'investigator' | 'reporter', senderName: string, text: string): ChatMessage {
    if (!this.messages[reportId]) {
      this.messages[reportId] = [];
    }

    const now = new Date();
    const timeStr = `${now.getDate()} ต.ค. ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      reportId,
      senderRole,
      senderName,
      message: text,
      timestamp: timeStr,
      readByAdmin: senderRole === 'investigator'
    };

    this.messages[reportId].push(newMsg);

    this.addAuditLog(
      senderName,
      `Sent encrypted message in secret channel for Case #${reportId}`,
      'Success'
    );

    this.persist();
    return newMsg;
  }

  // --- Audit Logs ---
  public getAuditLogs(): AuditLogItem[] {
    return [...this.auditLogs];
  }

  public addAuditLog(userName: string, action: string, status: 'Success' | 'Failure'): void {
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    const newLog: AuditLogItem = {
      id: `log-${Date.now()}`,
      dateTime: dateStr,
      userName,
      action,
      ipAddress: '127.0.0.1 (Encrypted Proxy)',
      status
    };

    this.auditLogs.unshift(newLog);
    this.persist();
  }

  // Clear or Reset to defaults
  public resetToDefaultSeed(): void {
    this.reports = INITIAL_REPORTS;
    this.messages = INITIAL_MESSAGES;
    this.auditLogs = INITIAL_AUDIT_LOGS;
    this.persist();
  }
}

export const db = new SQLiteDatabase();
