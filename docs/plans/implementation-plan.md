# SUMM Console - 实现计划

**版本:** 1.0
**日期:** 2025年2月
**状态:** 待审核
**项目类型:** 从零开始的全栈 Web 应用

---

## 1. 项目概述

### 1.1 项目目标

构建 SUMM Console - 一个用于管理和交互 SUMM AI 代理系统的 Web 控制台，包含：
- 前端：React 18 + Vite + TypeScript + xterm.js
- 后端：Fastify + WebSocket + 文件系统持久化
- 集成：与 Claude Daemon 的命令行交互

### 1.2 核心功能模块

1. **TODO 管理**：创建、更新、排序、附件管理、归档
2. **草稿编辑**：自动保存的文本编辑器
3. **SUMM 交互**：基于 xterm.js 的终端界面，WebSocket 双向通信
4. **工作计划展示**：Markdown 渲染显示
5. **Session 管理**：列表展示、状态监控、独立终端连接
6. **进展跟踪**：今日进展展示与归档
7. **Token 监控**：使用量展示

### 1.3 技术栈总览

**前端：**
- React 18 + TypeScript
- Vite (构建工具)
- xterm.js + xterm-addon-fit (终端)
- @dnd-kit/core + @dnd-kit/sortable (拖拽)
- react-markdown (Markdown 渲染)
- CSS Modules (样式)

**后端：**
- Fastify (Web 框架)
- ws (WebSocket)
- @fastify/multipart (文件上传)
- @fastify/cors (跨域)
- child_process (进程交互)

**运行依赖：**
- Node.js 18+
- tmux 3.0+
- Claude Daemon (summ-daemon)

---

## 2. 项目结构设计

```
SUMM-Console/
├── src/
│   ├── client/                 # 前端代码
│   │   ├── main.tsx           # 入口文件
│   │   ├── App.tsx            # 根组件
│   │   ├── api.ts             # API 封装
│   │   ├── hooks/             # 自定义 Hooks
│   │   │   ├── useTodos.ts
│   │   │   ├── useDraft.ts
│   │   │   ├── useTerminal.ts
│   │   │   ├── useSessions.ts
│   │   │   ├── useProgress.ts
│   │   │   └── useTokenUsage.ts
│   │   ├── components/        # React 组件
│   │   │   ├── layout/
│   │   │   │   ├── MainGrid.tsx
│   │   │   │   ├── Panel.tsx
│   │   │   │   └── TitleBar.tsx
│   │   │   ├── TodoPanel.tsx
│   │   │   ├── DraftPanel.tsx
│   │   │   ├── ChatPanel.tsx
│   │   │   ├── DisplayPanel.tsx
│   │   │   ├── SessionsPanel.tsx
│   │   │   ├── ProgressPanel.tsx
│   │   │   ├── TokenPanel.tsx
│   │   │   └── modals/
│   │   │       ├── TodoFilesModal.tsx
│   │   │       └── SessionTerminalModal.tsx
│   │   └── styles/            # 样式文件
│   │       ├── variables.css
│   │       └── global.css
│   ├── server/                # 后端代码
│   │   ├── index.ts          # 服务器入口
│   │   ├── config.ts         # 配置管理
│   │   ├── daemon.ts         # Claude Daemon 交互封装
│   │   ├── storage.ts        # 文件系统操作封装
│   │   ├── routes/           # REST API 路由
│   │   │   ├── todos.ts
│   │   │   ├── draft.ts
│   │   │   ├── progress.ts
│   │   │   ├── plan.ts
│   │   │   ├── sessions.ts
│   │   │   └── token.ts
│   │   └── ws/               # WebSocket 处理
│   │       └── terminal.ts
│   └── shared/               # 前后端共享
│       └── types.ts          # TypeScript 类型定义
├── SUMM/                     # 运行时数据目录
│   ├── todos/
│   ├── draft.txt
│   ├── progress.json
│   ├── plan.md
│   ├── sessions/
│   └── archive/
├── public/                   # 静态资源
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
└── README.md
```

---

## 3. 实现阶段划分

### 阶段概览

| 阶段 | 名称 | 预估工作量 | 依赖 |
|-----|------|----------|------|
| Phase 0 | 项目初始化与脚手架 | 基础 | 无 |
| Phase 1 | 后端核心框架 | 中等 | Phase 0 |
| Phase 2 | 前端基础框架 | 中等 | Phase 0 |
| Phase 3 | TODO 功能实现 | 中等 | Phase 1, 2 |
| Phase 4 | 终端交互实现 | 复杂 | Phase 1, 2 |
| Phase 5 | Session 管理实现 | 复杂 | Phase 1, 2, 4 |
| Phase 6 | 其他功能模块 | 中等 | Phase 1, 2 |
| Phase 7 | 集成测试与优化 | 中等 | Phase 3-6 |
| Phase 8 | 部署准备 | 基础 | Phase 7 |

---

## 4. Phase 0: 项目初始化与脚手架

### 4.1 目标

搭建项目基础结构，配置开发环境，确保前后端可以独立运行。

### 4.2 任务清单

#### 4.2.1 项目初始化

- [ ] 初始化 Git 仓库
- [ ] 创建 `.gitignore` 文件（排除 `node_modules/`, `dist/`, `SUMM/`, `.env`）
- [ ] 初始化 `package.json`
- [ ] 配置 npm scripts（dev, build, start, dev:client, dev:server）

#### 4.2.2 TypeScript 配置

- [ ] 创建根 `tsconfig.json`（基础配置）
- [ ] 创建 `tsconfig.node.json`（服务端配置）
- [ ] 在 `src/client` 创建 `tsconfig.json`（客户端配置）

#### 4.2.3 依赖安装

**开发依赖：**
```bash
npm install -D typescript @types/node vite @vitejs/plugin-react
npm install -D @types/react @types/react-dom
npm install -D tsx nodemon
```

**前端依赖：**
```bash
npm install react react-dom
npm install xterm xterm-addon-fit
npm install @dnd-kit/core @dnd-kit/sortable
npm install react-markdown
```

**后端依赖：**
```bash
npm install fastify @fastify/cors @fastify/multipart
npm install ws @types/ws
```

#### 4.2.4 Vite 配置

- [ ] 创建 `vite.config.ts`
- [ ] 配置前端入口：`src/client/main.tsx`
- [ ] 配置代理：`/api` 和 `/ws` 代理到后端端口
- [ ] 配置构建输出目录

#### 4.2.5 目录结构创建

- [ ] 创建 `src/client/` 目录及子目录
- [ ] 创建 `src/server/` 目录及子目录
- [ ] 创建 `src/shared/` 目录
- [ ] 创建 `public/` 目录
- [ ] 创建 `SUMM/` 数据目录结构

#### 4.2.6 环境变量配置

- [ ] 创建 `.env.example` 文件
- [ ] 定义环境变量：
  - `PORT=3000`
  - `SUMM_DIR=./SUMM`
  - `SUMM_WORK_DIR=/path/to/workspace`
  - `ANTHROPIC_API_KEY=`

#### 4.2.7 基础文件创建

- [ ] 创建 `src/client/main.tsx`（空白 React 入口）
- [ ] 创建 `src/client/App.tsx`（空白根组件）
- [ ] 创建 `src/server/index.ts`（空白 Fastify 服务器）
- [ ] 创建 `src/shared/types.ts`（基础类型定义）
- [ ] 创建 `public/index.html`

### 4.3 验收标准

- [ ] `npm run dev:client` 可启动前端开发服务器
- [ ] `npm run dev:server` 可启动后端服务器
- [ ] 前端可访问 `http://localhost:5173`
- [ ] 后端可访问 `http://localhost:3000`
- [ ] TypeScript 编译无错误

---

## 5. Phase 1: 后端核心框架

### 5.1 目标

搭建 Fastify 服务器基础架构，实现配置管理、文件系统操作封装、Claude Daemon 交互封装。

### 5.2 任务清单

#### 5.2.1 共享类型定义 (`src/shared/types.ts`)

- [ ] 定义 `Todo` 类型
- [ ] 定义 `TodoFile` 类型
- [ ] 定义 `Draft` 类型
- [ ] 定义 `ProgressItem` 类型
- [ ] 定义 `Session` 类型
- [ ] 定义 `TokenUsage` 类型
- [ ] 定义 API 响应类型（`ApiResponse<T>`）
- [ ] 定义 WebSocket 消息类型

#### 5.2.2 配置管理 (`src/server/config.ts`)

- [ ] 实现环境变量读取
- [ ] 定义配置接口 `Config`
- [ ] 导出配置对象（PORT, SUMM_DIR, SUMM_WORK_DIR, ANTHROPIC_API_KEY）
- [ ] 添加配置验证逻辑

#### 5.2.3 文件系统操作封装 (`src/server/storage.ts`)

- [ ] 实现 `ensureSummDir()` - 确保 SUMM 目录结构存在
- [ ] 实现 `readTodos()` - 读取所有 TODO
- [ ] 实现 `readTodo(id)` - 读取单个 TODO
- [ ] 实现 `writeTodo(todo)` - 写入 TODO
- [ ] 实现 `deleteTodo(id)` - 删除 TODO
- [ ] 实现 `archiveTodo(id)` - 归档 TODO
- [ ] 实现 `readDraft()` - 读取草稿
- [ ] 实现 `writeDraft(content)` - 写入草稿
- [ ] 实现 `readProgress()` - 读取进展
- [ ] 实现 `archiveProgress()` - 归档进展
- [ ] 实现 `readPlan()` - 读取工作计划
- [ ] 添加错误处理和路径安全检查

#### 5.2.4 Claude Daemon 交互封装 (`src/server/daemon.ts`)

- [ ] 实现 `checkDaemonRunning()` - 检查 daemon 是否运行
- [ ] 实现 `startSession(cli, init, name?)` - 启动新 Session
- [ ] 实现 `listSessions(status?)` - 列出 Session
- [ ] 实现 `getSessionStatus(id)` - 查询 Session 状态
- [ ] 实现 `attachSession(id)` - 连接 Session（返回子进程）
- [ ] 实现 `injectMessage(id, message)` - 注入消息
- [ ] 实现 `stopSession(id)` - 停止 Session
- [ ] 添加错误码映射（E001-E009）
- [ ] 添加命令执行超时处理

#### 5.2.5 Fastify 服务器基础 (`src/server/index.ts`)

- [ ] 初始化 Fastify 实例
- [ ] 注册 @fastify/cors 插件
- [ ] 注册 @fastify/multipart 插件（限制 50MB）
- [ ] 添加全局错误处理器
- [ ] 添加请求日志
- [ ] 实现服务器启动逻辑
- [ ] 添加优雅关闭处理

### 5.3 验收标准

- [ ] 服务器可正常启动并监听端口
- [ ] 配置可正确读取环境变量
- [ ] 文件系统操作可正确读写 SUMM 目录
- [ ] Daemon 交互封装可执行基本命令
- [ ] 错误处理正常工作

---

## 6. Phase 2: 前端基础框架

### 6.1 目标

搭建 React 应用基础架构，实现布局系统、API 封装、基础样式。

### 6.2 任务清单

#### 6.2.1 样式系统 (`src/client/styles/`)

- [ ] 创建 `variables.css` - 定义 CSS 变量（颜色、字体、间距）
- [ ] 创建 `global.css` - 全局样式（复古科技风）
- [ ] 实现扫描线效果（scanline overlay）
- [ ] 实现滚动条样式
- [ ] 实现动画效果（pulse, blink, fadeIn）

#### 6.2.2 API 封装 (`src/client/api.ts`)

- [ ] 实现 `fetchTodos()` - GET /api/todos
- [ ] 实现 `createTodo(todo)` - POST /api/todos
- [ ] 实现 `updateTodo(id, updates)` - PUT /api/todos/:id
- [ ] 实现 `deleteTodo(id)` - DELETE /api/todos/:id
- [ ] 实现 `archiveTodo(id)` - POST /api/todos/:id/archive
- [ ] 实现 `uploadTodoFile(id, file)` - POST /api/todos/:id/files
- [ ] 实现 `deleteTodoFile(id, fileId)` - DELETE /api/todos/:id/files/:fileId
- [ ] 实现 `fetchDraft()` - GET /api/draft
- [ ] 实现 `saveDraft(content)` - PUT /api/draft
- [ ] 实现 `fetchProgress()` - GET /api/progress
- [ ] 实现 `archiveProgress()` - POST /api/progress/archive
- [ ] 实现 `fetchPlan()` - GET /api/plan
- [ ] 实现 `fetchSessions()` - GET /api/sessions
- [ ] 实现 `fetchTokenUsage()` - GET /api/token-usage
- [ ] 添加统一错误处理

#### 6.2.3 布局组件 (`src/client/components/layout/`)

- [ ] 实现 `TitleBar.tsx` - 顶部标题栏
- [ ] 实现 `Panel.tsx` - 通用面板容器组件
- [ ] 实现 `MainGrid.tsx` - 3列3行网格布局

#### 6.2.4 根组件 (`src/client/App.tsx`)

- [ ] 导入全局样式
- [ ] 实现基础布局结构
- [ ] 集成 TitleBar 和 MainGrid
- [ ] 添加占位面板（用于测试布局）

#### 6.2.5 入口文件 (`src/client/main.tsx`)

- [ ] 导入 React 和 ReactDOM
- [ ] 渲染 App 组件到 DOM

### 6.3 验收标准

- [ ] 前端页面可正常显示
- [ ] 3列3行网格布局正确
- [ ] 复古科技风样式生效
- [ ] API 封装可正常调用后端接口
- [ ] 无 TypeScript 编译错误

---

## 7. Phase 3: TODO 功能实现

### 7.1 目标

实现完整的 TODO 管理功能，包括前端组件、后端 API、文件上传。

### 7.2 任务清单

#### 7.2.1 后端 TODO API (`src/server/routes/todos.ts`)

- [ ] 实现 GET /api/todos - 获取 TODO 列表
- [ ] 实现 POST /api/todos - 创建 TODO
- [ ] 实现 GET /api/todos/:id - 获取单个 TODO
- [ ] 实现 PUT /api/todos/:id - 更新 TODO
- [ ] 实现 DELETE /api/todos/:id - 删除 TODO
- [ ] 实现 POST /api/todos/:id/archive - 归档 TODO
- [ ] 实现 GET /api/todos/:id/files - 获取文件列表
- [ ] 实现 POST /api/todos/:id/files - 上传文件
- [ ] 实现 DELETE /api/todos/:id/files/:fileId - 删除文件
- [ ] 添加文件大小限制（50MB）
- [ ] 添加路径安全检查

#### 7.2.2 前端 TODO Hook (`src/client/hooks/useTodos.ts`)

- [ ] 实现 TODO 列表状态管理
- [ ] 实现 5s 轮询逻辑
- [ ] 实现创建 TODO 方法
- [ ] 实现更新 TODO 方法
- [ ] 实现删除 TODO 方法
- [ ] 实现归档 TODO 方法
- [ ] 实现拖拽排序更新方法
- [ ] 添加加载状态和错误处理

#### 7.2.3 前端 TODO 组件 (`src/client/components/TodoPanel.tsx`)

- [ ] 实现 TODO 列表渲染
- [ ] 实现拖拽排序（@dnd-kit）
- [ ] 显示标题、进度、状态描述
- [ ] 实现点击打开文件管理弹窗
- [ ] 添加加载和错误状态显示

#### 7.2.4 文件管理弹窗 (`src/client/components/modals/TodoFilesModal.tsx`)

- [ ] 实现弹窗基础结构
- [ ] 显示已关联文件列表
- [ ] 实现文件上传（拖拽 + 点击）
- [ ] 实现文件删除
- [ ] 显示文件名、大小、上传时间
- [ ] 添加上传进度显示
- [ ] 添加错误提示

### 7.3 验收标准

- [ ] 可创建、更新、删除 TODO
- [ ] TODO 列表可拖拽排序
- [ ] 可上传和删除 TODO 附件
- [ ] 文件正确存储在 SUMM/todos/{id}/files/
- [ ] 轮询正常工作
- [ ] 错误处理正常

---

## 8. Phase 4: 终端交互实现

### 8.1 目标

实现 SUMM 主代理终端交互，包括 WebSocket 通信、xterm.js 集成、待决策提示。

### 8.2 任务清单

#### 8.2.1 后端 WebSocket 终端代理 (`src/server/ws/terminal.ts`)

- [ ] 实现 WebSocket 服务器初始化
- [ ] 实现 `/ws/terminal/summ` 路由处理
- [ ] 实现 SUMM 主代理启动/连接逻辑
- [ ] 实现 stdin/stdout 双向转发
- [ ] 实现 `input` 消息处理（写入 stdin）
- [ ] 实现 `resize` 消息处理（终端尺寸调整）
- [ ] 实现 `output` 消息推送（从 stdout/stderr）
- [ ] 实现 `status` 消息推送（连接状态、待决策检测）
- [ ] 实现待决策检测逻辑（基于输出模式匹配）
- [ ] 实现连接关闭处理（不终止进程）
- [ ] 添加错误处理和重连机制

#### 8.2.2 前端终端 Hook (`src/client/hooks/useTerminal.ts`)

- [ ] 实现 WebSocket 连接管理
- [ ] 实现 xterm.js 实例创建和配置
- [ ] 实现消息发送方法（input, resize）
- [ ] 实现消息接收处理（output, status）
- [ ] 实现终端尺寸自适应
- [ ] 实现连接状态管理
- [ ] 实现待决策状态管理
- [ ] 添加重连逻辑

#### 8.2.3 前端 SUMM 交互组件 (`src/client/components/ChatPanel.tsx`)

- [ ] 实现 xterm.js 容器渲染
- [ ] 集成 useTerminal hook
- [ ] 实现终端初始化和挂载
- [ ] 实现待决策标识显示（闪烁动画）
- [ ] 实现终端尺寸自适应（xterm-addon-fit）
- [ ] 添加连接状态显示
- [ ] 添加错误提示

### 8.3 验收标准

- [ ] 打开页面时自动连接 SUMM 主代理
- [ ] 终端可双向通信（输入输出正常）
- [ ] 待决策提示正常显示和消失
- [ ] 终端尺寸自适应窗口变化
- [ ] 连接断开后可自动重连
- [ ] 关闭页面不终止 SUMM 进程

---

## 9. Phase 5: Session 管理实现

### 9.1 目标

实现 Session 列表展示、状态监控、独立终端连接。

### 9.2 任务清单

#### 9.2.1 后端 Session API (`src/server/routes/sessions.ts`)

- [ ] 实现 GET /api/sessions - 获取 Session 列表
- [ ] 调用 daemon.listSessions() 获取数据
- [ ] 过滤掉挂起/暂停状态的 Session
- [ ] 限制返回最多 20 个 Session
- [ ] 支持 status 参数过滤（running/idle/stopped）
- [ ] 添加错误处理（E007 daemon 未运行）

#### 9.2.2 后端 Session 终端代理 (`src/server/ws/terminal.ts`)

- [ ] 实现 `/ws/terminal/session/:id` 路由处理
- [ ] 实现 Session 连接逻辑（attachSession）
- [ ] 实现 stdin/stdout 双向转发
- [ ] 实现消息处理（input, resize, output, status）
- [ ] 添加 Session 不存在/已停止错误处理

#### 9.2.3 前端 Sessions Hook (`src/client/hooks/useSessions.ts`)

- [ ] 实现 Session 列表状态管理
- [ ] 实现 3s 轮询逻辑
- [ ] 实现 Session 过滤逻辑
- [ ] 添加加载状态和错误处理

#### 9.2.4 前端 Sessions 组件 (`src/client/components/SessionsPanel.tsx`)

- [ ] 实现 Session 列表渲染
- [ ] 显示名称、目录、任务、状态标签
- [ ] 实现任务描述截断和悬停显示
- [ ] 实现点击打开终端弹窗/新窗口
- [ ] 添加滚动支持
- [ ] 添加加载和错误状态显示

#### 9.2.5 Session 终端弹窗 (`src/client/components/modals/SessionTerminalModal.tsx`)

- [ ] 实现弹窗/新窗口基础结构
- [ ] 集成 useTerminal hook（连接指定 Session）
- [ ] 实现 xterm.js 终端渲染
- [ ] 实现关闭处理（不终止 Session）
- [ ] 添加连接状态显示

### 9.3 验收标准

- [ ] Session 列表正常显示
- [ ] 3s 轮询正常工作
- [ ] 点击 Session 可打开独立终端
- [ ] Session 终端可双向通信
- [ ] 关闭终端不终止 Session 进程
- [ ] 状态标签颜色正确（running 绿色 / idle 琥珀色）

---

## 10. Phase 6: 其他功能模块

### 10.1 目标

实现草稿、工作计划、进展、Token 等其他功能模块。

### 10.2 任务清单

#### 10.2.1 草稿功能

**后端 (`src/server/routes/draft.ts`)：**
- [ ] 实现 GET /api/draft - 读取草稿
- [ ] 实现 PUT /api/draft - 保存草稿

**前端 Hook (`src/client/hooks/useDraft.ts`)：**
- [ ] 实现草稿状态管理
- [ ] 实现自动保存逻辑（输入停止 1s 后）
- [ ] 实现字符数统计

**前端组件 (`src/client/components/DraftPanel.tsx`)：**
- [ ] 实现文本编辑器
- [ ] 显示字符数
- [ ] 显示保存状态指示器

#### 10.2.2 工作计划功能

**后端 (`src/server/routes/plan.ts`)：**
- [ ] 实现 GET /api/plan - 读取工作计划

**前端 Hook (`src/client/hooks/usePlan.ts`)：**
- [ ] 实现工作计划状态管理
- [ ] 实现 10s 轮询逻辑

**前端组件 (`src/client/components/DisplayPanel.tsx`)：**
- [ ] 实现 Markdown 渲染（react-markdown）
- [ ] 实现 Tab 栏（预留多文档切换）
- [ ] 添加滚动支持

#### 10.2.3 进展功能

**后端 (`src/server/routes/progress.ts`)：**
- [ ] 实现 GET /api/progress - 读取进展
- [ ] 实现 POST /api/progress/archive - 归档进展

**前端 Hook (`src/client/hooks/useProgress.ts`)：**
- [ ] 实现进展列表状态管理
- [ ] 实现 10s 轮询逻辑
- [ ] 实现归档方法

**前端组件 (`src/client/components/ProgressPanel.tsx`)：**
- [ ] 实现进展列表渲染
- [ ] 显示时间、描述、完成标记
- [ ] 实现归档按钮

#### 10.2.4 Token 功能

**后端 (`src/server/routes/token.ts`)：**
- [ ] 实现 GET /api/token-usage - 查询 Token 使用
- [ ] 实现方案 A：调用 Anthropic API
- [ ] 实现方案 B：读取本地缓存文件（推荐）
- [ ] 添加错误处理

**前端 Hook (`src/client/hooks/useTokenUsage.ts`)：**
- [ ] 实现 Token 使用状态管理
- [ ] 实现 60s 轮询逻辑

**前端组件 (`src/client/components/TokenPanel.tsx`)：**
- [ ] 实现进度条渲染
- [ ] 显示百分比数值
- [ ] 实现分段式进度条

### 10.3 验收标准

- [ ] 草稿自动保存正常工作
- [ ] 工作计划 Markdown 正确渲染
- [ ] 进展列表正常显示和归档
- [ ] Token 使用量正确显示
- [ ] 所有轮询正常工作

---

## 11. Phase 7: 集成测试与优化

### 11.1 目标

进行端到端测试，修复问题，优化性能和用户体验。

### 11.2 任务清单

#### 11.2.1 功能测试

- [ ] 测试 TODO 完整流程（创建、更新、排序、附件、归档）
- [ ] 测试草稿自动保存
- [ ] 测试 SUMM 终端交互（输入输出、待决策提示）
- [ ] 测试 Session 列表和独立终端
- [ ] 测试工作计划显示
- [ ] 测试进展归档
- [ ] 测试 Token 显示
- [ ] 测试所有轮询机制

#### 11.2.2 错误处理测试

- [ ] 测试 daemon 未运行场景（E007）
- [ ] 测试 Session 不存在场景（E002）
- [ ] 测试文件上传失败场景
- [ ] 测试网络断开重连
- [ ] 测试 API 错误响应处理

#### 11.2.3 性能优化

- [ ] 优化轮询频率（避免过度请求）
- [ ] 添加 React.memo 优化组件渲染
- [ ] 优化 WebSocket 消息处理
- [ ] 优化文件上传性能
- [ ] 检查内存泄漏

#### 11.2.4 用户体验优化

- [ ] 添加加载状态指示器
- [ ] 添加错误提示信息
- [ ] 优化终端响应速度
- [ ] 优化拖拽交互体验
- [ ] 添加键盘快捷键（可选）

#### 11.2.5 代码质量

- [ ] 代码格式化和 lint 检查
- [ ] 添加必要的注释
- [ ] 清理未使用的代码
- [ ] 统一错误处理模式
- [ ] 统一日志输出格式

### 11.3 验收标准

- [ ] 所有核心功能正常工作
- [ ] 错误处理完善
- [ ] 性能满足要求（无明显卡顿）
- [ ] 用户体验流畅
- [ ] 代码质量达标

---

## 12. Phase 8: 部署准备

### 12.1 目标

准备生产环境部署，编写文档，配置部署脚本。

### 12.2 任务清单

#### 12.2.1 构建配置

- [ ] 配置生产环境构建（`npm run build`）
- [ ] 优化构建输出（代码分割、压缩）
- [ ] 配置静态资源路径
- [ ] 测试生产构建

#### 12.2.2 部署文档

- [ ] 编写 README.md（项目介绍、功能说明）
- [ ] 编写安装文档（依赖、环境要求）
- [ ] 编写配置文档（环境变量说明）
- [ ] 编写运行文档（启动、停止、日志）
- [ ] 编写故障排查文档（常见问题）

#### 12.2.3 部署脚本

- [ ] 创建启动脚本（start.sh）
- [ ] 创建停止脚本（stop.sh）
- [ ] 创建健康检查脚本（health-check.sh）
- [ ] 配置 systemd service 文件（可选）

#### 12.2.4 环境检查

- [ ] 检查 Node.js 版本要求
- [ ] 检查 tmux 安装
- [ ] 检查 Claude Daemon 安装和运行
- [ ] 检查 SUMM CLI 可用性
- [ ] 检查端口占用

#### 12.2.5 安全配置

- [ ] 配置 CORS 白名单
- [ ] 配置文件上传限制
- [ ] 配置环境变量保护（.env 不提交）
- [ ] 添加 API 访问日志

### 12.3 验收标准

- [ ] 生产构建成功
- [ ] 文档完整清晰
- [ ] 部署脚本可用
- [ ] 环境检查通过
- [ ] 安全配置到位

---

## 13. 关键依赖与风险

### 13.1 外部依赖

| 依赖项 | 版本要求 | 风险等级 | 缓解措施 |
|-------|---------|---------|---------|
| Node.js | 18+ | 低 | 明确版本要求，提供安装指南 |
| tmux | 3.0+ | 中 | 提供安装检查脚本，文档说明 |
| Claude Daemon | 最新版 | 高 | 提前测试集成，明确 API 契约 |
| SUMM CLI | 最新版 | 高 | 提前测试命令行交互，错误处理 |

### 13.2 技术风险

1. **WebSocket 稳定性**：终端交互依赖 WebSocket，需要处理断线重连
2. **进程管理**：Daemon 进程管理的可靠性需要充分测试
3. **文件系统操作**：并发读写可能导致数据不一致
4. **轮询性能**：多个轮询可能影响性能，需要优化

### 13.3 实现风险

1. **Phase 4 复杂度高**：终端交互实现较复杂，可能需要更多时间
2. **Phase 5 依赖 Daemon**：Session 管理依赖 Daemon 稳定性
3. **待决策检测**：基于输出模式匹配可能不够准确

---

## 14. 成功标准

### 14.1 功能完整性

- [ ] 所有 PRD 定义的功能已实现
- [ ] 所有 API 端点正常工作
- [ ] WebSocket 通信稳定
- [ ] 文件上传下载正常

### 14.2 性能指标

- [ ] 页面加载时间 < 2s
- [ ] API 响应时间 < 500ms
- [ ] WebSocket 延迟 < 100ms
- [ ] 文件上传速度合理（取决于网络）

### 14.3 稳定性指标

- [ ] 无内存泄漏
- [ ] 长时间运行稳定
- [ ] 错误恢复机制有效
- [ ] 日志完整可追溯

### 14.4 用户体验

- [ ] 界面响应流畅
- [ ] 错误提示清晰
- [ ] 操作符合直觉
- [ ] 视觉风格统一

---

## 15. 下一步行动

### 15.1 立即开始

1. **Phase 0 项目初始化**：创建项目结构，安装依赖
2. **环境准备**：确保 Claude Daemon 和 SUMM CLI 可用
3. **技术验证**：验证关键技术点（WebSocket、Daemon 交互）

### 15.2 并行开发建议

- Phase 1（后端核心）和 Phase 2（前端基础）可以并行开发
- Phase 3-6 的各个功能模块可以并行开发（在 Phase 1-2 完成后）

### 15.3 里程碑检查点

1. **M1 - 基础框架完成**（Phase 0-2）：前后端可独立运行
2. **M2 - 核心功能完成**（Phase 3-4）：TODO 和终端交互可用
3. **M3 - 功能完整**（Phase 5-6）：所有功能模块实现
4. **M4 - 可发布**（Phase 7-8）：测试通过，文档完整

---

## 16. 附录

### 16.1 参考文档

- `SUMM-Console-PRD-v1.0.md` - 产品需求文档
- `backend-codex-design.md` - 后端设计文档
- `frontend-codex-design.md` - 前端设计文档
- `summ-ui-v1.0.html` - UI 参考实现

### 16.2 关键技术文档

- [Fastify 官方文档](https://www.fastify.io/)
- [React 官方文档](https://react.dev/)
- [xterm.js 文档](https://xtermjs.org/)
- [Vite 文档](https://vitejs.dev/)

### 16.3 约定与规范

- **代码风格**：使用 ESLint + Prettier
- **提交规范**：使用 Conventional Commits
- **分支策略**：main（生产）、develop（开发）、feature/*（功能）
- **命名规范**：
  - 组件：PascalCase（如 `TodoPanel.tsx`）
  - 文件：kebab-case（如 `use-todos.ts`）
  - 变量：camelCase（如 `todoList`）

---

**计划编写完成日期**：2025年2月
**计划状态**：待审核
**下一步**：等待审核批准后开始 Phase 0 实施

