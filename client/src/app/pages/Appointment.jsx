import React, { useState } from "react";
import { useMediaQuery } from "@mantine/hooks";
import {
  Box,
  Grid,
  Paper,
  Title,
  Text,
  TextInput,
  Select,
  Button,
  Stack,
  Group,
  Divider,
  Container,
  ThemeIcon,
  Center,
  Transition,
  Alert
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { 
  IconCalendarClock, 
  IconClock, 
  IconPhone, 
  IconUser, 
  IconArrowRight, 
  IconCheck, 
  IconInfoCircle,
  IconGavel,
  IconCalendarEvent,
  IconArrowLeft
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { useNavigate } from "react-router-dom";
import { PRIMARY_BROWN, PRIMARY_GOLD, MUTED_OLIVE, CHARCOAL, BG } from "@/utils/constants";
import apiClient from "@/config/api/apiClient";
import lawImage from "@/assets/images/law.jpg"; // Assuming this path is correct based on Hero.jsx usage

// --- Custom Hero Component for Appointment ---
const AppointmentHero = () => {
  return (
    <Grid.Col span={{ base: 12, md: 6 }} visibleFrom="md">
      <Paper
        h="100vh"
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          backgroundImage: `linear-gradient(135deg, rgba(139, 69, 19, 0.95), rgba(44, 44, 44, 0.9)), url(${lawImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          padding: "4rem",
          position: "relative",
          borderRadius: 0,
          border: 'none'
        }}
      >
        <Box style={{ position: "absolute", top: 40, left: 40, display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/sola_logo.png" alt="SOLA Logo" style={{ width: 40, height: 40, objectFit: 'contain' }} />
          <Box>
            <Text style={{ fontSize: 16, fontWeight: 700, color: '#fff', lineHeight: 1.1 }}>SOLA</Text>
            <Text style={{ fontSize: 9, color: 'rgba(196,171,125,0.8)', letterSpacing: 2.5, textTransform: 'uppercase' }}>Sebastinian Office of Legal Aid</Text>
          </Box>
        </Box>

        <Stack spacing="xl" style={{ position: 'relative', zIndex: 1 }}>
          <Box>
            <Text size="sm" fw={700} tt="uppercase" lts={2} c={PRIMARY_GOLD} mb="sm">
              Legal Consultation
            </Text>
            <Title order={1} c="white" size="3rem" fw={800} lh={1.1} mb="md">
              Secure Your <br />
              <Text span c={PRIMARY_GOLD} inherit>Legal Assistance</Text>
            </Title>
            <Text c="gray.3" size="lg" maw={480} lh={1.6}>
              Book a consultation with SOLA's experienced legal professionals. We are here to listen, advise, and guide you through your legal journey.
            </Text>
          </Box>

          <Stack spacing="lg" mt={30}>
            {[
              { icon: IconCalendarEvent, title: "Flexible Scheduling", desc: "Choose a time that works for you" },
              { icon: IconGavel, title: "Expert Guidance", desc: "Professional legal advice for your case" },
              { icon: IconGavel, title: "Confidential Service", desc: "Your privacy is our utmost priority" }
            ].map((item, index) => (
              <Group key={index} spacing="md">
                <ThemeIcon size={44} radius="md" color={PRIMARY_GOLD} variant="light" style={{ backgroundColor: 'rgba(196, 171, 125, 0.15)' }}>
                  <item.icon size={24} color={PRIMARY_GOLD} stroke={2} />
                </ThemeIcon>
                <Box>
                  <Text c="white" fw={600} size="md">{item.title}</Text>
                  <Text c="gray.5" size="sm">{item.desc}</Text>
                </Box>
              </Group>
            ))}
          </Stack>
        </Stack>
      </Paper>
    </Grid.Col>
  );
};

export default function Appointment() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const navigate = useNavigate();

  const timeSlots = [
    { value: "09:00", label: "9:00 AM" }, { value: "09:30", label: "9:30 AM" },
    { value: "10:00", label: "10:00 AM" }, { value: "10:30", label: "10:30 AM" },
    { value: "11:00", label: "11:00 AM" }, { value: "11:30", label: "11:30 AM" },
    { value: "13:00", label: "1:00 PM" }, { value: "13:30", label: "1:30 PM" },
    { value: "14:00", label: "2:00 PM" }, { value: "14:30", label: "2:30 PM" },
    { value: "15:00", label: "3:00 PM" }, { value: "15:30", label: "3:30 PM" },
    { value: "16:00", label: "4:00 PM" },
  ];

  const form = useForm({
    initialValues: {
      fullName: "",
      phone: "09",
      appointmentDate: null,
      appointmentTime: "",
    },
    validate: {
      fullName: (value) => (value.trim().length < 2 ? "Please enter your full name" : null),
      phone: (value) => {
        const numeric = value.replace(/\D/g, "");
        return /^09\d{9}$/.test(numeric) ? null : "Enter a valid 11-digit PH mobile number";
      },
      appointmentDate: (value) => {
        if (!value) return "Please select a date";
        const d = value instanceof Date ? value : new Date(value);
        const day = d.getDay();
        return (day === 0 || day === 6) ? 'Weekends are not available' : null;
      },
      appointmentTime: (value) => (value ? null : "Please select a time"),
    },
  });

  const handleSubmit = (values) => {
    setSubmitting(true);
    const dateValue = values.appointmentDate instanceof Date ? values.appointmentDate : new Date(values.appointmentDate);

    const payload = {
      fullName: values.fullName?.trim(),
      phone: values.phone,
      appointmentDate: dateValue.toISOString(),
      appointmentTime: values.appointmentTime,
    };

    apiClient.post("/clientsinfo/public-appointment", payload)
      .then(() => {
        setSubmitted(true);
        notifications.show({
          title: "Request Sent",
          message: "Your appointment request has been received.",
          color: "green",
          icon: <IconCheck size={16} />,
        });
        form.reset();
        
        // Notify other tabs
        try {
          localStorage.setItem('appointments_needs_refresh', Date.now().toString());
          window.dispatchEvent(new Event('appointments_needs_refresh'));
        } catch (_) {}
      })
      .catch((err) => {
        const msg = err?.response?.data?.message || "Failed to submit appointment";
        notifications.show({ title: "Submission Failed", message: msg, color: "red" });
      })
      .finally(() => setSubmitting(false));
  };

  const resetForm = () => {
    setSubmitted(false);
    form.setValues({
      fullName: "",
      phone: "09",
      appointmentDate: null,
      appointmentTime: "",
    });
  };

  const sameDay = (a, b) => {
    if (!a || !b) return false;
    const da = a instanceof Date ? a : new Date(a);
    const db = b instanceof Date ? b : new Date(b);
    return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
  };

  return (
    <Box style={{ minHeight: "100vh", backgroundColor: "#fcfcfc" }}>
      <Button
        variant="default"
        radius="xl"
        size="sm"
        leftSection={<IconArrowLeft size={16} />}
        style={{ 
          position: 'fixed', 
          top: 20, 
          right: 20, 
          zIndex: 1000,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: 'none',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(4px)'
        }}
        onClick={() => navigate('/')}
      >
        Back to Home
      </Button>

      <Grid gutter={0} style={{ minHeight: '100vh' }}>
        
        {/* Left Side - Hero Section */}
        <AppointmentHero />

        {/* Right Side - Form Section */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Box 
            style={{ 
              height: '100vh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative'
            }}
          >
            {/* Mobile Header (Only visible on small screens) */}
            {isMobile && (
              <Box bg={PRIMARY_BROWN} p="xl" pb={40}>
                <Text size="xs" fw={700} c={PRIMARY_GOLD} tt="uppercase" mb={8}>SOLA Legal Aid</Text>
                <Title order={2} c="white" lh={1.2}>Schedule Consultation</Title>
                <Text c="white" size="sm" mt={8} opacity={0.9}>Book your appointment in less than 2 minutes.</Text>
              </Box>
            )}

            <Center style={{ flex: 1, padding: isMobile ? '0' : '3rem', marginTop: isMobile ? -20 : 0 }}>
              <Container size="sm" w="100%" px={isMobile ? 'md' : 0}>
                <Paper 
                  radius="lg" 
                  shadow={isMobile ? "md" : "none"} 
                  p={isMobile ? "xl" : 0} 
                  bg="white"
                  style={{ border: isMobile ? '1px solid #eee' : 'none' }}
                >
                  
                  {!submitted ? (
                    <Box>
                      {!isMobile && (
                        <Box mb={40}>
                          <Group mb="xs">
                            <ThemeIcon size="lg" radius="md" color={PRIMARY_BROWN} variant="light">
                              <IconCalendarClock size={20} />
                            </ThemeIcon>
                            <Text size="sm" fw={700} c={PRIMARY_GOLD} tt="uppercase" lts={1}>
                              Appointment Request
                            </Text>
                          </Group>
                          <Title order={2} c={CHARCOAL} fw={800} mb="sm">
                            Let's find a time.
                          </Title>
                          <Text c={MUTED_OLIVE}>
                            Please fill out the form below. Our team will review your request and confirm your appointment via SMS or call.
                          </Text>
                        </Box>
                      )}

                      <form onSubmit={form.onSubmit(handleSubmit)}>
                        <Stack spacing="lg">
                          
                          <Box>
                            <Text size="sm" fw={600} c={CHARCOAL} mb={4}>Personal Details</Text>
                            <Stack spacing="md">
                              <TextInput
                                placeholder="Juan Dela Cruz"
                                size="md"
                                radius="md"
                                leftSection={<IconUser size={18} color={PRIMARY_BROWN} />}
                                styles={{ input: { border: '1px solid #eee', backgroundColor: '#f9f9f9' } }}
                                {...form.getInputProps("fullName")}
                              />

                              <TextInput
                                placeholder="09XXXXXXXXX"
                                size="md"
                                radius="md"
                                leftSection={<IconPhone size={18} color={PRIMARY_BROWN} />}
                                maxLength={11}
                                inputMode="numeric"
                                description="We will use this number to confirm your appointment."
                                styles={{ input: { border: '1px solid #eee', backgroundColor: '#f9f9f9' } }}
                                {...form.getInputProps("phone")}
                                onChange={(event) => {
                                  const digits = event.currentTarget.value.replace(/\D/g, "");
                                  const normalized = (digits.startsWith("09") ? digits : `09${digits.replace(/^0+/, "")}`).slice(0, 11);
                                  form.setFieldValue("phone", normalized);
                                }}
                              />
                            </Stack>
                          </Box>

                          <Divider color="gray.2" />

                          <Box>
                            <Text size="sm" fw={600} c={CHARCOAL} mb={4}>Preferred Schedule</Text>
                            <Grid gutter="md">
                              <Grid.Col span={{ base: 12, sm: 6 }}>
                                <DatePickerInput
                                  placeholder="Select date"
                                  size="md"
                                  radius="md"
                                  leftSection={<IconCalendarEvent size={18} color={PRIMARY_BROWN} />}
                                  minDate={new Date()}
                                  styles={{ input: { border: '1px solid #eee', backgroundColor: '#f9f9f9' } }}
                                  excludeDate={(date) => {
                                    const d = date instanceof Date ? date : new Date(date);
                                    const day = d.getDay();
                                    return day === 0 || day === 6;
                                  }}
                                  value={form.values.appointmentDate}
                                  onChange={(date) => {
                                    if (!date) {
                                      form.setFieldValue('appointmentDate', null);
                                      return;
                                    }
                                    const d = date instanceof Date ? date : new Date(date);
                                    const day = d.getDay();
                                    if (day === 0 || day === 6) {
                                      notifications.show({ title: 'Unavailable', message: 'Weekends are not available. Please pick a weekday.', color: 'red' });
                                      return;
                                    }
                                    form.setFieldValue('appointmentDate', d);
                                  }}
                                  getDayProps={(date) => {
                                    const d = date instanceof Date ? date : new Date(date);
                                    const day = d.getDay();
                                    const isWeekend = day === 0 || day === 6;
                                    const isSelected = sameDay(d, form.values.appointmentDate);
                                    const style = isSelected
                                      ? { backgroundColor: PRIMARY_BROWN, color: 'white' }
                                      : isWeekend
                                        ? { color: '#b91c1c', backgroundColor: '#F3F4F6' }
                                        : {};
                                    return { style };
                                  }}
                                  {...form.getInputProps("appointmentDate")}
                                />
                              </Grid.Col>
                              <Grid.Col span={{ base: 12, sm: 6 }}>
                                <Select
                                  placeholder="Select time"
                                  size="md"
                                  radius="md"
                                  data={timeSlots}
                                  leftSection={<IconClock size={18} color={PRIMARY_BROWN} />}
                                  styles={{ input: { border: '1px solid #eee', backgroundColor: '#f9f9f9' } }}
                                  {...form.getInputProps("appointmentTime")}
                                />
                              </Grid.Col>
                            </Grid>
                          </Box>

                          <Alert 
                            icon={<IconInfoCircle size={16} />} 
                            title="Important Note" 
                            color="gray" 
                            variant="light" 
                            radius="md"
                            styles={{ root: { backgroundColor: '#f8f9fa' } }}
                          >
                            This is a request for an appointment. You will receive a confirmation message once your schedule is approved.
                          </Alert>

                          <Button
                            type="submit"
                            size="lg"
                            radius="md"
                            color={PRIMARY_BROWN}
                            fullWidth
                            loading={submitting}
                            rightSection={<IconArrowRight size={18} />}
                            mt="sm"
                          >
                            Submit Request
                          </Button>
                        </Stack>
                      </form>
                    </Box>
                  ) : (
                    <Box py="xl">
                      <Stack align="center" spacing="lg" ta="center">
                        <ThemeIcon size={80} radius="xl" color="green" variant="light">
                          <IconCheck size={40} stroke={2} />
                        </ThemeIcon>
                        <Box>
                          <Title order={3} c={CHARCOAL} mb="xs">Request Received!</Title>
                          <Text c={MUTED_OLIVE} maw={400} mx="auto">
                            Thank you, <b>{form.values.fullName}</b>. We have received your appointment request for <b>{form.values.appointmentDate?.toLocaleDateString()}</b> at <b>{timeSlots.find(t => t.value === form.values.appointmentTime)?.label}</b>.
                          </Text>
                        </Box>
                        
                        <Paper withBorder p="md" radius="md" bg="gray.0" w="100%">
                          <Group gap="xs" justify="center" c="dimmed">
                            <IconInfoCircle size={16} />
                            <Text size="xs">Please keep your line open for confirmation.</Text>
                          </Group>
                        </Paper>

                        <Button 
                          variant="subtle" 
                          color={PRIMARY_BROWN} 
                          onClick={resetForm}
                          mt="md"
                        >
                          Book Another Appointment
                        </Button>
                      </Stack>
                    </Box>
                  )}

                </Paper>
              </Container>
            </Center>
            
            {/* Footer / Copyright */}
            <Box p="md" ta="center">
              <Text size="xs" c="dimmed">© {new Date().getFullYear()} SOLA — Sebastinian Office of Legal Aid. All rights reserved.</Text>
            </Box>

          </Box>
        </Grid.Col>
      </Grid>
    </Box>
  );
}
