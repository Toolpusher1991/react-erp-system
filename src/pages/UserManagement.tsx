import { useState } from "react";
import UserForm from "../components/UserForm";
import UserTable from "../components/UserTable";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: "Aktiv" | "Inaktiv";
}

function UserManagement() {
  const [users, setUsers] = useState<User[]>([
    {
      id: 1,
      name: "Max Mustermann",
      email: "max@example.com",
      role: "Admin",
      status: "Aktiv",
    },
    {
      id: 2,
      name: "Anna Schmidt",
      email: "anna@example.com",
      role: "User",
      status: "Aktiv",
    },
    {
      id: 3,
      name: "Tom Weber",
      email: "tom@example.com",
      role: "User",
      status: "Inaktiv",
    },
    {
      id: 4,
      name: "Lisa Müller",
      email: "lisa@example.com",
      role: "User",
      status: "Aktiv",
    },
  ]);

  const [editingUser, setEditingUser] = useState<User | null>(null);

  const addUser = (name: string, email: string, role: string) => {
    const newUser: User = {
      id: users.length + 1,
      name,
      email,
      role,
      status: "Aktiv",
    };
    setUsers([...users, newUser]);
  };

  const updateUser = (
    id: number,
    name: string,
    email: string,
    role: string
  ) => {
    setUsers(
      users.map((user) =>
        user.id === id ? { ...user, name, email, role } : user
      )
    );
    setEditingUser(null);
  };

  const deleteUser = (id: number) => {
    setUsers(users.filter((user) => user.id !== id));
  };

  const toggleStatus = (id: number) => {
    setUsers(
      users.map((user) =>
        user.id === id
          ? { ...user, status: user.status === "Aktiv" ? "Inaktiv" : "Aktiv" }
          : user
      )
    );
  };

  return (
    <div className="container">
      <h1>Benutzerverwaltung</h1>

      <UserForm
        onAddUser={addUser}
        onUpdateUser={updateUser}
        editingUser={editingUser}
        onCancelEdit={() => setEditingUser(null)}
      />

      <UserTable
        users={users}
        onDelete={deleteUser}
        onEdit={setEditingUser}
        onToggleStatus={toggleStatus}
      />
    </div>
  );
}

export default UserManagement;
