import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native'
import React from 'react'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useAuth } from 'context/authContext'

export default function index() {
  const router = useRouter()
  const { logout, user, isLoading } = useAuth()

  const handleLogout = async () => {
    try {
      await logout()
      console.log('User logged out successfully')
      router.replace('/auth')
    } catch (error) {
      console.error('Logout error:', error)
      Alert.alert('Logout Failed', 'An error occurred while logging out. Please try again.')
    }
  }

  const confirmLogout = () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: handleLogout,
        },
      ]
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome!</Text>
        {user?.email && (
          <Text style={styles.emailText}>{user.email}</Text>
        )}
        {user?.displayName && (
          <Text style={styles.nameText}>{user.displayName}</Text>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.contentText}>You are successfully logged in!</Text>
      </View>

      <TouchableOpacity 
        style={[styles.logoutButton, isLoading && styles.buttonDisabled]} 
        onPress={confirmLogout}
        disabled={isLoading}
      >
        <Ionicons name="log-out-outline" size={20} color="#ffffff" style={styles.buttonIcon} />
        <Text style={styles.logoutButtonText}>
          {isLoading ? 'Logging out...' : 'Logout'}
        </Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 20,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  emailText: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 4,
  },
  nameText: {
    fontSize: 18,
    color: '#374151',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentText: {
    fontSize: 18,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ef4444',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 40,
  },
  buttonDisabled: {
    backgroundColor: '#94a3b8',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonIcon: {
    marginRight: 8,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
})