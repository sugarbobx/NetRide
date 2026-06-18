const router = require('express').Router();
const { z } = require('zod');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/authenticate');
const { requireRole } = require('../middleware/requirePermission');

const prisma = new PrismaClient();

// --- Feature 9: Static distance matrix (km) between Cameroon hubs ---
const DISTANCE_MATRIX = {
  'Douala-Yaoundé': 240, 'Douala-Bafoussam': 270, 'Douala-Bamenda': 360,
  'Douala-Buea': 75, 'Douala-Kribi': 150, 'Douala-Kumba': 100,
  'Yaoundé-Bafoussam': 340, 'Yaoundé-Bertoua': 350, 'Yaoundé-Ebolowa': 150,
  'Yaoundé-Ngaoundéré': 600, 'Yaoundé-Garoua': 900, 'Yaoundé-Maroua': 1100,
  'Bafoussam-Bamenda': 90, 'Bafoussam-Ngaoundéré': 450, 'Garoua-Maroua': 220,
};
const PRICE_PER_KM = 15; // XAF per km base rate

/**
 * Returns a { min, max, distance } price suggestion for a city pair, or null.
 */
function getPriceSuggestion(origin, destination) {
  const key = `${origin}-${destination}`;
  const rev = `${destination}-${origin}`;
  const distance = DISTANCE_MATRIX[key] || DISTANCE_MATRIX[rev];
  if (!distance) return null;
  return {
    min: Math.round((distance * PRICE_PER_KM * 0.8) / 100) * 100,
    max: Math.round((distance * PRICE_PER_KM * 1.4) / 100) * 100,
    suggested: Math.round((distance * PRICE_PER_KM) / 100) * 100,
    distance,
  };
}

const createRideSchema = z.object({
  originCity: z.string().min(2),
  originAddress: z.string().min(3),
  destinationCity: z.string().min(2),
  destinationAddress: z.string().min(3),
  departureAt: z.string().datetime(),
  seatsTotal: z.number().int().min(1).max(20),
  pricePerSeat: z.number().int().min(100),
  notes: z.string().optional(),
  waypoints: z.array(z.string()).optional(),
  acceptsColis: z.boolean().optional(),
  isRecurring: z.boolean().optional(),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
  pickupNote: z.string().optional(),
});

/**
 * GET /api/rides — public ride search
 * @query origin, destination, date, seats
 * Automatically filters out past departures (Feature 46).
 */
router.get('/', async (req, res, next) => {
  try {
    const { origin, destination, date, seats } = req.query;
    const where = {
      status: 'ACTIVE',
      seatsAvailable: { gte: seats ? parseInt(seats) : 1 },
      departureAt: { gt: new Date() }, // Feature 46: only future rides
    };

    if (origin) where.originCity = { contains: origin, mode: 'insensitive' };
    if (destination) where.destinationCity = { contains: destination, mode: 'insensitive' };
    if (date) {
      const day = new Date(date);
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);
      where.departureAt = { gte: day, lt: nextDay };
    }

    // Also match rides where destination is a waypoint (Feature 10)
    if (destination) {
      where.OR = [
        { destinationCity: { contains: destination, mode: 'insensitive' } },
        { waypoints: { has: destination } },
      ];
      delete where.destinationCity;
    }

    const rides = await prisma.ride.findMany({
      where,
      include: {
        driver: {
          select: { id: true, name: true, avatarUrl: true, ratingAvg: true, ratingCount: true, isVerified: true },
        },
      },
      orderBy: { departureAt: 'asc' },
      take: 50,
    });
    res.json(rides);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/rides/driver/mine — driver's own rides with bookings
 * @auth DRIVER | SUPER_ADMIN
 */
router.get('/driver/mine', authenticate, requireRole('DRIVER', 'SUPER_ADMIN'), async (req, res, next) => {
  try {
    const rides = await prisma.ride.findMany({
      where: { driverId: req.user.id },
      include: {
        bookings: {
          include: { passenger: { select: { id: true, name: true, avatarUrl: true, phone: true } } },
        },
      },
      orderBy: { departureAt: 'desc' },
    });
    res.json(rides);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/rides/driver/earnings — driver earnings summary (Feature 14)
 * @auth DRIVER | SUPER_ADMIN
 */
router.get('/driver/earnings', authenticate, requireRole('DRIVER', 'SUPER_ADMIN'), async (req, res, next) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: {
        ride: { driverId: req.user.id },
        status: { in: ['CONFIRMED', 'COMPLETED'] },
      },
      include: { ride: { select: { originCity: true, destinationCity: true, departureAt: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const total = bookings.reduce((s, b) => s + b.totalPrice, 0);
    const paid = bookings.filter((b) => b.paymentStatus === 'PAID').reduce((s, b) => s + b.totalPrice, 0);
    const pending = total - paid;

    // Group by month
    const byMonth = {};
    for (const b of bookings) {
      const key = new Date(b.createdAt).toISOString().slice(0, 7);
      byMonth[key] = (byMonth[key] || 0) + b.totalPrice;
    }

    res.json({ total, paid, pending, byMonth, recentBookings: bookings.slice(0, 10) });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/rides/price-suggestion — recommended price for a route (Feature 9)
 * @query origin, destination
 */
router.get('/price-suggestion', (req, res) => {
  const { origin, destination } = req.query;
  if (!origin || !destination) return res.status(400).json({ error: 'origin et destination requis' });
  const suggestion = getPriceSuggestion(origin, destination);
  if (!suggestion) return res.json({ suggestion: null });
  res.json({ suggestion });
});

/**
 * GET /api/rides/:id — single ride detail
 */
router.get('/:id', async (req, res, next) => {
  try {
    const ride = await prisma.ride.findUnique({
      where: { id: req.params.id },
      include: {
        driver: {
          select: { id: true, name: true, avatarUrl: true, ratingAvg: true, ratingCount: true, isVerified: true },
        },
        bookings: {
          include: { passenger: { select: { id: true, name: true, avatarUrl: true } } },
        },
      },
    });
    if (!ride) return res.status(404).json({ error: 'Trajet introuvable' });
    res.json(ride);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/rides — create a new ride (Feature 8, 10, 15, 16, 18)
 * @auth DRIVER | SUPER_ADMIN
 */
router.post('/', authenticate, requireRole('DRIVER', 'SUPER_ADMIN'), async (req, res, next) => {
  try {
    const result = createRideSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: result.error.errors });

    const data = result.data;
    const ride = await prisma.ride.create({
      data: {
        ...data,
        departureAt: new Date(data.departureAt),
        seatsAvailable: data.seatsTotal,
        driverId: req.user.id,
        waypoints: data.waypoints ?? [],
        daysOfWeek: data.daysOfWeek ?? [],
      },
    });
    res.status(201).json(ride);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/rides/:id/complete — mark ride as completed (Feature 20)
 * Unlocks the rating module and transitions escrow payments.
 * @auth the ride's driver only
 */
router.put('/:id/complete', authenticate, async (req, res, next) => {
  try {
    const ride = await prisma.ride.findUnique({ where: { id: req.params.id } });
    if (!ride) return res.status(404).json({ error: 'Trajet introuvable' });
    if (ride.driverId !== req.user.id) return res.status(403).json({ error: 'Non autorisé' });
    if (ride.status !== 'ACTIVE') return res.status(400).json({ error: 'Seul un trajet actif peut être marqué terminé' });

    // Complete the ride and all confirmed bookings atomically
    const [updatedRide] = await prisma.$transaction([
      prisma.ride.update({ where: { id: req.params.id }, data: { status: 'COMPLETED' } }),
      prisma.booking.updateMany({
        where: { rideId: req.params.id, status: 'CONFIRMED' },
        data: { status: 'COMPLETED' },
      }),
    ]);

    res.json(updatedRide);
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/rides/:id/cancel — driver cancels a ride (Feature 13)
 * Cascades cancellation to all pending/confirmed bookings (Feature 47).
 * @auth the ride's driver or admin
 */
router.patch('/:id/cancel', authenticate, async (req, res, next) => {
  try {
    const ride = await prisma.ride.findUnique({ where: { id: req.params.id } });
    if (!ride) return res.status(404).json({ error: 'Trajet introuvable' });
    if (ride.driverId !== req.user.id && req.user.role === 'DRIVER') {
      return res.status(403).json({ error: 'Non autorisé' });
    }
    if (ride.status !== 'ACTIVE') return res.status(400).json({ error: 'Trajet déjà annulé ou terminé' });

    // Cascade: cancel ride + restore seats + cancel all active bookings (Feature 47)
    const [updatedRide] = await prisma.$transaction([
      prisma.ride.update({ where: { id: req.params.id }, data: { status: 'CANCELLED' } }),
      prisma.booking.updateMany({
        where: { rideId: req.params.id, status: { in: ['PENDING', 'CONFIRMED'] } },
        data: { status: 'CANCELLED' },
      }),
    ]);

    const io = req.app.get('io');
    // Notify passengers whose bookings were cancelled
    const affectedBookings = await prisma.booking.findMany({
      where: { rideId: req.params.id, status: 'CANCELLED' },
      select: { passengerId: true },
    });
    const { notifyUser } = require('../services/socket.service');
    for (const b of affectedBookings) {
      notifyUser(io, b.passengerId, 'ride:cancelled', { rideId: req.params.id });
    }

    res.json(updatedRide);
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/rides/:id/seats — live seat count adjustment (Feature 17)
 * Prevents setting seats below the number already booked.
 * @auth the ride's driver only
 */
router.patch('/:id/seats', authenticate, async (req, res, next) => {
  try {
    const { seatsAvailable } = req.body;
    if (typeof seatsAvailable !== 'number' || seatsAvailable < 0) {
      return res.status(400).json({ error: 'Nombre de places invalide' });
    }

    const ride = await prisma.ride.findUnique({ where: { id: req.params.id } });
    if (!ride) return res.status(404).json({ error: 'Trajet introuvable' });
    if (ride.driverId !== req.user.id) return res.status(403).json({ error: 'Non autorisé' });

    const bookedSeats = ride.seatsTotal - ride.seatsAvailable;
    if (seatsAvailable < bookedSeats) {
      return res.status(400).json({
        error: `Impossible : ${bookedSeats} place(s) déjà réservée(s)`,
      });
    }

    const updated = await prisma.ride.update({
      where: { id: req.params.id },
      data: { seatsAvailable, seatsTotal: bookedSeats + seatsAvailable },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/rides/:id/manifest/download — export passenger manifest (Feature 19)
 * @auth the ride's driver only
 */
router.get('/:id/manifest/download', authenticate, async (req, res, next) => {
  try {
    const ride = await prisma.ride.findUnique({
      where: { id: req.params.id },
      include: {
        driver: { select: { name: true, phone: true } },
        bookings: {
          where: { status: { in: ['PENDING', 'CONFIRMED'] } },
          include: { passenger: { select: { name: true, phone: true } } },
        },
      },
    });
    if (!ride) return res.status(404).json({ error: 'Trajet introuvable' });
    if (ride.driverId !== req.user.id) return res.status(403).json({ error: 'Non autorisé' });

    const lines = [
      `MANIFESTE PASSAGERS — NetRide`,
      `Trajet : ${ride.originCity} → ${ride.destinationCity}`,
      `Départ : ${new Date(ride.departureAt).toLocaleString('fr-CM')}`,
      `Conducteur : ${ride.driver.name} (${ride.driver.phone})`,
      `---`,
      ...ride.bookings.map(
        (b, i) =>
          `${i + 1}. ${b.passenger.name} | ${b.passenger.phone} | ${b.seatsBooked} place(s) | ${b.paymentMethod} | ${b.status}`
      ),
      `---`,
      `Total passagers : ${ride.bookings.reduce((s, b) => s + b.seatsBooked, 0)}`,
      `Généré le : ${new Date().toLocaleString('fr-CM')}`,
    ];

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="manifeste-${ride.id.slice(0, 8)}.txt"`);
    res.send(lines.join('\n'));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
