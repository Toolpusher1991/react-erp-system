import { useState } from "react";
import "./Login.css";
import { useAuth } from "../contexts/AuthContext";
import type { User } from "../types";

// Test-User mit verschiedenen Rollen
const TEST_USERS: User[] = [
  // Admins & Supervisors - sehen ALLE Anlagen (assignedAssets: [])
  {
    id: 1,
    name: "Max Admin",
    email: "admin@erp.de",
    password: "admin123",
    role: "Admin",
    status: "Aktiv",
    assignedAssets: [], // Leer = Zugriff auf ALLES
  },
  {
    id: 2,
    name: "Anna E-Super",
    email: "esuper@erp.de",
    password: "es123",
    role: "E-Supervisor",
    status: "Aktiv",
    assignedAssets: [], // Supervisor sieht alles
  },
  {
    id: 3,
    name: "Tom M-Super",
    email: "msuper@erp.de",
    password: "ms123",
    role: "M-Supervisor",
    status: "Aktiv",
    assignedAssets: [], // Supervisor sieht alles
  },
  {
    id: 6,
    name: "Sarah RSC",
    email: "rsc@erp.de",
    password: "rsc123",
    role: "RSC",
    status: "Aktiv",
    assignedAssets: [], // RSC überwacht alles
  },

  // T207 Team - nur Zugriff auf T207 (ID: 1)
  {
    id: 10,
    name: "T207 Elektriker",
    email: "t207-el",
    password: "t207",
    role: "Elektriker",
    status: "Aktiv",
    assignedAssets: [1], // Nur T207
  },
  {
    id: 11,
    name: "T207 Mechaniker",
    email: "t207-mech",
    password: "t207",
    role: "Mechaniker",
    status: "Aktiv",
    assignedAssets: [1], // Nur T207
  },

  // T208 Team - nur Zugriff auf T208 (ID: 2)
  {
    id: 12,
    name: "T208 Elektriker",
    email: "t208-el",
    password: "t208",
    role: "Elektriker",
    status: "Aktiv",
    assignedAssets: [2], // Nur T208
  },
  {
    id: 13,
    name: "T208 Mechaniker",
    email: "t208-mech",
    password: "t208",
    role: "Mechaniker",
    status: "Aktiv",
    assignedAssets: [2], // Nur T208
  },

  // T700 Team - nur Zugriff auf T700 (ID: 3)
  {
    id: 14,
    name: "T700 Elektriker",
    email: "t700-el",
    password: "t700",
    role: "Elektriker",
    status: "Aktiv",
    assignedAssets: [3], // Nur T700
  },
  {
    id: 15,
    name: "T700 Mechaniker",
    email: "t700-mech",
    password: "t700",
    role: "Mechaniker",
    status: "Aktiv",
    assignedAssets: [3], // Nur T700
  },

  // T46 Team - nur Zugriff auf T46 (ID: 4)
  {
    id: 16,
    name: "T46 Elektriker",
    email: "t46-el",
    password: "t46",
    role: "Elektriker",
    status: "Aktiv",
    assignedAssets: [4], // Nur T46
  },
  {
    id: 17,
    name: "T46 Mechaniker",
    email: "t46-mech",
    password: "t46",
    role: "Mechaniker",
    status: "Aktiv",
    assignedAssets: [4], // Nur T46
  },
];

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Hole login-Funktion aus dem AuthContext
  const { login } = useAuth();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    <div className="login-logo">
      <img src="/logo.png" alt="Firmen Logo" className="logo-image" />
    </div>;

    // Suche User in der Test-User-Liste
    const user = TEST_USERS.find(
      (u) => u.email === email && u.password === password
    );

    if (user) {
      // Login erfolgreich - rufe Context login auf
      login(user);
    } else {
      // Login fehlgeschlagen
      setError("Falsche Email oder Passwort!");
      setPassword("");
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-container">
        {/* Logo-Bereich */}
        <div className="login-logo">
          <img src="/logo.png" alt="Firmen Logo" className="logo-image" />
        </div>
        <h1>MaintAIn Login </h1>
        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Benutzername"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Passwort"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="error">{error}</p>}
          <button type="submit">Anmelden</button>
        </form>

        {/* Hilfe für Test-User */}
        <div className="test-users">
          <p>
            <strong>💡 Test-Accounts:</strong>
          </p>
          <p>Admin: admin@cmms.de / admin123</p>
          <p>E-Supervisor: esuper@cmms.de / es123</p>
          <p>T207 Elektriker: t207-el / t207</p>
          <p>T208 Mechaniker: t208-mech / t208</p>
        </div>
      </div>
    </div>
  );
}

export default Login;
