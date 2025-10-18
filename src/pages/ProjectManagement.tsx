// src/pages/ProjectManagement.tsx

import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  getProjects,
  getAssets,
  createProject,
  updateProject,
} from "../services/api";
import type { Project, Asset } from "../types";

function ProjectManagement() {
  const { currentUser } = useAuth();

  // Backend state
  const [projects, setProjects] = useState<Project[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProject, setNewProject] = useState<Partial<Project>>({
    projectName: "",
    status: "Geplant",
    priority: "Normal",
    progress: 0,
    description: "",
    objectives: "",
    scope: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    budget: 0,
    spent: 0,
    manager: "",
    risks: "",
    notes: "",
  });

  // Load data from backend
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        console.log("🏗️ Loading Projects and Assets from Backend...");

        const [projectsResult, assetsResult] = await Promise.all([
          getProjects(),
          getAssets(),
        ]);

        if (projectsResult.data) {
          const data = projectsResult.data as any;
          setProjects(data.projects || []);
          console.log("✅ Projects loaded:", data.projects?.length);
        }

        if (assetsResult.data) {
          const data = assetsResult.data as any;
          setAssets(data.assets || []);
          console.log("✅ Assets loaded:", data.assets?.length);
        }
      } catch (error) {
        console.error("❌ Failed to load data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Sichtbare Assets für den User - Admin sieht alle
  const visibleAssets =
    currentUser?.role === "Admin"
      ? assets
      : assets.filter(
          (asset) =>
            currentUser?.assignedAssets?.includes(asset.id) ||
            currentUser?.assignedAssets?.length === 0
        );

  // Setze erste Anlage als Standard
  useEffect(() => {
    if (selectedAssetId === null && visibleAssets.length > 0) {
      setSelectedAssetId(visibleAssets[0].id);
    }
  }, [visibleAssets, selectedAssetId]);

  // Filtere Projekte für ausgewählte Anlage
  const assetProjects = selectedAssetId
    ? projects.filter((p) => p.assetId === selectedAssetId)
    : [];

  // Statistiken
  const stats = {
    total: assetProjects.length,
    active: assetProjects.filter((p) => p.status === "In Arbeit").length,
    planned: assetProjects.filter((p) => p.status === "Geplant").length,
    completed: assetProjects.filter((p) => p.status === "Abgeschlossen").length,
    totalBudget: assetProjects.reduce((sum, p) => sum + p.budget, 0),
    totalSpent: assetProjects.reduce((sum, p) => sum + p.spent, 0),
  };

  const getStatusColor = (status: Project["status"]) => {
    switch (status) {
      case "Geplant":
        return "#3b82f6";
      case "In Arbeit":
        return "#f59e0b";
      case "Abgeschlossen":
        return "#10b981";
      case "Verzögert":
        return "#ef4444";
      case "On Hold":
        return "#6b7280";
      default:
        return "#9ca3af";
    }
  };

  const getPriorityColor = (priority: Project["priority"]) => {
    switch (priority) {
      case "Kritisch":
        return "#ef4444";
      case "Hoch":
        return "#f59e0b";
      case "Normal":
        return "#3b82f6";
      case "Niedrig":
        return "#6b7280";
      default:
        return "#9ca3af";
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleEdit = () => {
    if (!selectedProject) return;
    setEditingProject({ ...selectedProject });
    setShowEditModal(true);
    setSelectedProject(null);
  };

  const handleSave = async () => {
    if (!editingProject) return;

    try {
      const updatedProject: Project = {
        ...editingProject,
        updatedAt: new Date().toISOString(),
      };

      console.log("📝 Updating Project:", updatedProject);
      const result = await updateProject(updatedProject.id, updatedProject);

      if (result.data) {
        console.log("✅ Project updated:", result.data);

        // Lade Projekte neu vom Backend
        const projectsResult = await getProjects();
        if (projectsResult.data) {
          const data = projectsResult.data as any;
          setProjects(data.projects || []);
        }

        setShowEditModal(false);
        setEditingProject(null);
      } else {
        throw new Error(result.error || "Failed to update project");
      }
    } catch (error) {
      console.error("❌ Failed to update project:", error);
      alert("Fehler beim Aktualisieren des Projekts");
    }
  };

  const handleCreate = async () => {
    if (!selectedAssetId || !newProject.projectName) return;

    try {
      const selectedAsset = visibleAssets.find((a) => a.id === selectedAssetId);
      if (!selectedAsset) return;

      const projectToCreate: Partial<Project> = {
        assetId: selectedAssetId,
        assetName: selectedAsset.name,
        projectName: newProject.projectName!,
        status: (newProject.status as Project["status"]) || "Geplant",
        priority: (newProject.priority as Project["priority"]) || "Normal",
        progress: newProject.progress || 0,
        description: newProject.description || "",
        objectives: newProject.objectives || "",
        scope: newProject.scope || "",
        startDate:
          newProject.startDate || new Date().toISOString().split("T")[0],
        endDate: newProject.endDate || new Date().toISOString().split("T")[0],
        budget: newProject.budget || 0,
        spent: newProject.spent || 0,
        manager: newProject.manager || "",
        risks: newProject.risks || "",
        notes: newProject.notes || "",
      };

      console.log("📝 Creating Project:", projectToCreate);
      const result = await createProject(projectToCreate);

      if (result.data) {
        console.log("✅ Project created:", result.data);

        // Lade Projekte neu vom Backend
        const projectsResult = await getProjects();
        if (projectsResult.data) {
          const data = projectsResult.data as any;
          setProjects(data.projects || []);
        }

        setShowCreateModal(false);
        setNewProject({
          projectName: "",
          status: "Geplant",
          priority: "Normal",
          progress: 0,
          description: "",
          objectives: "",
          scope: "",
          startDate: new Date().toISOString().split("T")[0],
          endDate: "",
          budget: 0,
          spent: 0,
          manager: "",
          risks: "",
          notes: "",
        });
      } else {
        throw new Error(result.error || "Failed to create project");
      }
    } catch (error) {
      console.error("❌ Failed to create project:", error);
      alert("Fehler beim Erstellen des Projekts");
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="container">
        <h1>🏗️ Projekt Management</h1>
        <div style={{ textAlign: "center", padding: "50px" }}>
          <div>⏳ Lade Projekte vom Backend...</div>
          <div style={{ marginTop: "10px", fontSize: "14px", color: "#666" }}>
            Verbinde mit http://localhost:3001/api/projects
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <h1 style={{ margin: 0 }}>🏗️ Projekt Management</h1>
        <button
          className="btn-create-wo"
          style={{
            background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
            padding: "1rem 2rem",
          }}
          onClick={() => setShowCreateModal(true)}
        >
          + Neues Projekt
        </button>
      </div>

      {/* ASSET TABS */}
      <div className="asset-tabs">
        {visibleAssets.map((asset) => {
          const assetProjectCount = projects.filter(
            (p) => p.assetId === asset.id
          ).length;
          return (
            <button
              key={asset.id}
              className={`asset-tab ${
                selectedAssetId === asset.id ? "active" : ""
              }`}
              onClick={() => setSelectedAssetId(asset.id)}
            >
              <span className="asset-tab-icon">🛢️</span>
              <span className="asset-tab-name">{asset.name}</span>
              <span className="asset-tab-count">{assetProjectCount}</span>
            </button>
          );
        })}
      </div>

      {/* STATISTICS */}
      <div className="wo-stats">
        <div className="stat-card">
          <h3>Projekte Gesamt</h3>
          <p className="stat-number">{stats.total}</p>
        </div>
        <div className="stat-card" style={{ borderLeft: "4px solid #f59e0b" }}>
          <h3>In Arbeit</h3>
          <p className="stat-number">{stats.active}</p>
        </div>
        <div className="stat-card" style={{ borderLeft: "4px solid #3b82f6" }}>
          <h3>Geplant</h3>
          <p className="stat-number">{stats.planned}</p>
        </div>
        <div className="stat-card" style={{ borderLeft: "4px solid #10b981" }}>
          <h3>Abgeschlossen</h3>
          <p className="stat-number">{stats.completed}</p>
        </div>
        <div
          className="stat-card"
          style={{
            background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
            color: "white",
            gridColumn: "span 2",
          }}
        >
          <h3 style={{ color: "rgba(255,255,255,0.9)" }}>
            💰 Budget Übersicht
          </h3>
          <div style={{ display: "flex", gap: "2rem", alignItems: "baseline" }}>
            <div>
              <p
                className="stat-number"
                style={{ fontSize: "1.5rem", color: "white" }}
              >
                {formatCurrency(stats.totalBudget)}
              </p>
              <span style={{ opacity: 0.8, fontSize: "0.875rem" }}>
                Gesamt Budget
              </span>
            </div>
            <div>
              <p
                className="stat-number"
                style={{ fontSize: "1.5rem", color: "white" }}
              >
                {formatCurrency(stats.totalSpent)}
              </p>
              <span style={{ opacity: 0.8, fontSize: "0.875rem" }}>
                Ausgegeben
              </span>
            </div>
            <div>
              <p
                className="stat-number"
                style={{ fontSize: "1.5rem", color: "white" }}
              >
                {stats.totalBudget > 0
                  ? Math.round((stats.totalSpent / stats.totalBudget) * 100)
                  : 0}
                %
              </p>
              <span style={{ opacity: 0.8, fontSize: "0.875rem" }}>
                Verbraucht
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* PROJECT TABLE */}
      <div className="wo-table-container">
        <table className="wo-table">
          <thead>
            <tr>
              <th>Projekt</th>
              <th>Status</th>
              <th>Fortschritt</th>
              <th>Priorität</th>
              <th>Budget</th>
              <th>Zeitraum</th>
              <th>Manager</th>
            </tr>
          </thead>
          <tbody>
            {assetProjects.length === 0 ? (
              <tr>
                <td colSpan={7} className="wo-empty">
                  <p>Keine Projekte für diese Anlage vorhanden</p>
                </td>
              </tr>
            ) : (
              assetProjects.map((project) => (
                <tr
                  key={project.id}
                  onClick={() => setSelectedProject(project)}
                  style={{ cursor: "pointer" }}
                >
                  <td>
                    <div style={{ fontWeight: "700", marginBottom: "0.25rem" }}>
                      {project.projectName}
                    </div>
                    <div style={{ fontSize: "0.8125rem", color: "#6b7280" }}>
                      #{project.id}
                    </div>
                  </td>
                  <td>
                    <span
                      className="wo-status"
                      style={{
                        background: `${getStatusColor(project.status)}15`,
                        color: getStatusColor(project.status),
                      }}
                    >
                      {project.status}
                    </span>
                  </td>
                  <td>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                      }}
                    >
                      <div
                        style={{
                          flex: 1,
                          height: "8px",
                          background: "#e5e7eb",
                          borderRadius: "999px",
                          overflow: "hidden",
                          maxWidth: "120px",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${project.progress}%`,
                            background: getStatusColor(project.status),
                            borderRadius: "999px",
                          }}
                        />
                      </div>
                      <span
                        style={{
                          fontSize: "0.875rem",
                          fontWeight: "700",
                          minWidth: "45px",
                        }}
                      >
                        {project.progress}%
                      </span>
                    </div>
                  </td>
                  <td>
                    <span
                      className="wo-priority"
                      style={{
                        background: `${getPriorityColor(project.priority)}15`,
                        color: getPriorityColor(project.priority),
                      }}
                    >
                      {project.priority}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: "700", marginBottom: "0.25rem" }}>
                      {formatCurrency(project.budget)}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                      {formatCurrency(project.spent)} ausgegeben
                    </div>
                  </td>
                  <td style={{ fontSize: "0.875rem", fontWeight: "500" }}>
                    {new Date(project.startDate).toLocaleDateString("de-DE", {
                      day: "2-digit",
                      month: "short",
                    })}{" "}
                    -{" "}
                    {new Date(project.endDate).toLocaleDateString("de-DE", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td style={{ fontSize: "0.875rem", fontWeight: "600" }}>
                    {project.manager}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* PROJECT DETAIL MODAL */}
      {selectedProject && (
        <>
          <div
            className="wo-modal-overlay"
            onClick={() => setSelectedProject(null)}
          />
          <div className="wo-detail-modal" style={{ maxWidth: "1100px" }}>
            <div
              className="wo-detail-header"
              style={{
                background: `linear-gradient(135deg, ${getStatusColor(
                  selectedProject.status
                )}, ${getStatusColor(selectedProject.status)}dd)`,
                color: "white",
                padding: "2.5rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "start",
                  marginBottom: "1.5rem",
                }}
              >
                <div>
                  <h2 style={{ margin: "0 0 0.5rem 0", fontSize: "2rem" }}>
                    {selectedProject.projectName}
                  </h2>
                  <div
                    style={{
                      display: "flex",
                      gap: "1rem",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        background: "rgba(255,255,255,0.25)",
                        padding: "0.5rem 1rem",
                        borderRadius: "12px",
                        fontSize: "0.875rem",
                        fontWeight: "700",
                      }}
                    >
                      {selectedProject.status}
                    </span>
                    <span
                      style={{
                        background: "rgba(255,255,255,0.25)",
                        padding: "0.5rem 1rem",
                        borderRadius: "12px",
                        fontSize: "0.875rem",
                        fontWeight: "700",
                      }}
                    >
                      Priorität: {selectedProject.priority}
                    </span>
                    <span style={{ fontSize: "0.875rem", opacity: 0.9 }}>
                      Projekt #{selectedProject.id} •{" "}
                      {selectedProject.assetName}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedProject(null)}
                  className="btn-close-modal"
                  style={{
                    background: "rgba(255,255,255,0.25)",
                    color: "white",
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Progress Bar */}
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "0.75rem",
                  }}
                >
                  <span style={{ fontSize: "1rem", fontWeight: "700" }}>
                    Projekt-Fortschritt
                  </span>
                  <span style={{ fontSize: "1.25rem", fontWeight: "800" }}>
                    {selectedProject.progress}%
                  </span>
                </div>
                <div
                  style={{
                    background: "rgba(255,255,255,0.25)",
                    height: "16px",
                    borderRadius: "999px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      background: "white",
                      height: "100%",
                      width: `${selectedProject.progress}%`,
                      borderRadius: "999px",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="wo-detail-body" style={{ padding: "2.5rem" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr",
                  gap: "2rem",
                }}
              >
                {/* Left Column */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1.5rem",
                  }}
                >
                  <div className="wo-detail-section">
                    <h3>📋 Beschreibung</h3>
                    <p>{selectedProject.description}</p>
                  </div>

                  <div className="wo-detail-section">
                    <h3>🎯 Projektziele</h3>
                    <p>{selectedProject.objectives}</p>
                  </div>

                  <div className="wo-detail-section">
                    <h3>🔧 Umfang</h3>
                    <p>{selectedProject.scope}</p>
                  </div>

                  {selectedProject.risks && (
                    <div
                      style={{
                        padding: "1.5rem",
                        background: "#fef3c7",
                        borderRadius: "12px",
                        borderLeft: "4px solid #f59e0b",
                      }}
                    >
                      <h3
                        style={{
                          margin: "0 0 0.75rem 0",
                          fontSize: "1rem",
                          fontWeight: "800",
                          color: "#92400e",
                        }}
                      >
                        ⚠️ Risiken
                      </h3>
                      <p
                        style={{
                          margin: 0,
                          color: "#78350f",
                          lineHeight: "1.7",
                        }}
                      >
                        {selectedProject.risks}
                      </p>
                    </div>
                  )}

                  {selectedProject.notes && (
                    <div
                      style={{
                        padding: "1.5rem",
                        background: "#f9fafb",
                        borderRadius: "12px",
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      <h3
                        style={{
                          margin: "0 0 0.75rem 0",
                          fontSize: "1rem",
                          fontWeight: "800",
                        }}
                      >
                        📝 Notizen
                      </h3>
                      <p
                        style={{
                          margin: 0,
                          lineHeight: "1.7",
                          fontStyle: "italic",
                        }}
                      >
                        {selectedProject.notes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Right Column */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1.5rem",
                  }}
                >
                  <div
                    style={{
                      padding: "1.5rem",
                      background: "#f9fafb",
                      borderRadius: "16px",
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    <h3
                      style={{
                        margin: "0 0 1.5rem 0",
                        fontSize: "1.125rem",
                        fontWeight: "800",
                      }}
                    >
                      📅 Zeitplan
                    </h3>
                    <div style={{ marginBottom: "1rem" }}>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "#6b7280",
                          fontWeight: "700",
                          textTransform: "uppercase",
                          marginBottom: "0.5rem",
                        }}
                      >
                        Start
                      </div>
                      <div style={{ fontSize: "1.125rem", fontWeight: "700" }}>
                        {new Date(selectedProject.startDate).toLocaleDateString(
                          "de-DE"
                        )}
                      </div>
                    </div>
                    <div
                      style={{
                        borderTop: "1px solid #e5e7eb",
                        paddingTop: "1rem",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "#6b7280",
                          fontWeight: "700",
                          textTransform: "uppercase",
                          marginBottom: "0.5rem",
                        }}
                      >
                        Geplantes Ende
                      </div>
                      <div style={{ fontSize: "1.125rem", fontWeight: "700" }}>
                        {new Date(selectedProject.endDate).toLocaleDateString(
                          "de-DE"
                        )}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
                      padding: "1.5rem",
                      borderRadius: "16px",
                      boxShadow: "0 4px 12px rgba(139, 92, 246, 0.3)",
                      color: "white",
                    }}
                  >
                    <h3
                      style={{
                        margin: "0 0 1.5rem 0",
                        fontSize: "1.125rem",
                        fontWeight: "800",
                      }}
                    >
                      💰 Budget
                    </h3>
                    <div style={{ marginBottom: "1rem" }}>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          opacity: 0.9,
                          fontWeight: "700",
                          marginBottom: "0.5rem",
                        }}
                      >
                        Gesamt Budget
                      </div>
                      <div style={{ fontSize: "1.75rem", fontWeight: "800" }}>
                        {formatCurrency(selectedProject.budget)}
                      </div>
                    </div>
                    <div
                      style={{
                        borderTop: "1px solid rgba(255,255,255,0.2)",
                        paddingTop: "1rem",
                        marginBottom: "1rem",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "0.75rem",
                          opacity: 0.9,
                          fontWeight: "700",
                          marginBottom: "0.5rem",
                        }}
                      >
                        Ausgegeben
                      </div>
                      <div style={{ fontSize: "1.5rem", fontWeight: "800" }}>
                        {formatCurrency(selectedProject.spent)}
                      </div>
                    </div>
                    <div
                      style={{
                        background: "rgba(255,255,255,0.15)",
                        height: "12px",
                        borderRadius: "999px",
                        overflow: "hidden",
                        marginBottom: "0.5rem",
                      }}
                    >
                      <div
                        style={{
                          background: "white",
                          height: "100%",
                          width: `${Math.min(
                            (selectedProject.spent / selectedProject.budget) *
                              100,
                            100
                          )}%`,
                          borderRadius: "999px",
                        }}
                      />
                    </div>
                    <div
                      style={{
                        fontSize: "0.875rem",
                        opacity: 0.9,
                        textAlign: "right",
                        marginBottom: "1rem",
                      }}
                    >
                      {Math.round(
                        (selectedProject.spent / selectedProject.budget) * 100
                      )}
                      % verbraucht
                    </div>
                    <div
                      style={{
                        borderTop: "1px solid rgba(255,255,255,0.2)",
                        paddingTop: "1rem",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "0.75rem",
                          opacity: 0.9,
                          fontWeight: "700",
                          marginBottom: "0.5rem",
                        }}
                      >
                        Verfügbar
                      </div>
                      <div style={{ fontSize: "1.5rem", fontWeight: "800" }}>
                        {formatCurrency(
                          Math.max(
                            selectedProject.budget - selectedProject.spent,
                            0
                          )
                        )}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      padding: "1.5rem",
                      background: "#f9fafb",
                      borderRadius: "16px",
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    <h3
                      style={{
                        margin: "0 0 1rem 0",
                        fontSize: "1.125rem",
                        fontWeight: "800",
                      }}
                    >
                      👨‍💼 Projektleiter
                    </h3>
                    <div
                      style={{
                        padding: "1rem",
                        background: "white",
                        borderRadius: "12px",
                        fontSize: "1rem",
                        fontWeight: "700",
                        border: "2px solid #e5e7eb",
                      }}
                    >
                      {selectedProject.manager}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="wo-detail-footer">
              <button onClick={handleEdit} className="btn-wo-edit">
                ✏️ Bearbeiten
              </button>
              <button
                onClick={() => setSelectedProject(null)}
                className="btn-wo-close"
              >
                Schließen
              </button>
            </div>
          </div>
        </>
      )}

      {/* EDIT MODAL */}
      {showEditModal && editingProject && (
        <>
          <div
            className="wo-modal-overlay"
            onClick={() => setShowEditModal(false)}
            style={{ zIndex: 1001 }}
          />
          <div
            className="wo-edit-modal"
            style={{ zIndex: 1002, maxWidth: "800px" }}
          >
            <div className="wo-edit-header">
              <div>
                <h2>✏️ Projekt bearbeiten</h2>
                <span className="wo-detail-id">
                  {editingProject.assetName} - {editingProject.projectName}
                </span>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="btn-close-modal"
              >
                ✕
              </button>
            </div>

            <div className="wo-edit-body">
              <div className="form-group">
                <label>Projektname</label>
                <input
                  type="text"
                  value={editingProject.projectName}
                  onChange={(e) =>
                    setEditingProject({
                      ...editingProject,
                      projectName: e.target.value,
                    })
                  }
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={editingProject.status}
                    onChange={(e) =>
                      setEditingProject({
                        ...editingProject,
                        status: e.target.value as any,
                      })
                    }
                  >
                    <option value="Geplant">Geplant</option>
                    <option value="In Arbeit">In Arbeit</option>
                    <option value="Verzögert">Verzögert</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Abgeschlossen">Abgeschlossen</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Priorität</label>
                  <select
                    value={editingProject.priority}
                    onChange={(e) =>
                      setEditingProject({
                        ...editingProject,
                        priority: e.target.value as any,
                      })
                    }
                  >
                    <option value="Niedrig">Niedrig</option>
                    <option value="Normal">Normal</option>
                    <option value="Hoch">Hoch</option>
                    <option value="Kritisch">Kritisch</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Fortschritt (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={editingProject.progress}
                  onChange={(e) =>
                    setEditingProject({
                      ...editingProject,
                      progress: Number(e.target.value),
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label>Beschreibung</label>
                <textarea
                  value={editingProject.description}
                  onChange={(e) =>
                    setEditingProject({
                      ...editingProject,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label>Projektziele</label>
                <textarea
                  value={editingProject.objectives}
                  onChange={(e) =>
                    setEditingProject({
                      ...editingProject,
                      objectives: e.target.value,
                    })
                  }
                  rows={2}
                />
              </div>

              <div className="form-group">
                <label>Umfang</label>
                <textarea
                  value={editingProject.scope}
                  onChange={(e) =>
                    setEditingProject({
                      ...editingProject,
                      scope: e.target.value,
                    })
                  }
                  rows={2}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start-Datum</label>
                  <input
                    type="date"
                    value={editingProject.startDate}
                    onChange={(e) =>
                      setEditingProject({
                        ...editingProject,
                        startDate: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>End-Datum</label>
                  <input
                    type="date"
                    value={editingProject.endDate}
                    onChange={(e) =>
                      setEditingProject({
                        ...editingProject,
                        endDate: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Budget (EUR)</label>
                  <input
                    type="number"
                    value={editingProject.budget}
                    onChange={(e) =>
                      setEditingProject({
                        ...editingProject,
                        budget: Number(e.target.value),
                      })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Ausgegeben (EUR)</label>
                  <input
                    type="number"
                    value={editingProject.spent}
                    onChange={(e) =>
                      setEditingProject({
                        ...editingProject,
                        spent: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Projektleiter</label>
                <input
                  type="text"
                  value={editingProject.manager}
                  onChange={(e) =>
                    setEditingProject({
                      ...editingProject,
                      manager: e.target.value,
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label>Risiken</label>
                <textarea
                  value={editingProject.risks || ""}
                  onChange={(e) =>
                    setEditingProject({
                      ...editingProject,
                      risks: e.target.value,
                    })
                  }
                  rows={2}
                />
              </div>

              <div className="form-group">
                <label>Notizen</label>
                <textarea
                  value={editingProject.notes || ""}
                  onChange={(e) =>
                    setEditingProject({
                      ...editingProject,
                      notes: e.target.value,
                    })
                  }
                  rows={2}
                />
              </div>
            </div>

            <div className="wo-edit-footer">
              <button onClick={handleSave} className="btn-edit-save">
                💾 Speichern
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="btn-edit-cancel"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </>
      )}

      {/* CREATE MODAL */}
      {showCreateModal && (
        <>
          <div
            className="wo-modal-overlay"
            onClick={() => setShowCreateModal(false)}
            style={{ zIndex: 1001 }}
          />
          <div
            className="wo-edit-modal"
            style={{ zIndex: 1002, maxWidth: "800px" }}
          >
            <div className="wo-edit-header">
              <div>
                <h2>➕ Neues Projekt erstellen</h2>
                <span className="wo-detail-id">
                  {visibleAssets.find((a) => a.id === selectedAssetId)?.name}
                </span>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="btn-close-modal"
              >
                ✕
              </button>
            </div>

            <div className="wo-edit-body">
              <div className="form-group">
                <label>Projektname *</label>
                <input
                  type="text"
                  value={newProject.projectName}
                  onChange={(e) =>
                    setNewProject({
                      ...newProject,
                      projectName: e.target.value,
                    })
                  }
                  placeholder="z.B. Turbinen-Modernisierung 2025"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={newProject.status}
                    onChange={(e) =>
                      setNewProject({
                        ...newProject,
                        status: e.target.value as any,
                      })
                    }
                  >
                    <option value="Geplant">Geplant</option>
                    <option value="In Arbeit">In Arbeit</option>
                    <option value="Verzögert">Verzögert</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Abgeschlossen">Abgeschlossen</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Priorität</label>
                  <select
                    value={newProject.priority}
                    onChange={(e) =>
                      setNewProject({
                        ...newProject,
                        priority: e.target.value as any,
                      })
                    }
                  >
                    <option value="Niedrig">Niedrig</option>
                    <option value="Normal">Normal</option>
                    <option value="Hoch">Hoch</option>
                    <option value="Kritisch">Kritisch</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Fortschritt (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={newProject.progress}
                  onChange={(e) =>
                    setNewProject({
                      ...newProject,
                      progress: Number(e.target.value),
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label>Beschreibung</label>
                <textarea
                  value={newProject.description}
                  onChange={(e) =>
                    setNewProject({
                      ...newProject,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                  placeholder="Beschreiben Sie das Projekt..."
                />
              </div>

              <div className="form-group">
                <label>Projektziele</label>
                <textarea
                  value={newProject.objectives}
                  onChange={(e) =>
                    setNewProject({
                      ...newProject,
                      objectives: e.target.value,
                    })
                  }
                  rows={2}
                  placeholder="Was soll erreicht werden?"
                />
              </div>

              <div className="form-group">
                <label>Umfang</label>
                <textarea
                  value={newProject.scope}
                  onChange={(e) =>
                    setNewProject({
                      ...newProject,
                      scope: e.target.value,
                    })
                  }
                  rows={2}
                  placeholder="Welche Arbeiten sind enthalten?"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start-Datum</label>
                  <input
                    type="date"
                    value={newProject.startDate}
                    onChange={(e) =>
                      setNewProject({
                        ...newProject,
                        startDate: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>End-Datum</label>
                  <input
                    type="date"
                    value={newProject.endDate}
                    onChange={(e) =>
                      setNewProject({
                        ...newProject,
                        endDate: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Budget (EUR)</label>
                  <input
                    type="number"
                    value={newProject.budget}
                    onChange={(e) =>
                      setNewProject({
                        ...newProject,
                        budget: Number(e.target.value),
                      })
                    }
                    placeholder="0"
                  />
                </div>

                <div className="form-group">
                  <label>Ausgegeben (EUR)</label>
                  <input
                    type="number"
                    value={newProject.spent}
                    onChange={(e) =>
                      setNewProject({
                        ...newProject,
                        spent: Number(e.target.value),
                      })
                    }
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Projektleiter</label>
                <input
                  type="text"
                  value={newProject.manager}
                  onChange={(e) =>
                    setNewProject({
                      ...newProject,
                      manager: e.target.value,
                    })
                  }
                  placeholder="Name des Projektleiters"
                />
              </div>

              <div className="form-group">
                <label>Risiken</label>
                <textarea
                  value={newProject.risks}
                  onChange={(e) =>
                    setNewProject({
                      ...newProject,
                      risks: e.target.value,
                    })
                  }
                  rows={2}
                  placeholder="Potenzielle Risiken..."
                />
              </div>

              <div className="form-group">
                <label>Notizen</label>
                <textarea
                  value={newProject.notes}
                  onChange={(e) =>
                    setNewProject({
                      ...newProject,
                      notes: e.target.value,
                    })
                  }
                  rows={2}
                  placeholder="Zusätzliche Informationen..."
                />
              </div>
            </div>

            <div className="wo-edit-footer">
              <button
                onClick={handleCreate}
                className="btn-edit-save"
                disabled={!newProject.projectName}
              >
                ✅ Projekt erstellen
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="btn-edit-cancel"
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

export default ProjectManagement;
