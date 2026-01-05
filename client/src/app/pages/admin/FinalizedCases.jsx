import React, { useState, useEffect } from 'react';
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
} from '@mantine/core';
import { IconBriefcase, IconChevronRight, IconEye, IconFileText, IconCircleCheck, IconChevronLeft } from '@tabler/icons-react';
import { PRIMARY_GOLD, PRIMARY_BROWN, MUTED_OLIVE, THEMED_LIGHT_BG, CHARCOAL, ACCENT_TAN } from '@utils/constants';
import apiClient from '@config/api/apiClient';
import { useAuth } from '@/context/authContext';
import { CaseInformationSection } from '../other/CaseInformationSection';

export default function FinalizedCases() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [finalized, setFinalized] = useState([]);
  const [loadingFinalized, setLoadingFinalized] = useState(false);
  const [activeTab, setActiveTab] = useState('accepted');
  const [modalOpened, setModalOpened] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editedData, setEditedData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [caseRecordModalOpened, setCaseRecordModalOpened] = useState(false);
  const [caseRecordData, setCaseRecordData] = useState({});
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const { userData } = useAuth();

  // Group finalized records by decision
  const acceptedCases = finalized.filter(f => f.decision === 'accepted');
  const rejectedCases = finalized.filter(f => f.decision === 'rejected');
  const pendingCases = finalized.filter(f => f.decision === 'pending' || !f.decision);

  const fetchFinalized = async () => {
    try {
      setLoadingFinalized(true);
      const resp = await apiClient.get('/finalize');
      const data = resp.data?.data ?? resp.data ?? [];
      setFinalized(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching finalized records', err);
      setFinalized([]);
    } finally {
      setLoadingFinalized(false);
    }
  };

  useEffect(() => {
    fetchFinalized();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openModal = (caseData) => {
    setSelectedCase(caseData);
    setEditedData(JSON.parse(JSON.stringify(caseData))); // Deep clone
    setEditMode(false);
    setActiveStep(0);
    setModalOpened(true);
  };

  const openCaseRecordModal = (caseData) => {
    setSelectedCaseId(caseData.caseId);
    setCaseRecordData(caseData.content?.caseInfo || {});
    setCaseRecordModalOpened(true);
  };

  const handleSaveCaseRecord = async () => {
    try {
      setSaving(true);
      // Add your API call to save case record here
      // await apiClient.put(`/cases/${selectedCaseId}`, caseRecordData);
      alert('Case record saved successfully!');
      setCaseRecordModalOpened(false);
    } catch (err) {
      console.error('Error saving case record:', err);
      alert('Failed to save case record: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveChanges = async () => {
    try {
      setSaving(true);
      const resp = await apiClient.put(`/finalize/${editedData._id || editedData.id}`, editedData);
      if (resp.data) {
        // Refetch the entire list to ensure consistency
        await fetchFinalized();
        setSelectedCase(resp.data);
        setEditedData(resp.data);
        setEditMode(false);
        alert('Changes saved successfully!');
      }
    } catch (err) {
      console.error('Error saving changes:', err);
      alert('Failed to save changes: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateEditedData = (path, value) => {
    setEditedData(prev => {
      const newData = { ...prev };
      const keys = path.split('.');
      let current = newData;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  const updateEvidence = (type, index, field, value) => {
    setEditedData(prev => {
      const newData = { ...prev };
      if (!newData.content) newData.content = {};
      if (!newData.content.interviewInfo) newData.content.interviewInfo = {};
      if (!newData.content.interviewInfo[type]) newData.content.interviewInfo[type] = [];
      
      const evidence = [...newData.content.interviewInfo[type]];
      if (!evidence[index]) evidence[index] = {};
      evidence[index] = { ...evidence[index], [field]: value };
      newData.content.interviewInfo[type] = evidence;
      return newData;
    });
  };

  const renderEvidenceTable = (title, evidence = [], fieldName) => {
    if (!editMode && (!evidence || evidence.length === 0)) return null;
    
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
                  {editMode ? (
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
                  {editMode ? (
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
                  {editMode ? (
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
                  {editMode ? (
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
            <Text fw={600} size="sm">{f.clientName || f.content?.interviewInfo?.clientName || 'Unknown Client'}</Text>
            <Text size="xs" c="dimmed" mt={4}>
              {f.createdAt ? new Date(f.createdAt).toLocaleDateString() : 'No Date'}
            </Text>
            <Group spacing="xs" mt={4}>
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
          {f.decision !== 'rejected' && (
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
          opened={caseRecordModalOpened}
          onClose={() => {
            setCaseRecordModalOpened(false);
            setCaseRecordData({});
          }}
          title={
            <Group justify="space-between" style={{ width: '100%' }}>
              <Title order={3} c={PRIMARY_BROWN}>Case Record</Title>
              <Button
                size="sm"
                style={{ backgroundColor: PRIMARY_BROWN }}
                onClick={handleSaveCaseRecord}
                loading={saving}
              >
                Save Changes
              </Button>
            </Group>
          }
          size="xl"
          styles={{
            title: { fontWeight: 700, width: '100%' },
            body: { maxHeight: '70vh', overflowY: 'auto' },
          }}
        >
          <CaseInformationSection value={caseRecordData} onChange={setCaseRecordData} />
        </Modal>

        {/* Modal for viewing recommendation */}
        <Modal
          opened={modalOpened}
          onClose={() => {
            setModalOpened(false);
            setEditMode(false);
          }}
          title={
            <Group justify="space-between" style={{ width: '100%' }}>
              <Title order={3} c={PRIMARY_BROWN}>Recommendation for Action</Title>
              <Group gap="sm">
                {!editMode ? (
                  <Button
                    size="xs"
                    variant="outline"
                    color={PRIMARY_BROWN}
                    onClick={() => setEditMode(true)}
                  >
                    Edit
                  </Button>
                ) : (
                  <>
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => {
                        setEditedData(JSON.parse(JSON.stringify(selectedCase)));
                        setEditMode(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="xs"
                      style={{ backgroundColor: PRIMARY_BROWN }}
                      onClick={handleSaveChanges}
                      loading={saving}
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
          {editedData && (
            <Stack gap="lg">
              {/* Stepper Navigation */}
              <Stepper 
                active={activeStep} 
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
              {activeStep === 0 && (
              <Paper p="md" withBorder>
                <Title order={4} c={PRIMARY_BROWN} mb="md">Client Interview Information</Title>
                <SimpleGrid cols={2} spacing="sm" mb="md">
                  <Box>
                    <Text size="xs" c="dimmed">Date of Interview</Text>
                    {editMode ? (
                      <TextInput
                        type="date"
                        value={editedData.content?.interviewInfo?.dateOfInterview || ''}
                        onChange={(e) => updateEditedData('content.interviewInfo.dateOfInterview', e.target.value)}
                      />
                    ) : (
                      <Text fw={500}>{editedData.content?.interviewInfo?.dateOfInterview || '-'}</Text>
                    )}
                  </Box>
                  <Box>
                    <Text size="xs" c="dimmed">Date Submitted</Text>
                    {editMode ? (
                      <TextInput
                        type="date"
                        value={editedData.content?.interviewInfo?.dateSubmitted || ''}
                        onChange={(e) => updateEditedData('content.interviewInfo.dateSubmitted', e.target.value)}
                      />
                    ) : (
                      <Text fw={500}>{editedData.content?.interviewInfo?.dateSubmitted || '-'}</Text>
                    )}
                  </Box>
                  <Box>
                    <Text size="xs" c="dimmed">Client's Name</Text>
                    {editMode ? (
                      <TextInput
                        value={editedData.content?.interviewInfo?.clientName || ''}
                        onChange={(e) => updateEditedData('content.interviewInfo.clientName', e.target.value)}
                      />
                    ) : (
                      <Text fw={500}>{editedData.content?.interviewInfo?.clientName || '-'}</Text>
                    )}
                  </Box>
                  <Box>
                    <Text size="xs" c="dimmed">Interviewing Intern/s</Text>
                    {editMode ? (
                      <TextInput
                        value={editedData.content?.interviewInfo?.interviewingInterns || ''}
                        onChange={(e) => updateEditedData('content.interviewInfo.interviewingInterns', e.target.value)}
                      />
                    ) : (
                      <Text fw={500}>{editedData.content?.interviewInfo?.interviewingInterns || '-'}</Text>
                    )}
                  </Box>
                </SimpleGrid>
                <Divider my="md" />
                <Box mb="md">
                  <Text size="sm" fw={600} c={PRIMARY_BROWN} mb="xs">Fast Facts</Text>
                  {editMode ? (
                    <Textarea
                      autosize
                      minRows={4}
                      value={editedData.content?.interviewInfo?.fastFacts || ''}
                      onChange={(e) => updateEditedData('content.interviewInfo.fastFacts', e.target.value)}
                    />
                  ) : (
                    <Text size="sm">{editedData.content?.interviewInfo?.fastFacts || '-'}</Text>
                  )}
                </Box>
                <Divider my="md" />
                {renderEvidenceTable(
                  "Evidence on Hand / Available for the Client(s)",
                  editedData.content?.interviewInfo?.clientEvidence,
                  'clientEvidence'
                )}
                {renderEvidenceTable(
                  "Evidence on Hand / Available for the Adverse Party(ies)",
                  editedData.content?.interviewInfo?.adversePartyEvidence,
                  'adversePartyEvidence'
                )}
                <Box mb="md">
                  <Text size="sm" fw={600} c={PRIMARY_BROWN} mb="xs">Intern's Initial Advice</Text>
                  {editMode ? (
                    <Textarea
                      autosize
                      minRows={3}
                      value={editedData.content?.interviewInfo?.internAdvice || ''}
                      onChange={(e) => updateEditedData('content.interviewInfo.internAdvice', e.target.value)}
                    />
                  ) : (
                    <Text size="sm">{editedData.content?.interviewInfo?.internAdvice || '-'}</Text>
                  )}
                </Box>
                <Box>
                  <Text size="sm" fw={600} c={PRIMARY_BROWN} mb="xs">Legal Opinion</Text>
                  {editMode ? (
                    <Textarea
                      autosize
                      minRows={5}
                      value={editedData.content?.interviewInfo?.legalOpinion || ''}
                      onChange={(e) => updateEditedData('content.interviewInfo.legalOpinion', e.target.value)}
                    />
                  ) : (
                    <Text size="sm">{editedData.content?.interviewInfo?.legalOpinion || '-'}</Text>
                  )}
                </Box>
              </Paper>
              )}
              
              {/* Step 2: Action Information */}
              {activeStep === 1 && (
              <Paper p="md" withBorder>
                <Title order={4} c={PRIMARY_BROWN} mb="md">Supervising Lawyer & Director Action</Title>
                
                <Box mb="md">
                  <Text size="sm" fw={600} c={PRIMARY_BROWN} mb="xs">Supervising Lawyer's Comment</Text>
                  {editMode ? (
                    <Textarea
                      autosize
                      minRows={4}
                      value={editedData.content?.actionInfo?.supervisingComment || ''}
                      onChange={(e) => updateEditedData('content.actionInfo.supervisingComment', e.target.value)}
                    />
                  ) : (
                    <Text size="sm">{editedData.content?.actionInfo?.supervisingComment || '-'}</Text>
                  )}
                </Box>
                <Divider my="md" />
                <Box mb="md">
                  <Text size="sm" fw={600} c={PRIMARY_BROWN} mb="xs">Director's Decision</Text>
                  {editMode ? (
                    <Radio.Group
                      value={editedData.decision || ''}
                      onChange={(val) => {
                        setEditedData(prev => ({ ...prev, decision: val }));
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
                        editedData.decision === 'accepted' ? 'green' : 
                        editedData.decision === 'rejected' ? 'red' : 
                        'yellow'
                      }
                    >
                      {(editedData.decision || 'pending').toUpperCase()}
                    </Badge>
                  )}
                </Box>
                <Box mb="md">
                  <Text size="sm" fw={600} c={PRIMARY_BROWN} mb="xs">Decision Note</Text>
                  {editMode ? (
                    <Textarea
                      autosize
                      minRows={4}
                      value={editedData.content?.actionInfo?.decisionNote || ''}
                      onChange={(e) => updateEditedData('content.actionInfo.decisionNote', e.target.value)}
                    />
                  ) : (
                    <Text size="sm">{editedData.content?.actionInfo?.decisionNote || '-'}</Text>
                  )}
                </Box>
                <Divider my="md" />
                <SimpleGrid cols={2} spacing="sm">
                  <Box>
                    <Text size="xs" c="dimmed">Assigned To</Text>
                    {editMode ? (
                      <Textarea
                        autosize
                        minRows={2}
                        value={editedData.content?.actionInfo?.assignedTo || ''}
                        onChange={(e) => updateEditedData('content.actionInfo.assignedTo', e.target.value)}
                      />
                    ) : (
                      <Text fw={500}>{editedData.content?.actionInfo?.assignedTo || '-'}</Text>
                    )}
                  </Box>
                  <Box>
                    <Text size="xs" c="dimmed">Supervising Lawyer</Text>
                    {editMode ? (
                      <TextInput
                        value={editedData.content?.actionInfo?.supervisingLawyer || ''}
                        onChange={(e) => updateEditedData('content.actionInfo.supervisingLawyer', e.target.value)}
                      />
                    ) : (
                      <Text fw={500}>{editedData.content?.actionInfo?.supervisingLawyer || '-'}</Text>
                    )}
                  </Box>
                  <Box>
                    <Text size="xs" c="dimmed">Director's Signature</Text>
                    {editMode ? (
                      <TextInput
                        value={editedData.content?.actionInfo?.directorSignature || ''}
                        onChange={(e) => updateEditedData('content.actionInfo.directorSignature', e.target.value)}
                      />
                    ) : (
                      <Text fw={500}>{editedData.content?.actionInfo?.directorSignature || '-'}</Text>
                    )}
                  </Box>
                  <Box>
                    <Text size="xs" c="dimmed">Signature Date</Text>
                    {editMode ? (
                      <TextInput
                        type="date"
                        value={editedData.content?.actionInfo?.signatureDate || ''}
                        onChange={(e) => updateEditedData('content.actionInfo.signatureDate', e.target.value)}
                      />
                    ) : (
                      <Text fw={500}>{editedData.content?.actionInfo?.signatureDate || '-'}</Text>
                    )}
                  </Box>
                </SimpleGrid>
              </Paper>
              )}

              {/* Navigation Buttons */}
              <Divider />
              <Group justify="space-between">
                {activeStep > 0 ? (
                  <Button 
                    variant="outline" 
                    leftSection={<IconChevronLeft size={20} />}
                    onClick={() => setActiveStep(activeStep - 1)}
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
                
                {activeStep < 1 && (
                  <Button 
                    rightSection={<IconChevronRight size={20} />}
                    onClick={() => setActiveStep(activeStep + 1)}
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
          <Tabs value={activeTab} onChange={setActiveTab}>
            <Tabs.List mb="xl" style={{ borderBottom: '1px solid #e9ecef' }}>
              <Tabs.Tab
                value="accepted"
                rightSection={<Badge size="sm" color="green" variant="light">{acceptedCases.length}</Badge>}
              >
                Accepted
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
                {loadingFinalized ? (
                  <Center><Loader /></Center>
                ) : (
                  acceptedCases.length ? acceptedCases.map(renderCaseCard) : (
                    <Text size="sm" c={MUTED_OLIVE}>No accepted cases found</Text>
                  )
                )}
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="rejected" pb="md">
              <Stack>
                {loadingFinalized ? (
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
                {loadingFinalized ? (
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