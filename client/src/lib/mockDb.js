// localStorage-backed database for mock/local mode

const SEED_USERS = [
  {
    id: 'user-super-admin',
    phone: '+237600000001',
    name: 'Super Admin',
    email: 'admin@netride.cm',
    role: 'SUPER_ADMIN',
    permissions: ['MANAGE_USERS', 'VERIFY_DRIVERS', 'MANAGE_RIDES', 'VIEW_FINANCIALS', 'MANAGE_SUB_ADMINS'],
    isVerified: true,
    ratingAvg: 5.0,
    ratingCount: 0,
    avatarUrl: null,
    bio: null,
    gender: 'M',
    co2Saved: 0,
    subscriptionPlan: null,
    walletBalance: 25000,
    emergencyContacts: [],
    trustScore: null,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'user-driver-1',
    phone: '+237677000001',
    name: 'Jean-Pierre Fotso',
    email: null,
    role: 'DRIVER',
    permissions: [],
    isVerified: true,
    ratingAvg: 4.7,
    ratingCount: 23,
    avatarUrl: null,
    bio: 'Conducteur professionnel depuis 5 ans. Douala-Yaoundé ma spécialité.',
    gender: 'M',
    co2Saved: 0,
    subscriptionPlan: 'NAVETTEUR',
    walletBalance: 8500,
    emergencyContacts: [],
    trustScore: null,
    createdAt: '2024-01-10T00:00:00.000Z',
    updatedAt: '2024-01-10T00:00:00.000Z',
  },
  {
    id: 'user-passenger-1',
    phone: '+237699000001',
    name: 'Aminata Mbarga',
    email: 'aminata@gmail.com',
    role: 'PASSENGER',
    permissions: [],
    isVerified: false,
    ratingAvg: 4.5,
    ratingCount: 3,
    avatarUrl: null,
    bio: null,
    gender: 'F',
    co2Saved: 0,
    subscriptionPlan: null,
    walletBalance: 3500,
    emergencyContacts: [{ name: 'Maman Mbarga', phone: '+237699000002' }],
    trustScore: null,
    createdAt: '2024-01-15T00:00:00.000Z',
    updatedAt: '2024-01-15T00:00:00.000Z',
  },
];

const SEED_RIDES = [
  {
    id: 'ride-001',
    driverId: 'user-driver-1',
    originCity: 'Douala',
    originAddress: 'Rond-Point Deido',
    destinationCity: 'Yaoundé',
    destinationAddress: 'Gare Mvan',
    departureAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    seatsTotal: 4,
    seatsAvailable: 3,
    pricePerSeat: 3500,
    status: 'ACTIVE',
    notes: 'Climatisation disponible. Départ ponctuel.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ride-002',
    driverId: 'user-driver-1',
    originCity: 'Yaoundé',
    originAddress: 'Gare Mvan',
    destinationCity: 'Bafoussam',
    destinationAddress: 'Marché A',
    departureAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    seatsTotal: 3,
    seatsAvailable: 2,
    pricePerSeat: 4000,
    status: 'ACTIVE',
    notes: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ride-003',
    driverId: 'user-driver-1',
    originCity: 'Douala',
    originAddress: 'Akwa Nord',
    destinationCity: 'Kribi',
    destinationAddress: 'Centre-ville Kribi',
    departureAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    seatsTotal: 5,
    seatsAvailable: 4,
    pricePerSeat: 2500,
    status: 'ACTIVE',
    notes: 'Pause prévue à Edéa.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ride-004',
    driverId: 'user-driver-1',
    originCity: 'Bamenda',
    originAddress: 'Commercial Avenue',
    destinationCity: 'Douala',
    destinationAddress: 'Gare Voyageurs Bonabéri',
    departureAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    seatsTotal: 4,
    seatsAvailable: 4,
    pricePerSeat: 5000,
    status: 'ACTIVE',
    notes: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const SEED_BUS_ROUTES = [
  { id: 'bus-001', company: 'Général Express', originCity: 'Douala', destinationCity: 'Yaoundé', departureAt: new Date(Date.now() + 4 * 3600000).toISOString(), arrivalAt: new Date(Date.now() + 9 * 3600000).toISOString(), pricePerSeat: 3000, seatsAvailable: 24, seatsTotal: 70, busType: 'VIP', amenities: ['Climatisation', 'WiFi', 'Prise USB'], pickupPoint: 'Gare Bonabéri', dropoffPoint: 'Gare Mvan', status: 'ACTIVE' },
  { id: 'bus-002', company: 'Buca Voyages', originCity: 'Douala', destinationCity: 'Yaoundé', departureAt: new Date(Date.now() + 7 * 3600000).toISOString(), arrivalAt: new Date(Date.now() + 12 * 3600000).toISOString(), pricePerSeat: 2500, seatsAvailable: 8, seatsTotal: 50, busType: 'STANDARD', amenities: ['Climatisation'], pickupPoint: 'Carrefour Ndokotti', dropoffPoint: 'Gare Mvan', status: 'ACTIVE' },
  { id: 'bus-003', company: 'Vatican Express', originCity: 'Yaoundé', destinationCity: 'Bafoussam', departureAt: new Date(Date.now() + 5 * 3600000).toISOString(), arrivalAt: new Date(Date.now() + 9 * 3600000).toISOString(), pricePerSeat: 2000, seatsAvailable: 15, seatsTotal: 45, busType: 'STANDARD', amenities: ['Climatisation'], pickupPoint: 'Gare Mvan', dropoffPoint: 'Marché A', status: 'ACTIVE' },
  { id: 'bus-004', company: 'Général Express', originCity: 'Douala', destinationCity: 'Bafoussam', departureAt: new Date(Date.now() + 8 * 3600000).toISOString(), arrivalAt: new Date(Date.now() + 16 * 3600000).toISOString(), pricePerSeat: 4000, seatsAvailable: 30, seatsTotal: 70, busType: 'VIP', amenities: ['Climatisation', 'WiFi', 'Prise USB'], pickupPoint: 'Gare Bonabéri', dropoffPoint: 'Marché A', status: 'ACTIVE' },
  { id: 'bus-005', company: 'Touristique Express', originCity: 'Yaoundé', destinationCity: 'Douala', departureAt: new Date(Date.now() + 3 * 3600000).toISOString(), arrivalAt: new Date(Date.now() + 8 * 3600000).toISOString(), pricePerSeat: 3500, seatsAvailable: 5, seatsTotal: 60, busType: 'VIP', amenities: ['Climatisation', 'WiFi'], pickupPoint: 'Gare Mvan', dropoffPoint: 'Gare Bonabéri', status: 'ACTIVE' },
  { id: 'bus-006', company: 'Buca Voyages', originCity: 'Bamenda', destinationCity: 'Douala', departureAt: new Date(Date.now() + 6 * 3600000).toISOString(), arrivalAt: new Date(Date.now() + 14 * 3600000).toISOString(), pricePerSeat: 4500, seatsAvailable: 12, seatsTotal: 50, busType: 'STANDARD', amenities: ['Climatisation'], pickupPoint: 'Food Market', dropoffPoint: 'Gare Bonabéri', status: 'ACTIVE' },
];

const SEED_WALLET_TXS = [
  { id: 'wtx-001', userId: 'user-driver-1', type: 'CREDIT', amount: 3500, description: 'Paiement reçu — Douala → Yaoundé', ref: 'PAY-001', createdAt: new Date(Date.now() - 3 * 86400000).toISOString() },
  { id: 'wtx-002', userId: 'user-driver-1', type: 'CREDIT', amount: 5000, description: 'Paiement reçu — Yaoundé → Bafoussam', ref: 'PAY-002', createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 'wtx-003', userId: 'user-passenger-1', type: 'DEBIT', amount: 3500, description: 'Réservation — Douala → Yaoundé', ref: 'BK-001', createdAt: new Date(Date.now() - 5 * 86400000).toISOString() },
  { id: 'wtx-004', userId: 'user-passenger-1', type: 'CASHBACK', amount: 500, description: 'Cashback fidélité — 10e réservation', ref: 'CB-001', createdAt: new Date(Date.now() - 86400000).toISOString() },
];

const SEED_COMPANIES = [
  { id: 'corp-001', name: 'MTN Cameroun', adminId: 'user-super-admin', plan: 'ENTERPRISE', monthlyBudget: 150000, employeeIds: ['user-driver-1', 'user-passenger-1'], createdAt: '2024-03-01T00:00:00.000Z' },
];

function read(key, seed) {
  try {
    const raw = localStorage.getItem(`nr_${key}`);
    if (!raw) { localStorage.setItem(`nr_${key}`, JSON.stringify(seed)); return seed; }
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem(`nr_${key}`);
    localStorage.setItem(`nr_${key}`, JSON.stringify(seed));
    return seed;
  }
}

function write(key, data) {
  localStorage.setItem(`nr_${key}`, JSON.stringify(data));
}

export const db = {
  get users()      { return read('users', SEED_USERS); },
  set users(v)     { write('users', v); },
  get rides()      { return read('rides', SEED_RIDES); },
  set rides(v)     { write('rides', v); },
  get bookings()   { return read('bookings', []); },
  set bookings(v)  { write('bookings', v); },
  get reviews()    { return read('reviews', []); },
  set reviews(v)   { write('reviews', v); },
  get audits()     { return read('audits', []); },
  set audits(v)    { write('audits', v); },
  get busRoutes()  { return read('busRoutes', SEED_BUS_ROUTES); },
  set busRoutes(v) { write('busRoutes', v); },
  get walletTxs()  { return read('walletTxs', SEED_WALLET_TXS); },
  set walletTxs(v) { write('walletTxs', v); },
  get companies()  { return read('companies', SEED_COMPANIES); },
  set companies(v) { write('companies', v); },
};

export function resetDb() {
  ['users', 'rides', 'bookings', 'reviews', 'audits', 'busRoutes', 'walletTxs', 'companies'].forEach((k) => localStorage.removeItem(`nr_${k}`));
  localStorage.removeItem('netride_token');
  window.location.reload();
}

// Expose reset to browser console for testing
if (typeof window !== 'undefined') window.__netride_reset = resetDb;
