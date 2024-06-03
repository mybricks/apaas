CREATE TABLE IF NOT EXISTS `apaas_user_log` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT 'id',
  `type` int NOT NULL COMMENT 'type',
  `user_id` bigint NOT NULL COMMENT 'user_id',
  `user_email` varchar(256) NOT NULL COMMENT 'user_email',
  `relation_token` bigint DEFAULT NULL COMMENT '日志关联的id',
  `log_content` varchar(512) NOT NULL COMMENT 'log_content',
  `create_time` bigint NOT NULL COMMENT 'create_time',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;