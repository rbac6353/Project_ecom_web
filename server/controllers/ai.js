/**
 * AI Product Assistant — Controller
 * POST /api/ai/product-question/:id  Body: { question: string }  Return: { answer: string }
 */
const aiService = require('../services/aiService');

exports.postProductQuestion = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { question, provider } = req.body || {};

    if (!id || Number.isNaN(id)) {
      return res.status(400).json({ message: 'รหัสสินค้าไม่ถูกต้อง' });
    }
    if (!question || typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({ message: 'กรุณาส่ง question ใน body (string)' });
    }

    const answer = await aiService.askProductAI(id, question.trim(), {
      provider: typeof provider === 'string' ? provider : undefined,
    });
    return res.status(200).json({ answer });
  } catch (err) {
    if (err.message === 'ไม่พบสินค้าที่ระบุ') {
      return res.status(404).json({ message: err.message });
    }
    if (err.message && err.message.includes('GEMINI_API_KEY')) {
      return res.status(503).json({ message: 'ระบบ AI ยังไม่ได้ตั้งค่า API Key' });
    }
    if (err.status === 429 || err.isQuota || (err.message && err.message.includes('429'))) {
      return res.status(429).json({
        message: 'โควต้า AI เต็มหรือเกินกำหนด กรุณาลองใหม่ใน 1–2 นาที หรือตรวจสอบการใช้งานที่ Google AI Studio',
      });
    }
    const msg = (err.message || (typeof err.toString === 'function' ? err.toString() : String(err)) || '');
    const isModelUnavailable =
      err.status === 404 ||
      /not found|404|NOT_FOUND|not supported for generateContent/i.test(msg);
    if (isModelUnavailable) {
      console.error(
        '[AI] 503 โมเดลไม่รองรับ — ข้อความจาก Gemini:',
        msg.slice(0, 300)
      );
      return res.status(503).json({
        message: 'บริการ AI ขณะนี้ไม่พร้อม (โมเดลไม่รองรับ) กรุณาลองใหม่ภายหลังหรือตรวจสอบ GEMINI_API_KEY',
      });
    }
    console.error('AI product question error:', err);
    return res.status(500).json({
      message: 'เกิดข้อผิดพลาดในการประมวลผลคำถาม',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
};
