import React from 'react';
import { 
    Title, 
    Paper, 
    Stack, 
    Divider, 
    TextInput, 
    Textarea, 
    Grid,
    Select
} from '@mantine/core';
import { NATURE_OF_CASE_OPTIONS } from '@utils/constants';

// Constants
const PRIMARY_BROWN = '#5C4033';

export const CaseInformationSection = React.memo(({ value = {}, onChange = () => {}, readOnly = false }) => (
    <Paper shadow="md" p="xl" radius="lg" bg="white">
        <Stack gap="xl">
            <Title order={2} c={PRIMARY_BROWN} style={{ textAlign: 'center' }}>Reconstructed Case Record Table</Title>
            
            <Divider />

            <Title order={3} c={PRIMARY_BROWN}>Case Information Section</Title>
            
            <Grid gutter="xl">
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Stack>
                        <TextInput label="Title" placeholder="e.g., Juan dela Cruz vs. Pedro Reyes"
                            value={value.title || ''} onChange={(e) => onChange({ ...value, title: e.target.value })} readOnly={readOnly} />
                        <Select 
                            label="Nature of the Case" 
                            placeholder="Select nature of case"
                            data={NATURE_OF_CASE_OPTIONS}
                            value={value.nature || ''} 
                            onChange={(val) => onChange({ ...value, nature: val })}
                            searchable
                            clearable
                            readOnly={readOnly}
                        />
                        <TextInput label="Tribunal" placeholder="e.g., Regional Trial Court, MTC, SC"
                            value={value.tribunal || ''} onChange={(e) => onChange({ ...value, tribunal: e.target.value })} readOnly={readOnly} />
                        <TextInput label="Branch" placeholder="e.g., Branch 123"
                            value={value.branch || ''} onChange={(e) => onChange({ ...value, branch: e.target.value })} readOnly={readOnly} />
                        <TextInput label="Presiding Judge" placeholder="Hon. [Judge Name]"
                            value={value.presidingJudge || ''} onChange={(e) => onChange({ ...value, presidingJudge: e.target.value })} readOnly={readOnly} />
                        <TextInput label="Tel/Email of Clerk of Court" placeholder="Contact details"
                            value={value.telEmail || ''} onChange={(e) => onChange({ ...value, telEmail: e.target.value })} readOnly={readOnly} />
                    </Stack>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Stack>
                        <TextInput label="Contact Details (Case)" placeholder="Relevant phone/email"
                            value={value.contactDetails || ''} onChange={(e) => onChange({ ...value, contactDetails: e.target.value })} readOnly={readOnly} />
                        <TextInput label="Counsel/s on Record" placeholder="Name/s of counsel"
                            value={value.counsels || ''} onChange={(e) => onChange({ ...value, counsels: e.target.value })} readOnly={readOnly} />
                        <TextInput label="Public Prosecutor" placeholder="Name of prosecutor (if applicable)"
                            value={value.publicProsecutor || ''} onChange={(e) => onChange({ ...value, publicProsecutor: e.target.value })} readOnly={readOnly} />
                        <TextInput label="Opposing Counsel" placeholder="Name of opposing counsel"
                            value={value.opposingCounsel || ''} onChange={(e) => onChange({ ...value, opposingCounsel: e.target.value })} readOnly={readOnly} />
                        <Textarea label="Client/s Address" placeholder="Full client address" autosize minRows={2}
                            value={value.clientAddress || ''} onChange={(e) => onChange({ ...value, clientAddress: e.target.value })} readOnly={readOnly} />
                        <Textarea label="Others (Contact Details)" placeholder="Any other relevant contacts" autosize minRows={2}
                            value={value.others || ''} onChange={(e) => onChange({ ...value, others: e.target.value })} readOnly={readOnly} />
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
                value={value.parties || ''} onChange={(e) => onChange({ ...value, parties: e.target.value })} 
                readOnly={readOnly}
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
                        value={value.caseHistory || ''} onChange={(e) => onChange({ ...value, caseHistory: e.target.value })}
                        readOnly={readOnly}
                    />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Textarea 
                        label="REMARKS / REMINDERS / NOTES (deadlines / material dates, etc.)" 
                        placeholder="Important dates, next hearing, filing deadlines"
                        autosize 
                        minRows={5}
                        value={value.remarks || ''} onChange={(e) => onChange({ ...value, remarks: e.target.value })}
                        readOnly={readOnly}
                    />
                </Grid.Col>
            </Grid>
        </Stack>
    </Paper>
));
CaseInformationSection.displayName = 'CaseInformationSection';
