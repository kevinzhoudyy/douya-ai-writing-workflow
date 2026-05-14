#!/usr/bin/env node
/**
 * 一键启动：HTTP 服务器 + 文件监听自动 rebuild
 * 
 * 用法：node start.js
 * 
 * 功能：
 * 1. 启动 HTTP 服务器（解决 file:// CORS 问题）
 * 2. 监听 Claw articles/ 和 images/ 目录变化
 * 3. 检测到变化自动运行 rebuild-html.js
 * 4. 编辑器通过轮询自动获取最新文章
 */

const { execSync } = require('child_process');
const fs = require('fs');
const http = require('http');
const path = require('path');

const PORT = 8765;
const PROJECT_DIR = __dirname;
const WATCH_DIRS = [
  path.join(process.env.HOME || '/root', 'WorkBuddy/Claw/公众号写作/articles'),
  path.join(process.env.HOME || '/root', 'WorkBuddy/Claw/公众号写作/images'),
  path.join(process.env.HOME || '/root', 'WorkBuddy/Claw/小红书/articles'),
  path.join(process.env.HOME || '/root', 'WorkBuddy/Claw/小红书/images'),
  path.join(process.env.HOME || '/root', 'WorkBuddy/Claw/小红书/collections'),
  path.join(process.env.HOME || '/root', 'WorkBuddy/Claw/小红书/collection-covers')
];
const SAVE_ROOTS = [
  path.join(process.env.HOME || '/root', 'WorkBuddy/Claw/公众号写作/articles'),
  path.join(process.env.HOME || '/root', 'WorkBuddy/Claw/小红书/articles')
];
const LOCAL_FILE_ROOTS = [
  path.join(PROJECT_DIR, 'screenshots'),
  path.join(process.env.HOME || '/root', 'WorkBuddy/Claw/公众号写作/images'),
  path.join(process.env.HOME || '/root', 'WorkBuddy/Claw/小红书/images'),
  path.join(process.env.HOME || '/root', 'WorkBuddy/Claw/小红书/collection-covers')
];

let rebuildTimer = null;
let isRebuilding = false;

// Debounced rebuild: wait 1s after last change before rebuilding
function scheduleRebuild(reason) {
  if (isRebuilding) return;
  clearTimeout(rebuildTimer);
  rebuildTimer = setTimeout(() => {
    runRebuild(reason);
  }, 1000);
}

function runRebuild(reason) {
  if (isRebuilding) return;
  isRebuilding = true;
  console.log(`\n🔄 [${new Date().toLocaleTimeString()}] ${reason}，重新构建...`);
  
  try {
    execSync('node ' + path.join(PROJECT_DIR, 'rebuild-html.js'), {
      cwd: PROJECT_DIR,
      stdio: 'pipe'  // Avoid output interleaving with main process
    });
    console.log(`✅ [${new Date().toLocaleTimeString()}] 构建完成，编辑器将自动检测更新`);
  } catch (err) {
    console.error('❌ 构建失败:', err.message);
  }
  isRebuilding = false;
}

// File watcher using fs.watch (built-in, no dependencies)
function startWatcher() {
  const dirs = WATCH_DIRS.filter(d => fs.existsSync(d));
  
  if (dirs.length === 0) {
    console.log('⚠️  未找到监听目录，跳过文件监听');
    return;
  }

  for (const dir of dirs) {
    console.log('👀 监听目录:', dir);
    
    // Xiaohongshu images now live in nested slug directories, so watch recursively.
    const watcher = fs.watch(dir, { recursive: true, persistent: true }, (eventType, filename) => {
      if (!filename) return;
      // Only trigger on .md and image file changes
      if (/\.(md|png|jpe?g|gif|webp|svg)$/i.test(filename)) {
        scheduleRebuild(`检测到文件变化: ${filename}`);
      }
    });

    watcher.on('error', (err) => {
      if (err && err.code === 'EMFILE') {
        console.warn(`⚠️  监听目录失败（打开文件数过多），已跳过自动监听: ${dir}`);
        console.warn('⚠️  你仍然可以正常使用编辑器，必要时手动执行 `node rebuild-html.js` 重建');
        return;
      }
      console.warn(`⚠️  监听目录异常，已跳过: ${dir}`);
      console.warn(err.message || err);
    });
  }
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function isWithinRoots(filePath, roots) {
  const resolved = path.resolve(filePath);
  return roots.some(root => {
    const normalizedRoot = path.resolve(root);
    return resolved === normalizedRoot || resolved.startsWith(normalizedRoot + path.sep);
  });
}

function composeMarkdownForSave(title, md) {
  const normalizedMd = String(md || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  const normalizedTitle = String(title || '').trim();
  if (!normalizedMd && !normalizedTitle) return '\n';

  const hasCandidateTitles = /^-+\s*\*\*A\*\*[:：]/m.test(normalizedMd);
  if (hasCandidateTitles) return normalizedMd + '\n';

  const hasHeading = /^#\s+.+$/m.test(normalizedMd);
  if (hasHeading || !normalizedTitle) return normalizedMd + '\n';

  return '# ' + normalizedTitle + '\n\n' + normalizedMd + '\n';
}

// Start HTTP server
function startServer() {
  console.log(`\n🌐 启动 HTTP 服务器: http://localhost:${PORT}`);
  console.log(`📝 编辑器地址: http://localhost:${PORT}/豆芽编辑器.html\n`);

  const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.css': 'text/css',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
  };

  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if ((req.method === 'GET' || req.method === 'HEAD') && urlPath === '/') {
      const editorPath = path.join(PROJECT_DIR, '豆芽编辑器.html');
      let version = Date.now();
      try {
        version = fs.statSync(editorPath).mtimeMs;
      } catch (err) {}
      const encodedEditorPath = '/' + encodeURIComponent('豆芽编辑器.html');
      res.writeHead(302, {
        Location: encodedEditorPath + '?v=' + encodeURIComponent(String(version)),
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      });
      res.end();
      return;
    }

    if (req.method === 'POST' && urlPath === '/api/article/save') {
      let body = '';
      req.on('data', chunk => {
        body += chunk;
        if (body.length > 10 * 1024 * 1024) {
          req.destroy(new Error('Payload too large'));
        }
      });
      req.on('end', () => {
        try {
          const payload = JSON.parse(body || '{}');
          const source = String(payload.source || '').trim();
          const title = String(payload.title || '').trim();
          const md = String(payload.md || '');
          if (!source) {
            sendJson(res, 400, { ok: false, error: 'missing_source' });
            return;
          }

          const resolvedPath = path.resolve(source);
          if (!resolvedPath.endsWith('.md') || !isWithinRoots(resolvedPath, SAVE_ROOTS)) {
            sendJson(res, 403, { ok: false, error: 'forbidden_path' });
            return;
          }

          const output = composeMarkdownForSave(title, md);
          fs.writeFileSync(resolvedPath, output, 'utf8');
          const stat = fs.statSync(resolvedPath);
          sendJson(res, 200, {
            ok: true,
            savedPath: resolvedPath,
            sourceUpdatedAt: stat.mtimeMs
          });
          scheduleRebuild('检测到编辑器保存: ' + path.basename(resolvedPath));
        } catch (err) {
          console.error('保存文章失败:', err);
          sendJson(res, 500, { ok: false, error: 'save_failed', message: err.message });
        }
      });
      req.on('error', err => {
        console.error('读取保存请求失败:', err);
      });
      return;
    }

    if ((req.method === 'GET' || req.method === 'HEAD') && urlPath === '/api/local-file') {
      try {
        const reqUrl = new URL(req.url, 'http://127.0.0.1:' + PORT);
        const rawPath = String(reqUrl.searchParams.get('path') || '').trim();
        if (!rawPath) {
          res.writeHead(400);
          res.end('missing path');
          return;
        }

        const resolvedPath = path.resolve(rawPath);
        if (!isWithinRoots(resolvedPath, LOCAL_FILE_ROOTS)) {
          res.writeHead(403);
          res.end('forbidden');
          return;
        }
        if (!fs.existsSync(resolvedPath) || fs.statSync(resolvedPath).isDirectory()) {
          res.writeHead(404);
          res.end('not found');
          return;
        }

        const ext = path.extname(resolvedPath).toLowerCase();
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
        if (req.method === 'HEAD') {
          res.end();
        } else {
          fs.createReadStream(resolvedPath).pipe(res);
        }
      } catch (err) {
        console.error('读取本地资源失败:', err);
        res.writeHead(500);
        res.end('local file error');
      }
      return;
    }

    let effectivePath = urlPath;
    const filePath = path.join(PROJECT_DIR, effectivePath);
    const ext = path.extname(filePath).toLowerCase();

    if (!filePath.startsWith(PROJECT_DIR)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }

    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'no-store, no-cache, must-revalidate'
    });
    if (req.method === 'HEAD') {
      res.end();
    } else {
      fs.createReadStream(filePath).pipe(res);
    }
  });

  server.listen(PORT, () => {
    console.log('HTTP server ready on port ' + PORT);
  });
  
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n❌ 端口 ${PORT} 已被占用，请先关闭占用进程或更换端口`);
    } else {
      console.error('服务器错误:', err);
    }
    process.exit(1);
  });
  
  return server;
}

// Initial build
console.log('🚀 启动编辑器服务...\n');
console.log('📦 首次构建...');
try {
  execSync('node ' + path.join(PROJECT_DIR, 'rebuild-html.js'), {
    cwd: PROJECT_DIR,
    stdio: 'pipe'
  });
  console.log('✅ 初始构建完成\n');
} catch (err) {
  console.error('⚠️  初始构建失败，继续启动服务器');
}

// Start everything
const server = startServer();
startWatcher();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 正在关闭...');
  server.close(() => process.exit(0));
});

console.log('\n💡 提示：');
console.log('   - 修改公众号/小红书文章、图片、合集目录会自动触发重建');
console.log('   - 编辑器每 5 秒自动检查更新');
console.log('   - 按 Ctrl+C 停止服务\n');
