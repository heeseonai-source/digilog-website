'use strict';
/* 디지로그쌤 홈페이지 공통 스크립트
   - 메뉴(헤더)와 푸터는 아래 NAV 목록 한 곳에서 관리합니다. 메뉴를 바꾸려면 여기만 고치세요. */
const NAV = [
  { href: '/', label: '홈', key: 'home' },
  { href: '/about', label: '소개', key: 'about' },
  { href: '/lectures', label: '강의', key: 'lectures' },
  { href: '/projects', label: '프로젝트·이력', key: 'projects' },
  { href: '/reviews', label: '강의후기', key: 'reviews' },
  { href: '/materials', label: '수업자료', key: 'materials' },
];
const EMAIL = 'heeseon.ai@gmail.com';
const BLOG = 'https://blog.naver.com/heeseon_ai';

document.documentElement.classList.remove('no-js');
const page = document.body.dataset.page || '';

/* ---------- 헤더·푸터 ---------- */
const header = document.querySelector('[data-include="header"]');
if (header) {
  const links = NAV.map(n => `<a href="${n.href}"${n.key === page ? ' aria-current="page"' : ''}>${n.label}</a>`).join('');
  header.innerHTML = `<div class="wrap">
    <a class="logo" href="/" aria-label="디지로그쌤 홈"><span class="logo-mark" aria-hidden="true">d</span><span>디지로그쌤<small>생성형 AI 강사 노희선</small></span></a>
    <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="site-nav">메뉴</button>
    <nav class="nav" id="site-nav" aria-label="주요 메뉴">${links}<a class="nav-cta" href="/contact"${page === 'contact' ? ' aria-current="page"' : ''}>강의 문의</a></nav>
  </div>`;
  const btn = header.querySelector('.menu-toggle');
  const nav = header.querySelector('.nav');
  btn.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
    btn.textContent = open ? '닫기' : '메뉴';
  });
}
const footer = document.querySelector('[data-include="footer"]');
if (footer) {
  footer.innerHTML = `<div class="wrap">
    <div><strong style="color:var(--ink)">디지로그쌤 노희선</strong> · Roh Heeseon<br><a href="mailto:${EMAIL}">${EMAIL}</a></div>
    <nav aria-label="하단 메뉴">${NAV.slice(1).map(n => `<a href="${n.href}">${n.label}</a>`).join('')}<a href="/contact">문의</a><a href="${BLOG}" target="_blank" rel="noopener">블로그</a></nav>
    <small>© ${new Date().getFullYear()} DIGILOG. All rights reserved.</small>
  </div>`;
}

/* ---------- 스크롤 등장 효과 ---------- */
const reveals = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12 });
  reveals.forEach(el => io.observe(el));
} else reveals.forEach(el => el.classList.add('in'));

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------- 블로그 최신글 (data-blog 속성이 있는 목록) ---------- */
document.querySelectorAll('[data-blog]').forEach(async list => {
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

/* ---------- 현장 갤러리 (강의후기 페이지) ----------
   사진 추가: assets/field 폴더에 사진을 넣고 아래 목록에 한 줄 추가하세요. */
const GALLERY = [
  { src: '/assets/field/gyeongnam-2-practice.jpg', title: '수강생 옆자리에서 함께 화면 보기', tag: '경남대 소상공인 2학기', link: 'https://blog.naver.com/heeseon_ai/224462463735' },
  { src: '/assets/field/massage-assoc-hall.jpg', title: '300명이 함께한 연수회 실습', tag: '대한안마사협회 연수회', link: 'https://blog.naver.com/heeseon_ai/224445910172' },
  { src: '/assets/field/my-ai-lab.jpg', title: '팀의 이야기를 듣는 멘토링', tag: '마이 AI랩', link: 'https://blog.naver.com/heeseon_ai/224446731555' },
  { src: '/assets/field/gyeongnam-3.jpg', title: '온라인 판로를 여는 3학기 수업', tag: '경남대 소상공인 3학기', link: 'https://blog.naver.com/heeseon_ai/224467800842' },
  { src: '/assets/field/miryang.jpg', title: '어르신 AI행정교실을 마치고', tag: '밀양 AI행정교실', link: 'https://blog.naver.com/heeseon_ai/224401164683' },
  { src: '/assets/field/gyeongnam-2.jpg', title: 'AI로 블로그 자동화 배우기', tag: '경남대 소상공인 2학기', link: 'https://blog.naver.com/heeseon_ai/224462463735' },
  { src: '/assets/field/my-ai-lab-hall.jpg', title: '대학생 팀 멘토링 현장', tag: '마이 AI랩', link: 'https://blog.naver.com/heeseon_ai/224446731555' },
  { src: '/assets/field/massage-assoc.png', title: '음성으로 대화하는 AI, 제미나이 라이브', tag: '대한안마사협회 연수회', link: 'https://blog.naver.com/heeseon_ai/224445910172' },
];
const galleryEl = document.getElementById('field-gallery');
if (galleryEl) {
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
  galleryEl.innerHTML = row(idx, false) + row(rowB, true) +
    '<button class="btn btn-ghost gallery-toggle" type="button" aria-pressed="false">⏸ 움직임 멈추기</button>';

  const section = galleryEl.closest('.gallery');
  const toggle = galleryEl.querySelector('.gallery-toggle');
  toggle.addEventListener('click', () => {
    const paused = section.classList.toggle('paused');
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.textContent = paused ? '▶ 다시 움직이기' : '⏸ 움직임 멈추기';
  });

  const lb = document.getElementById('lightbox');
  let cur = 0;
  const show = i => {
    cur = (i + GALLERY.length) % GALLERY.length;
    const g = GALLERY[cur];
    lb.querySelector('img').src = g.src;
    lb.querySelector('img').alt = g.title;
    lb.querySelector('#lb-title').textContent = g.title;
    lb.querySelector('#lb-tag').textContent = g.tag;
    lb.querySelector('#lb-link').href = g.link;
  };
  galleryEl.addEventListener('click', e => {
    const b = e.target.closest('.photo'); if (!b) return;
    show(Number(b.dataset.i));
    if (lb.showModal) lb.showModal(); else window.open(GALLERY[cur].link, '_blank');
  });
  lb.querySelector('.lb-close').addEventListener('click', () => lb.close());
  lb.querySelector('.prev').addEventListener('click', () => show(cur - 1));
  lb.querySelector('.next').addEventListener('click', () => show(cur + 1));
  lb.addEventListener('click', e => { if (e.target === lb) lb.close(); });
  lb.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') show(cur - 1); if (e.key === 'ArrowRight') show(cur + 1); });
}

/* ---------- 출강 이력 필터 ---------- */
const filter = document.querySelector('[data-filter]');
if (filter) {
  const items = document.querySelectorAll('.history li');
  filter.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    filter.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    const v = b.dataset.value;
    items.forEach(li => { li.hidden = v !== 'all' && !li.dataset.type.split(' ').includes(v); });
  });
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
      msg.className = 'form-msg ok'; msg.textContent = '문의가 접수됐어요! 영업일 기준 1~2일 안에 회신드릴게요.';
    } catch {
      const body = Object.entries({ 기관: data.org, 담당자: data.name, 연락처: data.phone, 이메일: data.email, 교육대상: data.audience, 인원: data.size, 희망일정: data.date, 관심주제: data.topic, 내용: data.message }).map(([k, v]) => `${k}: ${v || ''}`).join('\n');
      msg.className = 'form-msg error';
      msg.innerHTML = `지금은 폼 전송이 어려워요. <a class="text-link" href="mailto:${EMAIL}?subject=${encodeURIComponent('강의 문의')}&body=${encodeURIComponent(body)}">작성한 내용으로 메일 보내기</a>`;
    } finally { btn.disabled = false; }
  });
}
