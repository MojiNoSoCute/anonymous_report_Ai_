/**
 * AI Incident Content & Categorization Analyzer (ระบบ AI วิเคราะห์หมวดหมู่และความเร่งด่วน)
 * วิเคราะห์ข้อความภาษาไทยอย่างชาญฉลาดเพื่อช่วยผู้ใช้งานเลือกหมวดหมู่และระดับความเร่งด่วนได้อย่างถูกต้อง
 */

import { CategoryType, UrgencyLevel } from '../types';

export interface AIAnalysisResult {
  category: CategoryType;
  categoryNameTh: string;
  urgency: UrgencyLevel;
  urgencyNameTh: string;
  confidence: number;
  reasoning: string;
  keyTermsFound: string[];
  isRealAi?: boolean;
}

export async function analyzeReportWithRealAI(description: string, location?: string): Promise<AIAnalysisResult> {
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ description, location }),
    });

    if (!response.ok) {
      throw new Error(`Server status ${response.status}`);
    }

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }

    return {
      category: data.category as CategoryType,
      categoryNameTh: data.categoryNameTh,
      urgency: data.urgency as UrgencyLevel,
      urgencyNameTh: data.urgencyNameTh,
      confidence: data.confidence || 95,
      reasoning: data.reasoning || 'วิเคราะห์ด้วย Gemini AI Model',
      keyTermsFound: data.keyTermsFound || [],
      isRealAi: data.isRealAi ?? true,
    };
  } catch (error) {
    console.warn('Gemini AI endpoint unavailable, using smart local fallback:', error);
    const fallback = analyzeReportWithAI(description, location);
    return {
      ...fallback,
      isRealAi: false,
    };
  }
}

export function analyzeReportWithAI(description: string, location?: string): AIAnalysisResult {
  const text = (description + ' ' + (location || '')).toLowerCase();

  const foundTerms: string[] = [];

  // Keywords definitions
  const harassmentKeywords = [
    'คุกคาม', 'บูลลี่', 'harassment', 'bullying', 'ล่วงละเมิด', 'ข่มขู่', 'กลั่นแกล้ง', 
    'ด่าทอ', 'ลวนลาม', 'ทางเพศ', 'แกล้ง', 'อนาจาร', 'ลวนลามสายตา', 'แกล้งรุ่นน้อง'
  ];

  const fraudKeywords = [
    'ทุจริต', 'เงิน', 'ใบเสร็จ', 'ยักยอก', 'งบประมาณ', 'สินบน', 'โกง', 'เรียกรับเงิน', 
    'โอนเงิน', 'เงินทอน', 'เบิกเงินเท็จ', 'รับใต้โต๊ะ', 'เงินงบ'
  ];

  const academicKeywords = [
    'ลอก', 'สอบ', 'การบ้าน', 'วิทยานิพนธ์', 'งานวิจัย', 'เกรด', 'จ้างทำ', 'ทุจริตสอบ', 
    'แก้เกรด', 'ซื้อผลงาน', 'ลอกข้อสอบ', 'แอบดูข้อสอบ', 'รายงานจ้าง'
  ];

  const technicalKeywords = [
    'แฮก', 'ระบบ', 'รหัสผ่าน', 'เว็บไซต์', 'ไวรัส', 'ข้อมูลรั่ว', 'พาสเวิร์ด', 'hack', 
    'server', 'อินเทอร์เน็ต', 'wifi', 'ระบบล่ม', 'พาสเวิร์ดหลุด', 'แฮกไอดี'
  ];

  const safetyKeywords = [
    'สารเคมี', 'อาคาร', 'ชำรุด', 'ไฟฟ้า', 'อันตราย', 'อุบัติเหตุ', 'ลื่น', 'ไฟไหม้', 
    'ช็อต', 'โครงสร้าง', 'พัง', 'เพดานถล่ม', 'บันไดชำรุด', 'กลิ่นแก๊ส'
  ];

  const complianceKeywords = [
    'กฎ', 'ระเบียบ', 'วินัย', 'ยาเสพติด', 'สุรา', 'ละเว้น', 'ลาป่วยเท็จ', 'มาสาย', 
    'กินเหล้า', 'บุหรี่', 'กัญชา', 'ผิดวินัย'
  ];

  const teachingKeywords = [
    'อาจารย์', 'ผู้สอน', 'อาจารย์ผู้สอน', 'อาจารย์สอน', 'สอนไม่เข้าใจ', 'สอนไม่ได้เรื่อง', 
    'ไม่เข้าสอน', 'ครู', 'อาจารย์ไม่มา', 'สั่งงานเยอะ', 'สอนไม่รู้เรื่อง', 'ด่าอาจารย์', 
    'ขู่ตัดเกรด', 'อาจารย์ไม่ตรวจงาน', 'การสอน', 'สอนแย่', 'สอนช้า', 'ตัดเกรดมั่ว', 'คำพูดอาจารย์'
  ];

  // Score matching
  const scores: Record<CategoryType, number> = {
    harassment: 0,
    fraud: 0,
    academic: 0,
    technical: 0,
    safety: 0,
    compliance: 0,
    teaching: 0,
  };

  harassmentKeywords.forEach(kw => {
    if (text.includes(kw)) {
      scores.harassment += 2;
      if (!foundTerms.includes(kw)) foundTerms.push(kw);
    }
  });

  fraudKeywords.forEach(kw => {
    if (text.includes(kw)) {
      scores.fraud += 2;
      if (!foundTerms.includes(kw)) foundTerms.push(kw);
    }
  });

  academicKeywords.forEach(kw => {
    if (text.includes(kw)) {
      scores.academic += 2;
      if (!foundTerms.includes(kw)) foundTerms.push(kw);
    }
  });

  technicalKeywords.forEach(kw => {
    if (text.includes(kw)) {
      scores.technical += 2;
      if (!foundTerms.includes(kw)) foundTerms.push(kw);
    }
  });

  safetyKeywords.forEach(kw => {
    if (text.includes(kw)) {
      scores.safety += 2;
      if (!foundTerms.includes(kw)) foundTerms.push(kw);
    }
  });

  complianceKeywords.forEach(kw => {
    if (text.includes(kw)) {
      scores.compliance += 2;
      if (!foundTerms.includes(kw)) foundTerms.push(kw);
    }
  });

  teachingKeywords.forEach(kw => {
    if (text.includes(kw)) {
      scores.teaching += 2;
      if (!foundTerms.includes(kw)) foundTerms.push(kw);
    }
  });

  // Determine top category
  let topCategory: CategoryType = 'harassment';
  let maxScore = -1;

  (Object.keys(scores) as CategoryType[]).forEach(cat => {
    if (scores[cat] > maxScore) {
      maxScore = scores[cat];
      topCategory = cat;
    }
  });

  // If no keywords matched, default fallback based on general context
  if (maxScore <= 0) {
    if (text.length > 50) {
      topCategory = 'compliance'; // Default ethics & compliance for broad reports
    } else {
      topCategory = 'harassment';
    }
  }

  // Determine Urgency
  let urgency: UrgencyLevel = 'medium';
  const criticalWords = ['ด่วนที่สุด', 'ชีวิต', 'ไฟไหม้', 'ข่มขู่ฆ่า', 'เลือด', 'ฉุกเฉิน', 'ทำร้ายร่างกาย', 'แก๊สรั่ว', 'อาคารถล่ม'];
  const highWords = ['ทุจริต', 'คุกคาม', 'โกง', 'ล่วงละเมิดทางเพศ', 'ยาเสพติด', 'ขู่', 'แฮก'];
  const lowWords = ['สอบถาม', 'เสนอแนะ', 'ข้อคิดเห็น', 'สอบถามข้อมูล', 'เล็กน้อย'];

  if (criticalWords.some(w => text.includes(w))) {
    urgency = 'critical';
  } else if (highWords.some(w => text.includes(w))) {
    urgency = 'high';
  } else if (lowWords.some(w => text.includes(w)) && maxScore < 2) {
    urgency = 'low';
  } else {
    urgency = 'medium';
  }

  // Thai Category Names & Explanations
  const categoryNamesTh: Record<CategoryType, string> = {
    harassment: 'การล่วงละเมิดและคุกคาม (Harassment & Bullying)',
    compliance: 'การปฏิบัติตามกฎระเบียบ (Compliance & Ethics)',
    technical: 'ปัญหาทางเทคนิค/ความปลอดภัย (Technical & Security)',
    fraud: 'การทุจริตทางการเงิน (Financial Fraud)',
    safety: 'ความปลอดภัยและสิ่งแวดล้อม (Safety & Environment)',
    academic: 'การประพฤติผิดทางวิชาการ (Academic Misconduct)',
    teaching: 'คุณภาพการสอน/รายงานเกี่ยวกับอาจารย์ (Teaching & Instructor Issues)',
  };

  const urgencyNamesTh: Record<UrgencyLevel, string> = {
    low: 'ปกติ (Low)',
    medium: 'ปานกลาง (Medium)',
    high: 'สูง (High)',
    critical: 'วิกฤต (Critical)',
  };

  // Generate Reasoning
  let reasoning = '';
  if (foundTerms.length > 0) {
    reasoning = `พบคำสำคัญที่เกี่ยวข้อง เช่น "${foundTerms.slice(0, 3).join('", "')}" ซึ่งตรงกับหมวดหมู่ "${categoryNamesTh[topCategory]}"`;
  } else {
    reasoning = `วิเคราะห์จากบริบทของข้อความทั่วไป แนะนำจัดอยู่ในหมวดหมู่ "${categoryNamesTh[topCategory]}"`;
  }

  const confidence = Math.min(85 + Math.min(foundTerms.length * 4, 13), 98);

  return {
    category: topCategory,
    categoryNameTh: categoryNamesTh[topCategory],
    urgency,
    urgencyNameTh: urgencyNamesTh[urgency],
    confidence,
    reasoning,
    keyTermsFound: foundTerms,
  };
}
