// ==========================================
// MAINTAION BACKEND - PRISMA INTEGRATION
// ==========================================

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import prisma from './prisma';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ==========================================
// MIDDLEWARE
// ==========================================
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
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
// HELPER FUNCTIONS - ROLE MAPPING
// ==========================================

// Map Prisma enum to Frontend role
const mapRoleToFrontend = (role: string): string => {
  const roleMap: Record<string, string> = {
    'ADMIN': 'Admin',
    'E_SUPERVISOR': 'E-Supervisor',
    'M_SUPERVISOR': 'M-Supervisor',
    'MECHANIKER': 'Mechaniker',
    'ELEKTRIKER': 'Elektriker',
    'RSC': 'RSC',
  };
  return roleMap[role] || role;
};

// Map Frontend role to Prisma enum
const mapRoleToPrisma = (role: string): string => {
  const roleMap: Record<string, string> = {
    'Admin': 'ADMIN',
    'E-Supervisor': 'E_SUPERVISOR',
    'M-Supervisor': 'M_SUPERVISOR',
    'Mechaniker': 'MECHANIKER',
    'Elektriker': 'ELEKTRIKER',
    'RSC': 'RSC',
  };
  return roleMap[role] || role;
};

// Map Prisma status to Frontend
const mapStatusToFrontend = (status: string): string => {
  const statusMap: Record<string, string> = {
    'ACTIVE': 'Aktiv',
    'INACTIVE': 'Inaktiv',
  };
  return statusMap[status] || status;
};

// Map Work Order Status
const mapWOStatusToFrontend = (status: string): string => {
  const statusMap: Record<string, string> = {
    'NEW': 'Neu',
    'ASSIGNED': 'Zugewiesen',
    'IN_PROGRESS': 'In Arbeit',
    'COMPLETED': 'Erledigt',
    'CANCELLED': 'Abgebrochen',
  };
  return statusMap[status] || status;
};

const mapWOStatusToPrisma = (status: string): string => {
  const statusMap: Record<string, string> = {
    'Neu': 'NEW',
    'Offen': 'NEW',
    'Zugewiesen': 'ASSIGNED',
    'In Arbeit': 'IN_PROGRESS',
    'In Bearbeitung': 'IN_PROGRESS',
    'Erledigt': 'COMPLETED',
    'Abgebrochen': 'CANCELLED',
  };
  return statusMap[status] || 'NEW';
};

// Map Work Order Type
const mapWOTypeToPrisma = (type: string): string => {
  const typeMap: Record<string, string> = {
    'Mechanisch': 'MECHANISCH',
    'Elektrisch': 'ELEKTRISCH',
    'Hydraulisch': 'HYDRAULISCH',
    'Sonstiges': 'SONSTIGES',
  };
  return typeMap[type] || 'SONSTIGES';
};

// Map Work Order Category
const mapWOCategoryToPrisma = (category: string): string => {
  const categoryMap: Record<string, string> = {
    'Im Betrieb': 'IM_BETRIEB',
    'Einlagerung & Rig Moves': 'EINLAGERUNG_RIG_MOVES',
  };
  return categoryMap[category] || 'IM_BETRIEB';
};

// Map Work Order Priority
const mapWOPriorityToPrisma = (priority: string): string => {
  const priorityMap: Record<string, string> = {
    'Niedrig': 'NIEDRIG',
    'Normal': 'NORMAL',
    'Mittel': 'NORMAL',
    'Hoch': 'HOCH',
    'Kritisch': 'KRITISCH',
  };
  return priorityMap[priority] || 'NORMAL';
};

// Map Asset Status
const mapAssetStatusToFrontend = (status: string): string => {
  const statusMap: Record<string, string> = {
    'OPERATIONAL': 'Betrieb',
    'MAINTENANCE': 'Wartung',
    'MALFUNCTION': 'Störung',
    'SHUTDOWN': 'Stillstand',
  };
  return statusMap[status] || status;
};

const mapAssetStatusToPrisma = (status: string): string => {
  const statusMap: Record<string, string> = {
    'Betrieb': 'OPERATIONAL',
    'Wartung': 'MAINTENANCE',
    'Störung': 'MALFUNCTION',
    'Stillstand': 'SHUTDOWN',
  };
  return statusMap[status] || 'OPERATIONAL';
};

// Map Project Status
const mapProjectStatusToFrontend = (status: string): string => {
  const statusMap: Record<string, string> = {
    'GEPLANT': 'Geplant',
    'IN_ARBEIT': 'In Arbeit',
    'PAUSIERT': 'Pausiert',
    'ABGESCHLOSSEN': 'Abgeschlossen',
  };
  return statusMap[status] || status;
};

const mapProjectStatusToPrisma = (status: string): string => {
  const statusMap: Record<string, string> = {
    'Geplant': 'GEPLANT',
    'In Arbeit': 'IN_ARBEIT',
    'Pausiert': 'PAUSIERT',
    'Abgeschlossen': 'ABGESCHLOSSEN',
  };
  return statusMap[status] || 'GEPLANT';
};

// Map Project Priority
const mapProjectPriorityToFrontend = (priority: string): string => {
  const priorityMap: Record<string, string> = {
    'NIEDRIG': 'Niedrig',
    'NORMAL': 'Normal',
    'HOCH': 'Hoch',
    'KRITISCH': 'Kritisch',
  };
  return priorityMap[priority] || priority;
};

const mapProjectPriorityToPrisma = (priority: string): string => {
  const priorityMap: Record<string, string> = {
    'Niedrig': 'NIEDRIG',
    'Normal': 'NORMAL',
    'Hoch': 'HOCH',
    'Kritisch': 'KRITISCH',
  };
  return priorityMap[priority] || 'NORMAL';
};

// ==========================================
// ROUTES
// ==========================================

// Root Endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'MaintAIn Backend API',
    version: '1.0.0',
    status: 'running',
    database: 'Prisma + SQLite',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      users: '/api/users',
      workorders: '/api/workorders',
      assets: '/api/assets',
      projects: '/api/projects',
    },
  });
});

// Health Check
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    res.json({
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: 'connected',
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ==========================================
// AUTH ROUTES
// ==========================================

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  console.log('🔐 Login attempt:', email);

  if (!email || !password) {
    return res.status(400).json({
      error: 'Email und Passwort erforderlich',
    });
  }

  try {
    // Find user in database
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        assignedAssets: {
          include: {
            asset: true,
          },
        },
      },
    });

    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(401).json({
        error: 'Ungültige Anmeldedaten',
      });
    }

    // TODO: Use bcrypt for password comparison in production
    // For now, use simple comparison (INSECURE!)
    const bcrypt = require('bcryptjs');
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      console.log('❌ Invalid password for:', email);
      return res.status(401).json({
        error: 'Ungültige Anmeldedaten',
      });
    }

    // Map to frontend format
    const frontendUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: mapRoleToFrontend(user.role),
      status: mapStatusToFrontend(user.status),
      assignedAssets: user.assignedAssets.map(ua => ua.assetId),
      createdAt: user.createdAt.toISOString(),
    };

    console.log('✅ Login successful:', user.email);

    res.json({
      user: frontendUser,
      token: 'fake-jwt-token', // TODO: Generate real JWT
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      error: 'Server error during login',
    });
  }
});

// GET /api/auth/me (für später mit JWT)
app.get('/api/auth/me', (req, res) => {
  res.status(501).json({
    error: 'Not implemented yet - JWT coming soon',
  });
});

// ==========================================
// USER ROUTES
// ==========================================

// GET /api/users (alle User ohne Passwörter)
app.get('/api/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        assignedAssets: {
          include: {
            asset: true,
          },
        },
      },
      orderBy: {
        id: 'asc',
      },
    });

    const mappedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: mapRoleToFrontend(user.role),
      status: mapStatusToFrontend(user.status),
      assignedAssets: user.assignedAssets.map(ua => ua.assetId),
      createdAt: user.createdAt.toISOString(),
    }));

    res.json({
      users: mappedUsers,
      count: mappedUsers.length,
    });
  } catch (error) {
    console.error('❌ Get users error:', error);
    res.status(500).json({
      error: 'Failed to fetch users',
    });
  }
});

// GET /api/users/:id
app.get('/api/users/:id', async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        assignedAssets: {
          include: {
            asset: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User nicht gefunden' });
    }

    const mappedUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: mapRoleToFrontend(user.role),
      status: mapStatusToFrontend(user.status),
      assignedAssets: user.assignedAssets.map(ua => ua.assetId),
      createdAt: user.createdAt.toISOString(),
    };

    res.json(mappedUser);
  } catch (error) {
    console.error('❌ Get user error:', error);
    res.status(500).json({
      error: 'Failed to fetch user',
    });
  }
});

// ==========================================
// WORK ORDER ROUTES
// ==========================================

// GET /api/workorders - Alle Work Orders
app.get('/api/workorders', async (req, res) => {
  try {
    const workOrders = await prisma.workOrder.findMany({
      include: {
        asset: true,
        createdBy: true,
        assignedTo: true,
        tasks: true,
        comments: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const mappedWorkOrders = workOrders.map(wo => ({
      id: wo.id,
      title: wo.title,
      description: wo.description,
      assetId: wo.assetId,
      assetName: wo.asset.name,
      type: wo.type.charAt(0) + wo.type.slice(1).toLowerCase().replace('_', ' '),
      category: wo.category === 'IM_BETRIEB' ? 'Im Betrieb' : 'Einlagerung & Rig Moves',
      priority: wo.priority.charAt(0) + wo.priority.slice(1).toLowerCase(),
      status: mapWOStatusToFrontend(wo.status),
      createdBy: wo.createdById,
      createdByName: wo.createdBy.name,
      assignedTo: wo.assignedToId,
      assignedToName: wo.assignedTo?.name,
      materialRequired: wo.materialRequired,
      materialStatus: wo.materialStatus,
      materialNumber: wo.materialNumber,
      materialDescription: wo.materialDescription,
      createdAt: wo.createdAt.toISOString(),
      updatedAt: wo.updatedAt.toISOString(),
      completedAt: wo.completedAt?.toISOString(),
      tasks: wo.tasks.map(task => ({
        id: task.id,
        description: task.description,
        completed: task.completed,
        required: task.required,
      })),
    }));

    res.json({
      workOrders: mappedWorkOrders,
      count: mappedWorkOrders.length,
    });
  } catch (error) {
    console.error('❌ Get work orders error:', error);
    res.status(500).json({
      error: 'Failed to fetch work orders',
    });
  }
});

// GET /api/workorders/:id - Einzelner Work Order
app.get('/api/workorders/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  
  try {
    const wo = await prisma.workOrder.findUnique({
      where: { id },
      include: {
        asset: true,
        createdBy: true,
        assignedTo: true,
        tasks: true,
        comments: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!wo) {
      return res.status(404).json({ error: 'Work Order nicht gefunden' });
    }

    const mappedWO = {
      id: wo.id,
      title: wo.title,
      description: wo.description,
      assetId: wo.assetId,
      assetName: wo.asset.name,
      type: wo.type.charAt(0) + wo.type.slice(1).toLowerCase(),
      category: wo.category === 'IM_BETRIEB' ? 'Im Betrieb' : 'Einlagerung & Rig Moves',
      priority: wo.priority.charAt(0) + wo.priority.slice(1).toLowerCase(),
      status: mapWOStatusToFrontend(wo.status),
      createdBy: wo.createdById,
      createdByName: wo.createdBy.name,
      assignedTo: wo.assignedToId,
      assignedToName: wo.assignedTo?.name,
      materialRequired: wo.materialRequired,
      materialStatus: wo.materialStatus,
      createdAt: wo.createdAt.toISOString(),
      updatedAt: wo.updatedAt.toISOString(),
      completedAt: wo.completedAt?.toISOString(),
    };

    res.json(mappedWO);
  } catch (error) {
    console.error('❌ Get work order error:', error);
    res.status(500).json({
      error: 'Failed to fetch work order',
    });
  }
});

// POST /api/workorders - Neuer Work Order
app.post('/api/workorders', async (req, res) => {
  const { 
    title, 
    description, 
    assetId, 
    type, 
    category, 
    priority, 
    status,
    assignedTo,
    createdBy,
    materialRequired,
    materialNumber,
    materialDescription,
  } = req.body;

  if (!title || !description || !assetId) {
    return res.status(400).json({
      error: 'Titel, Beschreibung und AssetId sind erforderlich',
    });
  }

  try {
    // Get asset to include name
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
    });

    if (!asset) {
      return res.status(404).json({
        error: 'Asset nicht gefunden',
      });
    }

    // Parse assignedTo array
    let assignedToId = null;
    if (assignedTo && Array.isArray(assignedTo) && assignedTo.length > 0) {
      // Take first user ID (convert string to number if needed)
      const userId = typeof assignedTo[0] === 'string' ? parseInt(assignedTo[0]) : assignedTo[0];
      if (!isNaN(userId)) {
        assignedToId = userId;
      }
    } else if (assignedTo && typeof assignedTo === 'number') {
      assignedToId = assignedTo;
    }

    // Create work order
    const workOrder = await prisma.workOrder.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        assetId,
        type: mapWOTypeToPrisma(type || 'Sonstiges'),
        category: mapWOCategoryToPrisma(category || 'Im Betrieb'),
        priority: mapWOPriorityToPrisma(priority || 'Normal'),
        status: mapWOStatusToPrisma(status || 'Offen'),
        createdById: createdBy || 1, // Default to admin
        assignedToId,
        materialRequired: materialRequired || false,
        materialStatus: materialRequired ? 'REQUIRED' : 'NOT_REQUIRED',
        materialNumber: materialNumber || null,
        materialDescription: materialDescription || null,
      },
      include: {
        asset: true,
        createdBy: true,
        assignedTo: true,
      },
    });

    console.log(`✅ Work Order created: ${title} (ID: ${workOrder.id})`);

    // Map response to frontend format
    const mappedWO = {
      id: workOrder.id,
      title: workOrder.title,
      description: workOrder.description,
      assetId: workOrder.assetId,
      assetName: workOrder.asset.name,
      type: workOrder.type.charAt(0) + workOrder.type.slice(1).toLowerCase(),
      category: workOrder.category === 'IM_BETRIEB' ? 'Im Betrieb' : 'Einlagerung & Rig Moves',
      priority: workOrder.priority.charAt(0) + workOrder.priority.slice(1).toLowerCase(),
      status: mapWOStatusToFrontend(workOrder.status),
      createdBy: workOrder.createdById,
      createdByName: workOrder.createdBy.name,
      assignedTo: workOrder.assignedToId,
      assignedToName: workOrder.assignedTo?.name,
      materialRequired: workOrder.materialRequired,
      materialStatus: workOrder.materialStatus,
      createdAt: workOrder.createdAt.toISOString(),
      updatedAt: workOrder.updatedAt.toISOString(),
    };

    res.status(201).json({
      workOrder: mappedWO,
      message: 'Work Order erfolgreich erstellt',
    });
  } catch (error) {
    console.error('❌ Create work order error:', error);
    res.status(500).json({
      error: 'Failed to create work order',
    });
  }
});

// PUT /api/workorders/:id - Work Order aktualisieren
app.put('/api/workorders/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const updates = req.body;

  try {
    // Check if work order exists
    const existing = await prisma.workOrder.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Work Order nicht gefunden' });
    }

    // Prepare update data
    const updateData: any = {};

    if (updates.title) updateData.title = updates.title;
    if (updates.description) updateData.description = updates.description;
    if (updates.type) updateData.type = mapWOTypeToPrisma(updates.type);
    if (updates.category) updateData.category = mapWOCategoryToPrisma(updates.category);
    if (updates.priority) updateData.priority = mapWOPriorityToPrisma(updates.priority);
    if (updates.status) {
      updateData.status = mapWOStatusToPrisma(updates.status);
      if (updates.status === 'Erledigt' || updates.status === 'COMPLETED') {
        updateData.completedAt = new Date();
      }
    }
    if (updates.assignedTo !== undefined) {
      if (Array.isArray(updates.assignedTo) && updates.assignedTo.length > 0) {
        const userId = typeof updates.assignedTo[0] === 'string' 
          ? parseInt(updates.assignedTo[0]) 
          : updates.assignedTo[0];
        updateData.assignedToId = !isNaN(userId) ? userId : null;
      } else if (typeof updates.assignedTo === 'number') {
        updateData.assignedToId = updates.assignedTo;
      } else {
        updateData.assignedToId = null;
      }
    }
    if (updates.materialRequired !== undefined) {
      updateData.materialRequired = updates.materialRequired;
      updateData.materialStatus = updates.materialRequired ? 'REQUIRED' : 'NOT_REQUIRED';
    }
    if (updates.materialNumber !== undefined) updateData.materialNumber = updates.materialNumber;
    if (updates.materialDescription !== undefined) updateData.materialDescription = updates.materialDescription;

    // Update work order
    const workOrder = await prisma.workOrder.update({
      where: { id },
      data: updateData,
      include: {
        asset: true,
        createdBy: true,
        assignedTo: true,
      },
    });

    console.log(`✏️ Work Order ${id} updated:`, Object.keys(updateData));

    // Map to frontend format
    const mappedWO = {
      id: workOrder.id,
      title: workOrder.title,
      description: workOrder.description,
      assetId: workOrder.assetId,
      assetName: workOrder.asset.name,
      type: workOrder.type.charAt(0) + workOrder.type.slice(1).toLowerCase(),
      category: workOrder.category === 'IM_BETRIEB' ? 'Im Betrieb' : 'Einlagerung & Rig Moves',
      priority: workOrder.priority.charAt(0) + workOrder.priority.slice(1).toLowerCase(),
      status: mapWOStatusToFrontend(workOrder.status),
      createdBy: workOrder.createdById,
      createdByName: workOrder.createdBy.name,
      assignedTo: workOrder.assignedToId,
      assignedToName: workOrder.assignedTo?.name,
      materialRequired: workOrder.materialRequired,
      materialStatus: workOrder.materialStatus,
      createdAt: workOrder.createdAt.toISOString(),
      updatedAt: workOrder.updatedAt.toISOString(),
      completedAt: workOrder.completedAt?.toISOString(),
    };

    res.json({
      message: 'Work Order aktualisiert',
      workOrder: mappedWO,
    });
  } catch (error) {
    console.error('❌ Update work order error:', error);
    res.status(500).json({
      error: 'Failed to update work order',
    });
  }
});

// DELETE /api/workorders/:id - Work Order löschen
app.delete('/api/workorders/:id', async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const workOrder = await prisma.workOrder.delete({
      where: { id },
    });

    console.log(`🗑️ Work Order ${id} deleted: ${workOrder.title}`);

    res.json({
      message: 'Work Order erfolgreich gelöscht',
      workOrder: {
        id: workOrder.id,
        title: workOrder.title,
      },
    });
  } catch (error) {
    console.error('❌ Delete work order error:', error);
    res.status(404).json({
      error: 'Work Order nicht gefunden',
    });
  }
});

// ==========================================
// ASSET ROUTES
// ==========================================

// GET /api/assets - Alle Anlagen
app.get('/api/assets', async (req, res) => {
  try {
    const assets = await prisma.asset.findMany({
      include: {
        assignedUsers: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        id: 'asc',
      },
    });

    const mappedAssets = assets.map(asset => ({
      id: asset.id,
      name: asset.name,
      type: asset.type.charAt(0) + asset.type.slice(1).toLowerCase(),
      status: mapAssetStatusToFrontend(asset.status),
      location: asset.location,
      serialNumber: asset.serialNumber,
      notes: asset.notes,
      assignedUsers: asset.assignedUsers.map(ua => ua.userId),
    }));

    res.json({
      assets: mappedAssets,
      count: mappedAssets.length,
    });
  } catch (error) {
    console.error('❌ Get assets error:', error);
    res.status(500).json({
      error: 'Failed to fetch assets',
    });
  }
});

// PUT /api/assets/:id - Asset aktualisieren
app.put('/api/assets/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const updates = req.body;

  try {
    const updateData: any = {};

    if (updates.name) updateData.name = updates.name;
    if (updates.status) updateData.status = mapAssetStatusToPrisma(updates.status);
    if (updates.location) updateData.location = updates.location;
    if (updates.serialNumber !== undefined) updateData.serialNumber = updates.serialNumber;
    if (updates.notes !== undefined) updateData.notes = updates.notes;

    const asset = await prisma.asset.update({
      where: { id },
      data: updateData,
    });

    console.log(`✏️ Asset ${id} updated:`, Object.keys(updateData));

    const mappedAsset = {
      id: asset.id,
      name: asset.name,
      type: asset.type.charAt(0) + asset.type.slice(1).toLowerCase(),
      status: mapAssetStatusToFrontend(asset.status),
      location: asset.location,
      serialNumber: asset.serialNumber,
      notes: asset.notes,
    };

    res.json({
      message: 'Asset aktualisiert',
      asset: mappedAsset,
    });
  } catch (error) {
    console.error('❌ Update asset error:', error);
    res.status(404).json({
      error: 'Asset nicht gefunden',
    });
  }
});

// ==========================================
// PROJECT ROUTES
// ==========================================

// GET /api/projects - Get all projects
app.get('/api/projects', async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      include: {
        asset: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const mappedProjects = projects.map((project) => ({
      id: project.id,
      assetId: project.assetId,
      assetName: project.asset.name,
      projectName: project.projectName,
      status: mapProjectStatusToFrontend(project.status),
      progress: project.progress,
      budget: project.budget,
      spent: project.spent,
      startDate: project.startDate.toISOString(),
      endDate: project.endDate.toISOString(),
      priority: mapProjectPriorityToFrontend(project.priority),
      manager: project.manager,
      description: project.description,
      objectives: project.objectives,
      scope: project.scope,
      notes: project.notes || '',
      risks: project.risks || '',
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    }));

    res.json({
      projects: mappedProjects,
      count: mappedProjects.length,
    });
  } catch (error) {
    console.error('❌ Get projects error:', error);
    res.status(500).json({
      error: 'Failed to fetch projects',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/projects/:id - Get single project
app.get('/api/projects/:id', async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        asset: true,
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({
      id: project.id,
      assetId: project.assetId,
      assetName: project.asset.name,
      projectName: project.projectName,
      status: mapProjectStatusToFrontend(project.status),
      progress: project.progress,
      budget: project.budget,
      spent: project.spent,
      startDate: project.startDate.toISOString(),
      endDate: project.endDate.toISOString(),
      priority: mapProjectPriorityToFrontend(project.priority),
      manager: project.manager,
      description: project.description,
      objectives: project.objectives,
      scope: project.scope,
      notes: project.notes || '',
      risks: project.risks || '',
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('❌ Get project error:', error);
    res.status(500).json({
      error: 'Failed to fetch project',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST /api/projects - Create new project
app.post('/api/projects', async (req, res) => {
  try {
    console.log('📋 Create Project Request Body:', req.body);
    
    const {
      assetId,
      projectName,
      status,
      progress,
      budget,
      spent,
      startDate,
      endDate,
      priority,
      manager,
      description,
      objectives,
      scope,
      notes,
      risks,
    } = req.body;

    // Validation
    if (!assetId || !projectName || budget === undefined || budget === null || !startDate || !endDate || !manager) {
      console.log('❌ Validation failed:', {
        assetId: !!assetId,
        projectName: !!projectName,
        budget: budget,
        startDate: !!startDate,
        endDate: !!endDate,
        manager: !!manager,
      });
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['assetId', 'projectName', 'budget', 'startDate', 'endDate', 'manager'],
        received: { assetId, projectName, budget, startDate, endDate, manager },
      });
    }

    const project = await prisma.project.create({
      data: {
        assetId: parseInt(assetId),
        projectName: projectName.trim(),
        status: mapProjectStatusToPrisma(status || 'Geplant') as any,
        progress: parseInt(progress) || 0,
        budget: parseFloat(budget),
        spent: parseFloat(spent) || 0,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        priority: mapProjectPriorityToPrisma(priority || 'Normal') as any,
        manager: manager.trim(),
        description: description?.trim() || '',
        objectives: objectives?.trim() || '',
        scope: scope?.trim() || '',
        notes: notes?.trim() || '',
        risks: risks?.trim() || '',
      },
      include: {
        asset: true,
      },
    });

    console.log('✅ Project created:', project.id);

    res.status(201).json({
      id: project.id,
      assetId: project.assetId,
      assetName: project.asset.name,
      projectName: project.projectName,
      status: mapProjectStatusToFrontend(project.status),
      progress: project.progress,
      budget: project.budget,
      spent: project.spent,
      startDate: project.startDate.toISOString(),
      endDate: project.endDate.toISOString(),
      priority: mapProjectPriorityToFrontend(project.priority),
      manager: project.manager,
      description: project.description,
      objectives: project.objectives,
      scope: project.scope,
      notes: project.notes || '',
      risks: project.risks || '',
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('❌ Create project error:', error);
    res.status(500).json({
      error: 'Failed to create project',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// PUT /api/projects/:id - Update project
app.put('/api/projects/:id', async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const {
      assetId,
      projectName,
      status,
      progress,
      budget,
      spent,
      startDate,
      endDate,
      priority,
      manager,
      description,
      objectives,
      scope,
      notes,
      risks,
    } = req.body;

    const project = await prisma.project.update({
      where: { id: projectId },
      data: {
        assetId: assetId ? parseInt(assetId) : undefined,
        projectName: projectName?.trim(),
        status: status ? (mapProjectStatusToPrisma(status) as any) : undefined,
        progress: progress !== undefined ? parseInt(progress) : undefined,
        budget: budget !== undefined ? parseFloat(budget) : undefined,
        spent: spent !== undefined ? parseFloat(spent) : undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        priority: priority ? (mapProjectPriorityToPrisma(priority) as any) : undefined,
        manager: manager?.trim(),
        description: description?.trim(),
        objectives: objectives?.trim(),
        scope: scope?.trim(),
        notes: notes?.trim(),
        risks: risks?.trim(),
      },
      include: {
        asset: true,
      },
    });

    console.log('✅ Project updated:', project.id);

    res.json({
      id: project.id,
      assetId: project.assetId,
      assetName: project.asset.name,
      projectName: project.projectName,
      status: mapProjectStatusToFrontend(project.status),
      progress: project.progress,
      budget: project.budget,
      spent: project.spent,
      startDate: project.startDate.toISOString(),
      endDate: project.endDate.toISOString(),
      priority: mapProjectPriorityToFrontend(project.priority),
      manager: project.manager,
      description: project.description,
      objectives: project.objectives,
      scope: project.scope,
      notes: project.notes || '',
      risks: project.risks || '',
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('❌ Update project error:', error);
    res.status(500).json({
      error: 'Failed to update project',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// DELETE /api/projects/:id - Delete project
app.delete('/api/projects/:id', async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);

    await prisma.project.delete({
      where: { id: projectId },
    });

    console.log('✅ Project deleted:', projectId);

    res.json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    console.error('❌ Delete project error:', error);
    res.status(500).json({
      error: 'Failed to delete project',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
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
      workorders: '/api/workorders',
      assets: '/api/assets',
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
// SERVER START
// ==========================================

app.listen(PORT, async () => {
  console.log('='.repeat(70));
  console.log('🚀 MaintAIn Backend gestartet mit PRISMA + SQLite!');
  console.log('='.repeat(70));
  console.log(`🌐 Server:     http://localhost:${PORT}`);
  console.log(`🔗 CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
  console.log(`💾 Database:   SQLite (${process.env.DATABASE_URL})`);
  console.log(`⏰ Started at:  ${new Date().toLocaleString('de-DE')}`);
  
  // Test database connection
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database:   Connected');
  } catch (error) {
    console.error('❌ Database:   Connection failed!', error);
  }
  
  console.log('\n📚 Available Endpoints:');
  console.log('   GET    /');
  console.log('   GET    /api/health');
  console.log('   POST   /api/auth/login');
  console.log('   GET    /api/users');
  console.log('   GET    /api/workorders');
  console.log('   POST   /api/workorders');
  console.log('   PUT    /api/workorders/:id');
  console.log('   DELETE /api/workorders/:id');
  console.log('   GET    /api/assets');
  console.log('   PUT    /api/assets/:id');
  console.log('='.repeat(70) + '\n');
});
