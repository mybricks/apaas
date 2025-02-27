CREATE TABLE IF NOT EXISTS `material_pub_info` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'id',
  `material_id` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '文件id',
  `version` varchar(50) NOT NULL DEFAULT '1.0.0' COMMENT '版本号',
  `content` mediumtext NOT NULL COMMENT '文件内容',
  `creator_id` varchar(50) NOT NULL DEFAULT '' COMMENT '创建者id',
  `creator_name` varchar(50) NOT NULL DEFAULT '' COMMENT '创建者名称',
  `create_time` bigint(20) NOT NULL COMMENT '创建时间',
  `commit_info` mediumtext NOT NULL COMMENT '发布日志',
  `update_time` bigint(20) NOT NULL COMMENT '更新时间',
  `updator_id` varchar(50) NOT NULL DEFAULT '' COMMENT '更新人id',
  `updator_name` varchar(50) NOT NULL DEFAULT '' COMMENT '更新人名称',
  `status` int(11) DEFAULT '1' COMMENT '状态，-1-删除，0-禁用，1-正常',
  PRIMARY KEY (`id`),
  KEY `idx_creator_info` (`creator_id`,`creator_name`),
  KEY `idx_material_id` (`material_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COMMENT='物料发布表';