// ==========================================
// DEBUG RESET COMPONENT
// ==========================================
// Komponente zum Zurücksetzen aller Daten
// FÜGE DIESEN BUTTON TEMPORÄR IM DASHBOARD-HEADER EIN

import { useData } from "../contexts/DataContext";

function DebugResetButton() {
  const { resetAllData } = useData();

  const handleReset = () => {
    if (
      window.confirm(
        "⚠️ ACHTUNG: Alle Daten werden zurückgesetzt und die App neu geladen. Fortfahren?"
      )
    ) {
      // Reset alle Daten im DataContext
      resetAllData();

      // Lösche auch Auth-Daten
      localStorage.removeItem("maintaIn_currentUser");

      // Reload die Seite um sicherzustellen dass alles neu geladen wird
      window.location.reload();
    }
  };

  return (
    <button
      onClick={handleReset}
      style={{
        background: "#ef4444",
        color: "white",
        padding: "0.625rem 1.25rem",
        border: "none",
        borderRadius: "10px",
        fontSize: "0.875rem",
        fontWeight: "600",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
      }}
    >
      🔄 Debug: Reset All Data
    </button>
  );
}

export default DebugResetButton;
