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
} from '@mantine/core';
import { IconBriefcase, IconChevronRight, IconEye, IconFileText, IconCircleCheck, IconChevronLeft, IconMessageCircle, IconReceipt, IconSend, IconUser, IconDownload, IconClock, IconHistory } from '@tabler/icons-react';
import jsPDF from 'jspdf';
import mammoth from 'mammoth';
import { notifications } from '@mantine/notifications';
import { PRIMARY_GOLD, PRIMARY_BROWN, MUTED_OLIVE, THEMED_LIGHT_BG, CHARCOAL, ACCENT_TAN, NATURE_OF_CASE_OPTIONS, CATEGORY_COLORS } from '@utils/constants';
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

    downloadPdfDocument('Case Record', [
      { heading: 'Case Record Summary', rows: summaryRows },
      { heading: 'Parties & Representation', rows: partiesRows },
      { heading: 'Addresses & Contact', rows: addressesRows },
      { heading: 'Case History & Remarks', rows: historyRows },
    ]);
  };

  const exportAppointmentPdf = () => {
    if (!state.appointmentDetails) {
      notifications.show({ title: 'Nothing to export', message: 'No appointment details loaded.', color: 'yellow' });
      return;
    }

    const a = state.appointmentDetails;
    const personalRows = [
      { label: 'Full Name', value: formatText(a.fullName || a.name) },
      { label: 'Age', value: formatText(a.age) },
      { label: 'Birthday', value: formatDate(a.birthday) },
      { label: 'Sex', value: formatText(a.sex) },
      { label: 'Civil Status', value: formatText(a.civilStatus) },
      { label: 'Contact Number', value: formatText(a.contactNumber) },
      { label: 'Email', value: formatText(a.email) },
      { label: 'Present Address', value: formatText(a.presentAddress) },
      { label: 'Permanent Address', value: formatText(a.permanentAddress) },
    ];

    const scheduleRows = [
      { label: 'Appointment Date', value: formatDate(a.appointedDate) },
      { label: 'Case Number', value: formatText(a.caseNumber) },
      { label: 'Status', value: formatText(a.status) },
      { label: 'Appointment Type', value: formatText(a.caseDetails?.appointmentType || a.personal?.legalMatter || a.caseDetails?.legalMatter) },
    ];

    const financialRows = [
      { label: 'Income Source', value: formatText(a.currentSourceOfIncome) },
      { label: 'Monthly Income', value: a.monthlyIncome ? `₱${Number(a.monthlyIncome).toLocaleString()}` : '-' },
      { label: 'Nature of Work', value: formatText(a.natureOfWork) },
      { label: 'Employer', value: formatText(a.employerName) },
      { label: 'Employer Address', value: formatText(a.employerAddress) },
    ];

    const caseRows = [
      { label: 'Party Represented', value: formatText(a.partyRepresented) },
      { label: 'Venue', value: formatText(a.venue) },
      { label: 'Present Stage', value: formatText(a.presentStage) },
      { label: 'Court Division', value: formatText(a.courtDivision) },
      { label: 'Court Address', value: formatText(a.courtAddress) },
      { label: 'Case Description', value: formatText(a.caseDescription) },
    ];

    downloadPdfDocument('Appointment Receipt', [
      { heading: 'Personal Details', rows: personalRows },
      { heading: 'Schedule Details', rows: scheduleRows },
      { heading: 'Financial Details', rows: financialRows },
      { heading: 'Case Details', rows: caseRows },
    ]);
  };

  const exportRecommendationPdf = () => {
    if (!state.editedData) {
      notifications.show({ title: 'Nothing to export', message: 'No review data loaded.', color: 'yellow' });
      return;
    }

    const d = state.editedData;
    const interview = d.content?.interviewInfo || {};
    const action = d.content?.actionInfo || {};

    const summaryRows = [
      { label: 'Client Name', value: formatText(d.clientName || interview.clientName) },
      { label: 'Case Title', value: formatText(d.caseTitle || d.content?.caseInfo?.title) },
      { label: 'Case ID', value: formatText(d.caseId) },
      { label: 'Decision', value: formatText(d.decision ? d.decision.toUpperCase() : 'PENDING') },
      { label: 'Finalized By', value: formatText(d.finalizedBy) },
      { label: 'Role', value: formatText(d.finalizedRole) },
      { label: 'Created At', value: formatDate(d.createdAt) },
    ];

    const interviewRows = [
      { label: 'Date of Interview', value: formatDate(interview.dateOfInterview) },
      { label: 'Date Submitted', value: formatDate(interview.dateSubmitted) },
      { label: "Interviewing Intern(s)", value: formatText(interview.interviewingInterns) },
      { label: 'Fast Facts', value: formatText(interview.fastFacts) },
      { label: "Intern's Initial Advice", value: formatText(interview.internAdvice) },
      { label: 'Legal Opinion', value: formatText(interview.legalOpinion) },
    ];

    const actionRows = [
      { label: "Supervising Lawyer's Comment", value: formatText(action.supervisingComment) },
      { label: 'Director Decision', value: formatText(d.decision ? d.decision.toUpperCase() : action.decision) },
      { label: 'Case Category', value: formatText(d.content?.caseInfo?.nature || d.category) },
      { label: 'Decision Note', value: formatText(action.decisionNote) },
      { label: 'Assigned To', value: formatText(action.assignedTo) },
      { label: 'Supervising Lawyer', value: formatText(action.supervisingLawyer) },
      { label: "Director's Signature", value: formatText(action.directorSignature) },
      { label: 'Signature Date', value: formatDate(action.signatureDate) },
    ];

    downloadPdfDocument('Recommendation for Action', [
      { heading: 'Recommendation Summary', rows: summaryRows },
      { heading: 'Interview Information', rows: interviewRows },
      { heading: 'Evidence on Hand (Client)', evidence: interview.clientEvidence },
      { heading: 'Evidence on Hand (Adverse Party)', evidence: interview.adversePartyEvidence },
      { heading: 'Director & Supervising Lawyer Action', rows: actionRows },
    ]);
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
    const flag = record?.content?.interviewInfo?.forLegalAdvice;
    return flag === true || flag === 'true' || flag === 1 || flag === '1';
  };

  const isDocumentDrafting = (record) => {
    const caseType = record?.content?.interviewInfo?.caseType;
    return caseType === 'legal-document';
  };

  // Group finalized records by decision and apply search filter
  const acceptedCases = filterCases(state.finalized.filter(f => f.decision === 'accepted'));
  const legalAdviceCases = acceptedCases.filter(isLegalAdvice);
  const documentDraftingCases = acceptedCases.filter(isDocumentDrafting);
  const acceptedNonLegal = acceptedCases.filter(f => !isLegalAdvice(f) && !isDocumentDrafting(f));
  const acceptedWithRecord = acceptedNonLegal.filter(f => state.caseRecordsMap[f._id || f.id]);
  const acceptedWithoutRecord = acceptedNonLegal.filter(f => !state.caseRecordsMap[f._id || f.id]);

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
        alert('Case record saved successfully!');
        dispatch({ type: 'SET_CASE_RECORD_EDIT_MODE', payload: false });
        // Refetch finalized cases to update the data
        await fetchFinalized();
      }
    } catch (err) {
      console.error('Error saving case record:', err);
      const errorMsg = err.response?.data?.error || err.message;
      alert('Failed to save case record: ' + errorMsg);
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

  const renderCaseCard = (f) => (
    <Paper
      key={f._id || f.id || f.caseId}
      p="md"
      radius="md"
      withBorder
      style={{ borderRadius: 12, border: '1px solid #E6D9CC', background: 'white' }}
    >
      <Group noWrap align="center" justify="space-between">
        <Group noWrap align="center" style={{ flex: 1 }}>
          <Box style={{ width: 40, height: 40, borderRadius: 8, background: MUTED_OLIVE, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <IconBriefcase size={18} />
          </Box>
          <Box style={{ flex: 1 }}>
            <Group spacing="xs" align="center">
              {(() => {
                const recordId = f._id || f.id;
                const hasRecord = recordId ? state.caseRecordsMap[recordId] : false;
                const clientName = f.clientName || f.content?.interviewInfo?.clientName || 'Unknown Client';
                const displayTitle = hasRecord
                  ? (f.caseTitle || f.content?.caseInfo?.caseTitle || f.content?.caseInfo?.title || f.caseId || clientName)
                  : clientName;
                return <Text fw={600} size="sm">{displayTitle}</Text>;
              })()}
              {f.caseId && (
                <Badge 
                  size="sm" 
                  variant="filled" 
                  style={{ 
                    backgroundColor: PRIMARY_GOLD, 
                    color: CHARCOAL,
                    fontWeight: 600
                  }}
                >
                  {f.caseId}
                </Badge>
              )}
            </Group>
            <Text size="xs" c="dimmed" mt={4}>
              {f.createdAt ? new Date(f.createdAt).toLocaleDateString() : 'No Date'}
            </Text>
            <Group spacing="xs" mt={4}>
              {(f.content?.caseInfo?.nature || f.category) && (
                <Badge 
                  size="sm" 
                  variant="light" 
                  color={CATEGORY_COLORS[f.content?.caseInfo?.nature || f.category] || 'gray'}
                >
                  {f.content?.caseInfo?.nature || f.category}
                </Badge>
              )}
              <Badge size="sm" variant="light" color="gray">
                {f.finalizedRole || f.finalizedBy || 'Secretary'}
              </Badge>
            </Group>
          </Box>
        </Group>
        <Stack spacing="xs" align="stretch" style={{ minWidth: '300px' }}>
          <Group spacing="xs" grow>
            <Button
              size="sm"
              variant="outline"
              leftSection={<IconEye size={16} />}
              onClick={(e) => {
                e.stopPropagation();
                openModal(f);
              }}
              style={{ flex: 1 }}
            >
              View Review
            </Button>
            {f.decision === 'accepted' && (
              <Button
                size="sm"
                variant="outline"
                style={{ borderColor: ACCENT_TAN, color: PRIMARY_BROWN, flex: 1 }}
                leftSection={<IconReceipt size={16} />}
                onClick={(e) => {
                  e.stopPropagation();
                  openAppointmentModal(f);
                }}
              >
                Full Receipt
              </Button>
            )}
          </Group>
          {f.decision === 'accepted' && (
            <Group spacing="xs" grow>
              {!isLegalAdvice(f) && (
                <Button
                  size="sm"
                  variant="filled"
                  style={{ backgroundColor: PRIMARY_BROWN, flex: 1 }}
                  leftSection={<IconFileText size={16} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    openCaseRecordModal(f);
                  }}
                >
                  Case Record
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                style={{ borderColor: PRIMARY_GOLD, color: PRIMARY_BROWN, flex: 1 }}
                leftSection={<IconMessageCircle size={16} />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleChatNavigation(f);
                }}
              >
                Chat
              </Button>
            </Group>
          )}
          {f.decision === 'accepted' && isDocumentDrafting(f) && (
            <Button
              size="sm"
              variant="light"
              color="violet"
              fullWidth
              leftSection={<IconHistory size={16} />}
              onClick={(e) => {
                e.stopPropagation();
                const versions = f.content?.interviewInfo?.documentVersions || [];
                dispatch({ 
                  type: 'OPEN_VERSION_HISTORY_MODAL', 
                  payload: { case: f, versions } 
                });
              }}
            >
              View Version History
            </Button>
          )}
        </Stack>
      </Group>
    </Paper>
  );

  const appointmentStatusLabel = state.appointmentEditMode
    ? (state.appointmentForm.status || state.appointmentDetails?.status || 'For Appointment')
    : (state.appointmentDetails?.status || 'For Appointment');

  return (
    <Box bg={THEMED_LIGHT_BG} mih="100vh" py="xl">
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
                        {state.selectedCaseForVersions.content.interviewInfo.uploadedDocument.uploadedBy && (
                          <Text size="xs" c="dimmed" mb={8}>
                            Uploaded by: <Text component="span" fw={600}>
                              {state.selectedCaseForVersions.content.interviewInfo.uploadedDocument.uploadedBy}
                            </Text> ({state.selectedCaseForVersions.content.interviewInfo.uploadedDocument.uploadedByRole || 'Unknown'})
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
                          Unable to preview this document. Please download it to view.
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
                    <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Case Number</Text>
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
                      data={NATURE_OF_CASE_OPTIONS}
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

        {/* Header */}
        <Paper
          shadow="xs"
          p="xl"
          mb="xl"
          radius="lg"
          style={{ background: PRIMARY_BROWN, border: 'none' }}
        >
          <Group gap="md" align="center">
            <Box
              style={{ width: 48, height: 48, borderRadius: '12px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <IconBriefcase size={24} color={PRIMARY_BROWN} stroke={2.5} />
            </Box>
            <Title order={2} c="white">
              Finalized Cases Management
            </Title>
          </Group>
        </Paper>

        {/* Tabbed Content */}
        <Paper shadow="xs" p="xl" radius="lg" bg="white">
          {/* Search and Filter Bar */}
          <Group mb="xl" align="flex-start" grow>
            <TextInput
              placeholder="Search by Case ID (e.g., case-26-0001) or Client Name"
              size="md"
              value={state.searchTerm}
              onChange={(e) => dispatch({ type: 'SET_SEARCH_TERM', payload: e.target.value })}
              leftSection={
                <Box style={{ display: 'flex', alignItems: 'center', color: MUTED_OLIVE }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                  </svg>
                </Box>
              }
              rightSection={
                state.searchTerm && (
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    onClick={() => dispatch({ type: 'SET_SEARCH_TERM', payload: '' })}
                    style={{ cursor: 'pointer' }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </ActionIcon>
                )
              }
              styles={{
                input: {
                  borderRadius: '8px',
                  border: '1px solid #E6D9CC',
                  '&:focus': {
                    borderColor: PRIMARY_BROWN,
                  }
                }
              }}
            />
            <Select
              placeholder="Filter by Category"
              size="md"
              value={state.categoryFilter}
              onChange={(val) => dispatch({ type: 'SET_CATEGORY_FILTER', payload: val })}
              data={[
                { value: 'all', label: 'All Categories' },
                ...NATURE_OF_CASE_OPTIONS.map(cat => ({ value: cat, label: cat }))
              ]}
              clearable
              onClear={() => dispatch({ type: 'SET_CATEGORY_FILTER', payload: 'all' })}
              leftSection={
                <Box style={{ display: 'flex', alignItems: 'center', color: MUTED_OLIVE }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>
                  </svg>
                </Box>
              }
              styles={{
                input: {
                  borderRadius: '8px',
                  border: '1px solid #E6D9CC',
                  '&:focus': {
                    borderColor: PRIMARY_BROWN,
                  }
                }
              }}
            />
          </Group>
          
          <Tabs value={state.activeTab} onChange={(val) => dispatch({ type: 'SET_ACTIVE_TAB', payload: val })}>
            <Tabs.List mb="xl" style={{ borderBottom: '1px solid #e9ecef' }}>
              <Tabs.Tab
                value="accepted"
                rightSection={<Badge size="sm" color="green" variant="light">{acceptedWithRecord.length}</Badge>}
              >
                With Record
              </Tabs.Tab>
              <Tabs.Tab
                value="without-record"
                rightSection={<Badge size="sm" color="blue" variant="light">{acceptedWithoutRecord.length}</Badge>}
              >
                Without Record
              </Tabs.Tab>
              <Tabs.Tab
                value="legal-advice"
                rightSection={<Badge size="sm" color="teal" variant="light">{legalAdviceCases.length}</Badge>}
              >
                Legal Advice Only
              </Tabs.Tab>
              <Tabs.Tab
                value="document-drafting"
                rightSection={<Badge size="sm" color="violet" variant="light">{documentDraftingCases.length}</Badge>}
              >
                Document Drafting
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="accepted" pb="md">
              <Stack>
                {state.loadingFinalized ? (
                  <Center><Loader /></Center>
                ) : (
                  acceptedWithRecord.length ? acceptedWithRecord.map(renderCaseCard) : (
                    <Text size="sm" c={MUTED_OLIVE}>No accepted cases with case records found</Text>
                  )
                )}
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="without-record" pb="md">
              <Stack>
                {state.loadingFinalized ? (
                  <Center><Loader /></Center>
                ) : (
                  acceptedWithoutRecord.length ? acceptedWithoutRecord.map(renderCaseCard) : (
                    <Text size="sm" c={MUTED_OLIVE}>No accepted cases without case records found</Text>
                  )
                )}
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="legal-advice" pb="md">
              <Stack>
                {state.loadingFinalized ? (
                  <Center><Loader /></Center>
                ) : (
                  legalAdviceCases.length ? legalAdviceCases.map(renderCaseCard) : (
                    <Text size="sm" c={MUTED_OLIVE}>No accepted legal advice cases found</Text>
                  )
                )}
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="document-drafting" pb="md">
              <Stack>
                {state.loadingFinalized ? (
                  <Center><Loader /></Center>
                ) : (
                  documentDraftingCases.length ? documentDraftingCases.map(renderCaseCard) : (
                    <Text size="sm" c={MUTED_OLIVE}>No document drafting cases found</Text>
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