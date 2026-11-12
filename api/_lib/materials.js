// 수업자료 목록 — 이 파일은 서버에서만 읽히고 방문자에게는 보이지 않습니다.
//
// 수업 추가 방법
//   1) 터미널에서 비밀번호 해시 만들기:  node tools/hash-password.js 원하는비밀번호
//   2) 아래 형식으로 한 덩어리를 복사해 추가하고 id·title·passwordHash·files를 바꿉니다.
//   3) 자료 파일은 구글 드라이브에 올리고 "링크가 있는 모든 사용자" 보기로 공유한 뒤 링크를 url에 넣습니다.
//      (링크를 아는 사람은 비밀번호 없이도 열 수 있으니, 아주 민감한 자료는 올리지 마세요.)
//
// 비밀번호를 그대로 적지 않고 해시(암호화된 값)만 적어 두기 때문에, 이 파일이 보여도 비밀번호는 알 수 없습니다.

module.exports = [
  {
    id: 'sample',
    title: '샘플 수업 (테스트용 · 비밀번호 digilog)',
    passwordHash: 'dce66c5e881ca486512f2363a115cddb92ed81a7f31f1c8c8c61a0e3f3ce9cd7',
    files: [
      { name: '챗GPT 프롬프트 작성틀', url: 'https://blog.naver.com/heeseon_ai/224309998133', note: '블로그 글 — 실제 수업 자료로 바꿔 주세요' },
      { name: '바이브코딩 배포 방법 비교', url: 'https://blog.naver.com/heeseon_ai/224427245356', note: 'Vercel 바로 배포 vs GitHub 연동' },
    ],
  },
  // {
  //   id: 'gyeongnam-2026-3',
  //   title: '경남대 소상공인 디지털 특성화대학 3학기',
  //   passwordHash: '여기에 해시',
  //   files: [
  //     { name: '1주차 실습 자료', url: 'https://drive.google.com/...', note: 'PDF' },
  //   ],
  // },
];
