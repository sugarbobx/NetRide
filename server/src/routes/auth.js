const router = require('express').Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { z } = require('zod');
const { PrismaClient } = require('@prisma/client');
const { sendOtp, verifyOtp } = require('../services/otp.service');
const { authenticate } = require('../middleware/authenticate');

const prisma = new PrismaClient();

const REFRESH_COOKIE = 'netride_refresh';
const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'Strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

/**
 * Detects the Cameroonian mobile operator from the phone prefix.
 * Returns 'mtn', 'orange', or null.
 */
function detectOperator(phone) {
  const cleaned = phone.replace(/\s/g, '');
  const prefix = cleaned.slice(4, 6); // after +237
  if (['67', '68', '65'].includes(prefix)) return 'mtn';
  if (['69', '65'].includes(prefix)) return 'orange';
  if (['67', '68'].includes(prefix)) return 'mtn';
  if (['69'].includes(prefix)) return 'orange';
  // MTN: 650-654, 670-679, 680-689
  // Orange: 655-659, 690-699
  const num = parseInt(prefix);
  if ((num >= 67 && num <= 68) || (num >= 65 && num <= 54)) return 'mtn';
  if (num === 69 || (num >= 65 && num <= 59)) return 'orange';
  return null;
}

/**
 * Validate Cameroonian phone: +2376[5-9]XXXXXXX
 */
const phoneSchema = z
  .string()
  .regex(/^\+2376[5-9]\d{7}$/, 'Format invalide. Utilisez +237 6XX XXX XXX');

function issueTokens(user) {
  const accessToken = jwt.sign(
    { sub: user.id, role: user.role, permissions: user.permissions },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
  const refreshToken = jwt.sign(
    { sub: user.id, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh',
    { expiresIn: '7d' }
  );
  const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  return { accessToken, refreshToken, refreshTokenHash };
}

/**
 * POST /api/auth/send-otp
 * @param {string} phone - Cameroonian phone number (+237 6XX XXX XXX)
 * @returns {{ message, mock, operator }}
 */
router.post('/send-otp', async (req, res, next) => {
  try {
    const raw = (req.body.phone || '').replace(/\s/g, '');
    const result = phoneSchema.safeParse(raw);
    if (!result.success) return res.status(400).json({ error: result.error.errors[0].message });

    const operator = detectOperator(raw);
    const { mock } = await sendOtp(raw);
    res.json({ message: 'OTP envoyé', mock, operator });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/verify-otp
 * On first login (no existing user), requires `name` in body.
 * Issues short-lived accessToken + httpOnly refreshToken cookie.
 * @param {string} phone
 * @param {string} code
 * @param {string} [name] - required for first login
 */
router.post('/verify-otp', async (req, res, next) => {
  try {
    const { phone, code, name, role, vehicle } = req.body;
    if (!phone || !code) return res.status(400).json({ error: 'Champs requis manquants' });

    const cleanPhone = phone.replace(/\s/g, '');
    const valid = verifyOtp(cleanPhone, String(code));
    if (!valid) return res.status(401).json({ error: 'Code OTP incorrect ou expiré' });

    const allowedRoles = ['PASSENGER', 'DRIVER'];
    const chosenRole = allowedRoles.includes(role) ? role : 'PASSENGER';

    let user = await prisma.user.findUnique({ where: { phone: cleanPhone } });
    if (!user) {
      if (!name) return res.status(400).json({ error: 'Nom requis pour la première connexion', firstLogin: true });
      user = await prisma.user.create({
        data: {
          phone: cleanPhone,
          name,
          role: chosenRole,
          ...(vehicle ? {
            vehicleMake: vehicle.make || null,
            vehicleModel: vehicle.model || null,
            vehiclePlate: vehicle.plate || null,
          } : {}),
        },
      });
    }

    const { accessToken, refreshToken, refreshTokenHash } = issueTokens(user);
    await prisma.user.update({ where: { id: user.id }, data: { refreshTokenHash } });

    res.cookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTS);
    res.json({
      token: accessToken,
      user: { id: user.id, name: user.name, phone: user.phone, role: user.role, isVerified: user.isVerified, avatarUrl: user.avatarUrl },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/refresh
 * Silently rotate the access token using the httpOnly refresh cookie.
 * @returns {{ token }} new accessToken
 */
router.post('/refresh', async (req, res, next) => {
  try {
    const token = req.cookies[REFRESH_COOKIE];
    if (!token) return res.status(401).json({ error: 'Session expirée' });

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh');
    } catch {
      return res.status(401).json({ error: 'Token de rafraîchissement invalide' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await prisma.user.findFirst({ where: { id: payload.sub, refreshTokenHash: tokenHash } });
    if (!user) return res.status(401).json({ error: 'Session révoquée' });

    const { accessToken, refreshToken: newRefresh, refreshTokenHash } = issueTokens(user);
    await prisma.user.update({ where: { id: user.id }, data: { refreshTokenHash } });

    res.cookie(REFRESH_COOKIE, newRefresh, COOKIE_OPTS);
    res.json({ token: accessToken });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/logout
 * Clears the refresh token cookie and revokes the stored hash.
 */
router.post('/logout', authenticate, async (req, res, next) => {
  try {
    await prisma.user.update({ where: { id: req.user.id }, data: { refreshTokenHash: null } });
    res.clearCookie(REFRESH_COOKIE, COOKIE_OPTS);
    res.json({ message: 'Déconnecté avec succès' });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/auth/me
 * Returns the authenticated user's profile.
 */
router.get('/me', authenticate, (req, res) => {
  const { id, name, phone, email, role, permissions, isVerified, ratingAvg, avatarUrl } = req.user;
  res.json({ id, name, phone, email, role, permissions, isVerified, ratingAvg, avatarUrl });
});

module.exports = router;
