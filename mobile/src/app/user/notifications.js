import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, StyleSheet,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useNotifications } from '../../hooks/useNotifications';
import { PRIMARY_BROWN, PRIMARY_GOLD, CHARCOAL, MUTED_OLIVE } from 'utils/constants';

const getNotifIcon = (type) => {
  switch (type) {
    case 'case_update': return { name: 'briefcase', color: PRIMARY_BROWN };
    case 'appointment': return { name: 'calendar', color: '#22c55e' };
    case 'chat': return { name: 'chatbubble', color: '#3b82f6' };
    case 'review': return { name: 'document-text', color: PRIMARY_GOLD };
    case 'system': return { name: 'information-circle', color: '#8b5cf6' };
    default: return { name: 'notifications', color: MUTED_OLIVE };
  }
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification, refresh } = useNotifications();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Notification', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteNotification(id) },
    ]);
  };

  const renderItem = ({ item }) => {
    const icon = getNotifIcon(item.type);
    return (
      <TouchableOpacity
        style={[s.notifItem, !item.read && s.notifUnread]}
        onPress={() => markAsRead(item._id)}
        onLongPress={() => handleDelete(item._id)}
      >
        <View style={[s.notifIcon, { backgroundColor: `${icon.color}15` }]}>
          <Ionicons name={icon.name} size={20} color={icon.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[s.notifTitle, !item.read && s.notifTitleUnread]}>{item.title || 'Notification'}</Text>
          <Text style={s.notifMessage} numberOfLines={2}>{item.message}</Text>
          <Text style={s.notifTime}>
            {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            {' '}
            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        {!item.read && <View style={s.unreadDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={24} color={CHARCOAL} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Notifications</Text>
        <View style={{ flex: 1 }} />
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead} style={s.markAllBtn}>
            <Text style={s.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading && notifications.length === 0 ? (
        <ActivityIndicator size="large" color={PRIMARY_BROWN} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[PRIMARY_BROWN]} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="notifications-off-outline" size={56} color="#ccc" />
              <Text style={s.emptyText}>No notifications</Text>
              <Text style={s.emptySub}>You're all caught up!</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingBottom: 12, paddingHorizontal: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: CHARCOAL },
  markAllBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: `${PRIMARY_BROWN}15`, borderRadius: 16 },
  markAllText: { fontSize: 12, color: PRIMARY_BROWN, fontWeight: '600' },
  list: { padding: 0 },
  notifItem: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  notifUnread: { backgroundColor: `${PRIMARY_BROWN}05` },
  notifIcon: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  notifTitle: { fontSize: 14, fontWeight: '500', color: CHARCOAL },
  notifTitleUnread: { fontWeight: '700' },
  notifMessage: { fontSize: 13, color: MUTED_OLIVE, marginTop: 2 },
  notifTime: { fontSize: 11, color: '#aaa', marginTop: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: PRIMARY_BROWN, marginLeft: 8 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 16, color: '#aaa', marginTop: 12, fontWeight: '500' },
  emptySub: { fontSize: 13, color: '#ccc', marginTop: 4 },
});
