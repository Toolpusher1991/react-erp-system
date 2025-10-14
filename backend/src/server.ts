// src/server.ts - VOLLSTÄNDIGE VERSION
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ==========================================
// MIDDLEWARE
// ==========================================
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logging
app.use((req, res, next) => {
  const timestamp = new Date().toLocaleTimeString('de-DE');
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// ==========================================
// MOCK DATA (Temporär - später aus DB)
// ==========================================
const MOCK_USERS = [
  {
    id: 1,
    name: 'Max Admin',
    email: 'admin@erp.de',
    password: 'admin123',
    role: 'Admin',
    status: 'Aktiv',
    assignedAssets: [],
  },
  {
    id: 2,
    name: 'Anna E-Super',
    email: 'esuper@erp.de',
    password: 'es123',
    role: 'E-Supervisor',
    status: 'Aktiv',
    assignedAssets: [],
  },
  {
    id: 3,
    name: 'Tom M-Super',
    email: 'msuper@erp.de',
    password: 'ms123',
    role: 'M-Supervisor',
    status: 'Aktiv',
    assignedAssets: [],
  },
  {
    id: 10,
    name: 'T207 Elektriker',
    email: 't207-el',
    password: 't207',
    role: 'Elektriker',
    status: 'Aktiv',
    assignedAssets: [1],
  },
  {
    id: 11,
    name: 'T207 Mechaniker',
    email: 't207-mech',
    password: 't207',
    role: 'Mechaniker',
    status: 'Aktiv',
    assignedAssets: [1],
  },
];

// ==========================================
// ROUTES
// ==========================================

// Root Endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'MaintAIn Backend API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      root: '/',
      health: '/api/health',
      auth: {
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me',
      },
      users: 'GET /api/users',
    },
  });
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ==========================================
// AUTH ROUTES
// ==========================================

// POST /api/auth/login
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;

    // Validierung
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email und Passwort erforderlich',
      });
    }

    // User finden
    const user = MOCK_USERS.find(
      (u) => u.email === email && u.password === password
    );

    if (!user) {
      return res.status(401).json({
        error: 'Falsche Email oder Passwort',
      });
    }

    // User ohne Passwort zurückgeben
    const { password: _, ...userWithoutPassword } = user;

    console.log(`✅ Login successful: ${user.name} (${user.role})`);

    res.json({
      user: userWithoutPassword,
      message: 'Login erfolgreich',
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

// GET /api/auth/me (für später mit JWT)
app.get('/api/auth/me', (req, res) => {
  res.status(501).json({
    error: 'Not implemented yet',
    message: 'JWT Authentication coming soon',
  });
});

// ==========================================
// USER ROUTES
// ==========================================

// GET /api/users (alle User ohne Passwörter)
app.get('/api/users', (req, res) => {
  const usersWithoutPasswords = MOCK_USERS.map(({ password, ...user }) => user);
  res.json({
    users: usersWithoutPasswords,
    count: usersWithoutPasswords.length,
  });
});

// GET /api/users/:id
app.get('/api/users/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  const user = MOCK_USERS.find((u) => u.id === userId);

  if (!user) {
    return res.status(404).json({ error: 'User nicht gefunden' });
  }

  const { password: _, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

// ==========================================
// WORK ORDER ROUTES
// ==========================================

// GET /api/workorders - Alle Work Orders
app.get('/api/workorders', (req, res) => {
  // TODO: Später aus Datenbank
  const mockWorkOrders = [
    {
      id: 1,
      title: 'Motor überhitzt',
      description: 'Motor auf T207 läuft zu heiß, Kühlung prüfen.',
      assetId: 1,
      assetName: 'T207',
      type: 'Mechanisch',
      category: 'Im Betrieb',
      priority: 'Hoch',
      status: 'In Arbeit',
      createdBy: 2,
      createdByName: 'Anna E-Super',
      assignedTo: 11,
      assignedToName: 'T207 Mechaniker',
      createdAt: '2025-10-10T08:30:00',
      updatedAt: '2025-10-10T09:15:00',
      materialRequired: false,
      materialStatus: 'Nicht benötigt',
    },
    {
      id: 2,
      title: 'Elektrischer Ausfall Pumpe',
      description: 'Pumpe auf T208 reagiert nicht, Verkabelung prüfen.',
      assetId: 2,
      assetName: 'T208',
      type: 'Elektrisch',
      category: 'Im Betrieb',
      priority: 'Kritisch',
      status: 'Zugewiesen',
      createdBy: 3,
      createdByName: 'Tom M-Super',
      assignedTo: 12,
      assignedToName: 'T208 Elektriker',
      createdAt: '2025-10-10T10:00:00',
      updatedAt: '2025-10-10T10:00:00',
      materialRequired: false,
      materialStatus: 'Nicht benötigt',
    },
  ];

  res.json({
    workOrders: mockWorkOrders,
    count: mockWorkOrders.length,
  });
});

// GET /api/workorders/:id - Einzelner Work Order
app.get('/api/workorders/:id', (req, res) => {
  const id = parseInt(req.params.id);
  // TODO: Aus DB laden
  res.json({
    error: 'Not implemented yet',
    message: 'Work Order Details coming soon',
  });
});

// POST /api/workorders - Neuer Work Order
app.post('/api/workorders', (req, res) => {
  const { title, description, assetId, type, priority } = req.body;

  if (!title || !description || !assetId) {
    return res.status(400).json({
      error: 'Titel, Beschreibung und AssetId sind erforderlich',
    });
  }

  // TODO: In DB speichern
  const newWorkOrder = {
    id: Math.floor(Math.random() * 10000), // Temp ID
    title,
    description,
    assetId,
    type: type || 'Sonstiges',
    priority: priority || 'Normal',
    status: 'Neu',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  console.log(`✅ Work Order created: ${title}`);

  res.status(201).json({
    workOrder: newWorkOrder,
    message: 'Work Order erfolgreich erstellt',
  });
});

// PUT /api/workorders/:id - Work Order aktualisieren
app.put('/api/workorders/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const updates = req.body;

  console.log(`✏️ Work Order ${id} updated:`, updates);

  // TODO: In DB speichern
  res.json({
    message: 'Work Order aktualisiert',
    workOrder: { id, ...updates },
  });
});

// ==========================================
// ASSET ROUTES
// ==========================================

// GET /api/assets - Alle Anlagen
app.get('/api/assets', (req, res) => {
  const mockAssets = [
    {
      id: 1,
      name: 'T207',
      type: 'Bohranlage',
      status: 'Betrieb',
      location: 'Feld Nord',
      serialNumber: 'BA-T207-2023',
      assignedUsers: [],
      notes: 'Hauptbohranlage Standort Nord',
    },
    {
      id: 2,
      name: 'T208',
      type: 'Bohranlage',
      status: 'Betrieb',
      location: 'Feld Nord',
      serialNumber: 'BA-T208-2023',
      assignedUsers: [],
      notes: 'Hauptbohranlage Standort Nord',
    },
    {
      id: 3,
      name: 'T700',
      type: 'Bohranlage',
      status: 'Wartung',
      location: 'Feld Ost',
      serialNumber: 'BA-T700-2022',
      assignedUsers: [],
      notes: 'Geplante Wartung bis Ende des Monats',
    },
    {
      id: 4,
      name: 'T46',
      type: 'Bohranlage',
      status: 'Betrieb',
      location: 'Feld Süd',
      serialNumber: 'BA-T46-2021',
      assignedUsers: [],
      notes: 'Älteste Anlage im Betrieb',
    },
  ];

  res.json({
    assets: mockAssets,
    count: mockAssets.length,
  });
});

// PUT /api/assets/:id - Asset Status ändern
app.put('/api/assets/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { status, notes } = req.body;

  console.log(`✏️ Asset ${id} updated: status=${status}`);

  res.json({
    message: 'Asset aktualisiert',
    asset: { id, status, notes },
  });
});

// ==========================================
// ERROR HANDLING
// ==========================================

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} existiert nicht`,
    availableEndpoints: {
      root: '/',
      health: '/api/health',
      login: 'POST /api/auth/login',
      users: '/api/users',
    },
  });
});

// Global Error Handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Unhandled Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// ==========================================
// START SERVER
// ==========================================
app.listen(PORT, () => {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 MaintAIn Backend Server');
  console.log('='.repeat(70));
  console.log(`📍 Server:      http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
  console.log(`⏰ Started at:  ${new Date().toLocaleString('de-DE')}`);
  console.log('\n📚 Available Endpoints:');
  console.log('   GET  /');
  console.log('   GET  /api/health');
  console.log('   POST /api/auth/login');
  console.log('   GET  /api/auth/me');
  console.log('   GET  /api/users');
  console.log('   GET  /api/users/:id');
  console.log('='.repeat(70) + '\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n👋 SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n👋 SIGINT signal received: closing HTTP server');
  process.exit(0);
});