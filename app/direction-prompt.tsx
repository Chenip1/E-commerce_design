'use client';

import { useId, useRef, useState, type ReactNode } from 'react';
import { Check, Clipboard, Copy, FileText, Save, Sparkles, X } from 'lucide-react';
import { creativeDirectionMode, type Project } from '../lib/workshop';
import { maxCreativePromptLength, maxStyleTitleLength, templatePrompt } from '../lib/style-templates';

export function DirectionPromptCard({ name, prompt, onUse, children }: {
  name: string; prompt: string; onUse: () => void; children: ReactNode;
}) {
  const panelId = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [copyStatus, setCopyStatus] = useState('');
  const show = hovered || pinned;

  function close(restoreFocus = false) {
    setPinned(false);
    setHovered(false);
    setCopyStatus('');
    if (restoreFocus) trigger.current?.focus();
  }

  async function copy() {
    setPinned(true);
    try {
      await navigator.clipboard.writeText(prompt);
      setCopyStatus('已复制');
    } catch {
      setCopyStatus('复制失败，请选中提示词手动复制。');
    }
  }

  return <div className="direction-prompt-card"
    onMouseLeave={()=>{setHovered(false);if(!pinned)setCopyStatus('');}}
    onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget))close();}}
    onKeyDown={e=>{if(e.key==='Escape'&&show){e.preventDefault();e.stopPropagation();close(true);}}}>
    <div className="direction-choice">{children}</div>
    <button type="button" className="direction-prompt-trigger" ref={trigger}
      aria-label={name+'的模板提示词'} aria-expanded={show} aria-controls={panelId}
      onMouseEnter={()=>setHovered(true)} onClick={()=>pinned?close():setPinned(true)}><FileText size={15}/> 提示词</button>
    {show&&<section id={panelId} className="direction-prompt-popover" aria-label={name+'的模板提示词'}>
      <div className="direction-prompt-heading"><strong>{name} · 模板提示词</strong>
        <button type="button" className="icon-btn" aria-label="关闭提示词预览" onClick={()=>close(true)}><X size={16}/></button>
      </div>
      <div className="direction-prompt-text" tabIndex={0}>{prompt}</div>
      <div className="direction-prompt-actions">
        <button type="button" className="secondary" onClick={copy}>{copyStatus==='已复制'?<Check size={15}/>:<Copy size={15}/>} 复制提示词</button>
        <button type="button" className="primary" onClick={()=>{close();onUse();}}><Clipboard size={15}/> 填入自定义</button>
      </div>
      {copyStatus&&<small role="status">{copyStatus}</small>}
    </section>}
  </div>;
}

const placeholder = '建议写清以下信息\n1. 商品名称与核心卖点\n2. 适用人群与使用场景\n3. 期望风格、配色、光线和构图\n4. 必须保留的元素或需要避开的内容';
export { maxCreativePromptLength };

export function CustomDirectionPrompt({ project, value, onChange, onApply, inputRef, canWrite, onSettings, onSave, onTemplates, onChooseTemplate }: {
  project: Project; value: string; onChange: (value: string) => void; onApply: () => void; inputRef: React.Ref<HTMLTextAreaElement>;
  canWrite: boolean; onSettings: () => void; onSave: (id:string,title:string,prompt:string) => Promise<void>; onTemplates:()=>void; onChooseTemplate:()=>void;
}) {
  const id = useId();
  const [title,setTitle]=useState('');
  const [saveId,setSaveId]=useState('');
  const [busy,setBusy]=useState<'write'|'save'|null>(null);
  const [feedback,setFeedback]=useState('');
  const [suggestion,setSuggestion]=useState('');
  const applied=project.directionMode==='custom'&&value.trim()===project.creativePrompt;
  async function write(){
    if(!canWrite){onSettings();return;}
    if(busy)return;
    setBusy('write');setFeedback('');setSuggestion('');
    try{
      const response=await fetch('/api/workshop/prompt-writing',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
        product:project.product.name,sellingPoints:project.product.description,audience:project.product.audience,
        direction:creativeDirectionMode(project)==='template'?templatePrompt(project,project.direction):undefined,draft:value,
      })});
      const data=await response.json() as {prompt?:string;error?:string};
      if(!response.ok||!data.prompt)throw new Error(data.error||'AI 帮写失败，请重试。');
      setSuggestion(data.prompt);setFeedback('AI 草稿已生成，可预览后填入。');
    }catch(error){setFeedback(error instanceof Error?error.message:'AI 帮写失败，请重试。');}
    finally{setBusy(null);}
  }
  return <section className="custom-direction-prompt">
    <div className="custom-prompt-heading">
      <div><span className="eyebrow">CUSTOM BRIEF</span><label htmlFor={id}>自定义创作风格</label></div>
      <div className="creative-actions">
        <button type="button" className="secondary" disabled={!!busy} onClick={()=>void write()}><Sparkles size={15}/>{busy==='write'?'正在帮写…':'AI 帮写'}</button>
        <button type="button" className="secondary" disabled={!value.trim()||!!busy} onClick={()=>{setSaveId(crypto.randomUUID());setTitle('');setFeedback('');}}><Save size={15}/> 存为模板</button>
        <button type="button" className="secondary" aria-haspopup="dialog" disabled={!!busy} onClick={onChooseTemplate}><FileText size={15}/> 选择模板</button>
      </div>
    </div>
    <p id={id+'-help'}>从零开始、套用模板，或将商品信息和草稿发送给 OpenAI 生成建议。</p>
    <textarea id={id} ref={inputRef} aria-describedby={id+'-help '+id+'-status'} rows={6}
      placeholder={placeholder} maxLength={maxCreativePromptLength} value={value} aria-label="自定义创作提示词"
      onChange={e=>onChange(e.target.value)}/>
    <div className="custom-prompt-heading">
      <small id={id+'-status'} aria-live="polite">{value.length} / {maxCreativePromptLength} · {applied?'自定义提示词已应用。':'点击应用后，自定义提示词将用于 AI 场景背景生成。'}</small>
      <button type="button" className="primary" disabled={!value.trim()||applied||!!busy} onClick={onApply}><Check size={15}/> {applied?'已应用':'应用'}</button>
    </div>
    {suggestion&&<div className="creative-result">
      <strong>AI 帮写草稿</strong><pre>{suggestion}</pre>
      <button type="button" className="primary" onClick={()=>{onChange(suggestion);setSuggestion('');setFeedback('已填入自定义创作风格，可继续修改。');inputRef&&typeof inputRef==='object'&&inputRef.current?.focus();}}>填入提示词</button>
      <button type="button" className="text-button" onClick={()=>{setSuggestion('');setFeedback('');}}>放弃草稿</button>
    </div>}
    {saveId&&<form className="creative-result" onSubmit={async e=>{
      e.preventDefault();if(busy||!title.trim()||!value.trim())return;
      setBusy('save');setFeedback('');
      try{await onSave(saveId,title.trim(),value.trim());setSaveId('');setFeedback('已保存到技能中心的「创作风格模板」。');}
      catch(error){setFeedback(error instanceof Error?error.message:'模板保存失败，请重试。');}
      finally{setBusy(null);}
    }}>
      <label>模板名称<input value={title} maxLength={maxStyleTitleLength} onChange={e=>setTitle(e.target.value)} placeholder="例如：自然窗光 · 清爽日常" required/></label>
      <button className="primary" disabled={!!busy||!title.trim()||!value.trim()}>{busy==='save'?'正在保存…':'保存模板'}</button>
      <button type="button" className="text-button" disabled={!!busy} onClick={()=>setSaveId('')}>取消</button>
    </form>}
    {feedback&&<p role="status">{feedback}</p>}
    <button type="button" className="text-button" onClick={onTemplates}>查看创作风格模板 <Copy size={14}/></button>
  </section>;
}
