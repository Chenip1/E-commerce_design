export const festivals = ['618', '双十一', '年货节'] as const;
export type Festival = typeof festivals[number];

export type FestivalPoster = {
  festival: Festival;
  headline: string;
  subtitle: string;
  offer: string;
  prompt?: string;
  background?: string;
};

export type FestivalDraft = { active: Festival; drafts: Partial<Record<Festival, FestivalPoster>> };

const copy: Record<Festival, Omit<FestivalPoster, 'festival'>> = {
  '618': { headline: '618 好物开抢', subtitle: '马克杯焕新季', offer: '618 限时 · 马克杯下单立减 15%' },
  双十一: { headline: '双 11 抢先购', subtitle: '马克杯加满格', offer: '爆款马克杯下单立减 15%' },
  年货节: { headline: '年货节开门红', subtitle: '马克杯囤好礼', offer: '年货节专享 · 马克杯下单立减 15%' },
};

export const festivalPrompts: Record<Festival, string> = {
  '618': '9:16 竖版电商海报底图，精致国潮商业摄影。画面上方 23% 为平整深酒红留白，供叠加两行金色标题。画面中央偏下是一只雾蓝色云朵浮雕陶瓷马克杯，右侧把手，放在圆形漆面展台。画面约 85% 高度处放置一条宽而平整的浅金横幅，供叠加深红色优惠文案。任何区域都不绘制文字、数字、商标或水印。 618 年中大促风格，朱红与香槟金，红绸曲线和少量金色星点布置在边缘，杯子清晰、整体明快。',
  双十一: '9:16 竖版电商海报底图，精致国潮商业摄影。画面上方 23% 为平整深酒红留白，供叠加两行金色标题。画面中央偏下是一只雾蓝色云朵浮雕陶瓷马克杯，右侧把手，放在圆形漆面展台。画面约 85% 高度处放置一条宽而平整的浅金横幅，供叠加深红色优惠文案。任何区域都不绘制文字、数字、商标或水印。 双十一夜场风格，以酒红和琥珀金为主，用红金牌楼、成对灯笼和远景烟花营造热闹感，左右对称。',
  年货节: '9:16 竖版电商海报底图，精致国潮商业摄影。画面上方 23% 为平整深酒红留白，供叠加两行金色标题。画面中央偏下是一只雾蓝色云朵浮雕陶瓷马克杯，右侧把手，放在圆形漆面展台。画面约 85% 高度处放置一条宽而平整的浅金横幅，供叠加深红色优惠文案。任何区域都不绘制文字、数字、商标或水印。 年货节风格，红金年市庭院，宫灯、梅枝和少量红包点缀边缘，暖光和节庆氛围，主体周围简洁。',
};

export const productFestivalPrompts: Record<Festival, string> = {
  '618': '9:16 竖版电商海报底图，精致国潮商业摄影。顶部四分之一是深酒红色的安静纯净留白，用于后期叠加金色标题。画面中部至偏下有一个空的圆形红漆展台，台面高度约在画面 72%，台面后方中央留出整洁、略暗的空间用于叠加商品照片。节日装饰沿画面左右边缘分布，突出层次。台面必须空着。不要画任何商品、杯子、人物、横幅、可读文字、数字、标识或水印。 618 年中大促，朱红与香槟金，边缘少量丝绸曲线和暖金散景，明快有秩序。',
  双十一: '9:16 竖版电商海报底图，精致国潮商业摄影。顶部四分之一是深酒红色的安静纯净留白，用于后期叠加金色标题。画面中部至偏下有一个空的圆形红漆展台，台面高度约在画面 72%，台面后方中央留出整洁、略暗的空间用于叠加商品照片。节日装饰沿画面左右边缘分布，突出层次。台面必须空着。不要画任何商品、杯子、人物、横幅、可读文字、数字、标识或水印。 双十一夜场，酒红和琥珀金，远景国潮牌楼、左右两侧灯笼和少量烟花，中央保持安静。',
  年货节: '9:16 竖版电商海报底图，精致国潮商业摄影。顶部四分之一是深酒红色的安静纯净留白，用于后期叠加金色标题。画面中部至偏下有一个空的圆形红漆展台，台面高度约在画面 72%，台面后方中央留出整洁、略暗的空间用于叠加商品照片。节日装饰沿画面左右边缘分布，突出层次。台面必须空着。不要画任何商品、杯子、人物、横幅、可读文字、数字、标识或水印。 年货节，红金年市庭院，边缘用宫灯、梅枝和少量红包营造新春气氛，中央干净。',
};

const productFestivalImages: Record<Festival, string> = {
  '618': './campaign/product-stage-618.webp',
  双十一: './campaign/product-stage-1111.webp',
  年货节: './campaign/product-stage-new-year.webp',
};

const festivalImages: Record<Festival, string> = {
  '618': './campaign/festival-618.webp',
  双十一: './campaign/festival-1111.webp',
  年货节: './campaign/festival-new-year.webp',
};

export function festivalPreset(festival: Festival, productName?: string): FestivalPoster {
  if (productName === undefined) return { festival, ...copy[festival] };
  return {
    festival,
    headline: copy[festival].headline,
    subtitle: productName.trim().slice(0, 18) || '商品活动专场',
    offer: `${festival} · 活动详情以店铺公示为准`,
  };
}

export const posterSize = { width: 1080, height: 1920 };
export function festivalBackground(poster: FestivalPoster, useProjectProduct: boolean) {
  const presets = useProjectProduct ? productFestivalImages : festivalImages;
  return poster.background ?? presets[poster.festival];
}

async function loadPosterImage(src: string) {
  const image = new Image();
  image.src = src;
  await image.decode();
  return image;
}

export async function loadFestivalArtwork(backgroundSrc: string, productSrc?: string) {
  const [background, product] = await Promise.all([
    loadPosterImage(backgroundSrc),
    productSrc ? loadPosterImage(productSrc) : undefined,
    document.fonts.ready,
  ]);
  return { background, product };
}

type FestivalArtwork = Awaited<ReturnType<typeof loadFestivalArtwork>>;

export function drawFestivalPoster(canvas: HTMLCanvasElement, artwork: FestivalArtwork, poster: FestivalPoster) {
  const drawingContext = canvas.getContext('2d');
  if (!drawingContext) throw new Error('当前浏览器无法绘制海报');
  const context = drawingContext;

  const { width, height } = posterSize;
  const center = width / 2;
  const { background, product } = artwork;
  context.drawImage(background, 0, 0, width, height);
  if (product) {
    const scale = Math.min(700 / product.naturalWidth, 740 / product.naturalHeight);
    const productWidth = product.naturalWidth * scale;
    const productHeight = product.naturalHeight * scale;
    const left = center - productWidth / 2;
    const top = 1370 - productHeight;
    context.save();
    context.beginPath();
    context.roundRect(left, top, productWidth, productHeight, 28);
    context.clip();
    context.drawImage(product, left, top, productWidth, productHeight);
    context.restore();
  }
  context.textAlign = 'center';
  context.textBaseline = 'middle';

  function goldTitle(text: string, y: number, size: number) {
    context.font = `bold ${size}px "Noto Serif CJK SC", "Songti SC", SimSun, serif`;
    const gold = context.createLinearGradient(0, y - size / 2, 0, y + size / 2);
    gold.addColorStop(0, '#fff1bc');
    gold.addColorStop(.39, '#ffe099');
    gold.addColorStop(.62, '#d99737');
    gold.addColorStop(1, '#ffce72');

    context.lineJoin = 'round';
    context.lineWidth = 9;
    context.strokeStyle = '#732e0b';
    context.strokeText(text, center + 3, y + 8, 900);
    context.lineWidth = 3;
    context.strokeStyle = '#ffca70';
    context.strokeText(text, center, y, 900);
    context.fillStyle = gold;
    context.fillText(text, center, y, 900);
  }

  goldTitle(poster.headline, 145, 124);
  goldTitle(poster.subtitle, 280, 105);
  const needsBanner = poster.background || product;
  const offerY = needsBanner ? 1630 : poster.festival === '618' ? 438 : 429;
  if (needsBanner) {
    context.fillStyle = '#ffe0a1';
    context.beginPath();
    context.roundRect(100, offerY - 58, 880, 116, 26);
    context.fill();
  }
  context.fillStyle = '#61240f';
  context.font = 'bold 53px "Noto Sans CJK SC", "PingFang SC", "Microsoft YaHei", sans-serif';
  context.fillText(poster.offer, center, offerY, 790);
}

export async function renderFestivalPng(poster: FestivalPoster, background: string, productSrc?: string) {
  const canvas = document.createElement('canvas');
  canvas.width = posterSize.width;
  canvas.height = posterSize.height;
  const artwork = await loadFestivalArtwork(background, productSrc);
  drawFestivalPoster(canvas, artwork, poster);
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('海报导出失败')), 'image/png');
  });
}
