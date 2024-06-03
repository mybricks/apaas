CREATE TABLE IF NOT EXISTS `apaas_user_file_relation` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键id',
  `file_id` bigint unsigned NOT NULL COMMENT '文件id',
  `user_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT '' COMMENT '用户id',
  `creator_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT '' COMMENT '创建人id',
  `create_time` bigint NOT NULL COMMENT '创建时间',
  `updator_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT '' COMMENT '更新人id',
  `update_time` bigint NOT NULL COMMENT '更新时间',
  `role_description` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT '3' COMMENT '权限',
  `status` int NOT NULL COMMENT '状态，-1-删除，1-正常',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4;