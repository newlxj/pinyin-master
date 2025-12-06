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

export const DEFAULT_TEXT = `天行健君子以自强不息地势坤君子以厚德载物
学而时习之不亦说乎有朋自远方来不亦乐乎
人不知而不愠不亦君子乎
温故而知新可以为师矣
三人行必有我师焉择其善者而从之其不善者而改之`;