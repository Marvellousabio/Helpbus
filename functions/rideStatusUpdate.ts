import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

export const updateRideStatus = functions.https.onCall(async (data: any, context: any) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { rideId, newStatus } = data;
  const validStatuses = ['accepted', 'in_progress', 'completed', 'cancelled'];

  if (!validStatuses.includes(newStatus)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid status');
  }

  try {
    const rideRef = admin.firestore().collection('rides').doc(rideId);
    const rideDoc = await rideRef.get();

    if (!rideDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Ride not found');
    }

    const ride = rideDoc.data();

    // Check permissions: only passenger or assigned driver can update
    if (context.auth.uid !== ride?.userId && context.auth.uid !== ride?.driverId) {
      throw new functions.https.HttpsError('permission-denied', 'Not authorized to update this ride');
    }

    await rideRef.update({
      status: newStatus,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Send notifications (implement separately)

    return { success: true, status: newStatus };
  } catch (error) {
    console.error('Error updating ride status:', error);
    throw new functions.https.HttpsError('internal', 'Failed to update ride status');
  }
});
