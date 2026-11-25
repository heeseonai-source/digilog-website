// Q&A 게시판 (수강생 질문 → 강사 답변)
// GET  /api/qna                         → 질문 목록 (비공개 글은 내용·제목 없이, 블라인드 글은 가려진 표시만)
// POST /api/qna { action:'ask', ... }   → 질문 올리기 { cls, title, content, name, private, password, website(스팸칸), t(폼 연 시각) }
// POST /api/qna { action:'view', id, password } → 비공개 질문을 비밀번호로 열기
// 저장소는 구글 시트 '질문' 탭 (SHEET_WEBHOOK_URL). 답변은 시트의 '답변' 칸에 적고, '블라인드' 칸에 아무 글자나 적으면 가려진다.
// 시트가 연결되지 않은 로컬 개발에서는 임시 파일에 저장해서 화면을 확인할 수 있게 한다.
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { send, readBody } = require('./_lib/http');
const content = require('../content/qna.json');

const LIMIT = { title: 60, content: 1000, name: 12, pwMin: 4, pwMax: 20 };
const LOCAL_FILE = path.join(os.tmpdir(), 'digilog-qna-local.json');
const isLocalDev = () => !process.env.SHEET_WEBHOOK_URL && !process.env.VERCEL;
const hook = () => process.env.SHEET_WEBHOOK_URL;

const classNames = () => (content.classes || []).map(c => String(c.name || '').trim()).filter(Boolean);
const hashPw = (id, pw) => crypto.createHash('sha256').update(`${id}:${pw}`).digest('hex');
const today = () => {
  const d = new Date(Date.now() + 9 * 3600e3); // 한국 시간
  return `${d.getUTCFullYear()}.${String(d.getUTCMonth() + 1).padStart(2, '0')}.${String(d.getUTCDate()).padStart(2, '0')}`;
};

// 비밀번호를 여러 번 틀리면 잠시 막기 (서버 인스턴스 단위의 간단한 보호)
const fails = new Map();
const tooMany = ip => (fails.get(ip) || []).filter(t => Date.now() - t < 10 * 60e3).length >= 8;
const fail = ip => fails.set(ip, [...(fails.get(ip) || []).filter(t => Date.now() - t < 10 * 60e3), Date.now()]);

/* ---------- 로컬 개발용 임시 저장 (시트와 같은 모양) ---------- */
const readLocal = () => { try { return JSON.parse(fs.readFileSync(LOCAL_FILE, 'utf8')); } catch { return []; } };
const publicView = r => {
  const base = { id: r.id, date: r.date };
  if (r.blind) return { ...base, blind: true };
  if (r.private) return { ...base, cls: r.cls, name: r.name, private: true, answered: !!r.answer };
  return { ...base, cls: r.cls, name: r.name, title: r.title, content: r.content, answer: r.answer || '', answered: !!r.answer };
};
const fullView = r => ({ id: r.id, date: r.date, cls: r.cls, name: r.name, title: r.title, content: r.content, answer: r.answer || '', answered: !!r.answer, private: !!r.private });

/* ---------- 시트(앱스 스크립트) 호출 ---------- */
async function sheetGet(params) {
  const h = hook();
  const r = await fetch(h + (h.includes('?') ? '&' : '?') + new URLSearchParams(params), { redirect: 'follow' });
  return JSON.parse(await r.text()); // 앱스 스크립트를 아직 업데이트하지 않았으면 여기서 실패
}

async function list() {
  if (isLocalDev()) return readLocal().map(publicView);
  if (!hook()) return [];
  const data = await sheetGet({ action: 'qna' });
  if (!Array.isArray(data.items)) throw new Error('not ready');
  return data.items;
}

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    try {
      return send(res, 200, { items: (await list()).slice(0, 300) }, { 'Cache-Control': 's-maxage=20, stale-while-revalidate=120' });
    } catch (e) {
      console.error('qna list error', e.message);
      return send(res, 200, { items: [], error: 'unavailable' }, { 'Cache-Control': 's-maxage=10' });
    }
  }
  if (req.method !== 'POST') return send(res, 405, { error: 'method' });

  let body;
  try { body = await readBody(req, 8000); } catch { return send(res, 400, { error: 'bad request' }); }
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();

  /* ---------- 비공개 질문 열기 ---------- */
  if (body.action === 'view') {
    if (tooMany(ip)) return send(res, 429, { error: '비밀번호를 여러 번 틀려서 잠시 막혔어요. 10분 뒤 다시 시도해 주세요.' });
    const id = String(body.id || '').replace(/[^a-f0-9]/g, '').slice(0, 16);
    const pw = String(body.password || '').trim();
    if (!id || !pw) return send(res, 400, { error: '비밀번호를 입력해 주세요.' });
    const hash = hashPw(id, pw);
    try {
      if (isLocalDev()) {
        const r = readLocal().find(x => x.id === id);
        if (!r || r.blind) return send(res, 404, { error: '글을 찾지 못했어요.' });
        if (r.private && r.hash !== hash) { fail(ip); return send(res, 401, { error: '비밀번호가 맞지 않아요.' }); }
        return send(res, 200, { ok: true, item: fullView(r) }, { 'Cache-Control': 'no-store' });
      }
      const data = await sheetGet({ action: 'qnaview', id, hash });
      if (data.error === 'password') { fail(ip); return send(res, 401, { error: '비밀번호가 맞지 않아요.' }); }
      if (!data.ok) return send(res, 404, { error: '글을 찾지 못했어요.' });
      return send(res, 200, { ok: true, item: data.item }, { 'Cache-Control': 'no-store' });
    } catch (e) {
      console.error('qna view error', e.message);
      return send(res, 502, { error: '잠시 후 다시 시도해 주세요.' });
    }
  }

  /* ---------- 질문 올리기 ---------- */
  if (body.website) return send(res, 200, { ok: true }); // 스팸봇이 채우는 숨은 칸
  const opened = Number(body.t) || 0;
  if (opened && Date.now() - opened < 4000) return send(res, 400, { error: '조금만 천천히 다시 눌러 주세요.' });

  const one = s => String(s || '').replace(/\s+/g, ' ').trim();
  const cls = one(body.cls);
  const title = one(body.title);
  const text = String(body.content || '').replace(/\r\n?/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  const name = one(body.name).slice(0, LIMIT.name) || '수강생';
  const isPrivate = !!body.private;
  const pw = String(body.password || '').trim();

  if (!classNames().includes(cls)) return send(res, 400, { error: '들으신 수업을 골라 주세요.' });
  if (title.length < 2 || title.length > LIMIT.title) return send(res, 400, { error: `제목을 2~${LIMIT.title}자로 적어 주세요.` });
  if (text.length < 5 || text.length > LIMIT.content) return send(res, 400, { error: `질문 내용을 5~${LIMIT.content}자로 적어 주세요.` });
  if (isPrivate && (pw.length < LIMIT.pwMin || pw.length > LIMIT.pwMax)) return send(res, 400, { error: `비밀번호를 ${LIMIT.pwMin}~${LIMIT.pwMax}자로 정해 주세요.` });

  const id = crypto.randomBytes(6).toString('hex');
  const item = { id, date: today(), cls, name, title, content: text, private: isPrivate, answer: '', answered: false };
  const hash = isPrivate ? hashPw(id, pw) : '';

  if (isLocalDev()) {
    const all = readLocal();
    all.unshift({ ...item, hash });
    fs.writeFileSync(LOCAL_FILE, JSON.stringify(all.slice(0, 300)));
    return send(res, 200, { ok: true, item });
  }
  if (!hook()) return send(res, 503, { error: 'not configured' });
  try {
    // 앱스 스크립트가 Q&A 기능으로 업데이트됐는지 먼저 확인 (예전 스크립트면 '문의' 탭에 빈 줄이 생기므로 막는다)
    try { await list(); } catch { return send(res, 503, { error: '게시판을 준비하고 있어요. 잠시 후 다시 시도해 주세요.' }); }
    const r = await fetch(hook(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'qna', id, cls, name, title, content: text, private: isPrivate, hash, secret: process.env.SHEET_SECRET || '' }),
      redirect: 'follow',
    });
    const out = await r.text();
    if (out.includes('"error":"duplicate"')) return send(res, 400, { error: '같은 질문이 이미 올라와 있어요.' });
    if (!r.ok || !out.includes('"ok":true')) throw new Error(out.slice(0, 200));
    return send(res, 200, { ok: true, item });
  } catch (e) {
    console.error('qna save error', e.message);
    return send(res, 502, { error: 'sheet failed' });
  }
};
