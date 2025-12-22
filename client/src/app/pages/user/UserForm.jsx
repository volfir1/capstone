import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { IconChevronRight, IconChevronLeft, IconCircleCheck, IconFileText } from '@tabler/icons-react';
import { Button, Stepper, Group, Box, Text, Title, Paper, Stack, Divider, Container } from '@mantine/core';
import { PRIMARY_GOLD, PRIMARY_BROWN, MUTED_OLIVE, THEMED_LIGHT_BG, CHARCOAL } from '@utils/constants';
// Import the separated form components
import PersonalDetailsForm from '@components/forms/steps/PersonalDetails';
import FinancialDetailsForm from '@components/forms/steps/FinancialDetails';
import CaseDetailsForm from '@components/forms/steps/CaseDetails';
import ReviewForm from '@components/forms/steps/ReviewForm';

export default function UserForm() {
  const [active, setActive] = useState(0);
  const [formData, setFormData] = useState({});
  
  const { register, handleSubmit, formState: { errors }, trigger, getValues, setValue, watch } = useForm({
    mode: 'onChange'
  });
  
  const totalSteps = 4;
  
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
      setFormData({ ...formData, ...getValues() });
      setActive(active + 1);
    }
  };
  
  const prevStep = () => {
    setFormData({ ...formData, ...getValues() });
    setActive(active - 1);
  };
  
  const onSubmit = (data) => {
    const finalData = { ...formData, ...data };
    console.log('Form submitted:', finalData);
    alert('Form submitted successfully! Check console for data.');
  };
  
  const handleFormSubmit = () => {
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
        return <ReviewForm formData={formData} getValues={getValues} />;
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
      </Container>
    </Box>
  );
}