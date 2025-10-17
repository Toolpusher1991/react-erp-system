// ==========================================
// LOGIN COMPONENT WITH JWT BACKEND
// ==========================================

import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import "./LoginForm.css";

interface LoginFormProps {
  onClose?: () => void;
}

export default function LoginForm({ onClose }: LoginFormProps) {
  const {
    loginWithBackend,
    registerWithBackend,
    isLoading,
    error,
    clearError,
  } = useAuth();

  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    console.log("🔐 LoginForm handleSubmit:", { isRegisterMode, formData });

    if (isRegisterMode) {
      console.log("📝 Attempting registration...");
      const success = await registerWithBackend(
        formData.email,
        formData.password,
        formData.name
      );
      console.log("📝 Registration result:", success);
      if (success && onClose) {
        onClose();
      }
    } else {
      console.log("🔑 Attempting login...");
      const success = await loginWithBackend(formData.email, formData.password);
      console.log("🔑 Login result:", success);
      if (success) {
        console.log("✅ Login successful, reloading page...");
        window.location.reload(); // Force page refresh to update UI
        if (onClose) onClose();
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
    clearError();
    setFormData({ email: "", password: "", name: "" });
  };

  return (
    <div className="login-overlay">
      <div className="login-modal">
        <div className="login-header">
          <h2>{isRegisterMode ? "🔐 Account Erstellen" : "🔐 Anmeldung"}</h2>
          {onClose && (
            <button className="close-button" onClick={onClose} type="button">
              ✕
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {isRegisterMode && (
            <div className="form-group">
              <label htmlFor="name">Name:</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required={isRegisterMode}
                placeholder="Ihr vollständiger Name"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">E-Mail:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="ihre.email@beispiel.de"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Passwort:</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              placeholder="Mindestens 6 Zeichen"
            />
          </div>

          {error && <div className="error-message">❌ {error}</div>}

          <button type="submit" className="submit-button" disabled={isLoading}>
            {isLoading
              ? "⏳ Bitte warten..."
              : isRegisterMode
              ? "📝 Account erstellen"
              : "🚀 Anmelden"}
          </button>
        </form>

        <div className="login-footer">
          <button
            type="button"
            className="toggle-mode-button"
            onClick={toggleMode}
          >
            {isRegisterMode
              ? "← Zurück zur Anmeldung"
              : "→ Neuen Account erstellen"}
          </button>
        </div>
      </div>
    </div>
  );
}
