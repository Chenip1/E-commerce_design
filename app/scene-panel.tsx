'use client';

import { useRef, useState } from 'react';
import { Copy, Sparkles } from 'lucide-react';
import { imageModels, type ImageModel } from '../lib/image-models';
import { scenePrompt, sceneSkillId } from '../lib/scene-skill';
import type { Project } from '../lib/workshop';

export function ScenePanel({ project, index, enabled, model, onModelChange, onSettings, onApply, onRestore }: {
  project: Project; index: number; enabled: boolean; model: ImageModel;
  onModelChange: (model: ImageModel) => void; onSettings: () => void; onApply: (url: string) => void; onRestore: () => void;
}) {
  const prompt = scenePrompt(project, index);
  const pending = useRef(false);
  const selected = imageModels.find(item => item.id === model)!;
  const canGenerate = enabled && selected.available;
  const [working, setWorking] = useState(false);
  const [result, setResult] = useState<{url:string;prompt:string}>();
  const [message, setMessage] = useState('');

  async function generate() {
    if (!canGenerate || pending.current) return;
    pending.current = true;
    setWorking(true);
    setMessage('');
    try {
      const response = await fetch(`/api/workshop/skills/${sceneSkillId}`, {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({model, prompt, tall: index % 2 === 1}),
      });
      const data = await response.json() as {url?:string;error?:string};
      if (!response.ok || !data.url) throw new Error(data.error || '生成未完成，请重试。');
      setResult({url:data.url,prompt});
      setMessage('背景已生成。查看预览后可应用到当前画布。');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '生成未完成，请重试。');
    } finally {
      pending.current = false;
      setWorking(false);
    }
  }

  return <section className="scene-controls">
    <h3>AI 场景背景</h3>
    <p>「生活场景图」读取当前画布、模板风格和自定义提示词，生成一张独立背景。可用透明底商品素材获得更自然的合成效果。</p>
    <details><summary>查看执行提示词</summary><pre>{prompt}</pre>
      <button className="secondary full" onClick={async()=>{
        try{await navigator.clipboard.writeText(prompt);setMessage('已复制执行提示词。');}
        catch{setMessage('请选中文字手动复制。');}
      }}><Copy size={14}/> 复制执行提示词</button>
    </details>
    <div className="scene-model-controls">
      <label>生图模型
        <select value={model} disabled={working} onChange={e=>onModelChange(e.target.value as ImageModel)}>
          {imageModels.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
      </label>
      <button className="primary" disabled={!canGenerate||working} onClick={generate}><Sparkles size={15}/> {working?'正在生成…':'生成 1 张'}</button>
    </div>
    {selected.available
      ? enabled ? <p>仅将执行提示词发送至 OpenAI，每次生成一张。</p>
        : <button className="text-button scene-settings-link" onClick={onSettings}>前往设置配置 API</button>
      : <p>{selected.label} 已预留选型入口，暂未接入生成服务。</p>}
    {result&&<div className="scene-result">
      <img src={result.url} alt="GPT 生成的场景背景候选"/><p>GPT 生成 · 背景候选</p>
      {result.prompt!==prompt&&<p>这张候选使用生成时的提示词。</p>}
      <button className="secondary full" onClick={()=>{onApply(result.url);setResult(undefined);setMessage('已应用到当前画布。');}}>应用到当前画布</button>
    </div>}
    {project.designs[index].sceneBackground&&<button className="secondary full" onClick={onRestore}>还原模板背景</button>}
    {message&&<p role="status">{message}</p>}
  </section>;
}
