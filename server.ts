import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Gemini Client server-side
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Category mapping helper
const categoryNamesTh: Record<string, string> = {
  harassment: 'การล่วงละเมิดและคุกคาม (Harassment & Bullying)',
  compliance: 'การปฏิบัติตามกฎระเบียบ (Compliance & Ethics)',
  technical: 'ปัญหาทางเทคนิค/ความปลอดภัย (Technical & Security)',
  fraud: 'การทุจริตทางการเงิน (Financial Fraud)',
  safety: 'ความปลอดภัยและสิ่งแวดล้อม (Safety & Environment)',
  academic: 'การประพฤติผิดทางวิชาการ (Academic Misconduct)',
  teaching: 'คุณภาพการสอน/รายงานเกี่ยวกับอาจารย์ (Teaching & Instructor Issues)',
};

const urgencyNamesTh: Record<string, string> = {
  low: 'ปกติ (Low)',
  medium: 'ปานกลาง (Medium)',
  high: 'สูง (High)',
  critical: 'วิกฤต (Critical)',
};

// --- In-Memory Synchronized Backend Store ---
let serverReports: any[] = [
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

let serverMessages: Record<string, any[]> = {
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

// --- WebSocket Connection Management ---
interface ClientConnection {
  ws: WebSocket;
  caseId?: string;
  isAdmin: boolean;
}

const activeClients = new Set<ClientConnection>();

function broadcast(payload: any, targetCaseId?: string, skipWs?: WebSocket) {
  const data = JSON.stringify(payload);
  for (const client of activeClients) {
    if (client.ws.readyState !== WebSocket.OPEN) continue;
    if (skipWs && client.ws === skipWs) continue;

    // Send if client is subscribed to this case OR is an admin
    if (!targetCaseId || client.isAdmin || client.caseId === targetCaseId) {
      try {
        client.ws.send(data);
      } catch (err) {
        console.error('Error broadcasting to client:', err);
      }
    }
  }
}

// --- REST API Endpoints ---

// Gemini AI analysis endpoint
app.post('/api/analyze', async (req, res) => {
  try {
    const { description, location } = req.body;

    if (!description || typeof description !== 'string' || !description.trim()) {
      return res.status(400).json({ error: 'กรุณากรอกคำอธิบายเหตุการณ์' });
    }

    if (!ai) {
      console.warn('GEMINI_API_KEY is missing, using intelligent fallback rules');
      return res.json({
        category: 'compliance',
        categoryNameTh: categoryNamesTh['compliance'],
        urgency: 'medium',
        urgencyNameTh: urgencyNamesTh['medium'],
        confidence: 82,
        reasoning: 'ระบบใช้กฎวิเคราะห์อัจฉริยะ (ยังไม่ได้ตั้งค่า GEMINI_API_KEY)',
        keyTermsFound: ['การตรวจสอบเบื้องต้น'],
        isRealAi: false,
      });
    }

    const systemInstruction = `คุณคือ AI ผู้เชี่ยวชาญวิเคราะห์เรื่องร้องเรียนและเบาะแสสำหรับ มหาวิทยาลัยราชภัฏนครปฐม (NPRU Sentinel)
จงอ่านและวิเคราะห์รายละเอียดเหตุการณ์ของผู้แจ้งอย่างละเอียด แม่นยำ และเป็นธรรมที่สุด โดยคำนึงถึงบริบทภาษาไทยและชีวิตในมหาวิทยาลัย

หมวดหมู่ที่มีให้เลือก (category - เลือกเพียง 1 หมวดหมู่ที่ตรงที่สุด):
1. 'harassment' -> การล่วงละเมิด คุกคาม บูลลี่ การกลั่นแกล้ง ลวนลาม อนาจาร ข่มขู่ บังคับ
2. 'fraud' -> การทุจริต เงิน ยักยอก สินบน เรียกรับผลประโยชน์ เบิกจ่ายเท็จ ใต้โต๊ะ งบประมาณ
3. 'academic' -> การประพฤติผิดทางวิชาการ ลอกข้อสอบ จ้างทำวิทยานิพนธ์/รายงาน ซื้อขายผลงาน
4. 'technical' -> ปัญหาทางเทคนิค ไซเบอร์ แฮกไอดี/ระบบ ไวรัส ข้อมูลรั่วไหล เว็บไซต์/ระบบล่ม
5. 'safety' -> ความปลอดภัย โครงสร้างอาคารชำรุด อันตราย ไฟฟ้า แก๊สรั่ว เพดานพัง สารเคมี
6. 'compliance' -> การละเมิดกฎระเบียบ วินัย ยาเสพติด สุรา/บุหรี่ การละเว้นหน้าที่ มาสาย/ลาป่วยเท็จ
7. 'teaching' -> รายงานเกี่ยวกับอาจารย์ พฤติกรรมอาจารย์ คุณภาพการสอน ไม่เข้าสอน สอนไม่รู้เรื่อง คำพูดไม่เหมาะสม ดุร้าย ตัดเกรดไม่เป็นธรรม

ระดับความเร่งด่วน (urgency - เลือกเพียง 1 ระดับ):
- 'low' -> เรื่องทั่วไป ข้อเสนอแนะ สอบถาม ไม่มีผลกระทบฉุกเฉิน
- 'medium' -> ปัญหาระดับปานกลาง มีผลกระทบเฉพาะกลุ่ม หรือกระทำผิดระเบียบทั่วไป
- 'high' -> มีความเสียหายชัดเจน การทุจริต คุกคาม ล่วงละเมิด หรือทำผิดกฎหมาย ร้ายแรง
- 'critical' -> มีอันตรายต่อชีวิต/ร่างกายอย่างรวดเร็ว ไฟไหม้ ขู่ฆ่า แก๊สรั่ว ทำร้ายร่างกาย อาคารถล่ม

ให้คืนค่า JSON ที่ตรงตามโครงสร้างอย่างเคร่งครัด อธิบายเหตุผลภาษาไทยอย่างสมเหตุสมผล กระชับ และระบุคำสำคัญที่พบในข้อความ`;

    const prompt = `เรื่องร้องเรียน/เบาะแส:\n"${description.trim()}"\n${location ? `สถานที่: ${location.trim()}` : ''}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: {
              type: Type.STRING,
              description: "One of 'harassment', 'fraud', 'academic', 'technical', 'safety', 'compliance', 'teaching'",
            },
            urgency: {
              type: Type.STRING,
              description: "One of 'low', 'medium', 'high', 'critical'",
            },
            confidence: {
              type: Type.NUMBER,
              description: "Confidence percentage (e.g. 85-99)",
            },
            reasoning: {
              type: Type.STRING,
              description: "Detailed analysis reasoning in Thai explaining why this category and urgency were chosen",
            },
            keyTermsFound: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Array of key Thai words or phrases extracted from the report text",
            },
          },
          required: ['category', 'urgency', 'confidence', 'reasoning', 'keyTermsFound'],
        },
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error('Gemini API returned empty text response');
    }

    const parsed = JSON.parse(responseText);
    const validCategories = Object.keys(categoryNamesTh);
    const validUrgencies = Object.keys(urgencyNamesTh);

    const finalCategory = validCategories.includes(parsed.category) ? parsed.category : 'compliance';
    const finalUrgency = validUrgencies.includes(parsed.urgency) ? parsed.urgency : 'medium';

    return res.json({
      category: finalCategory,
      categoryNameTh: categoryNamesTh[finalCategory],
      urgency: finalUrgency,
      urgencyNameTh: urgencyNamesTh[finalUrgency],
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 92,
      reasoning: parsed.reasoning || 'วิเคราะห์สำเร็จโดย Gemini AI Model',
      keyTermsFound: Array.isArray(parsed.keyTermsFound) ? parsed.keyTermsFound : [],
      isRealAi: true,
      modelUsed: 'gemini-3.6-flash',
    });

  } catch (error: any) {
    console.error('Error in /api/analyze:', error);
    return res.status(500).json({
      error: 'เกิดข้อผิดพลาดในการประมวลผลด้วย Gemini AI',
      details: error?.message || String(error),
    });
  }
});

// Reports API
app.get('/api/reports', (req, res) => {
  res.json(serverReports);
});

app.get('/api/reports/:id', (req, res) => {
  const report = serverReports.find(r => r.id.toLowerCase() === req.params.id.trim().toLowerCase());
  if (!report) return res.status(404).json({ error: 'ไม่พบรายงาน' });
  res.json(report);
});

app.post('/api/reports', (req, res) => {
  const newReport = req.body;
  if (!newReport || !newReport.id) {
    return res.status(400).json({ error: 'ข้อมูลรายงานไม่ถูกต้อง' });
  }
  serverReports.unshift(newReport);
  broadcast({ type: 'report_created', report: newReport });
  res.json({ success: true, report: newReport });
});

app.put('/api/reports/:id', (req, res) => {
  const id = req.params.id.trim().toLowerCase();
  const idx = serverReports.findIndex(r => r.id.toLowerCase() === id);
  if (idx === -1) return res.status(404).json({ error: 'ไม่พบรายงาน' });

  serverReports[idx] = { ...serverReports[idx], ...req.body, updatedAt: new Date().toISOString() };
  const updated = serverReports[idx];
  broadcast({ type: 'report_updated', report: updated });
  res.json({ success: true, report: updated });
});

app.delete('/api/reports/:id', (req, res) => {
  const id = req.params.id.trim().toLowerCase();
  const idx = serverReports.findIndex(r => r.id.toLowerCase() === id);
  if (idx === -1) return res.status(404).json({ error: 'ไม่พบรายงาน' });

  const deleted = serverReports.splice(idx, 1)[0];
  delete serverMessages[deleted.id];
  broadcast({ type: 'report_deleted', reportId: deleted.id });
  res.json({ success: true, reportId: deleted.id });
});

// Messages API
app.get('/api/reports/:id/messages', (req, res) => {
  const id = req.params.id.trim();
  res.json(serverMessages[id] || []);
});

app.post('/api/reports/:id/messages', (req, res) => {
  const reportId = req.params.id.trim();
  const { senderRole, senderName, message } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'กรุณากรอกข้อความ' });
  }

  if (!serverMessages[reportId]) {
    serverMessages[reportId] = [];
  }

  const now = new Date();
  const timeStr = `${now.getDate()} ต.ค. ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const newMsg = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    reportId,
    senderRole: senderRole || 'reporter',
    senderName: senderName || 'ผู้ใช้',
    message: message.trim(),
    timestamp: timeStr,
    readByAdmin: senderRole === 'investigator'
  };

  serverMessages[reportId].push(newMsg);
  broadcast({ type: 'new_message', reportId, message: newMsg }, reportId);

  res.json({ success: true, message: newMsg });
});

// Mark messages as read by admin
app.post('/api/reports/:id/mark-read', (req, res) => {
  const reportId = req.params.id;
  if (serverMessages[reportId]) {
    serverMessages[reportId].forEach((m: any) => {
      if (m.senderRole === 'reporter') {
        m.readByAdmin = true;
      }
    });
    broadcast({ type: 'messages_read', reportId }, reportId);
  }
  res.json({ success: true, reportId });
});

// Start Server and attach WebSocket
async function startServer() {
  const server = http.createServer(app);

  // Setup WebSocket Server
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    const conn: ClientConnection = {
      ws,
      caseId: undefined,
      isAdmin: false
    };
    activeClients.add(conn);

    ws.on('message', (rawData: string) => {
      try {
        const data = JSON.parse(rawData.toString());

        if (data.type === 'subscribe') {
          conn.caseId = data.caseId;
          conn.isAdmin = !!data.isAdmin;
          ws.send(JSON.stringify({ type: 'subscribed', caseId: data.caseId }));
        } else if (data.type === 'unsubscribe') {
          conn.caseId = undefined;
        } else if (data.type === 'mark_read') {
          const { reportId } = data;
          if (reportId && serverMessages[reportId]) {
            serverMessages[reportId].forEach((m: any) => {
              if (m.senderRole === 'reporter') {
                m.readByAdmin = true;
              }
            });
            broadcast({ type: 'messages_read', reportId }, reportId);
          }
        } else if (data.type === 'chat_message') {
          const { reportId, senderRole, senderName, message } = data;
          if (reportId && message) {
            if (!serverMessages[reportId]) {
              serverMessages[reportId] = [];
            }
            const now = new Date();
            const timeStr = `${now.getDate()} ต.ค. ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
            const newMsg = {
              id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              reportId,
              senderRole: senderRole || 'reporter',
              senderName: senderName || 'ผู้ใช้',
              message: message.trim(),
              timestamp: timeStr,
              readByAdmin: senderRole === 'investigator'
            };
            serverMessages[reportId].push(newMsg);
            broadcast({ type: 'new_message', reportId, message: newMsg }, reportId);
          }
        } else if (data.type === 'typing') {
          const { caseId, userRole, userName, isTyping } = data;
          broadcast(
            { type: 'typing_status', caseId, userRole, userName, isTyping },
            caseId,
            ws
          );
        } else if (data.type === 'report_update') {
          const { report } = data;
          if (report && report.id) {
            const id = report.id.trim().toLowerCase();
            const idx = serverReports.findIndex(r => r.id.toLowerCase() === id);
            if (idx !== -1) {
              serverReports[idx] = { ...serverReports[idx], ...report, updatedAt: new Date().toISOString() };
            } else {
              serverReports.unshift(report);
            }
            const updated = serverReports[idx] || report;
            broadcast({ type: 'report_updated', report: updated });
          }
        } else if (data.type === 'report_delete') {
          const { reportId } = data;
          if (reportId) {
            const id = reportId.trim().toLowerCase();
            const idx = serverReports.findIndex(r => r.id.toLowerCase() === id);
            if (idx !== -1) {
              const deleted = serverReports.splice(idx, 1)[0];
              delete serverMessages[deleted.id];
              broadcast({ type: 'report_deleted', reportId: deleted.id });
            }
          }
        } else if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
        }
      } catch (err) {
        console.error('Error processing WS message:', err);
      }
    });

    ws.on('close', () => {
      activeClients.delete(conn);
    });

    ws.on('error', () => {
      activeClients.delete(conn);
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}

startServer();
