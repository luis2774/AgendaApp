import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from './screens/HomeScreen';
import CalendarScreen from './screens/CalendarScreen';
import ClientsScreen from './screens/Clients';
import SettingsScreen from './screens/Settings';
import AppointmentDetails from './screens/AppointmentDetails';
import { AppointmentsProvider } from './context/AppointmentsContext';
import { ClientsProvider } from './context/ClientsContext';
import { LanguageProvider } from './context/LanguageContext';


const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// bottom tab navigator, split into three tabs : Home, Calendar, Clients
//maybe add a fourth tab for settings

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen 
        name="Calendar" 
        component={CalendarScreen}
        options={{
          tabBarLabel: 'Calendar',
        }}
      />
      <Tab.Screen 
        name="Clients" 
        component={ClientsScreen}
        options={{
          tabBarLabel: 'Clients',
        }}
      />
      <Tab.Screen 
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
        }}
        />
    </Tab.Navigator>
  );
}

// Root stack navigator for detail screens
function RootNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="MainTabs" 
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="AppointmentDetail" 
        component={AppointmentDetails}
        options={{ 
          title: 'Appointment Details'
        }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <ClientsProvider>
        <AppointmentsProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </AppointmentsProvider>
      </ClientsProvider>
    </LanguageProvider>
  );
}
