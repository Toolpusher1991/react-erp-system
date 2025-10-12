import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useData } from "../contexts/DataContext";
import type {
  WorkOrder,
  User,
  MaterialStatus,
  WorkOrderComment,
} from "../types";

interface EditWorkOrderModalProps {
  workOrder: WorkOrder;
  users: User[];
  onClose: () => void;
  onUpdateWorkOrder: (workOrder: WorkOrder) => void;
}

function EditWorkOrderModal({
  workOrder,
  users,
  onClose,
  onUpdateWorkOrder,
}: EditWorkOrderModalProps) {
  const { currentUser, permissions } = useAuth();
  const { addComment, addNotification, notifications, comments } = useData();

  const [status, setStatus] = useState(workOrder.status);
  const [priority, setPriority] = useState(workOrder.priority);
  const [assignedTo, setAssignedTo] = useState<number | undefined>(
    workOrder.assignedTo
  );

  // Material-States
  const [materialRequired, setMaterialRequired] = useState(
    workOrder.materialRequired
  );
  const [materialStatus, setMaterialStatus] = useState(
    workOrder.materialStatus
  );
  const [materialNumber, setMaterialNumber] = useState(
    workOrder.materialNumber || ""
  );
  const [materialDescription, setMaterialDescription] = useState(
    workOrder.materialDescription || ""
  );

  // Nur Techniker zur Auswahl (Mechaniker, Elektriker)
  const availableUsers = users.filter(
    (u) => u.role === "Mechaniker" || u.role === "Elektriker"
  );

  const handleSave = () => {
    if (!currentUser) return;

    const assignedUser = users.find((u) => u.id === assignedTo);

    // ========== NOTIFICATION LOGIC ==========
    const notifyUsers: number[] = [];

    // 1. Status-Änderung: Benachrichtige Creator und Assigned User
    if (status !== workOrder.status) {
      if (workOrder.createdBy !== currentUser.id) {
        notifyUsers.push(workOrder.createdBy);
      }
      if (workOrder.assignedTo && workOrder.assignedTo !== currentUser.id) {
        notifyUsers.push(workOrder.assignedTo);
      }

      // Erstelle System-Kommentar für Status-Änderung
      const statusComment: WorkOrderComment = {
        id: Math.max(...comments.map((c) => c.id), 0) + 1,
        workOrderId: workOrder.id,
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        comment: "",
        timestamp: new Date().toISOString(),
        type: "status_change",
        oldValue: workOrder.status,
        newValue: status,
      };
      addComment(statusComment);

      // Erstelle Notifications
      [...new Set(notifyUsers)].forEach((userId) => {
        const notification = {
          id: Math.max(...notifications.map((n) => n.id), 0) + 1,
          userId,
          type: "status_change" as const,
          workOrderId: workOrder.id,
          workOrderTitle: workOrder.title,
          message: `${currentUser.name} hat Status geändert: ${workOrder.status} → ${status}`,
          createdAt: new Date().toISOString(),
          read: false,
          createdBy: currentUser.id,
          createdByName: currentUser.name,
        };
        addNotification(notification);
        console.log("🔔 Status-Change Notification erstellt für User:", userId);
      });
    }

    // 2. Assignment-Änderung: Benachrichtige neuen Assigned User
    if (assignedTo !== workOrder.assignedTo && assignedTo) {
      const newAssignedUser = users.find((u) => u.id === assignedTo);
      if (newAssignedUser) {
        // System-Kommentar für Assignment
        const assignmentComment: WorkOrderComment = {
          id: Math.max(...comments.map((c) => c.id), 0) + 1,
          workOrderId: workOrder.id,
          userId: currentUser.id,
          userName: currentUser.name,
          userRole: currentUser.role,
          comment: "",
          timestamp: new Date().toISOString(),
          type: "assignment",
          newValue: newAssignedUser.name,
        };
        addComment(assignmentComment);

        // Notification für neuen Assigned User
        if (assignedTo !== currentUser.id) {
          const notification = {
            id: Math.max(...notifications.map((n) => n.id), 0) + 1,
            userId: assignedTo,
            type: "assignment" as const,
            workOrderId: workOrder.id,
            workOrderTitle: workOrder.title,
            message: `${currentUser.name} hat dir diesen Work Order zugewiesen`,
            createdAt: new Date().toISOString(),
            read: false,
            createdBy: currentUser.id,
            createdByName: currentUser.name,
          };
          addNotification(notification);
          console.log(
            "🔔 Assignment Notification erstellt für User:",
            assignedTo
          );
        }
      }
    }

    // 3. Prioritäts-Änderung: Benachrichtige Creator und Assigned User
    if (priority !== workOrder.priority) {
      const notifyForPriority: number[] = [];
      if (workOrder.createdBy !== currentUser.id) {
        notifyForPriority.push(workOrder.createdBy);
      }
      if (workOrder.assignedTo && workOrder.assignedTo !== currentUser.id) {
        notifyForPriority.push(workOrder.assignedTo);
      }

      // System-Kommentar für Priorität
      const priorityComment: WorkOrderComment = {
        id: Math.max(...comments.map((c) => c.id), 0) + 1,
        workOrderId: workOrder.id,
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        comment: "",
        timestamp: new Date().toISOString(),
        type: "priority_change",
        oldValue: workOrder.priority,
        newValue: priority,
      };
      addComment(priorityComment);

      // Notifications
      [...new Set(notifyForPriority)].forEach((userId) => {
        const notification = {
          id: Math.max(...notifications.map((n) => n.id), 0) + 1,
          userId,
          type: "status_change" as const,
          workOrderId: workOrder.id,
          workOrderTitle: workOrder.title,
          message: `${currentUser.name} hat Priorität geändert: ${workOrder.priority} → ${priority}`,
          createdAt: new Date().toISOString(),
          read: false,
          createdBy: currentUser.id,
          createdByName: currentUser.name,
        };
        addNotification(notification);
        console.log(
          "🔔 Priority-Change Notification erstellt für User:",
          userId
        );
      });
    }

    // Update Work Order
    const updatedWO: WorkOrder = {
      ...workOrder,
      status,
      priority,
      assignedTo,
      assignedToName: assignedUser?.name,
      updatedAt: new Date().toISOString(),
      // Material-Updates
      materialRequired,
      materialStatus: materialRequired ? materialStatus : "Nicht benötigt",
      materialNumber: materialRequired ? materialNumber : undefined,
      materialDescription: materialRequired ? materialDescription : undefined,
    };

    onUpdateWorkOrder(updatedWO);
    onClose();
  };

  // Kann User zuweisen?
  const canAssign = permissions?.canAssignTickets || false;

  // Kann User Material-Status ändern? (RSC oder Admin)
  const canManageMaterial =
    currentUser?.role === "RSC" || currentUser?.role === "Admin";

  return (
    <>
      <div className="wo-modal-overlay" onClick={onClose} />
      <div className="wo-edit-modal">
        <div className="wo-edit-header">
          <h2>✏️ Work Order bearbeiten</h2>
          <button onClick={onClose} className="btn-close-modal">
            ✕
          </button>
        </div>

        <div className="wo-edit-body">
          <div className="wo-edit-info">
            <h3>{workOrder.title}</h3>
            <p>
              #{workOrder.id} • {workOrder.assetName}
            </p>
          </div>

          <div className="form-group">
            <label>Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
            >
              <option value="Neu">Neu</option>
              <option value="Zugewiesen">Zugewiesen</option>
              <option value="In Arbeit">In Arbeit</option>
              <option value="Erledigt">Erledigt</option>
              <option value="Abgebrochen">Abgebrochen</option>
            </select>
          </div>

          <div className="form-group">
            <label>Priorität</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
            >
              <option value="Niedrig">Niedrig</option>
              <option value="Normal">Normal</option>
              <option value="Hoch">Hoch</option>
              <option value="Kritisch">Kritisch</option>
            </select>
          </div>

          {canAssign && (
            <div className="form-group">
              <label>Zugewiesen an</label>
              <select
                value={assignedTo || ""}
                onChange={(e) =>
                  setAssignedTo(
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
              >
                <option value="">Nicht zugewiesen</option>
                {availableUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.role})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Material-Management */}
          <div
            className="form-group"
            style={{
              borderTop: "2px solid #e5e7eb",
              paddingTop: "1.5rem",
              marginTop: "1.5rem",
            }}
          >
            <label
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <input
                type="checkbox"
                checked={materialRequired}
                onChange={(e) => setMaterialRequired(e.target.checked)}
                style={{ width: "auto", margin: 0 }}
              />
              Material benötigt
            </label>
          </div>

          {materialRequired && (
            <>
              {canManageMaterial && (
                <div className="form-group">
                  <label>Material-Status (RSC)</label>
                  <select
                    value={materialStatus}
                    onChange={(e) =>
                      setMaterialStatus(e.target.value as MaterialStatus)
                    }
                  >
                    <option value="Benötigt">Benötigt</option>
                    <option value="Bestellt">Bestellt</option>
                    <option value="Geliefert">Geliefert</option>
                  </select>
                </div>
              )}

              <div className="form-group">
                <label>SAP-Materialnummer</label>
                <input
                  type="text"
                  placeholder="z.B. MAT-001-COOLER"
                  value={materialNumber}
                  onChange={(e) => setMaterialNumber(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Material-Beschreibung</label>
                <textarea
                  placeholder="z.B. Kühlmittel 20L für Motor"
                  value={materialDescription}
                  onChange={(e) => setMaterialDescription(e.target.value)}
                  rows={2}
                />
              </div>
            </>
          )}
        </div>

        <div className="wo-edit-footer">
          <button onClick={handleSave} className="btn-edit-save">
            💾 Speichern
          </button>
          <button onClick={onClose} className="btn-edit-cancel">
            Abbrechen
          </button>
        </div>
      </div>
    </>
  );
}

export default EditWorkOrderModal;
