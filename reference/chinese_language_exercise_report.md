# Beginner Chinese Lesson Question Bank Design Spec

## Research Basis and Scope

This spec is calibrated to the kind of lesson you described: roughly 11 new words, 1–2 new grammar points, and one short dialogue, which is very close to the beginner range targeted by HSK 1–2 and other novice CFL materials. The analysis below prioritizes beginner textbooks, workbook samples, teacher-facing descriptions, and answer keys because those sources show the actual exercise architecture most clearly. Where a publisher did not expose a full lesson preview, I treated the available samples as evidence for **sampled beginner-volume ranges**, not as a page-by-page census of every edition. citeturn17view0turn1view1turn10view0turn29view1turn48view0turn42view1turn53search6turn54search0turn49search2turn51view3

The biggest cross-series finding is simple: established beginner materials rarely stop at “match and fill in the blank.” They usually move in a staircase from **sound/form recognition**, to **controlled sentence work**, to **dialogue completion**, and then to **very small communicative or presentational output**. The real differences are how long phonetics stays central, how soon students are asked to write characters from memory, and how much free production is allowed before the end of the lesson cycle. citeturn44view0turn44view1turn44view2turn44view3turn58view0turn58view1turn48view0turn42view1turn43view0

## Chinese Textbook Exercise Models

| Series | What appears after each lesson | Typical sequence | Typical quantity in beginner lessons | Pinyin and hanzi progression | Estimated drill to communicative mix | Evidence |
|---|---|---|---|---|---|---|
| **當代中文課程** | Tone-marking, listening MCQ, T/F, dialogue matching, reply completion, reading short answer, info-card dialogue completion, grammar transformation such as **A-not-A**, pinyin-to-hanzi dictation, guided self-introduction, scrambled-sentence ordering, short composition | Recognition of tones and words → listening recognition → controlled dialogue work → reading and grammar manipulation → dictation into characters → guided/free output | Sampled lessons show about **7–10 exercise blocks** per lesson, usually **3–10 items** each; later lessons add a short paragraph/composition task | Pinyin support is visible early through tone work, but character output begins fast: by Lesson 2 the workbook already asks students to write full sentences in characters from pinyin; Vols. 1–2 officially include a separate character workbook | **About 60:40**; much more balanced than exam-prep books because guided output starts very early | Official series description and beginner workbook samples. citeturn17view0turn1view1turn44view0turn44view1turn44view2turn44view3 |
| **新HSK標準教程** | Early lessons: reading aloud, sound/tone discrimination, picture-word matching, listen-and-write initials/finals/tones, stroke-order tracing, character copying. Later lessons: recurring listening, reading, pronunciation, and hanzi sections in HSK-style formats | Phonetic control → lexical recognition → exam-style receptive practice → character formation | Lessons 1–2 are very dense, with **6–7 exercise blocks** and **60+ micro-items**; the Lesson 3 answer-key sample shows **12 listening items** and **16 pronunciation items**, with reading and hanzi also part of the recurring structure | Pinyin is front-loaded heavily in Lessons 1–2; characters appear from the start through stroke-order and writing tasks; pronunciation support continues through the volume instead of disappearing quickly | **About 85:15**; strongly drill-heavy and exam-shaped | Workbook preview pages and answer-key sample. citeturn10view0turn25view1turn25view2turn26view0turn58view0turn58view1turn58view2 |
| **漢語教程** | Hanzi-to-pinyin matching, add pinyin to characters, yes-no pattern questions with **嗎**, fill-in-the-blank, ask with **幾/多少**, dialogue completion, use-given-words tasks, picture talk, sentence reordering, reading/content fill | Concentrated phonetics at the beginning → form mapping → sentence pattern drills → dialogue completion → sentence building → short reading response | In sampled beginner lessons, the exercise section usually breaks into **4–6 sub-exercises**, often **3–6 items** each | The beginner line officially concentrates pronunciation in the first **10 lessons**, while also keeping a pronunciation component in the lesson architecture; phonetic training is not treated as “finished” after one unit | **About 70:30**; still controlled, but less exam-bound than HSK and more pattern-to-dialogue oriented | TOC structure, answer-key samples, and series description. citeturn29view1turn29view2turn29view3turn39view0turn45view0turn45view3turn45view4turn40search14turn40search8 |
| **發展漢語** | Classroom interaction, pinyin annotation, choose-word fill, complete-sentence-from-hints, finish the dialogue, situational expression, reading comprehension, picture talk and write, sentence reordering, text-content fill, separate character work | First five lessons stress phonetics → blocked skill practice → dialogue/situation use → reading/writing reinforcement | A comparative study reports **285 exercises across 30 lessons**, or **9.5 exercises per lesson on average** | The same study says the first **5 lessons** focus on phonetic basics; after that the book shifts toward imitation/manipulation tasks. It also separates out a dedicated character-writing strand | **About 65:35**; more structured and block-based than free-form, but not purely mechanical | Comparative textbook study plus answer-key evidence. citeturn48view0turn39view0turn45view0turn45view2turn45view3turn33view0 |
| **新實用漢語課本** | Pronunciation drills, spelling, sound discrimination, tone discrimination, sandhi practice, read-aloud classroom expressions, dialogue completion, picture-based dialogue creation, phrase mastery, pattern drills, make-a-sentence-from-picture, conversation practice, character writing | Pronunciation → key-sentence control → phrase mastery → pattern drill → sentence making → conversation practice → character writing | Lesson 1 alone contains **6 pronunciation sub-sections** before conversation practice; mid-volume lessons still show multiple practice blocks plus character work | The textbook states that the first **six lessons** provide an overview of the full phonetic system; characters are introduced from Lesson 1, but pinyin support remains strong throughout Volume 1 | **About 70:30**; explicitly built as a staircase from mechanical drills toward communicative practice | Introductory description and sample lesson pages. citeturn41search0turn42view1turn43view0turn43view1turn43view2 |

Across the five series, three design patterns are especially stable. First, **phonetics is front-loaded** in HSK Standard Course, 漢語教程, 發展漢語, and 新實用漢語課本, although they differ in how long it stays foregrounded. Second, nearly all of them use a **recognition → controlled production → guided communication** staircase. Third, **character output appears earlier than many teachers expect**: ACCC asks for pinyin-to-hanzi sentence writing by Lesson 2, NPCR introduces character writing from Lesson 1, and 發展漢語 and 漢語教程 both maintain distinct character-focused practice rather than treating hanzi as an afterthought. citeturn44view2turn44view3turn25view1turn40search14turn48view0turn42view1

For a generator, the most useful conclusion is that you should not model your homework bank on only one of these series. If you copy HSK too closely, the bank becomes over-receptive and test-like. If you copy ACCC too closely, it can become output-heavy for weaker beginners. The best default is a **hybrid beginner spine**: a short pinyin check, then vocabulary recognition, then hanzi retrieval, then one grammar manipulation task, then one dialogue comprehension task, then one tiny applied output task. That hybrid reflects the center of gravity across the five series better than any single book does. citeturn44view0turn44view1turn58view0turn48view0turn43view0

## ESL Models and Transferable Principles

| ESL series | Typical unit logic | What transfers well to beginner CFL | Evidence |
|---|---|---|---|
| **Headway** | Stable grammar-led unit architecture with a clear vocabulary syllabus, integrated skills, and dedicated real-world speaking through sections such as **Everyday English** | Keep a **repeatable lesson skeleton** so students know where pronunciation, vocabulary, grammar, and practical speaking each live; make one short “everyday Chinese” slot mandatory in every lesson | OUP describes Headway as built on a proven methodology with grammar focus, clear vocabulary syllabus, integrated skills, and real-world speaking support. citeturn53search6turn53search3turn55search7 |
| **English File** | Every File integrates **Grammar, Vocabulary, Pronunciation, and Skills Development**, with a strong video and **Practical English** strand | Give every Chinese lesson one **micro-pronunciation task** and one **practical-use task** instead of isolating pronunciation in the first few weeks only | OUP states that every File includes Grammar, Vocabulary, Pronunciation, and Skills Development, with video-enhanced lessons and Practical English resources. citeturn54search0turn54search2turn54search13 |
| **Interchange** | Topic/function-based communicative cycle: **Snapshot, Conversation, Grammar Focus, Pronunciation, Discussion/Speaking, Word Power, Listening, Writing, Reading, Interchange activity**; flexible order | Start from a **social function or topic**, not from grammar labels alone. In CFL terms: “asking price,” “introducing family,” “ordering food,” then attach vocabulary and grammar to that function | Cambridge describes Interchange as communicative, flexible in structure, and composed of these recurring unit elements. citeturn49search2turn50search6turn50search18 |
| **Side by Side** | Real-life communication, teamwork, systematic recycling of objectives, expanded reading/writing, life-skills pages, and check-up/skills checks | Recycle targets across lessons, and add a small **life-task page** or “use it in the real world” slot. Beginner Chinese benefits from visible recycling even more than English does because character retrieval decays quickly | Pearson says Side by Side Plus is student-centered, interactive, four-skills-based, includes teamwork, life-skills pages, writing-process support, check-ups, and recycled objectives. citeturn51view3turn50search7 |

The strongest transferable ESL principle is not “use more communicative activities” in the abstract. It is **use a predictable unit spine with one functional outcome**. Interchange and English File are especially good models here: they do not treat grammar as the destination; they treat it as support for a conversational or interpretive outcome. For beginner CFL, that means the lesson bank should be tagged first by **function** such as greeting, asking nationality, naming family members, asking price, telling time, and only second by grammar point. citeturn49search2turn50search6turn54search0turn54search2turn56search15

A second ESL principle that transfers very cleanly is **spiral recycling**. Side by Side explicitly recycles objectives across units, and Headway/English File provide continuing grammar, vocabulary, and practical-English practice beyond a single lesson. For CFL, this is even more important because retention of tones, measure words, and the written form is fragile without repeated recall. Your generator should therefore create not only “Lesson N” questions, but also “Lesson N with Lesson N-1 recycle” and “Lesson N with cumulative review” variants. citeturn51view3turn53search6turn54search13turn57search16turn57search12

## Exercise Taxonomy for Beginner CFL

The taxonomy below synthesizes the exercise types that recur across the sampled Chinese series and the transferable design logic visible in the ESL series. The important design rule is to keep the pool **broad enough to vary surface form**, while keeping the **underlying lesson spine stable**. citeturn44view0turn48view0turn43view0turn49search2turn51view3

| Skill area | Exercise type | What it checks | Best default delivery | Use most at |
|---|---|---|---|---|
| Pinyin | Tone discrimination | Can the learner hear or identify the right tone | Google Forms, Kahoot, Blooket | Remember |
| Pinyin | Initial/final discrimination | Fine phonological contrast | Google Forms, printable listening sheet | Remember |
| Pinyin | Syllable matching | Sound-to-pinyin or pinyin-to-hanzi mapping | Google Forms | Remember |
| Pinyin | Tone-sandhi choice | Pronunciation rule awareness | Google Forms, in-class quick quiz | Understand |
| Pinyin | Listen and mark tones | Dictation-level tone control | Printable PDF, Formative | Apply |
| Pinyin | Read-aloud self-recording | Spoken accuracy and confidence | Formative audio response | Apply |
| Vocabulary | Picture-word matching | Meaning recognition | Google Forms, Kahoot, Blooket | Remember |
| Vocabulary | L1-L2 or synonym match | Basic form-meaning connection | Google Forms | Remember |
| Vocabulary | Categorization | Semantic grouping | Formative categorize, printable sort | Understand |
| Vocabulary | Measure-word pairing | Lexico-grammatical control | Google Forms, printable worksheet | Understand |
| Vocabulary | Sentence cloze | Contextual use of a word | Google Forms, printable PDF | Apply |
| Vocabulary | Odd-one-out with explanation | Differentiation and category sense | Printable PDF, short-answer digital | Analyze |
| Hanzi | Stroke-order recognition | Visual form knowledge | Formative, printable PDF | Remember |
| Hanzi | Component/radical recognition | Sub-character structure | Formative hotspot/drawing, printable | Understand |
| Hanzi | Character assembly | Can the learner build the character from parts | Formative drag/drop or paper cut-up | Understand |
| Hanzi | Pinyin/meaning to hanzi dictation | Retrieval of written form | Printable PDF, Formative drawing | Apply |
| Hanzi | Copy-then-cover-write-check | Guided handwriting plus retrieval | Printable PDF | Apply |
| Hanzi | Homophone/near-lookalike selection | Form discrimination under pressure | Google Forms | Analyze |
| Grammar | Pattern drills | Fast control of one structure | Google Forms, Kahoot | Remember |
| Grammar | Transformation | Turn statement into question/negative/A-not-A | Printable PDF, Google Forms | Apply |
| Grammar | Error correction | Detect structural mistake | Google Forms short answer, print | Analyze |
| Grammar | Sentence building from cue words | Word order + grammar control | Printable PDF, Formative resequence | Apply |
| Grammar | Scrambled sentence reorder | Syntax awareness | Formative resequence, printable PDF | Analyze |
| Text comprehension | True/false | Literal comprehension | Google Forms, Kahoot | Understand |
| Text comprehension | Short answer | Focused information extraction | Printable PDF, Google Forms | Understand |
| Text comprehension | Speaker-utterance match | Dialogue tracking | Google Forms | Understand |
| Text comprehension | Retell with sentence frames | Comprehension into production | Formative audio, printable | Apply |
| Text comprehension | Sequence the dialogue | Discourse order awareness | Formative resequence, printable | Analyze |
| Integrated | Information-gap prompt | Functional exchange of information | In class, Formative, paper pair task | Apply |
| Integrated | Role-play cue card | Communicative transfer | In class, Formative audio | Apply |
| Integrated | Picture description with target words | Vocabulary + grammar + discourse | Formative or printable | Apply |
| Integrated | Mini presentational writing | Controlled free output | Printable PDF or LMS text box | Analyze |

If you want a bank that feels “textbook-like” without becoming repetitive, the most efficient move is to tag every item with **skill**, **Bloom level**, and **delivery mode**. That lets you generate one lesson assignment that still feels coherent: for example, two Remember items, two Understand items, two Apply items, and one Analyze item, while also balancing auto-graded and written work. citeturn56search2turn56search1turn59search0turn59search2

## Bloom-Aligned Progression for HSK 1–2

In the revised Bloom model, the stages you asked for are **Remember, Understand, Apply, and Analyze**. ACTFL’s can-do framework complements this well because it defines beginner progress in terms of communication growth, not just rule recall. For novice learners, the sweet spot is to keep **Analyze** small and concrete: compare, sort, detect mismatch, or infer a speaker’s intention, rather than asking for abstract explanation. citeturn56search2turn56search0turn56search1turn56search3turn56search15

| Bloom level | What it looks like in a beginner Chinese lesson | Best exercise forms | Example using an 11-word lesson |
|---|---|---|---|
| Remember | Recognize tones, pinyin, characters, meanings, and model sentence forms | Tone MCQ, matching, choose the correct character, repeat the key pattern, picture-word match | Identify the correct pinyin for three words; match five new words to pictures; choose the correct form of 吗 / 呢 |
| Understand | Show that the learner understands how the form works in context | True/false, classify, select the correct reply, pick the correct measure word, short reading question | Read the short dialogue and decide who is the teacher; choose the best reply to 你是哪国人; choose 个 or 口 |
| Apply | Use the form to complete or build meaning | Dialogue completion, sentence building, dictation, cue-based response, picture description with frames | Complete a 3-turn dialogue using one grammar pattern; write 3 words in hanzi from pinyin; reorder words into a correct sentence |
| Analyze | Notice contrasts, errors, sequence, or pragmatic fit | Error correction, reorder mixed dialogue, compare two near-meaning patterns, explain why one reply does not fit | Find the wrong sentence among three choices; sequence four dialogue lines; choose why *这是谁的国人* is wrong |

For lesson generation, the cleanest progression is **40% Remember, 30% Understand, 20% Apply, 10% Analyze** in the earliest beginner units, then gradually shift toward **30/30/25/15** by late HSK 2. That mirrors both Bloom’s complexity ladder and the way established beginner textbooks slowly move from phonological control to sentence use and minimal discourse handling. citeturn56search2turn44view3turn48view0turn43view0

## Lesson-Level Blueprint

For your target lesson size, the most reliable default is **13–15 prompts**, which usually yields **22–27 response actions** once you count sub-items. That is enough for meaningful practice without crossing the 30-minute line for most beginners. It also aligns with the medium-density end of the beginner textbook models, rather than the very dense exam-style HSK workbook format. citeturn48view0turn58view0turn43view0

| Block | Prompts | Response actions | Time | Recommended format | Default question types |
|---|---:|---:|---:|---|---|
| Pinyin check | 2 | 5–6 | 3–4 min | Google Forms or in-class game | Tone choice, initial/final discrimination |
| Vocabulary review | 3 | 6–7 | 5–6 min | Google Forms, Kahoot, Blooket | Picture match, category sort, sentence cloze |
| Hanzi writing | 2 | 4–5 | 5–6 min | Printable PDF or Formative | Pinyin/meaning → hanzi, component check |
| Grammar control | 3 | 5–6 | 5–6 min | Google Forms or printable PDF | Fill-in, transformation, reorder |
| Dialogue comprehension | 2 | 4 | 3–4 min | Google Forms or Kahoot | T/F, speaker/reply match, short answer |
| Meaningful output | 1–2 | 1–2 | 3–5 min | Formative or printable PDF | 2-sentence reply, mini role-play, voice note |
| **Total** | **13–14** | **25–27** | **24–31 min** | **Hybrid** | **Balanced** |

A practical **default distribution** that works well for a novice lesson is shown below.

| Skill focus | Share of assignment | Good default |
|---|---:|---|
| Pinyin and pronunciation | 10–15% | 2 prompts |
| Vocabulary | 20–25% | 3 prompts |
| Hanzi writing | 20–25% | 2 prompts |
| Grammar | 20–25% | 3 prompts |
| Text comprehension | 15–20% | 2 prompts |
| Integrated communication | 10–15% | 1–2 prompts |

The best deployment model is a **hybrid workflow**. Use **Google Forms** for auto-graded recognition and short controlled-response checks because it supports quiz settings, question-type selection, images, answer keys, and response collection from any device. Use **Formative** when you need handwriting, drag/drop, categorization, resequencing, or audio response, because its question bank includes drawing/show-your-work, audio response, drag and drop, categorize, matching, resequence, and other richer item types. Use **printable PDF** for the portions where actual character production matters most. citeturn59search2turn59search9turn59search0

| Use case | Best tool | Why it fits | Not ideal for |
|---|---|---|---|
| Fast recognition review | Kahoot or Blooket | High engagement and fast recall; Kahoot supports type-answer/open-ended variants and Blooket supports live, solo, and homework play | Handwriting and extended output. citeturn59search7turn59search11turn59search1turn59search20 |
| Listening, matching, quick grammar checks | Google Forms | Easy quiz setup, answer keys, image support, simple short-answer grading | Stroke-order evidence, real handwriting, rich drag/drop. citeturn59search2turn59search9 |
| Hanzi, sentence building, oral reply | Formative | Supports drawing/show-your-work, audio response, drag/drop, categorize, resequence | Fast whole-class game energy. citeturn59search0 |
| Character writing and short paragraph work | Printable PDF | Best for visible handwriting quality and low-friction practice | Auto-grading and instant analytics |

The recommended default option is therefore:

| Recommended option | Reasoning | Next steps |
|---|---|---|
| **Google Forms + one written/Formative page** | This keeps the auto-gradable parts where they belong, while preserving true hanzi practice and one meaningful output task. That mirrors the strongest design logic across ACCC, 發展漢語, 漢語教程, and NPCR better than an all-digital MCQ set would. citeturn44view2turn48view0turn43view0turn59search2turn59search0 | Build your generator with three banks per lesson: **Auto-graded core**, **Written hanzi/grammar**, and **Communicative extension**. Then assign 1 item from each bank slot by default. |

## Anti-Patterns to Avoid

| Anti-pattern | Why it fails | Better rule |
|---|---|---|
| **Too many recognition-only items** | HSK-style recognition tasks are useful, but if a worksheet stays at matching/MCQ level, students can recognize forms without producing them. ACTFL can-do statements emphasize communication growth, and the stronger beginner Chinese series move to output early. citeturn58view0turn44view2turn56search1turn56search15 | Every homework set should contain **at least one hanzi retrieval task** and **one short meaning-to-language output task**. |
| **Keeping pinyin on everything for too long** | Established series use pinyin heavily at the start, but they do not wait long to demand characters. ACCC asks for pinyin-to-hanzi sentence writing by Lesson 2, and NPCR introduces character writing from Lesson 1. citeturn44view2turn42view1 | Taper support: **full pinyin → partial pinyin → no pinyin** within the same lesson cycle. |
| **Treating hanzi as copying only** | Copying helps form familiarity, but retrieval practice research shows that bringing information to mind strengthens learning more than restudy alone. Several beginner textbooks therefore pair character formation with dictation or writing from prompts, not just tracing. citeturn57search16turn57search12turn25view1turn44view2turn48view0 | Use a **copy-then-cover-write-check** or **pinyin/meaning → hanzi** item every lesson. |
| **Overloading the lesson with too much new grammar** | A comparative study on beginner CFL textbooks warns that too many grammar points per lesson raise the task load for novices; it also notes that vocabulary in beginner lessons should stay within manageable limits. citeturn47view0turn48view0 | For your lesson type, keep the assignment focused on **1–2 grammar targets only** and recycle older patterns separately. |
| **Using only isolated grammar sentences** | ESL models such as Interchange and English File organize units around social functions and practical communication, not only sentence manipulation. Chinese beginner texts that feel more alive do the same. citeturn49search2turn50search6turn54search0turn44view1 | Pair each grammar block with **one dialogue-use item** or **one picture/situation item**. |
| **No recycling across lessons** | Side by Side explicitly recycles objectives, and research on Developing Chinese notes problems when repetition is too low or too widely spaced. Retrieval practice literature also supports spaced recall for long-term retention. citeturn51view3turn33view0turn57search16turn57search12 | Add **20–30% cumulative review** to each new homework set. |
| **Pure rote memorization without context** | Recent vocabulary research again found that contextual learning outperformed rote repetition for longer-term vocabulary mastery and use, even though memorization still helps in limited areas. citeturn57search13turn57search15 | Keep a small memorization core, but always add **one contextualized use task**. |

The single most important safeguard is this: do not let the generator produce a worksheet that can be completed entirely by recognition. If the assignment never asks the learner to **retrieve**, **build**, or **say** anything, it will feel like practice, but it will behave like short-term review. The better beginner textbooks consistently avoid that trap, even when they are still heavily scaffolded. citeturn44view2turn48view0turn43view0turn57search16