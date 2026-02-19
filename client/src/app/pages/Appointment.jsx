import React, { useState } from "react";
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
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { IconCalendarClock, IconClock, IconPhone, IconUser, IconArrowRight } from "@tabler/icons-react";
import { SignupHero } from "./auth/Signup/Hero";
import { PRIMARY_BROWN, PRIMARY_GOLD, MUTED_OLIVE, CHARCOAL } from "@/utils/constants";
import apiClient from "@/config/api/apiClient";
import { notifications } from "@mantine/notifications";

export default function Appointment() {
  const [submitting, setSubmitting] = useState(false);
  const timeSlots = [
    { value: "09:00", label: "9:00 AM" },
    { value: "09:30", label: "9:30 AM" },
    { value: "10:00", label: "10:00 AM" },
    { value: "10:30", label: "10:30 AM" },
    { value: "11:00", label: "11:00 AM" },
    { value: "11:30", label: "11:30 AM" },
    { value: "13:00", label: "1:00 PM" },
    { value: "13:30", label: "1:30 PM" },
    { value: "14:00", label: "2:00 PM" },
    { value: "14:30", label: "2:30 PM" },
    { value: "15:00", label: "3:00 PM" },
    { value: "15:30", label: "3:30 PM" },
    { value: "16:00", label: "4:00 PM" },
    { value: "16:30", label: "4:30 PM" },
    { value: "17:00", label: "5:00 PM" },
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
        return /^09\d{9}$/.test(numeric)
          ? null
          : "Enter an 11-digit PH mobile (starts with 09)";
      },
      appointmentDate: (value) => (value ? null : "Select a date"),
      appointmentTime: (value) => (value ? null : "Select a time"),
    },
  });

  const handleSubmit = (values) => {
    setSubmitting(true);
    const dateValue = values.appointmentDate instanceof Date
      ? values.appointmentDate
      : values.appointmentDate
        ? new Date(values.appointmentDate)
        : null;

    const payload = {
      fullName: values.fullName?.trim(),
      phone: values.phone,
      appointmentDate: dateValue ? dateValue.toISOString() : null,
      appointmentTime: values.appointmentTime,
    };

    apiClient.post("/clientsinfo/public-appointment", payload)
      .then(() => {
        notifications.show({
          title: "Appointment requested",
          message: "We received your request and will confirm shortly.",
          color: "green",
        });
        form.reset();
        form.setFieldValue("phone", "09");
        try {
          // notify other tabs/pages (admin) to refresh silently
          localStorage.setItem('appointments_needs_refresh', Date.now().toString());
          window.dispatchEvent(new Event('appointments_needs_refresh'));
        } catch (_) {}
      })
      .catch((err) => {
        const msg = err?.response?.data?.message || "Failed to submit appointment";
        notifications.show({ title: "Error", message: msg, color: "red" });
      })
      .finally(() => setSubmitting(false));
  };

  return (
    <Box h="100vh" style={{ overflow: "hidden", backgroundColor: "#f8f6f3" }}>
      <Grid h="100%" gutter={0}>
        <SignupHero />

        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper
            h="100vh"
            withBorder={false}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "white",
              padding: "3rem",
            }}
          >
            <Stack w="100%" maw={480} spacing="xl">
              <Stack gap={4} align="flex-start">
                <Text size="sm" fw={600} c={PRIMARY_GOLD} tt="uppercase" lts={1.5}>
                  Book an Appointment
                </Text>
                <Title order={2} c={CHARCOAL}>
                  Schedule your legal consultation
                </Title>
                <Text size="sm" c={MUTED_OLIVE}>
                  Share your details and preferred date. Our team will confirm your slot and follow up with next steps.
                </Text>
              </Stack>

              <Divider color="#eee" />

              <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack spacing="md">
                  <TextInput
                    label="Full Name"
                    placeholder="Juan Dela Cruz"
                    required
                    leftSection={<IconUser size={18} color={PRIMARY_BROWN} />}
                    {...form.getInputProps("fullName")}
                  />

                  <TextInput
                    label="Phone Number (Philippines)"
                    placeholder="09XXXXXXXXX"
                    required
                    leftSection={<IconPhone size={18} color={PRIMARY_BROWN} />}
                    maxLength={11}
                    inputMode="numeric"
                    {...form.getInputProps("phone")}
                    onChange={(event) => {
                      const digits = event.currentTarget.value.replace(/\D/g, "");
                      const normalized = (digits.startsWith("09") ? digits : `09${digits.replace(/^0+/, "")}`).slice(0, 11);
                      form.setFieldValue("phone", normalized);
                    }}
                  />

                  <DatePickerInput
                    label="Preferred Date"
                    placeholder="Select date"
                    required
                    leftSection={<IconCalendarClock size={18} color={PRIMARY_BROWN} />}
                    minDate={new Date()}
                    {...form.getInputProps("appointmentDate")}
                  />

                  <Select
                    label="Preferred Time"
                    placeholder="Select time"
                    required
                    data={timeSlots}
                    leftSection={<IconClock size={18} color={PRIMARY_BROWN} />}
                    {...form.getInputProps("appointmentTime")}
                  />

                  <Group justify="space-between" mt="md">
                    <Text size="xs" c={MUTED_OLIVE}>
                      We typically confirm within 24 hours.
                    </Text>
                    <Button
                      type="submit"
                      size="md"
                      radius="md"
                      color={PRIMARY_BROWN}
                      rightSection={<IconArrowRight size={16} />}
                      loading={submitting}
                      disabled={submitting}
                    >
                      Request Appointment
                    </Button>
                  </Group>
                </Stack>
              </form>
            </Stack>
          </Paper>
        </Grid.Col>
      </Grid>
    </Box>
  );
}
