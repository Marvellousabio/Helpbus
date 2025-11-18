import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions, ActivityIndicator, Animated } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, Location, Ride, Driver } from '../types';
import { useAccessibility } from '../context/AccessibilityContext';
import MapViewComponent from '../components/MapViewComponent';
import AccessibilityOptions from '../components/AccessibilityOptions';
import DriverCard from '../components/DriverCard';
import { FirebaseService } from '../services/firebaseService';

type BookingScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Booking'>;

interface Props {
  navigation: BookingScreenNavigationProp;
}

const { height } = Dimensions.get('window');

export default function BookingScreen({ navigation }: Props) {
  const { getFontSize, getColor, highContrast } = useAccessibility();
  
  const [pickup, setPickup] = useState<Location>({ 
    latitude: 37.78825, 
    longitude: -122.4324,
    address: '123 Market St, San Francisco'
  });
  
  const [dropoff, setDropoff] = useState<Location>({ 
    latitude: 37.79825, 
    longitude: -122.4124,
    address: '456 Mission St, San Francisco'
  });

  const [wheelchair, setWheelchair] = useState(false);
  const [entrySide, setEntrySide] = useState<'left' | 'right' | 'either'>('either');
  const [assistance, setAssistance] = useState(false);
  
  const [isSearching, setIsSearching] = useState(false);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [rideId, setRideId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.9))[0];

  const handleFindDriver = async () => {
    setIsSearching(true);
    setError(null);

    try {
      const accessibilityOptions: string[] = [];
      if (wheelchair) accessibilityOptions.push('wheelchair');
      if (assistance) accessibilityOptions.push('assistance');
      accessibilityOptions.push(entrySide);

      const result = await FirebaseService.bookRide({
        pickupLocation: pickup,
        dropoffLocation: dropoff,
        accessibilityOptions,
      });

      setRideId(result.rideId);

      // Get ride details to check for driver
      const rideDetails = await FirebaseService.getRide(result.rideId);
      if (rideDetails && rideDetails.driver) {
        setDriver(rideDetails.driver);
      }

      setIsSearching(false);

      // Animate driver card appearance
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    } catch (err: any) {
      setIsSearching(false);
      setError(err.message || 'Failed to book ride');
    }
  };

  const handleStartTrip = () => {
    if (!driver || !rideId) return;

    const ride: Ride = {
      id: rideId,
      pickup,
      dropoff,
      driver,
      status: 'assigned',
      accessibilityOptions: {
        wheelchair,
        entrySide,
        assistance,
      },
      fare: estimatedFare,
    };

    navigation.navigate('Trip', { ride });
  };

  const estimatedFare = 15.50;
  const estimatedTime = 8;

  return (
    <View style={styles.container}>
      {/* Map Section */}
      <View style={styles.mapContainer}>
        <MapViewComponent
          pickup={pickup}
          dropoff={dropoff}
          onPickupChange={setPickup}
          onDropoffChange={setDropoff}
          editable={!driver}
          showRoute
        />
        
        {/* Location Cards Overlay */}
        <View style={styles.locationCards}>
          <View style={[styles.locationCard, highContrast && styles.locationCardHighContrast]}>
            <View style={styles.locationIconGreen}>
              <View style={styles.locationDot} />
            </View>
            <View style={styles.locationInfo}>
              <Text style={[styles.locationLabel, { fontSize: getFontSize(12), color: getColor('#6B7280', '#000') }]}>
                Pickup
              </Text>
              <Text style={[styles.locationAddress, { fontSize: getFontSize(14), color: getColor('#1F2937', '#000') }]} numberOfLines={1}>
                {pickup.address}
              </Text>
            </View>
          </View>
          
          <View style={[styles.locationCard, highContrast && styles.locationCardHighContrast]}>
            <View style={styles.locationIconRed}>
              <View style={styles.locationSquare} />
            </View>
            <View style={styles.locationInfo}>
              <Text style={[styles.locationLabel, { fontSize: getFontSize(12), color: getColor('#6B7280', '#000') }]}>
                Drop-off
              </Text>
              <Text style={[styles.locationAddress, { fontSize: getFontSize(14), color: getColor('#1F2937', '#000') }]} numberOfLines={1}>
                {dropoff.address}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Bottom Sheet */}
      <ScrollView 
        style={styles.bottomSheet}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.handle} />
        
        {/* Fare Estimate */}
        {!driver && (
          <View style={[styles.fareCard, highContrast && styles.fareCardHighContrast]}>
            <View style={styles.fareRow}>
              <View>
                <Text style={[styles.fareLabel, { fontSize: getFontSize(14), color: getColor('#6B7280', '#000') }]}>
                  Estimated Fare
                </Text>
                <Text style={[styles.fareAmount, { fontSize: getFontSize(28), color: getColor('#1F2937', '#000') }]}>
                  ${estimatedFare.toFixed(2)}
                </Text>
              </View>
              <View style={styles.timeBox}>
                <Ionicons name="time-outline" size={20} color="#4F46E5" />
                <Text style={[styles.timeText, { fontSize: getFontSize(16) }]}>
                  {estimatedTime} min
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Accessibility Options */}
        <AccessibilityOptions
          wheelchair={wheelchair}
          entrySide={entrySide}
          assistance={assistance}
          onWheelchairChange={setWheelchair}
          onEntrySideChange={setEntrySide}
          onAssistanceChange={setAssistance}
        />

        {/* Searching State */}
        {isSearching && (
          <View style={styles.searchingContainer}>
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text style={[styles.searchingText, { fontSize: getFontSize(16), color: getColor('#4F46E5', '#000') }]}>
              Finding your driver...
            </Text>
            <Text style={[styles.searchingSubtext, { fontSize: getFontSize(14), color: getColor('#6B7280', '#000') }]}>
              Matching you with an accessible vehicle
            </Text>
          </View>
        )}

        {/* Error State */}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={24} color="#EF4444" />
            <Text style={[styles.errorText, { fontSize: getFontSize(16) }]}>
              {error}
            </Text>
          </View>
        )}

        {/* Driver Found */}
        {driver && (
          <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
            <View style={styles.driverFoundContainer}>
              <View style={styles.successBadge}>
                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                <Text style={[styles.successText, { fontSize: getFontSize(16) }]}>
                  Driver Found!
                </Text>
              </View>
              <DriverCard driver={driver} />
            </View>
          </Animated.View>
        )}

        {/* Action Button */}
        <View style={styles.buttonContainer}>
          {!driver ? (
            <TouchableOpacity
              style={[styles.primaryButton, isSearching && styles.primaryButtonDisabled]}
              onPress={handleFindDriver}
              disabled={isSearching}
              accessibilityLabel="Find a driver"
              activeOpacity={0.85}
            >
              <Text style={[styles.primaryButtonText, { fontSize: getFontSize(16) }]}>
                {isSearching ? 'Searching...' : 'Find Driver'}
              </Text>
              {!isSearching && <Ionicons name="search" size={20} color="#FFF" />}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleStartTrip}
              accessibilityLabel="Start your trip"
              activeOpacity={0.85}
            >
              <Text style={[styles.primaryButtonText, { fontSize: getFontSize(16) }]}>
                Confirm Booking
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#FFF" />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  mapContainer: {
    height: height * 0.4,
    position: 'relative',
  },
  locationCards: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    gap: 8,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  locationCardHighContrast: {
    borderWidth: 2,
    borderColor: '#000',
  },
  locationIconGreen: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationIconRed: {
    width: 32,
    height: 32,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFF',
  },
  locationSquare: {
    width: 10,
    height: 10,
    backgroundColor: '#FFF',
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontWeight: '600',
    marginBottom: 2,
  },
  locationAddress: {
    fontWeight: '400',
  },
  bottomSheet: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  fareCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  fareCardHighContrast: {
    borderWidth: 3,
    borderColor: '#000',
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fareLabel: {
    fontWeight: '600',
    marginBottom: 4,
  },
  fareAmount: {
    fontWeight: '800',
  },
  timeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  timeText: {
    color: '#4F46E5',
    fontWeight: '700',
  },
  searchingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  searchingText: {
    fontWeight: '700',
    marginTop: 16,
  },
  searchingSubtext: {
    marginTop: 4,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  errorText: {
    color: '#EF4444',
    fontWeight: '600',
  },
  driverFoundContainer: {
    marginVertical: 8,
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  successText: {
    color: '#10B981',
    fontWeight: '700',
  },
  buttonContainer: {
    paddingVertical: 20,
    paddingBottom: 32,
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: '#4F46E5',
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0.1,
  },
  primaryButtonText: {
    color: '#FFF',
    fontWeight: '700',
  },
});