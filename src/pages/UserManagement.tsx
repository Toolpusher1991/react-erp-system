import { useState } from "react";
import { useData } from "../contexts/DataContext";
import { useAuth } from "../contexts/AuthContext";
import UserForm from "../components/UserForm";
import UserTable from "../components/UserTable";

function UserManagement() {
  const { users, updateUser, deleteUser, addUser } = useData();
  const { permissions } = useAuth();
  const [editingUser, setEditingUser] = useState<any>(null);

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
    const newUser = {
      id: Math.max(...users.map((u) => u.id), 0) + 1,
      name,
      email,
      password,
      role: role as any,
      status: "Aktiv" as const,
      assignedAssets: [],
    };
    addUser(newUser);
  };

  const handleUpdateUser = (
    id: number,
    name: string,
    email: string,
    username: string,
    password: string | undefined,
    role: string
  ) => {
    const userToUpdate = users.find((u) => u.id === id);
    if (userToUpdate) {
      const updatedUser = {
        ...userToUpdate,
        name,
        email,
        role: role as any,
        // Nur Passwort updaten wenn es angegeben wurde
        ...(password && password.trim() !== "" ? { password } : {}),
      };
      updateUser(updatedUser);
    }
    setEditingUser(null);
  };

  const handleToggleStatus = (id: number) => {
    const user = users.find((u) => u.id === id);
    if (user) {
      updateUser({
        ...user,
        status: user.status === "Aktiv" ? "Inaktiv" : "Aktiv",
      });
    }
  };

  const handleDeleteUser = (id: number) => {
    if (window.confirm("User wirklich löschen?")) {
      deleteUser(id);
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
