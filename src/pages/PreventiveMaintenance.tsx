import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useData } from "../contexts/DataContext";
import type { SAPMaintenanceItem } from "../types";
import * as XLSX from "xlsx";

type TabType = "pm01-elec" | "pm01-mech" | "pm02-elec" | "pm02-mech";

function PreventiveMaintenance() {
  const {
    sapMaintenanceItems,
    addSAPMaintenanceItems,
    deleteSAPMaintenanceItem,
    createWorkOrderFromSAP,
    users,
  } = useData();
  const { currentUser, permissions } = useAuth();

  const [selectedAsset, setSelectedAsset] = useState<string>("T207");
  const [selectedTab, setSelectedTab] = useState<TabType>("pm02-elec");
  const [selectedItem, setSelectedItem] = useState<SAPMaintenanceItem | null>(
    null
  );
  const [showCreateWO, setShowCreateWO] = useState(false);
  const [assignedTo, setAssignedTo] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  // Verfügbare Anlagen
  const assets = ["T207", "T208", "T700", "T46"];

  // Verfügbare Techniker für Zuweisung
  const availableUsers = users.filter(
    (u) => u.role === "Mechaniker" || u.role === "Elektriker"
  );

  // ==========================================
  // EXCEL IMPORT
  // ==========================================

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { cellDates: true });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
      }) as any[][];

      console.log("📊 Excel geladen:", jsonData.length, "Zeilen");

      const rows = jsonData.slice(1); // Skip header
      const parsed: SAPMaintenanceItem[] = [];

      rows.forEach((row, idx) => {
        if (!row[0] || !row[1]) return;

        // Extrahiere Asset aus Functional Location (Spalte K / Index 10)
        const functionalLoc = String(row[10] || "");
        const assetMatch = functionalLoc.match(/T0?(\d+)/);
        const asset = assetMatch ? `T${assetMatch[1]}` : "T207";

        // Parse Basic Start Date (Spalte F / Index 5)
        let basicStartDate = "";
        if (row[5]) {
          const dateValue = row[5];
          if (dateValue instanceof Date) {
            basicStartDate = dateValue.toISOString().split("T")[0];
          } else if (typeof dateValue === "string") {
            // Parse DD.MM.YYYY format
            const parts = dateValue.split(".");
            if (parts.length === 3) {
              basicStartDate = `${parts[2]}-${parts[1].padStart(
                2,
                "0"
              )}-${parts[0].padStart(2, "0")}`;
            } else {
              // Try ISO format
              basicStartDate = dateValue;
            }
          }
        }

        const item: SAPMaintenanceItem = {
          id: `sap-${idx}-${Date.now()}`,
          orderType: row[0] as "PM01" | "PM02",
          mainWorkCenter: row[1] as "ELEC" | "MECH",
          orderNumber: String(row[2] || ""),
          description: String(row[3] || ""),
          actualRelease: row[4] ? String(row[4]) : "",
          basicStartDate: basicStartDate,
          equipment: String(row[6] || ""),
          descriptionDetail: String(row[7] || ""),
          functionalLocation: functionalLoc,
          systemStatus: String(row[11] || ""),
          asset: asset,
        };

        parsed.push(item);
      });

      addSAPMaintenanceItems(parsed);
      setLoading(false);
      alert(`✅ ${parsed.length} SAP-Einträge erfolgreich importiert!`);
      console.log("✅ Import erfolgreich:", parsed.length, "Aufgaben");
    } catch (error) {
      console.error("❌ Fehler beim Import:", error);
      alert("❌ Fehler beim Import der Excel-Datei");
      setLoading(false);
    }
  };

  // ==========================================
  // DATE CALCULATIONS
  // ==========================================

  const getTargetDate = (basicStartDate: string): Date | null => {
    if (!basicStartDate) return null;
    try {
      const date = new Date(basicStartDate);
      date.setDate(date.getDate() + 14);
      return date;
    } catch {
      return null;
    }
  };

  const isOverdue = (basicStartDate: string): boolean => {
    const targetDate = getTargetDate(basicStartDate);
    if (!targetDate) return false;
    return new Date() > targetDate;
  };

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return "—";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("de-DE");
    } catch {
      return dateStr;
    }
  };

  const getDaysUntilDue = (basicStartDate: string): number | null => {
    const targetDate = getTargetDate(basicStartDate);
    if (!targetDate) return null;
    const today = new Date();
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // ==========================================
  // FILTER DATA
  // ==========================================

  const getFilteredData = (): SAPMaintenanceItem[] => {
    return sapMaintenanceItems.filter((item) => {
      const assetMatch = item.asset === selectedAsset;

      const [type, workCenter] = selectedTab.split("-");
      const orderTypeMatch = item.orderType.toLowerCase() === type;
      const workCenterMatch = item.mainWorkCenter.toLowerCase() === workCenter;

      return assetMatch && orderTypeMatch && workCenterMatch;
    });
  };

  const filteredData = getFilteredData();

  // ==========================================
  // STATISTICS
  // ==========================================

  const getStats = () => {
    const assetData = sapMaintenanceItems.filter(
      (item) => item.asset === selectedAsset
    );
    return {
      total: assetData.length,
      pm01: assetData.filter((item) => item.orderType === "PM01").length,
      pm02: assetData.filter((item) => item.orderType === "PM02").length,
      overdue: assetData.filter((item) => isOverdue(item.basicStartDate))
        .length,
      elec: assetData.filter((item) => item.mainWorkCenter === "ELEC").length,
      mech: assetData.filter((item) => item.mainWorkCenter === "MECH").length,
    };
  };

  const stats = getStats();

  // ==========================================
  // CREATE & DELETE WORK ORDER
  // ==========================================

  // Kann User SAP Items löschen? (Admin, E-Supervisor, M-Supervisor)
  const canDeleteSAPItems =
    currentUser?.role === "Admin" ||
    currentUser?.role === "E-Supervisor" ||
    currentUser?.role === "M-Supervisor";

  const handleDeleteSAPItem = (item: SAPMaintenanceItem) => {
    if (!canDeleteSAPItems) {
      alert("❌ Keine Berechtigung zum Löschen");
      return;
    }

    if (
      window.confirm(
        `SAP Item "${item.description}" (${item.orderNumber}) wirklich löschen?`
      )
    ) {
      deleteSAPMaintenanceItem(item.id);
    }
  };

  const handleCreateWorkOrder = (item: SAPMaintenanceItem) => {
    setSelectedItem(item);
    setShowCreateWO(true);
    setAssignedTo(undefined);
  };

  const submitWorkOrder = () => {
    if (!selectedItem || !currentUser) return;

    try {
      const newWO = createWorkOrderFromSAP(
        selectedItem,
        currentUser.id,
        assignedTo
      );
      alert(
        `✅ Work Order #${newWO.id} "${newWO.title}" erfolgreich erstellt!`
      );
      setShowCreateWO(false);
      setSelectedItem(null);
      setAssignedTo(undefined);
    } catch (error) {
      console.error("Error creating Work Order:", error);
      alert("❌ Fehler beim Erstellen des Work Orders");
    }
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="container">
      {/* HEADER */}
      <div className="pm-header">
        <div>
          <h1>📋 SAP Preventive Maintenance</h1>
          <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>
            PM01 = Selbst erstellte Jobs (Work Orders) | PM02 = Preventive
            Maintenance | ELEC = Elektriker | MECH = Mechaniker
          </p>
        </div>
        <label className="pm-upload-btn">
          📂 SAP Excel importieren
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            style={{ display: "none" }}
          />
        </label>
      </div>

      {loading && (
        <div
          style={{
            textAlign: "center",
            padding: "2rem",
            background: "white",
            borderRadius: "12px",
            marginBottom: "2rem",
          }}
        >
          <p style={{ color: "#2563eb", fontWeight: "600" }}>
            ⏳ Lade Excel-Datei...
          </p>
        </div>
      )}

      {sapMaintenanceItems.length === 0 && !loading ? (
        <div className="pm-empty-state">
          <div className="pm-empty-icon">📊</div>
          <h2>Keine SAP-Daten geladen</h2>
          <p>
            Laden Sie eine SAP PM Excel-Datei hoch, um preventive Maintenance
            Aufgaben zu verwalten.
          </p>
          <div className="pm-help">
            <strong>📋 Erwartete Excel-Struktur:</strong>
            <ul>
              <li>
                <strong>Spalte A:</strong> Order Type (PM01 / PM02)
              </li>
              <li>
                <strong>Spalte B:</strong> Main Work Center (ELEC / MECH)
              </li>
              <li>
                <strong>Spalte C:</strong> Order Number
              </li>
              <li>
                <strong>Spalte D:</strong> Description
              </li>
              <li>
                <strong>Spalte E:</strong> Actual Release
              </li>
              <li>
                <strong>Spalte F:</strong> Basic Start Date (DD.MM.YYYY)
              </li>
              <li>
                <strong>Spalte G:</strong> Equipment
              </li>
              <li>
                <strong>Spalte H:</strong> Description Detail
              </li>
              <li>
                <strong>Spalte K:</strong> Functional Location (T207-...)
              </li>
              <li>
                <strong>Spalte L:</strong> System Status
              </li>
            </ul>
          </div>
        </div>
      ) : sapMaintenanceItems.length > 0 ? (
        <>
          {/* STATISTICS */}
          <div className="pm-stats">
            <div className="pm-stat-card">
              <h3>Gesamt</h3>
              <p className="stat-number">{stats.total}</p>
            </div>
            <div className="pm-stat-card planned">
              <h3>PM01 (Jobs)</h3>
              <p className="stat-number">{stats.pm01}</p>
            </div>
            <div className="pm-stat-card completed">
              <h3>PM02 (Preventive)</h3>
              <p className="stat-number">{stats.pm02}</p>
            </div>
            <div className="pm-stat-card overdue">
              <h3>Überfällig</h3>
              <p className="stat-number">{stats.overdue}</p>
            </div>
            <div className="pm-stat-card">
              <h3>⚡ Elektriker</h3>
              <p className="stat-number">{stats.elec}</p>
            </div>
            <div className="pm-stat-card">
              <h3>🔧 Mechaniker</h3>
              <p className="stat-number">{stats.mech}</p>
            </div>
          </div>

          {/* ASSET TABS */}
          <div className="asset-tabs">
            {assets.map((asset) => (
              <button
                key={asset}
                className={`asset-tab ${
                  selectedAsset === asset ? "active" : ""
                }`}
                onClick={() => setSelectedAsset(asset)}
              >
                <span className="asset-tab-icon">🛢️</span>
                <span className="asset-tab-name">{asset}</span>
                <span className="asset-tab-count">
                  {
                    sapMaintenanceItems.filter((item) => item.asset === asset)
                      .length
                  }
                </span>
              </button>
            ))}
          </div>

          {/* PM TYPE TABS - 4 REITER */}
          <div className="category-tabs">
            <button
              className={`category-tab ${
                selectedTab === "pm01-elec" ? "active" : ""
              }`}
              onClick={() => setSelectedTab("pm01-elec")}
            >
              ⚡ PM01 - Elektriker
              <span className="category-count">
                {
                  sapMaintenanceItems.filter(
                    (i) =>
                      i.asset === selectedAsset &&
                      i.orderType === "PM01" &&
                      i.mainWorkCenter === "ELEC"
                  ).length
                }
              </span>
            </button>
            <button
              className={`category-tab ${
                selectedTab === "pm01-mech" ? "active" : ""
              }`}
              onClick={() => setSelectedTab("pm01-mech")}
            >
              🔧 PM01 - Mechaniker
              <span className="category-count">
                {
                  sapMaintenanceItems.filter(
                    (i) =>
                      i.asset === selectedAsset &&
                      i.orderType === "PM01" &&
                      i.mainWorkCenter === "MECH"
                  ).length
                }
              </span>
            </button>
            <button
              className={`category-tab ${
                selectedTab === "pm02-elec" ? "active" : ""
              }`}
              onClick={() => setSelectedTab("pm02-elec")}
            >
              ⚡ PM02 - Elektriker
              <span className="category-count">
                {
                  sapMaintenanceItems.filter(
                    (i) =>
                      i.asset === selectedAsset &&
                      i.orderType === "PM02" &&
                      i.mainWorkCenter === "ELEC"
                  ).length
                }
              </span>
            </button>
            <button
              className={`category-tab ${
                selectedTab === "pm02-mech" ? "active" : ""
              }`}
              onClick={() => setSelectedTab("pm02-mech")}
            >
              🔧 PM02 - Mechaniker
              <span className="category-count">
                {
                  sapMaintenanceItems.filter(
                    (i) =>
                      i.asset === selectedAsset &&
                      i.orderType === "PM02" &&
                      i.mainWorkCenter === "MECH"
                  ).length
                }
              </span>
            </button>
          </div>

          {/* DATA TABLE */}
          <div className="pm-table-container">
            <table className="pm-table">
              <thead>
                <tr>
                  <th>Order Nr.</th>
                  <th>Beschreibung</th>
                  <th>Start Datum</th>
                  <th>Fällig (+14 Tage)</th>
                  <th>Equipment</th>
                  <th>Status</th>
                  <th>Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      style={{ padding: "3rem", textAlign: "center" }}
                    >
                      <p style={{ color: "#9ca3af", margin: 0 }}>
                        Keine Einträge in dieser Kategorie
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item) => {
                    const daysUntilDue = getDaysUntilDue(item.basicStartDate);
                    const overdue = isOverdue(item.basicStartDate);

                    return (
                      <tr
                        key={item.id}
                        style={{
                          background: overdue
                            ? "rgba(239, 68, 68, 0.08)"
                            : "white",
                        }}
                      >
                        <td className="pm-equipment">
                          <strong style={{ color: "#2563eb" }}>
                            {item.orderNumber}
                          </strong>
                        </td>
                        <td className="pm-description">
                          <div
                            style={{
                              fontWeight: "600",
                              marginBottom: "0.25rem",
                            }}
                          >
                            {item.description}
                          </div>
                          <div
                            style={{
                              fontSize: "0.8125rem",
                              color: "#6b7280",
                            }}
                          >
                            {item.descriptionDetail}
                          </div>
                        </td>
                        <td className="pm-date">
                          <span
                            style={{
                              fontWeight: "600",
                              color: overdue ? "#ef4444" : "#4b5563",
                            }}
                          >
                            {formatDate(item.basicStartDate)}
                          </span>
                        </td>
                        <td className="pm-priority">
                          {daysUntilDue !== null && (
                            <span
                              className={`pm-status ${
                                overdue
                                  ? "pm-status-overdue"
                                  : daysUntilDue <= 7
                                  ? "pm-status-planned"
                                  : "pm-status-completed"
                              }`}
                            >
                              {overdue
                                ? `⚠️ ${Math.abs(daysUntilDue)} Tage über!`
                                : `✅ ${daysUntilDue} Tage`}
                            </span>
                          )}
                        </td>
                        <td className="pm-task">
                          <div style={{ fontSize: "0.875rem" }}>
                            {item.equipment || "—"}
                          </div>
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "#9ca3af",
                            }}
                          >
                            {item.functionalLocation}
                          </div>
                        </td>
                        <td className="pm-plan">
                          <span
                            style={{
                              padding: "0.25rem 0.625rem",
                              borderRadius: "6px",
                              fontSize: "0.75rem",
                              fontWeight: "700",
                              background: "#f3f4f6",
                              color: "#6b7280",
                            }}
                          >
                            {item.systemStatus || "N/A"}
                          </span>
                        </td>
                        <td>
                          <div
                            style={{
                              display: "flex",
                              gap: "0.5rem",
                              alignItems: "center",
                            }}
                          >
                            <button
                              className="btn-create-wo"
                              onClick={() => handleCreateWorkOrder(item)}
                              style={{
                                padding: "0.5rem 1rem",
                                fontSize: "0.875rem",
                              }}
                            >
                              📝 WO erstellen
                            </button>
                            {canDeleteSAPItems && (
                              <button
                                onClick={() => handleDeleteSAPItem(item)}
                                style={{
                                  padding: "0.5rem 0.75rem",
                                  background: "rgba(239, 68, 68, 0.1)",
                                  color: "#ef4444",
                                  border: "1px solid rgba(239, 68, 68, 0.2)",
                                  borderRadius: "8px",
                                  fontSize: "0.875rem",
                                  fontWeight: "700",
                                  cursor: "pointer",
                                  transition: "all 0.2s",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background =
                                    "rgba(239, 68, 68, 0.2)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background =
                                    "rgba(239, 68, 68, 0.1)";
                                }}
                                title="SAP Item löschen (nur Supervisors & Admin)"
                              >
                                🗑️
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : null}

      {/* CREATE WO MODAL */}
      {showCreateWO && selectedItem && (
        <>
          <div
            className="wo-modal-overlay"
            onClick={() => setShowCreateWO(false)}
          />
          <div className="wo-create-modal">
            <div className="wo-create-header">
              <h2>📝 Work Order aus SAP erstellen</h2>
              <button
                onClick={() => setShowCreateWO(false)}
                className="btn-close-modal"
              >
                ✕
              </button>
            </div>

            <div className="wo-create-body">
              <div
                style={{
                  marginBottom: "1.5rem",
                  padding: "1.5rem",
                  background: isOverdue(selectedItem.basicStartDate)
                    ? "rgba(239, 68, 68, 0.1)"
                    : "#f9fafb",
                  borderRadius: "12px",
                  border: `2px solid ${
                    isOverdue(selectedItem.basicStartDate)
                      ? "#ef4444"
                      : "#e5e7eb"
                  }`,
                }}
              >
                <p style={{ margin: "0.5rem 0", fontSize: "0.875rem" }}>
                  <strong>Order Nr:</strong> {selectedItem.orderNumber}
                </p>
                <p style={{ margin: "0.5rem 0", fontSize: "0.875rem" }}>
                  <strong>Order Type:</strong> {selectedItem.orderType}
                </p>
                <p style={{ margin: "0.5rem 0", fontSize: "0.875rem" }}>
                  <strong>Work Center:</strong> {selectedItem.mainWorkCenter}
                </p>
                <p style={{ margin: "0.5rem 0", fontSize: "0.875rem" }}>
                  <strong>Beschreibung:</strong> {selectedItem.description}
                </p>
                <p style={{ margin: "0.5rem 0", fontSize: "0.875rem" }}>
                  <strong>Details:</strong> {selectedItem.descriptionDetail}
                </p>
                <p style={{ margin: "0.5rem 0", fontSize: "0.875rem" }}>
                  <strong>Anlage:</strong> {selectedItem.asset}
                </p>
                <p style={{ margin: "0.5rem 0", fontSize: "0.875rem" }}>
                  <strong>Start Datum:</strong>{" "}
                  {formatDate(selectedItem.basicStartDate)}
                </p>
                <p style={{ margin: "0.5rem 0", fontSize: "0.875rem" }}>
                  <strong>Fällig (Start + 14 Tage):</strong>{" "}
                  {formatDate(
                    getTargetDate(selectedItem.basicStartDate)?.toISOString() ||
                      ""
                  )}
                </p>
                <p style={{ margin: "0.5rem 0", fontSize: "0.875rem" }}>
                  <strong>Priorität:</strong>{" "}
                  <span
                    style={{
                      color: isOverdue(selectedItem.basicStartDate)
                        ? "#ef4444"
                        : "#10b981",
                      fontWeight: "700",
                    }}
                  >
                    {isOverdue(selectedItem.basicStartDate)
                      ? "🚨 Kritisch (überfällig)"
                      : "✅ Normal"}
                  </span>
                </p>
              </div>

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
                  {availableUsers
                    .filter(
                      (u) =>
                        u.role ===
                        (selectedItem.mainWorkCenter === "ELEC"
                          ? "Elektriker"
                          : "Mechaniker")
                    )
                    .map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.role})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="wo-create-footer">
              <button onClick={submitWorkOrder} className="btn-create-submit">
                ✅ Work Order erstellen
              </button>
              <button
                onClick={() => {
                  setShowCreateWO(false);
                  setSelectedItem(null);
                }}
                className="btn-create-cancel"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default PreventiveMaintenance;
