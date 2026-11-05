#!/usr/bin/env python3
"""Read-only capability preflight. Missing dependencies never authorize substitutes."""
import argparse
import json
import subprocess
import sys
from pathlib import Path
from workflow_integrity import resolve_relative_path

ROOT = Path(__file__).resolve().parents[1]
CAPABILITIES = {
    'online': ['course/boya-example-bank.json', 'course/boya-online-content-contract.json', 'course/ppt-style-registry.json', 'scripts/build_scoped_online_pptx.py', 'scripts/online_ppt_release.py', 'scripts/render_reference_online_pptx.py', 'scripts/verify_pptx_audio_policy.py'],
    'assessment-audio': ['scripts/assessment_audio_gate.py'],
    'native': ['course/open-slide-workspace.json', 'scripts/production_gate.py'],
}

def check(root, capability):
    missing = []
    for name in CAPABILITIES[capability]:
        try:
            path, _ = resolve_relative_path(root, name)
            if not path.is_file():
                missing.append(name)
        except ValueError:
            missing.append(name)
    if capability == 'native' and not missing:
        try:
            registry = json.loads((root / 'course/open-slide-workspace.json').read_text())
            config = json.loads((root / 'project.config.json').read_text())
            if registry.get('workspace') != config.get('open_slide_workspace'):
                missing.append('workspace registry/config agreement')
            seen = set()
            for deck in registry.get('native_decks', []) + registry.get('html_decks', []):
                if deck['id'] in seen:
                    missing.append('unique deck ID: ' + deck['id'])
                seen.add(deck['id'])
                path, _ = resolve_relative_path(root, deck['source'])
                if not path.exists():
                    missing.append(deck['source'])
        except (OSError, ValueError, KeyError, TypeError) as error:
            missing.append('workspace registry validation: ' + str(error))
    runtime_errors = []
    modules = {'online': ['build_scoped_online_pptx', 'render_reference_online_pptx', 'online_ppt_release'],
               'assessment-audio': ['assessment_audio_gate'], 'native': ['production_gate']}[capability]
    if not missing:
        code = "import sys,importlib;sys.path.insert(0,sys.argv[1]);[importlib.import_module(m) for m in sys.argv[2:]]"
        try:
            result = subprocess.run([sys.executable, '-B', '-c', code, str(root / 'scripts'), *modules],
                                    cwd=root, capture_output=True, text=True, timeout=30)
            if result.returncode:
                runtime_errors.append(result.stderr.strip().splitlines()[-1])
        except (OSError, subprocess.TimeoutExpired) as error:
            runtime_errors.append(str(error))
    missing.extend('runtime: ' + error for error in runtime_errors)
    return {'capability': capability, 'status': 'blocked' if missing else 'inputs-and-runtime-present',
            'missing': missing, 'write_performed': False, 'production_authorized': False,
            'next_action': 'Inspect missing dependencies read-only on vinh-uni-main; do not infer approval or substitute another format' if missing else 'Run scoped production and artifact QA gates'}

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--capability', choices=[*CAPABILITIES, 'all'], default='all')
    args = parser.parse_args()
    results = [check(ROOT, name) for name in (CAPABILITIES if args.capability == 'all' else [args.capability])]
    print(json.dumps(results, ensure_ascii=False, indent=2))
    raise SystemExit(int(any(x['status'] == 'blocked' for x in results)))
