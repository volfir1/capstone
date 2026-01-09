import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import apiClient from '../../api/apiClient';

const PRIMARY_BROWN = '#7D5A3B';
const PRIMARY_GOLD = '#C4AB7D';
const CHARCOAL = '#2C2C2C';
const THEMED_LIGHT_BG = '#FAF8F3';

export default function RecommendationForAction() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const caseId = params.caseId;
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState(null);

  useEffect(() => {
    if (caseId) {
      fetchReviews(caseId);
    } else {
      // If no caseId, fetch all reviews
      fetchAllReviews();
    }
  }, [caseId]);

  const fetchReviews = async (id) => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/reviews/case/${id}`);
      const data = response.data?.data ?? response.data ?? [];
      setReviews(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllReviews = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/reviews');
      const data = response.data?.data ?? response.data ?? [];
      setReviews(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching all reviews:', error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEditReview = (review) => {
    Alert.alert(
      'Edit Recommendation',
      'For complex form editing, please use the website version.',
      [
        { text: 'OK' },
        {
          text: 'View Details',
          onPress: () => setSelectedReview(review)
        }
      ]
    );
  };

  const renderReviewCard = (review) => {
    const clientName = review.content?.interviewInfo?.clientName || 'Unknown Client';
    const reviewerName = review.reviewerName || review.reviewerRole || 'Staff';
    const caseNature = review.content?.caseInfo?.nature || review.content?.interviewInfo?.caseNature || 'N/A';

    return (
      <TouchableOpacity
        key={review._id || review.id}
        style={styles.reviewCard}
        onPress={() => handleEditReview(review)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Ionicons name="document-text" size={24} color={PRIMARY_GOLD} />
            <View style={styles.reviewInfo}>
              <Text style={styles.clientName}>{clientName}</Text>
              <Text style={styles.caseId}>Case: {review.caseId}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={PRIMARY_BROWN} />
        </View>

        <View style={styles.cardDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="briefcase-outline" size={16} color="#666" />
            <Text style={styles.detailText}>{caseNature}</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="person-outline" size={16} color="#666" />
            <Text style={styles.detailText}>Reviewed by: {reviewerName}</Text>
          </View>

          {review.createdAt && (
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={16} color="#666" />
              <Text style={styles.detailText}>
                {new Date(review.createdAt).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>

        {review.content?.actionInfo?.decision && (
          <View style={styles.cardFooter}>
            <View style={[
              styles.decisionBadge,
              review.content.actionInfo.decision === 'accepted' ? styles.acceptedBadge :
              review.content.actionInfo.decision === 'rejected' ? styles.rejectedBadge :
              styles.pendingBadge
            ]}>
              <Text style={styles.decisionText}>
                {review.content.actionInfo.decision.charAt(0).toUpperCase() + 
                 review.content.actionInfo.decision.slice(1)}
              </Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={CHARCOAL} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Recommendations</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_BROWN} />
        </View>
      </SafeAreaView>
    );
  }

  if (selectedReview) {
    const content = selectedReview.content || {};
    const interviewInfo = content.interviewInfo || {};
    const actionInfo = content.actionInfo || {};

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSelectedReview(null)} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={CHARCOAL} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Review Details</Text>
        </View>

        <ScrollView style={styles.detailsContainer}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Interview Information</Text>
            
            {interviewInfo.clientName && (
              <>
                <Text style={styles.label}>Client Name</Text>
                <Text style={styles.value}>{interviewInfo.clientName}</Text>
              </>
            )}

            {interviewInfo.caseNature && (
              <>
                <Text style={styles.label}>Case Nature</Text>
                <Text style={styles.value}>{interviewInfo.caseNature}</Text>
              </>
            )}

            {interviewInfo.clientStatement && (
              <>
                <Text style={styles.label}>Client Statement</Text>
                <Text style={styles.value}>{interviewInfo.clientStatement}</Text>
              </>
            )}

            {interviewInfo.adversePartyStatement && (
              <>
                <Text style={styles.label}>Adverse Party Statement</Text>
                <Text style={styles.value}>{interviewInfo.adversePartyStatement}</Text>
              </>
            )}
          </View>

          {actionInfo.decision && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Director's Action</Text>
              
              <Text style={styles.label}>Decision</Text>
              <View style={[
                styles.decisionBadge,
                actionInfo.decision === 'accepted' ? styles.acceptedBadge :
                actionInfo.decision === 'rejected' ? styles.rejectedBadge :
                styles.pendingBadge,
                { alignSelf: 'flex-start', marginTop: 8 }
              ]}>
                <Text style={styles.decisionText}>
                  {actionInfo.decision.charAt(0).toUpperCase() + actionInfo.decision.slice(1)}
                </Text>
              </View>

              {actionInfo.decisionNote && (
                <>
                  <Text style={styles.label}>Notes</Text>
                  <Text style={styles.value}>{actionInfo.decisionNote}</Text>
                </>
              )}
            </View>
          )}

          {(actionInfo.assignedTo || actionInfo.supervisingLawyer) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Assignment</Text>
              
              {actionInfo.assignedTo && (
                <>
                  <Text style={styles.label}>Assigned To</Text>
                  <Text style={styles.value}>{actionInfo.assignedTo}</Text>
                </>
              )}

              {actionInfo.supervisingLawyer && (
                <>
                  <Text style={styles.label}>Supervising Lawyer</Text>
                  <Text style={styles.value}>{actionInfo.supervisingLawyer}</Text>
                </>
              )}
            </View>
          )}

          <View style={styles.noteBox}>
            <Ionicons name="information-circle" size={20} color={PRIMARY_BROWN} />
            <Text style={styles.noteText}>
              For detailed editing and form completion, please use the website version.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={CHARCOAL} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recommendations</Text>
      </View>

      {reviews.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No recommendations found</Text>
          <Text style={styles.emptySubtext}>
            {caseId ? 'No reviews for this case yet' : 'No pending reviews'}
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.reviewList}>
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color={PRIMARY_BROWN} />
            <Text style={styles.infoText}>
              Tap a recommendation to view details. Use the website for full editing.
            </Text>
          </View>
          {reviews.map(renderReviewCard)}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: CHARCOAL,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 8,
    textAlign: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEMED_LIGHT_BG,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: PRIMARY_BROWN,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    marginLeft: 8,
  },
  reviewList: {
    flex: 1,
  },
  reviewCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reviewInfo: {
    marginLeft: 12,
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: CHARCOAL,
  },
  caseId: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  cardDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  cardFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  decisionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  acceptedBadge: {
    backgroundColor: '#E8F5E9',
  },
  rejectedBadge: {
    backgroundColor: '#FFEBEE',
  },
  pendingBadge: {
    backgroundColor: '#FFF3E0',
  },
  decisionText: {
    fontSize: 12,
    fontWeight: '600',
    color: CHARCOAL,
  },
  detailsContainer: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: THEMED_LIGHT_BG,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: PRIMARY_BROWN,
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginTop: 12,
    marginBottom: 4,
    fontWeight: '600',
  },
  value: {
    fontSize: 16,
    color: CHARCOAL,
    marginBottom: 8,
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#FF9800',
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    marginLeft: 8,
  },
});
