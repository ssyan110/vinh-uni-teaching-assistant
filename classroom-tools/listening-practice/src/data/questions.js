export const seedQuestionSets = [
  {
    id: "demo-lesson-01-listening",
    lessonKey: "boya-quasi-intermediate-i:lesson-01",
    lessonTitle: "丽丽是独生女",
    title: "听力练习 A",
    status: "demo",
    version: "demo-2026-08-31-v1",
    printedPages: "教材 P1–P6",
    sourceStatus: "示例题组；正式题目须从已批准的课程资料导入。",
    audio: {
      label: "音频 1-1",
      url: "https://tcv.clewm.net/f0ZhdfBuStBT1zwU3OUQUMDT9tQ=/FoLz3BtWhyeedQ79W5vQMj3Yx16s",
      note: "音频来源与语义状态以课程来源包为准。"
    },
    questions: [
      {
        id: "demo-01",
        type: "keywords",
        prompt: "听音频，写下你听到的三个关键词。",
        points: 3,
        answer: null,
        grading: "manual"
      },
      {
        id: "demo-02",
        type: "short",
        prompt: "再听一次，用一句话写下你听到的主要信息。",
        points: 2,
        answer: null,
        grading: "manual"
      }
    ]
  }
];
