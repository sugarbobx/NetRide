import { db } from './mockDb';

const MOCK_OTP = '1234';

// ── Demo ride generator ───────────────────────────────────────────────────────
const NAMES = [
  'Hervé Nlend', 'Carine Tchoupo', 'Patrick Elong', 'Mireille Biya',
  'Rodrigue Essama', 'Christelle Ngo Bum', 'Brice Kamdem', 'Ornella Atangana',
  'Gilles Menye', 'Solange Mvondo', 'Alain Nkoa', 'Armelle Fouda',
  'Thierry Abena', 'Nadège Obam', 'Franck Owona', 'Stéphanie Ekani',
  'Boris Ndoumbe', 'Véronique Simo', 'Lionel Tagne', 'Sandrine Bebe',
];

const FEMALE_NAMES = ['Carine Tchoupo', 'Mireille Biya', 'Christelle Ngo Bum', 'Ornella Atangana', 'Solange Mvondo', 'Armelle Fouda', 'Nadège Obam', 'Stéphanie Ekani', 'Véronique Simo', 'Sandrine Bebe'];
const FEMALE_NAME_SET = new Set(FEMALE_NAMES);

// Approximate intercity distances in km
const CITY_DISTANCES = {
  'Douala-Yaoundé': 250, 'Yaoundé-Douala': 250,
  'Yaoundé-Bafoussam': 300, 'Bafoussam-Yaoundé': 300,
  'Douala-Bafoussam': 370, 'Bafoussam-Douala': 370,
  'Douala-Bamenda': 450, 'Bamenda-Douala': 450,
  'Yaoundé-Bamenda': 420, 'Bamenda-Yaoundé': 420,
  'Yaoundé-Garoua': 780, 'Garoua-Yaoundé': 780,
  'Douala-Kribi': 180, 'Kribi-Douala': 180,
  'Yaoundé-Kribi': 240, 'Kribi-Yaoundé': 240,
  'Douala-Buea': 80, 'Buea-Douala': 80,
  'Douala-Bertoua': 580, 'Bertoua-Douala': 580,
  'Yaoundé-Ngaoundéré': 440, 'Ngaoundéré-Yaoundé': 440,
  'Garoua-Maroua': 220, 'Maroua-Garoua': 220,
};

function cityDistance(from, to) {
  return CITY_DISTANCES[`${from}-${to}`] || 300;
}

function computeTrustScore(user) {
  if (!user) return 0;
  let score = 0;
  if (user.isVerified) score += 35;
  if (user.ratingCount > 0) {
    score += Math.round((user.ratingAvg / 5) * 35);
    score += Math.min(user.ratingCount, 20);
  }
  score += 10; // phone verified
  return Math.min(score, 100);
}

function computeCo2Saved(userId) {
  const userBookings = db.bookings.filter((b) => b.passengerId === userId && b.status !== 'CANCELLED');
  const allRides = db.rides;
  let totalKg = 0;
  userBookings.forEach((b) => {
    const ride = allRides.find((r) => r.id === b.rideId);
    if (ride) totalKg += cityDistance(ride.originCity, ride.destinationCity) * 0.12 * b.seatsBooked;
  });
  return Math.round(totalKg);
}

const SUBSCRIPTION_PLANS = {
  EXPLORATEUR: { name: 'Explorateur', price: 0, color: 'text-brand-muted', features: ['3 trajets/mois offerts', 'Accès à la recherche', 'Support standard'] },
  NAVETTEUR:   { name: 'Navetteur',   price: 4990, color: 'text-brand-cta', features: ['Trajets illimités', 'Priorité de réservation', 'Cashback 5%', 'Support prioritaire'] },
  PRO:         { name: 'Pro',         price: 9990, color: 'text-brand-warning', features: ['Tout Navetteur inclus', 'Mode Femme Vérifiée', 'Score de confiance boosté', 'Remise 10% partenaires', 'Support dédié 24/7'] },
};

const CITIES = [
  'Douala', 'Yaoundé', 'Bafoussam', 'Bamenda', 'Garoua',
  'Maroua', 'Ngaoundéré', 'Buea', 'Kumba', 'Bertoua', 'Ebolowa', 'Kribi',
];

const PICKUP_POINTS = {
  Douala:      ['Rond-Point Deido', 'Akwa Nord', 'Bonabéri Gare', 'Carrefour Ndokotti'],
  Yaoundé:     ['Gare Mvan', 'Carrefour Bastos', 'Nlongkak', 'Mvog-Ada'],
  Bafoussam:   ['Marché A', 'Carrefour Total', 'Tchiéré'],
  Bamenda:     ['Commercial Avenue', 'Food Market', 'Up Station'],
  Garoua:      ['Marché Central', 'Foulbé', 'Route de Maroua'],
  Maroua:      ['Grand Marché', 'Domayo', 'Kakataré'],
  Ngaoundéré: ['Gare Ferroviaire', 'Marché Central', 'Hôpital'],
  Buea:        ['Molyko', 'Small Soppo', 'Bonduma'],
  Kumba:       ['Marché Kumba', 'Fiango', 'Mbonge Road'],
  Bertoua:     ['Carrefour Haoussa', 'Lycée de Bertoua'],
  Ebolowa:     ['Carrefour Centre', 'Mvangan Road'],
  Kribi:       ['Plage de Kribi', 'Centre-ville', 'Port de Kribi'],
};

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

// Session-level cache so demo rides can be looked up by ID
const demoRideCache = new Map();

function makeDemoRide(i, origin, destination, params, prefix = 'demo') {
  const driverName = pick(NAMES);
  const driverId   = `demo-driver-${prefix}-${i}-${Date.now()}`;
  const seatsTotal     = rand(2, 6);
  const minSeats       = parseInt(params.seats) || 1;
  const seatsAvailable = Math.max(minSeats, rand(1, seatsTotal));

  let dep;
  if (params.date) {
    const day = new Date(params.date);
    dep = new Date(day.getTime() + rand(6, 20) * 60 * 60 * 1000);
  } else {
    dep = new Date(Date.now() + rand(6, 72) * 60 * 60 * 1000);
  }

  const rideObj = {
    id:                 `demo-${prefix}-${i}-${Date.now()}`,
    driverId,
    originCity:         origin,
    originAddress:      pick(PICKUP_POINTS[origin] || ['Centre-ville']),
    destinationCity:    destination,
    destinationAddress: pick(PICKUP_POINTS[destination] || ['Centre-ville']),
    departureAt:        dep.toISOString(),
    seatsTotal,
    seatsAvailable,
    pricePerSeat:       rand(1, 8) * 500 + 1500,
    status:             'ACTIVE',
    notes:              pick([null, null, 'Climatisation disponible.', 'Bagages limités.', 'Départ ponctuel garanti.', 'Pause à mi-chemin.']),
    createdAt:          new Date().toISOString(),
    updatedAt:          new Date().toISOString(),
    driver: {
      id:          driverId,
      name:        driverName,
      gender:      FEMALE_NAME_SET.has(driverName) ? 'F' : 'M',
      avatarUrl:   null,
      ratingAvg:   parseFloat((rand(38, 50) / 10).toFixed(1)),
      ratingCount: rand(3, 120),
      isVerified:  Math.random() > 0.3,
      role:        'DRIVER',
    },
  };
  demoRideCache.set(rideObj.id, rideObj);
  return rideObj;
}

function generateDemoRides(params = {}) {
  const origin      = params.origin      || pick(CITIES);
  const destination = params.destination || pick(CITIES.filter((c) => c !== origin));
  const count       = rand(5, 9);
  const rides       = [];

  for (let i = 0; i < count; i++) {
    if (params.date) {
      const day  = new Date(params.date);
      const next = new Date(day); next.setDate(next.getDate() + 1);
      const dep = new Date(day.getTime() + rand(6, 20) * 60 * 60 * 1000);
      if (dep >= next) continue;
    }

    const seatsTotal     = rand(2, 6);
    const minSeats       = parseInt(params.seats) || 1;
    const seatsAvailable = rand(1, seatsTotal);
    if (seatsAvailable < minSeats) continue;

    const driverName = pick(NAMES);
    const driverId   = `demo-driver-${i}-${Date.now()}`;
    let dep;
    if (params.date) {
      const day = new Date(params.date);
      dep = new Date(day.getTime() + rand(6, 20) * 60 * 60 * 1000);
    } else {
      dep = new Date(Date.now() + rand(6, 72) * 60 * 60 * 1000);
    }

    const rideObj = {
      id:                 `demo-${i}-${Date.now()}`,
      driverId,
      originCity:         origin,
      originAddress:      pick(PICKUP_POINTS[origin] || ['Centre-ville']),
      destinationCity:    destination,
      destinationAddress: pick(PICKUP_POINTS[destination] || ['Centre-ville']),
      departureAt:        dep.toISOString(),
      seatsTotal,
      seatsAvailable,
      pricePerSeat:       rand(1, 8) * 500 + 1500,
      status:             'ACTIVE',
      notes:              pick([null, null, 'Climatisation disponible.', 'Bagages limités.', 'Départ ponctuel garanti.', 'Pause à mi-chemin.']),
      createdAt:          new Date().toISOString(),
      updatedAt:          new Date().toISOString(),
      driver: {
        id:          driverId,
        name:        driverName,
        gender:      FEMALE_NAME_SET.has(driverName) ? 'F' : 'M',
        avatarUrl:   null,
        ratingAvg:   parseFloat((rand(38, 50) / 10).toFixed(1)),
        ratingCount: rand(3, 120),
        isVerified:  Math.random() > 0.3,
        role:        'DRIVER',
      },
    };
    demoRideCache.set(rideObj.id, rideObj);
    rides.push(rideObj);
  }

  // Guarantee at least 3 results even when date filter is strict
  while (rides.length < 3) {
    const rideObj = makeDemoRide(rides.length, origin, destination, params, 'fill');
    rides.push(rideObj);
  }

  return rides.sort((a, b) => new Date(a.departureAt) - new Date(b.departureAt));
}

let idCounter = 0;
function uuid() {
  return `mock-${Date.now()}-${++idCounter}`;
}

function ok(data) {
  return Promise.resolve({ data });
}

function fail(status, message, extra = {}) {
  const err = new Error(message);
  err.response = { status, data: { error: message, ...extra } };
  return Promise.reject(err);
}

function currentUser() {
  const token = localStorage.getItem('netride_token');
  if (!token) return null;
  return db.users.find((u) => u.id === token) ?? null;
}

function pub(u) {
  if (!u) return null;
  return { id: u.id, name: u.name, avatarUrl: u.avatarUrl, ratingAvg: u.ratingAvg, ratingCount: u.ratingCount, isVerified: u.isVerified, role: u.role };
}

function addAudit(actorId, action, targetId = null, metadata = null) {
  db.audits = [{ id: uuid(), actorId, action, targetId, metadata, createdAt: new Date().toISOString() }, ...db.audits];
}

// ── AUTH ──────────────────────────────────────────────────────────────────────
function handleAuth(method, parts, body) {
  const action = parts[0];

  if (method === 'POST' && action === 'send-otp') {
    return ok({ message: 'OTP envoyé', mock: true });
  }

  if (method === 'POST' && action === 'verify-otp') {
    const { phone, code, name, role, vehicle } = body;
    if (String(code) !== MOCK_OTP) return fail(401, 'Code OTP incorrect ou expiré');

    const cleanPhone = (phone ?? '').replace(/\s/g, '');
    let user = db.users.find((u) => u.phone === cleanPhone);

    if (!user) {
      if (!name) return fail(400, 'Nom requis pour la première connexion', { firstLogin: true });
      const allowedRoles = ['PASSENGER', 'DRIVER'];
      const chosenRole = allowedRoles.includes(role) ? role : 'PASSENGER';
      user = {
        id: uuid(), phone: cleanPhone, name, email: null, avatarUrl: null, bio: null,
        role: chosenRole, permissions: [], isVerified: false,
        ratingAvg: 0, ratingCount: 0,
        vehicleMake: vehicle?.make || null,
        vehicleModel: vehicle?.model || null,
        vehiclePlate: vehicle?.plate || null,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      };
      db.users = [...db.users, user];
    }

    // token = user ID in mock mode
    const token = user.id;
    return ok({ token, user: { id: user.id, name: user.name, phone: user.phone, role: user.role, permissions: user.permissions, isVerified: user.isVerified, avatarUrl: user.avatarUrl } });
  }

  if (method === 'GET' && action === 'me') {
    const user = currentUser();
    if (!user) return fail(401, 'Non authentifié');
    return ok({ id: user.id, name: user.name, phone: user.phone, email: user.email, role: user.role, permissions: user.permissions, isVerified: user.isVerified, ratingAvg: user.ratingAvg, avatarUrl: user.avatarUrl, bio: user.bio });
  }

  return fail(404, 'Auth route not found');
}

// ── RIDES ─────────────────────────────────────────────────────────────────────
function handleRides(method, parts, body, params, user) {
  // GET /rides/driver/mine
  if (method === 'GET' && parts[0] === 'driver' && parts[1] === 'mine') {
    if (!user) return fail(401, 'Non authentifié');
    const allBookings = db.bookings;
    const users = db.users;
    const rides = db.rides
      .filter((r) => r.driverId === user.id)
      .sort((a, b) => new Date(b.departureAt) - new Date(a.departureAt))
      .map((r) => ({
        ...r,
        bookings: allBookings
          .filter((b) => b.rideId === r.id)
          .map((b) => ({ ...b, passenger: pub(users.find((u) => u.id === b.passengerId)) })),
      }));
    return ok(rides);
  }

  // GET /rides/driver/earnings
  if (method === 'GET' && parts[0] === 'driver' && parts[1] === 'earnings') {
    if (!user) return fail(401, 'Non authentifié');
    const driverRideIds = new Set(db.rides.filter((r) => r.driverId === user.id).map((r) => r.id));
    const driverBookings = db.bookings.filter((b) => driverRideIds.has(b.rideId));
    const total   = driverBookings.reduce((s, b) => s + (b.totalPrice || 0), 0);
    const paid    = driverBookings.filter((b) => b.paymentStatus === 'PAID').reduce((s, b) => s + (b.totalPrice || 0), 0);
    const pending = driverBookings.filter((b) => b.paymentStatus !== 'PAID' && b.status !== 'CANCELLED').reduce((s, b) => s + (b.totalPrice || 0), 0);
    const byMonth = {};
    driverBookings.filter((b) => b.paymentStatus === 'PAID').forEach((b) => {
      const month = new Intl.DateTimeFormat('fr-CM', { year: 'numeric', month: 'long' }).format(new Date(b.createdAt));
      byMonth[month] = (byMonth[month] || 0) + (b.totalPrice || 0);
    });
    const allRides = db.rides;
    const recentBookings = [...driverBookings]
      .sort((a, bk) => new Date(bk.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map((b) => ({ ...b, ride: allRides.find((r) => r.id === b.rideId) }));
    return ok({ total, paid, pending, byMonth, recentBookings });
  }

  // GET /rides — search (always returns fresh random demo rides)
  if (method === 'GET' && parts.length === 0) {
    const demoRides = generateDemoRides(params);
    return ok(demoRides);
  }

  // GET /rides/:id/manifest/download
  if (method === 'GET' && parts[1] === 'manifest' && parts[2] === 'download') {
    const ride = db.rides.find((r) => r.id === parts[0]) ?? demoRideCache.get(parts[0]);
    if (!ride) return fail(404, 'Trajet introuvable');
    const bookings = db.bookings.filter((b) => b.rideId === ride.id);
    const users = db.users;
    const lines = [
      'MANIFESTE DE PASSAGERS — NetRide',
      `Trajet  : ${ride.originCity} → ${ride.destinationCity}`,
      `Départ  : ${new Date(ride.departureAt).toLocaleString('fr-CM')}`,
      `Places  : ${(ride.seatsTotal || 0) - (ride.seatsAvailable || 0)}/${ride.seatsTotal || 0} occupées`,
      '',
      bookings.length === 0
        ? '(Aucune réservation)'
        : bookings.map((b, i) => {
            const pax = users.find((u) => u.id === b.passengerId);
            return `${i + 1}. ${pax?.name ?? 'Inconnu'} — ${b.seatsBooked} place(s) — ${b.status}`;
          }).join('\n'),
    ];
    return Promise.resolve({ data: new Blob([lines.join('\n')], { type: 'text/plain' }) });
  }

  // GET /rides/:id — check db first, then demo cache
  if (method === 'GET' && parts.length === 1) {
    const rideId = parts[0];
    const dbRide = db.rides.find((r) => r.id === rideId);
    const ride = dbRide ?? demoRideCache.get(rideId);
    if (!ride) return fail(404, 'Trajet introuvable');
    const users = db.users;
    const dbDriver = pub(users.find((u) => u.id === ride.driverId));
    const driver = dbDriver ?? ride.driver ?? null;
    const bookings = db.bookings
      .filter((b) => b.rideId === ride.id)
      .map((b) => ({ ...b, passenger: pub(users.find((u) => u.id === b.passengerId)) }));
    return ok({ ...ride, driver, bookings });
  }

  // POST /rides
  if (method === 'POST' && parts.length === 0) {
    if (!user) return fail(401, 'Non authentifié');
    if (!['DRIVER', 'SUPER_ADMIN'].includes(user.role)) return fail(403, 'Accès refusé');
    const ride = {
      id: uuid(), driverId: user.id, ...body,
      seatsAvailable: parseInt(body.seatsTotal), status: 'ACTIVE',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    db.rides = [...db.rides, ride];
    return ok(ride);
  }

  // PATCH /rides/:id/complete
  if (method === 'PATCH' && parts[1] === 'complete') {
    if (!user) return fail(401, 'Non authentifié');
    const rides = db.rides;
    const idx = rides.findIndex((r) => r.id === parts[0]);
    if (idx === -1) return fail(404, 'Trajet introuvable');
    if (rides[idx].driverId !== user.id && !['SUPER_ADMIN', 'SUB_ADMIN'].includes(user.role)) return fail(403, 'Non autorisé');
    rides[idx] = { ...rides[idx], status: 'COMPLETED', updatedAt: new Date().toISOString() };
    db.rides = rides;
    return ok(rides[idx]);
  }

  // PATCH /rides/:id/cancel
  if (method === 'PATCH' && parts[1] === 'cancel') {
    if (!user) return fail(401, 'Non authentifié');
    const rides = db.rides;
    const idx = rides.findIndex((r) => r.id === parts[0]);
    if (idx === -1) return fail(404, 'Trajet introuvable');
    if (rides[idx].driverId !== user.id && !['SUPER_ADMIN', 'SUB_ADMIN'].includes(user.role)) return fail(403, 'Non autorisé');
    rides[idx] = { ...rides[idx], status: 'CANCELLED', updatedAt: new Date().toISOString() };
    db.rides = rides;
    return ok(rides[idx]);
  }

  return fail(404, 'Rides route not found');
}

// ── BOOKINGS ──────────────────────────────────────────────────────────────────
function handleBookings(method, parts, body, user) {
  // GET /bookings/mine
  if (method === 'GET' && parts[0] === 'mine') {
    if (!user) return fail(401, 'Non authentifié');
    const allRides = db.rides;
    const users = db.users;
    return ok(
      db.bookings
        .filter((b) => b.passengerId === user.id)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map((b) => {
          const ride = allRides.find((r) => r.id === b.rideId);
          if (!ride) return { ...b, ride: null };
          const driver = pub(users.find((u) => u.id === ride.driverId)) ?? ride.driver ?? null;
          return { ...b, ride: { ...ride, driver } };
        })
    );
  }

  // POST /bookings
  if (method === 'POST' && parts.length === 0) {
    if (!user) return fail(401, 'Non authentifié');
    let rides = db.rides;
    let ride = rides.find((r) => r.id === body.rideId);

    // Promote demo ride to persistent storage on first booking
    if (!ride && demoRideCache.has(body.rideId)) {
      const cached = { ...demoRideCache.get(body.rideId) };
      rides = [...rides, cached];
      db.rides = rides;
      ride = cached;
    }

    if (!ride || ride.status !== 'ACTIVE') return fail(400, 'Trajet indisponible');
    if (ride.seatsAvailable < body.seatsBooked) return fail(400, 'Places insuffisantes');
    if (ride.driverId === user.id) return fail(400, 'Vous ne pouvez pas réserver votre propre trajet');

    const booking = {
      id: uuid(), rideId: body.rideId, passengerId: user.id,
      seatsBooked: body.seatsBooked, totalPrice: ride.pricePerSeat * body.seatsBooked,
      status: 'PENDING', paymentMethod: body.paymentMethod || 'MTN_MOMO',
      paymentStatus: 'PENDING', paymentRef: null,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };

    const currentRides = db.rides;
    const rideIdx = currentRides.findIndex((r) => r.id === body.rideId);
    if (rideIdx !== -1) {
      currentRides[rideIdx] = { ...currentRides[rideIdx], seatsAvailable: currentRides[rideIdx].seatsAvailable - body.seatsBooked };
      db.rides = currentRides;
    }
    db.bookings = [...db.bookings, booking];

    const users = db.users;
    const driver = pub(users.find((u) => u.id === ride.driverId)) ?? ride.driver ?? null;
    return ok({ ...booking, ride: { ...ride, driver }, passenger: pub(user) });
  }

  // PATCH /bookings/:id/confirm
  if (method === 'PATCH' && parts[1] === 'confirm') {
    if (!user) return fail(401, 'Non authentifié');
    const bookings = db.bookings;
    const idx = bookings.findIndex((b) => b.id === parts[0]);
    if (idx === -1) return fail(404, 'Réservation introuvable');
    const ride = db.rides.find((r) => r.id === bookings[idx].rideId);
    if (ride?.driverId !== user.id) return fail(403, 'Non autorisé');
    bookings[idx] = { ...bookings[idx], status: 'CONFIRMED', updatedAt: new Date().toISOString() };
    db.bookings = bookings;
    return ok(bookings[idx]);
  }

  // PATCH /bookings/:id/cancel
  if (method === 'PATCH' && parts[1] === 'cancel') {
    if (!user) return fail(401, 'Non authentifié');
    const bookings = db.bookings;
    const idx = bookings.findIndex((b) => b.id === parts[0]);
    if (idx === -1) return fail(404, 'Réservation introuvable');
    const booking = bookings[idx];
    const rides = db.rides;
    const rideIdx = rides.findIndex((r) => r.id === booking.rideId);
    bookings[idx] = { ...booking, status: 'CANCELLED', updatedAt: new Date().toISOString() };
    if (rideIdx !== -1) rides[rideIdx] = { ...rides[rideIdx], seatsAvailable: rides[rideIdx].seatsAvailable + booking.seatsBooked };
    db.bookings = bookings;
    db.rides = rides;
    return ok({ message: 'Réservation annulée' });
  }

  return fail(404, 'Bookings route not found');
}

// ── PAYMENTS ──────────────────────────────────────────────────────────────────
function handlePayments(method, parts, body, user) {
  if (method === 'POST' && parts[0] === 'initiate') {
    if (!user) return fail(401, 'Non authentifié');
    const bookings = db.bookings;
    const idx = bookings.findIndex((b) => b.id === body.bookingId);
    if (idx === -1) return fail(404, 'Réservation introuvable');
    if (bookings[idx].paymentMethod === 'CASH') {
      bookings[idx] = { ...bookings[idx], paymentStatus: 'PENDING', status: 'CONFIRMED' };
      db.bookings = bookings;
      return ok({ mock: true, reference: 'CASH', status: 'CASH', message: 'Paiement en espèces à confirmer au départ', totalPrice: bookings[idx].totalPrice, currency: 'XAF' });
    }
    const ref = `MOCK-${Date.now()}`;
    bookings[idx] = { ...bookings[idx], paymentRef: ref };
    db.bookings = bookings;
    return ok({ mock: true, reference: ref, status: 'PENDING', message: 'Paiement en cours (mode simulation)', totalPrice: bookings[idx].totalPrice, currency: 'XAF' });
  }

  if (method === 'GET' && parts[0] === 'status') {
    const ref = parts[1];
    if (ref === 'CASH') return ok({ status: 'CASH', reference: ref });
    const bookings = db.bookings;
    const idx = bookings.findIndex((b) => b.paymentRef === ref);
    if (idx !== -1) {
      bookings[idx] = { ...bookings[idx], paymentStatus: 'PAID', status: 'CONFIRMED', updatedAt: new Date().toISOString() };
      db.bookings = bookings;
    }
    return ok({ status: 'SUCCESSFUL', reference: ref });
  }

  return fail(404, 'Payments route not found');
}

// ── USERS ─────────────────────────────────────────────────────────────────────
function handleUsers(method, parts, body, user) {
  const targetId = parts[0];
  const action = parts[1];

  if (targetId === 'me' && method === 'PATCH') {
    if (!user) return fail(401, 'Non authentifié');
    const users = db.users;
    const idx = users.findIndex((u) => u.id === user.id);
    users[idx] = { ...users[idx], ...body, updatedAt: new Date().toISOString() };
    db.users = users;
    return ok(users[idx]);
  }

  if (!action && method === 'GET') {
    const u = db.users.find((u) => u.id === targetId);
    if (!u) return fail(404, 'Utilisateur introuvable');
    return ok(pub(u));
  }

  if (action === 'reviews' && method === 'POST') {
    if (!user) return fail(401, 'Non authentifié');
    const { rideId, rating, comment } = body;
    const existing = db.reviews.find((r) => r.reviewerId === user.id && r.revieweeId === targetId && r.rideId === rideId);
    if (existing) return fail(400, 'Déjà noté pour ce trajet');
    const review = { id: uuid(), reviewerId: user.id, revieweeId: targetId, rideId, rating, comment, createdAt: new Date().toISOString() };
    db.reviews = [...db.reviews, review];
    const allReviews = db.reviews.filter((r) => r.revieweeId === targetId);
    const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
    const users = db.users;
    const idx = users.findIndex((u) => u.id === targetId);
    if (idx !== -1) { users[idx] = { ...users[idx], ratingAvg: avg, ratingCount: allReviews.length }; db.users = users; }
    return ok(review);
  }

  if (action === 'reviews' && method === 'GET') {
    const reviews = db.reviews.filter((r) => r.revieweeId === targetId);
    const users = db.users;
    return ok(reviews.map((r) => ({ ...r, reviewer: pub(users.find((u) => u.id === r.reviewerId)) })));
  }

  return fail(404, 'Users route not found');
}

// ── ADMIN ─────────────────────────────────────────────────────────────────────
function handleAdmin(method, parts, body, params, user) {
  if (!user || !['SUPER_ADMIN', 'SUB_ADMIN'].includes(user.role)) return fail(403, 'Accès refusé');

  const resource = parts[0];
  const hasFinancials = user.role === 'SUPER_ADMIN' || user.permissions?.includes('VIEW_FINANCIALS');

  if (resource === 'stats') {
    const users = db.users;
    const bookings = db.bookings;
    return ok({
      users: users.filter((u) => u.role === 'PASSENGER').length,
      drivers: users.filter((u) => u.role === 'DRIVER').length,
      rides: db.rides.length,
      bookings: bookings.length,
      revenue: hasFinancials ? bookings.filter((b) => b.paymentStatus === 'PAID').reduce((s, b) => s + b.totalPrice, 0) : null,
      hasFinancials,
    });
  }

  if (resource === 'recent-bookings') {
    if (!hasFinancials) return fail(403, 'Accès refusé');
    const allRides = db.rides;
    const users = db.users;
    const recent = db.bookings
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10)
      .map((b) => {
        const ride = allRides.find((r) => r.id === b.rideId);
        return { ...b, ride, passenger: pub(users.find((u) => u.id === b.passengerId)) };
      });
    return ok(recent);
  }

  if (resource === 'users') {
    if (method === 'GET' && !parts[1]) {
      let users = db.users;
      if (params.role) users = users.filter((u) => u.role === params.role);
      if (params.search) { const q = params.search.toLowerCase(); users = users.filter((u) => u.name.toLowerCase().includes(q) || u.phone.includes(q)); }
      return ok({ users, total: users.length });
    }
    if (method === 'PATCH' && parts[2] === 'verify') {
      const users = db.users;
      const idx = users.findIndex((u) => u.id === parts[1]);
      if (idx === -1) return fail(404, 'Utilisateur introuvable');
      users[idx] = { ...users[idx], isVerified: true, role: 'DRIVER' };
      db.users = users;
      addAudit(user.id, 'VERIFY_DRIVER', parts[1], { name: users[idx].name });
      return ok(users[idx]);
    }
    if (method === 'PATCH' && parts[2] === 'ban') {
      const users = db.users;
      const idx = users.findIndex((u) => u.id === parts[1]);
      if (idx === -1) return fail(404, 'Utilisateur introuvable');
      users[idx] = { ...users[idx], isVerified: false };
      db.users = users;
      addAudit(user.id, 'BAN_USER', parts[1], { name: users[idx].name });
      return ok(users[idx]);
    }
  }

  if (resource === 'rides') {
    if (method === 'GET' && !parts[1]) {
      let rides = db.rides;
      if (params.status) rides = rides.filter((r) => r.status === params.status);
      const users = db.users;
      return ok({ rides: rides.map((r) => ({ ...r, driver: pub(users.find((u) => u.id === r.driverId)) })), total: rides.length });
    }
    if (method === 'PATCH' && parts[2] === 'cancel') {
      const rides = db.rides;
      const idx = rides.findIndex((r) => r.id === parts[1]);
      if (idx === -1) return fail(404, 'Trajet introuvable');
      rides[idx] = { ...rides[idx], status: 'CANCELLED' };
      db.rides = rides;
      addAudit(user.id, 'CANCEL_RIDE', parts[1]);
      return ok(rides[idx]);
    }
  }

  if (resource === 'financials') {
    if (!hasFinancials) return fail(403, 'Accès refusé');
    const paid = db.bookings.filter((b) => b.paymentStatus === 'PAID');
    const allRides = db.rides;
    const users = db.users;
    return ok({
      bookings: paid.map((b) => ({ ...b, ride: allRides.find((r) => r.id === b.rideId), passenger: pub(users.find((u) => u.id === b.passengerId)) })),
      total: paid.reduce((s, b) => s + b.totalPrice, 0),
      currency: 'XAF',
    });
  }

  if (resource === 'sub-admins') {
    if (method === 'GET' && !parts[1]) {
      return ok(db.users.filter((u) => u.role === 'SUB_ADMIN').map((u) => ({ id: u.id, name: u.name, phone: u.phone, email: u.email, permissions: u.permissions, createdAt: u.createdAt })));
    }
    if (method === 'POST') {
      const { phone, name, email, permissions } = body;
      const cleanPhone = (phone ?? '').replace(/\s/g, '');
      const users = db.users;
      const existing = users.findIndex((u) => u.phone === cleanPhone);
      let sa;
      if (existing !== -1) {
        users[existing] = { ...users[existing], role: 'SUB_ADMIN', permissions, name, email: email || users[existing].email };
        sa = users[existing]; db.users = users;
      } else {
        sa = { id: uuid(), phone: cleanPhone, name, email: email || null, role: 'SUB_ADMIN', permissions, isVerified: true, ratingAvg: 0, ratingCount: 0, avatarUrl: null, bio: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        db.users = [...users, sa];
      }
      addAudit(user.id, 'CREATE_SUB_ADMIN', sa.id, { name, permissions });
      return ok(sa);
    }
    if (method === 'PATCH' && parts[2] === 'permissions') {
      const users = db.users;
      const idx = users.findIndex((u) => u.id === parts[1]);
      if (idx === -1) return fail(404, 'Utilisateur introuvable');
      users[idx] = { ...users[idx], permissions: body.permissions };
      db.users = users;
      addAudit(user.id, 'UPDATE_SUB_ADMIN_PERMISSIONS', parts[1], { permissions: body.permissions });
      return ok(users[idx]);
    }
  }

  if (resource === 'audit') {
    const page = parseInt(params.page || '1');
    const pageSize = 30;
    const audits = db.audits;
    const users = db.users;
    const paginated = audits.slice((page - 1) * pageSize, page * pageSize);
    return ok({ logs: paginated.map((a) => ({ ...a, actor: pub(users.find((u) => u.id === a.actorId)) })), total: audits.length });
  }

  return fail(404, 'Admin route not found');
}

// ── BUSES ─────────────────────────────────────────────────────────────────────
function handleBuses(method, parts, body, params) {
  if (method === 'GET' && parts.length === 0) {
    let routes = db.busRoutes;
    if (params.origin)      routes = routes.filter((r) => r.originCity === params.origin);
    if (params.destination) routes = routes.filter((r) => r.destinationCity === params.destination);
    if (params.date) {
      const day = new Date(params.date);
      const next = new Date(day); next.setDate(next.getDate() + 1);
      routes = routes.filter((r) => { const d = new Date(r.departureAt); return d >= day && d < next; });
    }
    return ok(routes);
  }
  return fail(404, 'Bus route not found');
}

// ── WALLET ────────────────────────────────────────────────────────────────────
function handleWallet(method, parts, body, user) {
  if (!user) return fail(401, 'Non authentifié');

  if (method === 'GET' && parts[0] === 'me') {
    const txs = db.walletTxs.filter((t) => t.userId === user.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const balance = db.users.find((u) => u.id === user.id)?.walletBalance ?? 0;
    return ok({ balance, transactions: txs });
  }

  if (method === 'POST' && parts[0] === 'topup') {
    const { amount, method: payMethod } = body;
    if (!amount || amount <= 0) return fail(400, 'Montant invalide');
    const tx = { id: uuid(), userId: user.id, type: 'CREDIT', amount, description: `Rechargement — ${payMethod || 'MTN MoMo'}`, ref: `TOP-${Date.now()}`, createdAt: new Date().toISOString() };
    db.walletTxs = [...db.walletTxs, tx];
    const users = db.users;
    const idx = users.findIndex((u) => u.id === user.id);
    const newBalance = (users[idx]?.walletBalance ?? 0) + amount;
    users[idx] = { ...users[idx], walletBalance: newBalance };
    db.users = users;
    return ok({ balance: newBalance, transaction: tx });
  }

  if (method === 'POST' && parts[0] === 'withdraw') {
    const { amount, method: payMethod } = body;
    const users = db.users;
    const idx = users.findIndex((u) => u.id === user.id);
    const balance = users[idx]?.walletBalance ?? 0;
    if (!amount || amount <= 0) return fail(400, 'Montant invalide');
    if (balance < amount) return fail(400, 'Solde insuffisant');
    const tx = { id: uuid(), userId: user.id, type: 'DEBIT', amount, description: `Retrait — ${payMethod || 'MTN MoMo'}`, ref: `WTH-${Date.now()}`, createdAt: new Date().toISOString() };
    db.walletTxs = [...db.walletTxs, tx];
    const newBalance = balance - amount;
    users[idx] = { ...users[idx], walletBalance: newBalance };
    db.users = users;
    return ok({ balance: newBalance, transaction: tx });
  }

  return fail(404, 'Wallet route not found');
}

// ── SUBSCRIPTION ──────────────────────────────────────────────────────────────
function handleSubscription(method, parts, body, user) {
  if (!user) return fail(401, 'Non authentifié');

  if (method === 'GET' && parts[0] === 'me') {
    const u = db.users.find((u) => u.id === user.id);
    const plan = u?.subscriptionPlan || 'EXPLORATEUR';
    return ok({ plan, details: SUBSCRIPTION_PLANS[plan] || SUBSCRIPTION_PLANS.EXPLORATEUR });
  }

  if (method === 'POST' && parts[0] === 'subscribe') {
    const { plan } = body;
    if (!SUBSCRIPTION_PLANS[plan]) return fail(400, 'Plan invalide');
    const users = db.users;
    const idx = users.findIndex((u) => u.id === user.id);
    users[idx] = { ...users[idx], subscriptionPlan: plan };
    db.users = users;
    if (plan !== 'EXPLORATEUR') {
      const price = SUBSCRIPTION_PLANS[plan].price;
      const tx = { id: uuid(), userId: user.id, type: 'DEBIT', amount: price, description: `Abonnement ${SUBSCRIPTION_PLANS[plan].name}`, ref: `SUB-${Date.now()}`, createdAt: new Date().toISOString() };
      db.walletTxs = [...db.walletTxs, tx];
    }
    return ok({ plan, details: SUBSCRIPTION_PLANS[plan] });
  }

  return fail(404, 'Subscription route not found');
}

// ── CORPORATE ─────────────────────────────────────────────────────────────────
function handleCorporate(method, parts, body, user) {
  if (!user) return fail(401, 'Non authentifié');

  if (method === 'GET' && parts[0] === 'me') {
    const company = db.companies.find((c) => c.adminId === user.id || c.employeeIds?.includes(user.id));
    if (!company) return ok(null);
    const users = db.users;
    return ok({ ...company, employees: company.employeeIds.map((id) => pub(users.find((u) => u.id === id))).filter(Boolean) });
  }

  if (method === 'POST' && parts.length === 0) {
    const { name, monthlyBudget } = body;
    if (!name) return fail(400, 'Nom requis');
    const existing = db.companies.find((c) => c.adminId === user.id);
    if (existing) return fail(400, 'Vous avez déjà une entreprise enregistrée');
    const company = { id: uuid(), name, adminId: user.id, plan: 'BUSINESS', monthlyBudget: monthlyBudget || 50000, employeeIds: [user.id], createdAt: new Date().toISOString() };
    db.companies = [...db.companies, company];
    return ok({ ...company, employees: [pub(user)] });
  }

  if (method === 'POST' && parts[0] === 'employees') {
    const company = db.companies.find((c) => c.adminId === user.id);
    if (!company) return fail(404, 'Entreprise introuvable ou accès refusé');
    const cleanPhone = (body.phone || '').replace(/\s/g, '');
    const employee = db.users.find((u) => u.phone === cleanPhone);
    if (!employee) return fail(404, 'Aucun compte avec ce numéro');
    if (company.employeeIds.includes(employee.id)) return fail(400, 'Cet utilisateur est déjà membre');
    const companies = db.companies;
    const idx = companies.findIndex((c) => c.id === company.id);
    companies[idx] = { ...companies[idx], employeeIds: [...companies[idx].employeeIds, employee.id] };
    db.companies = companies;
    const users = db.users;
    return ok({ ...companies[idx], employees: companies[idx].employeeIds.map((id) => pub(users.find((u) => u.id === id))).filter(Boolean) });
  }

  if (method === 'DELETE' && parts[0] === 'employees' && parts[1]) {
    const company = db.companies.find((c) => c.adminId === user.id);
    if (!company) return fail(403, 'Non autorisé');
    const companies = db.companies;
    const idx = companies.findIndex((c) => c.id === company.id);
    companies[idx] = { ...companies[idx], employeeIds: companies[idx].employeeIds.filter((id) => id !== parts[1]) };
    db.companies = companies;
    return ok({ message: 'Employé retiré' });
  }

  return fail(404, 'Corporate route not found');
}

// ── AI OPTIMIZER ──────────────────────────────────────────────────────────────
function handleAI(method, parts, params, user) {
  if (!user) return fail(401, 'Non authentifié');

  if (method === 'GET' && parts[0] === 'insights') {
    const hotRoutes = [
      { route: 'Douala → Yaoundé',   demand: 'HAUTE',   bookingsThisWeek: 45, avgPrice: 3500, suggestion: 'Augmentez votre prix de 10-15%' },
      { route: 'Douala → Kribi',     demand: 'HAUTE',   bookingsThisWeek: 32, avgPrice: 2500, suggestion: 'Heure de pointe: ven. 14h–18h' },
      { route: 'Yaoundé → Bafoussam',demand: 'MOYENNE', bookingsThisWeek: 18, avgPrice: 4000, suggestion: 'Prix optimal actuel' },
      { route: 'Bamenda → Douala',   demand: 'FAIBLE',  bookingsThisWeek: 8,  avgPrice: 5000, suggestion: 'Réduisez légèrement le prix' },
    ];
    const alerts = [
      { type: 'DEMAND', message: 'Forte demande Douala→Yaoundé ce weekend — 23 passagers sans trajet', severity: 'HIGH' },
      { type: 'PRICE',  message: 'Votre tarif Yaoundé→Bafoussam est 15% sous la moyenne du marché',   severity: 'MEDIUM' },
      { type: 'TIMING', message: 'Les départs à 7h ont 40% plus de réservations qu\'à 9h',            severity: 'LOW' },
    ];
    return ok({ hotRoutes, alerts, weeklyEarningsEstimate: 45000 });
  }

  if (method === 'GET' && parts[0] === 'price-suggestion') {
    const origin = params.origin || 'Douala';
    const destination = params.destination || 'Yaoundé';
    const dist = cityDistance(origin, destination);
    const base = Math.round(dist * 14 / 500) * 500;
    return ok({ suggestedPrice: base, marketMin: Math.round(base * 0.8 / 500) * 500, marketMax: Math.round(base * 1.3 / 500) * 500, confidence: 'HIGH' });
  }

  return fail(404, 'AI route not found');
}

// ── PROFILE ENRICHMENT ────────────────────────────────────────────────────────
function handleProfileEnrich(method, parts, body, user) {
  if (!user) return fail(401, 'Non authentifié');

  if (method === 'GET' && parts[0] === 'stats') {
    return ok({
      trustScore: computeTrustScore(user),
      co2Saved:   computeCo2Saved(user.id),
      totalRides: db.bookings.filter((b) => b.passengerId === user.id && b.status !== 'CANCELLED').length,
    });
  }

  if (method === 'PATCH' && parts[0] === 'emergency-contacts') {
    const { contacts } = body;
    const users = db.users;
    const idx = users.findIndex((u) => u.id === user.id);
    users[idx] = { ...users[idx], emergencyContacts: contacts || [] };
    db.users = users;
    return ok({ emergencyContacts: users[idx].emergencyContacts });
  }

  return fail(404, 'Profile enrichment route not found');
}

// ── ROUTER ────────────────────────────────────────────────────────────────────
function route(method, url, body = {}, params = {}) {
  // Strip leading /api/ or /
  const path = url.replace(/^\/api\//, '').replace(/^\//, '');
  const parts = path.split('/').filter(Boolean);
  const resource = parts[0];
  const rest = parts.slice(1);
  const user = currentUser();

  switch (resource) {
    case 'auth':         return handleAuth(method, rest, body);
    case 'rides':        return handleRides(method, rest, body, params, user);
    case 'bookings':     return handleBookings(method, rest, body, user);
    case 'payments':     return handlePayments(method, rest, body, user);
    case 'users':        return handleUsers(method, rest, body, user);
    case 'admin':        return handleAdmin(method, rest, body, params, user);
    case 'buses':        return handleBuses(method, rest, body, params);
    case 'wallet':       return handleWallet(method, rest, body, user);
    case 'subscription': return handleSubscription(method, rest, body, user);
    case 'corporate':    return handleCorporate(method, rest, body, user);
    case 'ai':           return handleAI(method, rest, params, user);
    case 'profile':      return handleProfileEnrich(method, rest, body, user);
    default:             return fail(404, `No mock handler for ${method} ${url}`);
  }
}

// Mirrors the axios instance interface used by components
const mockApi = {
  get:    (url, config = {})  => route('GET',    url, {},   config.params || {}),
  post:   (url, data = {})    => route('POST',   url, data, {}),
  patch:  (url, data = {})    => route('PATCH',  url, data, {}),
  put:    (url, data = {})    => route('PUT',    url, data, {}),
  delete: (url)               => route('DELETE', url, {},   {}),
  interceptors: { request: { use: () => {} }, response: { use: () => {} } },
};

export default mockApi;
