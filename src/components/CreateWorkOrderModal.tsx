import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useData } from "../contexts/DataContext";
import { filterAssetsForUser } from "../utils/permissions";
import TaskList from "./TaskList";
import type {
  Asset,
  WorkOrder,
  WorkOrderType,
  WorkOrderCategory,
  WorkOrderPriority,
  WorkOrderTask,
  User,
} from "../types";

interface CreateWorkOrderModalProps {
  assets: Asset[];
  users: User[];
  onClose: () => void;
  onCreateWorkOrder: (workOrder: Omit<WorkOrder, "id">) => void;
}

function CreateWorkOrderModal({
  assets,
  users,
  onClose,
  onCreateWorkOrder,
}: CreateWorkOrderModalProps) {
  const { currentUser } = useAuth();
  const { addNotification, notifications } = useData();

  // Nur Anlagen zeigen, die der User sehen darf
  const visibleAssets = currentUser
    ? filterAssetsForUser(currentUser, assets)
    : [];

  // Nur Techniker zur Auswahl (Mechaniker, Elektriker)
  const availableUsers = users.filter(
    (u) => u.role === "Mechaniker" || u.role === "Elektriker"
  );

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assetId, setAssetId] = useState<number>(visibleAssets[0]?.id || 0);
  const [type, setType] = useState<WorkOrderType>("Mechanisch");
  const [category, setCategory] = useState<WorkOrderCategory>("Im Betrieb");
  const [priority, setPriority] = useState<WorkOrderPriority>("Normal");
  const [assignedTo, setAssignedTo] = useState<number | undefined>(undefined);
  const [error, setError] = useState("");
  const [tasks, setTasks] = useState<WorkOrderTask[]>([]);

  // Material-Felder
  const [materialRequired, setMaterialRequired] = useState(false);
  const [materialNumber, setMaterialNumber] = useState("");
  const [materialDescription, setMaterialDescription] = useState("");

  // Bilder-State
  const [images, setImages] = useState<string[]>([]);

  // Funktion: Bild hochladen und in Base64 konvertieren
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      // Max 5 Bilder
      if (images.length >= 5) {
        setError("Maximal 5 Bilder erlaubt");
        return;
      }

      // Nur Bilder erlauben
      if (!file.type.startsWith("image/")) {
        setError("Nur Bilddateien erlaubt");
        return;
      }

      // Max 5MB pro Bild
      if (file.size > 5 * 1024 * 1024) {
        setError("Bild zu groß (max 5MB)");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImages((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

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

    // Material-Validierung
    if (materialRequired && !materialDescription.trim()) {
      setError(
        "Bitte Material-Beschreibung eingeben wenn Material benötigt wird"
      );
      return;
    }

    // Finde Asset Name
    const selectedAsset = assets.find((a) => a.id === assetId);
    if (!selectedAsset || !currentUser) return;

    // Finde zugewiesenen User
    const assignedUser = assignedTo
      ? users.find((u) => u.id === assignedTo)
      : undefined;

    // Erstelle neuen Work Order
    const newWorkOrder: Omit<WorkOrder, "id"> = {
      title: title.trim(),
      description: description.trim(),
      assetId,
      assetName: selectedAsset.name,
      type,
      category,
      priority,
      status: assignedTo ? "Zugewiesen" : "Neu",
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      assignedTo,
      assignedToName: assignedUser?.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // Material-Felder
      materialRequired,
      materialStatus: materialRequired ? "Benötigt" : "Nicht benötigt",
      materialNumber: materialRequired ? materialNumber.trim() : undefined,
      materialDescription: materialRequired
        ? materialDescription.trim()
        : undefined,
      // Bilder
      images: images.length > 0 ? images : undefined,
      tasks: tasks.length > 0 ? tasks : undefined, // Tasks hinzufügen
    };

    // ========== NOTIFICATION: Assignment bei Erstellung ==========
    if (assignedTo && assignedTo !== currentUser.id) {
      // Wir können hier noch keine ID haben, da der WO noch nicht erstellt wurde
      // Daher müssen wir das in der Parent-Komponente machen
      // Aber wir markieren es hier
      console.log(
        "🔔 WO wird mit Assignment erstellt - Notification sollte folgen"
      );
    }

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

            {/* Kategorie - Wann durchführbar? */}
            <div className="form-group">
              <label>Durchführung möglich während</label>
              <select
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as WorkOrderCategory)
                }
              >
                <option value="Im Betrieb">🛢️ Im Betrieb - Anlage läuft</option>
                <option value="Einlagerung & Rig Moves">
                  🚚 Einlagerung & Rig Moves - Stillstand
                </option>
              </select>
            </div>

            {/* Zuweisung direkt beim Erstellen */}
            <div className="form-group">
              <label>Zuweisen an (optional)</label>
              <select
                value={assignedTo || ""}
                onChange={(e) =>
                  setAssignedTo(
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
              >
                <option value="">Noch nicht zuweisen</option>
                {availableUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Tasks */}
            <div className="form-group">
              <h3 style={{ marginTop: "2rem", marginBottom: "1rem" }}>
                📋 Aufgaben (optional)
              </h3>
              <TaskList tasks={tasks} onUpdateTasks={setTasks} />
            </div>

            {/* Material-Management */}
            <div className="form-group">
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
                <div className="form-group">
                  <label>SAP-Materialnummer (optional)</label>
                  <input
                    type="text"
                    placeholder="z.B. MAT-001-COOLER"
                    value={materialNumber}
                    onChange={(e) => setMaterialNumber(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Material-Beschreibung *</label>
                  <textarea
                    placeholder="z.B. Kühlmittel 20L für Motor"
                    value={materialDescription}
                    onChange={(e) => setMaterialDescription(e.target.value)}
                    rows={2}
                  />
                </div>
              </>
            )}

            {/* Bild-Upload */}
            <div className="form-group">
              <label>📷 Bilder hinzufügen (max 5, je max 5MB)</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                style={{ padding: "0.5rem" }}
              />
              {images.length > 0 && (
                <div className="image-preview-container">
                  {images.map((img, index) => (
                    <div key={index} className="image-preview">
                      <img src={img} alt={`Preview ${index + 1}`} />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="btn-remove-image"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="wo-create-footer">
            <button type="submit" className="btn-create-submit">
              ✅ Work Order erstellen
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
