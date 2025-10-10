import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { filterAssetsForUser } from "../utils/permissions";
import type {
  Asset,
  WorkOrder,
  WorkOrderType,
  WorkOrderPriority,
} from "../types";

interface CreateWorkOrderModalProps {
  assets: Asset[];
  onClose: () => void;
  onCreateWorkOrder: (workOrder: Omit<WorkOrder, "id">) => void;
}

function CreateWorkOrderModal({
  assets,
  onClose,
  onCreateWorkOrder,
}: CreateWorkOrderModalProps) {
  const { currentUser } = useAuth();

  // Nur Anlagen zeigen, die der User sehen darf
  const visibleAssets = currentUser
    ? filterAssetsForUser(currentUser, assets)
    : [];

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assetId, setAssetId] = useState<number>(visibleAssets[0]?.id || 0);
  const [type, setType] = useState<WorkOrderType>("Mechanisch");
  const [priority, setPriority] = useState<WorkOrderPriority>("Normal");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validierung
    if (!title.trim()) {
      setError("Bitte einen Titel eingeben");
      return;
    }
    if (!description.trim()) {
      setError("Bitte eine Beschreibung eingeben");
      return;
    }
    if (!assetId) {
      setError("Bitte eine Anlage auswählen");
      return;
    }

    // Finde Asset Name
    const selectedAsset = assets.find((a) => a.id === assetId);
    if (!selectedAsset || !currentUser) return;

    // Erstelle neuen Work Order
    const newWorkOrder: Omit<WorkOrder, "id"> = {
      title: title.trim(),
      description: description.trim(),
      assetId,
      assetName: selectedAsset.name,
      type,
      priority,
      status: "Neu",
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onCreateWorkOrder(newWorkOrder);
    onClose();
  };

  return (
    <>
      <div className="wo-modal-overlay" onClick={onClose} />
      <div className="wo-create-modal">
        <div className="wo-create-header">
          <h2>🎫 Neuer Work Order</h2>
          <button onClick={onClose} className="btn-close-modal">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="wo-create-body">
            {error && <div className="create-error">{error}</div>}

            <div className="form-group">
              <label>Titel *</label>
              <input
                type="text"
                placeholder="z.B. Motor überhitzt"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label>Beschreibung *</label>
              <textarea
                placeholder="Detaillierte Beschreibung des Problems..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            <div className="form-group">
              <label>Anlage *</label>
              <select
                value={assetId}
                onChange={(e) => setAssetId(Number(e.target.value))}
              >
                {visibleAssets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name} - {asset.location}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Typ</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as WorkOrderType)}
                >
                  <option value="Mechanisch">🔧 Mechanisch</option>
                  <option value="Elektrisch">⚡ Elektrisch</option>
                  <option value="Hydraulisch">💧 Hydraulisch</option>
                  <option value="Sonstiges">🛠️ Sonstiges</option>
                </select>
              </div>

              <div className="form-group">
                <label>Priorität</label>
                <select
                  value={priority}
                  onChange={(e) =>
                    setPriority(e.target.value as WorkOrderPriority)
                  }
                >
                  <option value="Niedrig">Niedrig</option>
                  <option value="Normal">Normal</option>
                  <option value="Hoch">Hoch</option>
                  <option value="Kritisch">🚨 Kritisch</option>
                </select>
              </div>
            </div>
          </div>

          <div className="wo-create-footer">
            <button type="submit" className="btn-create-submit">
              Work Order erstellen
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-create-cancel"
            >
              Abbrechen
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

export default CreateWorkOrderModal;
