import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useData } from "../contexts/DataContext";
import { canAccessAsset } from "../utils/permissions";
import UserManagement from "./UserManagement";
import AssetManagement from "./AssetManagement";
import WorkOrderManagement from "./WorkOrderManagement";
import PreventiveMaintenance from "./PreventiveMaintenance";
import NotificationBell from "../components/NotificationBell";

function Dashboard() {
  const [currentPage, setCurrentPage] = useState<
    "users" | "assets" | "workorders" | "pm"
  >("workorders");

  const { currentUser, logout } = useAuth();
  const { workOrders } = useData();

  const visibleWorkOrders = currentUser
    ? workOrders.filter((wo) => canAccessAsset(currentUser, wo.assetId))
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

  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<number | null>(
    null
  );

  return (
    <div>
      <div className="dashboard-header">
        <div>
          <span>
            👤 Eingeloggt als: <strong>{currentUser?.name}</strong>
          </span>
          <span className="user-role">({currentUser?.role})</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <NotificationBell
            onOpenWorkOrder={(woId) => {
              setCurrentPage("workorders");
              setSelectedWorkOrderId(woId);
            }}
          />
          <button onClick={logout} className="logout-btn">
            🚪 Abmelden
          </button>
        </div>
      </div>

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
        <button
          className={currentPage === "pm" ? "nav-btn active" : "nav-btn"}
          onClick={() => setCurrentPage("pm")}
        >
          📅 Wartungsplan (SAP)
        </button>
      </nav>

      {currentPage === "users" && <UserManagement />}
      {currentPage === "assets" && <AssetManagement />}
      {currentPage === "workorders" && (
        <WorkOrderManagement initialSelectedId={selectedWorkOrderId} />
      )}
      {currentPage === "pm" && <PreventiveMaintenance />}
    </div>
  );
}

export default Dashboard;
