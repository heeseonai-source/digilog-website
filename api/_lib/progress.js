// 수업 진도 (지금 몇 번째 단계인지) 저장소
// 배포 환경: 구글 시트 「진도」 탭 (문의·후기와 같은 SHEET_WEBHOOK_URL 앱스 스크립트)
// 내 컴퓨터 미리보기(시트 미연결): 임시 파일
const fs = require('fs');
const os = require('os');
const path = require('path');

const LOCAL_FILE = path.join(os.tmpdir(), 'digilog-progress-local.json');
const isLocalDev = () => !process.env.SHEET_WEBHOOK_URL && !process.env.VERCEL;
const readLocal = () => { try { return JSON.parse(fs.readFileSync(LOCAL_FILE, 'utf8')); } catch { return {}; } };

// → { step: number | null, at: string }   step 은 0부터, null 은 아직 시작 전
async function get(cls) {
  if (isLocalDev()) return readLocal()[cls] || { step: null, at: '' };
  const hook = process.env.SHEET_WEBHOOK_URL;
  if (!hook) throw new Error('not configured');
  const r = await fetch(hook + (hook.includes('?') ? '&' : '?') + 'action=progress&cls=' + encodeURIComponent(cls), { redirect: 'follow' });
  const data = JSON.parse(await r.text()); // 앱스 스크립트를 아직 업데이트하지 않았으면 여기서 실패
  if (!data.ok || !('step' in data)) throw new Error('script not updated');
  return { step: data.step === '' || data.step === null ? null : Number(data.step), at: String(data.at || '') };
}

async function set(cls, step, label) {
  const at = new Date().toISOString();
  if (isLocalDev()) {
    const all = readLocal();
    all[cls] = { step, at };
    fs.writeFileSync(LOCAL_FILE, JSON.stringify(all));
    return { step, at };
  }
  const hook = process.env.SHEET_WEBHOOK_URL;
  if (!hook) throw new Error('not configured');
  await get(cls); // 예전 스크립트면 '문의' 탭에 빈 줄이 생기므로 먼저 확인
  const r = await fetch(hook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'progress', cls, step, label, secret: process.env.SHEET_SECRET || '' }),
    redirect: 'follow',
  });
  const out = await r.text();
  if (!r.ok || !out.includes('"ok":true')) throw new Error(out.slice(0, 200));
  return { step, at };
}

module.exports = { get, set };
