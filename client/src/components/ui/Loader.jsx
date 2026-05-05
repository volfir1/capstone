import { Box, Paper, Skeleton, Stack } from '@mantine/core';

/**
 * A reusable, quiet loading placeholder for the application.
 * @param {object} props
 * @param {number} [props.height=300] - The height of the container.
 */
export function Loaders({ height = 300 }) {
  return (
    <Box
      bg="#FAF8F4"
      p="lg"
      style={{
        minHeight: `${height}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Paper p="lg" radius="lg" bg="white" maw={620} w="100%" style={{ border: '1px solid #F0F0F0' }}>
        <Stack gap="md">
          <Skeleton height={22} width="45%" radius="sm" />
          <Skeleton height={12} width="82%" radius="sm" />
          <Skeleton height={12} width="64%" radius="sm" />
          <Skeleton height={38} width="100%" radius="md" />
        </Stack>
      </Paper>
    </Box>
  );
}
