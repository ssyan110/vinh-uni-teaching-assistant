#!/usr/bin/env python3
"""Build the standalone Elementary I prerequisite lookup page."""

from __future__ import annotations

import html
import json
import sqlite3
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DB = ROOT / "textbooks/boya-elementary-i/source/derived/teaching-materials-database.sqlite"
OUTPUT = ROOT / "dashboard/boya-elementary-i-prerequisite.html"
BOOK_ID = "boya-elementary-i"


def rows(db: sqlite3.Connection, sql: str) -> list[dict]:
    return [dict(row) for row in db.execute(sql)]


def load_data() -> dict:
    db = sqlite3.connect(DB)
    try:
        db.row_factory = sqlite3.Row
        lessons = rows(db, """
            SELECT lesson_number, lesson_title, textbook_printed_start_page, source_status
            FROM lesson_index
            WHERE textbook_id = 'boya-elementary-i'
            ORDER BY CAST(lesson_number AS INTEGER)
        """)
        vocabulary = rows(db, """
            SELECT lesson_number, item_order, word, pinyin, part_of_speech,
                   meaning_vi, meaning_vi_status, source_printed_page, source_status
            FROM vocabulary_occurrences
            WHERE textbook_id = 'boya-elementary-i'
            ORDER BY CAST(lesson_number AS INTEGER), CAST(item_order AS INTEGER)
        """)
        expressions = rows(db, """
            SELECT lesson_number, expression, pinyin, meaning_vi, meaning_vi_status,
                   source_status
            FROM expressions
            WHERE textbook_id = 'boya-elementary-i'
            ORDER BY CAST(lesson_number AS INTEGER), expression_id
        """)
        grammar = rows(db, """
            SELECT lesson_number, pattern, function_zh, meaning_vi, meaning_vi_status,
                   example_sentence_zh, source_section, source_printed_page,
                   source_status, needs_manual
            FROM grammar
            WHERE textbook_id = 'boya-elementary-i'
            ORDER BY CAST(lesson_number AS INTEGER), grammar_id
        """)
    finally:
        db.close()

    # Direct textbook-page evidence that is currently absent from the grammar
    # audit table. Keep it visibly review-only and preserve the two-stage
    # progression: date answer in L18, explicit 几月几号 question in L22.
    grammar.extend([
        {
            "lesson_number": 18,
            "pattern": "月＋号（日期回答）",
            "function_zh": "用“月＋号”回答日期，例如“八月十五号”。",
            "meaning_vi": "Dùng tháng + ngày để nói ngày tháng.",
            "meaning_vi_status": "translated_subagent_draft",
            "example_sentence_zh": "八月十五号。",
            "source_section": "两个人一组，互相问答",
            "source_printed_page": "153",
            "source_status": "direct_ocr_source_evidence_needs_manual",
            "needs_manual": "true",
            "search_aliases": "几月几号 12月25日 十二月二十五号 日期 月号",
        },
        {
            "lesson_number": 22,
            "pattern": "几月几号＋V",
            "function_zh": "用“几月几号”询问具体日期。",
            "meaning_vi": "Dùng mấy tháng mấy ngày để hỏi ngày cụ thể.",
            "meaning_vi_status": "translated_subagent_draft",
            "example_sentence_zh": "你们学校下个学期几月几号开学？",
            "source_section": "词语搭配；两个人一组，互相问答",
            "source_printed_page": "189；194",
            "source_status": "direct_ocr_source_evidence_needs_manual",
            "needs_manual": "true",
            "search_aliases": "12月25日 十二月二十五号 日期 月号",
        },
    ])
    grammar.sort(key=lambda r: (int(r["lesson_number"]), str(r.get("pattern") or "")))

    # The occurrence table is known to omit 叫 in Lesson 04. Merge vocabulary
    # from materialized canonical packages without overwriting database rows.
    seen = {(int(r["lesson_number"]), r["word"].strip()) for r in vocabulary}
    canonical_additions = []
    for lesson_no in range(1, 26):
        source = ROOT / f"lessons/{BOOK_ID}/lesson-{lesson_no:02d}/00-source/canonical-source.json"
        if not source.exists():
            continue
        payload = json.loads(source.read_text(encoding="utf-8"))
        sections = payload.get("sections", {})
        items = sections.get("vocabulary", {}).get("items", []) if isinstance(sections, dict) else []
        for order, item in enumerate(items, 1):
            word = str(item.get("word") or "").strip()
            if not word or (lesson_no, word) in seen:
                continue
            canonical_additions.append({
                "lesson_number": lesson_no,
                "item_order": order,
                "word": word,
                "pinyin": item.get("pinyin") or "",
                "part_of_speech": item.get("part_of_speech") or "",
                "meaning_vi": item.get("meaning_vi") or "",
                "meaning_vi_status": "not_available_in_canonical_package",
                "source_printed_page": item.get("source_printed_page") or "",
                "source_status": "canonical_source_package_draft",
            })
            seen.add((lesson_no, word))
    vocabulary.extend(canonical_additions)
    vocabulary.sort(key=lambda r: (int(r["lesson_number"]), int(r.get("item_order") or 0)))

    return {
        "book": {"id": BOOK_ID, "title": "博雅汉语·初级起步篇 I"},
        "lessons": lessons,
        "vocabulary": vocabulary,
        "expressions": expressions,
        "grammar": grammar,
        "meta": {
            "database": str(DB.relative_to(ROOT)),
            "vocabularyCount": len(vocabulary),
            "expressionCount": len(expressions),
            "grammarCount": len(grammar),
            "canonicalAdditions": len(canonical_additions),
            "status": "来源整理层；越南文释义与语法仍需教师复核",
        },
    }


def build_html(data: dict) -> str:
    data_json = json.dumps(data, ensure_ascii=False).replace("</", "<\\/")
    return f"""<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>初级起步篇 I · 先修知识查询</title>
  <link rel="icon" href="data:,">
  <style>
    :root {{
      --ink:#17324d; --muted:#617387; --paper:#f6f8f7; --white:#fff;
      --line:#d9e0de; --teal:#197a72; --teal-soft:#e5f3f0;
      --coral:#d9644a; --coral-soft:#fff0eb; --amber:#a76808; --amber-soft:#fff6df;
      --shadow:0 18px 48px rgba(23,50,77,.10); --radius:16px;
    }}
    *{{box-sizing:border-box}}
    body{{margin:0;background:var(--paper);color:var(--ink);font-family:"Times New Roman",KaiTi,serif;line-height:1.55}}
    button,input,select{{font:inherit}}
    button,select{{cursor:pointer}}
    .topbar{{background:var(--ink);color:white;padding:28px max(24px,calc((100vw - 1240px)/2));display:flex;align-items:flex-end;justify-content:space-between;gap:24px}}
    .eyebrow{{margin:0 0 6px;font-size:12px;letter-spacing:.15em;color:#b9d7d2}}
    h1{{font-family:KaiTi,"Times New Roman",serif;margin:0;font-size:clamp(27px,4vw,42px);font-weight:700}}
    .top-link{{color:white;text-decoration:none;border-bottom:1px solid #8bb8b2;padding-bottom:2px}}
    .shell{{max-width:1240px;margin:0 auto;padding:28px 24px 60px}}
    .notice{{display:flex;gap:12px;align-items:flex-start;background:var(--amber-soft);border:1px solid #ecd6a6;padding:14px 16px;border-radius:12px;color:#694706;margin-bottom:20px}}
    .notice strong{{white-space:nowrap}}
    .control-grid{{display:grid;grid-template-columns:260px 1fr;gap:18px;margin-bottom:18px}}
    .panel{{background:var(--white);border:1px solid var(--line);border-radius:var(--radius);box-shadow:var(--shadow)}}
    .lesson-panel{{padding:20px}}
    label{{display:block;font-weight:700;margin-bottom:8px}}
    select,input{{width:100%;border:1px solid #b9c5c3;border-radius:10px;background:white;color:var(--ink);padding:12px 13px;outline:none}}
    select:focus,input:focus,button:focus-visible{{box-shadow:0 0 0 3px rgba(25,122,114,.20);border-color:var(--teal);outline:none}}
    .scope{{margin:14px 0 0;padding:12px;background:var(--teal-soft);border-radius:10px;color:#11574f}}
    .scope strong{{display:block;font-size:20px}}
    .search-panel{{padding:20px}}
    .search-row{{display:grid;grid-template-columns:1fr auto;gap:10px}}
    .search-row button{{border:0;border-radius:10px;background:var(--teal);color:white;padding:0 24px;font-weight:700}}
    .search-help{{margin:8px 0 0;color:var(--coral);font-size:14px;font-weight:700}}
    .examples{{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;align-items:center;color:var(--muted);font-size:14px}}
    .chip{{border:1px solid #b9c5c3;background:white;border-radius:999px;padding:5px 11px;color:var(--ink)}}
    .verdict{{padding:20px 22px;margin:18px 0;border-left:6px solid var(--teal)}}
    .verdict h2{{margin:0 0 5px;font-family:KaiTi,"Times New Roman",serif;font-size:24px}}
    .verdict p{{margin:0;color:var(--muted)}}
    .verdict.not-yet{{border-left-color:var(--coral);background:var(--coral-soft)}}
    .verdict.unknown{{border-left-color:var(--amber);background:var(--amber-soft)}}
    .summary{{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:18px 0}}
    .stat{{padding:15px 17px}}
    .stat span{{display:block;color:var(--muted);font-size:13px}}
    .stat strong{{font-size:27px}}
    .toolbar{{display:flex;justify-content:space-between;align-items:center;gap:16px;margin:22px 0 12px}}
    .tabs{{display:flex;gap:8px;flex-wrap:wrap}}
    .tab{{border:1px solid #bac6c4;background:white;color:var(--ink);border-radius:999px;padding:7px 13px}}
    .tab.active{{background:var(--ink);border-color:var(--ink);color:white}}
    .result-count{{color:var(--muted);font-size:14px}}
    .results{{display:grid;gap:12px}}
    .result{{padding:18px 20px;display:grid;grid-template-columns:92px 1fr auto;gap:16px;align-items:start}}
    .lesson-tag{{background:var(--teal-soft);color:#11574f;border-radius:8px;text-align:center;padding:7px 8px;font-weight:700}}
    .result h3{{margin:0 0 4px;font-family:KaiTi,"Times New Roman",serif;font-size:24px}}
    .detail{{margin:3px 0;color:var(--muted)}}
    .evidence{{margin-top:9px;padding-top:9px;border-top:1px dashed var(--line);font-size:14px;color:#3f5569}}
    .type{{font-size:13px;border:1px solid var(--line);border-radius:999px;padding:4px 9px;white-space:nowrap}}
    mark{{background:#ffe7a2;color:inherit;padding:0 .08em}}
    .empty{{padding:34px;text-align:center;color:var(--muted)}}
    .lesson-map{{margin-top:30px;padding:22px}}
    .lesson-map h2{{font-family:KaiTi,"Times New Roman",serif;margin:0 0 14px}}
    .lesson-list{{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}}
    .lesson-button{{text-align:left;border:1px solid var(--line);background:white;border-radius:10px;padding:10px}}
    .lesson-button:hover{{border-color:var(--teal)}}
    .lesson-button b{{display:block;color:var(--teal)}}
    footer{{max-width:1240px;margin:0 auto;padding:0 24px 40px;color:var(--muted);font-size:13px}}
    @media(max-width:760px){{
      .topbar{{align-items:flex-start;flex-direction:column}}
      .control-grid{{grid-template-columns:1fr}}
      .search-row{{grid-template-columns:1fr}}
      .search-row button{{padding:11px}}
      .summary{{grid-template-columns:repeat(2,1fr)}}
      .result{{grid-template-columns:72px 1fr}}
      .type{{grid-column:2;justify-self:start}}
      .lesson-list{{grid-template-columns:repeat(2,1fr)}}
      .toolbar{{align-items:flex-start;flex-direction:column}}
    }}
  </style>
</head>
<body>
  <header class="topbar">
    <div><p class="eyebrow">VINH UNIVERSITY · BOYA ELEMENTARY I</p><h1>写教材前，先查学生学过什么</h1></div>
    <a class="top-link" href="index.html">返回教材制作控制台</a>
  </header>
  <main class="shell">
    <div class="notice"><strong>资料状态</strong><span>这是来源整理与备课查询工具。越南文释义和语法仍需教师复核；“找到”表示教材记录中出现过，不自动证明课堂已经练熟。</span></div>
    <section class="control-grid" aria-label="查询条件">
      <div class="panel lesson-panel">
        <label for="lessonSelect">我正在编写</label>
        <select id="lessonSelect"></select>
        <p class="scope">默认先修范围<strong id="scopeText">第1–10课</strong>不包含正在编写的课次</p>
      </div>
      <div class="panel search-panel">
        <label for="query">页面内查询（请在这里输入）</label>
        <div class="search-row"><input id="query" type="search" placeholder="例如：几月几号、12月25日、正在……呢" autocomplete="off"><button id="searchButton" type="button">查询</button></div>
        <p class="search-help">不要使用 Chrome 右上角的网页查找；按 Command/Ctrl + F 会自动跳到这里。</p>
        <div class="examples"><span>快速检查：</span><button class="chip" data-query="几月几号">几月几号</button><button class="chip" data-query="12月25日">12月25日</button><button class="chip" data-query="正在">正在</button><button class="chip" data-query="怎么样">怎么样</button></div>
      </div>
    </section>
    <section id="verdict" class="panel verdict" aria-live="polite"></section>
    <section class="summary" aria-label="先修内容统计">
      <div class="panel stat"><span>先修词汇</span><strong id="vocabCount">0</strong></div>
      <div class="panel stat"><span>日常用语</span><strong id="expressionCount">0</strong></div>
      <div class="panel stat"><span>语法／语音规则</span><strong id="grammarCount">0</strong></div>
      <div class="panel stat"><span>覆盖课次</span><strong id="lessonCount">0</strong></div>
    </section>
    <div class="toolbar">
      <div class="tabs" role="tablist" aria-label="内容类型">
        <button class="tab active" data-type="all">全部</button><button class="tab" data-type="vocabulary">词汇</button><button class="tab" data-type="expression">日常用语</button><button class="tab" data-type="grammar">语法</button>
      </div>
      <span id="resultCount" class="result-count"></span>
    </div>
    <section id="results" class="results" aria-label="查询结果"></section>
    <section class="panel lesson-map"><h2>按课次浏览</h2><div id="lessonList" class="lesson-list"></div></section>
  </main>
  <footer>数据来源：{html.escape(data['meta']['database'])}。生成时共收录 {data['meta']['vocabularyCount']} 条词汇、{data['meta']['expressionCount']} 条日常用语和 {data['meta']['grammarCount']} 条语法记录。</footer>
  <script id="lookupData" type="application/json">{data_json}</script>
  <script>
    const DATA=JSON.parse(document.getElementById('lookupData').textContent);
    const lessonSelect=document.getElementById('lessonSelect'), query=document.getElementById('query');
    const results=document.getElementById('results'), verdict=document.getElementById('verdict');
    let activeType='all';
    const titleByLesson=Object.fromEntries(DATA.lessons.map(x=>[Number(x.lesson_number),x.lesson_title]));
    const norm=v=>String(v??'').toLowerCase().replace(/[\\s，。！？、；：,.!?;:（）()“”'\"·…—-]/g,'');
    const items=[
      ...DATA.vocabulary.map(x=>({{...x,type:'vocabulary',label:x.word,secondary:[x.pinyin,x.part_of_speech,x.meaning_vi].filter(Boolean).join(' · '),evidence:''}})),
      ...DATA.expressions.map(x=>({{...x,type:'expression',label:x.expression,secondary:[x.pinyin,x.meaning_vi].filter(Boolean).join(' · '),evidence:''}})),
      ...DATA.grammar.map(x=>({{...x,type:'grammar',label:x.pattern,secondary:[x.function_zh,x.meaning_vi].filter(Boolean).join(' · '),evidence:x.example_sentence_zh||''}}))
    ].map(x=>({{...x,lesson_number:Number(x.lesson_number),haystack:norm([x.label,x.secondary,x.evidence,x.source_section,x.search_aliases].join(' '))}}));
    function currentLesson(){{return Number(lessonSelect.value)}}
    function escapeHTML(v){{return String(v??'').replace(/[&<>\"]/g,c=>({{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}}[c]))}}
    function highlight(v,q){{if(!q)return escapeHTML(v);const safe=escapeHTML(v), needle=escapeHTML(q.trim());return needle?safe.replaceAll(needle,`<mark>${{needle}}</mark>`):safe}}
    function typeName(t){{return {{vocabulary:'词汇',expression:'日常用语',grammar:'语法'}}[t]}}
    function getMatches(){{
      const q=norm(query.value), lesson=currentLesson();
      return items.filter(x=>(activeType==='all'||x.type===activeType)&&x.lesson_number<lesson&&(!q||x.haystack.includes(q)));
    }}
    function renderVerdict(){{
      const q=norm(query.value), raw=query.value.trim(), lesson=currentLesson();
      verdict.className='panel verdict';
      if(!raw){{verdict.innerHTML=`<h2>先选择课次，再查一个表达</h2><p>当前按“编写第${{lesson}}课”计算，下面列出学生在第1–${{lesson-1}}课接触过的内容。</p>`;return}}
      const allMatches=items.filter(x=>x.haystack.includes(q));
      const learned=allMatches.filter(x=>x.lesson_number<lesson);
      const later=allMatches.filter(x=>x.lesson_number>=lesson).sort((a,b)=>a.lesson_number-b.lesson_number);
      if(learned.length){{
        const first=Math.min(...learned.map(x=>x.lesson_number));
        verdict.innerHTML=`<h2>可作为已接触内容使用</h2><p>“${{escapeHTML(raw)}}”在先修范围内找到 ${{learned.length}} 条记录，最早见于第${{first}}课。仍请根据课堂实际完成情况决定是否需要复习提示。</p>`;
      }} else if(later.length){{
        verdict.classList.add('not-yet'); const first=later[0].lesson_number;
        verdict.innerHTML=`<h2>当前课前尚未学到</h2><p>“${{escapeHTML(raw)}}”最早在第${{first}}课的结构化记录中出现。编写第${{lesson}}课时，不应默认学生已经会用。</p>`;
      }} else {{
        verdict.classList.add('unknown');
        verdict.innerHTML=`<h2>未找到，暂时不要视为已学</h2><p>“${{escapeHTML(raw)}}”在本书现有结构化词汇、日常用语和语法记录中都没有匹配。它可能尚未教授，也可能属于尚未结构化的教材内容；使用前请人工核对原书。以第11课为例，“12月25日／几月几号”应按此状态处理。</p>`;
      }}
    }}
    function render(){{
      const lesson=currentLesson(), max=lesson-1, q=query.value.trim(), matches=getMatches();
      document.getElementById('scopeText').textContent=max?`第1–${{max}}课`:'尚无前置课次';
      const scoped=items.filter(x=>x.lesson_number<lesson);
      document.getElementById('vocabCount').textContent=scoped.filter(x=>x.type==='vocabulary').length;
      document.getElementById('expressionCount').textContent=scoped.filter(x=>x.type==='expression').length;
      document.getElementById('grammarCount').textContent=scoped.filter(x=>x.type==='grammar').length;
      document.getElementById('lessonCount').textContent=max;
      document.getElementById('resultCount').textContent=`显示 ${{matches.length}} 条`;
      renderVerdict();
      if(!matches.length){{results.innerHTML='<div class="panel empty">当前筛选范围没有可显示的记录。</div>';return}}
      results.innerHTML=matches.map(x=>`<article class="panel result"><div class="lesson-tag">第${{x.lesson_number}}课</div><div><h3>${{highlight(x.label,q)}}</h3><p class="detail">${{highlight(x.secondary||'暂无补充释义',q)}}</p>${{x.evidence?`<p class="evidence">教材例证：${{highlight(x.evidence,q)}}</p>`:''}}<p class="evidence">${{escapeHTML(titleByLesson[x.lesson_number])}}${{x.source_printed_page?` · 教材 P${{escapeHTML(x.source_printed_page)}}`:''}} · 状态：待复核</p></div><span class="type">${{typeName(x.type)}}</span></article>`).join('');
    }}
    DATA.lessons.forEach(x=>lessonSelect.add(new Option(`第${{x.lesson_number}}课 · ${{x.lesson_title}}`,x.lesson_number)));
    lessonSelect.value='11';
    document.getElementById('lessonList').innerHTML=DATA.lessons.map(x=>`<button class="lesson-button" data-lesson="${{x.lesson_number}}"><b>第${{x.lesson_number}}课</b>${{escapeHTML(x.lesson_title)}}</button>`).join('');
    lessonSelect.addEventListener('change',render); query.addEventListener('input',render);
    document.getElementById('searchButton').addEventListener('click',render);
    document.querySelectorAll('.chip').forEach(b=>b.addEventListener('click',()=>{{query.value=b.dataset.query;render();query.focus()}}));
    document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>{{document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));b.classList.add('active');activeType=b.dataset.type;render()}}));
    document.getElementById('lessonList').addEventListener('click',e=>{{const b=e.target.closest('[data-lesson]');if(!b)return;lessonSelect.value=b.dataset.lesson;query.value='';render();scrollTo({{top:0,behavior:'smooth'}})}});
    document.addEventListener('keydown',e=>{{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='f'){{e.preventDefault();query.focus();query.select()}}}});
    render();
  </script>
</body>
</html>
"""


def main() -> None:
    data = load_data()
    OUTPUT.write_text(build_html(data), encoding="utf-8")
    print(
        f"wrote {OUTPUT} with {data['meta']['vocabularyCount']} vocabulary, "
        f"{data['meta']['expressionCount']} expressions, "
        f"{data['meta']['grammarCount']} grammar rows, "
        f"including {data['meta']['canonicalAdditions']} canonical additions"
    )


if __name__ == "__main__":
    main()
