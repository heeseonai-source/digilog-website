/**
 * 디지로그쌤 홈페이지 강의 문의 → 구글 시트 저장용 앱스 스크립트
 * 사용법은 docs/구글시트-연결방법.md 를 보세요.
 */
const SECRET = '여기에-비밀값'; // Vercel 환경변수 SHEET_SECRET 과 똑같이 맞춥니다
const NOTIFY_EMAIL = '';        // 새 문의가 오면 알림받을 메일 주소 (비워 두면 알림 없음)

function doPost(e) {
  const out = (obj) => ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
  try {
    const d = JSON.parse(e.postData.contents);
    if (SECRET && d.secret !== SECRET) return out({ ok: false, error: 'secret' });

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('문의') || SpreadsheetApp.getActiveSpreadsheet().insertSheet('문의');
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['접수일시', '기관', '담당자', '연락처', '이메일', '교육대상', '인원', '희망일정', '관심주제', '내용', '처리상태']);
      sheet.setFrozenRows(1);
    }
    const clean = (v) => String(v || '').replace(/^[=+\-@]/, "'$&"); // 수식 주입 방지
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
