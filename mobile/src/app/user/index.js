// CaseStatusScreen.js (index.js)
import { useState } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
} from "react-native";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "context/authContext";
import styles from "asssets/styles/userDashboardStyles";
import { CHARCOAL } from "utils/constants";
import SubmitCaseForm from "components/forms/submitCaseForm";

export default function index() {
  const router = useRouter();
  const { logout, user, isLoading } = useAuth();
  const isAttorneyAssigned = false; // Toggle this to enable/disable chat button
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [submittedCases, setSubmittedCases] = useState([]);
  const [isSubmittingCase, setIsSubmittingCase] = useState(false);

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
    // Prototype: store locally and simulate network delay
    try {
      setIsSubmittingCase(true);
      // simulate a short delay
      await new Promise((resolve) => setTimeout(resolve, 600));

      const saved = { ...caseData, id: Date.now().toString() };
      setSubmittedCases((s) => [saved, ...s]);

      Alert.alert("Case Submitted", "Your case has been saved (prototype).");
      setIsModalVisible(false);
      return saved;
    } catch (err) {
      console.error("Submit case failed", err);
      Alert.alert(
        "Submission Failed",
        "An error occurred while submitting your case."
      );
      throw err;
    } finally {
      setIsSubmittingCase(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Custom Header */}
      <View style={styles.customHeader}>
        <View style={styles.logoContainer}>
          <View style={styles.logoPlaceholder}>
            {/* Replace this View with your <Image> component */}
            <Image
              source={require("../../asssets/images/logo.png")}
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

        {/* Case Overview Section */}
        <View style={styles.content}>
          <Text style={styles.sectionHeader}>Case Overview</Text>

          {/* Status Cards */}
          <View style={styles.statusContainer}>
            <View style={styles.statusCard}>
              <Text style={styles.statusNumber}>3</Text>
              <Text style={styles.statusLabel}>Pending Cases</Text>
            </View>

            <View style={styles.statusCard}>
              <Text style={styles.statusNumber}>2</Text>
              <Text style={styles.statusLabel}>Ongoing Cases</Text>
            </View>

            <View style={styles.statusCard}>
              <Text style={styles.statusNumber}>5</Text>
              <Text style={styles.statusLabel}>Completed Cases</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.primaryButton,
                isSubmittingCase && styles.buttonDisabled,
              ]}
              onPress={() => setIsModalVisible(true)}
              disabled={isSubmittingCase}
            >
              <Text style={styles.primaryButtonText}>
                {isSubmittingCase ? "Submitting..." : "Submit a Case"}
              </Text>
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
                !isAttorneyAssigned && styles.chatButtonDisabled,
              ]}
              disabled={!isAttorneyAssigned}
            >
              <Text
                style={[
                  styles.chatButtonText,
                  !isAttorneyAssigned && styles.chatButtonTextDisabled,
                ]}
              >
                Chat with Attorney
              </Text>
              {!isAttorneyAssigned && (
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
