CREATE TABLE IF NOT EXISTS `material_tag` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '标签主键id',
  `title` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT '' COMMENT '标签名称',
  `scene_id` bigint(20) unsigned DEFAULT '0' COMMENT '场景id',
  `creator_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT '' COMMENT '创建人id',
  `order` bigint(20) unsigned DEFAULT '0' COMMENT '标签排序',
  `create_time` bigint(20) NOT NULL COMMENT '创建时间',
  `update_time` bigint(20) NOT NULL COMMENT '创建时间',
  `updator_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT '' COMMENT '更新人id',
  `status` int(16) DEFAULT '1' COMMENT '状态，-1-删除，1-正常',
  `parent_id` bigint(20) unsigned DEFAULT NULL COMMENT '父级分类',
  PRIMARY KEY (`id`),
  KEY `idx_creator_id` (`creator_id`),
  KEY `idx_scene_id` (`scene_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COMMENT='标签表';