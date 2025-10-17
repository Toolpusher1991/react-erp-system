// ==========================================
// DATA CONTEXT - VOLLSTÄNDIG MIT SAP INTEGRATION
// ==========================================

import { createContext, useContext, type ReactNode } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import type {
  User,
  Asset,
  WorkOrder,
  WorkOrderComment,
  Notification,
  SAPMaintenanceItem,
  Project,
  WorkOrderType,
  WorkOrderPriority,
} from "../types";

// ==========================================
// INITIAL DATA
// ==========================================

const INITIAL_USERS: User[] = [
  {
    id: 1,
    name: "Max Admin",
    email: "admin@erp.de",
    password: "admin123",
    role: "Admin",
    status: "Aktiv",
    assignedAssets: [],
  },
  {
    id: 2,
    name: "Anna E-Super",
    email: "esuper@erp.de",
    password: "es123",
    role: "E-Supervisor",
    status: "Aktiv",
    assignedAssets: [],
  },
  {
    id: 3,
    name: "Tom M-Super",
    email: "msuper@erp.de",
    password: "ms123",
    role: "M-Supervisor",
    status: "Aktiv",
    assignedAssets: [],
  },
  {
    id: 6,
    name: "Sarah RSC",
    email: "rsc@erp.de",
    password: "rsc123",
    role: "RSC",
    status: "Aktiv",
    assignedAssets: [],
  },
  {
    id: 10,
    name: "T207 Elektriker",
    email: "t207-el@erp.de",
    password: "t207",
    role: "Elektriker",
    status: "Aktiv",
    assignedAssets: [1],
  },
  {
    id: 11,
    name: "T207 Mechaniker",
    email: "t207-mech@erp.de",
    password: "t207",
    role: "Mechaniker",
    status: "Aktiv",
    assignedAssets: [1],
  },
  {
    id: 12,
    name: "T208 Elektriker",
    email: "t208-el@erp.de",
    password: "t208",
    role: "Elektriker",
    status: "Aktiv",
    assignedAssets: [2],
  },
  {
    id: 13,
    name: "T208 Mechaniker",
    email: "t208-mech@erp.de",
    password: "t208",
    role: "Mechaniker",
    status: "Aktiv",
    assignedAssets: [2],
  },
  {
    id: 14,
    name: "T700 Elektriker",
    email: "t700-el@erp.de",
    password: "t700",
    role: "Elektriker",
    status: "Aktiv",
    assignedAssets: [3],
  },
  {
    id: 15,
    name: "T700 Mechaniker",
    email: "t700-mech@erp.de",
    password: "t700",
    role: "Mechaniker",
    status: "Aktiv",
    assignedAssets: [3],
  },
  {
    id: 16,
    name: "T46 Elektriker",
    email: "t46-el@erp.de",
    password: "t46",
    role: "Elektriker",
    status: "Aktiv",
    assignedAssets: [4],
  },
  {
    id: 17,
    name: "T46 Mechaniker",
    email: "t46-mech@erp.de",
    password: "t46",
    role: "Mechaniker",
    status: "Aktiv",
    assignedAssets: [4],
  },
];

const INITIAL_ASSETS: Asset[] = [
  {
    id: 1,
    name: "T207",
    type: "Bohranlage",
    status: "Betrieb",
    location: "Feld Nord",
    serialNumber: "BA-T207-2023",
    assignedUsers: [],
    notes: "Hauptbohranlage Standort Nord",
  },
  {
    id: 2,
    name: "T208",
    type: "Bohranlage",
    status: "Betrieb",
    location: "Feld Nord",
    serialNumber: "BA-T208-2023",
    assignedUsers: [],
    notes: "Hauptbohranlage Standort Nord",
  },
  {
    id: 3,
    name: "T700",
    type: "Bohranlage",
    status: "Wartung",
    location: "Feld Ost",
    serialNumber: "BA-T700-2022",
    assignedUsers: [],
    notes: "Geplante Wartung bis Ende des Monats",
  },
  {
    id: 4,
    name: "T46",
    type: "Bohranlage",
    status: "Betrieb",
    location: "Feld Süd",
    serialNumber: "BA-T46-2021",
    assignedUsers: [],
    notes: "Älteste Anlage im Betrieb",
  },
];

const INITIAL_WORKORDERS: WorkOrder[] = [
  {
    id: 1,
    title: "Motor überhitzt",
    description:
      "Motor auf T207 läuft zu heiß, Kühlung prüfen. Temperatur steigt über 90°C. Sofortige Prüfung erforderlich.",
    assetId: 1,
    assetName: "T207",
    type: "Mechanisch",
    category: "Im Betrieb",
    priority: "Hoch",
    status: "In Arbeit",
    createdBy: 2,
    createdByName: "Anna E-Super",
    assignedTo: 11,
    assignedToName: "T207 Mechaniker",
    createdAt: "2025-10-10T08:30:00",
    updatedAt: "2025-10-10T09:15:00",
    materialRequired: false,
    materialStatus: "Nicht benötigt",
  },
  {
    id: 2,
    title: "Elektrischer Ausfall Pumpe",
    description:
      "Pumpe auf T208 reagiert nicht, Verkabelung prüfen. Sicherung mehrfach ausgelöst.",
    assetId: 2,
    assetName: "T208",
    type: "Elektrisch",
    category: "Im Betrieb",
    priority: "Kritisch",
    status: "Zugewiesen",
    createdBy: 3,
    createdByName: "Tom M-Super",
    assignedTo: 12,
    assignedToName: "T208 Elektriker",
    createdAt: "2025-10-10T10:00:00",
    updatedAt: "2025-10-10T10:00:00",
    materialRequired: false,
    materialStatus: "Nicht benötigt",
  },
  {
    id: 3,
    title: "Hydraulikschlauch undicht",
    description:
      "Kleines Leck am Hydraulikschlauch, austauschen. Leichte Verschmutzung durch austretendes Öl.",
    assetId: 3,
    assetName: "T700",
    type: "Hydraulisch",
    category: "Im Betrieb",
    priority: "Normal",
    status: "Neu",
    createdBy: 6,
    createdByName: "Sarah RSC",
    createdAt: "2025-10-10T11:30:00",
    updatedAt: "2025-10-10T11:30:00",
    materialRequired: false,
    materialStatus: "Nicht benötigt",
  },
];

const INITIAL_COMMENTS: WorkOrderComment[] = [];
const INITIAL_NOTIFICATIONS: Notification[] = [];
const INITIAL_SAP_DATA: SAPMaintenanceItem[] = [];
const INITIAL_PROJECTS: Project[] = [
  {
    id: 1,
    assetId: 1,
    assetName: "T207",
    projectName: "T207 Komplett-Überholung 2025",
    status: "In Arbeit",
    progress: 65,
    budget: 125000,
    spent: 81250,
    startDate: "2025-09-01",
    endDate: "2025-11-30",
    priority: "Hoch",
    manager: "Anna E-Super",
    description:
      "Komplette Wartung und Modernisierung der Bohranlage T207 inkl. Motor, Pumpen und elektrische Systeme",
    objectives:
      "Lebensdauer verlängern, Effizienz steigern, Ausfallzeiten reduzieren",
    scope:
      "Motor-Überholung, Pumpen-Austausch, Elektrische Systeme modernisieren, Hydraulik prüfen",
    notes: "Koordination mit Produktion für minimale Downtime erforderlich",
    risks:
      "Wetter-abhängige Verzögerungen möglich, Ersatzteil-Verfügbarkeit kritisch",
    createdAt: "2025-09-01T08:00:00",
    updatedAt: "2025-10-12T14:30:00",
  },
  {
    id: 2,
    assetId: 1,
    assetName: "T207",
    projectName: "T207 Digitalisierung Q4/2025",
    status: "Geplant",
    progress: 10,
    budget: 75000,
    spent: 7500,
    startDate: "2025-12-01",
    endDate: "2026-02-28",
    priority: "Normal",
    manager: "Anna E-Super",
    description:
      "Installation von IoT-Sensoren und Predictive Maintenance System",
    objectives:
      "Vorausschauende Wartung ermöglichen, Datenerfassung automatisieren",
    scope: "Sensoren installieren, Software implementieren, Personal schulen",
    notes: "Abhängig von Abschluss der Überholung",
    risks: "Software-Integration komplex",
    createdAt: "2025-09-15T10:00:00",
    updatedAt: "2025-09-15T10:00:00",
  },
  {
    id: 3,
    assetId: 2,
    assetName: "T208",
    projectName: "T208 Sicherheits-Upgrade",
    status: "In Arbeit",
    progress: 85,
    budget: 45000,
    spent: 38250,
    startDate: "2025-08-15",
    endDate: "2025-10-20",
    priority: "Hoch",
    manager: "Anna E-Super",
    description:
      "Installation neuer Sicherheitssysteme und Notfall-Abschaltungen",
    objectives: "Compliance mit neuen Sicherheitsstandards, Risiko-Minimierung",
    scope:
      "Notfall-Stopp-Systeme, Gas-Detektoren, Alarm-Systeme, Schulung Personal",
    notes: "Projekt läuft planmäßig, Abschluss voraussichtlich pünktlich",
    risks: "Minimal - Routine-Upgrade",
    createdAt: "2025-08-15T08:00:00",
    updatedAt: "2025-10-10T16:45:00",
  },
  {
    id: 4,
    assetId: 3,
    assetName: "T700",
    projectName: "T700 Rig Move - Feld Ost",
    status: "Geplant",
    progress: 15,
    budget: 85000,
    spent: 12750,
    startDate: "2025-11-01",
    endDate: "2025-12-15",
    priority: "Kritisch",
    manager: "Tom M-Super",
    description:
      "Umzug der Anlage T700 vom aktuellen Standort zu neuem Bohrplatz in Feld Ost",
    objectives:
      "Sichere Demontage, Transport und Wiederaufbau am neuen Standort",
    scope:
      "Komplette Demontage, Spezial-Transport, Foundation am neuen Standort, Re-Assembly, Testing",
    notes: "Straßensperre für Schwertransport bereits genehmigt",
    risks: "Wetter-kritisch, Transport-Logistik komplex",
    createdAt: "2025-09-20T09:00:00",
    updatedAt: "2025-10-05T11:20:00",
  },
  {
    id: 5,
    assetId: 3,
    assetName: "T700",
    projectName: "T700 Standort-Vorbereitung Feld Ost",
    status: "In Arbeit",
    progress: 45,
    budget: 35000,
    spent: 15750,
    startDate: "2025-10-01",
    endDate: "2025-10-31",
    priority: "Kritisch",
    manager: "Tom M-Super",
    description: "Vorbereitung des neuen Standorts für T700 Rig Move",
    objectives: "Foundation errichten, Infrastruktur vorbereiten",
    scope: "Beton-Foundation, Strom-/Wasseranschlüsse, Zufahrtswege",
    notes: "Muss vor Rig Move abgeschlossen sein",
    risks: "Wetter kann Beton-Arbeiten verzögern",
    createdAt: "2025-10-01T08:00:00",
    updatedAt: "2025-10-12T13:15:00",
  },
  {
    id: 6,
    assetId: 4,
    assetName: "T46",
    projectName: "T46 Modernisierung Hydraulik",
    status: "Abgeschlossen",
    progress: 100,
    budget: 65000,
    spent: 62000,
    startDate: "2025-06-01",
    endDate: "2025-08-30",
    priority: "Normal",
    manager: "Tom M-Super",
    description:
      "Austausch veralteter Hydraulik-Komponenten durch moderne Systeme",
    objectives: "Wartungsaufwand reduzieren, Zuverlässigkeit erhöhen",
    scope: "Hydraulik-Pumpen, Ventile, Schläuche, Steuerung modernisiert",
    notes: "Projekt erfolgreich abgeschlossen, 5% unter Budget",
    risks: "Keine - Projekt abgeschlossen",
    createdAt: "2025-06-01T08:00:00",
    updatedAt: "2025-08-30T16:00:00",
  },
  {
    id: 7,
    assetId: 4,
    assetName: "T46",
    projectName: "T46 Routine Inspektion 2026",
    status: "Geplant",
    progress: 0,
    budget: 25000,
    spent: 0,
    startDate: "2026-01-15",
    endDate: "2026-02-15",
    priority: "Niedrig",
    manager: "Tom M-Super",
    description: "Jährliche Haupt-Inspektion nach Wartungsplan",
    objectives: "Betriebssicherheit gewährleisten, Verschleiß dokumentieren",
    scope: "Komplette Sichtprüfung, Funktions-Tests, Dokumentation",
    notes: "Routine-Projekt, jährlich wiederkehrend",
    risks: "Keine - Standard-Wartung",
    createdAt: "2025-09-01T10:00:00",
    updatedAt: "2025-09-01T10:00:00",
  },
];

// ==========================================
// CONTEXT INTERFACE
// ==========================================

interface DataContextType {
  users: User[];
  assets: Asset[];
  workOrders: WorkOrder[];
  comments: WorkOrderComment[];
  notifications: Notification[];
  sapMaintenanceItems: SAPMaintenanceItem[];
  projects: Project[];

  addUser: (user: User) => void;
  updateUser: (user: User) => void;
  deleteUser: (id: number) => void;

  addAsset: (asset: Asset) => void;
  updateAsset: (asset: Asset) => void;
  deleteAsset: (id: number) => void;

  addWorkOrder: (workOrder: WorkOrder) => void;
  updateWorkOrder: (workOrder: WorkOrder) => void;
  deleteWorkOrder: (id: number) => void;

  addComment: (comment: WorkOrderComment) => void;
  getCommentsForWorkOrder: (workOrderId: number) => WorkOrderComment[];
  deleteComment: (id: number) => void;

  addNotification: (notification: Notification) => void;
  getNotificationsForUser: (userId: number) => Notification[];
  markNotificationAsRead: (id: number) => void;
  markAllNotificationsAsRead: (userId: number) => void;
  getUnreadCount: (userId: number) => number;

  addSAPMaintenanceItems: (items: SAPMaintenanceItem[]) => void;
  clearSAPMaintenanceItems: () => void;
  deleteAllSAPMaintenanceItems: () => void;
  deleteSAPMaintenanceItem: (id: string) => void;
  createWorkOrderFromSAP: (
    sapItem: SAPMaintenanceItem,
    currentUserId: number,
    assignedTo?: number
  ) => WorkOrder;

  addProject: (project: Project) => void;
  updateProject: (project: Project) => void;
  deleteProject: (id: number) => void;

  resetAllData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// ==========================================
// PROVIDER
// ==========================================

export function DataProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useLocalStorage<User[]>(
    "maintaIn_users",
    INITIAL_USERS
  );
  const [assets, setAssets] = useLocalStorage<Asset[]>(
    "maintaIn_assets",
    INITIAL_ASSETS
  );
  const [workOrders, setWorkOrders] = useLocalStorage<WorkOrder[]>(
    "maintaIn_workOrders",
    INITIAL_WORKORDERS
  );
  const [comments, setComments] = useLocalStorage<WorkOrderComment[]>(
    "maintaIn_comments",
    INITIAL_COMMENTS
  );
  const [notifications, setNotifications] = useLocalStorage<Notification[]>(
    "maintaIn_notifications",
    INITIAL_NOTIFICATIONS
  );
  const [sapMaintenanceItems, setSapMaintenanceItems] = useLocalStorage<
    SAPMaintenanceItem[]
  >("maintaIn_sapMaintenanceItems", INITIAL_SAP_DATA);

  const [projects, setProjects] = useLocalStorage<Project[]>(
    "maintaIn_projects",
    INITIAL_PROJECTS
  );

  // ==========================================
  // USER FUNCTIONS
  // ==========================================

  const addUser = (user: User) => setUsers([...users, user]);
  const updateUser = (updatedUser: User) =>
    setUsers(users.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
  const deleteUser = (id: number) => setUsers(users.filter((u) => u.id !== id));

  // ==========================================
  // ASSET FUNCTIONS
  // ==========================================

  const addAsset = (asset: Asset) => setAssets([...assets, asset]);
  const updateAsset = (updatedAsset: Asset) =>
    setAssets(assets.map((a) => (a.id === updatedAsset.id ? updatedAsset : a)));
  const deleteAsset = (id: number) =>
    setAssets(assets.filter((a) => a.id !== id));

  // ==========================================
  // WORK ORDER FUNCTIONS
  // ==========================================

  const addWorkOrder = (workOrder: WorkOrder) =>
    setWorkOrders([...workOrders, workOrder]);
  const updateWorkOrder = (updatedWO: WorkOrder) =>
    setWorkOrders(
      workOrders.map((wo) => (wo.id === updatedWO.id ? updatedWO : wo))
    );
  const deleteWorkOrder = (id: number) =>
    setWorkOrders(workOrders.filter((wo) => wo.id !== id));

  // ==========================================
  // COMMENT FUNCTIONS
  // ==========================================

  const addComment = (comment: WorkOrderComment) =>
    setComments([...comments, comment]);
  const getCommentsForWorkOrder = (workOrderId: number): WorkOrderComment[] =>
    comments
      .filter((c) => c.workOrderId === workOrderId)
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
  const deleteComment = (id: number) =>
    setComments(comments.filter((c) => c.id !== id));

  // ==========================================
  // NOTIFICATION FUNCTIONS
  // ==========================================

  const addNotification = (notification: Notification) =>
    setNotifications([...notifications, notification]);
  const getNotificationsForUser = (userId: number): Notification[] =>
    notifications
      .filter((n) => n.userId === userId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  const markNotificationAsRead = (id: number) =>
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  const markAllNotificationsAsRead = (userId: number) =>
    setNotifications(
      notifications.map((n) => (n.userId === userId ? { ...n, read: true } : n))
    );
  const getUnreadCount = (userId: number): number =>
    notifications.filter((n) => n.userId === userId && !n.read).length;

  // ==========================================
  // SAP FUNCTIONS
  // ==========================================

  const addSAPMaintenanceItems = (items: SAPMaintenanceItem[]) => {
    setSapMaintenanceItems(items);
  };

  const clearSAPMaintenanceItems = () => {
    setSapMaintenanceItems([]);
    console.log("🗑️ Alle SAP Maintenance Items gelöscht");
  };

  const deleteAllSAPMaintenanceItems = () => {
    clearSAPMaintenanceItems();
  };

  const deleteSAPMaintenanceItem = (id: string) => {
    setSapMaintenanceItems(
      sapMaintenanceItems.filter((item) => item.id !== id)
    );
  };

  const createWorkOrderFromSAP = (
    sapItem: SAPMaintenanceItem,
    currentUserId: number,
    assignedTo?: number
  ): WorkOrder => {
    // Bestimme Work Order Type basierend auf Work Center
    let woType: WorkOrderType = "Mechanisch";
    if (sapItem.mainWorkCenter === "ELEC") {
      woType = "Elektrisch";
    } else if (sapItem.mainWorkCenter === "MECH") {
      woType = "Mechanisch";
    }

    // Bestimme Priorität basierend auf Fälligkeit
    const getTargetDate = (basicStartDate: string): Date | null => {
      if (!basicStartDate) return null;
      try {
        const date = new Date(basicStartDate);
        date.setDate(date.getDate() + 14);
        return date;
      } catch {
        return null;
      }
    };

    const targetDate = getTargetDate(sapItem.basicStartDate);
    const today = new Date();
    const daysUntilDue = targetDate
      ? Math.ceil(
          (targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        )
      : null;

    let priority: WorkOrderPriority = "Normal";
    if (daysUntilDue !== null) {
      if (daysUntilDue < 0) {
        priority = "Kritisch";
      } else if (daysUntilDue <= 3) {
        priority = "Hoch";
      } else if (daysUntilDue <= 7) {
        priority = "Normal";
      } else {
        priority = "Niedrig";
      }
    }

    // Finde Asset ID basierend auf Asset Name
    const asset = assets.find((a) => a.name === sapItem.asset);
    const assetId = asset?.id || 1;

    // Finde User Namen
    const currentUser = users.find((u) => u.id === currentUserId);
    if (!currentUser) {
      throw new Error("Aktueller User nicht gefunden");
    }

    const assignedUser = assignedTo
      ? users.find((u) => u.id === assignedTo)
      : undefined;

    // Erstelle SAP Information String für sapInformation Feld
    const sapInfo = `SAP Order: ${sapItem.orderNumber}
Order Type: ${sapItem.orderType}
Work Center: ${sapItem.mainWorkCenter}
Equipment: ${sapItem.equipment}
Functional Location: ${sapItem.functionalLocation}
System Status: ${sapItem.systemStatus}
Basic Start Date: ${new Date(sapItem.basicStartDate).toLocaleDateString(
      "de-DE"
    )}`;

    // Bestimme Kategorie basierend auf descriptionExtra
    const category =
      sapItem.descriptionExtra?.toLowerCase().includes("einlagerung") ||
      sapItem.descriptionExtra?.toLowerCase().includes("rig move")
        ? "Einlagerung & Rig Moves"
        : "Im Betrieb";

    // Erstelle neuen Work Order
    const maxId =
      workOrders.length > 0 ? Math.max(...workOrders.map((wo) => wo.id)) : 0;
    const newId = maxId + 1;

    const newWO: WorkOrder = {
      id: newId,
      title: sapItem.description,
      description: `${sapItem.descriptionDetail}${
        sapItem.descriptionExtra ? `\n\n${sapItem.descriptionExtra}` : ""
      }`.trim(),
      assetId,
      assetName: sapItem.asset,
      type: woType,
      category: category as any,
      priority,
      status: assignedTo ? "Zugewiesen" : "Neu",
      createdBy: currentUserId,
      createdByName: currentUser.name,
      assignedTo,
      assignedToName: assignedUser?.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      materialRequired: false,
      materialStatus: "Nicht benötigt",
      sapInformation: sapInfo,
      sapOrderNumber: sapItem.orderNumber,
      sapBasicStartDate: sapItem.basicStartDate,
      sapEquipment: sapItem.equipment,
      sapFunctionalLocation: sapItem.functionalLocation,
    };

    addWorkOrder(newWO);

    // Notification wenn zugewiesen
    if (assignedTo && assignedTo !== currentUserId) {
      const notification: Notification = {
        id: Math.max(...notifications.map((n) => n.id), 0) + 1,
        userId: assignedTo,
        type: "assignment",
        workOrderId: newId,
        workOrderTitle: newWO.title,
        message: `${currentUser.name} hat dir einen neuen Work Order aus SAP zugewiesen`,
        createdAt: new Date().toISOString(),
        read: false,
        createdBy: currentUserId,
        createdByName: currentUser.name,
      };
      addNotification(notification);
    }

    return newWO;
  };

  // ==========================================
  // PROJECT FUNCTIONS
  // ==========================================

  const addProject = (project: Project) => setProjects([...projects, project]);
  const updateProject = (updatedProject: Project) =>
    setProjects(
      projects.map((p) => (p.id === updatedProject.id ? updatedProject : p))
    );
  const deleteProject = (id: number) =>
    setProjects(projects.filter((p) => p.id !== id));

  // ==========================================
  // RESET FUNCTION
  // ==========================================

  const resetAllData = () => {
    setUsers(INITIAL_USERS);
    setAssets(INITIAL_ASSETS);
    setWorkOrders(INITIAL_WORKORDERS);
    setComments(INITIAL_COMMENTS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setSapMaintenanceItems(INITIAL_SAP_DATA);
    setProjects(INITIAL_PROJECTS);
  };

  // ==========================================
  // CONTEXT VALUE
  // ==========================================

  const value: DataContextType = {
    users,
    assets,
    workOrders,
    comments,
    notifications,
    sapMaintenanceItems,
    projects,
    addUser,
    updateUser,
    deleteUser,
    addAsset,
    updateAsset,
    deleteAsset,
    addWorkOrder,
    updateWorkOrder,
    deleteWorkOrder,
    addComment,
    getCommentsForWorkOrder,
    deleteComment,
    addNotification,
    getNotificationsForUser,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    getUnreadCount,
    addSAPMaintenanceItems,
    clearSAPMaintenanceItems,
    deleteAllSAPMaintenanceItems,
    deleteSAPMaintenanceItem,
    createWorkOrderFromSAP,
    addProject,
    updateProject,
    deleteProject,
    resetAllData,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

// ==========================================
// HOOK
// ==========================================

export function useData() {
  const context = useContext(DataContext);
  if (!context)
    throw new Error(
      "useData muss innerhalb von DataProvider verwendet werden!"
    );
  return context;
}
