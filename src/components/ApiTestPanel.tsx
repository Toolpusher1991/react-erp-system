// ==========================================
// API CONNECTION TEST COMPONENT
// ==========================================

import { useState, useEffect } from "react";
import {
  testConnection,
  checkHealth,
  getUsers,
  isServerOnline,
} from "../services/api";

interface ConnectionStatus {
  isOnline: boolean;
  serverInfo?: any;
  users?: any[];
  error?: string;
  loading: boolean;
}

function ApiTestPanel() {
  const [status, setStatus] = useState<ConnectionStatus>({
    isOnline: false,
    loading: true,
  });

  const [testResults, setTestResults] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(true);

  // Initial connection test
  useEffect(() => {
    performConnectionTest();
  }, []);

  const addTestResult = (message: string) => {
    setTestResults((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] ${message}`,
    ]);
  };

  const performConnectionTest = async () => {
    setStatus({ ...status, loading: true });
    addTestResult("🧪 Starting Backend Connection Test...");

    try {
      // Test 1: Basic Health Check
      addTestResult("📡 Testing health endpoint...");
      const healthResult = await checkHealth();

      if (healthResult.error) {
        throw new Error(`Health check failed: ${healthResult.error}`);
      }

      addTestResult("✅ Health check successful!");

      // Test 2: Server Online Status
      const online = await isServerOnline();
      addTestResult(`🌐 Server online: ${online ? "YES" : "NO"}`);

      // Test 3: Users Endpoint
      addTestResult("👥 Testing users endpoint...");
      const usersResult = await getUsers();

      if (usersResult.error) {
        addTestResult(`⚠️ Users endpoint error: ${usersResult.error}`);
      } else {
        addTestResult(
          `✅ Users loaded: ${usersResult.data?.length || 0} users found`
        );
      }

      setStatus({
        isOnline: true,
        serverInfo: healthResult.data,
        users: usersResult.data,
        loading: false,
      });

      addTestResult("🎉 All tests completed successfully!");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      addTestResult(`❌ Connection test failed: ${errorMessage}`);

      setStatus({
        isOnline: false,
        error: errorMessage,
        loading: false,
      });
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  // Don't render if not visible
  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        style={{
          position: "fixed",
          top: "10px",
          right: "10px",
          background: "#2563eb",
          color: "white",
          border: "none",
          padding: "0.5rem",
          borderRadius: "50%",
          cursor: "pointer",
          zIndex: 9999,
          fontSize: "1rem",
        }}
      >
        🔌
      </button>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        top: "10px",
        right: "10px",
        width: "400px",
        background: "rgba(31, 41, 55, 0.95)",
        border: "1px solid #374151",
        borderRadius: "12px",
        padding: "1rem",
        zIndex: 9999,
        color: "white",
        fontSize: "0.875rem",
        maxHeight: "80vh",
        overflowY: "auto",
        backdropFilter: "blur(10px)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
          borderBottom: "1px solid #374151",
          paddingBottom: "0.5rem",
        }}
      >
        <h3 style={{ margin: 0, color: "#60a5fa" }}>🔌 API Connection Test</h3>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={performConnectionTest}
            disabled={status.loading}
            style={{
              background: status.loading ? "#6b7280" : "#2563eb",
              color: "white",
              border: "none",
              padding: "0.25rem 0.5rem",
              borderRadius: "4px",
              fontSize: "0.75rem",
              cursor: status.loading ? "not-allowed" : "pointer",
            }}
          >
            {status.loading ? "⏳" : "🔄"}
          </button>
          <button
            onClick={clearResults}
            style={{
              background: "#6b7280",
              color: "white",
              border: "none",
              padding: "0.25rem 0.5rem",
              borderRadius: "4px",
              fontSize: "0.75rem",
              cursor: "pointer",
            }}
          >
            🗑️
          </button>
          <button
            onClick={() => setIsVisible(false)}
            style={{
              background: "#ef4444",
              color: "white",
              border: "none",
              padding: "0.25rem 0.5rem",
              borderRadius: "4px",
              fontSize: "0.75rem",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Status Indicator */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          marginBottom: "1rem",
          padding: "0.5rem",
          background: status.isOnline
            ? "rgba(16, 185, 129, 0.2)"
            : "rgba(239, 68, 68, 0.2)",
          borderRadius: "6px",
          border: `1px solid ${
            status.isOnline
              ? "rgba(16, 185, 129, 0.4)"
              : "rgba(239, 68, 68, 0.4)"
          }`,
        }}
      >
        <span style={{ fontSize: "1.2rem" }}>
          {status.loading ? "⏳" : status.isOnline ? "🟢" : "🔴"}
        </span>
        <div>
          <div style={{ fontWeight: "bold" }}>
            {status.loading
              ? "Testing..."
              : status.isOnline
              ? "Connected"
              : "Disconnected"}
          </div>
          {status.serverInfo && (
            <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
              Uptime: {Math.round(status.serverInfo.uptime)}s
            </div>
          )}
        </div>
      </div>

      {/* Server Info */}
      {status.serverInfo && (
        <div style={{ marginBottom: "1rem" }}>
          <div
            style={{
              fontWeight: "bold",
              color: "#34d399",
              marginBottom: "0.25rem",
            }}
          >
            📊 Server Info:
          </div>
          <div style={{ fontSize: "0.75rem", color: "#d1d5db" }}>
            Environment: {status.serverInfo.environment}
            <br />
            Status: {status.serverInfo.status}
            <br />
            Timestamp:{" "}
            {new Date(status.serverInfo.timestamp).toLocaleTimeString()}
          </div>
        </div>
      )}

      {/* Users Info */}
      {status.users && Array.isArray(status.users) && (
        <div style={{ marginBottom: "1rem" }}>
          <div
            style={{
              fontWeight: "bold",
              color: "#fbbf24",
              marginBottom: "0.25rem",
            }}
          >
            👥 Users ({status.users.length}):
          </div>
          <div style={{ fontSize: "0.75rem", color: "#d1d5db" }}>
            {status.users.map((user: any, idx: number) => (
              <div key={idx}>
                {user.name} ({user.role})
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {status.error && (
        <div
          style={{
            background: "rgba(239, 68, 68, 0.2)",
            border: "1px solid rgba(239, 68, 68, 0.4)",
            borderRadius: "6px",
            padding: "0.5rem",
            marginBottom: "1rem",
          }}
        >
          <div style={{ fontWeight: "bold", color: "#f87171" }}>❌ Error:</div>
          <div style={{ fontSize: "0.75rem", color: "#fca5a5" }}>
            {status.error}
          </div>
        </div>
      )}

      {/* Test Results Log */}
      <div>
        <div
          style={{
            fontWeight: "bold",
            color: "#a78bfa",
            marginBottom: "0.5rem",
          }}
        >
          📝 Test Log:
        </div>
        <div
          style={{
            background: "#111827",
            border: "1px solid #374151",
            borderRadius: "6px",
            padding: "0.5rem",
            maxHeight: "200px",
            overflowY: "auto",
            fontSize: "0.75rem",
          }}
        >
          {testResults.length === 0 ? (
            <div style={{ color: "#6b7280" }}>No tests run yet...</div>
          ) : (
            testResults.map((result, idx) => (
              <div
                key={idx}
                style={{
                  marginBottom: "0.25rem",
                  color: result.includes("❌")
                    ? "#f87171"
                    : result.includes("✅")
                    ? "#34d399"
                    : result.includes("⚠️")
                    ? "#fbbf24"
                    : "#d1d5db",
                }}
              >
                {result}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default ApiTestPanel;
