import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { IconChevronRight, IconChevronLeft, IconCircleCheck } from '@tabler/icons-react';
import { Button, Stepper, Group, Box, Text, Title, Paper, Stack, Divider } from '@mantine/core';
import { PRIMARY_GOLD, PRIMARY_BROWN, MUTED_OLIVE, THEMED_LIGHT_BG } from '@utils/constants';

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
    <Box style={{ minHeight: '100vh', backgroundColor: '#F9F6F1', padding: '2rem' }}>
      <Box style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <Paper p="xl" radius="lg" shadow="xl" style={{ backgroundColor: 'white' }}>
          <Stack spacing="xl">
            <Box style={{ textAlign: 'center' }}>
              <Title order={1} mb="xs" style={{ color: PRIMARY_BROWN }}>
                Sebastinian Office of Legal Aid (SOLA)
              </Title>
              <Text size="sm" style={{ color: MUTED_OLIVE }}>
                College of Law<br />
                San Sebastian College - Recoletos, Manila
              </Text>
              <Paper 
                mt="md" 
                p="xs" 
                style={{ 
                  display: 'inline-block',
                  backgroundColor: THEMED_LIGHT_BG, 
                  borderRadius: '50px'
                }}
              >
                <Text size="sm" weight={600} style={{ color: PRIMARY_BROWN }}>
                  CLIENT'S INFORMATION SHEET
                </Text>
              </Paper>
            </Box>
            
            <Stepper 
              active={active} 
              color={PRIMARY_GOLD}
              completedIcon={<IconCircleCheck size={20} />}
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
            
            <Divider />
            
            <Group position="apart">
              {active > 0 && (
                <Button 
                  variant="outline" 
                  leftIcon={<IconChevronLeft size={20} />}
                  onClick={prevStep}
                  style={{ 
                    borderColor: PRIMARY_GOLD,
                    color: PRIMARY_BROWN
                  }}
                >
                  Previous
                </Button>
              )}
              
              {active < totalSteps - 1 ? (
                <Button 
                  rightSection={<IconChevronRight size={20} />}
                  onClick={nextStep}
                  style={{ 
                    backgroundColor: PRIMARY_GOLD,
                    marginLeft: active === 0 ? 'auto' : 0
                  }}
                >
                  Next
                </Button>
              ) : (
                <Button 
                  leftIcon={<IconCircleCheck size={20} />}
                  onClick={handleFormSubmit}
                  style={{ 
                    backgroundColor: PRIMARY_BROWN,
                    marginLeft: 'auto'
                  }}
                >
                  Submit Application
                </Button>
              )}
            </Group>
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
}