// 내 컴퓨터에서 미리보기: node tools/dev-server.js  →  http://localhost:3000
// 페이지를 열 때마다 content/*.json 으로 다시 빌드하고, /api/* 는 api 폴더 함수를 실행합니다.
// 관리자(/admin)는 GITHUB_TOKEN 없이 실행하면 프로젝트 폴더 파일을 바로 고칩니다.
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const PORT = Number(process.env.PORT) || 3000;
if (!process.env.ADMIN_PASSWORD) process.env.ADMIN_PASSWORD = 'local-admin'; // 로컬 미리보기 전용
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.json': 'application/json', '.pdf': 'application/pdf' };

const freshRequire = p => { for (const k of Object.keys(require.cache)) if (k.startsWith(path.join(ROOT, 'api')) || k === path.join(ROOT, 'build.js')) delete require.cache[k]; return require(p); };

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  let p = decodeURIComponent(url.pathname);
  try {
    if (p.startsWith('/api/')) {
      const name = p.slice(5).replace(/[^a-z0-9-]/gi, '');
      const file = path.join(ROOT, 'api', name + '.js');
      if (!fs.existsSync(file)) { res.statusCode = 404; return res.end('no api'); }
      return await freshRequire(file)(req, res);
    }
    if (p === '/') p = '/index';
    if (!path.extname(p)) { freshRequire(path.join(ROOT, 'build.js'))({ clean: false }); p += '.html'; }
    else if (!fs.existsSync(DIST)) freshRequire(path.join(ROOT, 'build.js'))({ clean: false });
    const file = path.join(DIST, p);
    if (!file.startsWith(DIST)) { res.statusCode = 403; return res.end(); }
    if (!fs.existsSync(file)) {
      const src = path.join(ROOT, 'static', p); // 방금 올린 파일
      if (src.startsWith(path.join(ROOT, 'static')) && fs.existsSync(src)) { res.setHeader('Content-Type', TYPES[path.extname(src)] || 'application/octet-stream'); return fs.createReadStream(src).pipe(res); }
      res.statusCode = 404; return res.end('404');
    }
    res.setHeader('Content-Type', TYPES[path.extname(file)] || 'application/octet-stream');
    fs.createReadStream(file).pipe(res);
  } catch (e) {
    console.error(e); res.statusCode = 500; res.end('error: ' + e.message);
  }
}).listen(PORT, () => console.log(`미리보기: http://localhost:${PORT}  (관리자 /admin, 로컬 비밀번호: ${process.env.ADMIN_PASSWORD})`));
