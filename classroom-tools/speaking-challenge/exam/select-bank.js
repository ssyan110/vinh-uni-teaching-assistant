(() => {
  const select = document.getElementById('yearSelect');
  const year = new URLSearchParams(location.search).get('year') === '2' ? '2' : '1';
  select.value = year;
  window.ORAL_EXAM_BANK = year === '2' ? window.YEAR2_BANK : window.YEAR1_BANK;
  select.addEventListener('change', () => {
    const url = new URL(location.href);
    url.searchParams.set('year', select.value);
    location.assign(url.href);
  });
})();
