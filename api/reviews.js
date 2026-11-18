// 수강생 후기 (메모)
// GET  /api/reviews → 공개된 후기 목록 (구글 시트 '후기' 탭에서 숨기기 칸이 빈 것)
// POST /api/reviews → 후기 저장 { cls, name, text, website(스팸칸), t(폼 연 시각) }
// 구글 시트 연결은 문의 폼과 같은 SHEET_WEBHOOK_URL 을 씁니다. (docs/구글시트-연결방법.md 의 '후기' 부분 참고)
// 시트가 연결되지 않은 로컬 개발에서는 임시 파일에 저장해서 화면을 확인할 수 있게 합니다.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { send, readBody } = require('./_lib/http');
const content = require('../content/reviews.json');

const MAX_TEXT = 150;
const MAX_NAME = 12;
const LOCAL_FILE = path.join(os.tmpdir(), 'digilog-reviews-local.json');
const isLocalDev = () => !process.env.SHEET_WEBHOOK_URL && !process.env.VERCEL;

const classNames = () => (content.classes || []).map(c => String(c.name || '').trim()).filter(Boolean);
const today = () => {
  const d = new Date(Date.now() + 9 * 3600e3); // 한국 시간
  return `${d.getUTCFullYear()}.${String(d.getUTCMonth() + 1).padStart(2, '0')}.${String(d.getUTCDate()).padStart(2, '0')}`;
};
const readLocal = () => { try { return JSON.parse(fs.readFileSync(LOCAL_FILE, 'utf8')); } catch { return []; } };

async function list() {
  if (isLocalDev()) return readLocal();
  const hook = process.env.SHEET_WEBHOOK_URL;
  if (!hook) return [];
  const r = await fetch(hook + (hook.includes('?') ? '&' : '?') + 'action=reviews', { redirect: 'follow' });
  const text = await r.text();
  const data = JSON.parse(text); // 앱스 스크립트를 아직 업데이트하지 않았으면 여기서 실패 → 빈 목록
  return Array.isArray(data.reviews) ? data.reviews : [];
}

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    try {
      const reviews = (await list()).slice(0, 300).map(r => ({
        cls: String(r.cls || ''), name: String(r.name || '') || '수강생', text: String(r.text || ''), date: String(r.date || ''),
      }));
      return send(res, 200, { reviews }, { 'Cache-Control': 's-maxage=30, stale-while-revalidate=120' });
    } catch (e) {
      console.error('reviews list error', e.message);
      return send(res, 200, { reviews: [], error: 'unavailable' }, { 'Cache-Control': 's-maxage=10' });
    }
  }

  if (req.method !== 'POST') return send(res, 405, { error: 'method' });
  let body;
  try { body = await readBody(req, 5000); } catch { return send(res, 400, { error: 'bad request' }); }

  if (body.website) return send(res, 200, { ok: true }); // 스팸봇이 채우는 숨은 칸
  const opened = Number(body.t) || 0;
  if (opened && Date.now() - opened < 3000) return send(res, 400, { error: '조금만 천천히 다시 눌러 주세요.' });

  const cls = String(body.cls || '').trim();
  const name = String(body.name || '').replace(/\s+/g, ' ').trim().slice(0, MAX_NAME);
  const text = String(body.text || '').replace(/\s+/g, ' ').trim();
  if (!classNames().includes(cls)) return send(res, 400, { error: '들으신 수업을 골라 주세요.' });
  if (text.length < 5) return send(res, 400, { error: '후기를 5자 이상 적어 주세요.' });
  if (text.length > MAX_TEXT) return send(res, 400, { error: `후기는 ${MAX_TEXT}자까지 적을 수 있어요.` });
  if (/https?:\/\/|www\./i.test(text + name)) return send(res, 400, { error: '링크는 넣을 수 없어요.' });

  const review = { cls, name: name || '수강생', text, date: today() };

  if (isLocalDev()) {
    const all = readLocal();
    all.unshift(review);
    fs.writeFileSync(LOCAL_FILE, JSON.stringify(all.slice(0, 300)));
    return send(res, 200, { ok: true, review });
  }

  const hook = process.env.SHEET_WEBHOOK_URL;
  if (!hook) return send(res, 503, { error: 'not configured' });
  try {
    // 앱스 스크립트가 후기 기능으로 업데이트됐는지 먼저 확인 (예전 스크립트면 '문의' 탭에 빈 줄이 생기므로 막는다)
    try { await list(); } catch { return send(res, 503, { error: '후기 기능을 준비하고 있어요. 잠시 후 다시 시도해 주세요.' }); }
    const r = await fetch(hook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'review', cls, name: review.name, text, secret: process.env.SHEET_SECRET || '' }),
      redirect: 'follow',
    });
    const out = await r.text();
    if (out.includes('"error":"duplicate"')) return send(res, 400, { error: '같은 후기가 이미 있어요.' });
    if (!r.ok || !out.includes('"ok":true')) throw new Error(out.slice(0, 200));
    return send(res, 200, { ok: true, review });
  } catch (e) {
    console.error('review save error', e.message);
    return send(res, 502, { error: 'sheet failed' });
  }
};
