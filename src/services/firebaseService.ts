import { db, functions } from '../config/firebase';
import { collection, doc, getDoc, setDoc, updateDoc, query, where, getDocs } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { User, Driver, DriverDocumentData, Ride } from '../types';

export class FirebaseService {
  // User operations
  static async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const userRef = doc(collection(db, 'users'));
    const user: User = {
      ...userData,
      id: userRef.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await setDoc(userRef, user);
    return userRef.id;
  }

  static async getUser(userId: string): Promise<User | null> {
    const userDoc = await getDoc(doc(db, 'users', userId));
    return userDoc.exists() ? (userDoc.data() as User) : null;
  }

  // Driver operations
  static async createDriver(driverData: Omit<Driver, 'id'>): Promise<string> {
    const driverRef = doc(collection(db, 'drivers'));
    const driver = {
      ...driverData,
      id: driverRef.id,
    };
    await setDoc(driverRef, driver);
    return driverRef.id;
  }

  static async getAvailableDrivers(): Promise<Driver[]> {
    const q = query(collection(db, 'drivers'), where('isAvailable', '==', true));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as Driver);
  }

  // Ride operations using Cloud Functions
  static async bookRide(rideData: {
    pickupLocation: Ride['pickup'];
    dropoffLocation: Ride['dropoff'];
    accessibilityOptions?: string[];
    scheduledTime?: Date;
  }): Promise<{ rideId: string; status: string }> {
    const bookRideFunction = httpsCallable(functions, 'bookRide');
    const result = await bookRideFunction(rideData);
    return result.data as { rideId: string; status: string };
  }

  static async updateRideStatus(rideId: string, newStatus: Ride['status']): Promise<{ success: boolean; status: string }> {
    const updateStatusFunction = httpsCallable(functions, 'updateRideStatus');
    const result = await updateStatusFunction({ rideId, newStatus });
    return result.data as { success: boolean; status: string };
  }

  static async getRide(rideId: string): Promise<Ride | null> {
    const rideDoc = await getDoc(doc(db, 'rides', rideId));
    return rideDoc.exists() ? (rideDoc.data() as Ride) : null;
  }
}
