/**
 * Real-time WebSocket Client Service
 * ให้บริการเชื่อมต่อแชทและอัปเดตสถานะแบบ Real-time ข้ามอุปกรณ์และเบราว์เซอร์
 */

import { ChatMessage, ReportItem, WsClientEvent, WsServerEvent } from '../types';
import { db } from '../db/sqlite';

type MessageListener = (msg: ChatMessage) => void;
type TypingListener = (info: { caseId: string; userRole: string; userName: string; isTyping: boolean }) => void;
type ReportUpdateListener = (report: ReportItem) => void;
type ReportDeleteListener = (reportId: string) => void;
type MessagesReadListener = (reportId: string) => void;
type ConnectionListener = (connected: boolean) => void;

class RealtimeService {
  private ws: WebSocket | null = null;
  private isConnected: boolean = false;
  private reconnectTimer: any = null;
  private heartbeatTimer: any = null;
  private currentSubscribedCaseId?: string;
  private isAdminSubscribed: boolean = false;

  private messageListeners: Map<string, Set<MessageListener>> = new Map();
  private globalMessageListeners: Set<MessageListener> = new Set();
  private typingListeners: Map<string, Set<TypingListener>> = new Map();
  private reportUpdateListeners: Set<ReportUpdateListener> = new Set();
  private reportDeleteListeners: Set<ReportDeleteListener> = new Set();
  private messagesReadListeners: Set<MessagesReadListener> = new Set();
  private connectionListeners: Set<ConnectionListener> = new Set();

  constructor() {
    this.connect();
  }

  public connect(): void {
    if (typeof window === 'undefined') return;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.notifyConnectionChange(true);
        this.startHeartbeat();

        // Resubscribe if previously subscribed
        if (this.currentSubscribedCaseId || this.isAdminSubscribed) {
          this.subscribe(this.currentSubscribedCaseId, this.isAdminSubscribed);
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data: WsServerEvent = JSON.parse(event.data);
          this.handleServerEvent(data);
        } catch (err) {
          console.error('Error parsing incoming WebSocket message:', err);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.notifyConnectionChange(false);
        this.stopHeartbeat();
        this.scheduleReconnect();
      };

      this.ws.onerror = (err) => {
        console.warn('WebSocket connection error:', err);
        this.isConnected = false;
        this.notifyConnectionChange(false);
      };
    } catch (err) {
      console.error('Failed to initialize WebSocket:', err);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, 2500);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 25000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private handleServerEvent(event: WsServerEvent): void {
    if (event.type === 'new_message') {
      const { reportId, message } = event;

      // Sync into SQLite local store safely
      const existing = db.getMessages(reportId);
      if (!existing.some(m => m.id === message.id)) {
        // Only push if not already present
        (db as any).messages[reportId] = [...(existing || []), message];
        (db as any).persist();
      }

      // Notify case-specific listeners
      const listeners = this.messageListeners.get(reportId);
      if (listeners) {
        listeners.forEach(cb => cb(message));
      }

      // Notify global admin listeners
      this.globalMessageListeners.forEach(cb => cb(message));
    } else if (event.type === 'messages_read') {
      const { reportId } = event;
      db.markMessagesAsReadByAdmin(reportId);
      this.messagesReadListeners.forEach(cb => cb(reportId));
    } else if (event.type === 'typing_status') {
      const listeners = this.typingListeners.get(event.caseId);
      if (listeners) {
        listeners.forEach(cb => cb(event));
      }
    } else if (event.type === 'report_updated') {
      db.syncReportFromServer(event.report);
      this.reportUpdateListeners.forEach(cb => cb(event.report));
    } else if (event.type === 'report_created') {
      db.syncReportFromServer(event.report);
      this.reportUpdateListeners.forEach(cb => cb(event.report));
    } else if (event.type === 'report_deleted') {
      db.removeReportFromServer(event.reportId);
      this.reportDeleteListeners.forEach(cb => cb(event.reportId));
    }
  }

  public sendReportUpdate(report: ReportItem): void {
    // 1. Sync local DB
    db.syncReportFromServer(report);

    // 2. Notify local listeners
    this.reportUpdateListeners.forEach(cb => cb(report));

    // 3. Send WebSocket event
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const payload: WsClientEvent = {
        type: 'report_update',
        report
      };
      this.ws.send(JSON.stringify(payload));
    }

    // 4. Send REST API PUT
    try {
      fetch(`/api/reports/${report.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report)
      }).catch(err => console.error('Failed to sync PUT report:', err));
    } catch {}
  }

  public sendReportDelete(reportId: string): void {
    // 1. Remove from local DB
    db.removeReportFromServer(reportId);

    // 2. Notify local listeners
    this.reportDeleteListeners.forEach(cb => cb(reportId));

    // 3. Send WebSocket event
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const payload: WsClientEvent = {
        type: 'report_delete',
        reportId
      };
      this.ws.send(JSON.stringify(payload));
    }

    // 4. Send REST API DELETE
    try {
      fetch(`/api/reports/${reportId}`, {
        method: 'DELETE'
      }).catch(err => console.error('Failed to sync DELETE report:', err));
    } catch {}
  }

  public markAsRead(reportId: string): void {
    db.markMessagesAsReadByAdmin(reportId);
    this.messagesReadListeners.forEach(cb => cb(reportId));

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const payload: WsClientEvent = {
        type: 'mark_read',
        reportId
      };
      this.ws.send(JSON.stringify(payload));
    } else {
      // Fallback to fetch API
      try {
        fetch(`/api/reports/${reportId}/mark-read`, { method: 'POST' }).catch(() => {});
      } catch {}
    }
  }

  public subscribe(caseId?: string, isAdmin: boolean = false): void {
    this.currentSubscribedCaseId = caseId;
    this.isAdminSubscribed = isAdmin;

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const payload: WsClientEvent = {
        type: 'subscribe',
        caseId,
        isAdmin
      };
      this.ws.send(JSON.stringify(payload));
    }
  }

  public sendMessage(
    reportId: string,
    senderRole: 'investigator' | 'reporter',
    senderName: string,
    message: string
  ): void {
    const text = message.trim();
    if (!text) return;

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const payload: WsClientEvent = {
        type: 'chat_message',
        reportId,
        senderRole,
        senderName,
        message: text
      };
      this.ws.send(JSON.stringify(payload));
    } else {
      // Fallback to local and fetch API
      db.sendMessage(reportId, senderRole, senderName, text);
    }
  }

  public sendTyping(caseId: string, userRole: 'investigator' | 'reporter', userName: string, isTyping: boolean): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const payload: WsClientEvent = {
        type: 'typing',
        caseId,
        userRole,
        userName,
        isTyping
      };
      this.ws.send(JSON.stringify(payload));
    }
  }

  public onCaseMessage(caseId: string, callback: MessageListener): () => void {
    if (!this.messageListeners.has(caseId)) {
      this.messageListeners.set(caseId, new Set());
    }
    this.messageListeners.get(caseId)!.add(callback);

    return () => {
      this.messageListeners.get(caseId)?.delete(callback);
    };
  }

  public onGlobalMessage(callback: MessageListener): () => void {
    this.globalMessageListeners.add(callback);
    return () => {
      this.globalMessageListeners.delete(callback);
    };
  }

  public onTyping(caseId: string, callback: TypingListener): () => void {
    if (!this.typingListeners.has(caseId)) {
      this.typingListeners.set(caseId, new Set());
    }
    this.typingListeners.get(caseId)!.add(callback);

    return () => {
      this.typingListeners.get(caseId)?.delete(callback);
    };
  }

  public onReportUpdated(callback: ReportUpdateListener): () => void {
    this.reportUpdateListeners.add(callback);
    return () => {
      this.reportUpdateListeners.delete(callback);
    };
  }

  public onReportDeleted(callback: ReportDeleteListener): () => void {
    this.reportDeleteListeners.add(callback);
    return () => {
      this.reportDeleteListeners.delete(callback);
    };
  }

  public onMessagesRead(callback: MessagesReadListener): () => void {
    this.messagesReadListeners.add(callback);
    return () => {
      this.messagesReadListeners.delete(callback);
    };
  }

  public onConnectionChange(callback: ConnectionListener): () => void {
    this.connectionListeners.add(callback);
    callback(this.isConnected);
    return () => {
      this.connectionListeners.delete(callback);
    };
  }

  private notifyConnectionChange(connected: boolean): void {
    this.connectionListeners.forEach(cb => cb(connected));
  }

  public getIsConnected(): boolean {
    return this.isConnected;
  }
}

export const realtimeService = new RealtimeService();
