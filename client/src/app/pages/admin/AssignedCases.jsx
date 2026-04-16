import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
  Box,
  Group,
  Text,
  Title,
  Badge,
  Center,
  Loader,
  Pagination,
  Divider,
  Tabs,
  Table,
  Paper,
  Stack,
  Button,
  ActionIcon,
  Tooltip,
  Avatar,
  TextInput,
  Menu,
  Modal,
  Grid,
  Textarea,
  Select,
  SimpleGrid,
  Stepper,
  Container,
  ScrollArea,
  FileButton,
} from '@mantine/core';
import {
  IconClipboardCheck,
  IconCheckbox,
  IconCheck,
  IconX,
  IconClock,
  IconSearch,
  IconSend,
  IconDots,
  IconEye,
  IconReceipt,
  IconFileText,
  IconCircleCheck,
  IconChevronLeft,
  IconChevronRight,
  IconRefresh,
  IconUpload,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useAuth } from '@/context/authContext';
import apiClient from '@config/api/apiClient';
import { CaseInformationSection } from '../other/CaseInformationSection';
import AssignedCasesSkeleton from '@/components/skeleton/AssignedCasesSkeleton';
import { getSocket } from '@config/socket';
import {
  PRIMARY_GOLD,
  PRIMARY_BROWN,
  MUTED_OLIVE,
  THEMED_LIGHT_BG,
  CHARCOAL,
  ACCENT_TAN,
  BG,
} from '@utils/constants';

const ITEMS_PER_PAGE = 10;
const EVIDENCE_ATTACHMENT_ACCEPT = [
  '.pdf', '.doc', '.docx',
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tif', '.tiff',
  '.mp4', '.mov', '.avi', '.mkv', '.webm', '.mpeg', '.mpg',
].join(',');

const ROLE_LABELS = {
  director: 'Director',
  secretary: 'Secretary',
  supervising_lawyer: 'Supervising Lawyer',
  intern: 'Legal Intern',
  attorney: 'Attorney',
};

const APPOINTMENT_STATUS_OPTIONS = [
  { value: 'auto-scheduled', label: 'Auto-scheduled' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'legal-advice', label: 'Legal Advice' },
  { value: 'court-case', label: 'Court Case' },
  { value: 'rejected', label: 'Rejected' },
];

const CASE_TYPE_LABELS = {
  'court-representation': 'Court Representation',
  'legal-advice': 'Legal Advice',
  'legal-document': 'Drafting of Legal Documents',
};

const CASE_TYPE_SHORT = {
  'court-representation': { letter: 'C', color: 'blue', label: 'Court Representation' },
  'legal-advice':         { letter: 'A', color: 'green', label: 'Legal Advice' },
  'legal-document':       { letter: 'D', color: 'orange', label: 'Drafting of Legal Documents' },
};

const getCaseDisplayTitle = (a) => {
  if (isCourtCase(a)) return a.caseTitle || 'Untitled';
  if (a.caseType === 'legal-advice') return 'Legal Advice';
  if (a.caseType === 'legal-document') return 'Drafting';
  return a.caseTitle || 'Untitled';
};
const isCourtCase = (a) => a.caseType !== 'legal-advice' && a.caseType !== 'legal-document';

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
  courtPhoneNumber: details?.courtPhoneNumber || '',
  presidingOfficer: details?.presidingOfficer || '',
  adverseParty: details?.adverseParty || '',
  adversePartyAddress: details?.adversePartyAddress || '',
  adversePartyPhone: details?.adversePartyPhone || '',
  adversePartyCounsel: details?.adversePartyCounsel || '',
  adversePartyCounselAddress: details?.adversePartyCounselAddress || '',
  adversePartyCounselPhone: details?.adversePartyCounselPhone || '',
  caseDescription: details?.caseDescription || '',
  caseNature: details?.caseNature || details?.natureOfCase || '',
  appointmentType: details?.caseDetails?.appointmentType || details?.appointmentType || details?.personal?.legalMatter || '',
});

// ── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status, deadline }) {
  const isOverdue = status === 'pending' && new Date(deadline) < new Date();
  if (status === 'done') {
    return (
      <Tooltip label="Done">
        <IconCheck size={18} color="green" />
      </Tooltip>
    );
  }
  if (isOverdue) {
    return (
      <Tooltip label="Overdue">
        <IconClock size={18} color="red" />
      </Tooltip>
    );
  }
  return (
    <Tooltip label="Pending">
      <IconClock size={18} color="orange" />
    </Tooltip>
  );
}

// ── Mobile Assignment Card ────────────────────────────────────────────────────
function AssignmentCard({ a, showAssignedTo, showAssignedBy, onMarkDone, loading, canComplete, onViewReview, onViewReceipt, onViewCaseHistory }) {
  const isOverdue = a.status !== 'done' && new Date(a.deadline) < new Date();
  return (
    <Box
      px="md"
      py="sm"
      style={{
        borderLeft: `4px solid ${a.status === 'done' ? '#40C057' : isOverdue ? '#FA5252' : PRIMARY_BROWN}`,
        background: 'white',
      }}
    >
      {/* Top: title + menu */}
      <Group justify="space-between" align="flex-start" wrap="nowrap" mb={6}>
        <Box style={{ minWidth: 0 }}>
          <Group gap={6} wrap="nowrap" align="center">
            {CASE_TYPE_SHORT[a.caseType] && (
              <Tooltip label={CASE_TYPE_SHORT[a.caseType].label}>
                <Badge size="sm" circle variant="filled" color={CASE_TYPE_SHORT[a.caseType].color} style={{ flexShrink: 0 }}>
                  {CASE_TYPE_SHORT[a.caseType].letter}
                </Badge>
              </Tooltip>
            )}
            <Text fw={600} size="sm" c={CHARCOAL} style={{ wordBreak: 'break-word' }}>
              {getCaseDisplayTitle(a)}
            </Text>
          </Group>
          <Text size="xs" c={MUTED_OLIVE} truncate mt={2}>{a.clientName || '-'}</Text>
        </Box>
        <Menu shadow="md" width={200} position="bottom-end">
          <Menu.Target>
            <ActionIcon variant="light" size="md" radius="md" color="gray" style={{ border: '1px solid #E5E7EB', flexShrink: 0 }}>
              <IconDots size={15} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Label>Actions</Menu.Label>
            <Menu.Item leftSection={<IconEye size={16} />} onClick={() => onViewReview(a)}>View Review</Menu.Item>
            <Menu.Item leftSection={<IconReceipt size={16} />} onClick={() => onViewReceipt(a)}>Full Receipt</Menu.Item>
            {isCourtCase(a) && (
              <Menu.Item leftSection={<IconFileText size={16} />} onClick={() => onViewCaseHistory(a)}>Case History</Menu.Item>
            )}
          </Menu.Dropdown>
        </Menu>
      </Group>

      {/* Assigned person */}
      {showAssignedTo && a.assignedTo && (
        <Group gap={6} mb={6} wrap="nowrap">
          <Avatar size={20} radius="xl" style={{ backgroundColor: ACCENT_TAN, flexShrink: 0 }}>
            <Text size="10px" c="white" fw={700}>{a.assignedTo?.name?.charAt(0) || '?'}</Text>
          </Avatar>
          <Text size="xs" c={MUTED_OLIVE} truncate>To: {a.assignedTo?.name}</Text>
        </Group>
      )}
      {showAssignedBy && a.assignedBy && (
        <Group gap={6} mb={6} wrap="nowrap">
          <Avatar size={20} radius="xl" style={{ backgroundColor: PRIMARY_BROWN, flexShrink: 0 }}>
            <Text size="10px" c="white" fw={700}>{a.assignedBy?.name?.charAt(0) || '?'}</Text>
          </Avatar>
          <Text size="xs" c={MUTED_OLIVE} truncate>By: {a.assignedBy?.name}</Text>
        </Group>
      )}

      {/* Message preview */}
      {a.message && (
        <Text size="xs" c={MUTED_OLIVE} mb={6} style={{ wordBreak: 'break-word' }} lineClamp={2}>
          {a.message}
        </Text>
      )}

      {/* Bottom: deadline + status + done button */}
      <Group justify="space-between" align="center" wrap="wrap" gap="xs">
        <Group gap={6}>
          <Text size="xs" fw={500} c={isOverdue ? 'red' : MUTED_OLIVE}>
            Due: {new Date(a.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </Text>
          <StatusBadge status={a.status} deadline={a.deadline} />
        </Group>
        {canComplete && a.status === 'pending' && (
          <Button
            size="xs"
            color="green"
            variant="light"
            leftSection={<IconCheck size={12} />}
            loading={loading === a._id}
            onClick={() => onMarkDone(a._id)}
          >
            Done
          </Button>
        )}
      </Group>
    </Box>
  );
}

// ── Desktop Assignment Table ──────────────────────────────────────────────────
function AssignmentTable({ data, showAssignedTo, showAssignedBy, onMarkDone, loading, canComplete, onViewReview, onViewReceipt, onViewCaseHistory }) {
  if (!data || data.length === 0) {
    return (
      <Center py="xl">
        <Stack align="center" gap="sm">
          <IconClipboardCheck size={48} color={MUTED_OLIVE} stroke={1.5} />
          <Text c="dimmed" size="sm">No assignments found</Text>
        </Stack>
      </Center>
    );
  }

  return (
    <>
      {/* DESKTOP TABLE */}
      <Box visibleFrom="sm">
        <Table.ScrollContainer minWidth={700}>
          <Table striped highlightOnHover withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr style={{ backgroundColor: PRIMARY_BROWN }}>
                <Table.Th style={{ color: 'white', fontSize: 13, minWidth: 180 }}>Case Title</Table.Th>
                <Table.Th style={{ color: 'white', fontSize: 13 }}>Client</Table.Th>
                {showAssignedTo && <Table.Th style={{ color: 'white', fontSize: 13 }}>Assigned To</Table.Th>}
                {showAssignedBy && <Table.Th style={{ color: 'white', fontSize: 13 }}>Assigned By</Table.Th>}
                <Table.Th style={{ color: 'white', fontSize: 13 }}>Deadline</Table.Th>
                <Table.Th style={{ color: 'white', fontSize: 13, maxWidth: 180 }}>Message</Table.Th>
                <Table.Th style={{ color: 'white', fontSize: 13 }}>Status</Table.Th>
                <Table.Th style={{ color: 'white', fontSize: 13 }}>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data.map((a) => (
                <Table.Tr key={a._id}>
                  <Table.Td>
                    <Group gap={8} wrap="nowrap" align="center">
                      {CASE_TYPE_SHORT[a.caseType] && (
                        <Tooltip label={CASE_TYPE_SHORT[a.caseType].label}>
                          <Badge size="sm" circle variant="filled" color={CASE_TYPE_SHORT[a.caseType].color} style={{ flexShrink: 0 }}>
                            {CASE_TYPE_SHORT[a.caseType].letter}
                          </Badge>
                        </Tooltip>
                      )}
                      <Text size="sm" fw={500} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{getCaseDisplayTitle(a)}</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{a.clientName || '-'}</Text>
                  </Table.Td>
                  {showAssignedTo && (
                    <Table.Td>
                      <Group gap={6} wrap="nowrap">
                        <Avatar size={24} radius="xl" style={{ backgroundColor: ACCENT_TAN, flexShrink: 0 }}>
                          <Text size="10px" c="white" fw={700}>{a.assignedTo?.name?.charAt(0) || '?'}</Text>
                        </Avatar>
                        <Box>
                          <Text size="sm" fw={500} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{a.assignedTo?.name || '-'}</Text>
                          <Text size="xs" c="dimmed">{ROLE_LABELS[a.assignedTo?.role] || a.assignedTo?.role || ''}</Text>
                        </Box>
                      </Group>
                    </Table.Td>
                  )}
                  {showAssignedBy && (
                    <Table.Td>
                      <Group gap={6} wrap="nowrap">
                        <Avatar size={24} radius="xl" style={{ backgroundColor: PRIMARY_BROWN, flexShrink: 0 }}>
                          <Text size="10px" c="white" fw={700}>{a.assignedBy?.name?.charAt(0) || '?'}</Text>
                        </Avatar>
                        <Box>
                          <Text size="sm" fw={500} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{a.assignedBy?.name || '-'}</Text>
                          <Text size="xs" c="dimmed">{ROLE_LABELS[a.assignedBy?.role] || a.assignedBy?.role || ''}</Text>
                        </Box>
                      </Group>
                    </Table.Td>
                  )}
                  <Table.Td>
                    <Text size="sm" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }} c={new Date(a.deadline) < new Date() && a.status !== 'done' ? 'red' : undefined}>
                      {new Date(a.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ maxWidth: 180 }}>
                    <Text size="sm" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{a.message || '-'}</Text>
                  </Table.Td>
                  <Table.Td>
                    <StatusBadge status={a.status} deadline={a.deadline} />
                  </Table.Td>
                  <Table.Td>
                    <Group gap={6} wrap="nowrap">
                      {canComplete && a.status === 'pending' && (
                        <Tooltip label="Mark as Done">
                          <Button size="xs" color="green" variant="light" leftSection={<IconCheck size={14} />} loading={loading === a._id} onClick={() => onMarkDone(a._id)}>
                            Done
                          </Button>
                        </Tooltip>
                      )}
                      <Menu shadow="md" width={200} position="bottom-end">
                        <Menu.Target>
                          <ActionIcon variant="light" size="md" radius="md" color="gray" style={{ border: '1px solid #E5E7EB' }}>
                            <IconDots size={15} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Label>Actions</Menu.Label>
                          <Menu.Item leftSection={<IconEye size={16} />} onClick={() => onViewReview(a)}>View Review</Menu.Item>
                          <Menu.Item leftSection={<IconReceipt size={16} />} onClick={() => onViewReceipt(a)}>Full Receipt</Menu.Item>
                          {isCourtCase(a) && (
                            <Menu.Item leftSection={<IconFileText size={16} />} onClick={() => onViewCaseHistory(a)}>Case History</Menu.Item>
                          )}
                        </Menu.Dropdown>
                      </Menu>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Box>

      {/* MOBILE CARDS */}
      <Stack gap={0} hiddenFrom="sm">
        {data.map((a, idx) => (
          <Box key={a._id}>
            <AssignmentCard
              a={a}
              showAssignedTo={showAssignedTo}
              showAssignedBy={showAssignedBy}
              onMarkDone={onMarkDone}
              loading={loading}
              canComplete={canComplete}
              onViewReview={onViewReview}
              onViewReceipt={onViewReceipt}
              onViewCaseHistory={onViewCaseHistory}
            />
            {idx < data.length - 1 && <Divider color="#F3F4F6" />}
          </Box>
        ))}
      </Stack>
    </>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AssignedCases() {
  const { userData } = useAuth();
  const [activeTab, setActiveTab] = useState('my-assignments');
  const [myAssignments, setMyAssignments] = useState([]);
  const [assignedByMe, setAssignedByMe] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [myPage, setMyPage] = useState(1);
  const [myCompletedPage, setMyCompletedPage] = useState(1);
  const [assignedPage, setAssignedPage] = useState(1);
  const [assignedCompletedPage, setAssignedCompletedPage] = useState(1);

  // ── Review Modal State ──
  const [reviewModalOpened, setReviewModalOpened] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewData, setReviewData] = useState(null);
  const [editedReviewData, setEditedReviewData] = useState(null);
  const [reviewEditMode, setReviewEditMode] = useState(false);
  const [reviewActiveStep, setReviewActiveStep] = useState(0);
  const [reviewSaving, setReviewSaving] = useState(false);
  const [uploadingEvidenceKey, setUploadingEvidenceKey] = useState(null);

  // ── Receipt Modal State ──
  const [receiptModalOpened, setReceiptModalOpened] = useState(false);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [receiptDetails, setReceiptDetails] = useState(null);
  const [receiptEditMode, setReceiptEditMode] = useState(false);
  const [receiptForm, setReceiptForm] = useState({});
  const [receiptSaving, setReceiptSaving] = useState(false);

  // ── Case History Modal State ──
  const [caseHistoryModalOpened, setCaseHistoryModalOpened] = useState(false);
  const [caseHistoryLoading, setCaseHistoryLoading] = useState(false);
  const [caseHistoryData, setCaseHistoryData] = useState({});
  const [caseHistoryFinalizeId, setCaseHistoryFinalizeId] = useState(null);
  const [caseHistoryEditMode, setCaseHistoryEditMode] = useState(false);
  const [caseHistorySaving, setCaseHistorySaving] = useState(false);

  const isAssigner = ['director', 'secretary', 'supervising_lawyer'].includes(userData?.role);

  // ── Fetch data ──
  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [myRes, ...assignedRes] = await Promise.all([
        apiClient.get('/case-assignments/mine'),
        ...(isAssigner ? [apiClient.get('/case-assignments/assigned-by-me')] : []),
      ]);
      setMyAssignments(myRes.data?.data || []);
      if (isAssigner && assignedRes[0]) {
        setAssignedByMe(assignedRes[0].data?.data || []);
      }
    } catch (err) {
      console.error('Error fetching assigned cases:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [isAssigner]);

  // Initial fetch
  useEffect(() => {
    if (userData) fetchAll();
  }, [userData, fetchAll]);

  // ── Auto-refresh: socket listener + polling ──
  const silentRefresh = useCallback(() => fetchAll(true), [fetchAll]);

  useEffect(() => {
    if (!userData) return;
    const socket = getSocket();
    socket.on('assignment-updated', silentRefresh);

    // Poll every 30s as fallback in case socket misses an event
    const interval = setInterval(silentRefresh, 30_000);

    return () => {
      socket.off('assignment-updated', silentRefresh);
      clearInterval(interval);
    };
  }, [userData, silentRefresh]);

  // ── Mark done ──
  const handleMarkDone = async (id) => {
    setActionLoading(id);
    try {
      await apiClient.put(`/case-assignments/${id}/complete`);
      setMyAssignments(prev => prev.map(a => a._id === id ? { ...a, status: 'done', completedAt: new Date().toISOString() } : a));
      notifications.show({ title: 'Success', message: 'Assignment marked as done', color: 'green' });
    } catch (err) {
      notifications.show({ title: 'Error', message: 'Failed to mark as done', color: 'red' });
    } finally { setActionLoading(null); }
  };

  // ── View Review ──
  const handleViewReview = async (assignment) => {
    setReviewModalOpened(true);
    setReviewLoading(true);
    setReviewData(null);
    setEditedReviewData(null);
    setReviewEditMode(false);
    setReviewActiveStep(0);
    setUploadingEvidenceKey(null);
    try {
      const res = await apiClient.get(`/finalize/detail/${assignment.finalizeId}`);
      const data = res.data;
      setReviewData(data);
      setEditedReviewData(JSON.parse(JSON.stringify(data)));
    } catch (err) {
      notifications.show({ title: 'Error', message: 'Could not load review data', color: 'red' });
      setReviewModalOpened(false);
    } finally { setReviewLoading(false); }
  };

  const updateEditedReview = (path, value) => {
    const newData = JSON.parse(JSON.stringify(editedReviewData));
    const keys = path.split('.');
    let current = newData;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    setEditedReviewData(newData);
  };

  const updateEvidence = (type, index, field, value) => {
    const newData = JSON.parse(JSON.stringify(editedReviewData));
    if (!newData.content) newData.content = {};
    if (!newData.content.interviewInfo) newData.content.interviewInfo = {};
    if (!newData.content.interviewInfo[type]) newData.content.interviewInfo[type] = [];
    const evidence = [...newData.content.interviewInfo[type]];
    if (!evidence[index]) evidence[index] = {};
    evidence[index] = { ...evidence[index], [field]: value };
    newData.content.interviewInfo[type] = evidence;
    setEditedReviewData(newData);
  };

  const setEvidenceAttachment = (evidenceType, rowIndex, attachment) => {
    const newData = JSON.parse(JSON.stringify(editedReviewData || {}));
    if (!newData.content) newData.content = {};
    if (!newData.content.interviewInfo) newData.content.interviewInfo = {};
    if (!Array.isArray(newData.content.interviewInfo[evidenceType])) {
      newData.content.interviewInfo[evidenceType] = [];
    }

    const rows = [...newData.content.interviewInfo[evidenceType]];
    while (rows.length <= rowIndex) {
      rows.push({ type: '', author: '', purpose: '', issues: '', attachment: null });
    }
    rows[rowIndex] = { ...(rows[rowIndex] || {}), attachment };
    newData.content.interviewInfo[evidenceType] = rows;
    setEditedReviewData(newData);
  };

  const handleUploadEvidenceAttachment = async (evidenceType, rowIndex, file) => {
    if (!file || !reviewEditMode) return;

    setUploadingEvidenceKey({ type: evidenceType, index: rowIndex });
    try {
      const existingAttachment = editedReviewData?.content?.interviewInfo?.[evidenceType]?.[rowIndex]?.attachment;
      if (existingAttachment?.isServerFile && existingAttachment?.filename) {
        try {
          await apiClient.delete(`/upload/document/${encodeURIComponent(existingAttachment.filename)}`, {
            params: {
              cloudinaryPublicId: existingAttachment.cloudinaryPublicId,
              cloudinaryResourceType: existingAttachment.cloudinaryResourceType,
            },
          });
        } catch (deleteErr) {
          console.warn('Could not delete previous evidence attachment before replacement:', deleteErr);
        }
      }

      const formData = new FormData();
      formData.append('document', file);
      const response = await apiClient.post('/upload/document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const serverFile = response?.data?.file;
      if (!serverFile) throw new Error('Upload did not return file metadata');

      const uploadedBy = userData?.firstName && userData?.lastName
        ? `${userData.firstName} ${userData.lastName}`
        : userData?.username || 'Unknown';

      const attachment = {
        fileName: serverFile.originalName || file.name,
        fileSize: serverFile.size || file.size,
        fileType: serverFile.mimetype || file.type,
        fileUrl: serverFile.url,
        filename: serverFile.filename,
        cloudinaryUrl: serverFile.cloudinaryUrl || null,
        cloudinaryPublicId: serverFile.cloudinaryPublicId || null,
        cloudinaryResourceType: serverFile.cloudinaryResourceType || null,
        isServerFile: true,
        uploadedBy,
        uploadedByRole: userData?.role || 'Unknown',
        uploadedAt: new Date().toISOString(),
      };

      setEvidenceAttachment(evidenceType, rowIndex, attachment);
    } catch (error) {
      console.error('Error uploading evidence attachment:', error);
      notifications.show({ title: 'Error', message: 'Failed to upload evidence attachment.', color: 'red' });
    } finally {
      setUploadingEvidenceKey(null);
    }
  };

  const handleRemoveEvidenceAttachment = async (evidenceType, rowIndex) => {
    if (!reviewEditMode) return;

    const attachment = editedReviewData?.content?.interviewInfo?.[evidenceType]?.[rowIndex]?.attachment;
    if (attachment?.isServerFile && attachment?.filename) {
      try {
        await apiClient.delete(`/upload/document/${encodeURIComponent(attachment.filename)}`, {
          params: {
            cloudinaryPublicId: attachment.cloudinaryPublicId,
            cloudinaryResourceType: attachment.cloudinaryResourceType,
          },
        });
      } catch (error) {
        console.error('Error deleting evidence attachment from server:', error);
      }
    }

    setEvidenceAttachment(evidenceType, rowIndex, null);
  };

  const getEvidenceAttachmentUrl = (attachment) => {
    if (!attachment) return null;
    const raw = attachment.cloudinaryUrl || attachment.fileUrl;
    if (!raw) return null;
    if (/^https?:\/\//i.test(raw)) return raw;
    const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
    if (!apiBase) return raw;
    return raw.startsWith('/') ? `${apiBase}${raw}` : `${apiBase}/${raw}`;
  };

  const handleViewEvidenceAttachment = (attachment) => {
    const url = getEvidenceAttachmentUrl(attachment);
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSaveReview = async () => {
    try {
      setReviewSaving(true);
      const resp = await apiClient.put(`/finalize/${editedReviewData._id || editedReviewData.id}`, editedReviewData);
      if (resp.data) {
        setReviewData(resp.data);
        setEditedReviewData(JSON.parse(JSON.stringify(resp.data)));
        setReviewEditMode(false);
        notifications.show({ title: 'Success', message: 'Review saved successfully', color: 'green' });
      }
    } catch (err) {
      notifications.show({ title: 'Error', message: 'Failed to save review: ' + (err.response?.data?.error || err.message), color: 'red' });
    } finally { setReviewSaving(false); }
  };

  const renderEvidenceTable = (title, evidence = [], fieldName) => {
    if (!reviewEditMode && (!evidence || evidence.length === 0)) return null;
    const showPurpose = fieldName !== 'adversePartyEvidence';
    const rows = evidence && evidence.length >= 3
      ? evidence
      : [...(evidence || []), ...Array(3 - (evidence?.length || 0)).fill({ type: '', author: '', purpose: '', issues: '' })];
    const columns = [
      { label: 'Type / Description', field: 'type', placeholder: 'Type/Desc' },
      { label: 'Author / Custodian', field: 'author', placeholder: 'Author/Custodian' },
      ...(showPurpose ? [{ label: 'Purpose', field: 'purpose', placeholder: 'Purpose' }] : []),
      { label: 'Admissibility Issues', field: 'issues', placeholder: 'Issues' },
    ];
    return (
      <Box mb="lg">
        <Title order={5} c={PRIMARY_BROWN} mb="sm">{title}</Title>
        {/* Mobile: stacked cards for evidence */}
        <Stack gap="xs" hiddenFrom="sm">
          {rows.map((row, idx) => (
            <Paper key={idx} p="sm" withBorder radius="md">
              <SimpleGrid cols={1} spacing="xs">
                {columns.map(({ label, field, placeholder }) => (
                  <Box key={field}>
                    <Text size="xs" c={MUTED_OLIVE} fw={600} mb={2}>{label}</Text>
                    {reviewEditMode ? (
                      <TextInput placeholder={placeholder} size="xs" value={row?.[field] || ''} onChange={(e) => updateEvidence(fieldName, idx, field, e.target.value)} />
                    ) : (
                      <Text size="sm">{row?.[field] || '-'}</Text>
                    )}
                  </Box>
                ))}
                <Box>
                  <Text size="xs" c={MUTED_OLIVE} fw={600} mb={2}>Attachment</Text>
                  <Stack gap={4}>
                    {reviewEditMode && (
                      <FileButton
                        onChange={(file) => {
                          if (file) handleUploadEvidenceAttachment(fieldName, idx, file);
                        }}
                        accept={EVIDENCE_ATTACHMENT_ACCEPT}
                      >
                        {(props) => (
                          <Button
                            {...props}
                            size="xs"
                            variant="outline"
                            leftSection={<IconUpload size={14} />}
                            loading={uploadingEvidenceKey?.type === fieldName && uploadingEvidenceKey?.index === idx}
                          >
                            {row?.attachment?.fileUrl || row?.attachment?.cloudinaryUrl ? 'Replace' : 'Upload'}
                          </Button>
                        )}
                      </FileButton>
                    )}
                    {(row?.attachment?.fileUrl || row?.attachment?.cloudinaryUrl) ? (
                      <Group gap={4}>
                        <Button size="xs" variant="light" color="blue" leftSection={<IconEye size={12} />} onClick={() => handleViewEvidenceAttachment(row.attachment)}>
                          View
                        </Button>
                        {reviewEditMode && (
                          <Button size="xs" variant="subtle" color="red" leftSection={<IconX size={12} />} onClick={() => handleRemoveEvidenceAttachment(fieldName, idx)}>
                            Remove
                          </Button>
                        )}
                      </Group>
                    ) : (
                      <Text size="xs" c="dimmed">No attachment</Text>
                    )}
                  </Stack>
                </Box>
              </SimpleGrid>
            </Paper>
          ))}
        </Stack>
        {/* Desktop: table */}
        <Box visibleFrom="sm">
          <Table withTableBorder withColumnBorders striped>
            <Table.Thead>
              <Table.Tr>
                {columns.map(({ label }) => (
                  <Table.Th key={label}>{label}</Table.Th>
                ))}
                <Table.Th>Attachment</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows.map((row, idx) => (
                <Table.Tr key={idx}>
                  {columns.map(({ field, placeholder }) => (
                    <Table.Td key={field}>
                      {reviewEditMode ? (
                        <TextInput placeholder={placeholder} size="xs" variant="unstyled" value={row?.[field] || ''} onChange={(e) => updateEvidence(fieldName, idx, field, e.target.value)} />
                      ) : (row?.[field] || '-')}
                    </Table.Td>
                  ))}
                  <Table.Td>
                    <Stack gap={4}>
                      {reviewEditMode && (
                        <FileButton
                          onChange={(file) => {
                            if (file) handleUploadEvidenceAttachment(fieldName, idx, file);
                          }}
                          accept={EVIDENCE_ATTACHMENT_ACCEPT}
                        >
                          {(props) => (
                            <Button
                              {...props}
                              size="xs"
                              variant="outline"
                              leftSection={<IconUpload size={14} />}
                              loading={uploadingEvidenceKey?.type === fieldName && uploadingEvidenceKey?.index === idx}
                            >
                              {row?.attachment?.fileUrl || row?.attachment?.cloudinaryUrl ? 'Replace' : 'Upload'}
                            </Button>
                          )}
                        </FileButton>
                      )}

                      {(row?.attachment?.fileUrl || row?.attachment?.cloudinaryUrl) ? (
                        <Group gap={4}>
                          <Button size="xs" variant="light" color="blue" leftSection={<IconEye size={12} />} onClick={() => handleViewEvidenceAttachment(row.attachment)}>
                            View
                          </Button>
                          {reviewEditMode && (
                            <Button size="xs" variant="subtle" color="red" leftSection={<IconX size={12} />} onClick={() => handleRemoveEvidenceAttachment(fieldName, idx)}>
                              Remove
                            </Button>
                          )}
                        </Group>
                      ) : (
                        <Text size="xs" c="dimmed">No attachment</Text>
                      )}
                    </Stack>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Box>
        {reviewEditMode && (
          <Button variant="subtle" size="xs" mt="xs" style={{ color: PRIMARY_BROWN }}
            onClick={() => {
              const newData = JSON.parse(JSON.stringify(editedReviewData));
              if (!newData.content) newData.content = {};
              if (!newData.content.interviewInfo) newData.content.interviewInfo = {};
              if (!newData.content.interviewInfo[fieldName]) newData.content.interviewInfo[fieldName] = [];
              newData.content.interviewInfo[fieldName] = [...newData.content.interviewInfo[fieldName], { type: '', author: '', purpose: '', issues: '' }];
              setEditedReviewData(newData);
            }}
          >+ Add another row</Button>
        )}
      </Box>
    );
  };

  // ── View Receipt ──
  const handleViewReceipt = async (assignment) => {
    setReceiptModalOpened(true);
    setReceiptLoading(true);
    setReceiptDetails(null);
    setReceiptEditMode(false);
    setReceiptForm({});
    try {
      const clientInfoId = assignment.caseId;
      if (!clientInfoId) { setReceiptLoading(false); return; }
      const clientRes = await apiClient.get(`/clientsinfo/${clientInfoId}`);
      setReceiptDetails(clientRes.data);
      setReceiptForm(syncAppointmentFormFromDetails(clientRes.data));
    } catch (err) {
      console.error('Error fetching receipt data:', err);
    } finally { setReceiptLoading(false); }
  };

  const handleSaveReceipt = async () => {
    if (!receiptDetails?._id) return;
    const payload = {
      status: receiptForm.status || undefined,
      appointedDate: receiptForm.appointedDate || undefined,
      appointmentTime: receiptForm.appointmentTime || '',
      fullName: receiptForm.fullName || undefined,
      name: receiptForm.fullName || undefined,
      age: receiptForm.age ? Number(receiptForm.age) : undefined,
      birthday: receiptForm.birthday || undefined,
      sex: receiptForm.sex || undefined,
      civilStatus: receiptForm.civilStatus || undefined,
      citizenship: receiptForm.citizenship || undefined,
      contactNumber: receiptForm.contactNumber || undefined,
      email: receiptForm.email || undefined,
      presentAddress: receiptForm.presentAddress || undefined,
      permanentAddress: receiptForm.permanentAddress || undefined,
      spouseName: receiptForm.spouseName || undefined,
      relatorName: receiptForm.relatorName || undefined,
      relatorContactNumber: receiptForm.relatorContactNumber || undefined,
      currentSourceOfIncome: receiptForm.currentSourceOfIncome || undefined,
      monthlyIncome: receiptForm.monthlyIncome ? Number(receiptForm.monthlyIncome) : undefined,
      natureOfWork: receiptForm.natureOfWork || undefined,
      employerName: receiptForm.employerName || undefined,
      employerAddress: receiptForm.employerAddress || undefined,
      partyRepresented: receiptForm.partyRepresented || undefined,
      venue: receiptForm.venue || undefined,
      presentStage: receiptForm.presentStage || undefined,
      courtDivision: receiptForm.courtDivision || undefined,
      courtAddress: receiptForm.courtAddress || undefined,
      presidingOfficer: receiptForm.presidingOfficer || undefined,
      caseDescription: receiptForm.caseDescription || undefined,
      caseNature: receiptForm.caseNature || undefined,
      natureOfCase: receiptForm.caseNature || undefined,
      appointmentType: receiptForm.appointmentType || undefined,
    };
    setReceiptSaving(true);
    try {
      const resp = await apiClient.put(`/clientsinfo/${receiptDetails._id}`, payload);
      const updated = resp?.data || { ...receiptDetails, ...payload };
      setReceiptDetails(updated);
      setReceiptForm(syncAppointmentFormFromDetails(updated));
      setReceiptEditMode(false);
      notifications.show({ title: 'Updated', message: 'Appointment details saved.', color: 'green' });
    } catch (err) {
      notifications.show({ title: 'Error', message: 'Failed to save appointment details.', color: 'red' });
    } finally { setReceiptSaving(false); }
  };

  // ── View Case History ──
  const handleViewCaseHistory = async (assignment) => {
    setCaseHistoryModalOpened(true);
    setCaseHistoryLoading(true);
    setCaseHistoryData({});
    setCaseHistoryFinalizeId(assignment.finalizeId);
    setCaseHistoryEditMode(false);
    try {
      const resp = await apiClient.get(`/caserecords/finalize/${assignment.finalizeId}`);
      if (resp.data) setCaseHistoryData(resp.data);
    } catch {
      try {
        const fRes = await apiClient.get(`/finalize/detail/${assignment.finalizeId}`);
        setCaseHistoryData(fRes.data?.content?.caseInfo || {});
      } catch {
        setCaseHistoryData({});
      }
    } finally { setCaseHistoryLoading(false); }
  };

  const handleSaveCaseHistory = async () => {
    try {
      setCaseHistorySaving(true);
      const resp = await apiClient.put(`/caserecords/finalize/${caseHistoryFinalizeId}`, caseHistoryData);
      if (resp.data) {
        // Server returns { success, data: caseRecord, message } — extract the actual record
        setCaseHistoryData(resp.data.data || resp.data);
        setCaseHistoryEditMode(false);
        notifications.show({ title: 'Success', message: 'Case record saved successfully!', color: 'green' });
      }
    } catch (err) {
      notifications.show({ title: 'Error', message: 'Failed to save case record: ' + (err.response?.data?.error || err.message), color: 'red' });
    } finally { setCaseHistorySaving(false); }
  };

  // ── Filter helper ──
  const filterBySearch = (items) => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(a =>
      (a.caseTitle || '').toLowerCase().includes(q) ||
      (a.caseId || '').toLowerCase().includes(q) ||
      (a.clientName || '').toLowerCase().includes(q) ||
      (a.assignedTo?.name || '').toLowerCase().includes(q) ||
      (a.message || '').toLowerCase().includes(q)
    );
  };

  const filteredMy = useMemo(() => filterBySearch(myAssignments).filter(a => a.status !== 'done'), [myAssignments, searchQuery]);
  const filteredMyCompleted = useMemo(() => filterBySearch(myAssignments).filter(a => a.status === 'done'), [myAssignments, searchQuery]);
  const filteredAssigned = useMemo(() => filterBySearch(assignedByMe).filter(a => a.status !== 'done'), [assignedByMe, searchQuery]);
  const filteredAssignedCompleted = useMemo(() => filterBySearch(assignedByMe).filter(a => a.status === 'done'), [assignedByMe, searchQuery]);

  const paginatedMy = filteredMy.slice((myPage - 1) * ITEMS_PER_PAGE, myPage * ITEMS_PER_PAGE);
  const paginatedMyCompleted = filteredMyCompleted.slice((myCompletedPage - 1) * ITEMS_PER_PAGE, myCompletedPage * ITEMS_PER_PAGE);
  const paginatedAssigned = filteredAssigned.slice((assignedPage - 1) * ITEMS_PER_PAGE, assignedPage * ITEMS_PER_PAGE);
  const paginatedAssignedCompleted = filteredAssignedCompleted.slice((assignedCompletedPage - 1) * ITEMS_PER_PAGE, assignedCompletedPage * ITEMS_PER_PAGE);

  const appointmentStatusLabel = receiptDetails?.status
    ? receiptDetails.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : 'N/A';

  if (loading) return <AssignedCasesSkeleton rows={5} isAssigner={isAssigner} />;

  // ── Tab definitions ──
  const tabDefs = [
    { value: 'my-assignments',      icon: <IconClipboardCheck size={15} />, fullLabel: 'Your Assigned Cases', shortLabel: 'Assigned',   count: filteredMy.length,               color: PRIMARY_BROWN },
    { value: 'my-completed',        icon: <IconCheckbox size={15} />,       fullLabel: 'Completed',           shortLabel: 'Completed',  count: filteredMyCompleted.length,      color: 'green' },
    ...(isAssigner ? [
      { value: 'assigned-by-me',    icon: <IconSend size={15} />,           fullLabel: 'Cases You Assigned',  shortLabel: 'By Me',      count: filteredAssigned.length,         color: 'blue' },
      { value: 'assigned-completed',icon: <IconCheckbox size={15} />,       fullLabel: 'Assigned Completed',  shortLabel: 'Done',       count: filteredAssignedCompleted.length, color: 'teal' },
    ] : []),
  ];

  return (
    <Box bg={BG} mih="100vh" py="xl">
      <Container size="xl" px={{ base: 'md', sm: 'xl' }}>

        {/* ── A. Page Header — matches Dashboard/UserManagement pattern ── */}
        <Group justify="space-between" align="center" mb="lg">
          <Box>
            <Title order={3} fw={700} c={CHARCOAL}>Assigned Cases</Title>
            <Text size="sm" fw={500} c={MUTED_OLIVE}>View and manage your case assignments</Text>
          </Box>
          <ActionIcon variant="subtle" color="gray" radius="md" onClick={fetchAll} loading={loading}>
            <IconRefresh size={18} />
          </ActionIcon>
        </Group>

        {/* ── B. Search ── */}
        <Paper shadow="xs" p="md" mb="md" radius="lg" withBorder style={{ background: 'white' }}>
          <TextInput
            placeholder="Search by case title, ID, client name..."
            leftSection={<IconSearch size={16} />}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setMyPage(1); setMyCompletedPage(1); setAssignedPage(1); setAssignedCompletedPage(1);
            }}
            styles={{ input: { borderColor: '#E0E0E0' } }}
          />
        </Paper>

        {/* ── C. Tabs + Table ── */}
        <Paper shadow="xs" radius="lg" withBorder style={{ overflow: 'hidden', background: 'white' }}>
          {/* Tab header area */}
          <Box px={{ base: 'sm', sm: 'md' }} pt="md" style={{ borderBottom: '1px solid #F0F0F0', background: '#FAFAFA' }}>
            <ScrollArea type="scroll" scrollbarSize={0}>
              <Tabs
                value={activeTab}
                onChange={setActiveTab}
                variant="pills"
              >
                <Tabs.List style={{ flexWrap: 'nowrap' }} pb="sm">
                  {tabDefs.map((t) => (
                    <Tabs.Tab
                      key={t.value}
                      value={t.value}
                      leftSection={t.icon}
                      style={{ whiteSpace: 'nowrap' }}
                      rightSection={
                        t.count > 0
                          ? <Badge size="xs" circle color={t.color} variant="filled" fw={600}>{t.count}</Badge>
                          : null
                      }
                    >
                      {/* Short label on mobile, full label on sm+ */}
                      <Text component="span" hiddenFrom="sm">{t.shortLabel}</Text>
                      <Text component="span" visibleFrom="sm">{t.fullLabel}</Text>
                    </Tabs.Tab>
                  ))}
                </Tabs.List>
              </Tabs>
            </ScrollArea>
          </Box>

          {/* Tab panels */}
          <Tabs value={activeTab} onChange={setActiveTab}>
            {/* My Assignments */}
            <Tabs.Panel value="my-assignments" p={{ base: 'xs', sm: 'md' }}>
              <AssignmentTable
                data={paginatedMy} showAssignedTo={false} showAssignedBy={true}
                onMarkDone={handleMarkDone} loading={actionLoading} canComplete={true}
                onViewReview={handleViewReview} onViewReceipt={handleViewReceipt} onViewCaseHistory={handleViewCaseHistory}
              />
              {filteredMy.length > ITEMS_PER_PAGE && (
                <Group justify="center" mt="md">
                  <Pagination total={Math.ceil(filteredMy.length / ITEMS_PER_PAGE)} value={myPage} onChange={setMyPage} size="sm" withEdges={false} color={PRIMARY_BROWN} />
                </Group>
              )}
            </Tabs.Panel>

            {/* My Completed */}
            <Tabs.Panel value="my-completed" p={{ base: 'xs', sm: 'md' }}>
              <AssignmentTable
                data={paginatedMyCompleted} showAssignedTo={false} showAssignedBy={true}
                onMarkDone={() => {}} loading={null} canComplete={false}
                onViewReview={handleViewReview} onViewReceipt={handleViewReceipt} onViewCaseHistory={handleViewCaseHistory}
              />
              {filteredMyCompleted.length > ITEMS_PER_PAGE && (
                <Group justify="center" mt="md">
                  <Pagination total={Math.ceil(filteredMyCompleted.length / ITEMS_PER_PAGE)} value={myCompletedPage} onChange={setMyCompletedPage} size="sm" withEdges={false} color={PRIMARY_BROWN} />
                </Group>
              )}
            </Tabs.Panel>

            {/* Assigned by Me */}
            {isAssigner && (
              <Tabs.Panel value="assigned-by-me" p={{ base: 'xs', sm: 'md' }}>
                <AssignmentTable
                  data={paginatedAssigned} showAssignedTo={true} showAssignedBy={false}
                  onMarkDone={() => {}} loading={null} canComplete={false}
                  onViewReview={handleViewReview} onViewReceipt={handleViewReceipt} onViewCaseHistory={handleViewCaseHistory}
                />
                {filteredAssigned.length > ITEMS_PER_PAGE && (
                  <Group justify="center" mt="md">
                    <Pagination total={Math.ceil(filteredAssigned.length / ITEMS_PER_PAGE)} value={assignedPage} onChange={setAssignedPage} size="sm" withEdges={false} color={PRIMARY_BROWN} />
                  </Group>
                )}
              </Tabs.Panel>
            )}

            {/* Assigned Completed */}
            {isAssigner && (
              <Tabs.Panel value="assigned-completed" p={{ base: 'xs', sm: 'md' }}>
                <AssignmentTable
                  data={paginatedAssignedCompleted} showAssignedTo={true} showAssignedBy={false}
                  onMarkDone={() => {}} loading={null} canComplete={false}
                  onViewReview={handleViewReview} onViewReceipt={handleViewReceipt} onViewCaseHistory={handleViewCaseHistory}
                />
                {filteredAssignedCompleted.length > ITEMS_PER_PAGE && (
                  <Group justify="center" mt="md">
                    <Pagination total={Math.ceil(filteredAssignedCompleted.length / ITEMS_PER_PAGE)} value={assignedCompletedPage} onChange={setAssignedCompletedPage} size="sm" withEdges={false} color={PRIMARY_BROWN} />
                  </Group>
                )}
              </Tabs.Panel>
            )}
          </Tabs>
        </Paper>

      </Container>

      {/* ═══════════════════ VIEW REVIEW MODAL ═══════════════════ */}
      <Modal
        opened={reviewModalOpened}
        onClose={() => { setReviewModalOpened(false); setReviewEditMode(false); }}
        title={
          <Group justify="space-between" style={{ width: '100%' }} wrap="wrap" gap="xs">
            <Title order={4} c={PRIMARY_BROWN}>Recommendation for Action</Title>
            <Group gap="xs" wrap="nowrap">
              {!reviewEditMode ? (
                ['director', 'supervising_lawyer', 'secretary'].includes(userData?.role) && (
                  <Button size="xs" variant="outline" color={PRIMARY_BROWN} onClick={() => setReviewEditMode(true)}>Edit</Button>
                )
              ) : (
                <>
                  <Button size="xs" variant="outline" onClick={() => { setEditedReviewData(JSON.parse(JSON.stringify(reviewData))); setReviewEditMode(false); }}>Cancel</Button>
                  <Button size="xs" style={{ backgroundColor: PRIMARY_BROWN }} onClick={handleSaveReview} loading={reviewSaving}>Save</Button>
                </>
              )}
            </Group>
          </Group>
        }
        size="calc(90vw)"
        fullScreen={false}
        styles={{
          title: { fontWeight: 700, width: '100%' },
          body: { maxHeight: '80vh', overflowY: 'auto', padding: '16px' },
          inner: { padding: '8px' },
        }}
      >
        {reviewLoading ? (
          <Center py="xl"><Loader size="lg" color={PRIMARY_BROWN} /></Center>
        ) : editedReviewData ? (
          <Stack gap="lg">
            <ScrollArea type="scroll" scrollbarSize={0}>
              <Stepper
                active={reviewActiveStep}
                color={PRIMARY_BROWN}
                completedIcon={<IconCircleCheck size={18} />}
                size="sm"
                styles={{
                  stepLabel: { fontWeight: 600, fontSize: '13px' },
                  stepDescription: { fontSize: '11px', color: MUTED_OLIVE },
                }}
              >
                <Stepper.Step label="Interview" description="Client & Evidence" />
                <Stepper.Step label="Action" description="Lawyer & Director" />
              </Stepper>
            </ScrollArea>
            <Divider />

            {/* Step 1 */}
            {reviewActiveStep === 0 && (
              <Paper p={{ base: 'sm', sm: 'md' }} withBorder radius="md">
                <Title order={5} c={PRIMARY_BROWN} mb="md">Client Interview Information</Title>
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm" mb="md">
                  {[
                    { label: 'Date of Interview', value: editedReviewData.content?.interviewInfo?.dateOfInterview },
                    { label: 'Date Submitted', value: editedReviewData.content?.interviewInfo?.dateSubmitted },
                    { label: "Client's Name", value: editedReviewData.content?.interviewInfo?.clientName },
                    { label: 'Interviewing Intern/s', value: editedReviewData.content?.interviewInfo?.interviewingInterns },
                  ].map(({ label, value }) => (
                    <Box key={label}>
                      <Text size="xs" c="dimmed">{label}</Text>
                      <Text fw={500} size="sm">{value || '-'}</Text>
                    </Box>
                  ))}
                </SimpleGrid>
                <Divider my="md" />
                <Box mb="md">
                  <Text size="sm" fw={600} c={PRIMARY_BROWN} mb="xs">Fast Facts</Text>
                  {reviewEditMode ? (
                    <Textarea autosize minRows={4} value={editedReviewData.content?.interviewInfo?.fastFacts || ''} onChange={(e) => updateEditedReview('content.interviewInfo.fastFacts', e.target.value)} />
                  ) : (
                    <Text size="sm">{editedReviewData.content?.interviewInfo?.fastFacts || '-'}</Text>
                  )}
                </Box>
                <Divider my="md" />
                {renderEvidenceTable("Evidence for Client(s)", editedReviewData.content?.interviewInfo?.clientEvidence, 'clientEvidence')}
                {renderEvidenceTable("Evidence for Adverse Party(ies)", editedReviewData.content?.interviewInfo?.adversePartyEvidence, 'adversePartyEvidence')}
                <Box mb="md">
                  <Text size="sm" fw={600} c={PRIMARY_BROWN} mb="xs">Intern's Initial Advice</Text>
                  {reviewEditMode ? (
                    <Textarea autosize minRows={3} value={editedReviewData.content?.interviewInfo?.internAdvice || ''} onChange={(e) => updateEditedReview('content.interviewInfo.internAdvice', e.target.value)} />
                  ) : (
                    <Text size="sm">{editedReviewData.content?.interviewInfo?.internAdvice || '-'}</Text>
                  )}
                </Box>
                <Box>
                  <Text size="sm" fw={600} c={PRIMARY_BROWN} mb="xs">Legal Opinion</Text>
                  {reviewEditMode ? (
                    <Textarea autosize minRows={5} value={editedReviewData.content?.interviewInfo?.legalOpinion || ''} onChange={(e) => updateEditedReview('content.interviewInfo.legalOpinion', e.target.value)} />
                  ) : (
                    <Text size="sm">{editedReviewData.content?.interviewInfo?.legalOpinion || '-'}</Text>
                  )}
                </Box>
              </Paper>
            )}

            {/* Step 2 */}
            {reviewActiveStep === 1 && (
              <Paper p={{ base: 'sm', sm: 'md' }} withBorder radius="md">
                <Title order={5} c={PRIMARY_BROWN} mb="md">Supervising Lawyer & Director Action</Title>
                <Box mb="md">
                  <Text size="sm" fw={600} c={PRIMARY_BROWN} mb="xs">Supervising Lawyer's Comment</Text>
                  {reviewEditMode ? (
                    <Textarea autosize minRows={4} value={editedReviewData.content?.actionInfo?.supervisingComment || ''} onChange={(e) => updateEditedReview('content.actionInfo.supervisingComment', e.target.value)} />
                  ) : (
                    <Text size="sm">{editedReviewData.content?.actionInfo?.supervisingComment || '-'}</Text>
                  )}
                </Box>
                <Divider my="md" />
                <Box mb="md">
                  <Text size="sm" fw={600} c={PRIMARY_BROWN} mb="xs">Director's Decision</Text>
                  <Badge size="lg" color={editedReviewData.decision === 'accepted' ? 'green' : editedReviewData.decision === 'rejected' ? 'red' : 'yellow'}>
                    {(editedReviewData.decision || 'pending').toUpperCase()}
                  </Badge>
                </Box>
                <Box mb="md">
                  <Text size="sm" fw={600} c={PRIMARY_BROWN} mb="xs">Decision Note</Text>
                  {reviewEditMode ? (
                    <Textarea autosize minRows={4} value={editedReviewData.content?.actionInfo?.decisionNote || ''} onChange={(e) => updateEditedReview('content.actionInfo.decisionNote', e.target.value)} />
                  ) : (
                    <Text size="sm">{editedReviewData.content?.actionInfo?.decisionNote || '-'}</Text>
                  )}
                </Box>
                <Divider my="md" />
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                  {[
                    { label: 'Assigned To', value: editedReviewData.content?.actionInfo?.assignedTo },
                    { label: 'Supervising Lawyer', value: editedReviewData.content?.actionInfo?.supervisingLawyer },
                    { label: "Director's Signature", value: editedReviewData.content?.actionInfo?.directorSignature },
                    { label: 'Signature Date', value: editedReviewData.content?.actionInfo?.signatureDate },
                  ].map(({ label, value }) => (
                    <Box key={label}>
                      <Text size="xs" c="dimmed">{label}</Text>
                      <Text fw={500} size="sm">{value || '-'}</Text>
                    </Box>
                  ))}
                </SimpleGrid>
              </Paper>
            )}

            <Divider />
            <Group justify="space-between">
              {reviewActiveStep > 0 ? (
                <Button variant="outline" leftSection={<IconChevronLeft size={18} />} onClick={() => setReviewActiveStep(0)} size="sm" styles={{ root: { borderColor: '#E0E0E0', color: MUTED_OLIVE } }}>
                  Previous
                </Button>
              ) : <Box />}
              {reviewActiveStep < 1 && (
                <Button rightSection={<IconChevronRight size={18} />} onClick={() => setReviewActiveStep(1)} size="sm" style={{ backgroundColor: PRIMARY_BROWN }}>
                  Next Step
                </Button>
              )}
            </Group>
          </Stack>
        ) : (
          <Center py="xl"><Text c={MUTED_OLIVE}>No review data available</Text></Center>
        )}
      </Modal>

      {/* ═══════════════════ FULL RECEIPT MODAL ═══════════════════ */}
      <Modal
        opened={receiptModalOpened}
        onClose={() => { setReceiptModalOpened(false); setReceiptDetails(null); setReceiptEditMode(false); }}
        title={
          <Group justify="space-between" style={{ width: '100%' }} wrap="wrap" gap="xs">
            <Text fw={700} size="lg" c={PRIMARY_BROWN}>Appointment Receipt</Text>
            <Group gap="xs" wrap="nowrap">
              {receiptEditMode ? (
                <>
                  <Button size="xs" variant="outline" onClick={() => { setReceiptForm(syncAppointmentFormFromDetails(receiptDetails)); setReceiptEditMode(false); }} disabled={receiptSaving}>Cancel</Button>
                  <Button size="xs" style={{ backgroundColor: PRIMARY_BROWN }} onClick={handleSaveReceipt} loading={receiptSaving}>Save</Button>
                </>
              ) : (
                <Button size="xs" variant="outline" color={PRIMARY_BROWN} onClick={() => setReceiptEditMode(true)} disabled={receiptLoading || !receiptDetails}>Edit</Button>
              )}
            </Group>
          </Group>
        }
        size="calc(90vw)"
        radius="lg"
        styles={{
          title: { fontWeight: 700, width: '100%' },
          body: { maxHeight: '80vh', overflowY: 'auto', padding: '16px' },
          inner: { padding: '8px' },
        }}
      >
        {receiptLoading ? (
          <Center py="xl"><Loader size="lg" color={PRIMARY_BROWN} /></Center>
        ) : receiptDetails ? (
          <Stack gap="lg" mt="sm">
            {/* Header Badge */}
            <Paper p="md" radius="md" style={{ backgroundColor: `${PRIMARY_GOLD}15`, border: `1px solid ${PRIMARY_GOLD}` }}>
              <Group justify="space-between" align="center" wrap="wrap" gap="xs">
                <Text fw={700} size="md" c={PRIMARY_BROWN}>
                  {receiptDetails.caseDetails?.appointmentType || receiptDetails.personal?.legalMatter || 'Appointment'}
                </Text>
                <Badge size="lg" variant="filled" style={{ backgroundColor: PRIMARY_GOLD, color: CHARCOAL }}>{appointmentStatusLabel}</Badge>
              </Group>
              <Text size="sm" c={MUTED_OLIVE} mt="xs">Case #{receiptDetails.caseNumber || 'N/A'}</Text>
            </Paper>

            {/* Personal Details */}
            <Paper shadow="xs" p={{ base: 'sm', sm: 'lg' }} radius="lg" withBorder>
              <Title order={5} mb="md" c={CHARCOAL}>Personal Details</Title>
              <Divider mb="md" color="#F0F0F0" />
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                {[
                  { label: 'Name', key: 'fullName', display: receiptDetails.fullName || receiptDetails.name || 'N/A' },
                  { label: 'Age', key: 'age', type: 'number' },
                  { label: 'Birthday', key: 'birthday', type: 'date' },
                  { label: 'Sex', key: 'sex' },
                  { label: 'Civil Status', key: 'civilStatus' },
                  { label: 'Citizenship', key: 'citizenship' },
                  { label: 'Contact Number', key: 'contactNumber' },
                  { label: 'Email', key: 'email' },
                  { label: 'Spouse Name', key: 'spouseName' },
                  { label: 'Relator Name', key: 'relatorName' },
                  { label: 'Relator Contact', key: 'relatorContactNumber' },
                ].map(({ label, key, type, display }) => (
                  <Box key={key}>
                    <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>{label}</Text>
                    {receiptEditMode ? (
                      <TextInput size="sm" type={type || 'text'} value={receiptForm[key] || ''} onChange={(e) => setReceiptForm({ ...receiptForm, [key]: e.target.value })} />
                    ) : (
                      <Text size="sm" c={CHARCOAL} fw={500}>{display || receiptDetails[key] || 'N/A'}</Text>
                    )}
                  </Box>
                ))}
                {/* Full-width address fields */}
                {[
                  { label: 'Present Address', key: 'presentAddress' },
                  { label: 'Permanent Address', key: 'permanentAddress' },
                ].map(({ label, key }) => (
                  <Box key={key} style={{ gridColumn: '1 / -1' }}>
                    <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>{label}</Text>
                    {receiptEditMode ? (
                      <TextInput size="sm" value={receiptForm[key] || ''} onChange={(e) => setReceiptForm({ ...receiptForm, [key]: e.target.value })} />
                    ) : (
                      <Text size="sm" c={CHARCOAL} fw={500}>{receiptDetails[key] || 'N/A'}</Text>
                    )}
                  </Box>
                ))}
              </SimpleGrid>
            </Paper>

            {/* Schedule Details */}
            <Paper shadow="xs" p={{ base: 'sm', sm: 'lg' }} radius="lg" withBorder>
              <Title order={5} mb="md" c={CHARCOAL}>Schedule Details</Title>
              <Divider mb="md" color="#F0F0F0" />
              <Stack gap="md">
                <Box>
                  <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Status</Text>
                  {receiptEditMode ? (
                    <Select size="sm" data={APPOINTMENT_STATUS_OPTIONS} placeholder="Select status" value={receiptForm.status || null} onChange={(val) => setReceiptForm({ ...receiptForm, status: val || '' })} />
                  ) : (
                    <Badge size="lg" variant="light" color="gray" style={{ backgroundColor: `${PRIMARY_BROWN}10`, color: PRIMARY_BROWN }}>{appointmentStatusLabel}</Badge>
                  )}
                </Box>
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                  <Box>
                    <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Appointment Date</Text>
                    {receiptEditMode ? (
                      <TextInput type="date" size="sm" value={receiptForm.appointedDate || ''} onChange={(e) => setReceiptForm({ ...receiptForm, appointedDate: e.target.value })} />
                    ) : (
                      <Text size="sm" c={CHARCOAL} fw={500}>
                        {receiptDetails.appointedDate ? new Date(receiptDetails.appointedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                      </Text>
                    )}
                  </Box>
                  <Box>
                    <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Appointment Time</Text>
                    {receiptEditMode ? (
                      <TextInput type="time" size="sm" value={receiptForm.appointmentTime || ''} onChange={(e) => setReceiptForm({ ...receiptForm, appointmentTime: e.target.value })} />
                    ) : (
                      <Text size="sm" c={CHARCOAL} fw={500}>{receiptDetails.appointmentTime || 'N/A'}</Text>
                    )}
                  </Box>
                </SimpleGrid>
              </Stack>
            </Paper>

            {/* Financial Details */}
            <Paper shadow="xs" p={{ base: 'sm', sm: 'lg' }} radius="lg" withBorder>
              <Title order={5} mb="md" c={CHARCOAL}>Financial Details</Title>
              <Divider mb="md" color="#F0F0F0" />
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                {[
                  { label: 'Income Source', key: 'currentSourceOfIncome' },
                  { label: 'Monthly Income', key: 'monthlyIncome', type: 'number', display: receiptDetails.monthlyIncome ? `₱${Number(receiptDetails.monthlyIncome).toLocaleString()}` : 'N/A' },
                  { label: 'Nature of Work', key: 'natureOfWork' },
                  { label: 'Employer', key: 'employerName' },
                ].map(({ label, key, type, display }) => (
                  <Box key={key}>
                    <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>{label}</Text>
                    {receiptEditMode ? (
                      <TextInput size="sm" type={type || 'text'} value={receiptForm[key] || ''} onChange={(e) => setReceiptForm({ ...receiptForm, [key]: e.target.value })} />
                    ) : (
                      <Text size="sm" c={CHARCOAL} fw={500}>{display || receiptDetails[key] || 'N/A'}</Text>
                    )}
                  </Box>
                ))}
                <Box style={{ gridColumn: '1 / -1' }}>
                  <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Employer Address</Text>
                  {receiptEditMode ? (
                    <TextInput size="sm" value={receiptForm.employerAddress || ''} onChange={(e) => setReceiptForm({ ...receiptForm, employerAddress: e.target.value })} />
                  ) : (
                    <Text size="sm" c={CHARCOAL} fw={500}>{receiptDetails.employerAddress || 'N/A'}</Text>
                  )}
                </Box>
              </SimpleGrid>
            </Paper>

            {/* Case Details */}
            <Paper shadow="xs" p={{ base: 'sm', sm: 'lg' }} radius="lg" withBorder>
              <Title order={5} mb="md" c={CHARCOAL}>Case Details</Title>
              <Divider mb="md" color="#F0F0F0" />
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                {[
                  { label: 'Party Represented', key: 'partyRepresented' },
                  { label: 'Case Number', key: 'caseNumber', readOnly: true },
                  { label: 'Case Nature', key: 'caseNature', display: receiptDetails.caseNature || receiptDetails.natureOfCase || 'N/A' },
                  { label: 'Appointment Type', key: 'appointmentType', display: receiptDetails.caseDetails?.appointmentType || receiptDetails.personal?.legalMatter || receiptDetails.appointmentType || 'N/A' },
                  { label: 'Venue', key: 'venue' },
                  { label: 'Present Stage', key: 'presentStage' },
                ].map(({ label, key, display, readOnly }) => (
                  <Box key={key}>
                    <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>{label}</Text>
                    {receiptEditMode && !readOnly ? (
                      <TextInput size="sm" value={receiptForm[key] || ''} onChange={(e) => setReceiptForm({ ...receiptForm, [key]: e.target.value })} />
                    ) : (
                      <Text size="sm" c={CHARCOAL} fw={500}>{display || receiptDetails[key] || 'N/A'}</Text>
                    )}
                  </Box>
                ))}
                {/* Full-width fields */}
                {[
                  { label: 'Court Division', key: 'courtDivision' },
                  { label: 'Court Address', key: 'courtAddress' },
                ].map(({ label, key }) => (
                  <Box key={key} style={{ gridColumn: '1 / -1' }}>
                    <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>{label}</Text>
                    {receiptEditMode ? (
                      <TextInput size="sm" value={receiptForm[key] || ''} onChange={(e) => setReceiptForm({ ...receiptForm, [key]: e.target.value })} />
                    ) : (
                      <Text size="sm" c={CHARCOAL} fw={500}>{receiptDetails[key] || 'N/A'}</Text>
                    )}
                  </Box>
                ))}
                {[
                  { label: 'Court Phone Number', key: 'courtPhoneNumber' },
                  { label: 'Presiding Officer', key: 'presidingOfficer' },
                ].map(({ label, key }) => (
                  <Box key={key}>
                    <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>{label}</Text>
                    {receiptEditMode ? (
                      <TextInput size="sm" value={receiptForm[key] || ''} onChange={(e) => setReceiptForm({ ...receiptForm, [key]: e.target.value })} />
                    ) : (
                      <Text size="sm" c={CHARCOAL} fw={500}>{receiptDetails[key] || 'N/A'}</Text>
                    )}
                  </Box>
                ))}
                <Box style={{ gridColumn: '1 / -1' }}>
                  <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Case Description</Text>
                  {receiptEditMode ? (
                    <Textarea size="sm" minRows={2} value={receiptForm.caseDescription || ''} onChange={(e) => setReceiptForm({ ...receiptForm, caseDescription: e.target.value })} />
                  ) : (
                    <Text size="sm" c={CHARCOAL} fw={500}>{receiptDetails.caseDescription || 'N/A'}</Text>
                  )}
                </Box>
              </SimpleGrid>
            </Paper>

            {/* Adverse Party */}
            <Paper shadow="xs" p={{ base: 'sm', sm: 'lg' }} radius="lg" withBorder>
              <Title order={5} mb="md" c={CHARCOAL}>Adverse Party</Title>
              <Divider mb="md" color="#F0F0F0" />
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                {[
                  { label: 'Adverse Party(ies)', key: 'adverseParty', fullWidth: true },
                  { label: 'Address', key: 'adversePartyAddress', fullWidth: true },
                  { label: 'Phone Number', key: 'adversePartyPhone' },
                  { label: 'Counsel', key: 'adversePartyCounsel' },
                  { label: 'Counsel Address', key: 'adversePartyCounselAddress', fullWidth: true },
                  { label: 'Counsel Phone', key: 'adversePartyCounselPhone' },
                ].map(({ label, key, fullWidth }) => (
                  <Box key={key} style={fullWidth ? { gridColumn: '1 / -1' } : undefined}>
                    <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>{label}</Text>
                    {receiptEditMode ? (
                      <TextInput size="sm" value={receiptForm[key] || ''} onChange={(e) => setReceiptForm({ ...receiptForm, [key]: e.target.value })} />
                    ) : (
                      <Text size="sm" c={CHARCOAL} fw={500}>{receiptDetails[key] || 'N/A'}</Text>
                    )}
                  </Box>
                ))}
              </SimpleGrid>
            </Paper>
          </Stack>
        ) : (
          <Center py="xl"><Text c={MUTED_OLIVE}>No appointment details available</Text></Center>
        )}
      </Modal>

      {/* ═══════════════════ CASE HISTORY MODAL ═══════════════════ */}
      <Modal
        opened={caseHistoryModalOpened}
        onClose={() => { setCaseHistoryModalOpened(false); setCaseHistoryEditMode(false); }}
        title={
          <Group justify="space-between" style={{ width: '100%' }} wrap="wrap" gap="xs">
            <Title order={4} c={PRIMARY_BROWN}>Case Record</Title>
            <Group gap="xs" wrap="nowrap">
              {!caseHistoryEditMode ? (
                <Button size="xs" variant="outline" color={PRIMARY_BROWN} onClick={() => setCaseHistoryEditMode(true)}>Edit</Button>
              ) : (
                <>
                  <Button size="xs" variant="outline" onClick={() => { setCaseHistoryEditMode(false); handleViewCaseHistory({ finalizeId: caseHistoryFinalizeId }); }}>Cancel</Button>
                  <Button size="xs" style={{ backgroundColor: PRIMARY_BROWN }} onClick={handleSaveCaseHistory} loading={caseHistorySaving}>Save</Button>
                </>
              )}
            </Group>
          </Group>
        }
        size="calc(90vw)"
        styles={{
          title: { fontWeight: 700, width: '100%' },
          body: { maxHeight: '80vh', overflowY: 'auto', padding: '16px' },
          inner: { padding: '8px' },
        }}
      >
        {caseHistoryLoading ? (
          <Center py="xl"><Loader size="lg" color={PRIMARY_BROWN} /></Center>
        ) : (
          <CaseInformationSection
            value={caseHistoryData}
            onChange={(data) => setCaseHistoryData(data)}
            readOnly={!caseHistoryEditMode}
          />
        )}
      </Modal>
    </Box>
  );
}