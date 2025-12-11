import { useState, useEffect } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator,
} from "react-native";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "context/authContext";
import styles from "@assets/styles/userDashboardStyles";
import { CHARCOAL } from "utils/constants";
import SubmitCaseForm from "components/forms/submitCaseForm";
import { useUserCases } from "../../hooks/useUserCases";

export default function UserDashboard() {
  const router = useRouter();
  const { logout, user, isLoading } = useAuth();
  const { cases, assignedCase, loading: casesLoading, refreshCases } = useUserCases();
  const [isModalVisible, setIsModalVisible] = useState(false);

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

  const handleSubmitCase = async (caseData) => {
    setIsModalVisible(false);
    // Refresh cases after submission
    setTimeout(() => {
      refreshCases();
    }, 1000);
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

  const pendingCases = cases.filter(c => !c.attorneyId).length;
  const ongoingCases = cases.filter(c => c.attorneyId).length;
  const completedCases = 0; // TODO: Add status field to case model

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
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          {user?.displayName && (
            <Text style={styles.nameText}>{user.displayName}</Text>
          )}
          {user?.email && <Text style={styles.emailText}>{user.email}</Text>}
        </View>

        {/* Attorney Profile Section - Only show if attorney is assigned */}
        {casesLoading ? (
          <View style={styles.loadingSection}>
            <ActivityIndicator size="small" color="#8B6F47" />
          </View>
        ) : assignedAttorney ? (
          <View style={styles.attorneySection}>
            <Text style={styles.sectionHeader}>Your Assigned Attorney</Text>
            <View style={styles.attorneyCard}>
              <View style={styles.attorneyAvatar}>
                <Ionicons name="person" size={32} color="#8B6F47" />
              </View>
              <View style={styles.attorneyInfo}>
                <Text style={styles.attorneyName}>
                  Atty. {assignedAttorney.firstName} {assignedAttorney.lastName}
                </Text>
                <Text style={styles.attorneyEmail}>{assignedAttorney.email}</Text>
                {assignedAttorney.phoneNumber && (
                  <Text style={styles.attorneyPhone}>
                    📞 {assignedAttorney.phoneNumber}
                  </Text>
                )}
                {assignedAttorney.specializations && assignedAttorney.specializations.length > 0 && (
                  <Text style={styles.attorneySpec}>
                    {assignedAttorney.specializations.join(", ")}
                  </Text>
                )}
              </View>
            </View>
            <Text style={styles.caseInfo}>
              Case: {assignedCase.caseTitle} ({assignedCase.caseNumber})
            </Text>
          </View>
        ) : null}

        {/* Case Overview Section */}
        <View style={styles.content}>
          <Text style={styles.sectionHeader}>Case Overview</Text>

          {/* Status Cards */}
          <View style={styles.statusContainer}>
            <View style={styles.statusCard}>
              <Text style={styles.statusNumber}>{pendingCases}</Text>
              <Text style={styles.statusLabel}>Pending Cases</Text>
            </View>

            <View style={styles.statusCard}>
              <Text style={styles.statusNumber}>{ongoingCases}</Text>
              <Text style={styles.statusLabel}>Ongoing Cases</Text>
            </View>

            <View style={styles.statusCard}>
              <Text style={styles.statusNumber}>{completedCases}</Text>
              <Text style={styles.statusLabel}>Completed Cases</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => setIsModalVisible(true)}
            >
              <Text style={styles.primaryButtonText}>Submit a Case</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.push("user/trackCase")}
            >
              <Text style={styles.secondaryButtonText}>Track Case</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.chatButton,
                !assignedAttorney && styles.chatButtonDisabled,
              ]}
              onPress={handleChatPress}
              disabled={!assignedAttorney}
            >
              <Text
                style={[
                  styles.chatButtonText,
                  !assignedAttorney && styles.chatButtonTextDisabled,
                ]}
              >
                Chat with Attorney
              </Text>
              {!assignedAttorney && (
                <Text style={styles.disabledNote}>
                  Available when attorney is assigned
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      <SubmitCaseForm
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onSubmit={handleSubmitCase}
      />
    </View>
  );
}
