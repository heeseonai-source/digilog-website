// 수업자료 비밀번호 해시 만들기
// 사용법: node tools/hash-password.js 원하는비밀번호
const pw = process.argv.slice(2).join(' ').trim();
if (!pw) { console.log('사용법: node tools/hash-password.js 원하는비밀번호'); process.exit(1); }
console.log(require('crypto').createHash('sha256').update(pw).digest('hex'));
