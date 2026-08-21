(function () {
  const app = document.getElementById('app');
  const data = window.DASHBOARD_MANIFEST;

  if (!data) {
    app.innerHTML = '<p class="error">无法读取 dashboard manifest。</p>';
    return;
  }

  const lessons = data.lessons || [];
  const lessonMap = new Map(lessons.map((lesson) => [lesson.id, lesson]));
  const details = data.lesson_details || {};
  const statusClasses = {
    delivered: 'done',
    in_progress: 'review',
    source_review: 'review',
    available: 'available',
    locked: 'locked',
    done: 'done',
    approved: 'approved',
    review: 'review',
    todo: 'todo'
  };

  function escapeHTML(value) {
    return String(value == null ? '' : value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function text(value, fallback) {
    return escapeHTML(value == null || value === '' ? (fallback || '—') : value);
  }

  function linkFor(path) {
    return '../' + path.split('/').map((part) => encodeURIComponent(part)).join('/');
  }

  function statusChip(status, label) {
    const klass = statusClasses[status] || 'todo';
    return `<span class="status ${klass}"><span aria-hidden="true"></span>${text(label || status)}</span>`;
  }

  function progressBar(progress) {
    const percent = Math.max(0, Math.min(100, Number(progress && progress.percent) || 0));
    return `<div class="progress-line" role="progressbar" aria-label="进度" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}"><i style="width:${percent}%"></i></div>`;
  }

  function parseRoute() {
    const raw = decodeURIComponent(window.location.hash.slice(1));
    const parts = raw.split('/');
    if (parts[0] !== 'lesson' || !lessonMap.has(parts[1])) {
      return { view: 'course' };
    }
    return {
      view: 'lesson',
      lessonId: parts[1],
      tab: ['overview', 'gates', 'files', 'qa'].includes(parts[2]) ? parts[2] : 'overview',
      gateId: parts[3] || ''
    };
  }

  function documentLinks() {
    const documents = (data.course && data.course.documents) || [];
    if (!documents.length) return '<p class="empty">课程文件尚未登记。</p>';
    return documents.map((item) => `
      <a class="file-link" href="${linkFor(item.path)}">
        <span>${text(item.label)}</span><span aria-hidden="true">↗</span>
      </a>
    `).join('');
  }

  function lessonRow(lesson) {
    const number = String(lesson.number).padStart(2, '0');
    const progress = lesson.progress || { completed: 0, total: 11, percent: 0 };
    return `
      <a class="lesson-row ${statusClasses[lesson.status] || 'todo'}" href="#lesson/${encodeURIComponent(lesson.id)}/overview">
        <span class="lesson-number">${number}</span>
        <span class="lesson-row-main">
          <strong>第 ${text(lesson.number)} 课 · ${text(lesson.title)}</strong>
          <span class="lesson-stage">${text(lesson.stage)} · ${text(lesson.next_action)}</span>
          <span class="lesson-progress">
            ${progressBar(progress)}
            <span>${text(progress.completed)} / ${text(progress.total)} gate</span>
          </span>
        </span>
        ${statusChip(lesson.status, lesson.status_label)}
        <span class="row-arrow" aria-hidden="true">→</span>
      </a>
    `;
  }

  function renderCourse() {
    const summary = data.summary || {};
    const focus = lessonMap.get(summary.focus_lesson_id) || lessons[0];
    const totalGates = Number(summary.total_gates) || 0;
    const completedGates = Number(summary.completed_gates) || 0;
    const gatePercent = totalGates ? Math.round(completedGates / totalGates * 100) : 0;

    app.innerHTML = `
      <section class="hero card">
        <div>
          <p class="eyebrow">COURSE OVERVIEW</p>
          <h2>${text(data.course && data.course.title, '教材制作控制台')}</h2>
          <p class="muted">这里只看整套八课的状态。点击一课后，才进入该课的生产 Gate、文件与 QA 工作区。</p>
        </div>
        <div class="hero-side">
          ${statusChip(focus && focus.status, focus && focus.status_label)}
          <span class="hero-date">更新 ${text(data.generated_at)}</span>
        </div>
      </section>

      <section class="focus-card card" aria-label="下一项工作">
        <div class="focus-mark">→</div>
        <div class="focus-copy">
          <p class="eyebrow">NEXT ACTION</p>
          <h3>${focus ? `第 ${text(focus.number)} 课 · ${text(focus.title)}` : '尚未选择课次'}</h3>
          <p>${focus ? text(focus.next_action) : '等待课程资料。'}</p>
        </div>
        ${focus ? `<a class="button primary" href="#lesson/${encodeURIComponent(focus.id)}/overview">进入工作区</a>` : ''}
      </section>

      <section class="metrics" aria-label="课程摘要">
        <div class="metric card"><span>已交付课次</span><strong>${text(summary.delivered)} / ${text(data.course && data.course.lesson_count)}</strong><small>交付包已锁定</small></div>
        <div class="metric card"><span>当前可工作</span><strong>${text(summary.available)}</strong><small>来源审核或制作中</small></div>
        <div class="metric card"><span>已完成 Gate</span><strong>${text(completedGates)} / ${text(totalGates)}</strong><small>全课程生产进度 ${gatePercent}%</small></div>
        <div class="metric card"><span>锁定课次</span><strong>${text(summary.locked)}</strong><small>等待前一课交付</small></div>
      </section>

      <section class="course-grid">
        <article class="card lesson-board">
          <div class="section-head">
            <div><p class="eyebrow">LESSON BOARD</p><h3>八课进度</h3></div>
            <span class="section-note">只显示摘要</span>
          </div>
          <div class="lesson-list" role="list">
            ${lessons.map(lessonRow).join('')}
          </div>
        </article>

        <aside class="course-side">
          <article class="card side-card">
            <div class="section-head"><h3>课程文件</h3><span>共用</span></div>
            ${documentLinks()}
          </article>
          <article class="card side-card rule-card">
            <p class="eyebrow">WORKFLOW RULE</p>
            <h3>逐课推进</h3>
            <p>当前课次完成教师手册、配套、PPTX、QA、rehearsal 与交付后，才解锁下一课。</p>
          </article>
        </aside>
      </section>
    `;
  }

  function tabLink(lesson, tab, label, active) {
    return `<a class="tab ${active ? 'is-active' : ''}" ${active ? 'aria-current="page"' : ''} href="#lesson/${encodeURIComponent(lesson.id)}/${tab}">${label}</a>`;
  }

  function gateLink(lesson, gate, compact) {
    return `
      <a class="gate-row ${compact ? 'compact' : ''}" href="#lesson/${encodeURIComponent(lesson.id)}/gates/${encodeURIComponent(gate.id)}">
        <span class="gate-no">${String(gate.number).padStart(2, '0')}</span>
        <span class="gate-main"><strong>${text(gate.title)}</strong><small>${text(gate.description)}</small></span>
        ${statusChip(gate.status, gate.status_label)}
        <span class="row-arrow" aria-hidden="true">→</span>
      </a>
    `;
  }

  function renderGateDetail(lesson, detail, gateId) {
    const gate = (detail.gates || []).find((item) => item.id === gateId);
    if (!gate) return '';
    const evidence = gate.evidence || [];
    return `
      <article class="gate-detail card" aria-live="polite">
        <div class="detail-kicker">GATE ${String(gate.number).padStart(2, '0')}</div>
        <div class="detail-head">
          <div><h3>${text(gate.title)}</h3><p>${text(gate.description)}</p></div>
          ${statusChip(gate.status, gate.status_label)}
        </div>
        <div class="detail-divider"></div>
        <h4>证据</h4>
        ${evidence.length ? `<div class="evidence-list">${evidence.map((item) => `<a href="${linkFor(item.path)}"><span>${text(item.label)}</span><small>${text(item.path)}</small><span aria-hidden="true">↗</span></a>`).join('')}</div>` : '<p class="empty">当前没有已登记的证据文件。</p>'}
      </article>
    `;
  }

  function renderOverview(lesson, detail) {
    const gates = detail.gates || [];
    const current = gates.find((gate) => ['review', 'available', 'todo'].includes(gate.status));
    const catalog = lesson.catalog || {};
    const counts = lesson.counts || {};
    return `
      <section class="overview-grid">
        <article class="card next-panel">
          <p class="eyebrow">CURRENT GATE</p>
          <h3>${current ? text(current.title) : '所有 Gate 已完成'}</h3>
          <p>${current ? text(current.description) : '当前课次已完成全部生产检查。'}</p>
          ${current ? `<a class="button secondary" href="#lesson/${encodeURIComponent(lesson.id)}/gates/${encodeURIComponent(current.id)}">查看 Gate 详情</a>` : ''}
        </article>
        <article class="card fact-panel">
          <p class="eyebrow">LESSON SNAPSHOT</p>
          <div class="fact-grid">
            <div><span>课堂时间</span><strong>${text(lesson.scope && lesson.scope.period_count, '6')} 节／${text(lesson.scope && lesson.scope.total_minutes, '300')} 分钟</strong></div>
            <div><span>教材页</span><strong>${text(catalog.printed_pages)}</strong></div>
            <div><span>教材练习</span><strong>${text(counts.exercises)}</strong></div>
            <div><span>音档</span><strong>${text(counts.audio)}</strong></div>
          </div>
        </article>
      </section>
      <article class="card gate-panel">
        <div class="section-head"><div><p class="eyebrow">PRODUCTION GATES</p><h3>生产流程</h3></div><span>${text(lesson.progress.completed)} / ${text(lesson.progress.total)} 已完成</span></div>
        <div class="gate-list">${gates.map((gate) => gateLink(lesson, gate, true)).join('')}</div>
      </article>
    `;
  }

  function renderGates(lesson, detail, route) {
    return `
      ${route.gateId ? renderGateDetail(lesson, detail, route.gateId) : '<div class="hint-card">选择一个 Gate，查看它的证据文件与当前状态。</div>'}
      <article class="card gate-panel">
        <div class="section-head"><div><p class="eyebrow">ALL GATES</p><h3>生产 Gate</h3></div><span>共 ${(detail.gates || []).length} 项</span></div>
        <div class="gate-list">${(detail.gates || []).map((gate) => gateLink(lesson, gate, false)).join('')}</div>
      </article>
    `;
  }

  function renderFiles(detail) {
    const groups = detail.file_groups || [];
    if (!groups.length) {
      return '<div class="empty-panel card"><h3>文件尚未登记</h3><p>完成来源审核并建立 authority manifest 后，这里会出现当前课次的文件和证据。</p></div>';
    }
    return groups.map((group) => `
      <article class="card file-group">
        <div class="section-head"><h3>${text(group.title)}</h3><span>${group.files.length} 项</span></div>
        <div class="file-list">
          ${group.files.map((file) => `<a class="file-link detailed" href="${linkFor(file.path)}"><span><strong>${text(file.label)}</strong><small>${text(file.path)}</small></span><span aria-hidden="true">↗</span></a>`).join('')}
        </div>
      </article>
    `).join('');
  }

  function renderQA(detail) {
    const manifest = detail.manifest;
    if (!manifest) {
      return '<div class="empty-panel card"><h3>QA 尚未开始</h3><p>当前课次还没有 authority manifest。先完成来源审核，后续 QA 信息会在单课工作区中逐步出现。</p></div>';
    }
    const qa = manifest.qa || {};
    const rehearsal = qa.rehearsal || {};
    const release = manifest.release || {};
    const production = Object.entries(data.production_gates || {});
    return `
      <section class="qa-grid">
        <article class="card qa-card"><span>当前 QA</span><strong>${text(qa.status)}</strong><small>完整性：${text(qa.integrity_status)}</small></article>
        <article class="card qa-card"><span>教师 rehearsal</span><strong>${text(rehearsal.status)}</strong><small>验证者：${text(rehearsal.verified_by)}</small></article>
        <article class="card qa-card"><span>音档播放</span><strong>${text(rehearsal.audio_playback_status)}</strong><small>共 ${text(manifest.source_package && manifest.source_package.file_count)} 项来源资料</small></article>
        <article class="card qa-card"><span>最新交付</span><strong>${text(release.delivery_status)}</strong><small>状态：${text(release.status)}</small></article>
      </section>
      <article class="card qa-panel">
        <div class="section-head"><div><p class="eyebrow">AUTOMATED CHECKS</p><h3>生产检查</h3></div><span>当前生成环境</span></div>
        <div class="check-list">
          ${production.map(([key, value]) => `<div class="check-row"><span>${text(key)}</span>${statusChip(value.status === 'ready' ? 'done' : 'review', value.status)}${value.blockers && value.blockers.length ? `<small>${text(value.blockers.join('；'))}</small>` : ''}</div>`).join('')}
        </div>
      </article>
      <article class="card qa-panel">
        <div class="section-head"><div><p class="eyebrow">REVIEW RECORD</p><h3>修正记录</h3></div><span>只显示已登记内容</span></div>
        <p class="empty">当前 authority manifest 没有开放的修正项目。已关闭的历史记录不再复制到课程总览；需要追踪的新项目应登记在当前 QA 证据中。</p>
      </article>
    `;
  }

  function renderLesson(route) {
    const lesson = lessonMap.get(route.lessonId);
    const detail = details[route.lessonId] || { gates: [], file_groups: [] };
    const locked = lesson.status === 'locked';
    const tabs = locked ? '' : `
      <nav class="tabs" aria-label="单课工作区">
        ${tabLink(lesson, 'overview', '概览', route.tab === 'overview')}
        ${tabLink(lesson, 'gates', '生产 Gate', route.tab === 'gates')}
        ${tabLink(lesson, 'files', '文件', route.tab === 'files')}
        ${tabLink(lesson, 'qa', 'QA／修正', route.tab === 'qa')}
      </nav>
    `;
    let content = '';
    if (locked) {
      content = `
        <article class="locked-panel card">
          <div class="lock-icon" aria-hidden="true">×</div>
          <p class="eyebrow">LESSON LOCKED</p>
          <h3>第 ${text(lesson.number)} 课尚未解锁</h3>
          <p>${text(lesson.unlock_reason)}</p>
          <a class="button secondary" href="#course">返回课程总览</a>
        </article>
      `;
    } else if (route.tab === 'gates') {
      content = renderGates(lesson, detail, route);
    } else if (route.tab === 'files') {
      content = renderFiles(detail);
    } else if (route.tab === 'qa') {
      content = renderQA(detail);
    } else {
      content = renderOverview(lesson, detail);
    }

    app.innerHTML = `
      <div class="back-link"><a href="#course">← 返回课程总览</a></div>
      <section class="lesson-hero card">
        <div>
          <p class="eyebrow">LESSON WORKSPACE · ${String(lesson.number).padStart(2, '0')}</p>
          <h2>第 ${text(lesson.number)} 课 · ${text(lesson.title)}</h2>
          <p class="muted">${text(lesson.next_action)}</p>
        </div>
        <div class="lesson-hero-status">${statusChip(lesson.status, lesson.status_label)}${progressBar(lesson.progress)}</div>
      </section>
      <section class="lesson-metrics" aria-label="单课摘要">
        <div class="metric card"><span>当前阶段</span><strong>${text(lesson.stage)}</strong><small>${text(lesson.progress.completed)} / ${text(lesson.progress.total)} gate</small></div>
        <div class="metric card"><span>教材练习</span><strong>${text(lesson.counts && lesson.counts.exercises)}</strong><small>来源已登记</small></div>
        <div class="metric card"><span>音档</span><strong>${text(lesson.counts && lesson.counts.audio)}</strong><small>来源索引</small></div>
        <div class="metric card"><span>权威文件</span><strong>${text(lesson.counts && lesson.counts.authority_files, '0')}</strong><small>${lesson.manifest_path ? '已登记 manifest' : '尚未建立'}</small></div>
      </section>
      ${tabs}
      <div class="lesson-content">${content}</div>
    `;
  }

  function render() {
    const route = parseRoute();
    if (route.view === 'lesson') {
      renderLesson(route);
    } else {
      renderCourse();
    }
    window.scrollTo(0, 0);
  }

  window.addEventListener('hashchange', render);
  render();
})();
