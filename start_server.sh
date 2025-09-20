#!/bin/bash
# 荒野图床 - 服务器启动脚本
# 版权：安稳antwen

echo "🤠 荒野图床服务器启动脚本"
echo "================================"

# 检查Python版本
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
else
    echo "❌ 错误: 未找到Python"
    exit 1
fi

# 检查PHP
if command -v php &> /dev/null; then
    PHP_AVAILABLE=true
else
    PHP_AVAILABLE=false
fi

echo "📍 当前目录: $(pwd)"
echo "🐍 Python命令: $PYTHON_CMD"
echo "🐘 PHP可用: $([ "$PHP_AVAILABLE" = true ] && echo "是" || echo "否")"
echo ""

# 显示选项菜单
echo "请选择启动方式:"
echo "1) Python服务器 (支持文件上传)"
echo "2) PHP内置服务器 (需要PHP)"
echo "3) 纯前端版本 (无需服务器)"
echo "4) 退出"
echo ""

read -p "请输入选项 (1-4): " choice

case $choice in
    1)
        echo "🚀 启动Python服务器..."
        echo "📍 访问地址: http://localhost:8000"
        echo "⏹️  按 Ctrl+C 停止服务器"
        echo ""
        $PYTHON_CMD server.py 8000
        ;;
    2)
        if [ "$PHP_AVAILABLE" = true ]; then
            echo "🚀 启动PHP服务器..."
            echo "📍 访问地址: http://localhost:8000"
            echo "⏹️  按 Ctrl+C 停止服务器"
            echo ""
            php -S localhost:8000
        else
            echo "❌ 错误: PHP不可用，请安装PHP或选择其他选项"
        fi
        ;;
    3)
        echo "🌐 打开纯前端版本..."
        if command -v xdg-open &> /dev/null; then
            xdg-open index_standalone.html
        elif command -v open &> /dev/null; then
            open index_standalone.html
        else
            echo "请手动打开 index_standalone.html 文件"
        fi
        ;;
    4)
        echo "👋 再见！"
        exit 0
        ;;
    *)
        echo "❌ 无效选项"
        exit 1
        ;;
esac
