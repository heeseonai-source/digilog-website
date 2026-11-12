// GET  /api/materials           → 수업 목록 (id, title)
// POST /api/materials {classId, password} → 비밀번호가 맞으면 자료 링크
const crypto = require('crypto');
const classes = require('./_lib/materials');
const { send, readBody } = require('./_lib/http');

// 같은 IP에서 짧은 시간에 너무 많이 틀리면 잠시 막기 (서버 인스턴스 단위의 간단한 보호)
const attempts = new Map();
function tooMany(ip) {
  const now = Date.now();
  const a = (attempts.get(ip) || []).filter(t => now - t < 10 * 60 * 1000);
  attempts.set(ip, a);
  return a.length >= 10;
}

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    return send(res, 200, { classes: classes.map(c => ({ id: c.id, title: c.title })) }, { 'Cache-Control': 'no-store' });
  }
  if (req.method !== 'POST') return send(res, 405, { error: '허용되지 않은 요청이에요.' });

  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();
  if (tooMany(ip)) return send(res, 429, { error: '여러 번 틀려서 잠시 막혔어요. 10분 뒤 다시 시도해 주세요.' });

  let body;
  try { body = await readBody(req); } catch { return send(res, 400, { error: '요청을 읽지 못했어요.' }); }
  const c = classes.find(x => x.id === body.classId);
  if (!c) return send(res, 404, { error: '수업을 찾지 못했어요.' });

  const given = crypto.createHash('sha256').update(String(body.password || '').trim()).digest();
  const expected = Buffer.from(c.passwordHash, 'hex');
  const ok = expected.length === given.length && crypto.timingSafeEqual(given, expected);
  if (!ok) {
    attempts.get(ip).push(Date.now());
    return send(res, 401, { error: '비밀번호가 맞지 않아요. 수업 때 받은 비밀번호를 다시 확인해 주세요.' });
  }
  return send(res, 200, { title: c.title, files: c.files }, { 'Cache-Control': 'no-store' });
};
