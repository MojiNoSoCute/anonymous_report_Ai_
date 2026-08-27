/**
 * TrustLine Whistleblower Systems - Type Definitions
 * นิยามข้อมูลทั้งหมดสำหรับระบบแจ้งเบาะแสและติดตามสถานะ
 */

export type CategoryType = 
  | 'harassment' 
  | 'compliance' 
  | 'technical' 
  | 'fraud' 
  | 'safety' 
  | 'academic'
  | 'teaching';

export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical';

export type ReportStatus = 'received' | 'investigating' | 'disciplinary' | 'closed';

export interface EvidenceFile {
  id: string;
  reportId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  url: string; // Direct or Base64/Hotlink URL for interactive table display
  uploadedAt: string;
}

export interface ChatMessage {
  id: string;
  reportId: string;
  senderRole: 'investigator' | 'reporter';
  senderName: string;
  message: string;
  timestamp: string;
  readByAdmin?: boolean;
}

export interface ReportItem {
  id: string; // Unique Report ID e.g. "TL-8942-XCVB"
  pin: string; // 4-digit secret PIN code e.g. "8942"
  category: CategoryType;
  categoryLabelTh: string;
  urgency: UrgencyLevel;
  incidentDate: string;
  location: string;
  description: string;
  status: ReportStatus;
  statusLabelTh: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  evidenceFiles: EvidenceFile[];
}

export interface AuditLogItem {
  id: string;
  dateTime: string;
  userName: string;
  action: string;
  ipAddress: string;
  status: 'Success' | 'Failure';
}

export interface UserSession {
  username: string;
  name: string;
  role: 'admin' | 'investigator';
  isAuthenticated: boolean;
}

export interface DashboardStats {
  activeCases: number;
  avgResolutionDays: number;
  resolutionRatePercent: number;
  criticalCases: number;
}

export type WsClientEvent = 
  | { type: 'subscribe'; caseId?: string; isAdmin?: boolean }
  | { type: 'unsubscribe'; caseId?: string }
  | { type: 'chat_message'; reportId: string; senderRole: 'investigator' | 'reporter'; senderName: string; message: string }
  | { type: 'typing'; caseId: string; userRole: 'investigator' | 'reporter'; userName: string; isTyping: boolean }
  | { type: 'mark_read'; reportId: string }
  | { type: 'ping' };

export type WsServerEvent =
  | { type: 'subscribed'; caseId?: string }
  | { type: 'new_message'; reportId: string; message: ChatMessage }
  | { type: 'typing_status'; caseId: string; userRole: 'investigator' | 'reporter'; userName: string; isTyping: boolean }
  | { type: 'messages_read'; reportId: string }
  | { type: 'report_updated'; report: ReportItem }
  | { type: 'report_created'; report: ReportItem }
  | { type: 'report_deleted'; reportId: string }
  | { type: 'pong' };
