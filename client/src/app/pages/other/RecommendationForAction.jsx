import React, { useState } from 'react';
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
import { IconChevronRight, IconChevronLeft, IconCircleCheck, IconFileText } from '@tabler/icons-react'; // Added icons
import { useAuth } from '@/context/authContext';

// --- Consolidated Constants ---
const PRIMARY_GOLD = '#FFD700';
const PRIMARY_BROWN = '#5C4033';
const THEMED_LIGHT_BG = '#F7F7F7';
const MUTED_OLIVE = '#8A8A5C'; // Re-added for button styling
// --- End of Consolidated Constants ---


// Helper component for Evidence Tables (Memoized)
const EvidenceTable = React.memo(({ title }) => (
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
                        <Table.Td><TextInput placeholder="Type/Desc" size="xs" variant="unstyled" /></Table.Td>
                        <Table.Td><TextInput placeholder="Author/Custodian" size="xs" variant="unstyled" /></Table.Td>
                        <Table.Td><TextInput placeholder="Purpose" size="xs" variant="unstyled" /></Table.Td>
                        <Table.Td><TextInput placeholder="Issues" size="xs" variant="unstyled" /></Table.Td>
                    </Table.Tr>
                ))}
            </Table.Tbody>
        </Table>
    </Stack>
));
EvidenceTable.displayName = 'EvidenceTable';


// ====================================================================================
// 1. Reconstructed Case Record Table (Based on image_588e74.png)
// ====================================================================================
export const CaseInformationSection = React.memo(() => (
    <Paper shadow="md" p="xl" radius="lg" bg="white">
        <Stack gap="xl">
            <Title order={2} c={PRIMARY_BROWN} style={{ textAlign: 'center' }}>Reconstructed Case Record Table</Title>
            
            <Divider />

            <Title order={3} c={PRIMARY_BROWN}>Case Information Section</Title>
            
            <Grid gutter="xl">
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Stack>
                        <TextInput label="Title" placeholder="e.g., Juan dela Cruz vs. Pedro Reyes" />
                        <TextInput label="Nature of the Case" placeholder="e.g., Estafa, Annulment, Ejectment" />
                        <TextInput label="Tribunal" placeholder="e.g., Regional Trial Court, MTC, SC" />
                        <TextInput label="Branch" placeholder="e.g., Branch 123" />
                        <TextInput label="Presiding Judge" placeholder="Hon. [Judge Name]" />
                        <TextInput label="Tel/Email of Clerk of Court" placeholder="Contact details" />
                    </Stack>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Stack>
                        <TextInput label="Contact Details (Case)" placeholder="Relevant phone/email" />
                        <TextInput label="Counsel/s on Record" placeholder="Name/s of counsel" />
                        <TextInput label="Public Prosecutor" placeholder="Name of prosecutor (if applicable)" />
                        <TextInput label="Opposing Counsel" placeholder="Name of opposing counsel" />
                        <Textarea label="Client/s Address" placeholder="Full client address" autosize minRows={2} />
                        <Textarea label="Others (Contact Details)" placeholder="Any other relevant contacts" autosize minRows={2} />
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
            />

            <Divider />

            <Title order={3} c={PRIMARY_BROWN}>Case History & Notes Section</Title>
            <Grid gutter="xl">
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Textarea 
                        label="CASE HISTORY (in reverse chronological order)" 
                        placeholder="List past events, rulings, and filings from most recent to oldest"
                        autosize 
                        minRows={5} 
                    />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Textarea 
                        label="REMARKS / REMINDERS / NOTES (deadlines / material dates, etc.)" 
                        placeholder="Important dates, next hearing, filing deadlines"
                        autosize 
                        minRows={5} 
                    />
                </Grid.Col>
            </Grid>
        </Stack>
    </Paper>
));
CaseInformationSection.displayName = 'CaseInformationSection';


// ====================================================================================
// 2. Client Interview and Evidence Section (Based on image_588eb7.png)
// ====================================================================================
export const ClientInterviewSection = React.memo(() => (
    <Paper shadow="md" p="xl" radius="lg" bg="white">
        <Stack gap="xl">
            <Title order={2} c={PRIMARY_BROWN} style={{ textAlign: 'center' }}>Client Interview and Evidence Record</Title>
            
            <Divider />
            
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                <TextInput label="Date of Interview" type="date" />
                <TextInput label="Date Submitted" type="date" />
                <TextInput label="Client's Name" placeholder="Full Name" />
                <TextInput label="Interviewing Intern/s Duty Day" placeholder="Intern Name/s and Duty Day" />
            </SimpleGrid>
            
            <Divider />

            <Title order={4} c={PRIMARY_BROWN}>Fast Facts</Title>
            <Textarea 
                placeholder="A brief summary of the client's story and the core legal issue/s." 
                autosize 
                minRows={4} 
            />

            <Divider />

            <EvidenceTable title="Evidence on Hand / Available for the Client(s)" />

            <Divider />
            
            <EvidenceTable title="Evidence on Hand / Available for the Adverse Party(ies)" />
            
            <Divider />
            
            <Title order={4} c={PRIMARY_BROWN}>Interviewing Intern's Initial Advice to the Client(s)</Title>
            <Textarea 
                placeholder="Brief summary of the initial legal advice given to the client."
                autosize
                minRows={3}
            />
            <Group justify="flex-end">
                <Checkbox label="For legal advice only" />
            </Group>

            <Divider />

            <Title order={4} c={PRIMARY_BROWN}>Legal Opinion</Title>
            <Textarea 
                placeholder="The intern's assessment of the case's merits and possible legal strategy."
                autosize
                minRows={5}
            />
        </Stack>
    </Paper>
));
ClientInterviewSection.displayName = 'ClientInterviewSection';


// ====================================================================================
// 3. Supervising Lawyer's Comment & Director's Action (Based on image_588e92.png)
// ====================================================================================
export const SupervisingLawyerActionSection = React.memo(() => (
    <Paper shadow="md" p="xl" radius="lg" bg="white">
        <Stack gap="xl">
            <Title order={2} c={PRIMARY_BROWN} style={{ textAlign: 'center' }}>Supervising Lawyer & Director Action</Title>

            <Divider />
            
            <Title order={3} c={PRIMARY_BROWN}>Supervising Lawyer's Comment</Title>
            <Textarea 
                placeholder="Comments, corrections, or additional instructions from the Supervising Lawyer." 
                autosize 
                minRows={4} 
            />

            <Divider />

            <Title order={3} c={PRIMARY_BROWN}>Director's Action</Title>
            <Radio.Group label="Decision">
                <Group>
                    <Radio value="accepted" label="Accepted" />
                    <Radio value="rejected" label="Rejected" />
                    <Radio value="pending" label="Pending" />
                </Group>
            </Radio.Group>
            
            <Textarea 
                label="If accepted/pending, instruction(s); if rejected, reason(s):" 
                placeholder="Specific instructions or reason for rejection"
                autosize 
                minRows={4} 
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
                    />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Stack>
                        <TextInput 
                            label="Supervising Lawyer" 
                            placeholder="Signature/Name of Supervising Lawyer" 
                        />
                        <TextInput 
                            label="Director's Signature" 
                            placeholder="Signature/Name of Director" 
                        />
                        <TextInput 
                            label="Date" 
                            type="date" 
                        />
                    </Stack>
                </Grid.Col>
            </Grid>
        </Stack>
    </Paper>
));
SupervisingLawyerActionSection.displayName = 'SupervisingLawyerActionSection';


// ====================================================================================
// Main Wrapper Component (Managing Steps and Buttons)
// ====================================================================================
const totalSteps = 3;

export default function CaseRecordFormsDisplay() {
    const { userData } = useAuth();
    const [active, setActive] = useState(0);
    const isIntern = userData?.role === 'intern';

    const nextStep = () => setActive((current) => (current < totalSteps - 1 ? current + 1 : current));
    const prevStep = () => setActive((current) => (current > 0 ? current - 1 : current));
    
    const handleSubmit = () => {
        // TODO: Add submission logic here
        alert('Form submitted successfully!');
        console.log('Form submitted by:', userData?.role);
    };

    const renderStepContent = () => {
        switch (active) {
            case 0:
                return <CaseInformationSection />;
            case 1:
                return <ClientInterviewSection />;
            case 2:
                return <SupervisingLawyerActionSection />;
            default:
                return null;
        }
    };
    
    // Step labels for the Stepper component
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
                {/* Header */}
                <Paper 
                    shadow="xs" 
                    p="xl" 
                    mb="xl" 
                    radius="lg"
                    style={{ background: PRIMARY_BROWN, border: 'none' }}
                >
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
                </Paper>

                {/* Form Content Wrapper */}
                <Paper shadow="xs" p="xl" radius="lg" bg="white">
                    <Stack gap="xl">
                        {/* Stepper Display */}
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
                        
                        {/* Current Step Content */}
                        {renderStepContent()}

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
                                        root: { borderColor: '#E0E0E0', color: MUTED_OLIVE, '&:hover': { backgroundColor: THEMED_LIGHT_BG } },
                                    }}
                                >
                                    Previous
                                </Button>
                            ) : (
                                <Box /> // Empty box to maintain spacing
                            )}
                            
                            <Group gap="md">
                                {/* Show Submit for Review button for interns on step 2 */}
                                {isIntern && active === 1 && (
                                    <Button 
                                        leftSection={<IconCircleCheck size={20} />}
                                        onClick={handleSubmit}
                                        size="md"
                                        variant="filled"
                                        style={{ backgroundColor: PRIMARY_GOLD, color: PRIMARY_BROWN }}
                                    >
                                        Submit for Review
                                    </Button>
                                )}
                                
                                {/* Show Next or Finalize button */}
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
                                    <Button 
                                        leftSection={<IconCircleCheck size={20} />}
                                        onClick={handleSubmit}
                                        size="md"
                                        style={{ backgroundColor: PRIMARY_BROWN }}
                                    >
                                        Finalize Record
                                    </Button>
                                )}
                            </Group>
                        </Group>
                    </Stack>
                </Paper>
            </Container>
        </Box>
    );
}