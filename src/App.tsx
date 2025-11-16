
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Propiedades from "./pages/Propiedades";
import Clientes from "./pages/Clientes";
import Pagos from "./pages/Pagos";


export default function App() {
  const { isLoggedIn } = useAuth();

  return (
    
    <Routes>
      {!isLoggedIn ? (
        <Route path="*" element={<Login />} />
      ) : (
        <>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/propiedades" element={<Propiedades />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/pagos" element={<Pagos />} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </>
      )}
      
    </Routes>
  );
}
