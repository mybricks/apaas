CREATE TABLE IF NOT EXISTS `apaas_file` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT 'id',
  `parent_id` bigint DEFAULT NULL COMMENT 'parent_id',
  `group_id` bigint DEFAULT NULL COMMENT 'group_id',
  `name` varchar(256) NOT NULL COMMENT 'name',
  `namespace` varchar(256) DEFAULT NULL COMMENT 'namespace',
  `version` varchar(128) DEFAULT NULL COMMENT 'version',
  `ext_name` varchar(128) NOT NULL COMMENT 'ext_name',
  `uri` varchar(256) CHARACTER SET utf8mb4 DEFAULT NULL COMMENT 'uri',
  `icon` mediumtext COMMENT 'icon',
  `creator_id` varchar(128) NOT NULL COMMENT 'creator_id',
  `creator_name` varchar(128) DEFAULT NULL COMMENT 'creator_name',
  `create_time` bigint NOT NULL COMMENT 'create_time',
  `update_time` bigint DEFAULT NULL COMMENT 'update_time',
  `updator_id` varchar(128) DEFAULT NULL COMMENT 'updator_id',
  `updator_name` varchar(128) DEFAULT NULL COMMENT 'updator_name',
  `description` varchar(256) DEFAULT NULL COMMENT 'description',
  `type` varchar(128) DEFAULT NULL COMMENT 'ExtName 相同时标识类型',
  `share_type` int DEFAULT NULL COMMENT 'share_type',
  `status` int DEFAULT NULL COMMENT 'status',
  PRIMARY KEY (`id`),
  KEY `idx_extname` (`ext_name`),
  KEY `idx_creator_info`(`creator_id`, `creator_name`),
  KEY `idx_file_info`(`name`, `ext_name`, `namespace`),
  KEY `idx_namespace`(`namespace`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4;