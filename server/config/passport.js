const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const prisma = require('./prisma');

// เฉพาะเมื่อมี env ครบเท่านั้น จึงลงทะเบียน Google (กัน error บน Render เมื่อลืมตั้งหรือชื่อตัวแปรผิด)
const hasGoogleEnv =
  process.env.GOOGLE_CLIENT_ID?.trim() &&
  process.env.GOOGLE_CLIENT_SECRET?.trim() &&
  process.env.GOOGLE_CALLBACK_URL?.trim();

if (hasGoogleEnv) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID.trim(),
        clientSecret: process.env.GOOGLE_CLIENT_SECRET.trim(),
        callbackURL: process.env.GOOGLE_CALLBACK_URL.trim(),
      },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error('Google account does not have an email address'), null);
        }

        // Find or create user
        let user = await prisma.user.findUnique({
          where: { email }
        });

        if (user) {
          // User exists, update picture if available AND not using a custom uploaded picture (Cloudinary)
          if (profile.photos && profile.photos[0]) {
            const googlePhotoUrl = profile.photos[0].value;
            // Don't overwrite if user has a custom picture on Cloudinary
            const isCloudinaryPicture = user.picture && user.picture.includes('cloudinary');

            if (!isCloudinaryPicture) {
              await prisma.user.update({
                where: { id: user.id },
                data: { picture: googlePhotoUrl },
              });
              user.picture = googlePhotoUrl;
            }
          }
          return done(null, user);
        } else {
          // Create new user
          user = await prisma.user.create({
            data: {
              email,
              name: profile.displayName || profile.name?.givenName || 'User',
              password: null, // No password for OAuth users
              role: 'user',
              enabled: true,
              picture: profile.photos && profile.photos[0] ? profile.photos[0].value : null,
            },
          });
          return done(null, user);
        }
      } catch (error) {
        return done(error, null);
      }
    }
  )
  );
} else if (process.env.NODE_ENV === 'production') {
  console.warn('Passport: GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_CALLBACK_URL ไม่ครบ หรือมีเว้นวรรคในชื่อตัวแปร — Google Login จะไม่ทำงาน');
}

// Facebook OAuth Strategy (ลงทะเบียนเมื่อมี env ครบ)
const hasFbEnv =
  process.env.FACEBOOK_APP_ID?.trim() &&
  process.env.FACEBOOK_APP_SECRET?.trim() &&
  process.env.FACEBOOK_CALLBACK_URL?.trim();

if (hasFbEnv) {
  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_APP_ID.trim(),
        clientSecret: process.env.FACEBOOK_APP_SECRET.trim(),
        callbackURL: process.env.FACEBOOK_CALLBACK_URL.trim(),
        profileFields: ['id', 'displayName', 'photos', 'email'],
      },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;

        if (!email) {
          return done(new Error('Facebook account does not have an email address'), null);
        }

        // Find or create user
        let user = await prisma.user.findUnique({
          where: { email },
        });

        if (user) {
          // User exists, update picture if available
          if (profile.photos && profile.photos[0]) {
            await prisma.user.update({
              where: { id: user.id },
              data: { picture: profile.photos[0].value },
            });
            user.picture = profile.photos[0].value;
          }
          return done(null, user);
        } else {
          // Create new user
          user = await prisma.user.create({
            data: {
              email,
              name: profile.displayName || 'User',
              password: null, // No password for OAuth users
              role: 'user',
              enabled: true,
              picture: profile.photos && profile.photos[0] ? profile.photos[0].value : null,
            },
          });
          return done(null, user);
        }
      } catch (error) {
        return done(error, null);
      }
    }
  )
  );
} else if (process.env.NODE_ENV === 'production') {
  console.warn('Passport: FACEBOOK_APP_ID / FACEBOOK_APP_SECRET / FACEBOOK_CALLBACK_URL ไม่ครบ — Facebook Login จะไม่ทำงาน');
}

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;

