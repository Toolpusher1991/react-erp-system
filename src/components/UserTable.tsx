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
  return (
    <table className="user-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Email</th>
          <th>Rolle</th>
          <th>Status</th>
          <th>Aktion</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr key={user.id}>
            <td>{user.id}</td>
            <td>{user.name}</td>
            <td>{user.email}</td>
            <td>{user.role}</td>
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
                Bearbeiten
              </button>
              <button className="delete-btn" onClick={() => onDelete(user.id)}>
                Löschen
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default UserTable;
