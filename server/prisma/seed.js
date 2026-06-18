const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const DRIVERS = [
  { phone: '+237677000001', name: 'Jean-Pierre Fotso', ratingAvg: 4.7, ratingCount: 23 },
  { phone: '+237699000010', name: 'Adjoua Bikié', ratingAvg: 4.5, ratingCount: 11 },
  { phone: '+237650000020', name: 'Emmanuel Mba', ratingAvg: 4.9, ratingCount: 38 },
  { phone: '+237680000030', name: 'Fabrice Ngono', ratingAvg: 4.2, ratingCount: 7 },
];

const PASSENGERS = [
  { phone: '+237699000001', name: 'Aminata Mbarga' },
  { phone: '+237678000002', name: 'Sylvie Nkeng' },
  { phone: '+237655000003', name: 'Paul Essama' },
  { phone: '+237690000004', name: 'Hortense Talla' },
];

const now = Date.now();
const h = (n) => new Date(now + n * 60 * 60 * 1000);

async function main() {
  // Super Admin
  const admin = await prisma.user.upsert({
    where: { phone: process.env.SEED_ADMIN_PHONE || '+237600000001' },
    create: {
      phone: process.env.SEED_ADMIN_PHONE || '+237600000001',
      name: process.env.SEED_ADMIN_NAME || 'Super Admin',
      role: 'SUPER_ADMIN',
      isVerified: true,
      permissions: ['MANAGE_USERS', 'VERIFY_DRIVERS', 'MANAGE_RIDES', 'VIEW_FINANCIALS', 'MANAGE_SUB_ADMINS'],
    },
    update: { role: 'SUPER_ADMIN', isVerified: true },
  });
  console.log(`Super Admin: ${admin.name} (${admin.phone})`);

  // Sub-admin
  await prisma.user.upsert({
    where: { phone: '+237600000002' },
    create: {
      phone: '+237600000002', name: 'Marianne Zoa', role: 'SUB_ADMIN', isVerified: true,
      permissions: ['MANAGE_USERS', 'VERIFY_DRIVERS', 'MANAGE_RIDES'],
    },
    update: {},
  });

  // Drivers
  const drivers = [];
  for (const d of DRIVERS) {
    const user = await prisma.user.upsert({
      where: { phone: d.phone },
      create: { ...d, role: 'DRIVER', isVerified: true },
      update: {},
    });
    drivers.push(user);
  }

  // Passengers
  const passengers = [];
  for (const p of PASSENGERS) {
    const user = await prisma.user.upsert({
      where: { phone: p.phone },
      create: { ...p, role: 'PASSENGER' },
      update: {},
    });
    passengers.push(user);
  }

  // GlobalConfig defaults
  const configs = [
    { key: 'platform_fee_percent', value: '5' },
    { key: 'max_seats_per_booking', value: '8' },
    { key: 'booking_cancellation_window_hours', value: '2' },
  ];
  for (const c of configs) {
    await prisma.globalConfig.upsert({ where: { key: c.key }, create: c, update: { value: c.value } });
  }

  // Rides
  const rideData = [
    {
      id: 'seed-ride-001', driverId: drivers[0].id,
      originCity: 'Douala', originAddress: 'Rond-Point Deido',
      destinationCity: 'Yaoundé', destinationAddress: 'Gare Mvan',
      departureAt: h(24), seatsTotal: 4, seatsAvailable: 2, pricePerSeat: 3500,
      waypoints: ['Edéa', 'Sakbayémé'], pickupNote: 'Rejoignez-moi au Rond-Point Deido à 6h00',
    },
    {
      id: 'seed-ride-002', driverId: drivers[1].id,
      originCity: 'Yaoundé', originAddress: 'Gare Centrale Mvan',
      destinationCity: 'Bafoussam', destinationAddress: 'Marché Central Bafoussam',
      departureAt: h(48), seatsTotal: 3, seatsAvailable: 3, pricePerSeat: 4500,
      waypoints: ['Boumnyébel', 'Bafia'],
    },
    {
      id: 'seed-ride-003', driverId: drivers[2].id,
      originCity: 'Douala', originAddress: 'Carrefour Bonabéri',
      destinationCity: 'Buea', destinationAddress: 'Buea Town',
      departureAt: h(10), seatsTotal: 5, seatsAvailable: 4, pricePerSeat: 1500,
    },
    {
      id: 'seed-ride-004', driverId: drivers[3].id,
      originCity: 'Yaoundé', originAddress: 'Carrefour Simbock',
      destinationCity: 'Ebolowa', destinationAddress: 'Centre-Ville Ebolowa',
      departureAt: h(36), seatsTotal: 4, seatsAvailable: 3, pricePerSeat: 2500,
    },
    {
      id: 'seed-ride-005', driverId: drivers[0].id,
      originCity: 'Bafoussam', originAddress: 'Marché A Bafoussam',
      destinationCity: 'Bamenda', destinationAddress: 'Commercial Avenue Bamenda',
      departureAt: h(72), seatsTotal: 4, seatsAvailable: 4, pricePerSeat: 2000,
      isRecurring: true, daysOfWeek: [1, 3, 5],
    },
    {
      id: 'seed-ride-006', driverId: drivers[2].id,
      originCity: 'Douala', originAddress: 'Bekoko Carrefour',
      destinationCity: 'Kumba', destinationAddress: 'Carrefour Kumba',
      departureAt: h(6), seatsTotal: 6, seatsAvailable: 5, pricePerSeat: 1800,
      acceptsColis: true, notes: 'Accepte petits colis jusqu\'à 10 kg',
    },
  ];

  for (const r of rideData) {
    await prisma.ride.upsert({ where: { id: r.id }, create: r, update: {} });
  }

  // Sample bookings
  const bookings = [
    {
      id: 'seed-booking-001', rideId: 'seed-ride-001', passengerId: passengers[0].id,
      seatsBooked: 2, totalPrice: 7000, status: 'CONFIRMED', paymentMethod: 'MTN_MOMO', paymentStatus: 'PAID',
    },
    {
      id: 'seed-booking-002', rideId: 'seed-ride-002', passengerId: passengers[1].id,
      seatsBooked: 1, totalPrice: 4500, status: 'PENDING', paymentMethod: 'ORANGE_MONEY', paymentStatus: 'PENDING',
    },
    {
      id: 'seed-booking-003', rideId: 'seed-ride-003', passengerId: passengers[2].id,
      seatsBooked: 1, totalPrice: 1500, status: 'CONFIRMED', paymentMethod: 'CASH', paymentStatus: 'PENDING',
    },
  ];

  for (const b of bookings) {
    await prisma.booking.upsert({ where: { id: b.id }, create: b, update: {} });
  }

  // Sample reviews (no composite unique on reviewer+ride, so guard manually)
  const existingReview = await prisma.review.findFirst({
    where: { reviewerId: passengers[0].id, rideId: 'seed-ride-001' },
  });
  if (!existingReview) {
    await prisma.review.create({
      data: {
        reviewerId: passengers[0].id, revieweeId: drivers[0].id, rideId: 'seed-ride-001',
        rating: 5, comment: 'Trajet très agréable, conducteur ponctuel et sympa !',
      },
    });
  }

  console.log('Seed complete — drivers, passengers, rides, bookings, reviews, config all populated.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
