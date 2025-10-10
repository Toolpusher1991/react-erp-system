import { useState, useEffect } from "react";

interface User {
  id: number;
  name: string;
  email: string;
  password?: string;
  role: string;
  status: "Aktiv" | "Inaktiv";
}

interface UserFormProps {
  onAddUser: (
    name: string,
    email: string,
    username: string,
    password: string,
    role: string
  ) => void;
  onUpdateUser: (
    id: number,
    name: string,
    email: string,
    username: string,
    password: string | undefined,
    role: string
  ) => void;
  editingUser: User | null;
  onCancelEdit: () => void;
}

function UserForm({
  onAddUser,
  onUpdateUser,
  editingUser,
  onCancelEdit,
}: UserFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");

  // Wenn editingUser sich ändert, Felder füllen
  useEffect(() => {
    if (editingUser) {
      setName(editingUser.name || "");
      setEmail(editingUser.email || "");
      setUsername(editingUser.email || ""); // Email als Username
      setPassword(""); // Passwort leer lassen beim Edit
      setRole(editingUser.role || "");
    } else {
      // Reset bei neuem User
      setName("");
      setEmail("");
      setUsername("");
      setPassword("");
      setRole("");
    }
  }, [editingUser]);

  const handleSubmit = () => {
    // Validierung
    if (!name.trim()) {
      alert("Bitte Name eingeben");
      return;
    }
    if (!email.trim()) {
      alert("Bitte Email eingeben");
      return;
    }
    if (!role) {
      alert("Bitte Rolle wählen");
      return;
    }

    if (editingUser) {
      // Update: Passwort ist optional
      onUpdateUser(
        editingUser.id,
        name.trim(),
        email.trim(),
        username.trim() || email.trim(),
        password.trim() || undefined,
        role
      );
    } else {
      // Neu: Passwort ist pflicht
      if (!password.trim()) {
        alert("Bitte Passwort eingeben");
        return;
      }
      onAddUser(
        name.trim(),
        email.trim(),
        username.trim() || email.trim(),
        password.trim(),
        role
      );
    }

    // Reset
    setName("");
    setEmail("");
    setUsername("");
    setPassword("");
    setRole("");
  };

  return (
    <div className="form-container">
      <h2>{editingUser ? "User bearbeiten" : "Neuen User hinzufügen"}</h2>

      <div className="form-group">
        <label>Name *</label>
        <input
          type="text"
          placeholder="Max Mustermann"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label>Email / Benutzername *</label>
        <input
          type="email"
          placeholder="max@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label>
          Passwort {editingUser ? "(leer lassen zum Behalten)" : "*"}
        </label>
        <input
          type="password"
          placeholder={editingUser ? "Neues Passwort (optional)" : "Passwort"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label>Rolle *</label>
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">-- Rolle wählen --</option>
          <option value="Admin">Admin</option>
          <option value="E-Supervisor">E-Supervisor</option>
          <option value="M-Supervisor">M-Supervisor</option>
          <option value="Elektriker">Elektriker</option>
          <option value="Mechaniker">Mechaniker</option>
          <option value="RSC">RSC</option>
        </select>
      </div>

      <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
        <button onClick={handleSubmit} style={{ flex: 1 }}>
          {editingUser ? "💾 Speichern" : "➕ User hinzufügen"}
        </button>

        {editingUser && (
          <button onClick={onCancelEdit} style={{ background: "#718096" }}>
            Abbrechen
          </button>
        )}
      </div>
    </div>
  );
}

export default UserForm;
