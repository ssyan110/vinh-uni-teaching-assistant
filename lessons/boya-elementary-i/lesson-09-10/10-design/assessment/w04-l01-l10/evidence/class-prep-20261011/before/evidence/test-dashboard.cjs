const fs = require('fs'), vm = require('vm'), assert = require('assert');
const root = process.argv[2];
const html = fs.readFileSync(root+'/dashboard.html','utf8');
const tracks=JSON.parse(html.match(/<script id="track-data" type="application\/json">(.*?)<\/script>/s)[1]);
class Element {
 constructor(){this.children=[];this.events={};this.textContent='';this.currentTime=0;this.duration=1;this.ended=false;this.playCalls=0;this.pauseCalls=0;}
 addEventListener(event,fn){this.events[event]=fn;}
 appendChild(child){this.children.push(child);}
 emit(event){this.events[event]?.();}
 click(){this.emit('click');}
 load(){}
 pause(){this.pauseCalls++;this.emit('pause');}
 async play(){this.playCalls++;this.emit('play');}
}
const ids=['track-data','audio','countdown','replays','range','track','error','status','timing','prev','next','progress','elapsed','queue','play','pause','reset','timer'];
const els=Object.fromEntries(ids.map(id=>[id,new Element()]));els['track-data'].textContent=JSON.stringify(tracks);
let timerActive=false;
vm.runInNewContext(fs.readFileSync(root+'/dashboard.js','utf8'),{document:{getElementById:id=>els[id],createElement:()=>new Element()},setInterval:fn=>{timerActive=true;return 1},clearInterval:()=>{timerActive=false}});
assert.equal(els.queue.children.length,33);assert.equal(els.prev.disabled,true);assert.equal(els.next.disabled,false);assert.equal(els.audio.src,tracks[0].file);
els.play.click();els.audio.ended=true;els.audio.emit('ended');assert.match(els.replays.textContent,/完整播放 1 次/);
els.play.click();els.audio.currentTime=.6;els.audio.emit('seeking');els.audio.emit('ended');assert.match(els.replays.textContent,/完整播放 1 次/);
els.audio.ended=false;els.pause.click();assert.match(els.status.textContent,/已暂停/);assert.match(els.replays.textContent,/完整播放 1 次/);
els.timer.click();assert.equal(timerActive,true);let before=els.audio.playCalls;els.next.click();assert.equal(timerActive,false);assert.equal(els.audio.playCalls,before);assert.equal(els.audio.src,tracks[1].file);assert.match(els.replays.textContent,/完整播放 0 次/);
els.prev.click();assert.match(els.replays.textContent,/完整播放 1 次/);
els.queue.children[23].children[0].click();assert.match(els.track.textContent,/录音内已读两轮/);assert.match(els.replays.textContent,/计划播放 1 次/);
els.queue.children[32].children[0].click();assert.equal(els.next.disabled,true);assert.equal(els.audio.src,tracks[32].file);els.audio.emit('error');assert.match(els.error.textContent,/音频无法加载/);
els.reset.click();assert.match(els.replays.textContent,/完整播放 0 次/);
assert(!html.includes('answer_index'));assert(!html.includes('source_text'));assert(!html.includes('speech_units'));
console.log(JSON.stringify({status:'pass',tracks:33,checks:['initial_and_boundary_controls','play_complete_count','seek_does_not_count_full_play','pause','previous_next_preserve_counts','next_does_not_autoplay','timer_cancel_on_navigation','internal_repeat_one_play','load_error_message','reset_counts','no_answers_or_transcripts_in_dashboard_data'],browser_rendering:'not_run_browser_unavailable'}));
