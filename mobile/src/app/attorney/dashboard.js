import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from 'context/authContext';
import apiClient from '../../api/apiClient';

const AttorneyDashboard = () => {
  const router = useRouter();
  const { logout } = useAuth();
  const [chatList, setChatList] = useState([]);
  const [assignedCases, setAssignedCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [casesLoading, setCasesLoading] = useState(false);

  useEffect(() => {
    fetchChatList();
    fetchAssignedCases();
  }, []);

  const fetchAssignedCases = async () => {
    try {
      setCasesLoading(true);
      const response = await apiClient.get('/cases/attorney-cases');
      
      if (response.data.success) {
        setAssignedCases(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching assigned cases:', error);
    } finally {
      setCasesLoading(false);
    }
  };

  const fetchChatList = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/chat/list');
      
      if (response.data.success) {
        setChatList(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching chat list:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleChatPress = (chatItem) => {
    router.push({
      pathname: '/attorney/chat',
      params: {
        caseId: chatItem.case._id,
        clientName: `${chatItem.case.userId.firstName} ${chatItem.case.userId.lastName}`,
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.customHeader}>
        <View style={styles.logoContainer}>
          <View style={styles.logoPlaceholder}>
            <Image
              source={require('../../assets/images/logo.png')}
              style={styles.logoImage}
            />
          </View>
          <Text style={styles.appName}>JustReach Attorney</Text>
        </View>
        <TouchableOpacity style={styles.headerLogoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#2D2D2D" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.nameText}>Attorney</Text>
          <Text style={styles.subtitle}>Manage your cases and clients</Text>
        </View>

        {/* Clients Section */}
        <View style={styles.content}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Assigned Cases</Text>
            <TouchableOpacity onPress={() => { fetchChatList(); fetchAssignedCases(); }} disabled={loading || casesLoading}>
              <Ionicons
                name="refresh"
                size={20}
                color="#8B6F47"
                style={(loading || casesLoading) && styles.rotating}
              />
            </TouchableOpacity>
          </View>

          {casesLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#8B6F47" />
            </View>
          ) : assignedCases.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="folder-open-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No cases assigned yet</Text>
              <Text style={styles.emptySubtext}>
                Cases will appear here when they are assigned to you
              </Text>
            </View>
          ) : (
            <View style={styles.casesList}>
              {assignedCases.map((caseItem) => (
                <TouchableOpacity
                  key={caseItem._id}
                  style={styles.caseCard}
                  onPress={() => handleChatPress({ case: caseItem })}
                >
                  <View style={styles.caseHeader}>
                    <Text style={styles.caseTitle}>{caseItem.caseTitle}</Text>
                    <Text style={styles.caseNumber}>{caseItem.caseNumber}</Text>
                  </View>
                  <Text style={styles.caseType}>{caseItem.caseType}</Text>
                  <Text style={styles.caseDescription} numberOfLines={2}>
                    {caseItem.shortDescription}
                  </Text>
                  <View style={styles.clientInfoRow}>
                    <Ionicons name="person-outline" size={16} color="#666" />
                    <Text style={styles.clientNameSmall}>
                      {caseItem.userId.firstName} {caseItem.userId.lastName}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Clients Chat Section */}
          <View style={styles.sectionHeader} style={{ marginTop: 20 }}>
            <Text style={styles.sectionTitle}>Active Chats</Text>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#8B6F47" />
            </View>
          ) : chatList.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No active chats</Text>
              <Text style={styles.emptySubtext}>
                Start a conversation with your clients
              </Text>
            </View>
          ) : (
            <View style={styles.clientsList}>
              {chatList.map((chatItem) => (
                <TouchableOpacity
                  key={chatItem.case._id}
                  style={styles.clientCard}
                  onPress={() => handleChatPress(chatItem)}
                >
                  <View style={styles.clientAvatar}>
                    <Ionicons name="person" size={28} color="#8B6F47" />
                  </View>
                  <View style={styles.clientInfo}>
                    <View style={styles.clientHeader}>
                      <Text style={styles.clientName}>
                        {chatItem.case.userId.firstName} {chatItem.case.userId.lastName}
                      </Text>
                      {chatItem.unreadCount > 0 && (
                        <View style={styles.unreadBadge}>
                          <Text style={styles.unreadText}>{chatItem.unreadCount}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.caseTitle}>{chatItem.case.caseTitle}</Text>
                    <Text style={styles.caseNumber}>{chatItem.case.caseNumber}</Text>
                    {chatItem.lastMessage && (
                      <Text style={styles.lastMessage} numberOfLines={1}>
                        {chatItem.lastMessage.message}
                      </Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#999" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F0',
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoPlaceholder: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#C5A572',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8B6F47',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  logoImage: {
    width: 42,
    height: 42,
    borderRadius: 12,
    resizeMode: 'contain',
  },
  appName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#8B6F47',
    marginLeft: 14,
    letterSpacing: -0.5,
  },
  headerLogoutButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F5EFE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  welcomeSection: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 28,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 15,
    color: '#8B6F47',
    marginBottom: 6,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  nameText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2D2D2D',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '400',
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2D2D2D',
    letterSpacing: -0.3,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  casesList: {
    gap: 12,
    marginBottom: 24,
  },
  caseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#8B6F47',
  },
  caseHeader: {
    marginBottom: 8,
  },
  caseTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D2D2D',
    marginBottom: 4,
  },
  caseNumber: {
    fontSize: 12,
    color: '#8B6F47',
    fontWeight: '600',
    marginBottom: 4,
  },
  caseType: {
    fontSize: 13,
    color: '#666',
    textTransform: 'capitalize',
    marginBottom: 8,
  },
  caseDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  clientInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clientNameSmall: {
    fontSize: 14,
    color: '#8B6F47',
    fontWeight: '600',
  },
  clientsList: {
    gap: 12,
  },
  clientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  clientAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F5EFE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#E8DCC8',
  },
  clientInfo: {
    flex: 1,
  },
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  clientName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D2D2D',
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: '#8B6F47',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  lastMessage: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
  },
  rotating: {
    transform: [{ rotate: '180deg' }],
  },
});

export default AttorneyDashboard;
