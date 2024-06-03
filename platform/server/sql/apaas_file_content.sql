CREATE TABLE IF NOT EXISTS `apaas_file_content` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT 'id',
  `file_id` bigint NOT NULL COMMENT 'file_id',
  `content` mediumtext COMMENT 'content',
  `creator_id` varchar(128) NOT NULL COMMENT 'creator_id',
  `create_time` bigint NOT NULL COMMENT 'create_time',
  `update_time` bigint DEFAULT NULL COMMENT 'update_time',
  `version` varchar(50) NOT NULL DEFAULT '1.0.0' COMMENT 'version',
  PRIMARY KEY (`id`),
  KEY `idx_fileId` (`file_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4;