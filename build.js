// content/*.json + static/ → dist/ (Vercel이 배포할 때 자동 실행)
// 글 안의 표시법:  *강조할 말*  → 코랄색 강조,  줄바꿈 → 그대로 줄바꿈
const fs = require('fs');
const path = require('path');
const X = require('./astryx'); // Astryx 디자인 시스템 버튼·카드 (neutral 테마)

const ROOT = __dirname;
const OUT = path.join(ROOT, 'dist');
const read = name => JSON.parse(fs.readFileSync(path.join(ROOT, 'content', name + '.json'), 'utf8'));

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rich = s => esc(s).replace(/\*([^*\n]+)\*/g, '<em>$1</em>').replace(/\n/g, '<br>');
const plain = s => String(s ?? '').replace(/\*/g, '');
const lines = s => String(s ?? '').split('\n').map(x => x.trim()).filter(Boolean);
const paras = s => String(s ?? '').split(/\n\s*\n/).map(x => x.trim()).filter(Boolean);
const tagClass = c => ({ sky: ' sky', mint: ' mint', coral: ' coral' }[c] || '');
const ext = url => /^https?:/.test(url || '');
const linkAttrs = url => ext(url) ? ' target="_blank" rel="noopener"' : '';

const NAV = [
  ['/', '홈', 'home'], ['/about', '소개', 'about'], ['/lectures', '강의', 'lectures'],
  ['/projects', '프로젝트·이력', 'projects'], ['/reviews', '강의후기', 'reviews'], ['/materials', '수업자료', 'materials'],
];

function layout(site, { key, title, description, body, noindex }) {
  const fullTitle = key === 'home' ? `${site.name} ${site.person} | ${site.role}` : `${title} | ${site.name} ${site.person}`;
  const nav = NAV.map(([href, label, k]) => `<a href="${href}"${k === key ? ' aria-current="page"' : ''}>${label}</a>`).join('');
  return `<!doctype html>
<html lang="ko" class="no-js" data-theme="light">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(description || site.description)}">
${noindex ? '<meta name="robots" content="noindex">\n' : ''}<meta property="og:title" content="${esc(fullTitle)}"><meta property="og:description" content="${esc(description || site.description)}"><meta property="og:image" content="${esc(site.shareImage)}"><meta property="og:type" content="website">
<meta name="theme-color" content="#FFFFFF">
<link rel="icon" type="image/svg+xml" href="/assets/brand/favicon.svg"><link rel="icon" type="image/png" href="/assets/brand/favicon.png">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;700&display=swap">
${X.CSS_LINKS}
<link rel="stylesheet" href="/style.css"><script src="/script.js" defer></script>
</head>
<body data-page="${key}" data-email="${esc(site.email)}" data-blog-url="${esc(site.blog)}">
<a class="skip-link" href="#main">본문 바로가기</a>
<header class="site-header"><div class="wrap">
  <a class="logo" href="/" aria-label="DIGILOG ${esc(site.person)} 홈">${BRAND_SYMBOL}<span><span class="brand-word">DIGI<span>LOG</span></span><small>${esc(site.person)}</small></span></a>
  <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="site-nav">메뉴</button>
  <nav class="nav" id="site-nav" aria-label="주요 메뉴">${nav}<a class="nav-cta" href="/contact"${key === 'contact' ? ' aria-current="page"' : ''}>강의 문의</a></nav>
</div></header>
<main id="main">
${body}
</main>
<footer class="site-footer"><div class="wrap">
  <div><strong style="color:var(--ink)">${esc(site.name)} ${esc(site.person)}</strong> · ${esc(site.personEn)}<br><a href="mailto:${esc(site.email)}">${esc(site.email)}</a></div>
  <nav aria-label="하단 메뉴">${NAV.slice(1).map(([h, l]) => `<a href="${h}">${l}</a>`).join('')}<a href="/contact">문의</a><a href="${esc(site.blog)}" target="_blank" rel="noopener">블로그</a></nav>
  <small>© ${new Date().getFullYear()} DIGILOG. All rights reserved.</small>
</div></footer>
${BLOG_CARD_TEMPLATE}
</body>
</html>
`;
}

// 로고 심볼 (d 모양 + 피치색 픽셀 눈) — 헤더에 인라인으로 넣는다
const BRAND_SYMBOL = '<svg width="40" height="40" viewBox="-2 2 94 94" aria-hidden="true"><circle cx="42" cy="63" r="27" fill="#4A3F3A"/><rect x="58" y="8" width="17" height="82" rx="8.5" fill="#4A3F3A"/><rect x="33" y="54" width="18" height="18" rx="2" fill="#FEC89A"/><rect x="16" y="22" width="10" height="10" rx="1.5" fill="#FEC5BB"/></svg>';

// 캐릭터 이미지 (static/assets/character/) — 크기는 원본 픽셀
const CHAR = '/assets/character/';
const POSES = {
  wave: [388, 742], point: [224, 398], present: [319, 399], think: [196, 399], cheer: [272, 406],
  book: [201, 265], camera: [253, 250], headset: [257, 255], laptop: [311, 237],
};
const poseImg = (name, attrs = '') => `<img src="${CHAR}pose_${name}.webp" width="${POSES[name][0]}" height="${POSES[name][1]}"${attrs}>`;

/** 서브페이지 상단: 제목 왼쪽, 캐릭터 포즈 오른쪽 */
const pageHero = (eyebrow, h, pose) => `<section class="page-hero"><div class="wrap page-hero-grid">
  <div>
    <span class="eyebrow">${esc(eyebrow)}</span>
    <h1>${rich(h.title)}</h1>
    <p>${rich(h.lead)}</p>
  </div>
  ${pose ? `<div class="page-hero-pose" aria-hidden="true">${poseImg(pose, ' alt=""')}</div>` : ''}
</div></section>`;

// 홈 히어로 장면: 포즈 → 말풍선 대사 (3.6초마다 다음 장면)
const HERO_SCENES = [
  { id: 'wave', step: 'HELLO', label: '인사', text: '안녕하세요! 디지로그쌤 노희선이에요.', alt: '손을 흔들며 인사하는 디지로그쌤 캐릭터' },
  { id: 'point', step: 'STEP 01', label: '눈높이', text: '어려운 AI, 눈높이에 맞춰 설명해요.', alt: '손가락을 들고 설명하는 캐릭터' },
  { id: 'present', step: 'STEP 02', label: '실습', text: '보기만 하지 말고, 직접 해봐요!', alt: 'AI 보드를 가리키며 수업하는 캐릭터' },
  { id: 'think', step: 'TOGETHER', label: '함께 고민', text: '막히는 곳은 같이 고민해요.', alt: '턱을 괴고 고민하는 캐릭터' },
  { id: 'cheer', step: 'STEP 03', label: '적용', text: '오늘 배운 AI, 내 일에 바로!', alt: '두 주먹을 들고 기뻐하는 캐릭터' },
];
// '이런 수업을 합니다' 띠에서 강의 순서대로 쓸 포즈
const COURSE_POSES = ['headset', 'laptop', 'camera', 'present', 'book', 'think'];

const heroStage = () => `<div class="hero-stage" id="hero-stage" role="group" aria-label="디지로그쌤 캐릭터 애니메이션">
    <div class="hero-blob" aria-hidden="true"></div>
    <div id="hero-pixels" aria-hidden="true"></div>
    <div class="hero-prop p-ai" aria-hidden="true"><img src="${CHAR}icon_ai.webp" alt="" width="122" height="118"></div>
    <div class="hero-prop p-bulb" aria-hidden="true"><img src="${CHAR}icon_bulb.webp" alt="" width="89" height="108"></div>
    <div class="hero-prop p-coffee" aria-hidden="true"><img src="${CHAR}icon_coffee.webp" alt="" width="97" height="130"></div>
    <div class="hero-prop p-laptop" aria-hidden="true"><img src="${CHAR}icon_laptop.webp" alt="" width="212" height="128"></div>
    <div class="hero-floor" aria-hidden="true"></div>
    <div class="hero-actor" id="hero-actor" data-scene="${HERO_SCENES[0].id}">
      <div class="hero-bob">
${HERO_SCENES.map((s, i) => `        ${poseImg(s.id, ` class="hero-pose ${s.id}${i === 0 ? ' on' : ''}" data-scene="${s.id}" alt="${esc(s.alt)}"${i === 0 ? ' fetchpriority="high"' : ''}`)}`).join('\n')}
      </div>
    </div>
    <div class="hero-q" aria-hidden="true">?</div>
    <p class="hero-bubble" id="hero-bubble" aria-live="polite"><span class="step" id="hero-step">${HERO_SCENES[0].step}</span><span id="hero-say">${esc(HERO_SCENES[0].text)}</span><span class="hero-caret" aria-hidden="true"></span></p>
    <div class="hero-dots" role="group" aria-label="장면 선택">
${HERO_SCENES.map((s, i) => `      <button type="button" data-go="${i}" aria-pressed="${i === 0}">${esc(s.label)}</button>`).join('\n')}
    </div>
    <script type="application/json" id="hero-scenes">${JSON.stringify(HERO_SCENES.map(({ id, step, text }) => ({ id, step, text }))).replace(/</g, '\\u003c')}</script>
  </div>`;

const courseStrip = (title, courses) => {
  const cards = dup => courses.map((c, i) => `<a class="hero-card" href="/lectures#course-${i + 1}"${dup ? ' aria-hidden="true" tabindex="-1"' : ''}>${poseImg(COURSE_POSES[i % COURSE_POSES.length], ' alt="" loading="lazy"')}<b>${esc(c.title)}</b><span>${esc(c.short)}</span></a>`).join('');
  return `<section class="hero-strip" aria-labelledby="strip-title">
  <div class="wrap hero-strip-head"><h2 id="strip-title">${plain(title)}</h2><a class="text-link" href="/lectures">강의 분야 자세히 보기 →</a></div>
  <div class="hero-track">${cards(false)}${cards(true)}</div>
</section>`;
};

const cta = (c, href, dark) => `<section class="section"${dark ? ' style="padding-top:0"' : ''}><div class="wrap"><div class="cta">
  <div><h2>${rich(c.title)}</h2><p>${rich(c.text)}</p></div>
  ${X.button({ label: c.button, href })}
</div></div></section>`;

// 블로그 출강후기 큰 카드 틀 — script.js가 복제해서 글 내용을 채운다
const BLOG_CARD_TEMPLATE = `<template id="blog-card-template">${X.clickableCard(
  '<img alt="" loading="lazy" referrerpolicy="no-referrer" width="550" height="550"><div class="body"><h3></h3><p></p><span class="more">후기 읽기 →</span></div>',
  { label: '출강 후기', href: '#', target: '_blank', className: 'review-card blog-card', padding: 0 })}</template>`;

/* ---------------- 페이지 ---------------- */
function home(site, h, lec, rev) {
  return `<section class="hero"><div class="wrap hero-grid">
  <div>
    <span class="eyebrow">${esc(h.hero.eyebrow)}</span>
    <h1>${rich(h.hero.title)}</h1>
    <p class="lead">${rich(h.hero.lead)}</p>
    <div class="btn-row">${X.button({ label: '기관·단체 강의 문의', href: '/contact' })}${X.button({ label: '강의 분야 보기', href: '/lectures', variant: 'secondary' })}</div>
  </div>
  ${heroStage()}
</div></section>

${courseStrip(h.coursesTitle, lec.courses)}

<div class="wrap"><div class="stats" aria-label="주요 숫자">
${h.stats.map(s => `  <div class="stat"><b>${esc(s.value)}</b><span>${esc(s.label)}</span></div>`).join('\n')}
</div></div>

<section class="section steps"><div class="wrap">
  <div class="section-head center"><span class="eyebrow">${esc(h.method.eyebrow)}</span><h2 class="section-title">${rich(h.method.title)}</h2><p class="section-lead">${rich(h.method.lead)}</p></div>
  <div class="grid grid-3">
${h.method.steps.map((s, i) => '    ' + X.card(`<div class="step-icon" style="background:var(--${['sun', 'mint', 'sky'][i % 3]}-soft)">${esc(s.icon)}</div><h3>${esc(s.title)}</h3><p>${rich(s.text)}</p>`, { className: 'reveal' })).join('\n')}
  </div>
</div></section>

<section class="section alt"><div class="wrap">
  <div class="section-head split"><div><span class="eyebrow">블로그</span><h2 class="section-title">${rich(h.blogTitle)}</h2></div><a class="text-link" href="${esc(site.blog)}" target="_blank" rel="noopener">네이버 블로그 가기 →</a></div>
  <ul class="blog-list" data-blog data-limit="6"></ul>
  <p class="blog-status">최신 글을 불러오는 중이에요…</p>
</div></section>

${cta(h.cta, '/contact')}`;
}

function about(a) {
  return `${pageHero('소개', a.hero, 'point')}
<section class="section"><div class="wrap about-grid">
  <img src="${esc(a.photo)}" width="1122" height="1402" alt="생성형 AI 강사 프로필 사진" loading="lazy">
  <div>
    <span class="eyebrow">수업 철학</span>
    <p class="quote">${rich(a.quote)}</p>
    <div class="body">${paras(a.body).map(p => `<p>${rich(p)}</p>`).join('')}</div>
    <div class="btn-row" style="margin-top:28px">${X.button({ label: '강의 문의하기', href: '/contact' })}${X.button({ label: '강의후기 보기', href: '/reviews', variant: 'secondary' })}</div>
  </div>
</div></section>
<section class="section alt"><div class="wrap grid grid-2">
${a.groups.map(g => '  ' + X.card(`<h2><span aria-hidden="true">${esc(g.icon)}</span> ${esc(g.title)}</h2><ul class="timeline">
${g.items.map(it => `    <li><span class="when">${esc(it.when)}</span><div><strong>${esc(it.title)}</strong>${it.sub ? `<small>${esc(it.sub)}</small>` : ''}</div></li>`).join('\n')}
  </ul>`, { className: 'reveal' })).join('\n')}
</div></section>
${cta(a.cta, '/lectures')}`;
}

function lectures(l) {
  return `${pageHero('강의', l.hero, 'present')}
<section class="section"><div class="wrap grid grid-2">
${l.courses.map((c, i) => '  ' + X.card(`
    <div class="top"><span class="num">${String(i + 1).padStart(2, '0')}</span><span class="tag${tagClass(c.color)}">${esc(c.tag)}</span></div>
    <h3>${esc(c.title)}</h3><p>${rich(c.desc)}</p>
    <ul>${lines(c.points).map(p => `<li>${esc(p)}</li>`).join('')}</ul>
    ${c.meta ? `<p class="meta">${esc(c.meta)}</p>` : ''}`, { className: 'course-card reveal', id: `course-${i + 1}` })).join('\n')}
</div></section>
<section class="section alt"><div class="wrap">
  <div class="section-head center"><span class="eyebrow">${esc(l.audience.eyebrow)}</span><h2 class="section-title">${rich(l.audience.title)}</h2></div>
  <ul class="audience-list">
${l.audience.items.map(a => `    <li class="reveal"><span aria-hidden="true">${esc(a.icon)}</span>${esc(a.title)}<br><small style="color:var(--muted);font-weight:500">${esc(a.sub)}</small></li>`).join('\n')}
  </ul>
</div></section>
<section class="section"><div class="wrap">
  <div class="section-head"><span class="eyebrow">진행 안내</span><h2 class="section-title">${rich(l.format.title)}</h2></div>
  <table class="format-table">
${l.format.rows.map(r => `    <tr><th scope="row">${esc(r.label)}</th><td>${rich(r.value)}</td></tr>`).join('\n')}
  </table>
</div></section>
${cta(l.cta, '/contact', true)}`;
}

const HISTORY_TYPES = [['all', '전체'], ['biz', '소상공인'], ['public', '공공·연수'], ['univ', '대학·청년'], ['senior', '시니어·시민'], ['kids', '초등·아동']];
const STATUS = { done: ['출강 완료', ''], ongoing: ['출강 중', ' coral'], upcoming: ['출강 예정', ' sky'] };

const gallerySection = g => `<section class="gallery" id="gallery" aria-labelledby="gallery-title">
  <div class="wrap gallery-head">
    <div><span class="eyebrow">현장 갤러리</span><h2 class="section-title" id="gallery-title">${rich(g.title)}</h2></div>
    <p class="gallery-tip">사진을 누르면 크게 볼 수 있어요.</p>
  </div>
  <div id="field-gallery"></div>
  <div class="gallery-toggle-wrap" hidden>${X.button({ label: '⏸ 움직임 멈추기', variant: 'secondary', size: 'md', className: 'gallery-toggle' })}</div>
  <script type="application/json" id="gallery-data">${JSON.stringify(g.items).replace(/</g, '\\u003c')}</script>
  <dialog class="lightbox" id="lightbox" aria-labelledby="lb-title">
    <button class="lb-close" type="button" aria-label="닫기">✕</button>
    <figure><img src="" alt=""><figcaption><span class="tag coral" id="lb-tag"></span><strong id="lb-title"></strong></figcaption></figure>
    <button class="lb-nav prev" type="button" aria-label="이전 사진">‹</button>
    <button class="lb-nav next" type="button" aria-label="다음 사진">›</button>
  </dialog>
</section>`;

function projects(p) {
  return `${pageHero('프로젝트 · 출강 이력', p.hero, 'camera')}
${gallerySection(p.gallery)}
<section class="section alt"><div class="wrap">
  <div class="section-head"><span class="eyebrow">출강 이력</span><h2 class="section-title">${rich(p.history.title)}</h2><p class="section-lead">${rich(p.history.lead)}</p></div>
  <div class="filter" data-filter role="group" aria-label="대상별 보기">
${HISTORY_TYPES.map(([v, l], i) => `    <button type="button" aria-pressed="${i === 0}" data-value="${v}">${l}</button>`).join('\n')}
  </div>
  <ul class="history">
${p.history.items.map(it => { const [label, cls] = STATUS[it.status] || STATUS.done; return `    <li data-type="${esc(it.type)}"><span class="date">${esc(it.date)}</span><div><h3>${esc(it.title)}</h3><p>${esc(it.desc)}</p></div><div class="side"><span class="tag${cls}">${label}</span></div></li>`; }).join('\n')}
  </ul>
</div></section>
<section class="section" id="stories"><div class="wrap">
  <div class="section-head split"><div><span class="eyebrow">현장 이야기</span><h2 class="section-title">${rich(p.stories.title)}</h2><p class="section-lead">${rich(p.stories.lead)}</p></div><a class="text-link" href="https://blog.naver.com/heeseon_ai" target="_blank" rel="noopener">블로그에서 모두 보기 →</a></div>
  <div class="grid grid-3" data-blog-cards data-limit="${Number(p.stories.count) || 9}" data-category="출강후기"></div>
  <p class="blog-status">현장 이야기를 불러오는 중이에요…</p>
</div></section>
${cta(p.cta, '/contact')}`;
}

function reviews(r) {
  return `${pageHero('강의후기', r.hero, 'cheer')}
<section class="section"><div class="wrap">
  ${X.card(`
    <span class="empty-icon" aria-hidden="true">💬</span>
    <h2>${rich(r.empty.title)}</h2>
    <p>${rich(r.empty.text)}</p>`, { className: 'empty-state', padding: 10, elevation: 'none' })}
</div></section>`;
}

function materials(m) {
  return `${pageHero('수업자료', m.hero, 'book')}
<section class="section"><div class="wrap">
  ${X.card(`<form id="materials-form" novalidate>
    <div class="field"><label for="class-select">어떤 수업을 들으셨나요?</label><select id="class-select" name="classId" required><option value="">목록을 불러오는 중…</option></select></div>
    <div class="field"><label for="class-pw">수업 비밀번호</label><input id="class-pw" name="password" type="password" autocomplete="off" required><span class="hint">비밀번호를 잊으셨다면 강사에게 문의해 주세요.</span></div>
    ${X.button({ label: '자료 열기', type: 'submit', width: '100%' })}
    <p class="form-msg" role="status" aria-live="polite"></p>
    <div id="materials-result"></div>
  </form>`, { className: 'lock-card' })}
</div></section>`;
}

function contact(site, c) {
  return `${pageHero('강의 문의', c.hero, 'headset')}
<section class="section"><div class="wrap contact-grid">
  <div class="contact-side">
    ${X.card(`<h2>📧 이메일</h2><p><a class="text-link" href="mailto:${esc(site.email)}?subject=%EA%B0%95%EC%9D%98%20%EB%AC%B8%EC%9D%98">${esc(site.email)}</a></p>`)}
    ${X.card(`<h2>📝 블로그</h2><p>출강 현장과 수업 내용을 미리 볼 수 있어요.<br><a class="text-link" href="${esc(site.blog)}" target="_blank" rel="noopener">${esc(site.blogName)}</a></p>`)}
    ${X.card(`<h2>🗂️ 이런 문의를 받아요</h2><p>${rich(c.inquiryTypes)}</p>`)}
  </div>
  ${X.card(`<form id="contact-form" data-success="${esc(c.success)}">
    <div class="form-row">
      <div class="field"><label for="f-org">기관·단체명 <span class="req">*</span></label><input id="f-org" name="org" required autocomplete="organization"></div>
      <div class="field"><label for="f-name">담당자 성함 <span class="req">*</span></label><input id="f-name" name="name" required autocomplete="name"></div>
      <div class="field"><label for="f-phone">연락처</label><input id="f-phone" name="phone" type="tel" autocomplete="tel" placeholder="010-0000-0000"></div>
      <div class="field"><label for="f-email">이메일 <span class="req">*</span></label><input id="f-email" name="email" type="email" required autocomplete="email"></div>
      <div class="field"><label for="f-aud">교육 대상</label><input id="f-aud" name="audience" placeholder="예: 시니어, 소상공인, 교직원"></div>
      <div class="field"><label for="f-size">예상 인원</label><input id="f-size" name="size" placeholder="예: 20명"></div>
      <div class="field"><label for="f-date">희망 일정</label><input id="f-date" name="date" placeholder="예: 12월 중 평일 오후 2시간"></div>
      <div class="field"><label for="f-topic">관심 주제</label><select id="f-topic" name="topic"><option value="">선택해 주세요</option>${lines(c.topics).map(t => `<option>${esc(t)}</option>`).join('')}</select></div>
    </div>
    <div class="field"><label for="f-msg">교육 목표·요청 사항</label><textarea id="f-msg" name="message" placeholder="장소, 대면/온라인, 기대하는 결과 등을 자유롭게 적어 주세요."></textarea></div>
    <input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
    <label class="check"><input type="checkbox" name="agree" value="동의" required> <span>${esc(c.privacy)} <span class="req">*</span></span></label>
    ${X.button({ label: '문의 보내기', type: 'submit', width: '100%' })}
    <p class="form-msg" role="status" aria-live="polite"></p>
  </form>`)}
</div></section>`;
}

/* ---------------- 실행 ---------------- */
function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    if (e.isDirectory()) copyDir(s, d); else fs.copyFileSync(s, d);
  }
}

function build({ clean = true } = {}) {
  const site = read('site'), h = read('home'), a = read('about'), l = read('lectures'),
    p = read('projects'), r = read('reviews'), c = read('contact'), m = read('materials');
  if (clean) fs.rmSync(OUT, { recursive: true, force: true });
  copyDir(path.join(ROOT, 'static'), OUT);
  X.copyCss(OUT);
  const pages = {
    index: layout(site, { key: 'home', body: home(site, h, l, p) }),
    about: layout(site, { key: 'about', title: '소개', description: `${site.role} ${site.person}(${site.name})의 경력, 자격, 수업 철학.`, body: about(a) }),
    lectures: layout(site, { key: 'lectures', title: '강의 분야', description: l.courses.map(x => x.title).join(', ') + '. 대상별 맞춤 AI 실습 강의.', body: lectures(l) }),
    projects: layout(site, { key: 'projects', title: '프로젝트·출강 이력', description: '생성형 AI 강의 현장 사진, 출강 이력과 강의 현장 이야기.', body: projects(p) }),
    reviews: layout(site, { key: 'reviews', title: '수강생 후기', description: plain(r.hero.lead), body: reviews(r) }),
    materials: layout(site, { key: 'materials', title: '수업자료실', description: '수강생을 위한 자료실. 수업에서 안내받은 비밀번호로 자료를 받을 수 있습니다.', body: materials(m), noindex: true }),
    contact: layout(site, { key: 'contact', title: '강의 문의', description: '기관·단체 생성형 AI 강의, 연수, 멘토링, 콘텐츠 협업 문의.', body: contact(site, c) }),
  };
  for (const [name, html] of Object.entries(pages)) fs.writeFileSync(path.join(OUT, name + '.html'), html);
  return Object.keys(pages).length;
}

module.exports = build;
if (require.main === module) console.log(`빌드 완료: ${build()}개 페이지 → dist/`);
