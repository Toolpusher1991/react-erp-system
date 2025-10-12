import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useData } from "../contexts/DataContext";
import { filterAssetsForUser } from "../utils/permissions";
import EditAssetModal from "../components/EditAssetModal";
import type { Asset } from "../types";

function AssetManagement() {
  const { currentUser, permissions } = useAuth();
  const { assets, updateAsset } = useData();
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [filterStatus, setFilterStatus] = useState<"Alle" | Asset["status"]>(
    "Alle"
  );

  const visibleAssets = currentUser
    ? filterAssetsForUser(currentUser, assets)
    : [];

  // Nach Status filtern
  const filteredAssets =
    filterStatus === "Alle"
      ? visibleAssets
      : visibleAssets.filter((a) => a.status === filterStatus);

  const getStatusColor = (status: Asset["status"]) => {
    switch (status) {
      case "Betrieb":
        return "status-operational";
      case "Wartung":
        return "status-maintenance";
      case "Störung":
        return "status-malfunction";
      case "Stillstand":
        return "status-shutdown";
      default:
        return "";
    }
  };

  const getTypeIcon = (type: Asset["type"]) => {
    switch (type) {
      case "Bohranlage":
        return "🛢️";
      case "Motor":
        return "⚙️";
      case "Pumpe":
        return "💧";
      case "Bohrturm":
        return "🏗️";
      case "Generator":
        return "⚡";
      case "Kompressor":
        return "💨";
      default:
        return "🔧";
    }
  };

  // Statistiken
  const stats = {
    total: visibleAssets.length,
    operational: visibleAssets.filter((a) => a.status === "Betrieb").length,
    maintenance: visibleAssets.filter((a) => a.status === "Wartung").length,
    malfunction: visibleAssets.filter((a) => a.status === "Störung").length,
    shutdown: visibleAssets.filter((a) => a.status === "Stillstand").length,
  };

  return (
    <div className="container">
      <h1>🛢️ Anlagenverwaltung</h1>

      {/* Statistik-Übersicht */}
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

      {/* Filter-Buttons */}
      <div className="asset-filter-buttons">
        <button
          className={`filter-btn ${filterStatus === "Alle" ? "active" : ""}`}
          onClick={() => setFilterStatus("Alle")}
        >
          📋 Alle ({stats.total})
        </button>
        <button
          className={`filter-btn ${filterStatus === "Betrieb" ? "active" : ""}`}
          onClick={() => setFilterStatus("Betrieb")}
        >
          ✅ Betrieb ({stats.operational})
        </button>
        <button
          className={`filter-btn ${filterStatus === "Wartung" ? "active" : ""}`}
          onClick={() => setFilterStatus("Wartung")}
        >
          🔧 Wartung ({stats.maintenance})
        </button>
        <button
          className={`filter-btn ${filterStatus === "Störung" ? "active" : ""}`}
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

      {/* Tabelle */}
      <div className="asset-table-container">
        <table className="asset-table">
          <thead>
            <tr>
              <th>Icon</th>
              <th>Name</th>
              <th>Typ</th>
              <th>Status</th>
              <th>Standort</th>
              <th>Seriennummer</th>
              <th>Notizen</th>
              <th>Aktion</th>
            </tr>
          </thead>
          <tbody>
            {filteredAssets.map((asset) => (
              <tr key={asset.id} className="asset-table-row">
                <td className="asset-icon-cell">
                  <span className="asset-type-icon">
                    {getTypeIcon(asset.type)}
                  </span>
                </td>
                <td className="asset-name-cell">
                  <strong>{asset.name}</strong>
                </td>
                <td className="asset-type-cell">{asset.type}</td>
                <td>
                  <span
                    className={`asset-status ${getStatusColor(asset.status)}`}
                  >
                    {asset.status}
                  </span>
                </td>
                <td className="asset-location-cell">{asset.location}</td>
                <td className="asset-serial-cell">
                  {asset.serialNumber || "—"}
                </td>
                <td className="asset-notes-cell">
                  {asset.notes ? (
                    <span className="notes-preview" title={asset.notes}>
                      {asset.notes.length > 30
                        ? asset.notes.substring(0, 30) + "..."
                        : asset.notes}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="asset-action-cell">
                  <button
                    className="btn-edit-asset"
                    onClick={() => setEditingAsset(asset)}
                  >
                    ⚙️ Bearbeiten
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredAssets.length === 0 && (
          <div className="wo-empty">
            <p>Keine Anlagen gefunden mit dem Filter "{filterStatus}".</p>
          </div>
        )}
      </div>

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
