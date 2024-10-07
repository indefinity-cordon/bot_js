-- --------------------------------------------------------
-- Хост:                         192.168.101.10
-- Версия сервера:               8.0.39-0ubuntu0.22.04.1 - (Ubuntu)
-- Операционная система:         Linux
-- HeidiSQL Версия:              12.7.0.6850
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

-- Дамп структуры для таблица discord_bot.guilds
CREATE TABLE IF NOT EXISTS `guilds` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `guild_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Дамп данных таблицы discord_bot.guilds: ~2 rows (приблизительно)
INSERT INTO `guilds` (`id`, `guild_id`) VALUES
	(1, '614611020039585792'),
	(2, '1268689852585476116');

-- Дамп структуры для таблица discord_bot.guild_settings
CREATE TABLE IF NOT EXISTS `guild_settings` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `guild` bigint DEFAULT NULL,
  `name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `setting` varchar(4000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `guild_id` (`guild`),
  CONSTRAINT `FK_guilds_settings` FOREIGN KEY (`guild`) REFERENCES `guilds` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Дамп данных таблицы discord_bot.guild_settings: ~6 rows (приблизительно)
INSERT INTO `guild_settings` (`id`, `guild`, `name`, `setting`) VALUES
	(1, 1, 'tgs_address', 'http://localhost:5000'),
	(2, 1, 'verified_role', '1252317492609810595'),
	(3, 1, 'anti_verified_role', '746716442946306088'),
	(4, 1, 'admin_role_id', '1237738433427013756'),
	(5, 2, 'admin_role_id', '1268836266745794602'),
  (6, 2, 'tgs_address', 'http://localhost:5000');

-- Дамп структуры для таблица discord_bot.servers
CREATE TABLE IF NOT EXISTS `servers` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `guild` bigint DEFAULT NULL,
  `server_name` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `db_connection_string` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_name` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ip` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `port` int DEFAULT NULL,
  `tgs_id` int DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `guild_id` (`guild`),
  CONSTRAINT `FK_guilds_servers` FOREIGN KEY (`guild`) REFERENCES `guilds` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Дамп данных таблицы discord_bot.servers: ~2 rows (приблизительно)
INSERT INTO `servers` (`id`, `guild`, `server_name`, `db_connection_string`, `file_name`, `ip`, `port`, `tgs_id`) VALUES
	(1, 1, 'CM', 'mysql://cm13:cm13@127.0.0.1:3306/cm13', 'cm.js', '127.0.0.1', 4737, 1),
	(2, 2, 'PVE CM', '', 'pve_cm.js', '127.0.0.1', 4739, 5);

-- Дамп структуры для таблица discord_bot.server_channels
CREATE TABLE IF NOT EXISTS `server_channels` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `server` bigint DEFAULT NULL,
  `type` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `channel_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `message_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `server_id` (`server`),
  CONSTRAINT `FK_servers_channels` FOREIGN KEY (`server`) REFERENCES `servers` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Дамп данных таблицы discord_bot.server_channels: ~11 rows (приблизительно)
INSERT INTO `server_channels` (`id`, `server`, `type`, `channel_id`, `message_id`) VALUES
	(1, 1, 'message_status', '1252302664142819541', '1252302966254473328'),
	(2, 1, 'round', '614619975151517718', '-1'),
	(3, 1, 'message_admin', '1276312138440376403', '1278807568700932177'),
	(4, 1, 'message_whitelist', '1276986707492995274', '1276999662376718410'),
	(5, 1, 'message_rank', '1276312138440376403', '1276471142785351734'),
	(6, 1, 'predator', '1161860126643322940', '-1'),
	(7, 1, 'ooc', '1278339805268148357', '-1'),
	(8, 1, 'admin', '1278832090590351402', '-1'),
	(9, 1, 'byond.round', '1278339805268148357', '-2'),
	(10, 1, 'byond.admin', '1278832090590351402', '-2'),
	(11, 1, 'message_schedule', '1252302664142819541', '1281297750922756129');

-- Дамп структуры для таблица discord_bot.server_settings
CREATE TABLE IF NOT EXISTS `server_settings` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `server` bigint DEFAULT NULL,
  `name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `setting` varchar(4000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `server_id` (`server`),
  CONSTRAINT `FK_servers_settings` FOREIGN KEY (`server`) REFERENCES `servers` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Дамп данных таблицы discord_bot.server_settings: ~3 rows (приблизительно)
INSERT INTO `server_settings` (`id`, `server`, `name`, `setting`) VALUES
	(1, 1, 'auto_start_config', '{"mode":"daily","daily":{"monday":"13:00","tuesday":"13:00","wednesday":"13:00","thursday":"13:00","friday":"13:00","saturday":"11:00","sunday":"11:00"}}'),
	(2, 1, 'server_status', '1'),
	(3, 1, 'player_low_autoshutdown', '8');

-- Дамп структуры для таблица discord_bot.settings
CREATE TABLE IF NOT EXISTS `settings` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `setting` varchar(4000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Дамп данных таблицы discord_bot.settings: ~0 rows (приблизительно)

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

-- Дамп структуры для таблица discord_bot.logs
CREATE TABLE IF NOT EXISTS `logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `info` varchar(4000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `log_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
