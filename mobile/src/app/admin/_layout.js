import React, { useState } from 'react';
import { Redirect } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import {
  DrawerContentScrollView,
  DrawerItemList,
} from '@react-navigation/drawer';
import { useAuth } from 'context/authContext';

const PRIMARY_BROWN = '#7D5A3B';
const PRIMARY_GOLD = '#C4AB7D';
const ADMIN_ALLOWED_ROLES = new Set(['secretary', 'supervising_lawyer', 'director', 'intern']);
const PROFILE_MANAGER_ROLES = new Set(['secretary', 'director']);
const HAS_NATIVE_BLUR_VIEW = !!UIManager.getViewManagerConfig?.('ExpoBlurView');

function AdminDrawerContent({ drawerExpanded, onToggleExpanded, ...props }) {
  return (
    <View style={styles.drawerGlassShell}>
      {HAS_NATIVE_BLUR_VIEW ? (
        <BlurView tint="light" intensity={42} style={styles.drawerGlassBlur} />
      ) : (
        <View style={styles.drawerGlassFallback} />
      )}
      <View style={styles.drawerGlassTint} />

      <DrawerContentScrollView
        {...props}
        style={styles.drawerScroll}
        contentContainerStyle={styles.drawerContentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.drawerHeader}>
          {drawerExpanded ? <Text style={styles.drawerHeaderTitle}>Admin Menu</Text> : null}
          <TouchableOpacity
            style={styles.drawerExpandBtn}
            onPress={onToggleExpanded}
            accessibilityRole="button"
            accessibilityLabel={drawerExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <Ionicons
              name={drawerExpanded ? 'chevron-back' : 'chevron-forward'}
              size={18}
              color={PRIMARY_BROWN}
            />
          </TouchableOpacity>
        </View>

        <DrawerItemList {...props} />
      </DrawerContentScrollView>
    </View>
  );
}

export default function AdminLayout() {
  const [drawerExpanded, setDrawerExpanded] = useState(true);
  const {
    loading,
    pinStatusLoading,
    userLoggedIn,
    userData,
    isVerified,
    requiresProfileSelection,
    activeProfileId,
    requiresPinSetup,
    requiresPinVerification,
  } = useAuth();

  if (loading || pinStatusLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F8FA' }}>
        <ActivityIndicator size="large" color={PRIMARY_BROWN} />
      </View>
    );
  }

  if (!userLoggedIn || !isVerified) {
    return <Redirect href="/auth" />;
  }

  if (requiresProfileSelection || !activeProfileId) {
    return <Redirect href="/auth/profiles" />;
  }

  if (requiresPinSetup || requiresPinVerification || !userData) {
    return <Redirect href="/auth/profile-pin" />;
  }

  if (!ADMIN_ALLOWED_ROLES.has(userData.role)) {
    return <Redirect href="/auth" />;
  }

  const canManageProfiles = PROFILE_MANAGER_ROLES.has(userData.role);
  const drawerWidth = drawerExpanded ? 286 : 96;
  
  return (
    <Drawer
      drawerContent={(props) => (
        <AdminDrawerContent
          {...props}
          drawerExpanded={drawerExpanded}
          onToggleExpanded={() => setDrawerExpanded((current) => !current)}
        />
      )}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        swipeEnabled: true,
        swipeEdgeWidth: 48,
        sceneStyle: {
          backgroundColor: '#F7F8FA',
        },
        overlayColor: 'rgba(44,34,24,0.22)',
        drawerActiveTintColor: PRIMARY_BROWN,
        drawerInactiveTintColor: '#766E61',
        drawerActiveBackgroundColor: 'rgba(255,255,255,0.42)',
        drawerStyle: {
          backgroundColor: 'transparent',
          borderRightWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          width: drawerWidth,
        },
        drawerLabelStyle: [
          styles.drawerLabel,
          !drawerExpanded && styles.drawerLabelCollapsed,
        ],
        drawerItemStyle: [
          styles.drawerItem,
          !drawerExpanded && styles.drawerItemCollapsed,
        ],
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          title: 'Dashboard',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="speedometer-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="finalized"
        options={{
          title: 'Cases',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="briefcase-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="assigned-cases"
        options={{
          title: 'Assigned',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="git-branch-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="clientformstatus"
        options={{
          title: 'Appointments',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="users"
        options={{
          title: 'Users',
          href: canManageProfiles ? undefined : null,
          drawerIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
          drawerItemStyle: canManageProfiles
            ? [styles.drawerItem, !drawerExpanded && styles.drawerItemCollapsed]
            : { display: 'none' },
        }}
      />
      <Drawer.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="bar-chart-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="profile"
        options={{
          title: 'Profile',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="recommendation"
        options={{
          href: null,
          drawerItemStyle: { display: 'none' },
        }}
      />
      <Drawer.Screen
        name="clientinfo"
        options={{
          href: null,
          drawerItemStyle: { display: 'none' },
        }}
      />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  drawerGlassShell: {
    flex: 1,
    marginLeft: 8,
    marginRight: 12,
    marginVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  drawerGlassBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  drawerGlassFallback: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(248,243,235,0.68)',
  },
  drawerGlassTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(245,238,228,0.42)',
  },
  drawerScroll: {
    backgroundColor: 'transparent',
  },
  drawerContentContainer: {
    paddingTop: 6,
    paddingBottom: 20,
  },
  drawerHeader: {
    minHeight: 48,
    marginHorizontal: 10,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  drawerHeaderTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: PRIMARY_BROWN,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  drawerExpandBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerItem: {
    borderRadius: 12,
    marginHorizontal: 10,
    marginVertical: 4,
    paddingHorizontal: 4,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  drawerItemCollapsed: {
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  drawerLabel: {
    marginLeft: -12,
    fontSize: 13,
    fontWeight: '600',
  },
  drawerLabelCollapsed: {
    display: 'none',
  },
});
