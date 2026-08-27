(function registerLessonOneEarlyPack(global) {
  "use strict";

  global.SpeakingChallenge.registerPack({
    schemaVersion: 1,
    id: "lesson-01-p1-p2",
    lessonId: "lesson-01",
    title: "第一课：姓名与起名儿",
    stage: "完成听说（一）口语句式后",
    description: "只练姓名、名字的意思和起名儿。",
    priorLanguageSource: "reference/prior-boya-i-ii-language-baseline.csv",
    focusTopics: ["姓名", "起名"],
    defaultSeconds: { practice: 45, change: 30, present: 45 },
    allowedSourceRefs: [
      "E01-004", "E01-005", "E01-006", "E01-007", "E01-008", "E01-034", "E01-035",
      "G01-001", "G01-002", "G01-003", "G01-004", "T01-001",
      "V01-001", "V01-012", "V01-016", "V01-018", "V01-020"
    ],
    challenges: [
      {
        id: "l01e-my-name", focus: "姓名", title: "我的名字有什么意思",
        situation: "两位同学第一次见面。甲介绍自己的姓名，还要说名字的意思或来历。",
        roles: [
          { name: "甲同学", action: "介绍自己的姓、名和名字的意思。" },
          { name: "乙同学", action: "听完以后，问一个问题。" }
        ],
        goal: "让乙同学听懂甲同学的姓名和名字的意思。",
        outcome: "姓名、意思或来历、一个问题",
        language: ["我姓……，叫……", "我的名字是……的意思。", "你为什么叫这个名字？"],
        conditions: [
          { change: "乙同学第一次把姓和名听反了。", action: "甲同学先说姓，再说名。" },
          { change: "乙同学没有听懂名字的意思。", action: "甲同学用一个简单的例子再说一次。" },
          { change: "时间只剩一分钟。", action: "甲同学只说姓名和最重要的意思。" }
        ],
        presentation: "乙同学向全班介绍甲同学的姓名和名字的意思。",
        audience: ["听完后，说出甲同学的姓。", "听完后，说出名字的一个意思。"],
        sourceRefs: ["E01-034"]
      },
      {
        id: "l01e-name-interview", focus: "姓名", title: "介绍一位同学的名字",
        situation: "甲刚采访了一位同学。现在要把这位同学的姓、名、名字的意思和来历说给乙听。",
        roles: [
          { name: "甲同学", action: "介绍采访到的姓名、意思和来历。" },
          { name: "乙同学", action: "听完后，说出自己记住的内容。" }
        ],
        goal: "让乙同学记住一位同学的姓名和名字的意思。",
        outcome: "一段三到五句话的介绍",
        language: ["他姓……，叫……", "这个名字是……的意思。", "他的名字是……给他起的。"],
        conditions: [
          { change: "乙同学把这个名字听成了另一个名字。", action: "甲同学慢慢读，再说一次。" },
          { change: "采访的同学只说了名字的意思，没有说来历。", action: "甲同学只介绍已经知道的内容。" },
          { change: "班里有两个人同姓。", action: "甲同学要把姓和名都说清楚。" }
        ],
        presentation: "乙同学向全班说出自己听到的姓名、意思和来历。",
        audience: ["听完后，说出这个人的姓名。", "听完后，说出名字是谁起的。"],
        sourceRefs: ["E01-035"]
      },
      {
        id: "l01e-xu-youhua", focus: "姓名", title: "徐幼华还是幼华徐",
        situation: "徐幼华介绍自己。中文说“徐幼华”，按照英文的习惯要说“幼华徐”。同学想知道哪个是姓，哪个是名。",
        roles: [
          { name: "徐幼华", action: "分别说出中文和英文的姓名。" },
          { name: "同学", action: "问清楚哪个是姓，哪个是名。" }
        ],
        goal: "让同学正确说出徐幼华的姓和名。",
        outcome: "中文说法、英文说法、姓和名",
        language: ["我叫徐幼华。", "按照英文的习惯……", "徐是姓，幼华是名。"],
        conditions: [
          { change: "同学把“幼华”当成姓。", action: "徐幼华再说一次哪个是姓。" },
          { change: "老师马上要用中文介绍徐幼华。", action: "两个人先练中文说法。" },
          { change: "两个人现在不能写字。", action: "只用说和听，把姓和名说清楚。" }
        ],
        presentation: "同学先介绍徐幼华，徐幼华最后说对不对。",
        audience: ["听完后，说出徐幼华的姓。", "听完后，说出英文习惯下怎么说。"],
        sourceRefs: ["E01-004"]
      },
      {
        id: "l01e-name-pronunciation", focus: "姓名", title: "请问你的名字怎么念",
        situation: "两位新同学第一次见面。乙没有听清楚甲的名字，要再问一次。",
        roles: [
          { name: "甲同学", action: "慢慢说自己的姓名。" },
          { name: "乙同学", action: "再问一次，然后完整地读出姓名。" }
        ],
        goal: "两个人都能正确读出这个姓名。",
        outcome: "一次提问和一次正确回答",
        language: ["请问你的名字怎么念？", "我姓……，叫……", "你说的是……吗？"],
        conditions: [
          { change: "乙同学第一次听错了一个字。", action: "甲同学把这个字放在一个词里再说。" },
          { change: "这个姓名有三个字。", action: "甲同学先说姓，再说名。" },
          { change: "乙同学第二次还是没有听清楚。", action: "甲同学说慢一点，乙同学跟着读。" }
        ],
        presentation: "两个人演出第一次没听清楚和最后说清楚的过程。",
        audience: ["听完后，一起读一次这个姓名。", "听完后，说出乙同学哪里听错了。"],
        sourceRefs: ["E01-004", "E01-005"]
      },
      {
        id: "l01e-hanyun", focus: "起名", title: "中文名字叫“汉云”",
        situation: "一位同学给外国朋友起了中文名字“汉云”，意思是汉唐飘过来的一片云。朋友要决定喜不喜欢这个名字。",
        roles: [
          { name: "起名的人", action: "说明“汉云”的读音和意思。" },
          { name: "外国朋友", action: "说喜欢或不喜欢，还要说为什么。" }
        ],
        goal: "决定要不要使用“汉云”这个中文名字。",
        outcome: "一个决定和两个理由",
        language: ["我给你起了个中文名字叫汉云。", "意思是……", "话说回来……"],
        conditions: [
          { change: "朋友喜欢“云”，但是觉得“汉”不太好念。", action: "两个人先练读音，再决定。" },
          { change: "朋友希望名字跟中国文化有关系。", action: "起名的人再说一次名字的意思。" },
          { change: "另一个同学把“汉云”听错了。", action: "起名的人慢慢读，朋友跟着读。" }
        ],
        presentation: "朋友说最后的决定，起名的人说明“汉云”的意思。",
        audience: ["听完后，说出“汉云”的意思。", "听完后，说出朋友喜不喜欢这个名字。"],
        sourceRefs: ["E01-004", "G01-004"]
      },
      {
        id: "l01e-which-chuan", focus: "姓名", title: "“川”是哪个“川”",
        situation: "一位同学的名字里有“川”。朋友听懂了发音，但是不知道是哪个“川”。",
        roles: [
          { name: "名字里有“川”的人", action: "说出自己的姓名，并说明是哪个“川”。" },
          { name: "朋友", action: "先问，再完整地读出这个姓名。" }
        ],
        goal: "让朋友听懂名字里的“川”是哪个字。",
        outcome: "一个姓名和一个简单说明",
        language: ["你名字里的“川”是不是川菜的“川”？", "对，是……的“川”。", "不是，是……"],
        conditions: [
          { change: "朋友第一次说错了这个字。", action: "名字的主人再说一个有“川”的词。" },
          { change: "两个人不能写这个字。", action: "只用已经学过的词说明。" },
          { change: "全班也想知道这个字怎么念。", action: "两个人一起读两次。" }
        ],
        presentation: "朋友向全班介绍这个姓名，并说明是哪个“川”。",
        audience: ["听完后，说出这个字怎么念。", "听完后，说出朋友用了哪个词来说明。"],
        sourceRefs: ["E01-005"]
      },
      {
        id: "l01e-changshu-meaning", focus: "起名", title: "老常为什么起名“常殊”",
        situation: "老常给孩子起名“常殊”。“殊”是“特殊”的意思，他希望孩子将来成为与众不同的人。朋友要先听懂这个名字。",
        roles: [
          { name: "老常", action: "介绍“常殊”的读音、意思和愿望。" },
          { name: "朋友", action: "听完后说出自己听懂的内容。" }
        ],
        goal: "让朋友说出“常殊”的意思和老常的愿望。",
        outcome: "名字的意思和一个愿望",
        language: ["我给孩子起名叫常殊。", "“殊”是“特殊”的意思。", "我希望他将来……"],
        conditions: [
          { change: "朋友只记住了“常”，忘了“殊”。", action: "老常再读一次完整姓名。" },
          { change: "朋友没有听懂“与众不同”。", action: "老常用一个简单的例子说明。" },
          { change: "时间只剩一分钟。", action: "老常只说名字、意思和愿望。" }
        ],
        presentation: "朋友向全班介绍“常殊”，老常最后补充。",
        audience: ["听完后，说出“殊”的意思。", "听完后，说出老常的愿望。"],
        sourceRefs: ["T01-001", "V01-001", "V01-012"]
      },
      {
        id: "l01e-changshu-homophone", focus: "起名", title: "“殊”和“叔”同音",
        situation: "老常喜欢“常殊”这个名字。朋友提醒他，“殊”和“叔叔”的“叔”同音，孩子可能会被叫成“常叔”。",
        roles: [
          { name: "老常", action: "说明为什么还是喜欢“常殊”。" },
          { name: "朋友", action: "说出同音可能带来的问题。" }
        ],
        goal: "决定保留“常殊”，还是再想一个名字。",
        outcome: "一个决定和两个理由",
        language: ["“殊”和“叔”同音。", "你总不能让大家都叫他“叔”吧！", "话说回来……"],
        conditions: [
          { change: "一位同学第一次听到“常殊”，马上叫成“常叔”。", action: "老常要回答这个问题。" },
          { change: "家里人很喜欢“特殊”的意思。", action: "朋友要说怎样留下这个愿望。" },
          { change: "孩子将来不喜欢这个名字。", action: "两个人要再说一次名字的好处和问题。" }
        ],
        presentation: "老常说最后的决定，朋友说最重要的问题。",
        audience: ["听完后，说出两个同音字。", "听完后，说出他们最后要不要改名字。"],
        sourceRefs: ["T01-001", "E01-007", "E01-008", "G01-001", "V01-020"]
      },
      {
        id: "l01e-changshu-game", focus: "起名", title: "比赛输了，会不会被叫“输”",
        situation: "朋友担心“殊”和“输”同音。孩子参加比赛输了以后，同学可能拿名字开玩笑。",
        roles: [
          { name: "老常", action: "说出自己怎么看这个问题。" },
          { name: "朋友", action: "用“才怪呢”提醒老常。" }
        ],
        goal: "说清楚这个同音问题会不会影响名字的选择。",
        outcome: "一句“才怪呢”和一个决定",
        language: ["“殊”和“输”同音。", "输了以后，不……才怪呢！", "我还是决定……"],
        conditions: [
          { change: "孩子很喜欢参加比赛。", action: "老常要认真回答朋友的问题。" },
          { change: "家里人说这只是一个小问题。", action: "朋友要说为什么自己还是担心。" },
          { change: "老常想到另一个不同音的字。", action: "两个人比较两个名字。" }
        ],
        presentation: "朋友先提醒，老常再说最后决定。",
        audience: ["听完后，说出哪两个字同音。", "听完后，说出老常最后选哪个名字。"],
        sourceRefs: ["E01-006", "G01-002", "V01-020"]
      },
      {
        id: "l01e-changshu-warning", focus: "起名", title: "到时候别说我没提醒你",
        situation: "朋友已经说了“常殊”可能带来的问题。老常还是想先用这个名字。",
        roles: [
          { name: "老常", action: "说出为什么现在不想改。" },
          { name: "朋友", action: "用“到时候”说将来可能发生的事。" }
        ],
        goal: "把现在的决定和将来的问题都说清楚。",
        outcome: "一句“到时候”和一个现在的决定",
        language: ["我还是想叫他常殊。", "到时候……", "到时候别说我没提醒过你。"],
        conditions: [
          { change: "老常说以后发现问题再改。", action: "朋友要说改名字是不是容易。" },
          { change: "家里人明天就要决定名字。", action: "两个人今天要说出最后意见。" },
          { change: "老常请朋友再给一个名字。", action: "朋友说一个名字和一个理由。" }
        ],
        presentation: "两个人演出最后三句对话。",
        audience: ["听完后，说出朋友提醒了什么。", "听完后，说出老常现在的决定。"],
        sourceRefs: ["E01-006", "G01-003"]
      },
      {
        id: "l01e-changshu-low-key", focus: "起名", title: "名字要不要低调一点儿",
        situation: "老常希望孩子与众不同。朋友觉得“常殊”很有意思，但是起名儿最好低调一点儿。",
        roles: [
          { name: "老常", action: "说出这个名字特别的地方。" },
          { name: "朋友", action: "先说好处，再用“话说回来”说问题。" }
        ],
        goal: "说出“常殊”的一个好处和一个问题。",
        outcome: "一句“话说回来”和两个方面",
        language: ["这个名字很……", "话说回来……", "起名儿还是要低调一点儿。"],
        conditions: [
          { change: "家里人都喜欢与众不同的名字。", action: "朋友先同意，再说自己的担心。" },
          { change: "老常只想听好话。", action: "朋友要友好地说出另一个方面。" },
          { change: "他们又想到一个很普通的名字。", action: "两个人比较两个名字。" }
        ],
        presentation: "老常说好处，朋友用“话说回来”说问题。",
        audience: ["听完后，说出名字的好处。", "听完后，说出朋友担心什么。"],
        sourceRefs: ["E01-007", "E01-008", "G01-004", "V01-012", "V01-018"]
      },
      {
        id: "l01e-changshu-final", focus: "起名", title: "“常殊”最后留不留",
        situation: "老常和三位朋友已经谈过“常殊”的意思、同音问题和是否低调。现在要做最后决定。",
        roles: [
          { name: "老常", action: "说出最后决定和最重要的理由。" },
          { name: "朋友", action: "问一个问题，再说赞成还是不赞成。" }
        ],
        goal: "完成一次有问题、有回答、有决定的起名对话。",
        outcome: "一个问题、一个回答、一个决定",
        language: ["你为什么还想用这个名字？", "因为……", "我最后决定……"],
        conditions: [
          { change: "朋友听完后还是不明白。", action: "老常只用三句话再说一次。" },
          { change: "家里人希望今天决定。", action: "两个人不能说“以后再说”。" },
          { change: "朋友改变了原来的看法。", action: "朋友要说是哪一个理由让自己改变。" }
        ],
        presentation: "两个人向全班演出最后决定。",
        audience: ["听完后，说出最后决定。", "听完后，说出最重要的理由。"],
        sourceRefs: ["T01-001", "E01-008", "G01-001", "G01-002", "G01-003", "G01-004"]
      }
    ]
  });
})(window);
