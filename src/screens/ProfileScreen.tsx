import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { RootStackParamList } from '../types';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { FirebaseService } from '../services/firebaseService';

type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Profile'>;

interface Props {
  navigation: ProfileScreenNavigationProp;
}

export default function ProfileScreen({ navigation }: Props) {
   const { user, logout, updateProfile } = useAuth();
   const { getFontSize, getColor, highContrast } = useAccessibility();
   const [uploading, setUploading] = useState(false);

   const pickImage = async () => {
     const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
     if (status !== 'granted') {
       Alert.alert('Permission Denied', 'Permission to access media library is required!');
       return;
     }

     const result = await ImagePicker.launchImageLibraryAsync({
       mediaTypes: 'images',
       allowsEditing: true,
       aspect: [1, 1],
       quality: 0.5,
     });

     if (!result.canceled) {
       setUploading(true);
       try {
         const downloadURL = await FirebaseService.uploadProfileImage(user!.id, result.assets[0].uri);
         await updateProfile({ profileImage: downloadURL });
       } catch (error) {
         Alert.alert('Upload Failed', 'Failed to upload image. Please try again.');
       } finally {
         setUploading(false);
       }
     }
   };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={[styles.card, highContrast && styles.cardHighContrast]}>
         <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
           {user?.profileImage ? (
             <Image source={{ uri: user.profileImage }} style={styles.avatar} />
           ) : (
             <View style={styles.avatarPlaceholder}>
               <Ionicons name="person" size={48} color="#6B7280" />
             </View>
           )}
           {uploading && (
             <View style={styles.loadingOverlay}>
               <ActivityIndicator size="large" color="#4F46E5" />
             </View>
           )}
         </TouchableOpacity>

         <Text style={[styles.name, { fontSize: getFontSize(20), color: getColor('#1F2937', '#000') }]}>
           {user?.name || 'Guest'}
         </Text>
         <Text style={[styles.email, { fontSize: getFontSize(14), color: getColor('#6B7280', '#000') }]}>
           {user?.email || 'Not signed in'}
         </Text>

         <TouchableOpacity style={styles.editButton} onPress={pickImage}>
           <Ionicons name="camera" size={16} color="#4F46E5" />
           <Text style={[styles.editButtonText, { fontSize: getFontSize(14) }]}>Change Photo</Text>
         </TouchableOpacity>
       </View>

      <View style={[styles.card, highContrast && styles.cardHighContrast]}>
        <Text style={[styles.sectionTitle, { fontSize: getFontSize(16), color: getColor('#1F2937', '#000') }]}>Account</Text>

        <TouchableOpacity style={styles.row} activeOpacity={0.8} onPress={() => navigation.navigate('TripHistory')}>
          <Text style={[styles.rowText, { fontSize: getFontSize(15), color: getColor('#374151', '#000') }]}>
            {user?.role === 'driver' ? 'Your Trips' : 'Your Bookings'}
          </Text>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        {user?.role === 'driver' && (
          <TouchableOpacity style={styles.row} activeOpacity={0.8} onPress={() => navigation.navigate('DriverSettings')}>
            <Text style={[styles.rowText, { fontSize: getFontSize(15), color: getColor('#374151', '#000') }]}>Driver Settings</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.row} activeOpacity={0.8} onPress={() => logout && logout()}>
          <Text style={[styles.rowText, { fontSize: getFontSize(15), color: '#EF4444' }]}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.card, highContrast && styles.cardHighContrast]}>
        <Text style={[styles.sectionTitle, { fontSize: getFontSize(16), color: getColor('#1F2937', '#000') }]}>Accessibility</Text>
        <Text style={[styles.helpText, { fontSize: getFontSize(14), color: getColor('#6B7280', '#000') }]}>Manage your accessibility preferences and contact support for additional assistance.</Text>

        <TouchableOpacity style={styles.row} activeOpacity={0.8} onPress={() => navigation.navigate('Accessibility')}>
          <Text style={[styles.rowText, { fontSize: getFontSize(15), color: getColor('#374151', '#000') }]}>Edit Accessibility Options</Text>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHighContrast: {
    borderWidth: 2,
    borderColor: '#000',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 48,
  },
  name: {
    fontWeight: '800',
    marginBottom: 4,
  },
  email: {
    marginBottom: 12,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  editButtonText: {
    color: '#4F46E5',
    fontWeight: '700',
  },
  sectionTitle: {
    fontWeight: '700',
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  helpText: {
    alignSelf: 'flex-start',
    marginBottom: 12,
    lineHeight: 20,
  },
  row: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  rowText: {
    fontWeight: '600',
  },
});