require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const pool = require("./db");

const app = express();

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json());

// Servera frontend (client-mappen)
app.use(express.static(path.join(__dirname, "..", "client")));

// Healthcheck
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// Skapa bokning
app.post("/api/bookings", async (req, res) => {
  const {
    room_type,
    guest_name,
    guest_email,
    guest_phone,
    start_date,
    end_date,
  } = req.body;

  if (!room_type || !guest_name || !guest_email || !start_date || !end_date) {
    return res.status(400).json({ error: "Saknar obligatoriska fält." });
  }
  if (new Date(end_date) < new Date(start_date)) {
    return res
      .status(400)
      .json({ error: "Slutdatum kan inte vara före startdatum." });
  }

  try {
    const [result] = await pool.execute(
      `INSERT INTO booking
       (room_type, guest_name, guest_email, guest_phone, start_date, end_date)
       VALUES (:room_type, :guest_name, :guest_email, :guest_phone, :start_date, :end_date)`,
      {
        room_type,
        guest_name,
        guest_email,
        guest_phone: guest_phone || null,
        start_date,
        end_date,
      }
    );

    return res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ error: "Databasfel vid skapande av bokning." });
  }
});

app.get("/api/bookings", async (_req, res) => {
  const [rows] = await pool.query("SELECT * FROM booking ORDER BY id DESC");
  res.json(rows);
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`Server igång på http://localhost:${port}`);
});
