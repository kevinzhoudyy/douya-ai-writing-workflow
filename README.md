# Douya AI Writing Workflow

一套与 AI Agent 无关的完整写作工作流，覆盖微信公众号、小红书、视频脚本三大内容平台，配套可视化排版编辑器。

适用于 Claude Code、WorkBuddy、OpenClaw、Codex 等所有支持规则文件的 AI Agent。每个 Agent 只需读取项目中的规则文件（CLAUDE.md / AGENTS.md），即可按照相同流程执行写作任务。

---

## 核心价值

- **规则即流程** — 所有写作规范写在 CLAUDE.md / AGENTS.md 中，AI Agent 进入目录后自动加载，无需每次重复交代
- **Agent 无关** — 同一套规则文件适用于任何 AI Agent，切换工具不需要改流程
- **降 AI 味** — 三遍审校体系（内容→风格→细节），目标 AI 检测率 < 30%
- **可视化编辑** — 写完自动同步到编辑器，所见即所得，一键复制到公众号/小红书
- **多平台覆盖** — 公众号长文、小红书图文/纯文字帖、视频口播稿，一套工作流搞定

---

## 包含什么

```
├── CLAUDE.md                    # 根规则：工作区路由 + 全局协作原则（Claude Code 原生读取）
├── AGENTS.md                    # 同上（Codex / WorkBuddy / OpenClaw 等读取）
├── agents/                      # Agent 角色模板
│   ├── explorer.yaml            #   只读调研 Agent
│   ├── reviewer.yaml            #   审校 Agent
│   └── worker.yaml              #   执行 Agent
├── 写作参考/
│   ├── 风格指南.md              # 写作风格模板（填入你的个人风格）
│   └── 审校checklist.md         # 三遍审校清单
├── 公众号写作/
│   └── CLAUDE.md                # 公众号 10 步写作流程
├── 小红书/
│   ├── CLAUDE.md                # 小红书 7 步写作流程
│   └── collections/_template.md # 合集元数据模板
├── 视频脚本/
│   ├── CLAUDE.md                # 视频脚本 7 步流程 + 儿童安全教育系列规范
│   └── _templates/
│       ├── 分镜脚本模板.md      # 10-15 秒短视频分镜模板
│       ├── 角色设定模板.md      # AI 视频角色设定模板
│       └── AI生成质量checklist.md # AI 生成视频质量检查清单
├── Prompt梳理/
│   └── CLAUDE.md                # Prompt 整理/优化/新建/复盘工作流
└── 豆芽编辑器/                  # 可视化排版编辑器
    ├── rebuild-html.js          #   构建脚本（扫描文章 + 图片 → 生成编辑器）
    ├── start.js                 #   本地服务器 + 文件监听 + 热重载
    ├── editor-styles.js         #   主题/样式定义
    ├── emoji-features.js        #   Emoji 和编辑器增强
    ├── record-gif.js            #   GIF 录制工具
    ├── resize-xhs.js            #   小红书图片尺寸调整
    ├── screenshot.js            #   截图工具
    └── package.json
```

---

## 快速开始

### 前置条件

- 任意一个支持规则文件的 AI Agent（见下方兼容列表）
- Node.js >= 18（编辑器需要）

### AI Agent 兼容性

| Agent | 规则文件 | 说明 |
|-------|---------|------|
| [Claude Code](https://docs.anthropic.com/en/docs/claude-code) | `CLAUDE.md` | 原生支持，进入目录自动加载 |
| [WorkBuddy](https://github.com/nicepkg/workbuddy) | `CLAUDE.md` / `AGENTS.md` | 支持 CLAUDE.md 规则体系 |
| [OpenClaw](https://github.com/openclaw-ai/openclaw) | `AGENTS.md` | 支持 AGENTS.md 规则体系 |
| [Codex](https://openai.com/index/introducing-codex/) | `AGENTS.md` | OpenAI Codex，支持 AGENTS.md |
| 其他 Agent | `CLAUDE.md` / `AGENTS.md` | 只要能读取项目根目录的规则文件即可适配 |

> 核心原理：CLAUDE.md 和 AGENTS.md 本质都是纯文本规则文件。任何 AI Agent 只要在启动时读取这些文件并遵循其中的指令，就能执行相同的工作流。

### 1. 克隆仓库

```bash
git clone https://github.com/kevinzhoudyy/douya-ai-writing-workflow.git
cd douya-ai-writing-workflow
```

### 2. 配置个人素材库

在根目录创建 `个人素材库/` 文件夹，放入你的个人经历、案例、数据：

```
个人素材库/
├── 主题索引.md          # 素材索引
├── AI编程工具.md        # 示例：你的 AI 工具使用经历
├── 内容创作.md          # 示例：你的写作踩坑记录
└── 产品开发.md          # 示例：你的项目经历
```

写作时 AI Agent 会自动检索素材库，用真实经历替代 AI 腔调。

### 3. 配置风格指南

编辑 `写作参考/风格指南.md`，填入你的个人写作风格（口语化程度、句式偏好、禁用词等）。不填也行，Agent 会默认采用"口语化、简洁直接、有明确观点"的风格。

### 4. 开始写作

在你的 AI Agent 中直接告诉它你要写什么：

```
帮我写一篇公众号文章，主题是"AI 会不会取代你的工作"
```

Agent 会自动：
1. 判断工作区（公众号）
2. 引导你梳理 brief
3. 提供 3-4 个选题方向供你选择
4. 搜索调研 → 创作初稿 → 三遍审校 → 配图 → 同步到编辑器

---

## 工作流总览

```
用户提出需求
    ↓
工作区路由（公众号 / 小红书 / 视频脚本 / Prompt）
    ↓
任务类型判断（新写作 / 修改 / 审校 / 咨询）
    ↓
标准流程（以公众号为例）
    ├─ Step 1   理解需求，保存 Brief
    ├─ Step 2   信息搜索与调研
    ├─ Step 3   选题讨论（3-4 个方向）     ⭐ 等用户确认
    ├─ Step 4   创建协作文档（按需）
    ├─ Step 5   学习写作风格
    ├─ Step 5.5 检索个人素材库
    ├─ Step 6   等待测试数据（按需）
    ├─ Step 7   创作初稿
    ├─ Step 8   三遍审校（降 AI 味）       ⭐ 最关键
    ├─ Step 8.5 进入编辑器可视化
    ├─ Step 9   文章配图 + 自动同步
    └─ Step 10  编辑器微调 + 复制发布
```

关键节点（选题方向、平台选择）会暂停等待用户确认，确认后自动跑完全流程。

---

## 编辑器使用

```bash
cd 豆芽编辑器
npm install
node start.js
```

浏览器打开 `http://localhost:8765`，编辑器会自动加载 `公众号写作/articles/` 和 `小红书/articles/` 中的 Markdown 文章。

| 功能 | 操作 |
|------|------|
| 查看文章 | 侧边栏自动加载，点击切换 |
| 切换主题 | 工具栏「主题」下拉框 |
| 编辑文字 | 点击「✏️ 编辑」→ 直接点击修改 |
| 编辑源码 | 点击「＜/＞ 源码」→ Markdown 编辑 |
| 插入 emoji | 点击「😀」→ 选择分类 → 点击插入 |
| 复制正文 | 点击「📋 复制正文」 |

修改 `articles/` 下的 `.md` 文件后，编辑器每 5 秒自动检测更新并重建，无需手动刷新。

---

## 降 AI 味方法论

这是本工作流的核心能力。三遍审校体系：

**第一遍：内容审校**
- 数据是否真实、逻辑是否清晰、有无编造

**第二遍：风格审校**（最关键）
- 删除所有 AI 套话（"在当今"、"综上所述"、"值得注意"）
- 拆散 AI 句式堆叠（"不是…而是…"连续出现）
- 替换书面词汇为口语表达（"显著提升" → "快了3倍"）
- 加入个人态度和明确观点（拒绝中立客观）
- 融入个人素材库中的真实经历

**第三遍：细节打磨**
- 句子长度 15-25 字，段落不超过 5 行
- 多用句号，长短句交替
- 大声朗读，卡顿的地方就是需要改的地方

目标：AI 检测率 < 30%。

---

## 关于输出质量

自动化工作流能帮你跑通从选题到发布的全流程，但**最终输出仍需你自行校对**。

- 工作流产出的初稿是一个**起点**，不是终稿
- 数据、事实、产品信息需要你确认是否准确
- 文章语气和表达需要你判断是否符合你的风格

如果你希望输出内容完全匹配你认可的写作风格，通常需要**多轮调整和核对**：

1. **第一轮** — 看整体方向对不对，选题角度、结构是否合理
2. **第二轮** — 逐段检查表达，标记不满意的地方，告诉 Agent 怎么改
3. **第三轮** — 细节打磨，标点、节奏、用词，直到你满意为止

每轮调整后 Agent 会自动重新审校。迭代次数取决于你对风格的要求——风格指南填得越详细、素材库越丰富，需要的轮次越少。

> 这套工作流的价值不是"让 AI 替你写"，而是"让你从零开始写一篇文章的时间从几小时缩短到几十分钟"。

---

## 适配你自己的工作流

### 1. 选择你的 Agent

- **Claude Code** — 开箱即用，原生读取 `CLAUDE.md`
- **WorkBuddy** — 开箱即用，支持 `CLAUDE.md` 规则体系
- **OpenClaw / Codex** — 开箱即用，读取 `AGENTS.md`（内容与 CLAUDE.md 一致）
- **其他 Agent** — 确认你的 Agent 能在启动时读取项目根目录的规则文件，如不能，将 CLAUDE.md 的内容粘贴到 Agent 的 system prompt 中即可

### 2. 个性化配置

1. **改规则文件** — 流程步骤、审校标准、配图规则都可以按你的习惯调整
2. **填风格指南** — 告诉 Agent 你的写作偏好
3. **建素材库** — 你的经历是最好的"去 AI 味"武器
4. **调编辑器** — `editor-styles.js` 定义主题，`emoji-features.js` 定义增强功能

---

## License

MIT
