import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Group, Text, Divider, Badge, Center, Loader, Pagination, ActionIcon, Title } from '@mantine/core';
import { IconChevronRight } from '@tabler/icons-react';
import { useAuth } from '@/context/authContext';
import apiClient from '@config/api/apiClient';

export default function ReturnedCases() {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [returned, setReturned] = useState([]);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    const fetchReturned = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get('/reviews');
        const all = Array.isArray(res.data) ? res.data : [];

        const userId = userData?._id || userData?.id || userData?.uid || null;

        const filtered = all.filter(r => {
          if (!r || !r.reviewStage) return false;
          // Consider any returned stage (returned_to_intern, returned_to_supervising, etc.)
          if (!String(r.reviewStage).toLowerCase().includes('return')) return false;

          // Candidate recipient ids from review content
          const interviewInternId = r.content?.interviewInfo?.interviewingInternsId || r.content?.interviewInfo?.interviewingInternsId;
          const supervisingId = r.content?.actionInfo?.supervisingLawyerId || r.content?.actionInfo?.supervisingLawyerId;
          const directorId = r.content?.actionInfo?.directorId || r.content?.actionInfo?.directorId;
          const assignedToId = r.assignedTo?.id || r.content?.caseInfo?.assignedTo?.id || r.content?.interviewInfo?.assignedTo?.id || null;

          // If the review was returned to intern, prefer intern id; if to supervising, prefer supervising id
          if (String(r.reviewStage).toLowerCase().includes('intern')) {
            if (String(interviewInternId) === String(userId)) return true;
          }
          if (String(r.reviewStage).toLowerCase().includes('supervis')) {
            if (String(supervisingId) === String(userId)) return true;
          }
          if (String(r.reviewStage).toLowerCase().includes('director')) {
            if (String(directorId) === String(userId)) return true;
          }

          // Fallback: if assignedTo matches
          if (assignedToId && String(assignedToId) === String(userId)) return true;

          // Also include reviews where reviewerId is the user (they might be the intended recipient)
          if (r.reviewerId && String(r.reviewerId) === String(userId)) return true;

          return false;
        });

        setReturned(filtered.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)));
      } catch (err) {
        console.error('Error fetching returned reviews', err);
        setReturned([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReturned();
  }, [userData]);

  if (loading) return <Center py="xl"><Loader size="sm" /></Center>;

  if (!userData || userData.role === 'client') {
    return (
      <Box p="lg">
        <Title order={4}>Returned Cases</Title>
        <Text c="dimmed" mt="md">This area is for staff (interns, supervising lawyers, directors). Clients cannot access returned cases.</Text>
      </Box>
    );
  }

  return (
    <Box p="lg">
      <Group position="apart" mb="md">
        <Title order={4}>Returned Cases</Title>
        <Text size="sm" c="dimmed">Showing cases returned to you</Text>
      </Group>

      {returned.length === 0 ? (
        <Text c="dimmed">No returned cases assigned to you.</Text>
      ) : (
        returned.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE).map((r, idx) => {
          const clientName = r.clientName || r.content?.interviewInfo?.clientName || '';
          const caseTitle = r.caseTitle || r.content?.caseInfo?.caseTitle || r.content?.caseInfo?.title || '';
          const displayTitle = caseTitle && caseTitle !== clientName ? caseTitle : (clientName || 'Untitled Case');
          const reviewStage = r.reviewStage || '';
          const updated = r.updatedAt || r.createdAt;

          return (
            <Box key={r._id || idx}>
              <Group
                className="review-row"
                wrap="nowrap"
                align="center"
                px="lg"
                py="sm"
                gap="md"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate('/admin/recommendation', { state: { review: r, showClientInfo: true } })}
              >
                <Box style={{ flex: 1, minWidth: 0 }}>
                  <Group gap={8} align="center" wrap="nowrap">
                    <Text size="md" fw={600} truncate>{displayTitle}</Text>
                  </Group>
                  <Group gap={6} mt={2}>
                    <Text size="sm" c="dimmed">{new Date(updated).toLocaleString()} · {reviewStage.replace(/_/g, ' ')}</Text>
                  </Group>
                </Box>
                <Divider orientation="vertical" color="#DEDEDE" />
                <Badge size="sm" variant="light">Returned</Badge>
                <Divider orientation="vertical" color="#DEDEDE" />
                <ActionIcon variant="subtle" color="gray" size="sm">
                  <IconChevronRight size={16} />
                </ActionIcon>
              </Group>
              <Divider color="#E0E0E0" />
            </Box>
          );
        })
      )}

      {returned.length > ITEMS_PER_PAGE && (
        <Group position="center" mt="md">
          <Pagination total={Math.ceil(returned.length / ITEMS_PER_PAGE)} value={page} onChange={setPage} />
        </Group>
      )}
    </Box>
  );
}
