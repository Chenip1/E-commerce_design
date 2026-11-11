import { artworkImage, imageDataUrl, renderPng, sampleImage, type Project } from './workshop';

export const exportSkills = {
  'amazon-white-background': '使用透明底素材生成白底方图，并按主体边界居中排版。',
  'xiaohongshu-cover': '用项目主图和自定义标题排版一张 3:4 小红书封面。',
  'sale-banner': '用项目主图、活动标题和已确认的活动文案生成横幅。',
} as const;
export type ExportSkill = keyof typeof exportSkills;

export function isExportSkill(id: string): id is ExportSkill {
  return Object.hasOwn(exportSkills, id);
}

export async function exportSkillImage(skill: ExportSkill, project: Project, title: string, offer: string) {
  if (skill === 'xiaohongshu-cover') {
    const design = project.designs[1];
    if (!design) throw new Error('请先在项目中制作套图。');
    const designs = [...project.designs];
    designs[1] = {...design, title, subtitle:'', size:Math.min(design.size,Math.floor(730/title.length))};
    return renderPng({...project, designs},1);
  }
  const src = await imageDataUrl(artworkImage(project,0)) ?? (project.example ? sampleImage(project) : undefined);
  if (!src) throw new Error('请先上传商品图片。');
  const image = new Image();
  image.src = src;
  await image.decode();
  const canvas = document.createElement('canvas');
  canvas.width = skill==='sale-banner'?1200:1600;
  canvas.height = skill==='sale-banner'?628:1600;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('当前浏览器无法导出图片。');
  if (skill === 'sale-banner') {
    ctx.fillStyle='#8b2430';
    ctx.fillRect(0,0,1200,628);
    ctx.fillStyle='#fff1d6';
    ctx.beginPath();
    ctx.arc(920,310,246,0,2*Math.PI);
    ctx.fill();
    const scale=Math.min(430/image.width,430/image.height);
    const width=image.width*scale,height=image.height*scale;
    ctx.drawImage(image,920-width/2,310-height/2,width,height);
    await document.fonts.ready;
    ctx.fillStyle='#fff1d6';
    ctx.font='700 64px sans-serif';
    ctx.fillText(title,72,265,570);
    ctx.font='500 32px sans-serif';
    if(offer)ctx.fillText(offer,74,350,560);
  } else {
    const probe=document.createElement('canvas');
    const scale=Math.min(1,1024/Math.max(image.width,image.height));
    probe.width=Math.max(1,Math.round(image.width*scale));
    probe.height=Math.max(1,Math.round(image.height*scale));
    const source=probe.getContext('2d',{willReadFrequently:true});
    if(!source)throw new Error('当前浏览器无法检查素材。');
    source.drawImage(image,0,0,probe.width,probe.height);
    const {data}=source.getImageData(0,0,probe.width,probe.height);
    let left=probe.width,top=probe.height,right=-1,bottom=-1,transparent=false;
    for(let y=0;y<probe.height;y++){
      for(let x=0;x<probe.width;x++){
        const alpha=data[(y*probe.width+x)*4+3];
        if(alpha<16){transparent=true;continue;}
        left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
      }
    }
    if(!transparent||right<left)throw new Error('请上传主体清晰的透明底 PNG 或 WebP，再生成白底主图。');
    const width=right-left+1,height=bottom-top+1;
    const factor=canvas.width*.88/Math.max(width,height);
    ctx.fillStyle='#fff';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(probe,left,top,width,height,(canvas.width-width*factor)/2,(canvas.height-height*factor)/2,width*factor,height*factor);
  }
  return new Promise<Blob>((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('图片导出失败。')),'image/png'));
}
