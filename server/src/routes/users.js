const router = require('express').Router();
const { z } = require('zod');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/authenticate');

const prisma = new PrismaClient();

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  bio: z.string().max(300).optional(),
  avatarUrl: z.string().url().optional(),
});

// GET /api/users/:id — public profile
router.get('/:id', async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: { id: true, name: true, avatarUrl: true, bio: true, ratingAvg: true, ratingCount: true, isVerified: true, role: true, createdAt: true },
  });
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
  res.json(user);
});

// PATCH /api/users/me
router.patch('/me', authenticate, async (req, res) => {
  const result = updateSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error.errors });

  const user = await prisma.user.update({ where: { id: req.user.id }, data: result.data });
  res.json({ id: user.id, name: user.name, email: user.email, bio: user.bio, avatarUrl: user.avatarUrl });
});

// POST /api/users/:id/reviews
router.post('/:id/reviews', authenticate, async (req, res) => {
  const { rideId, rating, comment } = req.body;
  if (!rideId || !rating) return res.status(400).json({ error: 'rideId et rating requis' });
  if (rating < 1 || rating > 5) return res.status(400).json({ error: 'Note entre 1 et 5' });

  const existing = await prisma.review.findFirst({ where: { reviewerId: req.user.id, revieweeId: req.params.id, rideId } });
  if (existing) return res.status(400).json({ error: 'Vous avez déjà noté cet utilisateur pour ce trajet' });

  const review = await prisma.review.create({
    data: { reviewerId: req.user.id, revieweeId: req.params.id, rideId, rating, comment },
  });

  // Update average rating
  const agg = await prisma.review.aggregate({ where: { revieweeId: req.params.id }, _avg: { rating: true }, _count: true });
  await prisma.user.update({
    where: { id: req.params.id },
    data: { ratingAvg: agg._avg.rating ?? 0, ratingCount: agg._count },
  });

  res.status(201).json(review);
});

// GET /api/users/:id/reviews
router.get('/:id/reviews', async (req, res) => {
  const reviews = await prisma.review.findMany({
    where: { revieweeId: req.params.id },
    include: { reviewer: { select: { id: true, name: true, avatarUrl: true } } },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  res.json(reviews);
});

module.exports = router;
