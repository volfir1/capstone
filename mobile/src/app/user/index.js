import { useState, useEffect } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "context/authContext";
import styles from "@assets/styles/userDashboardStyles";
import { CHARCOAL, PRIMARY_BROWN, PRIMARY_GOLD, MUTED_OLIVE } from "utils/constants";
import { useUserCases } from "../../hooks/useUserCases";

export default function UserDashboard() {
  const router = useRouter();
  const { logout, user, isLoading } = useAuth();
  const { cases, assignedCase, loading: casesLoading, refreshCases } = useUserCases();
  const [refreshing, setRefreshing] = useState(false);

  const assignedAttorney = assignedCase?.attorneyId;

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/auth");
    } catch (error) {
      console.error("Logout error:", error);
      Alert.alert(
        "Logout Failed",
        "An error occurred while logging out. Please try again."
      );
    }
  };

  const confirmLogout = () => {
    Alert.alert("Confirm Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: handleLogout,
      },
    ]);
  };

  const handleChatPress = () => {
    if (assignedCase && assignedAttorney) {
      router.push({
        pathname: "/user/chat",
        params: {
          caseId: assignedCase._id,
          attorneyName: `${assignedAttorney.firstName} ${assignedAttorney.lastName}`,
        },
      });
    }
  };

  // Pull-to-refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshCases();
    } catch (error) {
      console.error("Error refreshing:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const pendingCases = cases.filter(c => !c.attorneyId).length;
  const ongoingCases = cases.filter(c => c.attorneyId).length;
  const completedCases = 0; // TODO: Add status field to case model

  const statsData = [
    {
      icon: "briefcase",
      label: "Active Cases",
      value: ongoingCases.toString(),
      subtitle: `${pendingCases} pending`,
      color: PRIMARY_BROWN,
      bgColor: `${PRIMARY_BROWN}15`,
    },
    {
      icon: "documents",
      label: "Documents",
      value: "12",
      subtitle: "Uploaded files",
      color: PRIMARY_GOLD,
      bgColor: `${PRIMARY_GOLD}15`,
    },
    {
      icon: "notifications",
      label: "Notifications",
      value: "5",
      subtitle: "Unread messages",
      color: MUTED_OLIVE,
      bgColor: `${MUTED_OLIVE}15`,
    },
    {
      icon: "calendar",
      label: "Appointments",
      value: "2",
      subtitle: "This month",
      color: "#C4AB7D",
      bgColor: "#C4AB7D15",
    },
  ];

  const quickActions = [
    {
      icon: "briefcase-outline",
      title: "Schedule Appointment",
      description: "Book a legal consultation",
      path: "/user/appointment",
      color: PRIMARY_BROWN,
    },
    {
      icon: "location-outline",
      title: "Track Appointment",
      description: "Monitor your appointments",
      path: "track",
      color: PRIMARY_GOLD,
    },
    {
      icon: "chatbubbles-outline",
      title: "Chat with Attorney",
      description: "Get instant support",
      path: "chat",
      color: MUTED_OLIVE,
      disabled: !assignedAttorney,
    },
    {
      icon: "person-outline",
      title: "Profile",
      description: "Manage your account",
      path: "profile",
      color: "#C4AB7D",
    },
  ];

  return (
    <View style={styles.container}>
      {/* Custom Header */}
      <View style={styles.customHeader}>
        <View style={styles.logoContainer}>
          <View style={styles.logoPlaceholder}>
            <Image
              source={require("../../assets/images/logo.png")}
              style={styles.logoImage}
            />
          </View>
          <Text style={styles.appName}>JustReach</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.headerLogoutButton,
            isLoading && styles.headerLogoutDisabled,
          ]}
          onPress={confirmLogout}
          disabled={isLoading}
        >
          <Ionicons name="log-out-outline" size={22} color={CHARCOAL} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#8B6F47"]} // Android
            tintColor="#8B6F47" // iOS
            title="Pull to refresh" // iOS
            titleColor="#8B6F47" // iOS
          />
        }
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <View style={styles.welcomeHeader}>
            <View>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              {user?.displayName && (
                <Text style={styles.nameText}>{user.displayName}</Text>
              )}
            </View>
            {user?.email && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="shield-checkmark" size={16} color="white" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
          </View>
          <Text style={styles.dateText}>
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            {statsData.map((stat, index) => (
              <View key={index} style={[styles.statCard, { backgroundColor: stat.bgColor }]}>
                <View style={[styles.statIconContainer, { backgroundColor: stat.color }]}>
                  <Ionicons name={stat.icon} size={20} color="white" />
                </View>
                <View style={styles.statContent}>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                  <Text style={styles.statSubtitle}>{stat.subtitle}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.actionCard, action.disabled && styles.actionCardDisabled]}
                onPress={() => action.disabled ? null : router.push(action.path)}
                disabled={action.disabled}
              >
                <View style={[styles.actionIconContainer, { backgroundColor: `${action.color}15` }]}>
                  <Ionicons name={action.icon} size={24} color={action.color} />
                </View>
                <Text style={styles.actionTitle}>{action.title}</Text>
                <Text style={styles.actionDescription}>
                  {action.disabled ? "Attorney not assigned yet" : action.description}
                </Text>
                {!action.disabled && (
                  <Ionicons 
                    name="chevron-forward" 
                    size={18} 
                    color={MUTED_OLIVE} 
                    style={styles.actionArrow}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Attorney Profile Section - Only show if attorney is assigned */}
        {casesLoading ? (
          <View style={styles.loadingSection}>
            <ActivityIndicator size="small" color={PRIMARY_BROWN} />
          </View>
        ) : assignedAttorney ? (
          <View style={styles.attorneySection}>
            <Text style={styles.sectionTitle}>Your Assigned Attorney</Text>
            <View style={styles.attorneyCard}>
              <View style={styles.attorneyAvatarLarge}>
                <Ionicons name="person" size={32} color="white" />
              </View>
              <View style={styles.attorneyInfo}>
                <Text style={styles.attorneyName}>
                  Atty. {assignedAttorney.firstName} {assignedAttorney.lastName}
                </Text>
                <Text style={styles.attorneyEmail}>{assignedAttorney.email}</Text>
                {assignedAttorney.phoneNumber && (
                  <View style={styles.attorneyContactRow}>
                    <Ionicons name="call" size={14} color={MUTED_OLIVE} />
                    <Text style={styles.attorneyPhone}>{assignedAttorney.phoneNumber}</Text>
                  </View>
                )}
                {assignedAttorney.specializations && assignedAttorney.specializations.length > 0 && (
                  <View style={styles.specializationsContainer}>
                    {assignedAttorney.specializations.map((spec, idx) => (
                      <View key={idx} style={styles.specializationBadge}>
                        <Text style={styles.specializationText}>{spec}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
              <TouchableOpacity
                style={styles.chatIconButton}
                onPress={handleChatPress}
              >
                <Ionicons name="chatbubble" size={20} color="white" />
              </TouchableOpacity>
            </View>
            <View style={styles.caseInfoBox}>
              <Ionicons name="folder-open" size={16} color={PRIMARY_BROWN} />
              <Text style={styles.caseInfo}>
                {assignedCase.caseTitle} ({assignedCase.caseNumber})
              </Text>
            </View>
          </View>
        ) : null}

        {/* Recent Activity Section */}
        <View style={styles.recentActivitySection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity onPress={() => router.push('/user/trackCase')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {cases.length > 0 ? (
            cases.slice(0, 3).map((caseItem, index) => (
              <View key={index} style={styles.activityCard}>
                <View style={styles.activityIconContainer}>
                  <Ionicons name="document-text" size={20} color={PRIMARY_BROWN} />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>{caseItem.caseTitle}</Text>
                  <Text style={styles.activitySubtitle}>
                    {caseItem.attorneyId ? 'Attorney Assigned' : 'Pending Review'}
                  </Text>
                  <Text style={styles.activityDate}>
                    {new Date(caseItem.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <View style={[
                  styles.activityStatusBadge,
                  { backgroundColor: caseItem.attorneyId ? `${MUTED_OLIVE}20` : `${PRIMARY_GOLD}20` }
                ]}>
                  <Text style={[
                    styles.activityStatusText,
                    { color: caseItem.attorneyId ? MUTED_OLIVE : PRIMARY_GOLD }
                  ]}>
                    {caseItem.attorneyId ? 'Active' : 'Pending'}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="folder-open-outline" size={48} color="#CCC" />
              <Text style={styles.emptyStateText}>No cases yet</Text>
              <Text style={styles.emptyStateSubtext}>Start by submitting your first case</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}