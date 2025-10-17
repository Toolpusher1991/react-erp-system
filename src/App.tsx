// src/App.tsx - AKTUALISIERT
import { AuthProvider } from "./contexts/AuthContext";
import { DataProvider } from "./contexts/DataContext";
import { ToastProvider } from "./components/ToastContainer";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ChatBot from "./components/ChatBot"; // NEU!
import { useAuth } from "./contexts/AuthContext";
import "./App.css";

function AppContent() {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Login />;
  }

  return (
    <>
      <Dashboard />
      {/* ChatBot hier - außerhalb von Dashboard! */}
      <ChatBot />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;
