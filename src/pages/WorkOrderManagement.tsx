import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useData } from "../contexts/DataContext";
import { canAccessAsset } from "../utils/permissions";
import CreateWorkOrderModal from "../components/CreateWorkOrderModal";
import EditWorkOrderModal from "../components/EditWorkOrderModal";
import type { WorkOrder } from "../types";

function WorkOrderManagement() {
  const { currentUser } = useAuth();
  const { workOrders, updateWorkOrder, users } = useData();

  // Modal States
  const [selectedWO, setSelectedWO] = useState<WorkOrder | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingWO, setEditingWO] = useState<WorkOrder | null>(null);

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
        <CreateWorkOrderModal onClose={() => setShowCreateModal(false)} />
      )}

      {/* Edit Modal */}
      {editingWO && (
        <EditWorkOrderModal
          workOrder={editingWO}
          users={users}
          onClose={() => setEditingWO(null)}
          onUpdateWorkOrder={updateWorkOrder}
        />
      )}
    </div>
  );
}

export default WorkOrderManagement;
