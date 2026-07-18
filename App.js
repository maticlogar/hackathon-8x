import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GameProvider } from './lib/store';
import LanguagesScreen from './screens/LanguagesScreen';
import LevelsScreen from './screens/LevelsScreen';
import LessonScreen from './screens/LessonScreen';
import ShopScreen from './screens/ShopScreen';
import CrateScreen from './screens/CrateScreen';
import CollectionScreen from './screens/CollectionScreen';
import SurvivalScreen from './screens/SurvivalScreen';

export default function App() {
  const [screen, setScreen] = useState('languages');
  const [selectedLanguageId, setSelectedLanguageId] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [selectedCrateTypeId, setSelectedCrateTypeId] = useState(null);

  let content;
  if (screen === 'languages') {
    content = (
      <LanguagesScreen
        onSelectLanguage={(langId) => {
          setSelectedLanguageId(langId);
          setScreen('levels');
        }}
        onOpenShop={() => setScreen('shop')}
        onOpenCollection={() => setScreen('collection')}
        onOpenSurvival={() => setScreen('survival')}
      />
    );
  } else if (screen === 'levels') {
    content = (
      <LevelsScreen
        langId={selectedLanguageId}
        onBack={() => setScreen('languages')}
        onSelectLevel={(level) => {
          setSelectedLevel(level);
          setScreen('lesson');
        }}
      />
    );
  } else if (screen === 'lesson') {
    content = (
      <LessonScreen
        langId={selectedLanguageId}
        level={selectedLevel}
        onExit={() => setScreen('levels')}
        onComplete={() => setScreen('levels')}
      />
    );
  } else if (screen === 'shop') {
    content = (
      <ShopScreen
        onBack={() => setScreen('languages')}
        onBuyCrate={(crateTypeId) => {
          setSelectedCrateTypeId(crateTypeId);
          setScreen('crate');
        }}
      />
    );
  } else if (screen === 'crate') {
    content = (
      <CrateScreen
        crateTypeId={selectedCrateTypeId}
        onGoShop={() => setScreen('shop')}
        onGoCollection={() => setScreen('collection')}
      />
    );
  } else if (screen === 'collection') {
    content = <CollectionScreen onBack={() => setScreen('languages')} />;
  } else if (screen === 'survival') {
    content = <SurvivalScreen onBack={() => setScreen('languages')} />;
  }

  return (
    <GameProvider>
      <StatusBar style="light" />
      {content}
    </GameProvider>
  );
}
