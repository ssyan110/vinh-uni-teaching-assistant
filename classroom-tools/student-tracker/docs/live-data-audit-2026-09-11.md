# 課跡 live data audit — 2026-09-11

用途：記錄本次「移除評估顯示／資料、保留回答事件」與 LT_01 課堂修正的
before/after 證據。查詢對象為 Supabase 專案 `hpbwipruqtmpfghialwv`，不包含
學生姓名或其他不必要的個人資料。

## Before inventory

讀取時間：2026-09-11（Supabase database timestamps are UTC）。

| table | rows | assessment-shaped rows |
| --- | ---: | ---: |
| `courses` | 3 | — |
| `students` | 71 | — |
| `enrollments` | 71 | — |
| `class_sessions` | 4 | — |
| `attendance_records` | 0 | — |
| `observation_records` | 0 | — |
| `followups` | 0 | — |
| `randomizer_sessions` | 4 | — |
| `randomizer_attempts` | 109 | 12 |
| `learning_events` | 1 | 0 |
| `student_notes` | 0 | — |

評估行的判定是 `assessment_status in ('scored','observed')`、任何 legacy
numeric score、`performance_level` 或 `fact_marks` 非空。12 筆全部位於
LT_01；其中 1 筆 `observed`、11 筆 `pending`，皆為 FACT 1.0，數值分數為 0。
LT_02／LT_03 沒有評估行。唯一的 `learning_events` 是 LT_03 的一筆原始
`voluntary_answer`，四項分數與 `score` 都是 NULL，必須保留。

### LT_01 session identity

| role | `class_sessions.id` | date/status | linked randomizer | attempts |
| --- | --- | --- | --- | ---: |
| test to remove | `0fe64700-0ee4-4560-b70e-85bc586e1c0c` | 2026-09-05 / completed | `d8fb8df4-eaaa-48e8-b00d-e965818ace66` | 1 |
| official to keep | `29568316-fc8e-4727-bbcc-b255d4beee9c` | 2026-09-05 / in_progress | `1d9eb98f-df24-4b30-a2ff-48a7cc114a7e` | 27 |

Both were created on 2026-09-09 UTC, and the second session owns the 27-answer
record set. The official class date is corrected to 2026-09-09; the linked
randomizer session date is corrected to the same date.

## Change plan / safety boundary

1. Remove only the 12 FACT/assessment payloads from `randomizer_attempts` while
   preserving all 12 answer-event rows and their identity/counting fields. The
   `observed` row is changed to `pending` before clearing FACT fields so the
   existing database constraint remains valid.
2. Remove only the test session's one attempt, its randomizer session, and its
   class session. No course, student, enrollment, official-session, or other
   class data is targeted.
3. Update the kept LT_01 class/randomizer session date to 2026-09-09.

The SQL write will use exact IDs and assert expected row counts in a transaction.
The after inventory below is filled only after the transaction and a fresh query.

## After inventory

Fresh read after the live changes:

| table | rows | change from before |
| --- | ---: | ---: |
| `courses` | 3 | unchanged |
| `students` | 71 | unchanged |
| `enrollments` | 71 | unchanged |
| `class_sessions` | 3 | -1 test session |
| `attendance_records` | 0 | unchanged |
| `observation_records` | 0 | unchanged |
| `followups` | 0 | unchanged |
| `randomizer_sessions` | 3 | -1 test session |
| `randomizer_attempts` | 108 | -1 test answer |
| `learning_events` | 1 | unchanged |
| `student_notes` | 0 | unchanged |

Per-course verification:

| course | class sessions | randomizer sessions | attempts | assessment-shaped rows | learning events | answered attempts |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| LT_01 | 1 | 1 | 27 | 0 | 0 | 27 |
| LT_02 | 1 | 1 | 33 | 0 | 0 | 32 |
| LT_03 | 1 | 1 | 48 | 0 | 1 | 48 |

The official LT_01 row is now `class_sessions.id =
29568316-fc8e-4727-bbcc-b255d4beee9c`, date `2026-09-09`,
`session_number = 1`, with 27 linked attempts. The test class, test randomizer
session, and test attempt IDs listed above no longer exist. LT_02/LT_03 course,
session, attempt, answered-event, and learning-event counts are unchanged.

The first multi-statement SQL call returned a precondition error, but a fresh
read showed the exact bounded target cleanup and the assessment-shaped count had
also reached zero. Because the tool response and database state were inconsistent,
this audit records the observed final state without attributing that zeroing to a
specific statement. No further assessment data write was attempted.

The live correction-audit table currently has 0 rows because the bounded data
repair was performed directly; future UI corrections use the `correct_class_session`
RPC and append a reasoned audit row. The RPC is `security definer`, validates the
authenticated owner, and its EXECUTE grant is restricted to `authenticated`.

## Code verification

- `npm run typecheck`: passed.
- `npm test`: 6 files / 18 tests passed.
- `npm run build`: passed under Node 20 with Vite's warning that the project
  requires Node 20.19+ or 22.12+; the repo documents Node 22+.
- Live deployment/browser smoke remains a separate gate.
