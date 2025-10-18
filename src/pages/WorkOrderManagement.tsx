// src/pages/WorkOrderManagement.tsx
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../components/ToastContainer";
import { canAccessAsset } from "../utils/permissions";
import {
  getWorkOrders,
  getAssets,
  getUsers,
  createWorkOrder,
  updateWorkOrder,
  deleteWorkOrder,
} from "../services/api";
import CreateWorkOrderModal from "../components/CreateWorkOrderModal";
import EditWorkOrderModal from "../components/EditWorkOrderModal";
import ConfirmationModal from "../components/ConfirmationModal";
import CommentSection from "../components/CommentSection";
import TaskList from "../components/TaskList";
import type { WorkOrder, Asset, WorkOrderComment, User } from "../types";

interface WorkOrderManagementProps {
  initialSelectedId?: number | null;
}

function WorkOrderManagement({ initialSelectedId }: WorkOrderManagementProps) {
  const { currentUser } = useAuth();

  // Backend state
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data from backend
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        console.log("📋 Loading Data from Backend...");

        const [workOrdersResult, assetsResult, usersResult] = await Promise.all(
          [getWorkOrders(), getAssets(), getUsers()]
        );

        if (workOrdersResult.data) {
          const data = workOrdersResult.data as any;
          setWorkOrders(data.workOrders || []);
          console.log("✅ Work Orders loaded:", data.workOrders?.length);
        }

        if (assetsResult.data) {
          const data = assetsResult.data as any;
          setAssets(data.assets || []);
          console.log("✅ Assets loaded:", data.assets?.length);
        }

        if (usersResult.data) {
          const data = usersResult.data as any;
          setUsers(data.users || []);
          console.log("✅ Users loaded:", data.users?.length);
        }
      } catch (error) {
        console.error("❌ Failed to load data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Local state (unchanged)
  const [comments] = useState<WorkOrderComment[]>([]);

  // Toast Hook
  const { showToast } = useToast();

  // States
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<
    "Allgemein" | "Im Betrieb" | "Einlagerung & Rig Moves"
  >("Allgemein");
  const [selectedWO, setSelectedWO] = useState<WorkOrder | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingWO, setEditingWO] = useState<WorkOrder | null>(null);

  // Confirmation Modal States
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState({
    title: "",
    message: "",
    type: "info" as "success" | "danger" | "warning" | "info",
  });

  // Sichtbare Assets für den User - Admin sieht alle
  const visibleAssets =
    currentUser?.role === "Admin"
      ? assets
      : assets.filter(
          (asset) =>
            currentUser?.assignedAssets?.includes(asset.id) ||
            currentUser?.assignedAssets?.length === 0
        );

  // Setze erste Anlage als Standard
  useEffect(() => {
    if (visibleAssets.length > 0 && selectedAssetId === null) {
      setSelectedAssetId(visibleAssets[0].id);
    }
  }, [visibleAssets, selectedAssetId]);

  // Öffne Work Order wenn über Notification geklickt
  useEffect(() => {
    if (initialSelectedId) {
      const wo = workOrders.find((w) => w.id === initialSelectedId);
      if (wo) {
        setSelectedWO(wo);
        setSelectedAssetId(wo.assetId);
      }
    }
  }, [initialSelectedId, workOrders]);

  // Gefilterte Work Orders für ausgewählte Anlage
  const assetWorkOrders = selectedAssetId
    ? workOrders.filter(
        (wo) =>
          wo.assetId === selectedAssetId &&
          canAccessAsset(currentUser!, wo.assetId)
      )
    : [];

  // Nach Kategorie filtern
  const filteredWorkOrders = assetWorkOrders.filter((wo) => {
    if (categoryFilter === "Allgemein") return true;
    return wo.category === categoryFilter;
  });

  // Statistiken für ausgewählte Anlage
  const stats = {
    total: assetWorkOrders.length,
    operating: assetWorkOrders.filter((wo) => wo.category === "Im Betrieb")
      .length,
    storage: assetWorkOrders.filter(
      (wo) => wo.category === "Einlagerung & Rig Moves"
    ).length,
    open: assetWorkOrders.filter(
      (wo) => wo.status !== "Erledigt" && wo.status !== "Abgebrochen"
    ).length,
  };

  const handleCreateWorkOrder = async (newWO: Omit<WorkOrder, "id">) => {
    try {
      console.log("📝 Creating Work Order:", newWO);

      const result = await createWorkOrder(newWO);

      if (result.data) {
        console.log("✅ Work Order created:", result.data);

        // Lade Work Orders neu vom Backend
        const workOrdersResult = await getWorkOrders();
        if (workOrdersResult.data) {
          const data = workOrdersResult.data as any;
          setWorkOrders(data.workOrders || []);
          showToast(`Work Order erfolgreich erstellt!`, "success");
        }
      } else {
        throw new Error(result.error || "Failed to create work order");
      }
    } catch (error) {
      console.error("❌ Failed to create work order:", error);
      showToast("Fehler beim Erstellen des Work Orders", "error");
    }
  };

  // ========== UPDATE FUNKTION ==========
  const handleUpdateWorkOrder = async (updatedWO: WorkOrder) => {
    try {
      console.log("📝 Updating Work Order:", updatedWO);

      const result = await updateWorkOrder(updatedWO.id, updatedWO);

      if (result.data) {
        console.log("✅ Work Order updated:", result.data);

        // Lade Work Orders neu vom Backend
        const workOrdersResult = await getWorkOrders();
        if (workOrdersResult.data) {
          const data = workOrdersResult.data as any;
          setWorkOrders(data.workOrders || []);
          showToast(`Work Order erfolgreich aktualisiert!`, "success");
          setEditingWO(null);
        }
      } else {
        throw new Error(result.error || "Failed to update work order");
      }
    } catch (error) {
      console.error("❌ Failed to update work order:", error);
      showToast("Fehler beim Aktualisieren des Work Orders", "error");
    }
  };

  // ========== LÖSCHEN FUNKTION ==========
  const handleDeleteWorkOrder = () => {
    if (!selectedWO || !currentUser) return;

    // Nur Admin und Supervisors dürfen löschen
    const canDelete =
      currentUser.role === "Admin" ||
      currentUser.role === "E-Supervisor" ||
      currentUser.role === "M-Supervisor";

    if (!canDelete) {
      showToast("Du hast keine Berechtigung Work Orders zu löschen!", "error");
      return;
    }

    // Zeige Confirmation Modal
    setConfirmMessage({
      title: "Work Order wirklich löschen?",
      message: `Work Order #${selectedWO.id} "${selectedWO.title}" wird unwiderruflich gelöscht. Diese Aktion kann nicht rückgängig gemacht werden!`,
      type: "danger",
    });
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!selectedWO || !currentUser) return;

    try {
      const woId = selectedWO.id;

      // Lösche Work Order über Backend API
      const result = await deleteWorkOrder(selectedWO.id);

      if (result.data) {
        // Lade Work Orders neu vom Backend
        const workOrdersResult = await getWorkOrders();
        if (workOrdersResult.data) {
          const data = workOrdersResult.data as any;
          setWorkOrders(data.workOrders || []);
        }

        showToast(`Work Order #${woId} wurde erfolgreich gelöscht!`, "success");
        setSelectedWO(null);
        setShowDeleteConfirm(false);
      } else {
        throw new Error(result.error || "Failed to delete work order");
      }
    } catch (error) {
      console.error("❌ Failed to delete work order:", error);
      showToast("Fehler beim Löschen des Work Orders", "error");
    }
  };

  // ========== FERTIGSTELLEN FUNKTION ==========
  const handleCompleteWorkOrder = () => {
    if (!selectedWO || !currentUser) return;

    const hasTasks = selectedWO.tasks && selectedWO.tasks.length > 0;
    const allTasksCompleted =
      !hasTasks || selectedWO.tasks!.every((t) => t.completed);

    // Validation: Prüfe ob alle Tasks erledigt sind
    if (hasTasks && !allTasksCompleted) {
      const openTasks = selectedWO.tasks!.filter((t) => !t.completed);
      showToast(
        `Noch ${openTasks.length} Aufgabe(n) offen! Bitte alle Tasks abhaken.`,
        "warning"
      );
      return;
    }

    // Zeige Confirmation Modal
    setConfirmMessage({
      title: "Work Order fertigstellen?",
      message: `Work Order #${selectedWO.id} "${selectedWO.title}" wird als erledigt markiert und alle Aufgaben werden als abgeschlossen gekennzeichnet.`,
      type: "success",
    });
    setShowCompleteConfirm(true);
  };

  const confirmComplete = async () => {
    if (!selectedWO || !currentUser) return;

    try {
      // Update Status auf "Erledigt"
      const updatedWO: WorkOrder = {
        ...selectedWO,
        status: "Erledigt",
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Sende Update ans Backend
      const result = await updateWorkOrder(selectedWO.id, updatedWO);

      if (result.data) {
        // Lade Work Orders neu vom Backend
        const workOrdersResult = await getWorkOrders();
        if (workOrdersResult.data) {
          const data = workOrdersResult.data as any;
          setWorkOrders(data.workOrders || []);
        }

        showToast(
          `Work Order #${selectedWO.id} erfolgreich fertiggestellt!`,
          "success"
        );
        setSelectedWO(null);
        setShowCompleteConfirm(false);
      } else {
        throw new Error(result.error || "Failed to complete work order");
      }
    } catch (error) {
      console.error("❌ Failed to complete work order:", error);
      showToast("Fehler beim Fertigstellen des Work Orders", "error");
    }
  };

  // Asset Icon
  const getAssetIcon = (asset: Asset) => {
    return "🛢️";
  };

  // Status Color
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

  const getMaterialStatusColor = (status: WorkOrder["materialStatus"]) => {
    switch (status) {
      case "Nicht benötigt":
        return "material-not-required";
      case "Benötigt":
        return "material-required";
      case "Bestellt":
        return "material-ordered";
      case "Geliefert":
        return "material-delivered";
      default:
        return "";
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="container">
        <div className="wo-header">
          <h1>🎫 Work Order Management</h1>
        </div>
        <div style={{ textAlign: "center", padding: "50px" }}>
          <div>⏳ Lade Work Orders vom Backend...</div>
          <div style={{ marginTop: "10px", fontSize: "14px", color: "#666" }}>
            Verbinde mit http://localhost:3001/api/workorders
          </div>
        </div>
      </div>
    );
  }

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

      {/* ========== ANLAGEN-TABS ========== */}
      <div className="asset-tabs">
        {visibleAssets.map((asset) => (
          <button
            key={asset.id}
            className={`asset-tab ${
              selectedAssetId === asset.id ? "active" : ""
            }`}
            onClick={() => setSelectedAssetId(asset.id)}
          >
            <span className="asset-tab-icon">{getAssetIcon(asset)}</span>
            <span className="asset-tab-name">{asset.name}</span>
            <span className="asset-tab-count">
              {
                workOrders.filter(
                  (wo) =>
                    wo.assetId === asset.id &&
                    wo.status !== "Erledigt" &&
                    wo.status !== "Abgebrochen"
                ).length
              }
            </span>
          </button>
        ))}
      </div>

      {selectedAssetId && (
        <>
          {/* Statistiken für ausgewählte Anlage */}
          <div className="wo-stats">
            <div className="stat-card">
              <h3>Gesamt</h3>
              <p className="stat-number">{stats.total}</p>
            </div>
            <div className="stat-card">
              <h3>Im Betrieb</h3>
              <p className="stat-number">{stats.operating}</p>
            </div>
            <div className="stat-card">
              <h3>Einlagerung & Rig Moves</h3>
              <p className="stat-number">{stats.storage}</p>
            </div>
            <div className="stat-card">
              <h3>Offen</h3>
              <p className="stat-number">{stats.open}</p>
            </div>
          </div>

          {/* ========== KATEGORIE-FILTER ========== */}
          <div className="category-tabs">
            <button
              className={`category-tab ${
                categoryFilter === "Allgemein" ? "active" : ""
              }`}
              onClick={() => setCategoryFilter("Allgemein")}
            >
              📋 Allgemein
              <span className="category-count">{assetWorkOrders.length}</span>
            </button>
            <button
              className={`category-tab ${
                categoryFilter === "Im Betrieb" ? "active" : ""
              }`}
              onClick={() => setCategoryFilter("Im Betrieb")}
            >
              🛢️ Im Betrieb
              <span className="category-count">{stats.operating}</span>
            </button>
            <button
              className={`category-tab ${
                categoryFilter === "Einlagerung & Rig Moves" ? "active" : ""
              }`}
              onClick={() => setCategoryFilter("Einlagerung & Rig Moves")}
            >
              🚚 Einlagerung & Rig Moves
              <span className="category-count">{stats.storage}</span>
            </button>
          </div>

          {/* Work Order Liste */}
          <div className="wo-table-container">
            <table className="wo-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Typ</th>
                  <th>Titel</th>
                  <th>Priorität</th>
                  <th>Status</th>
                  <th>Material</th>
                  <th>Zugewiesen</th>
                  <th>Erstellt</th>
                </tr>
              </thead>
              <tbody>
                {filteredWorkOrders.map((wo) => (
                  <tr
                    key={wo.id}
                    onClick={() => setSelectedWO(wo)}
                    className={`wo-table-row ${
                      wo.status === "Erledigt" ? "wo-row-completed" : ""
                    }`}
                    style={{
                      textDecoration:
                        wo.status === "Erledigt" ? "line-through" : "none",
                      opacity: wo.status === "Erledigt" ? 0.6 : 1,
                    }}
                  >
                    <td className="wo-id">#{wo.id}</td>
                    <td className="wo-type-icon">{getTypeIcon(wo.type)}</td>
                    <td className="wo-title-cell">
                      <strong>{wo.title}</strong>
                    </td>
                    <td>
                      <span
                        className={`wo-priority ${getPriorityColor(
                          wo.priority
                        )}`}
                      >
                        {wo.priority}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`wo-status ${getStatusColor(wo.status)}`}
                      >
                        {wo.status === "Erledigt" && "✓ "}
                        {wo.status}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`material-status ${getMaterialStatusColor(
                          wo.materialStatus
                        )}`}
                      >
                        {wo.materialRequired ? "📦" : "—"}
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
                <p>Keine Work Orders in dieser Kategorie.</p>
              </div>
            )}
          </div>
        </>
      )}

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
                  Work Order #{selectedWO.id} • {selectedWO.assetName}
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
                <span className="wo-category-badge">
                  {selectedWO.category === "Im Betrieb"
                    ? "🛢️ Im Betrieb"
                    : "🚚 Einlagerung & Rig Moves"}
                </span>
              </div>

              <div className="wo-detail-section">
                <h3>📝 Beschreibung</h3>
                <p>{selectedWO.description}</p>
              </div>

              {selectedWO.materialRequired && (
                <div className="wo-detail-section">
                  <h3>📦 Material-Informationen</h3>
                  <div className="wo-detail-grid">
                    <div className="wo-detail-item">
                      <strong>Materialnummer</strong>
                      <span>{selectedWO.materialNumber || "—"}</span>
                    </div>
                    <div className="wo-detail-item">
                      <strong>Beschreibung</strong>
                      <span>{selectedWO.materialDescription || "—"}</span>
                    </div>
                    <div className="wo-detail-item">
                      <strong>Status</strong>
                      <span
                        className={`material-status ${getMaterialStatusColor(
                          selectedWO.materialStatus
                        )}`}
                      >
                        {selectedWO.materialStatus || "Nicht benötigt"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {selectedWO.sapInformation && (
                <div className="wo-detail-section">
                  <h3>🗂️ SAP Information</h3>
                  <div
                    style={{
                      background: "#f9fafb",
                      padding: "1rem",
                      borderRadius: "8px",
                      fontFamily: "monospace",
                      fontSize: "0.875rem",
                    }}
                  >
                    {selectedWO.sapInformation.split("\n").map((line, i) => (
                      <div key={i}>{line}</div>
                    ))}
                  </div>
                </div>
              )}

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
                  <strong>Kategorie</strong>
                  <span>{selectedWO.category}</span>
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
              </div>

              {/* ========== TASKS SECTION ========== */}
              {selectedWO.tasks && selectedWO.tasks.length > 0 && (
                <div className="wo-detail-section">
                  <h3>📋 Aufgaben</h3>
                  <TaskList
                    tasks={selectedWO.tasks}
                    onUpdateTasks={(updatedTasks) => {
                      const updated = { ...selectedWO, tasks: updatedTasks };
                      // TODO: Backend API für Task Update
                      setSelectedWO(updated);
                      showToast(
                        "Task Update noch nicht im Backend gespeichert",
                        "warning"
                      );
                    }}
                    readOnly={selectedWO.status === "Erledigt"}
                  />
                </div>
              )}

              <div className="wo-detail-section">
                <CommentSection
                  workOrderId={selectedWO.id}
                  workOrder={selectedWO}
                />
              </div>
            </div>

            <div className="wo-detail-footer">
              {/* ========== FERTIGSTELLEN BUTTON ========== */}
              {selectedWO.status !== "Erledigt" &&
                selectedWO.status !== "Abgebrochen" && (
                  <button
                    className="btn-wo-complete"
                    onClick={handleCompleteWorkOrder}
                  >
                    ✅ Fertigstellen
                  </button>
                )}

              <button
                className="btn-wo-edit"
                onClick={() => {
                  setEditingWO(selectedWO);
                  setSelectedWO(null);
                }}
              >
                ✏️ Bearbeiten
              </button>

              <button className="btn-wo-delete" onClick={handleDeleteWorkOrder}>
                🗑️ Löschen
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

      {showCreateModal && (
        <CreateWorkOrderModal
          assets={assets}
          users={users}
          onClose={() => setShowCreateModal(false)}
          onCreateWorkOrder={handleCreateWorkOrder}
        />
      )}

      {editingWO && (
        <EditWorkOrderModal
          workOrder={editingWO}
          users={users}
          onClose={() => setEditingWO(null)}
          onUpdateWorkOrder={handleUpdateWorkOrder}
        />
      )}

      {/* ========== CONFIRMATION MODALS ========== */}
      {showCompleteConfirm && (
        <ConfirmationModal
          title={confirmMessage.title}
          message={confirmMessage.message}
          type={confirmMessage.type}
          confirmText="Ja, fertigstellen"
          cancelText="Abbrechen"
          onConfirm={confirmComplete}
          onCancel={() => setShowCompleteConfirm(false)}
        />
      )}

      {showDeleteConfirm && (
        <ConfirmationModal
          title={confirmMessage.title}
          message={confirmMessage.message}
          type={confirmMessage.type}
          confirmText="Ja, löschen"
          cancelText="Abbrechen"
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
}

export default WorkOrderManagement;
