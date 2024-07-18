-- --------------------------------------------------------
-- Хост:                         192.168.100.2
-- Версия сервера:               11.4.2-MariaDB-ubu2204 - mariadb.org binary distribution
-- Операционная система:         debian-linux-gnu
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


-- Дамп структуры базы данных discord_bot
CREATE DATABASE IF NOT EXISTS `discord_bot` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci */;
USE `discord_bot`;

-- Дамп структуры для таблица discord_bot.discord_identifiers
CREATE TABLE IF NOT EXISTS `discord_identifiers` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `identifier` varchar(256) DEFAULT NULL,
  `playerid` bigint(20) DEFAULT NULL,
  `realtime` bigint(20) DEFAULT NULL,
  `used` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `keyfield_index_identifier` (`identifier`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- Дамп данных таблицы discord_bot.discord_identifiers: ~0 rows (приблизительно)

-- Дамп структуры для таблица discord_bot.discord_links
CREATE TABLE IF NOT EXISTS `discord_links` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `player_id` bigint(20) DEFAULT NULL,
  `discord_id` varchar(64) DEFAULT NULL,
  `role_rank` int(11) DEFAULT NULL,
  `stable_rank` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `keyfield_index_discord_id` (`discord_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- Дамп данных таблицы discord_bot.discord_links: ~0 rows (приблизительно)

-- Дамп структуры для таблица discord_bot.discord_ranks
CREATE TABLE IF NOT EXISTS `discord_ranks` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `rank` int(11) DEFAULT NULL,
  `rank_name` varchar(256) DEFAULT NULL,
  `functions` varchar(4000) DEFAULT NULL,
  `role_id` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- Дамп данных таблицы discord_bot.discord_ranks: ~6 rows (приблизительно)
INSERT INTO `discord_ranks` (`id`, `rank`, `rank_name`, `functions`, `role_id`) VALUES
	(1, 0, 'Conscript', '{}', '1252317492609810595'),
	(2, 1, 'Rookie', '{}', '614934213547917468'),
	(3, 2, 'Marine', '{}', '1252314474418016287'),
	(4, 3, 'Sergeant', '{}', '1252314538758373387'),
	(5, 4, 'Vietnamese', '{}', '1252314607998074911'),
	(6, 5, 'Zagradotrudnichestvo', '{}', '1252314659101610064');

-- Дамп структуры для таблица discord_bot.servers
CREATE TABLE IF NOT EXISTS `servers` (
  `server_name` varchar(20) DEFAULT NULL,
  `db_name` varchar(20) DEFAULT NULL,
  `file_name` varchar(20) DEFAULT NULL,
  `ip` varchar(40) DEFAULT NULL,
  `port` int(10) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- Дамп данных таблицы discord_bot.servers: ~0 rows (приблизительно)
INSERT INTO `servers` (`server_name`, `db_name`, `file_name`, `ip`, `port`) VALUES
	('CM', 'cm13', 'cm.js', 'play.colonialmarines.ru', 4737);

-- Дамп структуры для таблица discord_bot.server_channels
CREATE TABLE IF NOT EXISTS `server_channels` (
  `server_name` varchar(20) DEFAULT NULL,
  `type` varchar(20) DEFAULT NULL,
  `channel_id` varchar(50) DEFAULT NULL,
  `message_id` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- Дамп данных таблицы discord_bot.server_channels: ~1 rows (приблизительно)
INSERT INTO `server_channels` (`server_name`, `type`, `channel_id`, `message_id`) VALUES
	('CM', 'status', '1252302664142819541', '1252302966254473328');

-- Дамп структуры для таблица discord_bot.settings
CREATE TABLE IF NOT EXISTS `settings` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(64) DEFAULT NULL,
  `param` varchar(64) DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- Дамп данных таблицы discord_bot.settings: ~1 rows (приблизительно)
INSERT INTO `settings` (`id`, `name`, `param`) VALUES
	(1, 'main_guild', '614611020039585792');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
