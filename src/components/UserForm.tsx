import { useState } from "react";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: "Aktiv" | "Inaktiv";
}

interface UserFormProps {
  onAddUser: (name: string, email: string, role: string) => void;
  onUpdateUser: (id: number, name: string, email: string, role: string) => void;
  editingUser: User | null;
  onCancelEdit: () => void;
}

function UserForm({
  onAddUser,
  onUpdateUser,
  editingUser,
  onCancelEdit,
}: UserFormProps) {
  const [name, setName] = useState(editingUser?.name || "");
  const [email, setEmail] = useState(editingUser?.email || "");
  const [role, setRole] = useState(editingUser?.role || "");

  const handleSubmit = () => {
    if (editingUser) {
      onUpdateUser(editingUser.id, name, email, role);
    } else {
      onAddUser(name, email, role);
    }
    setName("");
    setEmail("");
    setRole("");
  };

  return (
    <div className="form-container">
      <h2>{editingUser ? "User bearbeiten" : "Neuen User hinzufügen"}</h2>

      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <select value={role} onChange={(e) => setRole(e.target.value)}>
        <option value="">-- Rolle wählen --</option>
        <option value="Admin">Admin</option>
        <option value="User">User</option>
        <option value="Manager">Manager</option>
        <option value="Developer">Developer</option>
      </select>

      <button onClick={handleSubmit}>
        {editingUser ? "Speichern" : "User hinzufügen"}
      </button>

      {editingUser && (
        <button
          onClick={onCancelEdit}
          style={{ marginLeft: "1rem", background: "#718096" }}
        >
          Abbrechen
        </button>
      )}
    </div>
  );
}

export default UserForm;
