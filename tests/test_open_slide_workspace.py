import base64
import importlib.util
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('workspace_sync', ROOT / 'scripts/sync_open_slide_workspace.py')
sync = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sync)


class WorkspaceSyncTest(unittest.TestCase):
    def test_only_requested_page_loads_its_images(self):
        with tempfile.TemporaryDirectory(dir=ROOT / 'tests') as directory:
            root = Path(directory)
            (root / 'first.png').write_bytes(b'first')
            (root / 'second.png').write_bytes(b'second')
            source = root / 'deck.html'
            source.write_text('<div class="os-page"><img src="first.png"></div>\n'
                              '<section class="task os-page" hidden><img src="second.png"></section>')
            html = sync.embed_images(source, 1)
            self.assertNotIn(base64.b64encode(b'first').decode(), html)
            self.assertIn(base64.b64encode(b'second').decode(), html)

    def test_images_and_path_escape(self):
        with tempfile.TemporaryDirectory(dir=ROOT / 'tests') as directory:
            root = Path(directory)
            (root / 'image.png').write_bytes(b'png')
            source = root / 'deck.html'
            source.write_text('<img src="image.png"><img src="data:image/png;base64,YQ==">')
            html = sync.embed_images(source)
            self.assertIn('data:image/png;base64,cG5n', html)
            self.assertIn('data:image/png;base64,YQ==', html)
            source.write_text('<img src="../outside.png">')
            with self.assertRaises(ValueError):
                sync.embed_images(source)


if __name__ == '__main__':
    unittest.main()
