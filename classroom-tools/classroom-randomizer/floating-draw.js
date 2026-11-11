async function openFloatingDraw() {
  const byId = id => document.getElementById(id);
  const visible = el => !!el && el.checkVisibility();
  if (!visible(byId('appView')) || !byId('drawButton') || !byId('pendingCard')) {
    alert('请先开始本堂课，再打开悬浮抽问。');
    return;
  }
  const pip = window.documentPictureInPicture;
  if (!pip) {
    alert('请用桌面版 Chrome 打开 HTTPS 或 localhost 上的随机抽问页面。');
    return;
  }
  if (pip.window) { pip.window.focus(); return; }
  let panel;
  try { panel = await pip.requestWindow({ width: 340, height: 206 }); }
  catch { alert('无法打开悬浮窗，请再点一次“悬浮抽问”。'); return; }
  const doc = panel.document;
  doc.documentElement.lang = 'zh-CN';
  doc.title = '悬浮抽问';
  doc.body.innerHTML = '<main><small></small><h1 aria-live="polite"></h1><section></section></main>';
  const style = doc.createElement('style');
  style.textContent = '*{box-sizing:border-box}body{margin:0;background:#f6faf9;color:#17324d;font:16px system-ui}main{padding:12px}small{color:#425e63}h1{font-size:clamp(23px,8vw,34px);line-height:1.2;margin:8px 0 12px;overflow-wrap:anywhere}section{display:flex;flex-wrap:wrap;gap:6px}button{font:inherit;padding:7px 10px;border:1px solid #789399;border-radius:7px;background:white;color:#17324d;cursor:pointer}button:first-of-type{background:#006b66;color:white}button:disabled{opacity:.55}';
  doc.head.append(style);
  const actions = ['drawButton','recordNextButton','recordCompleteButton','nextRoundButton'];
  const available = el => visible(byId('appView')) && !document.querySelector('dialog[open]') && visible(el) && !el.disabled;
  const buttons = actions.map(id => {
    const button = doc.createElement('button');
    doc.querySelector('section').append(button);
    button.onclick = () => {
      const original = byId(id);
      if (available(original)) original.click();
      render();
    };
    return button;
  });
  function render() {
    const active = visible(byId('appView'));
    const modal = document.querySelector('dialog[open]');
    const pending = visible(byId('pendingCard'));
    doc.querySelector('small').textContent = active ? byId('progressLabel')?.textContent : '';
    doc.querySelector('h1').textContent = !active ? '本堂课未开启' : modal ? '请在抽问主页完成当前操作' : pending ? byId('studentName')?.textContent : byId('drawTitle')?.textContent;
    actions.forEach((id,i) => {
      const original = byId(id);
      const button = buttons[i];
      button.hidden = !active || !!modal || !visible(original) || (id === 'drawButton' && original.disabled);
      button.disabled = !available(original);
      button.textContent = id === 'drawButton' ? '抽一位' : original?.textContent.trim();
    });
  }
  render();
  const observer = new MutationObserver(render);
  observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['hidden','disabled','class','open','style']});
  panel.addEventListener('pagehide',() => observer.disconnect(),{once:true});
}
