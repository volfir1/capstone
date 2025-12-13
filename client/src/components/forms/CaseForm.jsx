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
import { IconChevronDown, IconCheck, IconInfoCircle, IconFileText, IconAlertCircle } from "@tabler/icons-react";
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
          borderBottom: `2px solid ${THEMED_LIGHT_BG}`,
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
                shadow="sm"
                p="lg"
                style={{
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  border: isSelected 
                    ? `2px solid ${PRIMARY_BROWN}` 
                    : `2px solid ${THEMED_LIGHT_BG}`,
                  backgroundColor: isSelected ? `${PRIMARY_BROWN}10` : 'white',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = ACCENT_TAN;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = THEMED_LIGHT_BG;
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '';
                  }
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
                      top: 8,
                      right: 8,
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
      <Stack gap="lg">
        {/* Case Title */}
        <Box>
          <Text size="sm" fw={600} c={CHARCOAL} mb={4}>
            Case Title *
          </Text>
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
                    borderColor: errors.caseTitle ? 'red' : ACCENT_TAN,
                    '&:focus': {
                      borderColor: errors.caseTitle ? 'red' : PRIMARY_GOLD,
                    },
                  },
                }}
              />
            )}
          />
        </Box>

        <Divider color={ACCENT_TAN} opacity={0.3} />

        {/* Case Type Selector */}
        <Box>
          <Title order={4} mb="xs" c={CHARCOAL} fw={600}>
            Case Type *
          </Title>
          <Text size="sm" c={MUTED_OLIVE} mb="sm">
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
                        borderColor: errors.caseType ? 'red' : ACCENT_TAN,
                        color: MUTED_OLIVE,
                        borderWidth: '2px',
                        borderStyle: 'dashed',
                        height: '60px',
                        '&:hover': {
                          borderColor: errors.caseType ? 'red' : PRIMARY_GOLD,
                          backgroundColor: `${PRIMARY_GOLD}10`,
                        },
                      },
                    }}
                  >
                    <Text size="md" c={MUTED_OLIVE}>
                      Click to select a case type
                    </Text>
                  </Button>
                ) : (
                  <Paper 
                    p="md" 
                    bg={`${PRIMARY_GOLD}15`}
                    style={{ 
                      border: `1px solid ${PRIMARY_GOLD}`,
                      borderRadius: '8px',
                    }}
                  >
                    <Group gap="sm">
                      <Box
                        style={{
                          backgroundColor: PRIMARY_BROWN,
                          borderRadius: '8px',
                          padding: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <field.value.icon size={20} color="white" />
                      </Box>
                      <Box style={{ flex: 1 }}>
                        <Text size="sm" fw={600} c={CHARCOAL}>
                          Selected Case Type
                        </Text>
                        <Text size="sm" c={MUTED_OLIVE}>
                          {field.value.label}
                        </Text>
                      </Box>
                      <Button
                        variant="subtle"
                        size="xs"
                        color={PRIMARY_BROWN}
                        onClick={() => setModalOpened(true)}
                      >
                        Change
                      </Button>
                    </Group>
                  </Paper>
                )}
                {errors.caseType && (
                  <Text size="sm" c="red" mt="xs">
                    {errors.caseType.message}
                  </Text>
                )}
              </>
            )}
          />
        </Box>

        <Divider color={ACCENT_TAN} opacity={0.3} />

        {/* Short Description */}
        <Box>
          <Text size="sm" fw={600} c={CHARCOAL} mb={4}>
            Short Description *
          </Text>
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
                    borderColor: errors.shortDescription ? 'red' : ACCENT_TAN,
                    '&:focus': {
                      borderColor: errors.shortDescription ? 'red' : PRIMARY_GOLD,
                    },
                  },
                }}
              />
            )}
          />
        </Box>

        {/* Detailed Description */}
        <Box>
          <Text size="sm" fw={600} c={CHARCOAL} mb={4}>
            Detailed Description *
          </Text>
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
                    borderColor: errors.detailedDescription ? 'red' : ACCENT_TAN,
                    '&:focus': {
                      borderColor: errors.detailedDescription ? 'red' : PRIMARY_GOLD,
                    },
                  },
                }}
              />
            )}
          />
        </Box>

        {/* Information Alert */}
        <Alert
          icon={<IconInfoCircle size={20} />}
          color="gray"
          variant="light"
          style={{
            backgroundColor: `rgba(166, 138, 100, 0.15)`,
            borderLeft: `4px solid ${ACCENT_TAN}`,
          }}
        >
          <Text size="sm" fw={500} c={CHARCOAL}>
            After submission, your case will be reviewed and an attorney will be assigned to assist you. You will receive a confirmation email within 24-48 hours.
          </Text>
        </Alert>

        <Divider color={ACCENT_TAN} opacity={0.3} />

        {/* Submit Button */}
        <Group justify="flex-end" mt="md">
          <Button 
            variant="outline"
            size="lg"
            color={MUTED_OLIVE}
            type="button"
          >
            Save as Draft
          </Button>
          <Button 
            size="lg" 
            color={PRIMARY_BROWN}
            type="submit"
            leftSection={<IconFileText size={20} />}
            loading={isSubmitting}
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