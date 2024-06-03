CREATE TABLE IF NOT EXISTS `apaas_file_pub` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT 'id',
  `file_id` bigint unsigned NOT NULL DEFAULT '0' COMMENT '文件id',
  `version` varchar(50) NOT NULL DEFAULT '1.0.0' COMMENT '版本号',
  `content` mediumtext NOT NULL COMMENT '文件内容',
  `creator_id` varchar(50) NOT NULL DEFAULT '' COMMENT '创建者id',
  `creator_name` varchar(50) DEFAULT NULL DEFAULT '' COMMENT '创建者名称',
  `create_time` bigint NOT NULL COMMENT '创建时间',
  `commit_info` mediumtext NOT NULL COMMENT '发布日志',
  `status` int DEFAULT NULL COMMENT '状态，-1-删除，0-禁用，1-正常',
  `file_content_id` bigint DEFAULT NULL COMMENT '对应保存id',
  `update_time` bigint NOT NULL COMMENT '更新时间',
  `type` varchar(50) NOT NULL COMMENT '发布类型，线上、测试、日常等',
  PRIMARY KEY (`id`),
  KEY `idx_creator_info` (`creator_id`,`creator_name`),
  KEY `idx_file_id` (`file_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COMMENT='文件发布表';