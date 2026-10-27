# 手机评分二维码验证（2026-10-26）

- 范围：classroom-tools/local-gradebook；无课次身份或教材 authority 变更。
- 现有手机入口复用 `/api/mobile` 返回的同一局域网专属链接；二维码仅在本机请求中生成，图像和链接不写入本验证记录。
- `python3 -m unittest test_network.py`：3 个测试通过；比较返回 PNG 与同一链接生成的 PNG。
- `test_gradebook.py`、`test_mobile.py`：隔离资料测试通过。原固定 8768/8769 端口已被其他 Python 服务占用，因此在进程内仅将测试端口替换为 8868/8869 执行；没有修改测试文件或这些服务。
- `node --check web/app.js`、`node test_ui.cjs`、`python3 -m py_compile server.py`：通过。
- 已确认原 8765 服务没有已建立连接，停止后启动新版本；实际 `/api/mobile` 读回局域网链接及 PNG 二维码。真实成绩未由测试修改。
- 限制：未用实体手机或 iPad 在实际 Wi-Fi 上扫码；校园网络若禁止设备互访，移动设备仍无法连接。
