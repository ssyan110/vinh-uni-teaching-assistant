import type { Page, SlideMeta } from '@open-slide/core';
import apple from './assets/apple.png';
import banana from './assets/banana.png';
import watermelon from './assets/watermelon.png';
import milk from './assets/milk.png';
import coffee from './assets/coffee.png';
import bread from './assets/bread.png';
import cola from './assets/cola.png';
import beer from './assets/beer.png';
import bus from './assets/bus.png';
import metro from './assets/metro.png';
import taxi from './assets/taxi.png';
import bicycle from './assets/bicycle.png';
import airplane from './assets/airplane.png';
import train from './assets/intercity-train.png';
import cash from './assets/cash.png';
import scan from './assets/phone-scan-payment.png';
import creditCard from './assets/credit-card.png';
import classroom from './assets/classroom.png';
import cafeteria from './assets/school-cafeteria.png';
import commonRoom from './assets/dormitory-common-room.png';

const ink = '#102A43';
const teal = '#087E8B';
const muted = '#526579';
const line = '#D9E3E8';
const pale = '#F3F8F9';
const font = "KaiTi, 'STKaiti', '楷体', 'Times New Roman', serif";

const pictures: Record<string, string> = {
  apple, banana, watermelon, milk, coffee, bread, cola, beer,
  bus, metro, taxi, bicycle, airplane, train, cash, scan, card: creditCard,
  classroom, cafeteria, commonRoom,
};

type Item = { text: string; detail?: string; image?: string; value?: string; tag?: string };
type PageData = {
  section: string; title: string; type: string; subtitle?: string; lead?: string;
  items?: Item[]; tasks?: string[]; columns?: string[]; note?: string; image?: string;
  imageItems?: Item[]; frame?: string[]; table?: { head: string[]; rows: string[][] };
};

const D: PageData[] = [
  { section: '第9课 · 交通计划', title: '出发！我们怎么去？', type: 'cover', subtitle: '联系朋友，安排交通，一起去动物园。', lead: '星期六｜学校 → 动物园', image: 'bus', note: '开场请学生说出今天要决定的三个问题：几点、在哪儿、怎么去。' },
  { section: '第9课 · 交通计划', title: '情境', type: 'statement', lead: '星期六，你和三个朋友一起去动物园。', tasks: ['大家从不同的地方来学校。', '请先联系朋友，再决定怎么去动物园。'], columns: ['谁来？', '几点见？', '在哪儿见？', '怎么去？'] },
  { section: '第9课 · 交通计划', title: '集合信息（一）', type: 'facts', items: [
    { text: '星期六', detail: '日期' }, { text: '上午 9:00', detail: '集合时间' }, { text: '学校东门', detail: '集合地点' },
  ] },
  { section: '第9课 · 交通计划', title: '集合信息（二）', type: 'facts', items: [
    { text: '4 人', detail: '人数' }, { text: '10:00 以前', detail: '到达动物园' },
  ], note: '先确认时间和地点，再决定交通方式。' },
  { section: '第9课 · 交通计划', title: '朋友信息（一）', type: 'profiles', items: [
    { text: '王明', detail: '男生 · 住学校旁边 · 骑自行车来学校\n电话：138-6107-5211', image: 'bicycle' },
    { text: '安娜', detail: '女生 · 昨天坐飞机来到这里\n现在住学校附近 · 已经加了大家的微信', image: 'airplane' },
  ], note: '问答：他们怎么来学校？怎么联系？' },
  { section: '第9课 · 交通计划', title: '朋友信息（二）', type: 'profiles', items: [
    { text: '小林', detail: '星期六早上坐火车来\n8:35 到火车站 · 不知道学校东门在哪儿', image: 'train' },
    { text: '小美', detail: '已经在学校\n她知道一号楼办公室在哪儿' },
  ], note: '讨论：谁需要帮助？谁可以帮忙？' },
  { section: '第9课 · 交通计划', title: '交通方式（一）', type: 'transport', items: [
    { text: '', detail: '15 路 · 40 分钟', image: 'bus' },
    { text: '', detail: '30 分钟 · 要换一次线', image: 'metro' },
  ] },
  { section: '第9课 · 交通计划', title: '交通方式（二）', type: 'transport', items: [
    { text: '', detail: '20 分钟', image: 'taxi' },
    { text: '', detail: '50 分钟', image: 'bicycle' },
  ], note: '你们选哪一种？为什么？' },
  { section: '第9课 · 交通计划', title: '还有一件事', type: 'callout', lead: '9:10 以后', tasks: ['一个快递会送到一号楼办公室。', '出发以前，必须有人去拿。'], columns: ['谁去拿快递？', '办公室在哪儿？', '会不会来不及？'] },
  { section: '第9课 · 交通计划', title: '你们的任务（一）', type: 'tasks', tasks: [
    '谁去接小林？', '谁去办公室拿快递？', '小林怎么联系大家？', '大家最后在哪里集合？',
  ] },
  { section: '第9课 · 交通计划', title: '你们的任务（二）', type: 'tasks', tasks: [
    '怎么去动物园？', '坐几路车／哪种交通？', '大概多长时间？',
  ], note: '用中文讨论并决定。不能只说答案，要说理由。' },
  { section: '第9课 · 交通计划', title: '最后要说', type: 'phrases', frame: [
    '我们星期六 ______ 点在 ______ 见。', '______ 去接小林，______ 去拿快递。', '我们最后决定坐 ______ 去动物园。', '大概要 ______ 分钟。',
  ], note: 'HSK 3–6 挑战：比较四种交通工具的好处和坏处。' },
  { section: '第9课 · 交通计划', title: '情况变了！', type: 'change', items: [
    { text: '火车晚了', detail: '小林 9:20 才能到学校。', image: 'train' },
    { text: '东门关闭', detail: '大家只能在一号楼旁边见。' },
  ], columns: ['几点见？', '在哪里见？', '谁拿快递？', '还能 10:00 以前到吗？'] },
  { section: '第9课 · 交通计划', title: '挑战：重新决定', type: 'debate', lead: '组里有一个人不同意第一次的交通方案。', frame: ['我不同意。', '我觉得 ______ 比较好。', '因为 ______。'], note: '全组重新决定：不改交通方案？为什么？改交通方案？为什么？' },

  { section: '第10课 · 购物计划', title: '第10课 · 购物计划', type: 'divider', image: 'banana' },
  { section: '第10课 · 购物计划', title: '100 元怎么买？', type: 'cover', subtitle: '问价格、说数量、算总价、完成购物。', lead: '食物 · 饮料 · 预算', image: 'banana', note: '标题依用户确认改为 100 元；保留后续 70 元与 80 元预算。' },
  { section: '第10课 · 购物计划', title: '情境', type: 'statement', lead: '明天四个人一起出去玩。', tasks: ['你们有 100 元买食物和饮料。', '请先问价格，再决定怎么买。'], columns: ['买得够', '花得合理', '说得清楚'] },
  { section: '第10课 · 购物计划', title: '水果摊 · 水果和牛奶', type: 'market', imageItems: [
    { image: 'apple', value: '6 元／斤' }, { image: 'banana', value: '4 元 5 角／斤' },
    { image: 'watermelon', value: '3 元／斤' }, { image: 'milk', value: '5 元／瓶' },
  ], note: '至少 2 种水果；水果一共至少 3 斤；至少 3 瓶／杯饮料；至少 1 个面包。' },
  { section: '第10课 · 购物计划', title: '水果摊 · 饮料和面包', type: 'market', imageItems: [
    { image: 'coffee', value: '8 元／杯' }, { image: 'bread', value: '6 元／个' },
    { image: 'cola', value: '3 元 9 角 8 分／瓶' }, { image: 'beer', value: '7 元／瓶' },
  ], note: '至少 2 种水果；水果一共至少 3 斤；至少 3 瓶／杯饮料；至少 1 个面包。' },
  { section: '第10课 · 购物计划', title: '角色扮演 · 问价格和数量', type: 'roleplay', items: [
    { text: '问价格', detail: '这个怎么卖？\n苹果多少钱一斤？\n咖啡多少钱一杯？' },
    { text: '说数量', detail: '我要 ______ 斤。\n我要 ______ 瓶。\n再来 ______。' },
  ] },
  { section: '第10课 · 购物计划', title: '角色扮演 · 结账', type: 'roleplay', items: [
    { text: '结账', detail: '问一共多少钱。\n问可以怎么付钱。' },
    { text: '店员', detail: '说一共多少钱。\n说可以怎么付钱。' },
  ] },
  { section: '第10课 · 购物计划', title: '挑战：你常怎么付钱？', type: 'payments', items: [
    { text: '', image: 'cash' }, { text: '', image: 'scan' }, { text: '', image: 'card' },
  ], note: '说说你常怎么付钱，为什么？' },

  { section: '综合活动 · 动物园', title: '综合活动 · 动物园', type: 'divider', image: 'metro' },
  { section: '综合活动 · 动物园', title: '10:45 以前到动物园！', type: 'cover', subtitle: '安排时间、拿快递、买东西、决定交通。', lead: '四个人 · 真实计划', image: 'metro' },
  { section: '综合活动 · 动物园', title: '今天的任务', type: 'statement', lead: '四个人一起去动物园。', tasks: ['10:45 以前必须到。', '出发以前还要拿快递、买东西、决定交通。'], columns: ['拿快递', '买东西', '决定交通'] },
  { section: '综合活动 · 动物园', title: '时间表', type: 'timeline', table: { head: ['时间', '事情'], rows: [['9:00', '大家到学校'], ['9:20', '办公室可以拿快递'], ['9:00 以后', '商店开门'], ['10:45 以前', '必须到动物园']] } },
  { section: '综合活动 · 动物园', title: '交通资料（一）', type: 'transport-prices', items: [
    { text: '', detail: '15 路 · 40 分钟 · 2 元／人', image: 'bus' },
    { text: '', detail: '30 分钟 · 4 元／人', image: 'metro' },
  ] },
  { section: '综合活动 · 动物园', title: '交通资料（二）', type: 'transport-prices', items: [
    { text: '', detail: '20 分钟 · 36 元／车', image: 'taxi' },
    { text: '', detail: '50 分钟 · 0 元', image: 'bicycle' },
  ], note: '只有 2 辆自行车。' },
  { section: '综合活动 · 动物园', title: '预算：70 元', type: 'budget', lead: '交通费和买东西的钱，都从 70 元里面付。', tasks: ['交通多少钱？', '买东西多少钱？', '最后还剩多少钱？'] },
  { section: '综合活动 · 动物园', title: '报告：我们的选择', type: 'discussion', lead: '最后说：你们怎么选？为什么？', note: '每组准备 1 分钟报告；如果没有完成，回家必须录音，再交作业。' },
  { section: '综合活动 · 动物园', title: '安排完整计划（一）', type: 'tasks', tasks: [
    '几点见？', '谁拿快递？', '先拿快递还是先买东西？', '买什么？买多少？',
  ] },
  { section: '综合活动 · 动物园', title: '安排完整计划（二）', type: 'tasks', tasks: [
    '花多少钱？', '怎么去动物园？', '最后还剩多少钱？',
  ] },
  { section: '综合活动 · 动物园', title: '我们的计划', type: 'report', lead: '说清楚几点、在哪里、做什么。', tasks: ['你们怎么安排？为什么？'], note: '每组准备 1 分钟报告；如果没有完成，回家必须录音，再交作业。' },
  { section: '综合活动 · 交通讨论', title: '综合活动 · 交通讨论', type: 'divider', image: 'bicycle' },
  { section: '综合活动 · 交通讨论', title: '从荣市到炉门海滩', type: 'beach', lead: '从荣市市中心可以怎么去炉门海滩？' },
  { section: '综合活动 · 交通讨论', title: '比较交通工具', type: 'tasks', tasks: ['比较全部的交通工具。', '哪里好？哪里不好？', '你会选什么？为什么？'], note: '每组准备 1 分 30 秒报告；如果没有完成，回家必须录音，再交作业。' },

  { section: '综合活动 · 欢迎会', title: '综合活动 · 欢迎会', type: 'divider', image: 'commonRoom' },
  { section: '综合活动 · 欢迎会', title: '一起准备欢迎会', type: 'cover', subtitle: '决定时间、地点、交通和要买的东西。', lead: '6 位参加者 · 80 元预算', image: 'commonRoom' },
  { section: '综合活动 · 欢迎会', title: '情境', type: 'statement', lead: '星期五，你们要给一位新同学办欢迎会。', tasks: ['一共 6 个人参加。', '总预算：80 元。'], columns: ['几点开始？', '在哪里？', '新同学怎么来？', '买什么、花多少钱？'] },
  { section: '综合活动 · 欢迎会', title: '欢迎谁？', type: 'profile', lead: '安娜', items: [
    { text: '英国人' }, { text: '大一学生' }, { text: '中文专业' }, { text: '今天第一次来学校' }, { text: '王林的同屋' },
  ] },
  { section: '综合活动 · 欢迎会', title: '大家什么时候有时间？', type: 'schedule', table: { head: ['人物', '有时间'], rows: [['安娜', '17:00 以后'], ['王林', '16:30 以后'], ['小美', '17:30 以后'], ['李明', '17:00 以后'], ['小林', '17:30 以后']] } },
  { section: '综合活动 · 欢迎会', title: '确定欢迎会时间', type: 'discussion', lead: '大家都能参加的时间是几点？最后决定：欢迎会 ______ 点开始。' },
  { section: '综合活动 · 欢迎会', title: '在哪里比较好？', type: 'venues', items: [
    { text: '', detail: '三号楼二楼 · 很安静 · 不能吃东西', image: 'classroom' },
    { text: '', detail: '图书馆左边 · 可以买吃的 · 人比较多', image: 'cafeteria' },
    { text: '', detail: '食堂后面 · 可以吃东西 · 有桌椅', image: 'commonRoom' },
  ], note: '选一个地点。说：我觉得 ______ 比较好，因为 ______。我觉得 ______，______ 不好，因为 ______。' },
  { section: '综合活动 · 欢迎会', title: '安娜怎么来？', type: 'transport-prices', lead: '16:30 到火车站', items: [
    { text: '', detail: '35 分钟 · 2 元', image: 'bus' },
    { text: '', detail: '25 分钟 · 4 元', image: 'metro' },
    { text: '', detail: '15 分钟 · 20 元', image: 'taxi' },
  ], note: '建议安娜怎么来？说坐什么、多长时间、到哪里以后联系谁。' },
  { section: '综合活动 · 欢迎会', title: '欢迎会要买什么？', type: 'market', imageItems: [
    { image: 'apple', value: '6 元／斤' }, { image: 'banana', value: '4 元 5 角／斤' },
    { image: 'watermelon', value: '3 元／斤' }, { image: 'milk', value: '5 元／瓶' },
  ] },
  { section: '综合活动 · 欢迎会', title: '欢迎会要买什么？饮料和面包', type: 'market', imageItems: [
    { image: 'cola', value: '4 元／瓶' }, { image: 'coffee', value: '8 元／杯' },
    { image: 'bread', value: '6 元／个' },
  ], note: '请讨论：你们最后决定买什么？' },
  { section: '综合活动 · 欢迎会', title: '80 元够不够？', type: 'budget', lead: '交通费和欢迎会买东西的钱都算在 80 元里面。', tasks: ['交通：______ 元', '水果：______ 元', '饮料：______ 元', '面包：______ 元', '一共：______ 元'] },
  { section: '综合活动 · 欢迎会', title: '说说预算', type: 'discussion', lead: '说说最后每一种东西多少钱，一共多少钱。' },
  { section: '综合活动 · 欢迎会', title: '一起完成欢迎会计划（一）', type: 'tasks', tasks: [
    '欢迎会几点开始？', '在哪里？', '安娜怎么来？', '谁联系安娜？', '买哪两种水果？',
  ] },
  { section: '综合活动 · 欢迎会', title: '一起完成欢迎会计划（二）', type: 'tasks', tasks: [
    '买多少？', '买什么饮料？', '买几个面包？', '一共多少钱？',
  ], note: '每组准备 1 分钟报告；如果没有完成，回家必须录音，再交作业。' },

  { section: '讨论 · 交通', title: '讨论 · 交通', type: 'divider', image: 'airplane' },
  { section: '讨论 · 交通', title: '第一次去朋友家', type: 'discussion', lead: '应该自己找路，还是让朋友来接？为什么？', note: '每人准备 30 秒报告；如果没有完成，回家必须录音，再交作业。' },
  { section: '讨论 · 时间', title: '讨论 · 时间', type: 'divider', image: 'train' },
  { section: '讨论 · 时间', title: '朋友常常迟到', type: 'discussion', lead: '你还会继续约他吗？为什么？', note: '每人准备 30 秒报告；如果没有完成，回家必须录音，再交作业。' },
  { section: '讨论 · 购物', title: '讨论 · 购物', type: 'divider', image: 'apple' },
  { section: '讨论 · 购物', title: '价格还是质量？', type: 'discussion', lead: '买东西时，价格重要还是质量重要？为什么？', note: '每人准备 30 秒报告；如果没有完成，回家必须录音，再交作业。' },
  { section: '讨论 · 付款', title: '讨论 · 付款', type: 'divider', image: 'cash' },
  { section: '讨论 · 付款', title: '一起吃饭怎么付钱？', type: 'discussion-pay', lead: '应该 AA 制，还是一个人先付钱？', tasks: ['你选哪个？为什么？', '为什么你不选另外一个？'], note: '每人准备 30 秒报告；如果没有完成，回家必须录音，再交作业。' },
];

const base: React.CSSProperties = {
  width: 1920, height: 1080, boxSizing: 'border-box', padding: '74px 96px 68px',
  background: '#FFFFFF', color: ink, fontFamily: font, position: 'relative', overflow: 'hidden',
};
const card: React.CSSProperties = { border: `1px solid ${line}`, borderRadius: 24, background: '#FFFFFF', boxSizing: 'border-box' };

function Header({ d, index }: { d: PageData; index: number }) {
  return <>
    <div style={{ color: teal, fontSize: 45, fontWeight: 700, letterSpacing: 1 }}>{d.section}</div>
    <h1 style={{ margin: '12px 0 0', color: ink, fontSize: 74, lineHeight: 1.08, fontWeight: 750, letterSpacing: -1 }}>{d.title}</h1>
    <div style={{ marginTop: 28, width: 74, height: 7, borderRadius: 4, background: teal }} />
    <div style={{ position: 'absolute', bottom: 96, left: 96, right: 96, display: 'flex', justifyContent: 'space-between', color: muted, fontSize: 30 }}>
      <span>博雅汉语 · 初级口语活动</span><span>{String(index + 1).padStart(2, '0')} / {D.length}</span>
    </div>
  </>;
}

function Img({ name, width = 170, height = 140 }: { name?: string; width?: number; height?: number }) {
  if (!name) return null;
  return <img src={pictures[name]} alt={name} style={{ width, height, objectFit: 'contain' }} />;
}

function Chip({ children }: { children: React.ReactNode }) {
  return <div data-osd-step style={{ ...card, minHeight: 116, padding: '24px 30px', display: 'flex', alignItems: 'center', borderColor: '#C9E2E5', background: pale, color: ink, fontSize: 46, lineHeight: 1.25, fontWeight: 650 }}>{children}</div>;
}

function Content({ d, index }: { d: PageData; index: number }) {
  const note = d.note ? <div data-osd-step style={{ marginTop: 22, color: teal, fontSize: 45, lineHeight: 1.32, fontWeight: 600 }}>{d.note}</div> : null;
  const items = d.items ?? [];
  const cards = (list: Item[], count = list.length) => <div style={{ display: 'grid', gridTemplateColumns: `repeat(${count}, 1fr)`, gap: 22, width: '100%' }}>{list.map((it, i) =>
    <div key={i} data-osd-step style={{ ...card, minHeight: 320, padding: 28, display: 'flex', gap: 22, alignItems: 'center', background: i % 2 ? '#FFFFFF' : '#FBFDFD' }}>
      {it.image && <Img name={it.image} width={155} height={145} />}
      <div style={{ minWidth: 0 }}><div style={{ fontSize: 52, lineHeight: 1.18, fontWeight: 720 }}>{it.text}</div>{it.detail && <div style={{ marginTop: 12, fontSize: 45, lineHeight: 1.35, color: muted, whiteSpace: 'pre-line' }}>{it.detail}</div>}{it.value && <div style={{ marginTop: 12, fontSize: 48, lineHeight: 1.2, fontWeight: 700, color: teal }}>{it.value}</div>}</div>
    </div>)}</div>;
  const tasklist = (list: string[], cols = 1) => <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '14px 24px' }}>{list.map((t, i) => <div key={i} data-osd-step style={{ display: 'flex', alignItems: 'center', gap: 18, minHeight: 88, borderBottom: `1px solid ${line}`, padding: '5px 4px' }}><span style={{ flex: '0 0 64px', width: 64, height: 64, borderRadius: 32, background: pale, color: teal, display: 'grid', placeItems: 'center', fontSize: 45, fontWeight: 750 }}>{String(i + 1).padStart(2, '0')}</span><span style={{ fontSize: 48, lineHeight: 1.28 }}>{t}</span></div>)}</div>;
  const table = d.table;
  const tableView = table ? <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 46, lineHeight: 1.2, textAlign: 'left' }}><thead><tr>{table.head.map((h, i) => <th key={i} style={{ padding: '14px 24px', background: pale, color: teal, borderBottom: `2px solid ${line}` }}>{h}</th>)}</tr></thead><tbody>{table.rows.map((row, ri) => <tr key={ri} data-osd-step>{row.map((c, ci) => <td key={ci} style={{ padding: '14px 24px', borderBottom: `1px solid ${line}`, fontWeight: ci === 0 ? 650 : 500 }}>{c}</td>)}</tr>)}</tbody></table> : null;

  if (d.type === 'divider') return <div style={{ ...base, padding: '90px 128px 96px', display: 'grid', gridTemplateColumns: '1.15fr .85fr', alignItems: 'center', gap: 64 }}>
    <div><h1 data-osd-step style={{ margin: 0, maxWidth: 1000, color: ink, fontSize: 78, lineHeight: 1.12, fontWeight: 760 }}>{d.title}</h1><div style={{ marginTop: 34, width: 120, height: 10, borderRadius: 5, background: '#F2C14E' }} /><div style={{ marginTop: 20, width: 84, height: 7, borderRadius: 4, background: teal }} /></div>
    <div data-osd-step style={{ height: 590, display: 'grid', placeItems: 'center', borderRadius: 36, background: pale, border: `1px solid ${line}` }}><Img name={d.image} width={520} height={470} /></div>
    <div style={{ position: 'absolute', bottom: 96, left: 96, right: 96, display: 'flex', justifyContent: 'space-between', color: muted, fontSize: 30 }}><span>博雅汉语 · 初级口语活动</span><span>{String(index + 1).padStart(2, '0')} / {D.length}</span></div>
  </div>;

  if (d.type === 'cover') return <div style={{ ...base, paddingTop: 110 }}>
    <div style={{ position: 'absolute', top: 84, left: 96, color: teal, fontSize: 45, fontWeight: 700, letterSpacing: 1 }}>{d.section}</div>
    <div style={{ height: '100%', display: 'grid', gridTemplateColumns: '1.1fr .9fr', alignItems: 'center', gap: 50 }}>
      <div style={{ paddingBottom: 45 }}><h1 data-osd-step style={{ margin: 0, fontSize: 82, lineHeight: 1.12, letterSpacing: -2, fontWeight: 760 }}>{d.title}</h1><div style={{ marginTop: 34, width: 90, height: 8, borderRadius: 4, background: teal }} /><p data-osd-step style={{ margin: '34px 0 0', maxWidth: 900, fontSize: 48, lineHeight: 1.35, color: muted }}>{d.subtitle}</p><div data-osd-step style={{ marginTop: 38, fontSize: 45, lineHeight: 1.25, fontWeight: 650, color: teal }}>{d.lead}</div></div>
      <div data-osd-step style={{ height: 620, display: 'grid', placeItems: 'center', borderLeft: `1px solid ${line}` }}><Img name={d.image} width={690} height={590} /></div>
    </div><div style={{ position: 'absolute', bottom: 96, left: 96, right: 96, display: 'flex', justifyContent: 'space-between', color: muted, fontSize: 30 }}><span>博雅汉语 · 初级口语活动</span><span>{String(index + 1).padStart(2, '0')} / {D.length}</span></div>
  </div>;

  return <div style={base}><Header d={d} index={index} /><div style={{ marginTop: 34, height: 600, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
    {d.type === 'statement' && <><div data-osd-step style={{ fontSize: 60, lineHeight: 1.25, fontWeight: 700, maxWidth: 1500 }}>{d.lead}</div>{d.tasks && <div style={{ marginTop: 22, fontSize: 46, lineHeight: 1.35, color: muted }}>{d.tasks.map((x, i) => <div key={i} data-osd-step>{x}</div>)}</div>}{d.columns && <div style={{ display: 'grid', gridTemplateColumns: `repeat(${d.columns.length}, 1fr)`, gap: 20, marginTop: 38 }}>{d.columns.map((x, i) => <Chip key={i}>{x}</Chip>)}</div>}</>}
    {d.type === 'facts' && <>{cards(items, 3)}{note}</>}
    {d.type === 'profiles' && <>{cards(items, 2)}{note}</>}
    {d.type === 'transport' && <>{cards(items, 2)}{note}</>}
    {d.type === 'callout' && <div style={{ display: 'grid', gridTemplateColumns: '1.05fr .95fr', gap: 60, alignItems: 'center' }}><div><div data-osd-step style={{ color: teal, fontWeight: 800, fontSize: 56 }}>{d.lead}</div><div style={{ marginTop: 16, fontSize: 58, lineHeight: 1.28, fontWeight: 700 }}>{d.tasks?.map(x => <div key={x} data-osd-step>{x}</div>)}</div><div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginTop: 30 }}>{d.columns?.map(x => <Chip key={x}>{x}</Chip>)}</div></div><div data-osd-step style={{ display: 'grid', placeItems: 'center' }}><Img name={d.image} width={600} height={500} /></div></div>}
    {d.type === 'tasks' && <>{tasklist(d.tasks ?? [], d.tasks && d.tasks.length > 5 ? 2 : 1)}{note}</>}
    {d.type === 'phrases' && <><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>{d.frame?.map((x, i) => <div key={i} data-osd-step style={{ ...card, padding: '24px 30px', minHeight: 140, display: 'flex', alignItems: 'center', fontSize: 46, lineHeight: 1.28, fontWeight: 620 }}>{x}</div>)}</div>{note}</>}
    {d.type === 'change' && <>{cards(items, 2)}<div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginTop: 25 }}>{d.columns?.map(x => <Chip key={x}>{x}</Chip>)}</div></>}
    {d.type === 'debate' && <><div data-osd-step style={{ ...card, background: pale, borderColor: '#C9E2E5', padding: 32, fontSize: 54, lineHeight: 1.3, fontWeight: 650 }}>{d.lead}</div><div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20, marginTop: 28 }}>{d.frame?.map(x => <Chip key={x}>{x}</Chip>)}</div>{note}</>}
    {d.type === 'market' && <><div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 18 }}>{d.imageItems?.map((it,i) => <div key={i} data-osd-step style={{ ...card, height: 246, display: 'flex', alignItems: 'center', padding: '16px 18px', gap: 10, background: i % 2 ? '#FFFFFF' : '#FBFDFD' }}><Img name={it.image} width={150} height={165} /><div style={{ fontSize: 46, lineHeight: 1.25, color: teal, fontWeight: 700 }}>{it.value}</div></div>)}</div>{note}</>}
    {d.type === 'roleplay' && <>{cards(items, 2)}</>}
    {d.type === 'payments' && <><div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>{items.map((it,i) => <div key={i} data-osd-step style={{ ...card, height: 400, display: 'flex', justifyContent: 'center', alignItems: 'center', background: pale, borderColor: '#C9E2E5' }}><Img name={it.image} width={340} height={300} /></div>)}</div>{note}</>}
    {d.type === 'timeline' && <>{tableView}{note}</>}
    {d.type === 'transport-prices' && <>{d.lead && <div data-osd-step style={{ marginBottom: 18, color: teal, fontSize: 46, lineHeight: 1.25, fontWeight: 700 }}>{d.lead}</div>}<div style={{ display: 'grid', gridTemplateColumns: `repeat(${items.length <= 3 ? items.length : 2},1fr)`, gap: 22 }}>{items.map((it,i)=><div key={i} data-osd-step style={{ ...card, minHeight: 360, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, padding: 18, background: i%2 ? '#FFFFFF' : '#FBFDFD' }}><Img name={it.image} width={210} height={175} /><div style={{ fontSize: 48, lineHeight: 1.25, fontWeight: 700, color: teal }}>{it.detail}</div></div>)}</div>{note}</>}
    {d.type === 'budget' && <><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 42, alignItems: 'start' }}><div><div data-osd-step style={{ fontSize: 54, fontWeight: 720, lineHeight: 1.25 }}>{d.lead}</div><div style={{ marginTop: 22 }}>{tasklist(d.tasks ?? [])}</div></div><div style={{ ...card, padding: 30, background: pale, borderColor: '#C9E2E5' }}><div data-osd-step style={{ color: teal, fontSize: 45, fontWeight: 700 }}>我们的账本</div>{['交通', '买东西', '剩下'].map(x => <div key={x} data-osd-step style={{ height: 110, borderBottom: `1px solid ${line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 48 }}><span>{x}</span><span>______ 元</span></div>)}</div></div>{note}</>}
    {d.type === 'report' && <><div data-osd-step style={{ fontSize: 58, lineHeight: 1.28, fontWeight: 700 }}>{d.lead}</div><div style={{ marginTop: 22, maxWidth: 1320 }}>{tasklist(d.tasks ?? [])}</div>{note}</>}
    {d.type === 'beach' && <><div style={{ display: 'grid', gridTemplateColumns: '1fr 300px 1fr', alignItems: 'center', gap: 25, marginBottom: 24 }}><Chip>荣市市中心</Chip><div data-osd-step style={{ textAlign: 'center', color: teal, fontSize: 60, fontWeight: 700 }}>→</div><Chip>炉门海滩</Chip></div><div data-osd-step style={{ fontSize: 52, fontWeight: 700, marginBottom: 14 }}>{d.lead}</div>{tasklist(d.tasks ?? [])}{note}</>}
    {d.type === 'profile' && <><div data-osd-step style={{ fontSize: 56, fontWeight: 730, color: teal }}>{d.lead}</div><div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20, marginTop: 26 }}>{items.map(it => <Chip key={it.text}>{it.text}</Chip>)}</div></>}
    {d.type === 'schedule' && <>{tableView}<div data-osd-step style={{ marginTop: 22, fontSize: 45, lineHeight: 1.25, color: teal, fontWeight: 650 }}>{d.note}</div></>}
    {d.type === 'venues' && <>{cards(items, 3)}{note}</>}
    {d.type === 'discussion' && <><div data-osd-step style={{ ...card, borderColor: '#C9E2E5', background: pale, padding: 48, fontSize: 68, lineHeight: 1.3, fontWeight: 700 }}>{d.lead}</div>{note}</>}
    {d.type === 'discussion-pay' && <><div data-osd-step style={{ ...card, borderColor: '#C9E2E5', background: pale, padding: 36, fontSize: 60, lineHeight: 1.3, fontWeight: 700 }}>{d.lead}</div><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginTop: 25 }}>{d.tasks?.map(x => <Chip key={x}>{x}</Chip>)}</div>{note}</>}
  </div></div>;
}

const pages: Page[] = D.map((d, index) => () => <Content d={d} index={index} />);

export const meta: SlideMeta = { title: '第9–10课｜活动卡 image-first' };
export const notes: (string | undefined)[] = D.map(d => d.note);
export default pages satisfies Page[];
