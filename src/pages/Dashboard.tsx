// src/pages/Dashboard.tsx

import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useData } from "../contexts/DataContext";
import { canAccessAsset } from "../utils/permissions";
import UserManagement from "./UserManagement";
import AssetManagement from "./AssetManagement";
import WorkOrderManagement from "./WorkOrderManagement";
import PreventiveMaintenance from "./PreventiveMaintenance";
import ProjectManagement from "./ProjectManagement";
import NotificationBell from "../components/NotificationBell";
import SAPPreventiveMaintenance from "./SAPPreventiveMaintenance";

function Dashboard() {
  const [currentPage, setCurrentPage] = useState<
    "users" | "assets" | "workorders" | "sappm" | "sap-pm" | "projects"
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
      {/* Logout Header */}
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

      {/* Dashboard Statistics */}
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
        {currentUser?.role === "Admin" && (
          <button
            className={currentPage === "users" ? "nav-btn active" : "nav-btn"}
            onClick={() => setCurrentPage("users")}
          >
            👥 Benutzerverwaltung
          </button>
        )}
        <button
          className={currentPage === "projects" ? "nav-btn active" : "nav-btn"}
          onClick={() => setCurrentPage("projects")}
        >
          🏗️ Projekte
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
          className={currentPage === "sappm" ? "nav-btn active" : "nav-btn"}
          onClick={() => setCurrentPage("sappm")}
        >
          📋 SAP Preventive Maintenance
        </button>
        <button
          className={currentPage === "sap-pm" ? "nav-btn active" : "nav-btn"}
          onClick={() => setCurrentPage("sap-pm")}
        >
          🔧 SAP PM Inspektionen
        </button>
      </nav>

      {/* Content */}
      {currentPage === "users" && <UserManagement />}
      {currentPage === "projects" && <ProjectManagement />}
      {currentPage === "assets" && <AssetManagement />}
      {currentPage === "workorders" && (
        <WorkOrderManagement initialSelectedId={selectedWorkOrderId} />
      )}
      {currentPage === "sappm" && <PreventiveMaintenance />}
      {currentPage === "sap-pm" && <SAPPreventiveMaintenance />}
    </div>
  );
}

export default Dashboard;
