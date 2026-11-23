// 수업 진도 읽기 (누구나)  GET /api/progress?cls=<수업 id>  → { step, at }
// 진도 바꾸기는 관리자 로그인이 필요해서 /api/admin?action=progress 에 있습니다.
const { send } = require('./_lib/http');
const classes = require('./_data/materials.json');
const progress = require('./_lib/progress');

module.exports = async (req, res) => {
  if (req.method !== 'GET') return send(res, 405, { error: 'method' });
  const cls = new URL(req.url, 'http://x').searchParams.get('cls') || '';
  if (!classes.some(c => c.id === cls && Array.isArray(c.progress))) return send(res, 404, { error: 'no class' });
  try {
    return send(res, 200, await progress.get(cls), { 'Cache-Control': 's-maxage=5, stale-while-revalidate=10' });
  } catch (e) {
    console.error('progress get error', e.message);
    return send(res, 200, { step: null, at: '', error: 'unavailable' }, { 'Cache-Control': 's-maxage=5' });
  }
};
