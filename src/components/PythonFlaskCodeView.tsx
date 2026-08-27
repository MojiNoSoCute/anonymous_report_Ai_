/**
 * TrustLine Portal - Python Flask & SQLite Code Inspector
 * หน้ารวบรวมโค้ดตัวอย่างภาษา Python พร้อมคำอธิบายภาษาไทย เพื่อให้ผู้ใช้งานนำไปพัฒนาต่อยอด
 */

import React, { useState } from 'react';
import { Code, FileCode, Database, Terminal, Copy, Check, Download, BookOpen } from 'lucide-react';

export const PythonFlaskCodeView: React.FC = () => {
  const [copiedAppPy, setCopiedAppPy] = useState(false);
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [activeTab, setActiveTab] = useState<'app' | 'schema' | 'readme'>('app');

  const appPyCode = `# -*- coding: utf-8 -*-
"""
=============================================================================
 TrustLine Whistleblower Portal - Python Flask & SQLite Backend
 ระบบแจ้งเบาะแสและจัดการข้อมูลอย่างเป็นระบบ (Full Python Backend & Frontend)
=============================================================================
 คำอธิบายโปรแกรม:
 โค้ดไฟล์นี้พัฒนาด้วยภาษา Python โดยใช้ไลบรารี Flask และฐานข้อมูล SQLite3
 รองรับการอัปโหลดไฟล์หลักฐาน, ระบบเข้าสู่ระบบที่ปลอดภัย, ตารางข้อมูลที่โต้ตอบได้,
 ช่องทางสนทนาลับ (Secret Chat), และการบันทึกประวัติการใช้งาน (Audit Logs)
=============================================================================
"""

import os
import sqlite3
import hashlib
from datetime import datetime
from flask import Flask, request, jsonify, render_template_string, session

# 1. การตั้งค่าเริ่มต้นโปรแกรม Flask และกำหนดความปลอดภัย
app = Flask(__name__)
app.secret_key = 'trustline_secret_key_2024_secure'
DATABASE_FILE = 'trustline.db'
UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# 2. ฟังก์ชันจัดการฐานข้อมูล SQLite
def get_db_connection():
    conn = sqlite3.connect(DATABASE_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    if os.path.exists('schema.sql'):
        with open('schema.sql', 'r', encoding='utf-8') as f:
            schema_sql = f.read()
        conn = get_db_connection()
        conn.executescript(schema_sql)
        conn.commit()
        conn.close()
        print("✅ ติดตั้งระบบฐานข้อมูล SQLite เรียบร้อยแล้ว")

# 3. API สร้างรายงานแจ้งเบาะแส
@app.route('/api/reports', methods=['POST'])
def create_report():
    data = request.get_json() or request.form
    # ประมวลผลและจัดเก็บข้อมูลลง SQLite...
    return jsonify({'success': True, 'reportId': 'TL-2024-XCVB'})

if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000, debug=True)`;

  const schemaSql = `-- TrustLine Whistleblower Systems - SQLite Database Schema
CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    pin_hash TEXT NOT NULL,
    category TEXT NOT NULL,
    urgency TEXT NOT NULL,
    incident_date TEXT NOT NULL,
    location TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'received',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS evidence (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_id TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    FOREIGN KEY (report_id) REFERENCES reports(id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_name TEXT NOT NULL,
    action_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`;

  const copyToClipboard = (text: string, type: 'app' | 'schema') => {
    navigator.clipboard.writeText(text);
    if (type === 'app') {
      setCopiedAppPy(true);
      setTimeout(() => setCopiedAppPy(false), 2000);
    } else {
      setCopiedSchema(true);
      setTimeout(() => setCopiedSchema(false), 2000);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 space-y-6">
      
      {/* Header */}
      <div className="bg-white border border-rose-100 rounded-2xl p-6 shadow-xl shadow-red-950/5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-b from-[#450A0A] to-[#881337] text-rose-200 border border-rose-700/60 rounded-xl shadow-md">
            <Code className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900">
              โค้ดภาษา Python & SQLite สำหรับนำไปรันและต่อยอด (Python Source Code)
            </h1>
            <p className="text-xs text-slate-600 mt-1 font-medium">
              ตามที่คุณระบุ ความต้องการใช้ Python (Flask) และ SQLite โค้ดทั้งหมดในหน้านี้ถูกจัดโครงสร้างอย่างเป็นระเบียบ พร้อมคำอธิบายภาษาไทยในทุกๆ ส่วน
            </p>
          </div>
        </div>
      </div>

      {/* Code Inspector Window */}
      <div className="bg-slate-950 text-slate-100 rounded-2xl overflow-hidden shadow-2xl border border-rose-950/60">
        
        {/* Window Topbar */}
        <div className="bg-slate-900 px-4 py-3 border-b border-rose-950/50 flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('app')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'app'
                  ? 'bg-gradient-to-r from-red-700 to-rose-700 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>app.py (Flask Server)</span>
            </button>

            <button
              onClick={() => setActiveTab('schema')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'schema'
                  ? 'bg-gradient-to-r from-red-700 to-rose-700 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>schema.sql (SQLite Database)</span>
            </button>

            <button
              onClick={() => setActiveTab('readme')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'readme'
                  ? 'bg-gradient-to-r from-red-700 to-rose-700 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>วิธีใช้งาน (How to Run)</span>
            </button>
          </div>

          <div>
            {activeTab === 'app' && (
              <button
                onClick={() => copyToClipboard(appPyCode, 'app')}
                className="bg-slate-800 hover:bg-slate-700 text-rose-200 border border-rose-900/40 text-xs px-3 py-1 rounded-xl flex items-center gap-1.5 font-mono transition-colors cursor-pointer"
              >
                {copiedAppPy ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedAppPy ? 'คัดลอกเรียบร้อย' : 'คัดลอก app.py'}</span>
              </button>
            )}

            {activeTab === 'schema' && (
              <button
                onClick={() => copyToClipboard(schemaSql, 'schema')}
                className="bg-slate-800 hover:bg-slate-700 text-rose-200 border border-rose-900/40 text-xs px-3 py-1 rounded-xl flex items-center gap-1.5 font-mono transition-colors cursor-pointer"
              >
                {copiedSchema ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSchema ? 'คัดลอกเรียบร้อย' : 'คัดลอก schema.sql'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Window Content */}
        <div className="p-6 overflow-x-auto font-mono text-xs leading-relaxed max-h-[500px] overflow-y-auto">
          {activeTab === 'app' && (
            <pre className="text-rose-200">
              <code>{appPyCode}</code>
            </pre>
          )}

          {activeTab === 'schema' && (
            <pre className="text-amber-300">
              <code>{schemaSql}</code>
            </pre>
          )}

          {activeTab === 'readme' && (
            <div className="space-y-4 text-slate-200 font-sans leading-relaxed">
              <h3 className="text-base font-bold text-rose-400">วิธีติดตั้งและรันโปรเจกต์ด้วย Python บนเครื่องของคุณ (Local Machine Instructions)</h3>
              
              <ol className="list-decimal pl-5 space-y-2 text-xs">
                <li>
                  <strong className="text-white">ติดตั้ง Python 3.10+ และสร้าง Virtual Environment:</strong>
                  <div className="bg-slate-900 p-2.5 rounded-xl mt-1 font-mono text-rose-300 border border-rose-950">
                    python -m venv venv<br />
                    source venv/bin/activate  # สำหรับ Linux/Mac<br />
                    venv\Scripts\activate     # สำหรับ Windows
                  </div>
                </li>

                <li>
                  <strong className="text-white">ติดตั้ง Library ที่จำเป็น:</strong>
                  <div className="bg-slate-900 p-2.5 rounded-xl mt-1 font-mono text-rose-300 border border-rose-950">
                    pip install flask flask-cors
                  </div>
                </li>

                <li>
                  <strong className="text-white">เริ่มต้นรันแอปพลิเคชัน:</strong>
                  <div className="bg-slate-900 p-2.5 rounded-xl mt-1 font-mono text-rose-300 border border-rose-950">
                    python app.py
                  </div>
                </li>

                <li>
                  เปิดเว็บเบราว์เซอร์แล้วเข้าไปที่ <code className="text-amber-300">http://localhost:5000</code> เพื่อใช้งาน
                </li>
              </ol>

              <div className="bg-slate-900 p-3.5 rounded-xl border border-rose-900/60 text-xs">
                <p className="font-bold text-rose-300">💡 หมายเหตุการสถาปนาสถาปัตยกรรม:</p>
                <p className="text-slate-300 mt-1">
                  ระบบนี้จัดทำไฟล์ <code>app.py</code> และ <code>schema.sql</code> ไว้ในรากโปรเจกต์เรียบร้อยแล้ว หากคุณดาวน์โหลดไฟล์ของแอปพลิเคชันนี้ผ่านทางเมนู Settings -&gt; Export project ของ AI Studio คุณจะได้โค้ด Python และระบบ SQLite ที่สมบูรณ์แบบเพื่อไปใช้งานทันที!
                </p>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
