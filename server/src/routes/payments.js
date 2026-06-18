const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/authenticate');
const { initiatePayment, checkPaymentStatus } = require('../services/payment.service');

const prisma = new PrismaClient();

/**
 * POST /api/payments/initiate — initiate a MoMo/Orange Money USSD push (Feature 24)
 * @auth passenger who owns the booking
 */
router.post('/initiate', authenticate, async (req, res, next) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) return res.status(400).json({ error: 'bookingId requis' });

    const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { ride: true } });
    if (!booking) return res.status(404).json({ error: 'Réservation introuvable' });
    if (booking.passengerId !== req.user.id) return res.status(403).json({ error: 'Non autorisé' });
    if (booking.paymentStatus === 'PAID') return res.status(400).json({ error: 'Déjà payé' });

    // Cash bookings do not need a payment gateway
    if (booking.paymentMethod === 'CASH') {
      await prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'CONFIRMED', paymentStatus: 'PENDING' },
      });
      return res.json({ status: 'CASH', message: 'Réservation confirmée — paiement en espèces au départ' });
    }

    const result = await initiatePayment({
      phone: req.user.phone,
      amount: booking.totalPrice,
      description: `NetRide — ${booking.ride.originCity} → ${booking.ride.destinationCity}`,
      bookingId: booking.id,
    });

    await prisma.booking.update({ where: { id: bookingId }, data: { paymentRef: result.reference, paymentStatus: 'PENDING' } });

    res.json({ ...result, totalPrice: booking.totalPrice, currency: 'XAF' });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/payments/status/:ref — poll payment status
 * @auth passenger
 */
router.get('/status/:ref', authenticate, async (req, res, next) => {
  try {
    const data = await checkPaymentStatus(req.params.ref);

    if (data.status === 'SUCCESSFUL') {
      await prisma.booking.updateMany({
        where: { paymentRef: req.params.ref, passengerId: req.user.id },
        data: { paymentStatus: 'PAID', status: 'CONFIRMED' },
      });
    }
    res.json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/payments/webhook — Campay async webhook (Feature 5)
 * Unauthenticated — validated by IP allowlist or API-token header.
 * Wrapped in a Prisma $transaction to update BookingStatus + PaymentStatus atomically.
 */
router.post('/webhook', async (req, res, next) => {
  try {
    // Signature / IP verification (demo: check a shared secret header)
    const secret = req.headers['x-campay-secret'];
    if (process.env.CAMPAY_WEBHOOK_SECRET && secret !== process.env.CAMPAY_WEBHOOK_SECRET) {
      return res.status(401).json({ error: 'Unauthorized webhook' });
    }

    const { reference, status, external_reference: bookingId } = req.body;
    if (!reference || !status) return res.status(400).json({ error: 'Payload incomplet' });

    if (status === 'SUCCESSFUL') {
      await prisma.$transaction([
        prisma.booking.updateMany({
          where: { paymentRef: reference },
          data: { paymentStatus: 'PAID', status: 'CONFIRMED' },
        }),
      ]);
    } else if (status === 'FAILED') {
      await prisma.$transaction([
        prisma.booking.updateMany({
          where: { paymentRef: reference },
          data: { paymentStatus: 'FAILED' },
        }),
      ]);
    }

    res.json({ received: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
