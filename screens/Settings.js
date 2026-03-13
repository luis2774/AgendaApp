import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../context/LanguageContext';
import { getT } from '../i18n/translations';

export default function Settings() {
  const { language, toggleLanguage } = useLanguage();
  const t = (key) => getT(key, language);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>{t('settings')}</Text>
          <Text style={styles.currentLanguage}>
            {t('currentLanguage')}: {language === 'english' ? 'English' : 'Español'}
          </Text>
          
          <Pressable 
            onPress={toggleLanguage}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed
            ]}
          >
            <Text style={styles.buttonText}>{t('changeLanguage')}</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 300,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#1f2937',
  },
  currentLanguage: {
    fontSize: 16,
    marginBottom: 20,
    color: '#6b7280',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonPressed: {
    backgroundColor: '#2563eb',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
