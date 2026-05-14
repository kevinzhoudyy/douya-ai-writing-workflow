const fs = require('fs');
const path = require('path');
const emojiJS = require('./emoji-features');

function buildLocalAssetUrl(absPath) {
  return '/api/local-file?path=' + encodeURIComponent(absPath);
}

// Legacy editor-local screenshots. Keep as backward-compatible fallback only.
// Canonical article images should live under:
// ~/WorkBuddy/Claw/公众号写作/images/<article-topic>/
const compressedDir = path.join(__dirname, 'screenshots/compressed');
const images = {};
if (fs.existsSync(compressedDir)) {
  const files = fs.readdirSync(compressedDir).filter(f => f.endsWith('.jpg'));
  for (const f of files) {
    const key = f.replace('.jpg', '');
    images[key] = buildLocalAssetUrl(path.join(compressedDir, f));
  }
}

// Load local GIF animations as served files instead of base64 payloads.
const gifFiles = [
  path.join(__dirname, 'screenshots/登月历史-星空动效.gif'),
  path.join(__dirname, 'screenshots/高中物理-电容器动效.gif')
];
for (const gifPath of gifFiles) {
  if (!fs.existsSync(gifPath)) continue;
  const key = path.basename(gifPath, path.extname(gifPath));
  images[key] = buildLocalAssetUrl(gifPath);
}

// === Scan Claw writing images and build served URLs ===
const imageRoots = [
  {
    label: '公众号 images',
    dir: path.join(process.env.HOME || '/root', 'WorkBuddy/Claw/公众号写作/images')
  },
  {
    label: '小红书 images',
    dir: path.join(process.env.HOME || '/root', 'WorkBuddy/Claw/小红书/images')
  },
  {
    label: '小红书 collection covers',
    dir: path.join(process.env.HOME || '/root', 'WorkBuddy/Claw/小红书/collection-covers')
  }
];

for (const root of imageRoots) {
  if (!fs.existsSync(root.dir)) continue;
  const rootImages = scanImagesDir(root.dir);
  for (const [key, assetUrl] of Object.entries(rootImages)) {
    images[key] = assetUrl;
  }
  console.log('Loaded ' + root.label + ':', Object.keys(rootImages).join(', '));
}

// Recursively scan a directory for image files, return { filename: servedUrl } map
function scanImagesDir(dir) {
  const result = {};
  if (!fs.existsSync(dir)) return result;
  const entries = fs.readdirSync(dir);
  for (const entry of entries) {
    if (entry.startsWith('.')) continue;
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      // Recurse into subdirectories (e.g. images/Codex六件事/)
      const subResult = scanImagesDir(fullPath);
      // Prefix keys with subdirectory name for uniqueness
      const subDirName = entry;
      for (const [key, assetUrl] of Object.entries(subResult)) {
        result[subDirName + '/' + key] = assetUrl;
      }
    } else if (/\.(png|jpe?g|gif|webp|svg)$/i.test(entry)) {
      const key = entry.replace(/\.[^.]+$/, '');
      result[key] = buildLocalAssetUrl(fullPath);
    }
  }
  return result;
}

console.log('Loaded images:', Object.keys(images).join(', '));
console.log('Image manifest size:', (JSON.stringify(images).length / 1024).toFixed(0), 'KB');

// Single source of truth for theme styles.
// Do not read the generated HTML back in; that creates rebuild drift.
const stylesJS = fs.readFileSync('editor-styles.js', 'utf8').trim();
if (!stylesJS.startsWith('{')) {
  console.error('editor-styles.js must contain a raw STYLES object literal');
  process.exit(1);
}
const markedBundlePath = path.join(__dirname, 'node_modules/marked/lib/marked.umd.js');
if (!fs.existsSync(markedBundlePath)) {
  console.error('Missing local marked bundle at', markedBundlePath);
  process.exit(1);
}
const markedBundleJS = fs.readFileSync(markedBundlePath, 'utf8').replace(/<\/script>/gi, '<\\/script>');

// Default article markdown with image markers
const defaultArticleMd = `你上次做 PPT 花了多久？

我的记忆是这样的：打开软件，翻模板，找到一个差不多的，改配色，换字体，插图片，图片风格不统一，再去找，找到之后大小不对，裁剪，对齐，发现某一页的标题字号和其他页不一样……

两小时过去了。内容还没开始写。

这不是个例。我身边做 PPT 痛苦的人太多了——不是因为不会做，是因为这个过程太碎片化、太耗时间。大部分精力花在了排版和调整上，而不是思考内容本身。

---

## 起因是我女儿的家长会

我女儿今年读小班。上周去开家长会，老师在投影上放了一份 PPT——日常活动照片、课程安排、作息时间表、注意事项，内容不少。我坐在下面想，这些内容做成一个简单的演示文稿应该挺快的吧。

回去之后我做了一个。

不是用 PowerPoint，不是用 Canva，是在 Claude 里打了一行指令，等了一分钟，一份完整的演示文稿就出来了。

暖色调，圆角卡片，图标活泼。打开浏览器就能放映，支持全屏，支持键盘翻页。

<!--IMG:幼儿园家长会-01-->

它生成的不是 .pptx 文件，是一个 .html 文件。

---

## 为什么是 HTML？

很多人第一次听到"HTML 版 PPT"会愣一下。

传统 PPT 有几个老问题：

**格式不兼容。** 你用 Mac 做的，Windows 用户打开可能字体变了、排版乱了。你装了特殊字体，别人没装就显示不出来。

**文件臃肿。** 想嵌入视频，文件突然变成几百 MB。想发给别人，微信传不了，邮件超大小限制。

**依赖软件。** 对方得装 PowerPoint 或者 Keynote 才能看。演示现场借了一台电脑，发现没装 Office——这种事发生过的举手。

HTML 没有这些问题。

浏览器是全世界安装量最大的"软件"，不管什么系统，打开体验完全一致。一个 HTML 文件把所有样式、动画、图标都内嵌在里面，不依赖外部资源，不依赖安装包。

而且 HTML 天生支持的东西——平滑动画、响应式布局、交互效果——在传统 PPT 里要花很多功夫才能实现，甚至根本做不到。

比如响应式布局。你在电脑上做的 PPT，手机打开比例全是错的。但 HTML 版本在电脑上是全屏演示模式，发到手机上会自动切换成垂直滚动模式——一个文件，两种体验，不需要"电脑版"和"手机版"两个版本。

---

## 不是套模板，是真的在设计

这个指令最让我觉得有意思的地方：它不是从模板库里挑一个套上去。

你给它一个主题，它会先做几件事：

1. **分析主题** — 判断目标受众是谁，情感调性是什么
2. **识别品牌** — 如果主题涉及已知品牌（比如 Apple、OpenAI、特斯拉），会提取品牌色和视觉语言
3. **选择配色** — 品牌色优先，没有品牌就从语义色彩系统中选（海洋用蓝绿，科技用紫蓝，教育用蓝橙……）
4. **规划动效** — 根据内容类型选不同的页面切换方式、入场动画、氛围效果
5. **生成代码** — 所有东西写进一个 HTML 文件

我测试了几个完全不同的主题，看看它怎么处理：

---

### 幼儿园小班家长会

暖色调，圆角卡片，图标是小星星和小花朵风格。

页面切换用的是"旋转进入"——带着一点弹性的转场，活泼但不乱。入场动画是"波浪入场"，内容元素一个接一个冒出来，像小朋友排队出场。

背景有淡淡的浮动粒子，是那种很轻的彩色小点。

整体感觉：一个很用心的老师，花了很多时间做的。但你只花了一分钟。

<!--IMG:幼儿园家长会-02-->

<!--IMG:幼儿园家长会-03-->

---

### 高中物理·电磁学

完全变了。

板书风格，深色背景加公式。页面切换变成了"缩放进入"——每一页像从远处推过来，有聚焦感。入场动画是"裁切展开"，标题文字像黑板上的粉笔字一样一行一行显现。

<!--IMG:高中物理-01-->

数据页有数字滚动效果，公式和图示搭配清楚。如果你是物理老师，这份课件直接拿去用，学生看着也不会觉得无聊。

<!--IMG:高中物理-02-->

动效也是亮点——比如电容器那一页，电场线在两极板之间持续流动，抽象的概念瞬间有了直观感受：

<!--IMG:高中物理-电容器动效-->

---

### 马斯克：从 PayPal 到火星

深色科技主题，页面切换带着缩放感，像 Keynote 的演讲效果。配色自动用了科技感强的紫蓝渐变。

<!--IMG:马斯克-01-->

它还在页面里加了导航圆点——右侧一列小圆点，鼠标悬浮会显示每页标题，点击可以跳转。按 F 键全屏，按方向键翻页，体验跟专业演示软件一样。

时间线页做得很好，从 PayPal 到 SpaceX 到 Neuralink，节点依次点亮，配合年份的数字飞入效果。像一篇科技媒体的视觉专题。

<!--IMG:马斯克-02-->

<!--IMG:马斯克-03-->

---

### 物业业主大会

正式商务风，信息密度高。

<!--IMG:物业业主大会-01-->

这种场景最容易翻车——内容太多，塞进去就乱。但它处理得很好：费用明细用了数字滚动计数器，收缴率用了进度条动画，关键数据用大字突出。

<!--IMG:物业业主大会-02-->

页面切换是标准的水平滑动，配合紧凑的交错淡入。不花哨，但专业、清晰。适合投屏在业主大会现场用。

---

### 登月历史

史诗叙事风格，深空色调，背景有微弱的星空粒子。

<!--IMG:登月历史-01-->

页面切换用的是垂直滑动——从上到下推进，配合时间线从 1961 年到 1969 年的叙事节奏。关键节点有全屏文字冲击效果，阿姆斯特朗那句名言放大到撑满屏幕，短暂停留后缩小进入正文。

像纪录片的视觉包装，不是 PPT。

<!--IMG:登月历史-02-->

星空背景是动态的——微弱的粒子缓缓漂浮，配合深空色调，沉浸感很强：

<!--IMG:登月历史-星空动效-->

<!--IMG:登月历史-03-->

---

### 简历：李明远

这是最近新加的功能——它还能做简历。

<!--IMG:简历李明远-01-->

当主题里出现"简历"、"个人介绍"、"Portfolio"这些关键词，它会自动切换到简历模式。跟普通演示完全不同的一套设计逻辑：

动效变得非常克制——没有粒子，没有追光，没有旋转进入，页面切换只有水平滑动或淡入淡出。简历不需要花哨，需要的是专业。

排版变紧凑了。普通演示一页只放一个核心信息，大量留白；简历一页可以放 2-3 段工作经历、多个项目条目，页边距更小，字号更紧凑。

<!--IMG:简历李明远-02-->

内容结构是固定的：封面（姓名、职位、一句话标签、联系方式）→ 个人简介 → 工作经历（倒序） → 项目经历 → 教育背景 → 技能专长 → 结尾。

最实用的一点：**支持打印导出 PDF。** 内置了 \`@media print\` 样式，用浏览器打开后选择"打印 → 另存为 PDF"，就能得到一份排版干净的 PDF 简历。动效自动关闭，导航元素自动隐藏，背景色转为白色，文字转为黑色。在线能演示，打印能投递。

<!--IMG:简历李明远-03-->

---

## 一些可能被忽略的细节

这些不是大卖点，但用起来会觉得"这个东西真的考虑到了"：

**全屏演示。** 左上角有全屏按钮，按 F 键也可以。进入全屏后跟 PowerPoint 的放映模式一样，界面干净，只留内容和导航圆点。

**键盘快捷键。** 方向键翻页，Home/End 跳首尾，PageUp/PageDown 也支持。Esc 退出全屏。

**品牌色自动识别。** 主题里提到"苹果公司"，配色就往 Apple 的视觉语言靠；提到"OpenAI"，就往黑绿配色靠。它不是随便选一个好看的颜色，是在匹配读者对这个品牌的认知预期。

**无障碍支持。** 所有动效在 \`prefers-reduced-motion\` 设置下会自动关闭。不干扰有需要的用户。

**移动端适配。** 手机上打开会自动隐藏导航圆点和自定义光标，切换成触摸滑动 + 垂直滚动。交互方式完全适配触屏设备。

**文件极小。** 通常 30-50KB，比一张手机照片还小。因为不依赖外部资源，所有样式和图标都是内联的。

**图片策略很聪明。** 它不是简单地"配张图"，而是根据内容类型决定要不要配图、用什么风格的图。儿童教育类用 SVG 卡通插画，品牌展示类会自动搜索官方 logo 和产品图，人物传记类会找正式照片。而且每张图片都有降级方案——加载失败时自动显示首字母占位或品牌文字，不会出现空白框。

---

## 怎么用

在 Claude Code 里输入：

\`\`\`
/project:alltoppt 你的主题名称
\`\`\`

等大概一分钟，HTML 文件就生成好了。双击打开浏览器，就能放映。

如果是做简历，输入 \`/project:alltoppt 简历 张三\` 就行。它会自动进入简历模式，生成后用浏览器的"打印 → 另存为 PDF"可以导出。

---

## 怎么获取

这个指令是我自己写的，目前在 Claude Code 里使用。

它本质上是一套给 Claude 的"设计规范"——告诉 Claude 在生成演示之前应该怎么分析主题、怎么选色、怎么选动效、怎么处理响应式布局。Claude 根据这套规范，每次都做独立的视觉设计，而不是重复使用同一套模板。

感兴趣的可以私信我。后续会整理好放到 GitHub 上开源。

---

*如果你也在用 Claude Code 做一些有趣的事情，欢迎交流。*`;

const defaultArticleTitle = '我给Claude写了个指令，做PPT只需要一句话';
const defaultArticleKey = 'alltoppt-promo';

function deriveArticleKeyFromFileName(fileName) {
  const base = fileName
    .replace(/\.md$/i, '');
  return base.toLowerCase();
}


// === AUTO-SCAN CLAW WRITING ARTICLES ===
function scanClawArticles() {
  const roots = [
    {
      channel: 'wechat',
      preferredTheme: 'wechat-anthropic',
      dir: path.join(process.env.HOME || '/root', 'WorkBuddy/Claw/公众号写作/articles')
    },
    {
      channel: 'xhs',
      preferredTheme: 'xhs-text',
      dir: path.join(process.env.HOME || '/root', 'WorkBuddy/Claw/小红书/articles')
    }
  ];

  const scanned = [];
  for (const root of roots) {
    if (!fs.existsSync(root.dir)) continue;
    const mdFiles = fs.readdirSync(root.dir).filter(f => f.endsWith('.md'));
    for (const file of mdFiles) {
      const fullPath = path.join(root.dir, file);
      const stat = fs.statSync(fullPath);
      const mdContent = fs.readFileSync(fullPath, 'utf8');

      // Normalize line endings, then extract title
      const normalizedContent = mdContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      const lines = normalizedContent.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      let title = '';
      let md = normalizedContent;

      const candidateTitleMatch = normalizedContent.match(/^-+\s*\*\*A\*\*[:：]\s*(.+)$/m);

      // Find first real H1 (skip placeholders: 标题候选, 正文, 标签, TITLE, etc.)
      const h1Regex = /^#\s+(.+)$/gm;
      let m;
      let firstRealH1 = null;
      while ((m = h1Regex.exec(normalizedContent)) !== null) {
        const h1Text = m[1].trim();
        const isPlaceholder = /^(标题候选|正文描述|正文|标签|TITLE|title|Placeholder|占位)/i.test(h1Text);
        if (!isPlaceholder) {
          firstRealH1 = h1Text;
          break;
        }
      }

      if (candidateTitleMatch) {
        title = candidateTitleMatch[1].trim();
        md = md
          .trim();
      } else if (firstRealH1) {
        title = firstRealH1;
        // Remove all H1 lines from content (editor will re-add title)
        md = md.replace(/^#\s+.*$/gm, '').trim();
      } else if (lines.length > 0) {
        // No real H1: derive title from filename
        title = file.replace(/\.md$/i, '')
          .replace(/[-_]/g, ' ');
        if (title.length < 2) title = file.replace('.md', '');
        // Remove all H1 lines from content
        md = md.replace(/^#\s+.*$/gm, '').trim();
      } else {
        title = file.replace('.md', '');
      }

      scanned.push({
        sourcePath: fullPath,
        fileName: file,
        articleKey: deriveArticleKeyFromFileName(file),
        title: title,
        md: md.trim(),
        mtime: stat.mtimeMs,
        channel: root.channel,
        preferredTheme: root.preferredTheme
      });
    }
  }

  return scanned;
}

const clawArticles = scanClawArticles();
console.log('Scanned Claw articles:', clawArticles.map(a => a.fileName).join(', '));
const defaultWorkflowArticle = clawArticles.find(function(a) {
  return a.articleKey === defaultArticleKey || a.title === defaultArticleTitle;
});
const resolvedDefaultTitle = defaultWorkflowArticle ? defaultWorkflowArticle.title : defaultArticleTitle;
const resolvedDefaultMd = defaultWorkflowArticle ? defaultWorkflowArticle.md : defaultArticleMd;

const presetArticles = clawArticles.map(function(a) {
  let processedMd = a.md;
  const imageRefMap = {};
  processedMd.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, function(match, alt, src) {
    imageRefMap[alt] = {
      src: src,
      markdown: '![' + alt + '](' + src + ')'
    };
    return match;
  });

  return {
    id: 'preset-' + (a.channel || 'wechat') + '-' + (a.title === defaultArticleTitle ? defaultArticleKey : a.articleKey),
    articleKey: a.title === defaultArticleTitle ? defaultArticleKey : a.articleKey,
    title: a.title,
    md: processedMd,
    sourceMd: a.md,
    imageRefMap: imageRefMap,
    source: a.sourcePath,
    channel: a.channel || 'wechat',
    preferredTheme: a.preferredTheme || (a.channel === 'xhs' ? 'xhs-text' : 'wechat-anthropic'),
    mtime: a.mtime,
    createdAt: a.mtime,
    updatedAt: a.mtime
  };
});
if (!presetArticles.some(function(a) { return a.articleKey === defaultArticleKey || a.title === defaultArticleTitle; })) {
  presetArticles.unshift({
    id: 'preset-wechat-' + defaultArticleKey,
    articleKey: defaultArticleKey,
    title: defaultArticleTitle,
    md: defaultArticleMd,
    source: '',
    channel: 'wechat',
    preferredTheme: 'wechat-anthropic',
    mtime: Date.now(),
    createdAt: Date.now(),
    updatedAt: Date.now()
  });
}

// Escape for JS template literal
function escapeJs(str) {
  return str.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
}

let html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>公众号排版编辑器 - alltoppt</title>
<script>
${markedBundleJS}
<\/script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#f0f0f0;font-family:-apple-system,BlinkMacSystemFont,sans-serif;display:flex;min-height:100vh}

/* === SIDEBAR === */
.sidebar{width:280px;min-width:280px;background:#1a1a1a;height:100vh;position:fixed;left:0;top:0;z-index:300;display:flex;flex-direction:column;transition:transform .3s cubic-bezier(.25,.46,.45,.94);box-shadow:2px 0 16px rgba(0,0,0,.2)}
.sidebar.collapsed{transform:translateX(-280px)}
.sidebar-header{padding:16px;border-bottom:1px solid #333;display:flex;align-items:center;justify-content:space-between;flex-shrink:0}
.sidebar-header h2{color:#fff;font-size:15px;font-weight:600;white-space:nowrap}
.sidebar-header .close-btn{background:none;border:none;color:#888;font-size:20px;cursor:pointer;width:28px;height:28px;display:flex;align-items:center;justify-content:center;border-radius:6px;transition:all .2s}
.sidebar-header .close-btn:hover{background:#333;color:#fff}
.sidebar-list{flex:1;overflow-y:auto;padding:8px}
.sidebar-list::-webkit-scrollbar{width:4px}
.sidebar-list::-webkit-scrollbar-thumb{background:#444;border-radius:4px}
.article-item{display:flex;align-items:center;padding:10px 12px;border-radius:8px;cursor:pointer;transition:all .15s;margin-bottom:4px;gap:10px;position:relative}
.article-item:hover{background:#2a2a2a}
.article-item.active{background:#333;border-left:3px solid #C15F3C}
.article-item .item-dot{width:8px;height:8px;border-radius:50%;background:#555;flex-shrink:0;transition:background .2s}
.article-item.active .item-dot{background:#C15F3C}
.article-item .item-info{flex:1;min-width:0}
.article-item .item-title{color:#ddd;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:500}
.article-item .item-meta{color:#777;font-size:11px;margin-top:2px;display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.channel-badge{display:inline-flex;align-items:center;padding:1px 6px;border-radius:999px;font-size:10px;line-height:1.6;font-weight:600}
.channel-badge.wechat{background:rgba(7,193,96,.16);color:#67d98e}
.channel-badge.xhs{background:rgba(255,36,66,.16);color:#ff8a9d}
.draft-badge{display:inline-flex;align-items:center;padding:1px 6px;border-radius:999px;font-size:10px;line-height:1.6;font-weight:600;background:rgba(193,95,60,.16);color:#f0b49b}
.article-item .item-actions{display:flex;gap:2px;opacity:0;transition:opacity .15s}
.article-item:hover .item-actions{opacity:1}
.item-action-btn{background:none;border:none;color:#888;cursor:pointer;padding:4px 6px;border-radius:4px;font-size:12px;transition:all .15s}
.item-action-btn:hover{background:#444;color:#fff}
.item-action-btn.delete:hover{background:#d32f2f;color:#fff}

/* === MAIN === */
.main{margin-left:280px;flex:1;display:flex;flex-direction:column;height:100vh;overflow:hidden;transition:margin-left .3s cubic-bezier(.25,.46,.45,.94)}
.main.expanded{margin-left:0}

/* === TOOLBAR === */
.toolbar{position:sticky;top:0;z-index:100;background:#1a1a1a;padding:8px 16px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;box-shadow:0 2px 12px rgba(0,0,0,.3);flex-shrink:0}
.toolbar .toggle-sidebar{background:none;border:none;color:#aaa;font-size:18px;cursor:pointer;padding:4px 8px;border-radius:6px;transition:all .2s;display:flex;align-items:center;justify-content:center}
.toolbar .toggle-sidebar:hover{background:#333;color:#fff}
.toolbar .divider{width:1px;height:20px;background:#444;margin:0 4px}
.toolbar .label{color:#888;font-size:12px;white-space:nowrap}
.toolbar select{background:#333;color:#fff;border:1px solid #555;border-radius:6px;padding:5px 8px;font-size:12px;cursor:pointer}
.btn{background:#333;color:#fff;border:1px solid #555;border-radius:6px;padding:5px 12px;font-size:12px;cursor:pointer;transition:all .2s;white-space:nowrap;display:flex;align-items:center;gap:4px}
.btn:hover{background:#555}
.btn-primary{background:#C15F3C;border-color:#C15F3C}
.btn-primary:hover{background:#d4714e}
.btn.active{background:#C15F3C;border-color:#C15F3C}
.btn-edit{position:relative}
.toolbar-right{margin-left:auto;display:flex;gap:6px;align-items:center}
.mode-btns{display:none!important}

/* === TOAST === */
.toast{position:fixed;top:56px;left:50%;transform:translateX(-50%);background:#333;color:#fff;padding:10px 24px;border-radius:8px;font-size:14px;opacity:0;transition:opacity .3s;z-index:400;pointer-events:none}
.toast.show{opacity:1}
.page-loading{position:fixed;inset:0;background:rgba(240,240,240,.94);display:flex;align-items:center;justify-content:center;z-index:500;transition:opacity .24s ease,visibility .24s ease}
.page-loading.is-hidden{opacity:0;visibility:hidden;pointer-events:none}
.page-loading-card{display:flex;align-items:center;gap:12px;padding:14px 18px;border-radius:14px;background:rgba(255,255,255,.96);box-shadow:0 10px 30px rgba(0,0,0,.08);color:#333;font-size:14px;font-weight:500}
.page-loading-spinner{width:18px;height:18px;border-radius:50%;border:2px solid rgba(193,95,60,.18);border-top-color:#C15F3C;animation:page-loading-spin .72s linear infinite;flex-shrink:0}
@keyframes page-loading-spin{to{transform:rotate(360deg)}}

/* === PREVIEW AREA === */
.workspace{flex:1;display:flex;flex-direction:column;overflow:hidden}

/* Preview mode */
.preview-area{flex:1;padding:20px;display:flex;justify-content:center;align-items:flex-start;overflow-y:auto}
#article-preview{width:100%;max-width:750px;align-self:flex-start;height:auto}

/* Source editor mode */
.source-area{flex:1;display:none;flex-direction:column;padding:16px 20px;overflow:hidden}
.source-area.visible{display:flex}
.source-area textarea{flex:1;width:100%;max-width:100%;padding:20px;border:none;border-radius:10px;background:#1e1e1e;color:#d4d4d4;font-family:"SF Mono",Consolas,Monaco,monospace;font-size:14px;line-height:1.7;resize:none;outline:none;tab-size:2}
.source-area textarea::selection{background:#264f78}
.source-info{color:#888;font-size:12px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center}

/* Editable mode */
#article-preview.editable{outline:none;cursor:text}
#article-preview.editable:focus{
  outline:2px dashed rgba(193,95,60,.5);
  outline-offset:10px;
  border-radius:8px
}
#article-preview.editable [data-article-img],
#article-preview.editable .image-placeholder{pointer-events:none;user-select:none}

/* === RENAME INPUT === */
.rename-input{background:#2a2a2a;border:1px solid #C15F3C;color:#fff;padding:2px 6px;border-radius:4px;font-size:13px;width:100%;outline:none}

/* === SCROLLBAR === */
.preview-area::-webkit-scrollbar{width:6px}
.preview-area::-webkit-scrollbar-thumb{background:#ccc;border-radius:6px}
.preview-area::-webkit-scrollbar-thumb:hover{background:#aaa}

/* === EMPTY STATE === */
.empty-state{display:flex;flex-direction:column;align-items:center;justify-content:center;height:200px;color:#666}
.empty-state .empty-icon{font-size:48px;margin-bottom:16px;opacity:.5}
.empty-state p{font-size:14px}

/* === EMOJI PICKER === */
.emoji-picker-panel{display:none;position:fixed;width:420px;background:#252525;border:1px solid #555;border-radius:12px;box-shadow:0 16px 48px rgba(0,0,0,.6);z-index:500;overflow:hidden}
.emoji-picker-panel.visible{display:block;animation:emojiIn .16s ease}
@keyframes emojiIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
.emoji-panel-arrow{position:absolute;top:-8px;left:24px;width:16px;height:8px;overflow:hidden}
.emoji-panel-arrow::after{content:'';position:absolute;top:4px;left:0;width:16px;height:16px;background:#252525;border:1px solid #555;border-radius:2px;transform:rotate(45deg)}
.emoji-picker-tabs{display:flex;padding:8px 10px 0;gap:4px;flex-wrap:wrap;border-bottom:1px solid #333}
.emoji-tab{background:none;border:1px solid transparent;color:#aaa;font-size:12px;padding:4px 10px;border-radius:16px;cursor:pointer;transition:all .15s;white-space:nowrap}
.emoji-tab:hover{background:#333;color:#fff}
.emoji-tab.active{background:#C15F3C;border-color:#C15F3C;color:#fff}
.emoji-grid{padding:10px;display:flex;flex-wrap:wrap;gap:3px;max-height:220px;overflow-y:auto}
.emoji-grid::-webkit-scrollbar{width:4px}
.emoji-grid::-webkit-scrollbar-thumb{background:#444;border-radius:4px}
.emoji-item{width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:20px;background:none;border:1px solid transparent;border-radius:8px;cursor:pointer;transition:all .1s}
.emoji-item:hover{background:#3a3a3a;border-color:#666;transform:scale(1.2);z-index:1}
.emoji-empty{color:#666;font-size:13px;padding:20px;text-align:center;width:100%}

/* Heading emoji suggestion bubble */
.emoji-suggest{display:none;position:absolute;background:#252525;border:1px solid #555;border-radius:8px;padding:5px 6px;gap:3px;box-shadow:0 4px 16px rgba(0,0,0,.5);z-index:160;animation:emojiIn .15s ease}
.emoji-suggest.show{display:flex}
.emoji-suggest-item{font-size:17px;padding:3px 5px;border-radius:6px;cursor:pointer;transition:all .1s}
.emoji-suggest-item:hover{background:#3a3a3a;transform:scale(1.15)}

/* Source editor heading hint */
.heading-emoji-hint{display:none;position:absolute;right:12px;top:0;background:#252525;border:1px solid #555;border-radius:8px;padding:4px 6px;gap:3px;z-index:60;box-shadow:0 2px 8px rgba(0,0,0,.3)}
.heading-emoji-hint.show{display:flex;flex-wrap:wrap;max-width:200px}
.heading-emoji-hint .hint-label{font-size:10px;color:#888;width:100%;margin-bottom:2px}
.is-hidden{display:none!important}
.btn-import{background:#333;border:none;color:#ccc;padding:8px 12px;border-radius:6px;font-size:13px;cursor:pointer;transition:all .2s;font-weight:500}
.btn-import:hover{background:#444;color:#fff}

/* === IMPORT MODAL === */
.import-modal{display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.6);z-index:600;align-items:center;justify-content:center}
.import-modal.show{display:flex}
.import-box{background:#252525;border:1px solid #555;border-radius:16px;padding:24px;width:90%;max-width:600px;max-height:80vh;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 16px 48px rgba(0,0,0,.5)}
.import-box h3{color:#fff;font-size:16px;margin-bottom:16px;display:flex;align-items:center;gap:8px}
.import-close{background:none;border:none;color:#888;font-size:20px;cursor:pointer;margin-left:auto;padding:4px}
.import-close:hover{color:#fff}
.import-section{margin-bottom:16px}
.import-section h4{color:#aaa;font-size:13px;margin-bottom:8px}
.import-section textarea{width:100%;height:160px;background:#1e1e1e;color:#d4d4d4;border:1px solid #444;border-radius:8px;padding:12px;font-size:13px;font-family:"SF Mono",Consolas,Monaco,monospace;resize:vertical;outline:none}
.import-section textarea::placeholder{color:#666}
.import-section input{width:100%;background:#1e1e1e;color:#d4d4d4;border:1px solid #444;border-radius:8px;padding:10px 12px;font-size:13px;outline:none}
.import-section input::placeholder{color:#666}
.import-section input:focus,.import-section textarea:focus{border-color:#C15F3C}
.import-actions{display:flex;gap:8px;justify-content:flex-end}
.import-hint{color:#666;font-size:11px;margin-top:4px}
</style>
</head>
<body>

<!-- Sidebar -->
<aside class="sidebar" id="sidebar">
  <div class="sidebar-header">
    <h2>📄 文章列表</h2>
    <button class="close-btn" onclick="toggleSidebar()" title="收起侧边栏">✕</button>
  </div>
  <div class="sidebar-list" id="article-list"></div>
</aside>

<!-- Import Modal -->
<div class="import-modal" id="import-modal">
  <div class="import-box">
    <h3>📥 导入 Markdown 文章 <button class="import-close" onclick="closeImportModal()">✕</button></h3>
    <div class="import-section">
      <h4>方式一：粘贴 Markdown 内容</h4>
      <textarea id="import-md-content" placeholder="在这里粘贴 Markdown 内容...&#10;&#10;支持标准 Markdown 格式，标题会自动提取。"></textarea>
    </div>
    <div class="import-section">
      <h4>方式二：输入文件路径（从 Claw 写作工作流导入）</h4>
      <input id="import-file-path" type="text" placeholder="例如：~/WorkBuddy/Claw/公众号写作/articles/xxx.md">
      <div class="import-hint">⚠️ 文件路径仅用于标识来源，实际内容请粘贴到上方文本框</div>
    </div>
    <div class="import-section">
      <h4>文章标题（留空则自动从内容提取）</h4>
      <input id="import-title" type="text" placeholder="输入标题，或留空自动提取...">
    </div>
    <div class="import-actions">
      <button class="btn" onclick="closeImportModal()">取消</button>
      <button class="btn btn-primary" onclick="doImport()">📥 导入</button>
    </div>
  </div>
</div>

<!-- Main content -->
<div class="main" id="main">
  <div class="toolbar">
    <button class="toggle-sidebar" id="btn-toggle-sidebar" onclick="toggleSidebar()" title="文章列表">☰</button>
    <div class="divider" id="sidebar-toggle-divider"></div>
    <div class="divider"></div>
    <span class="label">主题</span>
    <select id="theme-select"></select>
    <div class="divider mode-btns"></div>
    <button class="btn mode-btns" id="btn-preview" onclick="setMode('preview')" title="预览模式">👁 预览</button>
    <button class="btn mode-btns" id="btn-edit" onclick="setMode('edit')" title="编辑模式（点击文字直接修改）">✏️ 编辑</button>
    <button class="btn mode-btns" id="btn-source" onclick="setMode('source')" title="源码模式（Markdown 编辑）">&lt;/&gt; 源码</button>
    <div class="toolbar-right">
      <button class="btn" id="btn-emoji" onclick="toggleEmojiPicker()" title="插入 Emoji">😀</button>
      <button class="btn" onclick="copyArticleBody()">📋 复制正文</button>
      <button class="btn btn-primary" onclick="saveCurrentArticleToSource()">💾 保存</button>
      <button class="btn" onclick="createArticle()">＋ 新建</button>
      <button class="btn" onclick="importMarkdown()">📥 导入</button>
    </div>
  </div>

  <!-- Emoji Picker Panel -->
  <div class="emoji-picker-panel" id="emoji-picker">
    <div class="emoji-panel-arrow"></div>
    <div class="emoji-picker-tabs" id="emoji-tabs"></div>
    <div class="emoji-grid" id="emoji-grid"></div>
  </div>
  <div class="workspace">
    <div class="source-area" id="source-area">
      <div class="source-info">
        <span>Markdown 源码编辑（保存时自动渲染）</span>
        <span id="source-char-count">0 字</span>
      </div>
      <textarea id="source-editor" spellcheck="false"></textarea>
    </div>
    <div class="preview-area" id="preview-area">
      <div id="article-preview"></div>
    </div>
  </div>
</div>

<div class="toast" id="toast"></div>
<div class="page-loading" id="page-loading" aria-live="polite">
  <div class="page-loading-card">
    <div class="page-loading-spinner" aria-hidden="true"></div>
    <span>正在刷新文章列表...</span>
  </div>
</div>

<script>
const STYLES = ${stylesJS};
const IMAGES = ${JSON.stringify(images)};
const PRESET_ARTICLES = ${JSON.stringify(presetArticles)};
const PRESET_IDS = new Set(PRESET_ARTICLES.map(function(a) { return a.id; }));

const DEFAULT_TITLE = ${JSON.stringify(resolvedDefaultTitle)};
const DEFAULT_MD = \`${escapeJs(resolvedDefaultMd)}\`;

// === STATE ===
let articles = [];
let currentArticleId = null;
let currentMode = 'edit'; // preview | edit | source
let preferredArticleId = null;
let draftSyncTimer = null;

// === LOCALSTORAGE ===
const STORAGE_KEY = 'alltoppt-articles';
const SIDEBAR_KEY = 'alltoppt-sidebar-open';
const DRAFT_SYNC_DELAY = 400;
const DEFAULT_WECHAT_THEME = 'wechat-anthropic';
const DEFAULT_XHS_THEME = 'xhs-text';

function loadArticles() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      articles = JSON.parse(raw);
    }
  } catch(e) { articles = []; }

  articles.forEach(function(article) {
    if (!article || typeof article !== 'object') return;
    if (typeof article.hasLocalDraft !== 'boolean') article.hasLocalDraft = false;
    if (typeof article.sourceConflict !== 'boolean') article.sourceConflict = false;
    if (typeof article.savedTitle !== 'string') article.savedTitle = String(article.title || '');
    if (typeof article.savedMd !== 'string') article.savedMd = String(article.md || '');
    if (typeof article.sourceUpdatedAt !== 'number') {
      article.sourceUpdatedAt = typeof article.updatedAt === 'number' ? article.updatedAt : 0;
    }
    if (typeof article.sourceMd !== 'string') article.sourceMd = String(article.savedSourceMd || article.savedMd || article.md || '');
    if (typeof article.savedSourceMd !== 'string') article.savedSourceMd = String(article.sourceMd || article.savedMd || article.md || '');
    if (!article.imageRefMap || typeof article.imageRefMap !== 'object') article.imageRefMap = {};
    if (typeof article.preferredTheme !== 'string' || !article.preferredTheme) {
      article.preferredTheme = getDefaultThemeForArticle(article);
    }
  });

  // Initial page load should also refresh preset-backed articles from latest source.
  var _presetData = (typeof PRESET_ARTICLES !== 'undefined') ? PRESET_ARTICLES : (window.__PRESET_ARTICLES || []);
  if (_presetData.length > 0) {
    mergePresetData(_presetData, { rerenderCurrent: false });
  }
  const deduped = removeLegacyDuplicatesAgainstPresets(_presetData);
  if (deduped > 0) saveArticles();

  // Ensure at least one article
  if (articles.length === 0) {
    articles.push({
      id: genId(),
      title: DEFAULT_TITLE,
      md: DEFAULT_MD,
      channel: 'wechat',
      preferredTheme: DEFAULT_WECHAT_THEME,
      savedTitle: DEFAULT_TITLE,
      savedMd: DEFAULT_MD,
      hasLocalDraft: false,
      sourceConflict: false,
      sourceUpdatedAt: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    saveArticles();
  }
}

function saveArticles() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(articles));
  } catch(e) {}
}

function getCurrentArticle() {
  return articles.find(a => a.id === currentArticleId);
}

function getDefaultThemeForArticle(article) {
  return getArticleChannel(article) === 'xhs' ? DEFAULT_XHS_THEME : DEFAULT_WECHAT_THEME;
}

function getThemeForArticle(article) {
  if (!article) return DEFAULT_WECHAT_THEME;
  if (article.preferredTheme && STYLES[article.preferredTheme]) return article.preferredTheme;
  return getDefaultThemeForArticle(article);
}

function applyArticleTheme(article) {
  const select = document.getElementById('theme-select');
  if (!select) return;
  const themeKey = getThemeForArticle(article);
  if (select.value !== themeKey) {
    select.value = themeKey;
  }
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function normalizeArticleText(text) {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

function getArticleChannelForMerge(article) {
  if (!article) return 'wechat';
  if (article.channel === 'xhs' || article.channel === 'wechat') return article.channel;
  if (article.id && article.id.indexOf('preset-xhs-') === 0) return 'xhs';
  if (article.source && article.source.indexOf('/小红书/') !== -1) return 'xhs';
  return 'wechat';
}

function removeLegacyDuplicatesAgainstPresets(presets) {
  if (!Array.isArray(presets) || presets.length === 0) return 0;
  const presetMap = new Map();
  presets.forEach(function(p) {
    const channel = (p.channel === 'xhs' || p.channel === 'wechat') ? p.channel : getArticleChannelForMerge(p);
    const key = channel + '::' + normalizeArticleText(p.title);
    presetMap.set(key, normalizeArticleText(p.md));
  });

  const beforeLen = articles.length;
  articles = articles.filter(function(article) {
    if (article.source) return true;
    const channel = getArticleChannelForMerge(article);
    const key = channel + '::' + normalizeArticleText(article.title);
    if (!presetMap.has(key)) return true;
    return normalizeArticleText(article.md) !== presetMap.get(key);
  });
  return beforeLen - articles.length;
}

// === SIDEBAR ===
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const main = document.getElementById('main');
  sidebar.classList.toggle('collapsed');
  main.classList.toggle('expanded');
  localStorage.setItem(SIDEBAR_KEY, sidebar.classList.contains('collapsed') ? '0' : '1');
  updateSidebarToggleVisibility();
}

function initSidebar() {
  const open = localStorage.getItem(SIDEBAR_KEY);
  if (open === '0') {
    document.getElementById('sidebar').classList.add('collapsed');
    document.getElementById('main').classList.add('expanded');
  }
  updateSidebarToggleVisibility();
}

function updateSidebarToggleVisibility() {
  const sidebar = document.getElementById('sidebar');
  const toggleBtn = document.getElementById('btn-toggle-sidebar');
  const divider = document.getElementById('sidebar-toggle-divider');
  const isCollapsed = sidebar.classList.contains('collapsed');
  toggleBtn.classList.toggle('is-hidden', !isCollapsed);
  divider.classList.toggle('is-hidden', !isCollapsed);
}

function getArticleDisplayCharCount(article) {
  const md = String((article && article.md) || '');
  const inlineBase64ImageRe = new RegExp('!\\\\[[^\\\\]]*\\\\]\\\\(data:image/[^)]+\\\\)', 'gi');
  const markdownImageRe = new RegExp('!\\\\[[^\\\\]]*\\\\]\\\\([^)]+\\\\)', 'g');
  const markdownLinkRe = new RegExp('\\\\[([^\\\\]]+)\\\\]\\\\([^)]+\\\\)', 'g');
  const markdownImageMarkerRe = new RegExp('<!--IMG:[^>]+-->', 'g');
  const markdownHeadingRe = new RegExp('^#{1,6}\\\\s+', 'gm');
  const markdownSyntaxRe = new RegExp('[*_\\\\x60>#-]', 'g');
  const whitespaceRe = new RegExp('\\\\s+', 'g');
  const stripped = md
    .replace(inlineBase64ImageRe, '')
    .replace(markdownImageRe, '')
    .replace(markdownImageMarkerRe, '')
    .replace(markdownHeadingRe, '')
    .replace(markdownSyntaxRe, '')
    .replace(markdownLinkRe, '$1')
    .replace(whitespaceRe, '');
  return stripped.length;
}

function renderSidebarList() {
  const list = document.getElementById('article-list');
  list.innerHTML = '';
  // Sort by updatedAt desc
  const sorted = [...articles].sort((a, b) => b.updatedAt - a.updatedAt);
  if (sorted.length === 0) {
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">📝</div><p>暂无文章</p></div>';
    return;
  }
  sorted.forEach(article => {
    const item = document.createElement('div');
    item.className = 'article-item' + (article.id === currentArticleId ? ' active' : '');
    item.onclick = (e) => {
      if (e.target.closest('.item-action-btn') || e.target.closest('.rename-input')) return;
      switchArticle(article.id);
    };
    const timeStr = formatTime(article.updatedAt);
    const charCount = getArticleDisplayCharCount(article);
    const channel = getArticleChannel(article);
    const channelBadge = channel === 'xhs'
      ? '<span class="channel-badge xhs">小红书</span>'
      : '<span class="channel-badge wechat">公众号</span>';
    const draftBadge = article.hasLocalDraft
      ? '<span class="draft-badge">草稿中</span>'
      : '';
    item.innerHTML = \`
      <div class="item-dot"></div>
      <div class="item-info">
        <div class="item-title" id="title-\${article.id}">\${escapeHtml(article.title)}</div>
        <div class="item-meta">\${channelBadge}\${draftBadge}<span>\${timeStr} · \${charCount} 字</span></div>
      </div>
      <div class="item-actions">
        <button class="item-action-btn" onclick="event.stopPropagation();startRename('\${article.id}')" title="重命名">✏️</button>
        <button class="item-action-btn delete" onclick="event.stopPropagation();deleteArticle('\${article.id}')" title="删除">🗑</button>
      </div>\`;
    list.appendChild(item);
  });
}

function getArticleChannel(article) {
  if (!article) return 'wechat';
  if (article.channel === 'xhs' || article.channel === 'wechat') return article.channel;
  if (article.id && article.id.indexOf('preset-xhs-') === 0) return 'xhs';
  if (article.source && article.source.indexOf('/小红书/') !== -1) return 'xhs';
  return 'wechat';
}

function formatTime(ts) {
  const d = new Date(ts);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return Math.floor(diff / 60000) + ' 分钟前';
  if (diff < 86400000) return Math.floor(diff / 3600000) + ' 小时前';
  if (diff < 604800000) return Math.floor(diff / 86400000) + ' 天前';
  return d.getMonth() + 1 + '/' + d.getDate();
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// === ARTICLE CRUD ===
function createArticle() {
  const article = {
    id: genId(),
    title: '无标题文章',
    md: '在这里开始写作...\\n\\n---\\n\\n## 第一节\\n\\n写点什么吧。',
    channel: 'wechat',
    preferredTheme: DEFAULT_WECHAT_THEME,
    savedTitle: '无标题文章',
    savedMd: '在这里开始写作...\\n\\n---\\n\\n## 第一节\\n\\n写点什么吧。',
    hasLocalDraft: false,
    sourceConflict: false,
    sourceUpdatedAt: 0,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  articles.unshift(article);
  saveArticles();
  switchArticle(article.id);
  localStorage.setItem(STORAGE_KEY + '-current', article.id);
  showToast('✅ 已创建新文章');
}

function switchArticle(id) {
  // Save current before switching
  try {
    if (currentArticleId && currentMode === 'edit') {
      syncFromEditable();
    }
    if (currentArticleId && currentMode === 'source') {
      syncFromSource();
    }
  } catch (err) {
    console.error('switchArticle sync failed:', err);
  }
  currentArticleId = id;
  localStorage.setItem(STORAGE_KEY + '-current', id);
  applyArticleTheme(getCurrentArticle());
  renderPreview();
  renderSidebarList();
}

function deleteArticle(id) {
  if (articles.length <= 1) {
    showToast('⚠️ 至少保留一篇文章');
    return;
  }
  const article = articles.find(a => a.id === id);
  if (!article) return;
  // Simple inline confirm
  const name = article.title || '无标题文章';
  articles = articles.filter(a => a.id !== id);
  saveArticles();
  if (id === currentArticleId) {
    currentArticleId = articles[0].id;
    renderPreview();
  }
  renderSidebarList();
  showToast('🗑 已删除「' + name + '」');
}

function startRename(id) {
  const article = articles.find(a => a.id === id);
  if (!article) return;
  const titleEl = document.getElementById('title-' + id);
  if (!titleEl) return;
  const input = document.createElement('input');
  input.className = 'rename-input';
  input.value = article.title;
  input.onclick = e => e.stopPropagation();
  titleEl.replaceWith(input);
  input.focus();
  input.select();
  const finish = () => {
    const newTitle = input.value.trim() || '无标题文章';
    article.title = newTitle;
    article.updatedAt = Date.now();
    saveArticles();
    renderSidebarList();
    // Also update the h1 in preview if this is current
    if (id === currentArticleId) {
      const h1 = document.querySelector('#article-preview > h1');
      if (h1) h1.textContent = newTitle;
    }
  };
  input.addEventListener('blur', finish);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') { input.blur(); }
    if (e.key === 'Escape') { input.value = article.title; input.blur(); }
  });
}

// === RENDER ===
function renderPreview() {
  const article = getCurrentArticle();
  if (!article) return;
  applyArticleTheme(article);
  const preview = document.getElementById('article-preview');
  const html = marked.parse(article.md);
  preview.innerHTML = html;

  // Replace <!--IMG:key--> comment nodes
  replaceCommentNodes(preview);
  hydrateMarkdownImages(article, preview);

  // Style all article images after sources have been resolved.
  preview.querySelectorAll('img').forEach(function(img) {
    if (!img.hasAttribute('data-article-img')) {
      img.setAttribute('data-article-img', '1');
    }
    img.style.cssText = 'max-width:100%;border-radius:8px;margin:16px auto;display:block;box-shadow:0 4px 16px rgba(0,0,0,0.1);';
  });

  // Insert title
  const h1 = document.createElement('h1');
  h1.textContent = article.title;
  preview.insertBefore(h1, preview.firstChild);

  // Apply current theme
  applyTheme(document.getElementById('theme-select').value);

  // Update source editor if in source mode
  if (currentMode === 'source') {
    document.getElementById('source-editor').value = article.md;
    updateCharCount();
  }

  if (currentMode === 'edit') {
    enableEditablePreview();
  }
}

function isArticleDraft(article, nextTitle, nextMd) {
  if (!article) return false;
  return String(nextTitle || '') !== String(article.savedTitle || '') ||
    String(nextMd || '') !== String(article.savedMd || '');
}

function setArticleDraftState(article, isDraft) {
  if (!article || article.hasLocalDraft === isDraft) return false;
  article.hasLocalDraft = isDraft;
  saveArticles();
  renderSidebarList();
  return true;
}

function applyDraftSnapshot(article, nextTitle, nextMd) {
  if (!article) return false;
  const normalizedTitle = String(nextTitle || '').trim() || '无标题文章';
  const normalizedMd = String(nextMd || '');
  const nextDraftState = isArticleDraft(article, normalizedTitle, normalizedMd);
  let changed = false;

  if (article.title !== normalizedTitle) {
    article.title = normalizedTitle;
    changed = true;
  }
  if (article.md !== normalizedMd) {
    article.md = normalizedMd;
    changed = true;
  }
  if (article.hasLocalDraft !== nextDraftState) {
    article.hasLocalDraft = nextDraftState;
    changed = true;
  }

  if (!changed) return false;
  article.updatedAt = Date.now();
  article.sourceConflict = false;
  saveArticles();
  renderSidebarList();
  return true;
}

function normalizeImageRefMap(map) {
  if (!map || typeof map !== 'object') return {};
  return map;
}

function restoreSourceMarkdown(article, displayMd) {
  var md = String(displayMd || '');
  var imageRefMap = normalizeImageRefMap(article && article.imageRefMap);

  Object.keys(imageRefMap).forEach(function(label) {
    var imageRef = imageRefMap[label];
    if (!imageRef || !imageRef.src) return;
    var commentToken = '<!--IMG:' + label + '-->';
    var markdownText = imageRef.markdown || ('![' + label + '](' + imageRef.src + ')');
    md = md.split(commentToken).join(markdownText);
  });

  var inlineImagePattern = new RegExp('!\\\\[([^\\\\]]*)\\\\]\\\\((data:image[^)]+)\\\\)', 'g');
  md = md.replace(inlineImagePattern, function(match, alt) {
    var imageRef = imageRefMap[alt];
    if (!imageRef || !imageRef.src) return match;
    return imageRef.markdown || ('![' + alt + '](' + imageRef.src + ')');
  });

  return md;
}

function getEditableArticleSnapshot() {
  const preview = document.getElementById('article-preview');
  const snapshot = preview.cloneNode(true);
  snapshot.classList.remove('editable');
  snapshot.contentEditable = 'false';
  const nextTitleFallback = '无标题文章';
  let nextTitle = '';

  const h1 = snapshot.querySelector(':scope > h1');
  if (h1) {
    nextTitle = h1.textContent.trim() || nextTitleFallback;
    h1.remove();
  }

  snapshot.querySelectorAll('img[data-article-img]').forEach(img => {
    const imageKind = img.getAttribute('data-image-kind') || 'placeholder';
    if (imageKind === 'markdown') {
      const originalSrc = img.getAttribute('data-source-src') || '';
      const markdownText = '![' + (img.alt || '') + '](' + originalSrc + ')';
      img.replaceWith(document.createTextNode(markdownText));
      return;
    }
    const comment = document.createComment('IMG:' + img.alt);
    img.replaceWith(comment);
  });
  snapshot.querySelectorAll('[contenteditable]').forEach(el => {
    el.removeAttribute('contenteditable');
  });

  let normalizedHtml = snapshot.innerHTML
    .replace(/<div><br><\\\/div>/gi, '<br>')
    .replace(/<div>/gi, '<p>')
    .replace(/<\\\/div>/gi, '</p>');
  let md = htmlToMarkdown(normalizedHtml);

  return {
    title: nextTitle || nextTitleFallback,
    md: md
  };
}

function syncEditableDraftNow() {
  const article = getCurrentArticle();
  if (!article) return false;
  const snapshot = getEditableArticleSnapshot();
  return applyDraftSnapshot(article, snapshot.title, snapshot.md);
}

function syncSourceDraftNow() {
  const article = getCurrentArticle();
  if (!article) return false;
  const sourceEditor = document.getElementById('source-editor');
  if (!sourceEditor) return false;
  const md = sourceEditor.value;
  const nextTitle = extractTitle(md) || article.title;
  return applyDraftSnapshot(article, nextTitle, md);
}

function flushDraftSync() {
  if (draftSyncTimer) {
    clearTimeout(draftSyncTimer);
    draftSyncTimer = null;
  }
  if (currentMode === 'edit') return syncEditableDraftNow();
  if (currentMode === 'source') return syncSourceDraftNow();
  return false;
}

function scheduleDraftSync() {
  if (draftSyncTimer) clearTimeout(draftSyncTimer);
  draftSyncTimer = setTimeout(() => {
    draftSyncTimer = null;
    flushDraftSync();
  }, DRAFT_SYNC_DELAY);
}

function enableEditablePreview() {
  const preview = document.getElementById('article-preview');
  preview.classList.add('editable');
  preview.contentEditable = 'true';
  preview.spellcheck = true;
  preview.oninput = function() {
    const article = getCurrentArticle();
    if (!article) return;
    if (!article.hasLocalDraft) setArticleDraftState(article, true);
    scheduleDraftSync();
  };
  preview.querySelectorAll('img[data-article-img], .image-placeholder').forEach(el => {
    el.contentEditable = 'false';
    el.draggable = false;
  });
  if (typeof initHeadingEmojiHints === 'function') {
    initHeadingEmojiHints();
  }
}

function isAbsoluteImageSrc(src) {
  var value = String(src || '').trim().toLowerCase();
  return value.indexOf('http://') === 0 ||
    value.indexOf('https://') === 0 ||
    value.indexOf('//') === 0 ||
    value.indexOf('data:') === 0 ||
    value.indexOf('blob:') === 0;
}

function buildArticleAssetUrl(article, rawSrc) {
  let src = String(rawSrc || '').trim();
  try {
    src = decodeURIComponent(src);
  } catch (err) {
    // Keep the original src if it is not a valid encoded URI component.
  }
  if (!src || isAbsoluteImageSrc(src)) return src;
  if (src[0] === '/') return src;
  if (!article || !article.source) return src;
  var articleDir = article.source.replace(/[^/]+$/, '');
  var channelRoot = articleDir.replace(/articles\\/$/, '');
  var absolutePath = src;
  if (src.indexOf('~/') === 0) {
    absolutePath = src.slice(1);
  } else if (src.indexOf('images/') === 0 || src.indexOf('collection-covers/') === 0) {
    // Claw article markdown uses paths relative to the channel root, not the articles folder.
    absolutePath = channelRoot + src;
  } else {
    absolutePath = articleDir + src;
  }
  return '/api/local-file?path=' + encodeURIComponent(absolutePath);
}

function hydrateMarkdownImages(article, preview) {
  preview.querySelectorAll('img').forEach(function(img) {
    if (img.hasAttribute('data-article-img')) return;
    var rawSrc = img.getAttribute('src') || '';
    img.setAttribute('data-source-src', rawSrc);
    img.setAttribute('data-image-kind', 'markdown');
    img.setAttribute('data-article-img', '1');
    img.src = buildArticleAssetUrl(article, rawSrc);
  });
}

function replaceCommentNodes(parent) {
  for (let i = parent.childNodes.length - 1; i >= 0; i--) {
    const node = parent.childNodes[i];
    if (node.nodeType === 8) {
      const match = node.textContent.match(/^IMG:(.+)$/);
      if (match) {
        const label = match[1];
        if (IMAGES[label]) {
          const img = document.createElement('img');
          img.src = IMAGES[label];
          img.alt = label;
          img.setAttribute('data-article-img', '1');
          img.setAttribute('data-image-kind', 'placeholder');
          img.style.cssText = 'max-width:100%;border-radius:8px;margin:16px auto;display:block;box-shadow:0 4px 16px rgba(0,0,0,0.1);';
          parent.replaceChild(img, node);
        } else {
          const placeholder = document.createElement('div');
          placeholder.className = 'image-placeholder';
          placeholder.setAttribute('data-article-img', '1');
          placeholder.setAttribute('data-missing-image', label);
          placeholder.innerHTML = '<strong>图片占位：' + escapeHtml(label) + '</strong><span>还没有可用图片。你可以补图，或确认这一处是否还需要图片。</span>';
          parent.replaceChild(placeholder, node);
        }
      }
    } else if (node.nodeType === 1) {
      replaceCommentNodes(node);
    }
  }
}

// === THEME ===
function applyTheme(themeKey) {
  const theme = STYLES[themeKey];
  if (!theme) return;
  const preview = document.getElementById('article-preview');
  preview.setAttribute('style', theme.styles.container);
  const tagMap = {
    'H1':'h1','H2':'h2','H3':'h3','H4':'h4','H5':'h5','H6':'h6',
    'P':'p','STRONG':'strong','EM':'em','A':'a',
    'UL':'ul','OL':'ol','LI':'li',
    'BLOCKQUOTE':'blockquote','CODE':'code','PRE':'pre',
    'HR':'hr','IMG':'img',
    'TABLE':'table','TH':'th','TD':'td','TR':'tr'
  };
  Object.entries(tagMap).forEach(([tag, styleKey]) => {
    if (!theme.styles[styleKey]) return;
    preview.querySelectorAll(tag).forEach(el => {
      if (el.hasAttribute('data-article-img')) return;
      el.setAttribute('style', theme.styles[styleKey]);
    });
  });
  preview.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(el => {
    if (['标题候选（3 选 1）', '正式标题候选', '20字标题候选'].includes(el.textContent.trim()) && theme.styles.p) {
      el.setAttribute('style', theme.styles.p);
    }
  });
  preview.querySelectorAll('pre code').forEach(el => {
    el.setAttribute('style', 'color:inherit;background:inherit;padding:0;border-radius:0;font-size:inherit;');
  });
}

// === MODES ===
function setMode(mode) {
  const article = getCurrentArticle();
  if (!article) return;

  // Sync from previous mode
  try {
    if (currentMode === 'edit') syncFromEditable();
    if (currentMode === 'source') syncFromSource();
  } catch (err) {
    console.error('setMode sync failed:', err);
  }

  currentMode = mode;

  const previewArea = document.getElementById('preview-area');
  const sourceArea = document.getElementById('source-area');
  const preview = document.getElementById('article-preview');
  const btnPreview = document.getElementById('btn-preview');
  const btnEdit = document.getElementById('btn-edit');
  const btnSource = document.getElementById('btn-source');

  // Reset states
  btnPreview.classList.remove('active');
  btnEdit.classList.remove('active');
  btnSource.classList.remove('active');
  preview.classList.remove('editable');
  preview.contentEditable = 'false';
  sourceArea.classList.remove('visible');
  previewArea.style.display = '';

  if (mode === 'preview') {
    btnPreview.classList.add('active');
    renderPreview();
  } else if (mode === 'edit') {
    btnEdit.classList.add('active');
    renderPreview();
  } else if (mode === 'source') {
    btnSource.classList.add('active');
    previewArea.style.display = 'none';
    sourceArea.classList.add('visible');
    if (typeof initSourceHeadingHints === 'function') {
      initSourceHeadingHints();
    }
    document.getElementById('source-editor').value = article.md;
    updateCharCount();
  }
}

function syncFromEditable() {
  const article = getCurrentArticle();
  if (!article) return false;
  const preview = document.getElementById('article-preview');
  if (!preview || !preview.firstChild) return false;
  const wasEditable = preview.classList.contains('editable');
  const changed = syncEditableDraftNow();

  if (wasEditable && currentMode === 'edit') {
    enableEditablePreview();
  }
  return changed;
}

function syncFromSource() {
  return syncSourceDraftNow();
}

function extractTitle(md) {
  const firstLine = md.trim().split('\\n')[0];
  if (firstLine.startsWith('# ')) return firstLine.slice(2).trim();
  // Use first non-empty line as title if no h1
  if (firstLine.length > 0 && firstLine.length < 80) return firstLine.trim();
  return null;
}

function updateCharCount() {
  const editor = document.getElementById('source-editor');
  const count = editor.value.length;
  document.getElementById('source-char-count').textContent = count + ' 字';
}

// Simple HTML to Markdown converter (handles common elements)
// Defined as a separate function to avoid template literal escaping issues
const HTML_TO_MD = (function() { return function htmlToMarkdown(html) {
  if (!html) return '';
  let md = html;
  md = md.replace(/\\s*style="[^"]*"/g, '');
  var rules = [
    [/<h1[^>]*>(.*?)<\\/h1>/gi, '# $1\\n\\n'],
    [/<h2[^>]*>(.*?)<\\/h2>/gi, '## $1\\n\\n'],
    [/<h3[^>]*>(.*?)<\\/h3>/gi, '### $1\\n\\n'],
    [/<h4[^>]*>(.*?)<\\/h4>/gi, '#### $1\\n\\n'],
    [/<h5[^>]*>(.*?)<\\/h5>/gi, '##### $1\\n\\n'],
    [/<h6[^>]*>(.*?)<\\/h6>/gi, '###### $1\\n\\n'],
    [/<strong[^>]*>(.*?)<\\/strong>/gi, '**$1**'],
    [/<b[^>]*>(.*?)<\\/b>/gi, '**$1**'],
    [/<em[^>]*>(.*?)<\\/em>/gi, '*$1*'],
    [/<i[^>]*>(.*?)<\\/i>/gi, '*$1*'],
    [/<code[^>]*>(.*?)<\\/code>/gi, '\x60$1\x60'],
    [/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\\/a>/gi, '[$2]($1)'],
    [/<hr[^>]*>/gi, '\\n---\\n\\n'],
    [/<li[^>]*>(.*?)<\\/li>/gi, '- $1\\n'],
    [/<ul[^>]*>|<\\/ul>/gi, '\\n'],
    [/<ol[^>]*>|<\\/ol>/gi, '\\n'],
    [/<t[dh][^>]*>(.*?)<\\/t[dh]>/gi, '| $1 '],
    [/<tr[^>]*>/gi, '\\n|'],
    [/<\\/tr>/gi, '|\\n'],
    [/<table[^>]*>|<\\/table>/gi, '\\n'],
    [/<p[^>]*>(.*?)<\\/p>/gi, '$1\\n\\n'],
    [/<br[^>]*>/gi, '\\n'],
    [/<[^>]+>/g, '']
  ];
  rules.forEach(function(r) { md = md.replace(r[0], r[1]); });
  md = md.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  md = md.replace(/\\n{3,}/g, '\\n\\n');
  return md.trim();
}; })();

// === CLIPBOARD ===
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}

function setPageLoading(visible) {
  const loading = document.getElementById('page-loading');
  if (!loading) return;
  loading.classList.toggle('is-hidden', !visible);
}

function showFatalBootError(err) {
  const loading = document.getElementById('page-loading');
  if (!loading) return;
  const card = loading.querySelector('.page-loading-card');
  if (card) {
    card.innerHTML = '<span style="color:#c0392b;font-weight:700;">编辑器启动失败</span><span style="max-width:520px;line-height:1.5;display:block;">' + escapeHtml(String(err && err.message || err || '未知错误')) + '</span>';
  }
  loading.classList.remove('is-hidden');
}

function syncCurrentArticleIntoDraft() {
  if (currentMode === 'edit') return syncFromEditable();
  if (currentMode === 'source') return syncFromSource();
  return false;
}

async function saveCurrentArticleToSource() {
  try {
    syncCurrentArticleIntoDraft();
  } catch (err) {
    console.error('saveCurrentArticleToSource sync failed:', err);
  }

  const article = getCurrentArticle();
  if (!article) {
    showToast('⚠️ 当前没有可保存的文章');
    return;
  }

  if (!article.source) {
    article.savedTitle = article.title;
    article.savedMd = article.md;
    article.hasLocalDraft = false;
    saveArticles();
    showToast('✅ 已保存，当前文章未关联 md 文件');
    return;
  }

  try {
    const sourceMd = restoreSourceMarkdown(article, article.md);
    const res = await fetch('/api/article/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: article.source,
        title: article.title,
        md: sourceMd
      })
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      throw new Error((data && data.message) || 'save_failed');
    }
    article.savedTitle = article.title;
    article.savedMd = article.md;
    article.sourceMd = sourceMd;
    article.savedSourceMd = sourceMd;
    article.hasLocalDraft = false;
    article.sourceConflict = false;
    if (typeof data.sourceUpdatedAt === 'number') {
      article.sourceUpdatedAt = data.sourceUpdatedAt;
    }
    article.updatedAt = Date.now();
    saveArticles();
    renderSidebarList();
    showToast('✅ 已保存并回写 md');
  } catch (err) {
    console.error('saveCurrentArticleToSource failed:', err);
    showToast('⚠️ 回写 md 失败，当前内容已保留为草稿');
  }
}

async function copyToWechat() {
  // Sync current edits first
  if (currentMode === 'edit') syncFromEditable();
  if (currentMode === 'source') syncFromSource();

  const preview = document.getElementById('article-preview');
  const html = preview.innerHTML;
  const text = preview.innerText;
  try {
    const htmlBlob = new Blob([html], { type: 'text/html' });
    const textBlob = new Blob([text], { type: 'text/plain' });
    await navigator.clipboard.write([
      new ClipboardItem({ 'text/html': htmlBlob, 'text/plain': textBlob })
    ]);
    showToast('✅ 已复制到剪贴板，可直接粘贴到公众号后台！');
  } catch (e) {
    const range = document.createRange();
    range.selectNodeContents(preview);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    document.execCommand('copy');
    sel.removeAllRanges();
    showToast('✅ 已复制（兼容模式）');
  }
}

function getBodyOnlyPreviewClone() {
  const preview = document.getElementById('article-preview');
  const clone = preview.cloneNode(true);
  const nodes = Array.from(clone.childNodes);
  let bodyHeading = null;
  for (const node of nodes) {
    if (node.nodeType === 1 && /^H[1-6]$/.test(node.tagName) && node.textContent.trim() === '正文') {
      bodyHeading = node;
      break;
    }
  }
  if (!bodyHeading) return clone;
  let node = clone.firstChild;
  while (node) {
    const next = node.nextSibling;
    clone.removeChild(node);
    if (node === bodyHeading) break;
    node = next;
  }
  while (clone.firstChild && clone.firstChild.nodeType === 1 && clone.firstChild.tagName === 'HR') {
    clone.removeChild(clone.firstChild);
  }
  return clone;
}

async function copyArticleBody() {
  try {
    if (currentMode === 'edit') syncFromEditable();
    if (currentMode === 'source') syncFromSource();
    renderPreview();
  } catch (err) {
    console.error('copyArticleBody sync failed:', err);
  }
  const clone = getBodyOnlyPreviewClone();
  const html = clone.innerHTML;
  const host = document.createElement('div');
  host.style.position = 'fixed';
  host.style.left = '-9999px';
  host.appendChild(clone);
  document.body.appendChild(host);
  const text = host.innerText || host.textContent || '';
  try {
    const htmlBlob = new Blob([html], { type: 'text/html' });
    const textBlob = new Blob([text], { type: 'text/plain' });
    await navigator.clipboard.write([
      new ClipboardItem({ 'text/html': htmlBlob, 'text/plain': textBlob })
    ]);
    document.body.removeChild(host);
    showToast('✅ 已复制正文');
  } catch (e) {
    try {
      const range = document.createRange();
      range.selectNodeContents(host);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      document.execCommand('copy');
      sel.removeAllRanges();
      showToast('✅ 已复制正文（兼容模式）');
    } catch (fallbackErr) {
      console.error('copyArticleBody failed:', fallbackErr);
      showToast('⚠️ 复制失败，请重试');
    } finally {
      document.body.removeChild(host);
    }
  }
}

function handleEditableUndoRedo(event) {
  if (currentMode !== 'edit') return false;
  const preview = document.getElementById('article-preview');
  if (!preview || !preview.classList.contains('editable')) return false;
  if (!(event.metaKey || event.ctrlKey) || event.altKey) return false;
  if (event.key.toLowerCase() !== 'z') return false;

  event.preventDefault();
  preview.focus();
  const command = event.shiftKey ? 'redo' : 'undo';
  const applied = document.execCommand(command);
  if (applied !== false) {
    scheduleDraftSync();
  }
  return true;
}

// === KEYBOARD SHORTCUTS ===
document.addEventListener('keydown', e => {
  if (handleEditableUndoRedo(e)) return;
  // Ctrl/Cmd + S: save
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    saveCurrentArticleToSource();
  }
  // Ctrl/Cmd + E: toggle edit mode
  if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
    e.preventDefault();
    setMode(currentMode === 'edit' ? 'preview' : 'edit');
  }
  // Ctrl/Cmd + B: toggle sidebar
  if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
    e.preventDefault();
    toggleSidebar();
  }
  // Esc: exit edit/source mode
  if (e.key === 'Escape' && (currentMode === 'edit' || currentMode === 'source')) {
    setMode('preview');
  }
});

// === SOURCE EDITOR EVENTS ===
document.addEventListener('DOMContentLoaded', () => {
  const sourceEditor = document.getElementById('source-editor');
  // Tab key support
  sourceEditor.addEventListener('keydown', e => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = sourceEditor.selectionStart;
      const end = sourceEditor.selectionEnd;
      sourceEditor.value = sourceEditor.value.substring(0, start) + '  ' + sourceEditor.value.substring(end);
      sourceEditor.selectionStart = sourceEditor.selectionEnd = start + 2;
    }
    // Ctrl+Enter: render preview
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      syncFromSource();
      setMode('preview');
      showToast('✅ 已保存并渲染');
    }
  });

  sourceEditor.addEventListener('input', () => {
    updateCharCount();
    const article = getCurrentArticle();
    if (!article) return;
    if (!article.hasLocalDraft) setArticleDraftState(article, true);
    scheduleDraftSync();
  });
});

window.addEventListener('beforeunload', () => {
  try {
    flushDraftSync();
  } catch (err) {
    console.error('beforeunload draft sync failed:', err);
  }
});

// === INIT ===
function init() {
  // Load themes
  const select = document.getElementById('theme-select');
  Object.keys(STYLES).forEach(key => {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = STYLES[key].name;
    select.appendChild(opt);
  });
  select.value = DEFAULT_WECHAT_THEME;
  select.addEventListener('change', () => {
    const article = getCurrentArticle();
    if (article) {
      article.preferredTheme = select.value;
      saveArticles();
    }
    applyTheme(select.value);
  });

  marked.setOptions({ breaks: true, gfm: true });

  // Load articles
  preferredArticleId = localStorage.getItem(STORAGE_KEY + '-current');
  loadArticles();
  initSidebar();

  // Restore last viewed article, or fall back to most recent
  const lastViewedId = preferredArticleId;
  if (lastViewedId && articles.find(a => a.id === lastViewedId)) {
    currentArticleId = lastViewedId;
  } else {
    const sorted = [...articles].sort((a, b) => b.updatedAt - a.updatedAt);
    currentArticleId = sorted[0].id;
    if (!lastViewedId) {
      localStorage.setItem(STORAGE_KEY + '-current', currentArticleId);
      preferredArticleId = currentArticleId;
    }
  }

  renderSidebarList();
  applyArticleTheme(getCurrentArticle());
  setMode('edit');
  setPageLoading(false);
}

// === IMPORT MARKDOWN ===
function importMarkdown() {
  document.getElementById('import-modal').classList.add('show');
  document.getElementById('import-md-content').value = '';
  document.getElementById('import-file-path').value = '';
  document.getElementById('import-title').value = '';
  document.getElementById('import-md-content').focus();
}

function closeImportModal() {
  document.getElementById('import-modal').classList.remove('show');
}

function doImport() {
  const mdContent = document.getElementById('import-md-content').value.trim();
  const filePath = document.getElementById('import-file-path').value.trim();
  const customTitle = document.getElementById('import-title').value.trim();

  if (!mdContent) {
    showToast('⚠️ 请粘贴 Markdown 内容');
    return;
  }

  // Extract title: first H1, or first non-empty line, or filename, or custom
  let title = customTitle;
  if (!title) {
    const h1Match = mdContent.match(/^#\s+(.+)$/m);
    if (h1Match) {
      title = h1Match[1].trim();
    } else {
      const firstLine = mdContent.split('\\n').find(l => l.trim().length > 0);
      title = firstLine ? firstLine.trim().slice(0, 50) : '导入文章';
    }
  }

  // Clean up: remove leading H1 from content if it was used as title
  let md = mdContent;
  if (!customTitle) {
    const h1Match = md.match(new RegExp("^#\\s+.+\\n*"));
    if (h1Match) {
      md = md.slice(h1Match[0].length).trim();
    }
  }

  // Replace image paths with <!--IMG:--> markers or keep as-is
  // Convert ![alt](path) to <!--IMG:label--> if path contains screenshots/compressed
  md = md.replace(/!\\[([^\\]]*)\\]\\(([^)]+)\\)/g, function(match, alt, src) {
    // Extract filename without extension as label
    const filename = src.split('/').pop().replace(/\.[^.]+$/, '');
    // Keep as markdown image for now (editor will handle display)
    return match;
  });

  const article = {
    id: genId(),
    title: title,
    md: md,
    source: filePath || '',
    savedTitle: title,
    savedMd: md,
    hasLocalDraft: false,
    sourceConflict: false,
    sourceUpdatedAt: 0,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  articles.unshift(article);
  saveArticles();
  closeImportModal();
  switchArticle(article.id);
  localStorage.setItem(STORAGE_KEY + '-current', article.id);
  showToast('✅ 已导入「' + title + '」');
}


function buildPresetArticle(p) {
  return {
    id: p.id,
    title: p.title,
    md: p.md,
    sourceMd: p.sourceMd || p.md,
    imageRefMap: p.imageRefMap || {},
    source: p.source || '',
    channel: p.channel || getArticleChannelForMerge(p),
    preferredTheme: p.preferredTheme || getDefaultThemeForArticle(p),
    savedTitle: p.title,
    savedMd: p.md,
    savedSourceMd: p.sourceMd || p.md,
    sourceUpdatedAt: p.updatedAt,
    hasLocalDraft: false,
    sourceConflict: false,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt
  };
}

function mergePresetData(presets, options) {
  options = options || {};
  if (!presets || presets.length === 0) return;

  // Step 1: Clean up stale preset articles from localStorage
  // Remove articles that came from Claw (have source) but are no longer in preset data
  var presetSourceSet = new Set();
  var presetIdSet = new Set();
  presets.forEach(function(p) {
    if (p.source) presetSourceSet.add(p.source);
    presetIdSet.add(p.id);
  });

  var beforeLen = articles.length;
  articles = articles.filter(function(a) {
    // Keep non-preset articles (user-created)
    if (!a.source) return true;
    // Keep preset articles that still exist in current preset data
    if (presetSourceSet.has(a.source)) return true;
    // Remove preset articles whose source no longer exists
    return false;
  });
  var removed = beforeLen - articles.length;
  removed += removeLegacyDuplicatesAgainstPresets(presets);

  // Step 2: Merge new presets and update changed ones
  var existingBySource = new Map();
  var existingById = new Map();
  articles.forEach(function(a) {
    if (a.source) existingBySource.set(a.source, a);
    existingById.set(a.id, a);
  });

  var added = 0;
  var updated = 0;
  for (var i = 0; i < presets.length; i++) {
    var p = presets[i];
    var existing = (p.source && existingBySource.get(p.source)) || existingById.get(p.id);
    if (!existing) {
      // New article
      articles.push(buildPresetArticle(p));
      existingBySource.set(p.source || '', articles[articles.length - 1]);
      existingById.set(p.id, articles[articles.length - 1]);
      added++;
    } else if (p.updatedAt && existing.sourceUpdatedAt !== p.updatedAt) {
      if (existing.hasLocalDraft) {
        existing.sourceUpdatedAt = p.updatedAt;
        existing.sourceConflict = true;
      } else {
        // Article content has been updated in Claw workflow
        existing.title = p.title;
        existing.md = p.md;
        existing.sourceMd = p.sourceMd || p.md;
        existing.imageRefMap = p.imageRefMap || {};
        existing.channel = p.channel || getArticleChannelForMerge(p);
        if (!existing.preferredTheme || !STYLES[existing.preferredTheme]) {
          existing.preferredTheme = p.preferredTheme || getDefaultThemeForArticle(p);
        }
        existing.savedTitle = p.title;
        existing.savedMd = p.md;
        existing.savedSourceMd = p.sourceMd || p.md;
        existing.updatedAt = p.updatedAt;
        existing.sourceUpdatedAt = p.updatedAt;
        existing.sourceConflict = false;
      }
      updated++;
    }
  }
  if (added > 0 || removed > 0 || updated > 0) {
    saveArticles();
    renderSidebarList();
    // If current article was updated, reload it
    if (updated > 0 && options.rerenderCurrent !== false) {
      var cur = articles.find(function(a) { return a.id === currentArticleId; });
      if (cur) switchArticle(cur.id);
    }
    console.log('Merged ' + added + ' new, updated ' + updated + ', removed ' + removed + ' preset articles');
  }
}

// Merge preset articles from Claw workflow
function mergePresets() {
  var presets = window.__PRESET_ARTICLES;
  mergePresetData(presets, { rerenderCurrent: true });
}

try {
  window.__PRESET_ARTICLES = PRESET_ARTICLES;
  window.__PRESET_IDS = PRESET_IDS;
  init();
  window.__EDITOR_BOOTSTRAPPED = true;
} catch (err) {
  console.error('editor boot failed:', err);
  window.__EDITOR_BOOTSTRAPPED = false;
  showFatalBootError(err);
}


<\/script>
<script>
// Auto-polling: check for preset-articles.json changes every 5 seconds
(function() {
  var POLL_INTERVAL = 5000;
  var lastContentHash = JSON.stringify(PRESET_ARTICLES || []);
  var hasBootstrapped = false;

  function bootstrapInit() {
    if (hasBootstrapped) return;
    hasBootstrapped = true;
    try {
      init();
      window.__EDITOR_BOOTSTRAPPED = true;
    } catch (err) {
      console.error('editor boot failed:', err);
      window.__EDITOR_BOOTSTRAPPED = false;
      showFatalBootError(err);
    }
  }

  function applyPresetPayload(data) {
    window.__PRESET_ARTICLES = data;
    window.__PRESET_IDS = new Set(data.map(function(a) { return a.id; }));
  }

  function loadPresets() {
    fetch('preset-articles.json?' + Date.now()).then(function(r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.text();
    }).then(function(text) {
      var changed = text !== lastContentHash;
      var data = JSON.parse(text);
      if (changed) {
        lastContentHash = text;
        applyPresetPayload(data);
      }
      if (!hasBootstrapped) {
        bootstrapInit();
        return;
      }
      if (!changed) return;
      // Merge and reload
      if (typeof mergePresets === 'function') mergePresets();
      loadArticles();
      var preferredId = preferredArticleId || localStorage.getItem(STORAGE_KEY + '-current') || currentArticleId;
      var cur = articles.find(function(a) { return a.id === preferredId; });
      if (cur) {
        currentArticleId = cur.id;
        preferredArticleId = cur.id;
        renderPreview();
      } else if (articles.length > 0) {
        var fallback = articles.slice().sort(function(a, b) { return b.updatedAt - a.updatedAt; })[0];
        currentArticleId = fallback.id;
        localStorage.setItem(STORAGE_KEY + '-current', fallback.id);
        preferredArticleId = fallback.id;
        renderPreview();
      }
      renderSidebarList();
    }).catch(function(e) {
      if (!hasBootstrapped) bootstrapInit();
      // Silent fail - will retry on next poll
    });
  }

  // Bootstrap immediately from the embedded preset payload so first paint
  // does not depend on an async fetch succeeding inside the browser shell.
  applyPresetPayload(PRESET_ARTICLES || []);
  if (window.__EDITOR_BOOTSTRAPPED) {
    hasBootstrapped = true;
  } else {
    bootstrapInit();
  }
  // Refresh from disk in the background after boot.
  loadPresets();
  // Start polling
  setInterval(loadPresets, POLL_INTERVAL);
  console.log('Auto-polling enabled: checking for article updates every ' + (POLL_INTERVAL / 1000) + 's');
})();
</script>
<script>
${emojiJS}
</script>
</body>
</html>`;
fs.writeFileSync('豆芽编辑器.html', html);
const size = fs.statSync('豆芽编辑器.html').size;
console.log('File size:', (size / 1024).toFixed(0), 'KB');
console.log('Images embedded:', Object.keys(images).length);

const imgCount = (defaultArticleMd.match(/<!--IMG:/g) || []).length;
console.log('IMG markers in article:', imgCount);

// === Write preset-articles.json for fetch-based background refresh ===
fs.writeFileSync('preset-articles.json', JSON.stringify(presetArticles, null, 2));
console.log('Wrote preset-articles.json:', presetArticles.length, 'articles');
