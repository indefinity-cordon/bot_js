CREATE TABLE IF NOT EXISTS `guilds` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `guild_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `guilds` (`id`, `guild_id`) VALUES
	(1, '1112098911658721402'),
	(2, '1075813105629679797');

CREATE TABLE IF NOT EXISTS `guild_settings` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `guild` bigint DEFAULT NULL,
  `name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `setting` varchar(4000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `guild_id` (`guild`),
  CONSTRAINT `FK_guilds_settings` FOREIGN KEY (`guild`) REFERENCES `guilds` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `guild_settings` (`id`, `guild`, `name`, `setting`) VALUES
	(1, 1, 'verified_role', '1343244918105313350'),
	(2, 1, 'anti_verified_role', '1343244918105313350'),
	(3, 1, 'admin_role_id', '1343244918105313350'),
	(5, 2, 'admin_role_id', '1343244918105313350');

CREATE TABLE IF NOT EXISTS `logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `info` varchar(4000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `log_time` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=255 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `servers` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `guild` bigint DEFAULT NULL,
  `server_name` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `db_connection_string` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_name` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ip` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `port` int DEFAULT NULL,
  `tgs_id` int DEFAULT NULL,
  `tgs_address` varchar(64) DEFAULT NULL,
  `tgs_login` varchar(64) DEFAULT NULL,
  `tgs_pass` varchar(64) DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `guild_id` (`guild`),
  CONSTRAINT `FK_guilds_servers` FOREIGN KEY (`guild`) REFERENCES `guilds` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `servers` (`id`, `guild`, `server_name`, `db_connection_string`, `file_name`, `ip`, `port`, `tgs_id`, `tgs_address`, `tgs_login`, `tgs_pass`) VALUES
	(1, 1, 'CM', 'test_run_db', 'cm.js', '127.0.0.1', 4737, NULL, NULL, NULL, NULL),
	(2, 2, 'Bluemoon', 'test_run_db', 'bluemoon.js', '127.0.0.1', 7888, NULL, NULL, NULL, NULL);

CREATE TABLE IF NOT EXISTS `server_channels` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `server` bigint DEFAULT NULL,
  `type` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `channel_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `message_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `server_id` (`server`),
  CONSTRAINT `FK_servers_channels` FOREIGN KEY (`server`) REFERENCES `servers` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `server_channels` (`id`, `server`, `type`, `channel_id`, `message_id`) VALUES
	(1, 1, 'message_status', '1100136962469404703', ''),
	(2, 1, 'message_statistic', '1100136962469404703', ''),
	(3, 1, 'round', '1100136962469404703', '-1'),
	(4, 1, 'message_admin', '1100136962469404703', ''),
	(5, 1, 'message_whitelist', '1100136962469404703', ''),
	(6, 1, 'message_rank', '1100136962469404703', ''),
	(7, 1, 'predator', '1100136962469404703', '-1'),
	(8, 1, 'ooc', '1100136962469404703', '-1'),
	(9, 1, 'admin', '1100136962469404703', '-1'),
	(10, 1, 'byond.round', '1100136962469404703', '-2'),
	(11, 1, 'byond.admin', '1100136962469404703', '-2'),
	(12, 1, 'message_schedule', '1100136962469404703', ''),
	(13, 2, 'message_status', '1100136962469404703', ''),
	(14, 2, 'events', '1100136962469404703', '-1'),
	(15, 2, 'ooc', '1100136962469404703', '-3'),
	(16, 2, 'admin', '1100136962469404703', '-3');

CREATE TABLE IF NOT EXISTS `server_settings` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `server` bigint DEFAULT NULL,
  `name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `setting` varchar(4000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `server_id` (`server`),
  CONSTRAINT `FK_servers_settings` FOREIGN KEY (`server`) REFERENCES `servers` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `server_settings` (`id`, `server`, `name`, `setting`) VALUES
	(1, 1, 'auto_start_config', '{"mode":"daily","daily":{"monday":"13:00","tuesday":"13:00","wednesday":"13:00","thursday":"13:00","friday":"13:00","saturday":"11:00","sunday":"11:00"}}'),
	(2, 1, 'server_status', '0'),
	(3, 1, 'player_low_autoshutdown', '8'),
  (4, 1, 'access_role_id', '0'),
  (5, 1, 'info_exchange', '0');

CREATE TABLE IF NOT EXISTS `settings` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `setting` varchar(4000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
