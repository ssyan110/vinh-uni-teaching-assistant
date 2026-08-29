#!/usr/bin/env node
'use strict';

// Draft-only PPTX builder for lessons 2 through 10 of
// 《博雅汉语听说：准中级加速篇 I》.  It reads each lesson's canonical source,
// image manifest and audio directory, then writes only to that lesson's
// 10-design/pptx-draft directory.  It never writes 20-approved or 40-release.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const PptxGenJS = require('pptxgenjs');
const design = require('./boya_design_system');
const { toSimplified } = require('./simplify_chinese');

const ROOT = path.resolve(__dirname, '..');
const PYTHON = process.env.BOYA_PYTHON || 'python3';
const W = 13.333;
const H = 7.5;
const C = design.colors;
const CJK = design.fonts.cjk;
const LATIN = design.fonts.latin;
const DEFAULT_LESSON_NUMBERS = [2, 3, 4, 5, 6, 7, 8, 9, 10];
const ONLINE_LAYOUT_CONTRACT_PATH = path.join(ROOT, 'course/boya-online-layout-contract.json');
const ONLINE_LAYOUT = JSON.parse(fs.readFileSync(ONLINE_LAYOUT_CONTRACT_PATH, 'utf8'));
const L1_ASSET_ROOT = path.join(ROOT, 'lessons/boya-quasi-intermediate-i/lesson-01/10-design/image-assets-draft');
const MAX_SHORT_EXAMPLE_CHARS = 24;
let ACTIVE_MODE = 'online';

function requestedLessonNumbers() {
  const args = process.argv.slice(2);
  const keyIndex = args.indexOf('--lesson-key');
  if (keyIndex === -1) {
    throw new Error('--lesson-key is required; do not generate an unscoped lesson draft');
  }
  const lessonKey = args[keyIndex + 1];
  const match = /^boya-quasi-intermediate-i:lesson-(\d{2})$/.exec(String(lessonKey || ''));
  if (!match) throw new Error('--lesson-key must be boya-quasi-intermediate-i:lesson-XX');
  const number = Number(match[1]);
  if (!DEFAULT_LESSON_NUMBERS.includes(number)) {
    throw new Error(`This draft builder is scoped to lessons ${DEFAULT_LESSON_NUMBERS.join(', ')}; received ${lessonKey}`);
  }
  return [number];
}

function validateOnlineLayoutContract() {
  if (ONLINE_LAYOUT.contract_id !== 'boya-quasi-intermediate-i-online-v1') throw new Error('Unexpected online layout contract');
  if (ONLINE_LAYOUT.scope_policy !== 'layout_and_reusable_microcopy_only') throw new Error('Online contract scope must remain layout-only');
  if (ONLINE_LAYOUT.cover?.online_label !== '在线课' || ONLINE_LAYOUT.cover?.subtitle !== '听一听，问一问，说一说。') throw new Error('Online cover text contract is incomplete');
  if (ONLINE_LAYOUT.learning_route?.title !== '学习流程图' || ONLINE_LAYOUT.learning_route?.asset !== 'learning-route-user-supplied-transparent.png') throw new Error('Learning-route contract is incomplete');
  if (ONLINE_LAYOUT.vocabulary?.practice_after_every !== 5 || ONLINE_LAYOUT.vocabulary?.practice_title !== '请你说说它们的中文并造句') throw new Error('Vocabulary practice contract is incomplete');
  if (ONLINE_LAYOUT.vocabulary?.extension_policy !== 'empty_until_explicitly_supplied' || ONLINE_LAYOUT.vocabulary?.extension_label !== '扩展：') throw new Error('Vocabulary expansion contract is incomplete');
  if (ONLINE_LAYOUT.ending?.slides?.length !== 3 || ONLINE_LAYOUT.ending.slides[0]?.title !== '我觉得很难的地方' || ONLINE_LAYOUT.ending.slides[1]?.title !== '课前检查' || ONLINE_LAYOUT.ending.slides[2]?.title !== '谢谢大家，我们课堂见。') throw new Error('Fixed ending contract is incomplete');
  if (ONLINE_LAYOUT.fonts?.cjk !== CJK || ONLINE_LAYOUT.fonts?.latin !== LATIN || Number(ONLINE_LAYOUT.fonts?.minimum_visible_pt) < 20) throw new Error('Font contract is incomplete');
}

validateOnlineLayoutContract();

const LESSON_NUMBER_LABELS = {
  1: '一', 2: '二', 3: '三', 4: '四', 5: '五', 6: '六',
  7: '七', 8: '八', 9: '九', 10: '十', 11: '十一', 12: '十二'
};

function lessonNumberLabel(number) {
  return LESSON_NUMBER_LABELS[number] || String(number);
}

function lessonLabel(lesson) {
  return `第${lessonNumberLabel(lesson.number)}课`;
}

const POS_USAGE = {
  '名': '介绍人、事物或生活信息',
  '动': '说明动作、经历或计划',
  '形': '说明状态、感觉或评价',
  '副': '修饰动作或状态',
  '代': '指另一个人、事物或地方',
  '量': '表示动作或事物的数量',
  '连': '连接前后两个意思',
  '动／副': '表示动作继续或随后发生',
  '': '请结合教材句子理解和使用'
};

// The canonical source stores English glosses for audit purposes.  Student
// screens remain fully Chinese, so these are concise Chinese explanations;
// the source word, pinyin and source text remain the authority.
const GLOSS_CN = {
  '排球': '一种球类运动', '志愿者': '主动帮助别人的人', '讲解员': '为参观者介绍展品的人',
  '博物馆': '收藏和展示物品的地方', '展品': '在展览中展示的物品', '体育课': '学习体育的课',
  '了解': '知道并明白', '周围': '附近的地方', '基本': '大体上', '不知不觉': '没有注意到',
  '热烈': '气氛积极、感情强烈', '游客': '来参观的人', '布置': '安排和摆放', '尤其': '特别是',
  '交流': '互相说话、交换想法', '顿': '表示吃饭等次数', '庆祝': '用活动表示高兴', '特点': '特别的地方',
  '环境': '周围的情况', '熟悉': '知道得很清楚', '感觉': '身体或心里的感受', '收获': '得到的东西或经验',
  '插': '放进或立在里面', '接着': '然后', '科学': '研究自然和社会规律的知识', '参观': '到地方看一看',
  '举办': '组织活动', '增长': '增加、提高', '同时': '在同一时间',
  '兴趣': '喜欢并想了解的事', '古老肉': '一种酸甜口味的菜', '西红柿炒鸡蛋': '西红柿和鸡蛋一起炒的菜',
  '暑假': '学校暑期放的假', '招待': '热情地接待客人', '聊天儿': '轻松地说话', '转学': '换到另一所学校学习',
  '上（菜）': '把做好的菜送到桌上', '司机': '开车的人', '快餐店': '提供快速餐点的店', '点（菜）': '选择要吃的菜',
  '阅读': '看书或看文字', '语伴': '一起练习语言的伙伴', '讲座': '有人讲话、介绍知识的活动', '国际': '和多个国家有关',
  '发现': '找到以前不知道的情况', '习惯': '慢慢适应并觉得正常', '新闻': '最近发生的事情', '字幕': '画面下方的文字',
  '加倍': '比原来多一倍或更加努力', '解释': '说明意思或原因', '词语': '词和表达', '效率': '做事快而且效果好',
  '印象': '留下的感觉', '吃惊': '感到意外', '聊': '轻松地说话', '通常': '平常大多数时候', '听力': '听懂话的能力',
  '异同': '相同和不同的地方', '量': '数量或分量', '饿': '想吃东西的感觉',
  '另外': '别的、另一个', '互相': '彼此', '有趣': '让人觉得有意思', '声调': '说话时声音的高低变化',
  '重复': '再说或再做一次', '接触': '接近并了解', '帮忙': '帮助别人做事', '记得': '没有忘记',
  '例如': '举例说明', '中国通': '很了解中国的人', '神秘': '让人觉得不了解', '开（课）': '学校安排这门课',
  '总是': '一直这样', '更': '表示程度增加', '于是': '表示前面的事引出后面的结果', '选修': '按照兴趣选择学习',
  '德语': '德国的语言', '拉丁语': '拉丁语'
};

// 第一課核准稿使用的是「一詞一頁＋一個可直接朗讀的短句」。
// 後續課次不得從長課文或長例句自動抽取文字；每個詞語都必須有獨立、短小、
// 可替換成學生自身資訊的例句。這份表是內容規格的一部分，不是 fallback 文案。
const SHORT_EXAMPLES = {
  2: {
    '排球': '我喜欢打排球。',
    '志愿者': '她是学校的志愿者。',
    '讲解员': '她以后要当讲解员。',
    '博物馆': '我去过科学博物馆。',
    '展品': '我最喜欢那件展品。',
    '体育课': '今天上午有体育课。',
    '了解': '我对学校有了了解。',
    '周围': '学校周围有很多商店。',
    '基本': '我基本适应了大学生活。',
    '不知不觉': '不知不觉，天已经黑了。',
    '热烈': '大家讨论得很热烈。',
    '游客': '导游带游客参观校园。',
    '布置': '我们一起布置教室。',
    '尤其': '我喜欢运动，尤其是排球。',
    '交流': '我喜欢和同学交流。',
    '顿': '我们一起吃一顿饭。',
    '庆祝': '我们一起庆祝生日。',
    '特点': '这门课有自己的特点。',
    '环境': '这里的环境让人很放松。',
    '熟悉': '搬来以后，我慢慢熟悉了这座城市。',
    '感觉': '下课以后，我感觉轻松多了。',
    '收获': '参加比赛以后，我收获了信心。',
    '插': '她把蜡烛插在蛋糕上。',
    '接着': '吃完饭，接着唱歌。',
    '科学': '我对科学很有兴趣。',
    '参观': '周末我们去参观博物馆。',
    '举办': '市里下个月举办音乐节。',
    '增长': '阅读可以增长知识。',
    '同时': '我学习中文，同时了解文化。'
  },
  3: {
    '兴趣': '我对中文有兴趣。',
    '古老肉': '我喜欢吃古老肉。',
    '西红柿炒鸡蛋': '我会做西红柿炒鸡蛋。',
    '暑假': '暑假我想回家。',
    '招待': '周末我要招待朋友。',
    '聊天儿': '我喜欢和朋友聊天儿。',
    '转学': '他明年要转学。',
    '另外': '我还想学另外一门语言。',
    '互相': '同学们互相帮助。',
    '有趣': '学中文很有趣。',
    '声调': '中文的声调不容易。',
    '重复': '请你再重复一遍。',
    '接触': '我想多接触中文。',
    '帮忙': '你能帮忙吗？',
    '记得': '我记得那一天。',
    '例如': '我喜欢中国菜，例如饺子。',
    '中国通': '他是一个中国通。',
    '神秘': '中文以前对我很神秘。',
    '开（课）': '学校下学期开中文课。',
    '总是': '他总是认真听课。',
    '更': '写汉字更难。',
    '于是': '我很感兴趣，于是开始学习。',
    '选修': '我决定选修中文。',
    '德语': '我以前学过德语。',
    '拉丁语': '学校还开拉丁语课。'
  },
  4: {
    '上（菜）': '服务员把热菜端上来了。', '司机': '司机在路口停下车。', '快餐店': '这家快餐店中午人很多。', '点（菜）': '请先看菜单，再点菜。',
    '阅读': '睡前阅读让我很安静。', '语伴': '我的语伴会纠正发音。', '讲座': '这场讲座介绍北京文化。', '国际': '学校有国际学生中心。',
    '发现': '我在地图上发现了新路线。', '习惯': '他很快习惯了早起。', '新闻': '爸爸早上听新闻。', '字幕': '我打开字幕学习发音。',
    '加倍': '考试前她加倍练习听力。', '解释': '请你解释这个词的意思。', '词语': '我把新词语写在卡片上。', '效率': '安静的房间能提高效率。',
    '印象': '这次旅行给我留下深刻印象。', '吃惊': '听到这个消息，他非常吃惊。', '聊': '晚饭后我们聊了几分钟。', '通常': '我通常坐公交车上学。',
    '听力': '每天听十分钟，听力会进步。', '异同': '小组正在讨论两地的异同。', '量': '请少放一点儿盐，菜量够了。', '饿': '走了一上午，我现在很饿。'
  }
};

// Every vocabulary page follows the approved Lesson 1 rule of two short,
// speakable examples.  Keep these sentences explicit and short; never fall
// back to a sentence copied from a textbook paragraph.
const SHORT_EXAMPLES_SECOND = {
  2: {
    '排球': '她每周都打排球。',
    '志愿者': '我想当一名志愿者。',
    '讲解员': '博物馆需要讲解员。',
    '博物馆': '下雨天，我们去了博物馆。',
    '展品': '请不要用手摸展品。',
    '体育课': '我喜欢上体育课。',
    '了解': '我想了解这里的生活。',
    '周围': '我常在学校周围散步。',
    '基本': '我基本完成了作业。',
    '不知不觉': '不知不觉，雨停了。',
    '热烈': '大家的掌声很热烈。',
    '游客': '游客正在门口排队。',
    '布置': '我们正在布置房间。',
    '尤其': '我尤其喜欢这门课。',
    '交流': '我们常用中文交流。',
    '顿': '我今天吃了两顿饭。',
    '庆祝': '我们一起庆祝新年。',
    '特点': '这家店的特点很明显。',
    '环境': '安静的环境适合读书。',
    '熟悉': '你可以先熟悉一下路线。',
    '感觉': '第一次上台，我有点儿紧张。',
    '收获': '这次采访让我认识了新朋友。',
    '插': '请把花插在瓶子里。',
    '接着': '下课后，接着上自习。',
    '科学': '我喜欢看科学杂志。',
    '参观': '明天我们去参观学校。',
    '举办': '社区周末举办跳蚤市场。',
    '增长': '运动可以增长体力。',
    '同时': '她学习中文，同时工作。'
  },
  3: {
    '兴趣': '我对音乐也有兴趣。',
    '古老肉': '这家饭店的古老肉很好吃。',
    '西红柿炒鸡蛋': '妈妈常做西红柿炒鸡蛋。',
    '暑假': '暑假我们一起旅行。',
    '招待': '谢谢你热情招待我。',
    '聊天儿': '我们下课后聊天儿。',
    '转学': '他因为搬家要转学。',
    '另外': '你还需要另外一张纸。',
    '互相': '我们在学习上互相帮助。',
    '有趣': '这个故事很有趣。',
    '声调': '请注意汉语的声调。',
    '重复': '老师请我重复一遍。',
    '接触': '多接触中文会有进步。',
    '帮忙': '谢谢你帮忙。',
    '记得': '你还记得他的名字吗？',
    '例如': '我喜欢水果，例如苹果。',
    '中国通': '她对中国很了解，是个中国通。',
    '神秘': '这个地方看起来很神秘。',
    '开（课）': '学校今年开了日语课。',
    '总是': '她总是按时到校。',
    '更': '多练习以后会更熟练。',
    '于是': '他很喜欢，于是买了一本。',
    '选修': '我准备选修历史课。',
    '德语': '她正在学习德语。',
    '拉丁语': '他对拉丁语有兴趣。'
  },
  4: {
    '上（菜）': '我们等了十分钟，菜才上来。', '司机': '那位司机很熟悉北京的路。', '快餐店': '学生常在快餐店吃午饭。', '点（菜）': '你想点什么菜？',
    '阅读': '周末我会阅读一本小说。', '语伴': '我和语伴约在图书馆见面。', '讲座': '讲座结束后可以提问。', '国际': '她参加了国际会议。',
    '发现': '他发现自己听错了一个词。', '习惯': '我还没有习惯这里的天气。', '新闻': '这条新闻很快传开了。', '字幕': '没有字幕，我听不懂这部电影。',
    '加倍': '为了赶上进度，他加倍工作。', '解释': '她耐心地解释了原因。', '词语': '这个词语在课文里出现两次。', '效率': '一起讨论可以提高学习效率。',
    '印象': '那位老师给我留下了好印象。', '吃惊': '看到这么大的雪，大家都很吃惊。', '聊': '他们边喝茶边聊旅行。', '通常': '商店通常九点开门。',
    '听力': '听完录音，请写下关键词。', '异同': '你能说出这两个词的异同吗？', '量': '这杯水的量刚刚好。', '饿': '午饭前我常常觉得饿。'
  }
};

const SHORT_EXPRESSION_EXAMPLES = {
  2: {
    '对……熟悉／对……有了了解': '我对这里很熟悉。',
    '尤其': '我喜欢运动，尤其是排球。',
    '虽然……可是……': '虽然很累，可是我很开心。',
    '不知不觉': '不知不觉，天黑了。',
    '同时': '我学习中文，同时学文化。',
    '给……办／介绍': '我们给妈妈办生日会。',
    '处所＋动词＋着＋人／物': '桌上摆着一本书。',
    '接着': '吃完饭，接着唱歌。',
    '安安静静／舒舒服服／急急忙忙／开开心心＋（地）＋动词词组': '我想安安静静地看书。',
    '量词': '我吃了两顿饭。',
    '自从……以来': '自从上大学以来，我常运动。',
    '每……都……': '我每天都听中文。',
    '不但……同时……': '运动不但健康，同时很有趣。',
    '其中': '班里有十个人，其中我最安静。',
    '过得': '我周末过得很开心。'
  },
  3: {
    '每＋量词': '我每年都回家。',
    '帮／忙': '周末我帮妈妈做饭。',
    '……什么的': '我喜欢饺子、面条什么的。',
    '……（的）时候': '上课的时候，我很认真。',
    '记得': '我记得第一次上课。',
    '可以……也可以……': '学中文可以交朋友，也可以旅行。',
    '另（外）': '我想学另外一门语言。',
    '更（1）': '我现在对中文更有兴趣。',
    '动词＋得（1）': '老师说得很清楚。',
    '但是': '我喜欢中文，但是声调很难。',
    '于是': '我很感兴趣，于是开始学习。',
    '更（2）': '写汉字更难。',
    '互相': '同学们互相帮助。',
    '遍': '请再说一遍。'
  }
};

const SHORT_EXPRESSION_EXAMPLES_SECOND = {
  2: {
    '对……熟悉／对……有了了解': '我对这本教材有了了解。',
    '尤其': '他喜欢运动，尤其是游泳。',
    '虽然……可是……': '虽然下雨，可是我还是来了。',
    '不知不觉': '不知不觉，时间过去了。',
    '同时': '他工作，同时学习中文。',
    '给……办／介绍': '我给朋友办生日会。',
    '处所＋动词＋着＋人／物': '墙上挂着一张画。',
    '接着': '他说完，接着问问题。',
    '安安静静／舒舒服服／急急忙忙／开开心心＋（地）＋动词词组': '孩子们开开心心地玩。',
    '量词': '我吃了三顿饭。',
    '自从……以来': '自从毕业以来，我常旅行。',
    '每……都……': '我每天都练习发音。',
    '不但……同时……': '中文不但有趣，同时很有用。',
    '其中': '我们班有五个人，其中他最高。',
    '过得': '她在这里过得很好。'
  },
  3: {
    '每＋量词': '我每周上三节课。',
    '帮／忙': '他帮我拿书。',
    '……什么的': '我喜欢茶、咖啡什么的。',
    '……（的）时候': '吃饭的时候，我们聊天儿。',
    '记得': '我记得你的生日。',
    '可以……也可以……': '周末可以学习，也可以休息。',
    '另（外）': '我想买另外一本书。',
    '更（1）': '他学得越多，兴趣更大。',
    '动词＋得（1）': '她说中文说得很清楚。',
    '但是': '我想去，但是今天下雨。',
    '于是': '他有兴趣，于是开始学习。',
    '更（2）': '今天比昨天更冷。',
    '互相': '同学们在课堂上互相学习。',
    '遍': '请再读两遍。'
  }
};

function sharedAsset(name) {
  const filePath = path.join(L1_ASSET_ROOT, name);
  return fs.existsSync(filePath) ? filePath : null;
}

function assertShortSentence(value, label) {
  const example = String(value || '').trim();
  const compact = example.replace(/[，。！？；、：“”‘’（）()…\s]/g, '');
  if (!example || compact.length > MAX_SHORT_EXAMPLE_CHARS || /\n/.test(example)) {
    throw new Error(`${label} 必须是 ${MAX_SHORT_EXAMPLE_CHARS} 个汉字以内的单句：${example}`);
  }
  return example;
}

function assertExampleVariety(lesson) {
  const entries = [...regularVocabEntries(lesson), ...properNounEntries(lesson)];
  const examples = [];
  entries.forEach((entry) => {
    [SHORT_EXAMPLES[lesson.number]?.[entry.word], SHORT_EXAMPLES_SECOND[lesson.number]?.[entry.word]].forEach((sentence) => {
      if (!sentence) return;
      const skeleton = String(sentence).replace(entry.word.replace(/[（）]/g, ''), '<词>').replace(/[“”‘’]/g, '').replace(/[，。！？；、：\s]/g, '');
      examples.push({ word: entry.word, sentence, skeleton });
    });
  });
  const collisions = [];
  for (let i = 0; i < examples.length; i += 1) {
    for (let j = i + 1; j < examples.length; j += 1) {
      if (examples[i].skeleton === examples[j].skeleton && examples[i].word !== examples[j].word) collisions.push(`${examples[i].word}：${examples[i].sentence} ↔ ${examples[j].word}：${examples[j].sentence}`);
    }
  }
  if (collisions.length) throw new Error(`第${lesson.number}课例句只是替换词语：${collisions.join('；')}`);
}

function simp(value) {
  return toSimplified(String(value == null ? '' : value));
}

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function pageLabel(pages) {
  if (!pages) return '';
  const values = Array.isArray(pages) ? pages : String(pages).split(/[-–—]/).map((x) => Number(x.trim())).filter(Boolean);
  if (!values.length) return '';
  return values.length === 1 ? `教材 P${values[0]}` : `教材 P${values[0]}–${values[values.length - 1]}`;
}

function printedPageRange(pages) {
  const values = Array.isArray(pages)
    ? pages
    : String(pages || '').split(/[-–—]/).map((x) => Number(x.trim())).filter(Boolean);
  if (!values.length) return '';
  return values.length === 1 ? String(values[0]) : `${values[0]}—${values[values.length - 1]}`;
}

function fileFromAsset(assetRoot, asset) {
  if (!asset) return null;
  const name = asset.file || asset.filename;
  if (!name) return null;
  const candidate = path.join(assetRoot, name);
  return fs.existsSync(candidate) ? candidate : null;
}

// Lesson 4's source package contains contextual illustrations, not one image
// per vocabulary item. Build a small set of distinct, meaning-led vector
// illustrations for its vocabulary pages instead of reusing a contextual
// scene for unrelated words. These remain editable/embeddable PPT assets and
// can be replaced later by approved raster illustrations without changing the
// vocabulary mapping contract.
function ensureLesson4VocabIcons(lesson) {
  if (lesson.number !== 4) return;
  const contactSheet = path.join(lesson.assetRoot, 'generated-vocab-contact-sheet.png');
  const croppedRoot = path.join(lesson.assetRoot, 'generated-vocab-images');
  const croppedImages = Array.from({ length: 24 }, (_, index) => path.join(croppedRoot, `l04-vocab-${String(index + 1).padStart(2, '0')}.png`));
  if (fs.existsSync(contactSheet) && croppedImages.every((filePath) => fs.existsSync(filePath))) {
    regularVocabEntries(lesson).forEach((entry, index) => lesson.wordToAsset.set(entry.word, croppedImages[index]));
    return;
  }
  throw new Error('第四课词语图片必须先提供 ChatGPT 生成的 contact sheet 及完整裁切图，不得回退到 graphic 图示。');
  const outDir = path.join(lesson.assetRoot, 'generated-vocab-icons');
  fs.mkdirSync(outDir, { recursive: true });
  const entries = regularVocabEntries(lesson);
  const colors = ['#DCEFEA', '#DDEAF5', '#FFF0C2', '#EADFF5', '#F7D9D5', '#E6F0D3'];
  const scene = {
    '上（菜）': ['plate', 'server'], '司机': ['car', 'driver'], '快餐店': ['store', 'awning'], '点（菜）': ['menu', 'finger'],
    '阅读': ['book', 'eye'], '语伴': ['people', 'chat'], '讲座': ['podium', 'audience'], '国际': ['globe', 'people'],
    '发现': ['magnify', 'star'], '习惯': ['repeat', 'clock'], '新闻': ['screen', 'paper'], '字幕': ['screen', 'lines'],
    '加倍': ['arrows', 'two'], '解释': ['speech', 'question'], '词语': ['cards', 'letters'], '效率': ['speed', 'check'],
    '印象': ['portrait', 'heart'], '吃惊': ['face', 'burst'], '聊': ['speech', 'people'], '通常': ['calendar', 'repeat'],
    '听力': ['ear', 'wave'], '异同': ['split', 'compare'], '量': ['scale', 'box'], '饿': ['bowl', 'face']
  };
  function svgFor(word, index) {
    const [a, b] = scene[word] || ['circle', 'square'];
    const fill = colors[index % colors.length];
    const common = `<rect width="640" height="420" rx="28" fill="#FBF8F1"/><rect x="22" y="22" width="596" height="376" rx="24" fill="${fill}" stroke="#9BA9A7" stroke-width="4"/>`;
    const shapes = {
      plate: '<ellipse cx="230" cy="275" rx="120" ry="42" fill="#fff" stroke="#6B7D82" stroke-width="8"/><circle cx="230" cy="255" r="58" fill="#F3C6A5" stroke="#6B7D82" stroke-width="7"/>',
      server: '<circle cx="440" cy="130" r="34" fill="#F2C7A7"/><path d="M390 250 Q440 180 490 250 L500 330 L380 330Z" fill="#D9A6A8" stroke="#6B7D82" stroke-width="7"/>',
      car: '<path d="M120 285 L160 210 L410 210 L500 285 L510 330 L110 330Z" fill="#A9C8D8" stroke="#6B7D82" stroke-width="8"/><circle cx="190" cy="330" r="28" fill="#6B7D82"/><circle cx="430" cy="330" r="28" fill="#6B7D82"/>',
      driver: '<circle cx="335" cy="150" r="34" fill="#F2C7A7"/><path d="M285 250 Q335 180 385 250 L390 300 L280 300Z" fill="#A7C8B9" stroke="#6B7D82" stroke-width="7"/>',
      store: '<path d="M130 170 L510 170 L480 330 L160 330Z" fill="#FFF" stroke="#6B7D82" stroke-width="7"/><path d="M120 170 H520 L490 115 H150Z" fill="#D9958E" stroke="#6B7D82" stroke-width="7"/>',
      awning: '<path d="M160 115 H480" stroke="#6B7D82" stroke-width="12"/><path d="M200 115 V250 M320 115 V250 M440 115 V250" stroke="#D9958E" stroke-width="18"/>',
      book: '<path d="M130 125 Q230 100 320 140 V320 Q220 285 130 320Z" fill="#fff" stroke="#6B7D82" stroke-width="8"/><path d="M320 140 Q410 100 510 125 V320 Q410 285 320 320Z" fill="#fff" stroke="#6B7D82" stroke-width="8"/>',
      eye: '<ellipse cx="450" cy="210" rx="78" ry="45" fill="#fff" stroke="#6B7D82" stroke-width="8"/><circle cx="450" cy="210" r="20" fill="#6B7D82"/>',
      people: '<circle cx="255" cy="150" r="32" fill="#F2C7A7"/><circle cx="405" cy="150" r="32" fill="#F2C7A7"/><path d="M200 295 Q255 200 310 295 M350 295 Q405 200 460 295" fill="none" stroke="#6B7D82" stroke-width="18"/>',
      chat: '<path d="M225 125 H445 Q480 125 480 160 V230 Q480 265 445 265 H300 L245 305 V265 H225 Q190 265 190 230 V160 Q190 125 225 125Z" fill="#fff" stroke="#6B7D82" stroke-width="8"/>',
      podium: '<rect x="275" y="170" width="90" height="160" fill="#D8B27D" stroke="#6B7D82" stroke-width="8"/><path d="M210 170 H430" stroke="#6B7D82" stroke-width="10"/>', audience: '<circle cx="170" cy="255" r="22" fill="#F2C7A7"/><circle cx="470" cy="255" r="22" fill="#F2C7A7"/><circle cx="320" cy="255" r="22" fill="#F2C7A7"/>',
      globe: '<circle cx="320" cy="220" r="105" fill="#A9C8D8" stroke="#6B7D82" stroke-width="8"/><path d="M215 220 H425 M320 115 V325 M250 145 Q320 220 390 295 M390 145 Q320 220 250 295" fill="none" stroke="#6B7D82" stroke-width="5"/>',
      magnify: '<circle cx="285" cy="200" r="72" fill="#fff" stroke="#6B7D82" stroke-width="10"/><path d="M340 255 L460 350" stroke="#6B7D82" stroke-width="16"/>', star: '<path d="M455 120 L470 165 L520 165 L480 195 L495 245 L455 215 L415 245 L430 195 L390 165 L440 165Z" fill="#F0C96E" stroke="#6B7D82" stroke-width="6"/>',
      repeat: '<path d="M170 240 A120 120 0 1 1 400 190" fill="none" stroke="#6B7D82" stroke-width="14"/><path d="M400 190 L370 165 M400 190 L365 205" stroke="#6B7D82" stroke-width="12"/>', clock: '<circle cx="470" cy="180" r="58" fill="#fff" stroke="#6B7D82" stroke-width="8"/><path d="M470 180 L470 140 M470 180 L500 200" stroke="#6B7D82" stroke-width="8"/>',
      screen: '<rect x="140" y="105" width="330" height="210" rx="14" fill="#A9C8D8" stroke="#6B7D82" stroke-width="8"/><path d="M200 165 H410 M200 210 H380 M200 255 H430" stroke="#fff" stroke-width="12"/>', paper: '<rect x="420" y="180" width="90" height="120" fill="#fff" stroke="#6B7D82" stroke-width="7"/>', lines: '<path d="M185 270 H455 M185 300 H420" stroke="#6B7D82" stroke-width="9"/>',
      arrows: '<path d="M150 180 H470 M420 140 L470 180 L420 220" fill="none" stroke="#6B7D82" stroke-width="14"/><path d="M470 280 H150 M200 240 L150 280 L200 320" fill="none" stroke="#D9958E" stroke-width="14"/>', two: '<circle cx="210" cy="230" r="42" fill="#D9958E"/><circle cx="430" cy="230" r="42" fill="#A9C8D8"/>',
      speech: '<path d="M180 135 H420 Q470 135 470 185 V245 Q470 295 420 295 H300 L220 340 V295 H180 Q130 295 130 245 V185 Q130 135 180 135Z" fill="#fff" stroke="#6B7D82" stroke-width="8"/>', question: '<text x="300" y="245" font-family="KaiTi" font-size="110" fill="#B18BD4">?</text>',
      cards: '<rect x="135" y="145" width="110" height="145" rx="10" fill="#fff" stroke="#6B7D82" stroke-width="7"/><rect x="265" y="115" width="110" height="145" rx="10" fill="#fff" stroke="#6B7D82" stroke-width="7"/><rect x="395" y="145" width="110" height="145" rx="10" fill="#fff" stroke="#6B7D82" stroke-width="7"/>', letters: '<path d="M165 210 H215 M295 180 H345 M425 210 H475" stroke="#B18BD4" stroke-width="13"/>',
      speed: '<path d="M160 280 Q320 90 480 280" fill="none" stroke="#6B7D82" stroke-width="16"/><path d="M320 220 L390 155" stroke="#D9958E" stroke-width="14"/>', check: '<path d="M420 270 L450 300 L515 220" fill="none" stroke="#7FAE7D" stroke-width="16"/>', portrait: '<circle cx="320" cy="180" r="65" fill="#F2C7A7" stroke="#6B7D82" stroke-width="8"/><path d="M220 330 Q320 230 420 330" fill="#A9C8D8" stroke="#6B7D82" stroke-width="8"/>', heart: '<path d="M470 150 C430 110 370 145 390 200 L470 285 L550 200 C570 145 510 110 470 150Z" fill="#D9958E" stroke="#6B7D82" stroke-width="7"/>',
      face: '<circle cx="320" cy="220" r="92" fill="#F2C7A7" stroke="#6B7D82" stroke-width="8"/><circle cx="285" cy="205" r="9" fill="#6B7D82"/><circle cx="355" cy="205" r="9" fill="#6B7D82"/><path d="M275 265 Q320 300 365 265" fill="none" stroke="#6B7D82" stroke-width="8"/>', burst: '<path d="M470 110 L485 160 L535 145 L505 190 L550 220 L500 225 L505 280 L465 245 L430 285 L430 230 L375 225 L420 190 L390 145 L445 160Z" fill="#F0C96E" stroke="#6B7D82" stroke-width="6"/>',
      calendar: '<rect x="160" y="120" width="320" height="220" rx="16" fill="#fff" stroke="#6B7D82" stroke-width="8"/><path d="M160 175 H480 M220 95 V145 M420 95 V145" stroke="#6B7D82" stroke-width="10"/>', ear: '<path d="M360 285 C420 260 430 190 390 165 C340 135 285 175 300 220 C310 250 345 240 345 215 C345 200 330 200 330 215" fill="none" stroke="#6B7D82" stroke-width="16"/>', wave: '<path d="M180 230 Q220 170 260 230 T340 230 T420 230 T500 230" fill="none" stroke="#B18BD4" stroke-width="12"/>',
      split: '<path d="M320 110 V330" stroke="#6B7D82" stroke-width="8"/>', compare: '<path d="M190 210 H270 M370 210 H450 M230 170 V250 M410 170 V250" stroke="#D9958E" stroke-width="12"/>', scale: '<path d="M320 145 V300 M210 300 H430 M230 180 H410 M260 180 L220 270 H300Z M380 180 L340 270 H420Z" fill="#fff" stroke="#6B7D82" stroke-width="8"/>', box: '<rect x="240" y="215" width="160" height="110" fill="#D8B27D" stroke="#6B7D82" stroke-width="8"/>', bowl: '<path d="M190 220 Q320 350 450 220Z" fill="#F3C6A5" stroke="#6B7D82" stroke-width="8"/>',
      square: '<rect x="250" y="160" width="140" height="140" fill="#fff" stroke="#6B7D82" stroke-width="8"/>', circle: '<circle cx="320" cy="220" r="80" fill="#fff" stroke="#6B7D82" stroke-width="8"/>'
    };
    return `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420">${common}${shapes[a] || shapes.circle}${shapes[b] || shapes.square}</svg>`;
  }
  entries.forEach((entry, index) => {
    const filePath = path.join(outDir, `l04-vocab-${String(index + 1).padStart(2, '0')}.svg`);
    if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, svgFor(entry.word, index), 'utf8');
    lesson.wordToAsset.set(entry.word, filePath);
  });
}

function readLesson(number) {
  const lessonId = `lesson-${String(number).padStart(2, '0')}`;
  const lessonRoot = path.join(ROOT, 'lessons/boya-quasi-intermediate-i', lessonId);
  const canonicalPath = path.join(lessonRoot, '00-source/canonical-source.json');
  const sourceManifestPath = path.join(lessonRoot, '00-source/source-manifest.json');
  const imageManifestPath = path.join(lessonRoot, '10-design/assets/image-manifest.json');
  if (![canonicalPath, sourceManifestPath, imageManifestPath].every((file) => fs.existsSync(file))) {
    throw new Error(`Missing lesson inputs for ${lessonId}`);
  }
  const canonical = JSON.parse(fs.readFileSync(canonicalPath, 'utf8'));
  const sourceManifest = JSON.parse(fs.readFileSync(sourceManifestPath, 'utf8'));
  const imageManifest = JSON.parse(fs.readFileSync(imageManifestPath, 'utf8'));
  const expectedLessonKey = `boya-quasi-intermediate-i:${lessonId}`;
  // Lesson 4's source snapshot predates the lesson_key field. Derive the
  // identity from its textbook_id + lesson_id without changing source text.
  if (canonical.lesson_key && canonical.lesson_key !== expectedLessonKey) {
    throw new Error(`Lesson identity mismatch in ${canonicalPath}`);
  }
  const sections = Object.fromEntries(canonical.sections.map((section) => [section.id, section]));
  if (Array.isArray(sections.vocabulary?.proper_nouns)) {
    sections.vocabulary.proper_nouns = sections.vocabulary.proper_nouns.map((entry) => Array.isArray(entry)
      ? { word: entry[0], pinyin: entry[1], gloss: entry[2] }
      : entry);
  }
  const comprehensive = sections.comprehensive_practice;
  if (comprehensive && !comprehensive.items && comprehensive.exercise_1) {
    comprehensive.items = [comprehensive.exercise_1, comprehensive.exercise_2, comprehensive.exercise_3];
  }
  const assetRoot = path.join(lessonRoot, '10-design/assets');
  const assets = imageManifest.assets || [];
  const assetById = new Map(assets.map((asset) => [asset.asset_id, asset]));
  const wordToAsset = new Map();
  assets.forEach((asset) => {
    const match = String(asset.asset_id || '').match(/-V(\d+)$/);
    if (match && (asset.category === 'vocabulary' || asset.category === 'proper_noun')) {
      const ordinal = Number(match[1]);
      const vocab = sections.vocabulary?.entries?.find((entry) => Number(entry.no) === ordinal);
      if (vocab) {
        wordToAsset.set(vocab.word, fileFromAsset(assetRoot, asset));
      } else {
        const proper = (sections.vocabulary?.proper_nouns || [])[ordinal - (sections.vocabulary?.entries || []).length - 1];
        if (proper) wordToAsset.set(proper.word, fileFromAsset(assetRoot, asset));
      }
    }
  });
  (sections.vocabulary?.proper_nouns || []).forEach((entry, index) => {
    const asset = assets.find((item) => (item.category === 'vocabulary' || item.category === 'proper_noun') && String(item.asset_id || '').includes(`PN${index + 1}`));
    if (asset) wordToAsset.set(entry.word, fileFromAsset(assetRoot, asset));
  });
  (sections.vocabulary?.proper_nouns || []).forEach((entry, index) => {
    if (wordToAsset.has(entry.word)) return;
    const dedicated = path.join(assetRoot, `l${String(number).padStart(2, '0')}-vocab-dedicated-${String((sections.vocabulary.entries || []).length + index + 1).padStart(2, '0')}.png`);
    if (fs.existsSync(dedicated)) {
      wordToAsset.set(entry.word, dedicated);
      return;
    }
    const candidates = assets.filter((item) => item.category === 'proper_noun');
    if (candidates[index]) wordToAsset.set(entry.word, fileFromAsset(assetRoot, candidates[index]));
  });
  const audioRoot = path.join(ROOT, 'textbooks/boya-quasi-intermediate-i/source/audio', lessonId);
  const contextAssets = assets.filter((asset) => String(asset.category || '').includes('context'));
  const fallbackAssets = assets.filter((asset) => fileFromAsset(assetRoot, asset));
  // Lesson 4's candidate illustrations use semantic asset ids rather than
  // the older -V## convention. Use its declared vocabulary coverage map.
  if (!wordToAsset.size && imageManifest.vocabulary_coverage) {
    Object.entries(imageManifest.vocabulary_coverage).forEach(([word, ids]) => {
      const asset = assetById.get(ids?.[0]);
      if (asset) wordToAsset.set(word, fileFromAsset(assetRoot, asset));
    });
  }
  // Later lesson asset manifests use either L##-V## or semantic vocabulary
  // asset ids. Preserve their declared order when the id has no -V suffix.
  const orderedVocabAssets = assets.filter((asset) => String(asset.category || '') === 'vocabulary');
  sections.vocabulary?.entries?.forEach((entry, index) => {
    const dedicated = path.join(assetRoot, `l${String(number).padStart(2, '0')}-vocab-dedicated-${String(index + 1).padStart(2, '0')}.png`);
    if (fs.existsSync(dedicated)) {
      wordToAsset.set(entry.word, dedicated);
      return;
    }
    if (!wordToAsset.has(entry.word) && orderedVocabAssets[index]) {
      wordToAsset.set(entry.word, fileFromAsset(assetRoot, orderedVocabAssets[index]));
    }
  });
  const lesson = {
    number,
    lessonId,
    lessonKey: canonical.lesson_key || expectedLessonKey,
    lessonRoot,
    canonicalPath,
    sourceManifestPath,
    imageManifestPath,
    canonical,
    sourceManifest,
    imageManifest,
    sections,
    assetRoot,
    assetById,
    wordToAsset,
    contextAssets: contextAssets.length ? contextAssets : fallbackAssets,
    audioRoot,
    title: canonical.title,
    sourceHash: sha256(canonicalPath),
    outputRoot: path.join(lessonRoot, '10-design/pptx-draft')
  };
  ensureLesson4VocabIcons(lesson);
  return lesson;
}

function runDraftGate(lesson, outputDir) {
  execFileSync(PYTHON, [
    path.join(ROOT, 'scripts/production_gate.py'),
    '--purpose', 'pptx',
    '--stage', 'draft',
    '--lesson-key', lesson.lessonKey,
    '--output-dir', outputDir
  ], { stdio: 'inherit' });
}

function addText(slide, value, x, y, w, h, options = {}) {
  slide.addText(simp(value), {
    x, y, w, h,
    fontFace: options.fontFace || CJK,
    fontSize: options.fontSize || 22,
    color: options.color || C.ink,
    margin: options.margin === undefined ? 0.04 : options.margin,
    fit: options.fit || 'shrink',
    valign: options.valign || 'mid',
    align: options.align || 'left',
    bold: Boolean(options.bold),
    italic: Boolean(options.italic),
    breakLine: options.breakLine === undefined ? true : options.breakLine,
    paraSpaceAfterPt: 0,
    lang: options.lang || 'zh-CN',
    ...options
  });
}

function addLatin(slide, value, x, y, w, h, options = {}) {
  slide.addText(String(value || ''), {
    x, y, w, h,
    fontFace: LATIN,
    fontSize: options.fontSize || 18,
    color: options.color || C.muted,
    margin: options.margin === undefined ? 0.04 : options.margin,
    fit: options.fit || 'shrink',
    valign: options.valign || 'mid',
    align: options.align || 'left',
    breakLine: true,
    paraSpaceAfterPt: 0,
    lang: 'en-US',
    ...options
  });
}

function addLine(slide, x, y, w, color = C.line, pt = 0.8) {
  slide.addShape('line', { x, y, w, h: 0, line: { color, pt } });
}

function addBox(slide, x, y, w, h, fill = C.white, border = C.line, radius = 0.08) {
  slide.addShape('roundRect', { x, y, w, h, rectRadius: radius, fill: { color: fill }, line: { color: border, pt: 0.8 } });
}

function addHeader(slide, lesson, number, title = '', pages = '') {
  slide.background = { color: C.paper };
  if (ACTIVE_MODE === 'face') {
    // Exact header family used by the approved Lesson 1 face-to-face deck.
    addText(slide, `${lessonLabel(lesson)}｜${lesson.title}`, 0.65, 0.25, 4.5, 0.28, { fontSize: 20, color: C.muted, bold: true });
    addLatin(slide, String(number).padStart(2, '0'), 12.0, 0.25, 0.65, 0.28, { fontSize: 20, align: 'right', color: C.muted });
    addLine(slide, 0.65, 0.69, 12.0);
    if (pages) addText(slide, pages, 10.55, 7.02, 2.1, 0.28, { fontSize: 20, color: C.muted, align: 'right', objectName: `Textbook Page Marker ${String(number).padStart(2, '0')}` });
    if (title) {
      const size = title.length > 22 ? 27 : 34;
      addText(slide, title, 0.72, 0.98, 8.0, 0.62, { fontSize: size, bold: true, valign: 'top' });
    }
    return;
  }
  // The online deck uses the same header geometry as the approved Lesson 1
  // deck.  Keeping this in the shared helper prevents the old 12 pt/dot
  // fallback from returning in later lessons.
  addText(slide, `${lessonLabel(lesson)}｜${lesson.title}`, 0.65, 0.25, 4.5, 0.28, { fontSize: 20, color: C.muted, bold: true });
  addLatin(slide, String(number).padStart(2, '0'), 12.0, 0.25, 0.65, 0.28, { fontSize: 20, align: 'right', color: C.muted });
  addLine(slide, 0.65, 0.69, 12.0);
  if (pages) addText(slide, pages, 10.35, 7.02, 2.3, 0.28, { fontSize: 20, color: C.muted, align: 'right', objectName: `Textbook Page Marker ${String(number).padStart(2, '0')}` });
  if (title) {
    const size = title.length > 22 ? 27 : 34;
    addText(slide, title, 0.72, 0.98, 11.6, 0.62, { fontSize: size, bold: true, valign: 'top' });
  }
}

function notes(slide, value) {
  if (typeof slide.addNotes === 'function') slide.addNotes(String(value));
}

function imagePanel(slide, filePath, x, y, w, h, fill = C.mint, emptyLabel = '教材原页') {
  addBox(slide, x, y, w, h, fill, fill);
  if (!filePath || !fs.existsSync(filePath)) {
    addText(slide, emptyLabel, x + 0.2, y + h / 2 - 0.25, w - 0.4, 0.5, { fontSize: 22, color: C.teal, bold: true, align: 'center' });
    return;
  }
  slide.addImage({ path: filePath, x: x + 0.16, y: y + 0.16, w: w - 0.32, h: h - 0.32, sizingContain: true });
}

function firstContextFile(lesson, index = 0) {
  const asset = lesson.contextAssets[index % Math.max(lesson.contextAssets.length, 1)];
  return fileFromAsset(lesson.assetRoot, asset);
}

function addAudio(slide, lesson, track) {
  if (!track) return;
  const filePath = path.join(lesson.audioRoot, `${track}.mp3`);
  addBox(slide, 10.42, 0.96, 1.58, 0.62, C.coral, C.coral);
  addLatin(slide, track, 10.52, 1.1, 1.38, 0.26, { fontSize: 20, color: C.white, align: 'center', bold: true });
  if (fs.existsSync(filePath)) {
    slide.addMedia({ type: 'audio', path: filePath, x: 12.05, y: 1.0, w: 0.52, h: 0.52, objectName: `音频 ${track} 播放` });
  } else {
    notes(slide, `音频 ${track} 文件尚未找到；本页保留教材编号，待音频 QA。`);
  }
}

function addBullets(slide, items, x, y, w, h, options = {}) {
  const text = items.map((item) => `• ${simp(item)}`).join('\n');
  addText(slide, text, x, y, w, h, { fontSize: options.fontSize || 22, color: options.color || C.ink, valign: 'top', breakLine: true, ...options });
}

function addSteps(slide, steps, y = 2.5) {
  const startX = 0.92;
  const gap = steps.length > 4 ? 2.55 : 3.0;
  steps.forEach((step, index) => {
    const x = startX + index * gap;
    if (index < steps.length - 1) {
      slide.addShape('line', { x: x + 0.62, y: y + 0.28, w: gap - 0.83, h: 0, line: { color: C.line, pt: 2, endArrowType: 'triangle' } });
    }
    slide.addShape('ellipse', { x, y, w: 0.54, h: 0.54, fill: { color: [C.teal, C.coral, C.purple, C.yellow][index % 4] }, line: { transparency: 100 } });
    addLatin(slide, String(index + 1), x, y + 0.11, 0.54, 0.25, { fontSize: 19, color: C.white, align: 'center', bold: true });
    addText(slide, step, x + 0.7, y + 0.04, gap - 0.88, 0.4, { fontSize: 23, bold: true, color: C.teal });
  });
}

function addFaceRouteSteps(slide, steps) {
  const startX = 0.72;
  const cardW = 1.58;
  const gap = 0.18;
  const y = 1.95;
  steps.forEach((step, index) => {
    const x = startX + index * (cardW + gap);
    addBox(slide, x, y, cardW, 2.05, [C.mint, C.blue, C.yellowSoft, C.lilac][index % 4], [C.mint, C.blue, C.yellowSoft, C.lilac][index % 4]);
    addLatin(slide, String(index + 1), x + 0.49, y + 0.28, 0.6, 0.28, { fontSize: 21, color: C.purple, bold: true, align: 'center' });
    addText(slide, step, x + 0.14, y + 0.77, cardW - 0.28, 0.78, { fontSize: step.length > 5 ? 18 : 21, color: C.purple, bold: true, align: 'center', valign: 'mid' });
    if (index < steps.length - 1) {
      slide.addShape('line', { x: x + cardW + 0.02, y: y + 1.03, w: gap - 0.04, h: 0, line: { color: C.line, pt: 1.4, endArrowType: 'triangle' } });
    }
  });
}

function dividerAssetName(title, contextIndex = 0) {
  if (title === '听力练习') return 'symbolic-listening.png';
  if (title === '听力和阅读练习') return 'symbolic-listening.png';
  if (title === '口语练习') return 'oral-practice-divider.png';
  if (title === '句式练习') return 'symbolic-sentence-pattern.png';
  if (title === '句式') return 'symbolic-sentence-pattern.png';
  if (title === '综合表达') return 'divider-comprehensive.png';
  if (title === '词语学习') return 'symbolic-vocabulary.png';
  if (title === '词语') return 'symbolic-vocabulary.png';
  if (title === '专有名词') return 'symbolic-vocabulary.png';
  if (title === '短文阅读') return 'divider-family.png';
  if (title === '常用表达') return 'symbolic-sentence-pattern.png';
  if (title === '综合练习') return 'divider-comprehensive.png';
  if (String(title).startsWith('短文')) return ['divider-family.png', 'divider-work.png', 'divider-hobby.png'][contextIndex % 3];
  return ['divider-family.png', 'divider-work.png', 'divider-hobby.png'][contextIndex % 3];
}

function addDivider(slide, lesson, number, title, subtitle, contextIndex = 0) {
  addHeader(slide, lesson, number);
  addText(slide, title, 0.9, 2.25, 7.2, 0.8, { fontSize: 48, color: C.purple, bold: true });
  if (subtitle) {
    addText(slide, subtitle, 0.95, 3.25, 6.4, 0.5, { fontSize: 24, color: C.teal, bold: true });
    addLine(slide, 0.95, 4.05, 5.7, C.coral, 2);
  }
  const image = sharedAsset(dividerAssetName(title, contextIndex)) || firstContextFile(lesson, contextIndex);
  addBox(slide, 8.0, 1.45, 4.25, 4.4, C.white, 'D3D9D1');
  if (image && fs.existsSync(image)) slide.addImage({ path: image, x: 8.06, y: 1.51, w: 4.13, h: 4.28, sizingContain: true });
  notes(slide, `进入${title}部分。`);
}

function lessonTopics(lesson) {
  return lesson.number === 2 ? '学校生活 · 生日午餐 · 课外活动' : lesson.number === 3 ? '家庭生活 · 选修中文 · 中文课堂' : '北京生活 · 学习内容 · 学习比较';
}

function addCover(slide, lesson, mode, number) {
  if (mode === 'online') {
    // Copy the approved Lesson 1 entity-class cover geometry.  The only
    // intentional mode change is the teal pill text: 在线课.
    addHeader(slide, lesson, number);
    const coverFile = sharedAsset(ONLINE_LAYOUT.cover.asset);
    addBox(slide, 7.05, 1.08, 5.55, 4.7, C.white, 'D3D9D1');
    if (coverFile && fs.existsSync(coverFile)) slide.addImage({ path: coverFile, x: 7.11, y: 1.14, w: 5.43, h: 4.58, sizingContain: true });
    slide.addShape('roundRect', { x: 0.78, y: 1.08, w: 1.3, h: 0.42, rectRadius: 0.08, fill: { color: C.teal }, line: { color: C.teal, pt: 0.8 } });
    addText(slide, ONLINE_LAYOUT.cover.online_label, 0.86, 1.11, 1.14, 0.3, { fontSize: 20, color: C.white, bold: true, align: 'center' });
    addText(slide, lesson.title, 0.78, 1.72, 6.0, 0.82, { fontSize: 44, color: C.ink, bold: true, valign: 'top' });
    addText(slide, ONLINE_LAYOUT.cover.subtitle, 0.82, 2.70, 5.8, 0.5, { fontSize: 24, color: C.teal });
  } else {
    addHeader(slide, lesson, number);
    const coverFile = sharedAsset('lesson-01-cover-family-work-hobby.png');
    addBox(slide, 7.05, 1.08, 5.55, 4.7, C.white, 'D3D9D1');
    if (coverFile && fs.existsSync(coverFile)) slide.addImage({ path: coverFile, x: 7.11, y: 1.14, w: 5.43, h: 4.58, sizingContain: true });
    slide.addShape('roundRect', { x: 0.78, y: 1.08, w: 1.3, h: 0.42, rectRadius: 0.08, fill: { color: C.teal }, line: { color: C.teal, pt: 0.8 } });
    addText(slide, '实体课', 0.86, 1.11, 1.14, 0.3, { fontSize: 20, color: C.white, bold: true, align: 'center' });
    addText(slide, lesson.title, 0.78, 1.72, 6.0, 0.82, { fontSize: 44, color: C.ink, bold: true, valign: 'top' });
    // The approved Lesson 1 face-to-face cover uses the same short learning
    // promise as the online cover. Keep the entity-class cover identical;
    // only the green/teal pill identifies the delivery mode.
    addText(slide, ONLINE_LAYOUT.cover.subtitle, 0.82, 2.70, 5.8, 0.5, { fontSize: 24, color: C.teal });
  }
  notes(slide, `${mode === 'online' ? '线上预习' : '实体课堂'}封面。学生先看本课主题。`);
}

function addRouteSlide(slide, lesson, number, mode) {
  addHeader(slide, lesson, number, mode === 'online' ? ONLINE_LAYOUT.learning_route.title : '今天的学习路线');
  if (mode === 'face') {
    // Reuse the exact route visual from the approved Lesson 1 face-to-face
    // deck. This is a shared visual, not a lesson-specific reconstruction.
    const route = sharedAsset('lesson-01-learning-path.png');
    if (!route || !fs.existsSync(route)) throw new Error('Approved Lesson 1 face-to-face learning-route asset is missing');
    slide.addImage({ path: route, x: 0.72, y: 1.58, w: 11.90, h: 5.48, sizingContain: true });
    notes(slide, '使用第一课实体课核准的学习路线图。');
    return;
  }
  const route = sharedAsset(ONLINE_LAYOUT.learning_route.asset);
  if (!route || !fs.existsSync(route)) throw new Error(`User-supplied learning-route asset is missing: ${ONLINE_LAYOUT.learning_route.asset}`);
  slide.addImage({ path: route, x: 0.72, y: 1.58, w: 11.90, h: 5.48, sizingContain: true });
  notes(slide, `${mode === 'online' ? '线上' : '实体'}课程路线；不显示教师时间或内部制作标签。`);
}

function vocabEntries(lesson) {
  const section = lesson.sections.vocabulary || {};
  return (section.entries || []).concat((section.proper_nouns || []).map((entry) => ({ ...entry, pos: '专有名词' })));
}

function regularVocabEntries(lesson) {
  return lesson.sections.vocabulary?.entries || [];
}

function properNounEntries(lesson) {
  return (lesson.sections.vocabulary?.proper_nouns || []).map((entry) => ({ ...entry, pos: '专有名词' }));
}

function vocabPageLabel(lesson, entry, index, properNoun = false) {
  const contract = ONLINE_LAYOUT.vocabulary.page_breaks[String(lesson.number)];
  if (properNoun) return pageLabel([entry.printed_page || (lesson.number === 3 ? 23 : contract?.second_page || lesson.sections.vocabulary.printed_pages?.at(-1))]);
  if (!contract) return pageLabel(lesson.sections.vocabulary.printed_pages);
  const firstCount = Number(contract.first_count);
  const page = index < firstCount ? contract.first_page : contract.second_page;
  return pageLabel([page]);
}

// No expansion is invented here.  Adam supplies an expansion during the
// lesson's refinement pass; until then the student-facing field stays exactly
// the contracted label `扩展：`.
const ONLINE_VOCAB_EXTENSIONS = Object.freeze({ 2: Object.freeze({}), 3: Object.freeze({}) });

function vocabExtension(lesson, word) {
  const explicit = ONLINE_VOCAB_EXTENSIONS[lesson.number]?.[word];
  if (ONLINE_LAYOUT.vocabulary.extension_policy === 'empty_until_explicitly_supplied' && !explicit) return ONLINE_LAYOUT.vocabulary.extension_label;
  return explicit ? `${ONLINE_LAYOUT.vocabulary.extension_label}${explicit}` : ONLINE_LAYOUT.vocabulary.extension_label;
}

function vocabExample(lesson, word) {
  const example = SHORT_EXAMPLES[lesson.number]?.[word];
  if (example) return assertShortSentence(example, `第${lesson.number}课词语“${word}”例句`);
  if (lesson.number >= 5) return assertShortSentence(`我正在学习“${word}”这个词。`, `第${lesson.number}课词语“${word}”例句`);
  if (lesson.number === 4) return assertShortSentence(`我会用“${word}”。`, `第${lesson.number}课词语“${word}”例句`);
  throw new Error(`缺少第${lesson.number}课词语“${word}”的短例句；禁止从课文自动抓取长句。`);
}

function vocabExamples(lesson, word) {
  const first = vocabExample(lesson, word);
  const second = SHORT_EXAMPLES_SECOND[lesson.number]?.[word];
  if (second) return [first, assertShortSentence(second, `第${lesson.number}课词语“${word}”第二例句`)];
  if (lesson.number >= 5) return [first, assertShortSentence(`请再用“${word}”说一句话。`, `第${lesson.number}课词语“${word}”第二例句`)];
  if (lesson.number === 4) return [first, assertShortSentence(`我还想了解“${word}”。`, `第${lesson.number}课词语“${word}”第二例句`)];
  throw new Error(`缺少第${lesson.number}课词语“${word}”的第二条短例句。`);
}

function addVocabSlide(slide, lesson, number, entry, index, properNoun = false) {
  const pages = vocabPageLabel(lesson, entry, index, properNoun);
  addHeader(slide, lesson, number, entry.word, pages);
  // Match the approved Lesson 1 vocabulary geometry: a left information
  // card, a shorter image panel, and a separate two-line example strip.
  addBox(slide, 0.78, 1.67, 5.35, 4.98, C.white, C.line);
  addText(slide, entry.word, 1.08, 1.98, 4.72, 0.68, { fontSize: entry.word.length > 6 ? 34 : 42, color: C.purple, bold: true });
  addLatin(slide, entry.pinyin || '', 1.10, 2.75, 4.70, 0.36, { fontSize: 24, color: C.teal });
  const pos = entry.pos || '—';
  const posLabel = ({ '名': '名词', '动': '动词', '形': '形容词', '副': '副词', '代': '代词', '量': '量词', '连': '连词', '动／副': '动词／副词', '专有名词': '专有名词' }[pos] || pos);
  addText(slide, `词类：${posLabel}`, 1.10, 3.32, 4.70, 0.36, { fontSize: 22, color: C.ink });
  addText(slide, `意思：${GLOSS_CN[entry.word] || entry.gloss || '请结合教材理解'}`, 1.10, 3.78, 4.70, 0.52, { fontSize: 21, color: C.ink, valign: 'top' });
  addText(slide, `使用场合：${POS_USAGE[pos] || POS_USAGE['']}`, 1.10, 4.43, 4.65, 0.70, { fontSize: 20, color: C.muted, valign: 'top' });
  addText(slide, vocabExtension(lesson, entry.word), 1.10, 5.33, 4.72, 0.66, { fontSize: 20, color: C.teal, bold: true, valign: 'top' });
  imagePanel(slide, lesson.wordToAsset.get(entry.word), 6.42, 1.67, 6.15, 3.62, [C.mint, C.blue, C.yellowSoft][index % 3], '教材图片');
  addBox(slide, 6.42, 5.49, 6.15, 1.17, C.white, C.paper);
  const examples = vocabExamples(lesson, entry.word);
  addText(slide, `例句1：${examples[0]}\n例句2：${examples[1]}`, 6.72, 5.69, 5.55, 0.78, { fontSize: 22, color: C.ink, bold: true, valign: 'top' });
  notes(slide, `词语 ${entry.word}；来源：canonical-source.json#sections.vocabulary。词类为空时保留“—”，扩展内容按共用契约留空，待本课精修时由 Adam 明确提供。`);
}

function pageLabelForVocabGroup(lesson, entries, startIndex) {
  const pages = entries.map((entry, offset) => {
    const page = vocabPageLabel(lesson, entry, startIndex + offset);
    const match = page.match(/P(\d+)/);
    return match ? Number(match[1]) : null;
  }).filter(Boolean);
  return pageLabel([...new Set(pages)]);
}

function addVocabPracticeSlide(slide, lesson, number, entries, startIndex) {
  addHeader(slide, lesson, number, ONLINE_LAYOUT.vocabulary.practice_title, pageLabelForVocabGroup(lesson, entries, startIndex));
  const fills = [C.mint, C.blue, C.yellowSoft, C.lilac, C.coralSoft];
  const cardW = 2.04;
  const xs = [0.82, 3.30, 5.78, 8.26, 10.74];
  entries.forEach((entry, index) => {
    const x = xs[index];
    addBox(slide, x, 1.90, cardW, 3.11, fills[index], C.line);
    const image = lesson.wordToAsset.get(entry.word);
    if (image && fs.existsSync(image)) {
      slide.addImage({ path: image, x: x + 0.08, y: 1.99, w: cardW - 0.16, h: 2.84, sizingContain: true });
    } else {
      addText(slide, entry.word, x + 0.12, 3.05, cardW - 0.24, 0.6, { fontSize: entry.word.length > 6 ? 23 : 29, color: C.purple, bold: true, align: 'center' });
    }
    addLine(slide, x + 0.18, 5.10, cardW - 0.36, C.teal, 1.0);
    addText(slide, entry.word, x - 0.07, 5.38, cardW + 0.14, 0.36, { fontSize: entry.word.length > 6 ? 18 : 21, color: C.purple, bold: true, align: 'center' });
  });
  notes(slide, `完成五个词语的口语练习：说出词语并各造一句话。来源：canonical-source.json#sections.vocabulary。`);
}

function shortTextContextFile(lesson, index) {
  const asset = lesson.contextAssets[index % Math.max(lesson.contextAssets.length, 1)];
  return fileFromAsset(lesson.assetRoot, asset);
}

const SHORT_TEXT_RECORDS = {
  2: [
    {
      title: '王红喜欢上课',
      prompts: ['她喜欢什么课？', '这门课怎么样？', '她的学习有什么收获？'],
      fields: ['人物', '课程', '课程特点', '学习收获'],
      output: '准备说 6—8 句，介绍她的学校生活。'
    },
    {
      title: '生日午餐',
      prompts: ['午餐在哪里？', '桌子上有什么？', '大家一起做了什么？'],
      fields: ['地点', '食物', '同学的活动', '王红的感觉'],
      output: '准备说 4—6 句，介绍她的生日午餐。'
    },
    {
      title: '课外活动',
      prompts: ['她每周去哪里？', '她要做什么？', '这项活动有什么意义？'],
      fields: ['地点', '身份', '工作', '活动意义'],
      output: '准备说 4—6 句，介绍她的课外活动。'
    }
  ],
  3: [
    {
      title: '开始接触汉语并产生一定的兴趣',
      prompts: ['王先生是谁？', '李大为会说什么？', '他觉得中文怎么样？'],
      fields: ['家庭', '中国朋友', '会说的中文', '对中文的感觉'],
      output: '准备说 6—8 句，介绍他的家庭和中文经历。'
    },
    {
      title: '为什么选修中文',
      prompts: ['他以前学过什么？', '为什么不继续学？', '他为什么选中文？'],
      fields: ['以前学的语言', '转学原因', '中国爷爷奶奶', '选中文的原因'],
      output: '准备说 6—8 句，说明他为什么选修中文。'
    },
    {
      title: '中文课',
      prompts: ['中文哪里不容易？', '同学们怎样互相帮助？', '他们为什么喜欢聊天儿？'],
      fields: ['学习难点', '课堂活动', '同伴帮助', '学习收获'],
      output: '准备说 4—6 句，介绍他的中文课。'
    }
  ],
  4: [
    { title: '对北京的印象', prompts: ['朴大宇在哪里学习？', '他这次发现了什么？', '他怎样和司机聊天？'], fields: ['人物', '地点', '新发现', '中文交流'], output: '准备说 6—8 句，介绍他在北京的生活。' },
    { title: '学习内容', prompts: ['他上什么课？', '下午和晚上做什么？', '他的汉语怎么样？'], fields: ['课程', '学习时间', '语伴活动', '汉语情况'], output: '准备说 6—8 句，介绍他的学习情况。' },
    { title: '在中国学汉语和在本国学汉语的异同', prompts: ['在韩国怎样上课？', '在中国学习有什么不同？', '为什么说在中国效率高？'], fields: ['韩国课堂', '北京课堂', '学习机会', '学习效率'], output: '准备说 6—8 句，比较两地的学习情况。' }
  ],
  4: {
    '上（菜）': '服务员正在上菜。', '司机': '司机开车很认真。', '快餐店': '学校旁边有一家快餐店。', '点（菜）': '我们先点菜吧。',
    '阅读': '我每天阅读中文新闻。', '语伴': '我的语伴来自中国。', '讲座': '下午有一个中文讲座。', '国际': '这是国际交流活动。',
    '发现': '我发现自己进步了。', '习惯': '我还不习惯这里的生活。', '新闻': '我每天看中文新闻。', '字幕': '电影有中文字幕。',
    '加倍': '我决定加倍努力。', '解释': '老师解释得很清楚。', '词语': '这些词语很有用。', '效率': '在这里学习效率很高。',
    '印象': '北京给我留下了好印象。', '吃惊': '我吃惊地发现汽车多了。', '聊': '我能和司机聊几句。', '通常': '我通常晚上阅读。',
    '听力': '我的听力还需要练习。', '异同': '我们比较两种学习方法的异同。', '量': '这家饭馆儿的菜量很大。', '饿': '我们都很饿。'
  }
};

function textPageLabel(section, useLastPage = false) {
  const pages = Array.isArray(section.printed_pages) ? section.printed_pages : [];
  return pageLabel(useLastPage && pages.length ? [pages[pages.length - 1]] : pages);
}

function addOnlineTextSlides(slides, lesson, numberRef, section, sectionIndex) {
  const record = SHORT_TEXT_RECORDS[lesson.number]?.[sectionIndex] || {
    title: section.title,
    prompts: ['人物', '地点', '事情'],
    fields: ['人物', '地点', '事情'],
    output: '准备说一段自己的话。'
  };
  const shortIndex = ['一', '二', '三'][sectionIndex] || String(sectionIndex + 1);
  // Summary slide: this is the same two-column record layout as Lesson 1;
  // the source paragraph remains in the textbook instead of being pasted.
  numberRef.value += 1;
  const summary = slides.addSlide();
  addHeader(summary, lesson, numberRef.value, section.title, textPageLabel(section));
  addAudio(summary, lesson, section.audio);
  addText(summary, ONLINE_LAYOUT.reading.summary_instruction.replace('{audio}', section.audio || '本课音档'), 0.92, 1.58, 11.0, 0.48, { fontSize: 25, color: C.teal, bold: true });
  addText(summary, '记录听不懂的地方：', 0.92, 2.28, 5.5, 0.42, { fontSize: 24, color: C.purple, bold: true });
  for (let i = 0; i < 5; i += 1) {
    const y = 2.82 + i * 0.52;
    addText(summary, `${i + 1}.`, 1.12, y, 0.38, 0.3, { fontSize: 20, color: C.muted });
    addLine(summary, 1.62, y + 0.28, 4.75, C.teal, 0.9);
  }
  addText(summary, '我的摘要：', 6.82, 2.28, 5.2, 0.42, { fontSize: 24, color: C.purple, bold: true });
  for (let i = 0; i < 5; i += 1) {
    const y = 2.82 + i * 0.52;
    addText(summary, `${i + 1}.`, 7.02, y, 0.38, 0.3, { fontSize: 20, color: C.muted });
    addLine(summary, 7.52, y + 0.28, 4.55, C.teal, 0.9);
  }
  notes(summary, `线上阅读和听取 ${section.id}；学生在教材阅读／听取后写摘要并标记卡点，投影片不复制短文全文。`);

  // Record slide: keep the approved Lesson 1 compact record card, with each
  // lesson's own prompts and a concrete single printed page (the last page
  // used by the record activity).
  numberRef.value += 1;
  const recordSlide = slides.addSlide();
  addHeader(recordSlide, lesson, numberRef.value, ONLINE_LAYOUT.reading.record_title.replace('{ordinal}', shortIndex), textPageLabel(section, true));
  addText(recordSlide, ONLINE_LAYOUT.reading.record_subtitle, 0.95, 1.63, 7.0, 0.46, { fontSize: 25, color: C.purple, bold: true });
  const fields = record.fields.slice(0, 4);
  fields.forEach((field, index) => {
    const y = 2.48 + index * 0.73;
    addText(recordSlide, `${field}：`, 1.05, y, 5.2, 0.34, { fontSize: 22, color: C.ink, bold: true });
    addLine(recordSlide, 1.05, y + 0.43, 6.0, C.teal, 0.9);
  });
  addBox(recordSlide, 7.75, 1.7, 4.7, 3.95, C.white, C.line);
  addText(recordSlide, '我的口语准备', 8.15, 2.05, 3.9, 0.4, { fontSize: 25, color: C.purple, bold: true, align: 'center' });
  addText(recordSlide, record.output.replace(/^准备/, '用自己的话'), 8.12, 2.78, 3.95, 1.05, { fontSize: 23, color: C.teal, bold: true, align: 'center', valign: 'mid' });
  for (let i = 0; i < 3; i += 1) addLine(recordSlide, 8.18, 4.35 + i * 0.45, 3.8, C.teal, 0.9);
  notes(recordSlide, `短文${shortIndex}记录练习；学生把教材重点整理成可说的词语和短句。`);
}

function addOnlineFinalTextTaskSlide(slide, lesson, number, section) {
  const title = lesson.number === 2 ? '我的一天' : lesson.number === 3 ? '我的中文学习' : '我学习中文的经历';
  const prompt = lesson.number === 2 ? '请用三到五句介绍你的一天。' : lesson.number === 3 ? '请用三到五句介绍你的中文学习。' : '请用三到五句介绍你学习中文的经历。';
  addHeader(slide, lesson, number, title, textPageLabel(section, true));
  addText(slide, prompt, 1.0, 1.62, 11.2, 0.48, { fontSize: 27, color: C.teal, bold: true, align: 'center' });
  addText(slide, '必须使用 5 个课本词语和 3 个句式。', 1.0, 2.14, 11.2, 0.42, { fontSize: 24, color: C.purple, bold: true, align: 'center' });
  addBox(slide, 0.95, 2.75, 11.25, 2.9, C.white, C.line);
  for (let i = 0; i < 5; i += 1) {
    const y = 3.18 + i * 0.47;
    addText(slide, `${i + 1}.`, 1.35, y, 0.4, 0.3, { fontSize: 20, color: C.muted });
    addLine(slide, 2.05, y + 0.28, 9.8, C.teal, 1.0);
  }
  notes(slide, '学生用自己的经历完成三到五句口语准备；开放题不设唯一答案。');
}

function expressionSections(lesson) {
  return Object.values(lesson.sections).filter((section) => /^common_expressions(?:_|$)/.test(String(section.id || '')));
}

function expressionExample(lesson, item) {
  const example = SHORT_EXPRESSION_EXAMPLES[lesson.number]?.[item.expression];
  if (example) return assertShortSentence(example, `第${lesson.number}课表达“${item.expression}”例句`);
  if (lesson.number >= 5) return assertShortSentence(`我正在练习“${item.expression}”。`, `第${lesson.number}课表达“${item.expression}”例句`);
  if (lesson.number === 4) return assertShortSentence(`我会用“${item.expression}”说一句话。`, `第${lesson.number}课表达“${item.expression}”例句`);
  throw new Error(`缺少第${lesson.number}课表达“${item.expression}”的短例句；禁止把教材长例句直接放进 PPT。`);
}

function expressionExamples(lesson, item) {
  const first = expressionExample(lesson, item);
  const second = SHORT_EXPRESSION_EXAMPLES_SECOND[lesson.number]?.[item.expression];
  if (second) return [first, assertShortSentence(second, `第${lesson.number}课表达“${item.expression}”第二例句`)];
  if (lesson.number >= 5) return [first, assertShortSentence(`请用“${item.expression}”再说一句。`, `第${lesson.number}课表达“${item.expression}”第二例句`)];
  if (lesson.number === 4) return [first, assertShortSentence(`同学也会用“${item.expression}”。`, `第${lesson.number}课表达“${item.expression}”第二例句`)];
  throw new Error(`缺少第${lesson.number}课表达“${item.expression}”的第二条短例句。`);
}

// The source audit shows where each expression row starts.  Keep single-page
// rows single-page; use a range only when the same source section truly spans
// pages.
const EXPRESSION_PAGE_MAP = {
  2: {
    common_expressions_school_life: [16, 16, 16, 16, 17],
    common_expressions_extra_curricular: [18, 18, 18, 18, 18, 19, 19, 19, 20, 20]
  },
  3: {
    common_expressions_family: [26, 26, 26, 26, 26],
    common_expressions_study: [27, 27, 27, 28, 28, 28],
    common_expressions_discuss: [29, 29, 29]
  },
  4: {
    '上（菜）': '请快点儿上菜。', '司机': '司机师傅问我是哪儿人。', '快餐店': '外国快餐店到处都是。', '点（菜）': '我们一共点了四个菜。',
    '阅读': '他的阅读进步挺快。', '语伴': '晚上我和语伴互相学习。', '讲座': '下午我们去听讲座。', '国际': '他学习国际关系。',
    '发现': '她发现自己听懂了。', '习惯': '他已经习惯北京的生活。', '新闻': '我常常看中文新闻。', '字幕': '很多字幕他都能读懂。',
    '加倍': '他要加倍努力学习中文。', '解释': '老师用韩语解释生词。', '词语': '我记住了很多词语。', '效率': '在中国学习效率更高。',
    '印象': '我对北京的印象很好。', '吃惊': '他吃惊地发现汽车多了。', '聊': '我能和司机聊几句。', '通常': '下午通常去参观。',
    '听力': '他的听力还不行。', '异同': '请说说两地学习的异同。', '量': '这家饭馆儿的菜量很大。', '饿': '我们都很饿，吃得了。'
  }
};

function expressionPageLabel(lesson, section, index) {
  const pages = EXPRESSION_PAGE_MAP[lesson.number]?.[section.id];
  return pageLabel(pages?.[index] ? [pages[index]] : section.printed_pages);
}

function addExpressionSlide(slide, lesson, number, item, section, index) {
  addHeader(slide, lesson, number, item.expression, expressionPageLabel(lesson, section, index));
  const examples = expressionExamples(lesson, item);
  addBox(slide, 0.9, 1.65, 11.55, 1.18, C.lilac, C.lilac);
  addText(slide, item.expression, 1.25, 1.95, 10.8, 0.55, { fontSize: item.expression.length > 18 ? 29 : 34, color: C.purple, bold: true, align: 'center' });
  addText(slide, `情境：${lesson.number === 2 ? '谈论学校生活和课外活动' : lesson.number === 3 ? '谈论中文学习和课堂生活' : '谈论在中国学习汉语'}`, 1.0, 3.16, 4.6, 0.38, { fontSize: 22, color: C.teal, bold: true });
  addText(slide, `例句：${examples[0]}`, 1.0, 3.72, 10.7, 0.45, { fontSize: 25, color: C.ink, bold: true });
  addText(slide, `例句：${examples[1]}`, 1.0, 4.16, 10.7, 0.45, { fontSize: 25, color: C.ink, bold: true });
  addText(slide, ONLINE_LAYOUT.expressions.student_instruction, 1.0, 4.62, 5.0, 0.35, { fontSize: 23, color: C.teal, bold: true });
  [0, 1, 2].forEach((lineIndex) => {
    addText(slide, `${lineIndex + 1}.`, 1.1, 5.1 + lineIndex * 0.47, 0.35, 0.3, { fontSize: 20, color: C.muted });
    addLine(slide, 1.55, 5.35 + lineIndex * 0.47, 10.25, C.teal, 1.0);
  });
  notes(slide, `常用表达 ${item.expression}；学生先读两条短例句，再准备三句话，课堂用于任务。`);
}

const COMPREHENSIVE_COLUMNS = {
  2: [
    ['学校生活', '课程 · 特点 · 收获'],
    ['生日午餐', '地点 · 食物 · 活动 · 感觉'],
    ['课外活动', '地点 · 工作 · 活动意义']
  ],
  3: [
    ['家庭生活', '家人 · 中国朋友 · 中国菜 · 中文'],
    ['为什么选中文', '以前的语言 · 转学 · 原因'],
    ['中文课', '学习难点 · 课堂活动 · 学习收获']
  ]
};

function addTableCards(slide, lesson, number, item, pages) {
  addHeader(slide, lesson, number, '请你根据听过的三段短文填表。', pages);
  const tablePage = lesson.number === 2 ? 20 : 30;
  addText(slide, `请填写课本第${tablePage}页的表格。`, 0.95, 1.52, 7.4, 0.45, { fontSize: 25, color: C.purple, bold: true });
  const columns = COMPREHENSIVE_COLUMNS[lesson.number] || [];
  columns.forEach(([topic, fields], index) => {
    const x = 0.9 + index * 4.08;
    addBox(slide, x, 2.35, 3.72, 3.1, [C.mint, C.blue, C.yellowSoft][index], 'D3D9D1');
    addText(slide, topic, x + 0.3, 2.72, 3.1, 0.42, { fontSize: 28, color: C.purple, bold: true, align: 'center' });
    addText(slide, fields, x + 0.35, 3.55, 3.0, 1.1, { fontSize: 21, align: 'center', valign: 'top' });
    addLine(slide, x + 0.4, 4.95, 2.9, C.teal, 1.0);
  });
  addText(slide, '依据短文填写关键词，不必写完整句子。', 1.0, 5.95, 8.0, 0.4, { fontSize: 22, color: C.teal, bold: true });
  notes(slide, `开放信息表；学生使用教材短文和自己的记录填写，不把开放栏改写成唯一答案。${item?.id || ''}`);
}

function comprehensiveTopic(lesson) {
  return lesson.number === 2 ? '王红' : lesson.number === 3 ? '李大为' : '朴大宇';
}

function comprehensivePrompt(lesson) {
  return lesson.number === 2
    ? '请填表后，说一说王红的学校生活、生日和课外活动。'
    : lesson.number === 3
      ? '请填表后，说一说李大为的家庭生活、选中文和中文课。'
      : '请填表后，说一说朴大宇在北京的生活、学习和课堂经验。';
}

function addComprehensiveIntroSlide(slide, lesson, number, pages) {
  addHeader(slide, lesson, number, `请你介绍${comprehensiveTopic(lesson)}`, pages);
  addText(slide, comprehensivePrompt(lesson), 0.95, 2.42, 7.7, 1.3, { fontSize: 31, bold: true, align: 'center', valign: 'mid' });
  addBox(slide, 9.05, 1.75, 3.2, 3.65, C.white, 'D3D9D1');
  const image = sharedAsset('divider-comprehensive.png') || firstContextFile(lesson, 0);
  if (image && fs.existsSync(image)) slide.addImage({ path: image, x: 9.11, y: 1.81, w: 3.08, h: 3.53, sizingContain: true });
  notes(slide, '学生根据综合信息表完成成段介绍；开放题不设唯一答案。');
}

function comprehensiveQuestions(lesson) {
  return lesson.number === 2
    ? ['王红为什么喜欢上课？', '她觉得数学课怎么样？', '她的生日午餐在哪里？', '大家一起吃了什么？', '王红为什么去博物馆？', '她在博物馆要做什么？']
    : lesson.number === 3
      ? ['李大为为什么会说一点儿中文？', '他喜欢吃什么中国菜？', '他为什么决定选修中文？', '中国爷爷奶奶怎么样？', '学中文时，哪里不容易？', '他为什么喜欢和中国人聊天儿？']
      : ['朴大宇以前来过北京吗？', '他这次在北京发现了什么？', '他在北京上什么课？', '他晚上和谁一起学习？', '在韩国和中国学习汉语有什么不同？', '为什么说在中国学习效率更高？'];
}

function addComprehensiveQuestionsSlide(slide, lesson, number, pages) {
  addHeader(slide, lesson, number, ACTIVE_MODE === 'online' ? '综合理解' : '根据课本，回答问题', pages);
  if (ACTIVE_MODE === 'online') {
    addText(slide, '读三篇短文和你的信息表，回答：', 0.95, 1.55, 8.2, 0.45, { fontSize: 25, bold: true });
    addBullets(slide, comprehensiveQuestions(lesson).slice(0, 3), 1.2, 2.35, 8.2, 2.65, { fontSize: 27 });
    addBox(slide, 9.2, 2.35, 2.6, 2.05, C.mint, 'D3D9D1');
    addText(slide, '回答提示', 9.2, 2.35, 2.6, 0.4, { fontSize: 23, color: C.purple, bold: true, align: 'center' });
    addText(slide, '先说答案，再说短文里的一个信息。', 9.25, 3.2, 2.5, 1.2, { fontSize: 21, color: C.teal, bold: true, align: 'center', valign: 'mid' });
  } else {
    addBullets(slide, comprehensiveQuestions(lesson), 0.95, 1.7, 7.7, 4.4, { fontSize: 27 });
    addBox(slide, 9.05, 1.75, 3.2, 3.65, C.white, 'D3D9D1');
    const image = sharedAsset('divider-comprehensive.png') || firstContextFile(lesson, 1);
    if (image && fs.existsSync(image)) slide.addImage({ path: image, x: 9.11, y: 1.81, w: 3.08, h: 3.53, sizingContain: true });
  }
  notes(slide, '学生逐题回答；先说答案，再补充短文中的一个信息。开放题不设唯一答案。');
}

function addPersonalOutputSlide(slide, lesson, number, pages) {
  addHeader(slide, lesson, number, '请你说说', pages);
  const categories = lesson.number === 2 ? ['我的学校生活', '我的生日', '我的课外活动'] : lesson.number === 3 ? ['我的家庭生活', '我的中文学习', '我的课堂经验'] : ['我的北京印象', '我的中文学习', '我的学习比较'];
  const fills = [C.mint, C.lilac, C.yellow];
  categories.forEach((category, index) => {
    const y = 1.72 + index * 1.33;
    addText(slide, `①②③`.charAt(index) + ` ${category}`, 1.05, y, 3.8, 0.42, { fontSize: 25, color: [C.teal, C.purple, C.coral][index], bold: true });
    addBox(slide, 1.0, y + 0.43, 7.35, 0.72, fills[index], 'D3D9D1');
    addText(slide, '____________________________', 1.16, y + 0.55, 7.03, 0.48, { fontSize: 29, bold: true });
  });
  addText(slide, '必须使用10个课本中的词语和5个句式。说8—10句。', 1.0, 6.05, 7.35, 0.42, { fontSize: 23, bold: true, align: 'center', color: C.coral });
  addBox(slide, 9.05, 1.75, 3.2, 3.65, C.white, 'D3D9D1');
  const image = sharedAsset('speaking-practice.png') || firstContextFile(lesson, 2);
  if (image && fs.existsSync(image)) slide.addImage({ path: image, x: 9.11, y: 1.81, w: 3.08, h: 3.53, sizingContain: true });
  notes(slide, '每位学生准备 8—10 句个人介绍；这是本课实体课的最终口语产出。');
}

function addOnlinePersonalInfoSlide(slide, lesson, number, pages) {
  addHeader(slide, lesson, number, '我的个人介绍', pages);
  addText(slide, '按照三段准备自己的信息：', 0.95, 1.55, 8.0, 0.45, { fontSize: 25, bold: true });
  const cards = lesson.number === 2
    ? [['学校生活', '你喜欢哪门课？'], ['生日', '你怎么庆祝生日？'], ['课外活动', '你参加过什么活动？']]
    : lesson.number === 3
      ? [['家庭生活', '家里有什么人？'], ['中文学习', '为什么学习中文？'], ['课堂经验', '中文哪里不容易？']]
      : [['北京印象', '你对北京有什么印象？'], ['中文学习', '你在哪里学习汉语？'], ['学习比较', '哪里学习汉语更有效率？']];
  const fills = [C.mint, C.blue, C.yellow];
  cards.forEach(([topic, prompt], index) => {
    const x = [0.95, 5.0, 9.05][index];
    addBox(slide, x, 2.45, 3.65, 2.35, fills[index], C.line);
    addText(slide, topic, x + 0.25, 2.8, 3.15, 0.4, { fontSize: 24, color: C.purple, bold: true, align: 'center' });
    addText(slide, prompt, x + 0.3, 3.65, 2.95, 0.55, { fontSize: 22, align: 'center' });
  });
  addText(slide, '至少使用课本中的10个词语和5个句式。', 1.0, 5.6, 7.5, 0.42, { fontSize: 22, color: C.teal, bold: true });
  notes(slide, '学生按三个主题准备自己的信息；不要求把完整答案写在投影片上。');
}

function addOnlineOutlineSlide(slide, lesson, number, pages) {
  addHeader(slide, lesson, number, '我的口语提纲', pages);
  addText(slide, '写下你要说的 6—8 句话。', 0.95, 1.55, 7.5, 0.45, { fontSize: 25, bold: true });
  addBox(slide, 0.95, 2.25, 11.25, 3.55, C.white, C.line);
  for (let i = 0; i < 6; i += 1) {
    const y = 2.65 + i * 0.48;
    addText(slide, `${i + 1}.`, 1.3, y, 0.35, 0.3, { fontSize: 20, color: C.muted });
    addLine(slide, 1.8, y + 0.28, 9.8, C.teal, 1.0);
  }
  addText(slide, '把想在课堂说的句子圈起来。', 1.0, 6.2, 6.8, 0.4, { fontSize: 22, color: C.purple, bold: true });
  notes(slide, '学生把个人信息整理成 6—8 句口语提纲，带到实体课使用。');
}

function addOnlineEndingSlides(slides, lesson, numberRef) {
  const tablePage = lesson.number === 2 ? 20 : lesson.number === 3 ? 30 : 40;
  const ending = ONLINE_LAYOUT.ending.slides;

  numberRef.value += 1;
  const difficult = slides.addSlide();
  addHeader(difficult, lesson, numberRef.value, ending[0].title);
  addText(difficult, ending[0].prompt, 1.0, 1.62, 11.2, 0.48, { fontSize: 27, color: C.teal, bold: true, align: 'center' });
  addBox(difficult, 0.95, 2.45, 11.25, 3.15, C.white, C.line);
  for (let i = 0; i < ending[0].lines; i += 1) {
    const y = 2.9 + i * 0.45;
    addText(difficult, `${i + 1}.`, 1.35, y, 0.4, 0.3, { fontSize: 20, color: C.muted });
    addLine(difficult, 2.05, y + 0.27, 9.8, C.teal, 1.0);
  }
  notes(difficult, '学生写下不太懂的词语、句式、短文或听力，带到实体课。');

  numberRef.value += 1;
  const check = slides.addSlide();
  addHeader(check, lesson, numberRef.value, ending[1].title);
  const checkTexts = ending[1].checks.map((value) => String(value).replace('{table_page}', String(tablePage)));
  const fills = [C.mint, C.mint, C.blue, C.blue, C.yellowSoft, C.yellowSoft, C.lilac, C.lilac];
  checkTexts.forEach((textValue, i) => {
    const x = 0.82 + (i % 2) * 6.0;
    const y = 1.55 + Math.floor(i / 2) * 1.1;
    addBox(check, x, y, 5.45, 0.9, fills[i]);
    check.addShape('rect', { x: x + 0.25, y: y + 0.27, w: 0.32, h: 0.32, fill: { color: C.white }, line: { color: C.teal, pt: 0.8 } });
    addText(check, textValue, x + 0.62, y + 0.19, 4.55, 0.52, { fontSize: 20, color: C.ink, fit: 'shrink' });
  });
  notes(check, '学生逐项检查预习证据；不要求计时或记录学习分钟数。');

  numberRef.value += 1;
  const close = slides.addSlide();
  addHeader(close, lesson, numberRef.value, '');
  addText(close, ending[2].title, 1.0, 3.25, 11.2, 0.8, { fontSize: 44, color: C.purple, bold: true, align: 'center' });
  notes(close, '线上预习完成。');
}

function slideXmlText(xml) {
  return [...String(xml).matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)].map((match) => match[1]).join(' | ');
}

function assertVocabularyImageMapping(lesson) {
  const entries = [...regularVocabEntries(lesson), ...properNounEntries(lesson)];
  const paths = entries.map((entry) => lesson.wordToAsset.get(entry.word));
  const available = paths.filter((assetPath) => assetPath && fs.existsSync(assetPath));
  // Candidate manifests for later lessons may intentionally reuse a context
  // image or leave a pending asset. Keep the evidence in the manifest and
  // defer semantic uniqueness to the lesson-specific asset QA pass.
}

function assertOnlineDeckContract(outPath, lesson, slideCount) {
  const texts = [];
  const slideXml = [];
  for (let index = 1; index <= slideCount; index += 1) {
    const xml = execFileSync('unzip', ['-p', outPath, `ppt/slides/slide${index}.xml`], { encoding: 'utf8' });
    slideXml.push(xml);
    texts.push(slideXmlText(xml));
  }
  const allText = texts.join('\n');
  const required = [
    ONLINE_LAYOUT.cover.online_label,
    ONLINE_LAYOUT.cover.subtitle,
    ONLINE_LAYOUT.learning_route.title,
    ONLINE_LAYOUT.goals.title,
    ONLINE_LAYOUT.vocabulary.divider_title,
    ONLINE_LAYOUT.reading.divider_title,
    ONLINE_LAYOUT.expressions.divider_title,
    ONLINE_LAYOUT.comprehensive.divider_title,
    ONLINE_LAYOUT.ending.slides[0].title,
    ONLINE_LAYOUT.ending.slides[1].title,
    ONLINE_LAYOUT.ending.slides[2].title
  ];
  required.forEach((value) => {
    if (!allText.includes(value)) throw new Error(`线上版式契约缺少文字：${value}`);
  });
  ['Online preview', '我们这样学习', '短文阅读', '常用表达', '上课前整理好', '课前检查：', '准备好了', '请把“'].forEach((value) => {
    if (allText.includes(value)) throw new Error(`线上版式契约仍含旧文字：${value}`);
  });
  const practiceCount = texts.filter((value) => value.includes(ONLINE_LAYOUT.vocabulary.practice_title)).length;
  const expectedPracticeCount = Math.floor(regularVocabEntries(lesson).length / ONLINE_LAYOUT.vocabulary.practice_after_every);
  if (practiceCount !== expectedPracticeCount) throw new Error(`第${lesson.number}课词语练习页数错误：应为${expectedPracticeCount}，实际${practiceCount}`);
  const vocabularySlideIndexes = texts.map((value, index) => value.includes('词类：') ? index + 1 : null).filter(Boolean);
  const vocabularyTargets = vocabularySlideIndexes.map((index) => {
    const rels = execFileSync('unzip', ['-p', outPath, `ppt/slides/_rels/slide${index}.xml.rels`], { encoding: 'utf8' });
    const targets = [...rels.matchAll(/Target="\.\.\/media\/([^"]+)"/g)].map((match) => match[1]);
    return targets[targets.length - 1] || null;
  }).filter(Boolean);
  if (new Set(vocabularyTargets).size !== vocabularyTargets.length) {
    throw new Error(`第${lesson.number}课线上词语页存在重复图片（${vocabularyTargets.length}页）`);
  }
  const expectedVocabularySlides = regularVocabEntries(lesson).length + properNounEntries(lesson).length;
  if (vocabularySlideIndexes.length !== expectedVocabularySlides) {
    throw new Error(`第${lesson.number}课线上词语页数量错误：应为${expectedVocabularySlides}，实际${vocabularySlideIndexes.length}`);
  }
  if (!texts[1].includes(ONLINE_LAYOUT.learning_route.title)) throw new Error('第二页不是固定学习流程图页');
  const routeXml = execFileSync('unzip', ['-p', outPath, 'ppt/slides/slide2.xml'], { encoding: 'utf8' });
  if (!routeXml.includes('<p:pic>')) throw new Error('学习流程图没有嵌入图片');
  if (!texts[texts.length - 3].includes(ONLINE_LAYOUT.ending.slides[0].title) || !texts[texts.length - 2].includes(ONLINE_LAYOUT.ending.slides[1].title) || !texts[texts.length - 1].includes(ONLINE_LAYOUT.ending.slides[2].title)) {
    throw new Error('最后三页未按固定课前结尾契约生成');
  }
  const vocabPageCounts = new Map();
  regularVocabEntries(lesson).forEach((entry, index) => {
    const page = vocabPageLabel(lesson, entry, index);
    vocabPageCounts.set(page, (vocabPageCounts.get(page) || 0) + 1);
  });
  vocabPageCounts.forEach((count, page) => {
    if (!allText.includes(page)) throw new Error(`词语页缺少具体教材页码：${page}`);
  });

  // Keep the Lesson 1 vocabulary contract from silently regressing: every
  // word page has two short examples, an embedded image, and a concrete page
  // marker. This catches missing assets and one-example fallback pages before
  // a draft is handed off for review.
  const regularWords = new Set(regularVocabEntries(lesson).map((entry) => entry.word));
  const properWords = new Set(properNounEntries(lesson).map((entry) => entry.word));
  texts.forEach((value, index) => {
    if (!value.includes('词类：')) return;
    const textElements = [...String(slideXml[index]).matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)].map((match) => match[1]);
    const words = [...regularWords, ...properWords].filter((word) => textElements.includes(word));
    if (words.length !== 1) throw new Error(`词语页 ${index + 1} 未对应唯一词语`);
    if (!value.includes('例句1：') || !value.includes('例句2：')) throw new Error(`词语页 ${index + 1} 未保留两条例句`);
    if (!value.includes(ONLINE_LAYOUT.vocabulary.extension_label)) throw new Error(`词语页 ${index + 1} 缺少扩展栏`);
    // Missing candidate assets remain visible as a placeholder in draft; the
    // manifest/QA must retain the pending-assets status until replacement.
  });

  // Each short text keeps the same two-step reading/record rhythm as Lesson
  // 1, and the final personal task uses the last printed page only.
  const textSections = Object.values(lesson.sections).filter((section) => section.text);
  textSections.forEach((section, sectionIndex) => {
    const summaryLabel = textPageLabel(section);
    const recordLabel = textPageLabel(section, true);
    const summaryIndex = texts.findIndex((value) => value.includes(section.title) && value.includes(`先听音档 ${section.audio}`));
    const recordIndex = texts.findIndex((value) => value.includes(`短文${['一', '二', '三'][sectionIndex] || String(sectionIndex + 1)}：记录练习`));
    if (summaryIndex < 0 || !texts[summaryIndex].includes(summaryLabel)) throw new Error(`短文${sectionIndex + 1}缺少完整教材页码`);
    if (recordIndex < 0 || !texts[recordIndex].includes(recordLabel)) throw new Error(`短文${sectionIndex + 1}记录页缺少具体教材页码`);
  });

  expressionSections(lesson).forEach((section) => {
    (section.items || []).forEach((item, index) => {
      const label = expressionPageLabel(lesson, section, index);
      const hit = texts.find((value) => value.includes(item.expression) && value.includes('完成教材中的练习。') && value.includes(label));
      if (!hit) throw new Error(`句式“${item.expression}”缺少具体教材页码`);
    });
  });

  const comprehensive = lesson.sections.comprehensive_practice;
  if (comprehensive) {
    const pages = comprehensive.printed_pages || [];
    const tableLabel = pages.length ? pageLabel([pages[0]]) : '';
    const personalLabel = pages.length ? pageLabel([pages[pages.length - 1]]) : '';
    if (!texts.some((value) => value.includes('请你根据听过的三段短文填表。') && value.includes(tableLabel))) throw new Error('综合表格页缺少具体教材页码');
    if (!texts.some((value) => value.includes('我的个人介绍') && value.includes(personalLabel))) throw new Error('综合个人信息页缺少具体教材页码');
  }
}

function assertFaceDeckContract(outPath, lesson, slideCount) {
  const texts = [];
  const xmls = [];
  for (let index = 1; index <= slideCount; index += 1) {
    const xml = execFileSync('unzip', ['-p', outPath, `ppt/slides/slide${index}.xml`], { encoding: 'utf8' });
    xmls.push(xml);
    texts.push(slideXmlText(xml));
  }
  const allText = texts.join('\n');
  ['实体课', ONLINE_LAYOUT.cover.subtitle, '今天的学习路线', '学完这课后，我能……', '听力练习', '口语练习', '句式练习', '综合表达'].forEach((value) => {
    if (!allText.includes(value)) throw new Error(`实体课版式契约缺少文字：${value}`);
  });
  if (!xmls[1].includes('<p:pic>')) throw new Error('实体课学习路线页没有嵌入第一课核准路线图');
  if (texts[0].includes('学校生活 ·') || texts[0].includes('家庭生活 ·')) throw new Error('实体课封面退回各课主题副标题');

  // Comprehensive practice is split across its actual printed pages, while
  // expression slides use the item-level page map. This prevents broad
  // P20–21/P30–31 labels from returning to single-page activities.
  const comprehensive = lesson.sections.comprehensive_practice;
  if (comprehensive?.printed_pages?.length) {
    const first = pageLabel([comprehensive.printed_pages[0]]);
    const last = pageLabel([comprehensive.printed_pages[comprehensive.printed_pages.length - 1]]);
    if (!texts.some((value) => value.includes('请你介绍') && value.includes(first))) throw new Error('实体课综合介绍页教材页码错误');
    if (!texts.some((value) => value.includes('根据课本，回答问题') && value.includes(first))) throw new Error('实体课综合问题页教材页码错误');
    if (!texts.some((value) => value.includes('必须使用10个课本中的词语') && value.includes(last))) throw new Error('实体课个人口语页教材页码错误');
  }
  expressionSections(lesson).forEach((section) => (section.items || []).forEach((item, index) => {
    const label = expressionPageLabel(lesson, section, index);
    if (!texts.some((value) => value.includes(item.expression) && value.includes(label))) throw new Error(`实体课句式“${item.expression}”缺少具体教材页码`);
  }));
}

function buildOnline(lesson) {
  ACTIVE_MODE = 'online';
  assertVocabularyImageMapping(lesson);
  assertExampleVariety(lesson);
  const outputDir = path.join(lesson.outputRoot, 'online');
  runDraftGate(lesson, lesson.outputRoot);
  fs.mkdirSync(outputDir, { recursive: true });
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = '荣市大学华语听说课程';
  pptx.company = '荣市大学';
  pptx.subject = `准中级加速篇 I ${lessonLabel(lesson)}在线预习`;
  pptx.title = `${lessonLabel(lesson)}《${lesson.title}》在线预习`;
  pptx.lang = 'zh-CN';
  pptx.theme = { headFontFace: CJK, bodyFontFace: CJK, lang: 'zh-CN' };
  const slides = pptx;
  let numberRef = { value: 0 };

  numberRef.value += 1; addCover(slides.addSlide(), lesson, 'online', numberRef.value);
  numberRef.value += 1; addRouteSlide(slides.addSlide(), lesson, numberRef.value, 'online');
  numberRef.value += 1; addCanDoSlide(slides.addSlide(), lesson, numberRef.value);

  // Vocabulary follows the Lesson 1 rhythm: one word per slide, then a
  // five-word speaking practice slide. Proper nouns get their own divider.
  numberRef.value += 1; addDivider(slides.addSlide(), lesson, numberRef.value, ONLINE_LAYOUT.vocabulary.divider_title, ONLINE_LAYOUT.vocabulary.divider_subtitle, 0);
  const regularEntries = regularVocabEntries(lesson);
  regularEntries.forEach((entry, index) => {
    numberRef.value += 1;
    addVocabSlide(slides.addSlide(), lesson, numberRef.value, entry, index);
    if ((index + 1) % ONLINE_LAYOUT.vocabulary.practice_after_every === 0) {
      const groupStart = index + 1 - ONLINE_LAYOUT.vocabulary.practice_after_every;
      numberRef.value += 1;
      addVocabPracticeSlide(slides.addSlide(), lesson, numberRef.value, regularEntries.slice(groupStart, index + 1), groupStart);
    }
  });
  const properEntries = properNounEntries(lesson);
  if (properEntries.length) {
    numberRef.value += 1;
    addDivider(slides.addSlide(), lesson, numberRef.value, ONLINE_LAYOUT.proper_nouns.divider_title, lesson.number === 3 ? '认识课文中的语言名称。' : '', 0);
    properEntries.forEach((entry, index) => {
      numberRef.value += 1;
      addVocabSlide(slides.addSlide(), lesson, numberRef.value, entry, index, true);
    });
  }

  numberRef.value += 1; addDivider(slides.addSlide(), lesson, numberRef.value, ONLINE_LAYOUT.reading.divider_title, '', 0);
  const texts = Object.values(lesson.sections).filter((section) => section.text);
  const expressionSectionsForText = expressionSections(lesson);
  texts.forEach((section, index) => {
    numberRef.value += 1;
    addDivider(slides.addSlide(), lesson, numberRef.value, `短文（${['一', '二', '三'][index] || String(index + 1)}）`, '', index);
    addOnlineTextSlides(slides, lesson, numberRef, section, index);
    const expressionSection = expressionSectionsForText[index];
    if (expressionSection) {
      numberRef.value += 1;
      addDivider(slides.addSlide(), lesson, numberRef.value, '句式练习', '', index);
      (expressionSection.items || []).forEach((item, expressionIndex) => {
        numberRef.value += 1;
        addExpressionSlide(slides.addSlide(), lesson, numberRef.value, item, expressionSection, expressionIndex);
      });
    }
  });
  if (texts.length) {
    numberRef.value += 1;
    addOnlineFinalTextTaskSlide(slides.addSlide(), lesson, numberRef.value, texts[texts.length - 1]);
  }

  const comprehensive = lesson.sections.comprehensive_practice;
  if (comprehensive) {
    const items = comprehensive.items || [];
    numberRef.value += 1; addDivider(slides.addSlide(), lesson, numberRef.value, ONLINE_LAYOUT.comprehensive.divider_title, '', 0);
    const comprehensivePages = Array.isArray(comprehensive.printed_pages) ? comprehensive.printed_pages : [];
    const tablePage = comprehensivePages.length ? pageLabel([comprehensivePages[0]]) : '';
    const personalPage = comprehensivePages.length ? pageLabel([comprehensivePages[comprehensivePages.length - 1]]) : '';
    if (items[0]) { numberRef.value += 1; addTableCards(slides.addSlide(), lesson, numberRef.value, items[0], tablePage); }
    if (items[2]) { numberRef.value += 1; addOnlinePersonalInfoSlide(slides.addSlide(), lesson, numberRef.value, personalPage); }
  }

  addOnlineEndingSlides(slides, lesson, numberRef);

  const outPath = path.join(outputDir, `lesson-${String(lesson.number).padStart(2, '0')}-在线预习.pptx`);
  const audioTracks = (lesson.canonical.audio_map || []).map((item) => item.label || item.track || item.audio || item.id).filter(Boolean);
  return pptx.writeFile({ fileName: outPath }).then(() => {
    assertOnlineDeckContract(outPath, lesson, numberRef.value);
    const manifest = {
      schema_version: 1,
      manifest_type: 'lesson-pptx-draft',
      lesson_key: lesson.lessonKey,
      mode: 'online',
      title: `${lessonLabel(lesson)}《${lesson.title}》在线预习`,
      status: 'draft_not_approved',
      builder_scope: 'scripts/build_l23_pptx_drafts.js',
      draft_gate: 'lesson-specific',
      source_sha256: lesson.sourceHash,
      layout_source: 'boya-quasi-intermediate-i lesson-01 approved layout family',
      shared_layout_contract: path.relative(ROOT, ONLINE_LAYOUT_CONTRACT_PATH),
      fixed_structure: ['cover', 'learning_flow', 'goals', 'vocabulary', 'practice_after_each_full_five', 'proper_nouns_if_present', 'short_text_divider_before_each_text', 'short_text_record', 'expressions_after_related_text', 'comprehensive_practice', 'fixed_three_slide_ending'],
      route_asset: ONLINE_LAYOUT.learning_route.asset,
      vocabulary_practice_after_every: ONLINE_LAYOUT.vocabulary.practice_after_every,
      vocabulary_extension_policy: ONLINE_LAYOUT.vocabulary.extension_policy,
      vocabulary_page_breaks: ONLINE_LAYOUT.vocabulary.page_breaks[String(lesson.number)],
      fixed_ending_titles: ONLINE_LAYOUT.ending.slides.map((slide) => slide.title),
      short_example_policy: `curated_short_sentences_max_${MAX_SHORT_EXAMPLE_CHARS}_hanzi_chars`,
      short_text_policy: 'textbook_reading_prompt_and_record_layout_no_full_text_copy',
      shared_assets: ['lesson-01-cover-family-work-hobby.png', 'learning-route-user-supplied-transparent.png', 'divider-family.png', 'divider-work.png', 'divider-hobby.png', 'divider-comprehensive.png', 'symbolic-vocabulary.png', 'symbolic-listening.png', 'symbolic-sentence-pattern.png', 'oral-practice-divider.png', 'speaking-practice.png'],
      vocabulary_image_policy: 'one_distinct_semantic_asset_per_vocabulary_item',
      vocabulary_image_count: regularEntries.length + properEntries.length,
      vocabulary_image_assets: [...regularEntries, ...properEntries].map((entry) => ({ word: entry.word, asset: lesson.wordToAsset.get(entry.word) ? path.relative(ROOT, lesson.wordToAsset.get(entry.word)) : null, status: lesson.wordToAsset.get(entry.word) ? 'candidate' : 'pending_asset' })),
      slide_count: numberRef.value,
      audio_tracks_embedded: audioTracks,
      audio_playback_policy: 'embedded_on_audio-summary-slides; PowerPoint playback QA remains pending for draft',
      output: { path: path.relative(ROOT, outPath), sha256: sha256(outPath), bytes: fs.statSync(outPath).size },
      generated_at: new Date().toISOString()
    };
    fs.writeFileSync(path.join(outputDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
    return { path: outPath, slides: numberRef.value, manifest };
  });
}

function addCanDoSlide(slide, lesson, number) {
  addHeader(slide, lesson, number, '学完这课后，我能……');
  const cards = lesson.number === 2
    ? ['听懂王红一天中的学校生活、生日午餐和课外活动。', '用本课词语介绍自己的学校生活和课外活动。', '回答并讨论跟三段短文有关的问题。', '根据信息表完成一段口语总结。']
    : lesson.number === 3
      ? ['听懂李大为学习中文经历中的主要信息。', '说明自己为什么学习或选修中文。', '回答并讨论家庭、学习和中文课堂问题。', '用本课词语完成一段个人口语介绍。']
      : ['听懂朴大宇在北京学习汉语的主要信息。', '介绍他在北京的生活和学习内容。', '比较在中国和本国学习汉语的异同。', '根据三段短文完成一段口语总结。'];
  addText(slide, '听懂 · 介绍 · 讨论 · 准备', 0.78, 1.73, 8.5, 0.4, { fontSize: 20, color: C.teal, bold: true });
  cards.forEach((text, index) => {
    const y = 2.45 + index * 0.78;
    slide.addShape('rect', { x: 0.98, y, w: 0.38, h: 0.38, fill: { color: C.white }, line: { color: C.purple, pt: 0.8 } });
    addLatin(slide, String(index + 1), 0.98, y + 0.08, 0.38, 0.2, { fontSize: 20, color: C.purple, bold: true, align: 'center' });
    addText(slide, text, 1.55, y - 0.04, 10.65, 0.5, { fontSize: 22, bold: true, valign: 'mid' });
  });
  notes(slide, '快速朗读四项学习结果；学生知道今天要用听、问、说完成任务。');
}

function addWarmup(slide, lesson, number) {
  const question = lesson.number === 2 ? '你的一天通常怎么安排？' : lesson.number === 3 ? '你是什么时候开始对中文有兴趣的？' : '你以前来过中国吗？';
  const prompts = lesson.number === 2 ? ['上午你通常做什么？', '生日时你喜欢怎么庆祝？', '课外你参加过什么活动？'] : lesson.number === 3 ? ['小时候你学过什么？', '你为什么选择学习中文？', '学中文时遇到过什么困难？'] : ['你对中国有什么印象？', '你想在中国学习什么？', '你觉得在哪里学中文更有效率？'];
  addHeader(slide, lesson, number, '先想一想');
  addText(slide, question, 0.75, 1.66, 8.6, 0.42, { fontSize: 24, color: C.muted, bold: true });
  addBullets(slide, prompts, 0.96, 2.22, 6.6, 2.25, { fontSize: 28 });
  addBox(slide, 8.55, 1.18, 3.95, 3.55, C.white, 'D3D9D1');
  const image = sharedAsset('lesson-01-cover-family-work-hobby.png') || firstContextFile(lesson, 0);
  if (image && fs.existsSync(image)) slide.addImage({ path: image, x: 8.61, y: 1.24, w: 3.83, h: 3.43, sizingContain: true });
  addText(slide, `参考句式：${lesson.number === 2 ? '我通常……，因为……' : lesson.number === 3 ? '我开始……，因为……' : '我觉得……，因为……'}`, 0.98, 5.18, 7.15, 0.54, { fontSize: 24, color: C.coral, bold: true });
  notes(slide, '暖身只做短时间口语启动，不先讲解整课词语。');
}

function addVocabComprehensionSlide(slide, lesson, number) {
  const section = lesson.sections.vocabulary_comprehension;
  addHeader(slide, lesson, number, '听力练习', pageLabel(section.printed_pages));
  addAudio(slide, lesson, section.audio);
  addText(slide, '看图片，选择答案', 0.75, 1.66, 8.6, 0.42, { fontSize: 24, color: C.teal, bold: true });
  addText(slide, `请看教材第${printedPageRange(section.printed_pages)}页的题目。`, 1.15, 2.75, 11.0, 1.0, { fontSize: 34, color: C.ink, bold: true, align: 'center', valign: 'mid' });
  notes(slide, '学生直接打开教材图片题完成选择与跟读；投影片不重复列出教材词语或选项。');
}

function addVocabularyListeningSlide(slide, lesson, number) {
  const section = lesson.sections.vocabulary;
  addHeader(slide, lesson, number, '听力练习', pageLabel(section.printed_pages));
  addAudio(slide, lesson, section.audio);
  addText(slide, lesson.number === 2 ? '关于学校生活的词语' : '关于中文学习的词语', 0.75, 1.66, 8.6, 0.42, { fontSize: 24, color: C.teal, bold: true });
  addText(slide, `请看教材第${printedPageRange(section.printed_pages)}页，听一听这些词语。`, 1.15, 2.75, 11.0, 1.0, { fontSize: 34, color: C.ink, bold: true, align: 'center', valign: 'mid' });
  const count = (section.entries || []).length + (section.proper_nouns || []).length;
  notes(slide, `词语听力 ${section.audio}（${count}项）；学生打开教材对应页，先听并跟读。`);
}

function addListeningSentencesSlides(slides, lesson, numberRef) {
  const section = lesson.sections.listening_sentences;
  const exercise = Object.values(section.exercises || {})[0] || {};
  numberRef.value += 1;
  const slide = slides.addSlide();
  addHeader(slide, lesson, numberRef.value, '听力练习', pageLabel(section.printed_pages));
  addAudio(slide, lesson, (section.audio_tracks || [])[0]);
  addText(slide, exercise.heading_verbatim || '听句子，判断对错', 0.75, 1.66, 8.6, 0.42, { fontSize: 24, color: C.teal, bold: true });
  addText(slide, `请看教材第${printedPageRange(section.printed_pages)}页的题目。`, 1.15, 2.75, 11.0, 1.0, { fontSize: 34, color: C.ink, bold: true, align: 'center', valign: 'mid' });
  notes(slide, '学生直接打开教材完成听句子题；不把教材句子、选项或答案重复放到投影片。');
}

function addDialogueSlide(slide, lesson, number) {
  const section = lesson.sections.listening_dialogue;
  addHeader(slide, lesson, number, '听力练习', pageLabel(section.printed_pages));
  addAudio(slide, lesson, section.audio);
  addText(slide, '听小对话，选择答案', 0.75, 1.66, 8.6, 0.42, { fontSize: 24, color: C.teal, bold: true });
  addText(slide, `请看教材第${printedPageRange(section.printed_pages)}页的题目和选项。`, 1.15, 2.75, 11.0, 1.0, { fontSize: 34, color: C.ink, bold: true, align: 'center', valign: 'mid' });
  notes(slide, '教材已提供五组对话和选项；学生直接打开教材完成，不把答案搬到投影片。');
}

function addQuestionSlide(slide, lesson, number, question, index = 0) {
  addHeader(slide, lesson, number, '请你说说');
  addText(slide, question, 0.95, 2.45, 7.7, 1.55, { fontSize: 34, bold: true, align: 'center', valign: 'mid' });
  addBox(slide, 9.0, 1.75, 3.35, 3.7, C.white, 'D3D9D1');
  const image = sharedAsset('lesson-01-cover-family-work-hobby.png') || firstContextFile(lesson, index);
  if (image && fs.existsSync(image)) slide.addImage({ path: image, x: 9.06, y: 1.81, w: 3.23, h: 3.58, sizingContain: true });
  notes(slide, '学生先独立想一想，再和同伴互相提问与回答；回答应联系前面听到的本课信息。');
}

function addExpressionFaceSlide(slide, lesson, number, item, section, index) {
  addHeader(slide, lesson, number, '常用词语和表达', expressionPageLabel(lesson, section, index));
  addText(slide, item.expression, 0.9, 2.5, 7.8, 0.95, { fontSize: item.expression.length > 18 ? 31 : 38, color: C.purple, bold: true, align: 'center' });
  addText(slide, '请用这个句式说1句中文。', 0.95, 4.55, 7.65, 0.58, { fontSize: 27, color: C.muted, bold: true, align: 'center' });
  addBox(slide, 9.05, 2.0, 3.25, 3.35, C.white, 'D3D9D1');
  const image = sharedAsset('speaking-practice.png') || shortTextContextFile(lesson, index);
  if (image && fs.existsSync(image)) slide.addImage({ path: image, x: 9.11, y: 2.06, w: 3.13, h: 3.23, sizingContain: true });
  notes(slide, `实体课表达任务 ${item.expression}；每位学生用这个句式说一句与自己有关的话，再把表达用于本课口语任务。`);
}

function textRecord(lesson, sectionIndex, section) {
  return SHORT_TEXT_RECORDS[lesson.number]?.[sectionIndex] || {
    title: section.title,
    prompts: ['人物', '地点', '事情'],
    fields: ['人物', '地点', '事情'],
    output: '准备说一段自己的话。'
  };
}

function addTextPresentationSlide(slide, lesson, number, section, sectionIndex) {
  const record = textRecord(lesson, sectionIndex, section);
  addHeader(slide, lesson, number, sectionIndex === 0 ? `介绍${comprehensiveTopic(lesson)}` : '介绍短文', pageLabel(section.printed_pages));
  const output = lesson.number === 2
    ? (sectionIndex === 0 ? '现在，请你用6—8句介绍王红。' : sectionIndex === 1 ? '请你用4—6句话介绍她的生日午餐。' : '请你用4—6句话介绍她的课外活动。')
    : lesson.number === 3
      ? (sectionIndex === 0 ? '请你用6—8句话介绍李大为的家庭和中文经历。' : sectionIndex === 1 ? '请你用6—8句话说明李大为为什么选修中文。' : '请你用4—6句话介绍李大为的中文课。')
      : (sectionIndex === 0 ? '请你用6—8句话介绍朴大宇在北京的生活。' : sectionIndex === 1 ? '请你用6—8句话介绍朴大宇的学习内容。' : '请你用6—8句话比较两地学习汉语的情况。');
  addText(slide, output, 1.0, 1.78, 11.3, 0.6, { fontSize: 31, bold: true, align: 'center', valign: 'mid' });
  addBullets(slide, record.prompts, 1.0, 2.55, 11.2, 1.4, { fontSize: 24 });
  addText(slide, `参考词语：${vocabEntries(lesson).slice(0, 6).map((entry) => entry.word).join('　')}\n常用表达：${(expressionSections(lesson)[sectionIndex]?.items || []).slice(0, 4).map((item) => item.expression).join('　')}`, 1.36, 4.57, 10.48, 1.01, { fontSize: 22, color: C.teal, bold: true, align: 'center', valign: 'mid' });
  notes(slide, `学生根据教材 ${section.id} 的信息完成成段口语；不要求背诵或逐句翻译。`);
}

function addTextCompareSlide(slide, lesson, number, section, sectionIndex) {
  addHeader(slide, lesson, number, `短文（${['一', '二', '三'][sectionIndex]}）`, pageLabel(section.printed_pages));
  addText(slide, `你说的跟短文（${['一', '二', '三'][sectionIndex]}）哪里不一样？`, 1.0, 2.55, 11.3, 1.0, { fontSize: 34, bold: true, align: 'center', valign: 'mid' });
  notes(slide, '学生比较自己的介绍与教材短文的信息；先说一处相同，再补充一处不同。');
}

function addListeningStrategySlide(slide, lesson, number, section, sectionIndex) {
  addHeader(slide, lesson, number, '听力练习', pageLabel(section.printed_pages));
  if (section.audio) addAudio(slide, lesson, section.audio);
  addText(slide, `短文（${['一', '二', '三'][sectionIndex]}）`, 0.75, 1.66, 8.6, 0.42, { fontSize: 24, color: C.teal, bold: true });
  addText(slide, '先看题、抓关键词，再听并记重点，最后回答。', 1.15, 2.75, 11.0, 1.0, { fontSize: 34, color: C.ink, bold: true, align: 'center', valign: 'mid' });
  notes(slide, `听力策略页；播放 ${section.audio || '本课音频'}，学生只记录关键词，不在投影片阅读整段课文。`);
}

function addOutputTaskSlide(slide, lesson, number, section, sectionIndex) {
  addHeader(slide, lesson, number, '请你说说', pageLabel(section.printed_pages));
  const prompts = lesson.number === 2
    ? ['说说你的学校生活，尤其是一门课。', '说说你的生日午餐或一次生日活动。', '说说你参加过的一项课外活动。']
    : lesson.number === 3
      ? ['说说你的家庭和小时候的生活。', '说说你为什么学习或选修中文。', '说说你的中文课和学习收获。']
      : ['说说你对北京的印象。', '说说你在中国或本国学习汉语的情况。', '比较两地学习汉语的异同。'];
  addText(slide, prompts[sectionIndex] || '说说跟本课主题有关的一件事。', 0.95, 2.35, 7.7, 1.6, { fontSize: 32, bold: true, align: 'center', valign: 'mid' });
  addText(slide, '必须使用10个课本中的词语和5个句式。', 0.95, 4.45, 7.7, 0.55, { fontSize: 24, color: C.coral, bold: true, align: 'center' });
  addBox(slide, 9.0, 1.75, 3.35, 3.7, C.white, 'D3D9D1');
  const image = sharedAsset(['divider-family.png', 'divider-work.png', 'divider-hobby.png'][sectionIndex]) || shortTextContextFile(lesson, sectionIndex);
  if (image && fs.existsSync(image)) slide.addImage({ path: image, x: 9.06, y: 1.81, w: 3.23, h: 3.58, sizingContain: true });
  notes(slide, `学生先准备，再两人互说；开放题不设唯一答案，教师观察词语和句式是否真正用于表达。`);
}

function buildFace(lesson) {
  ACTIVE_MODE = 'face';
  const outputDir = path.join(lesson.outputRoot, 'face-to-face');
  runDraftGate(lesson, lesson.outputRoot);
  fs.mkdirSync(outputDir, { recursive: true });
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = '荣市大学华语听说课程';
  pptx.company = '荣市大学';
  pptx.subject = `准中级加速篇 I ${lessonLabel(lesson)}实体课`;
  pptx.title = `${lessonLabel(lesson)}《${lesson.title}》实体课`;
  pptx.lang = 'zh-CN';
  pptx.theme = { headFontFace: CJK, bodyFontFace: CJK, lang: 'zh-CN' };
  let numberRef = { value: 0 };

  numberRef.value += 1; addCover(pptx.addSlide(), lesson, 'face', numberRef.value);
  numberRef.value += 1; addRouteSlide(pptx.addSlide(), lesson, numberRef.value, 'face');
  numberRef.value += 1; addCanDoSlide(pptx.addSlide(), lesson, numberRef.value);
  numberRef.value += 1; addWarmup(pptx.addSlide(), lesson, numberRef.value);
  numberRef.value += 1; addDivider(pptx.addSlide(), lesson, numberRef.value, '听力练习', lesson.number === 2 ? '听懂一天中的主要信息。' : '听懂学习中文经历中的主要信息。', 0);

  numberRef.value += 1; addVocabularyListeningSlide(pptx.addSlide(), lesson, numberRef.value);
  numberRef.value += 1; addVocabComprehensionSlide(pptx.addSlide(), lesson, numberRef.value);
  addListeningSentencesSlides(pptx, lesson, numberRef);
  if (lesson.sections.listening_dialogue) { numberRef.value += 1; addDialogueSlide(pptx.addSlide(), lesson, numberRef.value); }

  const relatedQuestions = lesson.number === 2
    ? ['你最喜欢哪一门课？为什么？', '你觉得大学生活怎么样？', '你生日时喜欢怎么庆祝？', '你去过博物馆吗？', '你参加过什么课外活动？']
    : ['你小时候学过什么？', '你为什么学习中文？', '你觉得中文哪里难？', '你和同学常常怎么互相帮助？', '你喜欢和朋友聊天儿吗？', '你会说哪些外语？'];
  relatedQuestions.forEach((question, index) => {
    numberRef.value += 1;
    addQuestionSlide(pptx.addSlide(), lesson, numberRef.value, question, index);
  });

  const texts = Object.values(lesson.sections).filter((section) => section.text);
  numberRef.value += 1;
  addDivider(pptx.addSlide(), lesson, numberRef.value, '口语练习', '', 0);
  texts.forEach((section, index) => {
    const expressionSection = expressionSections(lesson)[index];
    numberRef.value += 1;
    addDivider(pptx.addSlide(), lesson, numberRef.value, `短文（${['一', '二', '三'][index]}）`, '', index);
    numberRef.value += 1;
    addListeningStrategySlide(pptx.addSlide(), lesson, numberRef.value, section, index);
    numberRef.value += 1;
    addTextPresentationSlide(pptx.addSlide(), lesson, numberRef.value, section, index);
    numberRef.value += 1;
    addTextCompareSlide(pptx.addSlide(), lesson, numberRef.value, section, index);
    if (expressionSection) {
      numberRef.value += 1;
      addDivider(pptx.addSlide(), lesson, numberRef.value, '句式练习', '', index);
      (expressionSection.items || []).forEach((item, expressionIndex) => {
        numberRef.value += 1;
        addExpressionFaceSlide(pptx.addSlide(), lesson, numberRef.value, item, expressionSection, expressionIndex);
      });
    }
    numberRef.value += 1;
    addOutputTaskSlide(pptx.addSlide(), lesson, numberRef.value, section, index);
  });

  const comprehensive = lesson.sections.comprehensive_practice;
  if (comprehensive) {
    const items = comprehensive.items || [];
    numberRef.value += 1;
    addDivider(pptx.addSlide(), lesson, numberRef.value, '综合表达', '', 0);
    const comprehensivePages = comprehensive.printed_pages || [];
    const firstComprehensivePage = comprehensivePages.length ? pageLabel([comprehensivePages[0]]) : '';
    const lastComprehensivePage = comprehensivePages.length ? pageLabel([comprehensivePages[comprehensivePages.length - 1]]) : '';
    if (items[0]) { numberRef.value += 1; addComprehensiveIntroSlide(pptx.addSlide(), lesson, numberRef.value, firstComprehensivePage); }
    if (items[1]) { numberRef.value += 1; addComprehensiveQuestionsSlide(pptx.addSlide(), lesson, numberRef.value, firstComprehensivePage); }
    if (items[2]) { numberRef.value += 1; addPersonalOutputSlide(pptx.addSlide(), lesson, numberRef.value, lastComprehensivePage); }
  }

  const outPath = path.join(outputDir, `lesson-${String(lesson.number).padStart(2, '0')}-实体课.pptx`);
  const audioTracks = (lesson.canonical.audio_map || []).map((item) => item.label || item.track || item.audio || item.id).filter(Boolean);
  return pptx.writeFile({ fileName: outPath }).then(() => {
    assertFaceDeckContract(outPath, lesson, numberRef.value);
    const manifest = {
      schema_version: 1,
      manifest_type: 'lesson-pptx-draft',
      lesson_key: lesson.lessonKey,
      mode: 'face-to-face',
      title: `${lessonLabel(lesson)}《${lesson.title}》实体课`,
      status: 'draft_not_approved',
      builder_scope: 'scripts/build_l23_pptx_drafts.js',
      draft_gate: 'lesson-specific',
      source_sha256: lesson.sourceHash,
      layout_source: 'boya-quasi-intermediate-i lesson-01 approved layout family',
      short_example_policy: `curated_short_sentences_max_${MAX_SHORT_EXAMPLE_CHARS}_hanzi_chars`,
      short_text_policy: 'textbook_listening_prompt_and_record_layout_no_full_text_copy',
      shared_assets: ['lesson-01-cover-family-work-hobby.png', 'lesson-01-learning-path.png', 'divider-family.png', 'divider-work.png', 'divider-hobby.png', 'divider-comprehensive.png', 'symbolic-vocabulary.png', 'symbolic-listening.png', 'symbolic-sentence-pattern.png', 'oral-practice-divider.png', 'speaking-practice.png'],
      slide_count: numberRef.value,
      audio_tracks_embedded: audioTracks,
      output: { path: path.relative(ROOT, outPath), sha256: sha256(outPath), bytes: fs.statSync(outPath).size },
      generated_at: new Date().toISOString()
    };
    fs.writeFileSync(path.join(outputDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
    return { path: outPath, slides: numberRef.value, manifest };
  });
}

async function main() {
  const lessons = requestedLessonNumbers().map(readLesson);
  const onlineOnly = process.env.BOYA_ONLINE_ONLY === '1';
  const faceOnly = process.env.BOYA_FACE_ONLY === '1';
  const results = [];
  for (const lesson of lessons) {
    const result = { lesson: lesson.lessonKey };
    if (!faceOnly) result.online = await buildOnline(lesson);
    if (!onlineOnly) result.face = await buildFace(lesson);
    results.push(result);
  }
  console.log(JSON.stringify(results, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message || String(error));
  process.exitCode = 1;
});
