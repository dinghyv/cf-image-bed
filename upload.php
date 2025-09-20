<?php
// 荒野图床 - 文件上传处理脚本
// 版权：安稳antwen

// 设置错误报告 - 关闭显示错误，避免输出HTML
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// 设置响应头 - 必须在任何输出之前
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// 错误处理函数
function sendErrorResponse($message, $code = 400) {
    http_response_code($code);
    echo json_encode(['error' => $message]);
    exit;
}

// 尝试引入配置文件，如果失败则使用默认配置
$configLoaded = false;
if (file_exists('config.php')) {
    try {
        require_once 'config.php';
        $configLoaded = true;
    } catch (Exception $e) {
        // 配置文件加载失败，使用默认配置
    }
}

// 默认配置
if (!$configLoaded) {
    define('MAX_FILE_SIZE', 25 * 1024 * 1024);
    define('ERROR_MESSAGES', [
        'no_file' => '没有文件上传或上传失败',
        'size_exceeded' => '文件大小超过25MB限制',
        'type_not_allowed' => '不支持的文件类型',
        'upload_failed' => '文件保存失败',
        'directory_error' => '无法创建上传目录',
        'method_not_allowed' => '只允许POST请求'
    ]);
    define('SUCCESS_MESSAGES', [
        'upload_success' => '文件上传成功'
    ]);
}

// 设置文件上传限制
ini_set('upload_max_filesize', '25M');
ini_set('post_max_size', '25M');
ini_set('max_execution_time', 300);

// 允许的MIME类型（可以根据需要调整）
$allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'text/html', 'text/plain', 'application/pdf', 'application/zip',
    'application/x-rar-compressed', 'video/mp4', 'audio/mpeg',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

// 使用配置文件中的设置
$maxFileSize = MAX_FILE_SIZE;

// 只允许POST请求
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendErrorResponse(ERROR_MESSAGES['method_not_allowed'], 405);
}

// 检查是否有文件上传
if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    $errorMsg = ERROR_MESSAGES['no_file'];
    if (isset($_FILES['file']['error'])) {
        switch ($_FILES['file']['error']) {
            case UPLOAD_ERR_INI_SIZE:
            case UPLOAD_ERR_FORM_SIZE:
                $errorMsg = '文件大小超过限制';
                break;
            case UPLOAD_ERR_PARTIAL:
                $errorMsg = '文件上传不完整';
                break;
            case UPLOAD_ERR_NO_FILE:
                $errorMsg = '没有选择文件';
                break;
            case UPLOAD_ERR_NO_TMP_DIR:
                $errorMsg = '临时目录不存在';
                break;
            case UPLOAD_ERR_CANT_WRITE:
                $errorMsg = '无法写入文件';
                break;
            case UPLOAD_ERR_EXTENSION:
                $errorMsg = '文件上传被扩展阻止';
                break;
        }
    }
    sendErrorResponse($errorMsg);
}

$file = $_FILES['file'];

// 检查文件大小
if ($file['size'] > $maxFileSize) {
    sendErrorResponse(ERROR_MESSAGES['size_exceeded']);
}

// 检查文件类型
$fileType = mime_content_type($file['tmp_name']);
$fileExtension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

// 根据文件类型确定存储目录
$uploadDir = 'files'; // 默认目录
if (strpos($fileType, 'image/') === 0) {
    $uploadDir = 'image';
} elseif (in_array($fileExtension, ['html', 'htm'])) {
    $uploadDir = 'html';
}

// 确保目录存在
if (!is_dir($uploadDir)) {
    if (!mkdir($uploadDir, 0755, true)) {
        sendErrorResponse(ERROR_MESSAGES['directory_error'], 500);
    }
}

// 生成唯一文件名
$timestamp = time();
$randomString = substr(md5(uniqid(rand(), true)), 0, 8);
$fileName = $timestamp . '_' . $randomString . '_' . basename($file['name']);

// 清理文件名中的特殊字符
$fileName = preg_replace('/[^a-zA-Z0-9._-]/', '_', $fileName);

$uploadPath = $uploadDir . '/' . $fileName;

// 移动上传的文件
if (move_uploaded_file($file['tmp_name'], $uploadPath)) {
    // 生成文件URL
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'];
    $scriptDir = dirname($_SERVER['SCRIPT_NAME']);
    $fileUrl = $protocol . '://' . $host . $scriptDir . '/' . $uploadPath;
    
    // 返回成功响应
    echo json_encode([
        'success' => true,
        'message' => SUCCESS_MESSAGES['upload_success'],
        'data' => [
            'name' => $file['name'],
            'url' => $fileUrl,
            'size' => $file['size'],
            'type' => $fileType,
            'folder' => $uploadDir,
            'uploaded_at' => date('Y-m-d H:i:s')
        ]
    ]);
} else {
    sendErrorResponse(ERROR_MESSAGES['upload_failed'], 500);
}
?>
