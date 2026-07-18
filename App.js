import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GameProvider } from './lib/store';
import { colors } from './lib/theme';
import LanguagesScreen from './screens/LanguagesScreen';
import LevelsScreen from './screens/LevelsScreen';
import LessonScreen from './screens/LessonScreen';
import ShopScreen from './screens/ShopScreen';
import CrateScreen from './screens/CrateScreen';
import CollectionScreen from './screens/CollectionScreen';
import SurvivalScreen from './screens/SurvivalScreen';
import BottomTabBar from './components/BottomTabBar';

const TAB_BAR_SCREENS = ['languages', 'levels', 'shop', 'collection', 'survival'];

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
        onOpenShop={() => setScreen('shop')}
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
      <StatusBar style="dark" />
      <View style={styles.app}>
        <View style={styles.content}>{content}</View>
        {TAB_BAR_SCREENS.includes(screen) && (
          <BottomTabBar
            activeScreen={screen}
            onNavigate={(target) => {
              setScreen(target);
            }}
          />
        )}
      </View>
    </GameProvider>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flex: 1,
  },
});
