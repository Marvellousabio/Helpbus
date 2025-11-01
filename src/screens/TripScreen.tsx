
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, Ride } from '../types';
import { useAccessibility } from '../context/AccessibilityContext';
import MapViewComponent from '../components/MapViewComponent';
import DriverCard from '../components/DriverCard';

type TripScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Trip'>;
type TripScreenRouteProp = RouteProp<RootStackParamList, 'Trip'>;

interface Props {
  navigation: TripScreenNavigationProp;
  route: TripScreenRouteProp;
}

const { height } = Dimensions.get('window');

export default function TripScreen({ navigation, route }: Props) {
  const { ride } = route.params;
  const { getFontSize, getColor, highContrast } = useAccessibility();
  
  const [currentStatus, setCurrentStatus] = useState(ride.status);
  const [progress, setProgress] = useState(0);
  const progressAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    // Simulate trip progression
    const timer = setTimeout(() => {
      if (currentStatus === 'assigned') {
        setCurrentStatus('arriving');
        setProgress(33);
      } else if (currentStatus === 'arriving') {
        setCurrentStatus('in-progress');
        setProgress(66);
      } else if (currentStatus === 'in-progress') {
        setCurrentStatus('completed');
        setProgress(100);
      }
    }, 5000);

    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 800,
      useNativeDriver: false,
    }).start();

    return () => clearTimeout(timer);
  }, [currentStatus, progress]);

  const getStatusInfo = () => {
    switch (currentStatus) {
      case 'assigned':
        return {
          icon: 'car' as const,
          title: 'Driver Assigned',
          subtitle: `${ride.driver?.name} is on the way`,
          color: '#4F46E5',
        };
      case 'arriving':
        return {
          icon: 'navigate' as const,
          title: 'Driver Arriving',
          subtitle: 'Your driver is almost here',
          color: '#F59E0B',
        };
      case 'in-progress':
        return {
          icon: 'compass' as const,
          title: 'Trip in Progress',
          subtitle: 'Enjoy your ride',
          color: '#10B981',
        };
      case 'completed':
        return {
          icon: 'checkmark-circle' as const,
          title: 'Trip Completed',
          subtitle: 'Thank you for riding with us!',
          color: '#10B981',
        };
      default:
        return {
          icon: 'time' as const,
          title: 'Preparing',
          subtitle: 'Getting ready',
          color: '#6B7280',
        };
    }
  };

  const statusInfo = getStatusInfo();

  const handleCompleteTrip = () => {
    navigation.navigate('Home');
  };

  return (
    <View style={styles.container}>
      {/* Map Section */}
      <View style={styles.mapContainer}>
        <MapViewComponent
          pickup={ride.pickup}
          dropoff={ride.dropoff}
          driverLocation={ride.driver?.location}
          editable={false}
          showRoute
        />
        
        {/* Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: statusInfo.color }]}>
          <Ionicons name={statusInfo.icon} size={24} color="#FFF" />
          <View style={styles.statusText}>
            <Text style={[styles.statusTitle, { fontSize: getFontSize(16) }]}>
              {statusInfo.title}
            </Text>
            <Text style={[styles.statusSubtitle, { fontSize: getFontSize(13) }]}>
              {statusInfo.subtitle}
            </Text>
          </View>
        </View>
      </View>

      {/* Trip Details */}
      <View style={styles.detailsContainer}>
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View 
              style={[
                styles.progressFill,
                { 
                  width: progressAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%'],
                  }),
                  backgroundColor: statusInfo.color,
                },
              ]} 
            />
          </View>
          <View style={styles.progressSteps}>
            {['Assigned', 'Arriving', 'In Progress', 'Complete'].map((step, index) => (
              <Text 
                key={index}
                style={[
                  styles.progressStep,
                  { 
                    fontSize: getFontSize(11),
                    color: progress >= index * 33 ? statusInfo.color : '#9CA3AF',
                    fontWeight: progress >= index * 33 ? '700' : '500',
                  }
                ]}
              >
                {step}
              </Text>
            ))}
          </View>
        </View>

        {/* Driver Card */}
        {ride.driver && <DriverCard driver={ride.driver} />}

        {/* Accessibility Info */}
        {(ride.accessibilityOptions.wheelchair || ride.accessibilityOptions.assistance) && (
          <View style={[styles.accessibilityInfo, highContrast && styles.accessibilityInfoHighContrast]}>
            <Text style={[styles.accessibilityTitle, { fontSize: getFontSize(15), color: getColor('#1F2937', '#000') }]}>
              Your Accessibility Preferences
            </Text>
            {ride.accessibilityOptions.wheelchair && (
              <View style={styles.accessibilityItem}>
                <Ionicons name="accessibility" size={18} color="#4F46E5" />
                <Text style={[styles.accessibilityText, { fontSize: getFontSize(14) }]}>
                  Wheelchair accessible vehicle
                </Text>
              </View>
            )}
            {ride.accessibilityOptions.assistance && (
              <View style={styles.accessibilityItem}>
                <Ionicons name="hand-left" size={18} color="#4F46E5" />
                <Text style={[styles.accessibilityText, { fontSize: getFontSize(14) }]}>
                  Boarding assistance requested
                </Text>
              </View>
            )}
            <View style={styles.accessibilityItem}>
              <Ionicons name="enter" size={18} color="#4F46E5" />
              <Text style={[styles.accessibilityText, { fontSize: getFontSize(14) }]}>
                Entry side: {ride.accessibilityOptions.entrySide}
              </Text>
            </View>
          </View>
        )}

        {/* Trip Summary */}
        <View style={[styles.summaryCard, highContrast && styles.summaryCardHighContrast]}>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { fontSize: getFontSize(14), color: getColor('#6B7280', '#000') }]}>
              Fare
            </Text>
            <Text style={[styles.summaryValue, { fontSize: getFontSize(20), color: getColor('#1F2937', '#000') }]}>
              ${ride.fare?.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {currentStatus === 'completed' ? (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleCompleteTrip}
              accessibilityLabel="Return to home"
              activeOpacity={0.85}
            >
              <Text style={[styles.primaryButtonText, { fontSize: getFontSize(16) }]}>
                Done
              </Text>
              <Ionicons name="home" size={20} color="#FFF" />
            </TouchableOpacity>
          ) : (
            <View style={styles.supportButtons}>
              <TouchableOpacity
                style={styles.supportButton}
                accessibilityLabel="Call driver"
                activeOpacity={0.85}
              >
                <Ionicons name="call" size={22} color="#4F46E5" />
                <Text style={[styles.supportButtonText, { fontSize: getFontSize(14) }]}>
                  Call
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.supportButton}
                accessibilityLabel="Send message"
                activeOpacity={0.85}
              >
                <Ionicons name="chatbubble" size={22} color="#4F46E5" />
                <Text style={[styles.supportButtonText, { fontSize: getFontSize(14) }]}>
                  Message
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.supportButton, styles.sosButton]}
                accessibilityLabel="Emergency SOS"
                activeOpacity={0.85}
              >
                <Ionicons name="alert-circle" size={22} color="#EF4444" />
                <Text style={[styles.sosButtonText, { fontSize: getFontSize(14) }]}>
                  SOS
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  mapContainer: {
    height: height * 0.45,
    position: 'relative',
  },
  statusBanner: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  statusText: {
    flex: 1,
  },
  statusTitle: {
    color: '#FFF',
    fontWeight: '700',
    marginBottom: 2,
  },
  statusSubtitle: {
    color: '#FFF',
    opacity: 0.9,
  },
  detailsContainer: {
    flex: 1,
    padding: 20,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressSteps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  progressStep: {
    flex: 1,
    textAlign: 'center',
  },
  accessibilityInfo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  accessibilityInfoHighContrast: {
    borderWidth: 2,
    borderColor: '#000',
  },
  accessibilityTitle: {
    fontWeight: '700',
    marginBottom: 12,
  },
  accessibilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
    gap: 10,
  },
  accessibilityText: {
    color: '#374151',
  },
  summaryCard: {
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
  summaryCardHighContrast: {
    borderWidth: 3,
    borderColor: '#000',
  },
  supportButtonText: {
  color: '#4F46E5',
  fontWeight: '600',
 },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontWeight: '600',
  },
  summaryValue: {
    fontWeight: '800',
  },
  buttonContainer: {
    marginTop: 'auto',
    paddingBottom: 16,
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
  primaryButtonText: {
    color: '#FFF',
    fontWeight: '700',
  },
  supportButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  supportButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  sosButton: {
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FFF1F2',
  },
  sosButtonText: {
    color: '#EF4444',
    fontWeight: '700',
  },
});
