'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, Check, Cookie, Headphones, Shirt, Sparkles, X } from 'lucide-react';
import { categories, categoryIds, categoryProductImage, type CategoryId } from '../lib/categories';
import { ecommerceSkills, skillRepository } from '../lib/ecommerce-skills';
import { sceneSkillId } from '../lib/scene-skill';
import { SkillExportPanel } from './skill-export-panel';
import { isExportSkill } from '../lib/skill-exports';
import { presetStyleTemplates, promptForStyleTemplate, type StyleTemplate } from '../lib/style-templates';
import type { Project } from '../lib/workshop';
import { GitHubSkillLibrary, StyleTemplateTools, type SaveStyleTemplate } from './skill-library-tools';
import { DirectionPromptCard } from './direction-prompt';

const icons = { snack: Cookie, tech: Headphones, beauty: Sparkles, fashion: Shirt };

const heroOutputs = [
  { image: 'visual', headline: '沉浸式自适应降噪' },
  { image: 'structure', headline: '看见材质与做工' },
  { image: 'specs', headline: '关键参数' },
];

export function CategoryHero({ onExample }: { onExample: () => void }) {
  return <section className="category-hero" aria-labelledby="category-hero-title">
    <div className="category-hero-intro">
      <div>
        <p className="category-hero-kicker"><Sparkles size={15}/> 图匠室 · 电商商品制图</p>
        <h1 id="category-hero-title">一张商品图，<span>做成三张品类套图</span></h1>
        <p>上传商品图，填写名称和卖点。图匠室按商品品类排出三张图，可继续编辑并导出。</p>
      </div>
      <div className="category-hero-actions">
        <button type="button" onClick={onExample}>体验耳机示例 <ArrowUpRight size={16}/></button>
        <a href="#category-studio">选择商品品类 <ArrowRight size={15}/></a>
      </div>
    </div>
    <div className="category-hero-flow">
      <div className="category-hero-input">
        <p className="category-hero-label">上传素材</p>
        <figure>
          <div className="category-hero-original"><img src={categoryProductImage('tech')} alt="NovaSound NS-900 Pro 耳机原商品图" width={640} height={640}/></div>
          <figcaption>原商品图</figcaption>
        </figure>
      </div>
      <div className="category-hero-arrow" aria-hidden="true"><ArrowRight size={22}/></div>
      <div>
        <p className="category-hero-label">按品类生成 <span>NovaSound NS-900 Pro</span></p>
        <div className="category-hero-outputs">
          {heroOutputs.map(({ image, headline }, index) => <figure key={image}>
            <div className="category-hero-art">
              <img src={`./home-hero/${image}.webp`} alt={`NovaSound NS-900 Pro ${categories.tech.slots[index]}`} width={640} height={640}/>
              <strong>{headline}</strong>
              {index === 0 && <small>首发价 ¥1,299.00</small>}
              {index === 1 && <small>编织头带 · 金属转轴 · 柔软耳罩</small>}
              {index === 2 && <dl>
                <div><dt>动圈单元</dt><dd>40 mm</dd></div>
                <div><dt>最高降噪</dt><dd>−48 dB</dd></div>
                <div><dt>降噪关闭续航</dt><dd>约 50 h</dd></div>
              </dl>}
            </div>
            <figcaption>{categories.tech.slots[index]}</figcaption>
          </figure>)}
        </div>
      </div>
    </div>
    <p className="category-hero-note">虚拟商品示例。续航为实验室 50% 音量下测得，实际因使用环境而异。商品参数与兼容性以实物和说明书为准。</p>
  </section>;
}

export function CategoryCatalog({ selected, onSelect, onStart, onExample }: {
  selected: CategoryId; onSelect: (id: CategoryId) => void; onStart: () => void; onExample: () => void;
}) {
  const c = categories[selected];
  return <section className="category-catalog" aria-label="按品类制图">
    <div className="category-grid" aria-label="选择商品品类">
      {categoryIds.map(id => {
        const item = categories[id], Icon = icons[id];
        const [base, shade, accent] = item.directions[0].colors;
        return <button key={id} aria-pressed={selected === id} className="category-card" onClick={() => onSelect(id)}>
          <div className="category-art" style={{background:`linear-gradient(150deg,${base},${shade})`, color:item.directions[0].ink}}>
            <span><Icon size={16}/> {item.number} <i style={{background:accent}}/></span>
            <img src={categoryProductImage(id)} alt="" width={640} height={640} decoding="async"/>
            <small>{item.english}</small>
          </div>
          <div className="category-card-label"><div><strong>{item.name}</strong><small>{item.promise}</small></div>
            {selected === id ? <Check size={17}/> : <ArrowUpRight size={17}/>}
          </div>
        </button>;
      })}
    </div>
    <div className="category-brief" style={{borderLeftColor:c.directions[0].colors[2]}}>
      <div><span className="eyebrow">{c.english} / 制图方案</span><h2>{c.name} · {c.promise}</h2><p>{c.cue}</p>
        <div className="studio-tags">{c.slots.map(slot=><span key={slot}>{slot}</span>)}</div>
      </div>
      <div className="category-actions">
        <button className="secondary" onClick={onExample}>体验{c.name}示例</button>
        <button className="primary" onClick={onStart}>创建{c.name}项目 <ArrowRight size={16}/></button>
      </div>
    </div>
  </section>;
}

type TemplateCatalogProps = { templates: StyleTemplate[]; load: 'loading' | 'ready' | 'error' };

function TemplateCatalog({ templates, load, renderCard }: TemplateCatalogProps & {
  renderCard: (template: StyleTemplate) => ReactNode;
}) {
  const [filter, setFilter] = useState<CategoryId | 'general'>();
  const all = [...templates, ...presetStyleTemplates];
  const visible = filter ? all.filter(template => (template.category ?? 'general') === filter) : all;
  const tabs = [{ id: 'general' as const, name: '通用' }, ...categoryIds.map(id => ({ id, name: categories[id].name }))];
  return <>
    <nav className="template-filters" aria-label="按模板品类筛选">
      {tabs.map(({ id, name }) => <button key={id} type="button" className={filter === id ? 'primary' : 'secondary'}
        aria-pressed={filter === id} onClick={() => setFilter(filter === id ? undefined : id)}>{name}</button>)}
      {filter && <button type="button" className="text-button" onClick={() => setFilter(undefined)}>显示全部</button>}
    </nav>
    {load === 'loading' && <p role="status">正在加载已保存的模板…</p>}
    {load === 'error' && <p role="status">已保存的模板读取失败，请刷新后重试。</p>}
    {load === 'ready' && !visible.length && <p className="panel">这个品类下还没有模板。</p>}
    <div className="skill-grid">{visible.map(renderCard)}</div>
  </>;
}

function TemplateHeading({ template }: { template: StyleTemplate }) {
  return <>
    <div className="studio-tags">
      <span>{template.category ? categories[template.category]?.name ?? '通用' : '通用'}</span>
      {template.presetDirection !== undefined && <span>内置模板</span>}
    </div>
    <h3>{template.title}</h3>
  </>;
}

export function TemplatePicker({ templates, load, project, onChoose, onClose }: TemplateCatalogProps & {
  project: Project; onChoose: (prompt: string) => boolean; onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!dialog.current?.open) dialog.current?.showModal();
  }, []);

  return <dialog ref={dialog} className="modal template-picker" aria-labelledby="template-picker-title"
    onClose={onClose} onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
    <div className="template-picker-body">
      <button type="button" className="modal-close" aria-label="关闭选择模板" onClick={() => dialog.current?.close()}><X size={20}/></button>
      <h2 id="template-picker-title">选择模板</h2>
      <p>选择后会填入当前项目的自定义创作风格。悬停或点击「提示词」可预览全文。</p>
      <TemplateCatalog templates={templates} load={load} renderCard={template => {
        const prompt = promptForStyleTemplate(template, project);
        const choose = () => { if (onChoose(prompt)) dialog.current?.close(); };
        return <DirectionPromptCard key={template.id} name={template.title} prompt={prompt} onUse={choose}>
          <article className="style-template-card">
            <TemplateHeading template={template}/>
            <button type="button" className="primary" onClick={choose} aria-label={'选择 ' + template.title}>选择</button>
          </article>
        </DirectionPromptCard>;
      }}/>
    </div>
  </dialog>;
}

function StyleLibrary({ templates, load, projects, onApply, onSave }: TemplateCatalogProps & {
  projects:Project[];
  onApply:(template:StyleTemplate,project:Project)=>void; onSave:SaveStyleTemplate;
}) {
  const [selected,setSelected]=useState<{template:string;project:string}>();
  const [feedback,setFeedback]=useState('');
  const eligible=projects.filter(p=>p.stage>=1&&p.product.confirmed);
  return <section aria-label="创作风格模板">
    <h2>创作风格模板</h2>
    <p>在此创建或导入提示词，也可从项目保存。保存后的模板可复制或套用到其他项目。</p>
    <StyleTemplateTools onSave={onSave}/>
    <TemplateCatalog templates={templates} load={load} renderCard={template=><article className="style-template-card" key={template.id}>
      <TemplateHeading template={template}/><pre>{template.prompt}</pre>
      <div className="scene-detail-actions">
        <button className="secondary" onClick={async()=>{
          try{await navigator.clipboard.writeText(template.prompt);setFeedback('已复制「'+template.title+'」提示词。');}
          catch{setFeedback('复制失败，可手动选中文字复制。');}
        }}>复制提示词</button>
        <button className="primary" disabled={!eligible.length} onClick={()=>setSelected({template:template.id,project:''})}>套用到项目</button>
      </div>
      {selected?.template===template.id&&<div className="style-template-apply">
        <label>选择目标项目<select value={selected.project} onChange={e=>setSelected({...selected,project:e.target.value})}>
          <option value="">请选择</option>{eligible.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
        </select></label>
        <button className="secondary" disabled={!selected.project} onClick={()=>{
          const project=eligible.find(p=>p.id===selected.project);
          if(project)onApply(template,project);
        }}>填入创作方向</button>
      </div>}
    </article>}/>
    {!eligible.length&&<p>确认任一项目的商品资料后，即可套用模板。</p>}
    {feedback&&<p role="status">{feedback}</p>}
  </section>;
}

export function SkillCenter({ sceneEnabled, onOpenScene, section, onSectionChange, templates, templateLoad, projects, onApplyTemplate, onSaveTemplate, cloud }: {
  sceneEnabled:boolean; onOpenScene:()=>void; section:'templates'|'skills'; onSectionChange:(section:'templates'|'skills')=>void;
  templates:StyleTemplate[]; templateLoad:'loading'|'ready'|'error'; projects:Project[]; onApplyTemplate:(template:StyleTemplate,project:Project)=>void;
  onSaveTemplate:SaveStyleTemplate; cloud:boolean;
}) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState<string | null>(null);
  const skill = ecommerceSkills.find(item => item.id === active);
  const results = ecommerceSkills.filter(item => [item.id,item.title,item.scope,item.group].some(value=>value.toLowerCase().includes(query.trim().toLowerCase())));
  return <main className="home studio-page">
    <div className="page-heading"><div><div className="eyebrow">CREATIVE LIBRARY</div><h1>技能中心</h1><p>复用自己的创作风格，或为当前商品选择制图技能。</p></div></div>
    <nav className="skill-center-tabs" aria-label="技能中心板块">
      <button className={section==='templates'?'primary':'secondary'} aria-pressed={section==='templates'} onClick={()=>onSectionChange('templates')}>创作风格模板</button>
      <button className={section==='skills'?'primary':'secondary'} aria-pressed={section==='skills'} onClick={()=>onSectionChange('skills')}>Skill 大全</button>
    </nav>
    {section==='templates'?<StyleLibrary templates={templates} load={templateLoad} projects={projects} onApply={onApplyTemplate} onSave={onSaveTemplate}/>:skill?<>
      <button className="back-btn" onClick={()=>setActive(null)}><ArrowLeft size={16}/> 返回 Skill 大全</button>
      <section className="skill-detail">
        <span className="eyebrow">SKILL DETAILS / {skill.group}</span><h2>{skill.title}</h2><p className="skill-id">{skill.id}</p>
        <div className="studio-tags"><span>{skill.scope}</span><span>上游默认模型 · {skill.model}</span><span>{skill.id===sceneSkillId?(sceneEnabled?'背景模式可运行':'背景模式 · 服务待配置'):isExportSkill(skill.id)?'可运行 · 工作坊版式':'待接入运行'}</span></div>
        <dl><div><dt>需要准备</dt><dd>{skill.input}</dd></div><div><dt>交付结果</dt><dd>{skill.output}</dd></div>
          <div><dt>检查重点</dt><dd>{skill.check}</dd></div><div><dt>适用品类</dt><dd>{skill.categories.map(id=>categories[id].name).join('、')}</dd></div></dl>
        {skill.id===sceneSkillId&&<p>工作坊版先生成场景底图，商品主体和文案由编辑器合成。可在生成前查看实际执行提示词。</p>}
        {isExportSkill(skill.id)&&<SkillExportPanel key={skill.id} skill={skill.id} projects={projects}/>}
        <div className="scene-detail-actions">{skill.id===sceneSkillId&&<button className="primary" onClick={onOpenScene}>前往项目使用 <ArrowRight size={16}/></button>}
        <a className="secondary" href={`${skillRepository}/blob/main/skills/${skill.id}/SKILL.md`} target="_blank" rel="noreferrer">在 GitHub 查看原始说明 <ArrowUpRight size={16}/></a></div>
      </section>
    </>:<>
      <h2>Skill 大全</h2>
      <label className="skill-search">搜索技能<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="例如：尺码、Amazon 或场景" /></label>
      <GitHubSkillLibrary cloud={cloud} query={query}/>
      <div className="skill-grid">{results.map(item=><button className="skill-card" key={item.id} onClick={()=>setActive(item.id)}>
        <span className="skill-card-top"><BookOpen size={19}/><span>{item.group}</span></span>
        <strong>{item.title}</strong><span className="skill-id">{item.id}</span><span className="skill-summary">{item.output}</span>
        <span className="skill-card-bottom">{isExportSkill(item.id)?'可运行':item.id===sceneSkillId?'AI 背景工作流':item.scope}<ArrowRight size={16}/></span>
      </button>)}</div>
      {!results.length&&<p role="status">未找到匹配的内置技能。</p>}
    </>}
  </main>;
}
