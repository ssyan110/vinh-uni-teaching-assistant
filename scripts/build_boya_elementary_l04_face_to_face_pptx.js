#!/usr/bin/env node
// Lesson 4 classroom draft. Reuses the shared Boya visual primitives.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const PptxGenJS = require('pptxgenjs');
const master = require('./lesson_pptx_master_template');
const ROOT = path.resolve(__dirname, '..');
const KEY = 'boya-elementary-i:lesson-04';
const L = path.join(ROOT, 'lessons/boya-elementary-i/lesson-04');
const OUT = path.join(L, '10-design/pptx-draft/face-to-face-approved');
const STORY = path.join(L, '10-design/storyboard');
const CONTENT_REVIEW = path.join(STORY, 'lesson-04-逐页文案审阅.md');
const IMAGE_MANIFEST = path.join(L, '10-design/assets/image-manifest-approved-20260919.json');
const C = master.COLORS;
const source = JSON.parse(fs.readFileSync(path.join(L, '00-source/canonical-source.json')));
const images = JSON.parse(fs.readFileSync(IMAGE_MANIFEST));
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const writeJson = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');

function safe(file) {
  const resolved = path.resolve(file);
  if (!resolved.startsWith(L + path.sep)) throw new Error('Wrong lesson path');
  let check = resolved;
  while (check !== ROOT) {
    if (fs.existsSync(check) && fs.lstatSync(check).isSymbolicLink()) throw new Error('Symlink rejected: ' + check);
    check = path.dirname(check);
  }
  return resolved;
}

async function main() {
  execFileSync('python3', [path.join(ROOT, 'scripts/production_gate.py'), '--purpose','content-approval','--lesson-key',KEY,'--offering-id','2026-fall'], {stdio:'inherit'});
  if (source.lesson_key !== KEY || images.lesson_key !== KEY) throw new Error('Lesson identity mismatch');
  safe(OUT);
  if (images.authorization_status !== 'approved_content_image_batch' ||
      images.can_enter_ppt !== true || images.workers.length !== 2 ||
      images.workers.some(w => w.status !== 'success' || w.ai_visual_qa !== 'passed')) {
    throw new Error('Both image workers must pass; can_enter_ppt must be true');
  }
  const assets = {};
  for (const item of images.assets) {
    const file = safe(path.join(L, '10-design/assets', item.file));
    if (hash(file) !== item.sha256) throw new Error('Image hash mismatch: ' + item.file);
    assets[item.asset_id] = file;
  }
  for (const id of ['cover','route','words','sentences','listening','communication']) {
    if (!assets[id]) throw new Error('Missing asset: ' + id);
  }
  execFileSync('python3', [path.join(ROOT, 'scripts/production_gate.py'), '--purpose','pptx','--stage','draft','--lesson-key',KEY,'--output-dir',OUT], {stdio:'inherit'});
  fs.mkdirSync(OUT, {recursive:true});
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = '榮市大學華語課程';
  pptx.title = '第四课｜你叫什么名字｜实体课';
  pptx.subject = KEY;
  pptx.lang = 'zh-CN';
  pptx.theme = {headFontFace:master.CJK_FONT,bodyFontFace:master.CJK_FONT,lang:'zh-CN'};
  const slides = [];
  const tx = (s,t,x,y,w,h,o={}) => master.addText(s,t,x,y,w,h,{fontSize:23,fit:undefined,...o});
  const latin = (s,t,x,y,w,h,o={}) => master.addLatin(s,t,x,y,w,h,{fontSize:24,fit:undefined,...o});
  function picture(s,id,x,y,w,h) {
    const [iw,ih]=images.assets.find(a=>a.asset_id===id).dimensions;
    const scale=Math.min(w/iw,h/ih),dw=iw*scale,dh=ih*scale;
    s.addImage({path:assets[id],x:x+(w-dw)/2,y:y+(h-dh)/2,w:dw,h:dh});
  }
  function card(s,x,y,w,h,fill) {
    s.addShape('roundRect',{x,y,w,h,rectRadius:0.08,fill:{color:fill},line:{color:C.line,pt:0.7}});
  }
  function page(id,pages) {
    const sec = id ? source.sections[id] : null;
    const ps = pages || sec?.textbook_printed_pages || [];
    return ps.length ? '教材 P' + (ps.length===1 ? ps[0] : ps[0]+'–'+ps[ps.length-1]) : null;
  }
  function slide(title,layout,id=null,options={}) {
    const s = pptx.addSlide();
    s.background = {color:'FFFFFF'};
    const n=slides.length+1;
    if (layout!=='cover') {
      tx(s,'第四课｜你叫什么名字',0.72,0.20,9,0.40,{color:C.muted,bold:true});
      latin(s,String(n).padStart(2,'0'),11.95,0.20,0.66,0.40,{fontSize:23,color:C.muted,align:'right'});
      master.addLine(s,0.72,0.68,11.9,C.line,0.8);
      s.addShape('rect',{x:0.72,y:0.65,w:0.48,h:0.05,fill:{color:C.purple},line:{color:C.purple,transparency:100}});
    }
    const label=page(id,options.pages);
    if(label) {
      s.addText([{text:'教材 ',options:{fontFace:master.CJK_FONT}},{text:label.slice(3),options:{fontFace:master.LATIN_FONT}}],{
        x:9.5,y:6.94,w:3.1,h:0.38,fontSize:23,color:C.muted,margin:0,align:'right',lang:'zh-CN',objectName:'Textbook Page Marker '+label.slice(3)});
    }
    const notes=options.notes || source.sections[id]?.teacher_notes || '本页是课堂流程提示；不含教材作答内容。';
    s.addNotes(notes);
    slides.push({slide_number:n,title,layout,source_refs:id?['canonical-source.json#sections.'+id]:[],textbook_page:label,
      audio:id?source.sections[id].audio:null,speaker_notes:notes,student_visible_text:[]});
    return s;
  }
  function divider(title,asset) {
    const s=slide(title,'divider');
    tx(s,title,0.95,2.55,5.6,0.9,{fontSize:48,bold:true,color:C.purple});
    master.addLine(s,0.98,3.8,4.8,C.coral,2);
    picture(s,asset,6.85,1.25,5.4,5.4);
  }
  function exercise(id,asset) {
    const sec=source.sections[id];
    const title=sec.audio?'练习'+sec.audio:sec.title;
    const s=slide(title,'textbook-exercise',id);
    tx(s,title,1,2.6,6.1,1.5,{fontSize:title.length>12?34:48,bold:true,color:C.purple});
    master.addLine(s,1.03,4.38,4.7,C.coral,2);
    picture(s,asset,7.6,1.75,4.65,4.65);
  }

  let s=slide('你叫什么名字','cover',null,{notes:'本课教材P16–23。提前准备教材和姓名卡。音频4-1至4-10尚未在项目取得；授课前必须准备并实测可用录音。'});
  tx(s,'第4课',0.95,1.25,3,0.6,{fontSize:32,color:C.teal,bold:true});
  tx(s,'你叫什么名字',0.95,2.1,7,1.25,{fontSize:48,bold:true});
  card(s,0.95,3.85,2.35,0.65,C.coral);
  tx(s,'实体课',1.12,3.95,2,0.42,{fontSize:25,color:C.white,bold:true,align:'center'});
  picture(s,'cover',7.9,1.25,4.85,4.85);

  s=slide('今天这样学','route',null,{notes:'沿用前三课四步横向版式。词语准备、句子听说、语段理解、姓名交流。四个越南文流程标签为本册既有流程图例外；其余课堂内容采用简体中文。'});
  tx(s,'今天这样学',0.78,0.93,11.7,0.6,{fontSize:34,bold:true});
  picture(s,'route',0.78,0.70,11.78,6.63);
  const labels=['Ôn từ vựng','Luyện nghe\nvà nói câu','Nghe hội thoại','Hỏi tên\nvà giới thiệu'];
  labels.forEach((label,i)=>{
    const x=0.84+i*2.94;
    latin(s,label,x+0.08,5.42,2.66,0.76,{fontSize:25,bold:true,align:'center',color:C.ink,lang:'vi-VN'});
  });

  s=slide('本课目标','goals');
  tx(s,'本课目标',0.78,0.93,11.7,0.6,{fontSize:36,bold:true});
  tx(s,'今天下课前，我能：',1,1.75,11.2,0.55,{fontSize:29,color:C.teal,bold:true});
  ['听懂别人的名字和身份。','问同学的名字和姓。','介绍一位刚认识的同学。'].forEach((t,i)=>{
    const y=2.65+i*1.1;
    s.addShape('ellipse',{x:1,y,w:0.6,h:0.6,fill:{color:[C.teal,C.coral,C.purple][i]},line:{transparency:100}});
    latin(s,String(i+1),1,y+0.07,0.6,0.44,{fontSize:23,color:'FFFFFF',bold:true,align:'center'});
    tx(s,t,1.95,y+0.02,10,0.6,{fontSize:30});
  });
  divider('词语','words');
  const words=source.sections.vocabulary.items;
  for(let start=0;start<words.length;start+=5) {
    const batch=words.slice(start,start+5);
    const pages=[...new Set(batch.map(w=>w.textbook_printed_page))];
    s=slide('词语回顾','vocabulary-recall','vocabulary',{pages});
    tx(s,'词语回顾',0.78,0.93,10,0.58,{fontSize:34,bold:true});
    batch.forEach((w,i)=>{
      const y=1.90+i*0.86;
      tx(s,w.word,1.05,y,3.1,0.57,{fontSize:34,bold:true});
      latin(s,w.pinyin,4.15,y+0.04,3.25,0.5,{fontSize:28,color:C.teal});
      master.addLine(s,1.05,y+0.67,6.2,C.line,0.7);
    });
    picture(s,'words',8.15,2.15,4.25,4.25);
  }
  divider('听说词语','words');
  for(const id of ['word_tones','word_choice','pinyin_choice','word_reading','word_matching']) exercise(id,'words');
  s=slide('中国人的姓名','name-order','name_order');
  tx(s,'中国人的姓名',0.78,0.93,11.7,0.6,{fontSize:34,bold:true});
  tx(s,'姓',1.65,2.0,2,0.6,{fontSize:30,color:C.teal,align:'center'});
  tx(s,'名字',4.0,2.0,3.4,0.6,{fontSize:30,color:C.purple,align:'center'});
  [['李','军'],['王','大卫']].forEach((pair,i)=>{
    const y=2.85+i*1.35;
    card(s,1.45,y,2.4,0.98,C.mint);card(s,4.1,y,3.45,0.98,C.lilac);
    tx(s,pair[0],1.6,y+0.12,2.1,0.72,{fontSize:42,align:'center'});
    tx(s,pair[1],4.3,y+0.12,3.05,0.72,{fontSize:42,align:'center'});
  });
  picture(s,'cover',8.15,2.2,4,4);
  divider('听说句子','sentences');
  for(const id of ['sentence_fill','sentence_picture','sentence_repeat','pair_questions','picture_answers']) exercise(id,'sentences');
  divider('听说一段话','listening');
  for(const id of ['dialogue_1','dialogue_2','passage_reading','picture_speaking']) exercise(id,id==='picture_speaking'?'sentences':'listening');
  exercise('communication','communication');
  divider('重点句子','communication');
  // Three readable review pages retain all eight textbook sentences and pinyin.
  const keys=source.sections.key_sentences.items;
  for(const [start,end] of [[0,3],[3,5],[5,8]]) {
    s=slide('重点句子','key-sentences','key_sentences');
    tx(s,'重点句子',0.78,0.93,11.7,0.6,{fontSize:34,bold:true});
    keys.slice(start,end).forEach((item,i)=>{
      const y=1.85+i*1.55;
      tx(s,(start+i+1)+'. '+item.text,1.05,y,11.1,0.6,{fontSize:34});
      latin(s,item.pinyin,1.52,y+0.64,10.5,0.52,{fontSize:24,color:C.teal});
    });
  }
  slides.forEach((meta,i)=>{
    // Read back the actual native text objects rather than a separate copy list.
    meta.student_visible_text=pptx._slides[i]._slideObjects.flatMap(obj=>obj.text||[]).map(run=>run.text).filter(Boolean);
  });
  const raw=path.join(OUT,'lesson-04-实体课-native.pptx');
  await pptx.writeFile({fileName:raw});
  const generatedStoryboard=path.join(OUT,'lesson-04-face-to-face-generated.json');
  writeJson(generatedStoryboard,{lesson_key:KEY,offering_id:'2026-fall',mode:'teacher_face_to_face_only',status:'draft_not_human_approved',content_review:CONTENT_REVIEW,content_review_sha256:hash(CONTENT_REVIEW),slide_count:slides.length,slides});
  writeJson(path.join(OUT,'lesson-04-build-record.json'),{lesson_key:KEY,slides:slides.length,raw_pptx:raw,raw_sha256:hash(raw),source_sha256:hash(path.join(L,'00-source/canonical-source.json')),content_review:CONTENT_REVIEW,content_review_sha256:hash(CONTENT_REVIEW),image_manifest:IMAGE_MANIFEST,image_manifest_sha256:hash(IMAGE_MANIFEST),audio_embedded:false});
  console.log(JSON.stringify({output:raw,slide_count:slides.length},null,2));
}
main().catch(e=>{console.error(e.stack);process.exit(1);});
