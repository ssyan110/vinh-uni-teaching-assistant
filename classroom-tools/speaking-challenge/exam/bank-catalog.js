(() => {
  'use strict';

  const banks = [
    {
      id: '2026-fall-year1',
      academicYear: 2026,
      semester: 'fall',
      semesterOrder: 3,
      termLabel: '2026 年秋季学期',
      legacyYear: '1',
      cohortId: 'year1',
      cohortOrder: 1,
      cohortLabel: '一年级',
      title: '口语练习',
      status: '练习题库',
      isDefault: true,
      source: 'banks/2026-fall-year1.js?v=20261031-term-catalog',
    },
    {
      id: '2026-fall-year2',
      academicYear: 2026,
      semester: 'fall',
      semesterOrder: 3,
      termLabel: '2026 年秋季学期',
      legacyYear: '2',
      cohortId: 'year2',
      cohortOrder: 2,
      cohortLabel: '二年级',
      title: '口语期中题库',
      status: '审阅稿',
      source: 'banks/2026-fall-year2.js?v=20261031-term-catalog',
    },
  ];

  banks.sort((a, b) => a.academicYear - b.academicYear
    || a.semesterOrder - b.semesterOrder
    || (a.cohortOrder ?? 0) - (b.cohortOrder ?? 0)
    || a.title.localeCompare(b.title, 'zh-CN'));

  window.ORAL_EXAM_BANK_CATALOG = banks;
})();
