import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { canAccessAsset } from "../utils/permissions";
import UserManagement from "./UserManagement";
import AssetManagement from "./AssetManagement";
import WorkOrderManagement from "./WorkOrderManagement";
import type { WorkOrder } from "../types";

// Mock Work Orders für Dashboard-Statistiken
const mockWorkOrders: WorkOrder[] = [
  {
    id: 1,
    title: "Motor überhitzt",
    description: "Motor auf T207 läuft zu heiß",
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
    materialRequired: true,
    materialStatus: "Bestellt",
  },
  {
    id: 2,
    title: "Elektrischer Ausfall Pumpe",
    description: "Pumpe auf T208 reagiert nicht",
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
    materialRequired: true,
    materialStatus: "Benötigt",
  },
  {
    id: 3,
    title: "Hydraulikschlauch undicht",
    description: "Kleines Leck am Hydraulikschlauch",
    assetId: 3,
    assetName: "T700",
    type: "Hydraulisch",
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

function Dashboard() {
  const [currentPage, setCurrentPage] = useState<
    "users" | "assets" | "workorders"
  >("workorders");

  // Hole currentUser und logout aus AuthContext
  const { currentUser, logout } = useAuth();

  // Berechne Work Order Statistiken basierend auf User-Rechten
  const visibleWorkOrders = currentUser
    ? mockWorkOrders.filter((wo) => canAccessAsset(currentUser, wo.assetId))
    : [];

  const openWorkOrders = visibleWorkOrders.filter(
    (wo) => wo.status !== "Erledigt" && wo.status !== "Abgebrochen"
  );

  const criticalWorkOrders = visibleWorkOrders.filter(
    (wo) => wo.priority === "Kritisch"
  );

  const myAssignedWorkOrders = visibleWorkOrders.filter(
    (wo) => wo.assignedTo === currentUser?.id
  );

  return (
    <div>
      {/* Logout Header */}
      <div className="dashboard-header">
        <div>
          <span>
            👤 Eingeloggt als: <strong>{currentUser?.name}</strong>
          </span>
          <span className="user-role">({currentUser?.role})</span>
        </div>
        <button onClick={logout} className="logout-btn">
          🚪 Abmelden
        </button>
      </div>

      {/* ========== NEU: Work Order Statistiken ========== */}
      <div className="dashboard-stats">
        <div className="dashboard-stat-card open">
          <div className="stat-icon">🎫</div>
          <div className="stat-content">
            <h3>Offene Work Orders</h3>
            <p className="stat-big-number">{openWorkOrders.length}</p>
          </div>
        </div>

        <div className="dashboard-stat-card critical">
          <div className="stat-icon">🚨</div>
          <div className="stat-content">
            <h3>Kritische</h3>
            <p className="stat-big-number">{criticalWorkOrders.length}</p>
          </div>
        </div>

        <div className="dashboard-stat-card assigned">
          <div className="stat-icon">👤</div>
          <div className="stat-content">
            <h3>Mir zugewiesen</h3>
            <p className="stat-big-number">{myAssignedWorkOrders.length}</p>
          </div>
        </div>

        <div className="dashboard-stat-card total">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>Gesamt sichtbar</h3>
            <p className="stat-big-number">{visibleWorkOrders.length}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="dashboard-nav">
        <button
          className={currentPage === "users" ? "nav-btn active" : "nav-btn"}
          onClick={() => setCurrentPage("users")}
        >
          👥 Benutzerverwaltung
        </button>
        <button
          className={currentPage === "assets" ? "nav-btn active" : "nav-btn"}
          onClick={() => setCurrentPage("assets")}
        >
          🛢️ Anlagenverwaltung
        </button>
        <button
          className={
            currentPage === "workorders" ? "nav-btn active" : "nav-btn"
          }
          onClick={() => setCurrentPage("workorders")}
        >
          🎫 Work Orders
        </button>
      </nav>

      {/* Content */}
      {currentPage === "users" && <UserManagement />}
      {currentPage === "assets" && <AssetManagement />}
      {currentPage === "workorders" && <WorkOrderManagement />}
    </div>
  );
}

export default Dashboard;
