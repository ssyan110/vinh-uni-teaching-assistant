'use strict';
(() => {
  const dialog=document.createElement('dialog');dialog.id='feedback-dialog';document.body.append(dialog);
  let feedbackRows=[],feedbackRevision,feedbackClass,feedbackAssessment,feedbackDirty=false;
  function close(){if(feedbackDirty&&!confirm('反馈修改尚未保存。确定放弃修改吗？'))return;dialog.close();}
  async function reload(){
    const result=await api('/api/feedback?class='+encodeURIComponent(feedbackClass)+'&assessment='+encodeURIComponent(feedbackAssessment));
    feedbackRows=result.rows;feedbackRevision=result.revision;feedbackDirty=false;paint();
  }
  function paint(){
    dialog.innerHTML=`<h2>个人反馈 · ${escape(assessment()?.title||'')}</h2><p>根据已保存分项、评分标准和教师备注整理草稿。请逐人核对实际表现，再写一个具体的下次练习并确认。成绩或备注变化后，旧反馈须重新生成和审阅。</p><div id="feedback-message" role="status"></div><div class="actions"><button id="feedback-generate">为当前名单生成草稿</button><a class="button" href="/api/feedback-export?class=${encodeURIComponent(feedbackClass)}&assessment=${encodeURIComponent(feedbackAssessment)}">导出已确认反馈（可打印 HTML）</a><button id="feedback-reload">重新载入</button><button id="feedback-close">关闭</button></div><label>学生<select id="feedback-student">${feedbackRows.map(x=>`<option value="${escape(x.student.code)}">${escape(x.student.name)} · ${escape(x.record_status)}${!x.student.active?' · 历史名单':''} · ${!x.feedback?'未生成':!x.current?'已失效':x.feedback.reviewed?'已确认':'待审阅'}</option>`).join('')}</select></label><div id="feedback-editor"></div>`;
    dialog.querySelector('#feedback-close').onclick=close;
    dialog.querySelector('#feedback-reload').onclick=async()=>{if(feedbackDirty&&!confirm('放弃未保存的反馈并重新载入？'))return;try{await reload();}catch(e){status(e.message);}};
    dialog.querySelector('#feedback-generate').onclick=async()=>{
      if(feedbackDirty&&!confirm('放弃未保存的反馈并生成草稿？'))return;
      try{const result=await api('/api/feedback',{action:'generate',class_id:feedbackClass,assessment_id:feedbackAssessment,revision:feedbackRevision});await reload();status(result.warning||'已生成草稿。已有有效反馈保留，请逐人审阅。');await refresh();}catch(e){status(e.message);}
    };
    dialog.querySelector('#feedback-student').onchange=e=>{if(feedbackDirty&&!confirm('放弃当前未保存反馈并切换学生？')){e.target.value=dialog.querySelector('#feedback-editor').dataset.student;return;}feedbackDirty=false;editor();};editor();
  }
  function status(message){dialog.querySelector('#feedback-message').textContent=message;}
  function editor(){
    const sid=dialog.querySelector('#feedback-student').value,x=feedbackRows.find(r=>r.student.code===sid),host=dialog.querySelector('#feedback-editor');host.dataset.student=sid;
    if(!x)return;const f=x.feedback;
    host.innerHTML=`<p>${escape(x.record_status)}${!x.complete?'：资料未完整确认，不能确认或导出反馈。':''}${f&&!x.current?'；评分依据已变化，请重新生成。':''}</p>${f?`<label>实际表现<textarea id="feedback-performance" rows="6" maxlength="10000">${escape(f.performance)}</textarea></label><label>下次练习<textarea id="feedback-practice" rows="4" maxlength="10000">${escape(f.practice)}</textarea></label><label class="inline-check"><input type="checkbox" id="feedback-confirm" ${x.complete&&x.current?'':'disabled'}>我已逐项核对上述反馈，确认可交给这位学生</label><div class="actions"><button id="feedback-save" ${x.current?'':'disabled'}>保存草稿</button><button id="feedback-review" ${x.complete&&x.current?'':'disabled'}>保存并确认反馈</button></div>`:'<p>先点击“为当前名单生成草稿”。历史学生的反馈可单独生成。</p>'}<button id="feedback-one">为这位学生生成／更新草稿</button>`;
    host.querySelectorAll('textarea,input').forEach(e=>e.addEventListener('input',()=>{feedbackDirty=true;}));
    async function save(reviewed){try{if(reviewed&&!host.querySelector('#feedback-confirm').checked)throw new Error('请先勾选逐项核对确认');const result=await api('/api/feedback',{action:'save',class_id:feedbackClass,assessment_id:feedbackAssessment,student_code:sid,revision:feedbackRevision,fingerprint:x.fingerprint,performance:host.querySelector('#feedback-performance').value,practice:host.querySelector('#feedback-practice').value,reviewed,review_confirmed:reviewed});await reload();dialog.querySelector('#feedback-student').value=sid;editor();status(result.warning||(reviewed?'反馈已确认。':'草稿已保存；修改后的内容须重新确认。'));await refresh();}catch(e){status(e.message);}}
    host.querySelector('#feedback-save')?.addEventListener('click',()=>save(false));host.querySelector('#feedback-review')?.addEventListener('click',()=>save(true));
    host.querySelector('#feedback-one').onclick=async()=>{if(feedbackDirty&&!confirm('放弃当前未保存的反馈并重新生成？'))return;try{await api('/api/feedback',{action:'generate',class_id:feedbackClass,assessment_id:feedbackAssessment,student_codes:[sid],revision:feedbackRevision});await reload();dialog.querySelector('#feedback-student').value=sid;editor();await refresh();}catch(e){status(e.message);}};
  }
  dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
  window.addEventListener('beforeunload',e=>{if(feedbackDirty&&dialog.open){e.preventDefault();e.returnValue='';}});
  document.getElementById('individual-feedback').onclick=async()=>{if(!assessment()){message('请先新增或选择考试。',true);return;}if(!mayLeave())return;feedbackClass=classId;feedbackAssessment=assessmentId;try{await reload();dialog.showModal();}catch(e){message(e.message,true);}};
})();
