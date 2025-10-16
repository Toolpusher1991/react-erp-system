// src/pages/SAPPreventiveMaintenance.tsx
import { useState } from "react";
import * as XLSX from "xlsx";

interface MaintenanceItem {
  id: number;
  equipment: string;
  serialNumber: string;
  description: string;
  dueDate: Date | null;
  lastInspection: Date | null;
  status: string;
  location: string;
  certificationType: string;
  isOverdue: boolean;
  priority: string;
  remarks: string;
}

interface RSCDocument {
  orderNumber: string;
  date: string;
  createdBy: string;
  approvedBy: string;
  rigNumber: string;
  items: (MaintenanceItem & {
    inspectionResult: string;
    nextDueDate: string;
  })[];
}

function SAPPreventiveMaintenance() {
  const [maintenanceData, setMaintenanceData] = useState<MaintenanceItem[]>([]);
  const [overdueItems, setOverdueItems] = useState<MaintenanceItem[]>([]);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [showRSCPreview, setShowRSCPreview] = useState(false);
  const [rscDocument, setRscDocument] = useState<RSCDocument | null>(null);

  const loadSampleData = () => {
    const today = new Date();
    const sampleData: MaintenanceItem[] = [
      {
        id: 1,
        equipment: "Top Drive TDS-11SA",
        serialNumber: "TD-2019-4487",
        description: "Hauptantrieb Top Drive System",
        dueDate: new Date(today.getTime() - 120 * 24 * 60 * 60 * 1000),
        lastInspection: new Date(today.getTime() - 485 * 24 * 60 * 60 * 1000),
        status: "Überfällig",
        location: "Rig 47",
        certificationType: "API 8C",
        isOverdue: true,
        priority: "Kritisch",
        remarks: "",
      },
      {
        id: 2,
        equipment: "Drawworks DW-750",
        serialNumber: "DW-2020-8821",
        description: "Hydraulisches Zugwerk",
        dueDate: new Date(today.getTime() - 65 * 24 * 60 * 60 * 1000),
        lastInspection: new Date(today.getTime() - 430 * 24 * 60 * 60 * 1000),
        status: "Überfällig",
        location: "Rig 47",
        certificationType: "DNV-GL 2.7-1",
        isOverdue: true,
        priority: "Hoch",
        remarks: "",
      },
      {
        id: 3,
        equipment: "BOP Stack - Cameron Type U",
        serialNumber: "BOP-2018-3304",
        description: "Blowout Preventer 15000 PSI",
        dueDate: new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000),
        lastInspection: new Date(today.getTime() - 380 * 24 * 60 * 60 * 1000),
        status: "Überfällig",
        location: "Rig 47",
        certificationType: "API 16A",
        isOverdue: true,
        priority: "Mittel",
        remarks: "",
      },
      {
        id: 4,
        equipment: "Mud Pump FMC-1600",
        serialNumber: "MP-2021-5593",
        description: "Triplex Schlammpumpe",
        dueDate: new Date(today.getTime() - 150 * 24 * 60 * 60 * 1000),
        lastInspection: new Date(today.getTime() - 515 * 24 * 60 * 60 * 1000),
        status: "Überfällig",
        location: "Rig 52",
        certificationType: "API 7K",
        isOverdue: true,
        priority: "Kritisch",
        remarks: "",
      },
      {
        id: 5,
        equipment: "Traveling Block TB-500",
        serialNumber: "TB-2019-7742",
        description: "Flaschenzug 500 Tonnen",
        dueDate: new Date(today.getTime() - 45 * 24 * 60 * 60 * 1000),
        lastInspection: new Date(today.getTime() - 410 * 24 * 60 * 60 * 1000),
        status: "Überfällig",
        location: "Rig 52",
        certificationType: "API 8A",
        isOverdue: true,
        priority: "Hoch",
        remarks: "",
      },
      {
        id: 6,
        equipment: "Rotary Table RT-375",
        serialNumber: "RT-2020-2156",
        description: "Drehtisch hydraulisch",
        dueDate: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000),
        lastInspection: new Date(today.getTime() - 335 * 24 * 60 * 60 * 1000),
        status: "In Ordnung",
        location: "Rig 52",
        certificationType: "API 7K",
        isOverdue: false,
        priority: "Normal",
        remarks: "",
      },
      {
        id: 7,
        equipment: "Crown Block CB-650",
        serialNumber: "CB-2018-8891",
        description: "Kronblock mit Lagerung",
        dueDate: new Date(today.getTime() - 95 * 24 * 60 * 60 * 1000),
        lastInspection: new Date(today.getTime() - 460 * 24 * 60 * 60 * 1000),
        status: "Überfällig",
        location: "Rig 47",
        certificationType: "API 8A",
        isOverdue: true,
        priority: "Kritisch",
        remarks: "",
      },
      {
        id: 8,
        equipment: "Shale Shaker SS-2000",
        serialNumber: "SS-2021-4425",
        description: "Rüttelsieb doppelt",
        dueDate: new Date(today.getTime() - 22 * 24 * 60 * 60 * 1000),
        lastInspection: new Date(today.getTime() - 387 * 24 * 60 * 60 * 1000),
        status: "Überfällig",
        location: "Rig 52",
        certificationType: "DNV 2.7-1",
        isOverdue: true,
        priority: "Mittel",
        remarks: "",
      },
      {
        id: 9,
        equipment: "Drilling Line Wire Rope",
        serialNumber: "DL-2022-9374",
        description: "Bohrseil 1.5 Inch",
        dueDate: new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000),
        lastInspection: new Date(today.getTime() - 350 * 24 * 60 * 60 * 1000),
        status: "In Ordnung",
        location: "Rig 47",
        certificationType: "API 9A",
        isOverdue: false,
        priority: "Normal",
        remarks: "",
      },
      {
        id: 10,
        equipment: "Pipe Racker PR-Auto",
        serialNumber: "PR-2020-6617",
        description: "Automatisches Rohrlager",
        dueDate: new Date(today.getTime() - 38 * 24 * 60 * 60 * 1000),
        lastInspection: new Date(today.getTime() - 403 * 24 * 60 * 60 * 1000),
        status: "Überfällig",
        location: "Rig 52",
        certificationType: "API 4F",
        isOverdue: true,
        priority: "Hoch",
        remarks: "",
      },
    ];

    setMaintenanceData(sampleData);
    setOverdueItems(sampleData.filter((item) => item.isOverdue));
    setFileName("Beispieldaten_SAP_PM_Liste.xlsx");
    setError("");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError("");

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

      const today = new Date();
      const processed: MaintenanceItem[] = jsonData.map((row, index) => {
        let dueDate: Date | null = null;
        let lastInspection: Date | null = null;

        const dueDateField =
          row["Fälligkeitsdatum"] ||
          row["Due Date"] ||
          row["Datum"] ||
          row["Date"];
        const lastInspectionField =
          row["Letzte Inspektion"] ||
          row["Last Inspection"] ||
          row["Last Check"];

        if (dueDateField) {
          if (typeof dueDateField === "number") {
            dueDate = new Date((dueDateField - 25569) * 86400 * 1000);
          } else {
            dueDate = new Date(dueDateField);
          }
        }

        if (lastInspectionField) {
          if (typeof lastInspectionField === "number") {
            lastInspection = new Date(
              (lastInspectionField - 25569) * 86400 * 1000
            );
          } else {
            lastInspection = new Date(lastInspectionField);
          }
        }

        const isOverdue = dueDate ? dueDate < today : false;

        let priority = "Normal";
        if (isOverdue && dueDate) {
          const daysOverdue = Math.floor(
            (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (daysOverdue > 90) priority = "Kritisch";
          else if (daysOverdue > 30) priority = "Hoch";
          else priority = "Mittel";
        }

        return {
          id: index + 1,
          equipment:
            row["Equipment"] || row["Komponente"] || row["Material"] || "",
          serialNumber:
            row["Serial Number"] || row["Seriennummer"] || row["SN"] || "",
          description: row["Description"] || row["Beschreibung"] || "",
          dueDate,
          lastInspection,
          status: isOverdue ? "Überfällig" : "In Ordnung",
          location: row["Location"] || row["Standort"] || row["Rig"] || "",
          certificationType:
            row["Certification Type"] ||
            row["Zertifizierungsart"] ||
            row["Cert Type"] ||
            "Standard",
          isOverdue,
          priority,
          remarks: "",
        };
      });

      setMaintenanceData(processed);
      setOverdueItems(processed.filter((item) => item.isOverdue));
    } catch (err) {
      setError(
        "Fehler beim Verarbeiten der Datei. Bitte stelle sicher, dass es eine gültige Excel-Datei ist."
      );
      console.error(err);
    }
  };

  const generateRSCDocument = () => {
    if (overdueItems.length === 0) {
      alert("Keine überfälligen Inspektionen vorhanden.");
      return;
    }

    const doc: RSCDocument = {
      orderNumber: `RSC-${new Date().getFullYear()}-${String(
        Math.floor(Math.random() * 9999)
      ).padStart(4, "0")}`,
      date: new Date().toLocaleDateString("de-DE"),
      createdBy: "",
      approvedBy: "",
      rigNumber: overdueItems[0]?.location || "",
      items: overdueItems.map((item) => ({
        ...item,
        inspectionResult: "",
        nextDueDate: "",
      })),
    };

    setRscDocument(doc);
    setShowRSCPreview(true);
  };

  const updateRSCField = (field: keyof RSCDocument, value: string) => {
    setRscDocument((prev) =>
      prev
        ? {
            ...prev,
            [field]: value,
          }
        : null
    );
  };

  const updateItemField = (itemId: number, field: string, value: string) => {
    setRscDocument((prev) =>
      prev
        ? {
            ...prev,
            items: prev.items.map((item) =>
              item.id === itemId ? { ...item, [field]: value } : item
            ),
          }
        : null
    );
  };

  const printRSCDocument = () => {
    window.print();
  };

  const downloadRSCAsExcel = () => {
    if (!rscDocument) return;

    const wsData = [
      ["RSC INSPEKTIONSAUFTRAG"],
      [],
      ["Auftragsnummer:", rscDocument.orderNumber],
      ["Datum:", rscDocument.date],
      ["Rig/Standort:", rscDocument.rigNumber],
      ["Erstellt von:", rscDocument.createdBy],
      ["Genehmigt von:", rscDocument.approvedBy],
      [],
      [
        "Nr.",
        "Equipment",
        "Seriennummer",
        "Zertifizierungsart",
        "Letzte Inspektion",
        "Fällig seit",
        "Priorität",
        "Bemerkungen",
        "Prüfergebnis",
        "Nächste Fälligkeit",
      ],
      ...rscDocument.items.map((item, idx) => [
        idx + 1,
        item.equipment,
        item.serialNumber,
        item.certificationType,
        item.lastInspection
          ? item.lastInspection.toLocaleDateString("de-DE")
          : "N/A",
        item.dueDate ? item.dueDate.toLocaleDateString("de-DE") : "N/A",
        item.priority,
        item.remarks,
        item.inspectionResult,
        item.nextDueDate,
      ]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    ws["!cols"] = [
      { wch: 5 },
      { wch: 25 },
      { wch: 15 },
      { wch: 20 },
      { wch: 15 },
      { wch: 15 },
      { wch: 12 },
      { wch: 30 },
      { wch: 15 },
      { wch: 15 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "RSC Auftrag");
    XLSX.writeFile(wb, `RSC_Auftrag_${rscDocument.orderNumber}.xlsx`);
  };

  const exportToExcel = () => {
    if (overdueItems.length === 0) return;

    const ws = XLSX.utils.json_to_sheet(
      overdueItems.map((item) => ({
        Equipment: item.equipment,
        Seriennummer: item.serialNumber,
        Beschreibung: item.description,
        Fälligkeitsdatum: item.dueDate
          ? item.dueDate.toLocaleDateString("de-DE")
          : "",
        "Letzte Inspektion": item.lastInspection
          ? item.lastInspection.toLocaleDateString("de-DE")
          : "",
        Standort: item.location,
        Zertifizierungsart: item.certificationType,
        Priorität: item.priority,
        Status: item.status,
      }))
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Überfällige Inspektionen");
    XLSX.writeFile(
      wb,
      `Ueberfaellige_Inspektionen_${
        new Date().toISOString().split("T")[0]
      }.xlsx`
    );
  };

  if (showRSCPreview && rscDocument) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--gray-100)",
          padding: "1.5rem",
        }}
      >
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          {/* Header Actions */}
          <div
            style={{
              background: "white",
              borderRadius: "12px",
              boxShadow: "var(--shadow)",
              padding: "1rem",
              marginBottom: "1.5rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
            className="print-hidden"
          >
            <button
              onClick={() => setShowRSCPreview(false)}
              style={{
                padding: "0.5rem 1rem",
                color: "var(--gray-600)",
                background: "transparent",
                border: "none",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              ← Zurück zur Übersicht
            </button>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                onClick={downloadRSCAsExcel}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  background: "var(--success)",
                  color: "white",
                  padding: "0.5rem 1rem",
                  borderRadius: "8px",
                  border: "none",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                📥 Als Excel
              </button>
              <button
                onClick={printRSCDocument}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  background: "var(--primary)",
                  color: "white",
                  padding: "0.5rem 1rem",
                  borderRadius: "8px",
                  border: "none",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                🖨️ Drucken
              </button>
            </div>
          </div>

          {/* RSC Document */}
          <div
            style={{
              background: "white",
              borderRadius: "12px",
              boxShadow: "var(--shadow)",
              padding: "2rem",
            }}
          >
            {/* Header */}
            <div
              style={{
                borderBottom: "4px solid var(--primary)",
                paddingBottom: "1.5rem",
                marginBottom: "1.5rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "start",
                }}
              >
                <div>
                  <h1
                    style={{
                      fontSize: "2rem",
                      fontWeight: "900",
                      margin: "0 0 0.5rem 0",
                    }}
                  >
                    RSC INSPEKTIONSAUFTRAG
                  </h1>
                  <p style={{ color: "var(--gray-600)", margin: 0 }}>
                    Preventive Maintenance - Zertifizierung
                  </p>
                </div>
                <div
                  style={{
                    background: "#EEF2FF",
                    padding: "1rem 1.5rem",
                    borderRadius: "8px",
                    textAlign: "right",
                  }}
                >
                  <p
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--gray-600)",
                      margin: 0,
                    }}
                  >
                    Auftragsnummer
                  </p>
                  <p
                    style={{
                      fontSize: "1.25rem",
                      fontWeight: "900",
                      color: "var(--primary)",
                      margin: 0,
                    }}
                  >
                    {rscDocument.orderNumber}
                  </p>
                </div>
              </div>
            </div>

            {/* Document Info */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "1.5rem",
                marginBottom: "2rem",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    color: "var(--gray-700)",
                    marginBottom: "0.5rem",
                  }}
                >
                  Datum
                </label>
                <input
                  type="text"
                  value={rscDocument.date}
                  onChange={(e) => updateRSCField("date", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "2px solid var(--gray-200)",
                    borderRadius: "8px",
                    fontSize: "0.9375rem",
                  }}
                  className="print-no-border"
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    color: "var(--gray-700)",
                    marginBottom: "0.5rem",
                  }}
                >
                  Rig/Standort
                </label>
                <input
                  type="text"
                  value={rscDocument.rigNumber}
                  onChange={(e) => updateRSCField("rigNumber", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "2px solid var(--gray-200)",
                    borderRadius: "8px",
                    fontSize: "0.9375rem",
                  }}
                  className="print-no-border"
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    color: "var(--gray-700)",
                    marginBottom: "0.5rem",
                  }}
                >
                  Erstellt von
                </label>
                <input
                  type="text"
                  value={rscDocument.createdBy}
                  onChange={(e) => updateRSCField("createdBy", e.target.value)}
                  placeholder="Name eingeben..."
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "2px solid var(--gray-200)",
                    borderRadius: "8px",
                    fontSize: "0.9375rem",
                  }}
                  className="print-no-border"
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    color: "var(--gray-700)",
                    marginBottom: "0.5rem",
                  }}
                >
                  Genehmigt von
                </label>
                <input
                  type="text"
                  value={rscDocument.approvedBy}
                  onChange={(e) => updateRSCField("approvedBy", e.target.value)}
                  placeholder="Name eingeben..."
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "2px solid var(--gray-200)",
                    borderRadius: "8px",
                    fontSize: "0.9375rem",
                  }}
                  className="print-no-border"
                />
              </div>
            </div>

            {/* Items Summary */}
            <div
              style={{
                background: "#EEF2FF",
                borderRadius: "8px",
                padding: "1rem",
                marginBottom: "1.5rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "var(--gray-600)",
                    margin: 0,
                  }}
                >
                  Gesamtanzahl Komponenten
                </p>
                <p
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: "900",
                    color: "var(--primary)",
                    margin: 0,
                  }}
                >
                  {rscDocument.items.length}
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "var(--gray-600)",
                    margin: 0,
                  }}
                >
                  Kritische Priorität
                </p>
                <p
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: "900",
                    color: "var(--danger)",
                    margin: 0,
                  }}
                >
                  {
                    rscDocument.items.filter((i) => i.priority === "Kritisch")
                      .length
                  }
                </p>
              </div>
            </div>

            {/* Items Table */}
            <div style={{ marginBottom: "2rem" }}>
              <h2
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "700",
                  marginBottom: "1rem",
                }}
              >
                Zu inspizierende Komponenten
              </h2>
              <div style={{ overflowX: "auto" }}>
                <table className="pm-table">
                  <thead>
                    <tr>
                      <th>Nr.</th>
                      <th>Equipment</th>
                      <th>Seriennummer</th>
                      <th>Zertifizierung</th>
                      <th>Letzte Inspektion</th>
                      <th>Fällig seit</th>
                      <th>Priorität</th>
                      <th className="print-hidden">Bemerkungen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rscDocument.items.map((item, idx) => (
                      <tr key={item.id}>
                        <td>{idx + 1}</td>
                        <td style={{ fontWeight: "600" }}>{item.equipment}</td>
                        <td>{item.serialNumber}</td>
                        <td>{item.certificationType}</td>
                        <td>
                          {item.lastInspection
                            ? item.lastInspection.toLocaleDateString("de-DE")
                            : "N/A"}
                        </td>
                        <td
                          style={{ color: "var(--danger)", fontWeight: "600" }}
                        >
                          {item.dueDate
                            ? item.dueDate.toLocaleDateString("de-DE")
                            : "N/A"}
                        </td>
                        <td>
                          <span
                            className={`priority-badge priority-${item.priority.toLowerCase()}`}
                          >
                            {item.priority}
                          </span>
                        </td>
                        <td className="print-hidden">
                          <input
                            type="text"
                            value={item.remarks}
                            onChange={(e) =>
                              updateItemField(
                                item.id,
                                "remarks",
                                e.target.value
                              )
                            }
                            placeholder="Bemerkungen..."
                            style={{
                              width: "100%",
                              padding: "0.5rem",
                              border: "1px solid var(--gray-200)",
                              borderRadius: "4px",
                              fontSize: "0.875rem",
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* RSC Feedback */}
            <div
              style={{
                borderTop: "2px solid var(--gray-300)",
                paddingTop: "1.5rem",
                marginBottom: "2rem",
              }}
            >
              <h2
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "700",
                  marginBottom: "1rem",
                }}
              >
                RSC Rückmeldung (Optional)
              </h2>
              <div style={{ overflowX: "auto" }}>
                <table className="pm-table">
                  <thead>
                    <tr>
                      <th>Nr.</th>
                      <th>Equipment</th>
                      <th>Prüfergebnis</th>
                      <th>Nächste Fälligkeit</th>
                      <th>Bemerkungen RSC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rscDocument.items.map((item, idx) => (
                      <tr key={item.id}>
                        <td>{idx + 1}</td>
                        <td style={{ fontWeight: "600" }}>{item.equipment}</td>
                        <td>
                          <input
                            type="text"
                            value={item.inspectionResult}
                            onChange={(e) =>
                              updateItemField(
                                item.id,
                                "inspectionResult",
                                e.target.value
                              )
                            }
                            placeholder="OK / Mangelhaft..."
                            style={{
                              width: "100%",
                              padding: "0.5rem",
                              border: "1px solid var(--gray-200)",
                              borderRadius: "4px",
                              fontSize: "0.875rem",
                            }}
                            className="print-no-border"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={item.nextDueDate}
                            onChange={(e) =>
                              updateItemField(
                                item.id,
                                "nextDueDate",
                                e.target.value
                              )
                            }
                            placeholder="TT.MM.JJJJ"
                            style={{
                              width: "100%",
                              padding: "0.5rem",
                              border: "1px solid var(--gray-200)",
                              borderRadius: "4px",
                              fontSize: "0.875rem",
                            }}
                            className="print-no-border"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={item.remarks}
                            onChange={(e) =>
                              updateItemField(
                                item.id,
                                "remarks",
                                e.target.value
                              )
                            }
                            placeholder="Anmerkungen..."
                            style={{
                              width: "100%",
                              padding: "0.5rem",
                              border: "1px solid var(--gray-200)",
                              borderRadius: "4px",
                              fontSize: "0.875rem",
                            }}
                            className="print-no-border"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Signatures */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "2rem",
                marginTop: "3rem",
                paddingTop: "2rem",
                borderTop: "2px solid var(--gray-300)",
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    marginBottom: "2rem",
                  }}
                >
                  Erstellt von:
                </p>
                <div
                  style={{
                    borderTop: "2px solid var(--gray-400)",
                    paddingTop: "0.5rem",
                  }}
                >
                  <p style={{ fontSize: "0.875rem", color: "var(--gray-600)" }}>
                    {rscDocument.createdBy || "____________________"}
                  </p>
                  <p
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--gray-500)",
                      marginTop: "0.25rem",
                    }}
                  >
                    Name, Unterschrift, Datum
                  </p>
                </div>
              </div>
              <div>
                <p
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    marginBottom: "2rem",
                  }}
                >
                  Genehmigt von:
                </p>
                <div
                  style={{
                    borderTop: "2px solid var(--gray-400)",
                    paddingTop: "0.5rem",
                  }}
                >
                  <p style={{ fontSize: "0.875rem", color: "var(--gray-600)" }}>
                    {rscDocument.approvedBy || "____________________"}
                  </p>
                  <p
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--gray-500)",
                      marginTop: "0.25rem",
                    }}
                  >
                    Name, Unterschrift, Datum
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                marginTop: "2rem",
                paddingTop: "1rem",
                borderTop: "1px solid var(--gray-300)",
                textAlign: "center",
              }}
            >
              <p style={{ fontSize: "0.75rem", color: "var(--gray-500)" }}>
                Dokument erstellt am: {new Date().toLocaleString("de-DE")} |
                Auftragsnummer: {rscDocument.orderNumber}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pm-container">
      <h1>📋 SAP Preventive Maintenance</h1>

      {/* Upload Section */}
      <div className="pm-section">
        <h2>📤 SAP Excel Datei hochladen</h2>

        <div className="pm-upload-area">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            className="pm-file-input"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="pm-upload-label">
            <div className="pm-upload-icon">📁</div>
            <p>Klicken um SAP Excel Datei auszuwählen</p>
            <p className="pm-upload-hint">oder Datei hier ablegen</p>
          </label>
          {fileName && <p className="pm-filename">📄 {fileName}</p>}
        </div>

        <button onClick={loadSampleData} className="pm-sample-btn">
          📊 Beispieldaten laden (Demo)
        </button>

        {error && <div className="pm-error">⚠️ {error}</div>}
      </div>

      {/* Statistics */}
      {maintenanceData.length > 0 && (
        <div className="pm-stats">
          <div className="pm-stat-card">
            <div className="pm-stat-icon">📄</div>
            <div>
              <p>Gesamt</p>
              <p className="pm-stat-number">{maintenanceData.length}</p>
            </div>
          </div>

          <div className="pm-stat-card overdue">
            <div className="pm-stat-icon">⚠️</div>
            <div>
              <p>Überfällig</p>
              <p className="pm-stat-number">{overdueItems.length}</p>
            </div>
          </div>

          <div className="pm-stat-card critical">
            <div className="pm-stat-icon">🚨</div>
            <div>
              <p>Kritisch</p>
              <p className="pm-stat-number">
                {overdueItems.filter((i) => i.priority === "Kritisch").length}
              </p>
            </div>
          </div>

          <div className="pm-stat-card ok">
            <div className="pm-stat-icon">✅</div>
            <div>
              <p>In Ordnung</p>
              <p className="pm-stat-number">
                {maintenanceData.length - overdueItems.length}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      {overdueItems.length > 0 && (
        <div className="pm-actions">
          <h2>⚡ Aktionen</h2>
          <div className="pm-action-buttons">
            <button
              onClick={generateRSCDocument}
              className="pm-action-btn primary"
            >
              📄 RSC Dokument erstellen
            </button>
            <button onClick={exportToExcel} className="pm-action-btn success">
              📥 Excel Export (Überfällig)
            </button>
          </div>
        </div>
      )}

      {/* Overdue Items Table */}
      {overdueItems.length > 0 && (
        <div className="pm-section">
          <h2>⚠️ Überfällige Inspektionen ({overdueItems.length})</h2>
          <div className="pm-table-container">
            <table className="pm-table">
              <thead>
                <tr>
                  <th>Nr.</th>
                  <th>Equipment</th>
                  <th>Seriennummer</th>
                  <th>Zertifizierung</th>
                  <th>Letzte Inspektion</th>
                  <th>Fällig seit</th>
                  <th>Priorität</th>
                  <th>Standort</th>
                </tr>
              </thead>
              <tbody>
                {overdueItems.map((item) => (
                  <tr key={item.id} className="overdue-row">
                    <td>{item.id}</td>
                    <td className="equipment-name">{item.equipment}</td>
                    <td>{item.serialNumber}</td>
                    <td>{item.certificationType}</td>
                    <td>
                      {item.lastInspection
                        ? item.lastInspection.toLocaleDateString("de-DE")
                        : "N/A"}
                    </td>
                    <td className="overdue-date">
                      {item.dueDate
                        ? item.dueDate.toLocaleDateString("de-DE")
                        : "N/A"}
                    </td>
                    <td>
                      <span
                        className={`priority-badge priority-${item.priority.toLowerCase()}`}
                      >
                        {item.priority}
                      </span>
                    </td>
                    <td>{item.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* All Items Table */}
      {maintenanceData.length > 0 && (
        <div className="pm-section">
          <h2>📋 Alle Komponenten ({maintenanceData.length})</h2>
          <div className="pm-table-container">
            <table className="pm-table">
              <thead>
                <tr>
                  <th>Nr.</th>
                  <th>Equipment</th>
                  <th>Seriennummer</th>
                  <th>Fälligkeitsdatum</th>
                  <th>Priorität</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {maintenanceData.map((item) => (
                  <tr
                    key={item.id}
                    className={item.isOverdue ? "overdue-row" : ""}
                  >
                    <td>{item.id}</td>
                    <td className="equipment-name">{item.equipment}</td>
                    <td>{item.serialNumber}</td>
                    <td>
                      {item.dueDate
                        ? item.dueDate.toLocaleDateString("de-DE")
                        : "N/A"}
                    </td>
                    <td>
                      <span
                        className={`priority-badge priority-${item.priority.toLowerCase()}`}
                      >
                        {item.priority}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`status-badge status-${
                          item.isOverdue ? "overdue" : "ok"
                        }`}
                      >
                        {item.isOverdue ? "⚠️" : "✅"} {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default SAPPreventiveMaintenance;
