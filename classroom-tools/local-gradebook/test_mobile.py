"""Exercise authenticated LAN scoring against a private isolated database."""
import http.cookiejar
import json
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request
from pathlib import Path
from server import ROOT, lan_address


def main():
    directory = Path(tempfile.mkdtemp(prefix='qa-mobile-', dir=ROOT / 'private'))
    seed = json.loads((ROOT / 'private/seed.json').read_text())
    (directory / 'seed.json').write_text(json.dumps(seed))
    process = subprocess.Popen([sys.executable, str(ROOT / 'server.py'), '--port', '8769', '--data-dir', str(directory)], stdout=subprocess.DEVNULL)
    local = 'http://127.0.0.1:8769'
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    phone = urllib.request.build_opener(urllib.request.ProxyHandler({}), urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))

    def read(client, url, **kwargs):
        try:
            with client.open(urllib.request.Request(url, **kwargs), timeout=3) as response:
                body = response.read()
                return response.status, json.loads(body) if response.headers.get_content_type() == 'application/json' else body
        except urllib.error.HTTPError as error:
            return error.code, error.read()

    try:
        for _ in range(50):
            try:
                status, info = read(opener, local + '/api/mobile')
                break
            except OSError:
                time.sleep(.1)
        else:
            raise AssertionError('Server did not start')
        assert status == 200 and lan_address(), 'Connect Mac to Wi-Fi for LAN integration test'
        assert info['qr'].startswith('data:image/png;base64,')
        remote = 'http://' + lan_address() + ':8769'
        for path in ('/', '/api/state', '/api/catalog', '/api/export?class=LT_02', '/api/backups', '/api/health'):
            assert read(opener, remote + path)[0] == 403, path
        assert read(phone, remote + '/connect?key=bad')[0] == 403
        assert read(phone, remote + '/connect?key=%E9%94%99')[0] == 403
        assert read(phone, info['url'])[0] == 200
        assert read(phone, remote + '/api/mobile')[0] == 403
        status, current = read(phone, remote + '/api/state')
        assert status == 200
        state = current['state']
        cls = state['classes'][0]
        exam = cls['assessments'][0]
        data = {'revision': state['revision'], 'class_id': cls['id'], 'assessment_id': exam['id'], 'student_code': cls['students'][0]['code'], 'status': 'done', 'scores': [c['max'] for c in exam['rubric']], 'note': 'mobile isolated test', 'review_confirmed': True}
        headers = {'Content-Type': 'application/json', 'X-Gradebook-Token': current['token'], 'Origin': remote}
        payload = json.dumps(data).encode()
        assert read(opener, remote + '/api/save', data=payload, headers=headers)[0] == 403
        assert read(phone, remote + '/api/save', data=payload, headers={**headers, 'Origin': 'http://untrusted.example'})[0] == 403
        assert read(phone, remote + '/api/save', data=payload, headers={**headers, 'X-Gradebook-Token': 'bad'})[0] == 403
        assert read(phone, remote + '/api/save', data=payload, headers=headers)[0] == 200
        _, saved = read(opener, local + '/api/state')
        key = '|'.join([data['class_id'], data['assessment_id'], data['student_code']])
        assert saved['state']['records'][key]['note'] == data['note']
        assert read(phone, remote + '/api/save', data=payload, headers=headers)[0] == 400, 'Stale page must not overwrite'
        assert read(phone, remote + '/api/state', headers={'Host': 'untrusted.example:8769'})[0] == 403
        print('PASS: LAN authentication, shared saved grade, Host/Origin/token protection, stale-page protection; real grades untouched')
    finally:
        process.terminate()
        process.wait(timeout=5)


if __name__ == '__main__':
    main()
