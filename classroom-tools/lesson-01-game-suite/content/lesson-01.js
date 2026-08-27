(function registerLessonOneGameContent(global) {
  "use strict";

  const suite = global.ClassroomGameSuite;

  function item(id, title, context, roles, goal, output, language, followUps, listenerTask, sourceRefs, twist) {
    return {
      id,
      title,
      context,
      roles,
      goal,
      output,
      language,
      followUps,
      listenerTask,
      sourceRefs,
      twist
    };
  }

  function openBoxFrom(items) {
    return items.slice(0, 9).map((challenge, index) => ({
      id: `box-${challenge.id}`,
      label: String(index + 1),
      title: challenge.title,
      prompt: challenge.context,
      task: challenge.goal,
      followUp: challenge.followUps[0],
      sourceRefs: challenge.sourceRefs
    }));
  }

  function situationsFrom(items) {
    return items.map((challenge) => ({
      id: `change-${challenge.id}`,
      title: challenge.title,
      firstRound: challenge.context,
      firstTask: challenge.goal,
      twist: challenge.twist.text,
      action: challenge.twist.action,
      finalOutput: challenge.output,
      sourceRefs: challenge.sourceRefs
    }));
  }

  const earlySpeaking = [
    item(
      "early-name-order",
      "名单上的姓名写反了",
      "迎新活动的名单把一位同学的姓和名写反了。两个人要一起说明正确写法。",
      ["同学：说清楚自己的姓、名、读音和正确顺序。", "工作人员：追问并确认，最后正确说出这个姓名。"],
      "把姓名改正确，并让两个人都能正确念出来。",
      "一个正确姓名和一句说明",
      ["我叫……", "请问你的名字怎么念？", "姓要放在……"],
      ["听者复述姓名。", "听者指出姓名顺序。"],
      "听完后，说出这位同学的姓和名。",
      ["E01-004", "E01-005"],
      { text: "工作人员还是把一个字念错了。", action: "换一种方法说明读音，再请对方确认。" }
    ),
    item(
      "early-name-interview",
      "认识一位新同学",
      "你们刚认识。采访者要找到这位同学姓名中最值得介绍的一个重点。",
      ["采访者：问名字怎么念、有什么意思、为什么这样取。", "新同学：回答问题，并请对方复述一个重点。"],
      "听懂一个重点，并准备向全班介绍。",
      "一段三到五句话的同学介绍",
      ["你的名字怎么念？", "是什么意思？", "为什么这样取？"],
      ["再问一个问题。", "把最重要的信息说得更清楚。"],
      "听完后，说出这个名字的意思。",
      ["E01-003", "E01-004"],
      { text: "采访者没听懂名字的意思。", action: "用一个简单例子再说明一次。" }
    ),
    item(
      "early-name-choice",
      "这个中文名字合适吗",
      "一位同学想用一个新的中文名字。两个人要判断它是否好念、好懂。",
      ["名字的主人：介绍名字的读音、意思和选择理由。", "同学：听完后说出一个优点和一个问题。"],
      "决定保留这个名字，还是调整其中一个字。",
      "一个决定和两个理由",
      ["我给自己起了个中文名字叫……", "意思是……", "话说回来……"],
      ["说出一个优点。", "说出一个问题并提出办法。"],
      "听完后，复述这个名字的意思。",
      ["E01-004", "G01-004"],
      { text: "名字很有意义，但是很难念。", action: "比较意思和读音，再做决定。" }
    ),
    item(
      "early-chang-shu",
      "“常殊”要不要改",
      "老常想给孩子起名儿叫“常殊”。一位朋友赞成，一位朋友担心这个名字会带来问题。",
      ["老常：说明“殊”的意思和自己的愿望。", "朋友：说出赞成或不赞成的理由，并给出建议。"],
      "决定保留“常殊”，还是换一个名字。",
      "一个决定和至少两个理由",
      ["我赞成／不赞成，因为……", "总不能……吧", "话说回来……"],
      ["保留一个最重要的理由。", "向听者确认最后的决定。"],
      "听完后，用一句话表示赞成或不赞成。",
      ["T01-001", "E01-006", "E01-007", "E01-008", "G01-001", "G01-004"],
      { text: "有人把“殊”听成了“叔叔”的“叔”。", action: "处理这个读音问题，再做决定。" }
    ),
    item(
      "early-pronunciation-help",
      "大家总是念错我的名字",
      "一位同学的名字常常被念错。他请同学帮忙想一个简单的说明方法。",
      ["名字的主人：说出别人常常念错的地方。", "同学：听、模仿，再提出一个容易记住的说明。"],
      "找到一种让别人更容易念对名字的方法。",
      "一句读音说明和一次正确示范",
      ["请问你的名字怎么念？", "不是……，是……", "发音有点儿……"],
      ["放慢或分开说明。", "再做一次正确示范。"],
      "听完后，全班一起念一次正确读音。",
      ["E01-003", "E01-004", "V01-014"],
      { text: "同学第一次模仿还是不准确。", action: "名字的主人要放慢或分开说明。" }
    ),
    item(
      "early-first-priority",
      "大学生活的头等大事",
      "一位新生刚进入大学，只能先做好一件事。两个人要帮他决定。",
      ["新生：说出自己现在最需要解决的问题。", "学长或学姐：提出两个选择，并说明先后顺序。"],
      "选出新生现在的头等大事，并说明原因。",
      "一个选择和一项马上能做的事",
      ["头等大事是……", "我认为应该先……", "到时候……"],
      ["说明为什么先做这件事。", "把建议改成一项小行动。"],
      "听完后，补充一个简单建议。",
      ["E01-003", "E01-011", "V01-015"],
      { text: "新生每天只有三十分钟。", action: "把建议改成一项小行动。" }
    ),
    item(
      "early-phone-in-class",
      "上课看手机怎么办",
      "老师发现一位学生上课时看手机。两个人要决定公开批评还是低调处理。",
      ["老师：说明课堂问题和自己担心的结果。", "同事：从另一个角度分析，再提出处理办法。"],
      "选出一种处理方式，并说明为什么。",
      "一个处理决定和正反两面理由",
      ["我认为……", "话说回来……", "到时候……"],
      ["说出另一个角度。", "把处理方式说得更具体。"],
      "听完后，说出他们最后选择的处理方式。",
      ["E01-003", "G01-003", "G01-004"],
      { text: "学生是在看家人的重要消息。", action: "根据新情况调整处理方式。" }
    ),
    item(
      "early-cannot-delay",
      "这件事总不能再等了吧",
      "一个人一直不处理一个已经影响生活的问题，朋友要让他今天做决定。",
      ["当事人：说明自己为什么一直没有行动。", "朋友：指出不能继续的结果，并提出今天的行动。"],
      "说出一件无论如何不能继续的事，并定下行动。",
      "一句“总不能……吧”和一个行动",
      ["总不能……吧", "我今天会……", "到时候……"],
      ["先确认对方的原因。", "把行动改小，但不能完全不做。"],
      "听完后，说出哪件事不能再继续。",
      ["G01-001", "E01-009", "G01-003"],
      { text: "当事人说自己今天没有时间。", action: "把行动改小，但不能完全不做。" }
    ),
    item(
      "early-two-sides",
      "这个选择真的好吗",
      "两个人正在讨论一个看起来很好的选择，但它也有一个明显的问题。",
      ["支持的人：先说这个选择最吸引人的地方。", "提醒的人：承认优点，再从另一方面说明问题。"],
      "从两个角度讨论，最后做出有条件的决定。",
      "一句“话说回来”和一个条件",
      ["这个选择……", "话说回来……", "这样可以，但是……"],
      ["说出一个优点。", "加上一个条件后再决定。"],
      "听完后，说出他们最后加了什么条件。",
      ["G01-004", "E01-012"],
      { text: "必须马上决定。", action: "各说一个角度，然后直接选择。" }
    )
  ];

  const completeSpeaking = [
    item(
      "complete-stranger-introduction",
      "和陌生人第一次交往",
      "两位陌生人在活动现场第一次见面，需要确认姓名和合适的称呼。",
      ["参加者：主动介绍姓名，并说明自己的姓。", "另一位参加者：礼貌追问、确认，再继续交谈。"],
      "完成一次清楚、礼貌的初次见面。",
      "一段四到六句的见面对话",
      ["您贵姓？", "我姓……", "哪个……？"],
      ["礼貌追问一次。", "修补一个听错的问题。"],
      "听完后，说出两个人的姓。",
      ["E01-021", "E01-023"],
      { text: "其中一人只听见了名字，没有听见姓。", action: "礼貌追问，再继续对话。" }
    ),
    item(
      "complete-polite-address",
      "第一次见面怎么称呼",
      "一位学生第一次见到年龄较大的老师，不知道应该怎么称呼才合适。",
      ["学生：提出两个称呼，请同学帮助选择。", "同学：比较亲热的称呼和尊称，再给出建议。"],
      "选出一个合适的称呼，并说明使用场合。",
      "一个称呼和一个理由",
      ["这是亲热的称呼还是尊称？", "是……还是……", "我建议叫……"],
      ["说出使用场合。", "根据关系改变称呼。"],
      "听完后，判断这是亲热的称呼还是尊称。",
      ["E01-021", "E01-023", "G01-006"],
      { text: "这位老师说大家可以叫得亲热一点儿。", action: "根据关系调整称呼。" }
    ),
    item(
      "complete-name-order",
      "姓名顺序怎么写",
      "国际活动要做姓名牌。不同国家的姓名顺序不一样，工作人员需要统一规则。",
      ["参加者：介绍本国姓名顺序，并举自己的姓名为例。", "工作人员：比较中文顺序，再确认姓名牌的写法。"],
      "做出不会让人误会的姓名牌规则。",
      "一条规则和两个姓名例子",
      ["姓在前，名在后。", "你们国家呢？", "这是姓还是名？"],
      ["举一个自己的例子。", "发现并修正一个写反的例子。"],
      "听完后，说出两个国家的姓名顺序。",
      ["E01-028", "E01-004"],
      { text: "工作人员把一个例子写反了。", action: "参加者要发现并修正。" }
    ),
    item(
      "complete-surname-station",
      "姓氏信息站",
      "新同学想了解常见的姓。小组要介绍两个姓，并让听者记住一个特点。",
      ["介绍者：介绍两个姓和一个特点。", "新同学：追问一个没听懂的地方，并复述重点。"],
      "让听者正确说出两个姓和一个特点。",
      "一段口头姓氏说明",
      ["常见的姓是……", "你说的是……吗？", "我听到的是……"],
      ["换一种方法说清楚。", "把两个重点排出先后。"],
      "听完后，问一个关于这个姓的问题。",
      ["E01-019", "E01-021"],
      { text: "新同学把其中一个姓听错了。", action: "介绍者要换一种方法说清楚。" }
    ),
    item(
      "complete-single-compound",
      "这个姓是单姓还是复姓",
      "同学听到几个中国姓氏，需要把它们分成单姓和复姓，并解释区别。",
      ["读姓的人：清楚地读出三个姓，其中至少有一个复姓。", "记录的人：写下听到的姓，分类并说明判断。"],
      "正确记录并分清单姓和复姓。",
      "三个姓和一次分类说明",
      ["这是单姓／复姓。", "我听到的是……", "请再读一次。"],
      ["只追问一次。", "说出判断的理由。"],
      "听完后，说出其中一个复姓。",
      ["E01-029", "E01-032"],
      { text: "记录的人漏掉了一个姓。", action: "只能追问一次，再完成记录。" }
    ),
    item(
      "complete-historical-person",
      "一分钟介绍一位历史人物",
      "小组要让不认识这位人物的同学听懂：他是谁、姓什么、做过什么重要的事。",
      ["介绍者：用三到五句话介绍人物和一件重要的事。", "听众代表：检查姓名是否清楚，并追问一个重点。"],
      "让听众记住人物的姓和一件重要的事。",
      "一段人物介绍和一个回答",
      ["他姓……，叫……", "他最重要的事是……", "你说的是……吗？"],
      ["补充一句读音说明。", "回答听众的追问。"],
      "听完后，说出你记住的一件事。",
      ["E01-031"],
      { text: "介绍时间只剩三十秒。", action: "保留姓名和最重要的一件事。" }
    ),
    item(
      "complete-name-company",
      "客户临时改变了起名条件",
      "命名顾问已经准备好一个中文名字，客户却在发表前改变了一个重要条件。",
      ["客户：说明原来的要求，并提出新的条件。", "命名顾问：调整名字或理由，完成新的提案。"],
      "提出一个符合新条件的中文名字。",
      "一个中文名字和两个理由",
      ["我建议叫……", "意思是……", "话说回来……"],
      ["说明保留了什么。", "说明改变了什么。"],
      "听完后，说出名字怎样符合新条件。",
      ["E01-016", "E01-017", "E01-018", "G01-004"],
      { text: "客户希望名字更好念。", action: "调整读音或换一个字，再说明。" }
    ),
    item(
      "complete-dialogue-summary",
      "五句话说清对话重点",
      "两个人读完一段关于姓名或姓氏的对话，要共同选出最重要的内容。",
      ["重点一：提出自己认为最重要的一点，并说明理由。", "重点二：提出不同重点，比较后一起排序。"],
      "用五句话把对话重点说清楚，不能只是重复原话。",
      "一段五句话的共同总结",
      ["最重要的是……", "话说回来……", "最后我们认为……"],
      ["删掉两句但保留完整意思。", "加入一句自己的体会。"],
      "听完后，说出他们的共同结论。",
      ["E01-033", "G01-004"],
      { text: "全班只能听三句话。", action: "删掉两句，但保留完整意思。" }
    )
  ];

  function buildModes(items, full) {
    const commonRefs = full
      ? ["E01-003", "E01-004", "E01-016", "E01-019", "E01-021", "E01-023", "E01-028", "E01-029", "E01-031", "E01-032", "E01-033", "G01-004", "G01-006"]
      : ["E01-003", "E01-004", "E01-006", "E01-008", "E01-009", "E01-011", "E01-012", "G01-001", "G01-003", "G01-004", "T01-001", "V01-014", "V01-015", "V01-016"];

    return {
      randomSpeaking: {
        title: "随机口语挑战",
        shortTitle: "随机口语",
        description: "两人先解决一个问题，再听追问，最后向全班说清楚。",
        duration: "8–12 分钟",
        items
      },
      situationChanged: {
        title: "情况有变",
        shortTitle: "情况有变",
        description: "第一轮完成后公布新条件，学生必须调整原来的决定。",
        duration: "8–15 分钟",
        items: situationsFrom(items)
      },
      openBox: {
        title: "开箱任务",
        shortTitle: "开箱",
        description: "全班选一个格子，打开后完成一项口语任务。",
        duration: "5–12 分钟",
        items: openBoxFrom(items)
      },
      teamBoard: {
        title: "团队挑战板",
        shortTitle: "团队挑战板",
        description: "小组选择题格，完成口语任务后由教师手动加分。",
        duration: "10–20 分钟",
        categories: [
          {
            id: "meaning",
            title: full ? "姓名与称呼" : "姓名与读音",
            items: [
              { id: "board-meaning-10", points: 10, prompt: items[0].context, task: items[0].goal, evidence: ["说清楚姓名或称呼。", "听者能复述重点。"], sourceRefs: items[0].sourceRefs },
              { id: "board-meaning-20", points: 20, prompt: items[1].context, task: items[1].goal, evidence: ["有追问。", "有清楚的回答。"], sourceRefs: items[1].sourceRefs },
              { id: "board-meaning-30", points: 30, prompt: items[2].context, task: items[2].goal, evidence: ["做出决定。", "说出至少一个理由。"], sourceRefs: items[2].sourceRefs }
            ]
          },
          {
            id: "pattern",
            title: full ? "句式与修补" : "句式与理由",
            items: [
              { id: "board-pattern-10", points: 10, prompt: items[3].context, task: `完成任务，并使用：${items[3].language[0]}`, evidence: ["句式放在合适的情境中。", "意思清楚。"], sourceRefs: items[3].sourceRefs },
              { id: "board-pattern-20", points: 20, prompt: items[4].context, task: `完成任务，并回应一个问题：${items[4].followUps[0]}`, evidence: ["能回应同伴。", "能补充细节。"], sourceRefs: items[4].sourceRefs },
              { id: "board-pattern-30", points: 30, prompt: items[5].context, task: `完成任务，并说明：${items[5].output}`, evidence: ["有选择。", "有理由或行动。"], sourceRefs: items[5].sourceRefs }
            ]
          },
          {
            id: "listener",
            title: "听者任务",
            items: [
              { id: "board-listener-10", points: 10, prompt: items[0].context, task: "一组说，一组听；听者复述一个重点。", evidence: ["复述内容正确。"], sourceRefs: items[0].sourceRefs },
              { id: "board-listener-20", points: 20, prompt: items[full ? 3 : 6].context, task: "听者提出一个追问，说话者必须回答。", evidence: ["问题与内容有关。", "回答没有避开问题。"], sourceRefs: items[full ? 3 : 6].sourceRefs },
              { id: "board-listener-30", points: 30, prompt: items[full ? 6 : 7].context, task: "听者指出新情况怎样改变了最后决定。", evidence: ["听者说出变化。", "小组解释最后决定。"], sourceRefs: items[full ? 6 : 7].sourceRefs }
            ]
          },
          {
            id: "report",
            title: "小组发表",
            items: [
              { id: "board-report-10", points: 10, prompt: items[6].context, task: "两人各说一句，完成一个共同决定。", evidence: ["两个人都开口。", "有共同决定。"], sourceRefs: items[6].sourceRefs },
              { id: "board-report-20", points: 20, prompt: items[7].context, task: "用三句话说清问题、办法和下一步。", evidence: ["三句话有完整意思。", "下一步具体。"], sourceRefs: items[7].sourceRefs },
              { id: "board-report-30", points: 30, prompt: items[full ? 7 : 8].context, task: "向全班发表，并回答一个追问。", evidence: ["成段表达。", "能回应追问。"], sourceRefs: items[full ? 7 : 8].sourceRefs }
            ]
          }
        ]
      },
      rankDefend: {
        title: "排名并辩护",
        shortTitle: "排名辩护",
        description: "小组先排序，再说明第一名、最后一名和一个理由。",
        duration: "10–15 分钟",
        items: full ? [
          {
            id: "rank-full-address",
            question: "第一次见面时，下面哪一个做法最重要？请小组排序。",
            criterion: "让对方听懂、感到合适，并能继续交谈。",
            options: ["先说清楚自己的姓", "确认对方怎么称呼", "听不清时礼貌追问", "说完后继续问一个问题"],
            reportPrompt: "说出第一名、最后一名，并各说一个理由。",
            sourceRefs: ["E01-021", "E01-023"]
          },
          {
            id: "rank-full-name",
            question: "给孩子起名儿时，下面哪一个条件最需要先考虑？",
            criterion: "请说明你们的标准，不需要唯一答案。",
            options: ["意思好", "发音清楚", "容易记", "有自己的愿望"],
            reportPrompt: "先说你们的标准，再说最后的排序。",
            sourceRefs: ["E01-016", "E01-017", "E01-018"]
          }
        ] : [
          {
            id: "rank-early-priority",
            question: "刚进入大学时，下面哪一件事应该先做？请小组排序。",
            criterion: "请说出你们的标准，并做出一个明确选择。",
            options: ["解决发音问题", "认识新同学", "安排每天的学习时间", "了解学校生活"],
            reportPrompt: "说出第一名、最后一名，并各说一个理由。",
            sourceRefs: ["E01-003", "V01-014", "V01-015"]
          },
          {
            id: "rank-early-name",
            question: "一个中文名字要好用，下面哪一点应该最先考虑？",
            criterion: "没有标准答案，请说明你们的选择。",
            options: ["意思好", "发音清楚", "容易介绍", "与自己的愿望有关"],
            reportPrompt: "说出第一名、最后一名，再说明一个不同意的地方。",
            sourceRefs: ["E01-004", "G01-004"]
          }
        ]
      },
      detective: {
        title: "侦探／猜猜看",
        shortTitle: "侦探猜猜看",
        description: "一组看答案，另一组用中文描述、提问或避开禁词来猜。",
        duration: "5–10 分钟",
        items: full ? [
          { id: "detective-full-sima", variant: "forbidden_words", secret: "司马", category: "姓氏", forbiddenWords: ["复姓", "两个字", "司马迁"], hints: ["这是一个姓。", "课本中把它和很多中国姓放在一起。"], sourceRefs: ["E01-029", "E01-032"] },
          { id: "detective-full-address", variant: "questions", secret: "尊称", category: "称呼", forbiddenWords: [], hints: ["第一次见面时可能会用到。", "和关系、年龄有关。"], sourceRefs: ["E01-021", "G01-006"] },
          { id: "detective-full-order", variant: "describe", secret: "姓在前，名在后", category: "姓名", forbiddenWords: ["姓", "名", "前", "后"], hints: ["这是一个姓名规则。", "不同国家可能不一样。"], sourceRefs: ["E01-028", "E01-004"] },
          { id: "detective-full-name-company", variant: "questions", secret: "起名儿公司", category: "任务", forbiddenWords: [], hints: ["客户先提出要求。", "小组要给出一个中文名字。"], sourceRefs: ["E01-016", "E01-017"] },
          { id: "detective-full-changshu", variant: "describe", secret: "常殊", category: "课文", forbiddenWords: ["老常", "特殊", "名字"], hints: ["这是课文中的一个姓名。", "朋友们对它有不同看法。"], sourceRefs: ["T01-001", "E01-006", "E01-008"] },
          { id: "detective-full-listener", variant: "questions", secret: "追问", category: "交往", forbiddenWords: [], hints: ["听不清时可以做。", "做完以后对方要继续回答。"], sourceRefs: ["E01-021", "E01-023"] }
        ] : [
          { id: "detective-early-changshu", variant: "describe", secret: "常殊", category: "课文", forbiddenWords: ["老常", "特殊", "名字"], hints: ["这是课文中的姓名。", "朋友们对它有不同看法。"], sourceRefs: ["T01-001", "E01-006", "E01-008"] },
          { id: "detective-early-pronunciation", variant: "questions", secret: "发音", category: "学习", forbiddenWords: [], hints: ["学习汉语时可能遇到问题。", "可以请同学帮助。"], sourceRefs: ["E01-003", "V01-014"] },
          { id: "detective-early-first-priority", variant: "describe", secret: "头等大事", category: "大学生活", forbiddenWords: ["大学", "第一", "重要"], hints: ["这是一个最先要解决的事情。", "新生可能会讨论它。"], sourceRefs: ["E01-003", "V01-015"] },
          { id: "detective-early-awkward", variant: "questions", secret: "别扭", category: "感受", forbiddenWords: [], hints: ["这是一个感觉。", "语言和生活习惯不同的时候可能有这种感觉。"], sourceRefs: ["E01-003", "V01-016"] },
          { id: "detective-early-change", variant: "forbidden_words", secret: "情况有变", category: "任务", forbiddenWords: ["新", "条件", "改变"], hints: ["第一轮以后才出现。", "出现以后要重新组织语言。"], sourceRefs: ["E01-009", "G01-001"] },
          { id: "detective-early-two-sides", variant: "describe", secret: "话说回来", category: "句式", forbiddenWords: ["角度", "另外", "但是"], hints: ["说完一面以后可以用。", "后面通常还有真正想说的重点。"], sourceRefs: ["E01-012", "G01-004"] }
        ]
      },
      mission: {
        title: "任务解决",
        shortTitle: "任务解决",
        description: "小组分工、讨论、面对新限制，最后完成一个口头决定或报告。",
        duration: "15–25 分钟",
        items: full ? [
          {
            id: "mission-full-name-company",
            title: "起名儿公司",
            brief: "客户想给孩子起一个中文名字。命名顾问要先问清要求，再提出名字和理由。",
            roles: ["客户：说明性别、愿望和发音要求。", "命名顾问：提问、比较并提出名字。", "观察员：记录每个人说过的一点。"],
            resources: ["客户的要求：名字要有意义，也要容易念。", "小组需要保留一个优点，并说明一个可能的问题。"],
            steps: ["先问清客户的要求。", "提出两个可能的名字并比较。", "公布新条件：客户希望名字更好念。", "完成最后提案：名字、两个理由和一个提醒。"],
            deliverable: "一个中文名字、两个理由和一次客户追问",
            personalEvidence: "每个人至少说一个问题、理由或回应。",
            sourceRefs: ["E01-016", "E01-017", "E01-018", "G01-004"]
          },
          {
            id: "mission-full-surname-station",
            title: "姓氏信息站",
            brief: "新同学想了解中国人的姓。小组要把姓名顺序、常见姓和单姓／复姓说清楚。",
            roles: ["介绍者：提供课本中的信息。", "提问者：提出一个听者问题。", "记录者：记下听到的两个姓和一个特点。"],
            resources: ["可以使用课本中的单姓、复姓和姓名顺序。", "最后听者必须能复述重点。"],
            steps: ["先决定介绍哪两个姓。", "互相说明并记录重点。", "公布新限制：听者把一个姓听错了。", "修补说明并完成一分钟报告。"],
            deliverable: "两个姓、一个特点和一次听者复述",
            personalEvidence: "每个人至少问、说或复述一次。",
            sourceRefs: ["E01-019", "E01-021", "E01-028", "E01-029", "E01-032"]
          },
          {
            id: "mission-full-first-meeting",
            title: "第一次见面",
            brief: "两位参加者第一次见面，要确认姓名、姓和合适的称呼，并让对话继续。",
            roles: ["参加者一：主动介绍姓名。", "参加者二：礼貌追问并确认。", "听众：指出一次修补。"],
            resources: ["可以使用“您贵姓？”、“哪个……？”等教材表达。", "对话结束时要留下清楚的称呼。"],
            steps: ["完成第一次见面。", "听者指出一个不清楚的地方。", "公布新限制：其中一人只听见了名字。", "重新演出并说明怎样修补。"],
            deliverable: "一段四到六句的见面对话和一次修补",
            personalEvidence: "每位参加者都要说话，听众要提出一个问题。",
            sourceRefs: ["E01-021", "E01-023", "E01-026", "G01-006"]
          }
        ] : [
          {
            id: "mission-early-name",
            title: "常殊起名咨询",
            brief: "老常想保留“常殊”，朋友要先听懂他的愿望，再说明赞成或不赞成的理由。",
            roles: ["老常：说明“殊”的意思和愿望。", "朋友：提出担心，并给出建议。", "听众：最后选择最有说服力的理由。"],
            resources: ["课文信息：‘殊’表示特殊，老常希望孩子与众不同。", "朋友可以从读音、意思或将来使用来说明。"],
            steps: ["先听懂老常的愿望。", "朋友提出理由并共同讨论。", "公布新限制：有人把“殊”听成了“叔”。", "完成最后决定并向全班报告。"],
            deliverable: "保留或修改的决定、两个理由和一次读音说明",
            personalEvidence: "每个人至少说一个理由，听众说出最后决定。",
            sourceRefs: ["T01-001", "E01-006", "E01-007", "E01-008", "G01-001", "G01-004"]
          },
          {
            id: "mission-early-first-step",
            title: "新生的头等大事",
            brief: "新生刚进入大学，有几个问题要解决。小组要帮他选出现在最先要做的一件事。",
            roles: ["新生：说明自己最困惑的地方。", "同学：提出两个办法并比较。", "听众：听完后补充一个建议。"],
            resources: ["问题可以与发音、交流或大学生活有关。", "最后的办法必须是今天能开始做的。"],
            steps: ["先说清楚问题。", "提出两个选择并说明理由。", "公布新限制：每天只有三十分钟。", "改成一项小行动并发表。"],
            deliverable: "一个选择、一个理由和一项今天能做的行动",
            personalEvidence: "每个人至少说一个选择、理由或追问。",
            sourceRefs: ["E01-003", "E01-011", "V01-014", "V01-015"]
          },
          {
            id: "mission-early-phone",
            title: "课堂看手机怎么办",
            brief: "老师发现学生上课看手机。小组要讨论公开处理还是低调处理，并说明理由。",
            roles: ["老师：说明课堂问题。", "同事：提出另一个角度。", "听众：判断新情况怎样改变决定。"],
            resources: ["可以从课堂效果、学生感受和处理结果说明。", "开放题没有唯一答案，教师按理由与可理解度判断。"],
            steps: ["说清楚问题和两个选择。", "各自说明一个角度。", "公布新限制：学生是在看家人的重要消息。", "重新决定并向全班说清楚。"],
            deliverable: "一个处理决定、两个角度和一次调整",
            personalEvidence: "每个人至少说一个角度，听众说出变化。",
            sourceRefs: ["E01-003", "G01-003", "G01-004"]
          }
        ]
      },
      retrieval: {
        title: "快速回忆赛",
        shortTitle: "快速回忆",
        description: "短时间回收教材信息；教师手动判断答案，不把口语题变成自动评分。",
        duration: "5–10 分钟",
        items: full ? [
          { id: "retrieve-full-1", prompt: "请说出中国人的姓名顺序，并和你们国家比较。", evidence: "说出姓名顺序，并给出一个比较。", sourceRefs: ["E01-028", "E01-004"] },
          { id: "retrieve-full-2", prompt: "请解释什么是复姓，并说出一个课本中的复姓。", evidence: "说出定义和一个例子。", sourceRefs: ["E01-029", "E01-032"] },
          { id: "retrieve-full-3", prompt: "第一次见面时，如果没有听清对方的姓，可以怎样问？", evidence: "提出礼貌追问，并让对话继续。", sourceRefs: ["E01-021", "E01-023"] },
          { id: "retrieve-full-4", prompt: "请用三句话介绍一位历史人物：姓、名字和一件重要的事。", evidence: "有姓名、有一件事、听者能听懂。", sourceRefs: ["E01-031"] },
          { id: "retrieve-full-5", prompt: "请说出一个‘是……还是……’的问题，并让同伴选择。", evidence: "问题有两个清楚的选择。", sourceRefs: ["E01-027", "G01-006"] },
          { id: "retrieve-full-6", prompt: "请说一句‘不然……’，并说明不这样做的结果。", evidence: "有行动和结果，意思清楚。", sourceRefs: ["E01-027", "G01-005"] }
        ] : [
          { id: "retrieve-early-1", prompt: "请说出一个学习汉语时发音不准的解决办法。", evidence: "有一个具体办法，并能说明怎么做。", sourceRefs: ["E01-003", "V01-014"] },
          { id: "retrieve-early-2", prompt: "老常为什么给孩子起名儿叫‘常殊’？", evidence: "说出‘殊’的意思和老常的愿望。", sourceRefs: ["T01-001", "E01-008"] },
          { id: "retrieve-early-3", prompt: "请用‘总不能……吧’说出一个不能继续的做法。", evidence: "说出一个明确的底线。", sourceRefs: ["E01-009", "G01-001"] },
          { id: "retrieve-early-4", prompt: "请用‘到时候’说一个将来的联系或提醒。", evidence: "说清楚将来的时间和要做的事。", sourceRefs: ["E01-011", "G01-003"] },
          { id: "retrieve-early-5", prompt: "请用‘话说回来’从另一个角度补充意见。", evidence: "前后有两个角度，意思有关。", sourceRefs: ["E01-012", "G01-004"] },
          { id: "retrieve-early-6", prompt: "请说出一个刚进入大学时的‘头等大事’，并说明原因。", evidence: "有一个选择和一个理由。", sourceRefs: ["E01-003", "V01-015"] }
        ]
      },
      sourceRefs: commonRefs
    };
  }

  const earlyAllowed = [
    "E01-003", "E01-004", "E01-005", "E01-006", "E01-007", "E01-008", "E01-009", "E01-010", "E01-011", "E01-012",
    "G01-001", "G01-002", "G01-003", "G01-004", "T01-001", "V01-014", "V01-015", "V01-016", "V01-017", "V01-018"
  ];
  const completeAllowed = [
    "E01-003", "E01-004", "E01-005", "E01-006", "E01-007", "E01-008", "E01-009", "E01-010", "E01-011", "E01-012",
    "E01-013", "E01-014", "E01-015", "E01-016", "E01-017", "E01-018", "E01-019", "E01-020", "E01-021", "E01-022",
    "E01-023", "E01-024", "E01-025", "E01-026", "E01-027", "E01-028", "E01-029", "E01-030", "E01-031", "E01-032", "E01-033",
    "G01-001", "G01-002", "G01-003", "G01-004", "G01-005", "G01-006", "G01-007", "T01-001"
  ];

  suite.registerPack({
    schemaVersion: 1,
    id: "lesson-01-early",
    lessonId: "lesson-01",
    lessonTitle: "中国人的姓名",
    title: "第一课：听说（一）后",
    stage: "完成听说（一）口语句式后",
    status: "approved",
    description: "只使用前半课已经接触的姓名、发音、理由和四个口语句式。",
    defaultSeconds: { speaking: 45, change: 30, present: 60 },
    allowedSourceRefs: earlyAllowed,
    modes: buildModes(earlySpeaking, false)
  });

  suite.registerPack({
    schemaVersion: 1,
    id: "lesson-01-complete-suite",
    lessonId: "lesson-01",
    lessonTitle: "中国人的姓名",
    title: "第一课：全课口语综合",
    stage: "完成第一课听说（二）后",
    status: "approved",
    description: "综合姓名、姓氏、称呼、文化比较、句式修补和成段表达。",
    defaultSeconds: { speaking: 50, change: 35, present: 75 },
    allowedSourceRefs: completeAllowed,
    modes: buildModes(completeSpeaking, true)
  });
})(window);
