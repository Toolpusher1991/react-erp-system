// src/components/ChatBot.tsx
import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Wrench } from "lucide-react";
import { useData } from "../contexts/DataContext";
import type { WorkOrder, Asset, Project } from "../types";

interface ChatMessage {
  role: "user" | "bot";
  content: string;
  timestamp: Date;
}

// ==========================================
// QUERY ANALYZER CLASS
// ==========================================
class QueryAnalyzer {
  private workOrders: WorkOrder[];
  private assets: Asset[];
  private projects: Project[];

  constructor(workOrders: WorkOrder[], assets: Asset[], projects: Project[]) {
    this.workOrders = workOrders;
    this.assets = assets;
    this.projects = projects;
  }

  analyze(query: string) {
    const lowerQuery = query.toLowerCase();

    const assetMatch = lowerQuery.match(/t\d+/i);
    const assetName = assetMatch ? assetMatch[0].toUpperCase() : null;

    const isElectrical =
      lowerQuery.includes("elektrisch") || lowerQuery.includes("elektrik");
    const isMechanical =
      lowerQuery.includes("mechanisch") || lowerQuery.includes("mechanik");
    const isHydraulic =
      lowerQuery.includes("hydraulisch") || lowerQuery.includes("hydraulik");

    const isOpenTasks =
      lowerQuery.includes("offen") || lowerQuery.includes("noch");
    const isStatus =
      lowerQuery.includes("status") || lowerQuery.includes("zustand");
    const isProjects =
      lowerQuery.includes("projekt") || lowerQuery.includes("projekte");
    const isCritical =
      lowerQuery.includes("kritisch") || lowerQuery.includes("dringend");
    const isOverview =
      lowerQuery.includes("übersicht") ||
      lowerQuery.includes("liste") ||
      lowerQuery.includes("alle");
    const isCount =
      lowerQuery.includes("wie viele") || lowerQuery.includes("anzahl");

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
    };
  }

  generateResponse(query: string): string {
    const analysis = this.analyze(query);

    // ASSET-SPEZIFISCHE ABFRAGE MIT TYP-FILTER
    if (analysis.assetName && analysis.isOpenTasks) {
      const asset = this.assets.find((a) => a.name === analysis.assetName);
      if (!asset) {
        return `❌ Anlage ${
          analysis.assetName
        } nicht gefunden.\n\nVerfügbare Anlagen: ${this.assets
          .map((a) => a.name)
          .join(", ")}`;
      }

      let workOrders = this.workOrders.filter(
        (wo) => wo.assetName === analysis.assetName && wo.status !== "Erledigt"
      );

      if (analysis.isElectrical) {
        workOrders = workOrders.filter((wo) => wo.type === "Elektrisch");
      } else if (analysis.isMechanical) {
        workOrders = workOrders.filter((wo) => wo.type === "Mechanisch");
      } else if (analysis.isHydraulic) {
        workOrders = workOrders.filter((wo) => wo.type === "Hydraulisch");
      }

      if (workOrders.length === 0) {
        const typeStr = analysis.isElectrical
          ? "elektrischen"
          : analysis.isMechanical
          ? "mechanischen"
          : analysis.isHydraulic
          ? "hydraulischen"
          : "";
        return `✅ **Keine offenen ${typeStr} Aufgaben**\n\nBei der ${analysis.assetName} sind aktuell keine offenen ${typeStr} Work Orders vorhanden.`;
      }

      const typeStr = analysis.isElectrical
        ? "Elektrische"
        : analysis.isMechanical
        ? "Mechanische"
        : analysis.isHydraulic
        ? "Hydraulische"
        : "Offene";
      let response = `🔧 **${typeStr} Work Orders für ${analysis.assetName}**\n\n`;
      response += `📊 **Gesamt:** ${workOrders.length} offene Aufgaben\n\n`;

      workOrders.forEach((wo) => {
        const priorityIcon =
          wo.priority === "Kritisch"
            ? "🔴"
            : wo.priority === "Hoch"
            ? "🟠"
            : wo.priority === "Normal"
            ? "🟡"
            : "🟢";
        const statusIcon =
          wo.status === "In Arbeit"
            ? "⚙️"
            : wo.status === "Zugewiesen"
            ? "�"
            : "📋";

        response += `${priorityIcon} **WO #${wo.id}: ${wo.title}**\n`;
        response += `   ${statusIcon} Status: ${wo.status}\n`;
        response += `   🎯 Priorität: ${wo.priority}\n`;
        if (wo.assignedToName) {
          response += `   👤 Zugewiesen: ${wo.assignedToName}\n`;
        }
        response += `   📝 ${wo.description.substring(0, 100)}${
          wo.description.length > 100 ? "..." : ""
        }\n`;
        if (wo.materialRequired) {
          response += `   📦 Material: ${wo.materialStatus}\n`;
        }
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
        return `📊 Für ${analysis.assetName} sind keine Projekte aktiv.`;
      }

      let response = `📊 **Projekte für ${analysis.assetName}**\n\n`;
      response += `**Anzahl:** ${projects.length} Projekt(e)\n\n`;

      projects.forEach((p) => {
        const statusIcon =
          p.status === "In Arbeit"
            ? "🔄"
            : p.status === "Geplant"
            ? "📅"
            : p.status === "Abgeschlossen"
            ? "✅"
            : "⏸️";
        const priorityIcon =
          p.priority === "Kritisch"
            ? "🔴"
            : p.priority === "Hoch"
            ? "🟠"
            : "🟡";

        response += `${statusIcon} **${p.projectName}**\n`;
        response += `   📈 Fortschritt: ${p.progress}%\n`;
        response += `   ${priorityIcon} Priorität: ${p.priority}\n`;
        response += `   👔 Manager: ${p.manager}\n`;
        response += `   💰 Budget: €${p.budget.toLocaleString()} (Verbraucht: €${p.spent.toLocaleString()})\n`;
        response += `   📅 ${p.startDate} bis ${p.endDate}\n\n`;
      });

      return response;
    }

    // STATUS-ANFRAGE
    if (analysis.assetName && analysis.isStatus) {
      const asset = this.assets.find((a) => a.name === analysis.assetName);
      if (!asset) {
        return `❌ Anlage ${analysis.assetName} nicht gefunden.`;
      }

      const workOrders = this.workOrders.filter(
        (wo) => wo.assetName === analysis.assetName && wo.status !== "Erledigt"
      );
      const projects = this.projects.filter(
        (p) => p.assetName === analysis.assetName
      );

      const woByType = {
        Elektrisch: workOrders.filter((wo) => wo.type === "Elektrisch").length,
        Mechanisch: workOrders.filter((wo) => wo.type === "Mechanisch").length,
        Hydraulisch: workOrders.filter((wo) => wo.type === "Hydraulisch")
          .length,
      };

      let response = `📋 **Vollständiger Status ${asset.name}**\n\n`;
      response += `🏭 **Anlage:** ${asset.type}\n`;
      response += `📍 **Standort:** ${asset.location}\n`;
      response += `⚙️ **Betriebsstatus:** ${asset.status}\n`;
      response += `🔢 **Seriennummer:** ${asset.serialNumber}\n\n`;

      if (workOrders.length > 0) {
        response += `**📋 Offene Work Orders:** ${workOrders.length}\n`;
        if (woByType["Elektrisch"] > 0)
          response += `   ⚡ Elektrisch: ${woByType["Elektrisch"]}\n`;
        if (woByType["Mechanisch"] > 0)
          response += `   🔧 Mechanisch: ${woByType["Mechanisch"]}\n`;
        if (woByType["Hydraulisch"] > 0)
          response += `   💧 Hydraulisch: ${woByType["Hydraulisch"]}\n`;
        response += `\n`;

        const critical = workOrders.filter((wo) => wo.priority === "Kritisch");
        const high = workOrders.filter((wo) => wo.priority === "Hoch");

        if (critical.length > 0)
          response += `   🔴 Kritisch: ${critical.length}\n`;
        if (high.length > 0) response += `   🟠 Hoch: ${high.length}\n`;
      } else {
        response += `✅ **Keine offenen Work Orders**\n`;
      }

      if (projects.length > 0) {
        response += `\n**📊 Aktive Projekte:** ${projects.length}\n`;
        projects.forEach((p) => {
          response += `   • ${p.projectName} (${p.progress}% - ${p.status})\n`;
        });
      }

      return response;
    }

    // KRITISCHE WORK ORDERS
    if (analysis.isCritical && !analysis.assetName) {
      const criticalWOs = this.workOrders.filter(
        (wo) =>
          (wo.priority === "Kritisch" || wo.priority === "Hoch") &&
          wo.status !== "Erledigt"
      );

      if (criticalWOs.length === 0) {
        return "✅ **Keine kritischen Work Orders**\n\nAktuell sind keine kritischen oder hochpriorisierten Work Orders vorhanden.";
      }

      let response = `⚠️ **Kritische und hochpriorisierte Work Orders**\n\n`;
      response += `**Gesamt:** ${criticalWOs.length} dringende Aufgaben\n\n`;

      criticalWOs.forEach((wo) => {
        const icon = wo.priority === "Kritisch" ? "🔴" : "🟠";
        response += `${icon} **${wo.assetName} - ${wo.title}**\n`;
        response += `   Typ: ${wo.type}\n`;
        response += `   Status: ${wo.status}\n`;
        response += `   Priorität: ${wo.priority}\n`;
        if (wo.assignedToName) {
          response += `   Zugewiesen: ${wo.assignedToName}\n`;
        }
        response += `\n`;
      });

      return response;
    }

    // ÜBERSICHT
    if (analysis.isOverview && !analysis.assetName) {
      const openWOs = this.workOrders.filter((wo) => wo.status !== "Erledigt");

      const byAsset: Record<string, WorkOrder[]> = {};
      openWOs.forEach((wo) => {
        if (!byAsset[wo.assetName]) byAsset[wo.assetName] = [];
        byAsset[wo.assetName].push(wo);
      });

      let response = `📊 **Übersicht aller offenen Work Orders**\n\n`;
      response += `**Gesamt:** ${openWOs.length} offene Work Orders\n\n`;

      Object.entries(byAsset).forEach(([assetName, wos]) => {
        response += `🏭 **${assetName}** (${wos.length} Work Orders)\n`;
        wos.forEach((wo) => {
          const icon =
            wo.priority === "Kritisch"
              ? "🔴"
              : wo.priority === "Hoch"
              ? "🟠"
              : "🟡";
          response += `   ${icon} ${wo.title} - ${wo.type} (${wo.status})\n`;
        });
        response += `\n`;
      });

      return response;
    }

    // STATISTIK
    if (analysis.isCount) {
      const openWOs = this.workOrders.filter((wo) => wo.status !== "Erledigt");
      let response = `📊 **Statistik-Übersicht**\n\n`;
      response += `📋 Offene Work Orders: ${openWOs.length}\n`;
      response += `🏭 Anlagen: ${this.assets.length}\n`;
      response += `📊 Aktive Projekte: ${
        this.projects.filter((p) => p.status === "In Arbeit").length
      }\n`;
      response += `\n**Nach Priorität:**\n`;
      response += `   🔴 Kritisch: ${
        openWOs.filter((wo) => wo.priority === "Kritisch").length
      }\n`;
      response += `   🟠 Hoch: ${
        openWOs.filter((wo) => wo.priority === "Hoch").length
      }\n`;
      response += `   🟡 Normal: ${
        openWOs.filter((wo) => wo.priority === "Normal").length
      }\n`;
      return response;
    }

    // FALLBACK
    return (
      `💡 **Ich kann Ihnen helfen mit:**\n\n` +
      `🔍 **Spezifische Abfragen:**\n` +
      `   • "Was ist bei T207 noch offen von der elektrischen Seite?"\n` +
      `   • "Status von T208"\n` +
      `   • "Welche Projekte laufen auf T207?"\n\n` +
      `📊 **Übersichten:**\n` +
      `   • "Zeige alle kritischen Work Orders"\n` +
      `   • "Übersicht aller offenen Aufgaben"\n` +
      `   • "Wie viele Work Orders sind offen?"\n\n` +
      `**Verfügbare Anlagen:** ${this.assets.map((a) => a.name).join(", ")}`
    );
  }
}

// ==========================================
// CHATBOT COMPONENT
// ==========================================
function ChatBot() {
  const { workOrders, assets, projects } = useData();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "bot",
      content:
        '👋 **Hallo! Ich bin Ihr MaintAIn Assistent.**\n\nIch kann Ihnen helfen, offene Aufgaben, Work Orders und Projekte abzufragen.\n\n**Beispiele:**\n• "Was ist bei der T207 noch offen von der elektrischen Seite?"\n• "Status von T208"\n• "Zeige alle kritischen Work Orders"',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const analyzer = new QueryAnalyzer(workOrders, assets, projects);
      const response = analyzer.generateResponse(input);
      const botMessage: ChatMessage = {
        role: "bot",
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, 600);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickActions = [
    "Was ist bei T207 offen elektrisch?",
    "Status von T208",
    "Alle kritischen Work Orders",
    "Wie viele Work Orders sind offen?",
  ];

  return (
    <div className="chatbot-container">
      {/* Header */}
      <div className="chatbot-header">
        <div className="chatbot-header-content">
          <div className="chatbot-header-left">
            <div className="chatbot-icon">
              <Wrench size={32} />
            </div>
            <div>
              <h1 className="chatbot-title">MaintAIn Chatbot</h1>
              <p className="chatbot-subtitle">
                Intelligenter Asset & Work Order Assistent
              </p>
            </div>
          </div>
          <div className="chatbot-header-stats">
            <div className="stat-label">Offene WOs</div>
            <div className="stat-value">
              {workOrders.filter((wo) => wo.status !== "Erledigt").length}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="chatbot-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            {msg.role === "bot" && (
              <div className="message-avatar bot-avatar">
                <Bot size={20} />
              </div>
            )}

            <div className="message-content">
              <div className="message-text">{msg.content}</div>
              <div className="message-time">
                {msg.timestamp.toLocaleTimeString("de-DE", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>

            {msg.role === "user" && (
              <div className="message-avatar user-avatar">
                <User size={20} />
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="message bot">
            <div className="message-avatar bot-avatar">
              <Bot size={20} />
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
          <div className="quick-actions-label">Schnellaktionen:</div>
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
          placeholder="Fragen Sie nach Work Orders, Status oder Projekten..."
          className="chatbot-input"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isTyping}
          className="chatbot-send-btn"
        >
          <Send size={20} />
          <span>Senden</span>
        </button>
      </div>
    </div>
  );
}

export default ChatBot;
