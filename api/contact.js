// POST /api/contact → 문의 내용을 구글 시트(앱스 스크립트 웹앱)로 전달
// Vercel 환경변수 SHEET_WEBHOOK_URL 에 앱스 스크립트 웹앱 주소를 넣어야 동작합니다. (docs/구글시트-연결방법.md 참고)
const { send, readBody } = require('./_lib/http');

const FIELDS = ['org', 'name', 'phone', 'email', 'audience', 'size', 'date', 'topic', 'message'];

module.exports = async (req, res) => {
  if (req.method !== 'POST') return send(res, 405, { error: 'method' });
  let body;
  try { body = await readBody(req); } catch { return send(res, 400, { error: 'bad request' }); }

  if (body.website) return send(res, 200, { ok: true }); // 스팸봇이 채우는 숨은 칸
  const data = {};
  for (const f of FIELDS) data[f] = String(body[f] || '').slice(0, f === 'message' ? 3000 : 200).trim();
  if (!data.org || !data.name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) || !body.agree) {
    return send(res, 400, { error: '필수 항목을 확인해 주세요.' });
  }

  const hook = process.env.SHEET_WEBHOOK_URL;
  if (!hook) return send(res, 503, { error: 'not configured' });
  try {
    const r = await fetch(hook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, secret: process.env.SHEET_SECRET || '' }),
      redirect: 'follow',
    });
    const text = await r.text();
    if (!r.ok || !text.includes('"ok":true')) throw new Error(text.slice(0, 200));
    return send(res, 200, { ok: true });
  } catch (e) {
    console.error('sheet error', e.message);
    return send(res, 502, { error: 'sheet failed' });
  }
};
