"use client";

import { useEffect, useState } from "react";

import { Badge } from "../components/Badge";
import DashboardLayout from "../layouts/DashboardLayout";
import AuthGuard from "../components/AuthGuard";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "../components/Button";
import { Plus, Edit, Trash2 } from "lucide-react";
import ModalForm from "../components/ModalForm";
import { Input } from "../components/Input";

type Pago = {
  id: number;
  cliente: string;
  propiedad: string;
  monto: number;
  estado: "pagado" | "pendiente" | "vencido";
  fechaVencimiento: string | null;
  fechaPago: string | null;
};

type Cliente = {
  id: number;
  nombre: string;
};

type Propiedad = {
  id: number;
  direccion: string;
};

import { API_URL } from "../config";


export default function Pagos() {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [propiedades, setPropiedades] = useState<Propiedad[]>([]);
  const [filtro, setFiltro] = useState<
    "todos" | "pagado" | "pendiente" | "vencido"
  >("todos");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editando, setEditando] = useState<Pago | null>(null);
  const [form, setForm] = useState({
    cliente: "",
    propiedad: "",
    monto: "",
    estado: "pendiente" as Pago["estado"],
    fechaVencimiento: "",
    fechaPago: "",
  });

  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [mostrarQR, setMostrarQR] = useState(false);

  // ==========================================
  // 🔹 Cargar pagos, clientes y propiedades
  // ==========================================
  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/pagos`).then((res) => res.json()),
      fetch(`${API_URL}/clientes`).then((res) => res.json()),
      fetch(`${API_URL}/propiedades`).then((res) => res.json()),
    ])
      .then(([pagosData, clientesData, propiedadesData]) => {
        const pagosNormalizados = pagosData.map((p: any) => ({
          ...p,
          fechaVencimiento: p.fechavencimiento || null,
          fechaPago: p.fechapago || null,
        }));

        setPagos(pagosNormalizados);
        setClientes(clientesData);
        setPropiedades(propiedadesData);
      })
      .catch((err) => console.error("❌ Error cargando datos:", err));
  }, []);

  const formatCurrency = (valor: number) =>
    valor.toLocaleString("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    });

  const getBadgeVariant = (estado: string) => {
    switch (estado) {
      case "pagado":
        return "default";
      case "pendiente":
        return "secondary";
      case "vencido":
        return "destructive";
      default:
        return "outline";
    }
  };

  const pagosFiltrados =
    filtro === "todos" ? pagos : pagos.filter((p) => p.estado === filtro);

  // ==========================================
  //   🧱 Abrir modal edición/creación
  // ==========================================
  const abrirModal = (pago?: Pago) => {
    if (pago) {
      setEditando(pago);
      setForm({
        cliente: pago.cliente,
        propiedad: pago.propiedad,
        monto: pago.monto.toString(),
        estado: pago.estado,
        fechaVencimiento: pago.fechaVencimiento
          ? pago.fechaVencimiento.substring(0, 10)
          : "",
        fechaPago: pago.fechaPago ? pago.fechaPago.substring(0, 10) : "",
      });
    } else {
      setEditando(null);
      setForm({
        cliente: "",
        propiedad: "",
        monto: "",
        estado: "pendiente",
        fechaVencimiento: "",
        fechaPago: "",
      });
    }
    setIsModalOpen(true);
  };

  // ==========================================
  //  💳 Generar QR Mercado Pago
  // ==========================================
  const mostrarQRMercadoPago = async (pago: Pago) => {
    try {
      const res = await fetch(`${API_URL}/mercadopago/crear-qr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: `Pago de ${pago.propiedad}`,
          monto: pago.monto,
          cliente: pago.cliente,
          idPago: pago.id,
        }),
      });

      const data = await res.json();

      if (data.qr_url) {
        setQrUrl(data.qr_url);
        setMostrarQR(true);
      }
    } catch (error) {
      console.error("❌ Error generando QR:", error);
    }
  };

  // ==========================================
  //  💾 Guardar pago
  // ==========================================
  const guardarPago = async () => {
    if (
      !form.cliente ||
      !form.propiedad ||
      !form.monto ||
      !form.fechaVencimiento
    )
      return alert("Completa todos los campos obligatorios.");

    try {
      const method = editando ? "PUT" : "POST";
      const url = editando
        ? `${API_URL}/pagos/${editando.id}`
        : `${API_URL}/pagos`;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente: form.cliente,
          propiedad: form.propiedad,
          monto: parseFloat(form.monto),
          estado: form.estado,
          fechaVencimiento: form.fechaVencimiento,
          fechaPago: form.fechaPago || null,
        }),
      });

      if (!res.ok) throw new Error("Error al guardar pago");

      const data = await res.json();

      if (editando) {
        setPagos((prev) => prev.map((p) => (p.id === data.id ? data : p)));
      } else {
        setPagos((prev) => [...prev, data]);
      }

      setIsModalOpen(false);
    } catch (error) {
      console.error("❌ Error guardando pago:", error);
    }
  };

  // ==========================================
  //  ❌ Eliminar pago
  // ==========================================
  const eliminarPago = async (id: number) => {
    if (!confirm("¿Eliminar este pago?")) return;

    try {
      const res = await fetch(`${API_URL}/pagos/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error();

      setPagos((prev) => prev.filter((p) => p.id !== id));
    } catch (error) {
      console.error("❌ Error eliminando pago:", error);
    }
  };

  // ==================================================
  //                     UI
  // ==================================================
  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-10 p-4 md:p-6">

          {/* HERO */}
          <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white p-10 rounded-3xl shadow-xl">
            <h1 className="text-4xl font-bold mb-2">Gestión de Pagos</h1>
            <p className="text-white/80 text-lg">
              Controlá pagos pendientes, abonados y vencidos.
            </p>
          </div>

          {/* FILTROS */}
          <div className="flex gap-4 flex-wrap justify-end">
            {["todos", "pagado", "pendiente", "vencido"].map((estado) => (
              <Button
                key={estado}
                variant={filtro === estado ? "default" : "outline"}
                onClick={() => setFiltro(estado as any)}
              >
                {estado === "todos"
                  ? "Todos"
                  : estado.charAt(0).toUpperCase() + estado.slice(1)}
              </Button>
            ))}

            <Button
              onClick={() => abrirModal()}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" /> Nuevo Pago
            </Button>
          </div>

          {/* TABLA */}
          <div className="rounded-3xl overflow-hidden shadow-xl border border-gray-200 backdrop-blur-xl bg-white/70">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left">Cliente</th>
                  <th className="px-6 py-3 text-left">Propiedad</th>
                  <th className="px-6 py-3 text-left">Monto</th>
                  <th className="px-6 py-3 text-left">Estado</th>
                  <th className="px-6 py-3 text-left">Vencimiento</th>
                  <th className="px-6 py-3 text-left">Pago</th>
                  <th className="px-6 py-3 text-left">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {pagosFiltrados.map((pago) => (
                  <tr
                    key={pago.id}
                    className="border-t border-gray-200 hover:bg-gray-50 transition"
                  >
                    <td className="px-6 py-4 font-semibold">{pago.cliente}</td>
                    <td className="px-6 py-4">{pago.propiedad}</td>
                    <td className="px-6 py-4 font-bold text-green-600">
                      {formatCurrency(pago.monto)}
                    </td>

                    <td className="px-6 py-4">
                      <Badge variant={getBadgeVariant(pago.estado)}>
                        {pago.estado}
                      </Badge>
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {pago.fechaVencimiento
                        ? format(
                            new Date(pago.fechaVencimiento),
                            "dd/MM/yyyy",
                            { locale: es }
                          )
                        : "—"}
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {pago.fechaPago
                        ? format(new Date(pago.fechaPago), "dd/MM/yyyy", {
                            locale: es,
                          })
                        : "—"}
                    </td>

                    <td className="px-6 py-4 flex gap-2">
                      {pago.estado === "pendiente" && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => mostrarQRMercadoPago(pago)}
                        >
                          🧾 QR
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => abrirModal(pago)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => eliminarPago(pago.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}

                {pagosFiltrados.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="text-center py-8 text-gray-500"
                    >
                      No hay pagos en esta categoría.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* MODAL DE FORMULARIO */}
          <ModalForm
            title={editando ? "Editar Pago" : "Nuevo Pago"}
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
          >
            <div className="space-y-4">
              {/* Cliente */}
              <div>
                <label className="block text-sm font-medium mb-1">Cliente</label>
                <select
                  value={form.cliente}
                  onChange={(e) => setForm({ ...form, cliente: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white"
                >
                  <option value="">Seleccionar cliente...</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.nombre}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Propiedad */}
              <div>
                <label className="block text-sm font-medium mb-1">Propiedad</label>
                <select
                  value={form.propiedad}
                  onChange={(e) =>
                    setForm({ ...form, propiedad: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white"
                >
                  <option value="">Seleccionar propiedad...</option>
                  {propiedades.map((p) => (
                    <option key={p.id} value={p.direccion}>
                      {p.direccion}
                    </option>
                  ))}
                </select>
              </div>

              {/* Monto */}
              <div>
                <label className="block text-sm font-medium mb-1">Monto (ARS)</label>
                <Input
                  type="number"
                  value={form.monto}
                  onChange={(e) => setForm({ ...form, monto: e.target.value })}
                  placeholder="Ej: 150000"
                />
              </div>

              {/* Estado */}
              <div>
                <label className="block text-sm font-medium mb-1">Estado</label>
                <select
                  value={form.estado}
                  onChange={(e) =>
                    setForm({ ...form, estado: e.target.value as Pago["estado"] })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white"
                >
                  <option value="pagado">Pagado</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="vencido">Vencido</option>
                </select>
              </div>

              {/* Fecha de Vencimiento */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Fecha de Vencimiento
                </label>
                <Input
                  type="date"
                  value={form.fechaVencimiento}
                  onChange={(e) =>
                    setForm({ ...form, fechaVencimiento: e.target.value })
                  }
                />
              </div>

              {/* Fecha de Pago */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Fecha de Pago (opcional)
                </label>
                <Input
                  type="date"
                  value={form.fechaPago}
                  onChange={(e) =>
                    setForm({ ...form, fechaPago: e.target.value })
                  }
                />
              </div>

              {/* BOTÓN GUARDAR */}
              <Button onClick={guardarPago} className="w-full mt-4">
                {editando ? "Guardar Cambios" : "Agregar Pago"}
              </Button>
            </div>
          </ModalForm>

          {/* MODAL DE QR DE MERCADO PAGO */}
          {mostrarQR && qrUrl && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-sm w-full text-center">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">
                  Escaneá para pagar
                </h2>

                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
                    qrUrl
                  )}`}
                  className="mx-auto rounded-lg shadow-md"
                />

                <p className="mt-3 text-sm text-gray-600">
                  Usá tu app de Mercado Pago para completar el pago.
                </p>

                <Button
                  onClick={() => setMostrarQR(false)}
                  variant="outline"
                  className="w-full mt-6"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          )}

        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
