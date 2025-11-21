import React from 'react';
import { StyleSheet, View, Text, Dimensions, Platform } from 'react-native';
import Constants from 'expo-constants';
import { Location } from '../types';

let MapView: any, Marker: any, Polyline: any, MapContainer: any, TileLayer: any, MarkerLeaflet: any, Popup: any;
if (Platform.OS === 'web') {
  require('leaflet/dist/leaflet.css');
  import('react-leaflet').then(leaflet => {
    MapContainer = leaflet.MapContainer;
    TileLayer = leaflet.TileLayer;
    MarkerLeaflet = leaflet.Marker;
    Popup = leaflet.Popup;
  });
} else {
  import('react-native-maps').then(maps => {
    MapView = maps.default;
    Marker = maps.Marker;
    Polyline = maps.Polyline;
  });
}

interface Props {
  pickup: Location | null;
  dropoff: Location | null;
  onMapPress?: (coordinate: { latitude: number; longitude: number }) => void;
  editable?: boolean;
  driverLocation?: Location;
  showRoute?: boolean;
  onPickupPress?: () => void;
  onDropoffPress?: () => void;
  onPickupDragEnd?: (coordinate: { latitude: number; longitude: number }) => void;
  onDropoffDragEnd?: (coordinate: { latitude: number; longitude: number }) => void;
  region?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
}

const { width, height } = Dimensions.get('window');

export default function MapViewComponent({
  pickup,
  dropoff,
  onMapPress,
  editable = true,
  driverLocation,
  showRoute = false,
  onPickupPress,
  onDropoffPress,
  onPickupDragEnd,
  onDropoffDragEnd,
  region,
}: Props) {
  console.log('MapViewComponent: Platform.OS:', Platform.OS);
  console.log('MapViewComponent: Rendering map with pickup:', pickup, 'dropoff:', dropoff);

  const geoapifyApiKey = Constants.expoConfig?.extra?.firebase?.GEOAPIFY_API_KEY;
  console.log('MapViewComponent: Geoapify API Key available:', !!geoapifyApiKey);

  // ✅ Default fallback region (Lagos for testing)
  const defaultRegion = {
    latitude: pickup?.latitude || 6.5244,
    longitude: pickup?.longitude || 3.3792,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  // ✅ Safe route drawing (only when both points are valid)
  const routeCoordinates =
    pickup &&
    dropoff &&
    showRoute &&
    typeof pickup.latitude === 'number' &&
    typeof pickup.longitude === 'number' &&
    typeof dropoff.latitude === 'number' &&
    typeof dropoff.longitude === 'number'
      ? [
          { latitude: pickup.latitude, longitude: pickup.longitude },
          { latitude: dropoff.latitude, longitude: dropoff.longitude },
        ]
      : [];

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        {MapContainer && geoapifyApiKey ? (
          <MapContainer
            center={[defaultRegion.latitude, defaultRegion.longitude]}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            onClick={(e: any) => onMapPress?.({ latitude: e.latlng.lat, longitude: e.latlng.lng })}
          >
            <TileLayer
              url={`https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${geoapifyApiKey}`}
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {pickup && typeof pickup.latitude === 'number' && typeof pickup.longitude === 'number' && (
              <MarkerLeaflet position={[pickup.latitude, pickup.longitude]}>
                <Popup>Pickup Location</Popup>
              </MarkerLeaflet>
            )}
            {dropoff && typeof dropoff.latitude === 'number' && typeof dropoff.longitude === 'number' && (
              <MarkerLeaflet position={[dropoff.latitude, dropoff.longitude]}>
                <Popup>Drop-off Location</Popup>
              </MarkerLeaflet>
            )}
            {driverLocation && typeof driverLocation.latitude === 'number' && typeof driverLocation.longitude === 'number' && (
              <MarkerLeaflet position={[driverLocation.latitude, driverLocation.longitude]}>
                <Popup>Driver Location</Popup>
              </MarkerLeaflet>
            )}
          </MapContainer>
        ) : (
          <Text>Map not available - Geoapify API key required</Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={region || defaultRegion}
        showsUserLocation={Platform.OS !== 'web'}
        showsMyLocationButton={Platform.OS !== 'web'}
        loadingEnabled
        moveOnMarkerPress={false}
        onPress={(e) => onMapPress?.(e.nativeEvent.coordinate)}
      >
        {/* ✅ Pickup Marker */}
        {pickup && typeof pickup.latitude === 'number' && typeof pickup.longitude === 'number' && (
          <Marker
            coordinate={{
              latitude: pickup.latitude,
              longitude: pickup.longitude,
            }}
            title="Pickup Location"
            description={pickup.address || 'Selected pickup location'}
            draggable={editable}
            pinColor="#10B981"
            onPress={onPickupPress}
            onDragEnd={(e) => onPickupDragEnd?.(e.nativeEvent.coordinate)}
            accessibilityLabel="Pickup location marker"
          >
            <View style={styles.pickupMarker}>
              <View style={styles.markerDot} />
            </View>
          </Marker>
        )}

        {/* ✅ Drop-off Marker */}
        {dropoff && typeof dropoff.latitude === 'number' && typeof dropoff.longitude === 'number' && (
          <Marker
            coordinate={{
              latitude: dropoff.latitude,
              longitude: dropoff.longitude,
            }}
            title="Drop-off Location"
            description={dropoff.address || 'Selected drop-off location'}
            draggable={editable}
            pinColor="#EF4444"
            onPress={onDropoffPress}
            onDragEnd={(e) => onDropoffDragEnd?.(e.nativeEvent.coordinate)}
            accessibilityLabel="Drop-off location marker"
          >
            <View style={styles.dropoffMarker}>
              <View style={styles.markerSquare} />
            </View>
          </Marker>
        )}

        {/* ✅ Driver Marker */}
        {driverLocation && typeof driverLocation.latitude === 'number' && typeof driverLocation.longitude === 'number' && (
          <Marker
            coordinate={{
              latitude: driverLocation.latitude,
              longitude: driverLocation.longitude,
            }}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.driverMarker}>
              <Text style={styles.driverIcon}>🚗</Text>
            </View>
          </Marker>
        )}

        {/* ✅ Route line */}
        {routeCoordinates.length > 0 && Platform.OS !== 'web' && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#4F46E5"
            strokeWidth={4}
            lineDashPattern={Platform.OS === 'ios' ? [6] : undefined}
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
    backgroundColor: '#E5E7EB',
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
