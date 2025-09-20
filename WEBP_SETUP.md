# WebP链接功能配置说明

## 新增功能

本次更新为图床管理工具添加了WebP链接功能，用户现在可以获取图片的WebP格式链接。

## 环境变量配置

### 新增环境变量

在Cloudflare Pages的环境变量设置中添加以下新变量：

- **`WEB_URL`**: WebP链接的前缀URL

### 环境变量说明

1. **`AUTH_TOKEN`**: 授权码（原有）
2. **`COPY_URL`**: 复制链接的前缀URL（原有）
3. **`WEB_URL`**: WebP链接的前缀URL（新增）
4. **`NODE_VERSION`**: `20.11.1`（原有）
5. **`NPM_VERSION`**: `10.2.4`（原有）

### 配置示例

```
AUTH_TOKEN=your_auth_token_here
COPY_URL=https://your-custom-domain.com
WEB_URL=https://your-webp-domain.com
NODE_VERSION=20.11.1
NPM_VERSION=10.2.4
```

## 功能说明

### 上传页面
- 上传图片后，在结果列表中新增了"WebP"标签页
- 可以复制所有图片的WebP链接

### 管理页面
- 每张图片卡片下方新增了"WebP"按钮
- 点击可复制该图片的WebP链接
- 按钮布局：链接 | WebP | 删除

### 链接格式
- **普通链接**: `${COPY_URL}/${image_key}`
- **WebP链接**: `${WEB_URL}/${image_key}`

## 使用场景

WebP链接功能适用于：
- 需要提供WebP格式图片链接的场景
- 优化网站加载速度（WebP格式通常比JPEG/PNG更小）
- 支持现代浏览器的WebP格式显示

## 注意事项

1. 确保`WEB_URL`指向的域名可以正确访问图片
2. 如果使用CDN，确保CDN支持WebP格式转换
3. 建议`WEB_URL`和`COPY_URL`使用相同的域名，只是路径或参数不同

## 部署步骤

1. 在Cloudflare Pages项目设置中添加`WEB_URL`环境变量
2. 重新部署项目
3. 测试WebP链接功能是否正常工作

---

**注意**: 此功能需要后端支持WebP格式转换，如果您的图片存储不支持自动WebP转换，可能需要配置相应的CDN或图片处理服务。
