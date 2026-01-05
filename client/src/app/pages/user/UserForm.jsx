import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { IconChevronRight, IconChevronLeft, IconCircleCheck, IconFileText, IconCheck, IconTrash, IconAlertCircle } from '@tabler/icons-react';
import { Button, Stepper, Group, Box, Text, Title, Paper, Stack, Divider, Container, Tooltip, Modal } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { PRIMARY_GOLD, PRIMARY_BROWN, MUTED_OLIVE, THEMED_LIGHT_BG, CHARCOAL } from '@utils/constants';
// Import the separated form components
import PersonalDetailsForm from '@components/forms/steps/PersonalDetails';
import FinancialDetailsForm from '@components/forms/steps/FinancialDetails';
import CaseDetailsForm from '@components/forms/steps/CaseDetails';
import ReviewForm from '@components/forms/steps/ReviewForm';
import apiClient from '@config/api/apiClient'; // <--- added import

const FORM_STORAGE_KEY = 'justreach_form_draft';

export default function UserForm() {
  const [active, setActive] = useState(0);
  const [formData, setFormData] = useState({});
  const [confirmModalOpened, setConfirmModalOpened] = useState(false);
  
  const { register, handleSubmit, formState: { errors }, trigger, getValues, setValue, watch, reset } = useForm({
    mode: 'onChange'
  });
  
  const totalSteps = 4;
  
  // Load saved form data on mount
  useEffect(() => {
    const savedData = localStorage.getItem(FORM_STORAGE_KEY);
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setFormData(parsedData);
        
        // Pre-fill form fields
        Object.keys(parsedData).forEach(key => {
          if (parsedData[key] !== null && parsedData[key] !== undefined) {
            setValue(key, parsedData[key]);
          }
        });
        
        notifications.show({
          title: 'Draft Restored',
          message: 'Your previous form data has been restored',
          color: 'blue',
          icon: <IconCircleCheck size={18} />,
        });
      } catch (error) {
        console.error('Error loading saved form data:', error);
      }
    }
  }, [setValue]);
  
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
    const finalData = { ...formData, ...data };

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
      finalData.dateSubmitted ||
      new Date().toISOString();

    // Build payload sent to server (include full form for completeness)
    const payloadToSave = {
      ...finalData,
      fullName,
      caseNumber,
      appointedDate,
      submittedAt: new Date().toISOString(),
    };

    console.log('Form submitted payload:', payloadToSave);

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

      // Clear saved draft after successful submission
      localStorage.removeItem(FORM_STORAGE_KEY);
      reset();
      setFormData({});
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

        localStorage.removeItem(FORM_STORAGE_KEY);
        reset();
        setFormData({});
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
    // Validate that appointment date is selected or scheduleToday is checked
    const values = getValues();
    const hasAppointmentDate = values.appointmentDate || values.scheduleToday;
    
    if (!hasAppointmentDate) {
      notifications.show({
        title: 'Appointment Date Required',
        message: 'Please select an appointment date or check "Schedule for today" before submitting.',
        color: 'red',
        icon: <IconAlertCircle size={18} />,
        autoClose: 5000,
      });
      return;
    }
    
    // Show confirmation modal
    setConfirmModalOpened(true);
  };
  
  const confirmSubmit = () => {
    setConfirmModalOpened(false);
    handleSubmit(onSubmit)();
  };
  
  const renderStep = () => {
    switch (active) {
      case 0:
        return <PersonalDetailsForm register={register} errors={errors} setValue={setValue} watch={watch} />;
      case 1:
        return <FinancialDetailsForm register={register} errors={errors} />;
      case 2:
        return <CaseDetailsForm register={register} errors={errors} />;
      case 3:
        return <ReviewForm formData={formData} getValues={getValues} setValue={setValue} />;
      default:
        return null;
    }
  };
  
  return (
    <Box bg={THEMED_LIGHT_BG} mih="100vh" py="xl">
      <style>
        {`
          ::-webkit-scrollbar {
            width: 8px;
          }
          ::-webkit-scrollbar-track {
            background: transparent;
          }
          ::-webkit-scrollbar-thumb {
            background: ${MUTED_OLIVE};
            border-radius: 4px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: ${PRIMARY_BROWN};
          }
          * {
            scrollbar-width: thin;
            scrollbar-color: ${MUTED_OLIVE} transparent;
          }
        `}
      </style>
      <Container size="xl">
        {/* Header */}
        <Paper 
          shadow="xs" 
          p="xl" 
          mb="xl" 
          radius="lg"
          style={{ 
            background: PRIMARY_BROWN,
            border: 'none',
          }}
        >
          <Group gap="md" align="center" justify="space-between">
            <Group gap="md" align="center">
              <Box
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '12px',
                  background: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconFileText size={24} color={PRIMARY_BROWN} stroke={2.5} />
              </Box>
              <Box>
                <Title order={2} c="white" mb={4}>
                  Sebastinian Office of Legal Aid (SOLA)
                </Title>
                <Text c="rgba(255, 255, 255, 0.9)" size="sm" fw={500}>
                  College of Law - San Sebastian College Recoletos, Manila
                </Text>
              </Box>
            </Group>
            {localStorage.getItem(FORM_STORAGE_KEY) && (
              <Tooltip label="Clear all saved form data">
                <Button
                  variant="light"
                  color="red"
                  size="sm"
                  leftSection={<IconTrash size={16} />}
                  onClick={clearSavedData}
                >
                  Clear Draft
                </Button>
              </Tooltip>
            )}
          </Group>
        </Paper>

        {/* Form Paper */}
        <Paper shadow="xs" p="xl" radius="lg" bg="white">
          <Stack gap="xl">
            {/* Form Title Badge */}
            <Box style={{ textAlign: 'center' }}>
              <Paper 
                p="sm" 
                radius="md"
                style={{ 
                  display: 'inline-block',
                  backgroundColor: `${PRIMARY_GOLD}15`,
                  border: `1px solid ${PRIMARY_GOLD}`,
                }}
              >
                <Text size="sm" fw={600} c={PRIMARY_BROWN}>
                  CLIENT'S INFORMATION SHEET
                </Text>
              </Paper>
            </Box>
            
            {/* Stepper */}
            <Stepper 
              active={active} 
              color={PRIMARY_BROWN}
              completedIcon={<IconCircleCheck size={20} />}
              styles={{
                step: {
                  padding: '8px',
                },
                stepIcon: {
                  borderWidth: '2px',
                },
                separator: {
                  marginLeft: '8px',
                  marginRight: '8px',
                  height: '2px',
                },
                stepLabel: {
                  fontWeight: 600,
                  fontSize: '14px',
                },
                stepDescription: {
                  fontSize: '12px',
                  color: MUTED_OLIVE,
                },
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
                  variant="outline" 
                  leftSection={<IconChevronLeft size={20} />}
                  onClick={prevStep}
                  size="md"
                  styles={{
                    root: {
                      borderColor: '#E0E0E0',
                      color: MUTED_OLIVE,
                      '&:hover': {
                        backgroundColor: THEMED_LIGHT_BG,
                      },
                    },
                  }}
                >
                  Previous
                </Button>
              ) : (
                <Box />
              )}
              
              {active < totalSteps - 1 ? (
                <Button 
                  rightSection={<IconChevronRight size={20} />}
                  onClick={nextStep}
                  size="md"
                  style={{ 
                    backgroundColor: PRIMARY_BROWN,
                  }}
                >
                  Next Step
                </Button>
              ) : (
                <Button 
                  leftSection={<IconCircleCheck size={20} />}
                  onClick={handleFormSubmit}
                  size="md"
                  style={{ 
                    backgroundColor: PRIMARY_BROWN,
                  }}
                >
                  Submit Application
                </Button>
              )}
            </Group>
          </Stack>
        </Paper>
        
        {/* Confirmation Modal */}
        <Modal
          opened={confirmModalOpened}
          onClose={() => setConfirmModalOpened(false)}
          title={
            <Group gap="xs">
              <IconAlertCircle size={24} color={PRIMARY_BROWN} />
              <Text fw={600} size="lg" c={CHARCOAL}>Confirm Submission</Text>
            </Group>
          }
          centered
          size="md"
          styles={{
            title: {
              fontWeight: 600,
            },
          }}
        >
          <Stack gap="md">
            <Text size="sm" c={CHARCOAL}>
              Are you sure you want to submit this application? Please make sure all the information you provided is accurate and complete.
            </Text>
            
            <Divider />
            
            <Group justify="flex-end" gap="sm">
              <Button
                variant="outline"
                onClick={() => setConfirmModalOpened(false)}
                styles={{
                  root: {
                    borderColor: '#E0E0E0',
                    color: MUTED_OLIVE,
                  },
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmSubmit}
                style={{
                  backgroundColor: PRIMARY_BROWN,
                }}
                leftSection={<IconCircleCheck size={18} />}
              >
                Yes, Submit
              </Button>
            </Group>
          </Stack>
        </Modal>
      </Container>
    </Box>
  );
}