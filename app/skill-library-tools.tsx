'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { categories, categoryIds, type CategoryId } from '../lib/categories';
import { findGitHubSkills, readGitHubSkill, type ImportedSkill } from '../lib/github-skills';
import { maxCreativePromptLength, maxStyleTitleLength } from '../lib/style-templates';

export type SaveStyleTemplate = (id: string, title: string, prompt: string, category?: CategoryId) => Promise<void>;

export function StyleTemplateTools({ onSave }: { onSave: SaveStyleTemplate }) {
  const [mode, setMode] = useState<'create' | 'import'>();
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [category, setCategory] = useState<CategoryId | ''>('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  function open(next: typeof mode) {
    setMode(next);
    setTitle('');
    setPrompt('');
    setCategory('');
    setMessage('');
  }

  async function readFile(file: File) {
    setMessage('');
    setBusy(true);
    try {
      if (file.size > 64_000) throw new Error('请选择 64 KB 以内的模板文件。');
      const contents = (await file.text()).trim();
      let name = file.name.replace(/\.[^.]+$/, '');
      let text = contents;
      let importedCategory: CategoryId | '' = '';
      if (/\.json$/i.test(file.name)) {
        const data = JSON.parse(contents) as { title?: unknown; prompt?: unknown; category?: unknown } | null;
        if (typeof data?.title !== 'string' || typeof data?.prompt !== 'string') {
          throw new Error('JSON 文件需要包含 title 和 prompt 两个文本字段。');
        }
        name = data.title;
        text = data.prompt;
        importedCategory = categoryIds.find(id => id === data.category || categories[id].name === data.category) ?? '';
      }
      setTitle(name.trim());
      setPrompt(text.trim());
      setCategory(importedCategory);
      setMessage('已读取文件，核对内容后保存。');
    } catch (error) {
      setMessage(error instanceof SyntaxError ? 'JSON 格式有误，请检查模板文件。' : (error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy || !title.trim() || !prompt.trim()) return;
    setBusy(true);
    try {
      await onSave(crypto.randomUUID(), title.trim(), prompt.trim(), category || undefined);
      open(undefined);
      setMessage(mode === 'import' ? '模板已导入。' : '模板已创建。');
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const overLimit = title.trim().length > maxStyleTitleLength || prompt.trim().length > maxCreativePromptLength;
  return <>
    <div className="scene-detail-actions">
      <button type="button" className="primary" disabled={busy} onClick={() => open('create')}>创建</button>
      <button type="button" className="secondary" disabled={busy} onClick={() => open('import')}>导入</button>
    </div>
    {mode && <form className="library-form panel" onSubmit={submit}>
      <h3>{mode === 'create' ? '创建风格模板' : '导入风格模板'}</h3>
      {mode === 'import' && <label>上传模板文件（TXT、Markdown、JSON）
        <input type="file" accept=".txt,.md,.markdown,.json" disabled={busy} onChange={event => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = '';
          if (file) void readFile(file);
        }}/>
        <small>也可直接粘贴提示词。JSON 支持 title、prompt 和可选的 category。</small>
      </label>}
      <label>模板名称<input required value={title} onChange={event => setTitle(event.target.value)} disabled={busy}/></label>
      <label>适用品类<select value={category} disabled={busy} onChange={event => setCategory(event.target.value as CategoryId | '')}>
        <option value="">通用</option>
        {categoryIds.map(id => <option key={id} value={id}>{categories[id].name}</option>)}
      </select></label>
      <label>模板提示词<textarea required rows={6} value={prompt} disabled={busy} onChange={event => setPrompt(event.target.value)}/></label>
      {overLimit && <p role="alert">名称最多 {maxStyleTitleLength} 字，提示词最多 {maxCreativePromptLength} 字。请缩短后保存。</p>}
      <div className="scene-detail-actions">
        <button className="primary" disabled={busy || overLimit || !title.trim() || !prompt.trim()}>保存模板</button>
        <button type="button" className="secondary" disabled={busy} onClick={() => open(undefined)}>取消</button>
      </div>
    </form>}
    {message && <p role="status">{message}</p>}
  </>;
}

const storageKey = 'sx-imported-skills';
const endpoint = '/api/workshop/imported-skills';

export function GitHubSkillLibrary({ cloud, query }: { cloud: boolean; query: string }) {
  const [skills, setSkills] = useState<ImportedSkill[]>([]);
  const [loadedScope, setLoadedScope] = useState<boolean>();
  const [show, setShow] = useState(false);
  const [url, setUrl] = useState('');
  const [candidates, setCandidates] = useState<Awaited<ReturnType<typeof findGitHubSkills>>>([]);
  const [selected, setSelected] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        if (!cloud) {
          setSkills(JSON.parse(localStorage.getItem(storageKey) ?? '[]'));
          return;
        }
        const response = await fetch(endpoint, { cache: 'no-store' });
        if (!response.ok) throw new Error();
        const data = await response.json() as { skills: ImportedSkill[] };
        if (active) setSkills(data.skills);
      } catch {
        if (active) setMessage('已导入的 Skill 读取失败，请刷新后重试。');
      } finally {
        if (active) setLoadedScope(cloud);
      }
    }
    void load();
    return () => { active = false; };
  }, [cloud]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy || loadedScope !== cloud) return;
    setBusy(true);
    setMessage('');
    try {
      let source = selected;
      if (!source) {
        const files = await findGitHubSkills(url);
        if (files.length > 1) {
          setCandidates(files);
          setSelected(files[0].source);
          return;
        }
        source = files[0].source;
      }
      const skill = await readGitHubSkill(source);
      if (cloud) {
        const response = await fetch(endpoint, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(skill),
        });
        const data = await response.json() as { error?: string };
        if (!response.ok) throw new Error(data.error ?? 'Skill 保存失败。');
      } else {
        const local = JSON.parse(localStorage.getItem(storageKey) ?? '[]') as ImportedSkill[];
        localStorage.setItem(storageKey, JSON.stringify([skill, ...local.filter(item => item.source !== skill.source)]));
      }
      setSkills(current => [skill, ...current.filter(item => item.source !== skill.source)]);
      setShow(false);
      setUrl('');
      setCandidates([]);
      setSelected('');
      setMessage(`已导入「${skill.title}」。`);
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const term = query.trim().toLowerCase();
  const results = loadedScope === cloud ? skills.filter(skill => [skill.title, skill.source].some(value => value.toLowerCase().includes(term))) : [];
  return <section aria-label="GitHub Skill">
    <div className="scene-detail-actions">
      <button type="button" className="primary" onClick={() => setShow(true)}>从 GitHub 导入</button>
    </div>
    {show && <form className="library-form panel" onSubmit={submit}>
      <label>公开 GitHub 链接<input type="url" required value={url} placeholder="https://github.com/所有者/仓库" disabled={busy}
        onChange={event => { setUrl(event.target.value); setCandidates([]); setSelected(''); }}/></label>
      <p>支持仓库首页、含 SKILL.md 的目录和 SKILL.md 文件链接。导入后可阅读说明并打开原始来源。</p>
      {candidates.length > 0 && <label>选择要导入的 Skill<select value={selected} disabled={busy} onChange={event => setSelected(event.target.value)}>
        {candidates.map(file => <option key={file.source} value={file.source}>{file.path}</option>)}
      </select></label>}
      <div className="scene-detail-actions">
        <button className="primary" disabled={busy || loadedScope !== cloud || !url.trim()}>{busy ? '正在读取 GitHub…' : '导入 Skill'}</button>
        <button type="button" className="secondary" disabled={busy} onClick={() => setShow(false)}>取消</button>
      </div>
    </form>}
    {message && <p role="status">{message}</p>}
    {results.length > 0 && <div className="skill-grid">
      {results.map(skill => <details className="style-template-card imported-skill" key={skill.source}>
        <summary><strong>{skill.title}</strong> <span className="skill-id">GitHub 导入</span></summary>
        <pre>{skill.content}</pre>
        <a className="secondary" href={skill.source} target="_blank" rel="noreferrer">在 GitHub 查看原始说明</a>
      </details>)}
    </div>}
  </section>;
}
