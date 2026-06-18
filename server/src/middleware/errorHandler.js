/**
 * Global error handler middleware — normalizes all thrown errors into:
 * { success: false, error: { code, message, details } }
 *
 * Prisma P2002 unique constraint → 409 Conflict
 * Prisma P2025 not found        → 404 Not Found
 * All others                    → 500 Internal Error
 */
function errorHandler(err, _req, res, _next) {
  // Prisma unique constraint violation (phone already registered, etc.)
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_ENTRY',
        message: 'Cette entrée existe déjà.',
        details: err.meta?.target ?? [],
      },
    });
  }

  // Prisma record not found
  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Ressource introuvable.', details: [] },
    });
  }

  const status = err.status || err.statusCode || 500;
  return res.status(status).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'Erreur interne du serveur',
      details: err.details || [],
    },
  });
}

module.exports = { errorHandler };
