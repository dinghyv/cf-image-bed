<?php
// 测试上传功能
// 版权：安稳antwen

// 显示PHP信息
echo "<h2>PHP配置信息</h2>";
echo "<p>PHP版本: " . phpversion() . "</p>";
echo "<p>upload_max_filesize: " . ini_get('upload_max_filesize') . "</p>";
echo "<p>post_max_size: " . ini_get('post_max_size') . "</p>";
echo "<p>max_execution_time: " . ini_get('max_execution_time') . "</p>";
echo "<p>file_uploads: " . (ini_get('file_uploads') ? '启用' : '禁用') . "</p>";

// 检查目录权限
echo "<h2>目录权限检查</h2>";
$dirs = ['image', 'html', 'files'];
foreach ($dirs as $dir) {
    if (is_dir($dir)) {
        echo "<p>$dir: 目录存在，可写: " . (is_writable($dir) ? '是' : '否') . "</p>";
    } else {
        echo "<p>$dir: 目录不存在</p>";
        if (mkdir($dir, 0755, true)) {
            echo "<p>$dir: 创建成功</p>";
        } else {
            echo "<p>$dir: 创建失败</p>";
        }
    }
}

// 测试上传
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['test_file'])) {
    echo "<h2>上传测试结果</h2>";
    $file = $_FILES['test_file'];
    
    echo "<p>文件名: " . $file['name'] . "</p>";
    echo "<p>文件大小: " . $file['size'] . " bytes</p>";
    echo "<p>临时文件: " . $file['tmp_name'] . "</p>";
    echo "<p>错误代码: " . $file['error'] . "</p>";
    echo "<p>MIME类型: " . mime_content_type($file['tmp_name']) . "</p>";
    
    if ($file['error'] === UPLOAD_ERR_OK) {
        $uploadDir = 'files';
        $fileName = time() . '_' . basename($file['name']);
        $uploadPath = $uploadDir . '/' . $fileName;
        
        if (move_uploaded_file($file['tmp_name'], $uploadPath)) {
            echo "<p style='color: green;'>文件上传成功: $uploadPath</p>";
        } else {
            echo "<p style='color: red;'>文件移动失败</p>";
        }
    } else {
        echo "<p style='color: red;'>上传失败，错误代码: " . $file['error'] . "</p>";
    }
}
?>

<!DOCTYPE html>
<html>
<head>
    <title>上传测试</title>
    <meta charset="UTF-8">
</head>
<body>
    <h1>文件上传测试</h1>
    
    <form method="post" enctype="multipart/form-data">
        <p>
            <label>选择测试文件:</label>
            <input type="file" name="test_file" required>
        </p>
        <p>
            <button type="submit">上传测试</button>
        </p>
    </form>
    
    <h2>JSON测试</h2>
    <button onclick="testJSON()">测试JSON响应</button>
    <div id="jsonResult"></div>
    
    <script>
        async function testJSON() {
            try {
                const response = await fetch('upload_simple.php', {
                    method: 'POST',
                    body: new FormData()
                });
                
                const text = await response.text();
                document.getElementById('jsonResult').innerHTML = 
                    '<h3>响应状态: ' + response.status + '</h3>' +
                    '<h3>响应内容:</h3>' +
                    '<pre>' + text + '</pre>';
            } catch (error) {
                document.getElementById('jsonResult').innerHTML = 
                    '<p style="color: red;">错误: ' + error.message + '</p>';
            }
        }
    </script>
</body>
</html>
