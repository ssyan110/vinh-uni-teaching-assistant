from pathlib import Path
from urllib.parse import quote
from PIL import Image, ImageDraw, ImageFont

OUT = Path('/Users/ssyan110/Development/ai-teaching-material-system/output/lesson-1-full-kami/assets/strokes')
OUT.mkdir(parents=True, exist_ok=True)
SIZE = 220
BG = (250, 249, 245)
GRID = (216, 212, 199)
INK = (27, 54, 93)
RED = (184, 80, 66)

# Rough classroom stroke-order animations for the Lesson 1 writing slide.
# These are generated local GIFs for stable HTML/PDF/PPTX export.
strokes = {
    '一': [[(50,110),(170,110)]],
    '八': [[(92,58),(66,160)], [(128,58),(164,160)]],
    '人': [[(118,54),(82,165)], [(118,86),(164,165)]],
    '大': [[(55,92),(170,92)], [(112,50),(112,168)], [(112,98),(68,168)], [(112,98),(168,168)]],
    '口': [[(70,62),(70,162)], [(70,62),(158,62)], [(158,62),(158,162)], [(70,162),(158,162)]],
    '女': [[(116,48),(84,154)], [(84,154),(166,86)], [(58,128),(168,128)]],
}

def frame_for(ch, upto_stroke, progress):
    im = Image.new('RGB', (SIZE, SIZE), BG)
    d = ImageDraw.Draw(im)
    # grid
    for x in [0, SIZE//2, SIZE-1]: d.line([(x, 20),(x, SIZE-20)], fill=GRID, width=1)
    for y in [20, SIZE//2, SIZE-20]: d.line([(20, y),(SIZE-20, y)], fill=GRID, width=1)
    d.rectangle([20,20,SIZE-20,SIZE-20], outline=GRID, width=2)
    for i, pts in enumerate(strokes[ch]):
        color = INK if i < upto_stroke else RED
        if i < upto_stroke:
            d.line(pts, fill=INK, width=10, joint='curve')
        elif i == upto_stroke:
            # reveal current stroke progressively
            p0, p1 = pts[0], pts[-1]
            x = p0[0] + (p1[0]-p0[0]) * progress
            y = p0[1] + (p1[1]-p0[1]) * progress
            d.line([p0,(x,y)], fill=RED, width=10)
            break
    return im

for ch in strokes:
    frames=[]
    for i in range(len(strokes[ch])):
        for step in range(1,7):
            frames.append(frame_for(ch, i, step/6))
    frames += [frame_for(ch, len(strokes[ch]), 1)] * 5
    raw = OUT / f'{ch}.gif'
    frames[0].save(raw, save_all=True, append_images=frames[1:], duration=130, loop=0)
    encoded = OUT / f'{quote(ch)}.gif'
    if encoded != raw:
        encoded.write_bytes(raw.read_bytes())
print(f'Wrote {len(strokes)} stroke GIFs to {OUT}')
