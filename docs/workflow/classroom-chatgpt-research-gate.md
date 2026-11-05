# 实体课活动 ChatGPT 研究门禁

2026-11-04起，所有新设计或实质重设计的实体课活动，先实际使用ChatGPT研究并保存完整记录，再编写方案。旧研究可供背景参考，不能代替本次会话。已完成课件及旧核准记录保持历史状态，不补造研究记录。

顺序：核对教材与班级→实际ChatGPT研究→保存提示、完整回复、会话链接→核对来源→编写改写对照和审阅稿→运行classroom-research→内容审阅→用户核准→content-approval及classroom-native。研究未完成、无法登录或无法保存时，报告实际阻断，不继续自行设计后标成研究产物。没有新增人工批准阶段。

每课 `10-design/research/<artifact-id>/<version>/research-record.json`：

```json
{
  "provider": "ChatGPT", "status": "captured",
  "lesson_keys": ["boya-elementary-i:lesson-18", "boya-elementary-i:lesson-19"],
  "offering_id": "2026-fall", "artifact_id": "y1-w09-l18-l19",
  "class_scope": "BOYA-LS-E1-Y1S1-2026F",
  "conversation_url": "https://chatgpt.com/c/ACTUAL-CONVERSATION-ID",
  "captured_at": "ACTUAL-ISO8601-TIME-WITH-TIMEZONE",
  "adapted_at": "ACTUAL-LATER-ISO8601-TIME-WITH-TIMEZONE",
  "sources_verified": true,
  "prompt": {"path": "PROJECT-RELATIVE-PATH", "sha256": "ACTUAL-HASH"},
  "response": {"path": "PROJECT-RELATIVE-PATH", "sha256": "ACTUAL-HASH"},
  "sources": {"path": "PROJECT-RELATIVE-PATH", "sha256": "ACTUAL-HASH"},
  "adaptation": {"path": "PROJECT-RELATIVE-PATH", "sha256": "ACTUAL-HASH"},
  "review": {"path": "PROJECT-RELATIVE-PATH", "sha256": "ACTUAL-HASH"}
}
```

五个文件必须非空、在对应课的10-design内、哈希匹配；合并课可在一个覆盖课次的10-design内保存共享研究包，lesson_keys须列出全部覆盖课次；每课仍须独立保存内容批准记录，并绑定同一完整合并审阅稿的哈希。若各课使用不同审阅稿或不同研究包，应逐课运行门禁，不得用一个包冒充其他版本。prompt/response保存原始全文，不能以摘要代替。sources记录实际访问的链接、核对结果和适用限制；adaptation逐项说明取用、删除或改写及原因。review是当前完整活动审阅稿。captured_at是完整回复保存时间，必须不晚于改写时间；不得修改文件时间冒充先研究。系统无法从哈希证明人机过程真实，仍须保存可回看的真实会话。

审阅前：

```bash
python3 scripts/production_gate.py --purpose classroom-research --lesson-key boya-elementary-i:lesson-18 --offering-id 2026-fall --artifact-id y1-w09-l18-l19 --class-scope BOYA-LS-E1-Y1S1-2026F --research-record lessons/boya-elementary-i/lesson-18/10-design/research/y1-w09-l18-l19/v01/research-record.json
```

后续 `--purpose content-approval --artifact-scope classroom`、`--purpose classroom-native` 和 `agent_loop.py init` 同时传 `--research-record`。缺失即阻断；没有跳过参数。用户批准不能自动补足研究证据。原始研究保持不变，审阅稿改动后需更新改写记录、研究清单哈希，并按现有流程核准新内容版本。

2026-11-05 既有版本维护：2026-11-04之前的真实 scoped 内容批准，只有来源、审阅稿、核对报告和批准证据哈希仍全部匹配时，才可原样复核而不补造研究。此路径只允许保持已批准教学内容的技术／排版维护；新活动、实质重设计或改变审阅稿必须取得新版本批准并按当前研究规则检查。保留历史批准不能授权新内容。
