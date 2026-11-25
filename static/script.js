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

/* ---------- 현장 갤러리 (프로젝트·이력 페이지) — 사진 목록은 관리자 화면에서 관리 ---------- */
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
// 수업 비밀번호를 이 브라우저에 기억 (개인정보 차단·시크릿 창이면 조용히 건너뜀)
const classPw = {
  key: id => 'digilog-class-pw:' + id,
  get(id) { try { return localStorage.getItem(this.key(id)) || ''; } catch { return ''; } },
  set(id, pw) { try { localStorage.setItem(this.key(id), pw); } catch {} },
  clear(id) { try { localStorage.removeItem(this.key(id)); } catch {} },
};
const fileListHtml = files => files && files.length ? `<ul class="file-list">${files.map(f => `<li><a href="${esc(f.url)}" target="_blank" rel="noopener"><span class="ic" aria-hidden="true">📄</span><span>${esc(f.name)}${f.note ? `<small>${esc(f.note)}</small>` : ''}</span></a></li>`).join('')}</ul>` : '';
// 본문 표시법: *강조*, 줄바꿈, 빈 줄로 문단 나눔, http 주소는 자동 링크
const classRich = s => String(s || '').split(/\n\s*\n/).map(p => `<p>${esc(p.trim())
  .replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
  .replace(/(https?:\/\/[^\s<]+)/g, '<a class="text-link" href="$1" target="_blank" rel="noopener">$1</a>')
  .replace(/\n/g, '<br>')}</p>`).join('');

const classRoot = document.getElementById('class-page');
if (classRoot) {
  const id = classRoot.dataset.class;
  const lock = document.getElementById('class-lock');
  const loading = document.getElementById('class-loading');
  const content = document.getElementById('class-content');
  const tools = document.getElementById('class-tools');
  const form = document.getElementById('class-form');
  const msg = form.querySelector('.form-msg');
  const showLock = text => {
    loading.hidden = true; content.hidden = true; tools.hidden = true; lock.hidden = false;
    msg.className = text ? 'form-msg error' : 'form-msg'; msg.textContent = text || '';
  };
  const open = async pw => {
    const r = await fetch('/api/materials', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ classId: id, password: pw }) });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw Object.assign(new Error(data.error || '확인하지 못했어요.'), { status: r.status });
    classPw.set(id, pw);
    const prompts = data.prompts || [];
    const pick = prompts.find(p => p.id === new URLSearchParams(location.search).get('p'));
    if (pick) { // 프롬프트 한 개만 보는 페이지
      showPrompt(pick, prompts);
    } else {
      const sections = (data.sections || []).map(s => `<article class="class-section">
        ${s.title ? `<h2>${esc(s.title)}</h2>` : ''}
        ${classRich(s.body)}
        ${fileListHtml(s.links)}
      </article>`).join('');
      content.innerHTML = (data.progress ? '<section class="progress-card" id="class-progress" hidden></section>' : '') + lectureHtml(data.lecture) + promptListHtml(prompts) + sections + (data.files && data.files.length ? `<article class="class-section"><h2>자료 내려받기</h2>${fileListHtml(data.files)}</article>` : '');
    }
    lock.hidden = true; loading.hidden = true; content.hidden = false; tools.hidden = false;
    if (!pick && data.progress) startProgress(data.progress);
  };

  // ---------- 오늘의 진도 (강사가 움직이면 수강생 화면도 따라 움직임) ----------
  let progTimer = null;
  const startProgress = steps => {
    const box = document.getElementById('class-progress');
    if (!box || progTimer) return;
    let cur = null, teacher = false, busy = false;
    const draw = (note = '') => {
      const n = steps.length;
      const pct = cur === null ? 0 : Math.round(((cur + 1) / n) * 100);
      box.innerHTML = `
        <div class="progress-head">
          <h2>오늘의 진도</h2>
          <span class="progress-now">${cur === null ? '아직 시작 전이에요' : `지금 <b>${esc(steps[cur].label)}</b> 진행 중`}</span>
          <span class="progress-pct" aria-hidden="true">${cur === null ? 0 : cur + 1} / ${n}</span>
        </div>
        <div class="progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="${n}" aria-valuenow="${cur === null ? 0 : cur + 1}" aria-label="수업 진도"><span style="width:${pct}%"></span></div>
        <ol class="progress-steps">${steps.map((s, i) => {
          const state = cur === null || i > cur ? 'todo' : i === cur ? 'now' : 'done';
          const inner = `<span class="ps-dot" aria-hidden="true">${state === 'done' ? '✓' : i + 1}</span><span class="ps-txt"><b>${esc(s.label)}</b>${s.sub ? `<small>${esc(s.sub)}</small>` : ''}</span>${state === 'now' ? '<em class="ps-here">지금 여기</em>' : ''}`;
          const tag = teacher ? `<button type="button" data-step="${i}">${inner}</button>` : s.p ? `<a href="?p=${encodeURIComponent(s.p)}">${inner}</a>` : `<div>${inner}</div>`;
          return `<li class="ps ${state}"${state === 'now' ? ' aria-current="step"' : ''}>${tag}</li>`;
        }).join('')}</ol>
        ${teacher ? `<div class="progress-teacher">
          <span>강사용</span>
          <button type="button" data-move="-1" ${cur === null ? 'disabled' : ''}>◀ 이전</button>
          <button type="button" data-move="1" class="primary" ${cur === n - 1 ? 'disabled' : ''}>다음 단계 ▶</button>
          <button type="button" data-reset ${cur === null ? 'disabled' : ''}>처음으로</button>
          <small>${esc(note || '단계를 누르면 바로 그 단계로 옮겨요. 수강생 화면은 15초 안에 따라와요.')}</small>
        </div>` : ''}`;
      box.hidden = false;
      const now = box.querySelector('.ps.now');
      if (now) { const ol = box.querySelector('.progress-steps'); ol.scrollLeft = now.offsetLeft - ol.clientWidth / 2 + now.clientWidth / 2; }
    };
    const pull = async () => {
      try {
        const r = await fetch(`/api/progress?cls=${encodeURIComponent(id)}&_=${Math.floor(Date.now() / 5000)}`);
        const d = await r.json();
        if (busy) return;
        const next = d.step === null || d.step === undefined ? null : Number(d.step);
        if (next !== cur || !box.innerHTML) { cur = next; draw(); }
      } catch { if (!box.innerHTML) draw(); }
    };
    const push = async step => {
      busy = true; draw('저장하는 중…');
      try {
        const r = await fetch('/api/admin?action=progress', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cls: id, step }) });
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error || '저장하지 못했어요.');
        cur = step; draw('저장했어요. 수강생 화면도 곧 바뀌어요.');
      } catch (err) { draw(err.message); }
      finally { busy = false; }
    };
    box.addEventListener('click', e => {
      if (!teacher) return;
      const b = e.target.closest('button'); if (!b || b.disabled) return;
      if (b.dataset.step !== undefined) push(Number(b.dataset.step));
      else if (b.dataset.move) push(cur === null ? 0 : Math.min(steps.length - 1, Math.max(0, cur + Number(b.dataset.move))));
      else if (b.dataset.reset !== undefined) push(null);
    });
    // 관리자(/admin)에 로그인한 기기면 강사용 버튼을 보여 줌
    fetch('/api/admin?action=status', { credentials: 'same-origin' }).then(r => r.json()).then(s => { if (s.authed) { teacher = true; draw(); } }).catch(() => {});
    pull();
    progTimer = setInterval(() => { if (!document.hidden) pull(); }, 15000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) pull(); });
  };
  // 맨 위 수업 강의안 카드: HTML 슬라이드는 새 창으로 바로 열고, PDF는 내려받기
  const lectureHtml = l => !l ? '' : `<section class="lecture-card${l.thumb ? ' has-thumb' : ''}">
    ${l.thumb ? `<a class="lecture-thumb" href="${esc(l.html)}" target="_blank" rel="noopener"><img src="${esc(l.thumb)}" alt="${esc(l.title)} 표지"><span class="lecture-play" aria-hidden="true">▶</span></a>` : ''}
    <div class="lecture-body">
      <span class="prompt-tag">수업 강의안${l.slides ? ` · 슬라이드 ${esc(l.slides)}장` : ''}</span>
      <h2>${esc(l.title)}</h2>
      ${l.note ? `<p>${esc(l.note)}</p>` : ''}
      <div class="lecture-actions">
        <a class="lecture-btn primary" href="${esc(l.html)}" target="_blank" rel="noopener">강의안 바로 보기</a>
        ${l.pdf ? `<a class="lecture-btn" href="${esc(l.pdf)}" download="${esc(l.pdfName || '')}">PDF 내려받기${l.pdfSize ? ` <small>${esc(l.pdfSize)}</small>` : ''}</a>` : ''}
      </div>
    </div>
  </section>`;
  // 프롬프트 제목 버튼 목록 (같은 group 끼리 묶음)
  const promptListHtml = prompts => {
    if (!prompts.length) return '';
    const groups = [];
    for (const p of prompts) {
      const last = groups[groups.length - 1];
      if (last && last.name === (p.group || '')) last.items.push(p); else groups.push({ name: p.group || '', items: [p] });
    }
    return groups.map(g => `<section class="prompt-group">
      ${g.name ? `<h2 class="prompt-group-title">${esc(g.name)}</h2>` : ''}
      <div class="prompt-buttons">${g.items.map(p => `<a class="prompt-btn${p.thumb ? ' has-thumb' : ''}" href="?p=${encodeURIComponent(p.id)}">
        ${p.thumb ? `<span class="prompt-thumb"><img src="${esc(p.thumb)}" alt="${esc(p.title)} 결과물 예시" loading="lazy" decoding="async"></span>` : ''}
        ${p.tag ? `<span class="prompt-tag">${esc(p.tag)}</span>` : ''}
        <strong>${esc(p.title)}</strong>
        ${p.guide ? `<small>${esc(p.guide)}</small>` : ''}
        <span class="prompt-go" aria-hidden="true">${p.kind === 'guide' ? '안내 보기' : '프롬프트 보기'} →</span>
      </a>`).join('')}</div>
    </section>`).join('');
  };
  const copyText = async text => {
    try { await navigator.clipboard.writeText(text); return true; } catch {}
    const ta = document.createElement('textarea'); // 예전 브라우저용
    ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch {}
    ta.remove(); return ok;
  };
  const showPrompt = (p, all) => {
    document.title = `${p.title} | 프롬프트`;
    document.body.classList.add('prompt-mode'); // 수업 제목 띠를 숨기고 프롬프트만 보이게
    const i = all.indexOf(p), next = all[i + 1];
    if (p.kind === 'guide') { // 안내 페이지 (강사가 쓴 HTML, 서버에서 비밀번호 확인 뒤에만 내려옴)
      content.innerHTML = `<article class="prompt-page guide-page">
        <a class="class-back" href="${location.pathname}">← 프롬프트 목록</a>
        <h2 class="guide-title">${esc(p.title)}</h2>
        ${p.html || ''}
        ${next ? `<a class="prompt-next" href="?p=${encodeURIComponent(next.id)}">다음: ${esc(next.title)} →</a>` : ''}
      </article>`;
      content.querySelectorAll('[data-copy-target]').forEach(btn => btn.addEventListener('click', async () => {
        const src = document.getElementById(btn.dataset.copyTarget);
        const ok = await copyText(src ? src.textContent : '');
        const label = btn.textContent;
        btn.textContent = ok ? '✅ 복사됐어요!' : '길게 눌러 복사해 주세요'; btn.classList.toggle('done', ok);
        setTimeout(() => { btn.textContent = label; btn.classList.remove('done'); }, 2500);
      }));
      return;
    }
    content.innerHTML = `<article class="prompt-page">
      <a class="class-back" href="${location.pathname}">← 프롬프트 목록</a>
      <div class="prompt-head">
        <h2>${esc(p.title)}</h2>
        <button type="button" class="prompt-copy" data-copy>📋 프롬프트 복사하기</button>
      </div>
      ${p.image ? `<div class="prompt-split${p.imageWide ? ' wide' : ''}">
        <figure class="prompt-figure">
          <a href="${esc(p.image)}" target="_blank" rel="noopener"><img src="${esc(p.image)}" alt="${esc(p.title)} 결과물 예시"></a>
          <figcaption>결과물 예시 · 누르면 크게 보여요</figcaption>
        </figure>
        <div class="prompt-main">` : ''}
      <pre class="prompt-text" id="prompt-text">${esc(p.text)}</pre>
      <button type="button" class="prompt-copy wide" data-copy>📋 프롬프트 복사하기</button>
      ${p.image ? '</div></div>' : ''}
      ${p.after ? `<div class="prompt-after"><h3>${esc(p.after.title)}</h3><ol>${(p.after.steps || []).map(s => `<li>${esc(s)}</li>`).join('')}</ol></div>` : ''}
      ${next ? `<a class="prompt-next" href="?p=${encodeURIComponent(next.id)}">다음 프롬프트: ${esc(next.title)} →</a>` : ''}
    </article>`;
    content.querySelectorAll('[data-copy]').forEach(btn => btn.addEventListener('click', async () => {
      const ok = await copyText(p.text);
      content.querySelectorAll('[data-copy]').forEach(b => { b.textContent = ok ? '✅ 복사됐어요! 붙여넣기 하세요' : '복사가 안 됐어요. 글을 길게 눌러 복사해 주세요'; b.classList.toggle('done', ok); });
      setTimeout(() => content.querySelectorAll('[data-copy]').forEach(b => { b.textContent = '📋 프롬프트 복사하기'; b.classList.remove('done'); }), 2500);
    }));
  };
  const saved = classPw.get(id);
  if (saved) {
    open(saved).catch(err => {
      if (err.status === 401) { classPw.clear(id); showLock('비밀번호가 바뀌었어요. 다시 입력해 주세요.'); }
      else showLock(err.message);
    });
  } else showLock('');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const pw = form.password.value.trim();
    if (!pw) { msg.className = 'form-msg error'; msg.textContent = '비밀번호를 입력해 주세요.'; return; }
    const btn = form.querySelector('button');
    btn.disabled = true; msg.className = 'form-msg'; msg.textContent = '';
    try { await open(pw); form.reset(); }
    catch (err) { msg.className = 'form-msg error'; msg.textContent = err.message; }
    finally { btn.disabled = false; }
  });
  document.getElementById('class-forget').addEventListener('click', () => {
    classPw.clear(id); content.innerHTML = ''; showLock('');
  });
}

const matForm = document.getElementById('materials-form');
if (matForm) {
  const select = matForm.querySelector('select');
  const msg = matForm.querySelector('.form-msg');
  const out = document.getElementById('materials-result');
  fetch('/api/materials').then(r => r.json()).then(({ classes }) => {
    select.innerHTML = classes.length
      ? '<option value="">수업을 골라 주세요</option>' + classes.map(c => `<option value="${esc(c.id)}">${esc(c.title)}</option>`).join('')
      : '<option value="">아직 열린 수업 자료가 없어요</option>';
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
      if (data.page) { // 전용 페이지가 있는 수업 → 비밀번호 기억하고 그 페이지로 이동
        classPw.set(data.id, matForm.password.value.trim());
        location.href = '/materials/' + encodeURIComponent(data.id);
        return;
      }
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

/* ---------- Q&A 게시판 (/api/qna) ---------- */
(() => {
  const list = document.getElementById('qna-list');
  if (!list) return;
  const status = document.getElementById('qna-status');
  const empty = document.getElementById('qna-empty');
  const countEl = document.getElementById('qna-count');
  const filterBtns = document.querySelectorAll('.review-filter [data-cls]');
  const PAGE = 10;
  const opened = new Map(); // 이번 방문에서 비밀번호로 연(또는 직접 올린) 비공개 글
  let all = [], cls = '', shown = PAGE;

  const el = (tag, className, text) => { const e = document.createElement(tag); if (className) e.className = className; if (text != null) e.textContent = text; return e; };
  const para = text => el('p', 'qna-text', text);

  // 펼친 내용: 질문 + 답변 (비공개 글이면 비밀번호 칸)
  function bodyOf(item) {
    const box = el('div', 'qna-body');
    const full = item.private ? opened.get(item.id) : item;
    if (!full) {
      const f = el('form', 'qna-unlock');
      const id = 'pw-' + item.id;
      const label = el('label', '', '🔒 비공개 질문이에요. 질문할 때 정한 비밀번호를 입력해 주세요.');
      label.htmlFor = id;
      const rowEl = el('div', 'qna-unlock-row');
      const input = el('input');
      Object.assign(input, { id, type: 'password', autocomplete: 'current-password', maxLength: 20, required: true });
      const btn = el('button', '', '열기');
      btn.type = 'submit';
      rowEl.append(input, btn);
      const msg = el('p', 'form-msg');
      msg.setAttribute('role', 'status');
      f.append(label, rowEl, msg);
      f.addEventListener('submit', async e => {
        e.preventDefault();
        btn.disabled = true; msg.className = 'form-msg'; msg.textContent = '확인하는 중이에요…';
        try {
          const r = await fetch('/api/qna', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'view', id: item.id, password: input.value }) });
          const out = await r.json().catch(() => ({}));
          if (!r.ok || !out.item) throw new Error(out.error || '열지 못했어요. 잠시 후 다시 시도해 주세요.');
          opened.set(item.id, out.item);
          const li = f.closest('.qna-item');
          const fresh = row(item, true);
          li.replaceWith(fresh);
          fresh.querySelector('.qna-head')?.focus();
        } catch (err) { msg.classList.add('error'); msg.textContent = err.message; btn.disabled = false; }
      });
      box.append(f);
      return box;
    }
    box.append(para(full.content));
    const ans = el('div', 'qna-answer' + (full.answer ? '' : ' waiting'));
    if (full.answer) ans.append(el('b', 'qna-answer-who', '디지로그쌤 답변'), para(full.answer));
    else ans.append(el('span', '', '답변을 준비하고 있어요. 조금만 기다려 주세요!'));
    box.append(ans);
    return box;
  }

  function row(item, open) {
    const li = el('li', 'qna-item' + (item.blind ? ' blind' : ''));
    li.dataset.id = item.id;
    if (item.blind) { li.append(el('div', 'qna-head', '관리자가 가린 글이에요.')); return li; }
    const full = item.private ? opened.get(item.id) : item;
    const head = el('button', 'qna-head');
    head.type = 'button';
    head.setAttribute('aria-expanded', String(!!open));
    const badge = el('span', 'qna-badge' + (item.answered ? ' done' : ''), item.answered ? '답변 완료' : '답변 대기');
    const title = el('span', 'qna-title', full ? full.title : '비공개 질문이에요');
    if (item.private) title.prepend(el('span', 'qna-lock', '🔒 '));
    const meta = el('span', 'qna-meta', [item.cls, item.name || '수강생', item.date].filter(Boolean).join(' · '));
    const caret = el('span', 'qna-caret');
    caret.setAttribute('aria-hidden', 'true');
    head.append(badge, title, meta, caret);
    const body = bodyOf(item);
    body.hidden = !open;
    li.append(head, body);
    head.addEventListener('click', () => {
      const now = head.getAttribute('aria-expanded') !== 'true';
      head.setAttribute('aria-expanded', String(now));
      body.hidden = !now;
      if (now) body.querySelector('input')?.focus();
    });
    return li;
  }

  function render() {
    filterBtns.forEach(b => { b.hidden = !!b.dataset.cls && !all.some(r => r.cls === b.dataset.cls); });
    const items = cls ? all.filter(r => r.cls === cls) : all;
    list.replaceChildren(...items.slice(0, shown).map(i => row(i, false)));
    empty.hidden = items.length > 0;
    countEl.textContent = all.length ? `${all.length}개` : '';
    document.getElementById('qna-more')?.remove();
    if (items.length > shown) {
      const more = el('button', 'memo-more', `질문 더 보기 (${items.length - shown}개)`);
      more.type = 'button'; more.id = 'qna-more';
      more.addEventListener('click', () => { shown += PAGE; render(); });
      list.after(more);
    }
  }
  filterBtns.forEach(btn => btn.addEventListener('click', () => {
    cls = btn.dataset.cls; shown = PAGE;
    filterBtns.forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
    render();
  }));

  fetch('/api/qna').then(r => r.json()).then(d => { all = d.items || []; status.remove(); render(); })
    .catch(() => { status.textContent = '질문을 불러오지 못했어요. 잠시 후 새로고침해 주세요.'; });

  /* ---------- 질문 쓰기 ---------- */
  const form = document.getElementById('qna-form');
  if (!form) return;
  const formOpened = Date.now();
  const write = document.getElementById('qna-write');
  const picker = form.querySelector('#class-picker');
  const picked = form.querySelector('#class-picked');
  form.querySelectorAll('input[name="cls"]').forEach(r => r.addEventListener('change', () => {
    picked.textContent = r.value; picker.classList.add('chosen'); picker.open = false;
    picker.querySelector('summary').focus();
  }));
  const text = form.querySelector('#qa-content');
  const count = form.querySelector('#qa-count');
  text.addEventListener('input', () => { count.textContent = text.value.length; });
  const priv = form.querySelector('#qa-private');
  const pwField = form.querySelector('#qa-pw-field');
  priv.addEventListener('change', () => { pwField.hidden = !priv.checked; if (priv.checked) pwField.querySelector('input').focus(); });
  const msg = form.querySelector('.form-msg');
  const bad = (m, focusEl) => { msg.className = 'form-msg error'; msg.textContent = m; focusEl?.focus(); };

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(form);
    const data = {
      action: 'ask', cls: fd.get('cls') || '', title: String(fd.get('title') || '').trim(), content: String(fd.get('content') || '').trim(),
      name: String(fd.get('name') || '').trim(), private: priv.checked, password: String(fd.get('password') || ''), website: fd.get('website') || '', t: formOpened,
    };
    if (!data.cls) { picker.open = true; return bad('들으신 수업을 골라 주세요.', picker.querySelector('summary')); }
    if (data.title.length < 2) return bad('제목을 2자 이상 적어 주세요.', form.querySelector('#qa-title'));
    if (data.content.length < 5) return bad('질문 내용을 5자 이상 적어 주세요.', text);
    if (data.private && data.password.trim().length < 4) return bad('비밀번호를 4자 이상 정해 주세요.', form.querySelector('#qa-pw'));
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true; msg.className = 'form-msg'; msg.textContent = '질문을 올리는 중이에요…';
    try {
      const r = await fetch('/api/qna', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const out = await r.json().catch(() => ({}));
      if (!r.ok || !out.ok) throw new Error(out.error && !/^(sheet failed|not configured|bad request)$/.test(out.error) ? out.error : '올리지 못했어요. 잠시 후 다시 시도해 주세요.');
      const item = out.item;
      if (item.private) opened.set(item.id, item); // 방금 올린 비공개 글은 이번 방문 동안 바로 볼 수 있게
      all.unshift(item);
      cls = ''; shown = PAGE;
      filterBtns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.cls === '')));
      render();
      const first = row(item, true);
      first.classList.add('new');
      list.firstElementChild?.replaceWith(first);
      msg.className = 'form-msg ok'; msg.textContent = form.dataset.success;
      ['#qa-title', '#qa-content', '#qa-pw'].forEach(s => { form.querySelector(s).value = ''; });
      count.textContent = '0';
      setTimeout(() => {
        write.open = false; msg.textContent = '';
        list.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
      }, 1500);
    } catch (err) {
      bad(err.message);
    } finally { btn.disabled = false; }
  });
})();
