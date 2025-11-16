import express from "express";
import cors from "cors";
import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();
const { Pool } = pkg;

// 🟢 Conexión a PostgreSQL (Railway)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const app = express();
const PORT = process.env.PORT || 3000;

// 🔥 CORS ACTUALIZADO CON MANEJO COMPLETO
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      'https://inmobiliaria-uufh.vercel.app',
      'http://localhost:5173'
    ];
    
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Headers CORS adicionales
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://inmobiliaria-uufh.vercel.app');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

app.use(express.json());

// --- ENDPOINT DE PRUEBA ---
app.get("/", (req, res) => {
  res.send("✅ API conectada y funcionando correctamente");
});

// ===========================
// 🔹 CLIENTES
// ===========================

// 🟢 GET todos
app.get("/clientes", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM clientes ORDER BY id ASC");
    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error obteniendo clientes:", error);
    res.status(500).json({ error: "Error al obtener clientes" });
  }
});

// 🟡 POST nuevo
app.post("/clientes", async (req, res) => {
  try {
    const { nombre, email, telefono, propiedades, estado } = req.body;
    const result = await pool.query(
      "INSERT INTO clientes (nombre, email, telefono, propiedades, estado) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [nombre, email, telefono, propiedades, estado]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error("❌ Error creando cliente:", error);
    res.status(500).json({ error: "Error creando cliente" });
  }
});

// 🔵 PUT editar
app.put("/clientes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, telefono, propiedades, estado } = req.body;

    const check = await pool.query("SELECT id FROM clientes WHERE id = $1", [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: "Cliente no encontrado en la base de datos" });
    }

    const result = await pool.query(
      `UPDATE clientes
       SET nombre = $1, email = $2, telefono = $3, propiedades = $4, estado = $5
       WHERE id = $6
       RETURNING *`,
      [nombre, email, telefono, propiedades, estado, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("❌ Error actualizando cliente:", error);
    res.status(500).json({
      error: "Error interno al actualizar el cliente",
      details: (error as Error).message,
    });
  }
});

// 🔴 DELETE eliminar
app.delete("/clientes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM clientes WHERE id=$1", [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }
    res.json({ message: "Cliente eliminado correctamente" });
  } catch (error) {
    console.error("❌ Error eliminando cliente:", error);
    res.status(500).json({ error: "Error eliminando cliente" });
  }
});

// ===========================
// 🔹 PROPIEDADES
// ===========================
app.get("/propiedades", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM propiedades ORDER BY id ASC");
    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error obteniendo propiedades:", error);
    res.status(500).json({ error: "Error al obtener propiedades" });
  }
});

app.post("/propiedades", async (req, res) => {
  try {
    const { direccion, precio, disponible, foto_url } = req.body;

    const result = await pool.query(
      `INSERT INTO propiedades (direccion, precio, disponible, foto_url)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [direccion, precio, disponible, foto_url || null]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("❌ Error creando propiedad:", error);
    res.status(500).json({ error: "Error creando propiedad" });
  }
});

app.put("/propiedades/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { direccion, precio, disponible, foto_url } = req.body;

    const result = await pool.query(
      `UPDATE propiedades
       SET direccion=$1, precio=$2, disponible=$3, foto_url=$4
       WHERE id=$5
       RETURNING *`,
      [direccion, precio, disponible, foto_url || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Propiedad no encontrada" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("❌ Error actualizando propiedad:", error);
    res.status(500).json({ error: "Error actualizando propiedad" });
  }
});

app.delete("/propiedades/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM propiedades WHERE id=$1", [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Propiedad no encontrada" });
    }
    res.json({ message: "Propiedad eliminada correctamente" });
  } catch (error) {
    console.error("❌ Error eliminando propiedad:", error);
    res.status(500).json({ error: "Error eliminando propiedad" });
  }
});

// ===========================
// 🔹 PAGOS
// ===========================
app.get("/pagos", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM pagos ORDER BY id ASC");

    const data = result.rows.map((p) => ({
      ...p,
      fechaVencimiento: p.fecha_vencimiento,
      fechaPago: p.fecha_pago,
    }));

    res.json(data);
  } catch (error) {
    console.error("❌ Error obteniendo pagos:", error);
    res.status(500).json({ error: "Error al obtener pagos" });
  }
});

app.post("/pagos", async (req, res) => {
  try {
    const { cliente, propiedad, monto, estado, fechaVencimiento, fechaPago } = req.body;
    const result = await pool.query(
      `INSERT INTO pagos (cliente, propiedad, monto, estado, fechavencimiento, fechapago)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [cliente, propiedad, monto, estado, fechaVencimiento, fechaPago]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error("❌ Error creando pago:", error);
    res.status(500).json({ error: "Error creando pago" });
  }
});

app.put("/pagos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { cliente, propiedad, monto, estado, fechaVencimiento, fechaPago } = req.body;
    const result = await pool.query(
      `UPDATE pagos
       SET cliente=$1, propiedad=$2, monto=$3, estado=$4, fechavencimiento=$5, fechapago=$6
       WHERE id=$7 RETURNING *`,
      [cliente, propiedad, monto, estado, fechaVencimiento, fechaPago, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Pago no encontrado" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("❌ Error actualizando pago:", error);
    res.status(500).json({ error: "Error actualizando pago" });
  }
});

app.delete("/pagos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM pagos WHERE id=$1", [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Pago no encontrado" });
    }
    res.json({ message: "Pago eliminado correctamente" });
  } catch (error) {
    console.error("❌ Error eliminando pago:", error);
    res.status(500).json({ error: "Error eliminando pago" });
  }
});

// --- MERCADO PAGO QR / Checkout Presencial ---
import { MercadoPagoConfig, Preference } from "mercadopago";

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN || "APP_USR-2255742485215159-111210-54f049d9a08c41fe4cfcc8c31dacab14-2984639708",
});

app.post("/mercadopago/crear-qr", async (req, res) => {
  try {
    const { titulo, monto, cliente, idPago } = req.body;

    const preference = new Preference(client);

    const body = {
      items: [
        {
          id: idPago?.toString() || "1",
          title: titulo || `Pago de ${cliente}`,
          quantity: 1,
          unit_price: Number(monto),
          currency_id: "ARS",
        },
      ],
      payer: {
        name: cliente,
      },
      metadata: { idPago },
      back_urls: {
        success: "https://www.mercadopago.com.ar", 
        failure: "https://www.mercadopago.com.ar",
      },
      auto_return: "approved",
    };

    const result: any = await preference.create({ body });

    const qr_url =
      result.init_point ||
      result.sandbox_init_point ||
      result.body?.init_point ||
      "https://www.mercadopago.com.ar";

    res.json({ qr_url });
  } catch (error: any) {
    console.error("❌ Error creando QR de pago:", error);
    res.status(500).json({ error: error.message });
  }
});

// 🚀 Servidor en marcha
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en puerto ${PORT}`);
});