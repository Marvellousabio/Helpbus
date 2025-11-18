import * as admin from 'firebase-admin';
import { bookRide } from './rideBooking';
import { updateRideStatus } from './rideStatusUpdate';

admin.initializeApp();

export { bookRide, updateRideStatus };
