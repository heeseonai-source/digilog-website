// 관리자 API — /api/admin?action=...
//   status            로그인 여부
//   login  {password} 로그인 / logout 로그아웃
//   load   {page}     페이지 내용 불러오기 (최신 저장본)
//   save   {page, data} 페이지 내용 저장 → GitHub 커밋 → 1~2분 뒤 사이트 반영
//   upload {name, data(base64), kind: image|file} 사진·파일 올리기
const crypto = require('crypto');
const { send, readBody } = require('./_lib/http');
const auth = require('./_lib/auth');
const store = require('./_lib/store');

const PAGES = {
  site: { path: 'content/site.json', label: '기본 정보' },
  home: { path: 'content/home.json', label: '홈' },
  about: { path: 'content/about.json', label: '소개' },
  lectures: { path: 'content/lectures.json', label: '강의' },
  projects: { path: 'content/projects.json', label: '프로젝트·이력' },
  reviews: { path: 'content/reviews.json', label: '강의후기·갤러리' },
  contact: { path: 'content/contact.json', label: '문의' },
  materials: { path: 'content/materials.json', label: '수업자료 페이지' },
  classes: { path: 'api/_data/materials.json', label: '수업자료 목록' },
};

const loginFails = new Map();
const hash = pw => crypto.createHash('sha256').update(String(pw).trim()).digest('hex');
const slug = s => String(s || '').toLowerCase().replace(/[^a-z0-9가-힣._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'file';
const stamp = () => new Date().toISOString().slice(0, 10).replace(/-/g, '');
const rand = () => crypto.randomBytes(5).toString('hex');

module.exports = async (req, res) => {
  const action = new URL(req.url, 'http://x').searchParams.get('action');
  if (req.method !== 'POST' && action !== 'status') return send(res, 405, { error: 'POST만 가능해요.' });
  if (req.method === 'POST' && !String(req.headers['content-type'] || '').includes('application/json')) return send(res, 415, { error: 'bad type' });

  if (action === 'status') {
    return send(res, 200, { authed: auth.isAuthed(req), configured: !!process.env.ADMIN_PASSWORD, local: store.isLocal() }, { 'Cache-Control': 'no-store' });
  }

  let body;
  try { body = await readBody(req, 4_200_000); } catch { return send(res, 413, { error: '파일이 너무 커요. (최대 약 3MB)' }); }

  if (action === 'login') {
    const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();
    const fails = (loginFails.get(ip) || []).filter(t => Date.now() - t < 15 * 60 * 1000);
    if (fails.length >= 8) return send(res, 429, { error: '너무 많이 틀렸어요. 15분 뒤 다시 시도해 주세요.' });
    if (!process.env.ADMIN_PASSWORD) return send(res, 503, { error: '관리자 비밀번호(ADMIN_PASSWORD)가 아직 설정되지 않았어요.' });
    if (!auth.checkPassword(body.password)) { fails.push(Date.now()); loginFails.set(ip, fails); return send(res, 401, { error: '비밀번호가 맞지 않아요.' }); }
    auth.issue(req, res);
    return send(res, 200, { ok: true });
  }
  if (action === 'logout') { auth.clear(req, res); return send(res, 200, { ok: true }); }

  if (!auth.isAuthed(req)) return send(res, 401, { error: '다시 로그인해 주세요.' });

  try {
    if (action === 'load') {
      const p = PAGES[body.page];
      if (!p) return send(res, 404, { error: '없는 페이지예요.' });
      let data = JSON.parse(await store.readText(p.path));
      if (body.page === 'classes') data = data.map(({ passwordHash, ...c }) => ({ ...c, hasPassword: !!passwordHash, newPassword: '' }));
      return send(res, 200, { data }, { 'Cache-Control': 'no-store' });
    }

    if (action === 'save') {
      const p = PAGES[body.page];
      if (!p || typeof body.data !== 'object' || body.data === null) return send(res, 400, { error: '저장할 내용이 올바르지 않아요.' });
      let data = body.data;
      if (body.page === 'classes') {
        if (!Array.isArray(data)) return send(res, 400, { error: '목록 형식이 아니에요.' });
        const old = JSON.parse(await store.readText(p.path));
        const ids = new Set();
        data = data.map(c => {
          let id = slug(c.id || c.title);
          while (ids.has(id)) id += '-2';
          ids.add(id);
          const prev = old.find(o => o.id === c.id);
          const passwordHash = c.newPassword ? hash(c.newPassword) : prev?.passwordHash;
          if (!passwordHash) throw Object.assign(new Error(`「${c.title || '이름 없는 수업'}」의 비밀번호를 정해 주세요.`), { user: true });
          return { id, title: String(c.title || '').trim(), passwordHash, files: (c.files || []).filter(f => f.url).map(f => ({ name: f.name || '자료', url: f.url, note: f.note || '' })) };
        });
      }
      const json = JSON.stringify(data, null, 2) + '\n';
      if (json.length > 400_000) return send(res, 413, { error: '내용이 너무 길어요.' });
      const r = await store.commit([{ path: p.path, content: json }], `관리자: ${p.label} 수정`);
      return send(res, 200, { ok: true, local: !!r.local });
    }

    if (action === 'upload') {
      const buf = Buffer.from(String(body.data || ''), 'base64');
      if (!buf.length) return send(res, 400, { error: '파일이 비어 있어요.' });
      if (buf.length > 3_000_000) return send(res, 413, { error: '파일이 너무 커요. 3MB 이하로 올리거나 구글 드라이브 링크를 써 주세요.' });
      const name = slug(body.name);
      let rel;
      if (body.kind === 'image') {
        if (!/^(webp|jpe?g|png|gif)$/i.test(name.split('.').pop())) return send(res, 400, { error: '사진 파일만 올릴 수 있어요.' });
        rel = `assets/uploads/${stamp()}-${rand()}-${name}`;
      } else {
        if (!/^(pdf|pptx?|docx?|xlsx?|hwp|hwpx|zip|txt|png|jpe?g)$/i.test(name.split('.').pop())) return send(res, 400, { error: '올릴 수 없는 파일 형식이에요.' });
        rel = `files/${rand()}${rand()}/${name}`; // 추측하기 어려운 주소
      }
      const r = await store.commit([{ path: 'static/' + rel, content: buf }], `관리자: 파일 올림 ${name}`);
      return send(res, 200, { ok: true, url: '/' + rel, local: !!r.local });
    }

    return send(res, 404, { error: '알 수 없는 요청이에요.' });
  } catch (e) {
    console.error('admin error', e.message);
    return send(res, e.user ? 400 : 500, { error: e.user ? e.message : '저장소 처리 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.' });
  }
};
