// ==========================================
// PRISMA SEED SCRIPT
// ==========================================

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data
  console.log('🗑️  Clearing existing data...');
  await prisma.notification.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.workOrderImage.deleteMany();
  await prisma.workOrder.deleteMany();
  await prisma.project.deleteMany();
  await prisma.userAsset.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.sAPMaintenanceItem.deleteMany();

  // Hash passwords
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const hashedES = await bcrypt.hash('es123', 10);
  const hashedMS = await bcrypt.hash('ms123', 10);
  const hashedT207 = await bcrypt.hash('t207', 10);

  // Create Users
  console.log('👥 Creating users...');
  const admin = await prisma.user.create({
    data: {
      email: 'admin@erp.de',
      name: 'Max Admin',
      password: hashedPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  const eSupervisor = await prisma.user.create({
    data: {
      email: 'esuper@erp.de',
      name: 'Anna E-Super',
      password: hashedES,
      role: 'E_SUPERVISOR',
      status: 'ACTIVE',
    },
  });

  const mSupervisor = await prisma.user.create({
    data: {
      email: 'msuper@erp.de',
      name: 'Tom M-Super',
      password: hashedMS,
      role: 'M_SUPERVISOR',
      status: 'ACTIVE',
    },
  });

  const t207Elektriker = await prisma.user.create({
    data: {
      email: 't207-el@erp.de',
      name: 'T207 Elektriker',
      password: hashedT207,
      role: 'ELEKTRIKER',
      status: 'ACTIVE',
    },
  });

  const t207Mechaniker = await prisma.user.create({
    data: {
      email: 't207-mech@erp.de',
      name: 'T207 Mechaniker',
      password: hashedT207,
      role: 'MECHANIKER',
      status: 'ACTIVE',
    },
  });

  console.log('✅ Users created:', {
    admin: admin.id,
    eSupervisor: eSupervisor.id,
    mSupervisor: mSupervisor.id,
    t207Elektriker: t207Elektriker.id,
    t207Mechaniker: t207Mechaniker.id,
  });

  // Create Assets
  console.log('🛢️  Creating assets...');
  const t207 = await prisma.asset.create({
    data: {
      name: 'T207',
      type: 'BOHRANLAGE',
      status: 'OPERATIONAL',
      location: 'Feld Nord',
      serialNumber: 'BA-T207-2023',
      notes: 'Hauptbohranlage Standort Nord',
    },
  });

  const t208 = await prisma.asset.create({
    data: {
      name: 'T208',
      type: 'BOHRANLAGE',
      status: 'OPERATIONAL',
      location: 'Feld Nord',
      serialNumber: 'BA-T208-2023',
      notes: 'Hauptbohranlage Standort Nord',
    },
  });

  const t700 = await prisma.asset.create({
    data: {
      name: 'T700',
      type: 'BOHRANLAGE',
      status: 'MAINTENANCE',
      location: 'Feld Ost',
      serialNumber: 'BA-T700-2022',
      notes: 'Geplante Wartung bis Ende des Monats',
    },
  });

  const t46 = await prisma.asset.create({
    data: {
      name: 'T46',
      type: 'BOHRANLAGE',
      status: 'OPERATIONAL',
      location: 'Feld Süd',
      serialNumber: 'BA-T46-2021',
      notes: 'Älteste Anlage im Betrieb',
    },
  });

  console.log('✅ Assets created:', {
    t207: t207.id,
    t208: t208.id,
    t700: t700.id,
    t46: t46.id,
  });

  // Assign Assets to Users
  console.log('🔗 Assigning assets to users...');
  await prisma.userAsset.createMany({
    data: [
      { userId: t207Elektriker.id, assetId: t207.id },
      { userId: t207Mechaniker.id, assetId: t207.id },
    ],
  });

  // Create Work Orders
  console.log('🎫 Creating work orders...');
  const wo1 = await prisma.workOrder.create({
    data: {
      title: 'Motor überhitzt',
      description: 'Motor auf T207 läuft zu heiß, Kühlung prüfen.',
      type: 'MECHANISCH',
      category: 'IM_BETRIEB',
      priority: 'HOCH',
      status: 'IN_PROGRESS',
      assetId: t207.id,
      createdById: eSupervisor.id,
      assignedToId: t207Mechaniker.id,
      materialRequired: false,
      materialStatus: 'NOT_REQUIRED',
    },
  });

  const wo2 = await prisma.workOrder.create({
    data: {
      title: 'Elektrischer Ausfall Pumpe',
      description: 'Pumpe auf T208 reagiert nicht, Verkabelung prüfen.',
      type: 'ELEKTRISCH',
      category: 'IM_BETRIEB',
      priority: 'KRITISCH',
      status: 'ASSIGNED',
      assetId: t208.id,
      createdById: mSupervisor.id,
      assignedToId: t207Elektriker.id,
      materialRequired: false,
      materialStatus: 'NOT_REQUIRED',
    },
  });

  console.log('✅ Work Orders created:', {
    wo1: wo1.id,
    wo2: wo2.id,
  });

  // Create Tasks
  console.log('✅ Creating tasks...');
  await prisma.task.createMany({
    data: [
      {
        description: 'Kühlmittelstand prüfen',
        completed: true,
        required: true,
        workOrderId: wo1.id,
        completedById: t207Mechaniker.id,
        completedAt: new Date(),
      },
      {
        description: 'Kühlsystem spülen',
        completed: false,
        required: true,
        workOrderId: wo1.id,
      },
      {
        description: 'Neue Kühlflüssigkeit auffüllen',
        completed: false,
        required: true,
        workOrderId: wo1.id,
      },
    ],
  });

  // Create Comments
  console.log('💬 Creating comments...');
  await prisma.comment.createMany({
    data: [
      {
        comment: 'Kühlmittelstand war sehr niedrig, aufgefüllt.',
        type: 'COMMENT',
        workOrderId: wo1.id,
        userId: t207Mechaniker.id,
      },
      {
        comment: 'Status geändert von "Zugewiesen" zu "In Arbeit"',
        type: 'STATUS_CHANGE',
        oldValue: 'ASSIGNED',
        newValue: 'IN_PROGRESS',
        workOrderId: wo1.id,
        userId: t207Mechaniker.id,
      },
    ],
  });

  // Create Projects
  console.log('📋 Creating projects...');
  await prisma.project.createMany({
    data: [
      {
        assetId: t207.id,
        projectName: 'Komplette Überholung T207',
        status: 'IN_ARBEIT',
        progress: 35,
        budget: 250000,
        spent: 87500,
        startDate: new Date('2025-09-01'),
        endDate: new Date('2025-12-31'),
        priority: 'HOCH',
        manager: 'Anna E-Super',
        description: 'Umfassende Wartung und Modernisierung der Bohranlage T207',
        objectives: 'Verlängerung der Lebensdauer um 5 Jahre, Effizienzsteigerung um 15%',
        scope: 'Motor, Hydraulik, Elektronik, Sicherheitssysteme',
        notes: 'Projekt läuft planmäßig',
        risks: 'Lieferverzögerungen bei Spezialteilen möglich',
      },
      {
        assetId: t208.id,
        projectName: 'Sicherheitsupdate T208',
        status: 'GEPLANT',
        progress: 0,
        budget: 80000,
        spent: 0,
        startDate: new Date('2026-01-15'),
        endDate: new Date('2026-03-31'),
        priority: 'NORMAL',
        manager: 'Klaus M-Super',
        description: 'Installation neuer Sicherheitssysteme nach neuen Vorschriften',
        objectives: 'Compliance mit ISO 45001:2025',
        scope: 'Notabschaltsysteme, Gasdetektoren, Fluchtwegsbeleuchtung',
        notes: 'Warten auf Budget-Freigabe',
        risks: 'Betriebsunterbrechung von 2 Wochen erforderlich',
      },
      {
        assetId: t700.id,
        projectName: 'Leistungssteigerung Pumpe T700',
        status: 'ABGESCHLOSSEN',
        progress: 100,
        budget: 45000,
        spent: 42300,
        startDate: new Date('2025-06-01'),
        endDate: new Date('2025-08-15'),
        priority: 'NIEDRIG',
        manager: 'Anna E-Super',
        description: 'Austausch der Pumpenlaufräder gegen Hochleistungsmodelle',
        objectives: 'Durchsatzerhöhung um 20%',
        scope: 'Laufräder, Dichtungen, Lager',
        notes: 'Erfolgreich abgeschlossen, Ziele übertroffen',
        risks: 'Keine',
      },
    ],
  });

  console.log('✅ Database seeded successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - ${await prisma.user.count()} Users`);
  console.log(`   - ${await prisma.asset.count()} Assets`);
  console.log(`   - ${await prisma.workOrder.count()} Work Orders`);
  console.log(`   - ${await prisma.task.count()} Tasks`);
  console.log(`   - ${await prisma.comment.count()} Comments`);
  console.log(`   - ${await prisma.project.count()} Projects`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
