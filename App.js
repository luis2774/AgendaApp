import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import HomeScreen from "./screens/HomeScreen";
import CalendarScreen from "./screens/CalendarScreen";
import ClientsScreen from "./screens/Clients";
import SettingsScreen from "./screens/Settings";
import AppointmentDetails from "./screens/AppointmentDetails";
import { AppointmentsProvider } from "./context/AppointmentsContext";
import { ClientsProvider } from "./context/ClientsContext";
import { LanguageProvider } from "./context/LanguageContext";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// bottom tab navigator, split into three tabs : Home, Calendar, Clients
//maybe add a fourth tab for settings

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#2563eb",
        tabBarInactiveTintColor: "#6b7280",

        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Calendar") {
            iconName = focused ? "calendar" : "calendar-outline";
          } else if (route.name === "Clients") {
            iconName = focused ? "people" : "people-outline";
          } else if (route.name === "Settings") {
            iconName = focused ? "settings" : "settings-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },

        tabBarStyle: {
          height: 80, 
          paddingBottom: 25, 
          borderTopWidth: 1,
          borderTopColor: "#e5e7eb",
          paddingTop: 5,
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: "Home",
        }}
      />
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          tabBarLabel: "Calendario",
        }}
      />
      <Tab.Screen
        name="Clients"
        component={ClientsScreen}
        options={{
          tabBarLabel: "Clientes",
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: "Ajustes",
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
        name="back"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="AppointmentDetail" component={AppointmentDetails} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <ClientsProvider>
          <AppointmentsProvider>
            <NavigationContainer>
              <RootNavigator />
            </NavigationContainer>
          </AppointmentsProvider>
        </ClientsProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
