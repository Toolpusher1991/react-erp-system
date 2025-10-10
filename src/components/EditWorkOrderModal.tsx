import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import type { WorkOrder, User, MaterialStatus } from "../types";

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

  const [status, setStatus] = useState(workOrder.status);
  const [priority, setPriority] = useState(workOrder.priority);
  const [assignedTo, setAssignedTo] = useState<number | undefined>(
    workOrder.assignedTo
  );

  // ========== NEU: Material-States ==========
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
    const assignedUser = users.find((u) => u.id === assignedTo);

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

          {/* ========== NEU: Material-Management ========== */}
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
            Speichern
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
