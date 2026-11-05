#!/usr/bin/env python3
"""Create a source-only verification kit; never package teaching artifacts or approvals."""
import argparse
import hashlib
import json
from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parents[1]

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', required=True, help='New project-relative ZIP path')
    args = parser.parse_args()
    from workflow_integrity import resolve_relative_path
    output, _ = resolve_relative_path(ROOT, args.output)
    if output.exists():
        raise FileExistsError('Refusing to overwrite ' + str(output))
    spec = json.loads((ROOT / 'tools/workflow-verification/manifest.json').read_text())
    entries = {}
    for name in spec['files']:
        path, relative = resolve_relative_path(ROOT, name)
        if not path.is_file():
            raise FileNotFoundError(name)
        entries[relative] = path.read_bytes()
    checksums = {name: hashlib.sha256(data).hexdigest() for name, data in sorted(entries.items())}
    output.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(output, 'x', compression=zipfile.ZIP_DEFLATED) as archive:
        for name, data in sorted(entries.items()):
            archive.writestr(name, data)
        archive.writestr('SOURCE-SHA256.json', json.dumps(checksums, indent=2) + '\n')
        # Only identity-resolution tests need these directories. They contain no lesson content.
        registry = json.loads(entries['course/lesson-registry.json'])
        for lesson in registry['lessons']:
            name = lesson['lesson_path'] + '/WORKFLOW-TEST-PLACEHOLDER.txt'
            resolve_relative_path(ROOT, name)
            archive.writestr(name, 'Identity directory for synthetic workflow tests only. No teaching source or approval is included.\n')
    print(json.dumps({'archive': str(output), 'files': len(entries),
                      'sha256': hashlib.sha256(output.read_bytes()).hexdigest(),
                      'scope': 'code, governance, identity metadata and synthetic tests; local teaching inputs excluded'}, indent=2))

if __name__ == '__main__':
    main()
