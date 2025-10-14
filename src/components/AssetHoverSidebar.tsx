// ==========================================
// ASSET HOVER SIDEBAR COMPONENT
// ==========================================
// src/components/AssetHoverSidebar.tsx

import { useData } from "../contexts/DataContext";
import type { Asset, WorkOrder } from "../types";

interface AssetHoverSidebarProps {
  assetId: number | null;
  onClose: () => void;
  onOpenWorkOrder?: (workOrderId: number) => void;
}

function AssetHoverSidebar({
  assetId,
  onClose,
  onOpenWorkOrder,
}: AssetHoverSidebarProps) {
  const { assets, workOrders } = useData();

  // Wenn kein Asset gehovered, zeige nichts
  if (!assetId) return null;

  // Finde das Asset
  const asset = assets.find((a) => a.id === assetId);
  if (!asset) return null;

  // Statistiken für dieses Asset berechnen
  const assetWorkOrders = workOrders.filter((wo) => wo.assetId === assetId);
  const stats = {
    total: assetWorkOrders.length,
    open: assetWorkOrders.filter(
      (wo) => wo.status !== "Erledigt" && wo.status !== "Abgebrochen"
    ).length,
    inProgress: assetWorkOrders.filter((wo) => wo.status === "In Arbeit")
      .length,
    completed: assetWorkOrders.filter((wo) => wo.status === "Erledigt").length,
  };

  // Letzte 5 Work Orders für dieses Asset
  const recentWorkOrders = assetWorkOrders
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 5);

  // Helper: Status-Farbe
  const getStatusColor = (status: Asset["status"]) => {
    switch (status) {
      case "Betrieb":
        return "#10b981";
      case "Wartung":
        return "#f59e0b";
      case "Störung":
        return "#ef4444";
      case "Stillstand":
        return "#6b7280";
      default:
        return "#9ca3af";
    }
  };

  // Helper: Prioritäts-Farbe
  const getPriorityColor = (priority: WorkOrder["priority"]) => {
    switch (priority) {
      case "Niedrig":
        return "#3b82f6";
      case "Normal":
        return "#6b7280";
      case "Hoch":
        return "#f59e0b";
      case "Kritisch":
        return "#ef4444";
      default:
        return "#9ca3af";
    }
  };

  // Helper: Status-Icon
  const getStatusIcon = (status: WorkOrder["status"]) => {
    switch (status) {
      case "Neu":
        return "🆕";
      case "Zugewiesen":
        return "👤";
      case "In Arbeit":
        return "🔧";
      case "Erledigt":
        return "✅";
      case "Abgebrochen":
        return "❌";
      default:
        return "📋";
    }
  };

  // Helper: Typ-Icon
  const getTypeIcon = (type: WorkOrder["type"]) => {
    switch (type) {
      case "Mechanisch":
        return "🔧";
      case "Elektrisch":
        return "⚡";
      case "Hydraulisch":
        return "💧";
      case "Sonstiges":
        return "🛠️";
      default:
        return "🛠️";
    }
  };

  // Helper: Zeit-Anzeige
  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (seconds < 60) return "gerade eben";
    if (seconds < 3600) return `vor ${Math.floor(seconds / 60)} Min`;
    if (seconds < 86400) return `vor ${Math.floor(seconds / 3600)} Std`;
    return `vor ${Math.floor(seconds / 86400)} Tagen`;
  };

  // Handler: Work Order öffnen
  const handleOpenWorkOrder = (workOrderId: number) => {
    if (onOpenWorkOrder) {
      onOpenWorkOrder(workOrderId);
      onClose(); // Sidebar schließen nach Klick
    }
  };

  return (
    <div className="asset-hover-sidebar">
      <div className="asset-hover-sidebar-content">
        {/* Header */}
        <div className="asset-hover-sidebar-header">
          <div>
            <h3 className="asset-hover-sidebar-title">🛢️ {asset.name}</h3>
            <p className="asset-hover-sidebar-subtitle">
              {asset.type} • {asset.location}
            </p>
          </div>
          <button onClick={onClose} className="btn-sidebar-close">
            ✕
          </button>
        </div>

        {/* Status Badge */}
        <div style={{ marginBottom: "1.5rem" }}>
          <span
            className="asset-sidebar-status-badge"
            style={{
              borderColor: getStatusColor(asset.status),
              color: getStatusColor(asset.status),
            }}
          >
            {asset.status}
          </span>
        </div>

        {/* Stats Grid */}
        <div className="asset-sidebar-stats-grid">
          <div className="asset-sidebar-stat">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">📋 Gesamt</div>
          </div>
          <div className="asset-sidebar-stat">
            <div
              className="stat-value"
              style={{ color: stats.open > 0 ? "#f59e0b" : "#6b7280" }}
            >
              {stats.open}
            </div>
            <div className="stat-label">🔥 Offen</div>
          </div>
          <div className="asset-sidebar-stat">
            <div
              className="stat-value"
              style={{ color: stats.inProgress > 0 ? "#2563eb" : "#6b7280" }}
            >
              {stats.inProgress}
            </div>
            <div className="stat-label">🔧 In Arbeit</div>
          </div>
          <div className="asset-sidebar-stat">
            <div
              className="stat-value"
              style={{ color: stats.completed > 0 ? "#10b981" : "#6b7280" }}
            >
              {stats.completed}
            </div>
            <div className="stat-label">✅ Erledigt</div>
          </div>
        </div>

        {/* Work Orders Section */}
        <div className="asset-sidebar-section">
          <h4 className="asset-sidebar-section-title">📋 Letzte Work Orders</h4>

          {recentWorkOrders.length === 0 ? (
            <div className="asset-sidebar-empty">
              Keine Work Orders vorhanden
            </div>
          ) : (
            <div className="asset-sidebar-workorders">
              {recentWorkOrders.map((wo) => (
                <div
                  key={wo.id}
                  className="asset-sidebar-workorder"
                  onClick={() => handleOpenWorkOrder(wo.id)}
                >
                  <div className="wo-header">
                    <span className="wo-id">#{wo.id}</span>
                    <span className="wo-time">{getTimeAgo(wo.createdAt)}</span>
                  </div>

                  <div className="wo-title">
                    {getTypeIcon(wo.type)} {wo.title}
                  </div>

                  <div className="wo-footer">
                    <span className="wo-status">
                      {getStatusIcon(wo.status)} {wo.status}
                    </span>
                    <span
                      className="wo-priority"
                      style={{
                        color: getPriorityColor(wo.priority),
                        background: `${getPriorityColor(wo.priority)}15`,
                      }}
                    >
                      {wo.priority}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="asset-sidebar-footer">
          <span className="asset-sidebar-serial">
            SN: {asset.serialNumber || "N/A"}
          </span>
          <button className="btn-asset-sidebar-details">
            ⚙️ Details anzeigen
          </button>
        </div>
      </div>
    </div>
  );
}

export default AssetHoverSidebar;
