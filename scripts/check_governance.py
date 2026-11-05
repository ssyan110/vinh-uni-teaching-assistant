#!/usr/bin/env python3
"""Read-only regression checks for active project routing and registry consistency."""
import json
from pathlib import Path
from check_project_readiness import check

ROOT = Path(__file__).resolve().parents[1]

def check_governance(root):
    failures = []
    pairs = [
        ('.codex/skills/ai-teaching-material-systems/SKILL.md', 'name: vinh-teaching-materials'),
        ('.codex/steering/agent-routing.md', 'check_project_readiness.py'),
        ('docs/ai-teaching-material-system-requirements-context.md', 'Historical classic-system specification'),
        ('docs/ai-teaching-material-system-requirements-context.html', 'Historical classic-system specification'),
        ('docs/workflow/canonical-workflow-contract.md', 'absent from this checkout'),
    ]
    for name, expected in pairs:
        try:
            if expected not in (root / name).read_text():
                failures.append(f'{name}: missing current scope marker {expected!r}')
        except OSError as error:
            failures.append(str(error))
    native = check(root, 'native')
    failures.extend(native['missing'])
    return {'status': 'blocked' if failures else 'pass', 'failures': failures,
            'write_performed': False, 'production_authorized': False,
            'scope': 'routing markers and workspace registry; capability, content, visual and release checks remain separate'}

if __name__ == '__main__':
    result = check_governance(ROOT)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    raise SystemExit(result['status'] != 'pass')
