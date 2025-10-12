import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useData } from "../contexts/DataContext";
import * as XLSX from "xlsx";
import type { WorkOrder } from "../types";

interface PMTask {
  id: string;
  equipmentNumber: string;
  equipmentDescription: string;
  plannerGroup: string;
  maintenancePlan: string;
  taskDescription: string;
  startDate: string;
  dueDate: string;
  priority: string;
  status: "Geplant" | "Überfällig" | "Erledigt";
  workCenter: string;
  systemStatus?: string;
  userStatus?: string;
}

function PreventiveMaintenance() {
  const { currentUser, permissions } = useAuth();
  const { assets, addWorkOrder, workOrders } = useData();
  const [pmTasks, setPmTasks] = useState<PMTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"Alle" | "Geplant" | "Überfällig">(
    "Alle"
  );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError("");

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { cellDates: true, cellNF: true });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      console.log("📊 Excel geladen:", jsonData.length, "Zeilen");
      console.log("📊 Erste Zeile:", jsonData[0]);

      const tasks: PMTask[] = jsonData.map((row: any, index) => {
        const equipmentNumber =
          row["Equipment"] ||
          row["Equipmentnummer"] ||
          row["Equipment Number"] ||
          row["Equipment No"] ||
          "";

        const dueDate =
          row["Due Date"] || row["Fälligkeitsdatum"] || row["Due date"] || "";
        const today = new Date();
        const due = dueDate ? new Date(dueDate) : new Date();

        const status: PMTask["status"] =
          row["Status"] === "Completed" || row["Status"] === "Erledigt"
            ? "Erledigt"
            : due < today
            ? "Überfällig"
            : "Geplant";

        return {
          id: `PM-${index + 1}`,
          equipmentNumber,
          equipmentDescription:
            row["Description"] ||
            row["Beschreibung"] ||
            row["Equipment Description"] ||
            "",
          plannerGroup: row["Planner Group"] || row["Planergruppe"] || "",
          maintenancePlan:
            row["Maintenance Plan"] || row["Wartungsplan"] || row["Plan"] || "",
          taskDescription:
            row["Task"] ||
            row["Task Description"] ||
            row["Operation Text"] ||
            row["Aufgabe"] ||
            "",
          startDate: row["Start Date"] || row["Startdatum"] || "",
          dueDate: dueDate,
          priority: row["Priority"] || row["Priorität"] || "Normal",
          status,
          workCenter: row["Work Center"] || row["Arbeitszentrum"] || "",
          systemStatus: row["System Status"] || row["Systemstatus"] || "",
          userStatus: row["User Status"] || row["Benutzerstatus"] || "",
        };
      });

      setPmTasks(tasks);
      setLoading(false);
      console.log("✅ Import erfolgreich:", tasks.length, "Aufgaben");
    } catch (err) {
      console.error("❌ Fehler beim Import:", err);
      setError(
        "Fehler beim Laden der Excel-Datei. Bitte prüfen Sie das Format."
      );
      setLoading(false);
    }
  };

  const createWorkOrderFromPM = (task: PMTask) => {
    if (!currentUser) return;

    const matchingAsset = assets.find(
      (a) =>
        a.name === task.equipmentNumber ||
        a.serialNumber === task.equipmentNumber
    );

    if (!matchingAsset) {
      alert(
        `Keine passende Anlage gefunden für Equipment: ${task.equipmentNumber}`
      );
      return;
    }

    const mapPriority = (sapPriority: string): WorkOrder["priority"] => {
      const prio = sapPriority.toLowerCase();
      if (prio.includes("high") || prio.includes("hoch") || prio === "1")
        return "Hoch";
      if (
        prio.includes("critical") ||
        prio.includes("kritisch") ||
        prio === "0"
      )
        return "Kritisch";
      if (prio.includes("low") || prio.includes("niedrig") || prio === "3")
        return "Niedrig";
      return "Normal";
    };

    const newWO: Omit<WorkOrder, "id"> = {
      title: task.taskDescription || `Wartung ${task.equipmentNumber}`,
      description:
        `Preventive Maintenance Aufgabe aus SAP:\n\n` +
        `Equipment: ${task.equipmentNumber} - ${task.equipmentDescription}\n` +
        `Wartungsplan: ${task.maintenancePlan}\n` +
        `Planner Group: ${task.plannerGroup}\n` +
        `Work Center: ${task.workCenter}\n` +
        `Fälligkeitsdatum: ${task.dueDate}`,
      assetId: matchingAsset.id,
      assetName: matchingAsset.name,
      type: "Mechanisch",
      category: "Einlagerung & Rig Moves",
      priority: mapPriority(task.priority),
      status: "Neu",
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      materialRequired: false,
      materialStatus: "Nicht benötigt",
      notes: `SAP PM-Task ID: ${task.id}\nSystem Status: ${
        task.systemStatus || "N/A"
      }`,
    };

    const maxId =
      workOrders.length > 0 ? Math.max(...workOrders.map((wo) => wo.id)) : 0;
    const workOrderWithId: WorkOrder = { ...newWO, id: maxId + 1 };

    addWorkOrder(workOrderWithId);
    alert(`✅ Work Order #${maxId + 1} erfolgreich erstellt!`);
  };

  const filteredTasks =
    filter === "Alle" ? pmTasks : pmTasks.filter((t) => t.status === filter);

  const stats = {
    total: pmTasks.length,
    geplant: pmTasks.filter((t) => t.status === "Geplant").length,
    ueberfaellig: pmTasks.filter((t) => t.status === "Überfällig").length,
    erledigt: pmTasks.filter((t) => t.status === "Erledigt").length,
  };

  const getStatusColor = (status: PMTask["status"]) => {
    switch (status) {
      case "Geplant":
        return "pm-status-planned";
      case "Überfällig":
        return "pm-status-overdue";
      case "Erledigt":
        return "pm-status-completed";
      default:
        return "";
    }
  };

  return (
    <div className="container">
      <div className="pm-header">
        <h1>📅 Preventive Maintenance - SAP Import</h1>
        <div className="pm-upload-section">
          <label className="pm-upload-btn">
            📂 Excel-Datei hochladen
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              style={{ display: "none" }}
            />
          </label>
          {loading && <span className="pm-loading">⏳ Lade...</span>}
        </div>
      </div>

      {error && <div className="pm-error">⚠️ {error}</div>}

      {pmTasks.length === 0 ? (
        <div className="pm-empty-state">
          <div className="pm-empty-icon">📊</div>
          <h2>Keine Wartungsaufgaben geladen</h2>
          <p>Laden Sie eine SAP PM Excel-Datei hoch, um zu beginnen.</p>
          <div className="pm-help">
            <strong>Erwartete Excel-Spalten:</strong>
            <ul>
              <li>Equipment / Equipmentnummer</li>
              <li>Description / Beschreibung</li>
              <li>Task / Aufgabe</li>
              <li>Due Date / Fälligkeitsdatum</li>
              <li>Priority / Priorität</li>
              <li>Work Center / Arbeitszentrum</li>
            </ul>
          </div>
        </div>
      ) : (
        <>
          <div className="pm-stats">
            <div className="pm-stat-card">
              <h3>Gesamt</h3>
              <p className="stat-number">{stats.total}</p>
            </div>
            <div className="pm-stat-card planned">
              <h3>Geplant</h3>
              <p className="stat-number">{stats.geplant}</p>
            </div>
            <div className="pm-stat-card overdue">
              <h3>Überfällig</h3>
              <p className="stat-number">{stats.ueberfaellig}</p>
            </div>
            <div className="pm-stat-card completed">
              <h3>Erledigt</h3>
              <p className="stat-number">{stats.erledigt}</p>
            </div>
          </div>

          <div className="pm-filter-buttons">
            <button
              className={`filter-btn ${filter === "Alle" ? "active" : ""}`}
              onClick={() => setFilter("Alle")}
            >
              📋 Alle ({stats.total})
            </button>
            <button
              className={`filter-btn ${filter === "Geplant" ? "active" : ""}`}
              onClick={() => setFilter("Geplant")}
            >
              ✅ Geplant ({stats.geplant})
            </button>
            <button
              className={`filter-btn ${
                filter === "Überfällig" ? "active" : ""
              }`}
              onClick={() => setFilter("Überfällig")}
            >
              ⚠️ Überfällig ({stats.ueberfaellig})
            </button>
          </div>

          <div className="pm-table-container">
            <table className="pm-table">
              <thead>
                <tr>
                  <th>Equipment</th>
                  <th>Beschreibung</th>
                  <th>Aufgabe</th>
                  <th>Wartungsplan</th>
                  <th>Fällig am</th>
                  <th>Priorität</th>
                  <th>Status</th>
                  <th>Aktion</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task) => (
                  <tr key={task.id}>
                    <td className="pm-equipment">
                      <strong>{task.equipmentNumber}</strong>
                    </td>
                    <td className="pm-description">
                      {task.equipmentDescription}
                    </td>
                    <td className="pm-task">{task.taskDescription}</td>
                    <td className="pm-plan">{task.maintenancePlan}</td>
                    <td className="pm-date">
                      {task.dueDate
                        ? new Date(task.dueDate).toLocaleDateString("de-DE")
                        : "—"}
                    </td>
                    <td className="pm-priority">{task.priority}</td>
                    <td>
                      <span
                        className={`pm-status ${getStatusColor(task.status)}`}
                      >
                        {task.status}
                      </span>
                    </td>
                    <td>
                      {task.status !== "Erledigt" && (
                        <button
                          className="btn-create-wo"
                          onClick={() => createWorkOrderFromPM(task)}
                          disabled={!permissions?.canCreateTickets}
                        >
                          🎫 WO erstellen
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default PreventiveMaintenance;
