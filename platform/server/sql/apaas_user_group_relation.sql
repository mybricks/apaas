CREATE TABLE IF NOT EXISTS `apaas_user_group_relation` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键',
  `status` int NOT NULL DEFAULT '1' COMMENT '状态，-1-删除，1-正常',
  `creator_name` varchar(255) CHARACTER SET utf8mb4 DEFAULT NULL COMMENT '创建人名称',
  `create_time` bigint NOT NULL COMMENT '创建时间',
  `creator_id` varchar(255) CHARACTER SET utf8mb4 NOT NULL COMMENT '创建人ID',
  `updator_name` varchar(255) CHARACTER SET utf8mb4 DEFAULT NULL COMMENT '更新人名称',
  `update_time` bigint NOT NULL COMMENT '更新时间',
  `updator_id` varchar(255) CHARACTER SET utf8mb4 NOT NULL COMMENT '更新人ID',
  `role_description` int NOT NULL COMMENT '1-管理，2-编辑， 3-能看到组，-1-被移除 ...',
  `user_group_id` bigint NOT NULL COMMENT '组ID',
  `user_id` varchar(255) CHARACTER SET utf8mb4 NOT NULL COMMENT '用户ID',
  PRIMARY KEY (`id`),
  KEY `idx_userid` (`user_id`),
  KEY `idx_groupid_userid` (`user_group_id`,`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4;