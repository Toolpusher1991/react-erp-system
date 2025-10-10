// ==========================================
// DATA CONTEXT - MIT LOCALSTORAGE
// ==========================================
// Verwaltet alle Daten (Users, Assets, WorkOrders) zentral

import { createContext, useContext, type ReactNode } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import type { User, Asset, WorkOrder } from "../types";

// Initial-Daten wenn localStorage leer ist
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
    email: "t207-el",
    password: "t207",
    role: "Elektriker",
    status: "Aktiv",
    assignedAssets: [1],
  },
  {
    id: 11,
    name: "T207 Mechaniker",
    email: "t207-mech",
    password: "t207",
    role: "Mechaniker",
    status: "Aktiv",
    assignedAssets: [1],
  },
  {
    id: 12,
    name: "T208 Elektriker",
    email: "t208-el",
    password: "t208",
    role: "Elektriker",
    status: "Aktiv",
    assignedAssets: [2],
  },
  {
    id: 13,
    name: "T208 Mechaniker",
    email: "t208-mech",
    password: "t208",
    role: "Mechaniker",
    status: "Aktiv",
    assignedAssets: [2],
  },
  {
    id: 14,
    name: "T700 Elektriker",
    email: "t700-el",
    password: "t700",
    role: "Elektriker",
    status: "Aktiv",
    assignedAssets: [3],
  },
  {
    id: 15,
    name: "T700 Mechaniker",
    email: "t700-mech",
    password: "t700",
    role: "Mechaniker",
    status: "Aktiv",
    assignedAssets: [3],
  },
  {
    id: 16,
    name: "T46 Elektriker",
    email: "t46-el",
    password: "t46",
    role: "Elektriker",
    status: "Aktiv",
    assignedAssets: [4],
  },
  {
    id: 17,
    name: "T46 Mechaniker",
    email: "t46-mech",
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
    priority: "Hoch",
    status: "In Arbeit",
    createdBy: 2,
    createdByName: "Anna E-Super",
    assignedTo: 11,
    assignedToName: "T207 Mechaniker",
    createdAt: "2025-10-10T08:30:00",
    updatedAt: "2025-10-10T09:15:00",
  },
  {
    id: 2,
    title: "Elektrischer Ausfall Pumpe",
    description:
      "Pumpe auf T208 reagiert nicht, Verkabelung prüfen. Sicherung mehrfach ausgelöst.",
    assetId: 2,
    assetName: "T208",
    type: "Elektrisch",
    priority: "Kritisch",
    status: "Zugewiesen",
    createdBy: 3,
    createdByName: "Tom M-Super",
    assignedTo: 12,
    assignedToName: "T208 Elektriker",
    createdAt: "2025-10-10T10:00:00",
    updatedAt: "2025-10-10T10:00:00",
  },
  {
    id: 3,
    title: "Hydraulikschlauch undicht",
    description:
      "Kleines Leck am Hydraulikschlauch, austauschen. Leichte Verschmutzung durch austretendes Öl.",
    assetId: 3,
    assetName: "T700",
    type: "Hydraulisch",
    priority: "Normal",
    status: "Neu",
    createdBy: 6,
    createdByName: "Sarah RSC",
    createdAt: "2025-10-10T11:30:00",
    updatedAt: "2025-10-10T11:30:00",
  },
];

// Interface: Was der DataContext bereitstellt
interface DataContextType {
  // State
  users: User[];
  assets: Asset[];
  workOrders: WorkOrder[];

  // User Functions
  addUser: (user: User) => void;
  updateUser: (user: User) => void;
  deleteUser: (id: number) => void;

  // Asset Functions
  addAsset: (asset: Asset) => void;
  updateAsset: (asset: Asset) => void;
  deleteAsset: (id: number) => void;

  // WorkOrder Functions
  addWorkOrder: (workOrder: WorkOrder) => void;
  updateWorkOrder: (workOrder: WorkOrder) => void;
  deleteWorkOrder: (id: number) => void;

  // Utility
  resetAllData: () => void; // Reset zu Initial-Daten
}

// Context erstellen
const DataContext = createContext<DataContextType | undefined>(undefined);

// Provider Component
export function DataProvider({ children }: { children: ReactNode }) {
  // useLocalStorage Hook - speichert automatisch!
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

  // User Management Functions
  const addUser = (user: User) => {
    setUsers([...users, user]);
  };

  const updateUser = (updatedUser: User) => {
    setUsers(users.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
  };

  const deleteUser = (id: number) => {
    setUsers(users.filter((u) => u.id !== id));
  };

  // Asset Management Functions
  const addAsset = (asset: Asset) => {
    setAssets([...assets, asset]);
  };

  const updateAsset = (updatedAsset: Asset) => {
    setAssets(assets.map((a) => (a.id === updatedAsset.id ? updatedAsset : a)));
  };

  const deleteAsset = (id: number) => {
    setAssets(assets.filter((a) => a.id !== id));
  };

  // WorkOrder Management Functions
  const addWorkOrder = (workOrder: WorkOrder) => {
    setWorkOrders([...workOrders, workOrder]);
  };

  const updateWorkOrder = (updatedWO: WorkOrder) => {
    setWorkOrders(
      workOrders.map((wo) => (wo.id === updatedWO.id ? updatedWO : wo))
    );
  };

  const deleteWorkOrder = (id: number) => {
    setWorkOrders(workOrders.filter((wo) => wo.id !== id));
  };

  // Reset alle Daten zu Initial-Werten
  const resetAllData = () => {
    setUsers(INITIAL_USERS);
    setAssets(INITIAL_ASSETS);
    setWorkOrders(INITIAL_WORKORDERS);
  };

  // Context Value
  const value: DataContextType = {
    users,
    assets,
    workOrders,
    addUser,
    updateUser,
    deleteUser,
    addAsset,
    updateAsset,
    deleteAsset,
    addWorkOrder,
    updateWorkOrder,
    deleteWorkOrder,
    resetAllData,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

// Custom Hook zum Zugriff auf DataContext
export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error(
      "useData muss innerhalb von DataProvider verwendet werden!"
    );
  }
  return context;
}
