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
  const { addNotification, notifications, addComment, comments } = useData();

  const [status, setStatus] = useState(workOrder.status);
  const [priority, setPriority] = useState(workOrder.priority);
  const [assignedTo, setAssignedTo] = useState<number | undefined>(
    workOrder.assignedTo
  );
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

  const availableUsers = users.filter(
    (u) => u.role === "Mechaniker" || u.role === "Elektriker"
  );

  const handleSave = () => {
    console.log("🔵 SAVE BUTTON CLICKED");

    if (!currentUser) {
      console.error("❌ Kein currentUser!");
      return;
    }

    console.log("🔵 Current User:", currentUser.name);

    const assignedUser = users.find((u) => u.id === assignedTo);
    const oldStatus = workOrder.status;
    const oldPriority = workOrder.priority;
    const oldAssignedTo = workOrder.assignedTo;

    console.log("🔵 Old vs New:");
    console.log("  Status:", oldStatus, "→", status);
    console.log("  Priority:", oldPriority, "→", priority);
    console.log("  Assigned:", oldAssignedTo, "→", assignedTo);

    const updatedWO: WorkOrder = {
      ...workOrder,
      status,
      priority,
      assignedTo,
      assignedToName: assignedUser?.name,
      updatedAt: new Date().toISOString(),
      materialRequired,
      materialStatus: materialRequired ? materialStatus : "Nicht benötigt",
      materialNumber: materialRequired ? materialNumber : undefined,
      materialDescription: materialRequired ? materialDescription : undefined,
    };

    onUpdateWorkOrder(updatedWO);
    console.log("✅ Work Order updated");

    // ========== NOTIFICATIONS & COMMENTS ==========

    // 1. STATUS GEÄNDERT
    if (oldStatus !== status) {
      console.log("🟢 Status wurde geändert!");

      const statusComment: WorkOrderComment = {
        id: Math.max(0, ...comments.map((c) => c.id)) + 1,
        workOrderId: workOrder.id,
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        comment: `Status geändert: ${oldStatus} → ${status}`,
        timestamp: new Date().toISOString(),
        type: "status_change",
        oldValue: oldStatus,
        newValue: status,
      };

      console.log("📝 Creating status comment:", statusComment);
      addComment(statusComment);

      const notifyUsers: number[] = [];
      if (workOrder.assignedTo && workOrder.assignedTo !== currentUser.id) {
        notifyUsers.push(workOrder.assignedTo);
      }
      if (
        workOrder.createdBy !== currentUser.id &&
        !notifyUsers.includes(workOrder.createdBy)
      ) {
        notifyUsers.push(workOrder.createdBy);
      }

      console.log("📬 Notifying users:", notifyUsers);

      notifyUsers.forEach((userId) => {
        const notification = {
          id: Math.max(0, ...notifications.map((n) => n.id)) + 1,
          userId,
          type: "status_change" as const,
          workOrderId: workOrder.id,
          workOrderTitle: workOrder.title,
          message: `${currentUser.name} hat den Status auf "${status}" geändert`,
          createdAt: new Date().toISOString(),
          read: false,
          createdBy: currentUser.id,
          createdByName: currentUser.name,
        };
        console.log("📨 Creating notification:", notification);
        addNotification(notification);
      });
    }

    // 2. PRIORITÄT GEÄNDERT
    if (oldPriority !== priority) {
      console.log("🟡 Priorität wurde geändert!");

      const priorityComment: WorkOrderComment = {
        id: Math.max(0, ...comments.map((c) => c.id)) + 1,
        workOrderId: workOrder.id,
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        comment: `Priorität geändert: ${oldPriority} → ${priority}`,
        timestamp: new Date().toISOString(),
        type: "priority_change",
        oldValue: oldPriority,
        newValue: priority,
      };

      console.log("📝 Creating priority comment:", priorityComment);
      addComment(priorityComment);
    }

    // 3. ZUWEISUNG GEÄNDERT
    if (oldAssignedTo !== assignedTo) {
      console.log("🟣 Zuweisung wurde geändert!");

      const assignedUserName = assignedUser?.name || "Niemand";

      const assignmentComment: WorkOrderComment = {
        id: Math.max(0, ...comments.map((c) => c.id)) + 1,
        workOrderId: workOrder.id,
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        comment: `Zugewiesen an: ${assignedUserName}`,
        timestamp: new Date().toISOString(),
        type: "assignment",
        newValue: assignedUserName,
      };

      console.log("📝 Creating assignment comment:", assignmentComment);
      addComment(assignmentComment);

      if (assignedTo && assignedTo !== currentUser.id) {
        const notification = {
          id: Math.max(0, ...notifications.map((n) => n.id)) + 1,
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

        console.log("📨 Creating assignment notification:", notification);
        addNotification(notification);
      }
    }

    console.log("✅ All notifications and comments created!");
    onClose();
  };

  const canAssign = permissions?.canAssignTickets || false;
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
