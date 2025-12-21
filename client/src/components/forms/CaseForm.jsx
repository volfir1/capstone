import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  TextInput,
  Modal,
  Button,
  Box,
  Text,
  Grid,
  Title,
  Paper,
  Group,
  Stack,
  Textarea,
  Alert,
  Divider,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconChevronDown, IconCheck, IconInfoCircle, IconFileText } from "@tabler/icons-react";
import { CASE_TYPES } from "@/utils/caseTypes";
import { 
  PRIMARY_GOLD, 
  PRIMARY_BROWN, 
  MUTED_OLIVE, 
  THEMED_LIGHT_BG, 
  CHARCOAL, 
  ACCENT_TAN 
} from "@/utils/constants";
import { caseValidationRules } from "@/utils/validation";

const CaseTypeSelectorModal = ({ opened, onClose, onSelect, selectedType }) => {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Title order={3} c={CHARCOAL}>
          Choose a Case Type
        </Title>
      }
      size="xl"
      styles={{
        header: {
          borderBottom: `1px solid #F0F0F0`,
          paddingBottom: '16px',
        },
        body: {
          padding: '24px',
        },
      }}
    >
      <Text size="sm" c={MUTED_OLIVE} mb="lg">
        Select the type of legal case you need assistance with
      </Text>
      <Grid gutter="md">
        {CASE_TYPES.map((type) => {
          const isSelected = selectedType?.id === type.id;
          return (
            <Grid.Col span={6} key={type.id}>
              <Paper
                p="lg"
                style={{
                  cursor: 'pointer',
                  border: isSelected 
                    ? `2px solid ${PRIMARY_BROWN}` 
                    : `1px solid #F0F0F0`,
                  backgroundColor: isSelected ? `${PRIMARY_BROWN}10` : 'white',
                  position: 'relative',
                  borderRadius: '8px',
                }}
                onClick={() => {
                  onSelect(type);
                  onClose();
                }}
              >
                {isSelected && (
                  <Box
                    style={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      backgroundColor: PRIMARY_BROWN,
                      borderRadius: '50%',
                      width: 24,
                      height: 24,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <IconCheck size={16} color="white" />
                  </Box>
                )}
                <Stack align="center" gap="sm">
                  <Box
                    style={{
                      backgroundColor: isSelected ? PRIMARY_BROWN : THEMED_LIGHT_BG,
                      borderRadius: '12px',
                      padding: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <type.icon 
                      size={32} 
                      color={isSelected ? 'white' : PRIMARY_BROWN} 
                      stroke={1.5}
                    />
                  </Box>
                  <Text 
                    size="sm" 
                    fw={600} 
                    ta="center"
                    c={isSelected ? PRIMARY_BROWN : CHARCOAL}
                  >
                    {type.label}
                  </Text>
                </Stack>
              </Paper>
            </Grid.Col>
          );
        })}
      </Grid>
    </Modal>
  );
};

const CaseForm = ({ onSubmit }) => {
  const [modalOpened, setModalOpened] = useState(false);
  
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm({
    defaultValues: {
      caseTitle: '',
      caseType: null,
      shortDescription: '',
      detailedDescription: '',
    },
    mode: 'onBlur',
  });

  const caseType = watch('caseType');

  const handleCaseTypeSelect = (selectedType) => {
    setValue('caseType', selectedType, { shouldValidate: true });
    setModalOpened(false);
  };

  const onFormSubmit = (data) => {
    console.log('Form data:', data);
    if (onSubmit) {
      onSubmit(data);
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)}>
      <Stack gap="xl">
        {/* Case Title */}
        <Box>
          <Group gap={8} mb={8}>
            <Text size="sm" fw={600} c={CHARCOAL}>
              Case Title
            </Text>
            <Text size="sm" c="red">*</Text>
          </Group>
          <Controller
            name="caseTitle"
            control={control}
            rules={caseValidationRules.caseTitle}
            render={({ field }) => (
              <TextInput
                {...field}
                placeholder="Enter a brief title for your case"
                size="md"
                error={errors.caseTitle?.message}
                styles={{
                  input: {
                    borderColor: errors.caseTitle ? '#E74C3C' : '#E0E0E0',
                    '&:focus': {
                      borderColor: errors.caseTitle ? '#E74C3C' : PRIMARY_BROWN,
                    },
                  },
                }}
              />
            )}
          />
          <Text size="xs" c={MUTED_OLIVE} mt={4}>
            A clear, concise title helps us understand your case quickly
          </Text>
        </Box>

        <Divider color="#F0F0F0" />

        {/* Case Type Selector */}
        <Box>
          <Group gap={8} mb={4}>
            <Text size="sm" fw={600} c={CHARCOAL}>
              Case Type
            </Text>
            <Text size="sm" c="red">*</Text>
          </Group>
          <Text size="xs" c={MUTED_OLIVE} mb="md">
            Select the category that best describes your legal matter
          </Text>
          <Controller
            name="caseType"
            control={control}
            rules={caseValidationRules.caseType}
            render={({ field }) => (
              <>
                {!field.value ? (
                  <Button
                    variant="outline"
                    size="lg"
                    fullWidth
                    onClick={() => setModalOpened(true)}
                    rightSection={<IconChevronDown size={18} />}
                    styles={{
                      root: {
                        borderColor: errors.caseType ? '#E74C3C' : '#E0E0E0',
                        color: CHARCOAL,
                        height: '56px',
                        '&:hover': {
                          borderColor: errors.caseType ? '#E74C3C' : PRIMARY_BROWN,
                          backgroundColor: `${THEMED_LIGHT_BG}`,
                        },
                      },
                    }}
                  >
                    <Text size="sm" c={MUTED_OLIVE}>
                      Select a case type
                    </Text>
                  </Button>
                ) : (
                  <Paper 
                    p="md" 
                    style={{ 
                      border: `2px solid ${PRIMARY_BROWN}`,
                      borderRadius: '8px',
                      backgroundColor: 'white',
                    }}
                  >
                    <Group gap="md" justify="space-between">
                      <Group gap="sm">
                        <Box
                          style={{
                            backgroundColor: PRIMARY_BROWN,
                            borderRadius: '8px',
                            padding: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <field.value.icon size={20} color="white" />
                        </Box>
                        <Box>
                          <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600}>
                            Selected Case Type
                          </Text>
                          <Text size="sm" fw={600} c={CHARCOAL}>
                            {field.value.label}
                          </Text>
                        </Box>
                      </Group>
                      <Button
                        variant="subtle"
                        size="sm"
                        color={PRIMARY_BROWN}
                        onClick={() => setModalOpened(true)}
                      >
                        Change
                      </Button>
                    </Group>
                  </Paper>
                )}
                {errors.caseType && (
                  <Text size="sm" c="#E74C3C" mt="xs">
                    {errors.caseType.message}
                  </Text>
                )}
              </>
            )}
          />
        </Box>

        <Divider color="#F0F0F0" />

        {/* Short Description */}
        <Box>
          <Group gap={8} mb={8}>
            <Text size="sm" fw={600} c={CHARCOAL}>
              Short Description
            </Text>
            <Text size="sm" c="red">*</Text>
          </Group>
          <Controller
            name="shortDescription"
            control={control}
            rules={caseValidationRules.shortDescription}
            render={({ field }) => (
              <Textarea
                {...field}
                placeholder="Provide a brief summary (2-3 sentences)"
                size="md"
                minRows={3}
                error={errors.shortDescription?.message}
                styles={{
                  input: {
                    borderColor: errors.shortDescription ? '#E74C3C' : '#E0E0E0',
                    '&:focus': {
                      borderColor: errors.shortDescription ? '#E74C3C' : PRIMARY_BROWN,
                    },
                  },
                }}
              />
            )}
          />
          <Text size="xs" c={MUTED_OLIVE} mt={4}>
            A quick overview of your legal issue
          </Text>
        </Box>

        {/* Detailed Description */}
        <Box>
          <Group gap={8} mb={8}>
            <Text size="sm" fw={600} c={CHARCOAL}>
              Detailed Description
            </Text>
            <Text size="sm" c="red">*</Text>
          </Group>
          <Controller
            name="detailedDescription"
            control={control}
            rules={caseValidationRules.detailedDescription}
            render={({ field }) => (
              <Textarea
                {...field}
                placeholder="Provide detailed information about your case, including relevant dates, parties involved, and any important details"
                size="md"
                minRows={6}
                error={errors.detailedDescription?.message}
                styles={{
                  input: {
                    borderColor: errors.detailedDescription ? '#E74C3C' : '#E0E0E0',
                    '&:focus': {
                      borderColor: errors.detailedDescription ? '#E74C3C' : PRIMARY_BROWN,
                    },
                  },
                }}
              />
            )}
          />
          <Text size="xs" c={MUTED_OLIVE} mt={4}>
            Include all relevant facts, dates, and circumstances
          </Text>
        </Box>

        {/* Information Alert */}
        <Alert
          icon={<IconInfoCircle size={20} />}
          color="blue"
          variant="light"
          styles={{
            root: {
              backgroundColor: `${PRIMARY_GOLD}10`,
              border: `1px solid ${PRIMARY_GOLD}`,
            },
            icon: {
              color: PRIMARY_BROWN,
            },
          }}
        >
          <Text size="sm" c={CHARCOAL}>
            After submission, your case will be reviewed and an attorney will be assigned to assist you. You will receive a confirmation email within 24-48 hours.
          </Text>
        </Alert>

        <Divider color="#F0F0F0" />

        {/* Submit Button */}
        <Group justify="flex-end" mt="md" gap="md">
          <Button 
            variant="outline"
            size="md"
            color={MUTED_OLIVE}
            type="button"
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
            Save as Draft
          </Button>
          <Button 
            size="md" 
            type="submit"
            leftSection={<IconFileText size={20} />}
            loading={isSubmitting}
            styles={{
              root: {
                backgroundColor: PRIMARY_BROWN,
                '&:hover': {
                  backgroundColor: '#5a3d2b',
                },
              },
            }}
          >
            Submit Case
          </Button>
        </Group>

        <CaseTypeSelectorModal
          opened={modalOpened}
          onClose={() => setModalOpened(false)}
          onSelect={handleCaseTypeSelect}
          selectedType={caseType}
        />
      </Stack>
    </form>
  );
};

export default CaseForm;