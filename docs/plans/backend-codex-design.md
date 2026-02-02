# SUMM Console - 后端逻辑设计（Codex 提取版）

**来源依据**：`SUMM-Console-PRD-v1.0.md` 与 `SUMM-Console-Technical-Design-v3.md`  
**目标**：把后端相关逻辑独立成文档，供后端实现与联调使用

---

## 1. 后端范围与职责

后端（Fastify 服务）负责：

- 以 REST API 暴露 TODO、草稿、进展、工作计划、Session 状态等数据
- 以 WebSocket 转发 SUMM/Session 终端的 stdin/stdout
- 管理与 Claude Daemon 的交互（启动/连接 SUMM、列出/连接 Session）
- 进行文件系统持久化（JSON/文本/Markdown/附件）
- 提供 Token 使用情况查询（支持两种方案）

---

## 2. 后端架构与依赖

- **框架**：Fastify
- **WebSocket**：ws
- **文件上传**：@fastify/multipart
- **跨域**：@fastify/cors
- **进程交互**：child_process（spawn/exec）
- **运行依赖**：tmux 3.0+（SUMM daemon 依赖）

服务结构（前后端同仓，SUMM-Console 项目）：

- `src/server/index.ts`：Fastify 启动入口
- `src/server/routes/*`：REST 路由
- `src/server/ws/terminal.ts`：WebSocket 终端代理
- `src/server/daemon.ts`：Claude Daemon 交互封装

统一项目目录结构（关键部分）：

```
SUMM-Console/
├─ src/
│  ├─ client/              # 前端
│  ├─ server/              # 后端
│  └─ shared/              # 前后端共享类型
├─ SUMM/                   # 运行时数据目录（可由 SUMM_DIR 指定）
├─ package.json
└─ vite.config.ts
```

---

## 3. 数据存储约定（文件系统）

**SUMM 数据目录**：`SUMM/`（默认 `./SUMM`，由 `SUMM_DIR` 指定）

```
SUMM/
├─ todos/
│  └─ {todoId}/
│     ├─ meta.json        # TODO 元数据
│     └─ files/           # 附件目录
├─ draft.txt              # 草稿
├─ progress.json          # 今日进展
├─ plan.md                # 工作计划
├─ sessions/              # Session 工作目录（daemon 维护）
└─ archive/
   ├─ todos/
   └─ progress/
```

持久化方式与 PRD 一致：

- TODO：`SUMM/todos/{id}/meta.json`
- TODO 附件：`SUMM/todos/{id}/files/`
- 草稿：`SUMM/draft.txt`
- 今日进展：`SUMM/progress.json`
- 工作计划：`SUMM/plan.md`
- 归档：`SUMM/archive/*`

---

## 4. 数据模型（后端视角）

### 4.1 TODO

- `id: string`
- `title: string`
- `progress: number (0-100)`
- `statusDesc: string`
- `state: 'pending' | 'working' | 'completed'`
- `order: number`
- `files: TodoFile[]`
- `createdAt: string (ISO)`
- `completedAt?: string (ISO)`

### 4.2 TODO 文件

- `id: string`
- `name: string`
- `path: string`（存储路径，后端内部使用）
- `size: number`
- `uploadedAt: string (ISO)`

### 4.3 草稿

- `content: string`
- `updatedAt: string (ISO)`

### 4.4 今日进展

- `id: string`
- `description: string`
- `completedAt: string (ISO)`
- `todoId?: string`

### 4.5 Session

- `id: string`（例如 `session_001`）
- `name: string`
- `cli: string`
- `workdir: string`
- `task: string`
- `status: 'running' | 'idle' | 'stopped'`
- `createdAt: string (ISO)`
- `lastActivity?: string (ISO)`

### 4.6 Token Usage

- `used: number`
- `limit: number`
- `percentage: number`

---

## 5. REST API 设计

**总览**（与 PRD / 技术设计一致）：

```
GET    /api/todos
POST   /api/todos
GET    /api/todos/:id
PUT    /api/todos/:id
DELETE /api/todos/:id
POST   /api/todos/:id/archive
GET    /api/todos/:id/files
POST   /api/todos/:id/files
DELETE /api/todos/:id/files/:fileId

GET    /api/draft
PUT    /api/draft

GET    /api/progress
POST   /api/progress/archive

GET    /api/plan

GET    /api/sessions

GET    /api/token-usage
```

### 5.1 TODO 管理

- **创建 TODO**：创建 `todos/{id}/meta.json`，初始化 `files` 为空数组
- **更新 TODO**：更新 `meta.json`（支持进度、状态描述、排序等）
- **删除 TODO**：删除目录或移动到归档
- **归档 TODO**：移动 `meta.json` 与附件到 `archive/todos/{id}`

### 5.2 TODO 文件管理

- **上传**：multipart 上传到 `todos/{id}/files/`
- **删除**：从文件系统移除，并同步 `meta.json` 的 `files`

### 5.3 草稿

- **读取**：读取 `draft.txt`，不存在时返回空字符串
- **保存**：覆盖写入 `draft.txt`

### 5.4 今日进展

- **读取**：读取 `progress.json`（数组）
- **归档**：移动/复制到 `archive/progress/`，清空原文件

### 5.5 工作计划

- **读取**：读取 `plan.md`，不存在时返回占位文本

### 5.6 Session 状态

- **读取**：调用 SUMM CLI/daemon 列出 Session（排除 SUMM 主代理）
- **过滤**：不返回挂起/暂停状态的 Session；可按 `status` 参数过滤
- **限制**：默认最多返回约 20 个（与 PRD 对齐）
- **状态说明**：`idle` 仅 Claude Code 支持（通过 Hook 上报），其他 CLI 只能区分 `running/stopped`

### 5.7 Token Usage

- 方案 A：调用 Anthropic API（需要 `ANTHROPIC_API_KEY`）
- 方案 B：读取 `SUMM/token-cache.json`（推荐，SUMM Agent 定时写入）
- 备注：PRD 标记接口待定，`/api/token-usage` 为当前约定

---

## 6. WebSocket 终端代理

### 6.1 路径

- `/ws/terminal/summ`：SUMM 主代理终端
- `/ws/terminal/session/:id`：指定 Session 终端

### 6.2 消息格式

客户端 → 服务端：

```
{ "type": "input", "data": "..." }
{ "type": "resize", "cols": 120, "rows": 30 }
```

服务端 → 客户端：

```
{ "type": "output", "data": "..." }
{ "type": "status", "connected": true, "needsDecision": false }
```

### 6.3 交互流程

1. 客户端连接 WebSocket
2. 服务端使用 daemon 启动/连接 SUMM 或指定 Session
3. stdout/stderr → WebSocket `output`
4. WebSocket `input` → 子进程 stdin
5. 连接关闭时，不强制终止进程（由 Claude Daemon 管理）

**决策提示**：服务端可基于输出检测“需要用户决策”并推送 `needsDecision`

---

## 7. SUMM Daemon 交互

后端通过 `summ` CLI / daemon 管理会话：

- **启动会话**：`summ start --cli <command> --init <path|zip|tar.gz> [--name <name>]`
- **列出会话**：`summ list [--status <running|idle|stopped>]`
- **查询状态**：`summ status <session_id>`
- **连接会话**：`summ attach <session_id>`（用于终端代理连接）
- **注入消息**：`summ inject <session_id> <message>`
- **停止会话**：`summ stop <session_id>`

**关键策略**：

- 页面首次打开 → 检查 SUMM daemon 是否运行，不在则提示/返回错误（E007），由运维启动
- 页面关闭 → 不终止会话，由 daemon 管理空闲超时与恢复

---

## 8. 启动流程（服务端）

1. 初始化 Fastify + 插件（CORS、multipart）
2. 注册 REST 路由
3. 启动前调用 `getOrStartSumm()` 确保 SUMM 就绪
4. 启动 HTTP 服务
5. 初始化 WebSocket 终端代理

---

## 9. 安全与稳定性要求

- 上传文件大小限制：50MB
- 路径拼接使用 `path.join`，防止路径遍历
- 文件操作均需要 `try/catch`
- WebSocket 可选加 token 认证（预留）
- 出错时返回安全默认值（如空数组/空字符串）
- SUMM daemon 未运行时返回明确错误码（E007）
- tmux 不可用时返回错误码（E009）

**错误码参考（来自 usage guide）：**

- E001 资源不存在/不可访问
- E002 会话不存在
- E003 会话已停止不可操作
- E004 压缩包解压失败
- E005 进程启动失败
- E006 注入消息失败
- E007 守护进程未运行
- E008 无效 CLI 命令
- E009 tmux 不可用

---

## 10. 轮询与性能建议

- TODO 列表：5s 轮询
- Session 列表：3s 轮询
- 进展列表：10s 轮询
- Token 使用：60s 轮询

---

## 11. 环境变量

```
SUMM_DIR=./SUMM
SUMM_WORK_DIR=/path/to/workspace
ANTHROPIC_API_KEY=sk-xxx
PORT=3000
```

**运行前置条件（部署侧）：**

- `summ-daemon` 已安装并运行（systemd user service 推荐）
- `summ` CLI 可在 PATH 中执行
- `tmux` 3.0+ 已安装

---

## 12. 待定事项（与 PRD/技术设计保持一致）

- Token 使用查询的最终实现方案（API vs 本地缓存）
- 关闭页面后的 SUMM 生命周期策略（当前保持后台运行）
- 多用户/多项目支持（v2.0 规划）

---

## 13. 可交付后端清单（用于联调检查）

- REST API 全部可用并符合定义
- WebSocket 终端可双向通信
- 通过 daemon 启动并连接 SUMM
- 文件系统读写符合 SUMM 目录结构
- 基本错误处理与安全限制已到位

