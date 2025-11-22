
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated, Alert, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, Ride, User } from '../types';
import { useAccessibility } from '../context/AccessibilityContext';
import MapViewComponent from '../components/MapViewComponent';
import DriverCard from '../components/DriverCard';
import ChatComponent from '../components/ChatComponent';
import { FirebaseService } from '../services/firebaseService';
import { useAuth } from '../context/AuthContext';

type TripScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Trip'>;
type TripScreenRouteProp = RouteProp<RootStackParamList, 'Trip'>;

interface Props {
  navigation: TripScreenNavigationProp;
  route: TripScreenRouteProp;
}

const { height } = Dimensions.get('window');

export default function TripScreen({ navigation, route }: Props) {
  const { ride: initialRide, rideId } = route.params;
  const { getFontSize, getColor, highContrast } = useAccessibility();
  const { user } = useAuth() as { user: User | null };

  const [ride, setRide] = useState<Ride | null>(initialRide || null);
  const [currentStatus, setCurrentStatus] = useState<Ride['status']>(initialRide?.status || 'searching');
  const [progress, setProgress] = useState(0);
  const [chatVisible, setChatVisible] = useState(false);
  const [mapRegion, setMapRegion] = useState<any>(
    initialRide?.pickup
      ? {
          latitude: initialRide.pickup.latitude,
          longitude: initialRide.pickup.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }
      : null
  );
  const [loading, setLoading] = useState(!initialRide && !!rideId);
  const progressAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    if (rideId && !initialRide) {
      const fetchRide = async () => {
        try {
          const fetchedRide = await FirebaseService.getRide(rideId);
          if (fetchedRide) {
            setRide(fetchedRide);
            setCurrentStatus(fetchedRide.status);
          }
        } catch (error) {
          console.error('Error fetching ride:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchRide();
    }
  }, [rideId, initialRide]);

  useEffect(() => {
    if (!ride) return;

    const handleRideUpdate = async (updatedRide: Ride | null) => {
      if (!updatedRide) return;
      const prevStatus = currentStatus;
      setRide(updatedRide);
      setCurrentStatus(updatedRide.status);
      // Update progress based on status
      switch (updatedRide.status) {
          case 'assigned': {
            setProgress(0);
            if (user?.role === 'customer' && prevStatus !== 'assigned') {
              await FirebaseService.scheduleLocalNotification('Driver Found!', `${updatedRide.driver?.name} is on the way.`);
            }
            break;
          }
          case 'arriving': {
            setProgress(33);
            if (user?.role === 'customer' && prevStatus !== 'arriving') {
              await FirebaseService.scheduleLocalNotification('Driver Arriving', 'Your driver is almost here.');
            }
            break;
          }
          case 'in-progress': {
            setProgress(66);
            if (user?.role === 'customer' && prevStatus !== 'in-progress') {
              await FirebaseService.scheduleLocalNotification('Ride Started', 'Enjoy your trip!');
            }
            break;
          }
          case 'completed': {
            setProgress(100);
            console.log('TripScreen: Status changed to completed for ride:', updatedRide.id, 'user role:', user?.role);
            if (user?.role === 'customer' && prevStatus !== 'completed') {
              await FirebaseService.scheduleLocalNotification('Ride Completed', 'Thank you for riding with us!');
            }
            // Save ride history when completed
            if (user) {
              console.log('TripScreen: Attempting to save ride history for user:', user.id, 'role:', user.role, 'rideId:', updatedRide.id);
              try {
                // Save for the current user (customer or driver)
                console.log('TripScreen: Saving for current user:', user.id);
                await FirebaseService.saveRideHistory(user.id, {
                  rideId: updatedRide.id,
                  pickup: updatedRide.pickup,
                  dropoff: updatedRide.dropoff,
                  fare: updatedRide.fare || 0,
                  driver: updatedRide.driver,
                  createdAt: updatedRide.createdAt,
                });
                console.log('TripScreen: Ride history saved successfully for user:', user.id);

                // Also save for the other party if not already
                let otherUserId: string | null = null;
                if (user.role === 'customer') {
                  // Get driver's userId from driver document
                  console.log('TripScreen: Fetching driver doc for driverId:', updatedRide.driverId);
                  const { doc, getDoc } = await import('firebase/firestore');
                  const { db } = await import('../config/firebase');
                  const driverDoc = await getDoc(doc(db, 'drivers', updatedRide.driverId!));
                  if (driverDoc.exists()) {
                    const driverData = driverDoc.data() as any;
                    otherUserId = driverData.userId;
                    console.log('TripScreen: Found driver userId:', otherUserId, 'driverData:', driverData);
                  } else {
                    console.log('TripScreen: Driver document not found for driverId:', updatedRide.driverId);
                  }
                } else {
                  otherUserId = updatedRide.customerId;
                  console.log('TripScreen: Other userId (customer):', otherUserId);
                }
                if (otherUserId && otherUserId !== user.id) {
                  console.log('TripScreen: Saving ride history for other user:', otherUserId);
                  await FirebaseService.saveRideHistory(otherUserId, {
                    rideId: updatedRide.id,
                    pickup: updatedRide.pickup,
                    dropoff: updatedRide.dropoff,
                    fare: updatedRide.fare || 0,
                    driver: updatedRide.driver,
                    createdAt: updatedRide.createdAt,
                  });
                  console.log('TripScreen: Ride history saved successfully for other user:', otherUserId);
                } else {
                  console.log('TripScreen: Skipping save for other user, otherUserId:', otherUserId, 'user.id:', user.id);
                }
              } catch (error) {
                console.error('TripScreen: Error saving ride history:', error);
              }
            } else {
              console.log('TripScreen: Skipping history save - driver:', !!updatedRide.driver, 'user:', !!user, 'user.role:', (user as User | null)?.role);
            }
            break;
          }
          case 'cancelled': {
            if (user?.role === 'customer' && prevStatus !== 'cancelled') {
              await FirebaseService.scheduleLocalNotification('Ride Cancelled', 'Your ride has been cancelled.');
            }
            break;
          }
          default:
            break;
        }
    };

    const unsubscribe = FirebaseService.listenToRideUpdates(ride.id, handleRideUpdate);

    return unsubscribe;
  }, [ride?.id, user, currentStatus]);

  useEffect(() => {
    if (!ride) return;
    const unsubscribe = FirebaseService.listenToDriverLocation(ride.id, (location) => {
      if (location && ride.driver && typeof location.latitude === 'number' && typeof location.longitude === 'number') {
        setRide((prev: Ride | null) => prev ? { ...prev, driver: { ...prev.driver!, location } } : prev);
        // Update map region to follow driver during active trip
        if (currentStatus === 'assigned' || currentStatus === 'arriving' || currentStatus === 'in-progress') {
          setMapRegion({
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        }
      }
    });

    return unsubscribe;
  }, [ride?.id, ride?.driver, currentStatus]);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const getStatusInfo = (ride: Ride) => {
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
      case 'cancelled':
        return {
          icon: 'close-circle' as const,
          title: 'Ride Cancelled',
          subtitle: 'Your ride has been cancelled',
          color: '#EF4444',
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

  const statusInfo = ride ? getStatusInfo(ride) : { icon: 'time' as const, title: 'Error', subtitle: 'Error', color: '#6B7280' };

  const handleCompleteTrip = () => {
    console.log('TripScreen: handleCompleteTrip called, user role:', user?.role);
    if (user?.role === 'driver') {
      console.log('TripScreen: Navigating to DriverDashboardMain');
      navigation.navigate('DriverDashboardMain');
    } else {
      console.log('TripScreen: Navigating to Home');
      navigation.navigate('Home');
    }
  };

  const handleStatusUpdate = async (newStatus: Ride['status']) => {
    if (!ride) return;
    try {
      await FirebaseService.updateRideStatus(ride.id, newStatus);
      // Send notification to the other party
      const recipientId = user?.role === 'driver' ? ride.customerId : ride.driverId;
      if (!recipientId) {
        console.warn('No recipient ID for notification');
        return;
      }
      const notificationType = newStatus === 'arriving' ? 'status_update' :
                                newStatus === 'in-progress' ? 'status_update' : 'status_update';
      const body = newStatus === 'arriving' ? 'Driver has arrived' :
                     newStatus === 'in-progress' ? 'Ride has started' : 'Ride completed';
      await FirebaseService.sendNotification({
        userId: recipientId,
        title: 'Ride Update',
        body,
        type: notificationType,
        rideId: ride.id,
      });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  if (loading || !ride) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={{ marginTop: 16, fontSize: getFontSize(16) }}>Loading trip details...</Text>
      </View>
    );
  }

  // Determine if the driver location should be shown
  const shouldShowDriver =
    currentStatus !== 'searching' &&
    currentStatus !== 'cancelled' &&
    currentStatus !== 'completed';

  // Pass the driver location conditionally
  const visibleDriverLocation = shouldShowDriver ? ride.driver?.location : undefined;

  return (
    <View style={styles.container}>
      {/* Map Section */}
      <View style={styles.mapContainer}>
        <MapViewComponent
          pickup={ride.pickup}
          dropoff={ride.dropoff}
          driverLocation={visibleDriverLocation}
          editable={false}
          showRoute
          region={mapRegion}
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
              Fare Breakdown
            </Text>
          </View>
          <View style={styles.fareBreakdown}>
            <View style={styles.summaryRow}>
              <Text style={[styles.breakdownLabel, { fontSize: getFontSize(14) }]}>Base Fare</Text>
              <Text style={[styles.breakdownValue, { fontSize: getFontSize(14) }]}>$5.00</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.breakdownLabel, { fontSize: getFontSize(14) }]}>Distance</Text>
              <Text style={[styles.breakdownValue, { fontSize: getFontSize(14) }]}>${((ride.fare || 0) - 5).toFixed(2)}</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={[styles.summaryLabel, { fontSize: getFontSize(16), color: getColor('#1F2937', '#000') }]}>
                Total
              </Text>
              <Text style={[styles.summaryValue, { fontSize: getFontSize(20), color: getColor('#1F2937', '#000') }]}>
                ${ride.fare?.toFixed(2)}
              </Text>
            </View>
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
          ) : user?.role === 'customer' && currentStatus !== ('completed' as Ride['status']) ? (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                console.log('TripScreen: Cancel ride button pressed, ride.id:', ride.id, 'currentStatus:', currentStatus, 'user.role:', user?.role);
                Alert.alert('Cancel Ride', 'Are you sure you want to cancel this ride?', [
                  { text: 'No', onPress: () => console.log('TripScreen: User cancelled cancel action') },
                  { text: 'Yes', onPress: async () => {
                    console.log('TripScreen: User confirmed cancel, calling cancelRide');
                    try {
                      console.log('TripScreen: Calling cancelRide for ride.id:', ride.id);
                      await FirebaseService.cancelRide(ride.id);
                      console.log('TripScreen: cancelRide successful, navigating to Booking');
                      navigation.navigate('BookingMain');
                      Alert.alert('Ride Cancelled', 'Your ride has been cancelled.');
                    } catch (error) {
                      console.log('TripScreen: cancelRide failed:', error);
                      Alert.alert('Error', 'Failed to cancel ride.');
                    }
                  }}
                ]);
              }}
              activeOpacity={0.85}
            >
              <Text style={[styles.cancelButtonText, { fontSize: getFontSize(16) }]}>Cancel Ride</Text>
            </TouchableOpacity>
          ) : user?.role === 'driver' ? (
            <View style={styles.driverButtons}>
              {currentStatus === 'assigned' && (
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => handleStatusUpdate('arriving')}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.primaryButtonText, { fontSize: getFontSize(16) }]}>Arrived</Text>
                </TouchableOpacity>
              )}
              {currentStatus === 'arriving' && (
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => handleStatusUpdate('in-progress')}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.primaryButtonText, { fontSize: getFontSize(16) }]}>Start Ride</Text>
                </TouchableOpacity>
              )}
              {currentStatus === 'in-progress' && (
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => handleStatusUpdate('completed')}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.primaryButtonText, { fontSize: getFontSize(16) }]}>Complete Ride</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.supportButtons}>
              {currentStatus === 'arriving' && (
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => handleStatusUpdate('in-progress')}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.primaryButtonText, { fontSize: getFontSize(16) }]}>Ride Started</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.supportButton}
                accessibilityLabel="Call driver"
                activeOpacity={0.85}
              >
                <Ionicons name="call" size={22} color="#4F46E5" />
                <Text style={[styles.supportButtonText, { fontSize: getFontSize(14) }]}>Call</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.supportButton}
                onPress={() => setChatVisible(true)}
                accessibilityLabel="Send message"
                activeOpacity={0.85}
              >
                <Ionicons name="chatbubble" size={22} color="#4F46E5" />
                <Text style={[styles.supportButtonText, { fontSize: getFontSize(14) }]}>Message</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.supportButton, styles.sosButton]}
                accessibilityLabel="Emergency SOS"
                activeOpacity={0.85}
              >
                <Ionicons name="alert-circle" size={22} color="#EF4444" />
                <Text style={[styles.sosButtonText, { fontSize: getFontSize(14) }]}>SOS</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <ChatComponent
        rideId={ride.id}
        isVisible={chatVisible}
        onClose={() => setChatVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
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
    padding: 16,
  },
  progressContainer: {
    marginBottom: 16,
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
    marginVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
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
    padding: 16,
    marginVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
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
  fareBreakdown: {
    marginTop: 8,
  },
  breakdownLabel: {
    color: '#6B7280',
    flex: 1,
  },
  breakdownValue: {
    color: '#374151',
    fontWeight: '600',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
    marginTop: 8,
  },
  buttonContainer: {
    marginTop: 'auto',
    paddingBottom: 16,
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: '#4F46E5',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: '#FFF',
    fontWeight: '700',
  },
  cancelButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  cancelButtonText: {
    color: '#FFF',
    fontWeight: '700',
  },
  driverButtons: {
    gap: 12,
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
