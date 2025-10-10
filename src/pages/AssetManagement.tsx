import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { filterAssetsForUser } from "../utils/permissions";
import type { Asset } from "../types";

function AssetManagement() {
  // Hole currentUser aus AuthContext
  const { currentUser } = useAuth();

  // State: Liste aller Anlagen - START mit deinen 4 Bohranlagen
  const [assets] = useState<Asset[]>([
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
  ]);

  // Filtere Assets basierend auf User-Rechten
  const visibleAssets = currentUser
    ? filterAssetsForUser(currentUser, assets)
    : [];

  // Funktion: Status-Badge-Farbe basierend auf Status
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

  // Funktion: Emoji für Asset-Typ
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

  return (
    <div className="container">
      <h1>🛢️ Anlagenverwaltung</h1>

      {/* Übersicht Cards */}
      <div className="asset-overview">
        <div className="overview-card">
          <h3>Gesamt</h3>
          <p className="big-number">{visibleAssets.length}</p>
          <span>Anlagen</span>
        </div>
        <div className="overview-card operational">
          <h3>In Betrieb</h3>
          <p className="big-number">
            {visibleAssets.filter((a) => a.status === "Betrieb").length}
          </p>
          <span>Anlagen</span>
        </div>
        <div className="overview-card maintenance">
          <h3>Wartung</h3>
          <p className="big-number">
            {visibleAssets.filter((a) => a.status === "Wartung").length}
          </p>
          <span>Anlagen</span>
        </div>
        <div className="overview-card malfunction">
          <h3>Störungen</h3>
          <p className="big-number">
            {visibleAssets.filter((a) => a.status === "Störung").length}
          </p>
          <span>Anlagen</span>
        </div>
      </div>

      {/* Anlagen-Liste */}
      <div className="asset-grid">
        {visibleAssets.map((asset) => (
          <div key={asset.id} className="asset-card">
            <div className="asset-card-header">
              <h2>
                {getTypeIcon(asset.type)} {asset.name}
              </h2>
              <span className={`asset-status ${getStatusColor(asset.status)}`}>
                {asset.status}
              </span>
            </div>

            <div className="asset-card-body">
              <p>
                <strong>Typ:</strong> {asset.type}
              </p>
              <p>
                <strong>Standort:</strong> {asset.location}
              </p>
              {asset.serialNumber && (
                <p>
                  <strong>Seriennummer:</strong> {asset.serialNumber}
                </p>
              )}
              {asset.notes && (
                <p className="asset-notes">
                  <strong>Notizen:</strong> {asset.notes}
                </p>
              )}
            </div>

            <div className="asset-card-footer">
              <button className="btn-details">Details anzeigen</button>
            </div>
          </div>
        ))}
      </div>

      {/* Keine Anlagen Message */}
      {visibleAssets.length === 0 && (
        <div className="wo-empty">
          <p>Keine Anlagen zugewiesen oder verfügbar.</p>
        </div>
      )}
    </div>
  );
}

export default AssetManagement;
