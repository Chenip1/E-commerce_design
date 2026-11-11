import type { CategoryId } from './categories';

export const skillRepository = 'https://github.com/xianyu110/ecommerce-image-skills';
type Skill = {
  id: string; title: string; group: string; scope: string; model: string;
  input: string; output: string; check: string; categories: CategoryId[];
};
export const ecommerceSkills: Skill[] = [
  {id:'amazon-white-background',title:'Amazon 白底主图',group:'主图',scope:'Amazon',model:'Sunburst',input:'商品实拍、原始标签和包装参考。',output:'纯白背景的独立商品主图。',check:'源仓库提供白底与主体占比检查。核对轮廓、包装字样和品牌标识。',categories:['snack','tech','beauty','fashion']},
  {id:'lifestyle-scene',title:'生活场景图',group:'场景',scope:'跨平台',model:'Flare',input:'商品实拍和使用情境，例如茶点、办公或户外。',output:'展示商品使用情境的场景图。',check:'核对商品比例、光线方向与实物一致性。',categories:['snack','tech','beauty','fashion']},
  {id:'model-try-on',title:'模特上身图',group:'场景',scope:'服饰电商',model:'Sunburst',input:'清晰的服装平铺或挂拍图、期望的模特姿势与背景。',output:'服装上身效果示意。',check:'核对颜色、面料、图案与版型。实际尺码与垂坠信息以实拍为准。',categories:['fashion']},
  {id:'selling-point-infographic',title:'卖点信息图',group:'详情',scope:'跨平台',model:'Sunburst',input:'商品照片和已核实的卖点、参数或标注文字。',output:'带说明文字和指示线的卖点图。',check:'逐条核对文字与数字，确保标注指向正确的产品部位。',categories:['snack','tech','beauty','fashion']},
  {id:'amazon-a-plus',title:'Amazon A+ 模块',group:'详情',scope:'Amazon',model:'Flare',input:'商品素材、品牌风格和所选模块。',output:'可裁切的 A+ 内容模块图。',check:'核对模块尺寸、安全区域和整页视觉一致性。',categories:['snack','tech','beauty','fashion']},
  {id:'size-chart',title:'尺寸与尺码图',group:'详情',scope:'跨平台',model:'Sunburst',input:'真实测量数据、单位和需要标注的位置。',output:'尺寸示意图或服装尺码表。',check:'核对每个数字及对应部位。缺少测量数据时由商家补充。',categories:['tech','fashion']},
  {id:'multi-angle-set',title:'多角度套图',group:'主图',scope:'跨平台',model:'Sunburst',input:'商品参考图及所需的正、侧、背或细节角度。',output:'多个角度的商品图，可整理为一组。',check:'比对同一 SKU 的造型、细节、光位与背景。重要结构以实拍为依据。',categories:['tech','beauty','fashion']},
  {id:'sale-banner',title:'大促 Banner',group:'营销',scope:'多电商平台',model:'Flare',input:'商品图、目标平台、活动主题及已确认的活动权益。',output:'适配活动位的横幅方案。',check:'核对活动价格、标识、尺寸和文字安全区。',categories:['snack','tech','beauty','fashion']},
  {id:'batch-background-swap',title:'批量换背景 / SKU 换色',group:'批量',scope:'跨平台',model:'Sunburst',input:'一批商品图、目标背景或颜色，及调用预算。',output:'批量处理结果和执行日志。',check:'源仓库提供断点续跑和调用上限。逐项核对变体颜色与对应 SKU。',categories:['snack','tech','beauty','fashion']},
  {id:'xiaohongshu-cover',title:'小红书封面',group:'营销',scope:'小红书',model:'Flare',input:'商品图、封面标题、内容调性和目标读者。',output:'3:4 竖版封面。',check:'缩小预览标题可读性，检查主体和文字是否会被遮挡。',categories:['snack','tech','beauty','fashion']},
  {id:'taobao-detail-long-image',title:'淘宝详情长图',group:'详情',scope:'淘宝 / 天猫 / 拼多多',model:'Flare',input:'商品图、卖点、规格和各屏内容顺序。',output:'750 px 宽的分屏详情图与切片。',check:'在手机上检查信息顺序、拼接处和切片尺寸。',categories:['snack','tech','beauty','fashion']},
  {id:'ecommerce-listing-suite',title:'电商整套图规划',group:'套图',scope:'多电商平台',model:'自动路由',input:'商品素材、目标平台和需要交付的图片清单。',output:'按平台规划并串联各类图的制作与检查。',check:'先确认交付清单，再核对商品一致性和每张图的用途。',categories:['snack','tech','beauty','fashion']},
];
