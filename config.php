<?php
// 荒野图床 - 配置文件
// 版权：安稳antwen

// 基本配置
define('SITE_NAME', '荒野图床');
define('SITE_DESCRIPTION', '西部牛仔文件托管服务');
define('COPYRIGHT', '安稳antwen');

// 登录配置
define('ADMIN_USERNAME', 'dinghy');
define('ADMIN_PASSWORD', '320324ding');

// 文件上传配置
define('MAX_FILE_SIZE', 25 * 1024 * 1024); // 25MB
define('ALLOWED_EXTENSIONS', [
    'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg',
    'html', 'htm', 'txt', 'pdf', 'zip', 'rar',
    'mp4', 'mp3', 'wav', 'doc', 'docx', 'xls', 'xlsx'
]);

// 目录配置
define('UPLOAD_DIRS', [
    'image' => 'image/',
    'html' => 'html/',
    'files' => 'files/'
]);

// 安全配置
define('ENABLE_FILE_TYPE_CHECK', true);
define('ENABLE_SIZE_CHECK', true);
define('ENABLE_EXTENSION_CHECK', true);

// 显示配置
define('SHOW_FILE_INFO', true);
define('SHOW_UPLOAD_TIME', true);
define('SHOW_FILE_SIZE', true);

// 错误消息
define('ERROR_MESSAGES', [
    'no_file' => '没有文件上传或上传失败',
    'size_exceeded' => '文件大小超过25MB限制',
    'type_not_allowed' => '不支持的文件类型',
    'upload_failed' => '文件保存失败',
    'directory_error' => '无法创建上传目录',
    'method_not_allowed' => '只允许POST请求'
]);

// 成功消息
define('SUCCESS_MESSAGES', [
    'upload_success' => '文件上传成功',
    'login_success' => '登录成功'
]);
?>
