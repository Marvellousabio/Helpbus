import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';

type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Profile'>;

interface Props {
  navigation: ProfileScreenNavigationProp;
}

export default function ProfileScreen({ navigation }: Props) {
  const { user, logout } = useAuth();
  const { getFontSize, getColor, highContrast } = useAccessibility();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={[styles.card, highContrast && styles.cardHighContrast]}>
        {user?.profileImage ? (
          <Image source={{ uri: user.profileImage }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={48} color="#6B7280" />
          </View>
        )}

        <Text style={[styles.name, { fontSize: getFontSize(20), color: getColor('#1F2937', '#000') }]}>
          {user?.name || 'Guest'}
        </Text>
        <Text style={[styles.email, { fontSize: getFontSize(14), color: getColor('#6B7280', '#000') }]}>
          {user?.email || 'Not signed in'}
        </Text>

        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate('Settings' as any)}
          accessibilityLabel="Open profile settings"
          activeOpacity={0.85}
        >
          <Ionicons name="settings-outline" size={18} color="#4F46E5" />
          <Text style={[styles.editButtonText, { fontSize: getFontSize(14) }]}>Profile Settings</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.card, highContrast && styles.cardHighContrast]}>
        <Text style={[styles.sectionTitle, { fontSize: getFontSize(16), color: getColor('#1F2937', '#000') }]}>Account</Text>

        <TouchableOpacity style={styles.row} activeOpacity={0.8} onPress={() => navigation.navigate('Booking' as any)}>
          <Text style={[styles.rowText, { fontSize: getFontSize(15), color: getColor('#374151', '#000') }]}>Your Bookings</Text>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.row} activeOpacity={0.8} onPress={() => logout && logout()}>
          <Text style={[styles.rowText, { fontSize: getFontSize(15), color: '#EF4444' }]}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.card, highContrast && styles.cardHighContrast]}>
        <Text style={[styles.sectionTitle, { fontSize: getFontSize(16), color: getColor('#1F2937', '#000') }]}>Accessibility</Text>
        <Text style={[styles.helpText, { fontSize: getFontSize(14), color: getColor('#6B7280', '#000') }]}>Manage your accessibility preferences and contact support for additional assistance.</Text>

        <TouchableOpacity style={styles.row} activeOpacity={0.8} onPress={() => navigation.navigate('Booking' as any)}>
          <Text style={[styles.rowText, { fontSize: getFontSize(15), color: getColor('#374151', '#000') }]}>Edit Accessibility Options</Text>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHighContrast: {
    borderWidth: 2,
    borderColor: '#000',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 12,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  name: {
    fontWeight: '800',
    marginBottom: 4,
  },
  email: {
    marginBottom: 12,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  editButtonText: {
    color: '#4F46E5',
    fontWeight: '700',
  },
  sectionTitle: {
    fontWeight: '700',
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  helpText: {
    alignSelf: 'flex-start',
    marginBottom: 12,
    lineHeight: 20,
  },
  row: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  rowText: {
    fontWeight: '600',
  },
});