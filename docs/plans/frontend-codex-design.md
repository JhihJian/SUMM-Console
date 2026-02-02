# SUMM Console - 前端设计文档（Codex 版）

**来源依据**：`SUMM-Console-PRD-v1.0.md` 与 `SUMM-Console-Technical-Design-v3.md`  
**目标**：输出前端实现所需的结构、交互、数据流与组件设计

---

## 1. 前端范围与职责

前端（React + Vite）负责：

- 固定网格布局与面板组织（3 列 3 区域）
- TODO 列表展示与拖拽排序
- 草稿编辑与自动保存
- SUMM 交互终端（xterm.js）与待决策提示
- 工作计划 Markdown 展示（Tab 预留）
- Session 列表展示与点击打开终端
- 今日进展展示与归档触发
- Token 额度展示
- 与后端 REST API / WebSocket 的对接与轮询

---

## 2. 前端技术栈

- **框架**：React 18
- **构建**：Vite
- **终端**：xterm.js + xterm-addon-fit
- **拖拽**：@dnd-kit/core + @dnd-kit/sortable
- **Markdown**：react-markdown
- **样式**：CSS Modules
- **语言**：TypeScript

---

## 3. 目录结构（前后端同仓）

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

前端目录细化：

```
src/
├─ client/
│  ├─ main.tsx
│  ├─ App.tsx
│  ├─ api.ts
│  ├─ hooks/
│  │  ├─ useTodos.ts
│  │  ├─ useDraft.ts
│  │  ├─ useTerminal.ts
│  │  ├─ useSessions.ts
│  │  └─ useProgress.ts
│  ├─ components/
│  │  ├─ layout/
│  │  │  ├─ MainGrid.tsx
│  │  │  └─ Panel.tsx
│  │  ├─ TodoPanel.tsx
│  │  ├─ DraftPanel.tsx
│  │  ├─ ChatPanel.tsx
│  │  ├─ DisplayPanel.tsx
│  │  ├─ SessionsPanel.tsx
│  │  ├─ ProgressPanel.tsx
│  │  └─ TokenPanel.tsx
│  └─ components/modals/
│     ├─ TodoFilesModal.tsx
│     └─ SessionTerminalModal.tsx
└─ shared/
   └─ types.ts
```

---

## 4. 页面布局

### 4.1 固定网格布局

- 3 列，3 行
- 左列：TODO（上）、草稿（下）
- 中列：SUMM 交互（上）、工作计划（下跨两行）
- 右列：Session（上）、今日进展（中）、Token（下）

示意（与技术设计一致）：

```
┌──────────┬───────────────┬──────────┐
│ TODO     │ SUMM 交互      │ Sessions │
├──────────┼───────────────┼──────────┤
│ 草稿     │ 工作计划       │ 今日进展 │
│          │ (Markdown)     ├──────────┤
│          │                │ Token    │
└──────────┴───────────────┴──────────┘
```

### 4.2 Panel 基础样式

- 统一 Panel 容器风格
- 复古科技风配色（深色背景 + 亮色高亮）
- 面板标题统一样式

---

## 5. 组件设计与交互

### 5.1 TodoPanel（TODO 列表 + 拖拽）

- 展示当前 TODO 列表（建议 1-3 条）
- 每项显示：标题、进度百分比、状态描述
- 支持拖拽排序（@dnd-kit）
- 点击 TODO 打开 `TodoFilesModal`

交互：

- 拖拽结束后调用 `updateTodoOrder`
- 列表数据来自 `useTodos` hook

### 5.2 TodoFilesModal（附件管理）

- 展示已关联文件列表
- 支持拖拽上传和删除
- 上传成功后刷新列表

交互：

- 上传：POST `/api/todos/:id/files`
- 删除：DELETE `/api/todos/:id/files/:fileId`

### 5.3 DraftPanel（草稿）

- 文本区域输入
- 输入停止 1 秒后自动保存
- 显示字符数

交互：

- 读取：GET `/api/draft`
- 保存：PUT `/api/draft`

### 5.4 ChatPanel（SUMM 交互）

- xterm.js 渲染终端
- 通过 WebSocket 连接 `/ws/terminal/summ`
- 输出流写入终端
- 支持待决策提示（needsDecision）

交互：

- `input` -> WS 发送
- `output` -> 终端显示
- `status.needsDecision` -> 闪烁提示

### 5.5 DisplayPanel（工作计划）

- 使用 `react-markdown` 渲染 `plan.md`
- 默认 Tab 为“整体工作计划”
- 预留其他 Tab 扩展

交互：

- 读取：GET `/api/plan`
- 轮询刷新：10s

### 5.6 SessionsPanel（Session 列表）

- 展示 running / idle Session（不显示挂起/暂停状态）
- 最多展示约 20 个，支持滚动
- 每项显示：`[AGENT]-[ID]`、启动目录、当前任务描述（超长截断，悬停显示完整）、状态标签（running 绿 / idle 蓝）
- 点击 Session 打开新窗口/弹窗的 Web 终端（符合 PRD）

交互：

- 读取：GET `/api/sessions`（3s 轮询）
- 新窗口/弹窗内 WebSocket 连接 `/ws/terminal/session/:id`

### 5.7 ProgressPanel（今日进展）

- 展示完成项列表（时间 + 描述 + 完成标识）
- 提供“归档”按钮

交互：

- 读取：GET `/api/progress`（10s 轮询）
- 归档：POST `/api/progress/archive`

### 5.8 TokenPanel（Token 使用）

- 显示已用/总量与百分比
- 分段进度条

交互：

- 读取：GET `/api/token-usage`（60s 轮询，PRD 标记接口待定，暂按此约定）

---

## 6. 数据流与 hooks 设计

### 6.1 api.ts

- 封装所有 REST 请求
- 统一错误处理

### 6.2 hooks 清单

- `useTodos`：TODO 列表、创建/更新/排序、附件触发
- `useDraft`：草稿读取与保存
- `useTerminal`：SUMM 终端与 Session 终端连接封装
- `useSessions`：Session 列表轮询
- `useProgress`：进展列表轮询与归档

---

## 7. WebSocket 消息格式

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

---

## 8. 视觉与交互风格

- 深色背景 + 霓虹色高亮
- 复古科技风：像素化/霓虹细节
- Panel 边框和标题栏可加入轻微发光
- 待决策提示闪烁动画

---

## 9. 性能与轮询策略

- TODO：5s
- Session：3s
- 进展：10s
- Token：60s

优化建议：

- 对面板组件使用 `React.memo`
- 长列表可选虚拟滚动

---

## 10. 前端交付清单（联调检查）

- 网格布局与各面板位置正确
- TODO 支持拖拽排序与文件上传
- 草稿自动保存可用
- SUMM 终端可双向通信
- 工作计划 Markdown 显示正常
- Session 列表可打开独立终端
- 进展归档与 Token 显示正确

