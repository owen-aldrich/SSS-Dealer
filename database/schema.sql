-- =============================================================
-- SSS+Dealer — MySQL / TiDB Cloud Schema
-- Jalankan via: npm run db:init
-- Tidak perlu CREATE DATABASE — koneksi sudah mengarah ke DB_NAME
-- =============================================================

-- =============================================================
-- USERS
-- =============================================================
CREATE TABLE IF NOT EXISTS `users` (
  `id`         INT           NOT NULL AUTO_INCREMENT,
  `fullname`   VARCHAR(100)  NOT NULL,
  `email`      VARCHAR(100)  NOT NULL,
  `username`   VARCHAR(50)   NOT NULL,
  `password`   VARCHAR(255)  NOT NULL,
  `age`        INT           NULL,
  `address`    TEXT          NULL,
  `photo`      VARCHAR(255)  NULL,
  `role`       VARCHAR(20)   NOT NULL DEFAULT 'user',
  `created_at` DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email`    (`email`),
  UNIQUE KEY `uq_users_username` (`username`)
);

-- =============================================================
-- CARS
-- =============================================================
CREATE TABLE IF NOT EXISTS `cars` (
  `id`           INT            NOT NULL AUTO_INCREMENT,
  `name`         VARCHAR(100)   NOT NULL,
  `brand`        VARCHAR(50)    NOT NULL,
  `type`         VARCHAR(50)    NOT NULL,
  `price`        DECIMAL(15,2)  NOT NULL,
  `image`        VARCHAR(255)   NOT NULL,
  `drivetrain`   VARCHAR(20)    NOT NULL,
  `powertrain`   VARCHAR(30)    NOT NULL,
  `transmission` VARCHAR(30)    NOT NULL,
  `performance`  VARCHAR(30)    NOT NULL,
  `horsepower`   INT            NULL,
  `torque`       INT            NULL,
  `top_speed`    INT            NULL,
  `accel_0_100`  VARCHAR(20)    NULL,
  `description`  TEXT           NULL,
  `year`         INT            NOT NULL DEFAULT 2024,
  `status`       VARCHAR(20)    NOT NULL DEFAULT 'available',
  `updated_at`   DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

-- =============================================================
-- USER FAVORITES
-- =============================================================
CREATE TABLE IF NOT EXISTS `user_favorites` (
  `id`         INT      NOT NULL AUTO_INCREMENT,
  `user_id`    INT      NOT NULL,
  `car_id`     INT      NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_fav_user_car` (`user_id`, `car_id`),
  CONSTRAINT `fk_fav_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_fav_car`  FOREIGN KEY (`car_id`)  REFERENCES `cars`  (`id`) ON DELETE CASCADE
);

-- =============================================================
-- COMPARE HISTORY
-- =============================================================
CREATE TABLE IF NOT EXISTS `compare_history` (
  `id`          INT      NOT NULL AUTO_INCREMENT,
  `user_id`     INT      NOT NULL,
  `car_id_1`    INT      NOT NULL,
  `car_id_2`    INT      NOT NULL,
  `compared_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_cmp_user` FOREIGN KEY (`user_id`)  REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cmp_car1` FOREIGN KEY (`car_id_1`) REFERENCES `cars`  (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cmp_car2` FOREIGN KEY (`car_id_2`) REFERENCES `cars`  (`id`) ON DELETE CASCADE
);

-- =============================================================
-- TEST DRIVES
-- =============================================================
CREATE TABLE IF NOT EXISTS `test_drives` (
  `id`             INT          NOT NULL AUTO_INCREMENT,
  `user_id`        INT          NULL,
  `car_id`         INT          NOT NULL,
  `name`           VARCHAR(100) NOT NULL,
  `email`          VARCHAR(100) NOT NULL,
  `phone`          VARCHAR(30)  NOT NULL,
  `preferred_date` DATE         NULL,
  `preferred_time` VARCHAR(20)  NULL,
  `message`        TEXT         NULL,
  `status`         VARCHAR(20)  NOT NULL DEFAULT 'pending',
  `created_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_td_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_td_car`  FOREIGN KEY (`car_id`)  REFERENCES `cars`  (`id`) ON DELETE CASCADE
);

-- =============================================================
-- LEADS
-- =============================================================
CREATE TABLE IF NOT EXISTS `leads` (
  `id`         INT          NOT NULL AUTO_INCREMENT,
  `name`       VARCHAR(100) NOT NULL,
  `email`      VARCHAR(100) NOT NULL DEFAULT '',
  `phone`      VARCHAR(30)  NULL,
  `car_id`     INT          NULL,
  `status`     VARCHAR(20)  NOT NULL DEFAULT 'new',
  `consultant` VARCHAR(100) NULL,
  `note`       TEXT         NULL,
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_lead_car` FOREIGN KEY (`car_id`) REFERENCES `cars` (`id`) ON DELETE SET NULL
);


UPDATE sss_dealer.users SET role = 'admin' WHERE username = 'owen';