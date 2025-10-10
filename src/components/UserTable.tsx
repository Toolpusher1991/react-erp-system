interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: "Aktiv" | "Inaktiv";
}

interface UserTableProps {
  users: User[];
  onDelete: (id: number) => void;
  onEdit: (user: User) => void;
  onToggleStatus: (id: number) => void;
}

function UserTable({
  users,
  onDelete,
  onEdit,
  onToggleStatus,
}: UserTableProps) {
  // Sortiere User nach ID
  const sortedUsers = [...users].sort((a, b) => a.id - b.id);

  return (
    <table className="user-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Email / Username</th>
          <th>Rolle</th>
          <th>Status</th>
          <th>Aktion</th>
        </tr>
      </thead>
      <tbody>
        {sortedUsers.map((user) => (
          <tr key={user.id}>
            <td>{user.id}</td>
            <td>{user.name}</td>
            <td>{user.email}</td>
            <td>
              <span
                style={{
                  background: getRoleBadgeColor(user.role),
                  color: "white",
                  padding: "0.25rem 0.75rem",
                  borderRadius: "9999px",
                  fontSize: "0.75rem",
                  fontWeight: "600",
                }}
              >
                {user.role}
              </span>
            </td>
            <td>
              <span
                className={`status ${
                  user.status === "Aktiv" ? "active" : "inactive"
                }`}
                onClick={() => onToggleStatus(user.id)}
                style={{ cursor: "pointer" }}
              >
                {user.status}
              </span>
            </td>
            <td>
              <button className="edit-btn" onClick={() => onEdit(user)}>
                ✏️ Bearbeiten
              </button>
              <button className="delete-btn" onClick={() => onDelete(user.id)}>
                🗑️ Löschen
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Helper: Farbe für Rollen-Badge
function getRoleBadgeColor(role: string): string {
  switch (role) {
    case "Admin":
      return "#8b5cf6";
    case "E-Supervisor":
    case "M-Supervisor":
      return "#3b82f6";
    case "Elektriker":
      return "#f59e0b";
    case "Mechaniker":
      return "#10b981";
    case "RSC":
      return "#6b7280";
    default:
      return "#9ca3af";
  }
}

export default UserTable;
