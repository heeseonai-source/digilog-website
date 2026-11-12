// 관리자 로그인 (비밀번호는 Vercel 환경변수 ADMIN_PASSWORD)
const crypto = require('crypto');

const COOKIE = 'digilog_admin';
const DAYS = 7;
const password = () => process.env.ADMIN_PASSWORD || '';
const secret = () => crypto.createHash('sha256').update('digilog-admin:' + password() + ':' + (process.env.GITHUB_TOKEN || '')).digest();
const sign = v => crypto.createHmac('sha256', secret()).update(v).digest('base64url');
const same = (a, b) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && crypto.timingSafeEqual(x, y); };

function checkPassword(input) {
  if (!password()) return false;
  const a = crypto.createHash('sha256').update(String(input || '')).digest();
  const b = crypto.createHash('sha256').update(password()).digest();
  return crypto.timingSafeEqual(a, b);
}

function cookieHeader(req, value, maxAge) {
  const secure = (req.headers['x-forwarded-proto'] || '').includes('https') || process.env.VERCEL ? '; Secure' : '';
  return `${COOKIE}=${value}; Path=/api/admin; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`;
}

function issue(req, res) {
  const exp = String(Date.now() + DAYS * 864e5);
  res.setHeader('Set-Cookie', cookieHeader(req, `${exp}.${sign(exp)}`, DAYS * 86400));
}

function clear(req, res) { res.setHeader('Set-Cookie', cookieHeader(req, '', 0)); }

function isAuthed(req) {
  if (!password()) return false;
  const m = String(req.headers.cookie || '').match(new RegExp(`${COOKIE}=([^;]+)`));
  if (!m) return false;
  const [exp, sig] = m[1].split('.');
  return !!exp && !!sig && Number(exp) > Date.now() && same(sig, sign(exp));
}

module.exports = { checkPassword, issue, clear, isAuthed };
