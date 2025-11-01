import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAccessibility } from '../context/AccessibilityContext';

export default function AccessibilityToggle() {
  const { largeFonts, highContrast, toggleLargeFonts, toggleHighContrast, getFontSize, getColor } = useAccessibility();

  return (
    <View style={[styles.container, highContrast && styles.containerHighContrast]}>
      <Text 
        style={[styles.title, { fontSize: getFontSize(18), color: getColor('#1F2937', '#000') }]}
        accessibilityRole="header"
      >
        Accessibility Settings
      </Text>

      <View style={styles.row}>
        <View style={styles.labelContainer}>
          <Ionicons name="text" size={24} color={getColor('#4F46E5', '#000')} />
          <Text style={[styles.label, { fontSize: getFontSize(16), color: getColor('#374151', '#000') }]}>
            Large Fonts
          </Text>
        </View>
        <Switch
          value={largeFonts}
          onValueChange={toggleLargeFonts}
          trackColor={{ false: '#D1D5DB', true: '#818CF8' }}
          thumbColor={largeFonts ? '#4F46E5' : '#F3F4F6'}
          accessibilityLabel="Toggle large fonts"
        />
      </View>

      <View style={styles.row}>
        <View style={styles.labelContainer}>
          <Ionicons name="contrast" size={24} color={getColor('#4F46E5', '#000')} />
          <Text style={[styles.label, { fontSize: getFontSize(16), color: getColor('#374151', '#000') }]}>
            High Contrast
          </Text>
        </View>
        <Switch
          value={highContrast}
          onValueChange={toggleHighContrast}
          trackColor={{ false: '#D1D5DB', true: '#818CF8' }}
          thumbColor={highContrast ? '#4F46E5' : '#F3F4F6'}
          accessibilityLabel="Toggle high contrast mode"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  containerHighContrast: {
    borderWidth: 3,
    borderColor: '#000',
  },
  title: {
    fontWeight: '700',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  label: {
    fontWeight: '500',
  },
});
