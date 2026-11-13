'use strict';
/* 디지로그쌤 홈페이지 공통 스크립트
   페이지 내용은 관리자 화면(/admin)이나 content/*.json 에서 고칩니다. */
const EMAIL = document.body.dataset.email || 'heeseon.ai@gmail.com';
const BLOG = document.body.dataset.blogUrl ||'https://blog.naver.com/heeseon_ai';

document.documentElement.classList.remove('no-js');

/* ---------- 모바일 메뉴 ---------- */
const menuBtn = document.querySelector('.menu-toggle');
if (menuBtn) {
  const nav = document.getElementById('site-nav');
  menuBtn.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.textContent = open ? '닫기' : '메뉴';
  });
}

/* ---------- 스크롤 등장 효과 ---------- */
const reveals = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12 });
  reveals.forEach(el => io.observe(el));
} else reveals.forEach(el => el.classList.add('in'));

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------- 블로그 최신글 (data-blog 속성이 있는 목록) ---------- */
document.querySelectorAll('ul[data-blog]').forEach(async list => {
  const limit = list.dataset.limit || 6;
  const category = list.dataset.category || '';
  const status = list.nextElementSibling?.classList.contains('blog-status') ? list.nextElementSibling : null;
  try {
    const r = await fetch(`/api/blog?limit=${limit}&category=${encodeURIComponent(category)}`);
    if (!r.ok) throw new Error();
    const { posts } = await r.json();
    if (!posts.length) throw new Error();
    list.innerHTML = posts.map(p => `<li><a href="${esc(p.link)}" target="_blank" rel="noopener">
      ${p.thumbnail ? `<img src="${esc(p.thumbnail)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : '<span class="ph" aria-hidden="true"></span>'}
      <span><strong>${esc(p.title)}</strong><small>${esc(p.date)} · ${esc(p.category)}</small></span></a></li>`).join('');
    if (status) status.remove();
  } catch {
    if (status) status.innerHTML = `블로그 글을 불러오지 못했어요. <a class="text-link" href="${BLOG}" target="_blank" rel="noopener">블로그에서 직접 보기</a>`;
  }
});

/* ---------- 블로그 출강후기 큰 카드 (data-blog-cards) ---------- */
document.querySelectorAll('[data-blog-cards]').forEach(async box => {
  const status = box.nextElementSibling?.classList.contains('blog-status') ? box.nextElementSibling : null;
  try {
    const r = await fetch(`/api/blog?limit=${box.dataset.limit || 9}&category=${encodeURIComponent(box.dataset.category || '')}`);
    if (!r.ok) throw new Error();
    const { posts } = await r.json();
    if (!posts.length) throw new Error();
    // 카드 틀(Astryx ClickableCard)은 빌드 때 <template id="blog-card-template">로 들어 있다
    const tpl = document.getElementById('blog-card-template');
    box.replaceChildren(...posts.map(p => {
      const el = tpl.content.firstElementChild.cloneNode(true);
      const a = el.querySelector('a');
      a.href = p.link; a.rel = 'noopener'; a.setAttribute('aria-label', p.title);
      const img = el.querySelector('img');
      if (p.image) { img.src = p.image; img.dataset.fallback = p.thumbnail || ''; }
      else img.replaceWith(Object.assign(document.createElement('span'), { className: 'ph' }));
      el.querySelector('h3').textContent = p.title;
      const sum = el.querySelector('.body p');
      if (p.summary) sum.textContent = p.summary; else sum.remove();
      return el;
    }));
    box.querySelectorAll('img[data-fallback]').forEach(img => img.addEventListener('error', () => { if (img.dataset.fallback && img.src !== img.dataset.fallback) img.src = img.dataset.fallback; }, { once: true }));
    if (status) status.remove();
  } catch {
    if (status) status.innerHTML = `출강 이야기를 불러오지 못했어요. <a class="text-link" href="${BLOG}" target="_blank" rel="noopener">블로그에서 직접 보기</a>`;
  }
});

/* ---------- 현장 갤러리 (강의후기 페이지) — 사진 목록은 관리자 화면에서 관리 ---------- */
const galleryEl = document.getElementById('field-gallery');
let GALLERY = [];
try { GALLERY = JSON.parse(document.getElementById('gallery-data')?.textContent || '[]'); } catch {}
if (galleryEl && GALLERY.length) {
  const tilts = [-2, 1.5, -1, 2, -1.5, 1, -2.5, 1.8];
  const card = (g, i, dup) => `<button class="photo" type="button" data-i="${i}" style="--tilt:${tilts[i % tilts.length]}deg"${dup ? ' aria-hidden="true" tabindex="-1"' : ''}>
      <img src="${g.src}" alt="${dup ? '' : esc(g.title)}" loading="lazy" width="300" height="225"><span>${esc(g.title)}<small>${esc(g.tag)}</small></span></button>`;
  const row = (order, reverse) => {
    const set = order.map(i => card(GALLERY[i], i, false)).join('');
    const dup = order.map(i => card(GALLERY[i], i, true)).join('');
    return `<div class="ribbon${reverse ? ' reverse' : ''}"><div class="ribbon-track">${set}${dup}</div></div>`;
  };
  const idx = GALLERY.map((_, i) => i);
  const half = Math.ceil(idx.length / 2);
  const rowB = [...idx.slice(half), ...idx.slice(0, half)];
  galleryEl.innerHTML = row(idx, false) + row(rowB, true);

  const section = galleryEl.closest('.gallery');
  // 멈춤 버튼(Astryx Button)은 빌드 때 그려져 있고, 사진이 뜨면 보이게 한다
  const toggleWrap = section.querySelector('.gallery-toggle-wrap');
  const toggle = section.querySelector('.gallery-toggle');
  if (toggle) {
    toggleWrap.hidden = false;
    toggle.setAttribute('aria-pressed', 'false');
    const label = [...toggle.querySelectorAll('span')].find(sp => !sp.children.length && sp.textContent.trim());
    toggle.addEventListener('click', () => {
      const paused = section.classList.toggle('paused');
      toggle.setAttribute('aria-pressed', String(paused));
      label.textContent = paused ? '▶ 다시 움직이기' : '⏸ 움직임 멈추기';
    });
  }

  const lb = document.getElementById('lightbox');
  let cur = 0;
  const show = i => {
    cur = (i + GALLERY.length) % GALLERY.length;
    const g = GALLERY[cur];
    lb.querySelector('img').src = g.src;
    lb.querySelector('img').alt = g.title;
    lb.querySelector('#lb-title').textContent = g.title;
    lb.querySelector('#lb-tag').textContent = g.tag;
  };
  galleryEl.addEventListener('click', e => {
    const b = e.target.closest('.photo'); if (!b) return;
    show(Number(b.dataset.i));
    if (lb.showModal) lb.showModal(); else window.open(GALLERY[cur].src, '_blank');
  });
  lb.querySelector('.lb-close').addEventListener('click', () => lb.close());
  lb.querySelector('.prev').addEventListener('click', () => show(cur - 1));
  lb.querySelector('.next').addEventListener('click', () => show(cur + 1));
  lb.addEventListener('click', e => { if (e.target === lb) lb.close(); });
  lb.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') show(cur - 1); if (e.key === 'ArrowRight') show(cur + 1); });
}

/* ---------- 출강 이력 필터 + 페이지 나누기 (한 페이지 5개) ---------- */
const filter = document.querySelector('[data-filter]');
const historyList = document.querySelector('.history');
if (historyList) {
  const PER_PAGE = 5;
  const items = [...historyList.querySelectorAll('li')];
  const pager = document.createElement('nav');
  pager.className = 'pager';
  pager.setAttribute('aria-label', '출강 이력 페이지');
  historyList.after(pager);
  let type = 'all', page = 1;

  const render = (scroll) => {
    const matched = items.filter(li => type === 'all' || li.dataset.type.split(' ').includes(type));
    const pages = Math.max(1, Math.ceil(matched.length / PER_PAGE));
    page = Math.min(Math.max(1, page), pages);
    items.forEach(li => { li.hidden = true; });
    matched.slice((page - 1) * PER_PAGE, page * PER_PAGE).forEach(li => { li.hidden = false; });
    if (pages === 1) { pager.innerHTML = ''; pager.hidden = true; }
    else {
      pager.hidden = false;
      const btn = (p, label, aria, disabled) => `<button type="button" data-page="${p}"${aria ? ` aria-label="${aria}"` : ''}${p === page && !aria ? ' aria-current="page"' : ''}${disabled ? ' disabled' : ''}>${label}</button>`;
      pager.innerHTML = btn(page - 1, '‹', '이전 페이지', page === 1) +
        Array.from({ length: pages }, (_, i) => btn(i + 1, i + 1)).join('') +
        btn(page + 1, '›', '다음 페이지', page === pages) +
        `<span class="pager-info">${matched.length}건 중 ${(page - 1) * PER_PAGE + 1}–${Math.min(page * PER_PAGE, matched.length)}</span>`;
    }
    if (scroll) (filter || historyList).scrollIntoView({ block: 'start', behavior: 'smooth' });
  };

  pager.addEventListener('click', e => {
    const b = e.target.closest('button[data-page]'); if (!b || b.disabled) return;
    page = Number(b.dataset.page); render(true);
  });
  filter?.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    filter.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    type = b.dataset.value; page = 1; render(false);
  });
  render(false);
}

/* ---------- 수업자료 (수업별 비밀번호) ---------- */
const matForm = document.getElementById('materials-form');
if (matForm) {
  const select = matForm.querySelector('select');
  const msg = matForm.querySelector('.form-msg');
  const out = document.getElementById('materials-result');
  fetch('/api/materials').then(r => r.json()).then(({ classes }) => {
    select.innerHTML = '<option value="">수업을 골라 주세요</option>' + classes.map(c => `<option value="${esc(c.id)}">${esc(c.title)}</option>`).join('');
    const want = new URLSearchParams(location.search).get('class');
    if (want) select.value = want;
  }).catch(() => { select.innerHTML = '<option value="">목록을 불러오지 못했어요</option>'; });
  matForm.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = matForm.querySelector('button');
    msg.className = 'form-msg'; msg.textContent = ''; out.innerHTML = '';
    if (!select.value) { msg.className = 'form-msg error'; msg.textContent = '수업을 먼저 골라 주세요.'; return; }
    btn.disabled = true;
    try {
      const r = await fetch('/api/materials', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ classId: select.value, password: matForm.password.value }) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || '확인하지 못했어요.');
      msg.className = 'form-msg ok'; msg.textContent = `${data.title} 자료입니다.`;
      out.innerHTML = `<ul class="file-list">${data.files.map(f => `<li><a href="${esc(f.url)}" target="_blank" rel="noopener"><span class="ic" aria-hidden="true">📄</span><span>${esc(f.name)}${f.note ? `<small>${esc(f.note)}</small>` : ''}</span></a></li>`).join('')}</ul>`;
    } catch (err) {
      msg.className = 'form-msg error'; msg.textContent = err.message;
    } finally { btn.disabled = false; }
  });
}

/* ---------- 강의 문의 폼 (구글 시트로 저장) ---------- */
const contactForm = document.getElementById('contact-form');
if (contactForm) {
  const msg = contactForm.querySelector('.form-msg');
  const topic = new URLSearchParams(location.search).get('topic');
  if (topic && contactForm.topic) contactForm.topic.value = topic;
  contactForm.addEventListener('submit', async e => {
    e.preventDefault();
    if (!contactForm.reportValidity()) return;
    const btn = contactForm.querySelector('button[type="submit"]');
    const data = Object.fromEntries(new FormData(contactForm));
    btn.disabled = true; msg.className = 'form-msg'; msg.textContent = '보내는 중이에요…';
    try {
      const r = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const res = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(res.error || 'send failed');
      contactForm.reset();
      msg.className = 'form-msg ok'; msg.textContent = contactForm.dataset.success || '문의가 접수됐어요!';
    } catch {
      const body = Object.entries({ 기관: data.org, 담당자: data.name, 연락처: data.phone, 이메일: data.email, 교육대상: data.audience, 인원: data.size, 희망일정: data.date, 관심주제: data.topic, 내용: data.message }).map(([k, v]) => `${k}: ${v || ''}`).join('\n');
      msg.className = 'form-msg error';
      msg.innerHTML = `지금은 폼 전송이 어려워요. <a class="text-link" href="mailto:${EMAIL}?subject=${encodeURIComponent('강의 문의')}&body=${encodeURIComponent(body)}">작성한 내용으로 메일 보내기</a>`;
    } finally { btn.disabled = false; }
  });
}

/* ---------- 홈 히어로: 움직이는 캐릭터 (장면 데이터는 #hero-scenes) ---------- */
(() => {
  const stage = document.getElementById('hero-stage');
  if (!stage) return;
  let scenes = [];
  try { scenes = JSON.parse(document.getElementById('hero-scenes').textContent); } catch {}
  if (!scenes.length) return;
  const actor = document.getElementById('hero-actor');
  const say = document.getElementById('hero-say');
  const step = document.getElementById('hero-step');
  const bubble = document.getElementById('hero-bubble');
  const poses = actor.querySelectorAll('.hero-pose');
  const dots = stage.querySelectorAll('[data-go]');
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const HOLD = 3600;
  let cur = 0, timer = null, typeT = null;

  const type = text => {
    clearTimeout(typeT);
    if (reduce) { say.textContent = text; return; }
    say.textContent = '';
    let i = 0;
    const tick = () => { say.textContent = text.slice(0, ++i); if (i < text.length) typeT = setTimeout(tick, 55); };
    tick();
  };
  const show = n => {
    const s = scenes[n];
    poses.forEach(p => {
      if (p.dataset.scene === s.id) { p.classList.remove('off', 'on'); void p.offsetWidth; p.classList.add('on'); }
      else if (p.classList.contains('on')) { p.classList.remove('on'); p.classList.add('off'); }
    });
    actor.dataset.scene = s.id;
    step.textContent = s.step;
    bubble.classList.remove('swap'); void bubble.offsetWidth; bubble.classList.add('swap');
    type(s.text);
    dots.forEach(d => d.setAttribute('aria-pressed', String(Number(d.dataset.go) === n)));
    cur = n;
  };
  const play = () => { clearInterval(timer); timer = setInterval(() => show((cur + 1) % scenes.length), HOLD); };
  dots.forEach(d => d.addEventListener('click', () => { show(Number(d.dataset.go)); if (!reduce) play(); }));

  if (!reduce) {
    // 떠오르는 파스텔 픽셀 (네모 → 동그라미)
    const box = document.getElementById('hero-pixels');
    const cols = ['#FEC89A', '#FEC5BB', '#FCD5CE', '#D8E2DC', '#FEC89A'];
    for (let k = 0; k < 14; k++) {
      const e = document.createElement('i');
      e.className = 'hero-px';
      e.style.left = (8 + Math.random() * 84) + '%';
      e.style.background = cols[k % cols.length];
      const sz = 8 + Math.random() * 10;
      e.style.width = e.style.height = sz + 'px';
      e.style.setProperty('--t', (5 + Math.random() * 5) + 's');
      e.style.setProperty('--dl', (-Math.random() * 8) + 's');
      box.appendChild(e);
    }
    // 마우스를 따라 소품이 살짝 움직임
    const props = stage.querySelectorAll('.hero-prop');
    stage.addEventListener('pointermove', ev => {
      const r = stage.getBoundingClientRect();
      const x = (ev.clientX - r.left) / r.width - .5, y = (ev.clientY - r.top) / r.height - .5;
      props.forEach((p, i) => { const f = i % 2 ? 14 : 22; p.style.transform = `translate(${-x * f}px,${-y * f}px)`; });
    });
    show(0);
    play();
  }
})();
