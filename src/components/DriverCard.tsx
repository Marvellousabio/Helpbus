import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Driver } from '../types';
import { useAccessibility } from '../context/AccessibilityContext';

interface Props {
  driver: Driver;
}

export default function DriverCard({ driver }: Props) {
  const { getFontSize, getColor } = useAccessibility();

  return (
    <View 
      style={styles.container}
      accessibilityLabel={`Driver ${driver.name}, rated ${driver.rating} stars, arriving in ${driver.eta} minutes in a ${driver.vehicle.color} ${driver.vehicle.make}`}
    >
      <Image 
        source={{ uri: driver.photo }} 
        style={styles.photo}
        accessibilityLabel={`Photo of driver ${driver.name}`}
      />
      
      <View style={styles.infoContainer}>
        <Text style={[styles.name, { fontSize: getFontSize(18) }]}>{driver.name}</Text>
        
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={16} color="#F59E0B" />
          <Text style={[styles.ratingText, { fontSize: getFontSize(14) }]}>
            {driver.rating.toFixed(1)}
          </Text>
        </View>
        
        <Text style={[styles.vehicle, { fontSize: getFontSize(14) }]}>
          {driver.vehicle.color} {driver.vehicle.make} {driver.vehicle.model}
        </Text>
        <View style={styles.plateContainer}>
          <Text style={[styles.plate, { fontSize: getFontSize(13) }]}>
            {driver.vehicle.plate}
          </Text>
        </View>
      </View>

      <View style={styles.etaContainer}>
        <Text style={[styles.etaNumber, { fontSize: getFontSize(28) }]}>
          {driver.eta}
        </Text>
        <Text style={[styles.etaLabel, { fontSize: getFontSize(12) }]}>min</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
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
  photo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  ratingText: {
    color: '#6B7280',
    marginLeft: 4,
    fontWeight: '600',
  },
  vehicle: {
    color: '#4B5563',
    marginBottom: 4,
  },
  plateContainer: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  plate: {
    color: '#1F2937',
    fontWeight: '700',
    letterSpacing: 1,
  },
  etaContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingHorizontal: 20,
    minWidth: 70,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  etaNumber: {
    fontWeight: '800',
    color: '#FFF',
  },
  etaLabel: {
    color: '#E0E7FF',
    fontWeight: '600',
  },
});
