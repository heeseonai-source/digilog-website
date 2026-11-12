'use strict';
/* 디지로그쌤 관리자 화면 — 페이지별 입력 칸은 아래 SCHEMA 에서 정합니다. */

const COLORS = [['sun', '노랑'], ['sky', '하늘'], ['mint', '민트'], ['coral', '코랄']];
const TYPES = [['biz', '소상공인'], ['public', '공공·연수'], ['univ', '대학·청년'], ['senior', '시니어·시민'], ['kids', '초등·아동']];
const STATUSES = [['done', '출강 완료'], ['ongoing', '출강 중'], ['upcoming', '출강 예정']];
const RICH = '줄바꿈은 그대로 반영돼요. *이렇게* 별표로 감싸면 코랄색 강조.';

const T = (key, label, help) => ({ key, label, type: 'text', help });
const A = (key, label, help) => ({ key, label, type: 'textarea', help });
const R = (key, label) => ({ key, label, type: 'textarea', help: RICH });
const IMG = (key, label) => ({ key, label, type: 'image' });
const SEL = (key, label, options) => ({ key, label, type: 'select', options });
const G = (key, label, fields) => ({ key, label, type: 'group', fields });
const L = (key, label, fields, itemLabel) => ({ key, label, type: 'list', fields, itemLabel });
const HERO = G('hero', '페이지 맨 위', [T('title', '제목'), R('lead', '설명')]);
const CTA = G('cta', '맨 아래 안내 상자', [T('title', '제목'), T('text', '설명'), T('button', '버튼 글자')]);

const SCHEMA = {
  home: { label: '홈', view: '/', notice: '홈의 <b>강의 분야 카드</b>는 「강의」에서, <b>최근 출강 카드 3개</b>는 「프로젝트·이력·현장」의 현장 이야기 카드 앞 3개에서 가져와요.', fields: [
    G('hero', '첫 화면', [T('eyebrow', '작은 머리말'), R('title', '큰 제목'), R('lead', '설명'), IMG('photo', '프로필 사진'), T('photoAlt', '사진 설명 (화면에 안 보임, 검색·음성 안내용)'), T('badgeTop', '사진 위 배지'), T('badgeBottomNumber', '사진 아래 배지 숫자'), T('badgeBottomText', '사진 아래 배지 글자')]),
    L('stats', '숫자 4칸', [T('value', '숫자'), T('label', '설명')], '숫자'),
    G('method', '수업 방식', [T('eyebrow', '머리말'), R('title', '제목'), R('lead', '설명'), L('steps', '단계', [T('icon', '이모지'), T('title', '제목'), A('text', '설명')], '단계')]),
    T('coursesTitle', '강의 분야 제목'),
    G('recent', '최근 출강', [R('title', '제목'), R('lead', '설명')]),
    T('blogTitle', '블로그 영역 제목'),
    CTA,
  ] },
  about: { label: '소개', view: '/about', fields: [
    HERO, IMG('photo', '프로필 사진'), R('quote', '큰 인용 문장'), A('body', '소개 글', '문단은 빈 줄로 나눠요. *별표*로 강조.'),
    L('groups', '경력·자격 묶음', [T('icon', '이모지'), T('title', '묶음 이름'), L('items', '항목', [T('when', '시기'), T('title', '이름'), T('sub', '기관·설명')], '항목')], '묶음'),
    CTA,
  ] },
  lectures: { label: '강의', view: '/lectures', fields: [
    HERO,
    L('courses', '강의 분야', [T('title', '강의 이름'), T('tag', '꼬리표 (예: 입문)'), SEL('color', '꼬리표 색', COLORS), T('short', '한 줄 소개 (홈 카드용)'), R('desc', '설명'), A('points', '배우는 내용', '한 줄에 하나씩'), T('meta', '추천 대상')], '강의'),
    G('audience', '수강 대상', [T('eyebrow', '머리말'), R('title', '제목'), L('items', '대상', [T('icon', '이모지'), T('title', '대상'), T('sub', '설명')], '대상')]),
    G('format', '진행 안내 표', [T('title', '제목'), L('rows', '줄', [T('label', '항목'), R('value', '내용')], '줄')]),
    CTA,
  ] },
  projects: { label: '프로젝트·이력·현장', view: '/projects', notice: '출강 기록은 <b>위에 있을수록 먼저</b> 보여요. 새 출강은 「+ 기록 추가」 후 ↑ 버튼으로 맨 위로 올리세요. 끝나면 상태를 「출강 완료」로 바꿔 주세요.', fields: [
    HERO,
    G('featured', '대표 프로젝트', [T('eyebrow', '머리말'), R('title', '제목'), R('lead', '설명'), IMG('image', '대표 이미지'), T('imageAlt', '이미지 설명'), A('lessons', '커리큘럼', '한 줄에 한 강씩 (1강, 2강… 번호는 자동)'), T('button', '버튼 글자')]),
    G('history', '출강 이력', [T('title', '제목'), R('lead', '설명'), L('items', '출강 기록', [T('title', '기관·과정 이름'), T('date', '기간 (예: 2026.08–09)'), A('desc', '강좌명·내용'), SEL('status', '상태', STATUSES), SEL('type', '분류 (필터)', TYPES)], '기록')]),
    G('gallery', '현장 갤러리 (움직이는 사진)', [T('title', '제목'), L('items', '사진', [IMG('src', '사진'), T('title', '사진 설명'), T('tag', '장소·과정')], '사진')]),
    G('cards', '현장 이야기 카드', [T('title', '제목'), L('items', '카드', [IMG('image', '사진'), T('imageAlt', '사진 설명 (검색·음성 안내용)'), T('tag', '꼬리표 (예: 소상공인 · 2026.10)'), SEL('color', '꼬리표 색', COLORS), T('title', '제목'), A('text', '내용'), T('link', '블로그 후기 주소')], '카드')]),
    G('blog', '블로그 자동 목록', [T('title', '제목'), R('lead', '설명')]),
    CTA,
  ] },
  reviews: { label: '수강생 후기', view: '/reviews', notice: '지금은 비어 있는 페이지예요. 수강생이 직접 후기를 남기는 기능은 다음에 붙일 예정이에요.', fields: [
    HERO,
    G('empty', '빈 화면 안내', [T('title', '제목'), A('text', '설명')]),
  ] },
  classes: { label: '수업자료 목록', view: '/materials', root: 'list', notice: '수업마다 비밀번호를 정해요. 비밀번호는 <b>새로 정하거나 바꿀 때만</b> 입력하세요. 비워 두면 기존 비밀번호가 유지돼요. 자료는 3MB 이하 파일을 올리거나, 구글 드라이브 공유 링크를 붙여 넣으세요.', fields: [
    T('title', '수업 이름 (수강생에게 보임)'),
    { key: 'newPassword', label: '비밀번호', type: 'password' },
    L('files', '자료', [T('name', '자료 이름'), { key: 'url', label: '파일 또는 링크', type: 'file' }, T('note', '메모 (예: PDF, 1주차)')], '자료'),
  ], itemLabel: '수업' },
  materials: { label: '수업자료 페이지 문구', view: '/materials', fields: [HERO] },
  contact: { label: '문의', view: '/contact', notice: '문의 내용은 구글 시트 「홈페이지 강의 문의」에 쌓여요.', fields: [
    HERO, A('inquiryTypes', '받는 문의 종류'), A('topics', '관심 주제 선택지', '한 줄에 하나씩'), A('privacy', '개인정보 동의 문구'), T('success', '접수 완료 메시지'),
  ] },
  site: { label: '기본 정보', view: '/', fields: [
    T('name', '별명 (로고)'), T('person', '이름'), T('personEn', '영문 이름'), T('role', '직함'), T('email', '이메일'), T('blog', '블로그 주소'), T('blogName', '블로그 이름'),
    A('description', '사이트 소개 (검색 결과에 보이는 문장)'), IMG('shareImage', '공유 미리보기 이미지 (카톡 등)'),
  ] },
};
const MENU = [['페이지', ['home', 'about', 'lectures', 'projects', 'reviews', 'contact']], ['수업자료', ['classes', 'materials']], ['설정', ['site']]];

/* ---------- 공통 ---------- */
const $ = (s, el = document) => el.querySelector(s);
const h = (tag, attrs = {}, ...kids) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (v === true) el.setAttribute(k, '');
    else if (v !== false && v != null) el.setAttribute(k, v);
  }
  for (const k of kids.flat()) if (k != null) el.append(k instanceof Node ? k : document.createTextNode(k));
  return el;
};
async function api(action, body) {
  const r = await fetch('/api/admin?action=' + action, body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await r.json().catch(() => ({}));
  if (r.status === 401 && action !== 'login') { showLogin('로그인이 만료됐어요. 다시 로그인해 주세요.'); throw new Error('auth'); }
  if (!r.ok) throw new Error(data.error || '문제가 생겼어요.');
  return data;
}
let toastTimer;
function toast(msg, error) {
  document.querySelector('.toast')?.remove();
  const t = h('div', { class: 'toast' + (error ? ' error' : ''), role: 'status' }, msg);
  document.body.append(t);
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.remove(), error ? 6000 : 4000);
}
const previews = new Map(); // 방금 올린 사진은 배포 전이라 주소로 안 보이므로 미리보기 보관

/* ---------- 로그인 ---------- */
function showLogin(msg) {
  const root = $('#root');
  root.innerHTML = '';
  const form = h('form', { class: 'card' },
    h('h1', {}, '디지로그쌤 관리자'),
    h('p', {}, '홈페이지 내용을 고치는 곳이에요.'),
    h('div', { class: 'field' }, h('label', { for: 'pw' }, '관리자 비밀번호'), h('input', { id: 'pw', type: 'password', autocomplete: 'current-password', required: true })),
    h('button', { class: 'btn btn-primary', type: 'submit', style: 'width:100%' }, '로그인'),
    h('p', { class: 'form-msg error' + (msg ? '' : ''), role: 'alert' }, msg || ''));
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = $('button', form); btn.disabled = true;
    try { await api('login', { password: $('#pw').value }); start(); }
    catch (err) { $('.form-msg', form).textContent = err.message; }
    finally { btn.disabled = false; }
  });
  root.append(h('div', { class: 'login' }, form));
  $('#pw').focus();
}

/* ---------- 편집기 ---------- */
let current = null, data = null, dirty = false, isLocal = false;
const setDirty = v => { dirty = v; const s = $('.topbar .status'); if (s) { s.textContent = v ? '저장하지 않은 변경 있음' : (s.dataset.saved || ''); s.className = 'status' + (v ? ' dirty' : ''); } };
window.addEventListener('beforeunload', e => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

const blank = fields => Object.fromEntries(fields.map(f => [f.key, f.type === 'list' ? [] : f.type === 'group' ? blank(f.fields) : f.type === 'select' ? f.options[0][0] : '']));

function fieldEl(f, obj) {
  const id = 'f' + Math.random().toString(36).slice(2, 8);
  const set = v => { obj[f.key] = v; setDirty(true); };
  const val = obj[f.key] ?? '';
  const help = f.help ? h('span', { class: 'help' }, f.help) : null;

  if (f.type === 'group') {
    obj[f.key] ??= blank(f.fields);
    return h('div', { class: 'group' }, h('div', { class: 'gtitle' }, f.label), f.fields.map(x => fieldEl(x, obj[f.key])));
  }
  if (f.type === 'list') { obj[f.key] ??= []; return h('div', { class: 'f' }, h('label', {}, f.label), listEl(f, obj[f.key])); }
  if (f.type === 'textarea') {
    const ta = h('textarea', { id, oninput: e => set(e.target.value) }); ta.value = val;
    return h('div', { class: 'f' }, h('label', { for: id }, f.label), ta, help);
  }
  if (f.type === 'select') {
    const s = h('select', { id, onchange: e => set(e.target.value) }, f.options.map(([v, l]) => h('option', { value: v }, l)));
    s.value = val || f.options[0][0];
    return h('div', { class: 'f' }, h('label', { for: id }, f.label), s);
  }
  if (f.type === 'password') {
    const inp = h('input', { id, type: 'text', autocomplete: 'off', placeholder: obj.hasPassword ? '바꿀 때만 입력 (지금 비밀번호 유지 중)' : '새 비밀번호 입력', oninput: e => set(e.target.value) });
    inp.value = val;
    return h('div', { class: 'f' }, h('label', { for: id }, f.label), inp, h('span', { class: 'help' }, obj.hasPassword ? '✅ 비밀번호가 정해져 있어요.' : '⚠️ 아직 비밀번호가 없어요.'));
  }
  if (f.type === 'image') {
    const inp = h('input', { id, type: 'text', placeholder: '/assets/... 또는 https://...' });
    const thumb = h('img', { class: 'thumb', alt: '' });
    const show = v => { thumb.src = previews.get(v) || v || ''; };
    inp.value = val; show(val);
    inp.addEventListener('input', e => { set(e.target.value); show(e.target.value); });
    const file = h('input', { type: 'file', accept: 'image/*', hidden: true });
    file.addEventListener('change', async () => {
      const fl = file.files[0]; if (!fl) return;
      const btn = up; btn.disabled = true; btn.textContent = '올리는 중…';
      try {
        const { blob, name, dataUrl } = await shrink(fl);
        const r = await api('upload', { kind: 'image', name, data: await toB64(blob) });
        previews.set(r.url, dataUrl);
        inp.value = r.url; set(r.url); show(r.url);
        toast(isLocal ? '사진을 올렸어요.' : '사진을 올렸어요. 저장 후 1~2분 뒤 사이트에 보여요.');
      } catch (e) { if (e.message !== 'auth') toast(e.message, true); }
      finally { btn.disabled = false; btn.textContent = '📷 사진 올리기'; file.value = ''; }
    });
    const up = h('button', { type: 'button', class: 'btn btn-ghost', style: 'padding:8px 14px;font-size:14px', onclick: () => file.click() }, '📷 사진 올리기');
    return h('div', { class: 'f' }, h('label', { for: id }, f.label), h('div', { class: 'img-field' }, thumb, h('div', {}, inp, h('div', { class: 'row' }, up, file), h('span', { class: 'help' }, '큰 사진은 자동으로 줄여서 올려요.'))));
  }
  if (f.type === 'file') {
    const inp = h('input', { id, type: 'text', placeholder: '구글 드라이브 링크 붙여넣기 또는 파일 올리기', oninput: e => set(e.target.value) });
    inp.value = val;
    const file = h('input', { type: 'file', hidden: true });
    const up = h('button', { type: 'button', class: 'mini', onclick: () => file.click() }, '📎 파일 올리기');
    file.addEventListener('change', async () => {
      const fl = file.files[0]; if (!fl) return;
      if (fl.size > 3_000_000) { toast('3MB가 넘는 파일은 구글 드라이브에 올리고 링크를 붙여 넣어 주세요.', true); file.value = ''; return; }
      up.disabled = true; up.textContent = '올리는 중…';
      try { const r = await api('upload', { kind: 'file', name: fl.name, data: await toB64(fl) }); inp.value = r.url; set(r.url); if (!obj.name) obj.name = fl.name.replace(/\.[^.]+$/, ''); toast('파일을 올렸어요.'); }
      catch (e) { if (e.message !== 'auth') toast(e.message, true); }
      finally { up.disabled = false; up.textContent = '📎 파일 올리기'; file.value = ''; }
    });
    return h('div', { class: 'f' }, h('label', { for: id }, f.label), h('div', { class: 'file-row' }, inp, up, file));
  }
  const inp = h('input', { id, type: 'text', oninput: e => set(e.target.value) }); inp.value = val;
  return h('div', { class: 'f' }, h('label', { for: id }, f.label), inp, help);
}

function listEl(f, arr) {
  const wrap = h('div');
  const draw = (openIndex) => {
    wrap.innerHTML = '';
    const list = h('div', { class: 'list' });
    arr.forEach((item, i) => {
      const first = f.fields.find(x => x.type === 'text' || x.type === 'textarea');
      const title = String(item[first?.key] || '').replace(/\*/g, '').split('\n')[0] || `새 ${f.itemLabel || '항목'}`;
      const move = (d, e) => { e.preventDefault(); const j = i + d; if (j < 0 || j >= arr.length) return; [arr[i], arr[j]] = [arr[j], arr[i]]; setDirty(true); draw(j); };
      const del = e => { e.preventDefault(); if (!confirm(`「${title}」을(를) 지울까요?`)) return; arr.splice(i, 1); setDirty(true); draw(); };
      const thumbField = f.fields.find(x => x.type === 'image');
      const thumb = thumbField && item[thumbField.key] ? h('img', { src: previews.get(item[thumbField.key]) || item[thumbField.key], alt: '', style: 'width:44px;height:33px;object-fit:cover;border-radius:6px' }) : null;
      const d = h('details', { class: 'item', open: openIndex === i },
        h('summary', {}, h('span', { class: 'n' }, String(i + 1)), thumb, h('span', { class: 't' }, title),
          h('button', { type: 'button', class: 'mini', title: '위로', 'aria-label': '위로', onclick: e => move(-1, e) }, '↑'),
          h('button', { type: 'button', class: 'mini', title: '아래로', 'aria-label': '아래로', onclick: e => move(1, e) }, '↓'),
          h('button', { type: 'button', class: 'mini danger', onclick: del }, '삭제')),
        h('div', { class: 'body' }, f.fields.map(x => fieldEl(x, item))));
      $('.body', d).addEventListener('input', e => {
        if (first && e.target.closest('.f') === $('.body', d).children[f.fields.indexOf(first)]) $('.t', d).textContent = e.target.value.replace(/\*/g, '').split('\n')[0] || `새 ${f.itemLabel || '항목'}`;
      });
      list.append(d);
    });
    wrap.append(list, h('button', { type: 'button', class: 'add', onclick: () => { arr.push(blank(f.fields)); setDirty(true); draw(arr.length - 1); } }, `+ ${f.itemLabel || '항목'} 추가`));
  };
  draw();
  return wrap;
}

async function openPage(key) {
  if (dirty && !confirm('저장하지 않은 변경이 있어요. 버리고 이동할까요?')) return;
  current = key; setDirty(false);
  document.querySelectorAll('.side button[data-k]').forEach(b => b.setAttribute('aria-current', String(b.dataset.k === key)));
  const sel = $('.page-select'); if (sel) sel.value = key;
  const s = SCHEMA[key];
  $('.topbar h1').textContent = s.label;
  $('.topbar .view').href = s.view;
  const box = $('.content'); box.innerHTML = '<p style="color:var(--muted)">불러오는 중…</p>';
  try {
    ({ data } = await api('load', { page: key }));
    box.innerHTML = '';
    if (s.notice) { const n = h('div', { class: 'notice' }); n.innerHTML = s.notice; box.append(n); }
    if (s.root === 'list') box.append(listEl({ fields: s.fields, itemLabel: s.itemLabel }, data));
    else box.append(...s.fields.map(f => fieldEl(f, data)));
  } catch (e) { if (e.message !== 'auth') box.innerHTML = `<p class="form-msg error">${e.message}</p>`; }
}

async function save() {
  const btn = $('.topbar .save'); btn.disabled = true; btn.textContent = '저장 중…';
  try {
    const r = await api('save', { page: current, data });
    const st = $('.topbar .status');
    st.dataset.saved = r.local ? '저장됨 (내 컴퓨터)' : `저장됨 ${new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} · 1~2분 뒤 사이트에 반영`;
    setDirty(false);
    toast(r.local ? '저장했어요.' : '저장했어요! 1~2분 뒤 홈페이지에 반영돼요.');
    if (current === 'classes') openPage('classes'); // 비밀번호 칸 초기화
  } catch (e) { if (e.message !== 'auth') toast(e.message, true); }
  finally { btn.disabled = false; btn.textContent = '저장하기'; }
}

function shell() {
  const root = $('#root'); root.innerHTML = '';
  const side = h('aside', { class: 'side' },
    h('a', { class: 'logo', href: '/', target: '_blank' }, h('span', { class: 'logo-mark' }, 'd'), h('span', {}, '관리자', h('small', {}, '디지로그쌤 홈페이지'))),
    MENU.map(([g, keys]) => [h('h2', {}, g), keys.map(k => h('button', { 'data-k': k, onclick: () => openPage(k) }, SCHEMA[k].label))]),
    h('div', { class: 'bottom' }, h('button', { onclick: async () => { if (dirty && !confirm('저장하지 않은 변경이 있어요. 로그아웃할까요?')) return; dirty = false; await api('logout', {}); showLogin(); } }, '로그아웃')));
  const sel = h('select', { class: 'page-select', 'aria-label': '고칠 페이지', onchange: e => openPage(e.target.value) },
    MENU.map(([g, keys]) => h('optgroup', { label: g }, keys.map(k => h('option', { value: k }, SCHEMA[k].label)))));
  const main = h('div', { class: 'main' },
    h('div', { class: 'topbar' }, sel, h('h1', {}, ''), h('span', { class: 'status' }),
      h('a', { class: 'btn btn-ghost view', target: '_blank', href: '/' }, '사이트 보기'),
      h('button', { class: 'btn btn-primary save', onclick: save }, '저장하기')),
    h('div', { class: 'content' }));
  root.append(h('div', { class: 'app' }, side, main));
  document.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); save(); } });
}

/* ---------- 사진 줄이기 ---------- */
function toB64(blob) {
  return new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(',')[1]); r.onerror = no; r.readAsDataURL(blob); });
}
async function shrink(file) {
  const base = file.name.replace(/\.[^.]+$/, '') || 'photo';
  if (file.type === 'image/gif') return { blob: file, name: file.name, dataUrl: URL.createObjectURL(file) };
  const img = await createImageBitmap(file);
  const scale = Math.min(1, 1800 / Math.max(img.width, img.height));
  const c = document.createElement('canvas');
  c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  let blob = await new Promise(r => c.toBlob(r, 'image/webp', 0.85));
  let name = base + '.webp';
  if (!blob || blob.type !== 'image/webp') { blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.85)); name = base + '.jpg'; }
  return { blob, name, dataUrl: c.toDataURL('image/jpeg', 0.7) };
}

/* ---------- 시작 ---------- */
async function start() {
  try {
    const s = await api('status');
    isLocal = s.local;
    if (!s.configured) { $('#root').innerHTML = '<div class="login"><div class="card"><h1>설정이 필요해요</h1><p>Vercel 환경변수에 <b>ADMIN_PASSWORD</b>와 <b>GITHUB_TOKEN</b>을 넣어 주세요. (docs/관리자-설정방법.md)</p></div></div>'; return; }
    if (!s.authed) return showLogin();
    shell(); openPage('home');
  } catch { $('#root').innerHTML = '<p style="padding:40px">관리자 서버에 연결하지 못했어요.</p>'; }
}
start();
