# 小炜智能体 1.0.1Beta3

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyourusername%2Fxiaowei-agent&env=API_KEY,PROMPT&project-name=xiaowei-agent&repository-name=xiaowei-agent)

## 项目概述

小炜智能体是一个简化版的 Gemini API 代理服务，专为 Vercel 无服务器部署优化，具有以下功能：
- 将 Google Gemini API 转换为 OpenAI 格式
- 提供基本的文字聊天界面
- 验证 API 密钥（比对用户输入与环境变量）
- 支持自定义 prompt 变量注入

## 功能特点

1. **API 密钥验证**：
   - 从环境变量读取 API 密钥
   - 验证用户提供的 API 密钥
   - 拒绝未授权的 API 请求

2. **Prompt 注入**：
   - 从环境变量读取自定义 prompt
   - 将 prompt 注入到用户请求中
   - 支持系统指令格式

3. **API 格式转换**：
   - 将 OpenAI 格式请求转换为 Gemini 格式
   - 将 Gemini 格式响应转换为 OpenAI 格式
   - 支持基本的聊天完成功能

4. **Web 界面**：
   - 提供简单的聊天界面
   - 支持 API 密钥输入和验证
   - 显示聊天历史和响应

## 一键部署到 Vercel

1. 点击上方的 "Deploy with Vercel" 按钮
2. 设置以下环境变量：
   - `API_KEY`: 您的 Gemini API 密钥
   - `PROMPT`: (可选) 自定义系统提示词

## 手动部署步骤

### 前提条件
- GitHub 账号
- Vercel 账号
- Gemini API 密钥

### 部署步骤

1. Fork 本仓库到您的 GitHub 账号

2. 登录 Vercel 并导入项目
   - 点击 "Add New..." -> "Project"
   - 选择您 fork 的仓库
   - 点击 "Import"

3. 配置项目
   - 项目名称: 自定义或使用默认值
   - 框架预设: 选择 "Other"
   - 根目录: 保持默认值 (/)
   - 构建命令: 留空
   - 输出目录: 留空

4. 环境变量设置
   - 点击 "Environment Variables" 部分
   - 添加以下环境变量:
     - 名称: `API_KEY`, 值: 您的 Gemini API 密钥
     - 名称: `PROMPT`, 值: 您想要的自定义系统提示词 (可选)

5. 点击 "Deploy" 按钮

6. 部署完成后，您可以通过提供的 URL 访问您的小炜智能体

## API 端点

### OpenAI 兼容端点
- `GET /v1/models` - 获取可用模型列表
- `POST /v1/chat/completions` - 聊天完成 API

### 内部端点
- `POST /api/verify` - 验证 API 密钥
- `GET /api/config` - 获取前端配置
- `POST /api/chat` - 简单聊天 API（用于前端）

## 使用方法

### 作为聊天应用
1. 打开部署后的网页界面
2. 输入 Gemini API 密钥并验证
3. 开始聊天

### 作为 API 代理
可以使用标准的 OpenAI 客户端库，只需将 API 基础 URL 设置为此服务的地址，并使用 Gemini API 密钥作为 OpenAI API 密钥。

示例（使用 curl）：
```bash
curl --location 'https://your-vercel-app.vercel.app/v1/chat/completions' \
--header 'Authorization: Bearer YOUR_GEMINI_API_KEY' \
--header 'Content-Type: application/json' \
--data '{
    "messages": [
        {
            "role": "user",
            "content": "Hello, how are you?"
        }
    ],
    "model": "gemini-2.0-flash"
}'
```

## 项目结构

```
xiaowei-agent/
├── api/                   # Vercel API 路由
│   ├── auth.js            # API 密钥验证和 prompt 注入
│   ├── chat.js            # 简单聊天 API 端点
│   ├── chat-completions.js # OpenAI 兼容的聊天完成端点
│   ├── config.js          # 配置端点
│   ├── geminiAdapter.js   # Gemini 到 OpenAI 格式转换
│   ├── models.js          # 模型列表端点
│   └── verify.js          # API 密钥验证端点
├── index.html             # 前端聊天界面
├── package.json           # 项目配置
├── vercel.json            # Vercel 配置
└── README.md              # 项目说明
```

## 环境变量

- `API_KEY` - Gemini API 密钥（必需）
- `PROMPT` - 自定义系统提示词（可选）

## 本地开发

1. 克隆仓库
```bash
git clone https://github.com/yourusername/xiaowei-agent.git
cd xiaowei-agent
```

2. 安装 Vercel CLI
```bash
npm install -g vercel
```

3. 安装依赖
```bash
npm install
```

4. 创建 `.env` 文件并设置环境变量
```
API_KEY=your_gemini_api_key_here
PROMPT=你是一个有用的助手。请提供简洁、准确的回答。
```

5. 启动本地开发服务器
```bash
vercel dev
```

## 安全注意事项

- API 密钥存储在 Vercel 环境变量中，不应在代码中硬编码
- 前端不直接显示完整 API 密钥
- 所有 API 请求都会验证密钥

## 许可证

MIT
