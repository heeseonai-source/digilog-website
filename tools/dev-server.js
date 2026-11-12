// 내 컴퓨터에서 미리보기: node tools/dev-server.js  →  http://localhost:3000
// Vercel과 같은 방식으로 /about → about.html, /api/* → api 폴더 함수를 실행합니다.
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = Number(process.env.PORT) || 3000;
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json' };

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  let p = decodeURIComponent(url.pathname);
  try {
    if (p.startsWith('/api/')) {
      const name = p.slice(5).replace(/[^a-z0-9-]/gi, '');
      const file = path.join(ROOT, 'api', name + '.js');
      if (!fs.existsSync(file)) { res.statusCode = 404; return res.end('no api'); }
      return await require(file)(req, res);
    }
    if (p === '/') p = '/index.html';
    let file = path.join(ROOT, p);
    if (!file.startsWith(ROOT) || /[\\/](api|tools|docs|\.git)[\\/]/.test(file.slice(ROOT.length))) { res.statusCode = 403; return res.end(); }
    if (!path.extname(file)) file += '.html';
    if (!fs.existsSync(file)) { res.statusCode = 404; return res.end('404'); }
    res.setHeader('Content-Type', TYPES[path.extname(file)] || 'application/octet-stream');
    fs.createReadStream(file).pipe(res);
  } catch (e) {
    console.error(e); res.statusCode = 500; res.end('error');
  }
}).listen(PORT, () => console.log(`미리보기: http://localhost:${PORT}`));
