# MOBILITY — Accessible Transport System for Limb Disabilities

Reimagining transportation for people with limb disabilities in Nigeria and beyond.

# 🚀 Overview

MOBILITY is an accessible transportation system designed specifically for individuals with limb disabilities—amputees, stroke survivors, crutch users, and others with reduced mobility.

Our goal is simple:
Make transportation accessible, affordable, and dignifying.

**MOBILITY** introduces a hybrid model combining fixed accessible routes during peak hours and on-demand rides during off-peak periods, powered by an accessibility-first technology platform and locally adaptable vehicles.

This project was built initially for a hackathon challenge, with long-term plans for national and continental deployment.

#  💡 Problem We’re Solving

Millions of people with limb disabilities face daily transport challenges:

Public transport is too high-risk and physically inaccessible

Wheelchair-only services do not address needs of amputees and crutch users

No dedicated paratransit infrastructure exists in most African cities

Transportation limitations lead to job loss, social isolation, and missed medical care

The result?
A mobility gap that limits independence.

MOBILITY closes this gap.

# 🛠 Solution Summary

🔹 Hybrid Transport System

Fixed Routes (Peak Hours): predictable, affordable corridors

On-Demand Rides (Off-Peak): flexible door-to-door service

🔹 Accessible Vehicles

Locally modified vehicles featuring:

Ultra-low floor entry

Automated sliding doors

Adaptive seating for amputees & crutch users

Safety rails and assisted-boarding support

Multiple entry/exit configurations

🔹 Tech Platform

Rider App – book rides, specify accessibility requirements, track vehicle

Driver App – optimized disability-friendly routes and assisted-boarding instructions

Backend System – dispatching, analytics, safety monitoring

# 📱 Core Features

Rider App

Book fixed-route or on-demand rides

Save accessibility preferences

Track arrival time

In-app support & emergency assistance

Secure digital payments

Driver App

Route navigation

User safety instructions

Check-in system for riders

Trip completion dashboard

Admin Dashboard

Real-time fleet monitoring

Operational analytics

Accessibility compliance logs

Driver performance and training status

# ⚙️ Tech Stack

(Customize according to your implementation, below is the standard recommended stack for hackathon version)

React Native or Expo

Mapping & Routing

Mapbox / Google Maps SDK

Custom accessibility routing rules

# 🌍 Why Nigeria?

Over 20 million Nigerians live with disabilities

Public transport is not disability-friendly

No affordable, structured alternative exists

Rising urbanization makes demand stronger every year

MOBILITY is the first system designed around Nigerian realities, not imported assumptions.

# 💼 Business Model

To keep rides affordable for users, MOBILITY uses a hybrid revenue system:

Low-cost rider fares

NGO-sponsored trips

Government disability grants

CSR mobility sponsorships

Hospital/clinic transportation contracts

# 📊 Impact Goals

Improved independence for users

Reliable access to healthcare

Better employment mobility

Safer, more dignified transportation

Increased accessibility awareness across Africa

# 🎯 Hackathon Goals

For the hackathon version, the focus is on:

Demonstrating feasibility

Showing working prototypes/UIs

Presenting a clear accessibility-first user journey

Delivering a unique and impactful social problem solution

The hackathon MVP includes:

Basic ride-booking flow

Accessibility preferences

Driver route acceptance

Dashboard mockups

Demo vehicle model & explanation

# 🤝 Team & Contributions

You can include your team names here
Example:

Name	Role
Ayeku Emmanuel	Founder / Engineer
Team Member	UX / UI
Team Member	Backend
Team Member	Research

## 🚀 Getting Started

### For Developers

#### Prerequisites
- Node.js (version 18 or higher)
- Expo CLI: Install globally with `npm install -g @expo/cli`
- Firebase CLI: Install globally with `npm install -g firebase-tools`
- A Firebase project (for backend services)
- Geoapify API key (for location services)

#### Installation
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd mobility
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

#### Setup
1. Copy the environment file:
   ```bash
   cp .env.example .env
   ```

2. Fill in your Firebase configuration and Geoapify API key in `.env`:
   - Obtain Firebase config from your Firebase project settings
   - Get Geoapify API key from https://www.geoapify.com/

3. Set up Firebase project:
   - Create a project at https://console.firebase.google.com/
   - Enable Authentication, Firestore Database, Storage, and Functions
   - Configure Firestore rules and indexes as needed

4. (Optional) Deploy Cloud Functions for full functionality:
   ```bash
   cd functions
   npm install
   firebase login
   firebase use --add  # Select your project
   firebase deploy --only functions
   ```

#### Running the App
- Start the Expo development server:
  ```bash
  npm start
  ```
  This will open the Expo DevTools in your browser.

- Run on specific platforms:
  - Web: `npm run web`
  - Android: `npm run android`
  - iOS: `npm run ios` (requires macOS)

- For production builds, use EAS Build:
  ```bash
  npx eas build --platform android
  npx eas build --platform ios
  ```

### For Users (Online Access)

#### Accessing the Web Version
The app is available as a Progressive Web App (PWA) that can be accessed directly in your web browser at the deployed URL (e.g., https://mobility.vercel.app). No installation required - just visit the URL and use it like a native app.

#### Downloading Mobile Apps
Mobile versions are available on app stores:
- [Google Play Store](link-to-play-store)
- [Apple App Store](link-to-app-store)

#### Getting Started with the App
1. **Sign Up/Login**: Create an account or log in with existing credentials.
2. **Set Accessibility Preferences**: Specify your mobility needs (e.g., wheelchair, crutches, amputee).
3. **Book a Ride**:
   - Enter pickup and drop-off locations
   - Choose between fixed-route or on-demand service
   - Select a suitable driver/vehicle
4. **Track Your Ride**: Monitor real-time location and ETA.
5. **Payment**: Secure in-app payments upon trip completion.
6. **Support**: Use in-app chat for assistance or emergencies.

For any issues or questions, contact support at ayekudemilade43@gmail.com.

# 🧱 Roadmap
Phase 1: Hackathon Prototype

UI/UX prototype

Fixed-route booking

Driver acceptance

Basic backend

Phase 2: Pilot Testing

Test with disability groups in Lagos

Adjust vehicle modifications

Add accessibility routing

Phase 3: Scale

Launch in Lagos

Expand to Abuja + Port Harcourt

Build partnerships with NGOs and hospitals

# ❤️ Acknowledgements

Special thanks to the disability communities whose input shaped the user experience.
This project is dedicated to restoring dignity, independence, and equality.

# 📬 Contact

If you want to collaborate, support, or contribute:

Email: ayekudemilade43@gmail.com

Phone: +2349056215207
