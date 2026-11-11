import { env } from 'cloudflare:workers';
import {getChatGPTUser} from '../../../chatgpt-auth';
import { defaultImageModel, sceneSkillId } from '../../../../lib/scene-skill';
import { generateScene, SceneGenerationError } from '../../../../lib/scene-generation';
import { clearImageKeyCookie, imageKeyCookie, readImageKey } from '../../../../lib/workshop-credential';
import { writeCreativePrompt, PromptWritingError } from '../../../../lib/prompt-writing';
import { maxCreativePromptLength, maxStyleTitleLength } from '../../../../lib/style-templates';
import { categoryIds } from '../../../../lib/categories';
import { canonicalSkillSource, maxSkillLength } from '../../../../lib/github-skills';
export const dynamic='force-dynamic';
const json=(data:unknown,status=200)=>Response.json(data,{status});
async function handle(req:Request){
 const requestId=crypto.randomUUID();
 try{
 const user=await getChatGPTUser();
 if(!user)return json({error:'请登录后使用云端保存',code:'AUTH_REQUIRED',request_id:requestId},401);
 const db=env.DB; const owner=user.userId;
 if(!db)return json({error:'云端保存暂不可用',code:'STORAGE_UNAVAILABLE'},503);
 const parts=new URL(req.url).pathname.replace('/api/workshop','').split('/').filter(Boolean);
 const kind=parts[0],id=parts[1];
 if(kind==='status'||kind==='image-api'||kind==='prompt-writing'||kind==='skills'&&id===sceneSkillId){
  const secret=env.WORKSHOP_CREDENTIAL_SECRET?.trim();
  const personalKey=await readImageKey(req,secret,owner);
  const workspaceKey=env.OPENAI_API_KEY?.trim();
  const status=(hasPersonalKey=Boolean(personalKey))=>({
   canSave:Boolean(secret),personalKey:hasPersonalKey,workspaceKey:Boolean(workspaceKey),
   background:Boolean((hasPersonalKey||workspaceKey)&&env.BUCKET),
  });
  if(kind==='status')return Response.json({cloud:true,name:user.fullName??'创作者',imageApi:status(),
   ai:{analysis:false,background:status().background,cutout:false}},{headers:{'Cache-Control':'no-store'}});
  const origin=req.headers.get('origin');
  if(origin&&origin!==new URL(req.url).origin)return json({error:'请求来源无效'},403);
  if(kind==='image-api'&&(req.method==='POST'||req.method==='DELETE')){
   const remove=req.method==='DELETE';
   const body=remove?null:await req.json().catch(()=>null) as {apiKey?:unknown}|null;
   let cookie=clearImageKeyCookie();
   if(!remove){
    if(!secret)return json({error:'密钥保存服务暂不可用。'},503);
    const apiKey=typeof body?.apiKey==='string'?body.apiKey.trim():'';
    if(!/^sk-[!-~]{12,509}$/.test(apiKey))return json({error:'请输入有效格式的 OpenAI API Key。'},422);
    cookie=await imageKeyCookie(secret,owner,apiKey);
   }
   return Response.json(status(!remove),{headers:{'Set-Cookie':cookie,'Cache-Control':'no-store'}});
  }
  if(kind==='prompt-writing'&&req.method==='POST'){
   const key=personalKey||workspaceKey;
   if(!key)return json({error:'请先在工作台设置中配置 OpenAI API Key。'},503);
   const body=await req.json().catch(()=>null) as Record<string,unknown>|null;
   const limits={product:100,sellingPoints:500,audience:200,direction:600,draft:maxCreativePromptLength};
   const brief:Record<string,string>={};
   for(const [field,limit] of Object.entries(limits)){
    const value=body?.[field];
    if(typeof value==='string')brief[field]=value.trim().slice(0,limit);
   }
   if(!brief.product&&!brief.draft)return json({error:'请先填写商品名称或创作草稿。'},422);
   return Response.json({prompt:await writeCreativePrompt(key,brief)},{headers:{'Cache-Control':'no-store'}});
  }
  if(kind==='skills'&&req.method==='POST'){
   const body=await req.json().catch(()=>null) as {prompt?:unknown; tall?:unknown; model?:unknown}|null;
   if(typeof body?.prompt!=='string'||!body.prompt.trim()||body.prompt.length>5000||typeof body.tall!=='boolean'){
    return json({error:'场景生成参数无效，请检查提示词和画幅。'},422);
   }
   if(body.model!==undefined&&body.model!=='gpt')return json({error:'所选模型暂未接入。'},422);
   const key=personalKey||workspaceKey;
   const bucket=env.BUCKET;
   if(!key||!bucket)return json({error:'请先在工作台设置中配置 OpenAI API Key。'},503);
  const bytes=await generateScene(key,env.OPENAI_IMAGE_MODEL?.trim()||defaultImageModel,body.prompt,body.tall);
  const assetId=crypto.randomUUID();
  await bucket.put(`${owner}/${assetId}`,bytes,{httpMetadata:{contentType:'image/webp'}});
  return json({url:`/api/workshop/assets/${assetId}`},201);
  }
 }
 if(kind==='style-templates'){
  if(req.method==='GET'){
   const records=await db.prepare('SELECT id,title,prompt,category,created_at AS createdAt FROM workshop_style_templates WHERE owner=? ORDER BY created_at DESC,id DESC').bind(owner).all();
   return json({templates:records.results});
  }
  if(req.method==='POST'){
   const origin=req.headers.get('origin');
   if(origin&&origin!==new URL(req.url).origin)return json({error:'请求来源无效'},403);
   const body=await req.json().catch(()=>null) as {id?:unknown;title?:unknown;prompt?:unknown;category?:unknown}|null;
   const id=typeof body?.id==='string'?body.id:'';
   const title=typeof body?.title==='string'?body.title.trim():'';
   const prompt=typeof body?.prompt==='string'?body.prompt.trim():'';
   const category=categoryIds.find(value=>value===body?.category)??null;
   if(!/^[a-f0-9-]{36}$/.test(id)||!title||title.length>maxStyleTitleLength||!prompt||prompt.length>maxCreativePromptLength){
    return json({error:'请填写有效的模板名称和提示词。'},422);
   }
   await db.prepare('INSERT INTO workshop_style_templates (id,owner,title,prompt,category,created_at) VALUES (?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING')
    .bind(id,owner,title,prompt,category,new Date().toISOString()).run();
   const template=await db.prepare('SELECT id,title,prompt,category,created_at AS createdAt FROM workshop_style_templates WHERE id=? AND owner=?').bind(id,owner).first();
   return template?json({template},201):json({error:'模板保存失败，请重试。'},409);
  }
 }
 if(kind==='imported-skills'){
  if(req.method==='GET'){
   const skills=await db.prepare('SELECT source,title,content FROM workshop_imported_skills WHERE owner=? ORDER BY updated_at DESC').bind(owner).all();
   return Response.json({skills:skills.results},{headers:{'Cache-Control':'no-store'}});
  }
  if(req.method==='POST'){
   const origin=req.headers.get('origin');
   if(origin&&origin!==new URL(req.url).origin)return json({error:'请求来源无效'},403);
   const body=await req.json().catch(()=>null) as {source?:unknown;title?:unknown;content?:unknown}|null;
   const title=typeof body?.title==='string'?body.title.trim():'';
   const content=typeof body?.content==='string'?body.content.trim():'';
   let source:string;
   try{source=canonicalSkillSource(typeof body?.source==='string'&&body.source.length<=2000?body.source:'');}
   catch{return json({error:'GitHub Skill 来源无效。'},422);}
   if(!title||title.length>100||!content||content.length>maxSkillLength)return json({error:'Skill 名称或内容无效。'},422);
   await db.prepare('INSERT INTO workshop_imported_skills (owner,source,title,content,updated_at) VALUES (?,?,?,?,?) ON CONFLICT(owner,source) DO UPDATE SET title=excluded.title,content=excluded.content,updated_at=excluded.updated_at')
    .bind(owner,source,title,content,new Date().toISOString()).run();
   return json({skill:{source,title,content}},201);
  }
 }
 if(kind==='projects'){
 if(req.method==='GET'){
 const rows=await db.prepare('SELECT id,payload,revision,updated_at FROM workshop_projects WHERE owner=? ORDER BY updated_at DESC LIMIT 100').bind(owner).all();
 return json({projects:rows.results.map((r:any)=>({...JSON.parse(r.payload),revision:r.revision,updatedAt:r.updated_at}))});
 }
 if(req.method==='DELETE'&&!id){
  const body=await req.json().catch(()=>null) as {ids?:unknown}|null;
  const ids=body?.ids;
  if(!Array.isArray(ids)||!ids.length||ids.length>100||
    ids.some(id=>typeof id!=='string'||!id.trim()||id.length>128)){
   return json({error:'请选择 1 至 100 个有效项目'},422);
  }
  await db.prepare('DELETE FROM workshop_projects WHERE owner=? AND id IN (SELECT value FROM json_each(?))')
   .bind(owner,JSON.stringify(ids)).run();
  return json({deleted:true});
 }
 if(req.method==='POST'){
 const body:any=await req.json(); if(!body.project||typeof body.project.id!=='string'||typeof body.project.name!=='string')return json({error:'项目资料不完整'},422);
 const p=body.project; const data=JSON.stringify(p); if(data.length>2000000)return json({error:'项目数据过大，请减少素材'},422);
 const now=new Date().toISOString();
 const old:any=await db.prepare('SELECT owner,revision FROM workshop_projects WHERE id=?').bind(p.id).first();
 if(old){if(old.owner!==owner)return json({error:'无访问权限'},403);
 const result=await db.prepare('UPDATE workshop_projects SET payload=?,revision=revision+1,updated_at=? WHERE id=? AND owner=? AND revision=?').bind(data,now,p.id,owner,body.expected_revision).run();
 if(!result.meta.changes)return json({error:'项目已在其他页面更新，请另存副本或重新加载',code:'CONFLICT'},409);
 return json({revision:old.revision+1,updatedAt:now});
 }
 if(body.expected_revision!==0)return json({error:'项目已删除或不存在，请返回项目列表',code:'PROJECT_MISSING'},409);
 await db.prepare('INSERT INTO workshop_projects (id,owner,payload,revision,updated_at) VALUES (?,?,?,1,?)').bind(p.id,owner,data,now).run();
 return json({revision:1,updatedAt:now},201);
 }}
 if(kind==='brand'){
 if(req.method==='GET'){const r:any=await db.prepare('SELECT payload FROM workshop_brands WHERE owner=?').bind(owner).first();return json({brand:r?JSON.parse(r.payload):null});}
 if(req.method==='POST'){const b:any=await req.json();if(typeof b.name!=='string'||!/^#[0-9a-f]{6}$/i.test(b.color))return json({error:'品牌资料格式不正确'},422);await db.prepare('INSERT INTO workshop_brands (owner,payload) VALUES (?,?) ON CONFLICT(owner) DO UPDATE SET payload=excluded.payload,revision=workshop_brands.revision+1').bind(owner,JSON.stringify(b)).run();return json({saved:true});}
 }
 if(kind==='assets'&&env.BUCKET){
 if(req.method==='POST'){
 const f=(await req.formData()).get('file');if(!(f instanceof File))return json({error:'请选择图片'},422);
 if(f.size>8*1024*1024)return json({error:'当前版本单张图片上限8MB'},422);
 if(!['image/png','image/jpeg','image/webp'].includes(f.type))return json({error:'仅支持JPG、PNG、WEBP'},422);
 const bytes=new Uint8Array(await f.arrayBuffer());const png=bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71;const jpg=bytes[0]===255&&bytes[1]===216&&bytes[2]===255;const webp=String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP';
 if(!(png&&f.type==='image/png'||jpg&&f.type==='image/jpeg'||webp&&f.type==='image/webp'))return json({error:'文件内容与图片格式不符'},422);
 const assetId=crypto.randomUUID();await env.BUCKET.put(`${owner}/${assetId}`,bytes,{httpMetadata:{contentType:f.type}});return json({url:`/api/workshop/assets/${assetId}`,assetId},201);
 }
 if(req.method==='GET'&&id){const obj=await env.BUCKET.get(`${owner}/${id}`);if(!obj)return json({error:'素材不存在'},404);return new Response(obj.body,{headers:{'Content-Type':obj.httpMetadata?.contentType??'image/png','Cache-Control':'private, max-age=3600','X-Content-Type-Options':'nosniff'}});}
 }
 return json({error:'未找到操作'},404);
 }catch(error){
  if(error instanceof SceneGenerationError||error instanceof PromptWritingError)return json({error:error.message,request_id:requestId},error.status);
  return json({error:'操作未完成，请稍后重试',request_id:requestId},500); }
}
export const GET=handle;export const POST=handle;export const DELETE=handle;
