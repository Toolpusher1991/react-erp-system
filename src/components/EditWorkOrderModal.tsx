import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useData } from "../contexts/DataContext";
import { getPermissionsForRole } from "../utils/permissions";
import CommentSection from "./CommentSection";
import type { WorkOrder, User, WorkOrderComment } from "../types";

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
  const { addComment, comments, addNotification, notifications } = useData();

  useEffect(() => {
    if (!workOrder) {
      console.error("EditWorkOrderModal: workOrder is undefined");
      onClose();
    }
  }, [workOrder, onClose]);

  const [status, setStatus] = useState(workOrder?.status || "Neu");
  const [priority, setPriority] = useState(workOrder?.priority || "Normal");
  const [assignedTo, setAssignedTo] = useState<number | undefined>(
    workOrder?.assignedTo
  );

  if (!workOrder) {
    return null;
  }

  const availableUsers = users.filter(
    (u) => u.role === "Mechaniker" || u.role === "Elektriker"
  );

  const handleSave = () => {
    if (!currentUser) return;

    const assignedUser = users.find((u) => u.id === assignedTo);

    // Erstelle automatische Kommentare bei Änderungen
    const newComments: WorkOrderComment[] = [];

    if (status !== workOrder.status) {
      newComments.push({
        id: Math.max(...comments.map((c) => c.id), 0) + 1 + newComments.length,
        workOrderId: workOrder.id,
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        comment: "",
        timestamp: new Date().toISOString(),
        type: "status_change",
        oldValue: workOrder.status,
        newValue: status,
      });
    }

    if (priority !== workOrder.priority) {
      newComments.push({
        id: Math.max(...comments.map((c) => c.id), 0) + 1 + newComments.length,
        workOrderId: workOrder.id,
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        comment: "",
        timestamp: new Date().toISOString(),
        type: "priority_change",
        oldValue: workOrder.priority,
        newValue: priority,
      });
    }

    if (assignedTo !== workOrder.assignedTo && assignedTo) {
      newComments.push({
        id: Math.max(...comments.map((c) => c.id), 0) + 1 + newComments.length,
        workOrderId: workOrder.id,
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        comment: "",
        timestamp: new Date().toISOString(),
        type: "assignment",
        oldValue: workOrder.assignedToName || "Niemand",
        newValue: assignedUser?.name || "Unbekannt",
      });
    }

    newComments.forEach((comment) => addComment(comment));

    // ========== NOTIFICATION LOGIK - VERBESSERT ==========

    // 1. Status-Änderung → Benachrichtige Techniker + Ersteller
    if (status !== workOrder.status) {
      const usersToNotify = new Set<number>();

      if (workOrder.assignedTo && workOrder.assignedTo !== currentUser.id) {
        usersToNotify.add(workOrder.assignedTo);
      }
      if (workOrder.createdBy !== currentUser.id) {
        usersToNotify.add(workOrder.createdBy);
      }

      usersToNotify.forEach((userId) => {
        const notification = {
          id: Math.max(...notifications.map((n) => n.id), 0) + 1,
          userId,
          type: "status_change" as const,
          workOrderId: workOrder.id,
          workOrderTitle: workOrder.title,
          message: `Status geändert: ${workOrder.status} → ${status}`,
          createdAt: new Date().toISOString(),
          read: false,
          createdBy: currentUser.id,
          createdByName: currentUser.name,
        };
        addNotification(notification);
      });
    }

    // 2. Priorität-Änderung → Benachrichtige Techniker + Ersteller
    if (priority !== workOrder.priority) {
      const usersToNotify = new Set<number>();

      if (workOrder.assignedTo && workOrder.assignedTo !== currentUser.id) {
        usersToNotify.add(workOrder.assignedTo);
      }
      if (workOrder.createdBy !== currentUser.id) {
        usersToNotify.add(workOrder.createdBy);
      }

      usersToNotify.forEach((userId) => {
        const notification = {
          id: Math.max(...notifications.map((n) => n.id), 0) + 1,
          userId,
          type: "status_change" as const,
          workOrderId: workOrder.id,
          workOrderTitle: workOrder.title,
          message: `Priorität geändert: ${workOrder.priority} → ${priority}`,
          createdAt: new Date().toISOString(),
          read: false,
          createdBy: currentUser.id,
          createdByName: currentUser.name,
        };
        addNotification(notification);
      });
    }

    // 3. Zuweisung → Benachrichtige NEU zugewiesenen Techniker + Ersteller
    if (assignedTo !== workOrder.assignedTo && assignedTo) {
      console.log("🔔 Erstelle Zuweisung-Notification für User:", assignedTo);

      // Benachrichtige den NEU zugewiesenen Techniker (nicht sich selbst)
      if (assignedTo !== currentUser.id) {
        const notification = {
          id: Math.max(...notifications.map((n) => n.id), 0) + 1,
          userId: assignedTo,
          type: "assignment" as const,
          workOrderId: workOrder.id,
          workOrderTitle: workOrder.title,
          message: `Dir wurde Work Order zugewiesen von ${currentUser.name}`,
          createdAt: new Date().toISOString(),
          read: false,
          createdBy: currentUser.id,
          createdByName: currentUser.name,
        };
        console.log("📧 Notification erstellt:", notification);
        addNotification(notification);
      }

      // Benachrichtige auch den Ersteller (falls nicht current user)
      if (
        workOrder.createdBy !== currentUser.id &&
        workOrder.createdBy !== assignedTo
      ) {
        const notification = {
          id: Math.max(...notifications.map((n) => n.id), 0) + 2,
          userId: workOrder.createdBy,
          type: "assignment" as const,
          workOrderId: workOrder.id,
          workOrderTitle: workOrder.title,
          message: `${assignedUser?.name} wurde Work Order zugewiesen`,
          createdAt: new Date().toISOString(),
          read: false,
          createdBy: currentUser.id,
          createdByName: currentUser.name,
        };
        addNotification(notification);
      }
    }

    const updatedWO: WorkOrder = {
      ...workOrder,
      status,
      priority,
      assignedTo,
      assignedToName: assignedUser?.name,
      updatedAt: new Date().toISOString(),
    };

    onUpdateWorkOrder(updatedWO);
    onClose();
  };

  const canAssign = permissions?.canAssignTickets || false;

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

          <div className="wo-edit-comments">
            <CommentSection workOrderId={workOrder.id} workOrder={workOrder} />
          </div>
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
