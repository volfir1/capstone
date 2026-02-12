import React, { useState, useEffect, useReducer, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Title,
  Text,
  Box,
  Group,
  Stack,
  ActionIcon,
  Loader,
  Center,
  SimpleGrid,
  Badge,
  Tabs,
  Modal,
  Button,
  Divider,
  Table,
  TextInput,
  Textarea,
  Radio,
  Stepper,
  Select,
  Grid,
  ScrollArea,
  Avatar,
  Menu,
  Tooltip,
  Pagination,
  PasswordInput,
  Progress,
} from '@mantine/core';
import { IconBriefcase, IconChevronRight, IconEye, IconFileText, IconCircleCheck, IconChevronLeft, IconMessageCircle, IconReceipt, IconSend, IconUser, IconDownload, IconClock, IconHistory, IconUserPlus, IconDots, IconRefresh, IconSearch, IconFilter, IconX, IconScale, IconClipboardText, IconFileDescription, IconGavel, IconHome, IconFileInvoice, IconUsersGroup, IconShieldLock, IconDeviceDesktop } from '@tabler/icons-react';
import jsPDF from 'jspdf';
import mammoth from 'mammoth';
import { notifications } from '@mantine/notifications';
import { PRIMARY_GOLD, PRIMARY_BROWN, MUTED_OLIVE, THEMED_LIGHT_BG, BG, CHARCOAL, ACCENT_TAN, NATURE_OF_CASE_OPTIONS, CATEGORY_COLORS } from '@utils/constants';
import apiClient from '@config/api/apiClient';
import { useAuth } from '@/context/authContext';
import { CaseInformationSection } from '../other/CaseInformationSection';

const APPOINTMENT_STATUS_OPTIONS = [
  { value: 'auto-scheduled', label: 'Auto-scheduled' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'legal-advice', label: 'Legal Advice' },
  { value: 'court-case', label: 'Court Case' },
  { value: 'rejected', label: 'Rejected' },
];

// Chat Modal Component
function ChatModal({ opened, onClose, caseData, messages, loading, sending, onSendMessage, onRefresh, userData }) {
  const [messageText, setMessageText] = useState('');
  const viewport = useRef(null);

  useEffect(() => {
    if (viewport.current && messages.length > 0) {
      viewport.current.scrollTo({ top: viewport.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  // Auto-refresh messages every 10 seconds
  useEffect(() => {
    if (opened && caseData) {
      const interval = setInterval(() => {
        onRefresh();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [opened, caseData, onRefresh]);

  const handleSend = () => {
    if (messageText.trim() && !sending) {
      onSendMessage(messageText);
      setMessageText('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!caseData) return null;

  const clientName = caseData.userId ? 
    `${caseData.userId.firstName || ''} ${caseData.userId.lastName || ''}`.trim() : 
    'Client';

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group>
          <Avatar color={PRIMARY_BROWN} radius="xl">
            <IconUser size={24} />
          </Avatar>
          <Box>
            <Text fw={700} size="lg" c={PRIMARY_BROWN}>
              {clientName}
            </Text>
            <Text size="xs" c={MUTED_OLIVE}>
              {caseData.caseNumber} • {caseData.caseType}
            </Text>
          </Box>
        </Group>
      }
      size="lg"
      padding={0}
      styles={{
        body: { padding: 0 },
        header: { borderBottom: `1px solid #F0F0F0`, padding: '16px 24px', margin: 0 },
        content: { display: 'flex', flexDirection: 'column', maxHeight: '80vh' },
      }}
    >
      <Box style={{ display: 'flex', flexDirection: 'column', height: '600px', maxHeight: '70vh' }}>
        {/* Messages Area */}
        <ScrollArea
          viewportRef={viewport}
          style={{ flex: 1, padding: '16px 24px' }}
          styles={{
            viewport: { '& > div': { display: 'block !important' } }
          }}
        >
          {loading ? (
            <Center py="xl">
              <Loader size="lg" color={PRIMARY_BROWN} />
            </Center>
          ) : messages.length === 0 ? (
            <Center py="xl">
              <Stack align="center" gap="sm">
                <IconMessageCircle size={48} color={MUTED_OLIVE} />
                <Text c={MUTED_OLIVE} size="sm">
                  No messages yet. Start the conversation!
                </Text>
              </Stack>
            </Center>
          ) : (
            <Stack gap="md">
              {messages.map((msg, idx) => {
                // Admin messages have senderRole as attorney/intern/secretary
                // Client messages have senderRole as undefined or 'user'
                const isCurrentUser = msg.senderRole && ['attorney', 'intern', 'secretary'].includes(msg.senderRole);
                const senderName = msg.senderId?.firstName && msg.senderId?.lastName 
                  ? `${msg.senderId.firstName} ${msg.senderId.lastName}`
                  : msg.senderId?.email || 'Unknown';
                
                console.log('Message:', {
                  message: msg.message,
                  senderRole: msg.senderRole,
                  senderId: msg.senderId,
                  senderName,
                  isCurrentUser
                });
                
                return (
                  <Box
                    key={idx}
                    style={{
                      alignSelf: isCurrentUser ? 'flex-end' : 'flex-start',
                      maxWidth: '70%',
                    }}
                  >
                    <Paper
                      p="md"
                      radius="lg"
                      style={{
                        backgroundColor: isCurrentUser ? PRIMARY_BROWN : THEMED_LIGHT_BG,
                        color: isCurrentUser ? 'white' : CHARCOAL,
                      }}
                    >
                      {!isCurrentUser && (
                        <Text size="xs" fw={600} mb={4} style={{ opacity: 0.8 }}>
                          {msg.senderId?.firstName || msg.senderId?.lastName ? 
                            `${msg.senderId.firstName || ''} ${msg.senderId.lastName || ''}`.trim() : 
                            clientName}
                          {msg.senderRole && ` (${msg.senderRole})`}
                        </Text>
                      )}
                      <Text size="sm" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {msg.message}
                      </Text>
                      <Text
                        size="xs"
                        mt={4}
                        style={{ opacity: 0.7, textAlign: 'right' }}
                      >
                        {new Date(msg.createdAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </Paper>
                  </Box>
                );
              })}
            </Stack>
          )}
        </ScrollArea>

        {/* Message Input */}
        <Box
          style={{
            padding: '16px 24px',
            borderTop: `1px solid #F0F0F0`,
            backgroundColor: 'white',
          }}
        >
          <Group gap="sm" align="flex-end">
            <Textarea
              placeholder="Type your message..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              minRows={1}
              maxRows={4}
              autosize
              style={{ flex: 1 }}
              styles={{
                input: {
                  borderRadius: '20px',
                  border: `1px solid ${PRIMARY_GOLD}`,
                  '&:focus': { borderColor: PRIMARY_BROWN },
                },
              }}
            />
            <ActionIcon
              size="lg"
              radius="xl"
              variant="filled"
              style={{ backgroundColor: PRIMARY_BROWN }}
              onClick={handleSend}
              loading={sending}
              disabled={!messageText.trim() || sending}
            >
              <IconSend size={18} />
            </ActionIcon>
          </Group>
        </Box>
      </Box>
    </Modal>
  );
}

// Initial state
const initialState = {
  // Data
  finalized: [],
  caseRecordsMap: {},
  
  // UI
  activeTab: 'accepted',
  searchTerm: '',
  categoryFilter: 'all',
  loading: false,
  loadingFinalized: false,
  saving: false,
  
  // Review Modal
  modalOpened: false,
  selectedCase: null,
  editMode: false,
  editedData: null,
  activeStep: 0,
  
  // Case Record Modal
  caseRecordModalOpened: false,
  caseRecordData: {},
  selectedCaseId: null,
  caseRecordEditMode: false,
  
  // Appointment Receipt Modal
  appointmentModalOpened: false,
  appointmentDetails: null,
  loadingAppointment: false,
  appointmentEditMode: false,
  appointmentForm: {
    status: '',
    appointedDate: '',
    appointmentTime: '',
    fullName: '',
    age: '',
    birthday: '',
    sex: '',
    civilStatus: '',
    citizenship: '',
    contactNumber: '',
    email: '',
    presentAddress: '',
    permanentAddress: '',
    spouseName: '',
    relatorName: '',
    relatorContactNumber: '',
    currentSourceOfIncome: '',
    monthlyIncome: '',
    natureOfWork: '',
    employerName: '',
    employerAddress: '',
    partyRepresented: '',
    venue: '',
    presentStage: '',
    courtDivision: '',
    courtAddress: '',
    caseDescription: '',
    caseNature: '',
    presidingOfficer: '',
    appointmentType: '',
  },
  appointmentSaving: false,
  
  // Chat Modal
  chatModalOpened: false,
  selectedCaseForChat: null,
  chatMessages: [],
  loadingMessages: false,
  sendingMessage: false,
  
  // Version History Modal
  versionHistoryModalOpened: false,
  selectedCaseForVersions: null,
  documentVersions: [],
  
  // Document Viewer Modal (for version history preview)
  documentViewerModalOpened: false,
  currentViewingDoc: null,
  wordDocHtml: null,
  wordDocLoading: false,
  
  // Create Account Modal
  createAccountModalOpened: false,
  selectedCaseForAccount: null,
  accountForm: {
    username: '',
    password: '',
    email: '',
  },
  creatingAccount: false,
};

// Reducer function
function stateReducer(state, action) {
  switch (action.type) {
    case 'SET_FINALIZED':
      return { ...state, finalized: action.payload };
    case 'SET_CASE_RECORDS_MAP':
      return { ...state, caseRecordsMap: action.payload };
    case 'SET_LOADING_FINALIZED':
      return { ...state, loadingFinalized: action.payload };
    case 'SET_SAVING':
      return { ...state, saving: action.payload };
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };
    case 'SET_SEARCH_TERM':
      return { ...state, searchTerm: action.payload };
    case 'SET_CATEGORY_FILTER':
      return { ...state, categoryFilter: action.payload };
    
    // Review Modal actions
    case 'OPEN_REVIEW_MODAL':
      return {
        ...state,
        modalOpened: true,
        selectedCase: action.payload,
        editedData: JSON.parse(JSON.stringify(action.payload)),
        editMode: false,
        activeStep: 0,
      };
    case 'CLOSE_REVIEW_MODAL':
      return { ...state, modalOpened: false, editMode: false };
    case 'SET_EDIT_MODE':
      return { ...state, editMode: action.payload };
    case 'SET_EDITED_DATA':
      return { ...state, editedData: action.payload };
    case 'SET_ACTIVE_STEP':
      return { ...state, activeStep: action.payload };
    
    // Appointment Receipt Modal actions
    case 'OPEN_APPOINTMENT_MODAL':
      return { ...state, appointmentModalOpened: true, loadingAppointment: true, appointmentEditMode: false, appointmentSaving: false };
    case 'CLOSE_APPOINTMENT_MODAL':
      return { ...state, appointmentModalOpened: false, appointmentDetails: null, appointmentEditMode: false, appointmentForm: { status: '', appointedDate: '', appointmentTime: '' }, appointmentSaving: false };
    case 'SET_APPOINTMENT_DETAILS':
      return { ...state, appointmentDetails: action.payload, loadingAppointment: false };
    case 'SET_LOADING_APPOINTMENT':
      return { ...state, loadingAppointment: action.payload };
    case 'SET_APPOINTMENT_EDIT_MODE':
      return { ...state, appointmentEditMode: action.payload };
    case 'SET_APPOINTMENT_FORM':
      return { ...state, appointmentForm: action.payload };
    case 'SET_APPOINTMENT_SAVING':
      return { ...state, appointmentSaving: action.payload };
    
    // Chat Modal actions
    case 'OPEN_CHAT_MODAL':
      return { ...state, chatModalOpened: true, selectedCaseForChat: action.payload, loadingMessages: true };
    case 'CLOSE_CHAT_MODAL':
      return { ...state, chatModalOpened: false, selectedCaseForChat: null, chatMessages: [] };
    case 'SET_CHAT_MESSAGES':
      return { ...state, chatMessages: action.payload, loadingMessages: false };
    case 'SET_LOADING_MESSAGES':
      return { ...state, loadingMessages: action.payload };
    case 'SET_SENDING_MESSAGE':
      return { ...state, sendingMessage: action.payload };
    case 'ADD_CHAT_MESSAGE':
      return { ...state, chatMessages: [...state.chatMessages, action.payload] };
    
    // Version History Modal actions
    case 'OPEN_VERSION_HISTORY_MODAL':
      return {
        ...state,
        versionHistoryModalOpened: true,
        selectedCaseForVersions: action.payload.case,
        documentVersions: action.payload.versions || [],
      };
    case 'CLOSE_VERSION_HISTORY_MODAL':
      return {
        ...state,
        versionHistoryModalOpened: false,
        selectedCaseForVersions: null,
        documentVersions: [],
      };
    
    // Document Viewer Modal actions (for version history preview)
    case 'OPEN_DOCUMENT_VIEWER_MODAL':
      return {
        ...state,
        documentViewerModalOpened: true,
        currentViewingDoc: action.payload,
      };
    case 'CLOSE_DOCUMENT_VIEWER_MODAL':
      return {
        ...state,
        documentViewerModalOpened: false,
        currentViewingDoc: null,
        wordDocHtml: null,
        wordDocLoading: false,
      };
    case 'SET_WORD_DOC_HTML':
      return { ...state, wordDocHtml: action.payload };
    case 'SET_WORD_DOC_LOADING':
      return { ...state, wordDocLoading: action.payload };
    
    // Create Account Modal actions
    case 'OPEN_CREATE_ACCOUNT_MODAL':
      return {
        ...state,
        createAccountModalOpened: true,
        selectedCaseForAccount: action.payload,
        accountForm: {
          username: '',
          password: '',
          email: '',
        },
        creatingAccount: false,
      };
    case 'CLOSE_CREATE_ACCOUNT_MODAL':
      return {
        ...state,
        createAccountModalOpened: false,
        selectedCaseForAccount: null,
        accountForm: { username: '', password: '', email: '' },
        creatingAccount: false,
      };
    case 'SET_ACCOUNT_FORM':
      return { ...state, accountForm: action.payload };
    case 'SET_CREATING_ACCOUNT':
      return { ...state, creatingAccount: action.payload };
    
    // Case Record Modal actions
    case 'OPEN_CASE_RECORD_MODAL':
      return {
        ...state,
        caseRecordModalOpened: true,
        selectedCaseId: action.payload.caseId,
        caseRecordData: action.payload.data,
        caseRecordEditMode: false,
      };
    case 'CLOSE_CASE_RECORD_MODAL':
      return {
        ...state,
        caseRecordModalOpened: false,
        caseRecordData: {},
        caseRecordEditMode: false,
      };
    case 'SET_CASE_RECORD_EDIT_MODE':
      return { ...state, caseRecordEditMode: action.payload };
    case 'SET_CASE_RECORD_DATA':
      return { ...state, caseRecordData: action.payload };
    
    default:
      return state;
  }
}

export default function FinalizedCases() {
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(stateReducer, initialState);
  const { userData } = useAuth();

  const formatDate = (value) => {
    if (!value) return '-';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  const formatText = (value) => {
    if (value === null || value === undefined || value === '') return '-';
    // Normalize any HTML breaks into real newlines so PDF shows plain text
    return String(value)
      .replace(/<br\s*\/?>(\r?\n)?/gi, '\n')
      .replace(/\n/g, '\n');
  };

  // Helper function to add date/time header to all pages of a PDF
  const addDateTimeHeaderToAllPages = (doc) => {
    const totalPages = doc.internal.getNumberOfPages();
    const now = new Date();
    const dateTimeStr = now.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      const pageWidth = doc.internal.pageSize.getWidth();
      doc.setFont('times', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated: ${dateTimeStr}`, pageWidth - 14, 8, { align: 'right' });
    }
  };

  const toInputDate = (value) => {
    if (!value) return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '';
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const syncAppointmentFormFromDetails = (details) => ({
    status: details?.status || '',
    appointedDate: toInputDate(details?.appointedDate),
    appointmentTime: details?.appointmentTime || '',
    fullName: details?.fullName || details?.name || '',
    age: details?.age !== undefined && details?.age !== null ? String(details.age) : '',
    birthday: toInputDate(details?.birthday),
    sex: details?.sex || '',
    civilStatus: details?.civilStatus || '',
    citizenship: details?.citizenship || '',
    contactNumber: details?.contactNumber || '',
    email: details?.email || '',
    presentAddress: details?.presentAddress || '',
    permanentAddress: details?.permanentAddress || '',
    spouseName: details?.spouseName || '',
    relatorName: details?.relatorName || '',
    relatorContactNumber: details?.relatorContactNumber || '',
    currentSourceOfIncome: details?.currentSourceOfIncome || '',
    monthlyIncome: details?.monthlyIncome !== undefined && details?.monthlyIncome !== null ? String(details.monthlyIncome) : '',
    natureOfWork: details?.natureOfWork || '',
    employerName: details?.employerName || '',
    employerAddress: details?.employerAddress || '',
    partyRepresented: details?.partyRepresented || '',
    venue: details?.venue || '',
    presentStage: details?.presentStage || '',
    courtDivision: details?.courtDivision || '',
    courtAddress: details?.courtAddress || '',
    presidingOfficer: details?.presidingOfficer || '',
    caseDescription: details?.caseDescription || '',
    caseNature: details?.caseNature || details?.natureOfCase || '',
    appointmentType: details?.caseDetails?.appointmentType || details?.appointmentType || details?.personal?.legalMatter || '',
  });

  const renderSectionRows = (doc, startY, title, rows) => {
    if (!rows || rows.length === 0) return startY;
    const pageHeight = doc.internal.pageSize.getHeight();
    let y = startY;

    const addPageIfNeeded = (extra = 0) => {
      if (y + extra > pageHeight - 15) {
        doc.addPage();
        y = 20;
      }
    };

    doc.setFontSize(14);
    doc.setTextColor(74, 53, 31);
    addPageIfNeeded(10);
    doc.text(title, 14, y);
    y += 6;

    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    const startX = 12;
    const labelBoxW = 55;
    const valueBoxW = 125;
    const lineHeight = 6;
    rows.forEach(({ label, value }) => {
      const v = value === undefined || value === null || value === '' ? '-' : String(value);
      const splitLabel = doc.splitTextToSize(label, 50);
      const splitValue = doc.splitTextToSize(v, 160);
      const blockHeight = Math.max(splitLabel.length, splitValue.length) * lineHeight;
      const rowHeight = blockHeight + 4;
      addPageIfNeeded(rowHeight + 6);
      const rowTop = y - 2;
      // draw table cells
      doc.rect(startX, rowTop, labelBoxW, rowHeight + 2);
      doc.rect(startX + labelBoxW, rowTop, valueBoxW, rowHeight + 2);
      // text with small padding
      doc.text(splitLabel, startX + 3, y + 2);
      doc.text(splitValue, startX + labelBoxW + 3, y + 2);
      y += rowHeight + 2;
    });

    return y + 4;
  };

  const renderEvidenceToPdf = (doc, startY, title, evidence = []) => {
    if (!evidence || evidence.length === 0) return startY;
    const pageHeight = doc.internal.pageSize.getHeight();
    const colWidths = [45, 50, 55, 45];
    const startX = 12;
    let y = startY;

    const addPageIfNeeded = (extra = 0) => {
      if (y + extra > pageHeight - 15) {
        doc.addPage();
        y = 20;
      }
    };

    // Section title
    doc.setFontSize(14);
    doc.setTextColor(74, 53, 31);
    addPageIfNeeded(10);
    doc.text(title, startX + 2, y);
    y += 6;

    // Header
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    const headers = ['Type / Description', 'Author / Custodian', 'Purpose', 'Admissibility Issues'];
    const headerHeight = 8;
    addPageIfNeeded(headerHeight + 4);
    let xCursor = startX;
    headers.forEach((h, idx) => {
      doc.rect(xCursor, y, colWidths[idx], headerHeight);
      doc.text(doc.splitTextToSize(h, colWidths[idx] - 4), xCursor + 2, y + 5);
      xCursor += colWidths[idx];
    });
    y += headerHeight;

    // Rows
    evidence.forEach((row) => {
      const cells = [row?.type || '-', row?.author || '-', row?.purpose || '-', row?.issues || '-'];
      const wrappedHeights = cells.map((cell, idx) => {
        const lines = doc.splitTextToSize(String(cell || '-'), colWidths[idx] - 4);
        return { lines, height: lines.length * 6 };
      });
      const rowHeight = Math.max(...wrappedHeights.map(h => h.height)) + 4;
      addPageIfNeeded(rowHeight + 4);
      let x = startX;
      wrappedHeights.forEach((cell, idx) => {
        doc.rect(x, y, colWidths[idx], rowHeight);
        doc.text(cell.lines, x + 2, y + 6);
        x += colWidths[idx];
      });
      y += rowHeight;
    });

    return y + 6;
  };

  const downloadPdfDocument = (title, sections = []) => {
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    let y = 20;
    doc.setFont('times', 'normal');
    doc.setFontSize(18);
    doc.setTextColor(74, 53, 31);
    doc.text(title, 14, y);
    y += 10;

    sections.forEach(({ heading, rows, evidence }) => {
      if (rows) {
        y = renderSectionRows(doc, y, heading, rows);
      }
      if (evidence) {
        y = renderEvidenceToPdf(doc, y, heading, evidence);
      }
      y += 2;
    });

    addDateTimeHeaderToAllPages(doc);
    doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
  };

  const exportCaseRecordPdf = () => {
    if (!state.caseRecordData || Object.keys(state.caseRecordData).length === 0) {
      notifications.show({ title: 'Nothing to export', message: 'No case record data loaded.', color: 'yellow' });
      return;
    }

    const summaryRows = [
      { label: 'Case Title', value: formatText(state.caseRecordData.title) },
      { label: 'Case ID', value: formatText(state.caseRecordData.caseId) },
      { label: 'Nature of Case', value: formatText(state.caseRecordData.nature) },
      { label: 'Tribunal', value: formatText(state.caseRecordData.tribunal) },
      { label: 'Branch', value: formatText(state.caseRecordData.branch) },
      { label: 'Presiding Judge', value: formatText(state.caseRecordData.presidingJudge) },
      { label: 'Contact Details', value: formatText(state.caseRecordData.contactDetails || state.caseRecordData.telEmail) },
      { label: 'Created By', value: formatText(state.caseRecordData.createdBy) },
      { label: 'Last Modified By', value: formatText(state.caseRecordData.lastModifiedBy) },
    ];

    const partiesRows = [
      { label: 'Parties', value: formatText(state.caseRecordData.parties) },
      { label: 'Opposing Counsel', value: formatText(state.caseRecordData.opposingCounsel) },
      { label: 'Public Prosecutor', value: formatText(state.caseRecordData.publicProsecutor) },
      { label: 'Counsels', value: formatText(state.caseRecordData.counsels) },
    ];

    const addressesRows = [
      { label: 'Client Address', value: formatText(state.caseRecordData.clientAddress) },
      { label: 'Other Notes', value: formatText(state.caseRecordData.others) },
    ];

    const historyRows = [
      { label: 'Case History', value: formatText(state.caseRecordData.caseHistory) },
      { label: 'Remarks', value: formatText(state.caseRecordData.remarks) },
    ];

    // Build the same Case Record PDF as before, but add a final landscape page
    // that matches the printed form layout (CASE HISTORY / REMARKS).
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    let y = 20;
    doc.setFont('times', 'normal');
    doc.setFontSize(18);
    doc.setTextColor(74, 53, 31);
    doc.text('Case Record', 14, y);
    y += 10;

    const sections = [
      { heading: 'Case Record Summary', rows: summaryRows },
      { heading: 'Parties & Representation', rows: partiesRows },
      { heading: 'Addresses & Contact', rows: addressesRows },
      { heading: 'Case History & Remarks', rows: historyRows },
    ];

    sections.forEach(({ heading, rows }) => {
      if (rows) {
        y = renderSectionRows(doc, y, heading, rows);
      }
      y += 2;
    });

    // Landscape form page (matches your photo)
    doc.addPage('a4', 'landscape');
    drawCaseRecordHistoryRemarksPage(doc, {
      title: formatText(state.caseRecordData.title),
      caseId: formatText(state.caseRecordData.caseId),
      nature: formatText(state.caseRecordData.nature),
      tribunal: formatText(state.caseRecordData.tribunal),
      branch: formatText(state.caseRecordData.branch),
      presidingJudge: formatText(state.caseRecordData.presidingJudge),
      telEmail: formatText(state.caseRecordData.contactDetails || state.caseRecordData.telEmail),
      parties: formatText(state.caseRecordData.parties),
      contactDetails: formatText(state.caseRecordData.contactDetails || state.caseRecordData.telEmail),
      counsels: formatText(state.caseRecordData.counsels),
      publicProsecutor: formatText(state.caseRecordData.publicProsecutor),
      opposingCounsel: formatText(state.caseRecordData.opposingCounsel),
      clientAddress: formatText(state.caseRecordData.clientAddress),
      others: formatText(state.caseRecordData.others),
      caseHistory: formatText(state.caseRecordData.caseHistory),
      remarks: formatText(state.caseRecordData.remarks),
    });

    addDateTimeHeaderToAllPages(doc);
    doc.save('Case_Record.pdf');
  };

  const exportAppointmentPdf = () => {
    if (!state.appointmentDetails) {
      notifications.show({ title: 'Nothing to export', message: 'No appointment details loaded.', color: 'yellow' });
      return;
    }

    // If currently editing, export what’s on-screen (form) merged over details
    const exportData = state.appointmentEditMode
      ? { ...state.appointmentDetails, ...state.appointmentForm }
      : state.appointmentDetails;

    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    drawClientsInformationSheetPage(doc, exportData);
    addDateTimeHeaderToAllPages(doc);
    doc.save('Appointment_Receipt.pdf');
  };

  const exportRecommendationPdf = async () => {
    try {
      if (!state.editedData) {
        notifications.show({ title: 'Nothing to export', message: 'No review data loaded.', color: 'yellow' });
        return;
      }

      const d = state.editedData;
      const interview = d.content?.interviewInfo || {};
      const action = d.content?.actionInfo || {};
      const finalizeId = d._id || d.id;

      const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

      // Page 1
      drawRecommendationForActionTemplate(doc, {
        dateOfInterview: formatDate(interview.dateOfInterview || interview.dateInterview || d.dateOfInterview),
        clientName: formatText(d.clientName || interview.clientName),
        dateSubmitted: formatDate(action.signatureDate || d.updatedAt || d.createdAt),
        interviewingInterns: formatText(interview.interviewingInterns || interview.interviewingIntern || interview.internName),
        dutyDay: formatText(interview.dutyDay),

        // --- fillable areas ---
        fastFacts: formatText(interview.fastFacts),
        clientEvidence: Array.isArray(interview.clientEvidence) ? interview.clientEvidence : [],
        adversePartyEvidence: Array.isArray(interview.adversePartyEvidence) ? interview.adversePartyEvidence : [],
        internAdvice: formatText(interview.internAdvice),
        legalOpinion: formatText(interview.legalOpinion),
        forLegalAdvice: interview.forLegalAdvice === true || interview.forLegalAdvice === 'true' || interview.forLegalAdvice === 1 || interview.forLegalAdvice === '1',
      });

      // Page 2
      doc.addPage();
      drawRecommendationForActionDirectorPage(doc, {
        supervisingComment: formatText(action.supervisingComment),
        decision: formatText(action.decision || d.decision),
        decisionNote: formatText(action.decisionNote),
        assignedTo: formatText(action.assignedTo),
        supervisingLawyer: formatText(action.supervisingLawyer),
        directorSignature: formatText(action.directorSignature),
        signatureDate: formatDate(action.signatureDate),
      });

      // Page 3 (landscape Case Record form layout)
      let caseRecord = state.caseRecordData;
      const hasCaseRecordLoaded = caseRecord && Object.keys(caseRecord).length > 0;
      const isSameFinalizeId = state.selectedCaseId && finalizeId && state.selectedCaseId === finalizeId;

      if (!hasCaseRecordLoaded || !isSameFinalizeId) {
        // Attempt to fetch the case record for this finalized record.
        try {
          if (finalizeId) {
            const resp = await apiClient.get(`/caserecords/finalize/${finalizeId}`);
            caseRecord = resp?.data || resp?.data?.data || caseRecord;
          }
        } catch (err) {
          // If no case record exists, we'll still add the page (blank-ish) rather than failing export.
          console.warn('No case record found for third page:', err);
        }
      }

      doc.addPage('a4', 'landscape');
      drawCaseRecordHistoryRemarksPage(doc, {
        title: formatText(caseRecord?.title || d.content?.caseInfo?.title || d.title),
        caseId: formatText(caseRecord?.caseId || d.caseId),
        nature: formatText(caseRecord?.nature || d.content?.caseInfo?.nature || d.category),
        tribunal: formatText(caseRecord?.tribunal),
        branch: formatText(caseRecord?.branch),
        presidingJudge: formatText(caseRecord?.presidingJudge),
        telEmail: formatText(caseRecord?.contactDetails || caseRecord?.telEmail || d.content?.interviewInfo?.contactNumber || d.content?.interviewInfo?.email),
        parties: formatText(caseRecord?.parties),
        contactDetails: formatText(caseRecord?.contactDetails || caseRecord?.telEmail),
        counsels: formatText(caseRecord?.counsels),
        publicProsecutor: formatText(caseRecord?.publicProsecutor),
        opposingCounsel: formatText(caseRecord?.opposingCounsel),
        clientAddress: formatText(caseRecord?.clientAddress || d.content?.interviewInfo?.presentAddress || d.content?.interviewInfo?.permanentAddress),
        others: formatText(caseRecord?.others),
        caseHistory: formatText(caseRecord?.caseHistory),
        remarks: formatText(caseRecord?.remarks),
      });

      addDateTimeHeaderToAllPages(doc);
      doc.save('Recommendation_For_Action.pdf');
    } catch (err) {
      console.error('exportRecommendationPdf failed:', err);
      notifications.show({
        title: 'PDF export failed',
        message: String(err?.message || err),
        color: 'red',
      });
    }
  };

  /**
 * Draws a "Recommendation for Action" form + fills data.
 * Coordinates are in mm.
 */
const drawRecommendationForActionTemplate = (doc, data = {}) => {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 12;

  // Layout tuning (adjust these to fine-tune spacing)
  const GAP_XS = 3;
  const GAP_SM = 4;
  const GAP_MD = 6;

  const FAST_FACTS_H = 34;
  const CLIENT_EVIDENCE_H = 50;
  const ADVERSE_EVIDENCE_H = 36;
  const ADVICE_H = 18;

  const setFont = (size, style = "normal") => {
    doc.setFont("times", style);
    doc.setFontSize(size);
  };

  const mmPerPt = 0.3528;
  const lineHeightMm = (fontSize) => fontSize * mmPerPt * (doc.getLineHeightFactor?.() || 1.15);

  const safeText = (v) => (v == null ? "" : String(v));

  const drawMultilineInRect = (text, x, y, w, h, fontSize = 9) => {
    setFont(fontSize, "normal");
    const padding = 2;
    const maxW = Math.max(1, w - padding * 2);
    const maxH = Math.max(1, h - padding * 2);

    const lh = lineHeightMm(fontSize);
    const maxLines = Math.max(1, Math.floor(maxH / lh));

    const lines = doc.splitTextToSize(safeText(text), maxW).slice(0, maxLines);
    doc.text(lines, x + padding, y + padding + lh * 0.75); // baseline tweak
  };

  const normalizeEvidence = (arr, minRows, shape) => {
    const rows = Array.isArray(arr) ? arr.filter(Boolean) : [];
    const filled = rows.map((r) => ({
      ...shape,
      ...(r || {}),
    }));
    while (filled.length < minRows) filled.push({ ...shape });
    return filled.slice(0, minRows);
  };

  const drawTable = (x, y, w, h, headers, colRatios, rowData = [], bodyRows = 3) => {
    doc.rect(x, y, w, h);

    const headerH = 8;
    doc.line(x, y + headerH, x + w, y + headerH);

    // verticals + header text
    let xCursor = x;
    setFont(9, "bold");
    headers.forEach((header, i) => {
      const cw = w * colRatios[i];
      const cx = xCursor + cw / 2;

      if (i !== 0) doc.line(xCursor, y, xCursor, y + h);

      doc.text(header, cx, y + 5.5, { align: "center", maxWidth: cw - 2 });
      xCursor += cw;
    });

    // body row lines
    const bodyH = h - headerH;
    const rowH = bodyH / bodyRows;
    for (let r = 1; r < bodyRows; r++) {
      doc.line(x, y + headerH + r * rowH, x + w, y + headerH + r * rowH);
    }

    // cell text
    const fontSize = 8.5;
    setFont(fontSize, "normal");
    const lh = lineHeightMm(fontSize);

    for (let r = 0; r < bodyRows; r++) {
      const rowTop = y + headerH + r * rowH;
      const maxLines = Math.max(1, Math.floor((rowH - 2) / lh));

      let cellX = x;
      for (let c = 0; c < headers.length; c++) {
        const cw = w * colRatios[c];
        const padding = 2;

        const cellText = safeText(rowData?.[r]?.[c] ?? "");
        const lines = doc.splitTextToSize(cellText, Math.max(1, cw - padding * 2)).slice(0, maxLines);

        if (lines.length) {
          doc.text(lines, cellX + padding, rowTop + 4.5); // inside row
        }

        cellX += cw;
      }
    }
  };

  let y = margin;

  // Top-left small header
  setFont(9, "normal");
  doc.text("SOLA FORM", margin, y);
  doc.text("Revised September 2020", margin, y + 4);
  y += 10;

  // Header boxes
  const headerH = 18;
  const rightBoxW = 62;
  const leftBoxW = pageW - margin * 2 - rightBoxW;

  doc.rect(margin, y, leftBoxW, headerH);
  doc.rect(margin + leftBoxW, y, rightBoxW, headerH);

  setFont(10, "normal");
  doc.text(
    [
      "San Sebastian Office of Legal Aid (SOLA)",
      "College of Law",
      "San Sebastian College - Recoletos, Manila",
    ],
    margin + 2,
    y + 6
  );

  setFont(10, "bold");
  doc.text("RECOMMENDATION FOR ACTION", margin + leftBoxW + rightBoxW / 2, y + 10, {
    align: "center",
    maxWidth: rightBoxW - 4,
  });

  y += headerH + GAP_SM;

  // Info box
  const infoH = 22;
  const infoW = pageW - margin * 2;
  const infoX = margin;
  const midX = infoX + infoW / 2;

  doc.rect(infoX, y, infoW, infoH);
  doc.line(midX, y, midX, y + infoH);

  setFont(10, "normal");
  doc.text("Date of Interview:", infoX + 2, y + 6);
  doc.text("Client's Name:", infoX + 2, y + 14);

  doc.text("Date Submitted:", midX + 2, y + 6);
  doc.text("Interviewing Intern/s:", midX + 2, y + 14);
  doc.text("Duty Day:", midX + 2, y + 20);

  // Values
  setFont(10, "normal");
  if (data.dateOfInterview) doc.text(safeText(data.dateOfInterview), infoX + 38, y + 6);
  if (data.clientName) doc.text(safeText(data.clientName), infoX + 32, y + 14);
  if (data.dateSubmitted) doc.text(safeText(data.dateSubmitted), midX + 34, y + 6);
  if (data.interviewingInterns) doc.text(safeText(data.interviewingInterns), midX + 44, y + 14);
  if (data.dutyDay) doc.text(safeText(data.dutyDay), midX + 18, y + 20);

  y += infoH + GAP_MD;

  // Fast Facts
  setFont(10, "bold");
  doc.text("Fast Facts", margin, y);
  y += GAP_XS;

  doc.rect(margin, y, pageW - margin * 2, FAST_FACTS_H);
  drawMultilineInRect(data.fastFacts, margin, y, pageW - margin * 2, FAST_FACTS_H, 9);
  y += FAST_FACTS_H + GAP_MD;

  // Evidence (Client)
  setFont(10, "bold");
  doc.text("Evidence on Hand / Available for the Client(s)", margin, y);
  y += GAP_XS;

  const clientRows = normalizeEvidence(data.clientEvidence, 3, { type: "", author: "", purpose: "", issues: "" });
  const clientRowData = clientRows.map((r) => [r.type, r.author, r.purpose, r.issues]);

  drawTable(
    margin,
    y,
    pageW - margin * 2,
    CLIENT_EVIDENCE_H,
    ["Type / Description", "Author / Custodian", "Purpose", "Admissibility Issues"],
    [0.28, 0.22, 0.20, 0.30],
    clientRowData,
    3
  );
  y += CLIENT_EVIDENCE_H + GAP_MD;

  // Evidence (Adverse)
  setFont(10, "bold");
  doc.text("Evidence on Hand / Available for the Adverse Party(ies)", margin, y);
  y += GAP_XS;

  const adverseRows = normalizeEvidence(data.adversePartyEvidence, 2, { type: "", author: "", issues: "" });
  const adverseRowData = adverseRows.map((r) => [r.type, r.author, r.issues]);

  drawTable(
    margin,
    y,
    pageW - margin * 2,
    ADVERSE_EVIDENCE_H,
    ["Type / Description", "Author / Custodian", "Admissibility Issues"],
    [0.35, 0.30, 0.35],
    adverseRowData,
    2
  );
  y += ADVERSE_EVIDENCE_H + (GAP_MD + 2);

  // Advice + checkbox
  setFont(10, "bold");
  doc.text("Interviewing Intern's Initial Advice to the Client(s)", margin, y);

  const cbSize = 3.5;
  const cbLabel = "For legal advice only";
  const cbX = pageW - margin - (cbSize + 2 + doc.getTextWidth(cbLabel));
  const cbY = y - 3;

  doc.rect(cbX, cbY, cbSize, cbSize);
  if (data.forLegalAdvice) {
    doc.line(cbX + 0.6, cbY + 0.6, cbX + cbSize - 0.6, cbY + cbSize - 0.6);
    doc.line(cbX + cbSize - 0.6, cbY + 0.6, cbX + 0.6, cbY + cbSize - 0.6);
  }

  setFont(10, "normal");
  doc.text(cbLabel, cbX + cbSize + 2, y);

  y += GAP_XS;

  doc.rect(margin, y, pageW - margin * 2, ADVICE_H);
  drawMultilineInRect(data.internAdvice, margin, y, pageW - margin * 2, ADVICE_H, 9);
  y += ADVICE_H + (GAP_MD + 2);

  // Legal Opinion
  setFont(10, "bold");
  doc.text("Legal Opinion", margin, y);
  y += 4;

  const opinionH = Math.max(20, pageH - y - margin);
  doc.rect(margin, y, pageW - margin * 2, opinionH);
  drawMultilineInRect(data.legalOpinion, margin, y, pageW - margin * 2, opinionH, 9);
};

  /**
   * Draws the continuation page (Supervising Lawyer's Comment + Director's Action + Assigned To)
   * based on the provided page photo.
   */
  const drawRecommendationForActionDirectorPage = (doc, data = {}) => {
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 14;

    const setFont = (size, style = 'normal') => {
      doc.setFont('times', style);
      doc.setFontSize(size);
    };

    const safeText = (v) => (v == null ? '' : String(v));

    const mmPerPt = 0.3528;
    const lineHeightMm = (fontSize) => fontSize * mmPerPt * (doc.getLineHeightFactor?.() || 1.15);

    const drawRuledBox = (x, y, w, h, gap = 6) => {
      doc.rect(x, y, w, h);
      for (let yy = y + gap; yy < y + h; yy += gap) {
        doc.line(x, yy, x + w, yy);
      }
    };

    const drawMultilineInRect = (text, x, y, w, h, fontSize = 10) => {
      setFont(fontSize, 'normal');
      const padding = 2;
      const maxW = Math.max(1, w - padding * 2);
      const maxH = Math.max(1, h - padding * 2);
      const lh = lineHeightMm(fontSize);
      const maxLines = Math.max(1, Math.floor(maxH / lh));
      const lines = doc.splitTextToSize(safeText(text), maxW).slice(0, maxLines);
      doc.text(lines, x + padding, y + padding + lh * 0.75);
    };

    const drawLabelLine = (label, x, y, w) => {
      setFont(10, 'normal');
      doc.text(label, x, y);
      const lw = doc.getTextWidth(label);
      const lineX = x + lw + 2;
      doc.line(lineX, y + 0.8, x + w, y + 0.8);
      return lineX;
    };

    const decision = safeText(data.decision).toLowerCase();
    const isAccepted = decision.includes('accept');
    const isRejected = decision.includes('reject');
    const isPending = decision.includes('pend');

    const drawCheckbox = (x, yText, label, checked) => {
      const size = 3.5;
      const boxY = yText - 3;
      doc.rect(x, boxY, size, size);
      if (checked) {
        doc.line(x + 0.6, boxY + 0.6, x + size - 0.6, boxY + size - 0.6);
        doc.line(x + size - 0.6, boxY + 0.6, x + 0.6, boxY + size - 0.6);
      }
      setFont(10, 'normal');
      doc.text(label, x + size + 2, yText);
      return x + size + 2 + doc.getTextWidth(label);
    };

    const fullW = pageW - margin * 2;
    let y = margin;

    // Supervising Lawyer's Comment
    setFont(11, 'bold');
    doc.text("Supervising Lawyer's Comment", margin, y);
    y += 6;

    const commentH = 55;
    drawRuledBox(margin, y, fullW, commentH, 6);
    drawMultilineInRect(data.supervisingComment, margin, y, fullW, commentH, 10);
    y += commentH + 10;

    // Director's Action + checkboxes
    setFont(11, 'bold');
    doc.text("Director's Action", margin, y);

    const gap = 10;
    const labels = ['Accepted', 'Rejected', 'Pending'];
    const size = 3.5;
    const totalW =
      (size + 2 + doc.getTextWidth(labels[0])) +
      (size + 2 + doc.getTextWidth(labels[1])) +
      (size + 2 + doc.getTextWidth(labels[2])) +
      gap * 2;

    let xCb = pageW - margin - totalW;
    xCb = drawCheckbox(xCb, y, 'Accepted', isAccepted) + gap;
    xCb = drawCheckbox(xCb, y, 'Rejected', isRejected) + gap;
    drawCheckbox(xCb, y, 'Pending', isPending);

    y += 6;
    setFont(10, 'normal');
    doc.text('If accepted/pending, instruction(s); if rejected, reason(s):', margin, y);
    y += 5;

    const actionH = 60;
    drawRuledBox(margin, y, fullW, actionH, 6);
    drawMultilineInRect(data.decisionNote, margin, y, fullW, actionH, 10);
    y += actionH + 12;

    // Assigned to (two columns)
    setFont(11, 'bold');
    doc.text('Assigned to:', margin, y);
    y += 10;

    const colGap = 18;
    const colW = (fullW - colGap) / 2;
    const leftX = margin;
    const rightX = margin + colW + colGap;

    // Left: Law Interns
    setFont(10, 'normal');
    doc.text('Law Interns:', leftX, y);
    doc.line(leftX, y + 6, leftX + colW, y + 6);
    drawMultilineInRect(data.assignedTo, leftX, y + 1, colW, 18, 10);

    // Right: Supervising Lawyer / Director's Signature / Date
    drawLabelLine('Supervising Lawyer:', rightX, y, colW);
    drawMultilineInRect(data.supervisingLawyer, rightX + 40, y - 4, colW - 40, 10, 10);

    y += 12;
    drawLabelLine("Director's Signature:", rightX, y, colW);
    drawMultilineInRect(data.directorSignature, rightX + 42, y - 4, colW - 42, 10, 10);

    y += 12;
    drawLabelLine('Date:', rightX, y, colW);
    drawMultilineInRect(data.signatureDate, rightX + 12, y - 4, colW - 12, 10, 10);

    // Defensive: keep within page
    if (y > pageH - margin) return;
  };

  /**
   * Case Record: landscape form page (header fields + CASE HISTORY + REMARKS/NOTES)
   * based on the provided form photo.
   */
  const drawCaseRecordHistoryRemarksPage = (doc, data = {}) => {
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 10;
    const w = pageW - margin * 2;

    const setFont = (size, style = 'normal') => {
      doc.setFont('times', style);
      doc.setFontSize(size);
    };

    const safeText = (v) => (v == null ? '' : String(v));

    const mmPerPt = 0.3528;
    const lineHeightMm = (fontSize) => fontSize * mmPerPt * (doc.getLineHeightFactor?.() || 1.15);

    const drawMultilineInRect = (text, x, y, w, h, fontSize = 9) => {
      setFont(fontSize, 'normal');
      const padding = 2;
      const maxW = Math.max(1, w - padding * 2);
      const maxH = Math.max(1, h - padding * 2);
      const lh = lineHeightMm(fontSize);
      const maxLines = Math.max(1, Math.floor(maxH / lh));
      const lines = doc.splitTextToSize(safeText(text), maxW).slice(0, maxLines);
      doc.text(lines, x + padding, y + padding + lh * 0.75);
    };

    const drawRuledRect = (x, y, w, h, gap = 6) => {
      doc.rect(x, y, w, h);
      for (let yy = y + gap; yy < y + h; yy += gap) {
        doc.line(x, yy, x + w, yy);
      }
    };

    const drawLabeledLine = (label, value, x, y, colW, labelW = 36) => {
      setFont(9, 'normal');
      doc.text(label, x + 2, y);
      const lineX = x + labelW;
      doc.line(lineX, y + 0.6, x + colW - 2, y + 0.6);
      const maxW = Math.max(1, colW - labelW - 4);
      const lines = doc.splitTextToSize(safeText(value), maxW).slice(0, 1);
      if (lines.length) {
        doc.text(lines[0], lineX + 1, y);
      }
    };

    const x0 = margin;
    let y = margin;

    // Header block (two columns)
    const headerH = 58;
    doc.rect(x0, y, w, headerH);
    const midX = x0 + w / 2;
    doc.line(midX, y, midX, y + headerH);

    const colW = w / 2;
    const rowGap = 6;
    const leftX = x0;
    const rightX = midX;

    // Left column fields
    setFont(9, 'normal');
    const leftFields = [
      { label: 'Title of the Case:', value: data.title },
      { label: 'Case ID:', value: data.caseId },
      { label: 'Nature of the Case:', value: data.nature },
      { label: 'Tribunal:', value: data.tribunal },
      { label: 'Branch:', value: data.branch },
      { label: 'Presiding Judge:', value: data.presidingJudge },
      { label: 'Tel/Email:', value: data.telEmail },
    ];
    leftFields.forEach((f, i) => {
      drawLabeledLine(f.label, f.value, leftX, y + 6 + i * rowGap, colW, 44);
    });

    // Parties (multi-line) in left column
    setFont(9, 'normal');
    const partiesY = y + 6 + leftFields.length * rowGap;
    doc.text('Party/ies:', leftX + 2, partiesY);
    doc.line(leftX + 44, partiesY + 0.6, leftX + colW - 2, partiesY + 0.6);
    drawMultilineInRect(data.parties, leftX + 44, partiesY - 4, colW - 46, 14, 9);

    // Right column fields
    const rightFields = [
      { label: 'Contact Details:', value: data.contactDetails },
      { label: 'Counsel/s on Record:', value: data.counsels },
      { label: 'Public Prosecutor:', value: data.publicProsecutor },
      { label: 'Opposing Counsel:', value: data.opposingCounsel },
    ];
    rightFields.forEach((f, i) => {
      drawLabeledLine(f.label, f.value, rightX, y + 6 + i * rowGap, colW, 52);
    });

    // Client address (multi-line)
    const addressY = y + 6 + rightFields.length * rowGap;
    setFont(9, 'normal');
    doc.text("Client/s Address:", rightX + 2, addressY);
    doc.line(rightX + 52, addressY + 0.6, rightX + colW - 2, addressY + 0.6);
    drawMultilineInRect(data.clientAddress, rightX + 52, addressY - 4, colW - 54, 14, 9);

    // Others (multi-line)
    const othersY = addressY + 2 * rowGap;
    doc.text('Others:', rightX + 2, othersY);
    doc.line(rightX + 52, othersY + 0.6, rightX + colW - 2, othersY + 0.6);
    drawMultilineInRect(data.others, rightX + 52, othersY - 4, colW - 54, 14, 9);

    y += headerH;

    // Bottom sections
    const sectionY = y;
    const sectionH = pageH - sectionY - margin;
    const leftSectionW = (w - 2) / 2;
    const rightSectionW = leftSectionW;
    const leftSectionX = x0;
    const rightSectionX = x0 + leftSectionW + 2;

    // Section header line
    doc.line(x0, sectionY, x0 + w, sectionY);

    setFont(10, 'bold');
    doc.text('CASE HISTORY', leftSectionX + leftSectionW / 2, sectionY + 7, { align: 'center' });
    setFont(8, 'normal');
    doc.text('(in reverse chronological order)', leftSectionX + leftSectionW / 2, sectionY + 12, { align: 'center' });

    setFont(10, 'bold');
    doc.text('REMARKS / REMINDERS / NOTES', rightSectionX + rightSectionW / 2, sectionY + 7, { align: 'center' });
    setFont(8, 'normal');
    doc.text('(deadlines/material dates, etc.)', rightSectionX + rightSectionW / 2, sectionY + 12, { align: 'center' });

    const boxY = sectionY + 14;
    const boxH = sectionH - 14;
    drawRuledRect(leftSectionX, boxY, leftSectionW, boxH, 6);
    drawRuledRect(rightSectionX, boxY, rightSectionW, boxH, 6);

    drawMultilineInRect(data.caseHistory, leftSectionX, boxY, leftSectionW, boxH, 9);
    drawMultilineInRect(data.remarks, rightSectionX, boxY, rightSectionW, boxH, 9);
  };

  // Filter function
  const filterCases = (cases) => {
    let filtered = cases;
    
    // Apply category filter
    if (state.categoryFilter !== 'all') {
      filtered = filtered.filter(f => {
        const caseNature = f.content?.caseInfo?.nature || f.category;
        return caseNature === state.categoryFilter;
      });
    }
    
    // Apply search filter
    if (state.searchTerm.trim()) {
      const search = state.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(f => {
        const caseId = (f.caseId || '').toLowerCase();
        const clientName = (f.clientName || f.content?.interviewInfo?.clientName || '').toLowerCase();
        return caseId.includes(search) || clientName.includes(search);
      });
    }
    
    return filtered;
  };

  const isLegalAdvice = (record) => {
    const caseType = record?.content?.interviewInfo?.caseType;
    return caseType === 'legal-advice';
  };

  const isDocumentDrafting = (record) => {
    const caseType = record?.content?.interviewInfo?.caseType;
    return caseType === 'legal-document';
  };

  const isCourtRepresentation = (record) => {
    const caseType = record?.content?.interviewInfo?.caseType;
    return caseType === 'court-representation';
  };

  // Group finalized records by decision and apply search filter
  const acceptedCases = filterCases(state.finalized.filter(f => f.decision === 'accepted'));
  
  // Separate by case type
  const legalAdviceCases = acceptedCases.filter(isLegalAdvice);
  const documentDraftingCases = acceptedCases.filter(isDocumentDrafting);
  
  // Court representation cases (not legal advice or document drafting)
  const courtRepresentationCases = acceptedCases.filter(f => !isLegalAdvice(f) && !isDocumentDrafting(f));
  
  // Split court representation cases by whether they have case records
  const acceptedWithRecord = courtRepresentationCases.filter(f => state.caseRecordsMap[f._id || f.id]);
  const acceptedWithoutRecord = courtRepresentationCases.filter(f => !state.caseRecordsMap[f._id || f.id]);

  const fetchFinalized = async () => {
    try {
      dispatch({ type: 'SET_LOADING_FINALIZED', payload: true });
      const resp = await apiClient.get('/finalize');
      const data = resp.data?.data ?? resp.data ?? [];
      const finalizedData = Array.isArray(data) ? data : [];
      const normalizedFinalized = finalizedData.map((item) => {
        if (item?.content?.interviewInfo) {
          const flag = item.content.interviewInfo.forLegalAdvice;
          const normalizedFlag = flag === true || flag === 'true' || flag === 1 || flag === '1';
          return {
            ...item,
            content: {
              ...item.content,
              interviewInfo: {
                ...item.content.interviewInfo,
                forLegalAdvice: normalizedFlag,
              }
            }
          };
        }
        return item;
      });

      dispatch({ type: 'SET_FINALIZED', payload: normalizedFinalized });
      
      // Check which accepted cases have case records
      const accepted = normalizedFinalized.filter(f => f.decision === 'accepted');
      const recordsMap = {};
      
      await Promise.all(
        accepted.map(async (caseData) => {
          try {
            const caseRecordResp = await apiClient.get(`/caserecords/finalize/${caseData._id || caseData.id}`);
            if (caseRecordResp.data) {
              recordsMap[caseData._id || caseData.id] = true;
            }
          } catch (err) {
            // No case record exists
            recordsMap[caseData._id || caseData.id] = false;
          }
        })
      );
      
      dispatch({ type: 'SET_CASE_RECORDS_MAP', payload: recordsMap });
    } catch (err) {
      console.error('Error fetching finalized records', err);
      dispatch({ type: 'SET_FINALIZED', payload: [] });
    } finally {
      dispatch({ type: 'SET_LOADING_FINALIZED', payload: false });
    }
  };

  useEffect(() => {
    fetchFinalized();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openModal = (caseData) => {
    dispatch({ type: 'OPEN_REVIEW_MODAL', payload: caseData });
  };

  const openCaseRecordModal = async (caseData) => {
    try {
      const caseId = caseData._id; // Use finalize _id instead of caseId
      
      // Try to fetch existing case record first
      try {
        const resp = await apiClient.get(`/caserecords/finalize/${caseId}`);
        if (resp.data) {
          dispatch({ type: 'OPEN_CASE_RECORD_MODAL', payload: { caseId, data: resp.data } });
          console.log('Loaded existing case record:', resp.data);
          return;
        }
      } catch (fetchErr) {
        // If not found, use data from finalize content
        console.log('No existing case record, using finalize content');
      }
      
      dispatch({ type: 'OPEN_CASE_RECORD_MODAL', payload: { caseId, data: caseData.content?.caseInfo || {} } });
    } catch (err) {
      console.error('Error opening case record:', err);
      dispatch({ type: 'OPEN_CASE_RECORD_MODAL', payload: { caseId: caseData._id, data: caseData.content?.caseInfo || {} } });
    }
  };

  // Function to fetch and display appointment details
  const openAppointmentModal = async (caseData) => {
    dispatch({ type: 'OPEN_APPOINTMENT_MODAL' });
    
    try {
      // Get the clientsinfo ID - it's stored as caseId in the finalize document
      // This caseId is actually the _id of the clientsinfo document (the appointment form)
      const clientInfoId = caseData.caseId;
      
      console.log('Fetching appointment details for clientInfoId:', clientInfoId);
      console.log('Case data:', caseData);
      
      if (!clientInfoId) {
        console.error('No client info ID found in case data');
        dispatch({ type: 'SET_LOADING_APPOINTMENT', payload: false });
        return;
      }
      
      const response = await apiClient.get(`/clientsinfo/${clientInfoId}`);
      const details = response.data;
      console.log('Appointment details:', details);
      dispatch({ type: 'SET_APPOINTMENT_DETAILS', payload: details });
      dispatch({ type: 'SET_APPOINTMENT_FORM', payload: syncAppointmentFormFromDetails(details) });
    } catch (error) {
      console.error('Error fetching appointment details:', error);
      dispatch({ type: 'SET_LOADING_APPOINTMENT', payload: false });
    }
  };

  const handleEnterAppointmentEdit = () => {
    if (!state.appointmentDetails) return;
    dispatch({ type: 'SET_APPOINTMENT_FORM', payload: syncAppointmentFormFromDetails(state.appointmentDetails) });
    dispatch({ type: 'SET_APPOINTMENT_EDIT_MODE', payload: true });
  };

  const handleCancelAppointmentEdit = () => {
    dispatch({ type: 'SET_APPOINTMENT_EDIT_MODE', payload: false });
    dispatch({ type: 'SET_APPOINTMENT_FORM', payload: syncAppointmentFormFromDetails(state.appointmentDetails) });
  };

  const handleSaveAppointmentDetails = async () => {
    if (!state.appointmentDetails?._id) return;

    const payload = {
      status: state.appointmentForm.status || undefined,
      appointedDate: state.appointmentForm.appointedDate || undefined,
      appointmentTime: state.appointmentForm.appointmentTime || '',
      fullName: state.appointmentForm.fullName || undefined,
      name: state.appointmentForm.fullName || undefined,
      age: state.appointmentForm.age ? Number(state.appointmentForm.age) : undefined,
      birthday: state.appointmentForm.birthday || undefined,
      sex: state.appointmentForm.sex || undefined,
      civilStatus: state.appointmentForm.civilStatus || undefined,
      citizenship: state.appointmentForm.citizenship || undefined,
      contactNumber: state.appointmentForm.contactNumber || undefined,
      email: state.appointmentForm.email || undefined,
      presentAddress: state.appointmentForm.presentAddress || undefined,
      permanentAddress: state.appointmentForm.permanentAddress || undefined,
      spouseName: state.appointmentForm.spouseName || undefined,
      relatorName: state.appointmentForm.relatorName || undefined,
      relatorContactNumber: state.appointmentForm.relatorContactNumber || undefined,
      currentSourceOfIncome: state.appointmentForm.currentSourceOfIncome || undefined,
      monthlyIncome: state.appointmentForm.monthlyIncome ? Number(state.appointmentForm.monthlyIncome) : undefined,
      natureOfWork: state.appointmentForm.natureOfWork || undefined,
      employerName: state.appointmentForm.employerName || undefined,
      employerAddress: state.appointmentForm.employerAddress || undefined,
      partyRepresented: state.appointmentForm.partyRepresented || undefined,
      venue: state.appointmentForm.venue || undefined,
      presentStage: state.appointmentForm.presentStage || undefined,
      courtDivision: state.appointmentForm.courtDivision || undefined,
      courtAddress: state.appointmentForm.courtAddress || undefined,
      presidingOfficer: state.appointmentForm.presidingOfficer || undefined,
      caseDescription: state.appointmentForm.caseDescription || undefined,
      caseNature: state.appointmentForm.caseNature || undefined,
      natureOfCase: state.appointmentForm.caseNature || undefined,
      appointmentType: state.appointmentForm.appointmentType || undefined,
    };

    dispatch({ type: 'SET_APPOINTMENT_SAVING', payload: true });

    try {
      const resp = await apiClient.put(`/clientsinfo/${state.appointmentDetails._id}`, payload);
      const updated = resp?.data || { ...state.appointmentDetails, ...payload };
      dispatch({ type: 'SET_APPOINTMENT_DETAILS', payload: updated });
      dispatch({ type: 'SET_APPOINTMENT_FORM', payload: syncAppointmentFormFromDetails(updated) });
      dispatch({ type: 'SET_APPOINTMENT_EDIT_MODE', payload: false });
      notifications.show({ title: 'Updated', message: 'Appointment details saved.', color: 'green' });
    } catch (err) {
      console.error('Error updating appointment details:', err);
      notifications.show({ title: 'Error', message: 'Failed to save appointment details.', color: 'red' });
    } finally {
      dispatch({ type: 'SET_APPOINTMENT_SAVING', payload: false });
    }
  };

  // Function to handle viewing documents (for version history preview)
  const handleViewDocument = async (documentData) => {
    // Reset Word doc state
    dispatch({ type: 'SET_WORD_DOC_HTML', payload: null });
    dispatch({ type: 'SET_WORD_DOC_LOADING', payload: false });
    
    if (!documentData) {
      console.warn('No document to view');
      return;
    }
    
    const docToView = {
      fileName: documentData.fileName,
      fileType: documentData.fileType,
      fileData: documentData.fileData,
      fileUrl: documentData.fileUrl,
      isServerFile: documentData.isServerFile || false
    };
    
    dispatch({ type: 'OPEN_DOCUMENT_VIEWER_MODAL', payload: docToView });
    
    // If it's a Word document, convert to HTML using mammoth
    const isWordDoc = docToView.fileType?.includes('word') || 
                     docToView.fileName?.endsWith('.docx') || 
                     docToView.fileName?.endsWith('.doc');
    
    if (isWordDoc && (docToView.fileUrl || docToView.fileData)) {
      dispatch({ type: 'SET_WORD_DOC_LOADING', payload: true });
      try {
        // Fetch the Word document from the server or use fileData
        const url = docToView.fileUrl || docToView.fileData;
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        
        // Convert to HTML using mammoth
        const result = await mammoth.convertToHtml({ arrayBuffer });
        dispatch({ type: 'SET_WORD_DOC_HTML', payload: result.value });
        
        if (result.messages.length > 0) {
          console.log('Mammoth conversion messages:', result.messages);
        }
      } catch (error) {
        console.error('Error converting Word document:', error);
        dispatch({ 
          type: 'SET_WORD_DOC_HTML', 
          payload: '<div style="padding: 20px; color: red;">Error loading document. Please try downloading instead.</div>' 
        });
      } finally {
        dispatch({ type: 'SET_WORD_DOC_LOADING', payload: false });
      }
    }
  };

  // Function to handle chat navigation - creates case if needed
  const handleChatNavigation = async (finalizedCase) => {
    try {
      let caseDoc = null;

      // Check if this finalized case already has a linked Case document
      if (finalizedCase.linkedCaseId) {
        try {
          const caseResponse = await apiClient.get(`/cases/${finalizedCase.linkedCaseId}`);
          caseDoc = caseResponse.data.data;
        } catch (err) {
          console.log('Linked case not found, will create new one');
        }
      }

      // If no linked case exists, create a new one
      if (!caseDoc) {
        const clientInfoId = finalizedCase.caseId; // The MongoDB _id of clientsinfo
        
        if (!clientInfoId) {
          notifications.show({
            title: 'Error',
            message: 'Cannot open chat: No client information found',
            color: 'red',
          });
          return;
        }

        // Get client info to find userId
        const clientResponse = await apiClient.get(`/clientsinfo/${clientInfoId}`);
        const clientData = clientResponse.data;
        
        if (!clientData.userId) {
          notifications.show({
            title: 'Error',
            message: 'Cannot open chat: Client not linked to user account',
            color: 'red',
          });
          return;
        }

        // Create a new case for this finalized case
        const caseTitle = finalizedCase.caseTitle || 
                         finalizedCase.content?.caseInfo?.title || 
                         `Case for ${finalizedCase.clientName}`;
        
        // Map finalized case category to Case model enum
        const categoryToTypeMap = {
          'Civil Case': 'Civil Law',
          'Criminal Case': 'Criminal Law',
          'Family Law': 'Family Law',
          'Labor and Employment': 'Labor Law',
          'Land and Property Disputes': 'Land and Property Law',
          'Contract Disputes': 'Commercial Law',
          'Personal Injury': 'Civil Law',
          'Debt Collection': 'Commercial Law',
          'Inheritance and Estate': 'Family Law',
          'Business and Commercial Law': 'Commercial Law',
          'Consumer Protection': 'Commercial Law',
          'Tax Law': 'Tax Law',
          'Immigration': 'Immigration Law',
          'Intellectual Property': 'Intellectual Property',
          'Environmental Law': 'Environmental Law',
          'Administrative Law': 'Administrative Law',
          'Human Rights Violation': 'Human Rights',
          'Cybercrime': 'Criminal Law',
          'Election Law': 'Administrative Law',
          'Other': 'Other'
        };
        
        const rawCategory = finalizedCase.content?.caseInfo?.nature || 
                           finalizedCase.category || 
                           'Other';
        
        const caseType = categoryToTypeMap[rawCategory] || 'Other';
        
        const newCasePayload = {
          userId: clientData.userId,
          caseTitle: caseTitle,
          caseType: caseType,
          shortDescription: finalizedCase.content?.interviewInfo?.natureOfLegalMatter || 
                           finalizedCase.content?.caseInfo?.nature || 
                           'Finalized case',
          detailedDescription: finalizedCase.content?.interviewInfo?.caseDescription || 
                              finalizedCase.content?.caseInfo?.description ||
                              'Case created from finalized case',
        };

        const createResponse = await apiClient.post('/cases/admin/create-case', newCasePayload);
        
        if (createResponse.data.success) {
          const newCaseId = createResponse.data.data.id;
          
          // Link this case to the finalized document
          await apiClient.put(`/finalize/${finalizedCase._id}`, {
            ...finalizedCase,
            linkedCaseId: newCaseId
          });
          
          // Get the full case object with user populated
          const newCaseResponse = await apiClient.get(`/cases/${newCaseId}`);
          caseDoc = newCaseResponse.data.data;
          
          // Update local state
          finalizedCase.linkedCaseId = newCaseId;
        } else {
          throw new Error('Failed to create case');
        }
      }

      // Open chat modal with the case
      dispatch({ type: 'OPEN_CHAT_MODAL', payload: caseDoc });
      fetchChatMessages(caseDoc._id);
      
    } catch (error) {
      console.error('Error handling chat navigation:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to open chat: ' + (error.response?.data?.message || error.message),
        color: 'red',
      });
    }
  };

  // Fetch chat messages for a case
  const fetchChatMessages = async (caseId) => {
    try {
      dispatch({ type: 'SET_LOADING_MESSAGES', payload: true });
      console.log('Admin fetching messages for caseId:', caseId);
      const response = await apiClient.get(`/chat/case/${caseId}`);
      
      console.log('Admin fetched messages:', response.data);
      if (response.data.success) {
        dispatch({ type: 'SET_CHAT_MESSAGES', payload: response.data.data });
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      dispatch({ type: 'SET_LOADING_MESSAGES', payload: false });
    }
  };

  // Send a message
  const handleSendMessage = async (messageText) => {
    if (!messageText.trim() || !state.selectedCaseForChat) return;

    try {
      dispatch({ type: 'SET_SENDING_MESSAGE', payload: true });
      
      const response = await apiClient.post('/chat/send', {
        caseId: state.selectedCaseForChat._id,
        message: messageText.trim(),
      });

      if (response.data.success) {
        // Refresh messages
        fetchChatMessages(state.selectedCaseForChat._id);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to send message',
        color: 'red',
      });
    } finally {
      dispatch({ type: 'SET_SENDING_MESSAGE', payload: false });
    }
  };

  const handleSaveCaseRecord = async () => {
    try {
      dispatch({ type: 'SET_SAVING', payload: true });
      console.log('Saving case record for finalizeId:', state.selectedCaseId);
      console.log('Data:', state.caseRecordData);
      
      const resp = await apiClient.put(`/caserecords/finalize/${state.selectedCaseId}`, state.caseRecordData);
      console.log('Save response:', resp.data);
      
      if (resp.data) {
        // Refetch finalized cases to update the caseRecordsMap
        await fetchFinalized();
        
        // Close the modal and reset edit mode
        dispatch({ type: 'SET_CASE_RECORD_EDIT_MODE', payload: false });
        dispatch({ type: 'CLOSE_CASE_RECORD_MODAL' });
        
        notifications.show({
          title: 'Success',
          message: 'Case record saved successfully! The case has been moved to "With Record" section.',
          color: 'green',
        });
      }
    } catch (err) {
      console.error('Error saving case record:', err);
      const errorMsg = err.response?.data?.error || err.message;
      notifications.show({
        title: 'Error',
        message: 'Failed to save case record: ' + errorMsg,
        color: 'red',
      });
    } finally {
      dispatch({ type: 'SET_SAVING', payload: false });
    }
  };

  const handleSaveChanges = async () => {
    try {
      dispatch({ type: 'SET_SAVING', payload: true });
      const resp = await apiClient.put(`/finalize/${state.editedData._id || state.editedData.id}`, state.editedData);
      if (resp.data) {
        // Refetch the entire list to ensure consistency
        await fetchFinalized();
        dispatch({ type: 'SET_EDITED_DATA', payload: resp.data });
        dispatch({ type: 'SET_EDIT_MODE', payload: false });
        alert('Changes saved successfully!');
      }
    } catch (err) {
      console.error('Error saving changes:', err);
      alert('Failed to save changes: ' + err.message);
    } finally {
      dispatch({ type: 'SET_SAVING', payload: false });
    }
  };

  const handleCreateClientAccount = async () => {
    try {
      if (!state.accountForm.username || !state.accountForm.password) {
        notifications.show({
          title: 'Validation Error',
          message: 'Username and password are required',
          color: 'red',
        });
        return;
      }

      dispatch({ type: 'SET_CREATING_ACCOUNT', payload: true });

      const resp = await apiClient.post('/auth/create-client-account', {
        finalizeId: state.selectedCaseForAccount._id,
        username: state.accountForm.username,
        password: state.accountForm.password,
        email: state.accountForm.email || undefined,
      });

      if (resp.data?.success) {
        notifications.show({
          title: 'Success',
          message: `Client account created successfully! Username: ${resp.data.data.username}`,
          color: 'green',
        });
        dispatch({ type: 'CLOSE_CREATE_ACCOUNT_MODAL' });
        // Refresh finalized cases to update the UI
        await fetchFinalized();
      }
    } catch (err) {
      console.error('Error creating client account:', err);
      const errorMsg = err.response?.data?.message || err.message;
      notifications.show({
        title: 'Error',
        message: `Failed to create client account: ${errorMsg}`,
        color: 'red',
      });
    } finally {
      dispatch({ type: 'SET_CREATING_ACCOUNT', payload: false });
    }
  };

  const updateEditedData = (path, value) => {
    const newData = { ...state.editedData };
    const keys = path.split('.');
    let current = newData;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    dispatch({ type: 'SET_EDITED_DATA', payload: newData });
  };

  const updateEvidence = (type, index, field, value) => {
    const newData = { ...state.editedData };
    if (!newData.content) newData.content = {};
    if (!newData.content.interviewInfo) newData.content.interviewInfo = {};
    if (!newData.content.interviewInfo[type]) newData.content.interviewInfo[type] = [];
    
    const evidence = [...newData.content.interviewInfo[type]];
    if (!evidence[index]) evidence[index] = {};
    evidence[index] = { ...evidence[index], [field]: value };
    newData.content.interviewInfo[type] = evidence;
    dispatch({ type: 'SET_EDITED_DATA', payload: newData });
  };

  const renderEvidenceTable = (title, evidence = [], fieldName) => {
    if (!state.editMode && (!evidence || evidence.length === 0)) return null;
    
    const rows = evidence && evidence.length >= 3 ? evidence : [...(evidence || []), ...Array(3 - (evidence?.length || 0)).fill({ type: '', author: '', purpose: '', issues: '' })];
    
    return (
      <Box mb="lg">
        <Title order={5} c={PRIMARY_BROWN} mb="sm">{title}</Title>
        <Table withTableBorder withColumnBorders striped>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Type / Description</Table.Th>
              <Table.Th>Author / Custodian</Table.Th>
              <Table.Th>Purpose</Table.Th>
              <Table.Th>Admissibility Issues</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.slice(0, 3).map((row, idx) => (
              <Table.Tr key={idx}>
                <Table.Td>
                  {state.editMode ? (
                    <TextInput
                      placeholder="Type/Desc"
                      size="xs"
                      variant="unstyled"
                      value={row?.type || ''}
                      onChange={(e) => updateEvidence(fieldName, idx, 'type', e.target.value)}
                    />
                  ) : (
                    row?.type || '-'
                  )}
                </Table.Td>
                <Table.Td>
                  {state.editMode ? (
                    <TextInput
                      placeholder="Author/Custodian"
                      size="xs"
                      variant="unstyled"
                      value={row?.author || ''}
                      onChange={(e) => updateEvidence(fieldName, idx, 'author', e.target.value)}
                    />
                  ) : (
                    row?.author || '-'
                  )}
                </Table.Td>
                <Table.Td>
                  {state.editMode ? (
                    <TextInput
                      placeholder="Purpose"
                      size="xs"
                      variant="unstyled"
                      value={row?.purpose || ''}
                      onChange={(e) => updateEvidence(fieldName, idx, 'purpose', e.target.value)}
                    />
                  ) : (
                    row?.purpose || '-'
                  )}
                </Table.Td>
                <Table.Td>
                  {state.editMode ? (
                    <TextInput
                      placeholder="Issues"
                      size="xs"
                      variant="unstyled"
                      value={row?.issues || ''}
                      onChange={(e) => updateEvidence(fieldName, idx, 'issues', e.target.value)}
                    />
                  ) : (
                    row?.issues || '-'
                  )}
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Box>
    );
  };

  // Helper to get case-type-specific icon and color
  const getCaseTypeIcon = (f) => {
    const caseNature = f.content?.caseInfo?.nature || f.category || '';
    const n = caseNature.toLowerCase();
    // Criminal / Human Rights
    if (n.includes('criminal') || n.includes('human rights')) return { icon: IconScale, color: '#E03131' };
    // Land & Property
    if (n.includes('land') || n.includes('property') || n.includes('inheritance') || n.includes('estate')) return { icon: IconHome, color: '#0C8599' };
    // Contract Disputes
    if (n.includes('contract')) return { icon: IconFileInvoice, color: '#1971C2' };
    // Labor & Employment
    if (n.includes('labor') || n.includes('employment')) return { icon: IconUsersGroup, color: '#E8590C' };
    // Family Law
    if (n.includes('family')) return { icon: IconUsersGroup, color: '#C2255C' };
    // Civil Case
    if (n.includes('civil')) return { icon: IconGavel, color: '#1971C2' };
    // Cybercrime
    if (n.includes('cyber')) return { icon: IconDeviceDesktop, color: '#495057' };
    // Consumer / Business / Admin / Tax
    if (n.includes('business') || n.includes('consumer') || n.includes('admin') || n.includes('tax')) return { icon: IconShieldLock, color: '#4263EB' };
    // Document Drafting
    if (isDocumentDrafting(f)) return { icon: IconFileDescription, color: '#7048E8' };
    // Legal Advice
    if (isLegalAdvice(f)) return { icon: IconClipboardText, color: '#0C8599' };
    // Default
    return { icon: IconBriefcase, color: MUTED_OLIVE };
  };

  const renderCaseCard = (f) => {
    const recordId = f._id || f.id;
    const hasRecord = recordId ? state.caseRecordsMap[recordId] : false;
    const clientName = f.clientName || f.content?.interviewInfo?.clientName || 'Unknown Client';
    const displayTitle = hasRecord
      ? (f.caseTitle || f.content?.caseInfo?.caseTitle || f.content?.caseInfo?.title || f.caseId || clientName)
      : clientName;
    const caseNature = f.content?.caseInfo?.nature || f.category;
    const truncatedId = f.caseId ? (f.caseId.length > 8 ? '#' + f.caseId.slice(0, 8) : '#' + f.caseId) : null;
    const dateStr = f.createdAt ? new Date(f.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No Date';
    const { icon: CaseIcon, color: iconColor } = getCaseTypeIcon(f);
    const roleDisplay = (f.finalizedRole || f.finalizedBy || 'Secretary');
    const capitalizedRole = roleDisplay.charAt(0).toUpperCase() + roleDisplay.slice(1);
    const categoryColor = CATEGORY_COLORS[caseNature] || 'gray';
    const MANTINE_COLORS = { red: '#E03131', blue: '#1971C2', pink: '#C2255C', orange: '#E8590C', teal: '#0C8599', cyan: '#0B7285', grape: '#862E9C', yellow: '#E67700', lime: '#66A80F', indigo: '#4263EB', green: '#2F9E44', violet: '#7048E8', gray: '#868E96', dark: '#495057' };
    // Override: differentiate Contract (blue) from Land/Property (teal)
    const colorOverrides = { 'Contract Disputes': '#1971C2', 'Land and Property Disputes': '#0C8599' };
    const categoryTextColor = colorOverrides[caseNature] || MANTINE_COLORS[categoryColor] || '#868E96';

    return (
      <Paper
        key={recordId || f.caseId}
        px="md"
        py={12}
        radius="md"
        className="case-row"
        style={{ border: '1px solid #F0F1F3', background: 'white', cursor: 'pointer' }}
      >
        <Group wrap="nowrap" justify="space-between" align="center">
          <Group wrap="nowrap" gap="sm" style={{ flex: 1, minWidth: 0 }}>
            <Box style={{ width: 36, height: 36, borderRadius: 8, background: `${iconColor}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CaseIcon size={16} color={iconColor} />
            </Box>
            <Box style={{ flex: 1, minWidth: 0 }}>
              <Group gap={8} wrap="nowrap" align="center">
                <Text fw={700} size="sm" truncate>{displayTitle}</Text>
                {truncatedId && (
                  <Text size="xs" c="dimmed" ff="monospace" style={{ flexShrink: 0, opacity: 0.7 }}>{truncatedId}</Text>
                )}
              </Group>
              <Group gap={4} mt={2} wrap="nowrap">
                <Text size="xs" c="dimmed">{dateStr}</Text>
                {caseNature && (
                  <>
                    <Text size="xs" c="dimmed">·</Text>
                    <Text size="xs" fw={600} style={{ color: categoryTextColor, flexShrink: 0 }}>
                      {caseNature}
                    </Text>
                  </>
                )}
                <Text size="xs" c="dimmed">·</Text>
                <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>
                  {capitalizedRole}
                </Text>
              </Group>
            </Box>
          </Group>

          <Group gap={8} wrap="nowrap" style={{ flexShrink: 0, paddingRight: 4 }}>
            <Tooltip label="View Review">
              <ActionIcon variant="light" size="md" radius="md" color="gray" style={{ border: '1px solid #E5E7EB' }}
                onClick={(e) => { e.stopPropagation(); openModal(f); }}
              >
                <IconEye size={15} />
              </ActionIcon>
            </Tooltip>

            <Menu shadow="md" width={220} position="bottom-end">
              <Menu.Target>
                <ActionIcon variant="light" size="md" radius="md" color="gray" style={{ border: '1px solid #E5E7EB' }}>
                  <IconDots size={15} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>Actions</Menu.Label>
                <Menu.Item leftSection={<IconEye size={16} />}
                  onClick={() => openModal(f)}
                >
                  View Review
                </Menu.Item>
                {f.decision === 'accepted' && (
                  <Menu.Item leftSection={<IconReceipt size={16} />}
                    onClick={() => openAppointmentModal(f)}
                  >
                    Full Receipt
                  </Menu.Item>
                )}
                {f.decision === 'accepted' && !isLegalAdvice(f) && (
                  <Menu.Item leftSection={<IconFileText size={16} />}
                    onClick={() => openCaseRecordModal(f)}
                  >
                    Case Record
                  </Menu.Item>
                )}
                {f.decision === 'accepted' && (
                  <Menu.Item leftSection={<IconMessageCircle size={16} />}
                    onClick={() => handleChatNavigation(f)}
                  >
                    Chat
                  </Menu.Item>
                )}
                {f.decision === 'accepted' && isDocumentDrafting(f) && (
                  <Menu.Item leftSection={<IconHistory size={16} />} color="violet"
                    onClick={() => {
                      const versions = f.content?.interviewInfo?.documentVersions || [];
                      dispatch({ type: 'OPEN_VERSION_HISTORY_MODAL', payload: { case: f, versions } });
                    }}
                  >
                    Version History
                  </Menu.Item>
                )}
                {f.decision === 'accepted' && !f.linkedCaseId && !f.clientAccountCreated && (
                  <>
                    <Menu.Divider />
                    <Menu.Item leftSection={<IconUserPlus size={16} />} color="blue"
                      onClick={() => dispatch({ type: 'OPEN_CREATE_ACCOUNT_MODAL', payload: f })}
                    >
                      Create Client Account
                    </Menu.Item>
                  </>
                )}
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </Paper>
    );
  };

  const appointmentStatusLabel = state.appointmentEditMode
    ? (state.appointmentForm.status || state.appointmentDetails?.status || 'For Appointment')
    : (state.appointmentDetails?.status || 'For Appointment');

  return (
    <Box bg={BG} mih="100vh" py="xl">
      <style>
        {`
          ::-webkit-scrollbar { width: 8px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: ${MUTED_OLIVE}; border-radius: 4px; }
          ::-webkit-scrollbar-thumb:hover { background: ${PRIMARY_BROWN}; }
          * { scrollbar-width: thin; scrollbar-color: ${MUTED_OLIVE} transparent; }
          .case-row { transition: all 0.15s ease; }
          .case-row:hover { background: #F5F6F8 !important; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
        `}
      </style>
      <Container size="xl">
        {/* Modal for Case Record */}
        <Modal
          opened={state.caseRecordModalOpened}
          onClose={() => dispatch({ type: 'CLOSE_CASE_RECORD_MODAL' })}
          title={
            <Group justify="space-between" style={{ width: '100%' }}>
              <Title order={3} c={PRIMARY_BROWN}>Case Record</Title>
              <Group gap="sm">
                {!state.caseRecordEditMode ? (
                  <Button
                    size="xs"
                    variant="outline"
                    color={PRIMARY_BROWN}
                    onClick={() => dispatch({ type: 'SET_CASE_RECORD_EDIT_MODE', payload: true })}
                  >
                    Edit
                  </Button>
                ) : (
                  <>
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => {
                        dispatch({ type: 'SET_CASE_RECORD_EDIT_MODE', payload: false });
                        // Reset data to original
                        openCaseRecordModal({ _id: state.selectedCaseId });
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="xs"
                      style={{ backgroundColor: PRIMARY_BROWN }}
                      onClick={handleSaveCaseRecord}
                      loading={state.saving}
                    >
                      Save Changes
                    </Button>
                  </>
                )}
                <Button
                  size="xs"
                  variant="subtle"
                  leftSection={<IconDownload size={16} />}
                  onClick={exportCaseRecordPdf}
                >
                  Export PDF
                </Button>
              </Group>
            </Group>
          }
          size="calc(90vw)"
          styles={{
            title: { fontWeight: 700, width: '100%' },
            body: { maxHeight: '80vh', overflowY: 'auto' },
          }}
        >
          <CaseInformationSection 
            value={state.caseRecordData} 
            onChange={(data) => dispatch({ type: 'SET_CASE_RECORD_DATA', payload: data })}
            readOnly={!state.caseRecordEditMode}
          />
        </Modal>

        {/* Chat Modal */}
        <ChatModal 
          opened={state.chatModalOpened}
          onClose={() => dispatch({ type: 'CLOSE_CHAT_MODAL' })}
          caseData={state.selectedCaseForChat}
          messages={state.chatMessages}
          loading={state.loadingMessages}
          sending={state.sendingMessage}
          onSendMessage={handleSendMessage}
          onRefresh={() => state.selectedCaseForChat && fetchChatMessages(state.selectedCaseForChat._id)}
          userData={userData}
        />

        {/* Version History Modal */}
        <Modal
          opened={state.versionHistoryModalOpened}
          onClose={() => dispatch({ type: 'CLOSE_VERSION_HISTORY_MODAL' })}
          title={
            <Group>
              <IconHistory size={24} color={PRIMARY_BROWN} />
              <Text fw={700} size="lg" c={PRIMARY_BROWN}>
                Document Version History
              </Text>
            </Group>
          }
          size="lg"
          radius="lg"
        >
          {state.selectedCaseForVersions && (
            <Stack gap="md">
              <Paper p="sm" radius="md" style={{ backgroundColor: THEMED_LIGHT_BG }}>
                <Group justify="space-between">
                  <Box>
                    <Text size="sm" fw={600}>
                      {state.selectedCaseForVersions.caseId}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {state.selectedCaseForVersions.content?.interviewInfo?.clientName || 'Unknown Client'}
                    </Text>
                  </Box>
                  <Badge variant="light" color="violet">
                    {state.documentVersions.length} Version{state.documentVersions.length !== 1 ? 's' : ''}
                  </Badge>
                </Group>
              </Paper>

              {state.documentVersions.length > 0 ? (
                <ScrollArea style={{ maxHeight: '60vh' }}>
                  <Stack gap="sm">
                    {/* Current/Latest Version */}
                    {state.selectedCaseForVersions.content?.interviewInfo?.uploadedDocument && (
                      <Paper p="md" radius="md" withBorder style={{ borderColor: PRIMARY_GOLD, borderWidth: 2 }}>
                        <Group justify="space-between" mb="xs">
                          <Group gap="xs">
                            <IconFileText size={20} color={PRIMARY_BROWN} />
                            <Text size="sm" fw={600} c={PRIMARY_BROWN}>
                              Current Version
                            </Text>
                          </Group>
                          <Badge variant="filled" style={{ backgroundColor: PRIMARY_BROWN }}>
                            Latest
                          </Badge>
                        </Group>
                        <Text size="sm" fw={500} mb={4}>
                          {state.selectedCaseForVersions.content.interviewInfo.uploadedDocument.fileName}
                        </Text>
                        <Text size="xs" c="dimmed" mb={4}>
                          {(state.selectedCaseForVersions.content.interviewInfo.uploadedDocument.fileSize / 1024).toFixed(2)} KB
                        </Text>
                        {state.selectedCaseForVersions.content.interviewInfo.uploadedBy && (
                          <Text size="xs" c="dimmed" mb={8}>
                            Uploaded by: <Text component="span" fw={600}>
                              {state.selectedCaseForVersions.content.interviewInfo.uploadedBy}
                            </Text> ({state.selectedCaseForVersions.content.interviewInfo.uploadedByRole || 'Unknown'})
                          </Text>
                        )}
                        <Group gap="xs" mt="sm">
                          {state.selectedCaseForVersions.content.interviewInfo.uploadedDocument.fileUrl && (
                            <>
                              <Button
                                size="xs"
                                variant="light"
                                color="blue"
                                leftSection={<IconEye size={14} />}
                                onClick={() => handleViewDocument(state.selectedCaseForVersions.content.interviewInfo.uploadedDocument)}
                              >
                                View
                              </Button>
                              <Button
                                size="xs"
                                variant="light"
                                color="green"
                                leftSection={<IconDownload size={14} />}
                                component="a"
                                href={state.selectedCaseForVersions.content.interviewInfo.uploadedDocument.fileUrl}
                                download={state.selectedCaseForVersions.content.interviewInfo.uploadedDocument.fileName}
                              >
                                Download
                              </Button>
                            </>
                          )}
                        </Group>
                      </Paper>
                    )}

                    {/* Version History */}
                    {state.documentVersions.map((version, index) => (
                      <Paper key={index} p="md" radius="md" withBorder style={{ borderColor: '#e0e0e0' }}>
                        <Group justify="space-between" mb="xs">
                          <Group gap="xs">
                            <IconClock size={18} color={MUTED_OLIVE} />
                            <Text size="sm" fw={600}>
                              Version {state.documentVersions.length - index}
                            </Text>
                          </Group>
                          <Badge variant="light" color="gray">
                            {new Date(version.uploadedAt).toLocaleDateString()}
                          </Badge>
                        </Group>
                        <Text size="sm" mb={4}>
                          {version.fileName}
                        </Text>
                        <Text size="xs" c="dimmed" mb={4}>
                          {(version.fileSize / 1024).toFixed(2)} KB
                        </Text>
                        {version.uploadedBy && (
                          <Text size="xs" c="dimmed" mb={8}>
                            Uploaded by: <Text component="span" fw={600}>
                              {version.uploadedBy}
                            </Text> ({version.uploadedByRole || 'Unknown'})
                          </Text>
                        )}
                        <Text size="xs" c="dimmed" mb={8}>
                          {new Date(version.uploadedAt).toLocaleString()}
                        </Text>
                        <Group gap="xs">
                          {version.fileUrl ? (
                            <>
                              <Button
                                size="xs"
                                variant="subtle"
                                leftSection={<IconEye size={14} />}
                                onClick={() => handleViewDocument(version)}
                              >
                                View
                              </Button>
                              <Button
                                size="xs"
                                variant="subtle"
                                leftSection={<IconDownload size={14} />}
                                component="a"
                                href={version.fileUrl}
                                download={version.fileName}
                              >
                                Download
                              </Button>
                            </>
                          ) : version.fileData ? (
                            <>
                              <Button
                                size="xs"
                                variant="subtle"
                                leftSection={<IconEye size={14} />}
                                onClick={() => handleViewDocument(version)}
                              >
                                View
                              </Button>
                              <Button
                                size="xs"
                                variant="subtle"
                                leftSection={<IconDownload size={14} />}
                                component="a"
                                href={version.fileData}
                                download={version.fileName}
                              >
                                Download
                              </Button>
                            </>
                          ) : (
                            <Text size="xs" c="red">
                              File not available
                            </Text>
                          )}
                        </Group>
                      </Paper>
                    ))}
                  </Stack>
                </ScrollArea>
              ) : (
                <Paper p="xl" radius="md" style={{ backgroundColor: '#f5f5f5', textAlign: 'center' }}>
                  <IconClock size={48} color={MUTED_OLIVE} style={{ margin: '0 auto' }} />
                  <Text size="sm" c="dimmed" mt="md">
                    No version history available
                  </Text>
                </Paper>
              )}
            </Stack>
          )}
        </Modal>

        {/* Document Viewer Modal (for version history preview) */}
        <Modal
          opened={state.documentViewerModalOpened}
          onClose={() => dispatch({ type: 'CLOSE_DOCUMENT_VIEWER_MODAL' })}
          title={
            <Group>
              <IconFileText size={24} color={PRIMARY_BROWN} />
              <Text fw={600} c={PRIMARY_BROWN}>Document Viewer</Text>
            </Group>
          }
          size="calc(95vw)"
          fullScreen
          styles={{
            body: { minHeight: '85vh', height: 'calc(100vh - 120px)' },
            content: { height: '95vh' }
          }}
        >
          {state.currentViewingDoc && (
            <Stack gap="md" style={{ height: '100%' }}>
              <Paper p="sm" radius="md" style={{ backgroundColor: THEMED_LIGHT_BG }}>
                <Group justify="space-between">
                  <Box>
                    <Text size="sm" fw={600}>{state.currentViewingDoc.fileName}</Text>
                    <Text size="xs" c="dimmed">
                      {state.currentViewingDoc.fileType}
                    </Text>
                  </Box>
                  <Button
                    size="sm"
                    leftSection={<IconDownload size={16} />}
                    component="a"
                    href={state.currentViewingDoc.fileUrl || state.currentViewingDoc.fileData}
                    download={state.currentViewingDoc.fileName}
                    style={{ backgroundColor: PRIMARY_BROWN }}
                  >
                    Download
                  </Button>
                </Group>
              </Paper>
              
              <Paper p="md" radius="md" style={{ flex: 1, minHeight: '75vh', backgroundColor: '#f5f5f5', display: 'flex', flexDirection: 'column' }}>
                {state.currentViewingDoc.fileType?.includes('pdf') || state.currentViewingDoc.fileName?.endsWith('.pdf') ? (
                  // PDF - embed directly (works for both server URLs and base64)
                  <iframe
                    src={state.currentViewingDoc.fileUrl || state.currentViewingDoc.fileData}
                    style={{ width: '100%', height: '100%', minHeight: '75vh', border: 'none', flex: 1 }}
                    title="PDF Viewer"
                  />
                ) : (state.currentViewingDoc.fileType?.includes('word') || state.currentViewingDoc.fileName?.endsWith('.docx') || state.currentViewingDoc.fileName?.endsWith('.doc')) ? (
                  // Word Document - Render using mammoth.js
                  <Box style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    {state.wordDocLoading ? (
                      <Box style={{ textAlign: 'center', padding: '40px' }}>
                        <IconFileText size={64} color={PRIMARY_BROWN} />
                        <Text size="xl" fw={700} mt="md" c={PRIMARY_BROWN}>
                          Loading Word Document...
                        </Text>
                      </Box>
                    ) : state.wordDocHtml ? (
                      <ScrollArea style={{ flex: 1, height: '100%' }}>
                        <Box 
                          p="xl" 
                          style={{ 
                            backgroundColor: 'white',
                            maxWidth: '800px',
                            margin: '0 auto',
                            minHeight: '100%'
                          }}
                          dangerouslySetInnerHTML={{ __html: state.wordDocHtml }}
                        />
                      </ScrollArea>
                    ) : (
                      <Box style={{ textAlign: 'center', padding: '40px' }}>
                        <IconFileText size={64} color={PRIMARY_BROWN} />
                        <Text size="xl" fw={700} mt="md" c={PRIMARY_BROWN}>
                          Word Document
                        </Text>
                        <Text size="sm" c="dimmed" mt="xs" mb="md">
                          {state.currentViewingDoc.fileName}
                        </Text>
                        <Text size="sm" c="dimmed" mb="xl">
                          Unable to preview this document. Please download to view.
                        </Text>
                        <Group justify="center" gap="md">
                          <Button
                            size="lg"
                            leftSection={<IconDownload size={20} />}
                            component="a"
                            href={state.currentViewingDoc.fileUrl || state.currentViewingDoc.fileData}
                            download={state.currentViewingDoc.fileName}
                            style={{ backgroundColor: PRIMARY_BROWN }}
                          >
                            Download to View/Edit
                          </Button>
                        </Group>
                      </Box>
                    )}
                  </Box>
                ) : (
                  // Generic file viewer with download option
                  <Box style={{ textAlign: 'center', padding: '40px' }}>
                    <IconFileText size={48} color={PRIMARY_BROWN} />
                    <Text size="lg" fw={600} mt="md" c={PRIMARY_BROWN}>
                      Document Preview
                    </Text>
                    <Text size="sm" c="dimmed" mt="xs" mb="xl">
                      This file type cannot be previewed in the browser. Please download to view.
                    </Text>
                    <Button
                      size="lg"
                      leftSection={<IconDownload size={20} />}
                      component="a"
                      href={state.currentViewingDoc.fileUrl || state.currentViewingDoc.fileData}
                      download={state.currentViewingDoc.fileName}
                      style={{ backgroundColor: PRIMARY_BROWN }}
                    >
                      Download File
                    </Button>
                  </Box>
                )}
              </Paper>
            </Stack>
          )}
        </Modal>

        {/* Appointment Receipt Modal */}
        <Modal
          opened={state.appointmentModalOpened}
          onClose={() => dispatch({ type: 'CLOSE_APPOINTMENT_MODAL' })}
          title={
            <Group justify="space-between" style={{ width: '100%' }}>
              <Text fw={700} size="xl" c={PRIMARY_BROWN}>
                Appointment Receipt
              </Text>
              <Group gap="xs">
                {state.appointmentEditMode ? (
                  <>
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={handleCancelAppointmentEdit}
                      disabled={state.appointmentSaving}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="xs"
                      style={{ backgroundColor: PRIMARY_BROWN }}
                      onClick={handleSaveAppointmentDetails}
                      loading={state.appointmentSaving}
                    >
                      Save
                    </Button>
                  </>
                ) : (
                  <Button
                    size="xs"
                    variant="outline"
                    color={PRIMARY_BROWN}
                    onClick={handleEnterAppointmentEdit}
                    disabled={state.loadingAppointment || !state.appointmentDetails}
                  >
                    Edit
                  </Button>
                )}
                <Button
                  size="xs"
                  variant="subtle"
                  leftSection={<IconDownload size={16} />}
                  onClick={exportAppointmentPdf}
                >
                  Export PDF
                </Button>
              </Group>
            </Group>
          }
          size="lg"
          radius="lg"
        >
          {state.loadingAppointment ? (
            <Center py="xl">
              <Loader size="lg" color={PRIMARY_BROWN} />
            </Center>
          ) : state.appointmentDetails ? (
            <Stack gap="lg" mt="lg">
              {/* Header Badge */}
              <Paper p="md" radius="md" style={{ backgroundColor: `${PRIMARY_GOLD}15`, border: `1px solid ${PRIMARY_GOLD}` }}>
                <Group justify="space-between" align="center">
                  <Text fw={700} size="lg" c={PRIMARY_BROWN}>
                    {state.appointmentDetails.caseDetails?.appointmentType || state.appointmentDetails.personal?.legalMatter || 'Appointment'}
                  </Text>
                  <Badge size="lg" variant="filled" style={{ backgroundColor: PRIMARY_GOLD, color: CHARCOAL }}>
                    {appointmentStatusLabel}
                  </Badge>
                </Group>
                <Text size="sm" c={MUTED_OLIVE} mt="xs">
                  Case #{state.appointmentDetails.caseNumber || 'N/A'}
                </Text>
              </Paper>

              {/* Personal Details */}
              <Paper shadow="xs" p="lg" radius="lg" style={{ backgroundColor: 'white', border: '1px solid #F0F0F0' }}>
                <Title order={4} mb="md" c={CHARCOAL}>Personal Details</Title>
                <Divider mb="md" color="#F0F0F0" />
                <Grid gutter="md">
                  <Grid.Col span={6}>
                    <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Name</Text>
                    {state.appointmentEditMode ? (
                      <TextInput
                        size="sm"
                        value={state.appointmentForm.fullName}
                        onChange={(e) => dispatch({ type: 'SET_APPOINTMENT_FORM', payload: { ...state.appointmentForm, fullName: e.target.value } })}
                      />
                    ) : (
                      <Text size="sm" c={CHARCOAL} fw={500}>{state.appointmentDetails.fullName || state.appointmentDetails.name || 'N/A'}</Text>
                    )}
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Age</Text>
                    {state.appointmentEditMode ? (
                      <TextInput
                        size="sm"
                        type="number"
                        value={state.appointmentForm.age}
                        onChange={(e) => dispatch({ type: 'SET_APPOINTMENT_FORM', payload: { ...state.appointmentForm, age: e.target.value } })}
                      />
                    ) : (
                      <Text size="sm" c={CHARCOAL} fw={500}>{state.appointmentDetails.age || 'N/A'}</Text>
                    )}
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Birthday</Text>
                    {state.appointmentEditMode ? (
                      <TextInput
                        size="sm"
                        type="date"
                        value={state.appointmentForm.birthday}
                        onChange={(e) => dispatch({ type: 'SET_APPOINTMENT_FORM', payload: { ...state.appointmentForm, birthday: e.target.value } })}
                      />
                    ) : (
                      <Text size="sm" c={CHARCOAL} fw={500}>{state.appointmentDetails.birthday || 'N/A'}</Text>
                    )}
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Sex</Text>
                    {state.appointmentEditMode ? (
                      <TextInput
                        size="sm"
                        value={state.appointmentForm.sex}
                        onChange={(e) => dispatch({ type: 'SET_APPOINTMENT_FORM', payload: { ...state.appointmentForm, sex: e.target.value } })}
                      />
                    ) : (
                      <Text size="sm" c={CHARCOAL} fw={500}>{state.appointmentDetails.sex || 'N/A'}</Text>
                    )}
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Civil Status</Text>
                    {state.appointmentEditMode ? (
                      <TextInput
                        size="sm"
                        value={state.appointmentForm.civilStatus}
                        onChange={(e) => dispatch({ type: 'SET_APPOINTMENT_FORM', payload: { ...state.appointmentForm, civilStatus: e.target.value } })}
                      />
                    ) : (
                      <Text size="sm" c={CHARCOAL} fw={500}>{state.appointmentDetails.civilStatus || 'N/A'}</Text>
                    )}
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Citizenship</Text>
                    {state.appointmentEditMode ? (
                      <TextInput
                        size="sm"
                        value={state.appointmentForm.citizenship}
                        onChange={(e) => dispatch({ type: 'SET_APPOINTMENT_FORM', payload: { ...state.appointmentForm, citizenship: e.target.value } })}
                      />
                    ) : (
                      <Text size="sm" c={CHARCOAL} fw={500}>{state.appointmentDetails.citizenship || 'N/A'}</Text>
                    )}
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Contact Number</Text>
                    {state.appointmentEditMode ? (
                      <TextInput
                        size="sm"
                        value={state.appointmentForm.contactNumber}
                        onChange={(e) => dispatch({ type: 'SET_APPOINTMENT_FORM', payload: { ...state.appointmentForm, contactNumber: e.target.value } })}
                      />
                    ) : (
                      <Text size="sm" c={CHARCOAL} fw={500}>{state.appointmentDetails.contactNumber || 'N/A'}</Text>
                    )}
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Email</Text>
                    {state.appointmentEditMode ? (
                      <TextInput
                        size="sm"
                        value={state.appointmentForm.email}
                        onChange={(e) => dispatch({ type: 'SET_APPOINTMENT_FORM', payload: { ...state.appointmentForm, email: e.target.value } })}
                      />
                    ) : (
                      <Text size="sm" c={CHARCOAL} fw={500}>{state.appointmentDetails.email || 'N/A'}</Text>
                    )}
                  </Grid.Col>
                  <Grid.Col span={12}>
                    <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Present Address</Text>
                    {state.appointmentEditMode ? (
                      <TextInput
                        size="sm"
                        value={state.appointmentForm.presentAddress}
                        onChange={(e) => dispatch({ type: 'SET_APPOINTMENT_FORM', payload: { ...state.appointmentForm, presentAddress: e.target.value } })}
                      />
                    ) : (
                      <Text size="sm" c={CHARCOAL} fw={500}>{state.appointmentDetails.presentAddress || 'N/A'}</Text>
                    )}
                  </Grid.Col>
                  <Grid.Col span={12}>
                    <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Permanent Address</Text>
                    {state.appointmentEditMode ? (
                      <TextInput
                        size="sm"
                        value={state.appointmentForm.permanentAddress}
                        onChange={(e) => dispatch({ type: 'SET_APPOINTMENT_FORM', payload: { ...state.appointmentForm, permanentAddress: e.target.value } })}
                      />
                    ) : (
                      <Text size="sm" c={CHARCOAL} fw={500}>{state.appointmentDetails.permanentAddress || 'N/A'}</Text>
                    )}
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Spouse Name</Text>
                    {state.appointmentEditMode ? (
                      <TextInput
                        size="sm"
                        value={state.appointmentForm.spouseName}
                        onChange={(e) => dispatch({ type: 'SET_APPOINTMENT_FORM', payload: { ...state.appointmentForm, spouseName: e.target.value } })}
                      />
                    ) : (
                      <Text size="sm" c={CHARCOAL} fw={500}>{state.appointmentDetails.spouseName || 'N/A'}</Text>
                    )}
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Relator Name</Text>
                    {state.appointmentEditMode ? (
                      <TextInput
                        size="sm"
                        value={state.appointmentForm.relatorName}
                        onChange={(e) => dispatch({ type: 'SET_APPOINTMENT_FORM', payload: { ...state.appointmentForm, relatorName: e.target.value } })}
                      />
                    ) : (
                      <Text size="sm" c={CHARCOAL} fw={500}>{state.appointmentDetails.relatorName || 'N/A'}</Text>
                    )}
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Relator Contact Number</Text>
                    {state.appointmentEditMode ? (
                      <TextInput
                        size="sm"
                        value={state.appointmentForm.relatorContactNumber}
                        onChange={(e) => dispatch({ type: 'SET_APPOINTMENT_FORM', payload: { ...state.appointmentForm, relatorContactNumber: e.target.value } })}
                      />
                    ) : (
                      <Text size="sm" c={CHARCOAL} fw={500}>{state.appointmentDetails.relatorContactNumber || 'N/A'}</Text>
                    )}
                  </Grid.Col>
                </Grid>
              </Paper>

              {/* Schedule Details */}
              <Paper shadow="xs" p="lg" radius="lg" style={{ backgroundColor: 'white', border: '1px solid #F0F0F0' }}>
                <Title order={4} mb="md" c={CHARCOAL}>Schedule Details</Title>
                <Divider mb="md" color="#F0F0F0" />
                <Grid gutter="md">
                  <Grid.Col span={12}>
                    <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Status</Text>
                    {state.appointmentEditMode ? (
                      <Select
                        size="sm"
                        data={APPOINTMENT_STATUS_OPTIONS}
                        placeholder="Select status"
                        value={state.appointmentForm.status || null}
                        onChange={(val) => dispatch({ type: 'SET_APPOINTMENT_FORM', payload: { ...state.appointmentForm, status: val || '' } })}
                      />
                    ) : (
                      <Badge size="lg" variant="light" color="gray" style={{ backgroundColor: `${PRIMARY_BROWN}10`, color: PRIMARY_BROWN }}>
                        {appointmentStatusLabel}
                      </Badge>
                    )}
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Appointment Date</Text>
                    {state.appointmentEditMode ? (
                      <TextInput
                        type="date"
                        size="sm"
                        value={state.appointmentForm.appointedDate || ''}
                        onChange={(e) => dispatch({ type: 'SET_APPOINTMENT_FORM', payload: { ...state.appointmentForm, appointedDate: e.target.value } })}
                      />
                    ) : (
                      <Text size="sm" c={CHARCOAL} fw={500}>
                        {state.appointmentDetails.appointedDate ? new Date(state.appointmentDetails.appointedDate).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        }) : 'N/A'}
                      </Text>
                    )}
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Appointment Time</Text>
                    {state.appointmentEditMode ? (
                      <TextInput
                        type="time"
                        size="sm"
                        value={state.appointmentForm.appointmentTime || ''}
                        onChange={(e) => dispatch({ type: 'SET_APPOINTMENT_FORM', payload: { ...state.appointmentForm, appointmentTime: e.target.value } })}
                      />
                    ) : (
                      <Text size="sm" c={CHARCOAL} fw={500}>{state.appointmentDetails.appointmentTime || 'N/A'}</Text>
                    )}
                  </Grid.Col>
                </Grid>
              </Paper>

              {/* Financial Details */}
              <Paper shadow="xs" p="lg" radius="lg" style={{ backgroundColor: 'white', border: '1px solid #F0F0F0' }}>
                <Title order={4} mb="md" c={CHARCOAL}>Financial Details</Title>
                <Divider mb="md" color="#F0F0F0" />
                <Grid gutter="md">
                  <Grid.Col span={6}>
                    <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Income Source</Text>
                    {state.appointmentEditMode ? (
                      <TextInput
                        size="sm"
                        value={state.appointmentForm.currentSourceOfIncome}
                        onChange={(e) => dispatch({ type: 'SET_APPOINTMENT_FORM', payload: { ...state.appointmentForm, currentSourceOfIncome: e.target.value } })}
                      />
                    ) : (
                      <Text size="sm" c={CHARCOAL} fw={500}>{state.appointmentDetails.currentSourceOfIncome || 'N/A'}</Text>
                    )}
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Monthly Income</Text>
                    {state.appointmentEditMode ? (
                      <TextInput
                        size="sm"
                        type="number"
                        value={state.appointmentForm.monthlyIncome}
                        onChange={(e) => dispatch({ type: 'SET_APPOINTMENT_FORM', payload: { ...state.appointmentForm, monthlyIncome: e.target.value } })}
                      />
                    ) : (
                      <Text size="sm" c={CHARCOAL} fw={500}>
                        {state.appointmentDetails.monthlyIncome ? `₱${Number(state.appointmentDetails.monthlyIncome).toLocaleString()}` : 'N/A'}
                      </Text>
                    )}
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Nature of Work</Text>
                    {state.appointmentEditMode ? (
                      <TextInput
                        size="sm"
                        value={state.appointmentForm.natureOfWork}
                        onChange={(e) => dispatch({ type: 'SET_APPOINTMENT_FORM', payload: { ...state.appointmentForm, natureOfWork: e.target.value } })}
                      />
                    ) : (
                      <Text size="sm" c={CHARCOAL} fw={500}>{state.appointmentDetails.natureOfWork || 'N/A'}</Text>
                    )}
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Employer</Text>
                    {state.appointmentEditMode ? (
                      <TextInput
                        size="sm"
                        value={state.appointmentForm.employerName}
                        onChange={(e) => dispatch({ type: 'SET_APPOINTMENT_FORM', payload: { ...state.appointmentForm, employerName: e.target.value } })}
                      />
                    ) : (
                      <Text size="sm" c={CHARCOAL} fw={500}>{state.appointmentDetails.employerName || 'N/A'}</Text>
                    )}
                  </Grid.Col>
                  <Grid.Col span={12}>
                    <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Employer Address</Text>
                    {state.appointmentEditMode ? (
                      <TextInput
                        size="sm"
                        value={state.appointmentForm.employerAddress}
                        onChange={(e) => dispatch({ type: 'SET_APPOINTMENT_FORM', payload: { ...state.appointmentForm, employerAddress: e.target.value } })}
                      />
                    ) : (
                      <Text size="sm" c={CHARCOAL} fw={500}>{state.appointmentDetails.employerAddress || 'N/A'}</Text>
                    )}
                  </Grid.Col>
                </Grid>
              </Paper>

              {/* Case Details */}
              <Paper shadow="xs" p="lg" radius="lg" style={{ backgroundColor: 'white', border: '1px solid #F0F0F0' }}>
                <Title order={4} mb="md" c={CHARCOAL}>Case Details</Title>
                <Divider mb="md" color="#F0F0F0" />
                <Grid gutter="md">
                  <Grid.Col span={6}>
                    <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Party Represented</Text>
                    {state.appointmentEditMode ? (
                      <TextInput
                        size="sm"
                        value={state.appointmentForm.partyRepresented}
                        onChange={(e) => dispatch({ type: 'SET_APPOINTMENT_FORM', payload: { ...state.appointmentForm, partyRepresented: e.target.value } })}
                      />
                    ) : (
                      <Text size="sm" c={CHARCOAL} fw={500}>{state.appointmentDetails.partyRepresented || 'N/A'}</Text>
                    )}
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb={4}>Case Number</Text>
                    <Text size="sm" c={CHARCOAL} fw={500}>{state.appointmentDetails.caseNumber || 'N/A'}</Text>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Case Nature</Text>
                    {state.appointmentEditMode ? (
                      <TextInput
                        size="sm"
                        value={state.appointmentForm.caseNature}
                        onChange={(e) => dispatch({ type: 'SET_APPOINTMENT_FORM', payload: { ...state.appointmentForm, caseNature: e.target.value } })}
                      />
                    ) : (
                      <Text size="sm" c={CHARCOAL} fw={500}>{state.appointmentDetails.caseNature || state.appointmentDetails.natureOfCase || 'N/A'}</Text>
                    )}
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Appointment Type</Text>
                    {state.appointmentEditMode ? (
                      <TextInput
                        size="sm"
                        value={state.appointmentForm.appointmentType}
                        onChange={(e) => dispatch({ type: 'SET_APPOINTMENT_FORM', payload: { ...state.appointmentForm, appointmentType: e.target.value } })}
                      />
                    ) : (
                      <Text size="sm" c={CHARCOAL} fw={500}>{state.appointmentDetails.caseDetails?.appointmentType || state.appointmentDetails.personal?.legalMatter || state.appointmentDetails.appointmentType || 'N/A'}</Text>
                    )}
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Venue</Text>
                    {state.appointmentEditMode ? (
                      <TextInput
                        size="sm"
                        value={state.appointmentForm.venue}
                        onChange={(e) => dispatch({ type: 'SET_APPOINTMENT_FORM', payload: { ...state.appointmentForm, venue: e.target.value } })}
                      />
                    ) : (
                      <Text size="sm" c={CHARCOAL} fw={500}>{state.appointmentDetails.venue || 'N/A'}</Text>
                    )}
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Present Stage</Text>
                    {state.appointmentEditMode ? (
                      <TextInput
                        size="sm"
                        value={state.appointmentForm.presentStage}
                        onChange={(e) => dispatch({ type: 'SET_APPOINTMENT_FORM', payload: { ...state.appointmentForm, presentStage: e.target.value } })}
                      />
                    ) : (
                      <Text size="sm" c={CHARCOAL} fw={500}>{state.appointmentDetails.presentStage || 'N/A'}</Text>
                    )}
                  </Grid.Col>
                  <Grid.Col span={12}>
                    <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Court Division</Text>
                    {state.appointmentEditMode ? (
                      <TextInput
                        size="sm"
                        value={state.appointmentForm.courtDivision}
                        onChange={(e) => dispatch({ type: 'SET_APPOINTMENT_FORM', payload: { ...state.appointmentForm, courtDivision: e.target.value } })}
                      />
                    ) : (
                      <Text size="sm" c={CHARCOAL} fw={500}>{state.appointmentDetails.courtDivision || 'N/A'}</Text>
                    )}
                  </Grid.Col>
                  <Grid.Col span={12}>
                    <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Court Address</Text>
                    {state.appointmentEditMode ? (
                      <TextInput
                        size="sm"
                        value={state.appointmentForm.courtAddress}
                        onChange={(e) => dispatch({ type: 'SET_APPOINTMENT_FORM', payload: { ...state.appointmentForm, courtAddress: e.target.value } })}
                      />
                    ) : (
                      <Text size="sm" c={CHARCOAL} fw={500}>{state.appointmentDetails.courtAddress || 'N/A'}</Text>
                    )}
                  </Grid.Col>
                  <Grid.Col span={12}>
                    <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Case Description</Text>
                    {state.appointmentEditMode ? (
                      <Textarea
                        size="sm"
                        minRows={2}
                        value={state.appointmentForm.caseDescription}
                        onChange={(e) => dispatch({ type: 'SET_APPOINTMENT_FORM', payload: { ...state.appointmentForm, caseDescription: e.target.value } })}
                      />
                    ) : (
                      <Text size="sm" c={CHARCOAL} fw={500}>{state.appointmentDetails.caseDescription || 'N/A'}</Text>
                    )}
                  </Grid.Col>
                  <Grid.Col span={12}>
                    <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Presiding Officer</Text>
                    {state.appointmentEditMode ? (
                      <TextInput
                        size="sm"
                        value={state.appointmentForm.presidingOfficer}
                        onChange={(e) => dispatch({ type: 'SET_APPOINTMENT_FORM', payload: { ...state.appointmentForm, presidingOfficer: e.target.value } })}
                      />
                    ) : (
                      <Text size="sm" c={CHARCOAL} fw={500}>{state.appointmentDetails.presidingOfficer || 'N/A'}</Text>
                    )}
                  </Grid.Col>
                </Grid>
              </Paper>
            </Stack>
          ) : (
            <Center py="xl">
              <Text c={MUTED_OLIVE}>No appointment details available</Text>
            </Center>
          )}
        </Modal>

        {/* Modal for viewing recommendation */}
        <Modal
          opened={state.modalOpened}
          onClose={() => dispatch({ type: 'CLOSE_REVIEW_MODAL' })}
          title={
            <Group justify="space-between" style={{ width: '100%' }}>
              <Title order={3} c={PRIMARY_BROWN}>Recommendation for Action</Title>
              <Group gap="sm">
                {!state.editMode ? (
                  <Button
                    size="xs"
                    variant="outline"
                    color={PRIMARY_BROWN}
                    onClick={() => dispatch({ type: 'SET_EDIT_MODE', payload: true })}
                  >
                    Edit
                  </Button>
                ) : (
                  <>
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => {
                        dispatch({ type: 'SET_EDITED_DATA', payload: JSON.parse(JSON.stringify(state.selectedCase)) });
                        dispatch({ type: 'SET_EDIT_MODE', payload: false });
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="xs"
                      style={{ backgroundColor: PRIMARY_BROWN }}
                      onClick={handleSaveChanges}
                      loading={state.saving}
                    >
                      Save Changes
                    </Button>
                  </>
                )}
                <Button
                  size="xs"
                  variant="subtle"
                  leftSection={<IconDownload size={16} />}
                  onClick={exportRecommendationPdf}
                >
                  Export PDF
                </Button>
              </Group>
            </Group>
          }
          size="xl"
          styles={{
            title: { fontWeight: 700, width: '100%' },
            body: { maxHeight: '70vh', overflowY: 'auto' },
          }}
        >
          {state.editedData && (
            <Stack gap="lg">
              {/* Stepper Navigation */}
              <Stepper 
                active={state.activeStep} 
                color={PRIMARY_BROWN}
                completedIcon={<IconCircleCheck size={20} />}
                styles={{
                  stepLabel: { fontWeight: 600, fontSize: '14px' },
                  stepDescription: { fontSize: '12px', color: MUTED_OLIVE },
                }}
              >
                <Stepper.Step label="Interview" description="Client & Evidence" />
                <Stepper.Step label="Action" description="Lawyer & Director" />
              </Stepper>

              <Divider />

              {/* Step 1: Interview Information */}
              {state.activeStep === 0 && (
              <Paper p="md" withBorder>
                <Title order={4} c={PRIMARY_BROWN} mb="md">Client Interview Information</Title>
                <SimpleGrid cols={2} spacing="sm" mb="md">
                  <Box>
                    <Text size="xs" c="dimmed">Date of Interview</Text>
                    {state.editMode ? (
                      <TextInput
                        type="date"
                        value={state.editedData.content?.interviewInfo?.dateOfInterview || ''}
                        onChange={(e) => updateEditedData('content.interviewInfo.dateOfInterview', e.target.value)}
                      />
                    ) : (
                      <Text fw={500}>{state.editedData.content?.interviewInfo?.dateOfInterview || '-'}</Text>
                    )}
                  </Box>
                  <Box>
                    <Text size="xs" c="dimmed">Date Submitted</Text>
                    {state.editMode ? (
                      <TextInput
                        type="date"
                        value={state.editedData.content?.interviewInfo?.dateSubmitted || ''}
                        onChange={(e) => updateEditedData('content.interviewInfo.dateSubmitted', e.target.value)}
                      />
                    ) : (
                      <Text fw={500}>{state.editedData.content?.interviewInfo?.dateSubmitted || '-'}</Text>
                    )}
                  </Box>
                  <Box>
                    <Text size="xs" c="dimmed">Client's Name</Text>
                    {state.editMode ? (
                      <TextInput
                        value={state.editedData.content?.interviewInfo?.clientName || ''}
                        onChange={(e) => updateEditedData('content.interviewInfo.clientName', e.target.value)}
                      />
                    ) : (
                      <Text fw={500}>{state.editedData.content?.interviewInfo?.clientName || '-'}</Text>
                    )}
                  </Box>
                  <Box>
                    <Text size="xs" c="dimmed">Interviewing Intern/s</Text>
                    {state.editMode ? (
                      <TextInput
                        value={state.editedData.content?.interviewInfo?.interviewingInterns || ''}
                        onChange={(e) => updateEditedData('content.interviewInfo.interviewingInterns', e.target.value)}
                      />
                    ) : (
                      <Text fw={500}>{state.editedData.content?.interviewInfo?.interviewingInterns || '-'}</Text>
                    )}
                  </Box>
                </SimpleGrid>
                <Divider my="md" />
                <Box mb="md">
                  <Text size="sm" fw={600} c={PRIMARY_BROWN} mb="xs">Fast Facts</Text>
                  {state.editMode ? (
                    <Textarea
                      autosize
                      minRows={4}
                      value={state.editedData.content?.interviewInfo?.fastFacts || ''}
                      onChange={(e) => updateEditedData('content.interviewInfo.fastFacts', e.target.value)}
                    />
                  ) : (
                    <Text size="sm">{state.editedData.content?.interviewInfo?.fastFacts || '-'}</Text>
                  )}
                </Box>
                <Divider my="md" />
                {renderEvidenceTable(
                  "Evidence on Hand / Available for the Client(s)",
                  state.editedData.content?.interviewInfo?.clientEvidence,
                  'clientEvidence'
                )}
                {renderEvidenceTable(
                  "Evidence on Hand / Available for the Adverse Party(ies)",
                  state.editedData.content?.interviewInfo?.adversePartyEvidence,
                  'adversePartyEvidence'
                )}
                <Box mb="md">
                  <Text size="sm" fw={600} c={PRIMARY_BROWN} mb="xs">Intern's Initial Advice</Text>
                  {state.editMode ? (
                    <Textarea
                      autosize
                      minRows={3}
                      value={state.editedData.content?.interviewInfo?.internAdvice || ''}
                      onChange={(e) => updateEditedData('content.interviewInfo.internAdvice', e.target.value)}
                    />
                  ) : (
                    <Text size="sm">{state.editedData.content?.interviewInfo?.internAdvice || '-'}</Text>
                  )}
                </Box>
                <Divider my="md" />
                {renderEvidenceTable(
                  "Evidence on Hand / Available for the Client(s)",
                  state.editedData.content?.interviewInfo?.clientEvidence,
                  'clientEvidence'
                )}
                {renderEvidenceTable(
                  "Evidence on Hand / Available for the Adverse Party(ies)",
                  state.editedData.content?.interviewInfo?.adversePartyEvidence,
                  'adversePartyEvidence'
                )}
                <Box mb="md">
                  <Text size="sm" fw={600} c={PRIMARY_BROWN} mb="xs">Intern's Initial Advice</Text>
                  {state.editMode ? (
                    <Textarea
                      autosize
                      minRows={3}
                      value={state.editedData.content?.interviewInfo?.internAdvice || ''}
                      onChange={(e) => updateEditedData('content.interviewInfo.internAdvice', e.target.value)}
                    />
                  ) : (
                    <Text size="sm">{state.editedData.content?.interviewInfo?.internAdvice || '-'}</Text>
                  )}
                </Box>
                <Box>
                  <Text size="sm" fw={600} c={PRIMARY_BROWN} mb="xs">Legal Opinion</Text>
                  {state.editMode ? (
                    <Textarea
                      autosize
                      minRows={5}
                      value={state.editedData.content?.interviewInfo?.legalOpinion || ''}
                      onChange={(e) => updateEditedData('content.interviewInfo.legalOpinion', e.target.value)}
                    />
                  ) : (
                    <Text size="sm">{state.editedData.content?.interviewInfo?.legalOpinion || '-'}</Text>
                  )}
                </Box>
              </Paper>
              )}
              
              {/* Step 2: Action Information */}
              {state.activeStep === 1 && (
              <Paper p="md" withBorder>
                <Title order={4} c={PRIMARY_BROWN} mb="md">Supervising Lawyer & Director Action</Title>
                
                <Box mb="md">
                  <Text size="sm" fw={600} c={PRIMARY_BROWN} mb="xs">Supervising Lawyer's Comment</Text>
                  {state.editMode ? (
                    <Textarea
                      autosize
                      minRows={4}
                      value={state.editedData.content?.actionInfo?.supervisingComment || ''}
                      onChange={(e) => updateEditedData('content.actionInfo.supervisingComment', e.target.value)}
                    />
                  ) : (
                    <Text size="sm">{state.editedData.content?.actionInfo?.supervisingComment || '-'}</Text>
                  )}
                </Box>
                <Divider my="md" />
                <Box mb="md">
                  <Text size="sm" fw={600} c={PRIMARY_BROWN} mb="xs">Director's Decision</Text>
                  {state.editMode ? (
                    <Radio.Group
                      value={state.editedData.decision || ''}
                      onChange={(val) => {
                        const updated = { ...state.editedData, decision: val };
                        // Also update the nested path for consistency
                        if (!updated.content) updated.content = {};
                        if (!updated.content.actionInfo) updated.content.actionInfo = {};
                        updated.content.actionInfo.decision = val;
                        dispatch({ type: 'SET_EDITED_DATA', payload: updated });
                      }}
                    >
                      <Group>
                        <Radio value="accepted" label="Accepted" />
                        <Radio value="rejected" label="Rejected" />
                        <Radio value="pending" label="Pending" />
                      </Group>
                    </Radio.Group>
                  ) : (
                    <Badge 
                      size="lg" 
                      color={
                        state.editedData.decision === 'accepted' ? 'green' : 
                        state.editedData.decision === 'rejected' ? 'red' : 
                        'yellow'
                      }
                    >
                      {(state.editedData.decision || 'pending').toUpperCase()}
                    </Badge>
                  )}
                </Box>
                <Box mb="md">
                  <Text size="sm" fw={600} c={PRIMARY_BROWN} mb="xs">Case Category</Text>
                  {state.editMode ? (
                    <Select
                      placeholder="Select a category"
                      value={state.editedData.content?.caseInfo?.nature || state.editedData.category || 'Other'}
                      onChange={(val) => updateEditedData('content.caseInfo.nature', val)}
                      data={[
                        { value: 'Civil Case', label: 'Civil Case' },
                        { value: 'Criminal Case', label: 'Criminal Case' },
                        { value: 'Family Law', label: 'Family Law' },
                        { value: 'Labor and Employment', label: 'Labor and Employment' },
                        { value: 'Land and Property Disputes', label: 'Land and Property Disputes' },
                        { value: 'Contract Disputes', label: 'Contract Disputes' },
                        { value: 'Personal Injury', label: 'Personal Injury' },
                        { value: 'Debt Collection', label: 'Debt Collection' },
                        { value: 'Inheritance and Estate', label: 'Inheritance and Estate' },
                        { value: 'Business and Commercial Law', label: 'Business and Commercial Law' },
                        { value: 'Consumer Protection', label: 'Consumer Protection' },
                        { value: 'Tax Law', label: 'Tax Law' },
                        { value: 'Immigration', label: 'Immigration' },
                        { value: 'Intellectual Property', label: 'Intellectual Property' },
                        { value: 'Environmental Law', label: 'Environmental Law' },
                        { value: 'Administrative Law', label: 'Administrative Law' },
                        { value: 'Human Rights Violation', label: 'Human Rights Violation' },
                        { value: 'Cybercrime', label: 'Cybercrime' },
                        { value: 'Election Law', label: 'Election Law' },
                        { value: 'Other', label: 'Other' },
                      ]}
                      clearable={false}
                      searchable
                    />
                  ) : (
                    <Badge 
                      size="lg" 
                      variant="light"
                      color={CATEGORY_COLORS[state.editedData.content?.caseInfo?.nature || state.editedData.category] || 'gray'}
                    >
                      {state.editedData.content?.caseInfo?.nature || state.editedData.category || 'Other'}
                    </Badge>
                  )}
                </Box>
                <Box mb="md">
                  <Text size="sm" fw={600} c={PRIMARY_BROWN} mb="xs">Decision Note</Text>
                  {state.editMode ? (
                    <Textarea
                      autosize
                      minRows={4}
                      value={state.editedData.content?.actionInfo?.decisionNote || ''}
                      onChange={(e) => updateEditedData('content.actionInfo.decisionNote', e.target.value)}
                    />
                  ) : (
                    <Text size="sm">{state.editedData.content?.actionInfo?.decisionNote || '-'}</Text>
                  )}
                </Box>
                <Divider my="md" />
                <SimpleGrid cols={2} spacing="sm">
                  <Box>
                    <Text size="xs" c="dimmed">Assigned To</Text>
                    {state.editMode ? (
                      <Textarea
                        autosize
                        minRows={2}
                        value={state.editedData.content?.actionInfo?.assignedTo || ''}
                        onChange={(e) => updateEditedData('content.actionInfo.assignedTo', e.target.value)}
                      />
                    ) : (
                      <Text fw={500}>{state.editedData.content?.actionInfo?.assignedTo || '-'}</Text>
                    )}
                  </Box>
                  <Box>
                    <Text size="xs" c="dimmed">Supervising Lawyer</Text>
                    {state.editMode ? (
                      <TextInput
                        value={state.editedData.content?.actionInfo?.supervisingLawyer || ''}
                        onChange={(e) => updateEditedData('content.actionInfo.supervisingLawyer', e.target.value)}
                      />
                    ) : (
                      <Text fw={500}>{state.editedData.content?.actionInfo?.supervisingLawyer || '-'}</Text>
                    )}
                  </Box>
                  <Box>
                    <Text size="xs" c="dimmed">Director's Signature</Text>
                    {state.editMode ? (
                      <TextInput
                        value={state.editedData.content?.actionInfo?.directorSignature || ''}
                        onChange={(e) => updateEditedData('content.actionInfo.directorSignature', e.target.value)}
                      />
                    ) : (
                      <Text fw={500}>{state.editedData.content?.actionInfo?.directorSignature || '-'}</Text>
                    )}
                  </Box>
                  <Box>
                    <Text size="xs" c="dimmed">Signature Date</Text>
                    {state.editMode ? (
                      <TextInput
                        type="date"
                        value={state.editedData.content?.actionInfo?.signatureDate || ''}
                        onChange={(e) => updateEditedData('content.actionInfo.signatureDate', e.target.value)}
                      />
                    ) : (
                      <Text fw={500}>{state.editedData.content?.actionInfo?.signatureDate || '-'}</Text>
                    )}
                  </Box>
                </SimpleGrid>
              </Paper>
              )}

              {/* Navigation Buttons */}
              <Divider />
              <Group justify="space-between">
                {state.activeStep > 0 ? (
                  <Button 
                    variant="outline" 
                    leftSection={<IconChevronLeft size={20} />}
                    onClick={() => dispatch({ type: 'SET_ACTIVE_STEP', payload: state.activeStep - 1 })}
                    size="sm"
                    styles={{
                      root: { borderColor: '#E0E0E0', color: MUTED_OLIVE, '&:hover': { backgroundColor: THEMED_LIGHT_BG } },
                    }}
                  >
                    Previous
                  </Button>
                ) : (
                  <Box />
                )}
                
                {state.activeStep < 1 && (
                  <Button 
                    rightSection={<IconChevronRight size={20} />}
                    onClick={() => dispatch({ type: 'SET_ACTIVE_STEP', payload: state.activeStep + 1 })}
                    size="sm"
                    style={{ backgroundColor: PRIMARY_BROWN }}
                  >
                    Next Step
                  </Button>
                )}
              </Group>
            </Stack>
          )}
        </Modal>

        {/* Create Client Account Modal */}
        <Modal
          opened={state.createAccountModalOpened}
          onClose={() => dispatch({ type: 'CLOSE_CREATE_ACCOUNT_MODAL' })}
          title={
            <Group gap="xs">
              <IconUserPlus size={20} color={PRIMARY_BROWN} />
              <Text fw={700} size="md" c={PRIMARY_BROWN}>
                Create Client Account
              </Text>
            </Group>
          }
          size="sm"
          radius="lg"
          styles={{
            body: { padding: '16px 24px 24px' },
          }}
        >
          {state.selectedCaseForAccount && (() => {
            const clientName = state.selectedCaseForAccount.content?.interviewInfo?.clientName || state.selectedCaseForAccount.clientName || 'Unknown';
            const shortId = state.selectedCaseForAccount.caseId
              ? (state.selectedCaseForAccount.caseId.length > 8 ? '#' + state.selectedCaseForAccount.caseId.slice(0, 8) : '#' + state.selectedCaseForAccount.caseId)
              : '';
            const pw = state.accountForm.password || '';
            const pwStrength = pw.length === 0 ? 0 : pw.length < 6 ? 25 : pw.length < 8 ? 50 : (pw.length >= 8 && /[A-Z]/.test(pw) && /[0-9]/.test(pw)) ? 100 : 75;
            const pwColor = pwStrength <= 25 ? 'red' : pwStrength <= 50 ? 'orange' : pwStrength <= 75 ? 'yellow' : 'green';
            const pwLabel = pwStrength <= 25 ? 'Weak' : pwStrength <= 50 ? 'Fair' : pwStrength <= 75 ? 'Good' : 'Strong';

            return (
              <Stack gap="md">
                <Box>
                  <Group gap={6} mb={2}>
                    <Text size="sm" c={CHARCOAL}>Client: <Text component="span" fw={700} inherit>{clientName}</Text></Text>
                    <Text size="xs" c="dimmed" ff="monospace">{shortId}</Text>
                  </Group>
                  <Text size="xs" c="dimmed" lh={1.4}>
                    Client will use these credentials to access their case information via the dashboard.
                  </Text>
                </Box>

                <Divider color="#F0F0F0" />

                <TextInput
                  label="Username"
                  placeholder="Enter username"
                  required
                  value={state.accountForm.username}
                  onChange={(e) => dispatch({ 
                    type: 'SET_ACCOUNT_FORM', 
                    payload: { ...state.accountForm, username: e.target.value } 
                  })}
                  styles={{
                    label: { color: CHARCOAL, fontWeight: 700, fontSize: '13px', marginBottom: 4 },
                    input: {
                      borderColor: '#D1D5DB',
                      '&:focus': { borderColor: PRIMARY_BROWN, boxShadow: `0 0 0 3px rgba(139, 69, 19, 0.1)` },
                      '&::placeholder': { color: '#9CA3AF' },
                    },
                    required: { color: '#E03131', fontSize: '14px' },
                  }}
                />

                <Box>
                  <PasswordInput
                    label="Password"
                    placeholder="Enter password"
                    required
                    value={state.accountForm.password}
                    onChange={(e) => dispatch({ 
                      type: 'SET_ACCOUNT_FORM', 
                      payload: { ...state.accountForm, password: e.target.value } 
                    })}
                    styles={{
                      label: { color: CHARCOAL, fontWeight: 700, fontSize: '13px', marginBottom: 4 },
                      input: {
                        borderColor: '#D1D5DB',
                        '&:focus': { borderColor: PRIMARY_BROWN, boxShadow: `0 0 0 3px rgba(139, 69, 19, 0.1)` },
                        '&::placeholder': { color: '#9CA3AF' },
                      },
                      required: { color: '#E03131', fontSize: '14px' },
                    }}
                  />
                  {pw.length > 0 ? (
                    <Box mt={6}>
                      <Progress value={pwStrength} color={pwColor} size="xs" radius="xl" />
                      <Text size="xs" c={pwColor === 'red' ? '#E03131' : pwColor === 'orange' ? '#E8590C' : pwColor === 'yellow' ? '#E67700' : '#2F9E44'} mt={2} fw={500}>
                        {pwLabel}
                      </Text>
                    </Box>
                  ) : (
                    <Text size="xs" c="dimmed" mt={4}>Minimum 8 characters</Text>
                  )}
                </Box>

                <TextInput
                  label={
                    <Group gap={4}>
                      <Text size="xs" fw={700} c={CHARCOAL}>Email</Text>
                      <Text size="xs" c="dimmed" fw={400}>(Optional)</Text>
                    </Group>
                  }
                  type="email"
                  placeholder="client@example.com"
                  value={state.accountForm.email}
                  onChange={(e) => dispatch({ 
                    type: 'SET_ACCOUNT_FORM', 
                    payload: { ...state.accountForm, email: e.target.value } 
                  })}
                  styles={{
                    input: {
                      borderColor: '#D1D5DB',
                      '&:focus': { borderColor: PRIMARY_BROWN, boxShadow: `0 0 0 3px rgba(139, 69, 19, 0.1)` },
                      '&::placeholder': { color: '#9CA3AF' },
                    },
                  }}
                />

                <Divider color="#F0F0F0" mt={4} />

                <Group justify="flex-end" gap="sm">
                  <Button
                    variant="subtle"
                    color="gray"
                    onClick={() => dispatch({ type: 'CLOSE_CREATE_ACCOUNT_MODAL' })}
                    disabled={state.creatingAccount}
                    styles={{
                      root: { color: '#6B7280', '&:hover': { backgroundColor: '#F3F4F6' } },
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    style={{ backgroundColor: PRIMARY_BROWN }}
                    onClick={handleCreateClientAccount}
                    loading={state.creatingAccount}
                    disabled={!state.accountForm.username || !state.accountForm.password}
                  >
                    Create Account
                  </Button>
                </Group>
              </Stack>
            );
          })()}
        </Modal>

        {/* Page Header */}
        <Group justify="space-between" align="center" mb="lg">
          <Box>
            <Title order={3} c={CHARCOAL} lh={1.2}>
              Finalized Cases
            </Title>
            <Text size="sm" c={MUTED_OLIVE} mt={2}>
              Manage accepted, reviewed, and finalized client cases
            </Text>
          </Box>
          <Tooltip label="Refresh data">
            <ActionIcon
              size="md"
              variant="subtle"
              color="gray"
              onClick={() => fetchFinalized()}
              loading={state.loadingFinalized}
              radius="md"
            >
              <IconRefresh size={18} />
            </ActionIcon>
          </Tooltip>
        </Group>

        {/* Search, Filter & Tabs */}
        <Paper shadow="xs" p="lg" radius="lg" bg="white" style={{ border: '1px solid #F0F0F0' }}>
          <Group mb="md" gap="sm" wrap="nowrap">
            <TextInput
              placeholder="Search by Case ID or Client Name..."
              size="sm"
              value={state.searchTerm}
              onChange={(e) => dispatch({ type: 'SET_SEARCH_TERM', payload: e.target.value })}
              leftSection={<IconSearch size={16} color={MUTED_OLIVE} />}
              rightSection={
                state.searchTerm && (
                  <ActionIcon size="xs" variant="subtle" onClick={() => dispatch({ type: 'SET_SEARCH_TERM', payload: '' })}>
                    <IconX size={14} />
                  </ActionIcon>
                )
              }
              style={{ flex: 1 }}
              styles={{ input: { border: '1px solid #E5E7EB', fontSize: '13px', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' } }}
              radius="md"
            />
            <Select
              placeholder="Category"
              size="sm"
              radius="md"
              value={state.categoryFilter}
              onChange={(val) => dispatch({ type: 'SET_CATEGORY_FILTER', payload: val || 'all' })}
              data={[
                { value: 'all', label: 'All Categories' },
                ...NATURE_OF_CASE_OPTIONS.map(cat => ({ value: cat, label: cat }))
              ]}
              leftSection={<IconFilter size={16} color={MUTED_OLIVE} />}
              style={{ width: 200 }}
              styles={{ input: { border: '1px solid #E5E7EB', fontSize: '13px' } }}
              allowDeselect={false}
            />
          </Group>
          
          <Tabs value={state.activeTab} onChange={(val) => dispatch({ type: 'SET_ACTIVE_TAB', payload: val })}
            styles={{ tab: { '&[data-active]': { backgroundColor: '#F9FAFB', fontWeight: 600 } } }}
          >
            <Tabs.List mb="md" style={{ borderBottom: '1px solid #E5E7EB' }}>
              <Tabs.Tab value="accepted"
                rightSection={<Badge size="xs" variant="light" color="green" radius="xl" style={{ minWidth: 20, height: 20, padding: '0 6px' }}>{acceptedWithRecord.length}</Badge>}
                style={{ fontSize: '13px', padding: '10px 14px' }}
              >
                With Record
              </Tabs.Tab>
              <Tabs.Tab value="without-record"
                rightSection={<Badge size="xs" variant="light" color="blue" radius="xl" style={{ minWidth: 20, height: 20, padding: '0 6px' }}>{acceptedWithoutRecord.length}</Badge>}
                style={{ fontSize: '13px', padding: '10px 14px' }}
              >
                Without Record
              </Tabs.Tab>
              <Tabs.Tab value="legal-advice"
                rightSection={<Badge size="xs" variant="light" color="teal" radius="xl" style={{ minWidth: 20, height: 20, padding: '0 6px' }}>{legalAdviceCases.length}</Badge>}
                style={{ fontSize: '13px', padding: '10px 14px' }}
              >
                Legal Advice
              </Tabs.Tab>
              <Tabs.Tab value="document-drafting"
                rightSection={<Badge size="xs" variant="light" color="violet" radius="xl" style={{ minWidth: 20, height: 20, padding: '0 6px' }}>{documentDraftingCases.length}</Badge>}
                style={{ fontSize: '13px', padding: '10px 14px' }}
              >
                Document Drafting
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="accepted" pb="md">
              <Stack gap={10}>
                {state.loadingFinalized ? (
                  <Center py="xl"><Loader color={PRIMARY_BROWN} /></Center>
                ) : (
                  acceptedWithRecord.length ? acceptedWithRecord.map(renderCaseCard) : (
                    <Text size="sm" c={MUTED_OLIVE} ta="center" py="xl">No accepted cases with case records found</Text>
                  )
                )}
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="without-record" pb="md">
              <Stack gap={10}>
                {state.loadingFinalized ? (
                  <Center py="xl"><Loader color={PRIMARY_BROWN} /></Center>
                ) : (
                  acceptedWithoutRecord.length ? acceptedWithoutRecord.map(renderCaseCard) : (
                    <Text size="sm" c={MUTED_OLIVE} ta="center" py="xl">No accepted cases without case records found</Text>
                  )
                )}
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="legal-advice" pb="md">
              <Stack gap={10}>
                {state.loadingFinalized ? (
                  <Center py="xl"><Loader color={PRIMARY_BROWN} /></Center>
                ) : (
                  legalAdviceCases.length ? legalAdviceCases.map(renderCaseCard) : (
                    <Text size="sm" c={MUTED_OLIVE} ta="center" py="xl">No legal advice cases found</Text>
                  )
                )}
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="document-drafting" pb="md">
              <Stack gap={10}>
                {state.loadingFinalized ? (
                  <Center py="xl"><Loader color={PRIMARY_BROWN} /></Center>
                ) : (
                  documentDraftingCases.length ? documentDraftingCases.map(renderCaseCard) : (
                    <Text size="sm" c={MUTED_OLIVE} ta="center" py="xl">No document drafting cases found</Text>
                  )
                )}
              </Stack>
            </Tabs.Panel>
          </Tabs>
        </Paper>
      </Container>
    </Box>
  );
}

// --- CLIENT INFORMATION SHEET (SOLA Form 3) PDF LAYOUT ---
const drawClientsInformationSheetPage = (doc, raw = {}) => {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 12;

  // Prefer current edit values when exporting while editing
  const a = raw || {};

  const txt = (v) => (v === undefined || v === null ? "" : String(v));
  // NOTE: jsPDF's built-in Times font doesn't reliably render the Peso sign (₱)
  // and can show garbled characters like '+&'. Keep export ASCII-safe.
  const money = (v) => {
    if (v === undefined || v === null || v === "") return "";
    if (typeof v === 'number' && Number.isFinite(v)) return v.toLocaleString();
    const s = String(v).trim();
    // Strip common currency formatting (₱, PHP, commas) and parse
    const cleaned = s
      .replace(/php/gi, '')
      .replace(/[₱,\s]/g, '')
      .replace(/[^0-9.-]/g, '');
    const n = Number(cleaned);
    if (Number.isNaN(n)) return s.replace(/₱/g, '').trim();
    return n.toLocaleString();
  };

  const fullName = txt(a.fullName || a.name);
  const age = txt(a.age);
  const birthday = txt(a.birthday);
  const sex = txt(a.sex);
  const civilStatus = txt(a.civilStatus);
  const citizenship = txt(a.citizenship);
  const spouseName = txt(a.spouseName);
  const contactNumber = txt(a.contactNumber);
  const presentAddress = txt(a.presentAddress);
  const permanentAddress = txt(a.permanentAddress);

  const relatorName = txt(a.relatorName);
  const relationshipToClient = txt(a.relationshipToClient);
  const relatorContactNumber = txt(a.relatorContactNumber);

  const currentSourceOfIncome = txt(a.currentSourceOfIncome);
  const monthlyIncome = money(a.monthlyIncome);
  const natureOfWork = txt(a.natureOfWork);
  const employerName = txt(a.employerName);
  const employerAddress = txt(a.employerAddress);
  const employerTelephone = txt(a.employerTelephone);

  const spouseSourceOfIncome = txt(a.spouseSourceOfIncome);
  const spouseMonthlyIncome = money(a.spouseMonthlyIncome);
  const spouseEmployerAddress = txt(a.spouseEmployerAddress);
  const totalCombinedIncome = money(a.totalCombinedIncome);

  const partyRepresented = txt(a.partyRepresented);
  const venue = txt(a.venue);
  const presentStage = txt(a.presentStage);
  const caseNumber = txt(a.caseNumber);
  const caseNature = txt(a.caseNature || a.natureOfCase);
  const courtDivision = txt(a.courtDivision);
  const courtAddress = txt(a.courtAddress);
  const presidingOfficer = txt(a.presidingOfficer);

  // These are on the printed form but may not exist in your current schema/UI.
  const presidingOfficerPhone = txt(a.presidingOfficerPhone || a.phoneNumber);
  const adverseParties = txt(a.adverseParties);
  const adversePartiesAddress = txt(a.adversePartiesAddress);
  const adversePartiesCounsel = txt(a.adversePartiesCounsel);
  const adversePartiesCounselAddress = txt(a.adversePartiesCounselAddress);
  const adversePartiesCounselPhone = txt(a.adversePartiesCounselPhone);

  const setFont = (size = 11, style = "normal") => {
    doc.setFont("times", style);
    doc.setFontSize(size);
    doc.setTextColor(0, 0, 0);
  };

  const label = (t, x, y) => {
    setFont(10, "normal");
    doc.text(t, x, y);
  };

  const line = (x1, y, x2) => doc.line(x1, y, x2, y);

  // Draw "Label: ____" with value printed just above the line.
  const field = ({ labelText, value, x, y, labelW, lineW, lineToX }) => {
    label(labelText, x, y);
    const lx = x + labelW;
    const ly = y + 0.6; // underline baseline
    const x2 = typeof lineToX === 'number' ? lineToX : lx + lineW;
    line(lx, ly, x2);
    if (value) {
      setFont(10, "normal");
      // place value slightly above the underline
      const maxW = Math.max(0, (x2 - lx) - 2);
      doc.text(value, lx + 1, y - 0.6, { maxWidth: maxW });
    }
  };

  // Section title (PERSONAL DETAILS, etc.)
  const sectionTitle = (t, x, y) => {
    setFont(11, "bold");
    doc.text(t, x, y);
  };

  // --- Header (matches the photo) ---
  let y = 12;

  setFont(9, "normal");
  doc.text("SOLA FORM 3", margin, y);
  doc.text("Revised September 2020", margin, y + 4);

  // Center title box
  const titleBoxW = 72;
  const titleBoxH = 8;
  const titleBoxX = (pageW - titleBoxW) / 2;
  doc.rect(titleBoxX, y, titleBoxW, titleBoxH);
  setFont(10, "bold");
  doc.text("CLIENT'S INFORMATION SHEET", titleBoxX + 6, y + 5.6);

  // Organization box (left)
  const orgBoxX = margin;
  const orgBoxY = y + 10;
  const orgBoxW = 78;
  const orgBoxH = 18;
  doc.rect(orgBoxX, orgBoxY, orgBoxW, orgBoxH);
  setFont(9, "normal");
  doc.text(
    [
      "Sebastinian Office of Legal Aid (SOLA)",
      "College of Law",
      "San Sebastian College - Recoletos, Manila",
    ],
    orgBoxX + 3,
    orgBoxY + 6
  );

  y = orgBoxY + orgBoxH + 10;

  // --- Layout columns ---
  const gap = 8;
  const leftX = margin;
  const leftW = (pageW - margin * 2 - gap) * 0.62;
  const rightX = leftX + leftW + gap;
  const rightW = pageW - margin - rightX;

  // --- PERSONAL DETAILS ---
  sectionTitle("PERSONAL DETAILS", leftX, y);
  y += 6;

  // Row spacing
  const rowH = 7;

  field({ labelText: "Name:", value: fullName, x: leftX, y, labelW: 14, lineW: leftW - 16 });
  field({ labelText: "If through a Relator / Representative:", value: "", x: rightX, y, labelW: 54, lineW: rightW - 56 });
  y += rowH;

  field({ labelText: "Age:", value: age, x: leftX, y, labelW: 10, lineW: 18 });
  field({ labelText: "Birthday:", value: birthday, x: leftX + 34, y, labelW: 16, lineW: leftW - 34 - 18 });
  field({ labelText: "Name of Relator / Representative:", value: relatorName, x: rightX, y, labelW: 50, lineW: rightW - 52 });
  y += rowH;

  field({ labelText: "Contact Number/s:", value: contactNumber, x: leftX, y, labelW: 32, lineW: leftW - 34 });
  field({ labelText: "Relationship to the Client:", value: relationshipToClient, x: rightX, y, labelW: 40, lineW: rightW - 42 });
  y += rowH;

  field({ labelText: "Sex:", value: sex, x: leftX, y, labelW: 10, lineW: 26 });
  field({ labelText: "Civil Status:", value: civilStatus, x: leftX + 40, y, labelW: 22, lineW: leftW - 40 - 24 });
  field({ labelText: "Telephone Number:", value: relatorContactNumber, x: rightX, y, labelW: 32, lineW: rightW - 34 });
  y += rowH;

  field({ labelText: "Citizenship:", value: citizenship, x: leftX, y, labelW: 22, lineW: leftW - 24 });
  y += rowH;

  field({ labelText: "Spouse:", value: spouseName, x: leftX, y, labelW: 16, lineW: leftW - 18 });
  y += rowH;

  field({ labelText: "Cellphone Number/s:", value: contactNumber, x: leftX, y, labelW: 36, lineW: leftW - 38 });
  y += rowH;

  field({ labelText: "Present Address:", value: presentAddress, x: leftX, y, labelW: 30, lineW: leftW - 32 });
  y += rowH;

  field({ labelText: "Permanent Address:", value: permanentAddress, x: leftX, y, labelW: 34, lineW: leftW - 36 });
  y += rowH;

  field({ labelText: "Telephone Number:", value: "", x: leftX, y, labelW: 32, lineW: leftW - 34 });
  y += 8;

  // --- FINANCIAL DETAILS ---
  sectionTitle("FINANCIAL DETAILS", leftX, y);
  y += 6;

  // Financial rows have two fields on one line inside the LEFT column.
  // Use explicit boundaries to prevent underline/value overlap.
  const leftColEndX = leftX + leftW;
  const finRightFieldX = leftX + 64; // start of the right-side field label within left column

  field({
    labelText: "Current Source of Income:",
    value: currentSourceOfIncome,
    x: leftX,
    y,
    labelW: 40,
    lineToX: finRightFieldX - 2,
  });
  field({
    labelText: "Income / Month:",
    value: monthlyIncome,
    x: finRightFieldX,
    y,
    labelW: 24,
    lineToX: leftColEndX,
  });
  y += rowH;

  field({ labelText: "Nature of Work / Business:", value: natureOfWork, x: leftX, y, labelW: 48, lineW: leftW - 50 });
  y += rowH;

  field({ labelText: "Employer / Business Owner's Name:", value: employerName, x: leftX, y, labelW: 60, lineW: leftW - 62 });
  y += rowH;

  field({ labelText: "Employer / Business Address:", value: employerAddress, x: leftX, y, labelW: 52, lineW: leftW - 54 });
  y += rowH;

  // Telephone shares a row in the printed layout; avoid overlap.
  const finTelFieldX = leftX + 72;
  field({
    labelText: "Nature of Work / Business:",
    value: natureOfWork,
    x: leftX,
    y,
    labelW: 40,
    lineToX: finTelFieldX - 2,
  });
  field({
    labelText: "Telephone:",
    value: employerTelephone,
    x: finTelFieldX,
    y,
    labelW: 18,
    lineToX: leftColEndX,
  });
  y += rowH;

  field({
    labelText: "Spouse's Source of Income:",
    value: spouseSourceOfIncome,
    x: leftX,
    y,
    labelW: 44,
    lineToX: finRightFieldX - 2,
  });
  field({
    labelText: "Income / Month:",
    value: spouseMonthlyIncome,
    x: finRightFieldX,
    y,
    labelW: 24,
    lineToX: leftColEndX,
  });
  y += rowH;

  field({ labelText: "Spouse's Employer / Business Address:", value: spouseEmployerAddress, x: leftX, y, labelW: 66, lineW: leftW - 68 });
  y += rowH;

  field({ labelText: "Total Combined Monthly Income:", value: totalCombinedIncome, x: leftX, y, labelW: 56, lineW: leftW - 58 });
  y += 8;

  // --- CASE DETAILS ---
  sectionTitle("CASE DETAILS", leftX, y);
  y += 6;

  // Case section was looking too tall; use a tighter row height here.
  const caseRowH = 5.5;

  field({ labelText: "Party Represented:", value: partyRepresented, x: leftX, y, labelW: 34, lineW: leftW - 36 - 10 });
  field({ labelText: "Venue / City:", value: venue, x: rightX, y, labelW: 26, lineW: rightW - 28 });
  y += caseRowH;

  field({ labelText: "Present Stage of the Case:", value: presentStage, x: leftX, y, labelW: 50, lineW: leftW - 52 });
  field({ labelText: "Case / Docket Number:", value: caseNumber, x: rightX, y, labelW: 40, lineW: rightW - 42 });
  y += caseRowH;

  field({ labelText: "Nature:", value: caseNature, x: leftX, y, labelW: 14, lineW: pageW - margin * 2 - 16 });
  y += caseRowH;

  field({ labelText: "Court / Agency / Tribunal Division:", value: courtDivision, x: leftX, y, labelW: 64, lineW: pageW - margin * 2 - 66 });
  y += caseRowH;

  field({ labelText: "Court / Agency / Tribunal Address:", value: courtAddress, x: leftX, y, labelW: 64, lineW: pageW - margin * 2 - 66 });
  y += caseRowH;

  // Prevent the Presiding Officer underline from running into the Phone Number field.
  field({ labelText: "Presiding Officer:", value: presidingOfficer, x: leftX, y, labelW: 34, lineToX: rightX - 2 });
  field({ labelText: "Phone Number:", value: presidingOfficerPhone, x: rightX + 6, y, labelW: 28, lineW: rightW - 34 });
  y += caseRowH;

  field({ labelText: "Adverse Party(ies):", value: adverseParties, x: leftX, y, labelW: 36, lineW: pageW - margin * 2 - 38 });
  y += caseRowH;

  field({ labelText: "Adverse Party(ies) Address:", value: adversePartiesAddress, x: leftX, y, labelW: 52, lineW: pageW - margin * 2 - 54 });
  y += caseRowH;

  field({ labelText: "Adverse Party(ies) Counsel:", value: adversePartiesCounsel, x: leftX, y, labelW: 50, lineW: pageW - margin * 2 - 52 });
  y += caseRowH;

  field({ labelText: "Adverse Party(ies) Counsel Address:", value: adversePartiesCounselAddress, x: leftX, y, labelW: 64, lineW: pageW - margin * 2 - 66 });
  y += caseRowH;

  field({ labelText: "Adverse Party(ies) Counsel Phone Number:", value: adversePartiesCounselPhone, x: leftX, y, labelW: 76, lineW: pageW - margin * 2 - 78 });
  y += 10;

  // --- Data privacy footer box ---
  const footerH = 18;
  const footerY = pageH - margin - footerH;
  doc.rect(margin, footerY, pageW - margin * 2, footerH);
  setFont(7, "normal");
  doc.text(
    "\n"+
    "DATA PRIVACY: Sebastinian Office of Legal Aid (SOLA) College of Law is committed to upholding the Philippine Data Privacy Act which implements the\n" +
      "Constitutional right to informational privacy of data subjects. This form is operated and maintained by the SOLA. Your personal information is collected and\n" +
      "processed in order for us to verify your identity, assess your application, and contact you about your case. Rest assured the information provided herein will\n" +
      "be treated with utmost confidentiality.",
    margin + 2,
    footerY + 6
  );
};