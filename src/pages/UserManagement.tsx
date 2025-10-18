import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getUsers } from "../services/api";
import UserForm from "../components/UserForm";
import UserTable from "../components/UserTable";
import type { User } from "../types";

function UserManagement() {
  const { permissions } = useAuth();

  // Backend state
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Load users from backend
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        console.log("👥 Loading Users from Backend...");

        const result = await getUsers();

        if (result.data) {
          const data = result.data as any;
          setUsers(data.users || []);
          console.log("✅ Users loaded:", data.users?.length);
        }
      } catch (error) {
        console.error("❌ Failed to load users:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  // Nur Admin darf hier rein - doppelte Absicherung
  if (!permissions?.canViewAllUsers) {
    return (
      <div className="container">
        <h1>⛔ Zugriff verweigert</h1>
        <p>Du hast keine Berechtigung für diese Seite.</p>
      </div>
    );
  }

  const handleAddUser = (
    name: string,
    email: string,
    username: string,
    password: string,
    role: string
  ) => {
    // TODO: Backend API für User-Erstellung implementieren
    alert("User-Erstellung über Backend noch nicht implementiert");
    console.log("User erstellen:", { name, email, role });
  };

  const handleUpdateUser = (
    id: number,
    name: string,
    email: string,
    username: string,
    password: string | undefined,
    role: string
  ) => {
    // TODO: Backend API für User-Update implementieren
    alert("User-Bearbeitung über Backend noch nicht implementiert");
    console.log("User bearbeiten:", { id, name, email, role });
    setEditingUser(null);
  };

  const handleToggleStatus = (id: number) => {
    // TODO: Backend API für Status-Toggle implementieren
    alert("Status-Änderung über Backend noch nicht implementiert");
    console.log("User Status togglen:", id);
  };

  const handleDeleteUser = (id: number) => {
    // TODO: Backend API für User-Löschung implementieren
    if (
      window.confirm(
        "User-Löschung über Backend noch nicht implementiert. Trotzdem fortfahren?"
      )
    ) {
      console.log("User löschen:", id);
    }
  };

  return (
    <div className="container">
      <h1>👥 Benutzerverwaltung</h1>

      <UserForm
        onAddUser={handleAddUser}
        onUpdateUser={handleUpdateUser}
        editingUser={editingUser}
        onCancelEdit={() => setEditingUser(null)}
      />

      <UserTable
        users={users}
        onDelete={handleDeleteUser}
        onEdit={setEditingUser}
        onToggleStatus={handleToggleStatus}
      />
    </div>
  );
}

export default UserManagement;
