import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import UserManagement from "./UserManagement";
import AssetManagement from "./AssetManagement";
import WorkOrderManagement from "./WorkOrderManagement";

function Dashboard() {
  const [currentPage, setCurrentPage] = useState<
    "users" | "assets" | "workorders"
  >("workorders");

  // Hole currentUser und logout aus AuthContext
  const { currentUser, logout } = useAuth();

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
