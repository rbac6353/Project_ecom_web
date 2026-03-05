require('dotenv').config();
const express = require('express');
const http = require('http');
const app = express();
const server = http.createServer(app);
const { Server } = require('socket.io');
const morgan = require('morgan');
const { readdirSync } = require('fs');
const cors = require('cors');





// const authRoutes = require('./routes/auth'); 
// const categoryRoutes = require('./routes/category');

// middleware
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // สำหรับ parse FormData

// CORS configuration
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map(url => url.trim())
  : ['http://localhost:3001', 'http://localhost:3000', 'http://localhost:3002'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// เสิร์ฟไฟล์รูปภาพ
app.use('/uploads', express.static('uploads'));

// Webhook จาก SMS / Gateway แจ้งโอนเงิน (PromptPay)
// ใช้ Router แยกเพื่อให้ path /payments/webhook/sms ลงทะเบียนชัดเจน
const paymentController = require('./controllers/payment');
const paymentWebhookRouter = express.Router();
paymentWebhookRouter.post('/webhook/sms', (req, res, next) => paymentController.smsWebhook(req, res).catch(next));
app.use('/payments', paymentWebhookRouter);

// Mount auth routes separately at /api/auth
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Mount order & shipment routes (Logistics) - ลงทะเบียนชัดเจนเพื่อกัน 404
const orderRoutes = require('./routes/order');
const shipmentRoutes = require('./routes/shipment');
app.use('/api/orders', orderRoutes);
app.use('/api/shipments', shipmentRoutes);

// routes
// app.use('/api', authRoutes);
// app.use('/api', categoryRoutes);

readdirSync('./routes')
  .filter((c) => c !== 'auth.js' && c !== 'notification.js') // Skip auth.js and notification.js since we mount them separately
  .map((c) => {
    const routeFile = require(`./routes/${c}`);
    if (c === 'review.js' || c === 'review') {
      app.use('/api/review', routeFile);
    } else if (c === 'coupon.js' || c === 'coupon') {
      app.use('/api/coupon', routeFile);
    } else if (c === 'ai.js' || c === 'ai') {
      app.use('/api/ai', routeFile);
    } else if (c === 'order.js' || c === 'order') {
      // Already mounted above - skip to avoid duplicate
    } else if (c === 'shipment.js' || c === 'shipment') {
      // Already mounted above - skip to avoid duplicate
    } else {
      app.use('/api', routeFile);
    }
  });

// Mount notification routes at /api/notifications
const notificationRoutes = require('./routes/notification');
app.use('/api/notifications', notificationRoutes);

// Realtime: Socket.IO
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  // client informs which user room to join
  socket.on('join_user_room', (userId) => {
    if (!userId) return;
    socket.join(`user_${userId}`);
  });

  socket.on('disconnect', () => {
    // no-op
  });
});

// expose io to controllers
app.locals.io = io;


// Rooter
// app.post('/api', (req, res) => {

//     const { username, password } = req.body;
//     console.log(username, password);
//     res.send('Hello Nattawat');
// });





// ก่อน start: เพิ่มคอลัมน์ที่ขาดใน DB อัตโนมัติ (ข้ามถ้ามีอยู่แล้ว) — ไม่ต้องรัน node scripts/add-missing-columns.js ด้วยมือทุกครั้ง
const PORT = process.env.PORT || 3001;
const addMissingColumns = require('./scripts/add-missing-columns');

function startServer() {
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

addMissingColumns
  .run()
  .then(() => {
    startServer();
  })
  .catch((err) => {
    console.warn('[startup] ไม่สามารถเพิ่มคอลัมน์ที่ขาดได้ (ข้าม):', err.message);
    startServer();
  });