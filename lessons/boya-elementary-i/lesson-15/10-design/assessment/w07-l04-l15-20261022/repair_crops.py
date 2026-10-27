from pathlib import Path
import json,re,fitz
from PIL import Image,ImageDraw
R=Path(__file__).resolve().parent;P=Path('/Users/ssyan110/Development/vinh-uni-teaching-assistant');bank=json.loads((R/'items.json').read_text());rows=[]
for v in [4,5]:
 d=fitz.open(R/f'source/A{v}-en_s.pdf')
 for item in [i for i in bank['items'] if i['source_volume']==v]:
  q=item['source_question'];p=d[item['source_pdf_page']-1];words=p.get_text('words');nums=[w for w in words if re.fullmatch(r'\d+\.',w[4])];j=next(j for j,w in enumerate(nums) if int(w[4][:-1])==q);w=nums[j];nqty=nums[j+1][1] if j+1<len(nums) else 800
  if q<=40:
   images=[rect for im in p.get_images() for rect in p.get_image_rects(im[0]) if w[1]-3<=rect.y0<nqty-3]
   labels=[fitz.Rect(x[:4]) for x in words if x[4] in ['(A)','(B)','(C)'] and w[1]<=x[1]<nqty]
   boxes=images+labels if q>10 else images
   assert len(labels)==3 if q>10 else True,(v,q,labels)
   clip=fitz.Rect(min(x.x0 for x in boxes)-6,min(x.y0 for x in boxes)-6,max(x.x1 for x in boxes)+6,max(x.y1 for x in boxes)+6)
   out=P/item['option_image'];p.get_pixmap(matrix=fitz.Matrix(2,2),clip=clip).save(out)
  else:clip=fitz.Rect(112,w[1]+17,550,min(w[1]+117,800));out=P/item['original_options_provenance_image'] if item.get('original_options_provenance_image') else R/f'images/TOCFL-A{v}-Q{q:02}.png';p.get_pixmap(matrix=fitz.Matrix(2,2),clip=clip).save(out)
  rows.append({'number':item['number'],'volume':v,'question':q,'source_pdf_page':item['source_pdf_page'],'clip':list(clip),'image':str(out.relative_to(P))})
rows.sort(key=lambda row:row['number'])
(R/'image-crop-map.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
canvas=Image.new('RGB',(1200,10*155),'#eee');dr=ImageDraw.Draw(canvas)
for i,x in enumerate(rows):
 im=Image.open(P/x['image']);im.thumbnail((230,125));px=(i%5)*240;py=(i//5)*155;canvas.paste(im,(px,py+20));dr.text((px+4,py+2),f'{i+1}:A{x["volume"]}Q{x["question"]}',fill='black')
canvas.save(R/'question-crops-contact-sheet.png');print('Current visible crops rendered; all A/B/C bbox included; bank untouched')
