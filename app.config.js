import 'dotenv/config';

export default {
  expo: {
    name: "AccessibleTransportSystem",
    slug: "accessible-transport-system",
    version: "1.0.0",
    projectId: "539082f4-4a98-42cb-9616-e7d606f100c0",
    android: {
      package: "com.anonymous.accessibletransportsystem"
    },
    extra: {
      eas: {
        projectId: "539082f4-4a98-42cb-9616-e7d606f100c0"
      },
      firebase: {
        apiKey: process.env.FIREBASE_API_KEY,
        authDomain: process.env.FIREBASE_AUTH_DOMAIN,
        projectId: process.env.FIREBASE_PROJECT_ID,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.FIREBASE_APP_ID,
        GEOAPIFY_API_KEY: process.env.GEOAPIFY_API_KEY
      },
    },
  },
};
