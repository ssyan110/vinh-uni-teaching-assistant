"""Network changes must never require a gradebook restart."""
import unittest
import base64
import io
import qrcode
from unittest.mock import patch
from types import SimpleNamespace
from server import Handler


class NetworkRecoveryTests(unittest.TestCase):
    def handler(self, host):
        handler = object.__new__(Handler)
        handler.headers = {'Host': host}
        handler.server = SimpleNamespace(server_port=8765, allowed_hosts={'127.0.0.1:8765', '192.168.1.10:8765'})
        return handler

    @patch('server.lan_address', return_value='192.168.2.20')
    def test_changed_address_accepted_old_address_rejected(self, _):
        self.assertTrue(self.handler('192.168.2.20:8765').allowed())
        self.assertFalse(self.handler('192.168.1.10:8765').allowed())
        self.assertFalse(self.handler('evil.example:8765').allowed())

    @patch('server.lan_address', return_value=None)
    def test_offline_keeps_desktop_but_revokes_old_address(self, _):
        self.assertTrue(self.handler('127.0.0.1:8765').allowed())
        self.assertFalse(self.handler('192.168.1.10:8765').allowed())

    @patch('server.lan_address', return_value='192.168.2.20')
    def test_mobile_entry_recovers_and_preserves_session(self, _):
        handler = self.handler('127.0.0.1:8765')
        handler.path = '/api/mobile'
        handler.client_address = ('127.0.0.1', 1234)
        handler.server.access_key = 'test-session'
        replies = []
        handler.send = lambda status, body: replies.append((status, body))
        handler.do_GET()
        self.assertEqual(len(replies), 1)
        status, body = replies[0]
        self.assertEqual(status, 200)
        expected_url = 'http://192.168.2.20:8765/connect?key=test-session'
        self.assertEqual(body['url'], expected_url)
        self.assertTrue(body['qr'].startswith('data:image/png;base64,'))
        expected_image = io.BytesIO()
        qrcode.make(expected_url).save(expected_image, format='PNG')
        self.assertEqual(base64.b64decode(body['qr'].split(',', 1)[1]), expected_image.getvalue())


if __name__ == '__main__':
    unittest.main()
