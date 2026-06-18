const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Accès refusé : rôle insuffisant' });
    }
    next();
  };
}

function requirePermission(permission) {
  return (req, res, next) => {
    const { role, permissions } = req.user;
    if (role === 'SUPER_ADMIN') return next();
    if (role === 'SUB_ADMIN' && permissions.includes(permission)) return next();
    return res.status(403).json({ error: `Permission requise : ${permission}` });
  };
}

async function auditLog(actorId, action, targetId = null, metadata = null) {
  try {
    await prisma.adminAudit.create({
      data: { actorId, action, targetId, metadata },
    });
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }
}

module.exports = { requireRole, requirePermission, auditLog };
