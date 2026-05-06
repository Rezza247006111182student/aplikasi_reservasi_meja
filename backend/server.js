const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");
require("dotenv").config();

const db = require("./db");

const app = express();
const PORT = process.env.PORT || 5000;
const publicDir = path.join(__dirname, "public");
const uploadDir = path.join(publicDir, "uploads", "menus");

const allowedOrigins = [process.env.FRONTEND_URL, "http://localhost:3000"].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Origin tidak diizinkan oleh CORS"));
    },
  }),
);
app.use(express.json({ limit: "6mb" }));
app.use("/uploads", express.static(path.join(publicDir, "uploads")));

const asyncHandler = (handler) => async (req, res, next) => {
  try {
    await handler(req, res, next);
  } catch (error) {
    next(error);
  }
};

const ok = (res, data, message = "Berhasil") => res.json({ message, data });
const authSecret = process.env.AUTH_TOKEN_SECRET || "dev-reservasi-meja-secret";
const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxImageUploadSize = 2 * 1024 * 1024;

const base64UrlEncode = (value) =>
  Buffer.from(JSON.stringify(value)).toString("base64url");

const base64UrlDecode = (value) =>
  JSON.parse(Buffer.from(value, "base64url").toString("utf8"));

const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
};

const verifyPassword = (password, storedHash) => {
  const [algorithm, salt, hash] = String(storedHash || "").split(":");

  if (algorithm !== "scrypt" || !salt || !hash) return false;

  const candidate = crypto.scryptSync(password, salt, 64);
  const original = Buffer.from(hash, "hex");

  return original.length === candidate.length && crypto.timingSafeEqual(original, candidate);
};

const signToken = (user) => {
  const payload = {
    sub: user.id,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
  };
  const encodedPayload = base64UrlEncode(payload);
  const signature = crypto
    .createHmac("sha256", authSecret)
    .update(encodedPayload)
    .digest("base64url");

  return `${encodedPayload}.${signature}`;
};

const verifyToken = (token) => {
  const [encodedPayload, signature] = String(token || "").split(".");
  if (!encodedPayload || !signature) return null;

  const expectedSignature = crypto
    .createHmac("sha256", authSecret)
    .update(encodedPayload)
    .digest("base64url");

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  const payload = base64UrlDecode(encodedPayload);
  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;

  return payload;
};

const requireAuth = asyncHandler(async (req, res, next) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const payload = verifyToken(token);

  if (!payload) {
    return res.status(401).json({ message: "Token tidak valid atau sudah kedaluwarsa" });
  }

  const [rows] = await db.query(
    `SELECT id, name, email, phone, role, status, created_at, updated_at
     FROM users
     WHERE id = :id
     LIMIT 1`,
    { id: payload.sub },
  );

  if (!rows[0] || rows[0].status !== "active") {
    return res.status(401).json({ message: "User tidak aktif atau tidak ditemukan" });
  }

  req.user = rows[0];
  next();
});

const requireRole = (role) => (req, res, next) => {
  if (req.user?.role !== role) {
    return res.status(403).json({ message: "Akses tidak diizinkan" });
  }

  next();
};

const toUserResponse = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  status: user.status,
  createdAt: user.created_at,
  updatedAt: user.updated_at,
});

const toMenuResponse = (menu) => ({
  id: menu.id,
  name: menu.name,
  category: menu.category,
  price: menu.price,
  description: menu.description,
  imageUrl: menu.image_url,
  isFavorite: Boolean(menu.is_favorite),
  status: menu.status,
  createdAt: menu.created_at,
  updatedAt: menu.updated_at,
});

const toTableResponse = (table) => ({
  id: table.id,
  code: table.code,
  zoneId: table.zone_id,
  floor: table.floor,
  room: table.room,
  capacity: table.capacity,
  shape: table.shape,
  x: Number(table.x),
  y: Number(table.y),
  width: Number(table.width),
  height: Number(table.height),
  rotation: Number(table.rotation || 0),
  status: table.status,
  createdAt: table.created_at,
  updatedAt: table.updated_at,
});

const toReservationResponse = (reservation) => ({
  id: reservation.id,
  code: reservation.code,
  userId: reservation.user_id,
  tableId: reservation.table_id,
  customerName: reservation.customer_name,
  customerPhone: reservation.customer_phone,
  tableCode: reservation.table_code,
  floor: reservation.floor,
  room: reservation.room,
  reservationDate: reservation.reservation_date,
  startTime: reservation.start_time,
  endTime: reservation.end_time,
  guestCount: reservation.guest_count,
  note: reservation.note,
  status: reservation.status,
  createdAt: reservation.created_at,
  updatedAt: reservation.updated_at,
});

const generateReservationCode = () => {
  const now = new Date();
  const date = [
    now.getFullYear().toString().slice(2),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `RSV-${date}-${random}`;
};

const sanitizeFileName = (value) =>
  String(value || "menu")
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "menu";

const ensureRoomLayoutsTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS room_layouts (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      zone_id BIGINT NOT NULL UNIQUE,
      has_cashier BOOLEAN NOT NULL DEFAULT FALSE,
      cashier_x DECIMAL(10,2) NOT NULL DEFAULT 330,
      cashier_y DECIMAL(10,2) NOT NULL DEFAULT 260,
      cashier_width DECIMAL(10,2) NOT NULL DEFAULT 64,
      cashier_height DECIMAL(10,2) NOT NULL DEFAULT 42,
      cashier_rotation DECIMAL(10,2) NOT NULL DEFAULT 0,
      door_x DECIMAL(10,2) NOT NULL DEFAULT 54,
      door_y DECIMAL(10,2) NOT NULL DEFAULT 48,
      door_width DECIMAL(10,2) NOT NULL DEFAULT 62,
      door_height DECIMAL(10,2) NOT NULL DEFAULT 54,
      door_rotation DECIMAL(10,2) NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_room_layouts_zone FOREIGN KEY (zone_id) REFERENCES zones(id)
    )
  `);

  const [columns] = await db.query(`SHOW COLUMNS FROM room_layouts`);
  const existingColumns = new Set(columns.map((column) => column.Field));
  const columnsToAdd = [
    ["cashier_width", "DECIMAL(10,2) NOT NULL DEFAULT 64"],
    ["cashier_height", "DECIMAL(10,2) NOT NULL DEFAULT 42"],
    ["cashier_rotation", "DECIMAL(10,2) NOT NULL DEFAULT 0"],
    ["door_width", "DECIMAL(10,2) NOT NULL DEFAULT 62"],
    ["door_height", "DECIMAL(10,2) NOT NULL DEFAULT 54"],
    ["door_rotation", "DECIMAL(10,2) NOT NULL DEFAULT 0"],
  ];

  for (const [columnName, definition] of columnsToAdd) {
    if (!existingColumns.has(columnName)) {
      await db.query(`ALTER TABLE room_layouts ADD COLUMN ${columnName} ${definition}`);
    }
  }
};

const toRoomLayoutResponse = (layout) => ({
  id: layout.id,
  zoneId: layout.zone_id,
  hasCashier: Boolean(layout.has_cashier),
  cashierX: Number(layout.cashier_x),
  cashierY: Number(layout.cashier_y),
  cashierWidth: Number(layout.cashier_width ?? 64),
  cashierHeight: Number(layout.cashier_height ?? 42),
  cashierRotation: Number(layout.cashier_rotation ?? 0),
  doorX: Number(layout.door_x),
  doorY: Number(layout.door_y),
  doorWidth: Number(layout.door_width ?? 62),
  doorHeight: Number(layout.door_height ?? 54),
  doorRotation: Number(layout.door_rotation ?? 0),
  createdAt: layout.created_at,
  updatedAt: layout.updated_at,
});

app.get("/", (req, res) => {
  res.json({
    message: "Backend Reservasi Meja berjalan",
    database: "TiDB Cloud Serverless",
  });
});

app.get(
  "/health",
  asyncHandler(async (req, res) => {
    const [rows] = await db.query("SELECT 1 AS ok");
    res.json({
      message: "Backend dan database aktif",
      database: rows[0].ok === 1 ? "connected" : "unknown",
    });
  }),
);

app.post(
  "/api/auth/register",
  asyncHandler(async (req, res) => {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: "Nama, email, telepon, dan password wajib diisi" });
    }

    if (String(password).length < 8) {
      return res.status(400).json({ message: "Password minimal 8 karakter" });
    }

    const [existingUsers] = await db.query(
      `SELECT id FROM users WHERE email = :email LIMIT 1`,
      { email },
    );

    if (existingUsers.length) {
      return res.status(409).json({ message: "Email sudah terdaftar" });
    }

    const passwordHash = hashPassword(password);
    const [result] = await db.query(
      `INSERT INTO users (name, email, phone, password_hash, role, status)
       VALUES (:name, :email, :phone, :passwordHash, 'customer', 'active')`,
      { name, email, phone, passwordHash },
    );

    const user = {
      id: result.insertId,
      name,
      email,
      phone,
      role: "customer",
      status: "active",
    };

    ok(res, { user: toUserResponse(user), token: signToken(user) }, "Register berhasil");
  }),
);

app.post(
  "/api/auth/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email dan password wajib diisi" });
    }

    const [rows] = await db.query(
      `SELECT id, name, email, phone, password_hash, role, status, created_at, updated_at
       FROM users
       WHERE email = :email
       LIMIT 1`,
      { email },
    );

    const user = rows[0];

    const isLegacyDevPassword =
      user?.password_hash === "dummy_hash" && password === "password123";

    if (!user || (!verifyPassword(password, user.password_hash) && !isLegacyDevPassword)) {
      return res.status(401).json({ message: "Email atau password salah" });
    }

    if (user.status !== "active") {
      return res.status(403).json({ message: "Akun tidak aktif" });
    }

    if (isLegacyDevPassword) {
      await db.query(
        `UPDATE users SET password_hash = :passwordHash WHERE id = :id`,
        { id: user.id, passwordHash: hashPassword(password) },
      );
    }

    ok(res, { user: toUserResponse(user), token: signToken(user) }, "Login berhasil");
  }),
);

app.get(
  "/api/auth/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    ok(res, { user: toUserResponse(req.user) });
  }),
);

app.patch(
  "/api/users/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { name } = req.body;
    const cleanName = String(name || "").trim();

    if (cleanName.length < 2) {
      return res.status(400).json({ message: "Nama minimal 2 karakter" });
    }

    await db.query(
      `UPDATE users
       SET name = :name
       WHERE id = :id`,
      { id: req.user.id, name: cleanName },
    );

    const [rows] = await db.query(
      `SELECT id, name, email, phone, role, status, created_at, updated_at
       FROM users
       WHERE id = :id
       LIMIT 1`,
      { id: req.user.id },
    );

    ok(res, { user: toUserResponse(rows[0]) }, "Profil berhasil diperbarui");
  }),
);

app.get(
  "/api/zones",
  asyncHandler(async (req, res) => {
    const { floor, status } = req.query;
    const filters = [];
    const params = {};

    if (floor) {
      filters.push("floor = :floor");
      params.floor = floor;
    }

    if (status) {
      filters.push("status = :status");
      params.status = status;
    }

    const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
    const [rows] = await db.query(
      `SELECT * FROM zones ${where} ORDER BY floor ASC, room ASC`,
      params,
    );

    ok(res, rows);
  }),
);

app.use("/api/admin", requireAuth, requireRole("admin"));

app.post(
  "/api/admin/zones",
  asyncHandler(async (req, res) => {
    const { code, floor, room, type, capacity = 0, status = "active" } = req.body;

    if (!code || !floor || !room || !type) {
      return res.status(400).json({ message: "code, floor, room, dan type wajib diisi" });
    }

    const [result] = await db.query(
      `INSERT INTO zones (code, floor, room, type, capacity, status)
       VALUES (:code, :floor, :room, :type, :capacity, :status)`,
      { code, floor, room, type, capacity, status },
    );

    ok(res, { id: result.insertId }, "Zona berhasil dibuat");
  }),
);

app.patch(
  "/api/admin/zones/:id",
  asyncHandler(async (req, res) => {
    const { code, floor, room, type, capacity, status } = req.body;

    await db.query(
      `UPDATE zones
       SET code = COALESCE(:code, code),
           floor = COALESCE(:floor, floor),
           room = COALESCE(:room, room),
           type = COALESCE(:type, type),
           capacity = COALESCE(:capacity, capacity),
           status = COALESCE(:status, status)
       WHERE id = :id`,
      { id: req.params.id, code, floor, room, type, capacity, status },
    );

    ok(res, { id: Number(req.params.id) }, "Zona berhasil diperbarui");
  }),
);

app.get(
  "/api/tables",
  asyncHandler(async (req, res) => {
    const { floor, room, status, startTime, endTime, guestCount } = req.query;
    const filters = [];
    const params = {};

    if (floor && floor !== "all") {
      filters.push("t.floor = :floor");
      params.floor = floor;
    }

    if (room && room !== "all") {
      filters.push("t.room = :room");
      params.room = room;
    }

    if (status && status !== "all") {
      filters.push("t.status = :status");
      params.status = status;
    }

    const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
    const [rows] = await db.query(
      `SELECT t.*, z.code AS zone_code, z.type AS zone_type
       FROM \`tables\` t
       LEFT JOIN zones z ON z.id = t.zone_id
       ${where}
       ORDER BY t.floor ASC, t.room ASC, t.code ASC`,
      params,
    );

    if (startTime && endTime) {
      const [reservationRows] = await db.query(
        `SELECT table_id, start_time, end_time, status
         FROM reservations
         WHERE status IN ('pending', 'confirmed')
           AND start_time < :endTime
           AND end_time > :startTime`,
        { startTime, endTime },
      );
      const conflictsByTable = new Map();
      const now = Date.now();

      reservationRows.forEach((reservation) => {
        const current = conflictsByTable.get(Number(reservation.table_id));
        if (!current || new Date(reservation.start_time) < new Date(current.start_time)) {
          conflictsByTable.set(Number(reservation.table_id), reservation);
        }
      });

      ok(
        res,
        rows.map((table) => {
          const response = toTableResponse(table);
          const conflict = conflictsByTable.get(Number(table.id));

          if (response.status === "inactive") return response;

          if (guestCount && Number(response.capacity) < Number(guestCount)) {
            return { ...response, status: "unavailable", unavailableReason: "capacity" };
          }

          if (!conflict) return { ...response, status: "available" };

          const conflictStart = new Date(conflict.start_time).getTime();
          const conflictEnd = new Date(conflict.end_time).getTime();
          const isInUse = now >= conflictStart && now <= conflictEnd;

          return { ...response, status: isInUse ? "booked" : "reserved" };
        }),
      );
      return;
    }

    ok(res, rows.map(toTableResponse));
  }),
);

app.get(
  "/api/room-layouts",
  asyncHandler(async (req, res) => {
    await ensureRoomLayoutsTable();

    const [rows] = await db.query(
      `SELECT * FROM room_layouts ORDER BY zone_id ASC`,
    );

    ok(res, rows.map(toRoomLayoutResponse));
  }),
);

app.post(
  "/api/admin/tables",
  asyncHandler(async (req, res) => {
    const {
      code,
      zoneId,
      floor,
      room,
      capacity,
      shape = "round",
      x,
      y,
      width,
      height,
      rotation = 0,
      status = "available",
    } = req.body;

    if (!code || !zoneId || !floor || !room || !capacity || x == null || y == null || !width || !height) {
      return res.status(400).json({
        message: "code, zoneId, floor, room, capacity, x, y, width, dan height wajib diisi",
      });
    }

    const [result] = await db.query(
      `INSERT INTO \`tables\`
       (code, zone_id, floor, room, capacity, shape, x, y, width, height, rotation, status)
       VALUES
       (:code, :zoneId, :floor, :room, :capacity, :shape, :x, :y, :width, :height, :rotation, :status)`,
      { code, zoneId, floor, room, capacity, shape, x, y, width, height, rotation, status },
    );

    ok(res, { id: result.insertId }, "Meja berhasil dibuat");
  }),
);

app.patch(
  "/api/admin/room-layouts/:zoneId",
  asyncHandler(async (req, res) => {
    await ensureRoomLayoutsTable();

    const {
      hasCashier = false,
      cashierX = 330,
      cashierY = 260,
      cashierWidth = 64,
      cashierHeight = 42,
      cashierRotation = 0,
      doorX = 54,
      doorY = 48,
      doorWidth = 62,
      doorHeight = 54,
      doorRotation = 0,
    } = req.body;

    await db.query(
      `INSERT INTO room_layouts
       (zone_id, has_cashier, cashier_x, cashier_y, cashier_width, cashier_height, cashier_rotation, door_x, door_y, door_width, door_height, door_rotation)
       VALUES (:zoneId, :hasCashier, :cashierX, :cashierY, :cashierWidth, :cashierHeight, :cashierRotation, :doorX, :doorY, :doorWidth, :doorHeight, :doorRotation)
       ON DUPLICATE KEY UPDATE
         has_cashier = VALUES(has_cashier),
         cashier_x = VALUES(cashier_x),
         cashier_y = VALUES(cashier_y),
         cashier_width = VALUES(cashier_width),
         cashier_height = VALUES(cashier_height),
         cashier_rotation = VALUES(cashier_rotation),
         door_x = VALUES(door_x),
         door_y = VALUES(door_y),
         door_width = VALUES(door_width),
         door_height = VALUES(door_height),
         door_rotation = VALUES(door_rotation)`,
      {
        zoneId: req.params.zoneId,
        hasCashier,
        cashierX,
        cashierY,
        cashierWidth,
        cashierHeight,
        cashierRotation,
        doorX,
        doorY,
        doorWidth,
        doorHeight,
        doorRotation,
      },
    );

    const [rows] = await db.query(
      `SELECT * FROM room_layouts WHERE zone_id = :zoneId LIMIT 1`,
      { zoneId: req.params.zoneId },
    );

    ok(res, toRoomLayoutResponse(rows[0]), "Layout ruangan berhasil diperbarui");
  }),
);

app.patch(
  "/api/admin/tables/:id",
  asyncHandler(async (req, res) => {
    const {
      code,
      zoneId,
      floor,
      room,
      capacity,
      shape,
      x,
      y,
      width,
      height,
      rotation,
      status,
    } = req.body;

    await db.query(
      `UPDATE \`tables\`
       SET code = COALESCE(:code, code),
           zone_id = COALESCE(:zoneId, zone_id),
           floor = COALESCE(:floor, floor),
           room = COALESCE(:room, room),
           capacity = COALESCE(:capacity, capacity),
           shape = COALESCE(:shape, shape),
           x = COALESCE(:x, x),
           y = COALESCE(:y, y),
           width = COALESCE(:width, width),
           height = COALESCE(:height, height),
           rotation = COALESCE(:rotation, rotation),
           status = COALESCE(:status, status)
       WHERE id = :id`,
      {
        id: req.params.id,
        code,
        zoneId,
        floor,
        room,
        capacity,
        shape,
        x,
        y,
        width,
        height,
        rotation,
        status,
      },
    );

    ok(res, { id: Number(req.params.id) }, "Meja berhasil diperbarui");
  }),
);

app.get(
  "/api/menus",
  asyncHandler(async (req, res) => {
    const { category, status = "available", favorite } = req.query;
    const filters = [];
    const params = {};

    if (category) {
      filters.push("category = :category");
      params.category = category;
    }

    if (status && status !== "all") {
      filters.push("status = :status");
      params.status = status;
    }

    if (favorite === "true") {
      filters.push("is_favorite = TRUE");
    }

    const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
    const [rows] = await db.query(
      `SELECT * FROM menus ${where} ORDER BY is_favorite DESC, category ASC, name ASC`,
      params,
    );

    ok(res, rows.map(toMenuResponse));
  }),
);

app.post(
  "/api/admin/uploads/menu-image",
  asyncHandler(async (req, res) => {
    const { fileName, mimeType, dataUrl } = req.body;

    if (!fileName || !mimeType || !dataUrl) {
      return res.status(400).json({ message: "fileName, mimeType, dan dataUrl wajib diisi" });
    }

    if (!allowedImageTypes.has(mimeType)) {
      return res.status(400).json({ message: "Format gambar harus JPG, PNG, atau WEBP" });
    }

    const base64Data = String(dataUrl).replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    if (!buffer.length || buffer.length > maxImageUploadSize) {
      return res.status(400).json({ message: "Ukuran gambar maksimal 2MB" });
    }

    const extensionByType = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    };
    const safeName = sanitizeFileName(fileName);
    const extension = extensionByType[mimeType];
    const storedFileName = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}-${safeName}.${extension}`;

    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(path.join(uploadDir, storedFileName), buffer);

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    ok(
      res,
      { imageUrl: `${baseUrl}/uploads/menus/${storedFileName}` },
      "Foto hidangan berhasil diupload",
    );
  }),
);

app.post(
  "/api/admin/menus",
  asyncHandler(async (req, res) => {
    const {
      name,
      category,
      price,
      description,
      imageUrl = null,
      isFavorite = false,
      status = "available",
    } = req.body;

    if (!name || !category || price == null || !description) {
      return res.status(400).json({ message: "name, category, price, dan description wajib diisi" });
    }

    const [result] = await db.query(
      `INSERT INTO menus (name, category, price, description, image_url, is_favorite, status)
       VALUES (:name, :category, :price, :description, :imageUrl, :isFavorite, :status)`,
      { name, category, price, description, imageUrl, isFavorite, status },
    );

    ok(res, { id: result.insertId }, "Hidangan berhasil dibuat");
  }),
);

app.patch(
  "/api/admin/menus/:id",
  asyncHandler(async (req, res) => {
    const { name, category, price, description, imageUrl, isFavorite, status } = req.body;

    await db.query(
      `UPDATE menus
       SET name = COALESCE(:name, name),
           category = COALESCE(:category, category),
           price = COALESCE(:price, price),
           description = COALESCE(:description, description),
           image_url = COALESCE(:imageUrl, image_url),
           is_favorite = COALESCE(:isFavorite, is_favorite),
           status = COALESCE(:status, status)
       WHERE id = :id`,
      { id: req.params.id, name, category, price, description, imageUrl, isFavorite, status },
    );

    ok(res, { id: Number(req.params.id) }, "Hidangan berhasil diperbarui");
  }),
);

app.get(
  "/api/reservations/user/:userId",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (req.user.role !== "admin" && Number(req.params.userId) !== Number(req.user.id)) {
      return res.status(403).json({ message: "Tidak bisa mengakses riwayat user lain" });
    }

    const [rows] = await db.query(
      `SELECT *
       FROM reservations
       WHERE user_id = :userId
       ORDER BY start_time DESC`,
      { userId: req.params.userId },
    );

    ok(res, rows.map(toReservationResponse));
  }),
);

app.post(
  "/api/reservations",
  requireAuth,
  asyncHandler(async (req, res) => {
    const {
      tableId,
      customerName = req.user.name,
      customerPhone = req.user.phone,
      reservationDate,
      startTime,
      endTime,
      guestCount,
      note = null,
    } = req.body;

    const userId = req.user.id;

    if (!tableId || !customerName || !customerPhone || !reservationDate || !startTime || !endTime || !guestCount) {
      return res.status(400).json({
        message: "tableId, customerName, customerPhone, reservationDate, startTime, endTime, dan guestCount wajib diisi",
      });
    }

    if (new Date(startTime) >= new Date(endTime)) {
      return res.status(400).json({ message: "Waktu selesai harus lebih besar dari waktu mulai" });
    }

    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const [tables] = await connection.query(
        `SELECT * FROM \`tables\` WHERE id = :tableId LIMIT 1`,
        { tableId },
      );

      const selectedTable = tables[0];

      if (!selectedTable) {
        await connection.rollback();
        return res.status(404).json({ message: "Meja tidak ditemukan" });
      }

      if (selectedTable.status === "inactive") {
        await connection.rollback();
        return res.status(400).json({ message: "Meja sedang tidak aktif" });
      }

      if (Number(guestCount) > Number(selectedTable.capacity)) {
        await connection.rollback();
        return res.status(400).json({ message: "Jumlah tamu melebihi kapasitas meja" });
      }

      const [conflicts] = await connection.query(
        `SELECT id
         FROM reservations
         WHERE table_id = :tableId
           AND status IN ('pending', 'confirmed')
           AND start_time < :endTime
           AND end_time > :startTime
         LIMIT 1`,
        { tableId, startTime, endTime },
      );

      if (conflicts.length) {
        await connection.rollback();
        return res.status(409).json({ message: "Meja sudah dipesan pada rentang waktu tersebut" });
      }

      const code = generateReservationCode();
      const [result] = await connection.query(
        `INSERT INTO reservations
         (code, user_id, table_id, customer_name, customer_phone, table_code, floor, room, reservation_date, start_time, end_time, guest_count, note, status)
         VALUES
         (:code, :userId, :tableId, :customerName, :customerPhone, :tableCode, :floor, :room, :reservationDate, :startTime, :endTime, :guestCount, :note, 'pending')`,
        {
          code,
          userId,
          tableId,
          customerName,
          customerPhone,
          tableCode: selectedTable.code,
          floor: selectedTable.floor,
          room: selectedTable.room,
          reservationDate,
          startTime,
          endTime,
          guestCount,
          note,
        },
      );

      await connection.query(
        `UPDATE \`tables\` SET status = 'reserved' WHERE id = :tableId`,
        { tableId },
      );

      await connection.query(
        `INSERT INTO notifications (user_id, reservation_id, title, message, type, is_read)
         VALUES (:userId, :reservationId, :title, :message, 'reservation', FALSE)`,
        {
          userId,
          reservationId: result.insertId,
          title: "Reservasi menunggu konfirmasi",
          message: `Reservasi meja ${selectedTable.code} berhasil dibuat dan menunggu konfirmasi admin.`,
        },
      );

      await connection.commit();
      ok(res, { id: result.insertId, code }, "Reservasi berhasil dibuat");
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }),
);

app.patch(
  "/api/reservations/:id/cancel",
  requireAuth,
  asyncHandler(async (req, res) => {
    const [result] = await db.query(
      `UPDATE reservations
       SET status = 'cancelled'
       WHERE id = :id
         AND (:isAdmin = TRUE OR user_id = :userId)`,
      { id: req.params.id, userId: req.user.id, isAdmin: req.user.role === "admin" },
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Reservasi tidak ditemukan" });
    }

    ok(res, { id: Number(req.params.id) }, "Reservasi berhasil dibatalkan");
  }),
);

app.get(
  "/api/admin/reservations",
  asyncHandler(async (req, res) => {
    const { status, date } = req.query;
    const filters = [];
    const params = {};

    if (status && status !== "all") {
      filters.push("status = :status");
      params.status = status;
    }

    if (date) {
      filters.push("reservation_date = :date");
      params.date = date;
    }

    const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
    const [rows] = await db.query(
      `SELECT * FROM reservations ${where} ORDER BY start_time DESC`,
      params,
    );

    ok(res, rows.map(toReservationResponse));
  }),
);

app.patch(
  "/api/admin/reservations/:id/status",
  asyncHandler(async (req, res) => {
    const { status } = req.body;
    const allowed = ["pending", "confirmed", "cancelled", "completed"];

    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Status reservasi tidak valid" });
    }

    await db.query(
      `UPDATE reservations SET status = :status WHERE id = :id`,
      { id: req.params.id, status },
    );

    ok(res, { id: Number(req.params.id), status }, "Status reservasi berhasil diperbarui");
  }),
);

app.get(
  "/api/notifications/user/:userId",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (req.user.role !== "admin" && Number(req.params.userId) !== Number(req.user.id)) {
      return res.status(403).json({ message: "Tidak bisa mengakses notifikasi user lain" });
    }

    const [rows] = await db.query(
      `SELECT *
       FROM notifications
       WHERE user_id = :userId
       ORDER BY created_at DESC`,
      { userId: req.params.userId },
    );

    ok(res, rows);
  }),
);

app.patch(
  "/api/notifications/:id/read",
  requireAuth,
  asyncHandler(async (req, res) => {
    await db.query(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE id = :id
         AND (:isAdmin = TRUE OR user_id = :userId)`,
      { id: req.params.id, userId: req.user.id, isAdmin: req.user.role === "admin" },
    );

    ok(res, { id: Number(req.params.id) }, "Notifikasi ditandai sudah dibaca");
  }),
);

app.patch(
  "/api/notifications/user/:userId/read-all",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (req.user.role !== "admin" && Number(req.params.userId) !== Number(req.user.id)) {
      return res.status(403).json({ message: "Tidak bisa mengubah notifikasi user lain" });
    }

    await db.query(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE user_id = :userId`,
      { userId: req.params.userId },
    );

    ok(res, { userId: Number(req.params.userId) }, "Semua notifikasi ditandai sudah dibaca");
  }),
);

app.get(
  "/api/admin/users",
  asyncHandler(async (req, res) => {
    const { status, role } = req.query;
    const filters = [];
    const params = {};

    if (status && status !== "all") {
      filters.push("u.status = :status");
      params.status = status;
    }

    if (role && role !== "all") {
      filters.push("u.role = :role");
      params.role = role;
    }

    const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
    const [rows] = await db.query(
      `SELECT
         u.id,
         u.name,
         u.email,
         u.phone,
         u.role,
         u.status,
         u.created_at,
         u.updated_at,
         COUNT(r.id) AS reservation_count
       FROM users u
       LEFT JOIN reservations r ON r.user_id = u.id
       ${where}
       GROUP BY u.id, u.name, u.email, u.phone, u.role, u.status, u.created_at, u.updated_at
       ORDER BY u.created_at DESC`,
      params,
    );

    ok(res, rows);
  }),
);

app.get(
  "/api/admin/reports/occupancy",
  asyncHandler(async (req, res) => {
    const [zoneRows] = await db.query(
      `SELECT
         t.room AS zone,
         t.floor,
         COUNT(DISTINCT t.id) AS tables,
         COUNT(r.id) AS reservations,
         ROUND(
           CASE
             WHEN COUNT(DISTINCT t.id) = 0 THEN 0
             ELSE LEAST((COUNT(r.id) / COUNT(DISTINCT t.id)) * 25, 100)
           END
         ) AS occupancy
       FROM \`tables\` t
       LEFT JOIN reservations r
         ON r.table_id = t.id
        AND r.status IN ('pending', 'confirmed', 'completed')
       GROUP BY t.room, t.floor
       ORDER BY t.floor ASC, t.room ASC`,
    );

    const [statusRows] = await db.query(
      `SELECT status, COUNT(*) AS total
       FROM reservations
       GROUP BY status`,
    );

    ok(res, { zones: zoneRows, reservationStatus: statusRows });
  }),
);

app.use((req, res) => {
  res.status(404).json({ message: "Endpoint tidak ditemukan" });
});

app.use((error, req, res, next) => {
  console.error(error);

  res.status(error.status || 500).json({
    message: "Terjadi kesalahan pada server",
    error: process.env.NODE_ENV === "production" ? undefined : error.message,
  });
});

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
