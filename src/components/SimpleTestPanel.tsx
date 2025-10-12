import { useData } from "../contexts/DataContext";
import { useAuth } from "../contexts/AuthContext";

function SimpleTestPanel() {
  const { notifications, comments } = useData();
  const { currentUser } = useAuth();

  if (!currentUser) return null;

  const myNotifications = notifications.filter(
    (n) => n.userId === currentUser.id
  );
  const unreadNotifications = myNotifications.filter((n) => !n.read);

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        background: "white",
        padding: "1rem",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        border: "2px solid #2563eb",
        zIndex: 9999,
        minWidth: "250px",
      }}
    >
      <div
        style={{
          fontWeight: "bold",
          marginBottom: "0.75rem",
          color: "#2563eb",
          fontSize: "0.875rem",
        }}
      >
        🐛 DEBUG PANEL
      </div>

      <div style={{ fontSize: "0.75rem", lineHeight: "1.6" }}>
        <div style={{ marginBottom: "0.5rem" }}>
          <strong>User:</strong> {currentUser.name}
        </div>
        <div style={{ marginBottom: "0.5rem" }}>
          <strong>User ID:</strong> {currentUser.id}
        </div>

        <div
          style={{
            padding: "0.5rem",
            background: "#f3f4f6",
            borderRadius: "6px",
            marginBottom: "0.5rem",
          }}
        >
          <div>
            <strong>📊 Notifications:</strong>
          </div>
          <div>Gesamt: {notifications.length}</div>
          <div>Meine: {myNotifications.length}</div>
          <div style={{ color: "#ef4444", fontWeight: "bold" }}>
            Ungelesen: {unreadNotifications.length}
          </div>
        </div>

        <div
          style={{
            padding: "0.5rem",
            background: "#f3f4f6",
            borderRadius: "6px",
          }}
        >
          <div>
            <strong>💬 Comments:</strong>
          </div>
          <div>Gesamt: {comments.length}</div>
        </div>
      </div>

      {unreadNotifications.length > 0 && (
        <div
          style={{
            marginTop: "0.75rem",
            padding: "0.5rem",
            background: "#dbeafe",
            borderRadius: "6px",
            fontSize: "0.75rem",
          }}
        >
          <div style={{ fontWeight: "bold", marginBottom: "0.25rem" }}>
            📬 Letzte Notification:
          </div>
          <div>{unreadNotifications[0].message}</div>
        </div>
      )}
    </div>
  );
}

export default SimpleTestPanel;
