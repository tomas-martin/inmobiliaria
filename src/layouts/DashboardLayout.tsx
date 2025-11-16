import React from "react";
import { LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      
      {/* Navbar */}
      <header className="flex items-center justify-between px-6 py-4 bg-white shadow-sm">
        <h1 className="text-xl font-bold text-indigo-600">Inmoweb</h1>

        <nav className="flex items-center gap-4 text-sm font-medium text-gray-600">
          <Link to="/dashboard" className="hover:text-indigo-600">Dashboard</Link>
          <Link to="/propiedades" className="hover:text-indigo-600">Propiedades</Link>
          <Link to="/clientes" className="hover:text-indigo-600">Clientes</Link>
          <Link to="/pagos" className="hover:text-indigo-600">Pagos</Link>

          <button
            onClick={logout}
            className="flex items-center gap-1 text-red-500 hover:text-red-600"
          >
            <LogOut className="w-4 h-4" /> Salir
          </button>
        </nav>
      </header>

      {/* Contenido */}
      <main className="p-6">{children}</main>
    </div>
  );
}

