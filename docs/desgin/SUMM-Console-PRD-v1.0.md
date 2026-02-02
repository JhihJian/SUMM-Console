# SUMM Console - 产品需求文档 (PRD)

**版本:** 1.0  
**日期:** 2025年2月  
**项目定位:** SUMM系统的用户界面层，包含前端页面和后端服务

---

## 1. 项目概述

### 1.1 项目定位

SUMM Console 是 SUMM 系统的用户交互层，提供 Web 界面供用户管理 TODO、查看工作进展、与 SUMM 主代理交互。本项目包含前端页面和后端服务两部分。

### 1.2 与其他项目的关系

| 项目 | 关系 |
|-----|------|
| Claude Daemon | Console 后端通过命令行调用 Daemon 提供的命令，管理 SUMM 主代理进程及子 Session |
| SUMM Agent | Console 启动的 SUMM 主代理使用 SUMM Agent 项目定义的提示词和 Skill |

### 1.3 设计风格

复古科技感（像素风格 + 赛博朋克元素），深色背景配合霓虹色（青色、品红、琥珀色、绿色）强调色。

---

## 2. 系统架构

```
┌─────────────────────────────────────────────────────────┐
│                    SUMM Console                         │
│  ┌─────────────────────┐    ┌────────────────────────┐  │
│  │      前端页面        │    │       后端服务          │  │
│  │  - UI 展示          │◄──►│  - TODO 管理           │  │
│  │  - xterm.js 终端    │    │  - 草稿管理            │  │
│  │  - WebSocket 通信   │    │  - 进展管理            │  │
│  └─────────────────────┘    │  - 终端代理            │  │
│                             └───────────┬────────────┘  │
└─────────────────────────────────────────┼───────────────┘
                                          │ 命令行调用
                                          ▼
                              ┌────────────────────────┐
                              │     Claude Daemon      │
                              │  - 进程管理            │
                              │  - 状态查询            │
                              └────────────────────────┘
```

---

## 3. 前端功能模块

### 3.1 界面布局

三列六区固定布局，各区域大小固定。

| 左侧列 | 中间列 | 右侧列 |
|-------|-------|-------|
| TODO展示区 | SUMM交互区 | Sessions展示区 |
| 草稿区 | SUMM展示区（跨两行） | 今日进展区 |
| - | - | Token额度区 |

### 3.2 TODO展示区

**位置：** 左上

**功能：**
- 展示当前活跃的 TODO 列表（建议2-3个）
- 显示：标题、进度百分比、当前状态描述
- 支持拖拽排序
- 点击弹出文件管理弹窗

**文件管理弹窗：**
- 查看已关联的文件列表
- 删除文件
- 上传新文件（支持拖拽上传）

### 3.3 草稿区

**位置：** 左下

**功能：**
- 纯文本编辑器
- 自动保存（输入停止后触发）
- 显示字符数统计
- 全局独立，不与 TODO 关联

### 3.4 SUMM交互区

**位置：** 中上

**功能：**
- 基于 xterm.js 的终端界面
- 直接对接 SUMM 主代理（claude code cli）的 stdin/stdout
- 通过 WebSocket 与后端通信

**待决策标识：**
- 当 SUMM 提出需要用户决策的问题时，显示"待决策"闪烁标识
- 用户回复后标识消失

### 3.5 SUMM展示区

**位置：** 中下（跨两行）

**功能：**
- Markdown 文件渲染展示
- 显示 SUMM 生成的整体工作计划
- Tab 栏预留多文档切换（当前仅"整体工作计划"）
- 可滚动浏览

**数据来源：**
- 读取 SUMM 目录中的工作计划文件

### 3.6 Sessions展示区

**位置：** 右上

**功能：**
- 展示运行中（running）和空闲（idle）的 Session
- 支持滚动（最多约20个）
- 挂起状态不展示

**每个Session显示：**
- 名称：[AGENT类型]-[ID]
- 启动目录
- 当前任务描述（超长截断，悬停显示完整）
- 状态标签（running绿色/idle琥珀色）

**交互：**
- 点击打开 Web 终端交互界面（新窗口/弹窗）

**数据来源：**
- 通过后端调用 Claude Daemon 命令查询

### 3.7 今日进展区

**位置：** 右下

**功能：**
- 展示已完成的工作项
- 每项显示：完成时间、描述、完成标记
- 归档按钮（位于角落）

**数据来源：**
- 读取 SUMM 目录中的进展文件

### 3.8 Token额度区

**位置：** 右下（今日进展下方）

**功能：**
- 显示 Token 剩余额度
- 分段式进度条 + 百分比数值

**数据来源：**
- 通过 API 查询（具体接口待定）

---

## 4. 后端功能模块

### 4.1 TODO管理

**存储位置：** SUMM目录

**功能：**
- 创建 TODO（标题、关联文件）
- 更新 TODO（进度、状态描述、排序）
- 删除 TODO
- 查询 TODO 列表
- 管理 TODO 关联文件（上传、删除、列表）
- TODO 完成后归档

**接口：**

| 接口 | 方法 | 说明 |
|-----|------|------|
| /api/todos | GET | 获取 TODO 列表 |
| /api/todos | POST | 创建 TODO |
| /api/todos/:id | GET | 获取单个 TODO |
| /api/todos/:id | PUT | 更新 TODO |
| /api/todos/:id | DELETE | 删除 TODO |
| /api/todos/:id/files | GET | 获取 TODO 关联文件列表 |
| /api/todos/:id/files | POST | 上传文件 |
| /api/todos/:id/files/:fileId | DELETE | 删除文件 |
| /api/todos/:id/archive | POST | 归档 TODO |

### 4.2 草稿管理

**存储位置：** SUMM目录

**功能：**
- 保存草稿内容
- 获取草稿内容

**接口：**

| 接口 | 方法 | 说明 |
|-----|------|------|
| /api/draft | GET | 获取草稿 |
| /api/draft | PUT | 保存草稿 |

### 4.3 进展管理

**存储位置：** SUMM目录（由 SUMM Agent 写入）

**功能：**
- 获取今日进展列表
- 归档今日进展

**接口：**

| 接口 | 方法 | 说明 |
|-----|------|------|
| /api/progress | GET | 获取今日进展 |
| /api/progress/archive | POST | 归档进展 |

### 4.4 工作计划管理

**存储位置：** SUMM目录（由 SUMM Agent 写入）

**功能：**
- 获取工作计划内容（Markdown）

**接口：**

| 接口 | 方法 | 说明 |
|-----|------|------|
| /api/plan | GET | 获取当前工作计划 |

### 4.5 终端代理

**功能：**
- 用户打开页面时，通过 Claude Daemon 启动 SUMM 主代理
- 建立 WebSocket 连接，转发 stdin/stdout
- 用户关闭页面时，处理 Session 生命周期（待定：是否销毁）

**WebSocket 接口：**
- `/ws/terminal/summ` - SUMM 主代理终端
- `/ws/terminal/session/:sessionId` - 子 Session 终端

**与 Claude Daemon 交互：**
- 启动 SUMM 主代理：调用 Daemon 启动命令
- 启动子 Session：由 SUMM Agent 通过 Daemon 命令执行
- 连接已有 Session：调用 Daemon 连接命令

### 4.6 Session状态查询

**功能：**
- 查询所有 Session 状态
- 定时轮询或事件驱动更新前端

**接口：**

| 接口 | 方法 | 说明 |
|-----|------|------|
| /api/sessions | GET | 获取所有 Session 状态 |

**数据来源：**
- 调用 Claude Daemon 的状态查询命令

---

## 5. 数据模型

### 5.1 TODO

| 字段 | 类型 | 说明 |
|-----|------|-----|
| id | string | 唯一标识符 |
| title | string | TODO 标题 |
| progress | number | 进度百分比（0-100） |
| status_desc | string | 当前工作状态描述 |
| files | array | 关联文件列表 |
| state | enum | pending / working / completed |
| order | number | 显示顺序 |
| created_at | datetime | 创建时间 |
| completed_at | datetime | 完成时间（可选） |

### 5.2 TODO文件

| 字段 | 类型 | 说明 |
|-----|------|-----|
| id | string | 唯一标识符 |
| name | string | 文件名 |
| path | string | 存储路径 |
| size | number | 文件大小 |
| uploaded_at | datetime | 上传时间 |

### 5.3 草稿

| 字段 | 类型 | 说明 |
|-----|------|-----|
| content | string | 草稿内容 |
| updated_at | datetime | 更新时间 |

### 5.4 进展项

| 字段 | 类型 | 说明 |
|-----|------|-----|
| id | string | 唯一标识符 |
| description | string | 工作项描述 |
| completed_at | datetime | 完成时间 |
| todo_id | string | 关联的 TODO ID |

---

## 6. SUMM目录结构

```
SUMM/
├── todos/
│   ├── todo_001/
│   │   ├── meta.json          # TODO 元信息
│   │   └── files/             # 关联文件
│   │       ├── design.md
│   │       └── api-spec.xlsx
│   └── todo_002/
│       └── ...
├── draft.txt                   # 草稿内容
├── progress.json               # 今日进展
├── plan.md                     # 整体工作计划
├── archive/                    # 归档数据
│   ├── todos/
│   └── progress/
└── sessions/                   # 子 Session 工作目录
    ├── DEV-AGENT-001/
    └── DEV-AGENT-002/
```

---

## 7. 用户流程

### 7.1 首次打开页面

1. 用户访问 SUMM Console
2. 后端检查 SUMM 主代理状态
3. 如未运行，通过 Claude Daemon 启动 SUMM 主代理
4. 建立 WebSocket 连接
5. 前端展示各区域数据

### 7.2 创建TODO

1. 用户在 SUMM 交互区输入 `/TODO [任务描述]`
2. SUMM 主代理解析命令，请求用户上传文件
3. 用户通过文件管理弹窗上传文件
4. SUMM 主代理确认 TODO 创建完成
5. 前端刷新 TODO 列表

### 7.3 开始TODO工作

1. 用户在 SUMM 交互区指定开始某个 TODO
2. SUMM 主代理分析文档，生成工作计划
3. SUMM 展示区显示工作计划
4. SUMM 主代理通过 Claude Daemon 创建子 Session
5. Sessions 展示区显示新的 Session
6. 子 Session 执行任务，SUMM 主代理监控并更新进度

### 7.4 连接子Session

1. 用户点击 Sessions 展示区的某个 Session
2. 打开新窗口/弹窗
3. 通过 WebSocket 连接该 Session 的终端
4. 用户可直接与子 Session 交互

---

## 8. 非功能性需求

### 8.1 部署要求

- Console 后端与 Claude Daemon 部署在同一台机器
- 支持通过命令行调用 Claude Daemon

### 8.2 数据持久化

| 数据类型 | 存储方式 | 位置 |
|---------|---------|------|
| TODO | JSON 文件 | SUMM/todos/ |
| TODO 文件 | 原始文件 | SUMM/todos/{id}/files/ |
| 草稿 | 文本文件 | SUMM/draft.txt |
| 进展 | JSON 文件 | SUMM/progress.json |
| 工作计划 | Markdown 文件 | SUMM/plan.md |
| 归档 | 文件 | SUMM/archive/ |

### 8.3 实时性要求

- SUMM 交互区：实时双向通信
- Session 状态：定时轮询（建议间隔 2-5 秒）
- TODO 进度/状态：定时轮询或文件变更监听

---

## 9. 待定事项

- Token 额度查询的具体 API
- 用户关闭页面时 SUMM 主代理的处理策略
- 多用户/多项目场景是否需要支持
