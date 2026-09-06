#!/usr/bin/env python3
"""Create Lesson 10 semantic raster illustration candidates.

These are textured, hand-painted-style PNG study illustrations for review;
not SVG/vector icons and not release-approved assets.
"""
from __future__ import annotations
import hashlib, json, math, random
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'lessons/boya-quasi-intermediate-i/lesson-10/10-design/assets'
W=H=1024
PAPER=(248,244,234)
PALETTE=[(184,205,194),(205,190,176),(214,188,183),(183,198,218),(222,204,154),(194,183,211)]

# Distinct meaning-led scenes; no written labels are drawn into images.
SCENES = {
'穿戴': 'person dressing neatly before going out', '整齐': 'carefully arranged clothes and shoes in a tidy room',
'商量': 'two students leaning over a table planning together', '碰': 'two acquaintances unexpectedly meeting on a campus path',
'实习': 'student learning in a restaurant kitchen with an apron', '答应': 'friendly person nodding and extending an agreeing hand',
'厨师': 'chef preparing a steaming dish in a warm kitchen', '收入': 'person receiving wages and organizing household budget',
'社交': 'small group of friends talking around a cafe table', '费用': 'shared restaurant bill beside several plates',
'分摊': 'friends dividing a restaurant bill fairly', '调查': 'student researcher collecting opinions on a clipboard',
'功课': 'student studying books and notes at a desk', '同乡': 'two people from the same hometown greeting warmly',
'普通': 'ordinary family meal in a modest home dining room', '花费': 'person choosing between shopping and saving money',
'负担': 'person carrying a heavy but manageable stack of expenses', '请客': 'host welcoming guests to a generous dinner',
'增多': 'several plates and gathering objects gradually increasing', '特色': 'distinctive restaurant dish with a memorable shape',
'比例': 'three differently sized portions on a shared table', '行为': 'person helping another person at a communal meal',
'大饱口福': 'happy diners enjoying many delicious dishes', '距离': 'two friends reaching across a long table toward each other',
'追求': 'person walking toward a warm shared dinner under evening light', '和谐': 'diverse friends smiling together in balanced circle',
'聚餐': 'friends gathered around a round table with shared dishes', '相处': 'helping another person at a communal meal',
}

def texture(base, seed):
    random.seed(seed); im=Image.new('RGB',(W,H),base); d=ImageDraw.Draw(im,'RGBA')
    for _ in range(900):
        x=random.randrange(W); y=random.randrange(H); r=random.choice([1,2,3,5,8,12])
        a=random.randrange(3,18); c=random.choice([(100,90,75,a),(255,255,255,a)])
        d.ellipse((x-r,y-r,x+r,y+r),fill=c)
    return im

def brush(im, box, fill, seed, blur=10):
    random.seed(seed); lay=Image.new('RGBA',im.size,(0,0,0,0)); d=ImageDraw.Draw(lay,'RGBA')
    x0,y0,x1,y1=box
    for _ in range(18):
        x=random.randint(x0,x1); y=random.randint(y0,y1); rx=random.randint(30,130); ry=random.randint(18,90)
        d.ellipse((x-rx,y-ry,x+rx,y+ry), fill=fill+(random.randint(18,48),))
    im.paste(lay.filter(ImageFilter.GaussianBlur(blur)),(0,0),lay.filter(ImageFilter.GaussianBlur(blur)))

def person(d,cx,cy,scale=1.0,shirt=(107,137,153),pose='stand'):
    skin=(225,177,143); ink=(78,91,95)
    r=int(36*scale); d.ellipse((cx-r,cy-r,cx+r,cy+r),fill=skin+(255,),outline=ink+(150,),width=max(2,int(4*scale)))
    d.arc((cx-r,cy-r-8,cx+r,cy+r+8),200,335,fill=ink+(150,),width=max(2,int(4*scale)))
    bw=int(70*scale); bh=int(125*scale)
    d.rounded_rectangle((cx-bw,cy+int(32*scale),cx+bw,cy+int(32*scale)+bh),radius=int(20*scale),fill=shirt+(235,),outline=ink+(120,),width=max(2,int(4*scale)))
    if pose=='sit':
        d.line((cx-int(25*scale),cy+bh+25,cx-int(95*scale),cy+bh+55),fill=ink+(150,),width=max(3,int(8*scale)))
        d.line((cx+int(25*scale),cy+bh+25,cx+int(95*scale),cy+bh+55),fill=ink+(150,),width=max(3,int(8*scale)))
    else:
        d.line((cx-int(30*scale),cy+bh,cx-int(48*scale),cy+bh+int(110*scale)),fill=ink+(150,),width=max(3,int(8*scale)))
        d.line((cx+int(30*scale),cy+bh,cx+int(48*scale),cy+bh+int(110*scale)),fill=ink+(150,),width=max(3,int(8*scale)))
    d.line((cx-bw,cy+int(70*scale),cx-int(110*scale),cy+int(125*scale)),fill=ink+(130,),width=max(3,int(7*scale)))
    d.line((cx+bw,cy+int(70*scale),cx+int(110*scale),cy+int(125*scale)),fill=ink+(130,),width=max(3,int(7*scale)))

def scene_image(name, prompt, seed, wide=False):
    random.seed(seed); base=PALETTE[seed%len(PALETTE)]
    im=texture(tuple(min(255,int((a+245)/2)) for a in base),seed)
    brush(im,(30,30,W-30,H-30),base,seed)
    d=ImageDraw.Draw(im,'RGBA'); ink=(78,91,95,165); wood=(166,126,91,190); green=(117,157,121,170); red=(191,116,111,180)
    # room / landscape washes
    d.rectangle((55,90,W-55,850),fill=(255,251,240,55),outline=ink,width=4)
    d.line((55,760,W-55,760),fill=ink,width=5)
    low=prompt.lower()
    # Specific semantic scenes must win over the generic meal fallback.
    if 'increasing' in low or 'gradually increasing' in low:
        for i,(x,y,s) in enumerate([(220,610,55),(390,540,85),(590,450,125),(780,330,165)]):
            d.ellipse((x-s,y-s,x+s,y+s),fill=PALETTE[(i+2)%len(PALETTE)]+(210,),outline=ink,width=6)
            d.line((x,y+s+20,x,y+s+95),fill=ink,width=6)
        d.line((170,700,850,230),fill=red,width=10); d.polygon([(850,230),(795,250),(825,285)],fill=red)
    elif 'proportions' in low or 'differently sized portions' in low:
        d.line((210,650,820,650),fill=wood,width=12); d.line((515,350,515,650),fill=ink,width=8)
        for x,s,c in [(300,70,(185,205,194,230)),(515,120,(214,188,183,230)),(730,175,(183,198,218,230))]:
            d.ellipse((x-s,570-s//3,x+s,570+s//3),fill=c,outline=ink,width=5)
    elif 'survey' in low or 'clipboard' in low or 'opinions' in low:
        d.rectangle((430,300,650,650),fill=(251,247,232,235),outline=ink,width=6)
        for y in [390,465,540]: d.line((475,y,605,y),fill=(113,145,154,170),width=7); d.ellipse((455,y-12,475,y+8),outline=green,width=5)
        person(d,300,280,1.0,(182,145,178)); d.line((355,440,430,420),fill=ink,width=8)
    elif 'homework' in low or 'studying books' in low:
        d.rectangle((180,540,840,700),fill=wood,outline=ink,width=5); d.ellipse((350,440,680,590),fill=(250,247,235,230),outline=ink,width=5)
        d.line((430,470,600,470),fill=(110,140,151,160),width=8); d.line((410,515,630,515),fill=(110,140,151,160),width=8); person(d,270,300,.95,(117,153,165))
    elif 'heavy' in low or 'stack of expenses' in low:
        person(d,500,270,1.05,(184,140,145))
        for i in range(5): d.rounded_rectangle((370,500-i*55,630,575-i*55),12,fill=PALETTE[(i+1)%len(PALETTE)]+(220,),outline=ink,width=5)
        d.line((405,535,595,535),fill=red,width=7)
    elif 'distance' in low or 'reaching across' in low:
        d.line((150,610,870,610),fill=wood,width=15); person(d,250,350,.9,(119,155,177)); person(d,770,350,.9,(188,142,139)); d.line((330,520,610,610),fill=ink,width=8); d.line((690,520,610,610),fill=ink,width=8)
        d.ellipse((490,560,650,660),fill=(219,235,199,210),outline=ink,width=5)
    elif 'balanced circle' in low or 'helping another' in low:
        centers=[(320,340),(510,260),(700,340),(610,535),(410,535)]
        for i,(x,y) in enumerate(centers): person(d,x,y,.65,PALETTE[(i+1)%len(PALETTE)])
        for (a,b) in zip(centers,centers[1:]+centers[:1]): d.line((a[0],a[1]+80,b[0],b[1]+80),fill=green,width=7)
        d.ellipse((385,375,635,625),outline=green,width=8)
    elif 'walking toward' in low or 'pursuit' in low:
        d.polygon([(180,760),(420,420),(600,420),(850,760)],fill=(187,206,184,120)); person(d,330,360,.95,(115,153,176)); d.ellipse((610,410,770,570),fill=(230,197,126,210),outline=ink,width=6); d.line((470,520,610,480),fill=red,width=9)
    elif 'distinctive restaurant dish' in low:
        d.rectangle((210,520,810,690),fill=wood,outline=ink,width=5); d.ellipse((330,390,690,600),fill=(235,235,218,230),outline=ink,width=6)
        d.polygon([(430,500),(510,385),(600,500),(535,555)],fill=(190,116,111,220),outline=ink); d.ellipse((480,430,550,500),fill=(222,204,154,230))
    elif 'nodding' in low or 'agreeing hand' in low:
        person(d,470,290,1.2,(117,153,165)); d.line((540,430,720,330),fill=ink,width=9); d.ellipse((690,295,760,365),fill=(225,177,143,230),outline=ink,width=4); d.arc((365,250,575,480),25,155,fill=green,width=10)
    elif 'ordinary family' in low:
        d.rectangle((150,360,875,700),fill=(218,196,161,110),outline=ink,width=5); d.rectangle((210,450,370,600),fill=(177,203,213,180),outline=ink,width=4); person(d,330,330,.7,(184,140,145)); person(d,510,330,.7,(117,153,165)); person(d,690,330,.7,(183,157,113)); d.ellipse((350,570,700,700),fill=wood,outline=ink,width=5)
    elif 'table' in low or 'dinner' in low or 'meal' in low or 'restaurant' in low or 'dish' in low or 'plates' in low:
        d.ellipse((170,470,850,760),fill=wood,outline=ink,width=6)
        for x,y,col in [(300,535,(219,235,229,230)),(480,515,(237,202,149,230)),(650,550,(205,167,181,230)),(420,650,(210,228,184,230)),(610,650,(229,183,133,230))]:
            d.ellipse((x-72,y-38,x+72,y+38),fill=col,outline=ink,width=4)
            d.arc((x-48,y-20,x+48,y+30),180,350,fill=(112,86,72,160),width=4)
        for i,x in enumerate([265,430,595,760]): person(d,x,390+(i%2)*22,.72,PALETTE[(seed+i)%len(PALETTE)],'sit')
    elif 'kitchen' in low or 'chef' in low:
        d.rectangle((150,410,875,735),fill=(222,207,178,150),outline=ink,width=5); d.ellipse((350,565,690,690),fill=(205,133,99,210),outline=ink,width=5)
        person(d,500,300,1.15,(183,128,128)); d.ellipse((430,230,570,295),fill=(242,242,232,230),outline=ink,width=4)
        d.line((500,470,500,565),fill=ink,width=8); d.ellipse((450,430,550,500),fill=(241,194,117,210),outline=ink,width=4)
    elif 'clothes' in low or 'dressing' in low or 'arranged' in low:
        d.rectangle((180,170,390,680),fill=(172,136,108,170),outline=ink,width=5); d.line((220,250,350,250),fill=ink,width=8)
        for i,(x,y,col) in enumerate([(245,310,(183,128,139,230)),(330,405,(114,153,183,230)),(250,520,(209,184,113,230))]): d.rounded_rectangle((x,y,x+100,y+85),20,fill=col,outline=ink,width=4)
        d.rectangle((570,570,790,660),fill=(160,116,88,160),outline=ink,width=5); d.ellipse((610,530,740,620),fill=(205,177,113,220),outline=ink,width=4)
        person(d,700,285,1.0,(120,153,171));
    elif 'budget' in low or 'bill' in low or 'wages' in low or 'expenses' in low or 'saving' in low:
        d.rectangle((220,440,800,690),fill=(255,252,241,220),outline=ink,width=5)
        for i in range(5): d.ellipse((300+i*75,525+(i%2)*60,350+i*75,575+(i%2)*60),fill=(198,174,103,210),outline=ink,width=3)
        d.line((300,465,700,465),fill=green,width=12); d.line((300,485,590,485),fill=green,width=8); person(d,500,260,1.0,(183,145,178))
    elif 'distance' in low or 'reaching' in low:
        d.line((170,590,850,590),fill=wood,width=15); person(d,260,360,.9,(119,155,177)); person(d,760,360,.9,(188,142,139)); d.line((340,520,610,590),fill=ink,width=8); d.line((680,520,610,590),fill=ink,width=8)
    elif 'path' in low or 'meeting' in low or 'greeting' in low:
        d.polygon([(180,760),(430,440),(600,440),(850,760)],fill=(187,206,184,120)); person(d,360,330,.95,(115,153,176)); person(d,650,330,.95,(190,143,139)); d.line((420,520,590,520),fill=ink,width=9)
    elif 'study' in low or 'books' in low or 'researcher' in low or 'clipboard' in low:
        d.rectangle((200,500,820,690),fill=wood,outline=ink,width=5); d.rectangle((400,370,620,560),fill=(250,248,235,230),outline=ink,width=4)
        for y in [420,460,500]: d.line((435,y,585,y),fill=(116,141,155,150),width=6)
        person(d,300,285,.95,(117,153,165));
    elif 'carry' in low:
        person(d,500,280,1.05,(184,140,145));
        for i in range(4): d.rounded_rectangle((390,470-i*55,610,555-i*55),12,fill=(214,185,133,220),outline=ink,width=4)
    else:
        for i,x in enumerate([280,510,740]): person(d,x,390,.85,PALETTE[(seed+i)%len(PALETTE)],'sit')
        d.ellipse((180,500,840,750),fill=wood,outline=ink,width=5)
    # loose pencil accents and botanical details
    for x in [90,930]:
        d.line((x,760,x-10,500),fill=green,width=7); d.ellipse((x-35,500,x+18,560),fill=green,width=120)
    im=im.filter(ImageFilter.GaussianBlur(0.35)).convert('RGB')
    return im

def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()

def main():
    OUT.mkdir(parents=True,exist_ok=True); records=[]
    def make(aid,filename,cat,scene,wide=False):
        p=OUT/filename; img=scene_image(scene,scene,abs(hash(aid))%100000,wide); img=img.resize((1600,900) if wide else (1024,1024),Image.Resampling.LANCZOS); img.save(p,'PNG',optimize=True)
        records.append({'asset_id':aid,'file':filename,'category':cat,'status':'candidate_pending_review','can_enter_ppt':False,'sha256':sha(p),'source_kind':'generated_raster','style_match_target':'finalized_l01_l06_raster_illustration','scene':scene})
    make('L10-cover','lesson-10-cover-gathering.png','cover',SCENES['聚餐'],True)
    make('L10-context-01','lesson-10-context-01.png','short_text_context','students arranging a Friday evening Sichuan restaurant gathering',True)
    make('L10-context-02','lesson-10-context-02.png','short_text_context','young people choosing a distinctive restaurant and sharing the meal cost',True)
    make('L10-context-03','lesson-10-context-03.png','short_text_context','friends enjoying a communal meal while talking and drawing closer',True)
    entries=json.loads((ROOT/'lessons/boya-quasi-intermediate-i/lesson-10/00-source/canonical-source.json').read_text())['sections'][0]['entries']
    for e in entries:
        word=e['word']; make(f"L10-V{int(e['no']):02d}",f"l10-vocab-dedicated-{int(e['no']):02d}.png",'vocabulary',SCENES.get(word,f'people demonstrating the meaning of {word}'))
    manifest=json.loads((OUT/'image-manifest.json').read_text())
    manifest['assets']=records; manifest['pending_assets']=[]
    manifest['approval_boundary']['generation_status']='draft_inputs_generated_pending_visual_review'
    manifest['approval_boundary']['license_status']='Generated local raster illustration candidates; release approval not claimed.'
    manifest['approval_boundary']['reason']='All required lesson-specific PNG candidates are generated and registered; visual/source review remains required.'
    (OUT/'image-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'assets_generated':len(records),'output':str(OUT),'status':manifest['approval_boundary']['generation_status']} ,ensure_ascii=False))
if __name__=='__main__': main()
