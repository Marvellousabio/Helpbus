import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Ride } from '../types';
import { useAccessibility } from '../context/AccessibilityContext';
import { useAuth } from '../context/AuthContext';
import { FirebaseService } from '../services/firebaseService';
import { Ionicons } from '@expo/vector-icons';

type TripHistoryScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'TripHistory'>;

interface Props {
  navigation: TripHistoryScreenNavigationProp;
}

export default function TripHistoryScreen({ navigation }: Props) {
   const { getFontSize, getColor, highContrast } = useAccessibility();
   const { user } = useAuth();
   const [trips, setTrips] = useState<Ride[]>([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;
      try {
        setError(null);
        const history = await FirebaseService.getRideHistory(user.id);
        // Convert to Ride format
        const rideHistory: Ride[] = history.map(item => ({
          id: item.rideId,
          pickup: item.pickup,
          dropoff: item.dropoff,
          driver: item.driver,
          status: 'completed',
          accessibilityOptions: { wheelchair: false, entrySide: 'either', assistance: false }, // Default, could be stored
          fare: item.fare,
          customerId: item.userId,
          createdAt: item.createdAt.toDate(),
          updatedAt: item.updatedAt.toDate(),
        }));
        setTrips(rideHistory);
      } catch (error) {
        console.error('Error fetching ride history:', error);
        setError('Failed to load ride history. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user]);

  const renderTripItem = ({ item }: { item: Ride }) => (
    <TouchableOpacity
      style={[styles.tripItem, highContrast && styles.tripItemHighContrast]}
      onPress={() => navigation.navigate('Trip', { ride: item })}
      accessibilityLabel={`View trip from ${item.pickup.address} to ${item.dropoff.address}`}
    >
      <View style={styles.tripInfo}>
        <Text style={[styles.tripRoute, { fontSize: getFontSize(16), color: getColor('#1F2937', '#000') }]}>
          {item.pickup.address} → {item.dropoff.address}
        </Text>
        <Text style={[styles.tripDate, { fontSize: getFontSize(14), color: getColor('#6B7280', '#666') }]}>
          Completed • ${item.fare?.toFixed(2)}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={{ marginTop: 16, fontSize: getFontSize(16) }}>Loading trip history...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle" size={64} color="#EF4444" />
          <Text style={[styles.emptyText, { fontSize: getFontSize(18), color: '#EF4444' }]}>
            Error Loading History
          </Text>
          <Text style={[styles.emptySubtext, { fontSize: getFontSize(14), color: getColor('#9CA3AF', '#999') }]}>
            {error}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {trips.length > 0 ? (
        <FlatList
          data={trips}
          renderItem={renderTripItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="car" size={64} color="#D1D5DB" />
          <Text style={[styles.emptyText, { fontSize: getFontSize(18), color: getColor('#6B7280', '#666') }]}>
            No trips yet
          </Text>
          <Text style={[styles.emptySubtext, { fontSize: getFontSize(14), color: getColor('#9CA3AF', '#999') }]}>
            Your completed rides will appear here
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    padding: 16,
  },
  title: {
    fontWeight: '700',
    marginBottom: 16,
  },
  listContainer: {
    paddingBottom: 16,
  },
  tripItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  tripItemHighContrast: {
    borderWidth: 2,
    borderColor: '#000',
  },
  tripInfo: {
    flex: 1,
  },
  tripRoute: {
    fontWeight: '600',
    marginBottom: 4,
  },
  tripDate: {
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    textAlign: 'center',
  },
});