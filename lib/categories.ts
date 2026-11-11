export const categoryIds = ['snack', 'tech', 'beauty', 'fashion'] as const;
export type CategoryId = typeof categoryIds[number];
export const categoryProductImage = (id: CategoryId) => `./category-products/${id}.webp`;
type Trio<T> = [T, T, T];
type Direction = { name: string; note: string; colors: [string, string, string]; ink: string };
type Category = {
  name: string; english: string; number: string; promise: string; cue: string;
  slots: Trio<string>; assets: Trio<string>; fields: Trio<string>; guard: string;
  directions: [Direction, Direction]; sample: [string, string, string, Trio<string>];
  headlines: Trio<string>;
};
export const categories: Record<CategoryId, Category> = {
  snack: {
    name: '零食', english: 'FOOD & SNACKS', number: '01', promise: '先看见口感，再记住口味',
    cue: '暖色、高饱和、近景纹理。让实物特写占据视线，用短文案讲清口味与分量。',
    slots: ['食欲首图', '口感特写图', '规格场景图'], assets: ['包装与食物合照', '断面、酥屑或配料实拍', '独立包装或份量参照'],
    fields: ['口味', '配料 / 口感依据', '净含量 / 包装规格'], guard: '用实拍表现拉丝、爆浆等效果。无依据的低糖、零添加等说法请留空。',
    directions: [
      {name:'暖阳烘焙',note:'暖橙底、圆角贴纸和近景主体，适合表现烘烤与酥脆。',colors:['#ffe5ab','#ffa656','#f47836'],ink:'#4b2413'},
      {name:'午后茶点',note:'柔暖奶油色与轻道具轮廓，适合下午茶或分享场景。',colors:['#fff3d9','#f3c8a0','#b54d36'],ink:'#592b21'},
    ],
    sample:['海盐黄油曲奇','黄油香气，酥松可见','29.9',['海盐黄油','黄油与海盐','120 g / 盒']],
    headlines:['{name}','口感细节','这盒有多少？'],
  },
  tech: {
    name: '3C数码', english: 'CONSUMER TECH', number: '02', promise: '用质感抓注意，用参数做比较',
    cue: '冷色、网格与高对比。首图展示轮廓，细节图看接口，参数卡把数值分开呈现。',
    slots: ['产品主视觉', '结构细节图', '参数信息图'], assets: ['清晰的正面或 45° 产品照', '接口、按键或材质特写', '可选的规格或侧面实拍'],
    fields: ['型号', '核心参数（含单位）', '接口 / 兼容性'], guard: '参数与兼容性以实物和说明书为准。比较数据与续航条件需有依据。',
    directions: [
      {name:'深空精密',note:'暗色网格搭配电光蓝，用留白凸显硬件轮廓。',colors:['#142039','#202b50','#83d5ff'],ink:'#edf7ff'},
      {name:'冷白实验室',note:'银灰和冰蓝形成精简网格，清楚呈现结构与接口。',colors:['#eaf5ff','#bfddf1','#255eb9'],ink:'#172e52'},
    ],
    sample:['Pulse 无线耳机','折叠机身，便于收纳','299',['PULSE 01','40 mm 单元','USB-C']],
    headlines:['{name}','看清结构','关键参数'],
  },
  beauty: {
    name: '美妆', english: 'BEAUTY & CARE', number: '03', promise: '瓶身有质感，试色有依据',
    cue: '按护肤与彩妆区分调性。瓶身、质地与真实试色各有位置，成分和效果分开呈现。',
    slots: ['瓶身主视觉', '质地 / 试色图', '成分 / 妆效图'], assets: ['包装与瓶身实拍', '自然光质地或试色实拍', '成分表或真实妆效局部'],
    fields: ['色号 / 质地', '已核实的成分', '妆效 / 功效依据'], guard: '试色、质地和效果优先用实拍。功效需有依据，避免医疗化和绝对化表述。',
    directions: [
      {name:'护肤 · 柔光实验室',note:'低饱和裸粉与柔光留白，突出瓶身和质地。',colors:['#fff1ec','#ebc4ca','#9b4d66'],ink:'#492532'},
      {name:'彩妆 · 高对比试色',note:'玫红、深莓紫与高对比构图，让色号和妆效更醒目。',colors:['#5a2146','#95376b','#ffc0d4'],ink:'#fff0f4'},
    ],
    sample:['雾玫瑰唇釉','玫瑰豆沙调，柔雾妆面','89',['R03 玫瑰豆沙','角鲨烷（示例）','自然光试色示意']],
    headlines:['{name}','质地与试色','成分与妆效'],
  },
  fashion: {
    name: '服饰', english: 'FASHION & STYLE', number: '04', promise: '看见上身，也看清面料与尺码',
    cue: '低饱和环境色、留白和穿搭画册排版。主图看版型，细节图看做工，尺码图帮助选择。',
    slots: ['上身版型图', '面料工艺图', '尺码参考图'], assets: ['真人全身或半身上身照', '走线、纽扣或面料实拍', '尺码表或量体示意'],
    fields: ['版型 / 面料', '尺码实测（含单位）', '模特身高 / 体重 / 试穿码'], guard: '服装颜色以实物为准。优先提供真实上身照、面料细节和实测尺码。',
    directions: [
      {name:'城市通勤',note:'燕麦与石墨色、线框和侧栏，突出通勤版型。',colors:['#ece7df','#cfc7bb','#675847'],ink:'#302b25'},
      {name:'周末松弛',note:'低饱和灰绿与柔和留白，适合休闲穿搭。',colors:['#eff0e7','#cbd0bb','#56664c'],ink:'#2c382a'},
    ],
    sample:['燕麦色短风衣','微落肩，双排扣设计','369',['宽松版型 / 棉混纺','S 胸围 104 cm\nM 胸围 108 cm\nL 胸围 112 cm','168 cm / 54 kg / M']],
    headlines:['{name}','面料与做工','尺码参考'],
  },
};
