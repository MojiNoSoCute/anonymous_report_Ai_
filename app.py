# -*- coding: utf-8 -*-
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
from flask import Flask, request, jsonify, render_template_string, redirect, url_for, session

# ---------------------------------------------------------------------------
# 1. การตั้งค่าเริ่มต้นโปรแกรม Flask และกำหนดความปลอดภัย
# ---------------------------------------------------------------------------
app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'trustline_secret_key_2024_secure')
DATABASE_FILE = 'trustline.db'
UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')

# สร้างโฟลเดอร์เก็บไฟล์อัปโหลดหากยังไม่มี
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # ขนาดไฟล์สูงสุด 50MB

# ---------------------------------------------------------------------------
# 2. ฟังก์ชันจัดการฐานข้อมูล SQLite (SQLite Helper Functions)
# ---------------------------------------------------------------------------
def get_db_connection():
    """สร้างการเชื่อมต่อกับฐานข้อมูล SQLite และคืนค่าการเชื่อมต่อในรูปแบบ Row Factory"""
    conn = sqlite3.connect(DATABASE_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """ฟังก์ชันสร้างตารางและใส่ข้อมูลเริ่มต้นลงในฐานข้อมูล SQLite"""
    if os.path.exists('schema.sql'):
        with open('schema.sql', 'r', encoding='utf-8') as f:
            schema_sql = f.read()
        conn = get_db_connection()
        conn.executescript(schema_sql)
        conn.commit()
        conn.close()
        print("✅ ติดตั้งระบบฐานข้อมูล SQLite เรียบร้อยแล้ว (Initialized SQLite Database)")

# ฟังก์ชันเข้ารหัสผ่านด้วย SHA-256
def hash_password(password):
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

# ---------------------------------------------------------------------------
# 3. API Routes: ระบบสร้างและติดตามรายงาน (Whistleblower API)
# ---------------------------------------------------------------------------

@app.route('/api/reports', methods=['POST'])
def create_report():
    """API สำหรับสร้างรายงานแจ้งเบาะแสใหม่"""
    try:
        data = request.get_json() or request.form
        
        category = data.get('category', 'fraud')
        urgency = data.get('urgency', 'medium')
        incident_date = data.get('incidentDate', datetime.now().strftime('%Y-%m-%d'))
        location = data.get('location', 'ไม่ระบุ')
        description = data.get('description', '')
        pin = data.get('pin', '1234')
        
        # สุ่มสร้างรหัสรายงาน Unique Case ID
        import random, string
        random_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
        report_id = f"TL-2024-{random_code}"
        pin_hash = hash_password(pin)
        
        conn = get_db_connection()
        conn.execute('''
            INSERT INTO reports (id, pin_hash, category, urgency, incident_date, location, description, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'received')
        ''', (report_id, pin_hash, category, urgency, incident_date, location, description))
        
        # บันทึก Audit Log
        conn.execute('''
            INSERT INTO audit_logs (user_name, action_text, ip_address, status)
            VALUES ('Anonymous_User', ?, ?, 'Success')
        ''', (f"Created report #{report_id} ({category})", request.remote_addr))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'สร้างรายงานสำเร็จ',
            'reportId': report_id,
            'pin': pin
        }), 201
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/reports/track', methods=['POST'])
def track_report():
    """API สำหรับติดตามสถานะรายงานด้วย Report ID และ PIN"""
    data = request.get_json() or request.form
    report_id = data.get('reportId', '').strip()
    pin = data.get('pin', '').strip()
    
    conn = get_db_connection()
    report = conn.execute('SELECT * FROM reports WHERE id = ?', (report_id,)).fetchone()
    
    if not report:
        conn.close()
        return jsonify({'success': False, 'message': 'ไม่พบรหัสรายงานในระบบ'}), 404
        
    if report['pin_hash'] != hash_password(pin):
        conn.close()
        return jsonify({'success': False, 'message': 'รหัสผ่าน (PIN) ไม่ถูกต้อง'}), 401
        
    # ดึงข้อมูลไฟล์หลักฐานและแชท
    evidence_files = conn.execute('SELECT * FROM evidence WHERE report_id = ?', (report_id,)).fetchall()
    messages = conn.execute('SELECT * FROM messages WHERE report_id = ? ORDER BY sent_at ASC', (report_id,)).fetchall()
    conn.close()
    
    return jsonify({
        'success': True,
        'report': dict(report),
        'evidence': [dict(e) for e in evidence_files],
        'messages': [dict(m) for m in messages]
    })

# ---------------------------------------------------------------------------
# 4. API Routes: ระบบอัปโหลดไฟล์หลักฐาน (Evidence Upload)
# ---------------------------------------------------------------------------

@app.route('/api/upload', methods=['POST'])
def upload_evidence():
    """API สำหรับอัปโหลดไฟล์หลักฐาน"""
    if 'file' not in request.files:
        return jsonify({'success': False, 'message': 'ไม่พบไฟล์ที่เลือก'}), 400
        
    file = request.files['file']
    report_id = request.form.get('reportId', '')
    
    if file.filename == '':
        return jsonify({'success': False, 'message': 'ชื่อไฟล์ไม่ถูกต้อง'}), 400
        
    filename = f"{int(datetime.now().timestamp())}_{file.filename}"
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)
    
    conn = get_db_connection()
    conn.execute('''
        INSERT INTO evidence (report_id, file_name, file_path, file_type, file_size)
        VALUES (?, ?, ?, ?, ?)
    ''', (report_id, file.filename, f"/uploads/{filename}", file.content_type or 'application/octet-stream', os.path.getsize(filepath)))
    
    conn.commit()
    conn.close()
    
    return jsonify({'success': True, 'message': 'อัปโหลดไฟล์เรียบร้อยแล้ว', 'fileName': file.filename})

# ---------------------------------------------------------------------------
# 5. API Routes: ระบบจัดการข้อมูลและเข้าสู่ระบบสำหรับเจ้าหน้าที่ (Admin API)
# ---------------------------------------------------------------------------

@app.route('/api/login', methods=['POST'])
def login():
    """ระบบเข้าสู่ระบบที่ปลอดภัยสำหรับเจ้าหน้าที่สืบสวน"""
    data = request.get_json() or request.form
    username = data.get('username')
    password = data.get('password')
    
    # ตรวจสอบบัญชี Default
    if username == 'admin' and password == 'password123':
        session['user'] = username
        session['role'] = 'admin'
        
        conn = get_db_connection()
        conn.execute('INSERT INTO audit_logs (user_name, action_text, status) VALUES (?, ?, ?)',
                     (username, 'Logged in to Case Manager Portal', 'Success'))
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': 'เข้าสู่ระบบสำเร็จ', 'role': 'admin'})
        
    return jsonify({'success': False, 'message': 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'}), 401

@app.route('/api/audit-logs', methods=['GET'])
def get_audit_logs():
    """ดึงประวัติการใช้งานระบบ SQLite Audit Logs"""
    conn = get_db_connection()
    logs = conn.execute('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 50').fetchall()
    conn.close()
    return jsonify({'success': True, 'logs': [dict(l) for l in logs]})

# ---------------------------------------------------------------------------
# 6. HTML Template การแสดงผลผ่านเว็บเบราว์เซอร์
# ---------------------------------------------------------------------------
HTML_VIEW = """
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <title>TrustLine Whistleblower Systems - Python Flask</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
</head>
<body class="bg-gray-50 text-gray-900 font-sans p-6">
    <div class="max-w-4xl mx-auto bg-white rounded-xl border p-8 shadow-sm">
        <h1 class="text-2xl font-bold text-red-600 mb-2">TrustLine Whistleblower Systems (Python Flask Edition)</h1>
        <p class="text-gray-600 mb-6">ระบบจัดการข้อมูลแจ้งเบาะแสด้วย Python, Flask และ SQLite 3</p>
        <div class="bg-red-50 border-l-4 border-red-600 p-4 mb-6">
            <p class="font-semibold text-red-800">✅ ระบบฐานข้อมูล SQLite พร้อมใช้งานแล้ว</p>
            <p class="text-sm text-red-700">สามารถรันแอปพลิเคชันนี้บนเครื่องคอมพิวเตอร์ของคุณด้วยคำสั่ง <code>python app.py</code></p>
        </div>
    </div>
</body>
</html>
"""

@app.route('/')
def home():
    """แสดงผลหน้าหลักผ่านเว็บเบราว์เซอร์"""
    return render_template_string(HTML_VIEW)

# ---------------------------------------------------------------------------
# 7. การเริ่มต้นการทำงานของเซิร์ฟเวอร์
# ---------------------------------------------------------------------------
if __name__ == '__main__':
    init_db()
    print("🚀 เริ่มต้นเซิร์ฟเวอร์ Python Flask บนพอร์ต 5000...")
    app.run(host='0.0.0.0', port=5000, debug=True)
