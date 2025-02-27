CREATE TABLE IF NOT EXISTS `material_scene` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '场景主键id',
  `title` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT '' COMMENT '场景名称',
  `creator_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT '' COMMENT '创建人id',
  `order` bigint(20) unsigned DEFAULT '0' COMMENT '标签排序',
  `create_time` bigint(20) NOT NULL COMMENT '创建时间',
  `update_time` bigint(20) NOT NULL COMMENT '更新时间',
  `updator_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT '' COMMENT '更新人id',
  `status` int(16) DEFAULT '1' COMMENT '状态，-1-删除，1-正常',
  `type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT '' COMMENT '场景类型，用于区分图片素材、模版、组件、组件库等',
  PRIMARY KEY (`id`),
  KEY `idx_creator_id` (`creator_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COMMENT='物料场景表';