import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from 'context/authContext';
import { fetchUserCases, fetchChatMessages, sendChatMessage, markChatAsRead } from '../../api/userApi';
import { PRIMARY_BROWN, PRIMARY_GOLD, CHARCOAL, MUTED_OLIVE } from 'utils/constants';

export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { userData, currentUser } = useAuth();
  const [cases, setCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState(params.caseId || null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showCaseList, setShowCaseList] = useState(!params.caseId);
  const flatListRef = useRef(null);
  const isFetchingRef = useRef(false);

  // Fetch user's cases
  useEffect(() => {
    const loadCases = async () => {
      try {
        const res = await fetchUserCases();
        setCases(res.data || []);
        if (params.caseId) {
          setSelectedCaseId(params.caseId);
          setShowCaseList(false);
        }
      } catch (error) {
        console.error('Error fetching cases:', error);
      } finally {
        setLoading(false);
      }
    };
    loadCases();
  }, []);

  // Fetch messages for selected case
  const loadMessages = useCallback(async () => {
    if (!selectedCaseId || isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const res = await fetchChatMessages(selectedCaseId);
      if (res.success) {
        setMessages(res.data || []);
      }
    } catch (error) {
      if (error.response?.status !== 429) {
        console.error('Error fetching messages:', error);
      }
    } finally {
      isFetchingRef.current = false;
    }
  }, [selectedCaseId]);

  useEffect(() => {
    if (selectedCaseId) {
      loadMessages();
      markChatAsRead(selectedCaseId).catch(() => {});
      const interval = setInterval(loadMessages, 15000);
      return () => clearInterval(interval);
    }
  }, [selectedCaseId, loadMessages]);

  const handleSend = async () => {
    if (!messageText.trim() || !selectedCaseId) return;
    try {
      setSending(true);
      const res = await sendChatMessage(selectedCaseId, messageText.trim());
      if (res.success) {
        setMessages(prev => [...prev, res.data]);
        setMessageText('');
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const selectCase = (caseId) => {
    setSelectedCaseId(caseId);
    setShowCaseList(false);
    setMessages([]);
  };

  const isMyMessage = (msg) => {
    return msg.senderId === userData?._id || msg.senderId === currentUser?.uid;
  };

  const renderMessage = ({ item }) => {
    const mine = isMyMessage(item);
    return (
      <View style={[ms.msgRow, mine && ms.msgRowMine]}>
        <View style={[ms.msgBubble, mine ? ms.msgBubbleMine : ms.msgBubbleOther]}>
          {!mine && <Text style={ms.senderName}>{item.senderName || 'Staff'}</Text>}
          <Text style={[ms.msgText, mine && ms.msgTextMine]}>{item.message}</Text>
          <Text style={[ms.msgTime, mine && ms.msgTimeMine]}>
            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={ms.center}>
        <ActivityIndicator size="large" color={PRIMARY_BROWN} />
      </View>
    );
  }

  // Case list view
  if (showCaseList) {
    return (
      <View style={ms.container}>
        <View style={ms.header}>
          <TouchableOpacity onPress={() => router.back()} style={ms.backBtn}>
            <Ionicons name="arrow-back" size={24} color={CHARCOAL} />
          </TouchableOpacity>
          <Text style={ms.headerTitle}>Messages</Text>
        </View>
        {cases.length === 0 ? (
          <View style={ms.center}>
            <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
            <Text style={ms.emptyText}>No cases available for chat</Text>
          </View>
        ) : (
          <FlatList
            data={cases}
            keyExtractor={item => item._id}
            renderItem={({ item }) => (
              <TouchableOpacity style={ms.caseItem} onPress={() => selectCase(item._id)}>
                <View style={ms.caseIcon}>
                  <Ionicons name="chatbubble-ellipses" size={22} color={PRIMARY_BROWN} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={ms.caseName}>{item.caseTitle || item.caseNature || 'Case'}</Text>
                  <Text style={ms.caseNumber}>{item.caseNumber || 'No case number'}</Text>
                  <Text style={ms.caseSub}>
                    {item.attorneyId ? `Attorney: ${item.attorneyId.firstName || ''} ${item.attorneyId.lastName || ''}` : 'No attorney assigned'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    );
  }

  // Chat view
  const selectedCase = cases.find(c => c._id === selectedCaseId);

  return (
    <KeyboardAvoidingView style={ms.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Chat Header */}
      <View style={ms.header}>
        <TouchableOpacity onPress={() => setShowCaseList(true)} style={ms.backBtn}>
          <Ionicons name="arrow-back" size={24} color={CHARCOAL} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={ms.headerTitle} numberOfLines={1}>{selectedCase?.caseTitle || 'Chat'}</Text>
          <Text style={ms.headerSub}>{selectedCase?.caseNumber || ''}</Text>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item, i) => item._id || i.toString()}
        renderItem={renderMessage}
        contentContainerStyle={ms.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <View style={ms.center}>
            <Ionicons name="chatbubble-outline" size={48} color="#ddd" />
            <Text style={ms.emptyText}>No messages yet</Text>
            <Text style={{ color: '#aaa', fontSize: 12 }}>Start the conversation</Text>
          </View>
        }
      />

      {/* Input */}
      <View style={ms.inputContainer}>
        <TextInput
          style={ms.input}
          value={messageText}
          onChangeText={setMessageText}
          placeholder="Type a message..."
          placeholderTextColor="#aaa"
          multiline
        />
        <TouchableOpacity
          style={[ms.sendBtn, (!messageText.trim() || sending) && ms.sendBtnDisabled]}
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

const ms = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingBottom: 12, paddingHorizontal: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  backBtn: { marginRight: 12, padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: CHARCOAL },
  headerSub: { fontSize: 12, color: MUTED_OLIVE },
  caseItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  caseIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: `${PRIMARY_BROWN}15`, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  caseName: { fontSize: 15, fontWeight: '600', color: CHARCOAL },
  caseNumber: { fontSize: 12, color: MUTED_OLIVE, marginTop: 2 },
  caseSub: { fontSize: 12, color: '#aaa', marginTop: 2 },
  messagesList: { padding: 12, paddingBottom: 8, flexGrow: 1 },
  msgRow: { marginBottom: 8, alignItems: 'flex-start' },
  msgRowMine: { alignItems: 'flex-end' },
  msgBubble: { maxWidth: '78%', borderRadius: 16, padding: 12 },
  msgBubbleMine: { backgroundColor: PRIMARY_BROWN, borderBottomRightRadius: 4 },
  msgBubbleOther: { backgroundColor: '#fff', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#eee' },
  senderName: { fontSize: 11, fontWeight: '600', color: PRIMARY_BROWN, marginBottom: 4 },
  msgText: { fontSize: 14, color: CHARCOAL, lineHeight: 20 },
  msgTextMine: { color: '#fff' },
  msgTime: { fontSize: 10, color: '#aaa', marginTop: 4, alignSelf: 'flex-end' },
  msgTimeMine: { color: 'rgba(255,255,255,0.7)' },
  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee' },
  input: { flex: 1, backgroundColor: '#f5f5f5', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, maxHeight: 100, color: CHARCOAL },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: PRIMARY_BROWN, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  sendBtnDisabled: { backgroundColor: '#ccc' },
  emptyText: { fontSize: 16, color: '#aaa', marginTop: 12 },
});
