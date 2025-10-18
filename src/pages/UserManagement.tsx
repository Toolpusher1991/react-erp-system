import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getUsers, createUser, updateUser, deleteUser } from "../services/api";
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

  useEffect(() => {
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

  const handleAddUser = async (
    name: string,
    email: string,
    username: string,
    password: string,
    role: string
  ) => {
    try {
      const newUser = {
        name,
        email,
        password,
        role,
        status: "Aktiv", // Backend erwartet "Aktiv" oder "Inaktiv"
      };

      console.log("✨ Creating user:", newUser);
      const result = await createUser(newUser);

      if (result.data) {
        console.log("✅ User created successfully:", result.data);
        // Reload users to show the new one
        await loadUsers();
      }
    } catch (error: any) {
      console.error("❌ Error creating user:", error);
      alert(
        "Fehler beim Erstellen des Users: " +
          (error.response?.data?.error || error.message)
      );
    }
  };

  const handleUpdateUser = async (
    id: number,
    name: string,
    email: string,
    username: string,
    password: string | undefined,
    role: string
  ) => {
    try {
      const updates: any = {
        name,
        email,
        role,
      };

      // Only include password if it was changed
      if (password) {
        updates.password = password;
      }

      console.log("✨ Updating user:", id, updates);
      const result = await updateUser(id, updates);

      if (result.data) {
        console.log("✅ User updated successfully:", result.data);
        setEditingUser(null);
        // Reload users to show the updated data
        await loadUsers();
      }
    } catch (error: any) {
      console.error("❌ Error updating user:", error);
      alert(
        "Fehler beim Aktualisieren des Users: " +
          (error.response?.data?.error || error.message)
      );
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      const user = users.find((u) => u.id === id);
      if (!user) return;

      const newStatus = user.status === "active" ? "inactive" : "active";

      console.log("✨ Toggling user status:", id, "->", newStatus);
      const result = await updateUser(id, { status: newStatus });

      if (result.data) {
        console.log("✅ User status toggled successfully:", result.data);
        // Reload users to show the updated status
        await loadUsers();
      }
    } catch (error: any) {
      console.error("❌ Error toggling user status:", error);
      alert(
        "Fehler beim Ändern des Status: " +
          (error.response?.data?.error || error.message)
      );
    }
  };

  const handleDeleteUser = async (id: number) => {
    const user = users.find((u) => u.id === id);
    if (!user) return;

    if (
      window.confirm(
        `Möchtest du den User "${user.name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`
      )
    ) {
      try {
        console.log("✨ Deleting user:", id);
        await deleteUser(id);

        console.log("✅ User deleted successfully:", id);
        // Reload users to remove the deleted one
        await loadUsers();
      } catch (error: any) {
        console.error("❌ Error deleting user:", error);
        alert(
          "Fehler beim Löschen des Users: " +
            (error.response?.data?.error || error.message)
        );
      }
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
