import React, { useState, useEffect } from 'react';
import { 
    Group, 
    Box, 
    Text, 
    Title, 
    Paper, 
    Stack, 
    Divider, 
    Container, 
    TextInput, 
    Textarea, 
    Grid, 
    Table, 
    Checkbox,
    Radio,
    SimpleGrid,
    Button,
    Stepper
} from '@mantine/core';
import { IconChevronRight, IconChevronLeft, IconCircleCheck, IconFileText, IconEdit, IconX } from '@tabler/icons-react';
import { useAuth } from '@/context/authContext';
import { useLocation } from 'react-router-dom';
import { PRIMARY_GOLD, PRIMARY_BROWN, MUTED_OLIVE, THEMED_LIGHT_BG, CHARCOAL, ACCENT_TAN } from '@utils/constants';

// Helper component for Evidence Tables (Memoized)
const EvidenceTable = React.memo(({ title, disabled = false }) => (
    <Stack gap="sm">
        <Title order={4} c={PRIMARY_BROWN}>{title}</Title>
        <Table withRowBorders withColumnBorders withTableBorder striped>
            <Table.Thead>
                <Table.Tr>
                    <Table.Th style={{ width: '30%' }}>Type / Description</Table.Th>
                    <Table.Th style={{ width: '25%' }}>Author / Custodian</Table.Th>
                    <Table.Th style={{ width: '25%' }}>Purpose</Table.Th>
                    <Table.Th style={{ width: '20%' }}>Admissibility Issues</Table.Th>
                </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
                {[...Array(3)].map((_, index) => (
                    <Table.Tr key={index}>
                        <Table.Td><TextInput placeholder="Type/Desc" size="xs" variant="unstyled" disabled={disabled} styles={{ input: { color: disabled ? CHARCOAL : 'inherit', opacity: disabled ? 0.8 : 1 } }} /></Table.Td>
                        <Table.Td><TextInput placeholder="Author/Custodian" size="xs" variant="unstyled" disabled={disabled} styles={{ input: { color: disabled ? CHARCOAL : 'inherit', opacity: disabled ? 0.8 : 1 } }} /></Table.Td>
                        <Table.Td><TextInput placeholder="Purpose" size="xs" variant="unstyled" disabled={disabled} styles={{ input: { color: disabled ? CHARCOAL : 'inherit', opacity: disabled ? 0.8 : 1 } }} /></Table.Td>
                        <Table.Td><TextInput placeholder="Issues" size="xs" variant="unstyled" disabled={disabled} styles={{ input: { color: disabled ? CHARCOAL : 'inherit', opacity: disabled ? 0.8 : 1 } }} /></Table.Td>
                    </Table.Tr>
                ))}
            </Table.Tbody>
        </Table>
    </Stack>
));
EvidenceTable.displayName = 'EvidenceTable';

// Case Information Section
export const CaseInformationSection = React.memo(({ value = {}, onChange = () => {}, disabled = false }) => (
    <Paper shadow="md" p="xl" radius="lg" bg="white">
        <Stack gap="xl">
            <Title order={2} c={PRIMARY_BROWN} style={{ textAlign: 'center' }}>Reconstructed Case Record Table</Title>
            
            <Divider />
            <Title order={3} c={PRIMARY_BROWN}>Case Information Section</Title>
            
            <Grid gutter="xl">
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Stack>
                        <TextInput label="Title" placeholder="e.g., Juan dela Cruz vs. Pedro Reyes"
                            value={value.title || ''} onChange={(e) => onChange({ ...value, title: e.target.value })} disabled={disabled}
                            styles={{ input: { color: disabled ? CHARCOAL : 'inherit', opacity: disabled ? 0.8 : 1 } }} />
                        <TextInput label="Nature of the Case" placeholder="e.g., Estafa, Annulment, Ejectment"
                            value={value.nature || ''} onChange={(e) => onChange({ ...value, nature: e.target.value })} disabled={disabled}
                            styles={{ input: { color: disabled ? CHARCOAL : 'inherit', opacity: disabled ? 0.8 : 1 } }} />
                        <TextInput label="Tribunal" placeholder="e.g., Regional Trial Court, MTC, SC"
                            value={value.tribunal || ''} onChange={(e) => onChange({ ...value, tribunal: e.target.value })} disabled={disabled}
                            styles={{ input: { color: disabled ? CHARCOAL : 'inherit', opacity: disabled ? 0.8 : 1 } }} />
                        <TextInput label="Branch" placeholder="e.g., Branch 123"
                            value={value.branch || ''} onChange={(e) => onChange({ ...value, branch: e.target.value })} disabled={disabled}
                            styles={{ input: { color: disabled ? CHARCOAL : 'inherit', opacity: disabled ? 0.8 : 1 } }} />
                        <TextInput label="Presiding Judge" placeholder="Hon. [Judge Name]"
                            value={value.presidingJudge || ''} onChange={(e) => onChange({ ...value, presidingJudge: e.target.value })} disabled={disabled}
                            styles={{ input: { color: disabled ? CHARCOAL : 'inherit', opacity: disabled ? 0.8 : 1 } }} />
                        <TextInput label="Tel/Email of Clerk of Court" placeholder="Contact details"
                            value={value.telEmail || ''} onChange={(e) => onChange({ ...value, telEmail: e.target.value })} disabled={disabled}
                            styles={{ input: { color: disabled ? CHARCOAL : 'inherit', opacity: disabled ? 0.8 : 1 } }} />
                    </Stack>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Stack>
                        <TextInput label="Contact Details (Case)" placeholder="Relevant phone/email"
                            value={value.contactDetails || ''} onChange={(e) => onChange({ ...value, contactDetails: e.target.value })} disabled={disabled}
                            styles={{ input: { color: disabled ? CHARCOAL : 'inherit', opacity: disabled ? 0.8 : 1 } }} />
                        <TextInput label="Counsel/s on Record" placeholder="Name/s of counsel"
                            value={value.counsels || ''} onChange={(e) => onChange({ ...value, counsels: e.target.value })} disabled={disabled}
                            styles={{ input: { color: disabled ? CHARCOAL : 'inherit', opacity: disabled ? 0.8 : 1 } }} />
                        <TextInput label="Public Prosecutor" placeholder="Name of prosecutor (if applicable)"
                            value={value.publicProsecutor || ''} onChange={(e) => onChange({ ...value, publicProsecutor: e.target.value })} disabled={disabled}
                            styles={{ input: { color: disabled ? CHARCOAL : 'inherit', opacity: disabled ? 0.8 : 1 } }} />
                        <TextInput label="Opposing Counsel" placeholder="Name of opposing counsel"
                            value={value.opposingCounsel || ''} onChange={(e) => onChange({ ...value, opposingCounsel: e.target.value })} disabled={disabled}
                            styles={{ input: { color: disabled ? CHARCOAL : 'inherit', opacity: disabled ? 0.8 : 1 } }} />
                        <Textarea label="Client/s Address" placeholder="Full client address" autosize minRows={2}
                            value={value.clientAddress || ''} onChange={(e) => onChange({ ...value, clientAddress: e.target.value })} disabled={disabled}
                            styles={{ input: { color: disabled ? CHARCOAL : 'inherit', opacity: disabled ? 0.8 : 1 } }} />
                        <Textarea label="Others (Contact Details)" placeholder="Any other relevant contacts" autosize minRows={2}
                            value={value.others || ''} onChange={(e) => onChange({ ...value, others: e.target.value })} disabled={disabled}
                            styles={{ input: { color: disabled ? CHARCOAL : 'inherit', opacity: disabled ? 0.8 : 1 } }} />
                    </Stack>
                </Grid.Col>
            </Grid>
            <Divider />
            
            <Title order={3} c={PRIMARY_BROWN}>Parties Section</Title>
            <Textarea 
                label="Party/ies" 
                placeholder="List all parties involved (Petitioner/Respondent, Plaintiff/Defendant, etc.)" 
                autosize 
                minRows={3}
                value={value.parties || ''} 
                onChange={(e) => onChange({ ...value, parties: e.target.value })} 
                disabled={disabled}
                styles={{ input: { color: disabled ? CHARCOAL : 'inherit', opacity: disabled ? 0.8 : 1 } }}
            />
            <Divider />
            
            <Title order={3} c={PRIMARY_BROWN}>Case History & Notes Section</Title>
            <Grid gutter="xl">
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Textarea 
                        label="CASE HISTORY (if applicable)" 
                        placeholder="Brief history of the case"
                        autosize 
                        minRows={5}
                        value={value.caseHistory || ''} 
                        onChange={(e) => onChange({ ...value, caseHistory: e.target.value })}
                        disabled={disabled}
                        styles={{ input: { color: disabled ? CHARCOAL : 'inherit', opacity: disabled ? 0.8 : 1 } }}
                    />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Textarea 
                        label="REMARKS / REMINDERS / NOTES (deadlines / material dates, etc.)" 
                        placeholder="Important dates, next hearing, filing deadlines"
                        autosize 
                        minRows={5}
                        value={value.remarks || ''} 
                        onChange={(e) => onChange({ ...value, remarks: e.target.value })}
                        disabled={disabled}
                        styles={{ input: { color: disabled ? CHARCOAL : 'inherit', opacity: disabled ? 0.8 : 1 } }}
                    />
                </Grid.Col>
            </Grid>
        </Stack>
    </Paper>
));
CaseInformationSection.displayName = 'CaseInformationSection';

// Client Interview Section
export const ClientInterviewSection = React.memo(({ value = {}, onChange = () => {}, disabled = false }) => (
    <Paper shadow="md" p="xl" radius="lg" bg="white">
        <Stack gap="xl">
            <Title order={2} c={PRIMARY_BROWN} style={{ textAlign: 'center' }}>Client Interview & Evidence</Title>
            
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                <TextInput label="Date of Interview" type="date" 
                    value={value.dateOfInterview || ''} 
                    onChange={(e) => onChange({ ...value, dateOfInterview: e.target.value })} 
                    disabled={disabled}
                    styles={{ input: { color: disabled ? CHARCOAL : 'inherit', opacity: disabled ? 0.8 : 1 } }} />
                <TextInput label="Date Submitted" type="date"
                    value={value.dateSubmitted || ''} 
                    onChange={(e) => onChange({ ...value, dateSubmitted: e.target.value })} 
                    disabled={disabled}
                    styles={{ input: { color: disabled ? CHARCOAL : 'inherit', opacity: disabled ? 0.8 : 1 } }} />
                <TextInput label="Client's Name" placeholder="Full Name"
                    value={value.clientName || ''} 
                    onChange={(e) => onChange({ ...value, clientName: e.target.value })} 
                    disabled={disabled}
                    styles={{ input: { color: disabled ? CHARCOAL : 'inherit', opacity: disabled ? 0.8 : 1 } }} />
                <TextInput label="Interviewing Intern/s Duty Day" placeholder="Intern Name/s and Duty Day"
                    value={value.interviewingInterns || ''} 
                    onChange={(e) => onChange({ ...value, interviewingInterns: e.target.value })} 
                    disabled={disabled}
                    styles={{ input: { color: disabled ? CHARCOAL : 'inherit', opacity: disabled ? 0.8 : 1 } }} />
            </SimpleGrid>
            
            <Divider />
            
            <Title order={4} c={PRIMARY_BROWN}>Fast Facts</Title>
            <Textarea 
                placeholder="A brief summary of the client's story and the core legal issue/s." 
                autosize 
                minRows={4}
                value={value.fastFacts || ''} 
                onChange={(e) => onChange({ ...value, fastFacts: e.target.value })}
                disabled={disabled}
                styles={{ input: { color: disabled ? CHARCOAL : 'inherit', opacity: disabled ? 0.8 : 1 } }}
            />
            <Divider />
            <EvidenceTable title="Evidence on Hand / Available for the Client(s)" disabled={disabled} />
            <Divider />
            
            <EvidenceTable title="Evidence on Hand / Available for the Adverse Party(ies)" disabled={disabled} />
            
            <Divider />
            
            <Title order={4} c={PRIMARY_BROWN}>Interviewing Intern's Initial Advice to the Client(s)</Title>
            <Textarea 
                placeholder="Brief summary of the initial legal advice given to the client."
                autosize
                minRows={3}
                value={value.internAdvice || ''} 
                onChange={(e) => onChange({ ...value, internAdvice: e.target.value })}
                disabled={disabled}
                styles={{ input: { color: disabled ? CHARCOAL : 'inherit', opacity: disabled ? 0.8 : 1 } }}
            />
            <Group justify="flex-end">
                <Checkbox label="For legal advice only" 
                    checked={!!value.forLegalAdvice} 
                    onChange={(e) => onChange({ ...value, forLegalAdvice: e.currentTarget.checked })} 
                    disabled={disabled} />
            </Group>
            <Divider />
            
            <Title order={4} c={PRIMARY_BROWN}>Legal Opinion</Title>
            <Textarea 
                placeholder="The intern's assessment of the case's merits and possible legal strategy."
                autosize 
                minRows={5}
                value={value.legalOpinion || ''} 
                onChange={(e) => onChange({ ...value, legalOpinion: e.target.value })}
                disabled={disabled}
                styles={{ input: { color: disabled ? CHARCOAL : 'inherit', opacity: disabled ? 0.8 : 1 } }}
            />
        </Stack>
    </Paper>
));
ClientInterviewSection.displayName = 'ClientInterviewSection';

// Supervising Lawyer & Director Action Section
export const SupervisingLawyerActionSection = React.memo(({ value = {}, onChange = () => {}, disabled = false }) => (
    <Paper shadow="md" p="xl" radius="lg" bg="white">
        <Stack gap="xl">
            <Title order={2} c={PRIMARY_BROWN} style={{ textAlign: 'center' }}>Supervising Lawyer & Director Action</Title>
            <Divider />
            
            <Title order={3} c={PRIMARY_BROWN}>Supervising Lawyer's Comment</Title>
            <Textarea 
                placeholder="Comments, corrections, or additional instructions from the Supervising Lawyer." 
                autosize 
                minRows={4}
                value={value.supervisingComment || ''}
                onChange={(e) => onChange({ ...value, supervisingComment: e.target.value })}
                disabled={disabled}
                styles={{ input: { color: disabled ? CHARCOAL : 'inherit', opacity: disabled ? 0.8 : 1 } }}
            />
            <Divider />
            <Title order={3} c={PRIMARY_BROWN}>Director's Action</Title>
            <Radio.Group label="Decision" value={value.decision || ''} onChange={(val) => onChange({ ...value, decision: val })}>
                <Group>
                    <Radio value="accepted" label="Accepted" disabled={disabled} />
                    <Radio value="rejected" label="Rejected" disabled={disabled} />
                    <Radio value="pending" label="Pending" disabled={disabled} />
                </Group>
            </Radio.Group>
            
            <Textarea 
                label="If accepted/pending, instruction(s); if rejected, reason(s):" 
                placeholder="Specific instructions or reason for rejection"
                autosize 
                minRows={4}
                value={value.decisionNote || ''}
                onChange={(e) => onChange({ ...value, decisionNote: e.target.value })}
                disabled={disabled}
                styles={{ input: { color: disabled ? CHARCOAL : 'inherit', opacity: disabled ? 0.8 : 1 } }}
            />
            <Divider />
            <Title order={3} c={PRIMARY_BROWN}>Assignment & Signatures</Title>
            <Grid gutter="xl">
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Textarea 
                        label="Assigned to: Law Interns" 
                        placeholder="List of interns assigned to the case" 
                        autosize
                        minRows={3}
                        value={value.assignedInterns || ''}
                        onChange={(e) => onChange({ ...value, assignedInterns: e.target.value })}
                        disabled={disabled}
                        styles={{ input: { color: disabled ? CHARCOAL : 'inherit', opacity: disabled ? 0.8 : 1 } }}
                    />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Stack>
                        <TextInput 
                            label="Supervising Lawyer" 
                            placeholder="Signature/Name of Supervising Lawyer" 
                            value={value.supervisingLawyer || ''}
                            onChange={(e) => onChange({ ...value, supervisingLawyer: e.target.value })}
                            disabled={disabled}
                            styles={{ input: { color: disabled ? CHARCOAL : 'inherit', opacity: disabled ? 0.8 : 1 } }}
                        />
                        <TextInput 
                            label="Director's Signature" 
                            placeholder="Signature/Name of Director" 
                            value={value.directorSignature || ''}
                            onChange={(e) => onChange({ ...value, directorSignature: e.target.value })}
                            disabled={disabled}
                            styles={{ input: { color: disabled ? CHARCOAL : 'inherit', opacity: disabled ? 0.8 : 1 } }}
                        />
                        <TextInput 
                            label="Date" 
                            type="date" 
                            value={value.signatureDate || ''}
                            onChange={(e) => onChange({ ...value, signatureDate: e.target.value })}
                            disabled={disabled}
                            styles={{ input: { color: disabled ? CHARCOAL : 'inherit', opacity: disabled ? 0.8 : 1 } }}
                        />
                    </Stack>
                </Grid.Col>
            </Grid>
        </Stack>
    </Paper>
));
SupervisingLawyerActionSection.displayName = 'SupervisingLawyerActionSection';

// Main Component
const totalSteps = 3;

export default function CaseRecordFormsDisplay() {
    const { userData } = useAuth();
    const [active, setActive] = useState(0);
    const isIntern = userData?.role === 'intern';
    const [reviews, setReviews] = useState([]);
    const [saving, setSaving] = useState(false);
    const location = useLocation();
    
    const hasExistingReview = location?.state?.review?.content || location?.state?.review?.caseInfo;
    const [isEditing, setIsEditing] = useState(!hasExistingReview);
    
    const [caseInfo, setCaseInfo] = useState({});
    const [interviewInfo, setInterviewInfo] = useState({});
    const [actionInfo, setActionInfo] = useState({});
    
    const [originalCaseInfo, setOriginalCaseInfo] = useState({});
    const [originalInterviewInfo, setOriginalInterviewInfo] = useState({});
    const [originalActionInfo, setOriginalActionInfo] = useState({});
    
    useEffect(() => {
        const review = location?.state?.review;
        if (review && review.content) {
            const ci = review.content.caseInfo || review.caseInfo || {};
            const ii = review.content.interviewInfo || review.interviewInfo || {};
            const ai = review.content.actionInfo || review.actionInfo || {};
            setCaseInfo(ci);
            setInterviewInfo(ii);
            setActionInfo(ai);
            setOriginalCaseInfo(ci);
            setOriginalInterviewInfo(ii);
            setOriginalActionInfo(ai);
            setIsEditing(false);
        } else {
            setIsEditing(true);
        }
    }, [location]);
    
    const nextStep = () => setActive((current) => (current < totalSteps - 1 ? current + 1 : current));
    const prevStep = () => setActive((current) => (current > 0 ? current - 1 : current));
    
    const handleEdit = () => {
        setOriginalCaseInfo({ ...caseInfo });
        setOriginalInterviewInfo({ ...interviewInfo });
        setOriginalActionInfo({ ...actionInfo });
        setIsEditing(true);
    };
    
    const handleCancelEdit = () => {
        setCaseInfo(originalCaseInfo);
        setInterviewInfo(originalInterviewInfo);
        setActionInfo(originalActionInfo);
        setIsEditing(false);
    };
    
    const handleSubmit = async () => {
        const caseIdFromPath = window?.location?.pathname?.split('/')?.pop() || 'unknown';
        const reviewPayload = {
            caseId: caseIdFromPath,
            reviewerId: userData?.id || userData?._id || null,
            reviewerRole: userData?.role || null,
            step: active,
            content: { caseInfo, interviewInfo }
        };
        try {
            setSaving(true);
            if (userData?.role === 'secretary' && active === totalSteps - 1) {
                const finalizePayload = {
                    caseId: caseIdFromPath,
                    finalizedBy: userData?.id || userData?._id || null,
                    finalizedRole: userData?.role || null,
                    content: { caseInfo, interviewInfo, actionInfo }
                };
                const resFinalize = await fetch('/api/finalize', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(finalizePayload)
                });
                const finalizeText = await resFinalize.text();
                if (!resFinalize.ok) {
                    console.error('POST /api/finalize failed', resFinalize.status, finalizeText);
                    throw new Error(`Finalize save failed: ${resFinalize.status} ${finalizeText}`);
                }
                const savedFinalize = finalizeText ? JSON.parse(finalizeText) : null;
                alert('Case finalized and saved');
                console.log('Saved finalize', savedFinalize);
                await fetchReviews(caseIdFromPath);
                return;
            }
            const resReview = await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reviewPayload)
            });
            const reviewText = await resReview.text();
            if (!resReview.ok) {
                console.error('POST /api/reviews failed', resReview.status, reviewText);
                throw new Error(`Review save failed: ${resReview.status} ${reviewText}`);
            }
            const saved = reviewText ? JSON.parse(reviewText) : null;
            await fetchReviews(caseIdFromPath);
            alert('Case + Interview saved in review record');
            console.log('Saved review', saved);
            setIsEditing(false);
        } catch (err) {
            console.error('handleSubmit error:', err);
            alert(`Failed to save data: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };
    
    const fetchReviews = async (caseIdParam) => {
        const caseId = caseIdParam || window?.location?.pathname?.split('/')?.pop() || 'unknown';
        try {
            const res = await fetch(`/api/reviews/${caseId}`);
            if (!res.ok) throw new Error('Failed to fetch reviews');
            const data = await res.json();
            setReviews(data);
        } catch (err) {
            console.error('fetchReviews error', err);
        }
    };
    
    useEffect(() => {
        fetchReviews();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    
    const renderStepContent = () => {
        switch (active) {
            case 0:
                return <CaseInformationSection value={caseInfo} onChange={setCaseInfo} disabled={!isEditing} />;
            case 1:
                return <ClientInterviewSection value={interviewInfo} onChange={setInterviewInfo} disabled={!isEditing} />;
            case 2:
                return <SupervisingLawyerActionSection value={actionInfo} onChange={setActionInfo} disabled={!isEditing} />;
            default:
                return null;
        }
    };
    
    const steps = [
        { label: "Case Info", description: "Record Table" },
        { label: "Interview", description: "Client & Evidence" },
        { label: "Action", description: "Lawyer & Director" },
    ];
    
    return (
        <Box 
            bg={THEMED_LIGHT_BG} 
            mih="100vh" 
            py="xl"
            style={{
                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"',
            }}
        >
            <Container size="xl">
                <Paper 
                    shadow="xs" 
                    p="xl" 
                    mb="xl" 
                    radius="lg"
                    style={{ background: PRIMARY_BROWN, border: 'none' }}
                >
                    <Group gap="md" align="center" justify="space-between">
                        <Group gap="md" align="center">
                            <Box
                                style={{ width: 48, height: 48, borderRadius: '12px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <IconFileText size={24} color={PRIMARY_BROWN} stroke={2.5} />
                            </Box>
                            <Title order={2} c="white">
                                Case Documentation Process
                            </Title>
                        </Group>
                        {!isEditing ? (
                            <Button
                                leftSection={<IconEdit size={18} />}
                                onClick={handleEdit}
                                variant="white"
                                color={PRIMARY_BROWN}
                                size="md"
                            >
                                Edit
                            </Button>
                        ) : (
                            <Button
                                leftSection={<IconX size={18} />}
                                onClick={handleCancelEdit}
                                variant="outline"
                                styles={{
                                    root: {
                                        color: 'white',
                                        borderColor: 'white',
                                        '&:hover': {
                                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                        },
                                    },
                                }}
                                size="md"
                            >
                                Cancel
                            </Button>
                        )}
                    </Group>
                </Paper>
                
                <Paper shadow="xs" p="xl" radius="lg" bg="white">
                    <Stack gap="xl">
                        <Stepper 
                            active={active} 
                            color={PRIMARY_BROWN}
                            completedIcon={<IconCircleCheck size={20} />}
                            styles={{
                                stepLabel: { fontWeight: 600, fontSize: '14px' },
                                stepDescription: { fontSize: '12px', color: MUTED_OLIVE },
                            }}
                        >
                            {steps.map((step, index) => (
                                <Stepper.Step key={index} label={step.label} description={step.description} />
                            ))}
                        </Stepper>
                        
                        <Divider />
                        
                        {renderStepContent()}
                        <Divider color="#F0F0F0" />
                        
                        <Group justify="space-between">
                            {active > 0 ? (
                                <Button 
                                    variant="outline" 
                                    leftSection={<IconChevronLeft size={20} />}
                                    onClick={prevStep}
                                    size="md"
                                    styles={{
                                        root: { borderColor: '#E0E0E0', color: MUTED_OLIVE, '&:hover': { backgroundColor: THEMED_LIGHT_BG } },
                                    }}
                                >
                                    Previous
                                </Button>
                            ) : (
                                <Box />
                            )}
                            
                            <Group gap="md">
                                {isIntern && active === 1 && isEditing && (
                                    <Button 
                                        leftSection={<IconCircleCheck size={20} />}
                                        onClick={handleSubmit}
                                        size="md"
                                        variant="filled"
                                        style={{ backgroundColor: PRIMARY_GOLD, color: PRIMARY_BROWN }}
                                        loading={saving}
                                    >
                                        Submit for Review
                                    </Button>
                                )}
                                
                                {active < totalSteps - 1 ? (
                                    <Button 
                                        rightSection={<IconChevronRight size={20} />}
                                        onClick={nextStep}
                                        size="md"
                                        style={{ backgroundColor: PRIMARY_BROWN }}
                                    >
                                        Next Step
                                    </Button>
                                ) : (
                                    isEditing && (
                                        <Button 
                                            leftSection={<IconCircleCheck size={20} />}
                                            onClick={handleSubmit}
                                            size="md"
                                            style={{ backgroundColor: PRIMARY_BROWN }}
                                            loading={saving}
                                        >
                                            Finalize Record
                                        </Button>
                                    )
                                )}
                            </Group>
                        </Group>
                    </Stack>
                </Paper>
            </Container>
        </Box>
    );
}