
export enum AppMode {
  PRACTICE = 'PRACTICE',
  GAME = 'GAME',
}

export enum Theme {
  BLUE_BLACK = 'BLUE_BLACK',
  FOREST_DARK = 'FOREST_DARK',
  VIOLET_NIGHT = 'VIOLET_NIGHT',
}

export interface PracticeStats {
  totalChars: number;
  errors: number;
  startTime: number; // Timestamp
  wpm: number;
  lastSession: string; // ISO Date
}

export interface GameConfig {
  dropSpeed: number; // Pixels per frame
  spawnInterval: number; // Milliseconds
  maxMissed: number; // Game over threshold
  gameDuration: number; // Seconds
}

export interface GameScore {
  score: number;
  date: string;
}

export interface GameEntity {
  id: string;
  char: string;
  pinyin: string;
  displayPinyin: string;
  x: number;
  y: number;
  isDead: boolean;
  rotation: number; // For when it hits the ground
  isFallen: boolean;
}

export interface CharItem {
  char: string;
  pinyin: string;
  displayPinyin: string;
}
