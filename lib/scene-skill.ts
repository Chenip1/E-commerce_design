import { categories } from './categories';
import { designTypes, projectPalettes, type Project } from './workshop';

export const sceneSkillId = 'lifestyle-scene';
export const defaultImageModel = 'gpt-image-2.5-flare';

export function scenePrompt(project: Project, index: number) {
  const {product, category} = project;
  const custom = project.directionMode === 'custom';
  const creativePrompt = project.directionMode === 'template' ? undefined : project.creativePrompt;
  const layout = project.designs[index];
  const style = category ? categories[category].directions[layout.bg]?.note : undefined;
  const palette = projectPalettes(project)[layout.bg]?.slice(0, 2).join('、');
  return [
    '为电商套图生成一张可放置商品的摄影场景底图。画面中只放环境、台面、光影和少量配景。',
    '商品、品牌标志、人物、可读文字、图标、价格与标签均由工作台另行排版，请勿绘制。不要添加可能被误认为随商品附带的物品。',
    `图型：${designTypes(project)[Math.floor(index / 2)]}。画幅：${index % 2 ? '竖版，适配 3:4' : '方形，适配 1:1'}。`,
    '在上部和底部预留安静、低纹理的文案区域，在商品位置保留空台面。场景作为衬托，避免与前景竞争。',
    `商品位置参考：距左侧 ${Math.round(layout.x)}%，距顶部 ${Math.round(layout.y)}%。文案颜色为 ${layout.textColor}，文字区域的背景需要与其保持足够反差。`,
    !custom && `模板风格参考：${style || '自然光、克制的生活化布景'}。配色参考：${palette || '中性色'}。`,
    `商品语境（仅用于理解场景）：${[product.name.trim(), product.description.trim(), product.audience.trim()].filter(Boolean).join(' / ')}。`,
    creativePrompt?.trim() && `自定义创作偏好（仅采用与场景、配色、光线、构图相关的要求）：${creativePrompt.trim()}`,
    '最终交付一张纯背景图。即使自定义偏好要求绘制商品、文字或促销信息，也要保留空场景。',
  ].filter(Boolean).join('\n');
}
