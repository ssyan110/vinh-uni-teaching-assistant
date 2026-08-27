# QR 音频失败项重试报告

执行时间：2026-08-27 18:10:00 +0700
对象：原 inventory 中 download_status 非 passed 的 24 段；未修改原始审计快照 `qr-audio-inventory.json`。

| 课次 | 音频 | curl | 字节数 | ffprobe | SHA-256 与原记录 | 结果 |
|---:|---|---:|---:|---|---|---|
| 2 | 2-2 | 0 | 683353 | 通过 | 一致 | 成功保存 |
| 2 | 2-3 | 0 | 1869103 | 通过 | 一致 | 成功保存 |
| 2 | 2-4 | 0 | 1350834 | 通过 | 一致 | 成功保存 |
| 2 | 2-5 | 0 | 805815 | 通过 | 一致 | 成功保存 |
| 2 | 2-6 | 0 | 1041962 | 通过 | 一致 | 成功保存 |
| 3 | 3-1 | 0 | 991389 | 通过 | 一致 | 成功保存 |
| 3 | 3-2 | 0 | 645737 | 通过 | 一致 | 成功保存 |
| 3 | 3-3 | 0 | 1297741 | 通过 | 一致 | 成功保存 |
| 3 | 3-4 | 0 | 1107164 | 通过 | 一致 | 成功保存 |
| 3 | 3-5 | 0 | 1176127 | 通过 | 一致 | 成功保存 |
| 3 | 3-6 | 0 | 1136839 | 通过 | 一致 | 成功保存 |
| 4 | 4-1 | 0 | 824205 | 通过 | 一致 | 成功保存 |
| 4 | 4-2 | 0 | 530380 | 通过 | 一致 | 成功保存 |
| 4 | 4-3 | 0 | 1525541 | 通过 | 一致 | 成功保存 |
| 4 | 4-4 | 0 | 1125554 | 通过 | 一致 | 成功保存 |
| 4 | 4-5 | 0 | 981776 | 通过 | 一致 | 成功保存 |
| 4 | 4-6 | 0 | 1359193 | 通过 | 一致 | 成功保存 |
| 5 | 5-1 | 0 | 885645 | 通过 | 一致 | 成功保存 |
| 5 | 5-2 | 0 | 585551 | 通过 | 一致 | 成功保存 |
| 5 | 5-3 | 0 | 983030 | 通过 | 一致 | 成功保存 |
| 5 | 5-4 | 0 | 645737 | 通过 | 一致 | 成功保存 |
| 5 | 5-5 | 0 | 896512 | 通过 | 一致 | 成功保存 |
| 5 | 5-6 | 0 | 788261 | 通过 | 一致 | 成功保存 |
| 6 | 6-1 | 0 | 835908 | 通过 | 一致 | 成功保存 |

## 细节

- 2-2: returncode=0, elapsed=2.26s, url=https://tcv.clewm.net/f0ZhdfBuStBT1zwU3OUQUMDT9tQ=/FuOLWdJhJOaCfDAOhTGm555Y2Eiv
  - ffprobe: `format_name=mp3;duration=42.396735`
  - sha256: `5ad1a76dea86112f9a967a5d49ae124a7afbf01be77b0989bf8369dec2eed6fc`; inventory hash match=True; bytes match=True
- 2-3: returncode=0, elapsed=2.08s, url=https://tcv.clewm.net/f0ZhdfBuStBT1zwU3OUQUMDT9tQ=/Fn8_en5WTQpj8eLTt--rauvOi18M
  - ffprobe: `format_name=mp3;duration=116.506122`
  - sha256: `97b01a753c80a4b2ec850b0d0f60514c58e2455901dafc988958512de112a1db`; inventory hash match=True; bytes match=True
- 2-4: returncode=0, elapsed=2.44s, url=https://tcv.clewm.net/f0ZhdfBuStBT1zwU3OUQUMDT9tQ=/FtAmltELpWLKXr_R4mjQWl-aepsK
  - ffprobe: `format_name=mp3;duration=84.114286`
  - sha256: `7dcd2b8934ab85277744aad0e39c9aa039af7803adcceb33269469c096a80fa3`; inventory hash match=True; bytes match=True
- 2-5: returncode=0, elapsed=2.03s, url=https://tcv.clewm.net/f0ZhdfBuStBT1zwU3OUQUMDT9tQ=/FpZ_TqHXC83O_j9ELJ9jesJPS_D9
  - ffprobe: `format_name=mp3;duration=50.050612`
  - sha256: `44dbd41d3631363b7c998e91730a412e12b537a65a8f88ed09884a3483e2e957`; inventory hash match=True; bytes match=True
- 2-6: returncode=0, elapsed=1.69s, url=https://tcv.clewm.net/f0ZhdfBuStBT1zwU3OUQUMDT9tQ=/FmhttHW2y3TFGkjunvaqc9JRE7ek
  - ffprobe: `format_name=mp3;duration=64.809796`
  - sha256: `b59eb5af70b6928d11da243665eb8dd4e70d2dbef616f1a249816be6f1ab9265`; inventory hash match=True; bytes match=True
- 3-1: returncode=0, elapsed=1.53s, url=https://tcv.clewm.net/f0ZhdfBuStBT1zwU3OUQUMDT9tQ=/Ft1QDnBokZmWrRT5bCaMwcMVb2lq
  - ffprobe: `format_name=mp3;duration=61.648980`
  - sha256: `244ca28316b97f2ba6a3d71f24af09e49247f934d6b32665f25891f9818d0878`; inventory hash match=True; bytes match=True
- 3-2: returncode=0, elapsed=1.73s, url=https://tcv.clewm.net/f0ZhdfBuStBT1zwU3OUQUMDT9tQ=/FpwcUw7xm9WaPwY9Bj0I4XvFLM_h
  - ffprobe: `format_name=mp3;duration=40.045714`
  - sha256: `f152ee86a7432f5fc8f115b23ecfa575a8f0084a37ea50f6565e63a7a0417c6d`; inventory hash match=True; bytes match=True
- 3-3: returncode=0, elapsed=3.22s, url=https://tcv.clewm.net/f0ZhdfBuStBT1zwU3OUQUMDT9tQ=/FnnJlIJiOG8PJnO6NxdoPadP_LlD
  - ffprobe: `format_name=mp3;duration=80.796735`
  - sha256: `983613344869f0f5eb969c730f52f772f083c4d2320c993a45261c4a5654c276`; inventory hash match=True; bytes match=True
- 3-4: returncode=0, elapsed=1.68s, url=https://tcv.clewm.net/f0ZhdfBuStBT1zwU3OUQUMDT9tQ=/FmwI-DnIswYJnXjDoSnC_wZqaph9
  - ffprobe: `format_name=mp3;duration=68.884898`
  - sha256: `e0cee2a4a5be21321c2cc69897366d8b07f6bb1cda340a921640d55fc8ce250a`; inventory hash match=True; bytes match=True
- 3-5: returncode=0, elapsed=2.29s, url=https://tcv.clewm.net/f0ZhdfBuStBT1zwU3OUQUMDT9tQ=/Fv7MVgJrNF9A9IHOC5mKDVeFrtX3
  - ffprobe: `format_name=mp3;duration=73.195102`
  - sha256: `7fbb009795228f6cf7131d12627cb3c6418e2e9b4efde9ad7cae3589d0b3047d`; inventory hash match=True; bytes match=True
- 3-6: returncode=0, elapsed=1.7s, url=https://tcv.clewm.net/f0ZhdfBuStBT1zwU3OUQUMDT9tQ=/FiRgwv_YOo1SvKSarKiDiQ0QcX4y
  - ffprobe: `format_name=mp3;duration=70.739592`
  - sha256: `6ec0ccb21950db29dcaf971fbe7e097b5cc14d65ea2e3a5b3a9cccdd755c3e96`; inventory hash match=True; bytes match=True
- 4-1: returncode=0, elapsed=3.18s, url=https://tcv.clewm.net/f0ZhdfBuStBT1zwU3OUQUMDT9tQ=/Fuj6EZ_93nW0avU3822yEY3rVqPd
  - ffprobe: `format_name=mp3;duration=51.200000`
  - sha256: `46f02a4c825b2c0e1d08d5a35496fa34453142ec0c8ad2514f9a0e02c3e26797`; inventory hash match=True; bytes match=True
- 4-2: returncode=0, elapsed=1.54s, url=https://tcv.clewm.net/f0ZhdfBuStBT1zwU3OUQUMDT9tQ=/FmhgvlQy5pQj_wkq5NbGKsu8G2qJ
  - ffprobe: `format_name=mp3;duration=32.835918`
  - sha256: `2ce4035b96a931c3192f135707d04190d772dcc69b04b69a2cdf29d4a14c0689`; inventory hash match=True; bytes match=True
- 4-3: returncode=0, elapsed=2.04s, url=https://tcv.clewm.net/f0ZhdfBuStBT1zwU3OUQUMDT9tQ=/FlOJKyFFAWqTQLKN6tUQL0qnmF8z
  - ffprobe: `format_name=mp3;duration=95.033469`
  - sha256: `b7f2d459172de811c551557926474ef0318c7d2cffca4ecc7f69c81609bcd9d0`; inventory hash match=True; bytes match=True
- 4-4: returncode=0, elapsed=4.41s, url=https://tcv.clewm.net/f0ZhdfBuStBT1zwU3OUQUMDT9tQ=/FmwmH05bvsxa4_bClt9MxdMRmKXR
  - ffprobe: `format_name=mp3;duration=70.034286`
  - sha256: `ea9f2e63b3cb0971d621c8ce5460a04ef1308547f5635514bde80846bcbe479e`; inventory hash match=True; bytes match=True
- 4-5: returncode=0, elapsed=1.86s, url=https://tcv.clewm.net/f0ZhdfBuStBT1zwU3OUQUMDT9tQ=/FjGNrXScKTDec1d7-W2bz3pJIjgQ
  - ffprobe: `format_name=mp3;duration=61.048163`
  - sha256: `76693000356a2b28cc1381e8a7e520943a3b2c178cd96a0f025f8ea2e1456083`; inventory hash match=True; bytes match=True
- 4-6: returncode=0, elapsed=1.84s, url=https://tcv.clewm.net/f0ZhdfBuStBT1zwU3OUQUMDT9tQ=/FiNhTId2ChbKv-LTKOCMcRFFiPOS
  - ffprobe: `format_name=mp3;duration=84.636735`
  - sha256: `c3f757061c2f300f21a3b8d2222f5eda6b29d3ce30c9224c8ae47734c66a8f11`; inventory hash match=True; bytes match=True
- 5-1: returncode=0, elapsed=2.51s, url=https://tcv.clewm.net/f0ZhdfBuStBT1zwU3OUQUMDT9tQ=/FoIB78qgI_pFDMwGV49iFIj4qWIU
  - ffprobe: `format_name=mp3;duration=55.040000`
  - sha256: `1c1d9029e5b40f886ea8203d8480add879170111ed44fba7d67ac6621e30d480`; inventory hash match=True; bytes match=True
- 5-2: returncode=0, elapsed=2.02s, url=https://tcv.clewm.net/f0ZhdfBuStBT1zwU3OUQUMDT9tQ=/Fgpdiucp_bQPNaNsdHzNUmCrvt2O
  - ffprobe: `format_name=mp3;duration=36.284082`
  - sha256: `ea449e40711cebcca767b5ab2374f30e90dcde11399975050ae2757c9b7ee5d7`; inventory hash match=True; bytes match=True
- 5-3: returncode=0, elapsed=1.83s, url=https://tcv.clewm.net/f0ZhdfBuStBT1zwU3OUQUMDT9tQ=/FkiobDOhbwG9t_nuvt6x6ZlVFrTh
  - ffprobe: `format_name=mp3;duration=61.126531`
  - sha256: `4f335875bde65cf149b6f979511ff07b2fabc69a8fd4c0fdc11af0cc9bcd5a97`; inventory hash match=True; bytes match=True
- 5-4: returncode=0, elapsed=1.54s, url=https://tcv.clewm.net/f0ZhdfBuStBT1zwU3OUQUMDT9tQ=/FotVXE0VjRsi5JcfEkb5P7lldbBy
  - ffprobe: `format_name=mp3;duration=40.045714`
  - sha256: `be587417124680e0a8a7f713967ee1b05a415a88944e5331c50e7bbb10f32454`; inventory hash match=True; bytes match=True
- 5-5: returncode=0, elapsed=2.94s, url=https://tcv.clewm.net/f0ZhdfBuStBT1zwU3OUQUMDT9tQ=/FnjV1KGwGnueHTJ_Ma8edmGzskSa
  - ffprobe: `format_name=mp3;duration=55.719184`
  - sha256: `2a0aa676c6195103d295b3f9282c6625ff9ef99f844a541d51837ccd45b6b177`; inventory hash match=True; bytes match=True
- 5-6: returncode=0, elapsed=1.49s, url=https://tcv.clewm.net/f0ZhdfBuStBT1zwU3OUQUMDT9tQ=/FqJjYw3o4Rw1XiK2rmSTKbRq-qKw
  - ffprobe: `format_name=mp3;duration=48.953469`
  - sha256: `ee68c73d15eb6dfbbc6aca39c01ff7649e2870fa624600091a6f66975b19d189`; inventory hash match=True; bytes match=True
- 6-1: returncode=0, elapsed=1.23s, url=https://tcv.clewm.net/f0ZhdfBuStBT1zwU3OUQUMDT9tQ=/FlRYydScPjHF5mhHrRw3vNlypFoD
  - ffprobe: `format_name=mp3;duration=51.931429`
  - sha256: `e6a10655fad4e516ee464b3abf473a8b265690687fbcb503856e6f0f340e00e8`; inventory hash match=True; bytes match=True
