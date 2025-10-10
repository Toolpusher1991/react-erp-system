import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { canAccessAsset } from "../utils/permissions";
import CreateWorkOrderModal from "../components/CreateWorkOrderModal";
import EditWorkOrderModal from "../components/EditWorkOrderModal"; // ← NEU
import type { WorkOrder, Asset, User } from "../types"; // ← User hinzugefügt

function WorkOrderManagement() {
  const { currentUser } = useAuth();

  // Assets State
  const [assets] = useState<Asset[]>([
    {
      id: 1,
      name: "T207",
      type: "Bohranlage",
      status: "Betrieb",
      location: "Feld Nord",
      serialNumber: "BA-T207-2023",
      assignedUsers: [],
    },
    {
      id: 2,
      name: "T208",
      type: "Bohranlage",
      status: "Betrieb",
      location: "Feld Nord",
      serialNumber: "BA-T208-2023",
      assignedUsers: [],
    },
    {
      id: 3,
      name: "T700",
      type: "Bohranlage",
      status: "Wartung",
      location: "Feld Ost",
      serialNumber: "BA-T700-2022",
      assignedUsers: [],
    },
    {
      id: 4,
      name: "T46",
      type: "Bohranlage",
      status: "Betrieb",
      location: "Feld Süd",
      serialNumber: "BA-T46-2021",
      assignedUsers: [],
    },
  ]);

  // ========== NEU: Users für Zuweisung ==========
  const [users] = useState<User[]>([
    {
      id: 1,
      name: "Max Admin",
      email: "admin@erp.de",
      password: "admin123",
      role: "Admin",
      status: "Aktiv",
      assignedAssets: [],
    },
    {
      id: 2,
      name: "Anna E-Super",
      email: "esuper@erp.de",
      password: "es123",
      role: "E-Supervisor",
      status: "Aktiv",
      assignedAssets: [],
    },
    {
      id: 3,
      name: "Tom M-Super",
      email: "msuper@erp.de",
      password: "ms123",
      role: "M-Supervisor",
      status: "Aktiv",
      assignedAssets: [],
    },
    {
      id: 6,
      name: "Sarah RSC",
      email: "rsc@erp.de",
      password: "rsc123",
      role: "RSC",
      status: "Aktiv",
      assignedAssets: [],
    },
    {
      id: 10,
      name: "T207 Elektriker",
      email: "t207-el",
      password: "t207",
      role: "Elektriker",
      status: "Aktiv",
      assignedAssets: [1],
    },
    {
      id: 11,
      name: "T207 Mechaniker",
      email: "t207-mech",
      password: "t207",
      role: "Mechaniker",
      status: "Aktiv",
      assignedAssets: [1],
    },
    {
      id: 12,
      name: "T208 Elektriker",
      email: "t208-el",
      password: "t208",
      role: "Elektriker",
      status: "Aktiv",
      assignedAssets: [2],
    },
    {
      id: 13,
      name: "T208 Mechaniker",
      email: "t208-mech",
      password: "t208",
      role: "Mechaniker",
      status: "Aktiv",
      assignedAssets: [2],
    },
    {
      id: 14,
      name: "T700 Elektriker",
      email: "t700-el",
      password: "t700",
      role: "Elektriker",
      status: "Aktiv",
      assignedAssets: [3],
    },
    {
      id: 15,
      name: "T700 Mechaniker",
      email: "t700-mech",
      password: "t700",
      role: "Mechaniker",
      status: "Aktiv",
      assignedAssets: [3],
    },
    {
      id: 16,
      name: "T46 Elektriker",
      email: "t46-el",
      password: "t46",
      role: "Elektriker",
      status: "Aktiv",
      assignedAssets: [4],
    },
    {
      id: 17,
      name: "T46 Mechaniker",
      email: "t46-mech",
      password: "t46",
      role: "Mechaniker",
      status: "Aktiv",
      assignedAssets: [4],
    },
  ]);
  // ==============================================

  // Work Orders State
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([
    {
      id: 1,
      title: "Motor überhitzt",
      description:
        "Motor auf T207 läuft zu heiß, Kühlung prüfen. Temperatur steigt über 90°C. Sofortige Prüfung erforderlich.",
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
    },
    {
      id: 2,
      title: "Elektrischer Ausfall Pumpe",
      description:
        "Pumpe auf T208 reagiert nicht, Verkabelung prüfen. Sicherung mehrfach ausgelöst.",
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
    },
    {
      id: 3,
      title: "Hydraulikschlauch undicht",
      description:
        "Kleines Leck am Hydraulikschlauch, austauschen. Leichte Verschmutzung durch austretendes Öl.",
      assetId: 3,
      assetName: "T700",
      type: "Hydraulisch",
      priority: "Normal",
      status: "Neu",
      createdBy: 6,
      createdByName: "Sarah RSC",
      createdAt: "2025-10-10T11:30:00",
      updatedAt: "2025-10-10T11:30:00",
    },
  ]);

  // Modal States
  const [selectedWO, setSelectedWO] = useState<WorkOrder | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingWO, setEditingWO] = useState<WorkOrder | null>(null); // ← NEU

  // Filter State
  const [filterStatus, setFilterStatus] = useState<string>("Alle");
  const [filterPriority, setFilterPriority] = useState<string>("Alle");

  // Gefilterte Work Orders
  const visibleWorkOrders = currentUser
    ? workOrders.filter((wo) => canAccessAsset(currentUser, wo.assetId))
    : [];

  const filteredWorkOrders = visibleWorkOrders.filter((wo) => {
    const statusMatch = filterStatus === "Alle" || wo.status === filterStatus;
    const priorityMatch =
      filterPriority === "Alle" || wo.priority === filterPriority;
    return statusMatch && priorityMatch;
  });

  // Work Order Funktionen
  const handleCreateWorkOrder = (newWO: Omit<WorkOrder, "id">) => {
    const newId = Math.max(...workOrders.map((wo) => wo.id), 0) + 1;
    const workOrderWithId: WorkOrder = {
      ...newWO,
      id: newId,
    };
    setWorkOrders([...workOrders, workOrderWithId]);
  };

  // ========== NEU: Update Funktion ==========
  const handleUpdateWorkOrder = (updatedWO: WorkOrder) => {
    setWorkOrders(
      workOrders.map((wo) => (wo.id === updatedWO.id ? updatedWO : wo))
    );
  };
  // ==========================================

  // Style Funktionen
  const getPriorityColor = (priority: WorkOrder["priority"]) => {
    switch (priority) {
      case "Niedrig":
        return "priority-low";
      case "Normal":
        return "priority-normal";
      case "Hoch":
        return "priority-high";
      case "Kritisch":
        return "priority-critical";
      default:
        return "";
    }
  };

  const getStatusColor = (status: WorkOrder["status"]) => {
    switch (status) {
      case "Neu":
        return "wo-status-new";
      case "Zugewiesen":
        return "wo-status-assigned";
      case "In Arbeit":
        return "wo-status-progress";
      case "Erledigt":
        return "wo-status-completed";
      case "Abgebrochen":
        return "wo-status-cancelled";
      default:
        return "";
    }
  };

  const getTypeIcon = (type: WorkOrder["type"]) => {
    switch (type) {
      case "Mechanisch":
        return "🔧";
      case "Elektrisch":
        return "⚡";
      case "Hydraulisch":
        return "💧";
      default:
        return "🛠️";
    }
  };

  return (
    <div className="container">
      <div className="wo-header">
        <h1>🎫 Work Order Management</h1>
        <button
          className="btn-create-wo"
          onClick={() => setShowCreateModal(true)}
        >
          + Neuer Work Order
        </button>
      </div>

      {/* Statistiken */}
      <div className="wo-stats">
        <div className="stat-card">
          <h3>Gesamt</h3>
          <p className="stat-number">{visibleWorkOrders.length}</p>
        </div>
        <div className="stat-card new">
          <h3>Neu</h3>
          <p className="stat-number">
            {visibleWorkOrders.filter((wo) => wo.status === "Neu").length}
          </p>
        </div>
        <div className="stat-card progress">
          <h3>In Arbeit</h3>
          <p className="stat-number">
            {visibleWorkOrders.filter((wo) => wo.status === "In Arbeit").length}
          </p>
        </div>
        <div className="stat-card critical">
          <h3>Kritisch</h3>
          <p className="stat-number">
            {
              visibleWorkOrders.filter((wo) => wo.priority === "Kritisch")
                .length
            }
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="wo-filters">
        <div className="filter-group">
          <label>Status:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option>Alle</option>
            <option>Neu</option>
            <option>Zugewiesen</option>
            <option>In Arbeit</option>
            <option>Erledigt</option>
            <option>Abgebrochen</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Priorität:</label>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
          >
            <option>Alle</option>
            <option>Niedrig</option>
            <option>Normal</option>
            <option>Hoch</option>
            <option>Kritisch</option>
          </select>
        </div>
      </div>

      {/* Work Order Tabelle */}
      <div className="wo-table-container">
        <table className="wo-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Typ</th>
              <th>Titel</th>
              <th>Anlage</th>
              <th>Priorität</th>
              <th>Status</th>
              <th>Zugewiesen an</th>
              <th>Erstellt</th>
            </tr>
          </thead>
          <tbody>
            {filteredWorkOrders.map((wo) => (
              <tr
                key={wo.id}
                onClick={() => setSelectedWO(wo)}
                className="wo-table-row"
              >
                <td className="wo-id">#{wo.id}</td>
                <td className="wo-type-icon">{getTypeIcon(wo.type)}</td>
                <td className="wo-title-cell">
                  <strong>{wo.title}</strong>
                </td>
                <td>
                  <span className="wo-asset-badge">{wo.assetName}</span>
                </td>
                <td>
                  <span
                    className={`wo-priority ${getPriorityColor(wo.priority)}`}
                  >
                    {wo.priority}
                  </span>
                </td>
                <td>
                  <span className={`wo-status ${getStatusColor(wo.status)}`}>
                    {wo.status}
                  </span>
                </td>
                <td>{wo.assignedToName || "—"}</td>
                <td className="wo-date">
                  {new Date(wo.createdAt).toLocaleDateString("de-DE")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredWorkOrders.length === 0 && (
          <div className="wo-empty">
            <p>Keine Work Orders gefunden.</p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedWO && (
        <>
          <div
            className="wo-modal-overlay"
            onClick={() => setSelectedWO(null)}
          />
          <div className="wo-detail-modal">
            <div className="wo-detail-header">
              <div>
                <h2>
                  {getTypeIcon(selectedWO.type)} {selectedWO.title}
                </h2>
                <span className="wo-detail-id">
                  Work Order #{selectedWO.id}
                </span>
              </div>
              <button
                onClick={() => setSelectedWO(null)}
                className="btn-close-modal"
              >
                ✕
              </button>
            </div>

            <div className="wo-detail-body">
              <div className="wo-detail-badges">
                <span
                  className={`wo-priority ${getPriorityColor(
                    selectedWO.priority
                  )}`}
                >
                  {selectedWO.priority}
                </span>
                <span
                  className={`wo-status ${getStatusColor(selectedWO.status)}`}
                >
                  {selectedWO.status}
                </span>
              </div>

              <div className="wo-detail-section">
                <h3>Beschreibung</h3>
                <p>{selectedWO.description}</p>
              </div>

              <div className="wo-detail-grid">
                <div className="wo-detail-item">
                  <strong>Anlage</strong>
                  <span>{selectedWO.assetName}</span>
                </div>
                <div className="wo-detail-item">
                  <strong>Typ</strong>
                  <span>{selectedWO.type}</span>
                </div>
                <div className="wo-detail-item">
                  <strong>Erstellt von</strong>
                  <span>{selectedWO.createdByName}</span>
                </div>
                <div className="wo-detail-item">
                  <strong>Zugewiesen an</strong>
                  <span>
                    {selectedWO.assignedToName || "Noch nicht zugewiesen"}
                  </span>
                </div>
                <div className="wo-detail-item">
                  <strong>Erstellt am</strong>
                  <span>
                    {new Date(selectedWO.createdAt).toLocaleString("de-DE")}
                  </span>
                </div>
                <div className="wo-detail-item">
                  <strong>Aktualisiert am</strong>
                  <span>
                    {new Date(selectedWO.updatedAt).toLocaleString("de-DE")}
                  </span>
                </div>
              </div>
            </div>

            <div className="wo-detail-footer">
              {/* GEÄNDERT: onClick Handler */}
              <button
                className="btn-wo-edit"
                onClick={() => {
                  setEditingWO(selectedWO);
                  setSelectedWO(null);
                }}
              >
                Bearbeiten
              </button>
              <button
                className="btn-wo-close"
                onClick={() => setSelectedWO(null)}
              >
                Schließen
              </button>
            </div>
          </div>
        </>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateWorkOrderModal
          assets={assets}
          onClose={() => setShowCreateModal(false)}
          onCreateWorkOrder={handleCreateWorkOrder}
        />
      )}

      {/* ========== NEU: Edit Modal ========== */}
      {editingWO && (
        <EditWorkOrderModal
          workOrder={editingWO}
          users={users}
          onClose={() => setEditingWO(null)}
          onUpdateWorkOrder={handleUpdateWorkOrder}
        />
      )}
      {/* ===================================== */}
    </div>
  );
}

export default WorkOrderManagement;
