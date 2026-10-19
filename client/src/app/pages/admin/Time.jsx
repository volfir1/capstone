import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Card,
  Text,
  Title,
  Tabs,
  Stack,
  Group,
  Button,
  Badge,
  Grid,
  Divider,
  Modal,
  Select,
  Loader,
  Center,
} from "@mantine/core";
import {
  IconClock,
  IconClockHour3,
  IconCalendar,
  IconPlayerPlay,
  IconPlayerStop,
} from "@tabler/icons-react";
import { PRIMARY_GOLD, PRIMARY_BROWN, MUTED_OLIVE, CHARCOAL, BG, ACCENT_TAN } from "@utils/constants";
import { useAuth } from "@/context/authContext";
import apiClient from "@config/api/apiClient";
import { notifications } from "@mantine/notifications";

export default function Time() {
  const { userData } = useAuth();
  const [activeTab, setActiveTab] = useState("timeclock");
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [clockedInTime, setClockedInTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showTimeOutModal, setShowTimeOutModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeEntryId, setActiveEntryId] = useState(null);
  
  // Secretary-specific state
  const [selectedIntern, setSelectedIntern] = useState(null);
  const [interns, setInterns] = useState([]);
  const [loadingInterns, setLoadingInterns] = useState(false);
  const [internTimesheet, setInternTimesheet] = useState([]);
  const [loadingTimesheet, setLoadingTimesheet] = useState(false);

  const isSecretary = userData?.role === 'secretary';
  const isIntern = userData?.role === 'intern';

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Check for active time entry on mount and periodically
  useEffect(() => {
    if (!isIntern || !userData?._id) return;

    const checkActiveEntry = async () => {
      try {
        const response = await apiClient.get(`/time-entries/active/${userData._id}`);
        const activeEntry = response.data?.data;
        
        if (activeEntry) {
          setIsClockedIn(true);
          setClockedInTime(activeEntry.timeIn);
          setActiveEntryId(activeEntry._id);
          setElapsedTime(activeEntry.currentDuration || 0);
        } else {
          setIsClockedIn(false);
          setClockedInTime(null);
          setActiveEntryId(null);
          setElapsedTime(0);
        }
      } catch (error) {
        console.error('Error checking active entry:', error);
        // Don't show notification for 404, just reset state
        setIsClockedIn(false);
        setClockedInTime(null);
        setActiveEntryId(null);
        setElapsedTime(0);
      }
    };

    // Check immediately
    checkActiveEntry();

    // Check every 5 seconds to sync with server
    const interval = setInterval(checkActiveEntry, 5000);
    return () => clearInterval(interval);
  }, [isIntern, userData?._id]);

  // Update elapsed time when clocked in
  useEffect(() => {
    let interval;
    if (isClockedIn && clockedInTime) {
      interval = setInterval(() => {
        const now = new Date();
        const diff = now - new Date(clockedInTime);
        setElapsedTime(Math.floor(diff / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isClockedIn, clockedInTime]);

  // Format elapsed time to HH:MM:SS
  const formatElapsedTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Format date for display
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  // Format time for display
  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  // Handle Time In
  const handleTimeIn = async () => {
    if (!userData?._id) {
      notifications.show({
        title: 'Error',
        message: 'User data not loaded. Please refresh the page.',
        color: 'red',
      });
      return;
    }

    try {
      const payload = {
        internId: userData._id,
        internName: `${userData.firstName} ${userData.lastName}`,
      };

      const response = await apiClient.post('/time-entries/clock-in', payload);
      
      if (response.data.success) {
        const now = new Date();
        setClockedInTime(now);
        setIsClockedIn(true);
        setElapsedTime(0);
        setActiveEntryId(response.data.data._id);
        
        notifications.show({
          title: 'Clocked In',
          message: `You clocked in at ${formatTime(now)}`,
          color: 'green',
        });
      }
    } catch (error) {
      console.error('Error clocking in:', error);
      notifications.show({
        title: 'Error',
        message: error.response?.data?.error || 'Failed to clock in',
        color: 'red',
      });
    }
  };

  // Handle Time Out
  const handleTimeOut = () => {
    setShowTimeOutModal(true);
  };

  // Confirm and submit time entry
  const handleSubmitTimeEntry = async () => {
    setSubmitting(true);
    try {
      const payload = {
        internId: userData._id,
      };

      const response = await apiClient.post('/time-entries/clock-out', payload);
      
      if (response.data.success) {
        notifications.show({
          title: 'Time Entry Submitted',
          message: 'Your timesheet has been submitted for review',
          color: 'green',
        });

        // Reset state
        setIsClockedIn(false);
        setClockedInTime(null);
        setElapsedTime(0);
        setActiveEntryId(null);
        setShowTimeOutModal(false);
        setActiveTab('timesheets');
        
        // Refresh timesheet
        if (userData?._id) {
          const timesheetResponse = await apiClient.get(`/time-entries/intern/${userData._id}`);
          setInternTimesheet(timesheetResponse.data?.data || []);
        }
      }
    } catch (error) {
      console.error('Error clocking out:', error);
      notifications.show({
        title: 'Error',
        message: error.response?.data?.error || 'Failed to clock out',
        color: 'red',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Fetch interns for secretary view
  useEffect(() => {
    if (isSecretary) {
      const fetchInterns = async () => {
        setLoadingInterns(true);
        try {
          const response = await apiClient.get('/time-entries/interns-list');
          setInterns(response.data?.data || []);
        } catch (error) {
          console.error('Error fetching interns:', error);
          notifications.show({
            title: 'Error',
            message: 'Failed to load interns',
            color: 'red',
          });
        } finally {
          setLoadingInterns(false);
        }
      };
      fetchInterns();
    }
  }, [isSecretary]);

  // Fetch intern timesheet when selected
  useEffect(() => {
    const fetchTimesheet = async () => {
      setLoadingTimesheet(true);
      try {
        let response;
        if (isIntern && userData?._id) {
          // Fetch own timesheet
          response = await apiClient.get(`/time-entries/intern/${userData._id}`);
        } else if (isSecretary && selectedIntern) {
          // Fetch selected intern's timesheet
          response = await apiClient.get(`/time-entries/intern/${selectedIntern}`);
        }
        if (response) {
          setInternTimesheet(response.data?.data || []);
        }
      } catch (error) {
        console.error('Error fetching timesheet:', error);
        notifications.show({
          title: 'Error',
          message: 'Failed to load timesheet',
          color: 'red',
        });
      } finally {
        setLoadingTimesheet(false);
      }
    };

    if ((isIntern && userData?._id) || (isSecretary && selectedIntern)) {
      fetchTimesheet();
    }
  }, [isIntern, isSecretary, selectedIntern, userData?._id]);

  return (
    <Box bg={BG} p="xl" style={{ minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600&family=DM+Sans:wght@400;500;600&display=swap');
        .time-page * { font-family: 'DM Sans', sans-serif; }
      `}</style>

      <Box className="time-page" maw={1200} mx="auto">
        <Title
          order={2}
          c={CHARCOAL}
          mb="lg"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Time
        </Title>

        <Tabs value={activeTab} onChange={setActiveTab} variant="outline">
          <Tabs.List mb="xl">
            <Tabs.Tab value="timeclock" leftSection={<IconClock size={16} />}>
              Timeclock
            </Tabs.Tab>
            <Tabs.Tab value="timesheets" leftSection={<IconCalendar size={16} />}>
              Timesheets
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="timeclock">
            <Stack gap="xl">
              {/* Secretary: Intern Selection */}
              {isSecretary && (
                <Card shadow="xs" p="xl" radius="lg" bg="white">
                  <Stack gap="md">
                    <Text size="lg" fw={700} c={CHARCOAL}>
                      Select Intern
                    </Text>
                    {loadingInterns ? (
                      <Center py="md">
                        <Loader size="sm" color={PRIMARY_BROWN} />
                      </Center>
                    ) : (
                      <Select
                        placeholder="Select an intern"
                        data={interns.map(intern => ({
                          value: intern._id,
                          label: `${intern.firstName} ${intern.lastName}`,
                        }))}
                        value={selectedIntern}
                        onChange={setSelectedIntern}
                        searchable
                        clearable
                      />
                    )}
                  </Stack>
                </Card>
              )}

              {/* Date and Time Display */}
              <Card shadow="xs" p="xl" radius="lg" bg="white">
                <Group justify="space-between" align="flex-start">
                  <Stack gap={4}>
                    <Text size="lg" fw={700} c={CHARCOAL}>
                      {formatDate(currentTime)}
                    </Text>
                    <Text size="sm" c={MUTED_OLIVE}>
                      {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })} PHT
                    </Text>
                  </Stack>
                  <Stack gap={4} align="flex-end">
                    <Text size="sm" fw={600} c={CHARCOAL}>
                      {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </Text>
                    <Text size="lg" fw={700} c={PRIMARY_BROWN}>
                      {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                    </Text>
                  </Stack>
                </Group>
              </Card>

              {/* Clock Status - Intern Only */}
              {isIntern && (
                <Card shadow="xs" p="xl" radius="lg" bg="white">
                  <Stack gap="md">
                    <Group gap="sm">
                      <IconClockHour3 size={24} color={ACCENT_TAN} />
                      <Text size="xl" fw={700} c={CHARCOAL}>
                        {isClockedIn ? 'Clocked In' : 'Clocked Out'}
                      </Text>
                    </Group>
                    {isClockedIn && (
                      <Text size="2xl" fw={700} c={PRIMARY_BROWN} style={{ fontFamily: 'monospace' }}>
                        {formatElapsedTime(elapsedTime)}
                      </Text>
                    )}
                    <Button
                      size="lg"
                      radius="md"
                      leftSection={isClockedIn ? <IconPlayerStop size={20} /> : <IconPlayerPlay size={20} />}
                      style={{
                        backgroundColor: isClockedIn ? '#FA5252' : PRIMARY_BROWN,
                        color: "white",
                        alignSelf: "flex-start",
                      }}
                      onClick={isClockedIn ? handleTimeOut : handleTimeIn}
                    >
                      {isClockedIn ? 'Time Out' : 'Time In'}
                    </Button>
                  </Stack>
                </Card>
              )}

              {/* Regular Hours */}
              <Card shadow="xs" p="xl" radius="lg" bg="white">
                <Group justify="space-between" align="center">
                  <Stack gap={2}>
                    <Text size="sm" fw={500} c={MUTED_OLIVE}>
                      Regular hours
                    </Text>
                    <Text size="xl" fw={700} c={CHARCOAL}>
                      30h 31m
                    </Text>
                  </Stack>
                  <Text
                    size="sm"
                    c={PRIMARY_BROWN}
                    style={{ cursor: "pointer", textDecoration: "underline" }}
                    onClick={() => setActiveTab('timesheets')}
                  >
                    See my time
                  </Text>
                </Group>
              </Card>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="timesheets">
            <Card shadow="xs" p="xl" radius="lg" bg="white">
              <Stack gap="md">
                <Text size="lg" fw={700} c={CHARCOAL}>
                  Timesheet
                </Text>
                
                {isSecretary && !selectedIntern && (
                  <Center py="xl">
                    <Text c={MUTED_OLIVE}>Please select an intern to view their timesheet</Text>
                  </Center>
                )}

                {loadingTimesheet ? (
                  <Center py="xl">
                    <Loader size="sm" color={PRIMARY_BROWN} />
                  </Center>
                ) : (isIntern || (isSecretary && selectedIntern)) ? (
                  <Box style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #E8E8E8' }}>
                          <th style={{ 
                            padding: '12px 16px', 
                            textAlign: 'left', 
                            fontSize: '12px', 
                            fontWeight: 700, 
                            color: MUTED_OLIVE, 
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            borderBottom: '1px solid #E8E8E8'
                          }}>
                            Date
                          </th>
                          <th style={{ 
                            padding: '12px 16px', 
                            textAlign: 'center', 
                            fontSize: '12px', 
                            fontWeight: 700, 
                            color: MUTED_OLIVE, 
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            borderBottom: '1px solid #E8E8E8'
                          }}>
                            Time In
                          </th>
                          <th style={{ 
                            padding: '12px 16px', 
                            textAlign: 'center', 
                            fontSize: '12px', 
                            fontWeight: 700, 
                            color: MUTED_OLIVE, 
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            borderBottom: '1px solid #E8E8E8'
                          }}>
                            Time Out
                          </th>
                          <th style={{ 
                            padding: '12px 16px', 
                            textAlign: 'center', 
                            fontSize: '12px', 
                            fontWeight: 700, 
                            color: MUTED_OLIVE, 
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            borderBottom: '1px solid #E8E8E8'
                          }}>
                            Duration
                          </th>
                          <th style={{ 
                            padding: '12px 16px', 
                            textAlign: 'center', 
                            fontSize: '12px', 
                            fontWeight: 700, 
                            color: MUTED_OLIVE, 
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            borderBottom: '1px solid #E8E8E8'
                          }}>
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {internTimesheet.length === 0 ? (
                          <tr>
                            <td colSpan={5} style={{ 
                              padding: '24px 16px', 
                              textAlign: 'center', 
                              color: MUTED_OLIVE,
                              fontSize: '13px'
                            }}>
                              No time entries yet
                            </td>
                          </tr>
                        ) : (
                          internTimesheet.map((entry) => (
                            <tr key={entry._id}>
                              <td style={{ 
                                padding: '12px 16px', 
                                borderBottom: '1px solid #F0F0F0',
                                color: CHARCOAL,
                                fontSize: '13px'
                              }}>
                                {formatDate(new Date(entry.timeIn))}
                              </td>
                              <td style={{ 
                                padding: '12px 16px', 
                                textAlign: 'center', 
                                borderBottom: '1px solid #F0F0F0',
                                color: CHARCOAL,
                                fontSize: '13px'
                              }}>
                                {formatTime(new Date(entry.timeIn))}
                              </td>
                              <td style={{ 
                                padding: '12px 16px', 
                                textAlign: 'center', 
                                borderBottom: '1px solid #F0F0F0',
                                color: CHARCOAL,
                                fontSize: '13px'
                              }}>
                                {entry.timeOut ? formatTime(new Date(entry.timeOut)) : '--'}
                              </td>
                              <td style={{ 
                                padding: '12px 16px', 
                                textAlign: 'center', 
                                borderBottom: '1px solid #F0F0F0',
                                color: CHARCOAL,
                                fontSize: '13px'
                              }}>
                                {formatElapsedTime(entry.duration)}
                              </td>
                              <td style={{ 
                                padding: '12px 16px', 
                                textAlign: 'center', 
                                borderBottom: '1px solid #F0F0F0',
                                fontSize: '13px'
                              }}>
                                <Badge 
                                  color={entry.status === 'approved' ? 'green' : entry.status === 'rejected' ? 'red' : 'yellow'}
                                  variant="light"
                                >
                                  {entry.status}
                                </Badge>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </Box>
                ) : null}
              </Stack>
            </Card>
          </Tabs.Panel>
        </Tabs>
      </Box>

      {/* Time Out Confirmation Modal */}
      <Modal
        opened={showTimeOutModal}
        onClose={() => setShowTimeOutModal(false)}
        title="Confirm Time Out"
        centered
      >
        <Stack gap="md">
          <Text size="sm" c={MUTED_OLIVE}>
            Please review your time entry before submitting:
          </Text>
          
          <Card shadow="xs" p="md" radius="md" bg="#F5F5F5">
            <Stack gap="xs">
              <Group justify="space-between">
                <Text size="sm" fw={600} c={CHARCOAL}>Date:</Text>
                <Text size="sm" c={CHARCOAL}>{formatDate(new Date(clockedInTime))}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" fw={600} c={CHARCOAL}>Time In:</Text>
                <Text size="sm" c={CHARCOAL}>{formatTime(new Date(clockedInTime))}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" fw={600} c={CHARCOAL}>Time Out:</Text>
                <Text size="sm" c={CHARCOAL}>{formatTime(new Date())}</Text>
              </Group>
              <Divider />
              <Group justify="space-between">
                <Text size="sm" fw={700} c={PRIMARY_BROWN}>Total Duration:</Text>
                <Text size="lg" fw={700} c={PRIMARY_BROWN}>{formatElapsedTime(elapsedTime)}</Text>
              </Group>
            </Stack>
          </Card>

          <Group justify="flex-end" gap="sm">
            <Button
              variant="outline"
              onClick={() => setShowTimeOutModal(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              style={{ backgroundColor: PRIMARY_BROWN }}
              onClick={handleSubmitTimeEntry}
              loading={submitting}
            >
              Submit to Secretary
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
}
