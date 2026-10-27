#!/usr/bin/env python3
"""Verify one registered classroom draft, then optionally sync/build its preview.

This orchestrates existing copy-approval, page-contract, browser and sync checks;
it never approves content or promotes a draft to authority/release.
"""
import argparse
import json
from pathlib import Path
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]


def run(command, cwd=ROOT):
    print('+ ' + ' '.join(map(str, command)), flush=True)
    subprocess.run(list(map(str, command)), cwd=cwd, check=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--deck-id', required=True)
    parser.add_argument('--sync', action='store_true', help='Refresh generated workspace previews after verification')
    parser.add_argument('--build', action='store_true', help='Build the existing workspace; its prebuild performs guarded sync')
    args = parser.parse_args()
    registry = json.loads((ROOT / 'course/open-slide-workspace.json').read_text())
    deck = next((d for d in registry['html_decks'] if d['id'] == args.deck_id), None)
    if deck is None:
        parser.error('Unknown registered deck id')
    profile = deck.get('visual_check', {})
    if not profile.get('content_contract') or not profile.get('rendered_layout_report'):
        parser.error('This command needs a current per-deck content contract and rendered report path')
    def local(value):
        p = (ROOT / value).resolve()
        if not p.is_relative_to(ROOT) or p == ROOT:
            parser.error('All inputs and QA outputs must be below the project root')
        return p
    source, contract_path = local(deck['source']), local(profile['content_contract'])
    report = local(profile['rendered_layout_report'])
    if not report.parent.is_relative_to(source.parent):
        parser.error('Rendered QA output must be inside the owning lesson draft directory')
    contract = json.loads(contract_path.read_text())
    # Validate identity, protected output location and existing copy approvals
    # before the renderer writes any QA files.
    sys.path.insert(0, str(ROOT / 'scripts'))
    from sync_open_slide_workspace import check_registered_identity
    check_registered_identity(deck, source, profile, contract)
    print('PASS: registered lesson/source identity and copy approvals', flush=True)
    run([sys.executable, ROOT / 'scripts/check_open_slide_visual_consistency.py', '--deck', source,
         '--contract', contract_path, '--expected-route-cards', profile['expected_route_cards'],
         '--expected-route-columns', profile['expected_route_columns']])
    node = shutil.which('node')
    if node is None:
        parser.error('Installed Node.js is unavailable; browser verification did not run')
    run([node, ROOT / 'scripts/check_open_slide_rendered_layout.cjs', '--deck', source,
         '--contract', contract_path, '--output-dir', report.parent, '--self-test'])
    if args.build:
        npm = shutil.which('npm')
        if npm is None:
            parser.error('Installed npm is unavailable; workspace build did not run')
        run([npm, 'run', 'build'], local(registry['workspace']))
    else:
        command = [sys.executable, ROOT / 'scripts/sync_open_slide_workspace.py']
        if not args.sync:
            command.append('--check-only')
        run(command)
    print('PASS: current draft copy, identity, browser evidence and requested preview checks; no approval/release promotion')


if __name__ == '__main__':
    try:
        main()
    except (subprocess.CalledProcessError, ValueError, OSError, KeyError) as error:
        print(f'FAIL: {error}', file=sys.stderr)
        raise SystemExit(1)
