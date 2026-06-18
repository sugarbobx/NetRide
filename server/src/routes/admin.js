const router = require('express').Router();
const { z } = require('zod');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/authenticate');
const { requireRole, requirePermission, auditLog } = require('../middleware/requirePermission');

const prisma = new PrismaClient();

// All admin routes require authentication + at least SUB_ADMIN role
router.use(authenticate, requireRole('SUPER_ADMIN', 'SUB_ADMIN'));

// GET /api/admin/stats
router.get('/stats', requirePermission('VIEW_FINANCIALS'), async (req, res) => {
  const [users, drivers, rides, bookings, revenue] = await Promise.all([
    prisma.user.count({ where: { role: 'PASSENGER' } }),
    prisma.user.count({ where: { role: 'DRIVER' } }),
    prisma.ride.count(),
    prisma.booking.count(),
    prisma.booking.aggregate({ where: { paymentStatus: 'PAID' }, _sum: { totalPrice: true } }),
  ]);
  res.json({ users, drivers, rides, bookings, revenue: revenue._sum.totalPrice ?? 0 });
});

// GET /api/admin/users
router.get('/users', requirePermission('MANAGE_USERS'), async (req, res) => {
  const { role, search, page = '1' } = req.query;
  const where = {};
  if (role) where.role = role;
  if (search) where.OR = [{ name: { contains: search, mode: 'insensitive' } }, { phone: { contains: search } }];

  const [users, total] = await Promise.all([
    prisma.user.findMany({ where, orderBy: { createdAt: 'desc' }, take: 20, skip: (parseInt(page) - 1) * 20 }),
    prisma.user.count({ where }),
  ]);
  res.json({ users, total });
});

// PATCH /api/admin/users/:id/verify — verify a driver
router.patch('/users/:id/verify', requirePermission('VERIFY_DRIVERS'), async (req, res) => {
  const user = await prisma.user.update({ where: { id: req.params.id }, data: { isVerified: true, role: 'DRIVER' } });
  await auditLog(req.user.id, 'VERIFY_DRIVER', req.params.id, { name: user.name });
  res.json(user);
});

// PATCH /api/admin/users/:id/ban
router.patch('/users/:id/ban', requirePermission('MANAGE_USERS'), async (req, res) => {
  const user = await prisma.user.update({ where: { id: req.params.id }, data: { isVerified: false } });
  await auditLog(req.user.id, 'BAN_USER', req.params.id, { name: user.name });
  res.json(user);
});

// GET /api/admin/rides
router.get('/rides', requirePermission('MANAGE_RIDES'), async (req, res) => {
  const { status, page = '1' } = req.query;
  const where = status ? { status } : {};
  const [rides, total] = await Promise.all([
    prisma.ride.findMany({
      where,
      include: { driver: { select: { id: true, name: true, phone: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
      skip: (parseInt(page) - 1) * 20,
    }),
    prisma.ride.count({ where }),
  ]);
  res.json({ rides, total });
});

// PATCH /api/admin/rides/:id/cancel
router.patch('/rides/:id/cancel', requirePermission('MANAGE_RIDES'), async (req, res) => {
  const ride = await prisma.ride.update({ where: { id: req.params.id }, data: { status: 'CANCELLED' } });
  await auditLog(req.user.id, 'CANCEL_RIDE', req.params.id);
  res.json(ride);
});

// GET /api/admin/financials
router.get('/financials', requirePermission('VIEW_FINANCIALS'), async (req, res) => {
  const bookings = await prisma.booking.findMany({
    where: { paymentStatus: 'PAID' },
    include: { ride: { select: { originCity: true, destinationCity: true } }, passenger: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  const total = bookings.reduce((sum, b) => sum + b.totalPrice, 0);
  res.json({ bookings, total, currency: 'XAF' });
});

// GET /api/admin/sub-admins
router.get('/sub-admins', requirePermission('MANAGE_SUB_ADMINS'), async (req, res) => {
  const subAdmins = await prisma.user.findMany({
    where: { role: 'SUB_ADMIN' },
    select: { id: true, name: true, phone: true, email: true, permissions: true, createdAt: true },
  });
  res.json(subAdmins);
});

const subAdminSchema = z.object({
  phone: z.string(),
  name: z.string().min(2),
  email: z.string().email().optional(),
  permissions: z.array(z.enum(['MANAGE_USERS', 'VERIFY_DRIVERS', 'MANAGE_RIDES', 'VIEW_FINANCIALS', 'MANAGE_SUB_ADMINS'])),
});

// POST /api/admin/sub-admins — SUPER_ADMIN only
router.post('/sub-admins', requireRole('SUPER_ADMIN'), async (req, res) => {
  const result = subAdminSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error.errors });

  const { phone, name, email, permissions } = result.data;
  const cleanPhone = phone.replace(/\s/g, '');
  const user = await prisma.user.upsert({
    where: { phone: cleanPhone },
    create: { phone: cleanPhone, name, email, role: 'SUB_ADMIN', permissions },
    update: { role: 'SUB_ADMIN', permissions, name, email },
  });
  await auditLog(req.user.id, 'CREATE_SUB_ADMIN', user.id, { name, permissions });
  res.status(201).json(user);
});

// PATCH /api/admin/sub-admins/:id/permissions
router.patch('/sub-admins/:id/permissions', requireRole('SUPER_ADMIN'), async (req, res) => {
  const { permissions } = req.body;
  const user = await prisma.user.update({ where: { id: req.params.id }, data: { permissions } });
  await auditLog(req.user.id, 'UPDATE_SUB_ADMIN_PERMISSIONS', req.params.id, { permissions });
  res.json(user);
});

// GET /api/admin/audit
router.get('/audit', requireRole('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { page = '1' } = req.query;
    const [logs, total] = await Promise.all([
      prisma.adminAudit.findMany({
        include: { actor: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: 'desc' },
        take: 30,
        skip: (parseInt(page) - 1) * 30,
      }),
      prisma.adminAudit.count(),
    ]);
    res.json({ logs, total });
  } catch (err) { next(err); }
});

/**
 * GET /api/admin/config — read all global config variables (Feature 43)
 * @auth SUPER_ADMIN
 */
router.get('/config', requireRole('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const configs = await prisma.globalConfig.findMany({ orderBy: { key: 'asc' } });
    res.json(configs);
  } catch (err) { next(err); }
});

/**
 * PUT /api/admin/config/:key — upsert a global config value (Feature 43)
 * @auth SUPER_ADMIN
 * @body { value: string }
 */
router.put('/config/:key', requireRole('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { value } = req.body;
    if (value === undefined) return res.status(400).json({ error: 'value requis' });

    const config = await prisma.globalConfig.upsert({
      where: { key: req.params.key },
      create: { key: req.params.key, value: String(value) },
      update: { value: String(value) },
    });
    await auditLog(req.user.id, 'UPDATE_CONFIG', req.params.key, { value });
    res.json(config);
  } catch (err) { next(err); }
});

module.exports = router;
