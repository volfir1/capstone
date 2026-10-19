import React from 'react';
import { IconBriefcase, IconGavel, IconScale, IconUsers, IconPlus, IconTrash } from '@tabler/icons-react';
import { TextInput, Textarea, Group, Title, Paper, Grid, Stack, Text, Box, Button, ActionIcon } from '@mantine/core';
import { PRIMARY_GOLD, PRIMARY_BROWN, MUTED_OLIVE, CHARCOAL } from '@utils/constants';
import { validationRules } from '@utils/validation';

export default function CaseDetailsForm({ register, errors, watch, setValue, initialPartiesAndCounselDetails, initialCourtVenueDetails }) {
  // Auto-format phone number with fixed +63
  const formatPhoneNumber = (value) => {
    if (!value) return '';
    const cleaned = value.replace(/\D/g, '');
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

  // Parties and Counsel Details state
  const [partiesAndCounselGroups, setPartiesAndCounselGroups] = React.useState(
    initialPartiesAndCounselDetails && Array.isArray(initialPartiesAndCounselDetails) && initialPartiesAndCounselDetails.length > 0
      ? initialPartiesAndCounselDetails
      : []
  );

  // Update state when prop changes (for edit mode)
  React.useEffect(() => {
    if (initialPartiesAndCounselDetails && Array.isArray(initialPartiesAndCounselDetails) && initialPartiesAndCounselDetails.length > 0) {
      setPartiesAndCounselGroups(initialPartiesAndCounselDetails);
    }
  }, [initialPartiesAndCounselDetails]);

  // Update the party/counsel fields when they change
  const handlePartyChange = (groupIndex, partyIndex, field, value) => {
    setPartiesAndCounselGroups(prev => {
      const updated = [...prev];
      updated[groupIndex] = {
        ...updated[groupIndex],
        parties: updated[groupIndex].parties.map((party, idx) =>
          idx === partyIndex ? { ...party, [field]: value } : party
        )
      };
      return updated;
    });
  };

  const handleCounselChange = (groupIndex, counselIndex, field, value) => {
    setPartiesAndCounselGroups(prev => {
      const updated = [...prev];
      updated[groupIndex] = {
        ...updated[groupIndex],
        counsels: updated[groupIndex].counsels.map((counsel, idx) =>
          idx === counselIndex ? { ...counsel, [field]: value } : counsel
        )
      };
      return updated;
    });
  };

  const addParty = (groupIndex) => {
    setPartiesAndCounselGroups(prev => {
      const updated = [...prev];
      updated[groupIndex] = {
        ...updated[groupIndex],
        parties: [
          ...updated[groupIndex].parties,
          { partyName: '', participation: '', mailingAddress: '', emailAddress: '', contactNumber: '' }
        ]
      };
      return updated;
    });
  };

  const removeParty = (groupIndex, partyIndex) => {
    setPartiesAndCounselGroups(prev => {
      const updated = [...prev];
      updated[groupIndex] = {
        ...updated[groupIndex],
        parties: updated[groupIndex].parties.filter((_, i) => i !== partyIndex)
      };
      return updated;
    });
  };

  const addCounsel = (groupIndex) => {
    setPartiesAndCounselGroups(prev => {
      const updated = [...prev];
      updated[groupIndex] = {
        ...updated[groupIndex],
        counsels: [
          ...updated[groupIndex].counsels,
          { counselName: '', participation: '', mailingAddress: '', emailAddress: '', contactNumber: '' }
        ]
      };
      return updated;
    });
  };

  const removeCounsel = (groupIndex, counselIndex) => {
    setPartiesAndCounselGroups(prev => {
      const updated = [...prev];
      updated[groupIndex] = {
        ...updated[groupIndex],
        counsels: updated[groupIndex].counsels.filter((_, i) => i !== counselIndex)
      };
      return updated;
    });
  };

  const addPartyGroup = () => {
    setPartiesAndCounselGroups(prev => [
      ...prev,
      {
        groupName: `Group ${prev.length + 1}`,
        parties: [{ partyName: '', participation: '', mailingAddress: '', emailAddress: '', contactNumber: '' }],
        counsels: [{ counselName: '', participation: '', mailingAddress: '', emailAddress: '', contactNumber: '' }]
      }
    ]);
  };

  const removePartyGroup = (groupIndex) => {
    setPartiesAndCounselGroups(prev => prev.filter((_, i) => i !== groupIndex));
  };

  const handleGroupNameChange = (groupIndex, value) => {
    setPartiesAndCounselGroups(prev => {
      const updated = [...prev];
      updated[groupIndex] = { ...updated[groupIndex], groupName: value };
      return updated;
    });
  };

  // Sync partiesAndCounselGroups to form values
  React.useEffect(() => {
    setValue('partiesAndCounselDetails', partiesAndCounselGroups);
  }, [partiesAndCounselGroups, setValue]);

  // Court Venue Details state
  const [courtVenueDetails, setCourtVenueDetails] = React.useState(
    initialCourtVenueDetails && Array.isArray(initialCourtVenueDetails) && initialCourtVenueDetails.length > 0
      ? initialCourtVenueDetails
      : []
  );

  // Update state when prop changes (for edit mode)
  React.useEffect(() => {
    if (initialCourtVenueDetails && Array.isArray(initialCourtVenueDetails) && initialCourtVenueDetails.length > 0) {
      setCourtVenueDetails(initialCourtVenueDetails);
    }
  }, [initialCourtVenueDetails]);

  const handleCourtVenueChange = (index, field, value) => {
    setCourtVenueDetails(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addCourtVenueSection = () => {
    setCourtVenueDetails(prev => [
      ...prev,
      { tribunal: '', venue: '', branch: '', judge: '', docketNumber: '', email: '', contactNumber: '' }
    ]);
  };

  const removeCourtVenueSection = (index) => {
    setCourtVenueDetails(prev => prev.filter((_, i) => i !== index));
  };

  // Sync courtVenueDetails to form values
  React.useEffect(() => {
    setValue('courtVenueDetails', courtVenueDetails);
  }, [courtVenueDetails, setValue]);

  return (
    <Stack gap="md" mt="md">
      {/* Case Information */}
      <Paper p="lg" radius="lg" style={{ background: '#FAFAFA', border: '1px solid #F0F0F0' }}>
        <Group gap={8} mb="md">
          <Box style={{ width: 28, height: 28, borderRadius: 7, background: PRIMARY_BROWN, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconBriefcase size={14} color="white" stroke={2.5} />
          </Box>
          <Text size="sm" fw={600} c={CHARCOAL} tt="uppercase" lts={0.5}>Case Information</Text>
        </Group>

        <Stack gap="sm">
          <Grid gutter="sm">
            <Grid.Col span={6}>
              <Group gap={4} mb={6}>
                <Text size="sm" fw={600} c={CHARCOAL}>Party Represented</Text>
              </Group>
              <TextInput
                placeholder="Plaintiff/Defendant"
                size="sm"
                {...register('partyRepresented', validationRules.partyRepresented)}
                error={errors.partyRepresented?.message}
                styles={{ input: { borderColor: errors.partyRepresented ? '#E74C3C' : '#E0E0E0' } }}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Group gap={4} mb={6}>
                <Text size="sm" fw={600} c={CHARCOAL}>Case / Docket Number</Text>
              </Group>
              <TextInput
                placeholder="Case No. 2024-123"
                size="sm"
                {...register('caseNumber', validationRules.caseNumber)}
                error={errors.caseNumber?.message}
                styles={{ input: { borderColor: errors.caseNumber ? '#E74C3C' : '#E0E0E0' } }}
              />
            </Grid.Col>
          </Grid>

          <Grid gutter="sm">
            <Grid.Col span={6}>
              <Group gap={4} mb={6}>
                <Text size="sm" fw={600} c={CHARCOAL}>Venue / City</Text>
              </Group>
              <TextInput
                placeholder="Manila"
                size="sm"
                {...register('venue', validationRules.venue)}
                error={errors.venue?.message}
                styles={{ input: { borderColor: errors.venue ? '#E74C3C' : '#E0E0E0' } }}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Group gap={4} mb={6}>
                <Text size="sm" fw={600} c={CHARCOAL}>Present Stage</Text>
              </Group>
              <TextInput
                placeholder="Pre-trial, Trial, etc."
                size="sm"
                {...register('presentStage', validationRules.presentStage)}
                error={errors.presentStage?.message}
                styles={{ input: { borderColor: errors.presentStage ? '#E74C3C' : '#E0E0E0' } }}
              />
            </Grid.Col>
          </Grid>

          <Box>
            <Group gap={4} mb={6}>
              <Text size="sm" fw={600} c={CHARCOAL}>Nature of Case</Text>
            </Group>
            <Textarea
              placeholder="Describe the nature of the case..."
              size="sm"
              minRows={3}
              {...register('caseNature', validationRules.caseNature)}
              error={errors.caseNature?.message}
              styles={{ input: { borderColor: errors.caseNature ? '#E74C3C' : '#E0E0E0' } }}
            />
            <Text size="xs" c={MUTED_OLIVE} mt={4}>Provide a brief description of the legal matter</Text>
          </Box>
        </Stack>
      </Paper>

      {/* Court & Venue Details */}
      <Paper p="lg" radius="lg" style={{ background: '#FAFAFA', border: '1px solid #F0F0F0' }}>
        <Group gap={8} mb="md" justify="space-between">
          <Group gap={8}>
            <Box style={{ width: 28, height: 28, borderRadius: 7, background: '#4DABF7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconGavel size={14} color="white" stroke={2.5} />
            </Box>
            <Text size="sm" fw={600} c={CHARCOAL} tt="uppercase" lts={0.5}>Court & Venue Details</Text>
          </Group>
          <Button
            size="xs"
            variant="light"
            color={PRIMARY_BROWN}
            leftSection={<IconPlus size={14} />}
            onClick={addCourtVenueSection}
          >
            Add Tribunal
          </Button>
        </Group>

        <Stack gap="md">
          {courtVenueDetails.map((courtVenue, index) => (
            <Box key={index} p="md" style={{ background: '#F5F5F5', borderRadius: 8, border: '1px solid #E0E0E0', position: 'relative' }}>
              <ActionIcon
                color="red"
                variant="subtle"
                size="sm"
                onClick={() => removeCourtVenueSection(index)}
                style={{ position: 'absolute', top: -8, right: -8, zIndex: 1 }}
              >
                <IconTrash size={14} />
              </ActionIcon>
              <Text size="xs" fw={600} c={CHARCOAL} mb="md">Court & Venue {index + 1}</Text>

              <Stack gap="sm">
                {/* Row 1: Court / Tribunal and Venue / Place */}
                <Grid gutter="sm">
                  <Grid.Col span={6}>
                    <Text size="xs" fw={600} c={CHARCOAL} mb={4}>Court / Tribunal</Text>
                    <TextInput
                      placeholder="e.g. Regional Trial Court"
                      size="xs"
                      value={courtVenue.tribunal}
                      onChange={(e) => handleCourtVenueChange(index, 'tribunal', e.target.value)}
                      styles={{ input: { borderColor: '#E0E0E0' } }}
                    />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="xs" fw={600} c={CHARCOAL} mb={4}>Venue / Place</Text>
                    <TextInput
                      placeholder="e.g. Manila City"
                      size="xs"
                      value={courtVenue.venue}
                      onChange={(e) => handleCourtVenueChange(index, 'venue', e.target.value)}
                      styles={{ input: { borderColor: '#E0E0E0' } }}
                    />
                  </Grid.Col>
                </Grid>

                {/* Row 2: Branch / Division and Judge / Justice */}
                <Grid gutter="sm">
                  <Grid.Col span={6}>
                    <Text size="xs" fw={600} c={CHARCOAL} mb={4}>Branch / Division</Text>
                    <TextInput
                      placeholder="e.g. Branch 12"
                      size="xs"
                      value={courtVenue.branch}
                      onChange={(e) => handleCourtVenueChange(index, 'branch', e.target.value)}
                      styles={{ input: { borderColor: '#E0E0E0' } }}
                    />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="xs" fw={600} c={CHARCOAL} mb={4}>Judge / Justice</Text>
                    <TextInput
                      placeholder="e.g. Judge John Doe"
                      size="xs"
                      value={courtVenue.judge}
                      onChange={(e) => handleCourtVenueChange(index, 'judge', e.target.value)}
                      styles={{ input: { borderColor: '#E0E0E0' } }}
                    />
                  </Grid.Col>
                </Grid>

                {/* Row 3: Docket Number, Email Address, and Contact Number */}
                <Grid gutter="sm">
                  <Grid.Col span={4}>
                    <Text size="xs" fw={600} c={CHARCOAL} mb={4}>Docket Number</Text>
                    <TextInput
                      placeholder="e.g. CV-2023-1234"
                      size="xs"
                      value={courtVenue.docketNumber}
                      onChange={(e) => handleCourtVenueChange(index, 'docketNumber', e.target.value)}
                      styles={{ input: { borderColor: '#E0E0E0' } }}
                    />
                  </Grid.Col>
                  <Grid.Col span={4}>
                    <Text size="xs" fw={600} c={CHARCOAL} mb={4}>Email Address</Text>
                    <TextInput
                      placeholder="e.g. court@email.com"
                      size="xs"
                      value={courtVenue.email}
                      onChange={(e) => handleCourtVenueChange(index, 'email', e.target.value)}
                      styles={{ input: { borderColor: '#E0E0E0' } }}
                    />
                  </Grid.Col>
                  <Grid.Col span={4}>
                    <Text size="xs" fw={600} c={CHARCOAL} mb={4}>Contact Number</Text>
                    <TextInput
                      placeholder="e.g. 0917-123-4567"
                      size="xs"
                      value={courtVenue.contactNumber}
                      onChange={(e) => {
                        const formatted = formatPhoneNumber(e.target.value);
                        handleCourtVenueChange(index, 'contactNumber', formatted);
                      }}
                      styles={{ input: { borderColor: '#E0E0E0' } }}
                    />
                  </Grid.Col>
                </Grid>
              </Stack>
            </Box>
          ))}
        </Stack>
      </Paper>

      {/* Parties and Counsel Details */}
      <Paper p="lg" radius="lg" style={{ background: '#FAFAFA', border: '1px solid #F0F0F0' }}>
        <Group gap={8} mb="md" justify="space-between">
          <Group gap={8}>
            <Box style={{ width: 28, height: 28, borderRadius: 7, background: '#FA5252', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconUsers size={14} color="white" stroke={2.5} />
            </Box>
            <Text size="sm" fw={600} c={CHARCOAL} tt="uppercase" lts={0.5}>Parties and Counsel Details</Text>
          </Group>
          <Button
            size="xs"
            variant="light"
            color={PRIMARY_BROWN}
            leftSection={<IconPlus size={14} />}
            onClick={addPartyGroup}
          >
            Add Group
          </Button>
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
                  styles={{
                    input: { fontWeight: 600, backgroundColor: 'white', borderColor: '#D0D0D0' }
                  }}
                />
                <ActionIcon
                  color="red"
                  variant="light"
                  size="sm"
                  onClick={() => removePartyGroup(groupIndex)}
                >
                  <IconTrash size={14} />
                </ActionIcon>
              </Group>

              {/* Parties Section */}
              <Box mb="md">
                <Group gap={8} mb="sm" justify="space-between">
                  <Text size="xs" fw={600} c={PRIMARY_BROWN} tt="uppercase">Parties</Text>
                  <Button
                    size="xs"
                    variant="subtle"
                    color={PRIMARY_BROWN}
                    leftSection={<IconPlus size={12} />}
                    onClick={() => addParty(groupIndex)}
                  >
                    Add Party
                  </Button>
                </Group>
                <Stack gap="sm">
                  {group.parties.map((party, partyIndex) => (
                    <Box key={partyIndex} p="sm" style={{ background: 'white', borderRadius: 6, border: '1px solid #E8E8E8' }}>
                      <Group gap={8} mb="sm" justify="space-between">
                        <Text size="xs" fw={500} c={CHARCOAL}>Party {partyIndex + 1}</Text>
                        {group.parties.length > 1 && (
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
                          <Text size="xs" fw={600} c={CHARCOAL} mb={4}>Party Name</Text>
                          <TextInput
                            placeholder="Name"
                            size="xs"
                            value={party.partyName}
                            onChange={(e) => handlePartyChange(groupIndex, partyIndex, 'partyName', e.target.value)}
                            styles={{ input: { borderColor: '#E0E0E0' } }}
                          />
                        </Grid.Col>
                        <Grid.Col span={6}>
                          <Text size="xs" fw={600} c={CHARCOAL} mb={4}>Participation</Text>
                          <TextInput
                            placeholder="Plaintiff/Defendant"
                            size="xs"
                            value={party.participation}
                            onChange={(e) => handlePartyChange(groupIndex, partyIndex, 'participation', e.target.value)}
                            styles={{ input: { borderColor: '#E0E0E0' } }}
                          />
                        </Grid.Col>
                        <Grid.Col span={12}>
                          <Text size="xs" fw={600} c={CHARCOAL} mb={4}>Mailing Address</Text>
                          <TextInput
                            placeholder="Address"
                            size="xs"
                            value={party.mailingAddress}
                            onChange={(e) => handlePartyChange(groupIndex, partyIndex, 'mailingAddress', e.target.value)}
                            styles={{ input: { borderColor: '#E0E0E0' } }}
                          />
                        </Grid.Col>
                        <Grid.Col span={6}>
                          <Text size="xs" fw={600} c={CHARCOAL} mb={4}>Email Address</Text>
                          <TextInput
                            placeholder="Email"
                            size="xs"
                            value={party.emailAddress}
                            onChange={(e) => handlePartyChange(groupIndex, partyIndex, 'emailAddress', e.target.value)}
                            styles={{ input: { borderColor: '#E0E0E0' } }}
                          />
                        </Grid.Col>
                        <Grid.Col span={6}>
                          <Text size="xs" fw={600} c={CHARCOAL} mb={4}>Contact Number</Text>
                          <TextInput
                            placeholder="+63 XXX XXX XXXX"
                            size="xs"
                            value={party.contactNumber}
                            onChange={(e) => {
                              const formatted = formatPhoneNumber(e.target.value);
                              handlePartyChange(groupIndex, partyIndex, 'contactNumber', formatted);
                            }}
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
                  <Button
                    size="xs"
                    variant="subtle"
                    color={PRIMARY_BROWN}
                    leftSection={<IconPlus size={12} />}
                    onClick={() => addCounsel(groupIndex)}
                  >
                    Add Counsel
                  </Button>
                </Group>
                <Stack gap="sm">
                  {group.counsels.map((counselItem, counselIndex) => (
                    <Box key={counselIndex} p="sm" style={{ background: 'white', borderRadius: 6, border: '1px solid #E8E8E8' }}>
                      <Group gap={8} mb="sm" justify="space-between">
                        <Text size="xs" fw={500} c={CHARCOAL}>Counsel {counselIndex + 1}</Text>
                        {group.counsels.length > 1 && (
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
                          <Text size="xs" fw={600} c={CHARCOAL} mb={4}>Counsel Name</Text>
                          <TextInput
                            placeholder="Atty. Name"
                            size="xs"
                            value={counselItem.counselName}
                            onChange={(e) => handleCounselChange(groupIndex, counselIndex, 'counselName', e.target.value)}
                            styles={{ input: { borderColor: '#E0E0E0' } }}
                          />
                        </Grid.Col>
                        <Grid.Col span={6}>
                          <Text size="xs" fw={600} c={CHARCOAL} mb={4}>Participation</Text>
                          <TextInput
                            placeholder="Representation"
                            size="xs"
                            value={counselItem.participation}
                            onChange={(e) => handleCounselChange(groupIndex, counselIndex, 'participation', e.target.value)}
                            styles={{ input: { borderColor: '#E0E0E0' } }}
                          />
                        </Grid.Col>
                        <Grid.Col span={12}>
                          <Text size="xs" fw={600} c={CHARCOAL} mb={4}>Mailing Address</Text>
                          <TextInput
                            placeholder="Law Office Address"
                            size="xs"
                            value={counselItem.mailingAddress}
                            onChange={(e) => handleCounselChange(groupIndex, counselIndex, 'mailingAddress', e.target.value)}
                            styles={{ input: { borderColor: '#E0E0E0' } }}
                          />
                        </Grid.Col>
                        <Grid.Col span={6}>
                          <Text size="xs" fw={600} c={CHARCOAL} mb={4}>Email Address</Text>
                          <TextInput
                            placeholder="Email"
                            size="xs"
                            value={counselItem.emailAddress}
                            onChange={(e) => handleCounselChange(groupIndex, counselIndex, 'emailAddress', e.target.value)}
                            styles={{ input: { borderColor: '#E0E0E0' } }}
                          />
                        </Grid.Col>
                        <Grid.Col span={6}>
                          <Text size="xs" fw={600} c={CHARCOAL} mb={4}>Contact Number</Text>
                          <TextInput
                            placeholder="+63 XXX XXX XXXX"
                            size="xs"
                            value={counselItem.contactNumber}
                            onChange={(e) => {
                              const formatted = formatPhoneNumber(e.target.value);
                              handleCounselChange(groupIndex, counselIndex, 'contactNumber', formatted);
                            }}
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
    </Stack>
  );
}