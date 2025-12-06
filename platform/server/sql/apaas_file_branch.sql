CREATE TABLE IF NOT EXISTS `apaas_file_branch` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT 'id',
  `main_file_id` bigint NOT NULL COMMENT '主文件id',
  `branch_file_id` bigint NOT NULL COMMENT '分支文件id',
  `branch_name` varchar(256) DEFAULT NULL COMMENT '分支名称',
  `description` varchar(256) DEFAULT NULL COMMENT '分支描述',
  `content` mediumtext COMMENT '分支元数据/自定义信息',
  `creator_id` varchar(128) NOT NULL COMMENT '分支创建者id',
  `creator_name` varchar(128) DEFAULT NULL COMMENT '分支创建者名称',
  `create_time` bigint NOT NULL COMMENT '创建时间',
  `update_time` bigint DEFAULT NULL COMMENT '最后更新时间',
  `status` int DEFAULT 1 COMMENT '状态: 1-有效, -1-已删除',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_branch_relation` (`main_file_id`, `branch_file_id`),
  KEY `idx_main_file_id` (`main_file_id`),
  KEY `idx_branch_file_id` (`branch_file_id`),
  KEY `idx_creator_info`(`creator_id`, `creator_name`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4;
