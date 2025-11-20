import { Timestamp, GeoPoint } from 'firebase/firestore';

// Existing app types (unchanged for compatibility)
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'driver' | 'customer';
  profileImage?: string;
  accessibilityNeeds?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface Driver {
  id: string;
  name: string;
  photo: string;
  rating: number;
  vehicle: {
    make: string;
    model: string;
    color: string;
    plate: string;
    accessibilityFeatures: string[];
  };
  location: Location;
  eta: number;
}

export interface Ride {
  id: string;
  pickup: Location;
  dropoff: Location;
  driver?: Driver;
  status: 'pending' | 'searching' | 'assigned' | 'arriving' | 'in-progress' | 'completed';
  accessibilityOptions: {
    wheelchair: boolean;
    entrySide: 'left' | 'right' | 'either';
    assistance: boolean;
  };
  fare?: number;
  customerId: string;
  driverId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  rideId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'system';
}

export interface NotificationData {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: 'ride_request' | 'ride_accepted' | 'status_update' | 'chat_message';
  rideId?: string;
  read: boolean;
  createdAt: Date;
}

// Backend-compatible types for Firestore
export interface UserDocumentData {
  name: string;
  email: string;
  phone: string;
  profileImage?: string;
  accessibilityNeeds?: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface LocationDocumentData {
  geopoint: GeoPoint;
  address?: string;
}

export interface DriverDocumentData {
  userId: string;
  name: string;
  photo: string;
  rating: number;
  vehicle: {
    make: string;
    model: string;
    color: string;
    plate: string;
    accessibilityFeatures: string[];
  };
  location: LocationDocumentData;
  availability: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface RideDocumentData {
  userId: string;
  pickup: LocationDocumentData;
  dropoff: LocationDocumentData;
  driverId?: string;
  status: 'pending' | 'searching' | 'assigned' | 'arriving' | 'in-progress' | 'completed';
  accessibilityOptions: {
    wheelchair: boolean;
    entrySide: 'left' | 'right' | 'either';
    assistance: boolean;
  };
  fare?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Cloud Functions types
export interface BookRideRequest {
  pickup: LocationDocumentData;
  dropoff: LocationDocumentData;
  accessibilityOptions: {
    wheelchair: boolean;
    entrySide: 'left' | 'right' | 'either';
    assistance: boolean;
  };
}

export interface BookRideResponse {
  rideId: string;
  status: string;
}

export type RootStackParamList = {
  Home: undefined;
  HomeMain: undefined;
  Booking: undefined;
  BookingMain: undefined;
  Payment: { fare: number; pickup?: Location; dropoff?: Location } | undefined;
  Trip: { ride: Ride };
  TripHistory: undefined;
  TripHistoryMain: undefined;
  Profile: undefined;
  ProfileMain: undefined;
  Accessibility: undefined;
  Login: undefined;
  Signup: undefined;
  DriverDashboard: undefined;
  DriverDashboardMain: undefined;
};



