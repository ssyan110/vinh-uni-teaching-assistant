#!/usr/bin/env python3
"""Generate one independent, text-free semantic SVG/PNG per vocabulary item.

These are draft teaching assets, not source illustrations. Every output has a
unique lesson/ordinal filename so the PPT builder cannot silently reuse an
unrelated image.
"""
from pathlib import Path
import subprocess
import json

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / 'lessons' / 'boya-quasi-intermediate-i'

SCENES = {
6: ['piano','choir','theater','orchestra','hospital','piano_action','translation','degree','formal','speech_rate','replace','full_day','busy','rehearsal','after_work_hobby','hobby','graduate_student','outgoing','optimistic','equal','dream','great_artist','writer','artwork','pronunciation'],
8: ['soldier','battle','training','attack','strategist','record','general','power','strategy','lose_battle','finish','open_course','lead_soldiers','strict_discipline','according','past','display','wife','formulate','laughing','serious','according_to_rule','military_law','punishment','sad','appoint','win_battle','already','defeat','sunzi','art_of_war'],
10: ['clothes','tidy','discuss','bump','internship','agree','chef','income','social','expense','split_bill','survey','homework','same_hometown','ordinary','spend','burden','invite','increase','feature','proportion','behavior','enjoy_food','distance','pursue','harmony','get_along'],
}

COLORS = ['#A9C8D8','#D9958E','#F0C96E','#B18BD4','#B9D6B1']

def svg(scene, i):
    c = COLORS[i % len(COLORS)]
    # Simple, distinct semantic pictograms in the same restrained textbook
    # palette; no text is placed in any asset.
    shapes = {
      'piano': '<rect x="230" y="280" width="260" height="45" rx="8" fill="#D8B27D"/><path d="M250 280v45m35-45v45m35-45v45m35-45v45m35-45v45m35-45v45" stroke="#6B7D82" stroke-width="6"/>',
      'choir': '<circle cx="220" cy="190" r="30" fill="#F2C7A7"/><circle cx="320" cy="165" r="30" fill="#F2C7A7"/><circle cx="420" cy="190" r="30" fill="#F2C7A7"/><path d="M180 320q40-100 80 0m20-125q40-100 80 0m20 125q40-100 80 0" fill="none" stroke="#6B7D82" stroke-width="18"/>',
      'theater': '<rect x="170" y="125" width="300" height="180" fill="#D9958E"/><path d="M170 125q60 70 0 180m300-180q-60 70 0 180" fill="none" stroke="#6B7D82" stroke-width="16"/><circle cx="270" cy="220" r="23" fill="#F2C7A7"/><circle cx="370" cy="220" r="23" fill="#F2C7A7"/>',
      'orchestra': '<circle cx="320" cy="155" r="25" fill="#F2C7A7"/><path d="M220 300q100-120 200 0M270 280v-70m50 70v-70m50 70v-70" fill="none" stroke="#6B7D82" stroke-width="16"/>',
      'hospital': '<rect x="245" y="150" width="150" height="130" fill="#fff" stroke="#6B7D82" stroke-width="8"/><path d="M290 215h60m-30-30v60" stroke="#D9958E" stroke-width="14"/><circle cx="190" cy="175" r="28" fill="#F2C7A7"/><path d="M150 310q40-90 80 0" fill="none" stroke="#6B7D82" stroke-width="18"/>',
      'piano_action': '<rect x="220" y="285" width="250" height="40" fill="#D8B27D"/><circle cx="320" cy="145" r="32" fill="#F2C7A7"/><path d="M245 270q75-120 150 0M280 210l-35 65m95-65 35 65" fill="none" stroke="#6B7D82" stroke-width="16"/>',
      'translation': '<rect x="150" y="155" width="135" height="120" fill="#fff" stroke="#6B7D82" stroke-width="8"/><rect x="355" y="155" width="135" height="120" fill="#fff" stroke="#6B7D82" stroke-width="8"/><path d="M300 215h55m-20-25 25 25-25 25" fill="none" stroke="#D9958E" stroke-width="12"/>',
      'degree': '<circle cx="320" cy="145" r="35" fill="#F2C7A7"/><path d="M230 320q90-150 180 0" fill="none" stroke="#6B7D82" stroke-width="20"/><path d="M250 185h140v70H250z" fill="#fff" stroke="#6B7D82" stroke-width="8"/>',
      'formal': '<circle cx="320" cy="125" r="30" fill="#F2C7A7"/><path d="M250 310l25-140h90l25 140" fill="#A9C8D8" stroke="#6B7D82" stroke-width="8"/>',
      'speech_rate': '<circle cx="320" cy="145" r="30" fill="#F2C7A7"/><path d="M240 300q80-120 160 0M390 180q40 25 0 50m35-70q70 45 0 90" fill="none" stroke="#6B7D82" stroke-width="12"/>',
      'replace': '<circle cx="235" cy="155" r="28" fill="#F2C7A7"/><circle cx="405" cy="155" r="28" fill="#F2C7A7"/><path d="M180 300q55-110 110 0m60 0q55-110 110 0M275 205h90m-25-25 25 25-25 25" fill="none" stroke="#6B7D82" stroke-width="15"/>',
      'full_day': '<circle cx="320" cy="150" r="28" fill="#F2C7A7"/><path d="M235 310q85-120 170 0M210 125h70m80 0h70" stroke="#6B7D82" stroke-width="14" fill="none"/>',
      'busy': '<circle cx="320" cy="140" r="28" fill="#F2C7A7"/><path d="M240 310q80-120 160 0M160 160h60m200 0h60M180 240h70m220 0h-70" stroke="#6B7D82" stroke-width="13" fill="none"/>',
      'rehearsal': '<circle cx="320" cy="120" r="25" fill="#F2C7A7"/><path d="M220 300q100-130 200 0M285 180l-35 70m70-70 35 70" stroke="#6B7D82" stroke-width="15" fill="none"/>',
      'after_work_hobby': '<rect x="350" y="220" width="120" height="80" fill="#D8B27D"/><circle cx="230" cy="150" r="28" fill="#F2C7A7"/><path d="M170 300q60-120 120 0" stroke="#6B7D82" stroke-width="16" fill="none"/>',
      'hobby': '<circle cx="320" cy="170" r="55" fill="'+c+'" stroke="#6B7D82" stroke-width="8"/><path d="M290 170h60m-30-30v60" stroke="#fff" stroke-width="10"/>',
      'graduate_student': '<rect x="200" y="190" width="240" height="100" fill="#fff" stroke="#6B7D82" stroke-width="8"/><circle cx="320" cy="130" r="28" fill="#F2C7A7"/><path d="M240 320q80-100 160 0" stroke="#6B7D82" stroke-width="16" fill="none"/>',
      'outgoing': '<circle cx="320" cy="150" r="30" fill="#F2C7A7"/><path d="M240 310q80-120 160 0M180 185h80m200 0h-80" stroke="#6B7D82" stroke-width="14" fill="none"/>',
      'optimistic': '<circle cx="320" cy="160" r="45" fill="#F2C7A7"/><path d="M270 250q50 45 100 0M320 110V55m-65 80-40-35m170 35 40-35" stroke="#6B7D82" stroke-width="10" fill="none"/>',
      'equal': '<path d="M200 210h240M250 250h140M270 160h100" stroke="#6B7D82" stroke-width="16" fill="none"/>',
      'dream': '<circle cx="320" cy="210" r="80" fill="#fff" stroke="#6B7D82" stroke-width="8"/><path d="M270 230q50-80 100 0" stroke="#B18BD4" stroke-width="12" fill="none"/>',
      'great_artist': '<circle cx="320" cy="130" r="30" fill="#F2C7A7"/><path d="M245 310q75-140 150 0M250 180h140" stroke="#6B7D82" stroke-width="16" fill="none"/>',
      'writer': '<rect x="220" y="210" width="200" height="110" fill="#fff" stroke="#6B7D82" stroke-width="8"/><circle cx="320" cy="130" r="28" fill="#F2C7A7"/><path d="M285 205l70 0" stroke="#D9958E" stroke-width="10"/>',
      'artwork': '<rect x="220" y="130" width="200" height="170" fill="#F0C96E" stroke="#6B7D82" stroke-width="8"/><circle cx="285" cy="195" r="25" fill="#A9C8D8"/><path d="M250 270l55-60 35 35 35-55 35 80" fill="none" stroke="#6B7D82" stroke-width="8"/>',
      'pronunciation': '<circle cx="270" cy="150" r="28" fill="#F2C7A7"/><circle cx="390" cy="150" r="28" fill="#F2C7A7"/><path d="M220 300q50-110 100 0m20 0q50-110 100 0M315 205h50" stroke="#6B7D82" stroke-width="14" fill="none"/>',
    }
    base = shapes.get(scene)
    if base is None:
        groups = {
          'soldier','battle','attack','lose_battle','lead_soldiers','win_battle','defeat','military_law','punishment'
        }
        books = {'record','according','past','display','formulate','open_course','art_of_war'}
        people = {'general','wife','appoint','serious','strict_discipline','laughing','sad'}
        if scene in groups:
            base = '<path d="M260 300l60-150 60 150M285 235h70" stroke="#6B7D82" stroke-width="20" fill="none"/><circle cx="320" cy="115" r="28" fill="#F2C7A7"/>'
        elif scene in books:
            base = '<path d="M150 290q85-35 170 0V150q-85-35-170 0zm170 0q85-35 170 0V150q-85-35-170 0" fill="#fff" stroke="#6B7D82" stroke-width="8"/>'
        elif scene in people:
            base = '<circle cx="250" cy="150" r="28" fill="#F2C7A7"/><circle cx="390" cy="150" r="28" fill="#F2C7A7"/><path d="M190 310q60-120 120 0m20 0q60-120 120 0" stroke="#6B7D82" stroke-width="16" fill="none"/>'
        elif scene in {'training','strategy','power','according_to_rule','already','finish','end'}:
            base = '<rect x="205" y="145" width="230" height="150" rx="14" fill="'+c+'" stroke="#6B7D82" stroke-width="8"/><path d="M250 205h140m-140 45h90" stroke="#fff" stroke-width="12"/>'
        elif scene in {'clothes','tidy','formal','ordinary'}:
            base = '<circle cx="320" cy="120" r="28" fill="#F2C7A7"/><path d="M245 315l20-150h110l20 150" fill="'+c+'" stroke="#6B7D82" stroke-width="8"/>'
        elif scene in {'discuss','social','survey','same_hometown','get_along','harmony','invite','pursue'}:
            base = '<circle cx="235" cy="155" r="28" fill="#F2C7A7"/><circle cx="405" cy="155" r="28" fill="#F2C7A7"/><path d="M175 310q60-120 120 0m60 0q60-120 120 0M275 205h90" stroke="#6B7D82" stroke-width="14" fill="none"/>'
        elif scene in {'bump','distance'}:
            base = '<circle cx="230" cy="150" r="28" fill="#F2C7A7"/><circle cx="410" cy="150" r="28" fill="#F2C7A7"/><path d="M270 230h100m-25-25 25 25-25 25" stroke="#D9958E" stroke-width="12" fill="none"/>'
        elif scene in {'chef','food','enjoy_food'}:
            base = '<path d="M190 260q130 100 260 0" fill="#F3C6A5" stroke="#6B7D82" stroke-width="8"/><path d="M250 220v-70m70 70v-70m70 70v-70" stroke="#6B7D82" stroke-width="12"/>'
        elif scene in {'income','expense','spend','burden','proportion','increase'}:
            base = '<rect x="220" y="145" width="200" height="150" fill="#fff" stroke="#6B7D82" stroke-width="8"/><path d="M260 245l40-45 35 25 50-70" stroke="#D9958E" stroke-width="12" fill="none"/>'
        else:
            base = '<circle cx="320" cy="210" r="80" fill="'+c+'" stroke="#6B7D82" stroke-width="8"/>'
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="1254" height="1254" viewBox="0 0 640 420"><rect width="640" height="420" fill="#FBF5E8"/>{base}</svg>'''

def make(lesson, scenes):
    out = BASE / f'lesson-{lesson:02d}/10-design/assets'
    out.mkdir(parents=True, exist_ok=True)
    for i, scene_name in enumerate(scenes, 1):
        svg_path = out / f'l{lesson:02d}-vocab-dedicated-{i:02d}.svg'
        png_path = out / f'l{lesson:02d}-vocab-dedicated-{i:02d}.png'
        svg_path.write_text(svg(scene_name, i), encoding='utf-8')
        subprocess.run(['rsvg-convert', '-w', '1254', '-h', '823', '-o', str(png_path), str(svg_path)], check=True)
    (out / 'dedicated-vocabulary-assets.json').write_text(json.dumps({
        'lesson_key': f'boya-quasi-intermediate-i:lesson-{lesson:02d}',
        'status': 'generated_draft_pending_visual_and_source_approval',
        'generation': 'independent_semantic_vector_illustration',
        'assets': [{'ordinal': i, 'scene': scene, 'file': f'l{lesson:02d}-vocab-dedicated-{i:02d}.png', 'one_to_one': True} for i, scene in enumerate(scenes, 1)]
    }, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

for lesson, scenes in SCENES.items(): make(lesson, scenes)
