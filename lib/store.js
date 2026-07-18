import { createContext, useContext, useReducer } from 'react';
import wordpool from '../content/wordpool.json';
import { getLevelsForLanguage } from './lessons';

const initialState = {
  coins: 50,
  streak: 3,
  demoMode: false,
  progress: {
    sl: { unlockedLevel: 1 },
    de: { unlockedLevel: 1 },
  },
  collection: [],
};

const starsForScore = (score) => {
  if (score >= 90) return 3;
  if (score >= 70) return 2;
  if (score >= 1) return 1;
  return 0;
};

const coinsForStars = (stars) => stars * 10;

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_COINS':
      return { ...state, coins: state.coins + action.amount };

    case 'SPEND_COINS':
      return { ...state, coins: Math.max(0, state.coins - action.amount) };

    case 'COMPLETE_LEVEL': {
      const { lang, level, score } = action;
      const stars = starsForScore(score);
      const coinsAwarded = coinsForStars(stars);
      const prevLangProgress = state.progress[lang] ?? { unlockedLevel: 1 };
      return {
        ...state,
        coins: state.coins + coinsAwarded,
        progress: {
          ...state.progress,
          [lang]: {
            ...prevLangProgress,
            unlockedLevel: Math.max(prevLangProgress.unlockedLevel, level + 1),
          },
        },
      };
    }

    case 'ADD_TO_COLLECTION':
      return { ...state, collection: [...state.collection, action.item] };

    case 'ENABLE_DEMO_MODE': {
      const preFilled = wordpool.slice(0, Math.ceil(wordpool.length / 2));
      return {
        ...state,
        demoMode: true,
        coins: 9999,
        progress: {
          sl: { unlockedLevel: 99 },
          de: { unlockedLevel: 99 },
        },
        collection: preFilled,
      };
    }

    case 'DISABLE_DEMO_MODE':
      return { ...state, demoMode: false };

    default:
      return state;
  }
}

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return <GameContext.Provider value={{ state, dispatch }}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within a GameProvider');
  return ctx;
}

export { getLevelsForLanguage };
