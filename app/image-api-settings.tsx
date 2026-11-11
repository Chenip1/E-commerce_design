'use client';

import { useState, type FormEvent } from 'react';
import { KeyRound } from 'lucide-react';
import type { ImageApiStatus } from '../lib/image-models';

export function ImageApiSettings({ status, onChange }: {
  status: ImageApiStatus;
  onChange: (status: ImageApiStatus) => void;
}) {
  const [key, setKey] = useState('');
  const [working, setWorking] = useState(false);
  const [feedback, setFeedback] = useState('');

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await update(false);
  }

  async function update(remove: boolean) {
    if (working) return;
    setWorking(true);
    setFeedback('');
    try {
      const response = await fetch('/api/workshop/image-api', {
        method: remove ? 'DELETE' : 'POST',
        headers: {'Content-Type':'application/json'},
        body: remove ? undefined : JSON.stringify({apiKey:key.trim()}),
      });
      const data = await response.json() as ImageApiStatus & {error?:string};
      if (!response.ok) throw new Error(data.error || 'API 配置操作未完成。');
      setKey('');
      onChange(data);
      setFeedback(remove?'已移除个人密钥。':'密钥已加密保存，模型权限将在首次生成时验证。');
    } catch (error) {
      setFeedback(error instanceof Error?error.message:'API 配置操作未完成。');
    } finally {
      setWorking(false);
    }
  }

  return <form className="image-api-settings" onSubmit={save}>
    <h3><KeyRound size={17}/> 生图 API</h3>
    <p>{status.personalKey?'当前浏览器已保存个人密钥。':status.workspaceKey?'正在使用工作坊配置的密钥。':'GPT 生图需要 OpenAI API Key。'}</p>
    <label htmlFor="workshop-api-key">OpenAI API Key</label>
    <input id="workshop-api-key" type="password" autoComplete="off" spellCheck={false}
      placeholder={status.personalKey?'输入新密钥以替换':'sk-…'} value={key} maxLength={512}
      disabled={!status.canSave||working} onChange={e=>setKey(e.target.value)}/>
    <p>个人密钥加密保存在当前浏览器，有效期 30 天。GPT 请求发往 OpenAI。</p>
    {!status.canSave&&<p>当前无法保存密钥，请在已登录的工作坊中配置。</p>}
    <div className="image-api-actions">
      <button className="primary" type="submit" disabled={!status.canSave||working||!key.trim()}>保存 API 密钥</button>
      {status.personalKey&&<button className="secondary" type="button" disabled={working} onClick={()=>void update(true)}>移除个人密钥</button>}
    </div>
    {feedback&&<p role="status">{feedback}</p>}
  </form>;
}
