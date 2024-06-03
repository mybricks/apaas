CREATE TABLE IF NOT EXISTS `apaas_user_group` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键',
  `name` varchar(255) CHARACTER SET utf8mb4 NOT NULL COMMENT '组名称',
  `icon` varchar(255) CHARACTER SET utf8mb4 DEFAULT NULL COMMENT '组图标',
  `status` int NOT NULL DEFAULT '1' COMMENT '状态，-1-删除，1-正常',
  `creator_name` varchar(255) CHARACTER SET utf8mb4 DEFAULT NULL COMMENT '创建人名称',
  `create_time` bigint NOT NULL COMMENT '创建时间',
  `creator_id` varchar(255) CHARACTER SET utf8mb4 NOT NULL COMMENT '创建人ID',
  `updator_name` varchar(255) CHARACTER SET utf8mb4 DEFAULT NULL COMMENT '更新人名称',
  `update_time` bigint NOT NULL COMMENT '更新时间',
  `updator_id` varchar(255) CHARACTER SET utf8mb4 NOT NULL COMMENT '更新人ID',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4;