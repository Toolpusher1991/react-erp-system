// ==========================================
// EDIT ASSET MODAL COMPONENT
// ==========================================
// Bearbeite Asset-Status und Details

import { useState } from "react";
import type { Asset, AssetStatus } from "../types";

interface EditAssetModalProps {
  asset: Asset;
  onClose: () => void;
  onUpdateAsset: (asset: Asset) => void;
}

function EditAssetModal({
  asset,
  onClose,
  onUpdateAsset,
}: EditAssetModalProps) {
  const [status, setStatus] = useState<AssetStatus>(asset.status);
  const [notes, setNotes] = useState(asset.notes || "");

  const handleSave = () => {
    const updatedAsset: Asset = {
      ...asset,
      status,
      notes: notes.trim(),
    };

    onUpdateAsset(updatedAsset);
    onClose();
  };

  // Status-Badge-Farbe
  const getStatusColor = (status: AssetStatus) => {
    switch (status) {
      case "Betrieb":
        return "#10b981";
      case "Wartung":
        return "#f59e0b";
      case "Störung":
        return "#ef4444";
      case "Stillstand":
        return "#6b7280";
      default:
        return "#9ca3af";
    }
  };

  return (
    <>
      <div className="wo-modal-overlay" onClick={onClose} />
      <div className="asset-edit-modal">
        <div className="asset-edit-header">
          <h2>⚙️ Anlage bearbeiten</h2>
          <button onClick={onClose} className="btn-close-modal">
            ✕
          </button>
        </div>

        <div className="asset-edit-body">
          <div className="asset-edit-info">
            <h3>
              {asset.name} - {asset.type}
            </h3>
            <p>{asset.location}</p>
          </div>

          <div className="form-group">
            <label>Status *</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as AssetStatus)}
              style={{ borderColor: getStatusColor(status) }}
            >
              <option value="Betrieb">✅ Betrieb</option>
              <option value="Wartung">🔧 Wartung</option>
              <option value="Störung">⚠️ Störung</option>
              <option value="Stillstand">🛑 Stillstand</option>
            </select>
          </div>

          <div className="form-group">
            <label>Notizen</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Zusätzliche Informationen zur Anlage..."
              rows={4}
            />
          </div>

          <div className="asset-edit-details">
            <div className="asset-detail-item">
              <strong>Typ:</strong>
              <span>{asset.type}</span>
            </div>
            <div className="asset-detail-item">
              <strong>Standort:</strong>
              <span>{asset.location}</span>
            </div>
            {asset.serialNumber && (
              <div className="asset-detail-item">
                <strong>Seriennummer:</strong>
                <span>{asset.serialNumber}</span>
              </div>
            )}
          </div>
        </div>

        <div className="asset-edit-footer">
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

export default EditAssetModal;
