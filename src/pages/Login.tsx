import { useState } from "react";
import "./Login.css";
import { useAuth } from "../contexts/AuthContext";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Backend Auth with JWT
  const { loginWithBackend } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      console.log("🔐 Attempting login with:", email);
      const success = await loginWithBackend(email, password);

      if (!success) {
        setError("Falsche Email oder Passwort!");
        setPassword("");
      }
    } catch (err) {
      console.error("❌ Login error:", err);
      setError("Anmeldefehler. Bitte versuchen Sie es erneut.");
      setPassword("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-container">
        {/* Logo-Bereich */}
        <div className="login-logo">
          <img src="/logo.png" alt="Firmen Logo" className="logo-image" />
        </div>
        <h1>MaintAIn Login</h1>
        <p style={{ textAlign: "center", color: "#666", marginBottom: "1rem" }}>
          🔐 Sichere Anmeldung mit Backend
        </p>

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email-Adresse"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
          <input
            type="password"
            placeholder="Passwort"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />
          {error && <p className="error">{error}</p>}
          <button type="submit" disabled={isLoading}>
            {isLoading ? "Anmeldung läuft..." : "Anmelden"}
          </button>
        </form>

        {/* Hilfe für Test-User */}
        <div className="test-users">
          <p>
            <strong>💡 Test-Accounts:</strong>
          </p>
          <p>Admin: admin@erp.de / admin123</p>
          <p>E-Supervisor: esuper@erp.de / es123</p>
          <p>M-Supervisor: msuper@erp.de / ms123</p>
          <p>T207 Elektriker: t207-el@erp.de / t207</p>
          <p>T207 Mechaniker: t207-mech@erp.de / t207</p>
        </div>
      </div>
    </div>
  );
}

export default Login;
