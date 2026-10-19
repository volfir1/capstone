import React, { useState } from 'react';
import { 
  Stack, 
  Group, 
  Button, 
  Text, 
  Paper, 
  Textarea, 
  ActionIcon, 
  SimpleGrid, 
  Grid,
  Title 
} from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { PRIMARY_BROWN, MUTED_OLIVE, CHARCOAL } from '@utils/constants';

const FIELD_STYLES = {
  input: {
    backgroundColor: 'var(--mantine-color-dark-5)',
    border: 'none',
    color: 'var(--mantine-color-white)',
    fontSize: '15px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    overflowWrap: 'anywhere',
  },
  label: {
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--mantine-color-dimmed)',
    marginBottom: '4px',
  },
};

const GROUP_NAME_INPUT_STYLES = {
  input: {
    backgroundColor: 'var(--mantine-color-dark-6)',
    border: '1px solid var(--mantine-color-dark-3)',
    color: 'var(--mantine-color-white)',
    fontSize: '14px',
    fontWeight: 600,
    borderRadius: '6px',
    boxShadow: 'none',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    overflowWrap: 'anywhere',
    '&:focus': {
      borderColor: 'var(--mantine-color-blue-5)',
    },
  },
  label: {
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--mantine-color-dimmed)',
    marginBottom: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    whiteSpace: 'nowrap',
  },
};

const FIELD_SIZE = 'sm';

export default function PartiesAndCounselDetails({ 
  value = [], 
  onChange = () => {}, 
  readOnly = false 
}) {
  const handleGroupNameChange = (groupIndex, newValue) => {
    const updated = [...value];
    updated[groupIndex] = { ...updated[groupIndex], groupName: newValue };
    onChange(updated);
  };

  const handlePartyChange = (groupIndex, partyIndex, field, newValue) => {
    const updated = [...value];
    updated[groupIndex] = {
      ...updated[groupIndex],
      parties: updated[groupIndex].parties.map((party, idx) => 
        idx === partyIndex ? { ...party, [field]: newValue } : party
      )
    };
    onChange(updated);
  };

  const addParty = (groupIndex) => {
    const updated = [...value];
    updated[groupIndex] = {
      ...updated[groupIndex],
      parties: [
        ...updated[groupIndex].parties,
        {
          partyName: '',
          participation: '',
          mailingAddress: '',
          emailAddress: '',
          contactNumber: ''
        }
      ]
    };
    onChange(updated);
  };

  const removeParty = (groupIndex, partyIndex) => {
    const updated = [...value];
    updated[groupIndex] = {
      ...updated[groupIndex],
      parties: updated[groupIndex].parties.filter((_, i) => i !== partyIndex)
    };
    onChange(updated);
  };

  const handleCounselChange = (groupIndex, counselIndex, field, newValue) => {
    const updated = [...value];
    updated[groupIndex] = {
      ...updated[groupIndex],
      counsels: updated[groupIndex].counsels.map((counsel, idx) => 
        idx === counselIndex ? { ...counsel, [field]: newValue } : counsel
      )
    };
    onChange(updated);
  };

  const addCounsel = (groupIndex) => {
    const updated = [...value];
    updated[groupIndex] = {
      ...updated[groupIndex],
      counsels: [
        ...updated[groupIndex].counsels,
        {
          counselName: '',
          participation: '',
          mailingAddress: '',
          emailAddress: '',
          contactNumber: ''
        }
      ]
    };
    onChange(updated);
  };

  const removeCounsel = (groupIndex, counselIndex) => {
    const updated = [...value];
    updated[groupIndex] = {
      ...updated[groupIndex],
      counsels: updated[groupIndex].counsels.filter((_, i) => i !== counselIndex)
    };
    onChange(updated);
  };

  const addPartyGroup = () => {
    onChange([
      ...value,
      {
        groupName: `Group ${value.length + 1}`,
        parties: [],
        counsels: []
      }
    ]);
  };

  const removePartyGroup = (groupIndex) => {
    onChange(value.filter((_, i) => i !== groupIndex));
  };

  return (
    <Paper shadow="md" p="xl" radius="lg" bg="white">
      <Stack gap="xl">
        <Title order={3} c={PRIMARY_BROWN}>Parties and Counsel Details</Title>
        
        {value.length === 0 ? (
          <Text size="sm" c={MUTED_OLIVE} ta="center" py="xl">
            No parties or counsel added yet. Click "Add Party Group" to start.
          </Text>
        ) : (
          value.map((group, groupIndex) => (
            <Paper 
              key={groupIndex} 
              p="md" 
              radius="md" 
              bg="#F5F5F5" 
              style={{ border: '1px solid #E0E0E0' }}
            >
              <Group justify="space-between" align="flex-start" mb="md">
                <Textarea
                  label="Group Name"
                  value={group.groupName || ''}
                  onChange={(e) => handleGroupNameChange(groupIndex, e.target.value)}
                  size={FIELD_SIZE}
                  styles={GROUP_NAME_INPUT_STYLES}
                  style={{
                    width: `${Math.min(Math.max(180, Math.ceil((group.groupName || '').length * 8.5) + 32), 480)}px`,
                    minWidth: '180px',
                    maxWidth: 'calc(100% - 56px)',
                  }}
                  placeholder="e.g. Group 1"
                  autosize
                  minRows={1}
                  maxRows={6}
                  readOnly={readOnly}
                />
                {!readOnly && (
                  <ActionIcon
                    color="red"
                    variant="subtle"
                    onClick={() => removePartyGroup(groupIndex)}
                    title="Delete Group"
                    size="lg"
                  >
                    <IconTrash size={18} />
                  </ActionIcon>
                )}
              </Group>

              <Stack gap="xs" mb="md">
                <Text size="sm" fw={600} c={MUTED_OLIVE}>Parties</Text>
                {!readOnly && (
                  <Button
                    variant="outline"
                    size="xs"
                    color={PRIMARY_BROWN}
                    onClick={() => addParty(groupIndex)}
                    leftSection={<IconPlus size={14} />}
                  >
                    Add Party
                  </Button>
                )}
              </Stack>

              {group.parties.map((party, partyIndex) => (
                <Paper 
                  key={partyIndex} 
                  p="md" 
                  radius="md" 
                  bg="white" 
                  style={{ 
                    border: '1px solid #E0E0E0',
                    position: 'relative',
                    marginBottom: '16px'
                  }}
                >
                  {!readOnly && (
                    <ActionIcon
                      color="red"
                      variant="subtle"
                      onClick={() => removeParty(groupIndex, partyIndex)}
                      style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 1 }}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  )}
                  <Stack gap="md">
                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                      <Textarea
                        label="Party Name"
                        value={party.partyName || ''}
                        onChange={(e) => handlePartyChange(groupIndex, partyIndex, 'partyName', e.target.value)}
                        size={FIELD_SIZE}
                        styles={FIELD_STYLES}
                        placeholder="e.g. John Doe"
                        autosize
                        minRows={1}
                        maxRows={6}
                        readOnly={readOnly}
                      />
                      <Textarea
                        label="Participation"
                        value={party.participation || ''}
                        onChange={(e) => handlePartyChange(groupIndex, partyIndex, 'participation', e.target.value)}
                        size={FIELD_SIZE}
                        styles={FIELD_STYLES}
                        placeholder="e.g. Plaintiff"
                        autosize
                        minRows={1}
                        maxRows={6}
                        readOnly={readOnly}
                      />
                    </SimpleGrid>

                    <Grid columns={100} gutter="md">
                      <Grid.Col span={{ base: 100, sm: 45 }}>
                        <Textarea
                          label="Mailing Address"
                          value={party.mailingAddress || ''}
                          onChange={(e) => handlePartyChange(groupIndex, partyIndex, 'mailingAddress', e.target.value)}
                          size={FIELD_SIZE}
                          styles={FIELD_STYLES}
                          placeholder="e.g. 123 Main St"
                          autosize
                          minRows={1}
                          maxRows={6}
                          readOnly={readOnly}
                        />
                      </Grid.Col>
                      <Grid.Col span={{ base: 100, sm: 35 }}>
                        <Textarea
                          label="Email Address"
                          value={party.emailAddress || ''}
                          onChange={(e) => handlePartyChange(groupIndex, partyIndex, 'emailAddress', e.target.value)}
                          size={FIELD_SIZE}
                          styles={FIELD_STYLES}
                          placeholder="e.g. email@example.com"
                          type="email"
                          autosize
                          minRows={1}
                          maxRows={6}
                          readOnly={readOnly}
                        />
                      </Grid.Col>
                      <Grid.Col span={{ base: 100, sm: 20 }}>
                        <Textarea
                          label="Contact Number"
                          value={party.contactNumber || ''}
                          onChange={(e) => handlePartyChange(groupIndex, partyIndex, 'contactNumber', e.target.value)}
                          size={FIELD_SIZE}
                          styles={FIELD_STYLES}
                          placeholder="e.g. 0917-123-4567"
                          autosize
                          minRows={1}
                          maxRows={6}
                          readOnly={readOnly}
                        />
                      </Grid.Col>
                    </Grid>
                  </Stack>
                </Paper>
              ))}

              <Stack gap="xs" mb="md" mt="md">
                <Text size="sm" fw={600} c={MUTED_OLIVE}>Counsel</Text>
                {!readOnly && (
                  <Button
                    variant="outline"
                    size="xs"
                    color={PRIMARY_BROWN}
                    onClick={() => addCounsel(groupIndex)}
                    leftSection={<IconPlus size={14} />}
                  >
                    Add Counsel
                  </Button>
                )}
              </Stack>

              {group.counsels.map((counselItem, counselIndex) => (
                <Paper 
                  key={counselIndex} 
                  p="md" 
                  radius="md" 
                  bg="white" 
                  style={{ 
                    border: '1px solid #E0E0E0',
                    position: 'relative',
                    marginBottom: '16px'
                  }}
                >
                  {!readOnly && (
                    <ActionIcon
                      color="red"
                      variant="subtle"
                      onClick={() => removeCounsel(groupIndex, counselIndex)}
                      style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 1 }}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  )}
                  <Stack gap="md">
                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                      <Textarea
                        label="Counsel Name"
                        value={counselItem.counselName || ''}
                        onChange={(e) => handleCounselChange(groupIndex, counselIndex, 'counselName', e.target.value)}
                        size={FIELD_SIZE}
                        styles={FIELD_STYLES}
                        placeholder="e.g. Atty. Jane Smith"
                        autosize
                        minRows={1}
                        maxRows={6}
                        readOnly={readOnly}
                      />
                      <Textarea
                        label="Participation"
                        value={counselItem.participation || ''}
                        onChange={(e) => handleCounselChange(groupIndex, counselIndex, 'participation', e.target.value)}
                        size={FIELD_SIZE}
                        styles={FIELD_STYLES}
                        placeholder="e.g. Defense Counsel"
                        autosize
                        minRows={1}
                        maxRows={6}
                        readOnly={readOnly}
                      />
                    </SimpleGrid>

                    <Grid columns={100} gutter="md">
                      <Grid.Col span={{ base: 100, sm: 45 }}>
                        <Textarea
                          label="Mailing Address"
                          value={counselItem.mailingAddress || ''}
                          onChange={(e) => handleCounselChange(groupIndex, counselIndex, 'mailingAddress', e.target.value)}
                          size={FIELD_SIZE}
                          styles={FIELD_STYLES}
                          placeholder="e.g. 456 Oak Ave"
                          autosize
                          minRows={1}
                          maxRows={6}
                          readOnly={readOnly}
                        />
                      </Grid.Col>
                      <Grid.Col span={{ base: 100, sm: 35 }}>
                        <Textarea
                          label="Email Address"
                          value={counselItem.emailAddress || ''}
                          onChange={(e) => handleCounselChange(groupIndex, counselIndex, 'emailAddress', e.target.value)}
                          size={FIELD_SIZE}
                          styles={FIELD_STYLES}
                          placeholder="e.g. counsel@example.com"
                          type="email"
                          autosize
                          minRows={1}
                          maxRows={6}
                          readOnly={readOnly}
                        />
                      </Grid.Col>
                      <Grid.Col span={{ base: 100, sm: 20 }}>
                        <Textarea
                          label="Contact Number"
                          value={counselItem.contactNumber || ''}
                          onChange={(e) => handleCounselChange(groupIndex, counselIndex, 'contactNumber', e.target.value)}
                          size={FIELD_SIZE}
                          styles={FIELD_STYLES}
                          placeholder="e.g. 0918-123-4567"
                          autosize
                          minRows={1}
                          maxRows={6}
                          readOnly={readOnly}
                        />
                      </Grid.Col>
                    </Grid>
                  </Stack>
                </Paper>
              ))}
            </Paper>
          ))
        )}

        {!readOnly && (
          <Button
            variant="outline"
            size="sm"
            color={PRIMARY_BROWN}
            onClick={addPartyGroup}
            leftSection={<IconPlus size={16} />}
          >
            Add Party Group
          </Button>
        )}
      </Stack>
    </Paper>
  );
}