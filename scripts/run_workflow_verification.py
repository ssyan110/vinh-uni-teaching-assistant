#!/usr/bin/env python3
"""Run synthetic workflow integration tests, retaining every fixture inside this checkout."""
import json
import os
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[1]

def main():
    output = ROOT / '.agent/runs' / ('workflow-verification-' + datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ'))
    output.mkdir(parents=True, exist_ok=False)
    tempfile.tempdir = str(output)
    os.environ['TMPDIR'] = str(output)
    sys.path[:0] = [str(ROOT / 'scripts'), str(ROOT / 'tests')]
    suite = unittest.defaultTestLoader.discover(str(ROOT / 'tests'), pattern='test_*.py')
    with (output / 'tests.txt').open('w') as log:
        # Fixtures are evidence, not production data. No recursive deletion occurs.
        with patch('shutil.rmtree', lambda *args, **kwargs: None):
            result = unittest.TextTestRunner(stream=log, verbosity=2).run(suite)
    summary = {'tests': result.testsRun, 'failures': len(result.failures), 'errors': len(result.errors),
               'skipped': len(result.skipped), 'successful': result.wasSuccessful(),
               'evidence': str(output.relative_to(ROOT)), 'fixtures': 'synthetic; retained',
               'human_approval_created': False}
    (output / 'result.json').write_text(json.dumps(summary, indent=2) + '\n')
    print(json.dumps(summary, indent=2))
    if not result.wasSuccessful():
        print((output / 'tests.txt').read_text())
    return int(not result.wasSuccessful())

if __name__ == '__main__':
    raise SystemExit(main())
