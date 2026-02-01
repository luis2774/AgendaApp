import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import i18n from '../i18n/translations';

   

export default function Settings() {
  const currentLanguage = i18n.language;

  const handleLanguageChange = ({label,lang }) => {
    <TouchableOpacity onPress={() => i18n.changeLanguage(lang)}>




      
    </TouchableOpacity>
  }



  return (
    <View>
      <Text>Settings</Text>
    </View>
  );
}