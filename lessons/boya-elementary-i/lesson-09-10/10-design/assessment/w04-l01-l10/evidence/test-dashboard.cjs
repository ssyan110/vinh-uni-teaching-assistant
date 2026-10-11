const fs = require('fs'), vm = require('vm'), assert = require('assert');
const root = process.argv[2];
const html = fs.readFileSync(root+'/dashboard.html','utf8');
const tracks = JSON.parse(html.match(/<script id="track-data" type="application\/json">(.*?)<\/script>/s)[1]);
class Element {
 constructor(){this.children=[];this.events={};this.textContent='';this.currentTime=0;this.duration=1;this.ended=false;this.playCalls=0;this.pauseCalls=0;this.loadCalls=0;this.scrollCalls=0;}
 addEventListener(event,fn){this.events[event]=fn;}
 appendChild(child){this.children.push(child);}
 emit(event){this.events[event]?.();}
 click(){this.emit('click');}
 load(){this.loadCalls++;this.error=null;}
 scrollIntoView(){this.scrollCalls++;}
 pause(){this.pauseCalls++;this.emit('pause');}
 async play(){this.playCalls++;this.emit('play');}
}
const ids=['track-data','audio','countdown','replays','range','track','error','status','timing','prev','next','progress','elapsed','queue','play','pause','reset','timer','between-timer','answer-timer','storage-status','player-panel'];
const storage = new Map();
const storageKey = 'W04-L01L10-playback:' + root + '/dashboard.html';
let allowConfirm=true, confirms=0, timerActive=false;
function boot(){
 const els=Object.fromEntries(ids.map(id=>[id,new Element()]));els['track-data'].textContent=JSON.stringify(tracks);
 vm.runInNewContext(fs.readFileSync(root+'/dashboard.js','utf8'),{location:{pathname:root+'/dashboard.html'},document:{getElementById:id=>els[id],createElement:()=>new Element()},confirm:()=>{confirms++;return allowConfirm},localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,val)=>storage.set(key,val)},setInterval:()=>{timerActive=true;return 1},clearInterval:()=>{timerActive=false}});
 return els;
}
let els=boot();
assert.equal(els.queue.children.length,33);assert.equal(els.prev.disabled,true);assert.equal(els.audio.src,tracks[0].file);
els.play.click();els.audio.ended=true;els.audio.emit('ended');assert.match(els.replays.textContent,/完整播放 1 次/);
els.play.click();els.audio.currentTime=.6;els.audio.emit('seeking');els.audio.emit('ended');assert.match(els.replays.textContent,/完整播放 1 次/);
els.play.click();els.audio.currentTime=.6;els.audio.ended=false;els.pause.click();els.audio.emit('play');els.audio.ended=true;els.audio.emit('ended');assert.match(els.replays.textContent,/完整播放 2 次/);
els.timer.click();assert.equal(timerActive,true);els.pause.click();assert.equal(timerActive,false);
let before=els.audio.playCalls;els.next.click();assert.equal(els.audio.playCalls,before);assert.equal(els.audio.src,tracks[1].file);assert.equal(els['player-panel'].scrollCalls,1);
allowConfirm=false;els.next.click();assert.equal(els.audio.src,tracks[1].file);assert(confirms>0);
allowConfirm=true;els['answer-timer'].click();assert.match(els.countdown.textContent,/最后作答剩余/);els['between-timer'].click();assert.match(els.countdown.textContent,/两遍间作答剩余/);
els.prev.click();assert.match(els.replays.textContent,/完整播放 2 次/);
els.queue.children[23].children[0].click();assert.match(els.track.textContent,/第三音节不设题/);assert.equal(els['between-timer'].disabled,true);
els=boot();assert.equal(els.audio.src,tracks[23].file);assert.match(els['storage-status'].textContent,/已恢复/);assert.equal(els.audio.playCalls,0);
els.audio.error={code:4};els.audio.emit('error');assert(els.error.textContent.includes(tracks[23].file));let loads=els.audio.loadCalls;els.play.click();assert.equal(els.audio.loadCalls,loads+1);
els.queue.children[32].children[0].click();assert.equal(els.next.disabled,true);
els.play.click();els.audio.ended=true;els.audio.emit('ended');els.play.click();els.audio.emit('ended');assert.match(els.status.textContent,/检查姓名、学号与答案/);
allowConfirm=false;els.reset.click();assert.match(els.replays.textContent,/完整播放 2 次/);allowConfirm=true;els.reset.click();assert.equal(els.audio.src,tracks[0].file);assert.match(els.replays.textContent,/完整播放 0 次/);
storage.set(storageKey,'broken JSON');els=boot();assert.equal(els.audio.src,tracks[0].file);
storage.set(storageKey,JSON.stringify({version:JSON.stringify(tracks),current:999,completed:Array(33).fill(0)}));els=boot();assert.equal(els.audio.src,tracks[0].file);
assert(!html.includes('answer_index'));assert(!html.includes('source_text'));assert(!html.includes('speech_units'));
console.log(JSON.stringify({status:'pass',tracks:33,checks:['complete_vs_seek_count','pause_resume_counts_once','pause_stops_timer','navigation_confirmation','navigation_scrolls_controls','stage_timers','restore_current_and_counts_no_autoplay','retry_failed_source','final_submission_prompt','reset_confirmation','malformed_progress_rejected','no_answers_or_transcripts']}));
