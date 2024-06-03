CREATE TABLE IF NOT EXISTS `apaas_user_session` (
  `id` bigint NOT NULL,
  `user_id` bigint DEFAULT NULL COMMENT '用户id',
  `fingerprint` varchar(255) DEFAULT NULL COMMENT '当前登录设备指纹',
  `status` int DEFAULT NULL COMMENT '状态',
  `create_time` bigint DEFAULT NULL COMMENT '新增时间',
  `update_time` bigint DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;