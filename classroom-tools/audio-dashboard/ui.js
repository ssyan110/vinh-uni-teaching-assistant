'use strict';
// Display formatting only: source IDs, file paths, question mappings and states stay intact.
window.AudioDashboardUI = {
  managementLabels: ['综合管理总表', '本卷成绩', '题库／答案', '音频管理表', '评分／表单回应', '表单设置', '周测检查'],
  managementTools(book, set, closeout) {
    const tools = [...(book.tools || []), ...(set?.tools || [])];
    const management = book.management_url || book.sets.flatMap(s => s.tools || [])
      .find(tool => tool.label === '二年级测验管理表')?.url;
    const form = tools.find(tool => ['教师审阅表单', '表单编辑（审阅稿）'].includes(tool.label))?.url;
    const formBase = /^https:\/\/docs\.google\.com\/forms\/d\/[^/]+\/edit(?:#.*)?$/.test(form || '')
      ? form.split('#')[0] : null;
    const urls = new Map(tools.map(tool => [tool.label, tool.url]));
    if (management) urls.set('综合管理总表', management);
    if (formBase) {
      if (!urls.has('评分／表单回应')) urls.set('评分／表单回应', `${formBase}#responses`);
      if (!urls.has('表单设置')) urls.set('表单设置', `${formBase}#settings`);
    }
    if (closeout?.exams?.some(exam => exam.id === set?.id)) {
      urls.set('周测检查', `closeout.html?exam=${encodeURIComponent(set.id)}`);
    }
    return this.managementLabels.map(label => ({ label, url: urls.get(label),
      reason: urls.has(label) ? '' : !set ? '此教材尚未登记此入口。'
        : label === '本卷成绩' ? '此清单尚未登记专属成绩表。'
        : label === '周测检查' ? '此清单尚未登记周测检查。'
        : '此清单尚未登记此入口。' }));
  },
  range(text = '') {
    return String(text).replace(/(\d)[—–](?=\d)/g, '$1–')
      .replace(/P(\d+)[–-]P?(\d+)/g, 'P$1–P$2');
  },
  setLabel(set) {
    return this.range(set.label).replace('全部课次教材原音', '已登记课次教材原音')
      .replace('（审阅）', '（审阅稿）');
  },
  trackTitle(track) {
    return /^Audio\s+/.test(track.title) || track.title === track.id
      ? '音频（标题待补）' : this.range(track.title);
  },
  trackDetail(track) {
    const lessons = (track.lessons?.length ? track.lessons : [track.lesson])
      .map(n => `第${n}课`).join('、');
    return `${lessons} · Audio ${track.id}`
      + (track.questions ? ` · 第${this.range(track.questions)}题` : '');
  },
  examLabel(id, fallback) {
    const set = (window.AUDIO_CATALOG || []).flatMap(book => book.sets).find(set => set.id === id);
    return set ? this.setLabel(set) : this.range(fallback);
  }
};
