import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions, ActivityIndicator, TextInput, FlatList, Alert, Animated } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import MapView from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { RootStackParamList, Location as LocationType, Ride, Driver } from '../types';
import { useAccessibility } from '../context/AccessibilityContext';
import { useAuth } from '../context/AuthContext';
import MapViewComponent from '../components/MapViewComponent';
import AccessibilityOptions from '../components/AccessibilityOptions';
import DriverCard from '../components/DriverCard';
import { FirebaseService } from '../services/firebaseService';
import Constants from 'expo-constants';

interface GeoapifyResult {
  lat: number;
  lon: number;
  formatted: string;
}

type BookingScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Booking'>;

interface Props {
  navigation: BookingScreenNavigationProp;
}

const { height } = Dimensions.get('window');
const GEOAPIFY_API_KEY = Constants.expoConfig?.extra?.firebase?.GEOAPIFY_API_KEY

export default function BookingScreen({ navigation }: Props) {
  const { getFontSize, getColor, highContrast } = useAccessibility();
  const { user } = useAuth();

  // Location states
  const [selectionMode, setSelectionMode] = useState<'pickup' | 'dropoff' | null>('pickup');
  const [pickup, setPickup] = useState<LocationType | null>(null);
  const [dropoff, setDropoff] = useState<LocationType | null>(null);
  const [mapRegion, setMapRegion] = useState<any>(undefined);

  // Accessibility
  const [wheelchair, setWheelchair] = useState(false);
  const [entrySide, setEntrySide] = useState<'left' | 'right' | 'either'>('either');
  const [assistance, setAssistance] = useState(false);

  // Ride states
  const [isSearching, setIsSearching] = useState(false);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [rideId, setRideId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fare estimate
  const [distance, setDistance] = useState(0);
  const [estimatedFare, setEstimatedFare] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(0);

  // Animations
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.9))[0];

  // Search states for Geoapify
   const [searchQuery, setSearchQuery] = useState('');
   const [searchResults, setSearchResults] = useState<GeoapifyResult[]>([]);
   const [loadingSearch, setLoadingSearch] = useState(false);
   const [searchError, setSearchError] = useState<string | null>(null);
   const [recentLocations, setRecentLocations] = useState<GeoapifyResult[]>([]);
   const [nearbySuggestions, setNearbySuggestions] = useState<GeoapifyResult[]>([]);
   const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
   const searchInputRef = useRef<TextInput>(null);

    useEffect(() => {
      console.log('searchResults updated:', searchResults);
    }, [searchResults]);
  
    // Load recent locations
    useEffect(() => {
      const loadRecent = async () => {
        try {
          const stored = await AsyncStorage.getItem('recentLocations');
          if (stored) {
            setRecentLocations(JSON.parse(stored));
          }
        } catch (error) {
          console.error('Failed to load recent locations:', error);
        }
      };
      loadRecent();
    }, []);
  
    // Fetch nearby suggestions
    useEffect(() => {
      if (selectionMode && currentLocation && searchQuery.length === 0) {
        const fetchNearby = async () => {
          try {
            const url = `https://api.geoapify.com/v1/geocode/search?text=&lat=${currentLocation.latitude}&lon=${currentLocation.longitude}&limit=5&apiKey=${GEOAPIFY_API_KEY}`;
            const response = await fetch(url);
            const data = await response.json();
            const results = data.features?.map((f: any) => ({
              lat: f.geometry.coordinates[1],
              lon: f.geometry.coordinates[0],
              formatted: f.properties.formatted,
            })) || [];
            setNearbySuggestions(results);
          } catch (error) {
            console.error('Failed to fetch nearby suggestions:', error);
            setNearbySuggestions([]);
          }
        };
        fetchNearby();
      } else {
        setNearbySuggestions([]);
      }
    }, [selectionMode, currentLocation, searchQuery]);

  const isFindDriverDisabled = !pickup || !dropoff;

  // Reverse geocode for current location
  const reverseGeocode = async (coordinate: { latitude: number; longitude: number }): Promise<string> => {
    try {
      if (!coordinate) return 'Unknown location';
      const result = await Location.reverseGeocodeAsync(coordinate);
      const address = result[0];
      return address ? `${address.name || address.street || ''}, ${address.city || ''}`.trim() || 'Unknown location' : 'Unknown location';
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return 'Unknown location';
    }
  };

  // Handle typing in search box
  const handleSearch = async (query: string) => {
    console.log('handleSearch called with query:', query);
    setSearchQuery(query);
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchQuery.length >= 3) {
        if (!GEOAPIFY_API_KEY) {
          setSearchError('Search API key not configured');
          setSearchResults([]);
          setLoadingSearch(false);
          return;
        }
        console.log('API Key present:', !!GEOAPIFY_API_KEY);
        setLoadingSearch(true);
        setSearchError(null);
        const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(searchQuery)}&limit=5&apiKey=${GEOAPIFY_API_KEY}`;
        console.log('Fetching from URL:', url);
        fetch(url)
          .then(response => {
            console.log('Response status:', response.status);
            if (!response.ok) {
              throw new Error(`API request failed: ${response.status}`);
            }
            return response.json();
          })
          .then(data => {
            console.log('API data:', data);
            if (data.error) {
              throw new Error(data.error.message || 'API returned an error');
            }
            const results = data.features?.map((f: any) => ({
        lat: f.geometry.coordinates[1],
        lon: f.geometry.coordinates[0],
        formatted: f.properties.formatted,
      })) || [];
            setSearchResults(results);
            console.log('Set searchResults to:', results);
          })
          .catch(err => {
            console.error('Geoapify search error:', err);
            setSearchError(err.message || 'Failed to search locations');
            setSearchResults([]);
          })
          .finally(() => {
            setLoadingSearch(false);
          });
      } else {
        console.log('Query too short, clearing results');
        setSearchResults([]);
        setSearchError(null);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Select location from search
  const handleSelectLocation = async (item: GeoapifyResult) => {
    const coordinate = { latitude: item.lat, longitude: item.lon };
    const address = item.formatted;
    const location = { ...coordinate, address };

    if (selectionMode === 'pickup') {
      setPickup(location);
      setSelectionMode('dropoff');
    } else if (selectionMode === 'dropoff') {
      setDropoff(location);
      setSelectionMode(null);
    }

    setMapRegion({
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    });

    setSearchQuery('');
    setSearchResults([]);

    // Add to recent locations
    setRecentLocations(prev => {
      const filtered = prev.filter(r => !(r.lat === item.lat && r.lon === item.lon));
      const updated = [item, ...filtered].slice(0, 5);
      AsyncStorage.setItem('recentLocations', JSON.stringify(updated));
      return updated;
    });
  };

  // Handle map press
  const handleMapPress = async (coordinate: { latitude: number; longitude: number }) => {
    if (!coordinate) return;
    const address = await reverseGeocode(coordinate);
    Alert.alert(
      `Set as ${selectionMode}?`,
      address,
      [
        { text: 'Cancel' },
        { text: 'Yes', onPress: () => {
          if (selectionMode === 'pickup') {
            setPickup({ ...coordinate, address });
            setSelectionMode('dropoff');
          } else if (selectionMode === 'dropoff') {
            setDropoff({ ...coordinate, address });
            setSelectionMode(null);
          }
        }}
      ]
    );
  };

  // Get distance
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) return 0;
    const R = 3958.8;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  useEffect(() => {
    if (pickup && dropoff) {
      const dist = getDistance(pickup.latitude, pickup.longitude, dropoff.latitude, dropoff.longitude);
      setDistance(dist);
      setEstimatedFare(dist * 100);
      setEstimatedTime(Math.ceil(dist * 3));
    } else {
      setDistance(0);
      setEstimatedFare(0);
      setEstimatedTime(0);
    }
  }, [pickup, dropoff]);

  // Find driver: navigate to mock Payment screen first
  const handleFindDriver = () => {
    if (!pickup || !dropoff) {
      Alert.alert('Incomplete Selection', 'Please select both pickup and dropoff locations.');
      return;
    }
    navigation.navigate('Payment', { fare: estimatedFare, pickup, dropoff });
  };


  const handleStartTrip = () => {
    if (!driver || !rideId || !user) return;
    const ride: Ride = {
      id: rideId,
      pickup: pickup!,
      dropoff: dropoff!,
      driver,
      status: 'assigned',
      accessibilityOptions: { wheelchair, entrySide, assistance },
      fare: estimatedFare,
      customerId: user.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    navigation.navigate('Trip', { ride });
  };

  // Get current location
  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return Alert.alert('Permission Denied', 'Location permission is required.');
      const loc = await Location.getCurrentPositionAsync({});
      const coords = loc.coords;
      if (!coords) return;
      const address = await reverseGeocode({ latitude: coords.latitude, longitude: coords.longitude });
      setCurrentLocation(coords);
      setPickup({ latitude: coords.latitude, longitude: coords.longitude, address });
      setSelectionMode('dropoff');
      setMapRegion({ latitude: coords.latitude, longitude: coords.longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 });
      searchInputRef.current?.focus();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Unable to get current location.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        <MapViewComponent
          pickup={pickup}
          dropoff={dropoff}
          onMapPress={handleMapPress}
          onPickupDragEnd={(coord) => setPickup({ ...coord, address: pickup?.address || 'Selected location' })}
          onDropoffDragEnd={(coord) => setDropoff({ ...coord, address: dropoff?.address || 'Selected location' })}
          region={mapRegion}
          showRoute={!!pickup && !!dropoff}
        />

        {/* Search Input */}
        {selectionMode && (
          <View style={styles.searchOverlay}>
            <TextInput
              ref={searchInputRef}
              style={[styles.searchInput, { borderColor: selectionMode === 'pickup' ? '#10B981' : selectionMode === 'dropoff' ? '#EF4444' : '#D1D5DB' }]}
              placeholder={`Search ${selectionMode}`}
              value={searchQuery}
              onChangeText={handleSearch}
            />
            {loadingSearch && <ActivityIndicator size="small" color="#4F46E5" />}
            {searchError && <Text style={{ color: '#EF4444', fontSize: getFontSize(12), marginTop: 4 }}>{searchError}</Text>}
            {recentLocations.length > 0 && (
              <FlatList
                data={recentLocations}
                keyExtractor={(item) => `${item.lat}-${item.lon}`}
                renderItem={({ item }) => (
                  <TouchableOpacity onPress={() => handleSelectLocation(item)} style={styles.resultItem}>
                    <Text style={{ fontSize: getFontSize(14), color: getColor('#1F2937', '#000') }}>{item.formatted}</Text>
                  </TouchableOpacity>
                )}
                ListHeaderComponent={<Text style={{ fontSize: getFontSize(12), color: '#6B7280', marginBottom: 4 }}>Recent Locations</Text>}
              />
            )}
            {nearbySuggestions.length > 0 && searchQuery.length === 0 && (
              <FlatList
                data={nearbySuggestions}
                keyExtractor={(item) => `${item.lat}-${item.lon}`}
                renderItem={({ item }) => (
                  <TouchableOpacity onPress={() => handleSelectLocation(item)} style={styles.resultItem}>
                    <Text style={{ fontSize: getFontSize(14), color: getColor('#1F2937', '#000') }}>{item.formatted}</Text>
                  </TouchableOpacity>
                )}
                ListHeaderComponent={<Text style={{ fontSize: getFontSize(12), color: '#6B7280', marginBottom: 4 }}>Nearby Places</Text>}
              />
            )}
            {searchResults.length > 0 && (
              <FlatList
                data={searchResults}
                keyExtractor={(item) => `${item.lat}-${item.lon}`}
                renderItem={({ item }) => (
                  <TouchableOpacity onPress={() => handleSelectLocation(item)} style={styles.resultItem}>
                    <Text style={{ fontSize: getFontSize(14), color: getColor('#1F2937', '#000') }}>{item.formatted}</Text>
                    <MapView
                      style={{ height: 60, width: '100%', marginTop: 4 }}
                      region={{
                        latitude: item.lat,
                        longitude: item.lon,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                      }}
                      scrollEnabled={false}
                      zoomEnabled={false}
                    />
                  </TouchableOpacity>
                )}
                ListHeaderComponent={<Text style={{ fontSize: getFontSize(12), color: '#6B7280', marginBottom: 4 }}>Search Results</Text>}
              />
            )}
          </View>
        )}

        {/* Current location button */}
        <TouchableOpacity style={styles.currentLocationButton} onPress={getCurrentLocation}>
          <Ionicons name="locate" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.bottomSheet}>
        <View style={styles.handle} />

        <View style={styles.locationButtonsContainer}>
          <TouchableOpacity style={[styles.locationButton, pickup ? styles.locationButtonEnabled : styles.locationButtonDisabled]} onPress={getCurrentLocation}>
            <Ionicons name="location-outline" size={20} color={pickup ? "#FFF" : "#6B7280"} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{flex:1}}>
              <Text style={[styles.locationButtonText, { color: pickup ? "#FFF" : "#6B7280" }]}>{pickup ? pickup.address : 'Select Pickup Location'}</Text>
            </ScrollView>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.locationButton, dropoff ? styles.locationButtonEnabled : styles.locationButtonDisabled]} onPress={() => { if (pickup) { setSelectionMode('dropoff'); searchInputRef.current?.focus(); } }}>
            <Ionicons name="location" size={20} color={dropoff ? "#FFF" : "#6B7280"} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{flex:1}}>
              <Text style={[styles.locationButtonText, { color: dropoff ? "#FFF" : "#6B7280" }]}>{dropoff ? dropoff.address : 'Select Dropoff Location'}</Text>
            </ScrollView>
          </TouchableOpacity>
        </View>
        {/* Fare estimate */}
        <View style={[styles.fareCard, highContrast && styles.fareCardHighContrast]}>
           <View style={styles.fareRow}>
             <Text style={[styles.fareAmount, { fontSize: getFontSize(28), color: getColor('#1F2937', '#000') }]}>₦{estimatedFare.toFixed(2)}</Text>
             <View style={styles.timeBox}>
              <Ionicons name="time-outline" size={20} color="#4F46E5" />
              <Text style={{ fontSize: getFontSize(16) }}>{estimatedTime} min</Text>
            </View>
          </View>
        </View>

        {/* Accessibility options */}
        <AccessibilityOptions
          wheelchair={wheelchair} entrySide={entrySide} assistance={assistance}
          onWheelchairChange={setWheelchair} onEntrySideChange={setEntrySide} onAssistanceChange={setAssistance}
        />

        {isSearching && <ActivityIndicator size="large" color="#4F46E5" />}
        {error && <Text style={{ color: 'red', textAlign: 'center', marginVertical: 8 }}>{error}</Text>}

        {driver && (
          <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
            <DriverCard driver={driver} />
          </Animated.View>
        )}

        <View style={styles.buttonContainer}>
          {driver && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => Alert.alert('Cancel Ride', 'Are you sure you want to cancel this ride?', [
                { text: 'No' },
                { text: 'Yes', onPress: async () => {
                  try {
                    await FirebaseService.cancelRide(rideId!);
                    setDriver(null);
                    setRideId(null);
                    Alert.alert('Ride Cancelled', 'Your ride has been cancelled.');
                  } catch (error) {
                    Alert.alert('Error', 'Failed to cancel ride.');
                  }
                }}
              ])}
            >
              <Text style={styles.cancelButtonText}>Cancel Ride</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.primaryButton, isFindDriverDisabled && styles.primaryButtonDisabled]} disabled={isFindDriverDisabled} onPress={driver ? handleStartTrip : handleFindDriver}>
            <Text style={styles.primaryButtonText}>{driver ? 'Confirm Booking' : 'Find Driver'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  mapContainer: { height: height * 0.4, position: 'relative' },
  searchOverlay: { position: 'absolute', top: 16, left: 16, right: 16, zIndex: 2, backgroundColor: '#FFF', borderRadius: 8, padding: 8, maxHeight: 250 },
  searchInput: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 8, backgroundColor: '#FFF', marginBottom: 4 },
  resultItem: { padding: 8, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  currentLocationButton: { position: 'absolute', bottom: 16, right: 16, backgroundColor: '#4F46E5', width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  bottomSheet: { flex: 1, backgroundColor: '#F9FAFB', borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -20, paddingHorizontal: 20, paddingTop: 8 },
  handle: { width: 40, height: 4, backgroundColor: '#D1D5DB', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  fareCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginBottom: 12 },
  fareCardHighContrast: { borderWidth: 3, borderColor: '#000' },
  fareRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fareAmount: { fontWeight: '800' },
  timeBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEF2FF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, gap: 6 },
  buttonContainer: { paddingVertical: 20, paddingBottom: 32 },
  primaryButton: { backgroundColor: '#4F46E5', paddingVertical: 18, borderRadius: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  primaryButtonDisabled: { opacity: 0.5, backgroundColor: '#ccc' },
  primaryButtonText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  cancelButton: { backgroundColor: '#EF4444', paddingVertical: 12, borderRadius: 14, alignItems: 'center', marginBottom: 12 },
  cancelButtonText: { color: '#FFF', fontWeight: '700', fontSize: 16 },

  locationButtonsContainer: { flexDirection: 'column', marginBottom: 12 },

  locationButton: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, marginVertical: 4 },

  locationButtonEnabled: { backgroundColor: '#4F46E5' },

  locationButtonDisabled: { backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#D1D5DB' },

  locationButtonText: { fontSize: 14, marginLeft: 8, flex: 1 },

  swapButton: { alignSelf: 'center', padding: 8, marginVertical: 4 },

  driverSelectionContainer: { marginBottom: 12 },
  sectionTitle: { fontWeight: '700', marginBottom: 8 },
  driverList: { maxHeight: 300 },
  driverItem: { marginBottom: 12 },
  selectButton: { backgroundColor: '#10B981', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  selectButtonText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
});
