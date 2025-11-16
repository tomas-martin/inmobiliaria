"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  DollarSign,
  Users,
  AlertCircle,
  Home,
  TrendingUp,
} from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import AuthGuard from "../components/AuthGuard";
import { Badge } from "../components/Badge";

import { API_URL } from "../config";


const formatCurrency = (value: number) =>
  value.toLocaleString("es-AR", { style: "currency", currency: "ARS" });

export default function Dashboard() {
  const user = { name: "Administrador" };

  const [clientes, setClientes] = useState<any[]>([]);
  const [propiedades, setPropiedades] = useState<any[]>([]);
  const [pagos, setPagos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  Promise.all([
    fetch(`${API_URL}/clientes`).then((res) => res.json()),
    fetch(`${API_URL}/propiedades`).then((res) => res.json()),
    fetch(`${API_URL}/pagos`)
      .then((res) => res.json())
      .then((pagosData) =>
        pagosData.map((p: any) => ({
          ...p,
          monto: Number(p.monto),          // ← FIX ACÁ
        }))
      ),
  ])
    .then(([clientesData, propiedadesData, pagosData]) => {
      setClientes(clientesData);
      setPropiedades(propiedadesData);
      setPagos(pagosData);
    })
    .finally(() => setLoading(false));
}, []);


  const totalProperties = propiedades.length;
  const rentedProperties = propiedades.filter((p) => !p.disponible).length;
  const availableProperties = propiedades.filter((p) => p.disponible).length;

  const totalIncome = pagos
    .filter((p) => p.estado === "pagado")
    .reduce((sum, p) => sum + (p.monto || 0), 0);

  const pendingPayments = pagos.filter((p) => p.estado === "pendiente").length;
  const totalClients = clientes.length;

  const recentProperties = propiedades.slice(-3).reverse();
  const recentPayments = pagos.slice(-3).reverse();

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96 text-gray-500 animate-pulse">
          Cargando datos...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-10 p-4 md:p-6">

          {/* 🌈 HERO */}
          <div className="bg-gradient-to-r from-sky-600 via-blue-600 to-teal-500 text-white rounded-3xl p-10 shadow-xl">
            <h1 className="text-4xl font-bold mb-2">Panel General</h1>
            <p className="text-white/80 text-lg">
              Hola {user.name}, aquí tienes una vista general del sistema.
            </p>
          </div>

          {/* 📊 TARJETAS */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">

            {/* CARD BASE (estilo claro) */}
            {[
              {
                title: "Propiedades",
                value: totalProperties,
                icon: <Building2 className="text-gray-400" />,
                subtitle: `${rentedProperties} rentadas • ${availableProperties} disponibles`,
              },
              {
                title: "Ingresos Totales",
                value: formatCurrency(totalIncome),
                icon: <DollarSign className="text-gray-400" />,
                subtitle: "Pagos completados",
              },
              {
                title: "Clientes",
                value: totalClients,
                icon: <Users className="text-gray-400" />,
                subtitle: "Registrados",
              },
              {
                title: "Pagos Pendientes",
                value: pendingPayments,
                icon: <AlertCircle className="text-gray-400" />,
                subtitle: "Requieren acción",
              },
            ].map((card, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-2xl border border-gray-200 shadow-md"
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="font-semibold text-gray-700">{card.title}</span>
                  {card.icon}
                </div>

                <p className="text-4xl font-bold text-gray-900">{card.value}</p>
                <p className="text-gray-500 mt-2 text-sm">{card.subtitle}</p>
              </div>
            ))}
          </div>

          {/* 📁 SECCIONES SECUNDARIAS */}
          <div className="grid gap-8 lg:grid-cols-2">

            {/* 🏠 Propiedades recientes */}
<div className="rounded-3xl p-6 bg-white shadow-lg border border-gray-200">
  <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
    <Home className="text-blue-600" /> Propiedades Recientes
  </h2>

  {recentProperties.length === 0 ? (
    <p className="text-gray-500 text-center py-6">No hay propiedades cargadas</p>
  ) : (
    <div className="space-y-5">
      {recentProperties.map((p) => (
        <div key={p.id} className="flex items-start gap-4 border-b pb-4">

          {/* FOTO con fallback */}
          <div className="h-16 w-20 rounded-xl bg-gray-100 overflow-hidden flex items-center justify-center">
            {p.foto_url ? (
              <img
                src={p.foto_url}
                alt={p.direccion}
                className="w-full h-full object-cover"
              />
            ) : (
              <Building2 className="text-gray-400 h-8 w-8" />
            )}
          </div>

          {/* DATOS */}
          <div className="flex-1">
            <p className="font-semibold text-gray-900">{p.direccion}</p>

            <div className="flex items-center gap-2 mt-1">
              <Badge variant={p.disponible ? "secondary" : "default"}>
                {p.disponible ? "Disponible" : "Rentada"}
              </Badge>

              <span className="font-bold text-blue-600">
                {formatCurrency(p.precio)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )}
</div>


            {/* 💸 Pagos recientes */}
            <div className="rounded-3xl p-6 bg-white shadow-lg border border-gray-200">
              <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                <TrendingUp className="text-green-600" /> Pagos Recientes
              </h2>

              {recentPayments.length === 0 ? (
                <p className="text-gray-500 text-center py-6">No hay pagos cargados</p>
              ) : (
                <div className="space-y-5">
                  {recentPayments.map((pago) => (
                    <div key={pago.id} className="flex justify-between border-b pb-4">
                      <div>
                        <p className="font-semibold text-gray-900">{pago.cliente}</p>
                        <p className="text-gray-500 text-sm">{pago.propiedad}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Vence: {new Date(pago.fechaVencimiento).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-bold text-green-600">
                          {formatCurrency(pago.monto)}
                        </p>

                        <Badge
                          variant={
                            pago.estado === "pagado"
                              ? "default"
                              : pago.estado === "pendiente"
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {pago.estado}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
