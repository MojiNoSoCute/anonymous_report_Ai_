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
