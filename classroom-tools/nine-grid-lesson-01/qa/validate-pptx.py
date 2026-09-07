import argparse,json,hashlib,zipfile,xml.etree.ElementTree as ET
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--source-root',type=Path,required=True);args=p.parse_args()
app=Path(__file__).resolve().parents[1]
ns={'a':'http://schemas.openxmlformats.org/drawingml/2006/main'}
count=0
for source in json.loads((app/'docs/source-snapshot.json').read_text()):
    file=args.source_root/source['pptx_file']
    assert hashlib.sha256(file.read_bytes()).hexdigest()==source['pptx_sha256'],file
    with zipfile.ZipFile(file) as z:
        for prompt in source['pptx_examples']:
            for ref in prompt['source_refs']:
                paras=ET.fromstring(z.read(ref['xml'])).findall('.//a:p',ns)
                text=''.join(n.text or '' for n in paras[ref['paragraph_index']].findall('.//a:t',ns))
                assert text==ref['raw_paragraph'] and prompt['prompt'] in text
                count+=1
print(f'PPTX verified: {count} source occurrences match slide paragraphs in twelve read-only PPTX files.')
