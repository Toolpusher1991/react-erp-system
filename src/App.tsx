import "./App.css";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import { useAuth } from "./contexts/AuthContext";

function App() {
  // Hole currentUser aus dem AuthContext
  const { currentUser } = useAuth();

  // Wenn kein User eingeloggt → zeige Login
  if (!currentUser) {
    return <Login />;
  }

  // Wenn User eingeloggt → zeige Dashboard
  return <Dashboard />;
}

export default App;
