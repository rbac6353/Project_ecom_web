const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const session = require('express-session');

const { register, login, currentUser, oauthCallback } = require('../controllers/auth');

// Session middleware for OAuth
router.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true in production with HTTPS
}));

// Initialize passport
router.use(passport.initialize());
router.use(passport.session());

// Traditional auth routes
router.post('/register', register);     
router.post('/login', login);
router.post('/current-user', currentUser);
router.post('/current-admin', currentUser);
router.get('/me', currentUser);

// ใช้ OAuth ได้เมื่อมี env ครบ (ถ้าไม่มี จะ redirect กลับพร้อม error เพื่อไม่ให้ Passport ฟ้อง Unknown strategy)
const hasGoogleEnv = process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim() && process.env.GOOGLE_CALLBACK_URL?.trim();
const hasFbEnv = process.env.FACEBOOK_APP_ID?.trim() && process.env.FACEBOOK_APP_SECRET?.trim() && process.env.FACEBOOK_CALLBACK_URL?.trim();

// Google OAuth routes
router.get('/google', (req, res, next) => {
  if (!hasGoogleEnv) return res.redirect(`${process.env.CLIENT_URL || '/'}/login?error=google_not_configured`);
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});
router.get('/google/callback',
  (req, res, next) => {
    if (!hasGoogleEnv) return res.redirect(`${process.env.CLIENT_URL || '/'}/login?error=google_not_configured`);
    passport.authenticate('google', { session: false, failureRedirect: '/login?error=google_failed' })(req, res, next);
  },
  oauthCallback
);

// Facebook OAuth routes
router.get('/facebook', (req, res, next) => {
  if (!hasFbEnv) return res.redirect(`${process.env.CLIENT_URL || '/'}/login?error=facebook_not_configured`);
  passport.authenticate('facebook', { scope: ['email'] })(req, res, next);
});
router.get('/facebook/callback',
  (req, res, next) => {
    if (!hasFbEnv) return res.redirect(`${process.env.CLIENT_URL || '/'}/login?error=facebook_not_configured`);
    passport.authenticate('facebook', { session: false, failureRedirect: '/login?error=facebook_failed' })(req, res, next);
  },
  oauthCallback
);

module.exports = router;
