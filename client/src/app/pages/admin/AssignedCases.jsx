import React, { useEffect, useState, useMemo } from 'react';
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
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useAuth } from '@/context/authContext';
import apiClient from '@config/api/apiClient';
import { CaseInformationSection } from '../other/CaseInformationSection';
import AssignedCasesSkeleton from '@/components/skeleton/AssignedCasesSkeleton';
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
                <Text size="sm" fw={500} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{a.caseTitle || 'Untitled'}</Text>
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
                      <Button
                        size="xs"
                        color="green"
                        variant="light"
                        leftSection={<IconCheck size={14} />}
                        loading={loading === a._id}
                        onClick={() => onMarkDone(a._id)}
                      >
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
                      <Menu.Item
                        leftSection={<IconEye size={16} />}
                        onClick={() => onViewReview(a)}
                      >
                        View Review
                      </Menu.Item>
                      <Menu.Item
                        leftSection={<IconReceipt size={16} />}
                        onClick={() => onViewReceipt(a)}
                      >
                        Full Receipt
                      </Menu.Item>
                      <Menu.Item
                        leftSection={<IconFileText size={16} />}
                        onClick={() => onViewCaseHistory(a)}
                      >
                        Case History
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}

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

  const isAssigner = ['director', 'secretary'].includes(userData?.role);

  // ── Fetch data ──
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
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
        setLoading(false);
      }
    };
    if (userData) fetchAll();
  }, [userData]);

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

  // ══════════════════════════════════════════════════════════
  // VIEW REVIEW — open in-page modal with edit capability
  // ══════════════════════════════════════════════════════════
  const handleViewReview = async (assignment) => {
    setReviewModalOpened(true);
    setReviewLoading(true);
    setReviewData(null);
    setEditedReviewData(null);
    setReviewEditMode(false);
    setReviewActiveStep(0);
    try {
      const res = await apiClient.get(`/finalize/detail/${assignment.finalizeId}`);
      const data = res.data;
      setReviewData(data);
      setEditedReviewData(JSON.parse(JSON.stringify(data)));
    } catch (err) {
      console.error('Error fetching review data:', err);
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
      console.error('Error saving review:', err);
      notifications.show({ title: 'Error', message: 'Failed to save review: ' + (err.response?.data?.error || err.message), color: 'red' });
    } finally { setReviewSaving(false); }
  };

  const renderEvidenceTable = (title, evidence = [], fieldName) => {
    if (!reviewEditMode && (!evidence || evidence.length === 0)) return null;
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
            {rows.map((row, idx) => (
              <Table.Tr key={idx}>
                <Table.Td>
                  {reviewEditMode ? (
                    <TextInput placeholder="Type/Desc" size="xs" variant="unstyled" value={row?.type || ''} onChange={(e) => updateEvidence(fieldName, idx, 'type', e.target.value)} />
                  ) : (row?.type || '-')}
                </Table.Td>
                <Table.Td>
                  {reviewEditMode ? (
                    <TextInput placeholder="Author/Custodian" size="xs" variant="unstyled" value={row?.author || ''} onChange={(e) => updateEvidence(fieldName, idx, 'author', e.target.value)} />
                  ) : (row?.author || '-')}
                </Table.Td>
                <Table.Td>
                  {reviewEditMode ? (
                    <TextInput placeholder="Purpose" size="xs" variant="unstyled" value={row?.purpose || ''} onChange={(e) => updateEvidence(fieldName, idx, 'purpose', e.target.value)} />
                  ) : (row?.purpose || '-')}
                </Table.Td>
                <Table.Td>
                  {reviewEditMode ? (
                    <TextInput placeholder="Issues" size="xs" variant="unstyled" value={row?.issues || ''} onChange={(e) => updateEvidence(fieldName, idx, 'issues', e.target.value)} />
                  ) : (row?.issues || '-')}
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
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
          >
            + Add another row
          </Button>
        )}
      </Box>
    );
  };

  // ══════════════════════════════════════════════════════════
  // FULL RECEIPT — use assignment.caseId directly
  // ══════════════════════════════════════════════════════════
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

  // ══════════════════════════════════════════════════════════
  // CASE HISTORY — fetch via caserecords/finalize/:finalizeId
  // ══════════════════════════════════════════════════════════
  const handleViewCaseHistory = async (assignment) => {
    setCaseHistoryModalOpened(true);
    setCaseHistoryLoading(true);
    setCaseHistoryData({});
    setCaseHistoryFinalizeId(assignment.finalizeId);
    setCaseHistoryEditMode(false);
    try {
      const resp = await apiClient.get(`/caserecords/finalize/${assignment.finalizeId}`);
      if (resp.data) {
        setCaseHistoryData(resp.data);
      }
    } catch (fetchErr) {
      // No existing case record — try finalize content
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
        setCaseHistoryData(resp.data);
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

  // Receipt status label
  const appointmentStatusLabel = receiptDetails?.status
    ? receiptDetails.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : 'N/A';

  if (loading) {
    return <AssignedCasesSkeleton rows={5} isAssigner={isAssigner} />;
  }

  return (
    <Box p="lg">
      {/* Header */}
      <Paper shadow="xs" p="xl" mb="xl" radius="lg" style={{ background: PRIMARY_BROWN, border: 'none' }}>
        <Group gap="md" align="center">
          <Box style={{ width: 48, height: 48, borderRadius: '12px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconClipboardCheck size={24} color={PRIMARY_BROWN} stroke={2.5} />
          </Box>
          <Box>
            <Title order={2} c="white" mb={4}>Assigned Cases</Title>
            <Text c="rgba(255, 255, 255, 0.9)" size="sm" fw={500}>View and manage your case assignments</Text>
          </Box>
        </Group>
      </Paper>

      {/* Search */}
      <Paper shadow="xs" p="md" mb="md" radius="md">
        <TextInput
          placeholder="Search by case title, ID, client name..."
          leftSection={<IconSearch size={16} />}
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setMyPage(1); setMyCompletedPage(1); setAssignedPage(1); setAssignedCompletedPage(1); }}
          styles={{ input: { borderColor: '#E0E0E0' } }}
        />
      </Paper>

      {/* Tabs */}
      <Paper shadow="xs" radius="md" p="md">
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List mb="md">
            <Tabs.Tab value="my-assignments" leftSection={<IconClipboardCheck size={16} />}
              rightSection={filteredMy.length > 0 ? <Badge size="sm" color={PRIMARY_BROWN} variant="filled">{filteredMy.length}</Badge> : null}
            >Your Assigned Cases</Tabs.Tab>
            <Tabs.Tab value="my-completed" leftSection={<IconCheckbox size={16} />}
              rightSection={filteredMyCompleted.length > 0 ? <Badge size="sm" color="green" variant="filled">{filteredMyCompleted.length}</Badge> : null}
            >Completed</Tabs.Tab>
            {isAssigner && (
              <Tabs.Tab value="assigned-by-me" leftSection={<IconSend size={16} />}
                rightSection={filteredAssigned.length > 0 ? <Badge size="sm" color="blue" variant="filled">{filteredAssigned.length}</Badge> : null}
              >Cases You Assigned</Tabs.Tab>
            )}
            {isAssigner && (
              <Tabs.Tab value="assigned-completed" leftSection={<IconCheckbox size={16} />}
                rightSection={filteredAssignedCompleted.length > 0 ? <Badge size="sm" color="teal" variant="filled">{filteredAssignedCompleted.length}</Badge> : null}
              >Assigned Completed</Tabs.Tab>
            )}
          </Tabs.List>

          <Tabs.Panel value="my-assignments">
            <AssignmentTable
              data={paginatedMy} showAssignedTo={false} showAssignedBy={true}
              onMarkDone={handleMarkDone} loading={actionLoading} canComplete={true}
              onViewReview={handleViewReview} onViewReceipt={handleViewReceipt} onViewCaseHistory={handleViewCaseHistory}
            />
            {filteredMy.length > ITEMS_PER_PAGE && (
              <Group justify="center" mt="md"><Pagination total={Math.ceil(filteredMy.length / ITEMS_PER_PAGE)} value={myPage} onChange={setMyPage} /></Group>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="my-completed">
            <AssignmentTable
              data={paginatedMyCompleted} showAssignedTo={false} showAssignedBy={true}
              onMarkDone={() => {}} loading={null} canComplete={false}
              onViewReview={handleViewReview} onViewReceipt={handleViewReceipt} onViewCaseHistory={handleViewCaseHistory}
            />
            {filteredMyCompleted.length > ITEMS_PER_PAGE && (
              <Group justify="center" mt="md"><Pagination total={Math.ceil(filteredMyCompleted.length / ITEMS_PER_PAGE)} value={myCompletedPage} onChange={setMyCompletedPage} /></Group>
            )}
          </Tabs.Panel>

          {isAssigner && (
            <Tabs.Panel value="assigned-by-me">
              <AssignmentTable
                data={paginatedAssigned} showAssignedTo={true} showAssignedBy={false}
                onMarkDone={() => {}} loading={null} canComplete={false}
                onViewReview={handleViewReview} onViewReceipt={handleViewReceipt} onViewCaseHistory={handleViewCaseHistory}
              />
              {filteredAssigned.length > ITEMS_PER_PAGE && (
                <Group justify="center" mt="md"><Pagination total={Math.ceil(filteredAssigned.length / ITEMS_PER_PAGE)} value={assignedPage} onChange={setAssignedPage} /></Group>
              )}
            </Tabs.Panel>
          )}

          {isAssigner && (
            <Tabs.Panel value="assigned-completed">
              <AssignmentTable
                data={paginatedAssignedCompleted} showAssignedTo={true} showAssignedBy={false}
                onMarkDone={() => {}} loading={null} canComplete={false}
                onViewReview={handleViewReview} onViewReceipt={handleViewReceipt} onViewCaseHistory={handleViewCaseHistory}
              />
              {filteredAssignedCompleted.length > ITEMS_PER_PAGE && (
                <Group justify="center" mt="md"><Pagination total={Math.ceil(filteredAssignedCompleted.length / ITEMS_PER_PAGE)} value={assignedCompletedPage} onChange={setAssignedCompletedPage} /></Group>
              )}
            </Tabs.Panel>
          )}
        </Tabs>
      </Paper>

      {/* ═══════════════════ VIEW REVIEW MODAL ═══════════════════ */}
      <Modal
        opened={reviewModalOpened}
        onClose={() => { setReviewModalOpened(false); setReviewEditMode(false); }}
        title={
          <Group justify="space-between" style={{ width: '100%' }}>
            <Title order={3} c={PRIMARY_BROWN}>Recommendation for Action</Title>
            <Group gap="sm">
              {!reviewEditMode ? (
                ['director', 'supervising_lawyer', 'secretary'].includes(userData?.role) && (
                  <Button size="xs" variant="outline" color={PRIMARY_BROWN} onClick={() => setReviewEditMode(true)}>Edit</Button>
                )
              ) : (
                <>
                  <Button size="xs" variant="outline" onClick={() => { setEditedReviewData(JSON.parse(JSON.stringify(reviewData))); setReviewEditMode(false); }}>Cancel</Button>
                  <Button size="xs" style={{ backgroundColor: PRIMARY_BROWN }} onClick={handleSaveReview} loading={reviewSaving}>Save Changes</Button>
                </>
              )}
            </Group>
          </Group>
        }
        size="calc(90vw)"
        styles={{ title: { fontWeight: 700, width: '100%' }, body: { maxHeight: '80vh', overflowY: 'auto' } }}
      >
        {reviewLoading ? (
          <Center py="xl"><Loader size="lg" color={PRIMARY_BROWN} /></Center>
        ) : editedReviewData ? (
          <Stack gap="lg">
            <Stepper active={reviewActiveStep} color={PRIMARY_BROWN} completedIcon={<IconCircleCheck size={20} />}
              styles={{ stepLabel: { fontWeight: 600, fontSize: '14px' }, stepDescription: { fontSize: '12px', color: MUTED_OLIVE } }}
            >
              <Stepper.Step label="Interview" description="Client & Evidence" />
              <Stepper.Step label="Action" description="Lawyer & Director" />
            </Stepper>
            <Divider />

            {/* Step 1: Interview Information */}
            {reviewActiveStep === 0 && (
              <Paper p="md" withBorder>
                <Title order={4} c={PRIMARY_BROWN} mb="md">Client Interview Information</Title>
                <SimpleGrid cols={2} spacing="sm" mb="md">
                  <Box>
                    <Text size="xs" c="dimmed">Date of Interview</Text>
                    <Text fw={500}>{editedReviewData.content?.interviewInfo?.dateOfInterview || '-'}</Text>
                  </Box>
                  <Box>
                    <Text size="xs" c="dimmed">Date Submitted</Text>
                    <Text fw={500}>{editedReviewData.content?.interviewInfo?.dateSubmitted || '-'}</Text>
                  </Box>
                  <Box>
                    <Text size="xs" c="dimmed">Client's Name</Text>
                    <Text fw={500}>{editedReviewData.content?.interviewInfo?.clientName || '-'}</Text>
                  </Box>
                  <Box>
                    <Text size="xs" c="dimmed">Interviewing Intern/s</Text>
                    <Text fw={500}>{editedReviewData.content?.interviewInfo?.interviewingInterns || '-'}</Text>
                  </Box>
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
                {renderEvidenceTable("Evidence on Hand / Available for the Client(s)", editedReviewData.content?.interviewInfo?.clientEvidence, 'clientEvidence')}
                {renderEvidenceTable("Evidence on Hand / Available for the Adverse Party(ies)", editedReviewData.content?.interviewInfo?.adversePartyEvidence, 'adversePartyEvidence')}
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

            {/* Step 2: Action Information */}
            {reviewActiveStep === 1 && (
              <Paper p="md" withBorder>
                <Title order={4} c={PRIMARY_BROWN} mb="md">Supervising Lawyer & Director Action</Title>
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
                <SimpleGrid cols={2} spacing="sm">
                  <Box><Text size="xs" c="dimmed">Assigned To</Text><Text fw={500}>{editedReviewData.content?.actionInfo?.assignedTo || '-'}</Text></Box>
                  <Box><Text size="xs" c="dimmed">Supervising Lawyer</Text><Text fw={500}>{editedReviewData.content?.actionInfo?.supervisingLawyer || '-'}</Text></Box>
                  <Box><Text size="xs" c="dimmed">Director's Signature</Text><Text fw={500}>{editedReviewData.content?.actionInfo?.directorSignature || '-'}</Text></Box>
                  <Box><Text size="xs" c="dimmed">Signature Date</Text><Text fw={500}>{editedReviewData.content?.actionInfo?.signatureDate || '-'}</Text></Box>
                </SimpleGrid>
              </Paper>
            )}

            {/* Navigation */}
            <Divider />
            <Group justify="space-between">
              {reviewActiveStep > 0 ? (
                <Button variant="outline" leftSection={<IconChevronLeft size={20} />} onClick={() => setReviewActiveStep(0)} size="sm"
                  styles={{ root: { borderColor: '#E0E0E0', color: MUTED_OLIVE } }}
                >Previous</Button>
              ) : <Box />}
              {reviewActiveStep < 1 && (
                <Button rightSection={<IconChevronRight size={20} />} onClick={() => setReviewActiveStep(1)} size="sm" style={{ backgroundColor: PRIMARY_BROWN }}>Next Step</Button>
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
          <Group justify="space-between" style={{ width: '100%' }}>
            <Text fw={700} size="xl" c={PRIMARY_BROWN}>Appointment Receipt</Text>
            <Group gap="xs">
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
        styles={{ title: { fontWeight: 700, width: '100%' }, body: { maxHeight: '80vh', overflowY: 'auto' } }}
      >
        {receiptLoading ? (
          <Center py="xl"><Loader size="lg" color={PRIMARY_BROWN} /></Center>
        ) : receiptDetails ? (
          <Stack gap="lg" mt="lg">
            {/* Header Badge */}
            <Paper p="md" radius="md" style={{ backgroundColor: `${PRIMARY_GOLD}15`, border: `1px solid ${PRIMARY_GOLD}` }}>
              <Group justify="space-between" align="center">
                <Text fw={700} size="lg" c={PRIMARY_BROWN}>
                  {receiptDetails.caseDetails?.appointmentType || receiptDetails.personal?.legalMatter || 'Appointment'}
                </Text>
                <Badge size="lg" variant="filled" style={{ backgroundColor: PRIMARY_GOLD, color: CHARCOAL }}>{appointmentStatusLabel}</Badge>
              </Group>
              <Text size="sm" c={MUTED_OLIVE} mt="xs">Case #{receiptDetails.caseNumber || 'N/A'}</Text>
            </Paper>

            {/* Personal Details */}
            <Paper shadow="xs" p="lg" radius="lg" style={{ backgroundColor: 'white', border: '1px solid #F0F0F0' }}>
              <Title order={4} mb="md" c={CHARCOAL}>Personal Details</Title>
              <Divider mb="md" color="#F0F0F0" />
              <Grid gutter="md">
                {[
                  { label: 'Name', key: 'fullName', span: 6, display: receiptDetails.fullName || receiptDetails.name || 'N/A' },
                  { label: 'Age', key: 'age', span: 6, type: 'number' },
                  { label: 'Birthday', key: 'birthday', span: 6, type: 'date' },
                  { label: 'Sex', key: 'sex', span: 6 },
                  { label: 'Civil Status', key: 'civilStatus', span: 6 },
                  { label: 'Citizenship', key: 'citizenship', span: 6 },
                  { label: 'Contact Number', key: 'contactNumber', span: 6 },
                  { label: 'Email', key: 'email', span: 6 },
                  { label: 'Present Address', key: 'presentAddress', span: 12 },
                  { label: 'Permanent Address', key: 'permanentAddress', span: 12 },
                  { label: 'Spouse Name', key: 'spouseName', span: 6 },
                  { label: 'Relator Name', key: 'relatorName', span: 6 },
                  { label: 'Relator Contact Number', key: 'relatorContactNumber', span: 6 },
                ].map(({ label, key, span, type, display }) => (
                  <Grid.Col span={span} key={key}>
                    <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>{label}</Text>
                    {receiptEditMode ? (
                      <TextInput size="sm" type={type || 'text'} value={receiptForm[key] || ''} onChange={(e) => setReceiptForm({ ...receiptForm, [key]: e.target.value })} />
                    ) : (
                      <Text size="sm" c={CHARCOAL} fw={500}>{display || receiptDetails[key] || 'N/A'}</Text>
                    )}
                  </Grid.Col>
                ))}
              </Grid>
            </Paper>

            {/* Schedule Details */}
            <Paper shadow="xs" p="lg" radius="lg" style={{ backgroundColor: 'white', border: '1px solid #F0F0F0' }}>
              <Title order={4} mb="md" c={CHARCOAL}>Schedule Details</Title>
              <Divider mb="md" color="#F0F0F0" />
              <Grid gutter="md">
                <Grid.Col span={12}>
                  <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Status</Text>
                  {receiptEditMode ? (
                    <Select size="sm" data={APPOINTMENT_STATUS_OPTIONS} placeholder="Select status" value={receiptForm.status || null}
                      onChange={(val) => setReceiptForm({ ...receiptForm, status: val || '' })} />
                  ) : (
                    <Badge size="lg" variant="light" color="gray" style={{ backgroundColor: `${PRIMARY_BROWN}10`, color: PRIMARY_BROWN }}>{appointmentStatusLabel}</Badge>
                  )}
                </Grid.Col>
                <Grid.Col span={6}>
                  <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Appointment Date</Text>
                  {receiptEditMode ? (
                    <TextInput type="date" size="sm" value={receiptForm.appointedDate || ''} onChange={(e) => setReceiptForm({ ...receiptForm, appointedDate: e.target.value })} />
                  ) : (
                    <Text size="sm" c={CHARCOAL} fw={500}>
                      {receiptDetails.appointedDate ? new Date(receiptDetails.appointedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                    </Text>
                  )}
                </Grid.Col>
                <Grid.Col span={6}>
                  <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Appointment Time</Text>
                  {receiptEditMode ? (
                    <TextInput type="time" size="sm" value={receiptForm.appointmentTime || ''} onChange={(e) => setReceiptForm({ ...receiptForm, appointmentTime: e.target.value })} />
                  ) : (
                    <Text size="sm" c={CHARCOAL} fw={500}>{receiptDetails.appointmentTime || 'N/A'}</Text>
                  )}
                </Grid.Col>
              </Grid>
            </Paper>

            {/* Financial Details */}
            <Paper shadow="xs" p="lg" radius="lg" style={{ backgroundColor: 'white', border: '1px solid #F0F0F0' }}>
              <Title order={4} mb="md" c={CHARCOAL}>Financial Details</Title>
              <Divider mb="md" color="#F0F0F0" />
              <Grid gutter="md">
                {[
                  { label: 'Income Source', key: 'currentSourceOfIncome', span: 6 },
                  { label: 'Monthly Income', key: 'monthlyIncome', span: 6, type: 'number', display: receiptDetails.monthlyIncome ? `₱${Number(receiptDetails.monthlyIncome).toLocaleString()}` : 'N/A' },
                  { label: 'Nature of Work', key: 'natureOfWork', span: 6 },
                  { label: 'Employer', key: 'employerName', span: 6 },
                  { label: 'Employer Address', key: 'employerAddress', span: 12 },
                ].map(({ label, key, span, type, display }) => (
                  <Grid.Col span={span} key={key}>
                    <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>{label}</Text>
                    {receiptEditMode ? (
                      <TextInput size="sm" type={type || 'text'} value={receiptForm[key] || ''} onChange={(e) => setReceiptForm({ ...receiptForm, [key]: e.target.value })} />
                    ) : (
                      <Text size="sm" c={CHARCOAL} fw={500}>{display || receiptDetails[key] || 'N/A'}</Text>
                    )}
                  </Grid.Col>
                ))}
              </Grid>
            </Paper>

            {/* Case Details */}
            <Paper shadow="xs" p="lg" radius="lg" style={{ backgroundColor: 'white', border: '1px solid #F0F0F0' }}>
              <Title order={4} mb="md" c={CHARCOAL}>Case Details</Title>
              <Divider mb="md" color="#F0F0F0" />
              <Grid gutter="md">
                {[
                  { label: 'Party Represented', key: 'partyRepresented', span: 6 },
                  { label: 'Case Number', key: 'caseNumber', span: 6, readOnly: true },
                  { label: 'Case Nature', key: 'caseNature', span: 6, display: receiptDetails.caseNature || receiptDetails.natureOfCase || 'N/A' },
                  { label: 'Appointment Type', key: 'appointmentType', span: 6, display: receiptDetails.caseDetails?.appointmentType || receiptDetails.personal?.legalMatter || receiptDetails.appointmentType || 'N/A' },
                  { label: 'Venue', key: 'venue', span: 6 },
                  { label: 'Present Stage', key: 'presentStage', span: 6 },
                  { label: 'Court Division', key: 'courtDivision', span: 12 },
                  { label: 'Court Address', key: 'courtAddress', span: 12 },
                  { label: 'Presiding Officer', key: 'presidingOfficer', span: 12 },
                ].map(({ label, key, span, display, readOnly }) => (
                  <Grid.Col span={span} key={key}>
                    <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>{label}</Text>
                    {receiptEditMode && !readOnly ? (
                      <TextInput size="sm" value={receiptForm[key] || ''} onChange={(e) => setReceiptForm({ ...receiptForm, [key]: e.target.value })} />
                    ) : (
                      <Text size="sm" c={CHARCOAL} fw={500}>{display || receiptDetails[key] || 'N/A'}</Text>
                    )}
                  </Grid.Col>
                ))}
                <Grid.Col span={12}>
                  <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Case Description</Text>
                  {receiptEditMode ? (
                    <Textarea size="sm" minRows={2} value={receiptForm.caseDescription || ''} onChange={(e) => setReceiptForm({ ...receiptForm, caseDescription: e.target.value })} />
                  ) : (
                    <Text size="sm" c={CHARCOAL} fw={500}>{receiptDetails.caseDescription || 'N/A'}</Text>
                  )}
                </Grid.Col>
              </Grid>
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
          <Group justify="space-between" style={{ width: '100%' }}>
            <Title order={3} c={PRIMARY_BROWN}>Case Record</Title>
            <Group gap="sm">
              {!caseHistoryEditMode ? (
                <Button size="xs" variant="outline" color={PRIMARY_BROWN} onClick={() => setCaseHistoryEditMode(true)}>Edit</Button>
              ) : (
                <>
                  <Button size="xs" variant="outline" onClick={() => { setCaseHistoryEditMode(false); handleViewCaseHistory({ finalizeId: caseHistoryFinalizeId }); }}>Cancel</Button>
                  <Button size="xs" style={{ backgroundColor: PRIMARY_BROWN }} onClick={handleSaveCaseHistory} loading={caseHistorySaving}>Save Changes</Button>
                </>
              )}
            </Group>
          </Group>
        }
        size="calc(90vw)"
        styles={{ title: { fontWeight: 700, width: '100%' }, body: { maxHeight: '80vh', overflowY: 'auto' } }}
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
