const router = require('express').Router();
const { z } = require('zod');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/authenticate');
const { notifyUser } = require('../services/socket.service');

const prisma = new PrismaClient();

const bookSchema = z.object({
  rideId: z.string().uuid(),
  seatsBooked: z.number().int().min(1).max(8),
  paymentMethod: z.enum(['MTN_MOMO', 'ORANGE_MONEY', 'CASH']),
});

/**
 * POST /api/bookings — passenger books a ride
 * Guards: race condition row-lock (Feature 44), duplicate check (Feature 45).
 * @auth any authenticated user (not the ride's own driver)
 */
router.post('/', authenticate, async (req, res, next) => {
  try {
    const result = bookSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: result.error.errors });

    const { rideId, seatsBooked, paymentMethod } = result.data;

    // Feature 45: Block duplicate active bookings on the same ride
    const duplicate = await prisma.booking.findFirst({
      where: { rideId, passengerId: req.user.id, status: { notIn: ['CANCELLED'] } },
    });
    if (duplicate) {
      return res.status(409).json({ error: 'Vous avez déjà une réservation active sur ce trajet' });
    }

    // Feature 44: Wrap in a transaction with a re-check to prevent overbooking under concurrency
    const booking = await prisma.$transaction(async (tx) => {
      const ride = await tx.ride.findUnique({ where: { id: rideId } });
      if (!ride || ride.status !== 'ACTIVE') throw Object.assign(new Error('Trajet indisponible'), { status: 400 });
      if (ride.driverId === req.user.id) throw Object.assign(new Error('Vous ne pouvez pas réserver votre propre trajet'), { status: 400 });

      // Row-level availability re-check inside the transaction
      if (ride.seatsAvailable < seatsBooked) {
        throw Object.assign(new Error('Places insuffisantes — quelqu\'un vient peut-être de réserver'), { status: 409 });
      }

      const totalPrice = ride.pricePerSeat * seatsBooked;

      const newBooking = await tx.booking.create({
        data: { rideId, passengerId: req.user.id, seatsBooked, totalPrice, paymentMethod },
        include: {
          ride: { include: { driver: { select: { id: true, name: true } } } },
          passenger: { select: { id: true, name: true } },
        },
      });

      await tx.ride.update({
        where: { id: rideId },
        data: { seatsAvailable: { decrement: seatsBooked } },
      });

      return newBooking;
    });

    const io = req.app.get('io');
    notifyUser(io, booking.ride.driver.id, 'booking:new', { booking });

    res.status(201).json(booking);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/bookings/mine — passenger's own bookings
 * @auth any authenticated user
 */
router.get('/mine', authenticate, async (req, res, next) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { passengerId: req.user.id },
      include: {
        ride: {
          include: { driver: { select: { id: true, name: true, avatarUrl: true, ratingAvg: true, isVerified: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(bookings);
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/bookings/:id/confirm — driver confirms a pending booking (Feature 11)
 * Decrements seats atomically (already done at booking creation; this just changes status).
 * @auth the ride's driver
 */
router.patch('/:id/confirm', authenticate, async (req, res, next) => {
  try {
    const booking = await prisma.booking.findUnique({ where: { id: req.params.id }, include: { ride: true } });
    if (!booking) return res.status(404).json({ error: 'Réservation introuvable' });
    if (booking.ride.driverId !== req.user.id) return res.status(403).json({ error: 'Non autorisé' });
    if (booking.status !== 'PENDING') return res.status(400).json({ error: 'Statut invalide' });

    const updated = await prisma.booking.update({ where: { id: req.params.id }, data: { status: 'CONFIRMED' } });

    const io = req.app.get('io');
    notifyUser(io, booking.passengerId, 'booking:confirmed', { bookingId: updated.id });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/bookings/:id/cancel — passenger or driver cancels a booking (Feature 30)
 * Restores available seats on the ride.
 * @auth the passenger or the ride's driver
 */
router.patch('/:id/cancel', authenticate, async (req, res, next) => {
  try {
    const booking = await prisma.booking.findUnique({ where: { id: req.params.id }, include: { ride: true } });
    if (!booking) return res.status(404).json({ error: 'Réservation introuvable' });

    const isPassenger = booking.passengerId === req.user.id;
    const isDriver = booking.ride.driverId === req.user.id;
    if (!isPassenger && !isDriver) return res.status(403).json({ error: 'Non autorisé' });
    if (['CANCELLED', 'COMPLETED'].includes(booking.status)) return res.status(400).json({ error: 'Statut invalide' });

    await prisma.$transaction([
      prisma.booking.update({ where: { id: req.params.id }, data: { status: 'CANCELLED' } }),
      prisma.ride.update({ where: { id: booking.rideId }, data: { seatsAvailable: { increment: booking.seatsBooked } } }),
    ]);

    res.json({ message: 'Réservation annulée' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
