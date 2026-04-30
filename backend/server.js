const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Backend Reservasi Meja berjalan",
  });
});

app.get("/meja", (req, res) => {
  const sql = "SELECT * FROM meja";

  db.query(sql, (err, result) => {
    if (err) {
      return res.status(500).json({
        message: "Gagal mengambil data meja",
        error: err.message,
      });
    }

    res.json(result);
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
