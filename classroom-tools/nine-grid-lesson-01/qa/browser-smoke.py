"""Exercise the actual offline UI through agent-browser connected to Chrome CDP."""
import argparse, json, subprocess
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--browser',required=True);args=p.parse_args()
app=Path(__file__).resolve().parents[1]
pack=json.loads((app/'public/content/class-content.json').read_text())
report=[]
def run(*cmd):
 r=subprocess.run([args.browser,*cmd],capture_output=True,text=True,check=True)
 return r.stdout

def ev(js):
 r=json.loads(run('eval',js,'--json'))
 assert r['success'],r
 return r['data']['result']

def click(selector):run('click',selector)
def snapshot():run('snapshot','-i')
def board(lessons, expected, side, starter='蓝'):
 d=ev('({cells:[...document.querySelectorAll("[role=gridcell]")].map(e=>({id:e.dataset.sourceItem,text:e.querySelector("span").textContent,word:e.classList.contains("board-cell--word"),claimed:e.classList.contains("claimed")})), heading:document.querySelector(".game-header .eyebrow").textContent})')
 assert len(d['cells'])==side**2
 assert ev('(()=>{const board=document.querySelector(".board").getBoundingClientRect();return [...document.querySelectorAll("[role=gridcell]")].every(e=>{const r=e.getBoundingClientRect();const t=e.querySelector("span").getBoundingClientRect();return r.bottom<=board.bottom && t.bottom<=r.bottom && t.top>=r.top;});})()'), 'Clipped board cell or word' 
 assert all(any(c['id'].startswith(f'boya-quasi-intermediate-i:lesson-{n:02}:') for n in lessons) for c in d['cells'])
 words=[c for c in d['cells'] if c['word']]
 assert len(words)==expected
 assert len({c['text'] for c in words})==expected
 assert ev('(()=>[...document.querySelectorAll(".board-cell--word span")].every(e=>{const r=e.getBoundingClientRect(),c=e.parentElement.getBoundingClientRect();return getComputedStyle(e).whiteSpace==="nowrap" && r.left>=c.left && r.right<=c.right && e.innerText.split("\\n").every(line=>(line.match(/\\p{Script=Han}/gu)||[]).length<=3);} ))()'), 'Word line too long or clipped'

 assert all(not c['claimed'] for c in d['cells'])
 assert f'轮到{starter}队' in ev('document.querySelector(".turn-indicator").textContent')
 functions={i for i,c in enumerate(d['cells']) if not c['word']}
 assert len(functions)>=(5 if lessons==[1] else 7)
 assert all(i+side not in functions and (i%side==side-1 or i+1 not in functions) for i in functions)
 known={x['item_id']:x for x in pack['vocabulary']}
 assert all(c['id'] in known and c['text']==known[c['id']]['word'] for c in words)
 report.append(dict(lessons=lessons,words=expected,functions=side**2-expected,side=side,heading=d['heading'],isolated=True))
 return {c['text'] for c in words}

run('set','viewport','1440','1000')
run('open',(app/'博雅准中级-全册词语连线.html').as_uri());snapshot()
run('set','offline','on')
run('reload');snapshot()
click('[data-action="setup"]');snapshot()
click('[data-action="start-game"]');snapshot()
board([1],31,6)
run('screenshot',str(app/'qa/l1-board.png'))
example_id=ev('document.querySelector(".board-cell--function").dataset.sourceItem')
click('.board-cell--function');snapshot()
assert not ev('Boolean(document.querySelector(".pug-companion--happy"))')
assert ev('document.querySelector(".task-prompt").textContent')==next(x['prompt'] for x in pack['exercises'] if x['item_id']==example_id)
assert ev('document.activeElement.textContent')=='返回棋盘'
run('press','Tab');assert ev('document.activeElement.textContent')=='未通过，换队'
run('press','Tab');assert ev('document.activeElement.textContent')=='蓝队完成并占格'
run('press','Tab');assert ev('document.activeElement.textContent')=='返回棋盘'
run('press','Escape');assert not ev('Boolean(document.querySelector(".task-modal"))')
click('.board-cell--function');snapshot();click('[data-action="complete-prompt"]');snapshot()
assert ev('Boolean(document.querySelector(".pug-companion--happy"))')
assert ev('getComputedStyle(document.querySelector(".claimed"),"::after").content')=='none'
assert ev('document.querySelectorAll(".claimed--blue").length')==1
assert '轮到红队' in ev('document.querySelector(".turn-indicator").textContent')
assert ev('document.querySelector(".claimed--blue").disabled')
run('screenshot',str(app/'qa/red-turn.png'))
click('[data-action="undo-turn"]');snapshot()
assert '轮到蓝队' in ev('document.querySelector(".turn-indicator").textContent')
assert ev('document.querySelectorAll(".claimed").length')==0
click('.board-cell--word:not(:disabled)');snapshot()
assert '轮到红队' in ev('document.querySelector(".turn-indicator").textContent')
click('.board-cell--word:not(:disabled)');snapshot()
assert ev('document.querySelectorAll(".claimed--red").length')==1
assert '轮到蓝队' in ev('document.querySelector(".turn-indicator").textContent')
click('[data-action="undo-turn"]');snapshot()
assert '轮到红队' in ev('document.querySelector(".turn-indicator").textContent')
click('[data-action="pass-turn"]');snapshot()
assert not ev('Boolean(document.querySelector(".pug-companion--happy"))')
assert '轮到蓝队' in ev('document.querySelector(".turn-indicator").textContent')
assert ev('document.querySelectorAll(".claimed").length')==1
click('[data-action="setup"]');snapshot()
run('check','input[value="boya-quasi-intermediate-i:lesson-02"]');snapshot()
assert ev('document.querySelector(".board-plan > strong").textContent')=='60'
click('[data-action="start-game"]');snapshot();board([1,2],60,9)
run('screenshot',str(app/'qa/l1-l2-board.png'))
click('[data-action="setup"]');snapshot();click('[data-action="all-lessons"]');snapshot()
run('screenshot',str(app/'qa/all-selected.png'))
click('[data-action="start-game"]');snapshot()
seen=set()
for i in range(5):
 words=board(list(range(1,13)),65 if i<4 else 64,9,'蓝' if i%2==0 else '红')
 assert not seen.intersection(words);seen.update(words)
 if i==0:run('screenshot',str(app/'qa/all-board.png'))
 # Complete a horizontal five-cell line using teacher controls.
 for j in range(5):
  click(f'[data-cell="{j}"]')
  if ev('Boolean(document.querySelector("[data-action=complete-prompt]"))'):click('[data-action="complete-prompt"]')
  if j<4:click('[data-action="pass-turn"]')
 snapshot();assert not ev('Boolean(document.querySelector("[data-action=confirm-win]"))')
 assert ev('document.querySelector("#victory-title").textContent')=='恭喜你赢了！'
 if i<2:
  if i==0:
   ev('window.__saveMode="success"; window.__originalPicker=window.showSaveFilePicker; window.showSaveFilePicker=async options=>{window.__saveOptions=options;if(window.__saveMode==="cancel")throw new DOMException("cancel","AbortError");return {createWritable:async()=>({write:async blob=>{if(window.__saveMode==="failure")throw new Error("write failed");window.__savedBytes=blob.size;window.__savedType=blob.type;},close:async()=>{window.__closed=true;}})}}')
  export_path=app/f'qa/result-{i}.png'
  run('download','[data-action="save-result"]',str(export_path))
  assert export_path.read_bytes().startswith(b'\x89PNG\r\n\x1a\n')
  assert ev('document.querySelector("#result-preview img").naturalWidth')==1600
  if i==0:
   click('[data-action="save-result-as"]');snapshot()
   assert ev('window.__saveOptions.startIn')=='downloads'
   assert ev('window.__saveOptions.suggestedName.endsWith(".png")')
   assert ev('window.__savedBytes')>1000
   assert ev('window.__savedType')=='image/png'
   assert ev('window.__closed')
   ev('window.__saveMode="failure"');click('[data-action="save-result-as"]');snapshot()
   assert '无法直接写入' in ev('document.querySelector("#export-status").textContent')
   ev('window.__saveMode="cancel"');click('[data-action="save-result-as"]');snapshot()
   assert '已取消' in ev('document.querySelector("#export-status").textContent')
   ev('window.showSaveFilePicker=window.__originalPicker')
 if i==0:run('screenshot',str(app/'qa/pug-victory.png'))
 run('press','Escape');snapshot()
 assert not ev('Boolean(document.querySelector(".victory-backdrop"))')
 if i<4:click('[data-action="next-round"]');snapshot()
assert len(seen)==324
click('[data-action="setup"]');snapshot();click('[data-action="clear-lessons"]');snapshot()
assert ev('document.querySelector("[data-action=start-game]").disabled')
assert ev('document.querySelectorAll("input[name=lesson]:checked").length')==0
# Use actual keyboard interaction to select L2 only.
run('focus','input[value="boya-quasi-intermediate-i:lesson-02"]');run('press','Space');snapshot()
click('[data-action="start-game"]');snapshot();board([2],29,6)
click('[data-action="setup"]');snapshot();click('[data-action="clear-lessons"]');snapshot()
run('check','input[value="boya-quasi-intermediate-i:lesson-01"]');snapshot()
run('set','viewport','390','844');run('screenshot',str(app/'qa/setup-mobile.png'))
assert ev('document.documentElement.scrollWidth<=window.innerWidth')
click('[data-action="start-game"]');snapshot();board([1],31,6)
assert ev('document.documentElement.scrollWidth<=window.innerWidth')
run('screenshot',str(app/'qa/board-mobile.png'))
click('[data-action="setup"]');snapshot();click('[data-action="clear-lessons"]');snapshot()
run('check','input[value="boya-quasi-intermediate-i:lesson-03"]');snapshot()
run('check','input[value="boya-quasi-intermediate-i:lesson-04"]');snapshot()
run('set','viewport','1440','1000')
click('[data-action="start-game"]');snapshot();board([3,4],49,8)
run('screenshot',str(app/'qa/eight-by-eight.png'))
for j in range(4):
 click(f'[data-cell="{j}"]')
 if ev('Boolean(document.querySelector("[data-action=complete-prompt]"))'):click('[data-action="complete-prompt"]')
 if j<3:
  assert not ev('Boolean(document.querySelector("[data-action=confirm-win]"))')
  click('[data-action="pass-turn"]')
assert ev('Boolean(document.querySelector(".victory-backdrop"))')
assert not ev('Boolean(document.querySelector("[data-action=confirm-win]"))')
click('[data-action="dismiss-celebration"]');snapshot()
assert not ev('Boolean(document.querySelector(".victory-backdrop"))')
click('[data-action="undo-turn"]');snapshot()
assert not ev('Boolean(document.querySelector(".result-banner"))')
assert ev('document.querySelectorAll(".claimed").length')==3
click('[data-cell="3"]')
if ev('Boolean(document.querySelector("[data-action=complete-prompt]"))'):click('[data-action="complete-prompt"]')
assert ev('Boolean(document.querySelector(".victory-backdrop"))')
errors=run('errors');assert not errors.strip(),errors
(app/'qa/browser-results.json').write_text(json.dumps(dict(browser='Chrome via agent-browser',offline=True,cases=report,all_rounds_unique=324,keyboard=True,pptx_example_text=True,turn_alternation=True,undo_restores_turn=True,failed_turn_no_claim=True,teacher_claims=True,win_confirmation=True,mobile_board_scroll_only=True,long_words_three_per_line=True,page_errors=errors),ensure_ascii=False,indent=2)+'\n')
print(json.dumps(report,ensure_ascii=False));print('Offline UI smoke passed: selections, all five rounds, automatic wins and undo, blue/red PNG downloads, keyboard, mobile, no page errors.')
