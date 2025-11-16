"use client";

import  { useEffect, useState } from "react";
import { Search, Plus, Edit, Trash2 } from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import AuthGuard from "../components/AuthGuard";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import ModalForm from "../components/ModalForm";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type Cliente = {
  id: number;
  nombre: string;
  email: string;
  telefono: string;
  propiedades: number;
  estado: "activo" | "inactivo" | "moroso";
};

import { API_URL } from "../config";


export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editando, setEditando] = useState<Cliente | null>(null);
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    telefono: "",
    propiedades: 0,
    estado: "activo" as Cliente["estado"],
  });

  useEffect(() => {
    fetch(`${API_URL}/clientes`)
      .then((res) => res.json())
      .then((data) => setClientes(data))
      .catch(() => toast.error("Error cargando clientes"));
  }, []);

  const getBadgeVariant = (estado: string) => {
    switch (estado) {
      case "activo":
        return "default";
      case "inactivo":
        return "secondary";
      case "moroso":
        return "destructive";
      default:
        return "outline";
    }
  };

  const clientesFiltrados = clientes.filter(
    (c) =>
      c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.email.toLowerCase().includes(busqueda.toLowerCase())
  );

  const abrirModal = (cliente?: Cliente) => {
    if (cliente) {
      setEditando(cliente);
      setForm({
        nombre: cliente.nombre,
        email: cliente.email,
        telefono: cliente.telefono,
        propiedades: cliente.propiedades,
        estado: cliente.estado,
      });
    } else {
      setEditando(null);
      setForm({ nombre: "", email: "", telefono: "", propiedades: 0, estado: "activo" });
    }
    setIsModalOpen(true);
  };

  const guardarCliente = async () => {
    if (!form.nombre || !form.email || !form.telefono || !form.estado) {
      toast.warning("Completa los campos obligatorios.");
      return;
    }

    try {
      const method = editando ? "PUT" : "POST";
      const url = editando ? `${API_URL}/clientes/${editando.id}` : `${API_URL}/clientes`;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Error al guardar");

      const data = await res.json();

      if (editando) {
        setClientes((prev) => prev.map((c) => (c.id === data.id ? data : c)));
        toast.success("Cliente actualizado");
      } else {
        setClientes((prev) => [...prev, data]);
        toast.success("Cliente agregado");
      }

      setIsModalOpen(false);
    } catch {
      toast.error("Error al guardar el cliente");
    }
  };

  const eliminarCliente = async (id: number) => {
    if (!confirm("¿Eliminar cliente definitivamente?")) return;

    try {
      await fetch(`${API_URL}/clientes/${id}`, { method: "DELETE" });
      setClientes((prev) => prev.filter((c) => c.id !== id));
      toast.info("Cliente eliminado");
    } catch {
      toast.error("No se pudo eliminar el cliente");
    }
  };

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-10 p-4 md:p-6">

          {/* HERO */}
          <div className="bg-gradient-to-r from-rose-600 via-pink-600 to-violet-600 text-white p-10 rounded-3xl shadow-xl">
            <h1 className="text-4xl font-bold mb-2">Gestión de Clientes</h1>
            <p className="text-white/80 text-lg">
              Administra todos tus clientes de forma rápida y visual.
            </p>
          </div>

          {/* BUSCADOR + BOTÓN */}
          <div className="flex flex-col md:flex-row md:justify-between gap-4">

            {/* Search */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre o correo..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-10"
              />
            </div>

            <Button onClick={() => abrirModal()} className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> Nuevo Cliente
            </Button>
          </div>

          {/* TABLA DISEÑO MODERNO */}
          {/* TABLA MODERNA ESTILO PAGOS */}
<div className="rounded-xl overflow-hidden border border-gray-200 bg-white shadow-md">
  <table className="min-w-full text-sm">
    <thead className="bg-gray-100 text-gray-700">
      <tr>
        <th className="px-4 py-3 text-left">Nombre</th>
        <th className="px-4 py-3 text-left">Correo</th>
        <th className="px-4 py-3 text-left">Teléfono</th>
        <th className="px-4 py-3 text-left">Propiedades</th>
        <th className="px-4 py-3 text-left">Estado</th>
        <th className="px-4 py-3 text-left">Acciones</th>
      </tr>
    </thead>

    <tbody>
      {clientesFiltrados.map((cliente) => (
        <tr
          key={cliente.id}
          className="border-t hover:bg-gray-50 transition"
        >
          <td className="px-4 py-3 font-semibold">{cliente.nombre}</td>
          <td className="px-4 py-3 text-gray-600">{cliente.email}</td>
          <td className="px-4 py-3 text-gray-600">{cliente.telefono}</td>
          <td className="px-4 py-3">{cliente.propiedades}</td>

          <td className="px-4 py-3">
            <Badge variant={getBadgeVariant(cliente.estado)}>
              {cliente.estado.charAt(0).toUpperCase() + cliente.estado.slice(1)}
            </Badge>
          </td>

          <td className="px-4 py-3 flex gap-2">
            <Button size="sm" variant="outline" onClick={() => abrirModal(cliente)}>
              <Edit className="h-4 w-4" />
            </Button>

            <Button size="sm" variant="destructive" onClick={() => eliminarCliente(cliente.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </td>
        </tr>
      ))}

      {clientesFiltrados.length === 0 && (
        <tr>
          <td
            colSpan={6}
            className="text-center py-6 text-gray-500"
          >
            No se encontraron clientes.
          </td>
        </tr>
      )}
    </tbody>
  </table>
</div>

        </div>

        {/* MODAL */}
        <ModalForm
          title={editando ? "Editar Cliente" : "Nuevo Cliente"}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre</label>
              <Input
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Correo</label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Teléfono</label>
              <Input
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Propiedades</label>
              <Input
                type="number"
                min={0}
                value={form.propiedades}
                onChange={(e) => setForm({ ...form, propiedades: Number(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Estado</label>
              <select
                value={form.estado}
                onChange={(e) => setForm({ ...form, estado: e.target.value as Cliente["estado"] })}
                className="w-full border border-gray-100 dark:border-gray-300 rounded-md px-3 py-2 bg-white "
              >
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
                <option value="moroso">Moroso</option>
              </select>
            </div>

            <Button onClick={guardarCliente} className="w-full">
              {editando ? "Guardar Cambios" : "Agregar Cliente"}
            </Button>
          </div>
        </ModalForm>

        <ToastContainer position="bottom-right" autoClose={2500} theme="colored" />
      </DashboardLayout>
    </AuthGuard>
  );
}
