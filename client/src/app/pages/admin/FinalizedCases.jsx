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
  TabsTab,
  TabsPanel,
} from '@mantine/core';
import { IconBriefcase, IconChevronRight } from '@tabler/icons-react';
import { PRIMARY_GOLD, PRIMARY_BROWN, MUTED_OLIVE, THEMED_LIGHT_BG, CHARCOAL, ACCENT_TAN } from '@utils/constants';
import apiClient from '@config/api/apiClient';
import { useAuth } from '@/context/authContext';

export default function FinalizedCases() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [finalized, setFinalized] = useState([]);
  const [loadingFinalized, setLoadingFinalized] = useState(false);
  const [activeTab, setActiveTab] = useState('accepted');

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

  const renderCaseCard = (f) => (
    <Paper
      key={f._id || f.id || f.caseId}
      p="md"
      radius="md"
      withBorder
      style={{ cursor: 'pointer', borderRadius: 12, border: '1px solid #E6D9CC', background: 'white' }}
      onClick={() => navigate('/admin/recommendation', { state: { review: f } })}
    >
      <Group noWrap align="center" justify="space-between">
        <Group noWrap align="center" style={{ flex: 1 }}>
          <Box style={{ width: 40, height: 40, borderRadius: 8, background: MUTED_OLIVE, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <IconBriefcase size={18} />
          </Box>
          <Box style={{ flex: 1 }}>
            <Text fw={600} size="sm">{f.caseTitle || f.content?.caseInfo?.title || f.caseId}</Text>
            <Text size="xs" c={MUTED_OLIVE}>{f.clientName || f.content?.interviewInfo?.clientName || ''}</Text>
          </Box>
        </Group>
        <Group noWrap align="center" spacing="xs">
          <Text size="xs" c="dimmed">
            {f.createdAt ? new Date(f.createdAt).toLocaleDateString() : 'Yesterday'}
          </Text>
          <Badge size="sm" variant="light" color="gray">
            {f.finalizedRole || f.finalizedBy || 'Secretary'}
          </Badge>
          <IconChevronRight size={16} color="#999" />
        </Group>
      </Group>
    </Paper>
  );

  return (
    <Box bg={THEMED_LIGHT_BG} mih="100vh" py="xl">
      <Container size="xl">
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
              <TabsTab
                value="accepted"
                rightSection={<Badge size="sm" color="green" variant="light">{acceptedCases.length}</Badge>}
              >
                Accepted
              </TabsTab>
              <TabsTab
                value="rejected"
                rightSection={<Badge size="sm" color="red" variant="light">{rejectedCases.length}</Badge>}
              >
                Rejected
              </TabsTab>
              <TabsTab
                value="pending"
                rightSection={<Badge size="sm" color="yellow" variant="light">{pendingCases.length}</Badge>}
              >
                Pending
              </TabsTab>
            </Tabs.List>

            <TabsPanel value="accepted" pb="md">
              <Stack>
                {loadingFinalized ? (
                  <Center><Loader /></Center>
                ) : (
                  acceptedCases.length ? acceptedCases.map(renderCaseCard) : (
                    <Text size="sm" c={MUTED_OLIVE}>No accepted cases found</Text>
                  )
                )}
              </Stack>
            </TabsPanel>

            <TabsPanel value="rejected" pb="md">
              <Stack>
                {loadingFinalized ? (
                  <Center><Loader /></Center>
                ) : (
                  rejectedCases.length ? rejectedCases.map(renderCaseCard) : (
                    <Text size="sm" c={MUTED_OLIVE}>No rejected cases found</Text>
                  )
                )}
              </Stack>
            </TabsPanel>

            <TabsPanel value="pending" pb="md">
              <Stack>
                {loadingFinalized ? (
                  <Center><Loader /></Center>
                ) : (
                  pendingCases.length ? pendingCases.map(renderCaseCard) : (
                    <Text size="sm" c={MUTED_OLIVE}>No pending cases found</Text>
                  )
                )}
              </Stack>
            </TabsPanel>
          </Tabs>
        </Paper>
      </Container>
    </Box>
  );
}