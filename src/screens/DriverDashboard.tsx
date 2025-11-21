import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { RootStackParamList, Ride } from '../types';
import { useAccessibility } from '../context/AccessibilityContext';
import { useAuth } from '../context/AuthContext';
import { FirebaseService } from '../services/firebaseService';

type DriverDashboardNavigationProp = NativeStackNavigationProp<RootStackParamList, 'DriverDashboard'>;

interface Props {
  navigation: DriverDashboardNavigationProp;
}

export default function DriverDashboard({ navigation }: Props) {
  const { getFontSize, getColor, highContrast } = useAccessibility();
  const { user } = useAuth();
  const [rideRequests, setRideRequests] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('DriverDashboard: Setting up ride requests listener');
    const unsubscribe = FirebaseService.listenToRideRequests((rides) => {
      console.log('DriverDashboard: Received ride requests:', rides.length, rides);
      setRideRequests(rides);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Update driver location in real-time
  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;

    const startLocationUpdates = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for drivers.');
        return;
      }

      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, // Update every 5 seconds
          distanceInterval: 10, // Or when moved 10 meters
        },
        (location) => {
          const { latitude, longitude } = location.coords;
          // Update driver location in Firebase
          FirebaseService.updateDriverLocation(user!.id, { latitude, longitude, address: '' });
        }
      );
    };

    if (user) {
      startLocationUpdates();
    }

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [user]);

  const handleAcceptRide = async (ride: Ride) => {
    try {
      await FirebaseService.acceptRide(ride.id, user!.id);
      // Send notification to customer
      await FirebaseService.sendNotification({
        userId: ride.customerId,
        title: 'Ride Accepted',
        body: 'Your ride request has been accepted by a driver.',
        type: 'ride_accepted',
        rideId: ride.id,
      });
      Alert.alert('Ride Accepted', 'You have accepted the ride request.');
      // Navigate to trip
      navigation.navigate('Trip', { ride: { ...ride, driverId: user!.id, status: 'assigned' } });
    } catch (error: any) {
      console.error('Error accepting ride:', error);
      const errorMessage = error.message === 'Ride is no longer available' ? 'This ride has already been accepted by another driver.' : 'Failed to accept ride. Please try again.';
      Alert.alert('Error', errorMessage);
    }
  };

  const renderRideRequest = ({ item }: { item: Ride }) => (
    <View style={[styles.rideCard, highContrast && styles.rideCardHighContrast]}>
      <View style={styles.rideInfo}>
        <View style={styles.locationRow}>
          <Ionicons name="location" size={16} color="#4F46E5" />
          <Text style={[styles.locationText, { fontSize: getFontSize(14) }]}>{item.pickup.address}</Text>
        </View>
        <View style={styles.locationRow}>
          <Ionicons name="navigate" size={16} color="#10B981" />
          <Text style={[styles.locationText, { fontSize: getFontSize(14) }]}>{item.dropoff.address}</Text>
        </View>
        <Text style={[styles.fareText, { fontSize: getFontSize(16) }]}>₦{item.fare?.toFixed(2)}</Text>
      </View>
      <TouchableOpacity
        style={styles.acceptButton}
        onPress={() => handleAcceptRide(item)}
      >
        <Text style={styles.acceptButtonText}>Accept</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading ride requests...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { fontSize: getFontSize(24) }]}>Ride Requests</Text>
        <Text style={[styles.subtitle, { fontSize: getFontSize(16) }]}>Nearby requests waiting for drivers</Text>
      </View>

      {rideRequests.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="car-outline" size={64} color="#9CA3AF" />
          <Text style={[styles.emptyText, { fontSize: getFontSize(18) }]}>No ride requests available</Text>
          <Text style={[styles.emptySubtext, { fontSize: getFontSize(14) }]}>Check back later for new requests</Text>
        </View>
      ) : (
        <FlatList
          data={rideRequests}
          renderItem={renderRideRequest}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    color: '#6B7280',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#6B7280',
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
  },
  rideCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  rideCardHighContrast: {
    borderWidth: 2,
    borderColor: '#000',
  },
  rideInfo: {
    flex: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationText: {
    marginLeft: 8,
    color: '#374151',
  },
  fareText: {
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 8,
  },
  acceptButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  acceptButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
  },
});