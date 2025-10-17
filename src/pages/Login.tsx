import { useState } from "react";
import "./Login.css";
import { useAuth } from "../contexts/AuthContext";
import { useData } from "../contexts/DataContext";
import LoginForm from "../components/LoginForm";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showBackendLogin, setShowBackendLogin] = useState(false);

  // Auth context functions
  const { login } = useAuth();

  // Hole users aus dem DataContext (für Legacy-Login)
  const { users } = useData();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    // Suche User in der User-Liste aus DataContext
    const user = users.find(
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

        {/* Backend Auth Toggle */}
        <div className="backend-auth-section">
          <button
            type="button"
            className="backend-auth-toggle"
            onClick={() => setShowBackendLogin(true)}
          >
            🔐 JWT Backend Login
          </button>
        </div>

        {/* Hilfe für Test-User */}
        <div className="test-users">
          <p>
            <strong>💡 Test-Accounts (LocalStorage):</strong>
          </p>
          <p>Admin: admin@erp.de / admin123</p>
          <p>E-Supervisor: esuper@erp.de / es123</p>
          <p>T207 Elektriker: t207-el / t207</p>
          <p>T208 Mechaniker: t208-mech / t208</p>
        </div>
      </div>

      {/* Backend Login Modal */}
      {showBackendLogin && (
        <LoginForm onClose={() => setShowBackendLogin(false)} />
      )}
    </div>
  );
}

export default Login;
