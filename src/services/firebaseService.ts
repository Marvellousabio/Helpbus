import { db, functions, storage } from '../config/firebase';
import { collection, doc, getDoc, setDoc, updateDoc, query, where, getDocs, onSnapshot, addDoc, orderBy } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as Notifications from 'expo-notifications';
import { User, Driver, DriverDocumentData, Ride, Message, NotificationData, Location } from '../types';

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
    const q = query(collection(db, 'drivers'), where('availability', '==', true));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as Driver);
  }

  static async updateDriverLocation(driverId: string, location: Location): Promise<void> {
    await updateDoc(doc(db, 'drivers', driverId), {
      location,
      updatedAt: new Date(),
    });
  }

  static async getDriverByUserId(userId: string): Promise<Driver | null> {
    const q = query(collection(db, 'drivers'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Driver;
    }
    return null;
  }

  static async updateDriverProfile(userId: string, driverData: Partial<Driver>): Promise<void> {
    const driver = await this.getDriverByUserId(userId);
    if (driver) {
      await updateDoc(doc(db, 'drivers', driver.id), {
        ...driverData,
        updatedAt: new Date(),
      });
    } else {
      // Create new driver document
      const newDriver = {
        userId,
        name: driverData.name || '',
        photo: driverData.photo || '',
        rating: driverData.rating || 5.0,
        vehicle: driverData.vehicle || {
          make: '',
          model: '',
          color: '',
          plate: '',
          accessibilityFeatures: [],
        },
        location: driverData.location || { latitude: 0, longitude: 0 },
        availability: driverData.availability || false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await addDoc(collection(db, 'drivers'), newDriver);
    }
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

  static async updateRideStatus(rideId: string, status: Ride['status']): Promise<void> {
    await updateDoc(doc(db, 'rides', rideId), {
      status,
      updatedAt: new Date(),
    });
  }

  static async cancelRide(rideId: string): Promise<void> {
    await updateDoc(doc(db, 'rides', rideId), {
      status: 'cancelled',
      updatedAt: new Date(),
    });
  }

  static async getRide(rideId: string): Promise<Ride | null> {
    const rideDoc = await getDoc(doc(db, 'rides', rideId));
    if (!rideDoc.exists()) return null;

    const rideData = rideDoc.data() as Ride;
    const ride: Ride = { ...rideData, id: rideDoc.id };

    // Populate driver if driverId exists
    if (ride.driverId) {
      const driverDoc = await getDoc(doc(db, 'drivers', ride.driverId));
      if (driverDoc.exists()) {
        ride.driver = driverDoc.data() as Driver;
      }
    }

    return ride;
  }

  // Storage operations
  static async uploadProfileImage(userId: string, imageUri: string): Promise<string> {
    const response = await fetch(imageUri);
    const blob = await response.blob();
    const storageRef = ref(storage, `profileImages/${userId}`);
    await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  }

  // Real-time ride operations
  static listenToRideRequests(callback: (rides: Ride[]) => void): () => void {
    const q = query(collection(db, 'rides'), where('status', '==', 'searching'));
    return onSnapshot(q, (querySnapshot) => {
      const rides = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ride));
      callback(rides);
    });
  }

  static async acceptRide(rideId: string, driverId: string): Promise<void> {
    await updateDoc(doc(db, 'rides', rideId), {
      driverId,
      status: 'assigned',
      updatedAt: new Date(),
    });
  }

  static listenToRideUpdates(rideId: string, callback: (ride: Ride | null) => void): () => void {
    return onSnapshot(doc(db, 'rides', rideId), (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() } as Ride);
      } else {
        callback(null);
      }
    });
  }

  static listenToDriverLocation(rideId: string, callback: (location: Location | null) => void): () => void {
    // First, listen to ride to get driverId
    return onSnapshot(doc(db, 'rides', rideId), (rideDoc) => {
      if (rideDoc.exists()) {
        const ride = rideDoc.data() as Ride;
        if (ride.driverId) {
          // Listen to driver's location
          return onSnapshot(doc(db, 'drivers', ride.driverId), (driverDoc) => {
            if (driverDoc.exists()) {
              const driver = driverDoc.data() as Driver;
              callback(driver.location);
            } else {
              callback(null);
            }
          });
        } else {
          callback(null);
        }
      } else {
        callback(null);
      }
    });
  }

  // Chat operations
  static async sendMessage(rideId: string, message: Omit<Message, 'id' | 'timestamp'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'messages'), {
      ...message,
      timestamp: new Date(),
    });
    return docRef.id;
  }

  static listenToMessages(rideId: string, callback: (messages: Message[]) => void): () => void {
    const q = query(
      collection(db, 'messages'),
      where('rideId', '==', rideId),
      orderBy('timestamp', 'asc')
    );
    return onSnapshot(q, (querySnapshot) => {
      const messages = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      callback(messages);
    });
  }

  // Notification operations
  static async sendNotification(notification: Omit<NotificationData, 'id' | 'read' | 'createdAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'notifications'), {
      ...notification,
      read: false,
      createdAt: new Date(),
    });
    return docRef.id;
  }

  static listenToNotifications(userId: string, callback: (notifications: NotificationData[]) => void): () => void {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (querySnapshot) => {
      const notifications = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NotificationData));
      callback(notifications);
    });
  }

  static async markNotificationAsRead(notificationId: string): Promise<void> {
    await updateDoc(doc(db, 'notifications', notificationId), { read: true });
  }

  static async saveRideHistory(userId: string, rideData: {
    rideId: string;
    pickup: Location;
    dropoff: Location;
    fare: number;
    driver: Driver;
    createdAt: Date;
  }): Promise<void> {
    const historyRef = doc(collection(db, 'rideHistory'));
    await setDoc(historyRef, {
      userId,
      ...rideData,
      updatedAt: new Date(),
    });
  }

  static async getRideHistory(userId: string): Promise<any[]> {
    const q = query(
      collection(db, 'rideHistory'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  static async scheduleLocalNotification(title: string, body: string): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
      },
      trigger: null, // Show immediately
    });
  }
}

