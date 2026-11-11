'use client';
import {useEffect,useState,useRef} from 'react';
import { ImageApiSettings } from './image-api-settings';
import { imageModels, unavailableImageApi, type ImageApiStatus, type ImageModel } from '../lib/image-models';
import { ScenePanel } from './scene-panel';
import CampaignPanel from './campaign-panel';
import { CustomDirectionPrompt, DirectionPromptCard, maxCreativePromptLength } from './direction-prompt';
import { promptForStyleTemplate, templatePrompt, type StyleTemplate } from '../lib/style-templates';
import { CategoryCatalog, CategoryHero, SkillCenter, TemplatePicker } from './studio-catalog';
import { categories, type CategoryId } from '../lib/categories';
import {ArrowUpRight,ArrowRight,Plus,FolderOpen,Palette,Settings2,Sparkles,Upload,Image as ImageIcon,Check,ChevronDown,ChevronRight,ChevronLeft,Search,MoreHorizontal,Copy,Download,Undo2,Redo2,Type,MousePointer2,Layers,Move,RefreshCw,X,CheckCircle2,AlertCircle,Cloud,Clock3,LayoutGrid,BookOpen,SlidersHorizontal,Loader2,Save,FileImage,ExternalLink,Trash2} from 'lucide-react';
import {Project,Brand,Layout,Product,Campaign,imageDataUrl,makeProject,makeDesigns,mugSvg,dataSvg,designSvg,designTypes,projectPalettes,creativeDirectionMode,promotionBackground,artworkImage,sampleImage,renderPng,zipFiles,download,checkProject} from '../lib/workshop';
const api='/api/workshop';
const fmt=(s:string)=>new Date(s).toLocaleDateString('zh-CN',{month:'2-digit',day:'2-digit'});
export default function Workbench(){
 const promptInput=useRef<HTMLTextAreaElement>(null);
 const [templatePickerOpen,setTemplatePickerOpen]=useState(false);
 const [selectedCategory,setSelectedCategory]=useState<CategoryId>('snack');
 const [styleTemplates,setStyleTemplates]=useState<StyleTemplate[]>([]);
 const [templateLoad,setTemplateLoad]=useState<'loading'|'ready'|'error'>('loading');
 const [skillSection,setSkillSection]=useState<'templates'|'skills'>('templates');
 const [imageApi,setImageApi]=useState<ImageApiStatus>(unavailableImageApi);
 const [imageModel,setImageModel]=useState<ImageModel>('gpt');
 const sceneEnabled=imageApi.background;
 const [campaignOpen,setCampaignOpen]=useState(false);
 const [managing,setManaging]=useState(false);
 const [selectedIds,setSelectedIds]=useState<Set<string>>(new Set());
 const [deleteTargets,setDeleteTargets]=useState<Project[]>([]);
 const [deleteError,setDeleteError]=useState('');
 const deleteDialog=useRef<HTMLDialogElement>(null);
 const deleteBusy=useRef(false);
 const deletedIds=useRef(new Set<string>());
 const [imageCache,setImageCache]=useState<Record<string,string>>({}),[view,setView]=useState('home'),[project,setProject]=useState<Project|null>(null),[projects,setProjects]=useState<Project[]>([]),[cloud,setCloud]=useState(false),[ready,setReady]=useState(false),[saved,setSaved]=useState(''),[notice,setNotice]=useState(''),[query,setQuery]=useState(''),[filter,setFilter]=useState('all'),[modal,setModal]=useState(''),[brand,setBrand]=useState<Brand>({name:'我的文创品牌',color:'#e87b42',logo:''}),[idx,setIdx]=useState(1),[tab,setTab]=useState('text'),[busy,setBusy]=useState(false),[tasks,setTasks]=useState<{name:string;time:string;ok:boolean}[]>([]),[checks,setChecks]=useState<string[]>([]),[exportType,setExportType]=useState('all'),[exportConfirmed,setExportConfirmed]=useState(false),[history,setHistory]=useState<Project[]>([]),[future,setFuture]=useState<Project[]>([]);
 const revisions=useRef<Record<string,number>>({}),saveQueue=useRef(Promise.resolve()),active=useRef<Project|null>(null),fileRef=useRef<HTMLInputElement>(null),backgroundRef=useRef<HTMLInputElement>(null),drag=useRef<{x:number;y:number;px:number;py:number}|null>(null),current=useRef(idx),canvasBox=useRef<HTMLDivElement>(null);
 active.current=project;current.current=idx;
 useEffect(()=>{
  try {
   setProjects(JSON.parse(localStorage.getItem('sx-projects') || '[]'));
   const cachedBrand = localStorage.getItem('sx-brand');
   if (cachedBrand) setBrand(JSON.parse(cachedBrand));
  } catch {
   setNotice('无法读取本机草稿。');
  } finally { setReady(true); }
 }, []);
 useEffect(()=>{
  const saved=localStorage.getItem('sx-image-model');
  const model=imageModels.find(item=>item.id===saved);
  if(model)setImageModel(model.id);
 },[]);
 function selectImageModel(model:ImageModel){
  setImageModel(model);
  localStorage.setItem('sx-image-model',model);
 }
 useEffect(()=>{
  if(!ready)return;
  let cancelled=false;
  setTemplateLoad('loading');
  async function loadTemplates(){
   try{
    let entries:StyleTemplate[];
    if(cloud){
     const response=await fetch(api+'/style-templates');
     if(!response.ok)throw new Error();
     const result=await response.json() as {templates:StyleTemplate[]};
     entries=result.templates;
    }else entries=JSON.parse(localStorage.getItem('sx-style-templates')||'[]');
    if(!cancelled){
     setStyleTemplates(current=>[...current.filter(item=>!entries.some(entry=>entry.id===item.id)),...entries]);
     setTemplateLoad('ready');
    }
   }catch{if(!cancelled)setTemplateLoad('error');}
  }
  void loadTemplates();
  return()=>{cancelled=true;};
 },[ready,cloud]);

 async function saveStyleTemplate(id:string,title:string,prompt:string,category?:CategoryId){
  if(!ready)throw new Error('工作坊正在加载，请稍后重试。');
  let template:StyleTemplate={id,title,prompt,category,createdAt:new Date().toISOString()};
  if(cloud){
   const response=await fetch(api+'/style-templates',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(template)});
   const data=await response.json() as {template?:StyleTemplate;error?:string};
   if(!response.ok||!data.template)throw new Error(data.error||'模板保存失败，请重试。');
   template=data.template;
  }else{
   const local=JSON.parse(localStorage.getItem('sx-style-templates')||'[]') as StyleTemplate[];
   localStorage.setItem('sx-style-templates',JSON.stringify([template,...local.filter(item=>item.id!==id)]));
  }
  setStyleTemplates(current=>[template,...current.filter(item=>item.id!==id)]);
 }

 function applyStyleTemplate(template:StyleTemplate,target:Project){
  const prompt=promptForStyleTemplate(template,target);
  const draft=(target.creativePromptDraft??target.creativePrompt)?.trim();
  if(draft&&draft!==prompt&&!window.confirm('将当前项目的自定义提示词替换为所选模板？'))return;
  open({...target,creativePromptDraft:prompt.slice(0,maxCreativePromptLength),stage:1,updatedAt:new Date().toISOString()},false);
  setNotice('模板已填入自定义创作风格，可继续修改。');
 }
 function fillCreativePrompt(prompt:string){
  const current=creativePromptDraft.trim();
  if(current&&current!==prompt.trim()&&!window.confirm('用这套模板提示词替换当前自定义内容？'))return false;
  update(p=>({...p,creativePromptDraft:prompt.slice(0,maxCreativePromptLength)}));
  requestAnimationFrame(()=>promptInput.current?.focus());
  return true;
 }
 useEffect(()=>{window.scrollTo(0,0);},[view,project?.stage,campaignOpen]);
 useEffect(()=>{if(!notice)return;const id=setTimeout(()=>setNotice(''),4500);return()=>clearTimeout(id)},[notice]);
 const sceneUrls=project?[...project.designs, ...(project.campaign?[project.campaign.layout]:[])].map(d=>d.sceneBackground??'').join('|'):'';
 const currentBadge=project?.campaign?.promo?.badge;
 const promoBackground=project?.campaign&&(!project.campaign.festival||project.campaign.promo)
  ? project.campaign.promo?.background??promotionBackground : undefined;
 useEffect(()=>{
  const displayedProjects=project?[project,...projects]:projects;
  const urls=new Set([...displayedProjects.flatMap(item=>[
    ...item.product.images, artworkImage(item), item.designs[1]?.sceneBackground,
  ]),currentBadge,promoBackground,...sceneUrls.split('|')]);
  let canceled=false;
  for(const url of urls){
   if(!url?.startsWith('/')||imageCache[url])continue;
   imageDataUrl(url).then(data=>{
    if(data&&!canceled)setImageCache(cache=>({...cache,[url]:data}));
   }).catch(()=>{});
  }
  return()=>{canceled=true};
 },[projects,project?.id,project?.example,currentBadge,promoBackground,sceneUrls]);
 function upsert(p:Project){setProjects(a=>[p,...a.filter(x=>x.id!==p.id)]);}
 async function persist(p:Project){
  setSaved('保存中');
  saveQueue.current=saveQueue.current.catch(()=>{}).then(async()=>{
   if(deletedIds.current.has(p.id))return;
   if(cloud){const r=await fetch(api+'/projects',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({project:p,expected_revision:revisions.current[p.id]??p.revision})});const d:any=await r.json();if(!r.ok){setSaved(r.status===409?'版本冲突':'保存失败');setNotice(d.error||'保存失败');return;}revisions.current[p.id]=d.revision;}
   upsert({...p,revision:revisions.current[p.id]??0});setSaved(cloud?'云端已保存':'本机已保存');
  });await saveQueue.current;
 }
 useEffect(()=>{if(!ready)return;try{localStorage.setItem('sx-projects',JSON.stringify(projects))}catch{setNotice('本机草稿空间不足，请使用云端保存或减少图片')}},[projects,ready]);
 useEffect(()=>{if(!project||!ready)return;setSaved('有未保存修改');const id=setTimeout(()=>persist(project),1100);return()=>clearTimeout(id)},[project,ready,cloud]);
 useEffect(()=>{const fn=(e:BeforeUnloadEvent)=>{if(saved==='有未保存修改'||saved==='保存中'||saved==='保存失败'){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',fn);return()=>window.removeEventListener('beforeunload',fn)},[saved]);
 useEffect(()=>{
  if(deleteTargets.length)deleteDialog.current?.showModal();
 },[deleteTargets]);

 function selectProjects(ids:string[]){
  setSelectedIds(current=>{
   const next=new Set(current);
   const remove=ids.every(id=>next.has(id));
   for(const id of ids){if(remove)next.delete(id);else next.add(id);}
   return next;
  });
 }

 async function confirmDelete(){
  if(deleteBusy.current||!deleteTargets.length)return;
  deleteBusy.current=true;
  setBusy(true);
  setDeleteError('');
  const ids=new Set(deleteTargets.map(p=>p.id));
  const operation=saveQueue.current.catch(()=>{}).then(async()=>{
   if(cloud){
    const response=await fetch(api+'/projects',{method:'DELETE',headers:{'Content-Type':'application/json'},
     body:JSON.stringify({ids:[...ids]})});
    if(!response.ok){
     const result=await response.json().catch(()=>null) as {error?:string}|null;
     throw new Error(result?.error??'删除未完成，请重试。');
    }
   }
   for(const id of ids)deletedIds.current.add(id);
   setProjects(current=>current.filter(p=>!ids.has(p.id)));
   if(active.current&&ids.has(active.current.id)){
    active.current=null;
    setProject(null);
    setHistory([]);
    setFuture([]);
    setCampaignOpen(false);
    setSaved('');
   }
   setSelectedIds(current=>new Set([...current].filter(id=>!ids.has(id))));
   deleteDialog.current?.close();
   setDeleteTargets([]);
   setNotice(`已删除 ${ids.size} 个项目`);
  });
  saveQueue.current=operation;
  try{await operation;}
  catch(error){setDeleteError(error instanceof Error?error.message:'删除未完成，请重试。');}
  finally{deleteBusy.current=false;setBusy(false);}
 }

 function closeDelete(){
  if(deleteBusy.current)return;
  deleteDialog.current?.close();
  setDeleteTargets([]);
 }

 function update(fn:(p:Project)=>Project,undo=true){if(!active.current)return;const p=active.current;if(undo){setHistory(h=>[...h.slice(-29),structuredClone(p)]);setFuture([])}setProject({...fn(structuredClone(p)),updatedAt:new Date().toISOString()});}
 function productEdit(key:keyof Product,value:any){update(p=>({...p,product:{...p.product,[key]:value,confirmed:key==='confirmed'?value:false},name:key==='name'?value||'未命名上新项目':p.name}));}
 function changeLayout(key:keyof Layout,val:any){update(p=>{p.designs[idx]={...p.designs[idx],[key]:val};return p;});}
 function start(example=false, category?:CategoryId){setManaging(false);setSelectedIds(new Set());setCampaignOpen(false);const p=makeProject(example,brand,category);setProject(p);setView('workspace');setHistory([]);setFuture([]);setIdx(1);setSaved('有未保存修改');}
 function open(p:Project,showCampaign=Boolean(p.campaign)){setCampaignOpen(showCampaign);setProject(structuredClone(showCampaign?withCampaign(p):p));setView('workspace');setIdx(1);setHistory([]);setFuture([]);}
 function duplicate(p:Project){setCampaignOpen(false);const next={...structuredClone(p),id:crypto.randomUUID(),name:p.name+' 副本',revision:0,stage:0,product:{...p.product,confirmed:false},createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),exportedAt:undefined};setProject(next);setView('workspace');setNotice('已创建独立副本，请重新确认商品信息');}
 function withCampaign(p:Project):Project{
  if(!p.designs[0])return p;
  const sellA=p.product.description.trim().replace(/\s+/g,' ').slice(0,16);
  const sellB=p.category
   ? [...(p.product.categoryFacts??[]),p.product.name]
      .map(fact=>fact.trim().replace(/\s+/g,' ').slice(0,16)).find(fact=>fact&&fact!==sellA)??''
   : '';
  const campaign=p.campaign??{
   layout:{...p.designs[0],subtitle:'',size:Math.min(45,p.designs[0].size)},sellA,sellB,
  };
  if(!p.category||campaign.festival)return p.campaign?p:{...p,campaign};
  return {...p,campaign:{...campaign,festival:{active:'双十一',drafts:{}}}};
 }
 function enterCampaign(){
  if(!project?.designs[0])return;
  update(withCampaign);
  setCampaignOpen(true);
 }
 function navigate(next:string){
  if(view==='workspace'&&project)void persist(project);
  if(next!=='home'){setManaging(false);setSelectedIds(new Set());}
  setView(next);
 }
 function startCampaignExample(){
  const sample=makeProject(true,brand);
  sample.name='蓝杯 · 大促首图示例';
  sample.product.confirmed=true;
  sample.stage=2;
  sample.designs=makeDesigns(sample);
  sample.campaign={
   layout:{...sample.designs[0],subtitle:'',size:45},
   sellA:'温润釉面，细腻好握',
   sellB:'350mL，日常饮水刚刚好',
   festival:{active:'双十一',drafts:{}},
  };
  open(sample);
 }
 function updateCampaign(projectId:string,change:(campaign:Campaign)=>Campaign){
  if(active.current?.id!==projectId)return;
  update(p=>p.campaign?{...p,campaign:change(p.campaign)}:p);
 }
 function undo(){if(!history.length||!project)return;setFuture(f=>[...f,project]);setProject(history[history.length-1]);setHistory(h=>h.slice(0,-1));}
 function redo(){if(!future.length||!project)return;setHistory(h=>[...h,project]);setProject(future[future.length-1]);setFuture(f=>f.slice(0,-1));}
 function task(name:string,ok=true){setTasks(t=>[{name,time:new Date().toLocaleTimeString('zh-CN'),ok},...t]);}
 async function imageFile(f:File){if(!['image/png','image/jpeg','image/webp'].includes(f.type)||f.size>8*1024*1024)throw new Error('请使用8MB以内的JPG、PNG或WEBP图片');const data=await new Promise<string>((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result as string);r.onerror=rej;r.readAsDataURL(f)});const im=new window.Image();im.src=data;await im.decode();if(im.width*im.height>40000000)throw new Error('图片像素过大，请压缩后重试');if(cloud){const body=new FormData();body.append('file',f);const r=await fetch(api+'/assets',{method:'POST',body});const d:any=await r.json();if(!r.ok)throw new Error(d.error);setImageCache(c=>({...c,[d.url]:data}));return d.url;}if(f.size>1000000)throw new Error('本机体验请使用 1 MB 以内的图片');return data;}
 async function upload(files:FileList|null){if(!files||!project)return;setBusy(true);try{const projectId=project.id;const selected=Array.from(files);if(project.product.images.length+selected.length>3)throw new Error('每个商品最多上传3张照片');const urls:string[]=[];for(const f of selected)urls.push(await imageFile(f));if(active.current?.id!==projectId)return;update(p=>({...p,example:false,product:{...p.product,images:[...p.product.images,...urls],confirmed:false}}));task('商品素材上传完成');setNotice('上传完成，请检查商品资料')}catch(e){setNotice((e as Error).message);task('素材上传未完成',false)}finally{setBusy(false);if(fileRef.current)fileRef.current.value='';}}
 function toPlans(){if(!project)return;if(!project.product.name.trim()||!project.product.description.trim()){setNotice('请填写商品名称和至少一条真实卖点');return;}if(!project.example&&!project.product.images.length){setNotice('请上传商品主图，或使用示例商品');return;}if(project.product.price&&!/^\d+(\.\d{1,2})?$/.test(project.product.price)||project.product.price&&Number(project.product.price)<=0){setNotice('价格需为大于0、最多两位小数的金额');return;}if(!project.product.confirmed){setNotice('请勾选确认商品信息');return;}update(p=>({...p,stage:1}));task('已整理2个规则创作方向');}
 function compose(){if(!project||!creativeDirectionMode(project))return;update(p=>({...p,stage:2,versions:p.designs.length?[...(p.versions??[]),{designs:structuredClone(p.designs),direction:p.direction,directionMode:p.directionMode,creativePrompt:p.creativePrompt,at:new Date().toISOString()}]:p.versions,designs:makeDesigns(p)}));setIdx(1);task('模板排版完成 · 3张图 / 2种比例');setNotice('套图已完成排版，文字与商品均可修改');}
 async function exportImages(){if(!project)return;const errors=checkProject(project);setChecks(errors);if(errors.length){setNotice('请先修复导出检查项');return;}if(!exportConfirmed){setNotice('请确认导出前检查清单');return;}setBusy(true);const snap=structuredClone(project);try{const inds=exportType==='single'?[idx]:exportType==='ratio'?[idx%2,2+idx%2,4+idx%2]:[0,1,2,3,4,5];const files=[];for(const i of inds)files.push({name:`${designTypes(snap)[Math.floor(i/2)]}_${i%2?'3-4':'1-1'}.png`,blob:await renderPng(snap,i)});const filename=snap.name.replace(/[\\/:*?"<>|]/g,'_');if(files.length===1)download(files[0].blob,filename+'_'+files[0].name);else download(await zipFiles(files),filename+'_营销套图.zip');update(p=>({...p,exportedAt:new Date().toISOString(),exportedRevision:revisions.current[p.id]??0}),false);task(`导出完成 · ${files.length}张PNG`);setModal('');setNotice('导出已完成，已保留当前编辑稿')}catch(e){setNotice((e as Error).message);task('导出失败，可重新尝试',false)}finally{setBusy(false)}}
 function exportDialog(){if(!project)return;setChecks(checkProject(project));setExportConfirmed(false);setModal('export');}
 const l=project?.designs[idx];
 const category=project?.category?categories[project.category]:undefined;
 const types=designTypes(project);
 const directionMode=project?creativeDirectionMode(project):undefined;
 const selectedDirection=directionMode==='template'?project?.direction:undefined;
 const creativePromptDraft=project?.creativePromptDraft??project?.creativePrompt??'';
 const cachedArtwork=(p:Project,i:number)=>{
  const source=artworkImage(p,i);
  return source?imageCache[source]:undefined;
 };
 const renderDesign=(p:Project,i:number)=>{
  const background=p.designs[i]?.sceneBackground;
  return designSvg(p,i,cachedArtwork(p,i),undefined,background?imageCache[background]:undefined);
 };
 function openSceneSkill(){
  const target=project?.stage===2&&project.designs.length?project:projects.find(p=>p.stage===2&&p.designs.length);
  if(!target){navigate('home');setNotice('请选择一个项目并先制作套图，再到编辑器的「背景」使用生活场景图。');return;}
  open(target,false);
  setTab('style');
 }
 const skillProjects=project?[project,...projects.filter(item=>item.id!==project.id)]:projects;
 const campaigns=skillProjects.filter(item=>item.designs.length===6);
 const navItems=[['home','上新项目',LayoutGrid],['campaign','大促制图',Sparkles],['skills','技能中心',BookOpen],['brand','品牌设置',Palette]] as const;
 const currentNav=view==='workspace'?(campaignOpen?'campaign':'home'):view;
 const filtered=projects.filter(p=>p.name.toLowerCase().includes(query.toLowerCase())&&(filter==='all'||filter==='finished'&&p.designs.length||filter==='draft'&&!p.designs.length));
 const selectedProjects=projects.filter(p=>selectedIds.has(p.id));
 const allVisibleSelected=filtered.length>0&&filtered.every(p=>selectedIds.has(p.id));
 return <div className="app-shell">
 <aside className="sidebar"><button className="brandmark" aria-label="图匠室首页" onClick={()=>navigate('home')}>
   <picture><source media="(max-width: 900px)" srcSet="./tujiangshi-icon.png"/>
    <img src="./tujiangshi-logo.png" alt="" width={660} height={198}/>
   </picture>
  </button><div className="space-label">我的工作空间 <ChevronDown size={13}/></div><nav aria-label="工作台工具">{navItems.map(([id,label,Icon])=><button key={id} title={label} aria-label={label} aria-current={currentNav===id?'page':undefined} className={currentNav===id?'active':''} onClick={()=>navigate(id)}><Icon size={19}/> {label}{id==='home'&&<span className="nav-count">{projects.length}</span>}</button>)}</nav><div className="side-bottom"><div className="little-card"><span className="spark-mini"><Sparkles size={18}/></span><strong>从灵感，到好设计</strong><p>把每一次上新，变成品牌<br/>与用户的一次美好相遇。</p><button onClick={()=>setModal('guide')}>查看创作指南 <ArrowUpRight size={14}/></button></div><button className="side-link" onClick={()=>setModal('settings')}><Settings2 size={17}/> 工作台设置</button><button className="profile" onClick={()=>setModal('settings')}><span className="avatar">Y</span><span>我的创意空间<small>{cloud?'个人工作空间':'本机体验空间'}</small></span><MoreHorizontal size={17}/></button></div></aside>
 <div className="main-shell"><header className="topbar"><div className="breadcrumb"><span className="breadcrumb-root">工作空间</span>
  <button className="mobile-brandmark" aria-label="图匠室首页" onClick={()=>navigate('home')}><img src="./tujiangshi-icon.png" alt="" width={28} height={28}/></button>
  <ChevronRight size={14}/><span>{view==='workspace'?project?.name:navItems.find(([id])=>id===view)?.[1]}</span></div><div className="top-actions"><span className={'save-status '+(saved==='保存失败'||saved==='版本冲突'?'error':'')}><span className="status-dot"/>{view==='workspace'?saved:cloud?'云端工作空间':'本机草稿模式'}</span><button onClick={()=>setModal('tasks')}><Clock3 size={17}/> 任务记录 {tasks.length>0&&<b>{tasks.length}</b>}</button><span className="divider"/><button className="help" onClick={()=>setModal('guide')}><BookOpen size={17}/> 使用指南</button></div></header>
 <nav className="mobile-tools" aria-label="工作台工具">{navItems.map(([id,label,Icon])=><button key={id} aria-current={currentNav===id?'page':undefined} onClick={()=>navigate(id)}><Icon size={16}/>{label}</button>)}</nav>
 {view==='skills'&&<SkillCenter sceneEnabled={sceneEnabled} onOpenScene={openSceneSkill} section={skillSection} onSectionChange={setSkillSection}
  templates={styleTemplates} templateLoad={templateLoad} projects={skillProjects} onApplyTemplate={applyStyleTemplate} onSaveTemplate={saveStyleTemplate} cloud={cloud}/>}
 {view==='campaign'&&<main className="home studio-page">
  <div className="page-heading"><div><div className="eyebrow">CAMPAIGN STUDIO</div><h1>大促制图</h1><p>打开一个已完成套图的项目，编辑首图 A/B 和大促海报。</p></div><button className="primary" onClick={startCampaignExample}>用蓝杯体验大促 <ArrowRight size={16}/></button></div>
  <section className="panel campaign-projects"><h2>选择商品项目</h2>
   {campaigns.length?campaigns.map(p=><button key={p.id} onClick={()=>open({...p,stage:2},true)}>
    <span><strong>{p.name}</strong><small>{p.category?categories[p.category].name:'通用套图'} · {p.campaign?'已有大促草稿':'可创建大促版'}</small></span><ArrowRight size={17}/>
   </button>):<div><p>完成任一品类的套图后，项目会出现在这里。</p><button className="secondary" onClick={()=>navigate('home')}>返回品类工作台 <ArrowRight size={16}/></button></div>}
  </section>
 </main>}
 {view==='home'&&<main className="home">
 <CategoryHero onExample={()=>{setSelectedCategory('tech');start(true,'tech')}}/>
 <div id="category-studio" className="page-heading category-studio-heading"><div><div className="eyebrow">CATEGORY STUDIO / 04</div><h2>按品类制图<span>✳</span></h2><p>从买家最想确认的信息出发，给不同商品做一套合适的图。</p></div></div>
 <CategoryCatalog selected={selectedCategory} onSelect={setSelectedCategory} onStart={()=>start(false,selectedCategory)} onExample={()=>start(true,selectedCategory)}/>
 <div className="projects-title"><h2>我的上新项目 <span>{projects.length}</span></h2><div className="project-tools"><button className="secondary manage-projects-button" aria-pressed={managing} disabled={!ready||!projects.length&&!managing} onClick={()=>{setManaging(!managing);setSelectedIds(new Set());}}>{managing?'退出管理':'管理项目'}</button><label className="search"><Search size={15}/><input aria-label="搜索项目" placeholder="搜索项目" value={query} onChange={e=>setQuery(e.target.value)}/></label><button className="icon-btn" aria-label="切换项目筛选" onClick={()=>setFilter(filter==='all'?'finished':filter==='finished'?'draft':'all')}><SlidersHorizontal size={17}/></button></div></div><div className="filter-tabs">{[['all','全部项目'],['draft','草稿'],['finished','已有设计']].map(([k,n])=><button key={k} className={filter===k?'selected':''} onClick={()=>setFilter(k)}>{n}</button>)}</div>
 {managing&&<div className="manage-projects-bar">
  <label className="check-label"><input type="checkbox" checked={allVisibleSelected} disabled={!filtered.length}
   onChange={()=>selectProjects(filtered.map(p=>p.id))}/> 全选当前列表</label>
  <span role="status">已选 {selectedProjects.length} 个项目</span>
  <button className="danger-button" disabled={!selectedProjects.length} onClick={()=>{setDeleteError('');setDeleteTargets(selectedProjects);}}>
   <Trash2 size={16}/> 删除选中
  </button>
 </div>}
 <section className="project-grid">
  {!managing&&<button className="new-project-card" onClick={()=>start(false,selectedCategory)}><span><Plus size={27}/></span><strong>开启一个新项目</strong><p>你的下一个好设计，从这里开始</p></button>}
  {filtered.map(p=>{
   const selected=selectedIds.has(p.id);
   const openOrSelect=()=>managing?selectProjects([p.id]):open(p);
   return <article className={'project-card'+(managing&&selected?' project-selected':'')} key={p.id}>
    <button className="project-cover" onClick={openOrSelect} aria-pressed={managing?selected:undefined} style={{background:projectPalettes(p)[p.designs[1]?.bg??0][0]}}>
     {p.designs.length?<img src={dataSvg(renderDesign(p,1))} alt={p.name}/>:<img className="raw-product" src={p.product.images[p.product.main]??(p.example?sampleImage(p):undefined)} alt={p.product.name||'商品草稿'}/>}
     <span className={'cover-badge '+(!p.designs.length?'draft':'')}>{p.designs.length?'可继续编辑':'草稿'}</span>
    </button>
    {managing&&<label className="project-select"><input type="checkbox" aria-label={'选择项目 '+p.name} checked={selected} onChange={()=>selectProjects([p.id])}/></label>}
    <div className="card-details"><button onClick={openOrSelect}>{p.name}</button>
     {!managing&&<button className="icon-btn" aria-label={'复制'+p.name} title="复制项目" onClick={()=>duplicate(p)}><Copy size={15}/></button>}
     <p>{p.category?categories[p.category].name+' · ':''}{p.example?'示例项目 · ':''}{p.designs.length?'3张设计 · 2种比例':'等待完善商品信息'}<span>{fmt(p.updatedAt)}</span></p>
    </div>
   </article>;
  })}
 </section>
 {managing&&!filtered.length&&<p className="muted">当前列表没有可选项目。</p>}
 {!projects.length&&<div className="start-hint"><span>还没有准备好商品素材？</span><button onClick={()=>start(true)}>用蓝杯通用示例，试试制作流程 <ArrowRight size={15}/></button></div>}<footer className="page-footer"><span>为每一份用心经营，添一点创意。</span><span>图匠室 · V0.3</span></footer></main>}
 {view==='brand'&&<main className="home brand-page"><div className="eyebrow">BRAND ASSETS</div><h1>让每次创作，都像你的品牌。</h1><p className="muted">保存品牌偏好，新项目可直接复用。已有项目保留原来的设置。</p><div className="brand-settings"><div><label>品牌名称<input value={brand.name} maxLength={40} onChange={e=>setBrand({...brand,name:e.target.value})}/></label><label>品牌强调色<div className="color-row"><input aria-label="品牌色" type="color" value={brand.color} onChange={e=>setBrand({...brand,color:e.target.value})}/><span>{brand.color}</span></div></label><p className="field-hint">当前使用系统中文字体。Logo上传与自定义字体将在后续版本开放。</p><button className="primary" onClick={async()=>{try{if(cloud){const r=await fetch(api+'/brand',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(brand)});if(!r.ok)throw new Error();}localStorage.setItem('sx-brand',JSON.stringify(brand));setNotice('品牌配置已保存，新项目将使用此配置')}catch{setNotice('品牌保存失败，请重试')}}}><Save size={17}/> 保存品牌配置</button></div><div className="brand-preview" style={{background:brand.color+'18'}}><div style={{background:brand.color}}><Sparkles size={28}/></div><h2>{brand.name||'你的品牌'}</h2><p>把品牌的温度，带进每一个设计。</p><span>BRAND PREVIEW</span></div></div></main>}
 {view==='workspace'&&project&&<main className="workspace"><div className="work-heading"><button className="back-btn" onClick={()=>{persist(project);setView('home')}}><ChevronLeft size={18}/> 返回项目</button><div className="steps">{['商品资料','创作方向','编辑与导出'].map((s,i)=><button key={s} className={project.stage===i?'current':project.stage>i?'complete':''} disabled={i>project.stage&&!(i===2&&project.designs.length&&project.product.confirmed)} onClick={()=>update(p=>({...p,stage:i}))}><span>{project.stage>i?<Check size={12}/>:i+1}</span>{s}{i<2&&<ChevronRight size={14}/>}</button>)}</div><button className="text-button" onClick={()=>persist(project)}><Cloud size={16}/> 保存项目</button></div>
 {project.stage===0&&<div className="input-page"><div className="section-title"><div className="eyebrow">STEP 01 / PRODUCT BRIEF</div><h1>{category?category.name+' · 准备商品资料':'先认识一下，你的好商品。'}</h1><p>{category?.cue??'准确的信息，是好设计的第一步。未填写的规格不会出现在文案中。'}</p></div><div className="brief-grid"><section className="panel photo-panel"><div className="panel-title"><h3>商品照片</h3><span>{project.product.images.length|| (project.example?1:0)} / 3</span></div><div className="upload-zone" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();upload(e.dataTransfer.files)}}>{project.example&&!project.product.images.length?<><img src={sampleImage(project)} alt={category?"示例商品照片":"示例商品插画"}/><span className="sample-label">{category?"示例商品照片":"示例商品插画 · 非实拍"}</span></>:project.product.images.length?<img src={project.product.images[project.product.main]} alt="当前商品主图"/>:<><div className="upload-icon"><Upload size={28}/></div><h3>把商品照片放在这里</h3><p>拖拽上传，或点击选择图片</p><button className="secondary" onClick={()=>fileRef.current?.click()}>选择商品图片</button><small>JPG / PNG / WEBP · 单张最大8MB</small></>}</div><input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" multiple hidden onChange={e=>upload(e.target.files)}/><div className="photo-thumbnails">{project.product.images.map((u,i)=><button key={u} className={i===project.product.main?'chosen':''} onClick={()=>productEdit('main',i)}><img src={u} alt={'商品图片'+(i+1)}/>{i===project.product.main&&<span>主图</span>}</button>)}{(project.product.images.length>0||project.example)&&<button aria-label="添加商品图片" className="add-photo" onClick={()=>fileRef.current?.click()} disabled={busy||project.product.images.length>=3}><Plus size={22}/></button>}</div>{category&&<div className="category-asset-list">{category.assets.map((asset,i)=><label key={asset}>
 <strong>{category.slots[i]}</strong><small>{asset}</small>{i>0&&project.product.images.length>0&&<select aria-label={category.slots[i]+'素材'} value={project.product.slotImages?.[i]??''} onChange={e=>{
 const mapping={...project.product.slotImages}; if(e.target.value==='')delete mapping[i];else mapping[i]=Number(e.target.value);
 productEdit('slotImages',mapping);
 }}><option value="">沿用商品主图</option>{project.product.images.map((_,n)=><option key={n} value={n}>商品图片 {n+1}</option>)}</select>}
 </label>)}</div>}
 <div className="photo-tip"><ImageIcon size={17}/><p>优先使用主体清晰、背景简单的照片。透明底PNG可以直接用于套图。</p></div><button className="ai-outline" onClick={()=>setModal('ai')}><Sparkles size={16}/> AI识别与抠图 <span>待接入</span></button></section>
 <section className="panel info-panel"><div className="panel-title"><h3>商品信息</h3><span>真实卖点，让表达更准确</span></div><label>商品名称 <em>*</em><input placeholder={'例如：'+(category?.sample[0]??'云朵陶瓷马克杯')} maxLength={40} value={project.product.name} onChange={e=>productEdit('name',e.target.value)}/></label><label>核心卖点 <em>*</em><textarea placeholder="写下至少一条有依据的商品特点" maxLength={180} value={project.product.description} onChange={e=>productEdit('description',e.target.value)}/><small>请使用真实资料，避免未经确认的功效与承诺。</small></label>{category?<div className="category-facts">{category.fields.map((field,i)=>{
 const value=project.product.categoryFacts?.[i]??'';
 function editFact(next:string){
  const facts=category!.fields.map((_,index)=>project!.product.categoryFacts?.[index]??'');
  facts[i]=next;
  productEdit('categoryFacts',facts);
 }
 return <label key={field}>{field}{project.category==='fashion'&&i===1
  ? <textarea rows={3} maxLength={74} value={value} placeholder="每行一个尺码，最多三行，如 M 胸围 108 cm" onChange={e=>editFact(e.target.value.split('\n').slice(0,3).map(row=>row.slice(0,24)).join('\n'))}/>
  : <input maxLength={24} value={value} placeholder={'选填，如 '+category.sample[3][i]} onChange={e=>editFact(e.target.value)}/>}</label>;
 })}<p>{category.guard}</p></div>:<div className="field-pair"><label>材质<input placeholder="选填，例如：陶瓷" maxLength={20} value={project.product.material} onChange={e=>productEdit('material',e.target.value)}/></label><label>容量 / 规格<input placeholder="选填，例如：350mL" maxLength={20} value={project.product.capacity} onChange={e=>productEdit('capacity',e.target.value)}/></label></div>}<div className="field-pair"><label>商品售价<div className="price-input"><span>¥</span><input inputMode="decimal" placeholder="选填" maxLength={10} value={project.product.price} onChange={e=>productEdit('price',e.target.value)}/></div></label><label>目标人群<input maxLength={40} value={project.product.audience} onChange={e=>productEdit('audience',e.target.value)}/></label></div><label className="check-label"><input type="checkbox" checked={project.product.confirmed} onChange={e=>productEdit('confirmed',e.target.checked)}/><span>我已核对以上商品信息，可用于宣传文案。</span></label><div className="form-action"><span><CheckCircle2 size={15}/> 信息只在当前项目中使用</span><button className="primary" onClick={toPlans} disabled={busy}>{busy?<Loader2 className="spin" size={17}/>:null}选择创作方向 <ArrowRight size={17}/></button></div></section></div></div>}
 {project.stage===1&&<div className="plan-page">
 <div className="section-title"><div className="eyebrow">STEP 02 / CREATIVE DIRECTION</div><h1>让你的商品，有自己的表达。</h1><p>选择一套固定模板，或填写并应用自定义提示词。</p></div>
 <div className={'direction-grid '+(category?'category-directions':'')}>{[0,1].map(i=>{
  const d=category?.directions[i];
  const name=d?.name??(i?'自然松弛 · 生活提案':'温柔日常 · 上新叙事');
  const preview={...project,direction:i,designs:makeDesigns({...project,direction:i})};
  const prompt=templatePrompt(project,i);
  return <DirectionPromptCard key={name} name={name} prompt={prompt} onUse={()=>fillCreativePrompt(prompt)}>
   <button className={'direction-card '+(selectedDirection===i?'chosen':'')} aria-pressed={selectedDirection===i} onClick={()=>update(p=>({...p,direction:i,directionMode:'template'}))}>
    {d?<img src={dataSvg(designSvg(preview,0,cachedArtwork(preview,0)))} alt={name+'画布预览'}/>:<div className="direction-visual" style={{background:i?'#e4eadf':'#eee6d7'}}>
     <span>{i?'A GIFT OF EVERYDAY':'SLOW DAYS, GOOD DAYS'}</span><h2>{i?<>装下一点<br/>生活的松弛</>:<>把日常，<br/>过成喜欢的样子</>}</h2>
     <img src={project.product.images[project.product.main]??dataSvg(mugSvg())} alt="商品方向预览"/>
     <div className="swatches">{(i?['#d9e1cf','#63715b','#faf9f0']:['#e8ddcc','#8ba5b7','#34423e']).map(c=><i key={c} style={{background:c}}/>)}</div>
    </div>}
    <div className="direction-details"><div><strong>{name}</strong><span className="radio">{selectedDirection===i&&<i/>}</span></div>
     <p>{d?.note??(i?'以自然色彩与轻盈留白，呈现商品融入生活的感觉。':'以柔和暖色和清晰信息，突出商品外观与日常陪伴感。')}</p><small>{types.join(' / ')}</small>
    </div>
   </button>
  </DirectionPromptCard>;
 })}</div>
 <CustomDirectionPrompt key={project.id} project={project} value={creativePromptDraft}
  onChange={creativePromptDraft=>update(p=>({...p,creativePromptDraft}),false)} inputRef={promptInput}
  onApply={()=>update(p=>({...p,direction:0,directionMode:'custom',creativePrompt:creativePromptDraft.trim()}))}
  canWrite={cloud&&(imageApi.personalKey||imageApi.workspaceKey)} onSettings={()=>setModal('settings')}
  onSave={(id,title,prompt)=>saveStyleTemplate(id,title,prompt,project.category)}
  onTemplates={()=>{setSkillSection('templates');navigate('skills');}}
  onChooseTemplate={()=>setTemplatePickerOpen(true)}/>
 {templatePickerOpen&&<TemplatePicker templates={styleTemplates} load={templateLoad} project={project}
  onChoose={fillCreativePrompt} onClose={()=>setTemplatePickerOpen(false)}/> }
 <div className="plan-bottom"><div><span className="rule-tag"><Layers size={15}/> {directionMode==='custom'?'基础排版':'模板排版'}</span><p>{!directionMode?'请先选择固定模板，或应用自定义提示词。':directionMode==='custom'?'先生成3张基础排版，再到「背景」使用自定义提示词生成 AI 场景。':'生成3张可编辑设计，适配1:1和3:4。此操作不产生模型费用。'}</p></div><button className="primary" disabled={!directionMode} onClick={()=>{if(project.designs.length)setModal('recompose');else compose()}}>开始制作套图 <ArrowRight size={17}/></button></div></div>}
 {project.stage===2&&l&&campaignOpen&&project.campaign&&<CampaignPanel key={project.id}
   project={project} campaign={project.campaign} imageCache={imageCache} uploadBadge={imageFile}
   canGenerate={cloud&&sceneEnabled} onSettings={()=>setModal('settings')}
   onChange={change=>updateCampaign(project.id,change)}
   onExport={()=>task('大促首图导出完成 · 3张PNG')}
   onBack={()=>setCampaignOpen(false)}/>}
 {project.stage===2&&l&&!campaignOpen&&<div className="editor"><aside className="design-rail"><div className="rail-title">套图设计 <span>03</span></div><button className="secondary campaign-rail" onClick={enterCampaign}><Sparkles size={15}/> 大促换图</button>{types.map((t,d)=><button className={'design-thumb '+(Math.floor(idx/2)===d?'selected':'')} key={t} onClick={()=>setIdx(d*2+idx%2)}><img src={dataSvg(renderDesign(project,d*2+1))} alt={t}/><span>{String(d+1).padStart(2,'0')} <strong>{t}</strong></span></button>)}{(project.versions?.length??0)>0&&<button className="rail-action" onClick={()=>setModal('versions')}><Layers size={15}/> 历史方案</button>}<button className="rail-action" onClick={()=>setModal('tasks')}><Clock3 size={15}/> 查看任务记录</button></aside><section className="canvas-section"><div className="canvas-toolbar"><div><button aria-label="撤销" disabled={!history.length} onClick={undo}><Undo2 size={17}/></button><button aria-label="重做" disabled={!future.length} onClick={redo}><Redo2 size={17}/></button><span className="divider"/><span>{types[Math.floor(idx/2)]}</span></div><div className="ratio-toggle"><button className={idx%2===0?'selected':''} onClick={()=>setIdx(Math.floor(idx/2)*2)}>1:1</button><button className={idx%2===1?'selected':''} onClick={()=>setIdx(Math.floor(idx/2)*2+1)}>3:4</button></div><button className="primary small" onClick={exportDialog}><Download size={15}/> 导出</button></div><div className="canvas-stage"><div className={'canvas-art '+(idx%2?'portrait':'square')} ref={canvasBox} onPointerDown={e=>{if((e.target as HTMLElement).tagName==='TEXTAREA')return;drag.current={x:e.clientX,y:e.clientY,px:l.x,py:l.y};e.currentTarget.setPointerCapture(e.pointerId);setHistory(h=>[...h.slice(-29),structuredClone(project)]);setFuture([])}} onPointerMove={e=>{if(!drag.current||!canvasBox.current)return;const r=canvasBox.current.getBoundingClientRect(),d=drag.current;update(p=>{p.designs[current.current].x=Math.max(0,Math.min(100,d.px+(e.clientX-d.x)/r.width*100));p.designs[current.current].y=Math.max(0,Math.min(100,d.py+(e.clientY-d.y)/r.height*100));return p;},false)}} onPointerUp={()=>drag.current=null} onPointerCancel={()=>drag.current=null}><img draggable={false} src={dataSvg(renderDesign(project,idx))} alt="可编辑设计预览，拖动画布调整商品位置"/>{project.example&&<span className="canvas-example">{category?"示例商品照片":"示例商品插画"}</span>}</div></div><div className="canvas-footer"><span><MousePointer2 size={13}/> 拖动画布调整商品位置 · 右侧编辑文字</span><span>{idx%2?'900 × 1200':'900 × 900'} px <span className="zoom">适应画布</span></span></div></section><aside className="properties"><div className="property-tabs">{[['text','文字',Type],['product','商品',Move],['style','背景',Palette]].map(([k,n,Icon]:any)=><button key={k} className={tab===k?'selected':''} onClick={()=>setTab(k)}><Icon size={17}/>{n}</button>)}</div><div className="property-body">{tab==='text'&&<><div className="property-heading"><h3>文字内容</h3><span>当前画布</span></div><label>主标题<textarea value={l.title} maxLength={80} onChange={e=>changeLayout('title',e.target.value)}/></label><label>副标题<input value={l.subtitle} maxLength={80} onChange={e=>changeLayout('subtitle',e.target.value)}/></label><div className="field-pair"><label>字号<input type="number" min="20" max="90" value={l.size} onChange={e=>changeLayout('size',Math.max(20,Math.min(90,Number(e.target.value))))}/></label><label>文字颜色<input type="color" value={l.textColor} onChange={e=>changeLayout('textColor',e.target.value)}/></label></div><button className="secondary full" onClick={()=>{update(p=>{p.designs[idx%2?idx-1:idx+1].title=l.title;p.designs[idx%2?idx-1:idx+1].subtitle=l.subtitle;return p});setNotice('文案已应用到另一比例，布局保持不变')}}><Copy size={14}/> 文案应用到另一比例</button><div className="prop-separator"/><h3>商品价格</h3><p className="field-hint">修改会同步所有绑定价格图层，保留各自的排版。</p><div className="price-input"><span>¥</span><input aria-label="同步商品价格" inputMode="decimal" value={project.product.price} onChange={e=>productEdit('price',e.target.value)}/></div>{!project.product.confirmed&&<label className="check-label"><input type="checkbox" checked={false} onChange={()=>productEdit('confirmed',true)}/><span>确认更新后的商品信息</span></label>}</>}{tab==='product'&&<><h3>商品主体</h3><p className="field-hint">原始商品图作为独立图层，不随背景改变。AI抠图尚未接入，可上传透明PNG。</p><label>商品大小 <strong>{Math.round(l.scale*100)}%</strong><input type="range" min=".4" max="1.6" step=".01" value={l.scale} onChange={e=>changeLayout('scale',Number(e.target.value))}/></label><div className="field-pair"><label>水平位置 %<input type="number" min="0" max="100" value={Math.round(l.x)} onChange={e=>changeLayout('x',Number(e.target.value))}/></label><label>垂直位置 %<input type="number" min="0" max="100" value={Math.round(l.y)} onChange={e=>changeLayout('y',Number(e.target.value))}/></label></div><button className="secondary full" onClick={()=>update(p=>{const {x,y,scale}=makeDesigns(p)[idx];Object.assign(p.designs[idx],{x,y,scale});return p})}><RefreshCw size={14}/> 还原商品位置</button><div className="prop-separator"/><h3>{project.product.name}</h3><p className="field-hint">{[project.product.material,project.product.capacity].filter(Boolean).join(' · ')}</p><button className="text-button" onClick={()=>update(p=>({...p,stage:0}))}>修改商品资料 <ArrowUpRight size={14}/></button></>}{tab==='style'&&<><h3>背景色调</h3><p className="field-hint">{category?'同一张设计的两个比例同步换色，并匹配模板文字颜色。':'同一张设计的两个比例同步换色，文字与商品位置保持不变。'}</p><div className="background-grid">{projectPalettes(project).map((c,b)=><button key={b} className={l.bg===b?'selected':''} style={{background:`linear-gradient(135deg,${c[0]},${c[1]})`}} onClick={()=>{update(p=>{p.designs[Math.floor(idx/2)*2].bg=b;p.designs[Math.floor(idx/2)*2+1].bg=b;if(category){for(const i of [Math.floor(idx/2)*2,Math.floor(idx/2)*2+1])p.designs[i].textColor=category.directions[b].ink;}return p});task('背景色调已更新')}}>{l.bg===b&&<Check size={20}/>}<span>{category?.directions[b]?.name??['燕麦奶油','雾感丁香','自然鼠尾草','暖调杏桃'][b]}</span></button>)}</div><div className="prop-separator"/><ScenePanel key={project.id+':'+idx} project={project} index={idx} enabled={cloud&&sceneEnabled}
   model={imageModel} onModelChange={selectImageModel} onSettings={()=>setModal('settings')}
   onApply={url=>{changeLayout('sceneBackground',url);task('已应用 AI 场景背景');}}
   onRestore={()=>changeLayout('sceneBackground',undefined)}/></>}</div><div className="property-bottom"><CheckCircle2 size={16}/><span>每一个细节，都可以再调整。</span></div></aside></div>}
 </main>}
 </div>{notice&&<div className="toast" role="status"><CheckCircle2 size={18}/>{notice}<button aria-label="关闭提示" onClick={()=>setNotice('')}><X size={15}/></button></div>}
 {deleteTargets.length>0&&<dialog className="modal project-delete-dialog" ref={deleteDialog}
  aria-labelledby="delete-projects-title" onCancel={e=>{e.preventDefault();closeDelete();}}>
  <div className="modal-icon"><Trash2 size={24}/></div>
  <h2 id="delete-projects-title">确认删除 {deleteTargets.length} 个项目？</h2>
  <p>以下项目及其编辑记录将被删除，删除后无法恢复。</p>
  <ul>{deleteTargets.map(p=><li key={p.id}>{p.name}</li>)}</ul>
  {deleteError&&<p className="delete-error" role="alert">{deleteError}</p>}
  <div className="modal-actions">
   <button className="secondary" autoFocus disabled={busy} onClick={closeDelete}>取消</button>
   <button className="danger-button" disabled={busy} onClick={confirmDelete}>{busy?'正在删除…':'确认删除'}</button>
  </div>
 </dialog>}
 {modal&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget&&!busy)setModal('')}}><section className={'modal '+(modal==='export'?'export-modal':'')} role="dialog" aria-modal="true" aria-label={modal==='export'?'导出套图':'工作台详情'}><button className="modal-close" aria-label="关闭弹窗" disabled={busy} onClick={()=>setModal('')}><X size={20}/></button>
 {modal==='guide'&&<><div className="modal-icon"><BookOpen size={25}/></div><h2>从一张商品图，到一套好设计。</h2><p className="muted">把制作拆成三个轻松的小步骤。</p><div className="guide-list">{[['01','准备真实资料','上传商品照片，填写名称、卖点和价格，核对后继续。'],['02','选一个表达方向','先使用规则方案确定视觉风格，AI创作服务待接入。'],['03','调整，然后带走','编辑标题、拖动商品、同步改价，导出单张或整套PNG。']].map(([n,t,s])=><div key={n}><span>{n}</span><div><h3>{t}</h3><p>{s}</p></div></div>)}</div><button className="primary full" onClick={()=>{setModal('');start(true)}}>使用示例开始体验 <ArrowRight size={16}/></button></>}
 {modal==='settings'&&<><div className="modal-icon"><Settings2 size={25}/></div><h2>工作台设置</h2><div className="setting-row"><span>项目保存</span><strong>{cloud?'已连接云端':'本机草稿'}</strong></div><p className="field-hint">{cloud?'项目与上传素材按当前登录身份隔离保存，可再次打开继续编辑。':'当前仅保存在此浏览器。登录后可使用云端项目与素材保存。'}</p>{!cloud&&<a className="secondary full" href="/signin-with-chatgpt?return_to=/" target="_top">登录并使用云端保存 <ExternalLink size={14}/></a>}<div className="setting-row"><span>图片导出</span><strong>PNG / ZIP</strong></div><p className="field-hint">1:1 900×900 · 3:4 900×1200。上传单张8MB以内，当前界面支持中文与人民币。</p><div className="setting-row"><span>AI服务</span><span className="pending">{sceneEnabled?'场景背景可用':'生图服务待配置'}</span></div><p className="field-hint">场景背景可在套图编辑器中预览执行提示词。商品理解与自动抠图待接入。</p><ImageApiSettings status={imageApi} onChange={setImageApi}/><span className="version-label">图匠室 V0.3 · 分品类制图</span></>}
 {modal==='ai'&&<><div className="modal-icon"><Sparkles size={25}/></div><h2>给创意，多一点可能。</h2><p className="muted">场景生成入口位于套图编辑器的「背景」页。</p><div className="ai-features">{['商品信息辅助识别','商品自动抠图','按风格生成背景'].map(s=><div key={s}><Sparkles size={17}/><span>{s}</span><span className="pending">{s==='按风格生成背景'?(sceneEnabled?'可用':'待配置'):'待接入'}</span></div>)}</div><p className="field-hint">你可以先上传透明底商品图，使用模板完成制作。已编辑的项目将在接入AI后继续保留。</p><button className="primary full" onClick={()=>setModal('')}>继续使用当前工作台</button></>}
 {modal==='tasks'&&<><div className="modal-icon"><Clock3 size={25}/></div><h2>本次任务记录</h2><p className="muted">记录当前会话内已执行的操作，不包含AI模型任务。</p><div className="task-list">{tasks.length?tasks.map((t,i)=><div key={i}>{t.ok?<CheckCircle2 size={18}/>:<AlertCircle size={18}/>}<span>{t.name}<small>{t.time}</small></span><span>{t.ok?'已完成':'未完成'}</span></div>):<div className="empty-task"><Layers size={35}/><p>还没有任务记录</p><small>上传素材、制作套图或导出后将在此展示。</small></div>}</div></>}
 {modal==='versions'&&project&&<><h2>历史创作方案</h2><p className="muted">切回时会保留当前设计为另一份历史方案。</p><div className="task-list">{project.versions?.map((v,i)=><div key={i}><Layers size={18}/><span>{v.directionMode==='custom'?'自定义创作风格':category?.directions[v.direction]?.name??(v.direction===0?'温柔日常':'自然松弛')}<small>{new Date(v.at).toLocaleString('zh-CN')}</small></span><button className="secondary" onClick={()=>{update(p=>{const old={designs:structuredClone(p.designs),direction:p.direction,directionMode:p.directionMode,creativePrompt:p.creativePrompt,at:new Date().toISOString()};p.designs=structuredClone(v.designs);p.direction=v.direction;p.directionMode=v.directionMode;if(v.directionMode)p.creativePrompt=v.creativePrompt;p.versions=[...(p.versions??[]).filter((_,j)=>j!==i),old];return p});setModal('');setNotice('已切回历史设计')}}>切回此方案</button></div>)}</div></>}
 {modal==='recompose'&&<><h2>为新方向重新排版？</h2><p className="muted">将为新方向创建六个画布，当前设计会保存在历史方案中，之后可以切回。</p><div className="modal-actions"><button className="secondary" onClick={()=>setModal('')}>保留当前设计</button><button className="primary" onClick={()=>{compose();setModal('')}}>重新排版</button></div></>}
 {modal==='export'&&project&&<><div className="modal-icon"><Download size={25}/></div><h2>把好设计，带到用户面前。</h2><p className="muted">PNG高清导出，保留可编辑的项目原稿。</p><div className="export-options">{[['single','当前画布','1张PNG'],['ratio','当前比例套图','3张PNG · ZIP'],['all','完整营销套图','6张PNG · ZIP']].map(([k,n,s])=><button key={k} className={exportType===k?'selected':''} onClick={()=>setExportType(k)}><FileImage size={21}/><strong>{n}</strong><small>{s}</small><span className="radio">{exportType===k&&<i/>}</span></button>)}</div>{checks.length>0?<div className="check-errors"><strong>请先处理以下问题</strong>{checks.map((c,i)=><p key={i}><AlertCircle size={14}/>{c}</p>)}</div>:<div className="export-ok"><CheckCircle2 size={16}/> 基础结构检查通过</div>}<label className="check-label export-check"><input type="checkbox" checked={exportConfirmed} onChange={e=>setExportConfirmed(e.target.checked)}/><span>我已检查商品外观、卖点、价格和所选比例的排版，确认可以使用。{category?' '+category.guard:''}{project.example?(category?'当前使用示例商品照片。':'当前商品为示例插画。'):''}</span></label><button className="primary full" disabled={busy||checks.length>0||!exportConfirmed} onClick={exportImages}>{busy?<Loader2 className="spin" size={18}/>:<Download size={18}/>} {busy?'正在准备图片…':'确认并导出'}</button><p className="field-hint center">导出内容为当前版本；后续修改需重新导出。</p></>}
 </section></div>}
 </div>
}
