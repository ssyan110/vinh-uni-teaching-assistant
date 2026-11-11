"""Double-click launcher: reuse this app if running; otherwise run locally."""
import json
import subprocess
import sys
import urllib.error
import urllib.request
import webbrowser
from pathlib import Path

ROOT = Path(__file__).resolve().parent
URL = 'http://127.0.0.1:8765'

def main(desktop=False):
    try:
        with urllib.request.urlopen(URL + '/api/health', timeout=2) as response:
            health=json.load(response)
        if health.get('service') != 'vinh-local-gradebook':
            raise RuntimeError('8765 端口被其他程序占用，请先关闭该程序。')
        webbrowser.open(URL)
        print('评分 App 已在运行，已打开网页。')
        return
    except urllib.error.HTTPError:
        raise RuntimeError('8765 端口被其他程序占用，请先关闭该程序。')
    except urllib.error.URLError:
        pass
    if desktop:
        log_path = ROOT / 'private' / 'desktop-launch.log'
        log_path.parent.mkdir(exist_ok=True)
        with log_path.open('a') as log:
            process = subprocess.Popen([sys.executable, str(ROOT / 'server.py')], cwd=ROOT, stdin=subprocess.DEVNULL, stdout=log, stderr=log, start_new_session=True)
    else:
        process = subprocess.Popen([sys.executable, str(ROOT / 'server.py')], cwd=ROOT)
    try:
        import time
        for _ in range(50):
            if process.poll() is not None:
                raise RuntimeError('启动失败，请查看上方错误信息。')
            try:
                with urllib.request.urlopen(URL + '/api/health', timeout=1) as response:
                    health=json.load(response)
                if health.get('service') != 'vinh-local-gradebook':
                    raise RuntimeError('本机地址被其他程序占用。')
                webbrowser.open(URL)
                if desktop:
                    return
                print('保留这个终端窗口即可评分；按 Ctrl+C 关闭。')
                process.wait()
                return
            except urllib.error.URLError:
                time.sleep(.1)
        raise RuntimeError('启动超时，请查看终端错误信息。')
    except KeyboardInterrupt:
        print('\n评分 App 已关闭。')
    finally:
        if process.poll() is None and (not desktop or sys.exc_info()[0] is not None):
            process.terminate()
            process.wait(timeout=5)

if __name__ == '__main__':
    try:
        main(desktop='--desktop' in sys.argv)
    except Exception as error:
        print(str(error), file=sys.stderr)
        if '--desktop' not in sys.argv:
            input('按 Enter 关闭窗口。')
        sys.exit(1)
