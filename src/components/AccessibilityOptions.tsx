import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAccessibility } from '../context/AccessibilityContext';

interface Props {
  wheelchair: boolean;
  entrySide: 'left' | 'right' | 'either';
  assistance: boolean;
  onWheelchairChange: (value: boolean) => void;
  onEntrySideChange: (side: 'left' | 'right' | 'either') => void;
  onAssistanceChange: (value: boolean) => void;
}

export default function AccessibilityOptions({
  wheelchair,
  entrySide,
  assistance,
  onWheelchairChange,
  onEntrySideChange,
  onAssistanceChange,
}: Props) {
  const { getFontSize, highContrast, getColor } = useAccessibility();

  return (
    <View style={[styles.container, highContrast && styles.containerHighContrast]}>
      <Text 
        style={[styles.title, { fontSize: getFontSize(18), color: getColor('#1F2937', '#000') }]}
        accessibilityRole="header"
      >
        Accessibility Options
      </Text>

      <TouchableOpacity
        style={[styles.option, wheelchair && styles.optionActive]}
        onPress={() => onWheelchairChange(!wheelchair)}
        activeOpacity={0.7}
      >
        <Ionicons 
          name="accessibility" 
          size={24} 
          color={wheelchair ? '#FFF' : '#4F46E5'} 
        />
        <Text style={[
          styles.optionText,
          { fontSize: getFontSize(16) },
          wheelchair && styles.optionTextActive
        ]}>
          Wheelchair Accessible
        </Text>
        {wheelchair && (
          <Ionicons name="checkmark-circle" size={20} color="#FFF" style={styles.checkmark} />
        )}
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { fontSize: getFontSize(15), color: getColor('#4B5563', '#000') }]}>
          Preferred Entry Side
        </Text>
        <View style={styles.buttonGroup}>
          {(['left', 'right', 'either'] as const).map((side) => (
            <TouchableOpacity
              key={side}
              style={[
                styles.button,
                entrySide === side && styles.buttonActive,
              ]}
              onPress={() => onEntrySideChange(side)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.buttonText,
                { fontSize: getFontSize(14) },
                entrySide === side && styles.buttonTextActive
              ]}>
                {side.charAt(0).toUpperCase() + side.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.option, assistance && styles.optionActive]}
        onPress={() => onAssistanceChange(!assistance)}
        activeOpacity={0.7}
      >
        <Ionicons 
          name="hand-left" 
          size={24} 
          color={assistance ? '#FFF' : '#4F46E5'} 
        />
        <Text style={[
          styles.optionText,
          { fontSize: getFontSize(16) },
          assistance && styles.optionTextActive
        ]}>
          Need Boarding Assistance
        </Text>
        {assistance && (
          <Ionicons name="checkmark-circle" size={20} color="#FFF" style={styles.checkmark} />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
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
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  optionActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  optionText: {
    color: '#374151',
    marginLeft: 12,
    fontWeight: '600',
    flex: 1,
  },
  optionTextActive: {
    color: '#FFF',
  },
  checkmark: {
    marginLeft: 'auto',
  },
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 12,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  buttonActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  buttonText: {
    color: '#374151',
    fontWeight: '600',
  },
  buttonTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
});