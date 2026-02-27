import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { IconChevronRight, IconChevronLeft, IconCircleCheck, IconFileText, IconCheck, IconTrash, IconRefresh } from '@tabler/icons-react';
import { Button, Stepper, Group, Box, Text, Title, Paper, Stack, Divider, Container, Tooltip, ActionIcon } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { PRIMARY_GOLD, PRIMARY_BROWN, MUTED_OLIVE, BG, CHARCOAL } from '@utils/constants';
import PersonalDetailsForm from '@components/forms/steps/PersonalDetails';
import FinancialDetailsForm from '@components/forms/steps/FinancialDetails';
import CaseDetailsForm from '@components/forms/steps/CaseDetails';
import ReviewForm from '@components/forms/steps/ReviewForm';
import apiClient from '@config/api/apiClient';

const FORM_STORAGE_KEY = 'justreach_form_draft';
const PROFILE_STORAGE_KEY = 'justreach_user_profile';

// Fields that should persist across submissions (personal & financial info)
const PERSISTENT_FIELDS = [
  'name', 'age', 'birthday', 'contactNumber', 'cellphoneNumber', 'telephoneNumber',
  'presentAddressTelephone', 'permanentAddressTelephone',
  'sex', 'civilStatus', 'citizenship',
  'presentAddress', 'permanentAddress', 'throughRelator', 'relatorName', 'relationshipToClient',
  'currentSourceOfIncome', 'monthlyIncome', 'natureOfWork',
  'employerName', 'employerAddress', 'employerTelephone',
  'spouse', 'spouseSourceOfIncome', 'spouseMonthlyIncome', 'spouseEmployerAddress',
];

// Read saved data synchronously before form init
function loadSavedData() {
  try {
    const draft = localStorage.getItem(FORM_STORAGE_KEY);
    if (draft) return { data: JSON.parse(draft), source: 'draft' };
    const profile = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (profile) return { data: JSON.parse(profile), source: 'profile' };
  } catch (e) {
    console.error('Error loading saved form data:', e);
  }
  return null;
}

export default function UserForm() {
  const [active, setActive] = useState(0);
  const [formData, setFormData] = useState({});
  const notifiedRef = useRef(false);
  const savedRef = useRef(loadSavedData());
  
  const { register, handleSubmit, formState: { errors }, trigger, getValues, setValue, watch, reset } = useForm({
    mode: 'onChange',
    defaultValues: {
      appointedDate: '',
      appointmentTime: '',
      throughRelator: 'no',
      relatorName: '',
      relationshipToClient: '',
      ...(savedRef.current?.data || {}),
    }
  });
  
  const totalSteps = 4;
  
  // Restore saved data on mount and force-populate all inputs
  useEffect(() => {
    if (savedRef.current && !notifiedRef.current) {
      notifiedRef.current = true;
      const { data, source } = savedRef.current;
      setFormData(data);

      // Force all registered inputs to display saved values
      reset({
        appointedDate: '',
        appointmentTime: '',
        throughRelator: 'no',
        relatorName: '',
        relationshipToClient: '',
        ...data,
      });

      notifications.show({
        title: source === 'draft' ? 'Draft Restored' : 'Profile Loaded',
        message: source === 'draft'
          ? 'Your previous form draft has been restored'
          : 'Your saved personal details have been pre-filled',
        color: 'blue',
        icon: <IconCircleCheck size={18} />,
      });
    }
  }, []);
  
  // Save form data to localStorage whenever it changes
  useEffect(() => {
    const currentData = { ...formData, ...getValues() };
    if (Object.keys(currentData).length > 0) {
      localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(currentData));
    }
  }, [formData, active]);
  
  // Clear saved form data
  const clearSavedData = () => {
    localStorage.removeItem(FORM_STORAGE_KEY);
    reset();
    setFormData({});
    setActive(0);
    notifications.show({
      title: 'Form Cleared',
      message: 'All saved form data has been cleared',
      color: 'orange',
    });
  };
  
  const nextStep = async () => {
    let fieldsToValidate = [];
    
    if (active === 0) {
      fieldsToValidate = ['name', 'age', 'birthday', 'contactNumber', 'sex', 'civilStatus', 'citizenship', 'presentAddress', 'permanentAddress'];
      const throughRelator = getValues().throughRelator;
      if (throughRelator === 'yes') {
        fieldsToValidate.push('relatorName', 'relationshipToClient');
      }
    } else if (active === 1) {
      fieldsToValidate = ['currentSourceOfIncome', 'monthlyIncome', 'natureOfWork', 'employerName', 'employerAddress'];
    } else if (active === 2) {
      fieldsToValidate = ['partyRepresented', 'venue', 'caseNumber', 'presentStage', 'caseNature', 'courtDivision', 'courtAddress', 'presidingOfficer'];
    }
    
    const isValid = await trigger(fieldsToValidate);
    
    if (isValid) {
      const currentData = { ...formData, ...getValues() };
      setFormData(currentData);
      localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(currentData));
      setActive(active + 1);
    }
  };
  
  const prevStep = () => {
    const currentData = { ...formData, ...getValues() };
    setFormData(currentData);
    localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(currentData));
    setActive(active - 1);
  };
  
  const onSubmit = async (data) => {
    // Get all current form values including those set by setValue
    const currentFormValues = getValues();
    const finalData = { ...formData, ...currentFormValues, ...data };
    
    console.log('Final data before normalization:', finalData);

    // Normalize key names to ensure DB gets these fields
    const fullName =
      finalData.name ||
      `${finalData.firstName || ''} ${finalData.lastName || ''}`.trim() ||
      `${finalData.givenName || ''} ${finalData.familyName || ''}`.trim();

    const caseNumber =
      finalData.caseNumber ||
      finalData.case_number ||
      finalData.caseNo ||
      finalData.case_no ||
      '';

    const appointedDate =
      finalData.appointedDate ||
      finalData.appointmentDate ||
      finalData.dateSubmitted;
    
    // Only use current date as fallback if NO date was provided at all
    const finalAppointedDate = appointedDate || new Date().toISOString();
    
    const appointmentTime =
      finalData.appointmentTime || '';
    
    console.log('appointedDate extracted:', appointedDate);
    console.log('finalAppointedDate:', finalAppointedDate);

    // Build payload sent to server (include full form for completeness)
    const payloadToSave = {
      ...finalData,
      fullName,
      caseNumber,
      spouseName: finalData.spouse || finalData.spouseName || undefined,
      appointedDate: finalAppointedDate,
      appointmentTime,
      submittedAt: new Date().toISOString(),
    };

    console.log('Form submitted payload:', payloadToSave);
    console.log('Appointment Date:', finalAppointedDate);
    console.log('Appointment Time:', appointmentTime);

    try {
      const resp = await apiClient.post('/clientsinfo', payloadToSave);
      const success = resp?.data?.success ?? (resp.status >= 200 && resp.status < 300);
      if (!success) throw new Error(resp?.data?.message || `Request failed (${resp.status})`);

      notifications.show({
        title: 'Submission Successful',
        message: `Saved ${fullName} — Case ${caseNumber} — Appointed ${new Date(appointedDate).toLocaleString()}`,
        color: 'green',
        icon: <IconCheck size={18} />,
        autoClose: 6000,
      });

      // Save personal & financial details for future pre-filling
      const profileData = {};
      PERSISTENT_FIELDS.forEach(field => {
        if (finalData[field] !== null && finalData[field] !== undefined && finalData[field] !== '') {
          profileData[field] = finalData[field];
        }
      });
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profileData));

      // Clear the draft but keep profile
      localStorage.removeItem(FORM_STORAGE_KEY);
      // Reset form with profile data pre-filled for next appointment
      reset({
        appointedDate: '',
        appointmentTime: '',
        throughRelator: profileData.throughRelator || 'no',
        relatorName: profileData.relatorName || '',
        relationshipToClient: profileData.relationshipToClient || '',
        ...profileData,
        // Clear case-specific fields
        partyRepresented: '', venue: '', caseNumber: '', presentStage: '',
        caseNature: '', courtDivision: '', courtAddress: '', presidingOfficer: '',
        adverseParty: '', adversePartyAddress: '', adversePartyCounsel: '',
      });
      setFormData(profileData);
      setActive(0);
    } catch (error) {
      console.error('Submit error:', error);
      // fallback: attempt direct fetch if apiClient not configured
      try {
        const fallback = await fetch('/api/clientsinfo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payloadToSave),
        });
        if (!fallback.ok) throw new Error(await fallback.text());

        notifications.show({
          title: 'Submission Successful (fallback)',
          message: `Saved ${fullName} — Case ${caseNumber}`,
          color: 'green',
          icon: <IconCheck size={18} />,
          autoClose: 6000,
        });

        // Save personal & financial details for future pre-filling
        const profileData = {};
        PERSISTENT_FIELDS.forEach(field => {
          if (finalData[field] !== null && finalData[field] !== undefined && finalData[field] !== '') {
            profileData[field] = finalData[field];
          }
        });
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profileData));

        localStorage.removeItem(FORM_STORAGE_KEY);
        // Reset form with profile data pre-filled for next appointment
        reset({
          appointedDate: '',
          appointmentTime: '',
          throughRelator: profileData.throughRelator || 'no',
          relatorName: profileData.relatorName || '',
          relationshipToClient: profileData.relationshipToClient || '',
          ...profileData,
          partyRepresented: '', venue: '', caseNumber: '', presentStage: '',
          caseNature: '', courtDivision: '', courtAddress: '', presidingOfficer: '',
          adverseParty: '', adversePartyAddress: '', adversePartyCounsel: '',
        });
        setFormData(profileData);
        setActive(0);
        return;
      } catch (fallbackErr) {
        console.error('Fallback submit error:', fallbackErr);
      }

      notifications.show({
        title: 'Error',
        message: `Failed to submit: ${error?.message || 'unknown error'}`,
        color: 'red',
        autoClose: 7000,
      });
    }
  };
  
  const handleFormSubmit = () => {
    // Get current values before submitting
    const currentValues = getValues();
    console.log('Current form values before submit:', currentValues);
    console.log('appointedDate from getValues:', currentValues.appointedDate);
    console.log('appointmentTime from getValues:', currentValues.appointmentTime);
    
    handleSubmit(onSubmit)();
  };
  
  const renderStep = () => {
    switch (active) {
      case 0:
        return <PersonalDetailsForm register={register} errors={errors} setValue={setValue} watch={watch} />;
      case 1:
        return <FinancialDetailsForm register={register} errors={errors} setValue={setValue} watch={watch} />;
      case 2:
        return <CaseDetailsForm register={register} errors={errors} watch={watch} setValue={setValue} />;
      case 3:
        return <ReviewForm formData={formData} getValues={getValues} setValue={setValue} />;
      default:
        return null;
    }
  };
  
  return (
    <Box bg={BG} mih="100vh" py="xl">
      <style>
        {`
          ::-webkit-scrollbar { width: 8px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: ${MUTED_OLIVE}; border-radius: 4px; }
          ::-webkit-scrollbar-thumb:hover { background: ${PRIMARY_BROWN}; }
          * { scrollbar-width: thin; scrollbar-color: ${MUTED_OLIVE} transparent; }
        `}
      </style>
      <Container size="xl">
        {/* Clean Page Header */}
        <Group justify="space-between" align="flex-start" mb="lg">
          <Box>
            <Group gap="sm" align="center" mb={4}>
              <Box style={{
                width: 36, height: 36, borderRadius: 9,
                background: PRIMARY_BROWN,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <IconFileText size={18} color="white" stroke={2.5} />
              </Box>
              <Box>
                <Title order={3} c={CHARCOAL} lh={1.2}>
                  Client's Information Sheet
                </Title>
                <Text size="sm" c={MUTED_OLIVE} mt={2}>
                  Sebastinian Office of Legal Aid (SOLA) — College of Law
                </Text>
              </Box>
            </Group>
          </Box>
          {localStorage.getItem(FORM_STORAGE_KEY) && (
            <Tooltip label="Clear all saved form data">
              <ActionIcon
                variant="light"
                color="red"
                size="md"
                radius="md"
                onClick={clearSavedData}
              >
                <IconTrash size={16} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>

        {/* Form Paper */}
        <Paper shadow="xs" p="xl" radius="lg" bg="white" style={{ border: '1px solid #F0F0F0' }}>
          <Stack gap="xl">
            {/* Stepper */}
            <Stepper
              active={active}
              color={PRIMARY_BROWN}
              completedIcon={<IconCircleCheck size={20} />}
              styles={{
                step: { padding: '8px' },
                stepIcon: { borderWidth: '2px' },
                separator: { marginLeft: '8px', marginRight: '8px', height: '2px' },
                stepLabel: { fontWeight: 600, fontSize: '14px' },
                stepDescription: { fontSize: '12px', color: MUTED_OLIVE },
              }}
            >
              <Stepper.Step label="Personal" description="Personal Details">
                {active === 0 && renderStep()}
              </Stepper.Step>

              <Stepper.Step label="Financial" description="Financial Details">
                {active === 1 && renderStep()}
              </Stepper.Step>

              <Stepper.Step label="Case Details" description="Case Information">
                {active === 2 && renderStep()}
              </Stepper.Step>

              <Stepper.Step label="Review" description="Review & Submit">
                {active === 3 && renderStep()}
              </Stepper.Step>
            </Stepper>

            <Divider color="#F0F0F0" />

            {/* Navigation Buttons */}
            <Group justify="space-between">
              {active > 0 ? (
                <Button
                  variant="default"
                  leftSection={<IconChevronLeft size={18} />}
                  onClick={prevStep}
                  size="md"
                  radius="md"
                  styles={{
                    root: { borderColor: '#E0E0E0', color: MUTED_OLIVE },
                  }}
                >
                  Previous
                </Button>
              ) : (
                <Box />
              )}

              {active < totalSteps - 1 ? (
                <Button
                  rightSection={<IconChevronRight size={18} />}
                  onClick={nextStep}
                  size="md"
                  radius="md"
                  style={{ backgroundColor: PRIMARY_BROWN }}
                >
                  Next Step
                </Button>
              ) : (
                <Button
                  leftSection={<IconCircleCheck size={18} />}
                  onClick={handleFormSubmit}
                  size="md"
                  radius="md"
                  style={{ backgroundColor: PRIMARY_BROWN }}
                >
                  Submit Application
                </Button>
              )}
            </Group>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}