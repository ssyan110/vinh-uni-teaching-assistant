# 内容包编写规范

## 原则

每个内容包对应一个明确的“已经学完”边界。教师选择哪个内容包，随机题库就只能从该边界内抽题。不要建立一个混合全课程内容、再靠教师临场跳题的大题库。

旧课语言只能帮助学生完成当前课任务，不能成为题目主题。例如，学生以前学过购物、交通或天气，不代表姓名课要再练这些情境。每个内容包必须声明旧语言依据和本课主题；题目的新信息、沟通问题与结果都要集中在本课主题。

每个情境必须包含：

1. 一个真实或可想象的角色关系。
2. 双方需要交换的信息、不同意见或需要共同解决的问题。
3. 一个可观察的结果，例如决定、建议、说明、修补后的对话或共同报告。
4. 至少三个与原情境相容的新情况，每个情况都要求学生调整内容。
5. 明确的向全班说的方式。
6. 至少两个全班听众任务，让听众也需要理解、回应或追问。
7. 对应当前权威教材或最终 PPT 的来源编号；来源编号不显示在学生画面。

句式是帮助学生完成任务的资源，不是必须逐项打卡的答案。建议语言最多三条。

## 基本结构

```javascript
(function registerPack(global) {
  "use strict";

  global.SpeakingChallenge.registerPack({
    schemaVersion: 1,
    id: "lesson-02-stage-a",
    lessonId: "lesson-02",
    title: "第二课：学生看见的名称",
    stage: "完成第一个学习阶段后",
    description: "教师选择时看见的范围说明。",
    priorLanguageSource: "reference/prior-boya-i-ii-language-baseline.csv",
    focusTopics: ["本课主题一", "本课主题二"],
    defaultSeconds: { practice: 40, change: 25, present: 45 },
    allowedSourceRefs: ["E02-001"],
    challenges: [
      {
        id: "l02a-unique-id",
        focus: "本课主题一",
        title: "一个需要解决的问题",
        situation: "角色为什么现在必须交谈。",
        roles: [
          { name: "角色一", action: "需要知道或说明什么。" },
          { name: "角色二", action: "需要知道或说明什么。" }
        ],
        goal: "两个人最后要解决什么。",
        outcome: "要留下的口语结果",
        language: ["已经学过的表达一", "已经学过的表达二"],
        conditions: [
          { change: "一个相容的新情况。", action: "学生必须怎样调整。" },
          { change: "第二个相容的新情况。", action: "学生必须怎样调整。" },
          { change: "第三个相容的新情况。", action: "学生必须怎样调整。" }
        ],
        presentation: "谁向全班说，另一位学生做什么。",
        audience: ["全班听完要做什么。", "另一个听众任务。"],
        sourceRefs: ["E02-001"]
      }
    ]
  });
})(window);
```

## 接入步骤

1. 把新内容文件放进 `content/`。
2. 在 `index.html` 中把它放在 `content/registry.js` 后、`app.js` 前。
3. 执行 `node qa/validate-content.mjs`。
4. 用 Chrome 与 Safari 实际完成至少一轮：开始、计时、新情况、向全班说、完成、下一题。
5. 断开网络再打开一次，确认没有外部请求。
