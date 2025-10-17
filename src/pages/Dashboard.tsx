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
    | "users"
    | "assets"
    | "workorders"
    | "sappm"
    | "sap-pm"
    | "projects"
    | "chatbot"
  >("workorders");

  const [isDarkMode, setIsDarkMode] = useState(false);

  const { currentUser, logout } = useAuth();
  const { workOrders } = useData();

  const visibleWorkOrders = currentUser
    ? workOrders.filter((wo) => canAccessAsset(currentUser, wo.assetId))
    : [];

  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<number | null>(
    null
  );

  const navItems = [
    {
      id: "users" as const,
      icon: "👥",
      label: "Benutzerverwaltung",
      visible: currentUser?.role === "Admin",
    },
    { id: "projects" as const, icon: "🏗️", label: "Projekte", visible: true },
    {
      id: "assets" as const,
      icon: "🛢️",
      label: "Anlagenverwaltung",
      visible: true,
    },
    {
      id: "workorders" as const,
      icon: "🎫",
      label: "Work Orders",
      visible: true,
    },
    {
      id: "sappm" as const,
      icon: "📋",
      label: "SAP Preventive Maintenance",
      visible: true,
    },
    {
      id: "sap-pm" as const,
      icon: "🔧",
      label: "SAP PM Inspektionen",
      visible: true,
    },
  ];

  return (
    <div className={isDarkMode ? "dark-mode" : ""}>
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <span>
            👤 Eingeloggt als: <strong>{currentUser?.name}</strong>
          </span>
          <span className="user-role">({currentUser?.role})</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {/* Dark Mode Toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={isDarkMode ? "dark-mode-toggle" : "light-mode-toggle"}
            title={isDarkMode ? "Light Mode" : "Dark Mode"}
          >
            {isDarkMode ? "☀️" : "🌙"}
          </button>

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

      {/* Navigation */}
      <nav className="dashboard-nav">
        {navItems
          .filter((item) => item.visible)
          .map((item) => (
            <button
              key={item.id}
              className={currentPage === item.id ? "nav-btn active" : "nav-btn"}
              onClick={() => setCurrentPage(item.id)}
            >
              <span style={{ marginRight: "0.5rem" }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
      </nav>

      {/* Content */}
      <div>
        {currentPage === "users" && <UserManagement />}
        {currentPage === "projects" && <ProjectManagement />}
        {currentPage === "assets" && <AssetManagement />}
        {currentPage === "workorders" && (
          <WorkOrderManagement initialSelectedId={selectedWorkOrderId} />
        )}
        {currentPage === "sappm" && <PreventiveMaintenance />}
        {currentPage === "sap-pm" && <SAPPreventiveMaintenance />}
      </div>
    </div>
  );
}

export default Dashboard;
