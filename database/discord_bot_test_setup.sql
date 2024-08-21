/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


CREATE DATABASE IF NOT EXISTS `discord_bot` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci */;
USE `discord_bot`;

CREATE TABLE IF NOT EXISTS `servers` (
  `server_name` varchar(20) DEFAULT NULL,
  `db_name` varchar(20) DEFAULT NULL,
  `file_name` varchar(20) DEFAULT NULL,
  `guild` varchar(20) DEFAULT NULL,
  `ip` varchar(40) DEFAULT NULL,
  `port` int(10) DEFAULT NULL,
  UNIQUE KEY `name_link` (`server_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

INSERT INTO `servers` (`server_name`, `db_name`, `file_name`, `guild`, `ip`, `port`) VALUES
	('CM', 'cm13', 'cm.js', '1030833617879978004', 'play.colonialmarines.ru', 4737);

CREATE TABLE IF NOT EXISTS `server_channels` (
  `server_name` varchar(20) DEFAULT NULL,
  `type` varchar(20) DEFAULT NULL,
  `channel_id` varchar(50) DEFAULT NULL,
  `message_id` varchar(50) DEFAULT NULL,
  KEY `name_link` (`server_name`),
  CONSTRAINT `FK_server_channels_servers` FOREIGN KEY (`server_name`) REFERENCES `servers` (`server_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

INSERT INTO `server_channels` (`server_name`, `type`, `channel_id`, `message_id`) VALUES
	('CM', 'status', '1260279980374622218', '1264658740297072651');
	('CM', 'round', '1260279980374622218', '1');

CREATE TABLE IF NOT EXISTS `settings` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(64) DEFAULT NULL,
  `param` varchar(64) DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=1260279307788488798 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

INSERT INTO `settings` (`id`, `name`, `param`) VALUES
	(1, 'main_server', 'CM');
	(2, 'tgs_address', 'http://localhost:5000');
	(3, 'verified_role', '1260279361593147392');
	(4, 'anti_verified_role', '1260279307788488796');
  (5, 'new_round_message', '<@&1197532464118239244>\nНовый раунд');
  (6, 'tgs_bot_id', '0');
  (7, 'tgs_bot_message', '');
  (8, 'tgs_role_id', '1260284596365426771');
  (9, 'admin_role_id', '1260284596365426771');
  (10, 'github_branch', 'dev');
  (11, 'github_link', 'indefinity-cordon/bot_js');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
