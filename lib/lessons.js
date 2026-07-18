import lessons from '../content/lessons.json';

export const LEVEL_SIZE = 4;

export const getLessonsForLanguage = (langId) => lessons.filter((l) => l.lang === langId);

// Groups a language's lessons into fixed-size levels, in file order.
export const getLevelsForLanguage = (langId) => {
  const words = getLessonsForLanguage(langId);
  const levels = [];
  for (let i = 0; i < words.length; i += LEVEL_SIZE) {
    levels.push({
      level: levels.length + 1,
      words: words.slice(i, i + LEVEL_SIZE),
    });
  }
  return levels;
};
