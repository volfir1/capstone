import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  Box, Container, Title, Text, Paper, Stack, Group, Button, Stepper, Divider, Loader, Center, ActionIcon, Tooltip,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconChevronRight, IconChevronLeft, IconCircleCheck, IconFileText, IconEdit,
  IconArrowLeft, IconArrowRight, IconDeviceFloppy, IconX,
} from '@tabler/icons-react';
import { PRIMARY_BROWN, MUTED_OLIVE, BG, CHARCOAL } from '@utils/constants';
import PersonalDetailsForm from '@components/forms/steps/PersonalDetails';
import FinancialDetailsForm from '@components/forms/steps/FinancialDetails';
import CaseDetailsForm from '@components/forms/steps/CaseDetails';
import ReviewForm from '@components/forms/steps/ReviewForm';
import apiClient from '@config/api/apiClient';
import { useAuth } from '@/context/authContext';

export default function ClientInfoView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [originalData, setOriginalData] = useState(null);
  const totalSteps = 4;

  const { register, handleSubmit, formState: { errors }, trigger, getValues, setValue, watch, reset } = useForm({
    mode: 'onChange',
    defaultValues: {
      throughRelator: 'no',
      relatorName: '',
      relationshipToClient: '',
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiClient.get(`/clientsinfo/${id}`);
        const d = response.data;
        setOriginalData(d);

        const toInputDate = (value) => {
          if (!value) return '';
          const parsed = new Date(value);
          if (Number.isNaN(parsed.getTime())) return '';
          return parsed.toISOString().split('T')[0];
        };

        const hasRelator = d?.relatorName || d?.relationshipToClient;

        const formValues = {
          name: d?.fullName || d?.name || '',
          age: d?.age !== undefined && d?.age !== null ? String(d.age) : '',
          birthday: toInputDate(d?.birthday),
          sex: d?.sex || '',
          civilStatus: d?.civilStatus || '',
          citizenship: d?.citizenship || '',
          contactNumber: d?.contactNumber || '',
          cellphoneNumber: d?.cellphoneNumber || '',
          telephoneNumber: d?.telephoneNumber || '',
          presentAddressTelephone: d?.presentAddressTelephone || '',
          permanentAddressTelephone: d?.permanentAddressTelephone || '',
          presentAddress: d?.presentAddress || '',
          permanentAddress: d?.permanentAddress || '',
          spouse: d?.spouseName || d?.spouse || '',
          throughRelator: d?.throughRelator || (hasRelator ? 'yes' : 'no'),
          relatorName: d?.relatorName || '',
          relationshipToClient: d?.relationshipToClient || '',
          currentSourceOfIncome: d?.currentSourceOfIncome || '',
          monthlyIncome: d?.monthlyIncome !== undefined && d?.monthlyIncome !== null ? String(d.monthlyIncome) : '',
          natureOfWork: d?.natureOfWork || '',
          employerName: d?.employerName || '',
          employerAddress: d?.employerAddress || '',
          employerTelephone: d?.employerTelephone || '',
          spouseSourceOfIncome: d?.spouseSourceOfIncome || '',
          spouseMonthlyIncome: d?.spouseMonthlyIncome !== undefined && d?.spouseMonthlyIncome !== null ? String(d.spouseMonthlyIncome) : '',
          spouseEmployerAddress: d?.spouseEmployerAddress || '',
          totalCombinedIncome: d?.totalCombinedIncome !== undefined && d?.totalCombinedIncome !== null ? String(d.totalCombinedIncome) : '',
          partyRepresented: d?.partyRepresented || '',
          venue: d?.venue || '',
          caseNumber: d?.caseNumber || '',
          presentStage: d?.presentStage || '',
          caseNature: d?.caseNature || d?.natureOfCase || '',
          courtDivision: d?.courtDivision || '',
          courtAddress: d?.courtAddress || '',
          courtPhoneNumber: d?.courtPhoneNumber || '',
          presidingOfficer: d?.presidingOfficer || '',
          adverseParty: d?.adverseParty || '',
          adversePartyAddress: d?.adversePartyAddress || '',
          adversePartyPhone: d?.adversePartyPhone || '',
          adversePartyCounsel: d?.adversePartyCounsel || '',
          adversePartyCounselAddress: d?.adversePartyCounselAddress || '',
          adversePartyCounselPhone: d?.adversePartyCounselPhone || '',
          caseDescription: d?.caseDescription || '',
          appointedDate: d?.appointedDate || '',
          appointmentTime: d?.appointmentTime || '',
        };

        reset(formValues);
      } catch (error) {
        console.error('Error fetching client info:', error);
        notifications.show({ title: 'Error', message: 'Failed to load client information.', color: 'red' });
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id, reset]);

  const nextStep = () => {
    if (active < totalSteps - 1) {
      setActive(active + 1);
    }
  };

  const prevStep = () => {
    if (active > 0) {
      setActive(active - 1);
    }
  };

  const handleSave = async () => {
    const values = getValues();
    const payload = {
      fullName: values.name || undefined,
      name: values.name || undefined,
      age: values.age ? Number(values.age) : undefined,
      birthday: values.birthday || undefined,
      sex: values.sex || undefined,
      civilStatus: values.civilStatus || undefined,
      citizenship: values.citizenship || undefined,
      contactNumber: values.contactNumber || undefined,
      cellphoneNumber: values.cellphoneNumber || undefined,
      telephoneNumber: values.telephoneNumber || undefined,
      presentAddressTelephone: values.presentAddressTelephone || undefined,
      permanentAddressTelephone: values.permanentAddressTelephone || undefined,
      presentAddress: values.presentAddress || undefined,
      permanentAddress: values.permanentAddress || undefined,
      spouseName: values.spouse || undefined,
      throughRelator: values.throughRelator || undefined,
      relatorName: values.relatorName || undefined,
      relationshipToClient: values.relationshipToClient || undefined,
      currentSourceOfIncome: values.currentSourceOfIncome || undefined,
      monthlyIncome: values.monthlyIncome || undefined,
      natureOfWork: values.natureOfWork || undefined,
      employerName: values.employerName || undefined,
      employerAddress: values.employerAddress || undefined,
      employerTelephone: values.employerTelephone || undefined,
      spouseSourceOfIncome: values.spouseSourceOfIncome || undefined,
      spouseMonthlyIncome: values.spouseMonthlyIncome || undefined,
      spouseEmployerAddress: values.spouseEmployerAddress || undefined,
      totalCombinedIncome: values.totalCombinedIncome || undefined,
      partyRepresented: values.partyRepresented || undefined,
      venue: values.venue || undefined,
      caseNumber: values.caseNumber || undefined,
      presentStage: values.presentStage || undefined,
      caseNature: values.caseNature || undefined,
      courtDivision: values.courtDivision || undefined,
      courtAddress: values.courtAddress || undefined,
      courtPhoneNumber: values.courtPhoneNumber || undefined,
      presidingOfficer: values.presidingOfficer || undefined,
      adverseParty: values.adverseParty || undefined,
      adversePartyAddress: values.adversePartyAddress || undefined,
      adversePartyPhone: values.adversePartyPhone || undefined,
      adversePartyCounsel: values.adversePartyCounsel || undefined,
      adversePartyCounselAddress: values.adversePartyCounselAddress || undefined,
      adversePartyCounselPhone: values.adversePartyCounselPhone || undefined,
      caseDescription: values.caseDescription || undefined,
      appointedDate: values.appointedDate || undefined,
      appointmentTime: values.appointmentTime || undefined,
    };

    setSaving(true);
    try {
      await apiClient.put(`/clientsinfo/${id}`, payload);
      notifications.show({ title: 'Updated', message: 'Client information saved successfully.', color: 'green' });
      setEditMode(false);
      // Refresh original data
      const response = await apiClient.get(`/clientsinfo/${id}`);
      setOriginalData(response.data);
    } catch (err) {
      console.error('Error saving:', err);
      notifications.show({ title: 'Error', message: 'Failed to save client information.', color: 'red' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    // Revert to original data
    if (originalData) {
      const d = originalData;
      const toInputDate = (value) => {
        if (!value) return '';
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) return '';
        return parsed.toISOString().split('T')[0];
      };
      const hasRelator = d?.relatorName || d?.relationshipToClient;
      reset({
        name: d?.fullName || d?.name || '',
        age: d?.age !== undefined && d?.age !== null ? String(d.age) : '',
        birthday: toInputDate(d?.birthday),
        sex: d?.sex || '',
        civilStatus: d?.civilStatus || '',
        citizenship: d?.citizenship || '',
        contactNumber: d?.contactNumber || '',
        cellphoneNumber: d?.cellphoneNumber || '',
        telephoneNumber: d?.telephoneNumber || '',
        presentAddressTelephone: d?.presentAddressTelephone || '',
        permanentAddressTelephone: d?.permanentAddressTelephone || '',
        presentAddress: d?.presentAddress || '',
        permanentAddress: d?.permanentAddress || '',
        spouse: d?.spouseName || d?.spouse || '',
        throughRelator: d?.throughRelator || (hasRelator ? 'yes' : 'no'),
        relatorName: d?.relatorName || '',
        relationshipToClient: d?.relationshipToClient || '',
        currentSourceOfIncome: d?.currentSourceOfIncome || '',
        monthlyIncome: d?.monthlyIncome !== undefined && d?.monthlyIncome !== null ? String(d.monthlyIncome) : '',
        natureOfWork: d?.natureOfWork || '',
        employerName: d?.employerName || '',
        employerAddress: d?.employerAddress || '',
        employerTelephone: d?.employerTelephone || '',
        spouseSourceOfIncome: d?.spouseSourceOfIncome || '',
        spouseMonthlyIncome: d?.spouseMonthlyIncome !== undefined && d?.spouseMonthlyIncome !== null ? String(d.spouseMonthlyIncome) : '',
        spouseEmployerAddress: d?.spouseEmployerAddress || '',
        totalCombinedIncome: d?.totalCombinedIncome !== undefined && d?.totalCombinedIncome !== null ? String(d.totalCombinedIncome) : '',
        partyRepresented: d?.partyRepresented || '',
        venue: d?.venue || '',
        caseNumber: d?.caseNumber || '',
        presentStage: d?.presentStage || '',
        caseNature: d?.caseNature || d?.natureOfCase || '',
        courtDivision: d?.courtDivision || '',
        courtAddress: d?.courtAddress || '',
        courtPhoneNumber: d?.courtPhoneNumber || '',
        presidingOfficer: d?.presidingOfficer || '',
        adverseParty: d?.adverseParty || '',
        adversePartyAddress: d?.adversePartyAddress || '',
        adversePartyPhone: d?.adversePartyPhone || '',
        adversePartyCounsel: d?.adversePartyCounsel || '',
        adversePartyCounselAddress: d?.adversePartyCounselAddress || '',
        adversePartyCounselPhone: d?.adversePartyCounselPhone || '',
        caseDescription: d?.caseDescription || '',
        appointedDate: d?.appointedDate || '',
        appointmentTime: d?.appointmentTime || '',
      });
    }
    setEditMode(false);
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
        return <ReviewForm formData={{}} getValues={getValues} setValue={setValue} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Box bg={BG} mih="100vh" py="xl">
        <Center h="80vh"><Loader color={PRIMARY_BROWN} size="lg" /></Center>
      </Box>
    );
  }

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
        {/* Page Header */}
        <Group justify="space-between" align="flex-start" mb="lg">
          <Group gap="sm" align="center">
            <Tooltip label="Back to Appointments">
              <ActionIcon variant="light" color={PRIMARY_BROWN} size="lg" radius="md" onClick={() => navigate('/admin/clientformstatus')}>
                <IconArrowLeft size={18} />
              </ActionIcon>
            </Tooltip>
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
                {originalData?.fullName || originalData?.name || 'Client Details'} {originalData?._id ? `— ID: ${originalData._id}` : ''}
              </Text>
            </Box>
          </Group>

          <Group gap="xs">
            {!editMode ? (
              <Button variant="light" color={PRIMARY_BROWN} radius="md" fw={600} leftSection={<IconEdit size={16} />} onClick={() => setEditMode(true)}>
                Edit
              </Button>
            ) : (
              <>
                <Button variant="subtle" color="gray" fw={600} onClick={handleCancelEdit}>
                  Cancel
                </Button>
                <Button color={PRIMARY_BROWN} radius="md" fw={600} leftSection={<IconDeviceFloppy size={16} />} onClick={handleSave} loading={saving}>
                  Save
                </Button>
              </>
            )}
          </Group>
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

              <Stepper.Step label="Review" description="Summary">
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
                  styles={{ root: { borderColor: '#E0E0E0', color: MUTED_OLIVE } }}
                >
                  Previous
                </Button>
              ) : (
                <Box />
              )}

              <Group gap="xs">
                {active === totalSteps - 1 && !['director', 'supervising_lawyer'].includes(userData?.role) && (
                  <Button
                    color={PRIMARY_BROWN}
                    radius="md"
                    fw={600}
                    variant="light"
                    rightSection={<IconArrowRight size={16} />}
                    loading={saving}
                    onClick={async () => {
                      // Save the client information sheet first, then navigate
                      const values = getValues();
                      const payload = {
                        fullName: values.name || undefined,
                        name: values.name || undefined,
                        age: values.age ? Number(values.age) : undefined,
                        birthday: values.birthday || undefined,
                        sex: values.sex || undefined,
                        civilStatus: values.civilStatus || undefined,
                        citizenship: values.citizenship || undefined,
                        contactNumber: values.contactNumber || undefined,
                        cellphoneNumber: values.cellphoneNumber || undefined,
                        telephoneNumber: values.telephoneNumber || undefined,
                        presentAddressTelephone: values.presentAddressTelephone || undefined,
                        permanentAddressTelephone: values.permanentAddressTelephone || undefined,
                        presentAddress: values.presentAddress || undefined,
                        permanentAddress: values.permanentAddress || undefined,
                        spouseName: values.spouse || undefined,
                        throughRelator: values.throughRelator || undefined,
                        relatorName: values.relatorName || undefined,
                        relationshipToClient: values.relationshipToClient || undefined,
                        currentSourceOfIncome: values.currentSourceOfIncome || undefined,
                        monthlyIncome: values.monthlyIncome || undefined,
                        natureOfWork: values.natureOfWork || undefined,
                        employerName: values.employerName || undefined,
                        employerAddress: values.employerAddress || undefined,
                        employerTelephone: values.employerTelephone || undefined,
                        spouseSourceOfIncome: values.spouseSourceOfIncome || undefined,
                        spouseMonthlyIncome: values.spouseMonthlyIncome || undefined,
                        spouseEmployerAddress: values.spouseEmployerAddress || undefined,
                        totalCombinedIncome: values.totalCombinedIncome || undefined,
                        partyRepresented: values.partyRepresented || undefined,
                        venue: values.venue || undefined,
                        caseNumber: values.caseNumber || undefined,
                        presentStage: values.presentStage || undefined,
                        caseNature: values.caseNature || undefined,
                        courtDivision: values.courtDivision || undefined,
                        courtAddress: values.courtAddress || undefined,
                        courtPhoneNumber: values.courtPhoneNumber || undefined,
                        presidingOfficer: values.presidingOfficer || undefined,
                        adverseParty: values.adverseParty || undefined,
                        adversePartyAddress: values.adversePartyAddress || undefined,
                        adversePartyPhone: values.adversePartyPhone || undefined,
                        adversePartyCounsel: values.adversePartyCounsel || undefined,
                        adversePartyCounselAddress: values.adversePartyCounselAddress || undefined,
                        adversePartyCounselPhone: values.adversePartyCounselPhone || undefined,
                        caseDescription: values.caseDescription || undefined,
                        appointedDate: values.appointedDate || undefined,
                        appointmentTime: values.appointmentTime || undefined,
                      };
                      setSaving(true);
                      try {
                        await apiClient.put(`/clientsinfo/${id}`, payload);
                        notifications.show({ title: 'Saved', message: 'Client information saved. Proceeding to interview...', color: 'green' });
                        navigate(`/admin/recommendation/${id}`, { state: { showClientInfo: true } });
                      } catch (err) {
                        console.error('Error saving before interview:', err);
                        notifications.show({ title: 'Error', message: 'Failed to save client information.', color: 'red' });
                      } finally {
                        setSaving(false);
                      }
                    }}
                  >
                    Interview
                  </Button>
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
                  active > 0 && <Box />
                )}
              </Group>
            </Group>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
