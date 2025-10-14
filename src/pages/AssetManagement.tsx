import { useState, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useData } from "../contexts/DataContext";
import { filterAssetsForUser } from "../utils/permissions";
import EditAssetModal from "../components/EditAssetModal";
import AssetHoverSidebar from "../components/AssetHoverSidebar";
import type { Asset } from "../types";

function AssetManagement() {
  const { currentUser } = useAuth();
  const { assets, updateAsset, workOrders } = useData();
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [hoveredAsset, setHoveredAsset] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<"Alle" | Asset["status"]>(
    "Alle"
  );

  // Timeout Ref für verzögertes Schließen
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const visibleAssets = currentUser
    ? filterAssetsForUser(currentUser, assets)
    : [];

  const filteredAssets =
    filterStatus === "Alle"
      ? visibleAssets
      : visibleAssets.filter((a) => a.status === filterStatus);

  const getAssetStats = (assetId: number) => {
    const assetWOs = workOrders.filter((wo) => wo.assetId === assetId);
    return {
      total: assetWOs.length,
      open: assetWOs.filter(
        (wo) => wo.status !== "Erledigt" && wo.status !== "Abgebrochen"
      ).length,
      inProgress: assetWOs.filter((wo) => wo.status === "In Arbeit").length,
      completed: assetWOs.filter((wo) => wo.status === "Erledigt").length,
    };
  };

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

  const stats = {
    total: visibleAssets.length,
    operational: visibleAssets.filter((a) => a.status === "Betrieb").length,
    maintenance: visibleAssets.filter((a) => a.status === "Wartung").length,
    malfunction: visibleAssets.filter((a) => a.status === "Störung").length,
    shutdown: visibleAssets.filter((a) => a.status === "Stillstand").length,
  };

  // Handler mit Verzögerung
  const handleMouseEnter = (assetId: number) => {
    // Lösche ausstehenden Close-Timeout
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setHoveredAsset(assetId);
  };

  const handleMouseLeave = () => {
    // Verzögere das Schließen um 10s
    closeTimeoutRef.current = setTimeout(() => {
      setHoveredAsset(null);
    }, 10000);
  };

  const handleCloseSidebar = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    setHoveredAsset(null);
  };

  return (
    <div style={{ position: "relative" }}>
      {/* Main Content mit dynamischem Padding */}
      <div
        className="container"
        style={{
          paddingRight: hoveredAsset ? "420px" : "2rem",
          transition: "padding-right 0.3s ease",
        }}
      >
        <h1>🛢️ Anlagenverwaltung</h1>

        {/* Overview Statistics */}
        <div className="asset-overview">
          <div className="overview-card">
            <h3>Gesamt</h3>
            <p className="big-number">{stats.total}</p>
            <span>Anlagen</span>
          </div>
          <div className="overview-card operational">
            <h3>In Betrieb</h3>
            <p className="big-number">{stats.operational}</p>
            <span>Anlagen</span>
          </div>
          <div className="overview-card maintenance">
            <h3>Wartung</h3>
            <p className="big-number">{stats.maintenance}</p>
            <span>Anlagen</span>
          </div>
          <div className="overview-card malfunction">
            <h3>Störungen</h3>
            <p className="big-number">{stats.malfunction}</p>
            <span>Anlagen</span>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="asset-filter-buttons">
          <button
            className={`filter-btn ${filterStatus === "Alle" ? "active" : ""}`}
            onClick={() => setFilterStatus("Alle")}
          >
            📋 Alle ({stats.total})
          </button>
          <button
            className={`filter-btn ${
              filterStatus === "Betrieb" ? "active" : ""
            }`}
            onClick={() => setFilterStatus("Betrieb")}
          >
            ✅ Betrieb ({stats.operational})
          </button>
          <button
            className={`filter-btn ${
              filterStatus === "Wartung" ? "active" : ""
            }`}
            onClick={() => setFilterStatus("Wartung")}
          >
            🔧 Wartung ({stats.maintenance})
          </button>
          <button
            className={`filter-btn ${
              filterStatus === "Störung" ? "active" : ""
            }`}
            onClick={() => setFilterStatus("Störung")}
          >
            ⚠️ Störung ({stats.malfunction})
          </button>
          <button
            className={`filter-btn ${
              filterStatus === "Stillstand" ? "active" : ""
            }`}
            onClick={() => setFilterStatus("Stillstand")}
          >
            🛑 Stillstand ({stats.shutdown})
          </button>
        </div>

        {/* Table */}
        <div className="asset-table-container">
          <table className="asset-table">
            <thead>
              <tr>
                <th>Anlage</th>
                <th>Typ</th>
                <th>Standort</th>
                <th>Status</th>
                <th style={{ textAlign: "center" }}>📋 Gesamt</th>
                <th style={{ textAlign: "center" }}>🔥 Offen</th>
                <th style={{ textAlign: "center" }}>🔧 In Arbeit</th>
                <th style={{ textAlign: "center" }}>✅ Erledigt</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map((asset) => {
                const assetStats = getAssetStats(asset.id);
                const isHovered = hoveredAsset === asset.id;

                return (
                  <tr
                    key={asset.id}
                    onMouseEnter={() => handleMouseEnter(asset.id)}
                    onMouseLeave={handleMouseLeave}
                    className={`asset-table-row ${isHovered ? "hovered" : ""}`}
                    onClick={() => setEditingAsset(asset)}
                  >
                    <td className="asset-name-cell">
                      <strong>🛢️ {asset.name}</strong>
                    </td>
                    <td className="asset-type-cell">{asset.type}</td>
                    <td className="asset-location-cell">{asset.location}</td>
                    <td>
                      <span
                        className="asset-status"
                        style={{
                          background: `${getStatusColor(asset.status)}15`,
                          color: getStatusColor(asset.status),
                        }}
                      >
                        {asset.status}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span className="stat-number-cell">
                        {assetStats.total}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span
                        className="stat-number-cell"
                        style={{
                          color: assetStats.open > 0 ? "#f59e0b" : "#9ca3af",
                        }}
                      >
                        {assetStats.open}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span
                        className="stat-number-cell"
                        style={{
                          color:
                            assetStats.inProgress > 0 ? "#2563eb" : "#9ca3af",
                        }}
                      >
                        {assetStats.inProgress}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span
                        className="stat-number-cell"
                        style={{
                          color:
                            assetStats.completed > 0 ? "#10b981" : "#9ca3af",
                        }}
                      >
                        {assetStats.completed}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredAssets.length === 0 && (
            <div className="wo-empty">
              <p>Keine Anlagen gefunden mit dem Filter "{filterStatus}".</p>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Sidebar */}
      <AssetHoverSidebar assetId={hoveredAsset} onClose={handleCloseSidebar} />

      {/* Edit Modal */}
      {editingAsset && (
        <EditAssetModal
          asset={editingAsset}
          onClose={() => setEditingAsset(null)}
          onUpdateAsset={updateAsset}
        />
      )}
    </div>
  );
}

export default AssetManagement;
