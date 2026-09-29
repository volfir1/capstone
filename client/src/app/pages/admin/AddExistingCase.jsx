import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import {
  Box, Container, Title, Text, Paper, Stack, Group, Button, Divider, Loader, Center, ActionIcon, Tooltip, ScrollArea,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconArrowLeft, IconDeviceFloppy, IconFileText,
} from '@tabler/icons-react';
import { PRIMARY_BROWN, MUTED_OLIVE, BG, CHARCOAL } from '@utils/constants';
import PersonalDetailsForm from '@components/forms/steps/PersonalDetails';
import FinancialDetailsForm from '@components/forms/steps/FinancialDetails';
import CaseDetailsForm from '@components/forms/steps/CaseDetails';
import { CaseInformationSection } from '@/app/pages/other/CaseInformationSection';
import { ClientInterviewSection } from '@/app/pages/other/RecommendationForAction';
import apiClient from '@config/api/apiClient';
import { useAuth } from '@/context/authContext';

export default function AddExistingCase() {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Client Information Sheet form
  const { register: registerClient, handleSubmit: handleSubmitClient, formState: { errors: clientErrors }, trigger: triggerClient, getValues: getClientValues, setValue: setClientValue, watch: watchClient, reset: resetClient } = useForm({
    mode: 'onChange',
    defaultValues: {
      throughRelator: 'no',
      relatorName: '',
      relationshipToClient: '',
    },
  });

  // Client Interview and Evidence form
  const [interviewData, setInterviewData] = useState({
    dateOfInterview: new Date().toISOString().split('T')[0],
    dateSubmitted: new Date().toISOString().split('T')[0],
    clientName: '',
    interviewingInterns: '',
    fastFacts: '',
    clientEvidence: [],
    adversePartyEvidence: [],
    legalResearch: '',
    preliminaryAssessment: '',
    recommendation: '',
  });

  // File handling functions for interview section
  const handleFileChange = () => {};
  const handleViewDocument = () => {};
  const handleDownloadDocument = () => {};
  const handleRemoveVersion = () => {};
  const handleUploadEvidenceAttachment = () => {};
  const handleRemoveEvidenceAttachment = () => {};
  const handleViewEvidenceAttachment = () => {};
  const handleDownloadEvidenceAttachment = () => {};

  // Case Record form
  const [caseRecordData, setCaseRecordData] = useState({
    title: '',
    nature: '',
    tribunal: '',
    branch: '',
    presidingJudge: '',
    telEmail: '',
    contactDetails: '',
    counsels: '',
    publicProsecutor: '',
    opposingCounsel: '',
    clientAddress: '',
    others: '',
    parties: '',
    caseHistory: '',
    remarks: '',
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      // First, save the client information sheet
      const clientValues = getClientValues();
      const clientPayload = {
        fullName: clientValues.name || undefined,
        name: clientValues.name || undefined,
        age: clientValues.age ? Number(clientValues.age) : undefined,
        birthday: clientValues.birthday || undefined,
        sex: clientValues.sex || undefined,
        civilStatus: clientValues.civilStatus || undefined,
        citizenship: clientValues.citizenship || undefined,
        contactNumber: clientValues.contactNumber || undefined,
        cellphoneNumber: clientValues.cellphoneNumber || undefined,
        telephoneNumber: clientValues.telephoneNumber || undefined,
        presentAddressTelephone: clientValues.presentAddressTelephone || undefined,
        permanentAddressTelephone: clientValues.permanentAddressTelephone || undefined,
        presentAddress: clientValues.presentAddress || undefined,
        permanentAddress: clientValues.permanentAddress || undefined,
        spouseName: clientValues.spouse || undefined,
        throughRelator: clientValues.throughRelator || undefined,
        relatorName: clientValues.relatorName || undefined,
        relationshipToClient: clientValues.relationshipToClient || undefined,
        currentSourceOfIncome: clientValues.currentSourceOfIncome || undefined,
        monthlyIncome: clientValues.monthlyIncome || undefined,
        natureOfWork: clientValues.natureOfWork || undefined,
        employerName: clientValues.employerName || undefined,
        employerAddress: clientValues.employerAddress || undefined,
        employerTelephone: clientValues.employerTelephone || undefined,
        spouseSourceOfIncome: clientValues.spouseSourceOfIncome || undefined,
        spouseMonthlyIncome: clientValues.spouseMonthlyIncome || undefined,
        spouseEmployerAddress: clientValues.spouseEmployerAddress || undefined,
        totalCombinedIncome: clientValues.totalCombinedIncome || undefined,
        partyRepresented: clientValues.partyRepresented || undefined,
        venue: clientValues.venue || undefined,
        caseNumber: clientValues.caseNumber || undefined,
        presentStage: clientValues.presentStage || undefined,
        caseNature: clientValues.caseNature || undefined,
        courtDivision: clientValues.courtDivision || undefined,
        courtAddress: clientValues.courtAddress || undefined,
        courtPhoneNumber: clientValues.courtPhoneNumber || undefined,
        presidingOfficer: clientValues.presidingOfficer || undefined,
        adverseParty: clientValues.adverseParty || undefined,
        adversePartyAddress: clientValues.adversePartyAddress || undefined,
        adversePartyPhone: clientValues.adversePartyPhone || undefined,
        adversePartyCounsel: clientValues.adversePartyCounsel || undefined,
        adversePartyCounselAddress: clientValues.adversePartyCounselAddress || undefined,
        adversePartyCounselPhone: clientValues.adversePartyCounselPhone || undefined,
        caseDescription: clientValues.caseDescription || undefined,
        appointedDate: clientValues.appointedDate || undefined,
        appointmentTime: clientValues.appointmentTime || undefined,
        status: 'existing-case',
      };

      const clientResponse = await apiClient.post('/clientsinfo', clientPayload);
      const clientId = clientResponse.data._id || clientResponse.data.id;

      // Update interview data with client name
      const updatedInterviewData = {
        ...interviewData,
        clientName: clientValues.name || '',
        clientsinfoId: clientId,
      };

      // Note: Interview data is typically saved as part of the review process
      // For now, we'll store it in the client info as additional data
      await apiClient.put(`/clientsinfo/${clientId}`, {
        interviewData: updatedInterviewData
      });

      // Save case record
      const caseRecordPayload = {
        ...caseRecordData,
        clientsinfoId: clientId,
      };
      await apiClient.post('/caserecords', caseRecordPayload);

      notifications.show({ 
        title: 'Success', 
        message: 'Existing case added successfully.', 
        color: 'green' 
      });
      
      // Navigate to appointments page
      navigate('/admin/clientformstatus');
    } catch (err) {
      console.error('Error saving:', err);
      notifications.show({ 
        title: 'Error', 
        message: 'Failed to save existing case. Please try again.', 
        color: 'red' 
      });
    } finally {
      setSaving(false);
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
                Add Existing Case
              </Title>
              <Text size="sm" c={MUTED_OLIVE} mt={2}>
                Complete the client information sheet and case record to add an existing case
              </Text>
            </Box>
          </Group>

          <Group gap="xs">
            <Button variant="subtle" color="gray" fw={600} onClick={() => navigate('/admin/clientformstatus')}>
              Cancel
            </Button>
            <Button 
              color={PRIMARY_BROWN} 
              radius="md" 
              fw={600} 
              leftSection={<IconDeviceFloppy size={16} />} 
              onClick={handleSave} 
              loading={saving}
            >
              Save Case
            </Button>
          </Group>
        </Group>

        <ScrollArea h="calc(100vh - 140px)">
          <Stack gap="xl">
            {/* Section 1: Client Information Sheet */}
            <Paper shadow="xs" p="xl" radius="lg" bg="white" style={{ border: '1px solid #F0F0F0' }}>
              <Stack gap="xl">
                <Group gap={8}>
                  <Box style={{ width: 28, height: 28, borderRadius: 7, background: PRIMARY_BROWN, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IconFileText size={14} color="white" stroke={2.5} />
                  </Box>
                  <Title order={2} c={PRIMARY_BROWN}>Client Information Sheet</Title>
                </Group>
                
                <Divider />

                <Stack gap="md">
                  <PersonalDetailsForm 
                    register={registerClient} 
                    errors={clientErrors} 
                    setValue={setClientValue} 
                    watch={watchClient} 
                  />
                  <FinancialDetailsForm 
                    register={registerClient} 
                    errors={clientErrors} 
                    setValue={setClientValue} 
                    watch={watchClient} 
                  />
                  <CaseDetailsForm 
                    register={registerClient} 
                    errors={clientErrors} 
                    watch={watchClient} 
                    setValue={setClientValue} 
                  />
                </Stack>
              </Stack>
            </Paper>

            {/* Section 2: Client Interview and Evidence Record */}
            <ClientInterviewSection
              value={interviewData}
              onChange={setInterviewData}
              uploadedFile={null}
              onFileChange={handleFileChange}
              documentVersions={[]}
              onViewDocument={handleViewDocument}
              onDownloadDocument={handleDownloadDocument}
              onRemoveVersion={handleRemoveVersion}
              fileInputKey={Date.now()}
              userRole={userData?.role}
              isViewingExistingReview={false}
              currentReviewStage=""
              onUploadEvidenceAttachment={handleUploadEvidenceAttachment}
              onRemoveEvidenceAttachment={handleRemoveEvidenceAttachment}
              onViewEvidenceAttachment={handleViewEvidenceAttachment}
              onDownloadEvidenceAttachment={handleDownloadEvidenceAttachment}
              uploadingEvidenceKey={null}
            />

            {/* Section 3: Case Record */}
            <CaseInformationSection
              value={caseRecordData}
              onChange={setCaseRecordData}
              readOnly={false}
            />
          </Stack>
        </ScrollArea>
      </Container>
    </Box>
  );
}