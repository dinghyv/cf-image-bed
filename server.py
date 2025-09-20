#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
荒野图床 - Python服务器
支持文件上传的简单HTTP服务器
版权：安稳antwen
"""

import http.server
import socketserver
import os
import json
import urllib.parse
import cgi
import time
import hashlib
import random
import string
from pathlib import Path

class FileUploadHandler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        """处理POST请求，特别是文件上传"""
        if self.path == '/upload':
            self.handle_file_upload()
        elif self.path == '/upload_simple':
            self.handle_file_upload()
        else:
            self.send_error(404, "Not Found")
    
    def handle_file_upload(self):
        """处理文件上传"""
        try:
            # 解析multipart/form-data
            content_type = self.headers.get('Content-Type', '')
            if not content_type.startswith('multipart/form-data'):
                self.send_error(400, "Bad Request: Expected multipart/form-data")
                return
            
            # 解析表单数据
            form = cgi.FieldStorage(
                fp=self.rfile,
                headers=self.headers,
                environ={'REQUEST_METHOD': 'POST'}
            )
            
            # 检查是否有文件
            if 'file' not in form:
                self.send_json_response({'error': '没有文件上传'}, 400)
                return
            
            file_item = form['file']
            if not file_item.filename:
                self.send_json_response({'error': '没有选择文件'}, 400)
                return
            
            # 检查文件大小（25MB限制）
            file_data = file_item.file.read()
            if len(file_data) > 25 * 1024 * 1024:
                self.send_json_response({'error': '文件大小超过25MB限制'}, 400)
                return
            
            # 确定存储目录
            filename = file_item.filename
            file_ext = Path(filename).suffix.lower()
            
            if file_ext in ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']:
                upload_dir = 'image'
            elif file_ext in ['.html', '.htm']:
                upload_dir = 'html'
            else:
                upload_dir = 'files'
            
            # 确保目录存在
            os.makedirs(upload_dir, exist_ok=True)
            
            # 生成唯一文件名
            timestamp = int(time.time())
            random_str = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
            safe_filename = f"{timestamp}_{random_str}_{filename}"
            
            # 保存文件
            file_path = os.path.join(upload_dir, safe_filename)
            with open(file_path, 'wb') as f:
                f.write(file_data)
            
            # 生成文件URL
            file_url = f"http://{self.headers.get('Host', 'localhost')}/{upload_dir}/{safe_filename}"
            
            # 返回成功响应
            response_data = {
                'success': True,
                'message': '文件上传成功',
                'data': {
                    'name': filename,
                    'url': file_url,
                    'size': len(file_data),
                    'type': self.get_mime_type(filename),
                    'folder': upload_dir,
                    'uploaded_at': time.strftime('%Y-%m-%d %H:%M:%S')
                }
            }
            
            self.send_json_response(response_data)
            
        except Exception as e:
            self.send_json_response({'error': f'上传失败: {str(e)}'}, 500)
    
    def get_mime_type(self, filename):
        """根据文件扩展名返回MIME类型"""
        ext = Path(filename).suffix.lower()
        mime_types = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            '.svg': 'image/svg+xml',
            '.html': 'text/html',
            '.htm': 'text/html',
            '.txt': 'text/plain',
            '.pdf': 'application/pdf',
            '.zip': 'application/zip',
            '.mp4': 'video/mp4',
            '.mp3': 'audio/mpeg'
        }
        return mime_types.get(ext, 'application/octet-stream')
    
    def send_json_response(self, data, status_code=200):
        """发送JSON响应"""
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        
        response_json = json.dumps(data, ensure_ascii=False, indent=2)
        self.wfile.write(response_json.encode('utf-8'))
    
    def do_OPTIONS(self):
        """处理CORS预检请求"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

def run_server(port=8000):
    """启动服务器"""
    with socketserver.TCPServer(("", port), FileUploadHandler) as httpd:
        print(f"🤠 荒野图床服务器启动成功！")
        print(f"📍 访问地址: http://localhost:{port}")
        print(f"📁 服务目录: {os.getcwd()}")
        print(f"⏹️  按 Ctrl+C 停止服务器")
        print("-" * 50)
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 服务器已停止")

if __name__ == "__main__":
    import sys
    
    # 获取端口号
    port = 8000
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            print("错误: 端口号必须是数字")
            sys.exit(1)
    
    run_server(port)
