'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, Download, ImagePlus, Loader2, Sparkles } from 'lucide-react';
import { type Campaign, type Project, artworkImage, dataSvg, designSvg, download, promotionBackground, renderPng, zipFiles } from '../lib/workshop';
import { type FestivalPoster, drawFestivalPoster, festivalBackground, festivalPreset, festivalPrompts, productFestivalPrompts, festivals, loadFestivalArtwork, posterSize, renderFestivalPng } from '../lib/festival-poster';

import { sceneSkillId } from '../lib/scene-skill';

const promotionPrompt = '1:1 方形电商活动首图背景。浅米白与暖香槟金为主，极浅的杏红绸带和少量散焦金色亮点仅分布在画面边缘。上部和下部使用低纹理浅色留白，适合叠加深色活动文案。中央保留宽阔浅色展示区，供后续放置商品图。商业摄影棚质感。画面中不生成商品、文字、数字、价格、标识、人物或水印。';
const maxPromptLength = 4800;

type Props = {
  project: Project;
  campaign: Campaign;
  imageCache: Record<string, string>;
  onChange: (change: (campaign: Campaign) => Campaign) => void;
  uploadBadge: (file: File) => Promise<string>;
  onExport: () => void;
  onBack: () => void;
  canGenerate: boolean;
  onSettings: () => void;
};

export default function CampaignPanel({ project, campaign, imageCache, onChange, uploadBadge, onExport, onBack, canGenerate, onSettings }: Props) {
  const [thumbnail, setThumbnail] = useState(false);
  const [showSquare, setShowSquare] = useState(false);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState('');
  const lock = useRef(false);
  const { festival } = campaign;
  const promo: NonNullable<Campaign['promo']> = campaign.promo ?? {
    source: 'A', headline: campaign.sellA.trim() || project.product.name.slice(0, 16), label: '限时活动', price: '', confirmed: false,
  };
  const productName = project.category ? project.product.name : undefined;
  const poster = !showSquare && festival ? festival.drafts[festival.active] ?? festivalPreset(festival.active, productName) : undefined;
  const mainImage = artworkImage(project);
  const posterProduct = project.category ? mainImage : undefined;
  const posterBackground = poster ? festivalBackground(poster, !!project.category) : undefined;
  const examplePrompt = poster ? (project.category ? productFestivalPrompts : festivalPrompts)[poster.festival] : promotionPrompt;
  const prompt = (poster ?? promo).prompt ?? examplePrompt;
  const priceValid = /^\d{1,7}(\.\d{1,2})?$/.test(promo.price.trim()) && Number(promo.price) > 0;

  function artwork(headline: string, sceneBackground = campaign.layout.sceneBackground): Project {
    return { ...project, designs: [{ ...campaign.layout, sceneBackground, title: headline || '填写一句卖点' }] };
  }

  function editPromotion(changes: Partial<NonNullable<Campaign['promo']>>) {
    onChange(current => ({ ...current, promo: { ...(current.promo ?? promo), ...changes, confirmed: changes.confirmed ?? false } }));
  }

  function editFestival(changes: Partial<FestivalPoster>) {
    if (!poster) return;
    const node = poster.festival;
    onChange(current => {
      const draft = current.festival;
      if (!draft) return current;
      return { ...current, festival: { ...draft, drafts: {
        ...draft.drafts, [node]: { ...(draft.drafts[node] ?? festivalPreset(node, productName)), ...changes },
      } } };
    });
  }

  function editBackground(changes: { prompt?: string; background?: string }) {
    if (poster) editFestival(changes);
    else onChange(current => ({ ...current, promo: { ...(current.promo ?? promo), ...changes } }));
  }

  async function generateBackground() {
    if (!canGenerate || !prompt.trim() || lock.current) return;
    lock.current = true;
    setWorking(true);
    setMessage('正在按当前提示词生成大促底图…');
    try {
      const guard = poster
        ? project.category
          ? '请保持展台和顶部留白。商品原图、标题和优惠横幅将另行叠加，请勿在底图中绘制商品、杯子、文字或数字。'
          : '请保留雾蓝色示例马克杯和深色顶部留白。活动标题、优惠文案与横幅另行叠加，请勿在图中绘制文字或数字。'
        : '商品图、活动标识和价格会另行叠加。底图只绘制环境与装饰，保持上下文案区浅色清晰。';
      const response = await fetch(`/api/workshop/skills/${sceneSkillId}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'gpt', prompt: prompt.trim() + '\n' + guard, tall: !!poster }),
      });
      const result = await response.json() as { url?: string; error?: string };
      if (!response.ok || !result.url) throw new Error(result.error || '大促底图生成失败，请重试。');
      editBackground({ background: result.url });
      setMessage('新底图已应用到当前大促版。');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '大促底图生成失败，请重试。');
    } finally {
      lock.current = false;
      setWorking(false);
    }
  }

  const promptEditor = <div className="campaign-prompt">
    <label>大促版提示词
      <textarea rows={5} maxLength={maxPromptLength} value={prompt}
        onChange={event => editBackground({ prompt: event.target.value })} />
    </label>
    <p className="field-hint">默认底图由示例提示词生成。可调整提示词并重新生成底图，活动文案在下方单独编辑。</p>
    <div className="campaign-badge-actions">
      <button type="button" className="primary" disabled={!prompt.trim() || working}
        onClick={canGenerate ? generateBackground : onSettings}>
        <Sparkles size={15} /> {canGenerate ? '按提示词生成底图' : '配置生图服务'}
      </button>
      <button type="button" className="secondary" disabled={prompt === examplePrompt && !(poster ?? promo).background}
        onClick={() => { editBackground({ prompt: undefined, background: undefined }); setMessage('已恢复示例提示词和底图。'); }}>恢复示例</button>
    </div>
  </div>;

  function derive(source: 'A' | 'B') {
    const headline = (source === 'A' ? campaign.sellA : campaign.sellB).trim();
    if (!headline) return;
    if (campaign.promo && !window.confirm('用当前选中的首图卖点重新派生大促版？活动标识和价格会保留，需要重新确认。')) return;
    onChange(current => ({
      ...current,
      promo: { label: '限时活动', price: '', ...current.promo, source, headline, confirmed: false },
    }));
    setMessage(`已从首图 ${source} 派生大促版`);
  }

  async function handleBadge(file?: File) {
    if (!file || lock.current) return;
    lock.current = true;
    setWorking(true);
    setMessage('');
    try {
      editPromotion({ badge: await uploadBadge(file) });
      setMessage('活动标识已更新，请重新核对活动信息。');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '活动标识上传失败，请重试。');
    } finally {
      lock.current = false;
      setWorking(false);
    }
  }

  const promotionReady = poster
    ? poster.headline.trim() && poster.subtitle.trim() && poster.offer.trim()
    : promo.confirmed && priceValid && (promo.badge || promo.label.trim());
  const canExport = !!(promotionReady && project.product.confirmed &&
    project.product.name.trim() && project.product.name.length <= 33 &&
    (project.example || mainImage) && campaign.sellA.trim() && campaign.sellB.trim() &&
    campaign.sellA.trim() !== campaign.sellB.trim());

  async function exportCampaign() {
    if (!canExport || lock.current) return;
    lock.current = true;
    setWorking(true);
    setMessage('');
    try {
      const files = [
        { name: '首图_A_1-1.png', blob: await renderPng(artwork(campaign.sellA.trim()), 0) },
        { name: '首图_B_1-1.png', blob: await renderPng(artwork(campaign.sellB.trim()), 0) },
      ];
      if (poster && posterBackground) {
        files.push({ name: `大促版_${poster.festival}_9-16.png`, blob: await renderFestivalPng(poster, posterBackground, posterProduct) });
      } else {
        files.push({ name: `大促版_来自${promo.source}_1-1.png`, blob: await renderPng(artwork(promo.headline, promo.background ?? promotionBackground), 0, { ...promo, price: promo.price.trim() }) });
      }
      const name = project.name.replace(/[\\/:*?"<>|]/g, '_');
      download(await zipFiles(files), `${name}_首图与大促版.zip`);
      onExport();
      setMessage(poster ? '已打包下载两张首图和一张 9:16 大促海报。' : '已打包下载三张 900 × 900 PNG。');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '导出失败，请重试。');
    } finally {
      lock.current = false;
      setWorking(false);
    }
  }

  function preview(headline: string, label: string, withPromotion = false) {
    const promotion = withPromotion
      ? { ...promo, badge: promo.badge ? imageCache[promo.badge] ?? promo.badge : undefined }
      : undefined;
    const background = withPromotion ? promo.background ?? promotionBackground : campaign.layout.sceneBackground;
    return <div className="campaign-preview">
      <img src={dataSvg(designSvg(artwork(headline, background), 0, mainImage ? imageCache[mainImage] : undefined, promotion, background ? imageCache[background] : undefined))} alt={label} />
    </div>;
  }

  return (
    <section className="campaign-panel">
      <button className="back-btn" onClick={onBack} disabled={working}><ChevronLeft size={17} /> 返回套图编辑</button>
      <div className="campaign-heading">
        <div>
          <div className="eyebrow">CAMPAIGN STUDIO</div>
          <h1>大促换图工作台</h1>
          <p>{poster ? `切换大促节点，预览并编辑「${project.product.name}」的国潮海报。` : `为「${project.product.name}」比较两句卖点，并用示例底图开始编辑大促版。`}</p>
        </div>
        <button className="secondary" aria-pressed={thumbnail} onClick={() => setThumbnail(!thumbnail)}>
          {thumbnail ? '查看大图' : '搜索页小图预览'}
        </button>
      </div>
      {project.category && festival && campaign.promo && <button type="button" className="secondary" disabled={working}
        onClick={() => { setShowSquare(!showSquare); setMessage(''); }}>{showSquare ? '返回节日海报' : '打开已有方形稿'}</button>}
      <fieldset disabled={working} className={`campaign-grid ${poster ? 'campaign-festival-grid' : ''} ${thumbnail ? 'campaign-small' : ''}`}>
        {poster && posterBackground && <article className="panel campaign-card campaign-promo campaign-festival">
          <h2>国潮大促海报<span>{project.example ? '9:16 · 示例' : '9:16'}</span></h2>
          <div className="festival-options" role="group" aria-label="大促节点">
            {festivals.map(node => <button type="button" key={node} className="secondary" aria-pressed={poster.festival === node}
              onClick={() => onChange(current => current.festival
                ? { ...current, festival: { ...current.festival, active: node } } : current)}>{node}</button>)}
          </div>
          <FestivalPreview key={`${posterBackground}|${posterProduct??''}`} poster={poster} background={posterBackground} productSrc={posterProduct} />
          {promptEditor}
          {([
            ['headline', '海报主标题', 18],
            ['subtitle', '海报副标题', 18],
            ['offer', '优惠横幅', 34],
          ] as const).map(([key, label, maxLength]) => <label key={key}>{label}
            <input maxLength={maxLength} value={poster[key]} onChange={event => {
              editFestival({ [key]: event.target.value });
            }} />
          </label>)}
        </article>}
        {(['A', 'B'] as const).map(source => {
          const key = source === 'A' ? 'sellA' : 'sellB';
          return <article className="panel campaign-card" key={source}>
            <h2>首图 {source}<span>卖点对比</span></h2>
            {preview(campaign[key], `首图 ${source} 预览`)}
            <label>首图 {source} 卖点<input maxLength={16} value={campaign[key]} placeholder="输入一句商品卖点"
              onChange={event => {
                const value = event.target.value;
                onChange(current => ({ ...current, [key]: value }));
              }} /></label>
            {!poster && <button className="secondary" disabled={!campaign[key].trim()} onClick={() => derive(source)}>
              {`从 ${source} 派生大促版`}
            </button>}
          </article>;
        })}
        {!poster && <article className="panel campaign-card campaign-promo">
          <h2>大促版<span>源自首图 {promo.source}</span></h2>
          {preview(promo.headline, '大促版预览', true)}
          {promptEditor}
          <p className="campaign-lineage">派生时的卖点 · {promo.headline}</p>
          <div className="campaign-fields">
            <label>活动标识文字<input maxLength={10} value={promo.label} disabled={!!promo.badge}
              onChange={event => editPromotion({ label: event.target.value })} /></label>
            <label>活动价（¥）<input inputMode="decimal" maxLength={10} value={promo.price} placeholder="填写已确认活动价"
              onChange={event => editPromotion({ price: event.target.value })} /></label>
          </div>
          <div className="campaign-badge-actions">
            <label className="secondary campaign-upload">
              <ImagePlus size={15} /> {promo.badge ? '更换标识图片' : '上传标识图片'}
              <input type="file" accept="image/png,image/jpeg,image/webp" aria-label="上传活动标识图片"
                onChange={event => {
                  const file = event.currentTarget.files?.[0];
                  event.currentTarget.value = '';
                  void handleBadge(file);
                }} />
            </label>
            {promo.badge && <button className="text-button" onClick={() => editPromotion({ badge: undefined })}>改用文字标识</button>}
          </div>
          <label className="check-label">
            <input type="checkbox" checked={promo.confirmed} onChange={event => editPromotion({ confirmed: event.target.checked })} />
            我已核对活动标识和活动价
          </label>
        </article>}
      </fieldset>
      <div className="panel campaign-footer">
        <div>
          <strong>三版同包导出</strong>
          <p>{poster ? '填写两句不同的首图卖点并核对海报文案。首图为 900 × 900，海报为 1080 × 1920。' : '请填写两句不同的卖点，并核对商品资料、活动标识和活动价。每张图为 900 × 900 PNG。'}</p>
          {message && <p role="status" className="campaign-message">{message}</p>}
        </div>
        <button className="primary" disabled={!canExport || working} onClick={exportCampaign}>
          {working ? <Loader2 size={17} /> : <Download size={17} />} 导出 A / B / 大促版
        </button>
      </div>
    </section>
  );
}

function FestivalPreview({ poster, background, productSrc }: { poster: FestivalPoster; background: string; productSrc?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [artwork, setArtwork] = useState<Awaited<ReturnType<typeof loadFestivalArtwork>>>();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    loadFestivalArtwork(background, productSrc).then(loaded => {
      if (active) setArtwork(loaded);
    }, () => {
      if (active) setFailed(true);
    });
    return () => { active = false; };
  }, [background, productSrc]);

  useEffect(() => {
    if (artwork && canvas.current) drawFestivalPoster(canvas.current, artwork, poster);
  }, [artwork, poster]);

  if (failed) return <p role="status">海报加载失败，请刷新页面重试。</p>;
  return <canvas ref={canvas} className="festival-preview" width={posterSize.width} height={posterSize.height}
    role="img" aria-label={`${poster.festival}海报，${poster.headline}，${poster.subtitle}，${poster.offer}`} />;
}
