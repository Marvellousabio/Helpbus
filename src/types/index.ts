export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  profileImage?: string;
  accessibilityNeeds?: string[];
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
}

export type RootStackParamList = {
  Home: undefined;
  Booking: undefined;
  Trip: { ride: Ride };
  Profile: undefined;
};