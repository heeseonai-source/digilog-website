'use strict';
// 문의 채널은 index.html의 contact 영역에서 수정할 수 있습니다.
const lessons=[
  {n:'01',body:'가입하고 첫 질문을 던진 뒤 생활 메모를 정리합니다.'},
  {n:'02',body:'후속 질문으로 답변을 짧고 쉽게 다듬습니다.'},
  {n:'03',body:'ChatGPT·Gemini·Claude를 비교하고 무료·유료 기준을 정합니다.'},
  {n:'04',body:'역할·상대·내용·형식으로 안내문을 만듭니다.'},
  {n:'05',body:'중요한 정보를 확인하고 개인정보와 맞춤 지침을 점검합니다.'}
];
const tabs=[...document.querySelectorAll('[role="tab"]')];
function selectTab(tab){tabs.forEach(t=>{t.setAttribute('aria-selected',String(t===tab));t.tabIndex=t===tab?0:-1});const l=lessons[Number(tab.dataset.lesson)];const panel=document.getElementById('lesson');panel.setAttribute('aria-labelledby',tab.id);panel.querySelector('.lesson-no').textContent=l.n;panel.querySelector('p').textContent=l.body;}
tabs.forEach((tab,i)=>{tab.addEventListener('click',()=>selectTab(tab));tab.addEventListener('keydown',e=>{let next;if(e.key==='ArrowRight')next=(i+1)%tabs.length;else if(e.key==='ArrowLeft')next=(i+tabs.length-1)%tabs.length;else if(e.key==='Home')next=0;else if(e.key==='End')next=tabs.length-1;else return;e.preventDefault();selectTab(tabs[next]);tabs[next].focus()})});
const emailAddress='heeseon.ai@gmail.com';
const inquiry=`${emailAddress}\n\n기관/담당자명: \n교육 대상: \n희망 일정: \n예상 인원: \n관심 강의 주제: \n교육 장소/방식(대면·온라인): \n기대하는 결과: \n회신 가능한 연락처: `;
document.getElementById('email-inquiry').href=`mailto:${emailAddress}?subject=${encodeURIComponent('강의 문의')}&body=${encodeURIComponent(inquiry)}`;
async function copyForContact(value,successMessage){
  const status=document.getElementById('copy-status');
  try{await navigator.clipboard.writeText(value);status.textContent=successMessage}
  catch{
    const field=document.getElementById('copy-fallback');
    field.hidden=false;field.value=value;field.focus();field.select();
    try{if(document.execCommand('copy')){status.textContent=successMessage;field.hidden=true;return}}catch{}
    status.textContent='아래 내용을 선택했습니다. 복사해서 이메일에 붙여넣어 주세요.';
  }
}
document.getElementById('copy-email').addEventListener('click',()=>copyForContact(emailAddress,'메일 주소를 복사했습니다.'));
document.getElementById('copy-inquiry').addEventListener('click',()=>copyForContact(inquiry,'문의 양식을 복사했습니다. 이메일에 붙여넣고 내용을 채워주세요.'));
// 외부 음원 없이 재생하는 오리지널 앰비언트 BGM. 자동 재생하지 않습니다.
let audioContext,master,timer,isPlaying=false,nextTime=0,step=0;
const chords=[[261.63,329.63,392,493.88],[220,261.63,329.63,392],[174.61,220,261.63,329.63],[196,246.94,293.66,392]];
function note(freq,start,duration,volume){const osc=audioContext.createOscillator(),gain=audioContext.createGain();osc.type='sine';osc.frequency.value=freq;gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(volume,start+.06);gain.gain.exponentialRampToValueAtTime(.0001,start+duration);osc.connect(gain);gain.connect(master);osc.start(start);osc.stop(start+duration+.1)}
function schedule(){while(nextTime<audioContext.currentTime+.35){const c=chords[Math.floor(step/8)%4];note(c[step%4],nextTime,2.8,.1);if(step%8===0)note(c[0]/2,nextTime,5.6,.08);nextTime+=.65;step++}}
const music=document.getElementById('music');
music.addEventListener('click',async()=>{music.disabled=true;try{if(!audioContext){const Context=window.AudioContext||window.webkitAudioContext;if(!Context)throw new Error('unsupported');audioContext=new Context();master=audioContext.createGain();master.gain.value=.28;master.connect(audioContext.destination)}if(isPlaying){clearInterval(timer);await audioContext.suspend();isPlaying=false}else{await audioContext.resume();nextTime=audioContext.currentTime+.05;schedule();timer=setInterval(schedule,200);isPlaying=true}music.setAttribute('aria-pressed',String(isPlaying));music.setAttribute('aria-label',isPlaying?'배경음악 일시정지':'배경음악 재생');document.getElementById('music-label').textContent=isPlaying?'BGM ON':'BGM OFF'}catch{document.getElementById('music-label').textContent='BGM 사용 불가'}finally{music.disabled=false}});
