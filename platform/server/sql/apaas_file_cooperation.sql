CREATE TABLE IF NOT EXISTS `apaas_file_cooperation` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT 'id',
  `file_id` bigint NOT NULL COMMENT '文件ID',
  `user_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '用户ID',
  `update_time` bigint NOT NULL COMMENT '最后一次心跳更新时间',
  `status` int NOT NULL DEFAULT '1' COMMENT '状态，-1-离线，0-在线，1-在线编辑',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4;