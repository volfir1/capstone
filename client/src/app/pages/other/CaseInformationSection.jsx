import React from 'react';
import {
    Title,
    Paper,
    Stack,
    Divider,
    TextInput,
    Textarea,
    Grid,
    Select,
    Box,
    Group,
    Button,
    ActionIcon,
    Text,
    Radio,
    Checkbox
} from '@mantine/core';
import { NATURE_OF_CASE_OPTIONS } from '@utils/constants';
import { IconPlus, IconTrash, IconGavel, IconUsers, IconUser, IconPhone, IconHome } from '@tabler/icons-react';

// Constants
const PRIMARY_BROWN = '#5C4033';

export const CaseInformationSection = React.memo(({ value = {}, onChange = () => {}, readOnly = false, workflowHistory = [] }) => {
    // Initialize courtVenueDetails state
    const [courtVenueDetails, setCourtVenueDetails] = React.useState(
        value.courtVenueDetails && Array.isArray(value.courtVenueDetails) && value.courtVenueDetails.length > 0
            ? value.courtVenueDetails
            : [{ tribunal: '', venue: '', branch: '', judge: '', docketNumber: '', email: '', contactNumber: '' }]
    );

    // Update state when prop changes
    React.useEffect(() => {
        if (value.courtVenueDetails && Array.isArray(value.courtVenueDetails) && value.courtVenueDetails.length > 0) {
            setCourtVenueDetails(value.courtVenueDetails);
        }
    }, [value.courtVenueDetails]);

    // Parties and Counsel Details state
    const [partiesAndCounselGroups, setPartiesAndCounselGroups] = React.useState(
        value.partiesAndCounselDetails && Array.isArray(value.partiesAndCounselDetails) && value.partiesAndCounselDetails.length > 0
            ? value.partiesAndCounselDetails
            : []
    );

    // Update state when prop changes (for edit mode)
    React.useEffect(() => {
        if (value.partiesAndCounselDetails && Array.isArray(value.partiesAndCounselDetails) && value.partiesAndCounselDetails.length > 0) {
            setPartiesAndCounselGroups(value.partiesAndCounselDetails);
        }
    }, [value.partiesAndCounselDetails]);

    // Update the party/counsel fields when they change
    const handlePartyChange = (groupIndex, partyIndex, field, val) => {
        const updated = [...partiesAndCounselGroups];
        updated[groupIndex] = {
            ...updated[groupIndex],
            parties: updated[groupIndex].parties.map((party, idx) =>
                idx === partyIndex ? { ...party, [field]: val } : party
            )
        };
        setPartiesAndCounselGroups(updated);
        onChange({ ...value, partiesAndCounselDetails: updated });
    };

    const handleCounselChange = (groupIndex, counselIndex, field, val) => {
        const updated = [...partiesAndCounselGroups];
        updated[groupIndex] = {
            ...updated[groupIndex],
            counsels: updated[groupIndex].counsels.map((counsel, idx) =>
                idx === counselIndex ? { ...counsel, [field]: val } : counsel
            )
        };
        setPartiesAndCounselGroups(updated);
        onChange({ ...value, partiesAndCounselDetails: updated });
    };

    const addParty = (groupIndex) => {
        const updated = [...partiesAndCounselGroups];
        updated[groupIndex] = {
            ...updated[groupIndex],
            parties: [
                ...updated[groupIndex].parties,
                { partyName: '', participation: '', mailingAddress: '', emailAddress: '', contactNumber: '' }
            ]
        };
        setPartiesAndCounselGroups(updated);
        onChange({ ...value, partiesAndCounselDetails: updated });
    };

    const removeParty = (groupIndex, partyIndex) => {
        const updated = [...partiesAndCounselGroups];
        updated[groupIndex] = {
            ...updated[groupIndex],
            parties: updated[groupIndex].parties.filter((_, i) => i !== partyIndex)
        };
        setPartiesAndCounselGroups(updated);
        onChange({ ...value, partiesAndCounselDetails: updated });
    };

    const addCounsel = (groupIndex) => {
        const updated = [...partiesAndCounselGroups];
        updated[groupIndex] = {
            ...updated[groupIndex],
            counsels: [
                ...updated[groupIndex].counsels,
                { counselName: '', participation: '', mailingAddress: '', emailAddress: '', contactNumber: '' }
            ]
        };
        setPartiesAndCounselGroups(updated);
        onChange({ ...value, partiesAndCounselDetails: updated });
    };

    const removeCounsel = (groupIndex, counselIndex) => {
        const updated = [...partiesAndCounselGroups];
        updated[groupIndex] = {
            ...updated[groupIndex],
            counsels: updated[groupIndex].counsels.filter((_, i) => i !== counselIndex)
        };
        setPartiesAndCounselGroups(updated);
        onChange({ ...value, partiesAndCounselDetails: updated });
    };

    const addPartyGroup = () => {
        const updated = [
            ...partiesAndCounselGroups,
            {
                groupName: `Group ${partiesAndCounselGroups.length + 1}`,
                parties: [{ partyName: '', participation: '', mailingAddress: '', emailAddress: '', contactNumber: '' }],
                counsels: [{ counselName: '', participation: '', mailingAddress: '', emailAddress: '', contactNumber: '' }]
            }
        ];
        setPartiesAndCounselGroups(updated);
        onChange({ ...value, partiesAndCounselDetails: updated });
    };

    const removePartyGroup = (groupIndex) => {
        const updated = partiesAndCounselGroups.filter((_, i) => i !== groupIndex);
        setPartiesAndCounselGroups(updated);
        onChange({ ...value, partiesAndCounselDetails: updated });
    };

    const handleGroupNameChange = (groupIndex, val) => {
        const updated = [...partiesAndCounselGroups];
        updated[groupIndex] = { ...updated[groupIndex], groupName: val };
        setPartiesAndCounselGroups(updated);
        onChange({ ...value, partiesAndCounselDetails: updated });
    };

    // Format phone number with fixed +63
    const formatPhoneNumber = (val) => {
        if (!val) return '';
        const cleaned = val.replace(/\D/g, '');
        const number = cleaned.startsWith('63') ? cleaned.substring(2) : cleaned;
        const limited = number.substring(0, 10);
        if (limited.length <= 3) {
            return `+63 ${limited}`;
        } else if (limited.length <= 6) {
            return `+63 ${limited.slice(0, 3)} ${limited.slice(3)}`;
        } else {
            return `+63 ${limited.slice(0, 3)} ${limited.slice(3, 6)} ${limited.slice(6)}`;
        }
    };

    // Format Philippine landline as (0A) XXXX-XXXX
    const formatTelephoneNumber = (val) => {
        if (!val) return '';
        const digitsOnly = val.replace(/\D/g, '');
        const withLeadingZero = digitsOnly.startsWith('0') ? digitsOnly : `0${digitsOnly}`;
        const limited = withLeadingZero.slice(0, 10);

        if (limited.length <= 2) return `(${limited}`;
        if (limited.length <= 4) return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
        if (limited.length <= 8) return `(${limited.slice(0, 2)}) ${limited.slice(2, 6)}-${limited.slice(6)}`;
        return `(${limited.slice(0, 2)}) ${limited.slice(2, 6)}-${limited.slice(6, 10)}`;
    };

    // State for same as present address checkbox
    const [sameAsPresent, setSameAsPresent] = React.useState(false);

    // State for through relator
    const [throughRelator, setThroughRelator] = React.useState(value.throughRelator || 'no');

    // Update through relator when value changes
    React.useEffect(() => {
        if (value.throughRelator) {
            setThroughRelator(value.throughRelator);
        }
    }, [value.throughRelator]);

    // Format phone number for court venue
    const formatCourtPhoneNumber = (val) => {
        if (!val) return '';
        const cleaned = val.replace(/\D/g, '');
        const number = cleaned.startsWith('63') ? cleaned.substring(2) : cleaned;
        const limited = number.substring(0, 10);
        if (limited.length <= 3) {
            return `+63 ${limited}`;
        } else if (limited.length <= 6) {
            return `+63 ${limited.slice(0, 3)} ${limited.slice(3)}`;
        } else {
            return `+63 ${limited.slice(0, 3)} ${limited.slice(3, 6)} ${limited.slice(6)}`;
        }
    };

    // Format phone number for parties/counsel
    const formatPartyCounselPhone = (val) => {
        if (!val) return '';
        const cleaned = val.replace(/\D/g, '');
        const number = cleaned.startsWith('63') ? cleaned.substring(2) : cleaned;
        const limited = number.substring(0, 10);
        if (limited.length <= 3) {
            return `+63 ${limited}`;
        } else if (limited.length <= 6) {
            return `+63 ${limited.slice(0, 3)} ${limited.slice(3)}`;
        } else {
            return `+63 ${limited.slice(0, 3)} ${limited.slice(3, 6)} ${limited.slice(6)}`;
        }
    };

    const handleCourtVenueChange = (index, field, val) => {
        const updated = [...courtVenueDetails];
        updated[index] = { ...updated[index], [field]: val };
        setCourtVenueDetails(updated);
        onChange({ ...value, courtVenueDetails: updated });
    };

    const addCourtVenueSection = () => {
        const updated = [
            ...courtVenueDetails,
            { tribunal: '', venue: '', branch: '', judge: '', docketNumber: '', email: '', contactNumber: '' }
        ];
        setCourtVenueDetails(updated);
        onChange({ ...value, courtVenueDetails: updated });
    };

    const removeCourtVenueSection = (index) => {
        const updated = courtVenueDetails.filter((_, i) => i !== index);
        setCourtVenueDetails(updated);
        onChange({ ...value, courtVenueDetails: updated });
    };

    return (
    <Paper shadow="md" p="xl" radius="lg" bg="white">
        <Stack gap="xl">
            <Title order={2} c={PRIMARY_BROWN} style={{ textAlign: 'center' }}>Case Record</Title>

            <Divider />

            <Title order={3} c={PRIMARY_BROWN}>Case Details</Title>

            <Paper p="lg" radius="lg" style={{ background: '#FAFAFA', border: '1px solid #F0F0F0' }}>
                <Stack gap="lg">
                    {/* Case Information */}
                    <Box>
                        <Text size="sm" fw={600} c={PRIMARY_BROWN} mb="md" tt="uppercase">Case Information</Text>
                        <Grid gutter="sm">
                            <Grid.Col span={12}>
                                <Text size="xs" fw={600} c="#2C2C2C" mb={4}>Title</Text>
                                <TextInput
                                    placeholder="e.g., Juan dela Cruz vs. Pedro Reyes"
                                    size="xs"
                                    value={value.title || ''}
                                    onChange={(e) => onChange({ ...value, title: e.target.value })}
                                    readOnly={readOnly}
                                    styles={{ input: { borderColor: '#E0E0E0' } }}
                                />
                            </Grid.Col>
                            <Grid.Col span={12}>
                                <Text size="xs" fw={600} c="#2C2C2C" mb={4}>Nature of the Case</Text>
                                <Select
                                    placeholder="Select nature of case"
                                    data={NATURE_OF_CASE_OPTIONS}
                                    value={value.nature || ''}
                                    onChange={(val) => onChange({ ...value, nature: val })}
                                    searchable
                                    clearable
                                    readOnly={readOnly}
                                    size="xs"
                                    styles={{ input: { borderColor: '#E0E0E0' } }}
                                />
                            </Grid.Col>
                        </Grid>
                    </Box>

                    <Divider />

                    {/* Client Information */}
                    <Box>
                        <Text size="sm" fw={600} c={PRIMARY_BROWN} mb="md" tt="uppercase">Client Information</Text>
                        <Grid gutter="sm">
                            <Grid.Col span={12}>
                                <Text size="xs" fw={600} c="#2C2C2C" mb={4}>Client Name</Text>
                                <TextInput
                                    placeholder="Juan Dela Cruz"
                                    size="xs"
                                    value={value.clientName || ''}
                                    onChange={(e) => onChange({ ...value, clientName: e.target.value })}
                                    readOnly={readOnly}
                                    styles={{ input: { borderColor: '#E0E0E0' } }}
                                />
                            </Grid.Col>
                            <Grid.Col span={6}>
                                <Text size="xs" fw={600} c="#2C2C2C" mb={4}>Contact Number</Text>
                                <TextInput
                                    placeholder="912 345 6789"
                                    size="xs"
                                    value={value.contactNumber || '+63 '}
                                    onChange={(e) => {
                                        const formatted = formatPhoneNumber(e.target.value);
                                        onChange({ ...value, contactNumber: formatted });
                                    }}
                                    readOnly={readOnly}
                                    styles={{ input: { borderColor: '#E0E0E0' } }}
                                />
                            </Grid.Col>
                            <Grid.Col span={6}>
                                <Text size="xs" fw={600} c="#2C2C2C" mb={4}>Cellphone Number</Text>
                                <TextInput
                                    placeholder="+63 912 345 6789"
                                    size="xs"
                                    value={value.cellphoneNumber || '+63 '}
                                    onChange={(e) => {
                                        const formatted = formatPhoneNumber(e.target.value);
                                        onChange({ ...value, cellphoneNumber: formatted });
                                    }}
                                    readOnly={readOnly}
                                    styles={{ input: { borderColor: '#E0E0E0' } }}
                                />
                            </Grid.Col>
                            <Grid.Col span={12}>
                                <Text size="xs" fw={600} c="#2C2C2C" mb={4}>Present Address</Text>
                                <TextInput
                                    placeholder="123 Street, Barangay, City"
                                    size="xs"
                                    value={value.presentAddress || ''}
                                    onChange={(e) => onChange({ ...value, presentAddress: e.target.value })}
                                    readOnly={readOnly}
                                    styles={{ input: { borderColor: '#E0E0E0' } }}
                                />
                            </Grid.Col>
                            <Grid.Col span={6}>
                                <Text size="xs" fw={600} c="#2C2C2C" mb={4}>Present Address Telephone</Text>
                                <TextInput
                                    placeholder="(02) 1234-5678"
                                    size="xs"
                                    value={value.presentAddressTelephone || ''}
                                    onChange={(e) => {
                                        const formatted = formatTelephoneNumber(e.target.value);
                                        onChange({ ...value, presentAddressTelephone: formatted });
                                    }}
                                    readOnly={readOnly}
                                    styles={{ input: { borderColor: '#E0E0E0' } }}
                                />
                            </Grid.Col>
                            <Grid.Col span={6}>
                                {!readOnly && (
                                    <Checkbox
                                        label="Same as present address"
                                        checked={sameAsPresent}
                                        onChange={(event) => {
                                            setSameAsPresent(event.currentTarget.checked);
                                            if (event.currentTarget.checked && value.presentAddress) {
                                                onChange({ ...value, permanentAddress: value.presentAddress });
                                            }
                                        }}
                                        size="xs"
                                        color={PRIMARY_BROWN}
                                        styles={{ label: { color: '#2C2C2C', fontWeight: 500, fontSize: '12px' } }}
                                    />
                                )}
                            </Grid.Col>
                            <Grid.Col span={12}>
                                <Text size="xs" fw={600} c="#2C2C2C" mb={4}>Permanent Address</Text>
                                <TextInput
                                    placeholder="123 Street, Barangay, City"
                                    size="xs"
                                    value={value.permanentAddress || ''}
                                    onChange={(e) => onChange({ ...value, permanentAddress: e.target.value })}
                                    readOnly={readOnly || sameAsPresent}
                                    styles={{
                                        input: {
                                            backgroundColor: sameAsPresent ? '#F0F0F0' : 'white',
                                            borderColor: '#E0E0E0',
                                            cursor: sameAsPresent ? 'not-allowed' : 'text',
                                        },
                                    }}
                                />
                            </Grid.Col>
                            <Grid.Col span={12}>
                                <Text size="xs" fw={600} c="#2C2C2C" mb={4}>Permanent Address Telephone</Text>
                                <TextInput
                                    placeholder="(02) 1234-5678"
                                    size="xs"
                                    value={value.permanentAddressTelephone || ''}
                                    onChange={(e) => {
                                        const formatted = formatTelephoneNumber(e.target.value);
                                        onChange({ ...value, permanentAddressTelephone: formatted });
                                    }}
                                    readOnly={readOnly}
                                    styles={{ input: { borderColor: '#E0E0E0' } }}
                                />
                            </Grid.Col>
                        </Grid>
                    </Box>

                    <Divider />

                    {/* Relator / Representative */}
                    <Box>
                        <Text size="sm" fw={600} c={PRIMARY_BROWN} mb="md" tt="uppercase">Relator / Representative</Text>
                        <Stack gap="sm">
                            <Box>
                                <Text size="xs" fw={600} c="#2C2C2C" mb={4}>Is this through a Relator / Representative?</Text>
                                {!readOnly ? (
                                    <Radio.Group
                                        value={throughRelator}
                                        onChange={(val) => {
                                            setThroughRelator(val);
                                            onChange({ ...value, throughRelator: val });
                                        }}
                                    >
                                        <Group gap="lg">
                                            <Radio value="yes" label="Yes" color={PRIMARY_BROWN} size="xs" />
                                            <Radio value="no" label="No" color={PRIMARY_BROWN} size="xs" />
                                        </Group>
                                    </Radio.Group>
                                ) : (
                                    <Text size="xs" c="#2C2C2C">{throughRelator === 'yes' ? 'Yes' : 'No'}</Text>
                                )}
                            </Box>
                            <Grid gutter="sm">
                                <Grid.Col span={6}>
                                    <Text size="xs" fw={600} c="#2C2C2C" mb={4}>Relator Name</Text>
                                    <TextInput
                                        placeholder="Maria Santos"
                                        size="xs"
                                        value={value.relatorName || ''}
                                        onChange={(e) => onChange({ ...value, relatorName: e.target.value })}
                                        readOnly={readOnly || throughRelator === 'no'}
                                        styles={{
                                            input: {
                                                backgroundColor: throughRelator === 'yes' ? 'white' : '#F0F0F0',
                                                borderColor: '#E0E0E0',
                                                cursor: throughRelator === 'yes' ? 'text' : 'not-allowed',
                                            },
                                        }}
                                    />
                                </Grid.Col>
                                <Grid.Col span={6}>
                                    <Text size="xs" fw={600} c="#2C2C2C" mb={4}>Relationship to Client</Text>
                                    <TextInput
                                        placeholder="Sister, Parent, Attorney..."
                                        size="xs"
                                        value={value.relationshipToClient || ''}
                                        onChange={(e) => onChange({ ...value, relationshipToClient: e.target.value })}
                                        readOnly={readOnly || throughRelator === 'no'}
                                        styles={{
                                            input: {
                                                backgroundColor: throughRelator === 'yes' ? 'white' : '#F0F0F0',
                                                borderColor: '#E0E0E0',
                                                cursor: throughRelator === 'yes' ? 'text' : 'not-allowed',
                                            },
                                        }}
                                    />
                                </Grid.Col>
                                <Grid.Col span={12}>
                                    <Text size="xs" fw={600} c="#2C2C2C" mb={4}>Relator Email Address</Text>
                                    <TextInput
                                        placeholder="relator@example.com"
                                        size="xs"
                                        value={value.relatorEmail || ''}
                                        onChange={(e) => onChange({ ...value, relatorEmail: e.target.value })}
                                        readOnly={readOnly || throughRelator === 'no'}
                                        styles={{
                                            input: {
                                                backgroundColor: throughRelator === 'yes' ? 'white' : '#F0F0F0',
                                                cursor: throughRelator === 'yes' ? 'text' : 'not-allowed',
                                            },
                                        }}
                                    />
                                </Grid.Col>
                                <Grid.Col span={6}>
                                    <Text size="xs" fw={600} c="#2C2C2C" mb={4}>Relator Phone Number</Text>
                                    <TextInput
                                        placeholder="+63 XXX XXX XXXX"
                                        size="xs"
                                        value={value.relatorPhone || ''}
                                        onChange={(e) => {
                                            const formatted = formatPhoneNumber(e.target.value);
                                            onChange({ ...value, relatorPhone: formatted });
                                        }}
                                        readOnly={readOnly || throughRelator === 'no'}
                                        styles={{
                                            input: {
                                                backgroundColor: throughRelator === 'yes' ? 'white' : '#F0F0F0',
                                                cursor: throughRelator === 'yes' ? 'text' : 'not-allowed',
                                            },
                                        }}
                                    />
                                </Grid.Col>
                                <Grid.Col span={6}>
                                    <Text size="xs" fw={600} c="#2C2C2C" mb={4}>Relator Address</Text>
                                    <TextInput
                                        placeholder="Street, City, Province"
                                        size="xs"
                                        value={value.relatorAddress || ''}
                                        onChange={(e) => onChange({ ...value, relatorAddress: e.target.value })}
                                        readOnly={readOnly || throughRelator === 'no'}
                                        styles={{
                                            input: {
                                                backgroundColor: throughRelator === 'yes' ? 'white' : '#F0F0F0',
                                                cursor: throughRelator === 'yes' ? 'text' : 'not-allowed',
                                            },
                                        }}
                                    />
                                </Grid.Col>
                            </Grid>
                        </Stack>
                    </Box>
                </Stack>
            </Paper>

            <Divider />

            <Title order={3} c={PRIMARY_BROWN}>Court & Venue Details</Title>

            <Paper p="lg" radius="lg" style={{ background: '#FAFAFA', border: '1px solid #F0F0F0' }}>
                <Group gap={8} mb="md" justify="space-between">
                    <Group gap={8}>
                        <Box style={{ width: 28, height: 28, borderRadius: 7, background: '#4DABF7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <IconGavel size={14} color="white" stroke={2.5} />
                        </Box>
                        <Text size="sm" fw={600} c="#2C2C2C" tt="uppercase" lts={0.5}>Court & Venue Details</Text>
                    </Group>
                    {!readOnly && (
                        <Button
                            size="xs"
                            variant="light"
                            color={PRIMARY_BROWN}
                            leftSection={<IconPlus size={14} />}
                            onClick={addCourtVenueSection}
                        >
                            Add Tribunal
                        </Button>
                    )}
                </Group>

                <Stack gap="md">
                    {courtVenueDetails.map((courtVenue, index) => (
                        <Box key={index} p="md" style={{ background: '#F5F5F5', borderRadius: 8, border: '1px solid #E0E0E0', position: 'relative' }}>
                            {!readOnly && (
                                <ActionIcon
                                    color="red"
                                    variant="subtle"
                                    size="sm"
                                    onClick={() => removeCourtVenueSection(index)}
                                    style={{ position: 'absolute', top: -8, right: -8, zIndex: 1 }}
                                >
                                    <IconTrash size={14} />
                                </ActionIcon>
                            )}
                            <Text size="xs" fw={600} c="#2C2C2C" mb="md">Court & Venue {index + 1}</Text>

                            <Stack gap="sm">
                                {/* Row 1: Court / Tribunal and Venue / Place */}
                                <Grid gutter="sm">
                                    <Grid.Col span={6}>
                                        <Text size="xs" fw={600} c="#2C2C2C" mb={4}>Court / Tribunal</Text>
                                        <TextInput
                                            placeholder="e.g. Regional Trial Court"
                                            size="xs"
                                            value={courtVenue.tribunal}
                                            onChange={(e) => handleCourtVenueChange(index, 'tribunal', e.target.value)}
                                            readOnly={readOnly}
                                            styles={{ input: { borderColor: '#E0E0E0' } }}
                                        />
                                    </Grid.Col>
                                    <Grid.Col span={6}>
                                        <Text size="xs" fw={600} c="#2C2C2C" mb={4}>Venue / Place</Text>
                                        <TextInput
                                            placeholder="e.g. Manila City"
                                            size="xs"
                                            value={courtVenue.venue}
                                            onChange={(e) => handleCourtVenueChange(index, 'venue', e.target.value)}
                                            readOnly={readOnly}
                                            styles={{ input: { borderColor: '#E0E0E0' } }}
                                        />
                                    </Grid.Col>
                                </Grid>

                                {/* Row 2: Branch / Division and Judge / Justice */}
                                <Grid gutter="sm">
                                    <Grid.Col span={6}>
                                        <Text size="xs" fw={600} c="#2C2C2C" mb={4}>Branch / Division</Text>
                                        <TextInput
                                            placeholder="e.g. Branch 12"
                                            size="xs"
                                            value={courtVenue.branch}
                                            onChange={(e) => handleCourtVenueChange(index, 'branch', e.target.value)}
                                            readOnly={readOnly}
                                            styles={{ input: { borderColor: '#E0E0E0' } }}
                                        />
                                    </Grid.Col>
                                    <Grid.Col span={6}>
                                        <Text size="xs" fw={600} c="#2C2C2C" mb={4}>Judge / Justice</Text>
                                        <TextInput
                                            placeholder="e.g. Judge John Doe"
                                            size="xs"
                                            value={courtVenue.judge}
                                            onChange={(e) => handleCourtVenueChange(index, 'judge', e.target.value)}
                                            readOnly={readOnly}
                                            styles={{ input: { borderColor: '#E0E0E0' } }}
                                        />
                                    </Grid.Col>
                                </Grid>

                                {/* Row 3: Docket Number, Email Address, and Contact Number */}
                                <Grid gutter="sm">
                                    <Grid.Col span={4}>
                                        <Text size="xs" fw={600} c="#2C2C2C" mb={4}>Docket Number</Text>
                                        <TextInput
                                            placeholder="e.g. CV-2023-1234"
                                            size="xs"
                                            value={courtVenue.docketNumber}
                                            onChange={(e) => handleCourtVenueChange(index, 'docketNumber', e.target.value)}
                                            readOnly={readOnly}
                                            styles={{ input: { borderColor: '#E0E0E0' } }}
                                        />
                                    </Grid.Col>
                                    <Grid.Col span={4}>
                                        <Text size="xs" fw={600} c="#2C2C2C" mb={4}>Email Address</Text>
                                        <TextInput
                                            placeholder="e.g. court@email.com"
                                            size="xs"
                                            value={courtVenue.email}
                                            onChange={(e) => handleCourtVenueChange(index, 'email', e.target.value)}
                                            readOnly={readOnly}
                                            styles={{ input: { borderColor: '#E0E0E0' } }}
                                        />
                                    </Grid.Col>
                                    <Grid.Col span={4}>
                                        <Text size="xs" fw={600} c="#2C2C2C" mb={4}>Contact Number</Text>
                                        <TextInput
                                            placeholder="e.g. 0917-123-4567"
                                            size="xs"
                                            value={courtVenue.contactNumber}
                                            onChange={(e) => {
                                                const formatted = formatCourtPhoneNumber(e.target.value);
                                                handleCourtVenueChange(index, 'contactNumber', formatted);
                                            }}
                                            readOnly={readOnly}
                                            styles={{ input: { borderColor: '#E0E0E0' } }}
                                        />
                                    </Grid.Col>
                                </Grid>
                            </Stack>
                        </Box>
                    ))}
                </Stack>
            </Paper>

            <Divider />

            <Title order={3} c={PRIMARY_BROWN}>Parties and Counsel Details</Title>

            <Paper p="lg" radius="lg" style={{ background: '#FAFAFA', border: '1px solid #F0F0F0' }}>
                <Group gap={8} mb="md" justify="space-between">
                    <Group gap={8}>
                        <Box style={{ width: 28, height: 28, borderRadius: 7, background: '#FA5252', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <IconUsers size={14} color="white" stroke={2.5} />
                        </Box>
                        <Text size="sm" fw={600} c="#2C2C2C" tt="uppercase" lts={0.5}>Parties and Counsel Details</Text>
                    </Group>
                    {!readOnly && (
                        <Button
                            size="xs"
                            variant="light"
                            color={PRIMARY_BROWN}
                            leftSection={<IconPlus size={14} />}
                            onClick={addPartyGroup}
                        >
                            Add Group
                        </Button>
                    )}
                </Group>

                <Stack gap="md">
                    {partiesAndCounselGroups.map((group, groupIndex) => (
                        <Box key={groupIndex} p="md" style={{ background: '#F5F5F5', borderRadius: 8, border: '1px solid #E0E0E0' }}>
                            <Group gap={8} mb="md" justify="space-between">
                                <TextInput
                                    placeholder="Group Name"
                                    size="sm"
                                    value={group.groupName}
                                    onChange={(e) => handleGroupNameChange(groupIndex, e.target.value)}
                                    readOnly={readOnly}
                                    styles={{
                                        input: { fontWeight: 600, backgroundColor: 'white', borderColor: '#D0D0D0' }
                                    }}
                                />
                                {!readOnly && (
                                    <ActionIcon
                                        color="red"
                                        variant="light"
                                        size="sm"
                                        onClick={() => removePartyGroup(groupIndex)}
                                    >
                                        <IconTrash size={14} />
                                    </ActionIcon>
                                )}
                            </Group>

                            {/* Parties Section */}
                            <Box mb="md">
                                <Group gap={8} mb="sm" justify="space-between">
                                    <Text size="xs" fw={600} c={PRIMARY_BROWN} tt="uppercase">Parties</Text>
                                    {!readOnly && (
                                        <Button
                                            size="xs"
                                            variant="subtle"
                                            color={PRIMARY_BROWN}
                                            leftSection={<IconPlus size={12} />}
                                            onClick={() => addParty(groupIndex)}
                                        >
                                            Add Party
                                        </Button>
                                    )}
                                </Group>
                                <Stack gap="sm">
                                    {group.parties.map((party, partyIndex) => (
                                        <Box key={partyIndex} p="sm" style={{ background: 'white', borderRadius: 6, border: '1px solid #E8E8E8' }}>
                                            <Group gap={8} mb="sm" justify="space-between">
                                                <Text size="xs" fw={500} c="#2C2C2C">Party {partyIndex + 1}</Text>
                                                {!readOnly && group.parties.length > 1 && (
                                                    <ActionIcon
                                                        color="red"
                                                        variant="subtle"
                                                        size="xs"
                                                        onClick={() => removeParty(groupIndex, partyIndex)}
                                                    >
                                                        <IconTrash size={12} />
                                                    </ActionIcon>
                                                )}
                                            </Group>
                                            <Grid gutter="xs">
                                                <Grid.Col span={6}>
                                                    <Text size="xs" fw={600} c="#2C2C2C" mb={4}>Party Name</Text>
                                                    <TextInput
                                                        placeholder="Name"
                                                        size="xs"
                                                        value={party.partyName}
                                                        onChange={(e) => handlePartyChange(groupIndex, partyIndex, 'partyName', e.target.value)}
                                                        readOnly={readOnly}
                                                        styles={{ input: { borderColor: '#E0E0E0' } }}
                                                    />
                                                </Grid.Col>
                                                <Grid.Col span={6}>
                                                    <Text size="xs" fw={600} c="#2C2C2C" mb={4}>Participation</Text>
                                                    <TextInput
                                                        placeholder="Plaintiff/Defendant"
                                                        size="xs"
                                                        value={party.participation}
                                                        onChange={(e) => handlePartyChange(groupIndex, partyIndex, 'participation', e.target.value)}
                                                        readOnly={readOnly}
                                                        styles={{ input: { borderColor: '#E0E0E0' } }}
                                                    />
                                                </Grid.Col>
                                                <Grid.Col span={12}>
                                                    <Text size="xs" fw={600} c="#2C2C2C" mb={4}>Mailing Address</Text>
                                                    <TextInput
                                                        placeholder="Address"
                                                        size="xs"
                                                        value={party.mailingAddress}
                                                        onChange={(e) => handlePartyChange(groupIndex, partyIndex, 'mailingAddress', e.target.value)}
                                                        readOnly={readOnly}
                                                        styles={{ input: { borderColor: '#E0E0E0' } }}
                                                    />
                                                </Grid.Col>
                                                <Grid.Col span={6}>
                                                    <Text size="xs" fw={600} c="#2C2C2C" mb={4}>Email Address</Text>
                                                    <TextInput
                                                        placeholder="Email"
                                                        size="xs"
                                                        value={party.emailAddress}
                                                        onChange={(e) => handlePartyChange(groupIndex, partyIndex, 'emailAddress', e.target.value)}
                                                        readOnly={readOnly}
                                                        styles={{ input: { borderColor: '#E0E0E0' } }}
                                                    />
                                                </Grid.Col>
                                                <Grid.Col span={6}>
                                                    <Text size="xs" fw={600} c="#2C2C2C" mb={4}>Contact Number</Text>
                                                    <TextInput
                                                        placeholder="+63 XXX XXX XXXX"
                                                        size="xs"
                                                        value={party.contactNumber}
                                                        onChange={(e) => {
                                                            const formatted = formatPartyCounselPhone(e.target.value);
                                                            handlePartyChange(groupIndex, partyIndex, 'contactNumber', formatted);
                                                        }}
                                                        readOnly={readOnly}
                                                        styles={{ input: { borderColor: '#E0E0E0' } }}
                                                    />
                                                </Grid.Col>
                                            </Grid>
                                        </Box>
                                    ))}
                                </Stack>
                            </Box>

                            {/* Counsel Section */}
                            <Box>
                                <Group gap={8} mb="sm" justify="space-between">
                                    <Text size="xs" fw={600} c={PRIMARY_BROWN} tt="uppercase">Counsel</Text>
                                    {!readOnly && (
                                        <Button
                                            size="xs"
                                            variant="subtle"
                                            color={PRIMARY_BROWN}
                                            leftSection={<IconPlus size={12} />}
                                            onClick={() => addCounsel(groupIndex)}
                                        >
                                            Add Counsel
                                        </Button>
                                    )}
                                </Group>
                                <Stack gap="sm">
                                    {group.counsels.map((counselItem, counselIndex) => (
                                        <Box key={counselIndex} p="sm" style={{ background: 'white', borderRadius: 6, border: '1px solid #E8E8E8' }}>
                                            <Group gap={8} mb="sm" justify="space-between">
                                                <Text size="xs" fw={500} c="#2C2C2C">Counsel {counselIndex + 1}</Text>
                                                {!readOnly && group.counsels.length > 1 && (
                                                    <ActionIcon
                                                        color="red"
                                                        variant="subtle"
                                                        size="xs"
                                                        onClick={() => removeCounsel(groupIndex, counselIndex)}
                                                    >
                                                        <IconTrash size={12} />
                                                    </ActionIcon>
                                                )}
                                            </Group>
                                            <Grid gutter="xs">
                                                <Grid.Col span={6}>
                                                    <Text size="xs" fw={600} c="#2C2C2C" mb={4}>Counsel Name</Text>
                                                    <TextInput
                                                        placeholder="Atty. Name"
                                                        size="xs"
                                                        value={counselItem.counselName}
                                                        onChange={(e) => handleCounselChange(groupIndex, counselIndex, 'counselName', e.target.value)}
                                                        readOnly={readOnly}
                                                        styles={{ input: { borderColor: '#E0E0E0' } }}
                                                    />
                                                </Grid.Col>
                                                <Grid.Col span={6}>
                                                    <Text size="xs" fw={600} c="#2C2C2C" mb={4}>Participation</Text>
                                                    <TextInput
                                                        placeholder="Representation"
                                                        size="xs"
                                                        value={counselItem.participation}
                                                        onChange={(e) => handleCounselChange(groupIndex, counselIndex, 'participation', e.target.value)}
                                                        readOnly={readOnly}
                                                        styles={{ input: { borderColor: '#E0E0E0' } }}
                                                    />
                                                </Grid.Col>
                                                <Grid.Col span={12}>
                                                    <Text size="xs" fw={600} c="#2C2C2C" mb={4}>Mailing Address</Text>
                                                    <TextInput
                                                        placeholder="Law Office Address"
                                                        size="xs"
                                                        value={counselItem.mailingAddress}
                                                        onChange={(e) => handleCounselChange(groupIndex, counselIndex, 'mailingAddress', e.target.value)}
                                                        readOnly={readOnly}
                                                        styles={{ input: { borderColor: '#E0E0E0' } }}
                                                    />
                                                </Grid.Col>
                                                <Grid.Col span={6}>
                                                    <Text size="xs" fw={600} c="#2C2C2C" mb={4}>Email Address</Text>
                                                    <TextInput
                                                        placeholder="Email"
                                                        size="xs"
                                                        value={counselItem.emailAddress}
                                                        onChange={(e) => handleCounselChange(groupIndex, counselIndex, 'emailAddress', e.target.value)}
                                                        readOnly={readOnly}
                                                        styles={{ input: { borderColor: '#E0E0E0' } }}
                                                    />
                                                </Grid.Col>
                                                <Grid.Col span={6}>
                                                    <Text size="xs" fw={600} c="#2C2C2C" mb={4}>Contact Number</Text>
                                                    <TextInput
                                                        placeholder="+63 XXX XXX XXXX"
                                                        size="xs"
                                                        value={counselItem.contactNumber}
                                                        onChange={(e) => {
                                                            const formatted = formatPartyCounselPhone(e.target.value);
                                                            handleCounselChange(groupIndex, counselIndex, 'contactNumber', formatted);
                                                        }}
                                                        readOnly={readOnly}
                                                        styles={{ input: { borderColor: '#E0E0E0' } }}
                                                    />
                                                </Grid.Col>
                                            </Grid>
                                        </Box>
                                    ))}
                                </Stack>
                            </Box>
                        </Box>
                    ))}
                </Stack>
            </Paper>

            <Divider />

            <Title order={3} c={PRIMARY_BROWN}>Notes Section</Title>

            {workflowHistory && workflowHistory.length > 0 && (
                <>
                    <Divider label="Court Representation Review Movement" labelPosition="center" />
                    <Text size="sm" c="dimmed">
                        These entries are saved automatically whenever the case moves between reviewers. The saved text is a read-only snapshot of that stage.
                    </Text>
                    {workflowHistory.slice().reverse().map((entry, index) => {
                        const interview = entry.snapshot?.interviewInfo || {};
                        const action = entry.snapshot?.actionInfo || {};
                        return (
                            <Paper key={`${entry.occurredAt}-${index}`} p="md" withBorder radius="md" style={{ backgroundColor: '#FFFCF5' }}>
                                <Stack gap="xs">
                                    <Group justify="space-between" align="flex-start">
                                        <Box>
                                            <Text fw={700} c={PRIMARY_BROWN}>{entry.action}</Text>
                                            <Text size="xs" c="dimmed">
                                                {entry.actor?.name || 'Unknown user'}{entry.actor?.role ? ` (${entry.actor.role.replace('_', ' ')})` : ''}
                                            </Text>
                                        </Box>
                                        <Text size="xs" c="dimmed">
                                            {entry.occurredAt ? new Date(entry.occurredAt).toLocaleString() : ''}
                                        </Text>
                                    </Group>
                                    <Divider />
                                    <Box>
                                        <Text size="xs" fw={700} c={PRIMARY_BROWN}>Interviewing Intern's Initial Advice to the Client(s)</Text>
                                        <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>{interview.internAdvice || '—'}</Text>
                                    </Box>
                                    <Box>
                                        <Text size="xs" fw={700} c={PRIMARY_BROWN}>Legal Opinion</Text>
                                        <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>{interview.legalOpinion || '—'}</Text>
                                    </Box>
                                    <Box>
                                        <Text size="xs" fw={700} c={PRIMARY_BROWN}>Supervising Lawyer's Comment</Text>
                                        <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>{action.supervisingComment || '—'}</Text>
                                    </Box>
                                </Stack>
                            </Paper>
                        );
                    })}
                </>
            )}

            <Textarea
                label="REMARKS / REMINDERS / NOTES (deadlines / material dates, etc.)"
                placeholder="Important dates, next hearing, filing deadlines"
                autosize
                minRows={5}
                value={value.remarks || ''} onChange={(e) => onChange({ ...value, remarks: e.target.value })}
                readOnly={readOnly}
            />
        </Stack>
    </Paper>
    );
});
CaseInformationSection.displayName = 'CaseInformationSection';
