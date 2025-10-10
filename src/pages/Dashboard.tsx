import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useData } from "../contexts/DataContext";
import NotificationBell from "../components/NotificationBell";
import UserManagement from "./UserManagement";
import AssetManagement from "./AssetManagement";
import WorkOrderManagement from "./WorkOrderManagement";

function Dashboard() {
  const [currentPage, setCurrentPage] = useState<
    "users" | "assets" | "workorders"
  >("workorders");

  const { currentUser, logout, permissions } = useAuth();
  const { resetAllData } = useData();

  const handleReset = () => {
    if (
      window.confirm(
        "⚠️ Alle Daten werden auf Initial-Werte zurückgesetzt. Fortfahren?"
      )
    ) {
      resetAllData();
      alert("✅ Daten wurden zurückgesetzt!");
    }
  };

  return (
    <div>
      <div className="dashboard-header">
        <div>
          <span>
            👤 Eingeloggt als: <strong>{currentUser?.name}</strong>
          </span>
          <span className="user-role">({currentUser?.role})</span>
        </div>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <NotificationBell />
          <button
            onClick={handleReset}
            className="logout-btn"
            style={{ background: "#f59e0b" }}
          >
            🔄 Daten zurücksetzen
          </button>
          <button onClick={logout} className="logout-btn">
            🚪 Abmelden
          </button>
        </div>
      </div>

      <nav className="dashboard-nav">
        {permissions?.canViewAllUsers && (
          <button
            className={currentPage === "users" ? "nav-btn active" : "nav-btn"}
            onClick={() => setCurrentPage("users")}
          >
            👥 Benutzerverwaltung
          </button>
        )}
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

      {currentPage === "users" && permissions?.canViewAllUsers && (
        <UserManagement />
      )}
      {currentPage === "assets" && <AssetManagement />}
      {currentPage === "workorders" && <WorkOrderManagement />}
    </div>
  );
}

export default Dashboard;
