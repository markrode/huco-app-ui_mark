import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import LibraryScreen from '../screens/LibraryScreen';
import WatchlistScreen from '../screens/WatchlistScreen';
import ProfileScreen from '../screens/ProfileScreen';
import FilmDetailsScreen from '../screens/FilmDetailsScreen';
import InboxScreen from '../screens/InboxScreen';
import SendRecommendationScreen from '../screens/SendRecommendationScreen';
import { COLORS } from '../components/theme';
import { useApp } from '../context/AppContext';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabBarIcon({ name, focused }: { name: keyof typeof Ionicons.glyphMap; focused: boolean }) {
  return <View><Ionicons name={name} size={24} color={focused ? COLORS.primary : COLORS.textMuted} /></View>;
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: COLORS.surface, borderTopColor: COLORS.border, borderTopWidth: 1, height: 80, paddingBottom: 20 },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Accueil', tabBarIcon: ({ focused }) => <TabBarIcon name={focused ? 'home' : 'home-outline'} focused={focused} /> }} />
      <Tab.Screen name="Search" component={SearchScreen} options={{ title: 'Recherche', tabBarIcon: ({ focused }) => <TabBarIcon name={focused ? 'search' : 'search-outline'} focused={focused} /> }} />
      <Tab.Screen name="Watchlist" component={WatchlistScreen} options={{ title: 'Watchlist', tabBarIcon: ({ focused }) => <TabBarIcon name={focused ? 'bookmark' : 'bookmark-outline'} focused={focused} /> }} />
      <Tab.Screen name="Library" component={LibraryScreen} options={{ title: 'Bibliothèque', tabBarIcon: ({ focused }) => <TabBarIcon name={focused ? 'library' : 'library-outline'} focused={focused} /> }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profil', tabBarIcon: ({ focused }) => <TabBarIcon name={focused ? 'person' : 'person-outline'} focused={focused} /> }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="FilmDetails" component={FilmDetailsScreen} options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="Inbox" component={InboxScreen} options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="SendRecommendation" component={SendRecommendationScreen} options={{ animation: 'slide_from_bottom' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
