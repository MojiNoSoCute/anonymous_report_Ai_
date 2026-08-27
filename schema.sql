-- =========================================================
-- TrustLine Whistleblower Systems - SQLite Database Schema
-- สคริปต์สร้างตารางฐานข้อมูล SQLite สำหรับระบบแจ้งเบาะแส
-- =========================================================

-- 1. ตารางรายงานเบาะแส (reports)
CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,                       -- รหัสรายงาน เช่น TL-8942-XCVB
    pin_hash TEXT NOT NULL,                    -- รหัส PIN เข้ารหัส (SHA256)
    category TEXT NOT NULL,                    -- หมวดหมู่ปัญหา
    urgency TEXT NOT NULL,                     -- ระดับความเร่งด่วน (low, medium, high, critical)
    incident_date TEXT NOT NULL,               -- วันที่เกิดเหตุ
    location TEXT NOT NULL,                    -- สถานที่เกิดเหตุ
    description TEXT NOT NULL,                 -- รายละเอียดเหตุการณ์
    status TEXT DEFAULT 'received',            -- สถานะการดำเนินงาน (received, investigating, disciplinary, closed)
    assigned_to TEXT DEFAULT 'รอเจ้าหน้าที่รับเรื่อง',-- เจ้าหน้าที่ผู้รับผิดชอบ
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. ตารางไฟล์หลักฐานแนบ (evidence)
CREATE TABLE IF NOT EXISTS evidence (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_id TEXT NOT NULL,                   -- รหัสอ้างอิงตาราง reports
    file_name TEXT NOT NULL,                   -- ชื่อไฟล์
    file_path TEXT NOT NULL,                   -- พาธจัดเก็บไฟล์ หรือ URL
    file_type TEXT NOT NULL,                   -- ประเภทไฟล์ (image/png, application/pdf)
    file_size INTEGER NOT NULL,                -- ขนาดไฟล์ (Bytes)
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
);

-- 3. ตารางข้อความแชทลับ (messages)
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_id TEXT NOT NULL,                   -- รหัสอ้างอิงตาราง reports
    sender_role TEXT NOT NULL,                 -- บทบาทผู้ส่ง ('investigator' หรือ 'reporter')
    sender_name TEXT NOT NULL,                 -- ชื่อแสดงผล
    message_text TEXT NOT NULL,                -- ข้อความ
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
);

-- 4. ตารางบันทึกประวัติการใช้งาน (audit_logs)
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_name TEXT NOT NULL,                   -- ชื่อผู้ใช้งาน หรือ ระบบ
    action_text TEXT NOT NULL,                 -- รายละเอียดการทำงาน
    ip_address TEXT DEFAULT '127.0.0.1',        -- IP Address
    status TEXT DEFAULT 'Success',             -- สถานะการทำงาน ('Success' หรือ 'Failure')
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. ตารางผู้ดูแลระบบ / เจ้าหน้าที่สอบสวน (users)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,             -- ชื่อผู้ใช้สำหรับเข้าสู่ระบบ
    password_hash TEXT NOT NULL,               -- รหัสผ่านเข้ารหัส
    full_name TEXT NOT NULL,                   -- ชื่อ-นามสกุล
    role TEXT DEFAULT 'investigator',          -- สิทธิ์การใช้งาน ('admin' หรือ 'investigator')
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ข้อมูลตัวอย่างเริ่มต้นสำหรับการทดสอบ (Initial Seed Data)
INSERT OR IGNORE INTO reports (id, pin_hash, category, urgency, incident_date, location, description, status, assigned_to)
VALUES 
('TL-8942-XCVB', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'fraud', 'high', '2024-10-10', 'สำนักงานใหญ่ ชั้น 14', 'พบความผิดปกติในการอนุมัติงบประมาณการจัดซื้อซอฟต์แวร์ของแผนก IT', 'investigating', 'เจ้าหน้าที่สืบสวน สมชาย'),
('TL-2024-089A', 'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb', 'fraud', 'critical', '2024-10-24', 'อาคารเรียนรวม 2', 'ตรวจพบใบเสร็จรับเงินเท็จสำหรับการจัดซื้ออุปกรณ์ห้องปฏิบัติการคอมพิวเตอร์', 'investigating', 'เจ้าหน้าที่ HR นารี');

INSERT OR IGNORE INTO audit_logs (user_name, action_text, ip_address, status)
VALUES
('Admin_HR_01', "Status updated to 'In-Progress' (Case #TL-8942-XCVB)", '192.168.1.105', 'Success'),
('System_Automated', 'Escalation triggered for Critical Case #TL-2024-089A', '10.0.0.1', 'Success'),
('Investigator_04', 'Failed login attempt (3rd try with invalid credentials)', '203.114.10.44', 'Failure');
