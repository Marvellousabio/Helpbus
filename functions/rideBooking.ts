import { RideDocumentData } from '../src/types';
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

// Function to calculate distance using Haversine formula
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Function to calculate fare based on distance and estimated time
function calculateFare(distance: number, estimatedTimeHours: number): number {
  const baseFare = 5; // Base fare in currency units
  const perKmRate = 2; // Rate per km
  const perMinuteRate = 0.5; // Rate per minute
  const estimatedTimeMinutes = estimatedTimeHours * 60;
  return baseFare + (distance * perKmRate) + (estimatedTimeMinutes * perMinuteRate);
}

export const bookRide = functions.https.onCall(async (data: any, context: any) => {
  console.log('Booking ride request received:', { data, uid: context.auth?.uid });

  if (!context.auth) {
    console.error('Unauthenticated user attempted to book ride');
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { pickup, dropoff, accessibilityOptions, scheduledTime } = data;

  if (!pickup || !dropoff) {
    console.error('Invalid location data provided');
    throw new functions.https.HttpsError('invalid-argument', 'Pickup and dropoff locations are required');
  }

  try {
    // Calculate distance and fare
    const distance = calculateDistance(
      pickup.geopoint.latitude,
      pickup.geopoint.longitude,
      dropoff.geopoint.latitude,
      dropoff.geopoint.longitude
    );
    const estimatedTimeHours = distance / 30; // Assuming average speed of 30 km/h
    const fare = calculateFare(distance, estimatedTimeHours);

    console.log(`Calculated fare: ${fare} for distance: ${distance} km, estimated time: ${estimatedTimeHours} hours`);

    const rideRef = admin.firestore().collection('rides').doc();
    // Convert accessibility options array to object format
    const accessibilityObj = {
      wheelchair: (accessibilityOptions || []).includes('wheelchair'),
      entrySide: (accessibilityOptions || []).find((opt: string) => ['left', 'right', 'either'].includes(opt)) || 'either',
      assistance: (accessibilityOptions || []).includes('assistance'),
    };

    const ride: any = {
      userId: context.auth.uid,
      pickup,
      dropoff,
      status: 'pending',
      fare,
      accessibilityOptions: accessibilityObj,
      scheduledTime: scheduledTime ? new Date(scheduledTime) : null, // Supports hybrid on-demand (null for immediate) and scheduled rides
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await rideRef.set(ride);
    console.log(`Ride created with ID: ${rideRef.id}`);

    // Vehicle accessibility matching logic
    // Filter drivers whose vehicles have all required accessibility features
    const driversRef = admin.firestore().collection('drivers');
    const availableDriversQuery = driversRef.where('availability', '==', true);
    const availableDrivers = await availableDriversQuery.get();

    let matchingDrivers: any[] = [];
    availableDrivers.forEach(doc => {
      const driverData = doc.data();
      const driverFeatures = driverData.vehicle?.accessibilityFeatures || [];

      // Check if driver has all required features
      const hasAllFeatures = (accessibilityOptions || []).every((feature: string) => {
        if (feature === 'either') return true; // 'either' means any entry side is acceptable
        return driverFeatures.includes(feature);
      });

      if (hasAllFeatures) {
        matchingDrivers.push(doc);
      }
    });

    if (matchingDrivers.length > 0) {
      // Assign the first matching driver (simple logic; can be improved)
      const driverDoc = matchingDrivers[0];
      await rideRef.update({ driverId: driverDoc.id, status: 'assigned' });
      console.log(`Driver ${driverDoc.id} assigned to ride ${rideRef.id}`);
    } else {
      console.warn('No matching drivers found for accessibility options');
      // Keep status as 'pending' or trigger notification for manual assignment
    }

    return { rideId: rideRef.id, status: 'pending' };
  } catch (error) {
    console.error('Error booking ride:', error);
    throw new functions.https.HttpsError('internal', 'Failed to book ride');
  }
});

