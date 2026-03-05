const multer = require('multer');
const path = require('path');
const fs = require('fs');

const baseDir = path.join(__dirname, '../uploads');

// รูปหลักฐานขอคืนสินค้า (ลูกค้า)
const returnProofDir = path.join(baseDir, 'return-proofs');
if (!fs.existsSync(returnProofDir)) fs.mkdirSync(returnProofDir, { recursive: true });

// สลิปโอนเงินคืน (ร้าน/แอดมิน)
const refundSlipDir = path.join(baseDir, 'refund-slips');
if (!fs.existsSync(refundSlipDir)) fs.mkdirSync(refundSlipDir, { recursive: true });

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('รองรับเฉพาะไฟล์รูปภาพ (JPEG, PNG, GIF, WebP)'), false);
};

const returnProofStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, returnProofDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `proof-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const refundSlipStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, refundSlipDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `refund-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const uploadReturnProof = multer({
  storage: returnProofStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 3 },
}).array('proof', 3);

const uploadRefundSlip = multer({
  storage: refundSlipStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
}).single('slip');

const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'ไฟล์ใหญ่เกินไป (จำกัด 5MB)' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ message: 'อัปโหลดได้ไม่เกิน 3 ไฟล์ (หลักฐาน) หรือ 1 ไฟล์ (สลิป)' });
    }
  }
  if (err.message && err.message.includes('รองรับเฉพาะ')) {
    return res.status(400).json({ message: err.message });
  }
  next(err);
};

module.exports = {
  uploadReturnProof,
  uploadRefundSlip,
  handleReturnUploadError: handleUploadError,
};
