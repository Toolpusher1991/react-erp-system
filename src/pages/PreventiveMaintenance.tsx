import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useData } from "../contexts/DataContext";
import { createWorkOrder } from "../services/api";
import { useToast } from "../components/ToastContainer";
import type { SAPMaintenanceItem } from "../types";
import * as XLSX from "xlsx";

type TabType = string;

function PreventiveMaintenance() {
  const {
    sapMaintenanceItems,
    addSAPMaintenanceItems,
    deleteSAPMaintenanceItem,
    deleteAllSAPMaintenanceItems,
    users,
  } = useData();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [selectedAsset, setSelectedAsset] = useState<string>("");
  const [selectedTab, setSelectedTab] = useState<TabType>("");
  const [selectedItem, setSelectedItem] = useState<SAPMaintenanceItem | null>(
    null
  );
  const [showCreateWO, setShowCreateWO] = useState(false);
  const [assignedTo, setAssignedTo] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  // Dynamische Anlagen aus Daten extrahieren
  const assets = Array.from(
    new Set(sapMaintenanceItems.map((item) => item.asset))
  ).sort();

  // Dynamische Work Centers aus Daten extrahieren
  const workCenters = Array.from(
    new Set(sapMaintenanceItems.map((item) => item.mainWorkCenter))
  ).sort();

  // Dynamische Order Types aus Daten extrahieren
  const orderTypes = Array.from(
    new Set(sapMaintenanceItems.map((item) => item.orderType))
  ).sort();

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

        // Extrahiere Asset aus Functional Location (Spalte J / Index 9)
        const functionalLoc = String(row[9] || "");
        const assetMatch = functionalLoc.match(/T0?(\d+)/);
        const asset = assetMatch ? `T${assetMatch[1]}` : "Unknown";

        // Parse Basic Start Date (Spalte F / Index 5)
        let basicStartDate = "";
        if (row[5]) {
          const dateValue = row[5];
          if (dateValue instanceof Date) {
            basicStartDate = dateValue.toISOString().split("T")[0];
          } else if (typeof dateValue === "string") {
            const parts = dateValue.split(".");
            if (parts.length === 3) {
              basicStartDate = `${parts[2]}-${parts[1].padStart(
                2,
                "0"
              )}-${parts[0].padStart(2, "0")}`;
            } else {
              basicStartDate = dateValue;
            }
          }
        }

        const item: SAPMaintenanceItem = {
          id: `sap-${idx}-${Date.now()}`,
          orderType: String(row[0] || ""),
          mainWorkCenter: String(row[1] || ""),
          orderNumber: String(row[2] || ""),
          description: String(row[3] || ""),
          actualRelease: row[4] ? String(row[4]) : "",
          basicStartDate: basicStartDate,
          equipment: String(row[6] || ""),
          descriptionDetail: String(row[7] || ""),
          descriptionExtra: String(row[8] || ""),
          functionalLocation: functionalLoc,
          systemStatus: String(row[10] || ""),
          asset: asset,
        };

        parsed.push(item);
      });

      addSAPMaintenanceItems(parsed);

      // Automatisch erste Anlage und ersten Tab auswählen
      if (parsed.length > 0) {
        const firstAsset = Array.from(
          new Set(parsed.map((i) => i.asset))
        ).sort()[0];
        setSelectedAsset(firstAsset);

        // Finde erste Kombination die Daten hat
        const assetItems = parsed.filter((i) => i.asset === firstAsset);
        if (assetItems.length > 0) {
          const firstWC = assetItems[0].mainWorkCenter;
          const firstOT = assetItems[0].orderType;
          setSelectedTab(`${firstOT}-${firstWC}`);
        }
      }

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
    if (!selectedAsset || !selectedTab) return [];

    return sapMaintenanceItems.filter((item) => {
      const assetMatch = item.asset === selectedAsset;

      // Split nur beim ersten "-" um WorkCenter mit Bindestrichen zu unterstützen (z.B. ESP-INSP)
      const firstDashIndex = selectedTab.indexOf("-");
      const orderType = selectedTab.substring(0, firstDashIndex);
      const workCenter = selectedTab.substring(firstDashIndex + 1);

      const orderTypeMatch = item.orderType === orderType;
      const workCenterMatch = item.mainWorkCenter === workCenter;

      return assetMatch && orderTypeMatch && workCenterMatch;
    });
  };

  // ==========================================
  // STATISTICS
  // ==========================================

  const getStats = () => {
    if (!selectedAsset) return null;

    const assetData = sapMaintenanceItems.filter(
      (item) => item.asset === selectedAsset
    );
    return {
      total: assetData.length,
      overdue: assetData.filter((item) => isOverdue(item.basicStartDate))
        .length,
      byOrderType: orderTypes.reduce((acc, ot) => {
        acc[ot] = assetData.filter((i) => i.orderType === ot).length;
        return acc;
      }, {} as Record<string, number>),
      byWorkCenter: workCenters.reduce((acc, wc) => {
        acc[wc] = assetData.filter((i) => i.mainWorkCenter === wc).length;
        return acc;
      }, {} as Record<string, number>),
    };
  };

  // WICHTIG: Stats und filteredData müssen HIER berechnet werden
  const stats = getStats();
  const filteredData = getFilteredData();

  // ==========================================
  // HELPER FUNCTIONS
  // ==========================================

  const getWorkCenterIcon = (wc: string) => {
    if (wc === "ELEC") return "⚡";
    if (wc === "MECH") return "🔧";
    if (wc.includes("INSP")) return "🔍";
    if (wc === "SUP") return "📦";
    if (wc === "TOP") return "🎯";
    return "🔹";
  };

  // ==========================================
  // CREATE & DELETE WORK ORDER
  // ==========================================

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

  const handleDeleteAllSAPItems = () => {
    if (!canDeleteSAPItems) {
      alert("❌ Keine Berechtigung zum Löschen");
      return;
    }

    const count = sapMaintenanceItems.length;
    if (count === 0) {
      alert("ℹ️ Keine SAP-Einträge vorhanden");
      return;
    }

    if (
      window.confirm(
        `⚠️ ACHTUNG: Möchten Sie wirklich ALLE ${count} SAP-Einträge löschen?\n\nDiese Aktion kann nicht rückgängig gemacht werden!`
      )
    ) {
      if (
        window.confirm(
          `Sind Sie absolut sicher? Es werden ${count} Einträge unwiderruflich gelöscht.`
        )
      ) {
        deleteAllSAPMaintenanceItems();
        setSelectedAsset("");
        setSelectedTab("");
        alert(`✅ Alle ${count} SAP-Einträge wurden gelöscht`);
      }
    }
  };

  const handleCreateWorkOrder = (item: SAPMaintenanceItem) => {
    setSelectedItem(item);
    setShowCreateWO(true);
    setAssignedTo(undefined);
  };

  const submitWorkOrder = async () => {
    if (!selectedItem || !currentUser) return;

    try {
      console.log("📝 Creating Work Order from PM Item:", selectedItem);

      // Mapping SAP Item zu Work Order
      const newWorkOrder = {
        title: `${selectedItem.orderType} - ${selectedItem.description}`,
        description: `SAP Order: ${selectedItem.orderNumber}\nOrder Type: ${
          selectedItem.orderType
        }\nWork Center: ${selectedItem.mainWorkCenter}\nFunctional Location: ${
          selectedItem.functionalLocation
        }\nDescription: ${selectedItem.description}\nStart Date: ${
          selectedItem.basicStartDate || "N/A"
        }`,
        assetId:
          selectedItem.asset === "T207"
            ? 1
            : selectedItem.asset === "T208"
            ? 2
            : 3,
        assetName: selectedItem.asset,
        category: "Im Betrieb" as "Im Betrieb" | "Einlagerung & Rig Moves",
        priority: "Hoch" as "Niedrig" | "Mittel" | "Hoch" | "Kritisch",
        status: "Offen" as
          | "Offen"
          | "In Bearbeitung"
          | "Erledigt"
          | "Abgebrochen",
        assignedTo: assignedTo ? [assignedTo.toString()] : [],
        startDate: selectedItem.basicStartDate
          ? new Date(selectedItem.basicStartDate)
          : new Date(),
        dueDate: selectedItem.basicStartDate
          ? new Date(
              new Date(selectedItem.basicStartDate).getTime() +
                14 * 24 * 60 * 60 * 1000
            )
          : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      console.log("📝 Sending to Backend:", newWorkOrder);

      const result = await createWorkOrder(newWorkOrder);

      console.log("✅ Backend Response:", result);

      if (result.data) {
        showToast(`Work Order erfolgreich aus SAP erstellt!`, "success");
        setShowCreateWO(false);
        setSelectedItem(null);
        setAssignedTo(undefined);
      } else {
        throw new Error(result.error || "Failed to create work order");
      }
    } catch (error) {
      console.error("❌ Error creating Work Order:", error);
      showToast("Fehler beim Erstellen des Work Orders", "error");
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
            Verwaltung von Wartungsaufgaben aus SAP PM Excel-Exporten
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <label className="pm-upload-btn">
            📂 SAP Excel importieren
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              style={{ display: "none" }}
            />
          </label>
          <button
            onClick={handleDeleteAllSAPItems}
            disabled={!canDeleteSAPItems || sapMaintenanceItems.length === 0}
            className="btn-delete-all"
            title={
              !canDeleteSAPItems
                ? "Keine Berechtigung (nur Supervisors & Admin)"
                : sapMaintenanceItems.length === 0
                ? "Keine Einträge zum Löschen"
                : "Alle SAP-Einträge löschen"
            }
          >
            🗑️ Alle löschen ({sapMaintenanceItems.length})
          </button>
        </div>
      </div>

      {loading && (
        <div className="pm-loading">
          <p>⏳ Lade Excel-Datei...</p>
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
                <strong>Spalte A:</strong> Order Type (PM01, PM02, PM06, etc.)
              </li>
              <li>
                <strong>Spalte B:</strong> Main Work Center (ELEC, MECH, SUP,
                TOP, etc.)
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
                <strong>Spalte F:</strong> Basic Start Date
              </li>
              <li>
                <strong>Spalte G:</strong> Equipment
              </li>
              <li>
                <strong>Spalte H:</strong> Description (Detail)
              </li>
              <li>
                <strong>Spalte I:</strong> Description (Extra)
              </li>
              <li>
                <strong>Spalte J:</strong> Functional Location (enthält Asset
                wie T208)
              </li>
              <li>
                <strong>Spalte K:</strong> System Status
              </li>
            </ul>
          </div>
        </div>
      ) : sapMaintenanceItems.length > 0 ? (
        <>
          {/* STATISTICS */}
          {stats && (
            <div className="pm-stats">
              <div className="pm-stat-card">
                <h3>Gesamt</h3>
                <p className="stat-number">{stats.total}</p>
              </div>

              {Object.entries(stats.byOrderType).map(([ot, count]) => (
                <div key={ot} className="pm-stat-card planned">
                  <h3>{ot}</h3>
                  <p className="stat-number">{count}</p>
                </div>
              ))}

              <div className="pm-stat-card overdue">
                <h3>Überfällig</h3>
                <p className="stat-number">{stats.overdue}</p>
              </div>
            </div>
          )}

          {/* ASSET TABS */}
          <div className="asset-tabs">
            {assets.map((asset) => (
              <button
                key={asset}
                className={`asset-tab ${
                  selectedAsset === asset ? "active" : ""
                }`}
                onClick={() => {
                  setSelectedAsset(asset);
                  // Auto-select first tab for this asset
                  const assetItems = sapMaintenanceItems.filter(
                    (i) => i.asset === asset
                  );
                  if (assetItems.length > 0) {
                    const firstWC = assetItems[0].mainWorkCenter;
                    const firstOT = assetItems[0].orderType;
                    setSelectedTab(`${firstOT}-${firstWC}`);
                  }
                }}
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

          {/* WORK CENTER & ORDER TYPE TABS */}
          {selectedAsset && (
            <div
              className="category-tabs"
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.75rem",
                marginBottom: "2rem",
              }}
            >
              {orderTypes.map((ot) =>
                workCenters.map((wc) => {
                  const tabKey = `${ot}-${wc}`;
                  const count = sapMaintenanceItems.filter(
                    (i) =>
                      i.asset === selectedAsset &&
                      i.orderType === ot &&
                      i.mainWorkCenter === wc
                  ).length;

                  if (count === 0) return null;

                  return (
                    <button
                      key={tabKey}
                      className={`category-tab ${
                        selectedTab === tabKey ? "active" : ""
                      }`}
                      onClick={() => setSelectedTab(tabKey)}
                      style={{
                        padding: "0.75rem 1.25rem",
                        background:
                          selectedTab === tabKey ? "#667eea" : "white",
                        color: selectedTab === tabKey ? "white" : "#4b5563",
                        border:
                          selectedTab === tabKey ? "none" : "2px solid #e5e7eb",
                        borderRadius: "10px",
                        fontSize: "0.9rem",
                        fontWeight: "600",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <span>
                        {getWorkCenterIcon(wc)} {ot} - {wc}
                      </span>
                      <span
                        style={{
                          background:
                            selectedTab === tabKey
                              ? "rgba(255,255,255,0.2)"
                              : "#f3f4f6",
                          padding: "0.25rem 0.5rem",
                          borderRadius: "6px",
                          fontSize: "0.75rem",
                        }}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          )}

          {/* DATA TABLE */}
          {selectedTab && (
            <div className="pm-table-container">
              <table className="pm-table">
                <thead>
                  <tr>
                    <th>Order Nr.</th>
                    <th>Beschreibung</th>
                    <th>Start Datum</th>
                    <th>Fällig (+14 Tage)</th>
                    <th>Equipment</th>
                    <th>Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
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
                            {item.descriptionDetail && (
                              <div
                                style={{
                                  fontSize: "0.8125rem",
                                  color: "#6b7280",
                                }}
                              >
                                {item.descriptionDetail}
                              </div>
                            )}
                            {item.descriptionExtra && (
                              <div
                                style={{
                                  fontSize: "0.75rem",
                                  color: "#9ca3af",
                                  marginTop: "0.125rem",
                                }}
                              >
                                {item.descriptionExtra}
                              </div>
                            )}
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
                              >
                                📝 WO erstellen
                              </button>
                              {canDeleteSAPItems && (
                                <button
                                  onClick={() => handleDeleteSAPItem(item)}
                                  className="btn-delete-item"
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
          )}
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
                  <strong>Kategorie:</strong> {selectedItem.descriptionExtra}
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
