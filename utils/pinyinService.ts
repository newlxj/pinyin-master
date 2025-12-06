import { pinyin } from 'pinyin-pro';

export const getPinyin = (char: string): string => {
  try {
    // Convert to pinyin, no tone numbers or marks for typing practice usually
    // Using 'none' to get raw letters which is standard for typing practice
    return pinyin(char, { toneType: 'none', type: 'string', v: true }); 
  } catch (e) {
    console.warn("Pinyin conversion failed for", char, e);
    return char; // Fallback
  }
};

export const getPinyinWithTone = (char: string): string => {
  try {
    return pinyin(char, { toneType: 'symbol', type: 'string' });
  } catch (e) {
    return char;
  }
}

export const splitTextToChars = (text: string): string[] => {
  // Remove non-Chinese characters and split
  return text.replace(/[^\u4e00-\u9fa5]/g, '').split('');
};

export const DEFAULT_TEXT = `
《静夜思》·李白（唐）​
床前明月光，疑是地上霜。
举头望明月，低头思故乡。
——写游子思乡的经典短诗，浅显却意境深远。
2. 《春晓》·孟浩然（唐）​
春眠不觉晓，处处闻啼鸟。
夜来风雨声，花落知多少。
——描绘春日清晨的生机与惜花之情。
3. 《登鹳雀楼》·王之涣（唐）​
白日依山尽，黄河入海流。
欲穷千里目，更上一层楼。
——气势雄浑，寓含进取精神。
4. 《黄鹤楼送孟浩然之广陵》·李白（唐）​
故人西辞黄鹤楼，烟花三月下扬州。
孤帆远影碧空尽，唯见长江天际流。
——送别友人的名篇，画面感极强。
5. 《早发白帝城》·李白（唐）​
朝辞白帝彩云间，千里江陵一日还。
两岸猿声啼不住，轻舟已过万重山。
——描写行船迅疾与江山壮美。
6. 《凉州词》·王翰（唐）​
葡萄美酒夜光杯，欲饮琵琶马上催。
醉卧沙场君莫笑，古来征战几人回。
——边塞诗的豪情与悲凉交织。
7. 《出塞》·王昌龄（唐）​
秦时明月汉时关，万里长征人未还。
但使龙城飞将在，不教胡马度阴山。
——咏史抒怀，寄望良将保国。
8. 《枫桥夜泊》·张继（唐）​
月落乌啼霜满天，江枫渔火对愁眠。
姑苏城外寒山寺，夜半钟声到客船。
——以秋夜江景写旅愁，意境幽远。
9. 《望庐山瀑布》·李白（唐）​
日照香炉生紫烟，遥看瀑布挂前川。
飞流直下三千尺，疑是银河落九天。
——夸张手法展现瀑布壮观。
10. 《赋得古原草送别》·白居易（唐）​
离离原上草，一岁一枯荣。
野火烧不尽，春风吹又生。
远芳侵古道，晴翠接荒城。
又送王孙去，萋萋满别情。`;