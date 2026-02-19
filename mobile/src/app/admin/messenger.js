import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  TextInput, ActivityIndicator, FlatList, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from 'context/authContext';
import { fetchChatList, fetchChatMessages, sendChatMessage, markChatAsRead } from '../../api/userApi';
import { PRIMARY_BROWN, PRIMARY_GOLD, CHARCOAL, MUTED_OLIVE } from 'utils/constants';

export default function AdminMessenger() {
  const { currentUser, userData } = useAuth();
  const [chatListData, setChatListData] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);
  const isFetchingRef = useRef(false);

  const loadChatList = useCallback(async () => {
    try {
      const data = await fetchChatList();
      setChatListData(data || []);
    } catch (err) {
      console.error('Error loading chat list:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChatList();
    const interval = setInterval(loadChatList, 30000);
    return () => clearInterval(interval);
  }, [loadChatList]);

  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat.case._id);
      markChatAsRead(selectedChat.case._id).catch(() => {});
      const interval = setInterval(() => loadMessages(selectedChat.case._id), 15000);
      return () => clearInterval(interval);
    }
  }, [selectedChat]);

  const loadMessages = async (caseId) => {
    if (!caseId || isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      setMessagesLoading(prev => messages.length === 0 ? true : prev);
      const data = await fetchChatMessages(caseId);
      setMessages(data || []);
    } catch (err) {
      console.error('Error loading messages:', err);
    } finally {
      setMessagesLoading(false);
      isFetchingRef.current = false;
    }
  };

  const handleSend = async () => {
    if (!messageText.trim() || sending || !selectedChat) return;
    try {
      setSending(true);
      const newMsg = await sendChatMessage(selectedChat.case._id, messageText.trim());
      if (newMsg) {
        setMessages(prev => [...prev, newMsg]);
        setMessageText('');
        loadChatList();
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatMessageTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const filteredList = chatListData.filter(chat => {
    const clientName = `${chat.case?.userId?.firstName || ''} ${chat.case?.userId?.lastName || ''}`.toLowerCase();
    const caseTitle = (chat.case?.caseTitle || '').toLowerCase();
    const q = searchQuery.toLowerCase();
    return clientName.includes(q) || caseTitle.includes(q);
  });

  // Chat List View
  if (!selectedChat) {
    return (
      <View style={s.container}>
        <View style={s.header}>
          <Text style={s.headerTitle}>Messages</Text>
        </View>
        <View style={s.searchBox}>
          <Ionicons name="search" size={18} color="#999" />
          <TextInput
            placeholder="Search conversations..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={s.searchInput}
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={PRIMARY_BROWN} style={{ marginTop: 40 }} />
        ) : filteredList.length === 0 ? (
          <View style={s.emptyState}>
            <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
            <Text style={s.emptyTitle}>No conversations</Text>
            <Text style={s.emptySubtext}>Messages with clients will appear here</Text>
          </View>
        ) : (
          <FlatList
            data={filteredList}
            keyExtractor={item => item.case?._id || Math.random().toString()}
            renderItem={({ item }) => {
              const clientName = `${item.case?.userId?.firstName || ''} ${item.case?.userId?.lastName || ''}`;
              const initials = `${(item.case?.userId?.firstName || '?')[0]}${(item.case?.userId?.lastName || '?')[0]}`.toUpperCase();
              return (
                <TouchableOpacity
                  style={s.chatItem}
                  onPress={() => setSelectedChat(item)}
                >
                  <View style={s.chatAvatar}>
                    <Text style={s.chatAvatarText}>{initials}</Text>
                  </View>
                  <View style={s.chatInfo}>
                    <View style={s.chatRow}>
                      <Text style={s.chatName} numberOfLines={1}>{clientName}</Text>
                      {item.lastMessage && (
                        <Text style={s.chatTime}>{formatTime(item.lastMessage.createdAt)}</Text>
                      )}
                    </View>
                    <Text style={s.chatCase} numberOfLines={1}>{item.case?.caseTitle || 'Case'}</Text>
                    <View style={s.chatRow}>
                      <Text style={s.chatPreview} numberOfLines={1}>
                        {item.lastMessage?.message || 'No messages yet'}
                      </Text>
                      {item.unreadCount > 0 && (
                        <View style={s.unreadBadge}>
                          <Text style={s.unreadText}>{item.unreadCount}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>
    );
  }

  // Chat Messages View
  const clientName = `${selectedChat.case?.userId?.firstName || ''} ${selectedChat.case?.userId?.lastName || ''}`;

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Chat Header */}
      <View style={s.chatHeader}>
        <TouchableOpacity onPress={() => { setSelectedChat(null); setMessages([]); }} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color={CHARCOAL} />
        </TouchableOpacity>
        <View style={s.chatHeaderAvatar}>
          <Text style={s.chatHeaderAvatarText}>
            {`${(selectedChat.case?.userId?.firstName || '?')[0]}${(selectedChat.case?.userId?.lastName || '?')[0]}`.toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.chatHeaderName}>{clientName}</Text>
          <Text style={s.chatHeaderCase} numberOfLines={1}>
            {selectedChat.case?.caseTitle || 'Case'} {selectedChat.case?.caseNumber ? `• #${selectedChat.case.caseNumber}` : ''}
          </Text>
        </View>
      </View>

      {/* Messages */}
      {messagesLoading && messages.length === 0 ? (
        <ActivityIndicator size="large" color={PRIMARY_BROWN} style={{ flex: 1, alignSelf: 'center' }} />
      ) : (
        <FlatList
          ref={scrollRef}
          data={messages}
          keyExtractor={item => item._id}
          contentContainerStyle={s.messagesList}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={s.emptyState}>
              <Ionicons name="chatbubbles-outline" size={48} color="#ccc" />
              <Text style={s.emptyTitle}>No messages yet</Text>
              <Text style={s.emptySubtext}>Start the conversation!</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isMe = item.senderId?.email === currentUser?.email ||
                         item.senderId?._id === userData?._id ||
                         item.senderId?.email === userData?.email;
            const senderName = `${item.senderId?.firstName || ''} ${item.senderId?.lastName || ''}`;
            const senderRole = item.senderId?.role || item.senderRole;
            const displayName = senderRole && senderRole !== 'user'
              ? `${senderName} (${senderRole.charAt(0).toUpperCase() + senderRole.slice(1)})`
              : senderName;

            return (
              <View style={[s.msgRow, isMe && s.msgRowMe]}>
                {!isMe && <Text style={s.msgSender}>{displayName}</Text>}
                <View style={[s.msgBubble, isMe ? s.msgBubbleMe : s.msgBubbleOther]}>
                  <Text style={[s.msgText, isMe && s.msgTextMe]}>{item.message}</Text>
                  <Text style={[s.msgTime, isMe && s.msgTimeMe]}>{formatMessageTime(item.createdAt)}</Text>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Input */}
      <View style={s.inputBar}>
        <TextInput
          style={s.msgInput}
          placeholder="Type a message..."
          value={messageText}
          onChangeText={setMessageText}
          multiline
          maxLength={1000}
          placeholderTextColor="#999"
        />
        <TouchableOpacity
          style={[s.sendBtn, (!messageText.trim() || sending) && s.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!messageText.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={18} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  header: { backgroundColor: '#fff', paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 22, fontWeight: '700', color: CHARCOAL },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 12, marginTop: 12, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, gap: 8 },
  searchInput: { flex: 1, fontSize: 14, color: CHARCOAL },
  chatItem: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', backgroundColor: '#fff' },
  chatAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: PRIMARY_BROWN, justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 2, borderColor: PRIMARY_GOLD },
  chatAvatarText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  chatInfo: { flex: 1 },
  chatRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chatName: { fontSize: 15, fontWeight: '600', color: CHARCOAL, flex: 1, marginRight: 8 },
  chatTime: { fontSize: 11, color: '#999' },
  chatCase: { fontSize: 12, color: MUTED_OLIVE, marginTop: 2 },
  chatPreview: { fontSize: 12, color: '#999', flex: 1, marginTop: 4, marginRight: 8 },
  unreadBadge: { backgroundColor: PRIMARY_BROWN, borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 },
  unreadText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#aaa', marginTop: 12 },
  emptySubtext: { fontSize: 13, color: '#bbb', marginTop: 4 },
  chatHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingTop: 50, paddingBottom: 14, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  backBtn: { padding: 6, marginRight: 8 },
  chatHeaderAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: PRIMARY_BROWN, justifyContent: 'center', alignItems: 'center', marginRight: 10, borderWidth: 2, borderColor: PRIMARY_GOLD },
  chatHeaderAvatarText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  chatHeaderName: { fontSize: 15, fontWeight: '600', color: CHARCOAL },
  chatHeaderCase: { fontSize: 11, color: MUTED_OLIVE },
  messagesList: { padding: 16, paddingBottom: 8 },
  msgRow: { marginBottom: 14, maxWidth: '80%' },
  msgRowMe: { alignSelf: 'flex-end' },
  msgSender: { fontSize: 11, fontWeight: '600', color: PRIMARY_BROWN, marginBottom: 3, marginLeft: 12 },
  msgBubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16 },
  msgBubbleMe: { backgroundColor: PRIMARY_BROWN, borderBottomRightRadius: 4 },
  msgBubbleOther: { backgroundColor: '#fff', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#E0E0E0' },
  msgText: { fontSize: 14, color: CHARCOAL, lineHeight: 20 },
  msgTextMe: { color: '#fff' },
  msgTime: { fontSize: 10, color: '#999', marginTop: 4 },
  msgTimeMe: { color: 'rgba(255,255,255,0.7)', textAlign: 'right' },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#eee', gap: 8 },
  msgInput: { flex: 1, backgroundColor: '#f5f5f5', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, maxHeight: 100, color: CHARCOAL },
  sendBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: PRIMARY_BROWN, justifyContent: 'center', alignItems: 'center' },
  sendBtnDisabled: { backgroundColor: '#ccc' },
});
