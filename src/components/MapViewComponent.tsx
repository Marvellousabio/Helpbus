import React from 'react';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Location } from '../types';

interface Props {
  pickup: Location | null;
  dropoff: Location | null;
  onPickupChange?: (location: Location) => void;
  onDropoffChange?: (location: Location) => void;
  editable?: boolean;
  driverLocation?: Location;
  showRoute?: boolean;
}

const { width, height } = Dimensions.get('window');

export default function MapViewComponent({
  pickup,
  dropoff,
  onPickupChange,
  onDropoffChange,
  editable = true,
  driverLocation,
  showRoute = false,
}: Props) {
  const initialRegion = {
    latitude: pickup?.latitude || 37.78825,
    longitude: pickup?.longitude || -122.4324,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  const routeCoordinates = pickup && dropoff && showRoute
    ? [pickup, dropoff]
    : [];

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton
        loadingEnabled
      >
        {pickup && (
          <Marker
            coordinate={pickup}
            title="Pickup Location"
            description={pickup.address || 'Tap and hold to move'}
            pinColor="#10B981"
            draggable={editable}
            onDragEnd={(e) => onPickupChange?.(e.nativeEvent.coordinate)}
            accessibilityLabel="Pickup location marker"
          >
            <View style={styles.pickupMarker}>
              <View style={styles.markerDot} />
            </View>
          </Marker>
        )}

        {dropoff && (
          <Marker
            coordinate={dropoff}
            title="Drop-off Location"
            description={dropoff.address || 'Tap and hold to move'}
            pinColor="#EF4444"
            draggable={editable}
            onDragEnd={(e) => onDropoffChange?.(e.nativeEvent.coordinate)}
            accessibilityLabel="Drop-off location marker"
          >
            <View style={styles.dropoffMarker}>
              <View style={styles.markerSquare} />
            </View>
          </Marker>
        )}

        {driverLocation && (
          <Marker coordinate={driverLocation} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.driverMarker}>
              <Text style={styles.driverIcon}>🚗</Text>
            </View>
          </Marker>
        )}

        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#4F46E5"
            strokeWidth={4}
            lineDashPattern={[1]}
          />
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  pickupMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  markerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFF',
  },
  dropoffMarker: {
    width: 32,
    height: 32,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  markerSquare: {
    width: 12,
    height: 12,
    backgroundColor: '#FFF',
  },
  driverMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 6,
  },
  driverIcon: {
    fontSize: 20,
  },
});