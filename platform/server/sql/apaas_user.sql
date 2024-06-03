CREATE TABLE IF NOT EXISTS `apaas_user` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT 'id',
  `name` varchar(256) DEFAULT NULL COMMENT 'name',
  `email` varchar(256) NOT NULL COMMENT 'email',
  `mobile_phone` varchar(256) DEFAULT NULL COMMENT 'mobile_phone',
  `license_code` varchar(512) DEFAULT NULL COMMENT 'password',
  `create_time` bigint NOT NULL COMMENT 'create_time',
  `update_time` bigint DEFAULT NULL COMMENT 'update_time',
  `status` int NOT NULL DEFAULT '1' COMMENT 'status',
  `role` int NOT NULL DEFAULT '1' COMMENT 'role',
  `avatar` varchar(255) DEFAULT NULL COMMENT '用户头像',
  `password` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4;