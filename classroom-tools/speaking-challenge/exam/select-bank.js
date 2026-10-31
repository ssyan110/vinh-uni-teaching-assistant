(() => {
  'use strict';

  const bankSelect = document.getElementById('bankSelect');
  const bankStatus = document.getElementById('bankStatus');
  const rawCatalog = Array.isArray(window.ORAL_EXAM_BANK_CATALOG) ? window.ORAL_EXAM_BANK_CATALOG : [];
  const seenIds = new Set();
  const seenLegacyYears = new Set();
  const catalog = rawCatalog.filter((bank) => {
    const valid = bank
      && typeof bank.id === 'string'
      && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(bank.id)
      && Number.isSafeInteger(bank.academicYear)
      && typeof bank.semester === 'string' && bank.semester.trim()
      && Number.isSafeInteger(bank.semesterOrder)
      && typeof bank.termLabel === 'string' && bank.termLabel.trim()
      && typeof bank.cohortId === 'string' && bank.cohortId.trim()
      && Number.isSafeInteger(bank.cohortOrder ?? 0)
      && typeof bank.cohortLabel === 'string' && bank.cohortLabel.trim()
      && typeof bank.title === 'string' && bank.title.trim()
      && typeof bank.status === 'string' && bank.status.trim()
      && typeof bank.source === 'string'
      && /^[A-Za-z0-9_./-]+\.js(?:\?[A-Za-z0-9_=&%-]+)?$/.test(bank.source)
      && !bank.source.startsWith('/')
      && !bank.source.split('?')[0].split('/').includes('..');
    if (!valid || seenIds.has(bank.id) || (bank.legacyYear && seenLegacyYears.has(String(bank.legacyYear)))) return false;
    seenIds.add(bank.id);
    if (bank.legacyYear) seenLegacyYears.add(String(bank.legacyYear));
    return true;
  }).sort((a, b) => a.academicYear - b.academicYear
    || a.semesterOrder - b.semesterOrder
    || (a.cohortOrder ?? 0) - (b.cohortOrder ?? 0)
    || a.title.localeCompare(b.title, 'zh-CN'));
  const defaultBanks = catalog.filter((bank) => bank.isDefault === true);
  const catalogWarning = [
    catalog.length < rawCatalog.length ? `题库目录中有 ${rawCatalog.length - catalog.length} 项资料不完整或重复，已暂时隐藏。` : '',
    defaultBanks.length > 1 ? '题库目录设置了多个默认项，页面将使用排序最前的默认题库。' : '',
  ].filter(Boolean).join(' ');
  const params = new URLSearchParams(window.location.search);
  const byId = new Map(catalog.map((bank) => [bank.id, bank]));
  const requestedBankId = params.get('bank');
  const legacyYear = params.get('year');
  const legacyBank = legacyYear ? catalog.find((bank) => String(bank.legacyYear) === legacyYear) : null;

  function getSavedBankId() {
    try { return window.localStorage.getItem('oral-exam-bank-id'); }
    catch { return null; }
  }

  function setSavedBankId(id) {
    try { window.localStorage.setItem('oral-exam-bank-id', id); }
    catch { /* Private browsing can disable storage; URL selection still works. */ }
  }

  function populateBankOptions() {
    const groups = new Map();
    for (const bank of catalog) {
      const termKey = `${bank.academicYear}-${bank.semester}`;
      if (!groups.has(termKey)) {
        const group = document.createElement('optgroup');
        group.label = bank.termLabel;
        groups.set(termKey, group);
      }
      const option = document.createElement('option');
      option.value = bank.id;
      option.textContent = `${bank.cohortLabel} · ${bank.title}（${bank.status}）`;
      groups.get(termKey).append(option);
    }
    bankSelect.replaceChildren(...groups.values());
  }

  function loadBank(bank) {
    bankSelect.disabled = true;
    bankStatus.textContent = `${bank.termLabel} · ${bank.cohortLabel} · ${bank.title} · ${bank.status} · 正在载入题目和图片…`;
    const ready = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = bank.source;
      script.onload = () => {
        const data = window.ORAL_EXAM_BANKS?.[bank.id];
        if (!data || !Array.isArray(data.questions) || !data.questions.length || !Array.isArray(data.pictures) || !data.pictures.length) {
          const error = new Error(`题库数据缺失或不完整：${bank.id}`);
          bankStatus.textContent = `${error.message} 请检查内容脚本中的题库 ID、questions 和 pictures。`;
          bankSelect.disabled = false;
          reject(error);
          return;
        }
        window.ORAL_EXAM_BANK = data;
        const details = `${bank.termLabel} · ${bank.cohortLabel} · ${bank.title} · ${bank.status} · ${data.questions.length} 道问题 / ${data.pictures.length} 张图片`;
        bankStatus.textContent = [details, catalogWarning, selectionWarning].filter(Boolean).join(' ');
        bankSelect.disabled = false;
        resolve();
      };
      script.onerror = () => {
        const error = new Error(`题库载入失败：${bank.title}`);
        bankStatus.textContent = `${error.message} 请检查网络或选择其他题库。`;
        bankSelect.disabled = false;
        reject(error);
      };
      document.head.append(script);
    });
    return ready;
  }

  function selectBank(bank, updateUrl) {
    if (!bank) return Promise.reject(new Error('找不到所选题库。'));
    setSavedBankId(bank.id);
    if (updateUrl) {
      const url = new URL(window.location.href);
      url.searchParams.set('bank', bank.id);
      url.searchParams.delete('year');
      window.location.assign(url.href);
      return Promise.resolve();
    }
    return loadBank(bank);
  }

  if (!catalog.length) {
    bankStatus.textContent = rawCatalog.length ? catalogWarning : '当前没有可用题库。';
    bankSelect.disabled = true;
    window.ORAL_EXAM_BANK_READY = Promise.reject(new Error('当前没有可用题库。'));
    return;
  }

  populateBankOptions();
  const requestedBank = byId.get(requestedBankId);
  const requestedLegacyBank = requestedBankId ? null : legacyBank;
  const savedBank = byId.get(getSavedBankId());
  const bank = requestedBank || requestedLegacyBank || savedBank || catalog.find((entry) => entry.isDefault) || catalog[0];
  const selectionWarning = requestedBankId && !requestedBank
    ? '网址中的题库编号已失效，已载入一个可用题库。'
    : '';
  bankSelect.value = bank.id;
  bankSelect.addEventListener('change', () => selectBank(byId.get(bankSelect.value), true));
  window.ORAL_EXAM_BANK_READY = selectBank(bank, false);
})();
