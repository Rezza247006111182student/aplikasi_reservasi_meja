CREATE DATABASE IF NOT EXISTS restaurant_reservation
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE restaurant_reservation;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  phone VARCHAR(25) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'customer') NOT NULL DEFAULT 'customer',
  status ENUM('active', 'restricted', 'inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_role_status (role, status),
  KEY idx_users_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS zones (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(30) NOT NULL,
  floor VARCHAR(50) NOT NULL,
  room VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL,
  capacity INT UNSIGNED NOT NULL DEFAULT 0,
  status ENUM('active', 'maintenance', 'inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_zones_code (code),
  KEY idx_zones_floor_room (floor, room),
  KEY idx_zones_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `tables` (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(30) NOT NULL,
  zone_id BIGINT UNSIGNED NOT NULL,
  floor VARCHAR(50) NOT NULL,
  room VARCHAR(100) NOT NULL,
  capacity INT UNSIGNED NOT NULL,
  shape ENUM('round', 'square', 'rectangle') NOT NULL DEFAULT 'round',
  x DECIMAL(10,2) NOT NULL,
  y DECIMAL(10,2) NOT NULL,
  width DECIMAL(10,2) NOT NULL,
  height DECIMAL(10,2) NOT NULL,
  rotation DECIMAL(7,2) NOT NULL DEFAULT 0,
  status ENUM('available', 'reserved', 'booked', 'inactive') NOT NULL DEFAULT 'available',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tables_code (code),
  KEY idx_tables_zone_id (zone_id),
  KEY idx_tables_floor_room_status (floor, room, status),
  CONSTRAINT fk_tables_zone
    FOREIGN KEY (zone_id) REFERENCES zones(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT chk_tables_capacity CHECK (capacity > 0),
  CONSTRAINT chk_tables_width CHECK (width > 0),
  CONSTRAINT chk_tables_height CHECK (height > 0),
  CONSTRAINT chk_tables_x CHECK (x >= 0),
  CONSTRAINT chk_tables_y CHECK (y >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS menus (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  category ENUM('main_course', 'seafood', 'beverage', 'dessert', 'package', 'service') NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  description TEXT NOT NULL,
  image_url VARCHAR(500) DEFAULT NULL,
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
  status ENUM('available', 'sold_out', 'hidden') NOT NULL DEFAULT 'available',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_menus_category_status (category, status),
  KEY idx_menus_favorite (is_favorite),
  CONSTRAINT chk_menus_price CHECK (price >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS room_layouts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  zone_id BIGINT UNSIGNED NOT NULL,
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
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_room_layouts_zone_id (zone_id),
  CONSTRAINT fk_room_layouts_zone
    FOREIGN KEY (zone_id) REFERENCES zones(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT chk_room_layouts_cashier_width CHECK (cashier_width > 0),
  CONSTRAINT chk_room_layouts_cashier_height CHECK (cashier_height > 0),
  CONSTRAINT chk_room_layouts_door_width CHECK (door_width > 0),
  CONSTRAINT chk_room_layouts_door_height CHECK (door_height > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS reservations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(40) NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  table_id BIGINT UNSIGNED NOT NULL,
  customer_name VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(25) NOT NULL,
  table_code VARCHAR(30) NOT NULL,
  floor VARCHAR(50) NOT NULL,
  room VARCHAR(100) NOT NULL,
  reservation_date DATE NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  guest_count INT UNSIGNED NOT NULL,
  note TEXT DEFAULT NULL,
  status ENUM('pending', 'confirmed', 'cancelled', 'completed') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_reservations_code (code),
  KEY idx_reservations_user_id (user_id),
  KEY idx_reservations_table_id (table_id),
  KEY idx_reservations_date_status (reservation_date, status),
  KEY idx_reservations_conflict_lookup (table_id, status, start_time, end_time),
  CONSTRAINT fk_reservations_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_reservations_table
    FOREIGN KEY (table_id) REFERENCES `tables`(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT chk_reservations_guest_count CHECK (guest_count > 0),
  CONSTRAINT chk_reservations_time_range CHECK (end_time > start_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  reservation_id BIGINT UNSIGNED DEFAULT NULL,
  title VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('reservation', 'system') NOT NULL DEFAULT 'reservation',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_notifications_user_read_created (user_id, is_read, created_at),
  KEY idx_notifications_reservation_id (reservation_id),
  CONSTRAINT fk_notifications_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_notifications_reservation
    FOREIGN KEY (reservation_id) REFERENCES reservations(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
