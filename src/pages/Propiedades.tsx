"use client";

import { useState, useEffect } from "react";
import { Home, Search, Plus, Trash2, Edit } from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import AuthGuard from "../components/AuthGuard";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import ModalForm from "../components/ModalForm";

type Propiedad = {
  id: number;
  direccion: string;
  precio: number;
  disponible: boolean;
  foto_url?: string;
};

import { API_URL } from "../config";


export default function Propiedades() {
  const [propiedades, setPropiedades] = useState<Propiedad[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<"todas" | "disponibles" | "rentadas">("todas");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editando, setEditando] = useState<Propiedad | null>(null);
  const [form, setForm] = useState({
    direccion: "",
    precio: "",
    disponible: true,
    foto_url: "", 
  });

  const [alerta, setAlerta] = useState<{ tipo: "success" | "error"; mensaje: string } | null>(null);

  const mostrarAlerta = (tipo: "success" | "error", mensaje: string) => {
    setAlerta({ tipo, mensaje });
    setTimeout(() => setAlerta(null), 2500);
  };

 useEffect(() => {
  fetch(`${API_URL}/propiedades`)
    .then((res) => res.json())
    .then((data) =>
      setPropiedades(
        data.map((p: any) => ({
          ...p,
          precio: Number(p.precio), 
        }))
      )
    )
    .catch(() => mostrarAlerta("error", "Error al cargar propiedades"));
}, []);


  const formatCurrency = (valor: number) =>
    valor.toLocaleString("es-AR", { style: "currency", currency: "ARS" });

  const propiedadesFiltradas = propiedades.filter((p) => {
    const coincideBusqueda = p.direccion.toLowerCase().includes(busqueda.toLowerCase());
    const coincideEstado =
      filtro === "todas" ||
      (filtro === "disponibles" && p.disponible) ||
      (filtro === "rentadas" && !p.disponible);
    return coincideBusqueda && coincideEstado;
  });

  const abrirModal = (propiedad?: Propiedad) => {
    if (propiedad) {
      setEditando(propiedad);
      setForm({
        direccion: propiedad.direccion,
        precio: propiedad.precio.toString(),
        disponible: propiedad.disponible,
        foto_url: propiedad.foto_url || "",
      });
    } else {
      setEditando(null);
      setForm({ direccion: "", precio: "", disponible: true, foto_url: "" });
    }
    setIsModalOpen(true);
  };

  const guardarPropiedad = async () => {
    if (!form.direccion || !form.precio)
      return mostrarAlerta("error", "Completa todos los campos.");

    try {
      const method = editando ? "PUT" : "POST";
      const endpoint = editando
        ? `${API_URL}/propiedades/${editando.id}`
        : `${API_URL}/propiedades`;

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          direccion: form.direccion,
          precio: parseFloat(form.precio),
          disponible: form.disponible,
          foto_url: form.foto_url || null, 
        }),
      });

      if (!res.ok) throw new Error();

      const data = await res.json();
      if (editando) {
        setPropiedades((prev) => prev.map((p) => (p.id === data.id ? data : p)));
        mostrarAlerta("success", "Propiedad actualizada");
      } else {
        setPropiedades((prev) => [...prev, data]);
        mostrarAlerta("success", "Propiedad agregada");
      }

      setIsModalOpen(false);
    } catch {
      mostrarAlerta("error", "Error al guardar la propiedad");
    }
  };

  const eliminarPropiedad = async (id: number) => {
    if (!confirm("¿Seguro que deseas eliminarla?")) return;

    try {
      await fetch(`${API_URL}/propiedades/${id}`, { method: "DELETE" });
      setPropiedades((prev) => prev.filter((p) => p.id !== id));
      mostrarAlerta("success", "Propiedad eliminada");
    } catch {
      mostrarAlerta("error", "No se pudo eliminar");
    }
  };

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-10 p-4 md:p-6">

          {alerta && (
            <div
              className={`p-4 rounded-xl text-white shadow-md ${
                alerta.tipo === "success" ? "bg-green-600" : "bg-red-600"
              }`}
            >
              {alerta.mensaje}
            </div>
          )}

          {/* HERO */}
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-10 rounded-3xl shadow-xl">
            <h1 className="text-4xl font-bold mb-2">Propiedades</h1>
            <p className="text-white/80 text-lg">
              Gestiona fácilmente tus propiedades, fotos y disponibilidad.
            </p>
          </div>

          {/* BUSCADOR + BOTONES */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar dirección..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button
                variant={filtro === "todas" ? "default" : "outline"}
                onClick={() => setFiltro("todas")}
              >
                Todas
              </Button>
              <Button
                variant={filtro === "disponibles" ? "default" : "outline"}
                onClick={() => setFiltro("disponibles")}
              >
                Disponibles
              </Button>
              <Button
                variant={filtro === "rentadas" ? "default" : "outline"}
                onClick={() => setFiltro("rentadas")}
              >
                Rentadas
              </Button>

              <Button onClick={() => abrirModal()} className="flex items-center gap-2">
                <Plus className="h-4 w-4" /> Nueva
              </Button>
            </div>
          </div>

          {/* LISTADO */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {propiedadesFiltradas.map((p) => (
              <div
                key={p.id}
                className="rounded-3xl p-6 bg-white border border-gray-200 shadow-md hover:shadow-lg transition"
              >
                {/* FOTO */}
                <div className="h-40 w-full rounded-2xl bg-gray-100 flex items-center justify-center overflow-hidden mb-4">
                  {p.foto_url ? (
                    <img
                      src={p.foto_url}
                      alt={p.direccion}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Home className="h-10 w-10 text-gray-400" />
                  )}
                </div>

                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-lg text-gray-900">{p.direccion}</h3>
                  <Badge variant={p.disponible ? "default" : "secondary"}>
                    {p.disponible ? "Disponible" : "Rentada"}
                  </Badge>
                </div>

                <p className="text-2xl font-bold text-blue-600 mb-4">
                  {formatCurrency(p.precio)}
                </p>

                <div className="flex justify-between">
                  <Button size="sm" variant="outline" onClick={() => abrirModal(p)}>
                    <Edit className="h-4 w-4" />
                  </Button>

                  <Button size="sm" variant="destructive" onClick={() => eliminarPropiedad(p.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {propiedadesFiltradas.length === 0 && (
              <p className="text-gray-500 text-center w-full py-6">
                No se encontraron propiedades.
              </p>
            )}
          </div>
        </div>

        {/* MODAL */}
        <ModalForm
          title={editando ? "Editar Propiedad" : "Nueva Propiedad"}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        >
          <div className="space-y-4">

            <div>
              <label className="block text-sm font-semibold mb-1">Dirección</label>
              <Input
                value={form.direccion}
                onChange={(e) => setForm({ ...form, direccion: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Precio (ARS)</label>
              <Input
                type="number"
                value={form.precio}
                onChange={(e) => setForm({ ...form, precio: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">URL de Foto</label>
              <Input
                value={form.foto_url}
                onChange={(e) => setForm({ ...form, foto_url: e.target.value })}
                placeholder="https://ejemplo.com/imagen.jpg"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.disponible}
                onChange={(e) => setForm({ ...form, disponible: e.target.checked })}
              />
              <span className="text-sm">Disponible</span>
            </div>

            <Button onClick={guardarPropiedad} className="w-full">
              {editando ? "Guardar Cambios" : "Agregar Propiedad"}
            </Button>
          </div>
        </ModalForm>

      </DashboardLayout>
    </AuthGuard>
  );
}
