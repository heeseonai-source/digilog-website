// 관리자 저장소: 배포 환경에서는 GitHub 저장소에 커밋하고(→ Vercel 자동 재배포),
// 내 컴퓨터(GITHUB_TOKEN 없음)에서는 프로젝트 폴더 파일을 바로 고칩니다.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const REPO = process.env.GITHUB_REPO || 'heeseonai-source/digilog-website';
const BRANCH = process.env.GITHUB_BRANCH || 'master';
const TOKEN = process.env.GITHUB_TOKEN;
const isLocal = () => !TOKEN;

async function gh(method, url, body, accept) {
  const r = await fetch(`https://api.github.com/repos/${REPO}${url}`, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: accept || 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'digilog-admin',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) {
    const t = await r.text();
    const err = new Error(`GitHub ${r.status}: ${t.slice(0, 200)}`);
    err.status = r.status;
    throw err;
  }
  return accept ? r.text() : r.json();
}

// 텍스트 파일 읽기 (최신 저장본 기준)
async function readText(p) {
  if (isLocal()) return fs.readFileSync(path.join(ROOT, p), 'utf8');
  return gh('GET', `/contents/${encodeURI(p)}?ref=${BRANCH}`, null, 'application/vnd.github.raw');
}

// 여러 파일을 커밋 하나로 저장. files: [{ path, content: Buffer|string }]
async function commit(files, message) {
  if (isLocal()) {
    for (const f of files) {
      const full = path.join(ROOT, f.path);
      fs.mkdirSync(path.dirname(full), { recursive: true });
      fs.writeFileSync(full, f.content);
    }
    return { local: true };
  }
  for (let attempt = 0; attempt < 3; attempt++) {
    const ref = await gh('GET', `/git/ref/heads/${BRANCH}`);
    const parent = ref.object.sha;
    const base = await gh('GET', `/git/commits/${parent}`);
    const tree = [];
    for (const f of files) {
      const buf = Buffer.isBuffer(f.content) ? f.content : Buffer.from(f.content, 'utf8');
      const blob = await gh('POST', '/git/blobs', { content: buf.toString('base64'), encoding: 'base64' });
      tree.push({ path: f.path, mode: '100644', type: 'blob', sha: blob.sha });
    }
    const newTree = await gh('POST', '/git/trees', { base_tree: base.tree.sha, tree });
    const c = await gh('POST', '/git/commits', { message, tree: newTree.sha, parents: [parent] });
    try {
      await gh('PATCH', `/git/refs/heads/${BRANCH}`, { sha: c.sha, force: false });
      return { sha: c.sha };
    } catch (e) {
      if (e.status !== 422) throw e; // 그 사이 다른 저장이 있었으면 다시 시도
    }
  }
  throw new Error('저장이 겹쳐서 실패했어요. 다시 시도해 주세요.');
}

module.exports = { readText, commit, isLocal };
