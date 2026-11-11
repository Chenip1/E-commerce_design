import { categories, categoryProductImage, type CategoryId } from './categories';
import type { FestivalDraft } from './festival-poster';

export type Product={categoryFacts?: string[]; slotImages?: Record<number, number>;name:string;description:string;material:string;capacity:string;price:string;audience:string;confirmed:boolean;images:string[];main:number};
export type Layout={sceneBackground?:string;title:string;subtitle:string;x:number;y:number;scale:number;size:number;textColor:string;bg:number;priceBound:boolean;customPrice:string};
export type PromotionArtwork={label:string;price:string;badge?:string};
export const promotionBackground='./campaign/promotion-square.webp';
export type Campaign={layout:Layout;sellA:string;sellB:string;festival?:FestivalDraft;promo?:PromotionArtwork & {source:"A"|"B";headline:string;confirmed:boolean;prompt?:string;background?:string}};
type DirectionMode='template'|'custom';
export type Project={creativePrompt?: string;creativePromptDraft?: string;directionMode?:DirectionMode;category?: CategoryId;campaign?:Campaign;id:string;name:string;product:Product;direction:number;stage:number;designs:Layout[];createdAt:string;updatedAt:string;revision:number;example:boolean;exportedAt?:string;exportedRevision?:number;color:string;versions?:{designs:Layout[];direction:number;directionMode?:DirectionMode;creativePrompt?:string;at:string}[]};
export type Brand={name:string;color:string;logo:string};
export const palettes=[['#eee6d7','#e5d7c3'],['#e4e5ed','#cbcddd'],['#e4eadf','#cbd9c5'],['#f3dfcf','#eac6a7']];
export const types=['上新主视觉','商品卖点图','促销引导图'];
export function makeProject(example=false,brand?:Brand,category?:CategoryId):Project{
 const now=new Date().toISOString();
 if(category){
  const c=categories[category], [name,description,price,categoryFacts]=c.sample;
  return {id:crypto.randomUUID(),category,name:example?name+' · 示例':c.name+' · 新项目',
   product:{name:example?name:'',description:example?description:'',price:example?price:'',categoryFacts:example?[...categoryFacts]:[],material:'',capacity:'',audience:'',confirmed:false,images:[],main:0},
   direction:0,stage:0,designs:[],createdAt:now,updatedAt:now,revision:0,example,color:brand?.color??'#e87b42'};
 }
 return{id:crypto.randomUUID(),name:example?'春日蓝杯 · 上新企划':'未命名上新项目',product:{name:example?'云朵陶瓷马克杯':'',description:example?'温润釉面，握住日常的小美好':'',material:example?'陶瓷':'',capacity:example?'350mL':'',price:example?'59':'',audience:'日常生活 · 办公好物',confirmed:false,images:[],main:0},direction:0,stage:0,designs:[],createdAt:now,updatedAt:now,revision:0,example,color:brand?.color??'#e87b42'};
}
export function creativeDirectionMode(p:Project):DirectionMode|undefined{
 return p.directionMode??(!p.category||p.direction===1||p.designs.length?'template':undefined);
}
export function makeDesigns(p:Project):Layout[]{
 if(p.category){
  const c=categories[p.category], direction=c.directions[p.direction]??c.directions[0];
  return Array.from({length:6},(_,i)=>{
   const slot=Math.floor(i/2), tall=i%2===1;
   const side=slot===2&&p.category!=='snack';
   return {title:c.headlines[slot].replace('{name}',()=>p.product.name),subtitle:slot===0?p.product.description.slice(0,37):'',
    x:side?73:50,y:side?56:tall?59:56,scale:side?.68:slot===1?1.04:1.15,
    size:Math.min(p.category==='tech'?48:56,Math.max(20,Math.floor(770/Math.max(1,p.product.name.length)))),textColor:direction.ink,bg:p.direction,priceBound:true,customPrice:''};
  });
 }
 const base=p.direction===0?['把日常，\n过成喜欢的样子','用心的细节，\n值得被看见','让喜欢，\n成为日常']:['装下一点\n生活的松弛','把好心情\n握在手里','给生活，\n一份小心意'];
 return Array.from({length:6},(_,i)=>({title:base[Math.floor(i/2)],subtitle:Math.floor(i/2)===1?[p.product.material,p.product.capacity].filter(Boolean).join(' · ')||p.product.description:p.product.description||p.product.name,x:54,y:i%2?65:63,scale:1,size:i%2?54:50,textColor:'#34423e',bg:p.direction===0?0:2,priceBound:true,customPrice:''}));
}
export function escapeXml(s:string){return s.replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]!));}
export function mugSvg(color='#8ea9bc'){
return `<svg xmlns="http://www.w3.org/2000/svg" width="620" height="620" viewBox="0 0 620 620"><defs><linearGradient id="body" x1="0" x2="1"><stop stop-color="#617f94"/><stop offset=".34" stop-color="${color}"/><stop offset=".7" stop-color="#b4cad6"/><stop offset="1" stop-color="#7794aa"/></linearGradient><linearGradient id="handle" x1="0" x2="1"><stop stop-color="#66859c"/><stop offset=".65" stop-color="#a5bfce"/><stop offset="1" stop-color="#7392a7"/></linearGradient><radialGradient id="top"><stop stop-color="#c8d8de"/><stop offset=".75" stop-color="#7897a9"/><stop offset="1" stop-color="#d4e2e7"/></radialGradient><filter id="shadow"><feGaussianBlur stdDeviation="13"/></filter></defs><ellipse cx="285" cy="514" rx="177" ry="24" fill="#263c43" opacity=".17" filter="url(#shadow)"/><path d="M411 214 C555 181 563 419 418 415" fill="none" stroke="url(#handle)" stroke-width="39"/><path d="M430 240 C516 221 522 382 431 390" fill="none" stroke="#c3d5de" stroke-width="6" opacity=".6"/><path d="M125 196 L142 449 Q147 514 285 519 Q421 515 430 453 L444 196Z" fill="url(#body)"/><ellipse cx="284" cy="198" rx="159" ry="52" fill="#c0d0d8"/><ellipse cx="284" cy="199" rx="147" ry="43" fill="url(#top)"/><path d="M155 237 L166 430 Q168 465 186 474" stroke="#e1edf0" stroke-width="11" opacity=".18" fill="none" stroke-linecap="round"/><path d="M176 487 Q285 524 398 487" fill="none" stroke="#bcd1dc" stroke-width="5" opacity=".5"/><text x="282" y="380" text-anchor="middle" fill="#e7eff2" opacity=".65" font-size="16" letter-spacing="5" font-family="serif">SLOW DAYS</text></svg>`;
}
export function dataSvg(s:string){return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(s)}
export function designTypes(p?: Project | null) {
 return p?.category ? categories[p.category].slots : types;
}
export function artworkImage(p:Project,index=0){
 const slot=Math.floor(index/2);
 return p.product.images[p.product.slotImages?.[slot]??p.product.main]??p.product.images[p.product.main]
  ??(p.example&&p.category?categoryProductImage(p.category):undefined);
}
export function sampleImage(p:Project){
 return p.category?categoryProductImage(p.category):dataSvg(mugSvg());
}
export function projectPalettes(p:Project){
 return p.category?categories[p.category].directions.map(d=>d.colors):palettes;
}
export function designSvg(p:Project,index:number,image?:string,promotion?:PromotionArtwork,background?:string):string{
 const l=p.designs[index];if(!l)return '';if(p.category)return categoryDesignSvg(p,p.category,index,image,promotion,background);const tall=index%2===1,w=900,h=tall?1200:900;const [bg,shadow]=palettes[l.bg];const xml=escapeXml;
 const title=l.title.split('\n').map((s,i)=>`<tspan x="80" dy="${i?l.size*1.3:0}">${xml(s)}</tspan>`).join('');
 const price=promotion?.price??(l.priceBound?p.product.price:l.customPrice);const img=image??p.product.images[p.product.main]??dataSvg(mugSvg());
 const badge = promotion
   ? promotion.badge
     ? `<image href="${xml(promotion.badge)}" x="570" y="30" width="250" height="80" preserveAspectRatio="xMaxYMid meet"/>`
     : `<rect x="580" y="34" width="240" height="68" rx="18" fill="#a52e31"/><text x="700" y="78" text-anchor="middle" fill="#fff" font-size="23" font-weight="700" font-family="Arial,sans-serif">${xml(promotion.label)}</text>`
   : '';
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${bg}"/><stop offset="1" stop-color="${shadow}"/></linearGradient><filter id="blur"><feGaussianBlur stdDeviation="24"/></filter></defs><rect width="900" height="${h}" fill="url(#bg)"/>${backgroundLayer(background,h)}<rect x="80" y="${h-40}" width="42" height="3" fill="${p.color}"/><path d="M750 -80 L1000 50 L410 ${h} L190 ${h}" fill="#fff" opacity=".18"/><ellipse cx="470" cy="${h*.81}" rx="260" ry="38" fill="#6f7864" opacity=".12" filter="url(#blur)"/><text x="80" y="75" fill="${l.textColor}" font-size="16" font-family="Arial,sans-serif" letter-spacing="5">NEW ARRIVAL / 2026</text><text x="80" y="${tall?172:156}" fill="${l.textColor}" font-size="${l.size}" font-weight="600" font-family="Arial,'Noto Sans CJK SC',sans-serif">${title}</text><text x="82" y="${tall?300:280}" fill="${l.textColor}" font-size="20" opacity=".7" font-family="Arial,sans-serif">${xml(l.subtitle)}</text><image href="${xml(img)}" x="${w*l.x/100-280*l.scale}" y="${h*l.y/100-280*l.scale}" width="${560*l.scale}" height="${560*l.scale}" preserveAspectRatio="xMidYMid meet"/><text x="80" y="${h-75}" fill="${l.textColor}" font-size="22" font-family="Arial,sans-serif">${xml(p.product.name)}</text>${(promotion||Math.floor(index/2)===2)&&price?`<text x="820" y="${h-75}" text-anchor="end" fill="${l.textColor}" font-size="38" font-family="Arial,sans-serif">¥${xml(price)}</text>`:`<text x="820" y="${h-75}" text-anchor="end" fill="${l.textColor}" font-size="15" font-family="Arial,sans-serif" letter-spacing="2">EXPLORE MORE →</text>`}${badge}</svg>`;
}
function backgroundLayer(src:string|undefined,height:number){
 return src?`<image href="${escapeXml(src)}" width="900" height="${height}" preserveAspectRatio="xMidYMid slice"/>`:'';
}
function categoryDesignSvg(p:Project,id:CategoryId,index:number,image?:string,promotion?:PromotionArtwork,background?:string){
 const c=categories[id], l=p.designs[index], slot=Math.floor(index/2), h=index%2?1200:900;
 const [bg,shadow,accent]=(c.directions[l.bg]??c.directions[0]).colors;
 const ink=escapeXml(l.textColor), xml=escapeXml;
 const img=image??artworkImage(p,index)??'';
 const title=l.title.split('\n').map((line,i)=>`<tspan x="65" dy="${i?l.size*1.13:0}">${xml(line)}</tspan>`).join('');
 const panel=slot===2&&id!=='snack';
 const font=id==='beauty'||id==='fashion'?"Georgia,'Noto Serif CJK SC',serif":"Arial,'Noto Sans CJK SC',sans-serif";
 const factEntries=(slot===0?[0]:slot===1?id==='tech'?[2]:id==='fashion'?[0]:[0,1]:id==='snack'?[0,2]:id==='tech'?[1,0,2]:id==='beauty'?[1,2]:[1,2])
  .map(i=>({label:c.fields[i],value:p.product.categoryFacts?.[i]?.trim()})).filter(f=>f.value);
 const deco = {
  snack:`<circle cx="510" cy="${h*.58}" r="300" fill="${accent}" opacity=".33"/><circle cx="510" cy="${h*.58}" r="245" fill="none" stroke="#fff8db" stroke-width="3" stroke-dasharray="8 16" opacity=".85"/><path d="M0 ${h*.81} Q245 ${h*.69} 515 ${h*.83} T900 ${h*.8} V${h}H0Z" fill="#fff3dc" opacity=".56"/>`,
  tech:`<rect width="900" height="${h}" fill="url(#grid)" opacity=".28"/><path d="M60 ${h*.63}H235L303 ${h*.48}H795M612 ${h*.75}H820v-64M830 129v80h-104" fill="none" stroke="${accent}" stroke-width="2" opacity=".65"/><circle cx="640" cy="${h*.55}" r="224" fill="none" stroke="${accent}" stroke-dasharray="2 11" opacity=".55"/>`,
  beauty:`<ellipse cx="540" cy="${h*.59}" rx="303" ry="${h*.31}" fill="#fff4ef" opacity=".22"/><ellipse cx="585" cy="${h*.56}" rx="252" ry="${h*.29}" fill="none" stroke="#fff4ef" opacity=".6"/><path d="M686 0 900 190 270 ${h}H156Z" fill="#fff" opacity=".11"/>`,
  fashion:`<rect x="47" y="46" width="806" height="${h-92}" fill="none" stroke="${accent}" opacity=".48"/><rect x="119" y="${h*.26}" width="662" height="${h*.56}" fill="#fff" opacity=".23"/><path d="M47 ${h-111}H853 M808 46V${h-111}" stroke="${accent}" opacity=".38"/>`,
 }[id];
 const facts=factEntries.map(({label,value},i)=>{
  const rows=value!.split('\n').map(row=>row.trim()).filter(Boolean);
  const x=panel?65:65+i*385;
  const y=panel?276+i*(id==='fashion'?164:115):h-181;
  const height=panel?(id==='fashion'&&i===0?146:94):68;
  const text=rows.map((row,n)=>`<tspan x="18" dy="${n?27:0}" font-size="${Math.min(panel?25:22,Math.floor(315/row.length))}">${xml(row)}</tspan>`).join('');
  return `<g transform="translate(${x},${y})"><rect width="${panel?365:348}" height="${height}" rx="${id==='snack'?24:8}" fill="${bg}" fill-opacity=".91" stroke="${accent}"/><text x="18" y="${panel?27:22}" fill="${ink}" font-family="${font}" font-size="16">${xml(label)}</text><text x="18" y="${panel?59:50}" fill="${ink}" font-family="${font}" font-size="${panel?25:22}" font-weight="700">${text}</text></g>`;
 }).join('');
 const price=promotion?.price??(l.priceBound?p.product.price:l.customPrice);
 const badge=promotion?(promotion.badge
  ?`<image href="${xml(promotion.badge)}" x="590" y="40" width="245" height="75" preserveAspectRatio="xMaxYMid meet"/>`
  :`<rect x="603" y="42" width="232" height="65" rx="14" fill="#a52e31"/><text x="719" y="83" text-anchor="middle" fill="#fff" font-size="23" font-weight="700" font-family="sans-serif">${xml(promotion.label)}</text>`):'';
 const size=550*l.scale;
 return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="${h}" viewBox="0 0 900 ${h}"><defs><linearGradient id="category-bg" x2="1" y2="1"><stop stop-color="${bg}"/><stop offset="1" stop-color="${shadow}"/></linearGradient><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="${accent}"/></pattern></defs><rect width="900" height="${h}" fill="url(#category-bg)"/>${background?backgroundLayer(background,h):deco}
 <text x="65" y="83" fill="${ink}" font-family="Arial,sans-serif" font-size="17" letter-spacing="4">${xml(c.english)} / 0${slot+1}</text><path d="M65 103h60" stroke="${accent}" stroke-width="4"/>
 ${img?`<image href="${xml(img)}" x="${9*l.x-size/2}" y="${h*l.y/100-size/2}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid meet"/>`:''}
 <text x="65" y="179" fill="${ink}" font-family="${font}" font-size="${l.size}" font-weight="${id==='snack'?800:650}">${title}</text>
 <text x="66" y="${Math.max(224,179+(l.title.split('\n').length-1)*l.size*1.13+44)}" fill="${ink}" opacity=".82" font-family="${font}" font-size="20">${xml(l.subtitle)}</text>
 ${facts}<path d="M65 ${h-102}h770" stroke="${accent}" opacity=".7"/><text x="65" y="${h-59}" fill="${ink}" font-family="${font}" font-size="24">${xml(p.product.name)}</text>
 ${(promotion||slot===2)&&price?`<text x="833" y="${h-59}" text-anchor="end" fill="${ink}" font-family="Arial,sans-serif" font-size="34">¥${xml(price)}</text>`:`<text x="833" y="${h-59}" text-anchor="end" fill="${ink}" font-family="${font}" font-size="18">${c.slots[slot]}</text>`}
 ${badge}</svg>`;
}
export function checkProject(p:Project){const errors:string[]=[];if(p.designs.length!==6)errors.push('套图尚未完成，请先制作六个画布');if(!p.product.name.trim())errors.push('请填写商品名称');if(p.product.name.length*22>740)errors.push('商品名称过长，请精简至33字内');if(p.product.price&&(!/^\d+(\.\d{1,2})?$/.test(p.product.price)||Number(p.product.price)<=0))errors.push('商品价格须大于0且最多两位小数');p.designs.forEach((d,i)=>{const label=designTypes(p)[Math.floor(i/2)]+' '+(i%2?'3:4':'1:1');if(d.title.split('\n').some(s=>s.length*d.size>(p.category?770:745)))errors.push(label+'：标题过长，请换行或缩小字号');if(d.subtitle.length*20>745)errors.push(label+'：副标题过长，请精简至37字内');if(d.x<0||d.x>100||d.y<0||d.y>100)errors.push(label+'：商品已越界');if(!d.priceBound&&d.customPrice!==p.product.price)errors.push(label+'：独立价格与商品资料不一致');});if(!p.product.confirmed)errors.push('请先确认商品资料');return errors;}
export async function imageDataUrl(src?:string):Promise<string|undefined>{
 if(!src?.startsWith('/api/')&&!src?.startsWith('./category-products/')&&src!==promotionBackground)return src;
 const response=await fetch(src);
 if(!response.ok)throw new Error('素材加载失败，请重新打开项目后再试');
 const blob=await response.blob();
 return new Promise((resolve,reject)=>{
  const reader=new FileReader();
  reader.onload=()=>resolve(reader.result as string);
  reader.onerror=()=>reject(new Error('素材读取失败'));
  reader.readAsDataURL(blob);
 });
}
export async function renderPng(p:Project,index:number,promotion?:PromotionArtwork){
 const [src,badge,background]=await Promise.all([imageDataUrl(artworkImage(p,index)),imageDataUrl(promotion?.badge),imageDataUrl(p.designs[index]?.sceneBackground)]);
 await document.fonts.ready;
 const image=new Image();
 image.src=dataSvg(designSvg(p,index,src,promotion&&{...promotion,badge},background));
 await image.decode();
 const canvas=document.createElement('canvas');
 canvas.width=900;
 canvas.height=index%2?1200:900;
 const context=canvas.getContext('2d');
 if(!context)throw new Error('当前浏览器无法导出图片');
 context.drawImage(image,0,0);
 return new Promise<Blob>((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('图片导出失败')),'image/png'));
}
export function download(blob:Blob,name:string){const u=URL.createObjectURL(blob);const a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),30000);}
export async function zipFiles(files:{name:string;blob:Blob}[]){
 const enc=new TextEncoder(),chunks:Uint8Array[]=[],central:Uint8Array[]=[];let offset=0;
 const crc=(b:Uint8Array)=>{let c=0xffffffff;for(const x of b){c^=x;for(let k=0;k<8;k++)c=c&1?(c>>>1)^0xedb88320:c>>>1;}return(c^0xffffffff)>>>0;};
 for(const f of files){const b=new Uint8Array(await f.blob.arrayBuffer()),n=enc.encode(f.name),sum=crc(b);const h=new Uint8Array(30+n.length),v=new DataView(h.buffer);v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(6,0x800,true);v.setUint32(14,sum,true);v.setUint32(18,b.length,true);v.setUint32(22,b.length,true);v.setUint16(26,n.length,true);h.set(n,30);chunks.push(h,b);const ch=new Uint8Array(46+n.length),cv=new DataView(ch.buffer);cv.setUint32(0,0x02014b50,true);cv.setUint16(4,20,true);cv.setUint16(6,20,true);cv.setUint16(8,0x800,true);cv.setUint32(16,sum,true);cv.setUint32(20,b.length,true);cv.setUint32(24,b.length,true);cv.setUint16(28,n.length,true);cv.setUint32(42,offset,true);ch.set(n,46);central.push(ch);offset+=h.length+b.length;}
 const size=central.reduce((s,b)=>s+b.length,0),end=new Uint8Array(22),e=new DataView(end.buffer);e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,size,true);e.setUint32(16,offset,true);return new Blob([...chunks,...central,end] as BlobPart[],{type:'application/zip'});
}
