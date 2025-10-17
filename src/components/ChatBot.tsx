// src/components/ChatBot.tsx - VOLLSTÄNDIGE VERSION
import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Wrench } from "lucide-react";
import { useData } from "../contexts/DataContext";
import { useAuth } from "../contexts/AuthContext";
import type { WorkOrder, Asset, Project } from "../types";

interface ChatMessage {
  role: "user" | "bot";
  content: string;
  timestamp: Date;
  isCreatingWorkOrder?: boolean;
  workOrderData?: any;
}

// ==========================================
// QUERY ANALYZER CLASS - VOLLSTÄNDIG
// ==========================================
class QueryAnalyzer {
  private workOrders: WorkOrder[];
  private assets: Asset[];
  private projects: Project[];
  private currentUserId: number;

  constructor(
    workOrders: WorkOrder[],
    assets: Asset[],
    projects: Project[],
    currentUserId: number
  ) {
    this.workOrders = workOrders;
    this.assets = assets;
    this.projects = projects;
    this.currentUserId = currentUserId;
  }

  analyze(query: string) {
    const lowerQuery = query.toLowerCase();
    const assetMatch = lowerQuery.match(/t\d+/i);
    const assetName = assetMatch ? assetMatch[0].toUpperCase() : null;

    const isElectrical =
      /elektr|strom|spannung|kabel|verkabelung|sicherung|schaltung/i.test(
        query
      );
    const isMechanical =
      /mechanisch|motor|getriebe|welle|lager|verschleiß|reparatur/i.test(query);
    const isHydraulic = /hydraul|öl|druck|schlauch|pumpe|zylinder/i.test(query);

    const isOpenTasks =
      /offen|noch|ausstehend|pending|todo|zu erledigen|nicht erledigt/i.test(
        query
      );
    const isStatus =
      /status|zustand|stand|lage|situation|übersicht.*(?:anlage|rig)/i.test(
        query
      );
    const isProjects = /projekt|projects?|vorhaben/i.test(query);
    const isCritical =
      /kritisch|dringend|urgent|eilig|sofort|asap|notfall/i.test(query);
    const isOverview = /übersicht|liste|alle|gesamt|komplett|alles/i.test(
      query
    );
    const isCount = /wie viele|anzahl|wieviel|zähle|count|summe/i.test(query);
    const isCompleted =
      /erledigt|fertig|abgeschlossen|done|completed|finished/i.test(query);
    const isInProgress = /in arbeit|bearbeitung|progress|läuft|aktiv/i.test(
      query
    );
    const isNew = /neu|new|unbearbeitet|nicht zugewiesen/i.test(query);
    const isMaterial = /material|ersatzteil|teile|bestell|lieferung/i.test(
      query
    );
    const isLocation = /standort|ort|wo|location|feld/i.test(query);
    const isHelp = /hilfe|help|was kannst du|funktionen|beispiel/i.test(query);
    const isCreateWorkOrder =
      /erstelle|erstell|create|neue.*(?:work order|wo|ticket|aufgabe)|melde.*(?:problem|defekt|störung)|anlegen/i.test(
        query
      );

    return {
      assetName,
      isElectrical,
      isMechanical,
      isHydraulic,
      isOpenTasks,
      isStatus,
      isProjects,
      isCritical,
      isOverview,
      isCount,
      isCompleted,
      isInProgress,
      isNew,
      isMaterial,
      isLocation,
      isHelp,
      isCreateWorkOrder,
    };
  }

  extractWorkOrderData(query: string) {
    const analysis = this.analyze(query);
    const result: any = {};

    if (analysis.assetName) {
      result.asset = this.assets.find((a) => a.name === analysis.assetName);
    }

    if (analysis.isElectrical) result.type = "Elektrisch";
    else if (analysis.isMechanical) result.type = "Mechanisch";
    else if (analysis.isHydraulic) result.type = "Hydraulisch";

    if (analysis.isCritical) result.priority = "Kritisch";
    else if (/hoch|high|wichtig/i.test(query)) result.priority = "Hoch";
    else result.priority = "Normal";

    const titleMatch = query.match(
      /(?:erstelle|create).*?(?:für|on|bei)\s+([^,\.]+)/i
    );
    if (titleMatch) {
      result.title = titleMatch[1].trim();
    } else {
      const typeStr = result.type || "Problem";
      result.title = result.asset
        ? `${typeStr} - ${result.asset.name}`
        : "Neuer Work Order";
    }

    result.description = query;

    return result;
  }

  generateResponse(
    query: string
  ): string | { needsConfirmation: boolean; data: any; message: string } {
    const analysis = this.analyze(query);

    // WORK ORDER ERSTELLEN
    if (analysis.isCreateWorkOrder) {
      const woData = this.extractWorkOrderData(query);

      if (!woData.asset) {
        return (
          `🤔 **Für welche Anlage?**\n\nBitte geben Sie die Anlage an:\n` +
          `• "Erstelle Work Order für T207"\n\n` +
          `**Verfügbar:** ${this.assets.map((a) => a.name).join(", ")}`
        );
      }

      woData.priority = woData.priority || "Normal";
      woData.type = woData.type || "Sonstiges";

      return {
        needsConfirmation: true,
        data: woData,
        message:
          `📝 **Work Order erstellen?**\n\n` +
          `**Anlage:** ${woData.asset.name}\n` +
          `**Typ:** ${woData.type}\n` +
          `**Priorität:** ${woData.priority}\n` +
          `**Titel:** ${woData.title}\n\n` +
          `Möchten Sie diesen Work Order erstellen?`,
      };
    }

    // ASSET-SPEZIFISCHE ABFRAGE
    if (analysis.assetName && analysis.isOpenTasks) {
      const asset = this.assets.find((a) => a.name === analysis.assetName);
      if (!asset) {
        return `❌ Anlage ${
          analysis.assetName
        } nicht gefunden.\n\nVerfügbar: ${this.assets
          .map((a) => a.name)
          .join(", ")}`;
      }

      let wos = this.workOrders.filter(
        (wo) => wo.assetName === analysis.assetName && wo.status !== "Erledigt"
      );

      if (analysis.isElectrical)
        wos = wos.filter((wo) => wo.type === "Elektrisch");
      else if (analysis.isMechanical)
        wos = wos.filter((wo) => wo.type === "Mechanisch");
      else if (analysis.isHydraulic)
        wos = wos.filter((wo) => wo.type === "Hydraulisch");

      if (wos.length === 0) {
        const typeStr = analysis.isElectrical
          ? "elektrischen"
          : analysis.isMechanical
          ? "mechanischen"
          : "";
        return `✅ Keine offenen ${typeStr} Work Orders für ${analysis.assetName}`;
      }

      const typeStr = analysis.isElectrical
        ? "Elektrische"
        : analysis.isMechanical
        ? "Mechanische"
        : "Offene";
      let response = `🔧 **${typeStr} Work Orders - ${analysis.assetName}**\n\n`;
      response += `📊 **Gesamt:** ${wos.length}\n\n`;

      wos.forEach((wo) => {
        const icon =
          wo.priority === "Kritisch"
            ? "🔴"
            : wo.priority === "Hoch"
            ? "🟠"
            : "🟡";
        response += `${icon} **${wo.title}**\n`;
        response += `   Status: ${wo.status}\n`;
        if (wo.assignedToName)
          response += `   Zugewiesen: ${wo.assignedToName}\n`;
        response += `\n`;
      });

      return response;
    }

    // PROJEKT-ANFRAGEN
    if (analysis.assetName && analysis.isProjects) {
      const projects = this.projects.filter(
        (p) => p.assetName === analysis.assetName
      );

      if (projects.length === 0) {
        return `📊 Keine aktiven Projekte für ${analysis.assetName}`;
      }

      let response = `📊 **Projekte - ${analysis.assetName}**\n\n`;
      projects.forEach((p) => {
        const icon =
          p.status === "In Arbeit"
            ? "🔄"
            : p.status === "Geplant"
            ? "📅"
            : "✅";
        response += `${icon} **${p.projectName}**\n`;
        response += `   Fortschritt: ${p.progress}%\n`;
        response += `   Status: ${p.status}\n\n`;
      });

      return response;
    }

    // STATUS-ANFRAGE
    if (analysis.assetName && analysis.isStatus) {
      const asset = this.assets.find((a) => a.name === analysis.assetName);
      if (!asset) return `❌ Anlage ${analysis.assetName} nicht gefunden.`;

      const wos = this.workOrders.filter(
        (wo) => wo.assetName === analysis.assetName && wo.status !== "Erledigt"
      );
      const projects = this.projects.filter(
        (p) => p.assetName === analysis.assetName
      );

      let response = `📋 **Status ${asset.name}**\n\n`;
      response += `🏭 ${asset.type}\n`;
      response += `📍 ${asset.location}\n`;
      response += `⚙️ ${asset.status}\n\n`;

      if (wos.length > 0) {
        response += `**📋 Offene WOs:** ${wos.length}\n`;
        const critical = wos.filter((wo) => wo.priority === "Kritisch");
        if (critical.length > 0)
          response += `   🔴 Kritisch: ${critical.length}\n`;
      } else {
        response += `✅ Keine offenen Work Orders\n`;
      }

      if (projects.length > 0) {
        response += `\n**📊 Projekte:** ${projects.length}\n`;
      }

      return response;
    }

    // KRITISCHE WORK ORDERS
    if (analysis.isCritical && !analysis.assetName) {
      const critical = this.workOrders.filter(
        (wo) =>
          (wo.priority === "Kritisch" || wo.priority === "Hoch") &&
          wo.status !== "Erledigt"
      );

      if (critical.length === 0) {
        return "✅ Keine kritischen Work Orders";
      }

      let response = `⚠️ **Kritische Work Orders**\n\n**Gesamt:** ${critical.length}\n\n`;
      critical.forEach((wo) => {
        const icon = wo.priority === "Kritisch" ? "🔴" : "🟠";
        response += `${icon} ${wo.assetName} - ${wo.title}\n`;
        response += `   Status: ${wo.status}\n\n`;
      });

      return response;
    }

    // IN BEARBEITUNG
    if (analysis.isInProgress) {
      const inProgress = this.workOrders.filter(
        (wo) => wo.status === "In Arbeit"
      );

      if (inProgress.length === 0) {
        return "📋 Keine Work Orders in Bearbeitung";
      }

      let response = `⚙️ **In Bearbeitung**\n\n**Anzahl:** ${inProgress.length}\n\n`;
      inProgress.forEach((wo) => {
        response += `• ${wo.assetName} - ${wo.title}\n`;
        if (wo.assignedToName)
          response += `  Bearbeiter: ${wo.assignedToName}\n`;
      });

      return response;
    }

    // MATERIAL
    if (analysis.isMaterial) {
      const materialWOs = this.workOrders.filter(
        (wo) => wo.materialRequired && wo.status !== "Erledigt"
      );

      if (materialWOs.length === 0) {
        return "✅ Kein Materialbedarf";
      }

      let response = `📦 **Material benötigt**\n\n**Gesamt:** ${materialWOs.length}\n\n`;
      materialWOs.forEach((wo) => {
        response += `• ${wo.assetName} - ${wo.title}\n`;
        response += `  Status: ${wo.materialStatus}\n`;
      });

      return response;
    }

    // STANDORT
    if (analysis.isLocation) {
      const locations = [...new Set(this.assets.map((a) => a.location))];

      let response = `📍 **Standorte**\n\n`;
      locations.forEach((loc) => {
        const assets = this.assets.filter((a) => a.location === loc);
        const openWOs = this.workOrders.filter(
          (wo) =>
            assets.some((a) => a.name === wo.assetName) &&
            wo.status !== "Erledigt"
        );

        response += `**${loc}**\n`;
        response += `   🏭 Anlagen: ${assets.map((a) => a.name).join(", ")}\n`;
        response += `   🎫 Offene WOs: ${openWOs.length}\n\n`;
      });

      return response;
    }

    // ÜBERSICHT
    if (analysis.isOverview) {
      const openWOs = this.workOrders.filter((wo) => wo.status !== "Erledigt");
      const byAsset: Record<string, WorkOrder[]> = {};

      openWOs.forEach((wo) => {
        if (!byAsset[wo.assetName]) byAsset[wo.assetName] = [];
        byAsset[wo.assetName].push(wo);
      });

      let response = `📊 **Übersicht**\n\n**Gesamt:** ${openWOs.length} offene WOs\n\n`;
      Object.entries(byAsset).forEach(([name, wos]) => {
        response += `**${name}** (${wos.length})\n`;
        wos.forEach((wo) => {
          const icon =
            wo.priority === "Kritisch"
              ? "🔴"
              : wo.priority === "Hoch"
              ? "🟠"
              : "🟡";
          response += `   ${icon} ${wo.title}\n`;
        });
        response += `\n`;
      });

      return response;
    }

    // STATISTIK
    if (analysis.isCount) {
      const open = this.workOrders.filter((wo) => wo.status !== "Erledigt");

      return (
        `📊 **Statistik**\n\n` +
        `📋 Offene WOs: ${open.length}\n` +
        `🏭 Anlagen: ${this.assets.length}\n` +
        `📊 Projekte: ${
          this.projects.filter((p) => p.status === "In Arbeit").length
        }\n\n` +
        `**Nach Priorität:**\n` +
        `   🔴 Kritisch: ${
          open.filter((wo) => wo.priority === "Kritisch").length
        }\n` +
        `   🟠 Hoch: ${open.filter((wo) => wo.priority === "Hoch").length}\n` +
        `   🟡 Normal: ${open.filter((wo) => wo.priority === "Normal").length}`
      );
    }

    // HILFE
    if (analysis.isHelp) {
      return (
        `💡 **Hilfe**\n\n` +
        `**Abfragen:**\n` +
        `• "Was ist bei T207 offen elektrisch?"\n` +
        `• "Status von T208"\n` +
        `• "Zeige kritische Work Orders"\n\n` +
        `**Erstellen:**\n` +
        `• "Erstelle Work Order für T207"\n` +
        `• "Melde Problem bei T208"\n\n` +
        `**Übersichten:**\n` +
        `• "Was ist in Bearbeitung?"\n` +
        `• "Wo brauchen wir Material?"\n` +
        `• "Standort-Übersicht"\n\n` +
        `**Anlagen:** ${this.assets.map((a) => a.name).join(", ")}`
      );
    }

    // FALLBACK
    const openCount = this.workOrders.filter(
      (wo) => wo.status !== "Erledigt"
    ).length;
    return (
      `🤔 Nicht verstanden: "${query}"\n\n` +
      `💡 **Versuchen Sie:**\n` +
      `• "Was ist bei T207 offen?"\n` +
      `• "Status von T208"\n` +
      `• "Hilfe" für mehr Beispiele\n\n` +
      `📊 **Aktuell:** ${openCount} offene Work Orders`
    );
  }
}

// ==========================================
// CHATBOT COMPONENT
// ==========================================
function ChatBot() {
  const { workOrders, assets, projects, addWorkOrder } = useData();
  const { currentUser } = useAuth();

  // State persistent machen mit localStorage
  const [isOpen, setIsOpen] = useState(() => {
    const saved = localStorage.getItem("chatbot_isOpen");
    return saved === "true";
  });

  const [isExpanded, setIsExpanded] = useState(() => {
    const saved = localStorage.getItem("chatbot_isExpanded");
    return saved === "true";
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem("chatbot_messages");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
      } catch {
        return [
          {
            role: "bot",
            content:
              '👋 **Hallo! Ich bin Ihr MaintAIn Assistent.**\n\nIch helfe bei Work Orders, Status-Abfragen und mehr.\n\nTippen Sie "Hilfe" für Beispiele.',
            timestamp: new Date(),
          },
        ];
      }
    }
    return [
      {
        role: "bot",
        content:
          '👋 **Hallo! Ich bin Ihr MaintAIn Assistent.**\n\nIch helfe bei Work Orders, Status-Abfragen und mehr.\n\nTippen Sie "Hilfe" für Beispiele.',
        timestamp: new Date(),
      },
    ];
  });

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [pendingWorkOrder, setPendingWorkOrder] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Speichere State in localStorage bei Änderungen
  useEffect(() => {
    localStorage.setItem("chatbot_isOpen", isOpen.toString());
  }, [isOpen]);

  useEffect(() => {
    localStorage.setItem("chatbot_isExpanded", isExpanded.toString());
  }, [isExpanded]);

  useEffect(() => {
    localStorage.setItem("chatbot_messages", JSON.stringify(messages));
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || !currentUser) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const analyzer = new QueryAnalyzer(
        workOrders,
        assets,
        projects,
        currentUser.id
      );
      const response = analyzer.generateResponse(input);

      if (typeof response === "object" && response.needsConfirmation) {
        setPendingWorkOrder(response.data);
        const botMessage: ChatMessage = {
          role: "bot",
          content: response.message,
          timestamp: new Date(),
          isCreatingWorkOrder: true,
          workOrderData: response.data,
        };
        setMessages((prev) => [...prev, botMessage]);
      } else {
        const botMessage: ChatMessage = {
          role: "bot",
          content: response as string,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMessage]);
      }

      setIsTyping(false);
    }, 600);
  };

  const handleConfirmWorkOrder = (confirm: boolean) => {
    if (!confirm || !pendingWorkOrder || !currentUser) {
      setPendingWorkOrder(null);
      if (!confirm) {
        const botMessage: ChatMessage = {
          role: "bot",
          content: "❌ Work Order wurde nicht erstellt.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMessage]);
      }
      return;
    }

    const newWorkOrder: WorkOrder = {
      id: Math.max(...workOrders.map((wo) => wo.id), 0) + 1,
      title: pendingWorkOrder.title,
      description: pendingWorkOrder.description,
      assetId: pendingWorkOrder.asset.id,
      assetName: pendingWorkOrder.asset.name,
      type: pendingWorkOrder.type as any,
      category: "Im Betrieb" as any,
      priority: pendingWorkOrder.priority as any,
      status: "Neu" as any,
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      materialRequired: false,
      materialStatus: "Nicht benötigt" as any,
    };

    addWorkOrder(newWorkOrder);

    const botMessage: ChatMessage = {
      role: "bot",
      content:
        `✅ **Work Order #${newWorkOrder.id} erstellt!**\n\n` +
        `**Anlage:** ${newWorkOrder.assetName}\n` +
        `**Typ:** ${newWorkOrder.type}\n` +
        `**Priorität:** ${newWorkOrder.priority}\n` +
        `**Status:** ${newWorkOrder.status}`,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, botMessage]);
    setPendingWorkOrder(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickActions = [
    "Was ist bei T207 offen elektrisch?",
    "Erstelle Work Order für T207",
    "Zeige kritische Work Orders",
    "Hilfe",
  ];

  if (!currentUser) return null;

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button onClick={() => setIsOpen(true)} className="chatbot-float-btn">
          <Bot size={24} />
          {workOrders.filter((wo) => wo.status !== "Erledigt").length > 0 && (
            <span className="chatbot-badge">
              {workOrders.filter((wo) => wo.status !== "Erledigt").length}
            </span>
          )}
        </button>
      )}

      {/* Chat Widget */}
      {isOpen && (
        <div className={`chatbot-sidebar ${isExpanded ? "expanded" : ""}`}>
          <div className="chatbot-container">
            {/* Header */}
            <div className="chatbot-header">
              <div className="chatbot-header-content">
                <div className="chatbot-header-left">
                  <div className="chatbot-icon">
                    <Wrench size={20} />
                  </div>
                  <div>
                    <h1 className="chatbot-title">MaintAIn AI</h1>
                    <p className="chatbot-subtitle">Ihr Assistent</p>
                  </div>
                </div>
                <div className="chatbot-header-actions">
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="chatbot-header-btn"
                  >
                    {isExpanded ? "◀" : "▶"}
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="chatbot-header-btn"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="chatbot-messages">
              {messages.map((msg, idx) => (
                <div key={idx} className={`message ${msg.role}`}>
                  {msg.role === "bot" && (
                    <div className="message-avatar bot-avatar">
                      <Bot size={16} />
                    </div>
                  )}

                  <div className="message-content">
                    <div className="message-text">{msg.content}</div>

                    {msg.isCreatingWorkOrder && pendingWorkOrder && (
                      <div
                        style={{
                          marginTop: "0.75rem",
                          display: "flex",
                          gap: "0.5rem",
                        }}
                      >
                        <button
                          onClick={() => handleConfirmWorkOrder(true)}
                          style={{
                            background:
                              "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                            color: "white",
                            border: "none",
                            padding: "0.5rem 0.75rem",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontWeight: "600",
                            fontSize: "0.75rem",
                          }}
                        >
                          ✅ Erstellen
                        </button>
                        <button
                          onClick={() => handleConfirmWorkOrder(false)}
                          style={{
                            background: "#ef4444",
                            color: "white",
                            border: "none",
                            padding: "0.5rem 0.75rem",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontWeight: "600",
                            fontSize: "0.75rem",
                          }}
                        >
                          ❌ Abbrechen
                        </button>
                      </div>
                    )}

                    <div className="message-time">
                      {msg.timestamp.toLocaleTimeString("de-DE", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>

                  {msg.role === "user" && (
                    <div className="message-avatar user-avatar">
                      <User size={16} />
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="message bot">
                  <div className="message-avatar bot-avatar">
                    <Bot size={16} />
                  </div>
                  <div className="message-content">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            {messages.length === 1 && (
              <div className="chatbot-quick-actions">
                <div className="quick-actions-label">Schnellaktionen</div>
                <div className="quick-actions-buttons">
                  {quickActions.map((action, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInput(action)}
                      className="quick-action-btn"
                    >
                      {action}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="chatbot-input-container">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Nachricht eingeben..."
                className="chatbot-input"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="chatbot-send-btn"
              >
                <Send size={16} />
                <span>Senden</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ChatBot;
