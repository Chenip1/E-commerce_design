'use client';
import { useState } from 'react';
import { exportSkillImage, exportSkills, type ExportSkill } from '../lib/skill-exports';
import { download, type Project } from '../lib/workshop';

export function SkillExportPanel({ skill, projects }: {skill:ExportSkill; projects:Project[]}) {
  const [id,setId]=useState('');
  const [title,setTitle]=useState('');
  const [offer,setOffer]=useState('');
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const eligible=projects.filter(p=>skill==='xiaohongshu-cover'?p.designs.length>1:p.example||p.product.images.length);
  const project=eligible.find(p=>p.id===id);
  const isWhite=skill==='amazon-white-background';
  const output=skill==='sale-banner'?'大促横幅_1200x628':isWhite?'白底主图_1600x1600':'小红书封面_900x1200';
  return <section className="skill-export-panel">
    <h2>在工作坊运行</h2><p>{exportSkills[skill]} 输出 PNG。{isWhite?'导出后请自行核对商品所属类目规则。':''}</p>
    {eligible.length?<><label>商品项目<select value={id} onChange={e=>setId(e.target.value)}>
      <option value="">请选择</option>{eligible.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
    </select></label>
    {!isWhite&&<label>图上标题<input maxLength={14} value={title} onChange={e=>setTitle(e.target.value)}/></label>}
    {skill==='sale-banner'&&<label>活动文案（选填）<input maxLength={25} value={offer} onChange={e=>setOffer(e.target.value)}/></label>}
    <button className="primary" disabled={busy||!project||!isWhite&&!title.trim()} onClick={async()=>{
      if(!project||busy)return;
      setBusy(true);setMessage('');
      try{download(await exportSkillImage(skill,project,title.trim(),offer.trim()),output+'.png');setMessage('图片已生成并开始下载。');}
      catch(error){setMessage(error instanceof Error?error.message:'导出失败，请重试。');}
      finally{setBusy(false);}
    }}>{busy?'正在制作…':'生成并下载 PNG'}</button></>:<p>请先创建项目并准备商品图{skill==='xiaohongshu-cover'?'，再制作套图':''}。</p>}
    {message&&<p role="status">{message}</p>}
  </section>;
}
