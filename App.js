import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GameProvider } from './lib/store';
import { colors, typography } from './lib/theme';
import LanguagesScreen from './screens/LanguagesScreen';
import LevelsScreen from './screens/LevelsScreen';
import LessonScreen from './screens/LessonScreen';

function PlaceholderScreen({ label }) {
  return (
    <View style={styles.placeholder}>
      <Text style={typography.heading}>{label}</Text>
      <Text style={typography.caption}>Coming in a later build step</Text>
    </View>
  );
}

export default function App() {
  const [screen, setScreen] = useState('languages');
  const [selectedLanguageId, setSelectedLanguageId] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(null);

  let content;
  if (screen === 'languages') {
    content = (
      <LanguagesScreen
        onSelectLanguage={(langId) => {
          setSelectedLanguageId(langId);
          setScreen('levels');
        }}
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
    content = <PlaceholderScreen label="Shop" />;
  } else if (screen === 'crate') {
    content = <PlaceholderScreen label="Crate" />;
  } else if (screen === 'collection') {
    content = <PlaceholderScreen label="Collection" />;
  } else if (screen === 'survival') {
    content = <PlaceholderScreen label="Survival" />;
  }

  return (
    <GameProvider>
      <StatusBar style="light" />
      {content}
    </GameProvider>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});
