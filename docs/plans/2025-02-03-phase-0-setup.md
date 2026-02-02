# Phase 0: 项目初始化与脚手架 - 详细实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**目标：** 搭建 SUMM Console 项目基础结构，配置开发环境

**架构：** 前后端同仓 monorepo，使用 Vite 构建前端，Fastify 运行后端

**技术栈：** React 18 + TypeScript + Vite + Fastify + WebSocket

---

## Task 1: 初始化 Git 仓库

**文件：** 项目根目录

### Step 1: 检查当前目录

运行：
```bash
pwd
ls -la
```

预期：显示 `/data/dev/SUMM-Console` 目录，包含 `docs/` 和 `summ-ui-v1.0.html`

### Step 2: 初始化 Git（如果未初始化）

运行：
```bash
git status
```

预期：如果显示 "not a git repository"，则运行：
```bash
git init
```

如果已经是 git 仓库，跳过此步骤。

### Step 3: 创建 .gitignore 文件

创建：`.gitignore`

```gitignore
# Dependencies
node_modules/

# Build outputs
dist/
build/

# Runtime data
SUMM/

# Environment variables
.env
.env.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Testing
coverage/
.nyc_output/
```

### Step 4: 提交 .gitignore

运行：
```bash
git add .gitignore
git commit -m "chore: add .gitignore

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

预期：提交成功

---

## Task 2: 初始化 package.json

**文件：** `package.json`

### Step 1: 创建 package.json

创建：`package.json`

```json
{
  "name": "summ-console",
  "version": "0.1.0",
  "description": "SUMM Console - Web interface for SUMM AI agent system",
  "type": "module",
  "scripts": {
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
    "dev:client": "vite",
    "dev:server": "tsx watch src/server/index.ts",
    "build": "npm run build:client && npm run build:server",
    "build:client": "vite build",
    "build:server": "tsc -p tsconfig.node.json",
    "start": "node dist/server/index.js",
    "preview": "vite preview"
  },
  "keywords": ["summ", "console", "ai", "agent"],
  "author": "",
  "license": "MIT"
}
```

### Step 2: 提交 package.json

运行：
```bash
git add package.json
git commit -m "chore: initialize package.json

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

预期：提交成功

---

## Task 3: 安装开发依赖

**文件：** `package.json`（自动更新）

### Step 1: 安装 TypeScript 和构建工具

运行：
```bash
npm install -D typescript @types/node vite @vitejs/plugin-react
```

预期：安装成功，`package.json` 中出现 devDependencies

### Step 2: 安装 React 类型定义

运行：
```bash
npm install -D @types/react @types/react-dom
```

预期：安装成功

### Step 3: 安装开发工具

运行：
```bash
npm install -D tsx nodemon concurrently
```

预期：安装成功

### Step 4: 提交依赖变更

运行：
```bash
git add package.json package-lock.json
git commit -m "chore: install dev dependencies

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

预期：提交成功

---

## Task 4: 安装前端依赖

**文件：** `package.json`（自动更新）

### Step 1: 安装 React

运行：
```bash
npm install react react-dom
```

预期：安装成功

### Step 2: 安装终端库

运行：
```bash
npm install xterm xterm-addon-fit
```

预期：安装成功

### Step 3: 安装拖拽库

运行：
```bash
npm install @dnd-kit/core @dnd-kit/sortable
```

预期：安装成功

### Step 4: 安装 Markdown 渲染库

运行：
```bash
npm install react-markdown
```

预期：安装成功

### Step 5: 提交依赖变更

运行：
```bash
git add package.json package-lock.json
git commit -m "chore: install frontend dependencies

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

预期：提交成功

---

## Task 5: 安装后端依赖

**文件：** `package.json`（自动更新）

### Step 1: 安装 Fastify

运行：
```bash
npm install fastify @fastify/cors @fastify/multipart
```

预期：安装成功

### Step 2: 安装 WebSocket

运行：
```bash
npm install ws
npm install -D @types/ws
```

预期：安装成功

### Step 3: 提交依赖变更

运行：
```bash
git add package.json package-lock.json
git commit -m "chore: install backend dependencies

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

预期：提交成功

---

## Task 6: 配置 TypeScript（根配置）

**文件：** `tsconfig.json`

### Step 1: 创建根 tsconfig.json

创建：`tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src/client", "src/shared"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### Step 2: 提交配置

运行：
```bash
git add tsconfig.json
git commit -m "chore: add root TypeScript config

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

预期：提交成功

---

## Task 7: 配置 TypeScript（服务端）

**文件：** `tsconfig.node.json`

### Step 1: 创建 tsconfig.node.json

创建：`tsconfig.node.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "outDir": "./dist/server",
    "rootDir": "./src/server",
    "strict": true,
    "esModuleInterop": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src/server", "src/shared"]
}
```

### Step 2: 提交配置

运行：
```bash
git add tsconfig.node.json
git commit -m "chore: add server TypeScript config

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

预期：提交成功

---

## Task 8: 配置 Vite

**文件：** `vite.config.ts`

### Step 1: 创建 vite.config.ts

创建：`vite.config.ts`

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  root: './src/client',
  publicDir: '../../public',
  build: {
    outDir: '../../dist/client',
    emptyOutDir: true
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/ws': {
        target: 'ws://localhost:3000',
        ws: true
      }
    }
  }
})
```

### Step 2: 提交配置

运行：
```bash
git add vite.config.ts
git commit -m "chore: add Vite config

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

预期：提交成功

---

## Task 9: 创建目录结构

**文件：** 多个目录

### Step 1: 创建前端目录

运行：
```bash
mkdir -p src/client/components/layout
mkdir -p src/client/components/modals
mkdir -p src/client/hooks
mkdir -p src/client/styles
```

预期：目录创建成功

### Step 2: 创建后端目录

运行：
```bash
mkdir -p src/server/routes
mkdir -p src/server/ws
```

预期：目录创建成功

### Step 3: 创建共享目录

运行：
```bash
mkdir -p src/shared
```

预期：目录创建成功

### Step 4: 创建其他目录

运行：
```bash
mkdir -p public
mkdir -p SUMM/todos
mkdir -p SUMM/archive/todos
mkdir -p SUMM/archive/progress
mkdir -p SUMM/sessions
```

预期：目录创建成功

### Step 5: 验证目录结构

运行：
```bash
tree -L 3 src/
```

预期：显示完整的目录树

---

## Task 10: 创建环境变量配置

**文件：** `.env.example`

### Step 1: 创建 .env.example

创建：`.env.example`

```env
# Server Configuration
PORT=3000

# SUMM Configuration
SUMM_DIR=./SUMM
SUMM_WORK_DIR=/path/to/workspace

# Anthropic API (optional, for token usage)
ANTHROPIC_API_KEY=
```

### Step 2: 提交配置

运行：
```bash
git add .env.example
git commit -m "chore: add environment variables template

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

预期：提交成功

---

## Task 11: 创建共享类型定义

**文件：** `src/shared/types.ts`

### Step 1: 创建基础类型

创建：`src/shared/types.ts`

```typescript
// Todo types
export interface Todo {
  id: string
  title: string
  progress: number
  statusDesc: string
  state: 'pending' | 'working' | 'completed'
  order: number
  files: TodoFile[]
  createdAt: string
  completedAt?: string
}

export interface TodoFile {
  id: string
  name: string
  path: string
  size: number
  uploadedAt: string
}

// Draft types
export interface Draft {
  content: string
  updatedAt: string
}

// Progress types
export interface ProgressItem {
  id: string
  description: string
  completedAt: string
  todoId?: string
}

// Session types
export interface Session {
  id: string
  name: string
  cli: string
  workdir: string
  task: string
  status: 'running' | 'idle' | 'stopped'
  createdAt: string
  lastActivity?: string
}

// Token types
export interface TokenUsage {
  used: number
  limit: number
  percentage: number
}

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// WebSocket message types
export interface WSMessage {
  type: 'input' | 'output' | 'resize' | 'status'
  data?: string
  cols?: number
  rows?: number
  connected?: boolean
  needsDecision?: boolean
}
```

### Step 2: 提交类型定义

运行：
```bash
git add src/shared/types.ts
git commit -m "feat: add shared type definitions

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

预期：提交成功

---

## Task 12: 创建前端入口 HTML

**文件：** `public/index.html`

### Step 1: 创建 index.html

创建：`public/index.html`

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SUMM Console</title>
  <link href="https://fonts.googleapis.com/css2?family=VT323&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/main.tsx"></script>
</body>
</html>
```

### Step 2: 提交 HTML

运行：
```bash
git add public/index.html
git commit -m "feat: add frontend entry HTML

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

预期：提交成功

---

## Task 13: 创建前端入口文件

**文件：** `src/client/main.tsx`

### Step 1: 创建 main.tsx

创建：`src/client/main.tsx`

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

### Step 2: 提交入口文件

运行：
```bash
git add src/client/main.tsx
git commit -m "feat: add frontend entry point

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

预期：提交成功

---

## Task 14: 创建前端根组件

**文件：** `src/client/App.tsx`

### Step 1: 创建 App.tsx

创建：`src/client/App.tsx`

```typescript
import React from 'react'

function App() {
  return (
    <div style={{
      background: '#0a0a12',
      color: '#e0e0e8',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'JetBrains Mono, monospace'
    }}>
      <h1>SUMM Console - Frontend Ready</h1>
    </div>
  )
}

export default App
```

### Step 2: 提交根组件

运行：
```bash
git add src/client/App.tsx
git commit -m "feat: add frontend root component

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

预期：提交成功

---

## Task 15: 创建后端服务器入口

**文件：** `src/server/index.ts`

### Step 1: 创建 index.ts

创建：`src/server/index.ts`

```typescript
import Fastify from 'fastify'
import cors from '@fastify/cors'

const fastify = Fastify({
  logger: true
})

// Register CORS
await fastify.register(cors, {
  origin: true
})

// Health check route
fastify.get('/api/health', async (request, reply) => {
  return { status: 'ok', message: 'SUMM Console Backend Ready' }
})

// Start server
const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3000
    await fastify.listen({ port, host: '0.0.0.0' })
    console.log(`Server listening on http://localhost:${port}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
```

### Step 2: 提交服务器入口

运行：
```bash
git add src/server/index.ts
git commit -m "feat: add backend server entry point

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

预期：提交成功

---

## Task 16: 测试前端启动

**文件：** 无（测试）

### Step 1: 启动前端开发服务器

运行：
```bash
npm run dev:client
```

预期：
- Vite 启动成功
- 显示 "Local: http://localhost:5173/"
- 无编译错误

### Step 2: 访问前端

在浏览器打开：`http://localhost:5173`

预期：显示 "SUMM Console - Frontend Ready"

### Step 3: 停止服务器

按 `Ctrl+C` 停止

---

## Task 17: 测试后端启动

**文件：** 无（测试）

### Step 1: 启动后端开发服务器

运行：
```bash
npm run dev:server
```

预期：
- 显示 "Server listening on http://localhost:3000"
- 无编译错误

### Step 2: 测试健康检查接口

在另一个终端运行：
```bash
curl http://localhost:3000/api/health
```

预期：返回 `{"status":"ok","message":"SUMM Console Backend Ready"}`

### Step 3: 停止服务器

按 `Ctrl+C` 停止

---

## Task 18: 最终验证

**文件：** 无（验证）

### Step 1: 同时启动前后端

运行：
```bash
npm run dev
```

预期：
- 前端和后端同时启动
- 无错误

### Step 2: 验证前端可访问

访问：`http://localhost:5173`

预期：页面正常显示

### Step 3: 验证后端可访问

运行：
```bash
curl http://localhost:3000/api/health
```

预期：返回正常响应

### Step 4: 停止所有服务

按 `Ctrl+C` 停止

### Step 5: 创建最终提交

运行：
```bash
git add -A
git commit -m "chore: Phase 0 complete - project setup finished

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

预期：提交成功

---

## Phase 0 完成标准

- [x] Git 仓库已初始化
- [x] 所有依赖已安装
- [x] TypeScript 配置完成
- [x] Vite 配置完成
- [x] 目录结构已创建
- [x] 前端可独立启动（http://localhost:5173）
- [x] 后端可独立启动（http://localhost:3000）
- [x] 前后端可同时启动
- [x] 无 TypeScript 编译错误
- [x] 所有代码已提交到 Git

---

**下一步：** Phase 1 - 后端核心框架实现
