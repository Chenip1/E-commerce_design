import { categories, categoryIds, type CategoryId } from './categories';
import type { Project } from './workshop';

export const maxCreativePromptLength = 2000;
export const maxStyleTitleLength = 60;
export type StyleTemplate = {
  id: string;
  title: string;
  prompt: string;
  category?: CategoryId | null;
  createdAt?: string;
  presetDirection?: number;
};

const legacyStyles = [
  '用奶油暖色、柔和光影和清晰留白，突出商品外观与日常陪伴感。适合居家、办公桌等日常场景。',
  '用低饱和鼠尾草绿、自然光与轻盈留白，表现商品融入生活的松弛感。适合安静的桌面与周末生活场景。',
];

type TemplateProduct = Pick<Project['product'], 'name' | 'description' | 'audience'>;

export function templatePrompt({ category: id, product }: { category?: CategoryId; product?: TemplateProduct }, index: number) {
  const category = id ? categories[id] : undefined;
  const style = category ? category.directions[index].note : legacyStyles[index];
  const slots = category ? category.slots : ['上新主视觉', '商品卖点图', '促销引导图'];
  return [
    `商品名称：${product?.name.trim() || '沿用商品资料'}`,
    `核心卖点：${product?.description.trim() || '使用已核实的商品卖点'}`,
    `适用人群：${product?.audience.trim() || '沿用商品资料，未填写时保持通用'}`,
    `创作风格与场景：${style}`,
    `画面要求：依次制作${slots.join('、')}，适配 1:1 与 3:4。保留商品的真实外观和颜色。`,
    `信息约束：${category ? category.guard : '仅使用已确认的材质、规格和售价。'}`,
  ].join('\n');
}

export const presetStyleTemplates: StyleTemplate[] = categoryIds.flatMap(category =>
  categories[category].directions.map((direction, index) => ({
    id: `preset-${category}-${index}`,
    title: direction.name,
    prompt: templatePrompt({ category }, index),
    category,
    presetDirection: index,
  })),
);

export function promptForStyleTemplate(template: StyleTemplate, project: Project) {
  return template.presetDirection === undefined
    ? template.prompt
    : templatePrompt({ category: template.category ?? undefined, product: project.product }, template.presetDirection);
}
