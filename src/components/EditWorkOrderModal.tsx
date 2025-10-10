import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useData } from "../contexts/DataContext"; // NEU!
import { getPermissionsForRole } from "../utils/permissions";
import CommentSection from "./CommentSection"; // NEU!
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
  const { addComment, comments } = useData(); // NEU!

  const [status, setStatus] = useState(workOrder.status);
  const [priority, setPriority] = useState(workOrder.priority);
  const [assignedTo, setAssignedTo] = useState<number | undefined>(
    workOrder.assignedTo
  );

  // Nur Techniker zur Auswahl (Mechaniker, Elektriker)
  const availableUsers = users.filter(
    (u) => u.role === "Mechaniker" || u.role === "Elektriker"
  );

  const handleSave = () => {
    if (!currentUser) return;

    const assignedUser = users.find((u) => u.id === assignedTo);

    // Erstelle automatische Kommentare bei Änderungen
    const newComments: WorkOrderComment[] = [];

    // Status geändert?
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

    // Priorität geändert?
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

    // Zuweisung geändert?
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

    // Füge alle neuen Kommentare hinzu
    newComments.forEach((comment) => addComment(comment));

    // Update Work Order
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

  // Kann User zuweisen?
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

          {/* NEU: Kommentar-Sektion */}
          <div className="wo-edit-comments">
            <CommentSection workOrderId={workOrder.id} />
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
