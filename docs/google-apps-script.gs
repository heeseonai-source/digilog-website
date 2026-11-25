/**
 * 디지로그쌤 홈페이지 → 구글 시트 저장용 앱스 스크립트
 *  - 강의 문의  → '문의' 탭
 *  - 수강생 후기 → '후기' 탭 (홈페이지에 바로 보임. 내리려면 '숨기기' 칸에 아무 글자나 적기)
 *  - 수업 진도   → '진도' 탭 (수업 페이지 맨 위 진도 바. 수업마다 한 줄, 강사가 수업 페이지에서 바꿈)
 *  - Q&A 질문   → '질문' 탭 (답변 칸에 적으면 홈페이지에 답변이 달림. 블라인드 칸에 적으면 가려짐)
 * 사용법은 docs/구글시트-연결방법.md 를 보세요.
 */
const SECRET = ''; // 비워 두면 확인 안 함. 쓰려면 Vercel 환경변수 SHEET_SECRET 과 똑같이 맞춥니다 (2026-11-12 실제 배포본은 비워 둠)
const NOTIFY_EMAIL = '';        // 새 문의가 오면 알림받을 메일 주소 (비워 두면 알림 없음)

const out = (obj) => ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
const clean = (v) => String(v || '').replace(/^[=+\-@]/, "'$&"); // 수식 주입 방지

function reviewSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('후기') || ss.insertSheet('후기');
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['작성일시', '수업', '닉네임', '내용', '숨기기']);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function progressSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('진도') || ss.insertSheet('진도');
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['수업 ID', '단계 번호(0부터)', '단계 이름', '바뀐 시각']);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// 수업 진도 읽기: ?action=progress&cls=<수업 id>  → { ok, step, at }  (step 이 비어 있으면 시작 전)
function getProgress(cls) {
  const sheet = progressSheet();
  const rows = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 4).getValues() : [];
  const row = rows.find(r => String(r[0]) === String(cls));
  if (!row || row[1] === '' || row[1] === null) return out({ ok: true, step: null, at: '' });
  return out({ ok: true, step: Number(row[1]), at: row[3] instanceof Date ? row[3].toISOString() : String(row[3]) });
}

// 수업 진도 바꾸기: { type:'progress', cls, step, label }  (수업마다 한 줄을 덮어씀)
function saveProgress(d) {
  const cls = String(d.cls || '').replace(/[^a-z0-9-]/gi, '').slice(0, 60);
  if (!cls) return out({ ok: false, error: 'cls' });
  const step = d.step === null || d.step === '' ? '' : Number(d.step);
  if (step !== '' && !(step >= 0 && step < 100)) return out({ ok: false, error: 'step' });
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = progressSheet();
    const ids = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues().map(r => String(r[0])) : [];
    const i = ids.indexOf(cls);
    const values = [[cls, step, clean(d.label).slice(0, 60), new Date()]];
    if (i >= 0) sheet.getRange(i + 2, 1, 1, 4).setValues(values); else sheet.appendRow(values[0]);
    return out({ ok: true });
  } finally {
    lock.releaseLock();
  }
}

/* ---------- Q&A 게시판 ('질문' 탭) ----------
 * 칸: ID · 작성일시 · 수업 · 닉네임 · 제목 · 내용 · 공개 · 비밀번호 · 답변 · 블라인드
 *  - 답변: 여기에 적으면 홈페이지 Q&A에 '답변 완료'로 함께 보임
 *  - 블라인드: 아무 글자나 적으면 홈페이지에서 '관리자가 가린 글'로 바뀜
 *  - 비밀번호 칸은 암호화된 값(해시)이라 원래 비밀번호는 알 수 없음
 */
function qnaSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('질문') || ss.insertSheet('질문');
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['ID', '작성일시', '수업', '닉네임', '제목', '내용', '공개', '비밀번호', '답변', '블라인드']);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function qnaRows() {
  const sheet = qnaSheet();
  return sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 10).getValues() : [];
}

function qnaItem(r, full) {
  const tz = Session.getScriptTimeZone();
  const s = (v) => String(v === null || v === undefined ? '' : v).replace(/^'/, '');
  const base = { id: s(r[0]), date: r[1] instanceof Date ? Utilities.formatDate(r[1], tz, 'yyyy.MM.dd') : s(r[1]) };
  if (s(r[9]).trim()) return Object.assign(base, { blind: true });
  const isPrivate = s(r[6]) === '비공개';
  const answer = s(r[8]).trim();
  if (isPrivate && !full) return Object.assign(base, { cls: s(r[2]), name: s(r[3]), private: true, answered: !!answer });
  return Object.assign(base, { cls: s(r[2]), name: s(r[3]), title: s(r[4]), content: s(r[5]), answer: answer, answered: !!answer, private: isPrivate });
}

function listQna() {
  const items = qnaRows().filter(r => r[0]).map(r => qnaItem(r, false)).reverse().slice(0, 300);
  return out({ ok: true, items: items });
}

function viewQna(id, hash) {
  const row = qnaRows().find(r => String(r[0]) === String(id));
  if (!row) return out({ ok: false, error: 'notfound' });
  if (String(row[9]).trim()) return out({ ok: false, error: 'blind' });
  if (String(row[6]) === '비공개' && String(row[7]) !== String(hash)) return out({ ok: false, error: 'password' });
  return out({ ok: true, item: qnaItem(row, true) });
}

function saveQna(d) {
  const id = String(d.id || '').replace(/[^a-f0-9]/g, '').slice(0, 16);
  const content = String(d.content || '').slice(0, 1000);
  if (!id || content.length < 5) return out({ ok: false, error: 'invalid' });
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = qnaSheet();
    // 같은 내용이 최근 30개 안에 있으면 중복으로 보고 저장하지 않음
    const last = sheet.getLastRow();
    if (last > 1) {
      const from = Math.max(2, last - 29);
      const recent = sheet.getRange(from, 6, last - from + 1, 1).getValues().map(r => String(r[0]).replace(/^'/, ''));
      if (recent.includes(content)) return out({ ok: false, error: 'duplicate' });
    }
    sheet.appendRow([id, new Date(), clean(d.cls).slice(0, 80), clean(d.name).slice(0, 12), clean(d.title).slice(0, 60), clean(content),
      d.private ? '비공개' : '공개', d.private ? String(d.hash || '').replace(/[^a-f0-9]/g, '') : '', '', '']);
    return out({ ok: true });
  } finally {
    lock.releaseLock();
  }
}

// 홈페이지가 목록을 가져갈 때: ?action=qna / ?action=qnaview&id=..&hash=.. / ?action=reviews(예전 후기) / ?action=progress
function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || '';
  if (action === 'progress') return getProgress(e.parameter.cls || '');
  if (action === 'qna') return listQna();
  if (action === 'qnaview') return viewQna(e.parameter.id || '', e.parameter.hash || '');
  if (action !== 'reviews') return out({ ok: true });
  const sheet = reviewSheet();
  const rows = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 5).getValues() : [];
  const tz = Session.getScriptTimeZone();
  const reviews = rows
    .filter(r => r[3] && !String(r[4]).trim())
    .map(r => ({
      date: r[0] instanceof Date ? Utilities.formatDate(r[0], tz, 'yyyy.MM.dd') : String(r[0]),
      cls: String(r[1]).replace(/^'/, ''), name: String(r[2]).replace(/^'/, ''), text: String(r[3]).replace(/^'/, ''),
    }))
    .reverse()
    .slice(0, 300);
  return out({ ok: true, reviews });
}

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    if (SECRET && d.secret !== SECRET) return out({ ok: false, error: 'secret' });

    if (d.type === 'review') return saveReview(d);
    if (d.type === 'progress') return saveProgress(d);
    if (d.type === 'qna') return saveQna(d);

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('문의') || SpreadsheetApp.getActiveSpreadsheet().insertSheet('문의');
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['접수일시', '기관', '담당자', '연락처', '이메일', '교육대상', '인원', '희망일정', '관심주제', '내용', '처리상태']);
      sheet.setFrozenRows(1);
    }
    sheet.appendRow([new Date(), d.org, d.name, d.phone, d.email, d.audience, d.size, d.date, d.topic, d.message, '신규'].map((v, i) => i === 0 ? v : clean(v)));

    if (NOTIFY_EMAIL) {
      MailApp.sendEmail(NOTIFY_EMAIL, `[홈페이지 강의 문의] ${d.org} · ${d.name}`,
        `기관: ${d.org}\n담당자: ${d.name}\n연락처: ${d.phone}\n이메일: ${d.email}\n대상: ${d.audience}\n인원: ${d.size}\n일정: ${d.date}\n주제: ${d.topic}\n\n${d.message}`);
    }
    return out({ ok: true });
  } catch (err) {
    return out({ ok: false, error: String(err) });
  }
}

function saveReview(d) {
  const text = String(d.text || '').slice(0, 150);
  if (text.length < 5) return out({ ok: false, error: 'short' });
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = reviewSheet();
    // 같은 내용이 최근 30개 안에 있으면 중복으로 보고 저장하지 않음
    const last = sheet.getLastRow();
    if (last > 1) {
      const from = Math.max(2, last - 29);
      const recent = sheet.getRange(from, 4, last - from + 1, 1).getValues().map(r => String(r[0]).replace(/^'/, ''));
      if (recent.includes(text)) return out({ ok: false, error: 'duplicate' });
    }
    sheet.appendRow([new Date(), clean(d.cls).slice(0, 80), clean(d.name).slice(0, 12), clean(text), '']);
    return out({ ok: true });
  } finally {
    lock.releaseLock();
  }
}
