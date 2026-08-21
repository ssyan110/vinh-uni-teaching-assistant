(function () {
  const app = document.getElementById('app');

  function linkFor(path) {
    return '../' + path.split('/').map(encodeURIComponent).join('/');
  }

  function fileBySuffix(manifest, suffix) {
    return (manifest.files || []).find((file) => file.path.endsWith(suffix));
  }

  function render(manifest) {
    const ppt = fileBySuffix(manifest, 'pptx/第一课-中国人的姓名.pptx');
    const guide = fileBySuffix(manifest, 'teacher-manual/第一课简易教案.docx');
    const activityFiles = (manifest.files || []).filter((file) => file.path.includes('/activities/'));
    const release = manifest.release || {};
    const deliveryReady = release.delivery_status === 'ready';
    const gates = manifest.production_gates || {};
    const gateLabels = {
      'teacher-guide': '教师手册',
      support: '配套材料',
      prototype: '6张 prototype',
      pptx: '完整 PPTX',
      release: '交付包',
    };
    const gateCards = Object.entries(gates).map(([key, gate]) => {
      const ready = gate.status === 'ready';
      const blockers = (gate.blockers || []).map((item) => `<li>${item}</li>`).join('');
      return `<div class="gate ${ready ? 'ready' : 'blocked'}"><div><strong>${gateLabels[key] || key}</strong><span>${ready ? '通过' : '阻塞'}</span></div>${blockers ? `<ul>${blockers}</ul>` : '<p>可以进入下一步</p>'}</div>`;
    }).join('');
    app.innerHTML = `
      <section class="hero card">
        <div>
          <p class="eyebrow">当前课次</p>
          <h2>第${manifest.lesson_number}课 · ${manifest.lesson_title}</h2>
          <p class="muted">${manifest.content_status}</p>
        </div>
        <div class="status">${deliveryReady ? '已完成交付' : manifest.authority_status}</div>
      </section>

      <section class="metrics">
        <div class="metric card"><span>课程长度</span><strong>${manifest.scope.period_count}节</strong><small>${manifest.scope.total_minutes}分钟</small></div>
        <div class="metric card"><span>活动材料</span><strong>${manifest.scope.activity_count}项</strong><small>${manifest.authority.activities.file_count}份 DOCX</small></div>
        <div class="metric card"><span>权威文件</span><strong>${manifest.files.length}份</strong><small>已登记 SHA-256</small></div>
        <div class="metric card"><span>交付状态</span><strong>${deliveryReady ? '已完成交付' : (manifest.delivery_status || '未建立')}</strong><small>${release.latest_release_path ? (deliveryReady ? 'release 已完成，hash 已登记' : '已有交付包，等待最终实测') : '等待建立'}</small></div>
      </section>

      <section class="grid">
        <article class="card">
          <div class="section-head"><h3>权威教材</h3><span>20-approved</span></div>
          <a class="file-link primary" href="${linkFor(ppt.path)}">打开课堂 PPTX <span>↗</span></a>
          <a class="file-link" href="${linkFor(guide.path)}">打开简易教案 DOCX <span>↗</span></a>
          <a class="file-link" href="${linkFor('lessons/lesson-01/20-approved/activities/00-第一课活动材料索引.docx')}">打开活动材料索引 <span>↗</span></a>
        </article>

        <article class="card">
          <div class="section-head"><h3>活动材料</h3><span>DOCX</span></div>
          ${['活动01-姓名访谈','活动02-起名儿公司','活动03-电影演员中文名','活动04-姓氏信息站','活动05-调查与研究'].map((name) => {
            const guide = fileBySuffix(manifest, '/activities/' + name + '/00-教师速用说明.docx');
            return `<a class="file-link" href="${linkFor(guide.path)}">${name} · 教师速用说明 <span>↗</span></a>`;
          }).join('')}
          <p class="muted compact">共 ${activityFiles.length} 份活动文件</p>
        </article>

        <article class="card wide">
          <div class="section-head"><h3>生产 Gate</h3><span>自动检查</span></div>
          <div class="gate-grid">${gateCards}</div>
        </article>

        <article class="card wide">
          <div class="section-head"><h3>生产状态</h3><span>只读</span></div>
          <div class="path-row"><span>来源</span><code>${manifest.source_package.path}</code></div>
          <div class="path-row"><span>QA 当前</span><a href="${linkFor(manifest.qa.current_report)}">${manifest.qa.current_report}</a></div>
          <div class="path-row"><span>最新交付</span><a href="${linkFor(release.latest_zip_path || 'lessons/lesson-01/40-release')}">${release.latest_zip_path || '尚未建立'}</a></div>
        </article>
      </section>
    `;
  }

  if (window.LESSON_MANIFEST) {
    render(window.LESSON_MANIFEST);
  } else {
    app.innerHTML = '<p class="error">无法读取 lesson-manifest.json。</p>';
  }
})();
