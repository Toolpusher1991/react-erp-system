// ==========================================
// NOTIFICATION DEBUG COMPONENT
// ==========================================
// Temporär zum Testen - SPÄTER ENTFERNEN!

import { useData } from "../contexts/DataContext";
import { useAuth } from "../contexts/AuthContext";

function NotificationDebug() {
  const { notifications, comments } = useData();
  const { currentUser } = useAuth();

  if (!currentUser) return null;

  const myNotifications = notifications.filter(
    (n) => n.userId === currentUser.id
  );
  const allComments = comments;

  return (
    <div
      style={{
        background: "#f3f4f6",
        padding: "1.5rem",
        borderRadius: "12px",
        margin: "0 2rem 2rem 2rem",
        border: "2px solid #e5e7eb",
      }}
    >
      <h3 style={{ margin: "0 0 1rem 0", color: "#374151" }}>🐛 Debug Info</h3>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}
      >
        <div
          style={{ background: "white", padding: "1rem", borderRadius: "8px" }}
        >
          <strong>Meine Notifications:</strong>
          <p
            style={{ margin: "0.5rem 0", fontSize: "2rem", fontWeight: "bold" }}
          >
            {myNotifications.length}
          </p>
          {myNotifications.length > 0 && (
            <div
              style={{
                fontSize: "0.875rem",
                color: "#6b7280",
                marginTop: "0.5rem",
              }}
            >
              <div>
                Ungelesen: {myNotifications.filter((n) => !n.read).length}
              </div>
              <div>Gelesen: {myNotifications.filter((n) => n.read).length}</div>
            </div>
          )}
        </div>

        <div
          style={{ background: "white", padding: "1rem", borderRadius: "8px" }}
        >
          <strong>Alle Notifications im System:</strong>
          <p
            style={{ margin: "0.5rem 0", fontSize: "2rem", fontWeight: "bold" }}
          >
            {notifications.length}
          </p>
          <div
            style={{
              fontSize: "0.875rem",
              color: "#6b7280",
              marginTop: "0.5rem",
            }}
          >
            <div>
              Comments: {allComments.filter((c) => c.type === "comment").length}
            </div>
            <div>
              Status Changes:{" "}
              {allComments.filter((c) => c.type === "status_change").length}
            </div>
            <div>
              Assignments:{" "}
              {allComments.filter((c) => c.type === "assignment").length}
            </div>
          </div>
        </div>
      </div>

      {myNotifications.length > 0 && (
        <details style={{ marginTop: "1rem" }}>
          <summary
            style={{
              cursor: "pointer",
              fontWeight: "bold",
              marginBottom: "0.5rem",
            }}
          >
            📋 Meine Notifications Details
          </summary>
          <div
            style={{
              maxHeight: "300px",
              overflowY: "auto",
              background: "white",
              padding: "1rem",
              borderRadius: "8px",
              fontSize: "0.875rem",
            }}
          >
            {myNotifications.map((n) => (
              <div
                key={n.id}
                style={{
                  padding: "0.75rem",
                  marginBottom: "0.5rem",
                  background: n.read ? "#f9fafb" : "#dbeafe",
                  borderRadius: "6px",
                  borderLeft: `4px solid ${n.read ? "#9ca3af" : "#2563eb"}`,
                }}
              >
                <div>
                  <strong>ID:</strong> {n.id}
                </div>
                <div>
                  <strong>Type:</strong> {n.type}
                </div>
                <div>
                  <strong>WO:</strong> #{n.workOrderId} - {n.workOrderTitle}
                </div>
                <div>
                  <strong>Message:</strong> {n.message}
                </div>
                <div>
                  <strong>Von:</strong> {n.createdByName}
                </div>
                <div>
                  <strong>Status:</strong>{" "}
                  {n.read ? "✅ Gelesen" : "📬 Ungelesen"}
                </div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "#6b7280",
                    marginTop: "0.25rem",
                  }}
                >
                  {new Date(n.createdAt).toLocaleString("de-DE")}
                </div>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

export default NotificationDebug;
