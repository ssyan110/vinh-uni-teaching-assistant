#!/usr/bin/env python3
"""Source-driven read-only checks for the Lesson 4 draft; optional PDF render QA."""
import hashlib
import io
import json
import re
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET
from PIL import Image
from verify_boya_elementary_l03_face_to_face_pptx import NS, bbox, text_sizes
from add_textbook_page_markers import read_page_map

ROOT=Path(__file__).resolve().parents[1]
L=ROOT/'lessons/boya-elementary-i/lesson-04'
OUT=L/'10-design/pptx-draft/face-to-face-approved'
PPTX=OUT/'lesson-04-实体课.pptx'
PDF=OUT/'lesson-04-实体课-powerpoint-预览.pdf' if (OUT/'lesson-04-实体课-powerpoint-预览.pdf').exists() else OUT/'lesson-04-实体课-预览.pdf'
STORY=OUT/'lesson-04-face-to-face-generated.json'
SOURCE=L/'00-source/canonical-source.json'
QA=L/'10-design/qa-preview-approved-20260919'

def main():
    story=json.loads(STORY.read_text())
    source=json.loads(SOURCE.read_text())
    image_manifest=json.loads((L/'10-design/assets/image-manifest-approved-20260919.json').read_text())
    failures=[]
    texts=[]
    media_hashes=set()
    minimum=1000
    check=lambda ok,message: failures.append(message) if not ok else None
    compact=lambda t: re.sub(r'\s+','',t)
    with zipfile.ZipFile(PPTX) as z:
        check(z.testzip() is None,'ZIP CRC failure')
        slide_names=[n for n in z.namelist() if re.fullmatch(r'ppt/slides/slide\d+.xml',n)]
        check(len(slide_names)==len(story['slides']),'Slide count differs from storyboard')
        pres=ET.fromstring(z.read('ppt/presentation.xml'))
        size=pres.find('p:sldSz',NS)
        check((int(size.get('cx')),int(size.get('cy')))==(12192000,6858000),'Not 16:9')
        for item in story['slides']:
            i=item['slide_number']
            node=ET.fromstring(z.read(f'ppt/slides/slide{i}.xml'))
            strings=[n.text or '' for n in node.findall('.//a:t',NS)]
            text=' '.join(strings);texts.append(text)
            sizes=text_sizes(node)
            check(bool(sizes) and min(sizes)>=23,f'Slide {i}: size below 23pt')
            minimum=min(minimum,min(sizes or [0]))
            for n in node.findall('.//a:normAutofit',NS):
                check(int(n.get('fontScale','100000'))>=100000,f'Slide {i}: shrink below declared size')
            for kind in ['p:sp','p:pic','p:graphicFrame']:
                for element in node.findall('.//'+kind,NS):
                    b=bbox(element)
                    if b:
                        x,y,w,h=b
                        check(x>=0 and y>=0 and x+w<=12192000 and y+h<=6858000,f'Slide {i}: object outside canvas')
            for slot,font in [('ea','KaiTi'),('latin','Times New Roman'),('cs','Times New Roman')]:
                check(all(n.get('typeface')==font for n in node.findall('.//a:'+slot,NS)),f'Slide {i}: wrong {slot} font')
            if item['layout']=='textbook-exercise':
                actual=compact(text)
                expected=compact('第四课｜你叫什么名字'+str(i).zfill(2)+item['title']+item['textbook_page'])
                check(actual==expected,f'Slide {i}: exercise contains extra/missing visible instruction')
                if item['audio']:
                    check(item['title']=='练习'+item['audio'],f'Slide {i}: incorrect exercise label')
            notes=ET.fromstring(z.read(f'ppt/notesSlides/notesSlide{i}.xml'))
            check(bool(notes.findall('.//a:t',NS)),f'Slide {i}: notes missing')
        for name in z.namelist():
            if name.startswith('ppt/media/') and not name.endswith('/'):
                data=z.read(name)
                with Image.open(io.BytesIO(data)) as im: im.load()
                media_hashes.add(hashlib.sha256(data).hexdigest())
            if name.endswith('.rels'):
                rels=ET.fromstring(z.read(name))
                check(all(r.get('TargetMode')!='External' for r in rels),f'External relationship: {name}')
    check(media_hashes=={a['sha256'] for a in image_manifest['assets']},'Embedded images do not match verified manifest')
    refs={r.split('sections.')[-1] for s in story['slides'] for r in s['source_refs']}
    check(refs==set(source['sections']),'Textbook section coverage gap')
    visible='\n'.join(texts)
    for word in source['sections']['vocabulary']['items']:
        check(word['word'] in visible and word['pinyin'] in visible,'Missing recall word '+word['word'])
    for sentence in source['sections']['key_sentences']['items']:
        check(sentence['text'] in visible,'Missing key sentence '+sentence['text'])
    for i in range(2,11): check(visible.count('练习4-'+str(i)+' ') == 1,'Missing/duplicate exercise 4-'+str(i))
    QA.mkdir(exist_ok=True)
    report={'lesson_key':source['lesson_key'],'status':'passed' if not failures else 'failed','slide_count':len(texts),'minimum_explicit_pt':minimum,'unique_embedded_images':len(media_hashes),'source_sections_covered':len(refs),'failures':failures,'pptx_sha256':hashlib.sha256(PPTX.read_bytes()).hexdigest(),'human_review':'pending','audio_playback':'not_verified_missing_audio'}
    if PDF.exists():
        import fitz
        doc=fitz.open(PDF)
        check(len(doc)==len(texts),'PDF page count differs from PPTX')
        pdf_texts=[page.get_text() for page in doc]
        check(all(text.strip() for text in pdf_texts),'PDF has blank text pages')
        for num,label in read_page_map(SOURCE,STORY).items():
            check(compact(label) in compact(pdf_texts[num-1]),f'PDF page {num}: missing page marker')
        provenance=QA/'preview-provenance.json'
        report['pdf']={'pages':len(doc),'sha256':hashlib.sha256(PDF.read_bytes()).hexdigest(),'provenance':json.loads(provenance.read_text()) if provenance.exists() else {'renderer':'unverified'}}
        # Contact sheets are QA renderings of the document, not replacement lesson images.
        for start in range(0,len(doc),16):
            sheet=fitz.open();page=sheet.new_page(width=1440,height=880)
            for j in range(start,min(start+16,len(doc))):
                k=j-start;x=(k%4)*360;y=(k//4)*220
                page.insert_text((x+8,y+14),str(j+1),fontsize=12)
                page.show_pdf_page(fitz.Rect(x+4,y+19,x+356,y+217),doc,j)
            page.get_pixmap(matrix=fitz.Matrix(1.4,1.4)).save(QA/f'contact-sheet-{start//16+1}.png')
        for i in [0,1,4,9,19,29]:
            doc[i].get_pixmap(matrix=fitz.Matrix(1.6,1.6)).save(QA/f'slide-{i+1:02}.png')
    report['status']='passed' if not failures else 'failed'
    (QA/'technical-qa.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    (QA/'visible-text.txt').write_text('\n\n'.join(f'{i+1}\n{t}' for i,t in enumerate(texts))+'\n')
    print(json.dumps(report,ensure_ascii=False,indent=2))
    return bool(failures)

if __name__=='__main__': sys.exit(main())
