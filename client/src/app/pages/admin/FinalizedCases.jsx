import React, { useState, useEffect, useReducer } from 'react';
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
} from '@mantine/core';
import { IconBriefcase, IconChevronRight, IconEye, IconFileText, IconCircleCheck, IconChevronLeft, IconMessageCircle } from '@tabler/icons-react';
import { PRIMARY_GOLD, PRIMARY_BROWN, MUTED_OLIVE, THEMED_LIGHT_BG, CHARCOAL, ACCENT_TAN, NATURE_OF_CASE_OPTIONS, CATEGORY_COLORS } from '@utils/constants';
import apiClient from '@config/api/apiClient';
import { useAuth } from '@/context/authContext';
import { CaseInformationSection } from '../other/CaseInformationSection';

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

  // Group finalized records by decision and apply search filter
  const acceptedCases = filterCases(state.finalized.filter(f => f.decision === 'accepted'));
  const acceptedWithRecord = acceptedCases.filter(f => state.caseRecordsMap[f._id || f.id]);
  const acceptedWithoutRecord = acceptedCases.filter(f => !state.caseRecordsMap[f._id || f.id]);
  const rejectedCases = filterCases(state.finalized.filter(f => f.decision === 'rejected'));
  const pendingCases = filterCases(state.finalized.filter(f => f.decision === 'pending' || !f.decision));

  const fetchFinalized = async () => {
    try {
      dispatch({ type: 'SET_LOADING_FINALIZED', payload: true });
      const resp = await apiClient.get('/finalize');
      const data = resp.data?.data ?? resp.data ?? [];
      const finalizedData = Array.isArray(data) ? data : [];
      dispatch({ type: 'SET_FINALIZED', payload: finalizedData });
      
      // Check which accepted cases have case records
      const accepted = finalizedData.filter(f => f.decision === 'accepted');
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
              <Text fw={600} size="sm">{f.clientName || f.content?.interviewInfo?.clientName || 'Unknown Client'}</Text>
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
        <Group noWrap align="center" spacing="xs">
          <Button
            size="xs"
            variant="outline"
            leftSection={<IconEye size={16} />}
            onClick={(e) => {
              e.stopPropagation();
              openModal(f);
            }}
          >
            View Review
          </Button>
          {f.decision === 'accepted' && (
            <>
              <Button
                size="xs"
                variant="filled"
                style={{ backgroundColor: PRIMARY_BROWN }}
                leftSection={<IconFileText size={16} />}
                onClick={(e) => {
                  e.stopPropagation();
                  openCaseRecordModal(f);
                }}
              >
                Case Record
              </Button>
              <Button
                size="xs"
                variant="outline"
                style={{ borderColor: PRIMARY_GOLD, color: PRIMARY_BROWN }}
                leftSection={<IconMessageCircle size={16} />}
                onClick={(e) => {
                  e.stopPropagation();
                  // Pass the caseId string (e.g., "case-26-0001") to find the case in messenger
                  navigate('/admin/chat', { state: { caseNumber: f.caseId } });
                }}
              >
                Chat
              </Button>
            </>
          )}
          <IconChevronRight size={16} color="#999" />
        </Group>
      </Group>
    </Paper>
  );

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
              </Group>
            </Group>
          }
          size="xl"
          styles={{
            title: { fontWeight: 700, width: '100%' },
            body: { maxHeight: '70vh', overflowY: 'auto' },
          }}
        >
          <CaseInformationSection 
            value={state.caseRecordData} 
            onChange={(data) => dispatch({ type: 'SET_CASE_RECORD_DATA', payload: data })}
            readOnly={!state.caseRecordEditMode}
          />
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
                        dispatch({ type: 'UPDATE_EDITED_DATA', payload: (prev) => {
                          const updated = { ...prev, decision: val };
                          // Also update the nested path for consistency
                          if (!updated.content) updated.content = {};
                          if (!updated.content.actionInfo) updated.content.actionInfo = {};
                          updated.content.actionInfo.decision = val;
                          return updated;
                        }});
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
                value="rejected"
                rightSection={<Badge size="sm" color="red" variant="light">{rejectedCases.length}</Badge>}
              >
                Rejected
              </Tabs.Tab>
              <Tabs.Tab
                value="pending"
                rightSection={<Badge size="sm" color="yellow" variant="light">{pendingCases.length}</Badge>}
              >
                Pending
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

            <Tabs.Panel value="rejected" pb="md">
              <Stack>
                {state.loadingFinalized ? (
                  <Center><Loader /></Center>
                ) : (
                  rejectedCases.length ? rejectedCases.map(renderCaseCard) : (
                    <Text size="sm" c={MUTED_OLIVE}>No rejected cases found</Text>
                  )
                )}
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="pending" pb="md">
              <Stack>
                {state.loadingFinalized ? (
                  <Center><Loader /></Center>
                ) : (
                  pendingCases.length ? pendingCases.map(renderCaseCard) : (
                    <Text size="sm" c={MUTED_OLIVE}>No pending cases found</Text>
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