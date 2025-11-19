import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Switch, Alert, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, Driver } from '../types';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { FirebaseService } from '../services/firebaseService';

type DriverSettingsNavigationProp = NativeStackNavigationProp<RootStackParamList, 'DriverSettings'>;

interface Props {
  navigation: DriverSettingsNavigationProp;
}

const ACCESSIBILITY_OPTIONS = [
  'Wheelchair Accessible',
  'Ramp Access',
  'Audio Announcements',
  'Visual Displays',
  'Assistance Available',
];

export default function DriverSettingsScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { getFontSize, getColor, highContrast } = useAccessibility();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [driverData, setDriverData] = useState<Partial<Driver>>({
    vehicle: {
      make: '',
      model: '',
      color: '',
      plate: '',
      accessibilityFeatures: [],
    },
    availability: false,
  });

  useEffect(() => {
    loadDriverData();
  }, []);

  const loadDriverData = async () => {
    if (!user) return;
    try {
      // Assuming we have a method to get driver by userId
      const driver = await FirebaseService.getDriverByUserId(user.id);
      if (driver) {
        setDriverData(driver);
      }
    } catch (error) {
      console.error('Error loading driver data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await FirebaseService.updateDriverProfile(user.id, driverData);
      Alert.alert('Success', 'Driver profile updated successfully');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const toggleAccessibilityFeature = (feature: string) => {
    const features = driverData.vehicle?.accessibilityFeatures || [];
    const updatedFeatures = features.includes(feature)
      ? features.filter(f => f !== feature)
      : [...features, feature];
    setDriverData({
      ...driverData,
      vehicle: {
        ...driverData.vehicle!,
        accessibilityFeatures: updatedFeatures,
      },
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={[styles.card, highContrast && styles.cardHighContrast]}>
        <Text style={[styles.sectionTitle, { fontSize: getFontSize(18), color: getColor('#1F2937', '#000') }]}>
          Vehicle Information
        </Text>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { fontSize: getFontSize(14), color: getColor('#374151', '#000') }]}>Make</Text>
          <TextInput
            style={[styles.input, { fontSize: getFontSize(16) }]}
            value={driverData.vehicle?.make || ''}
            onChangeText={(text) => setDriverData({
              ...driverData,
              vehicle: { ...driverData.vehicle!, make: text }
            })}
            placeholder="e.g. Toyota"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { fontSize: getFontSize(14), color: getColor('#374151', '#000') }]}>Model</Text>
          <TextInput
            style={[styles.input, { fontSize: getFontSize(16) }]}
            value={driverData.vehicle?.model || ''}
            onChangeText={(text) => setDriverData({
              ...driverData,
              vehicle: { ...driverData.vehicle!, model: text }
            })}
            placeholder="e.g. Camry"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { fontSize: getFontSize(14), color: getColor('#374151', '#000') }]}>Color</Text>
          <TextInput
            style={[styles.input, { fontSize: getFontSize(16) }]}
            value={driverData.vehicle?.color || ''}
            onChangeText={(text) => setDriverData({
              ...driverData,
              vehicle: { ...driverData.vehicle!, color: text }
            })}
            placeholder="e.g. White"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { fontSize: getFontSize(14), color: getColor('#374151', '#000') }]}>License Plate</Text>
          <TextInput
            style={[styles.input, { fontSize: getFontSize(16) }]}
            value={driverData.vehicle?.plate || ''}
            onChangeText={(text) => setDriverData({
              ...driverData,
              vehicle: { ...driverData.vehicle!, plate: text }
            })}
            placeholder="e.g. ABC-123"
            autoCapitalize="characters"
          />
        </View>
      </View>

      <View style={[styles.card, highContrast && styles.cardHighContrast]}>
        <Text style={[styles.sectionTitle, { fontSize: getFontSize(18), color: getColor('#1F2937', '#000') }]}>
          Accessibility Features
        </Text>
        <Text style={[styles.helpText, { fontSize: getFontSize(14), color: getColor('#6B7280', '#000') }]}>
          Select all features your vehicle supports
        </Text>

        {ACCESSIBILITY_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option}
            style={styles.checkboxRow}
            onPress={() => toggleAccessibilityFeature(option)}
          >
            <View style={styles.checkbox}>
              {driverData.vehicle?.accessibilityFeatures?.includes(option) && (
                <Ionicons name="checkmark" size={16} color="#4F46E5" />
              )}
            </View>
            <Text style={[styles.checkboxLabel, { fontSize: getFontSize(15), color: getColor('#374151', '#000') }]}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={[styles.card, highContrast && styles.cardHighContrast]}>
        <Text style={[styles.sectionTitle, { fontSize: getFontSize(18), color: getColor('#1F2937', '#000') }]}>
          Availability Status
        </Text>
        <View style={styles.switchRow}>
          <Text style={[styles.switchLabel, { fontSize: getFontSize(15), color: getColor('#374151', '#000') }]}>
            Available for rides
          </Text>
          <Switch
            value={driverData.availability || false}
            onValueChange={(value) => setDriverData({ ...driverData, availability: value })}
            trackColor={{ false: '#D1D5DB', true: '#4F46E5' }}
            thumbColor={driverData.availability ? '#FFFFFF' : '#F9FAFB'}
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.saveButtonText}>Save Settings</Text>
        )}
      </TouchableOpacity>
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
  sectionTitle: {
    fontWeight: '700',
    marginBottom: 16,
  },
  helpText: {
    marginBottom: 16,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#F9FAFB',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxLabel: {
    flex: 1,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  switchLabel: {
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
});