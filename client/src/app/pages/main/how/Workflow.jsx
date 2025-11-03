import {
  Title,
  Text,
  Container,
  Grid,
  Paper,
  ThemeIcon,
  Box,
  Stack,
  Badge,
  Timeline,
  rem,
} from "@mantine/core";
import {
  IconReport,
  IconProgressCheck,
  IconBrain,
  IconFileUpload,
  IconUserCheck,
  IconCalendar,
  IconBell,
  IconShieldCheck,
  IconLanguage,
  IconSearch,
  IconVideo,
} from "@tabler/icons-react";
import { PRIMARY_GOLD, PRIMARY_BROWN, THEMED_LIGHT_BG } from "../../../../utils/constants"; // Adjust path as needed

export default function DetailedWorkflow() {
  return (
    <Box style={{ backgroundColor: THEMED_LIGHT_BG }}>
      <Container size="xl" py={rem(100)}>
        <Stack spacing="xl" mb={60}>
          <Badge
            size="lg"
            radius="xl"
            style={{ 
              margin: '0 auto',
              backgroundColor: `${PRIMARY_GOLD}20`, 
              color: PRIMARY_BROWN 
            }}
          >
            Detailed Process
          </Badge>
          
          <Title order={2} ta="center">
            Behind the Scenes
          </Title>
        </Stack>

        <Grid gutter={50} align="center">
          <Grid.Col span={12} md={6}>
            <Timeline
              active={8}
              bulletSize={30}
              lineWidth={3}
              color={PRIMARY_BROWN}
            >
              <Timeline.Item
                bullet={<IconUserCheck size={16} />}
                title="Create Account"
              >
                <Text c="dimmed" size="sm">
                  Sign up with basic information and verify your identity through 
                  our secure registration process.
                </Text>
              </Timeline.Item>

              <Timeline.Item
                bullet={<IconLanguage size={16} />}
                title="Choose Language"
              >
                <Text c="dimmed" size="sm">
                  Select your preferred language for the platform interface and 
                  legal documents.
                </Text>
              </Timeline.Item>

              <Timeline.Item
                bullet={<IconReport size={16} />}
                title="File Report"
              >
                <Text c="dimmed" size="sm">
                  Complete the guided reporting form integrated with barangay-level 
                  blotter system.
                </Text>
              </Timeline.Item>

              <Timeline.Item
                bullet={<IconBrain size={16} />}
                title="AI Analysis"
              >
                <Text c="dimmed" size="sm">
                  System analyzes your case and provides instant legal recommendations 
                  and severity assessment.
                </Text>
              </Timeline.Item>

              <Timeline.Item
                bullet={<IconSearch size={16} />}
                title="Lawyer Matching"
              >
                <Text c="dimmed" size="sm">
                  You're matched with an appropriate PAO volunteer lawyer based on 
                  case type and expertise.
                </Text>
              </Timeline.Item>

              <Timeline.Item
                bullet={<IconCalendar size={16} />}
                title="Schedule Consultation"
              >
                <Text c="dimmed" size="sm">
                  Book your consultation slot at a time that works for you, with 
                  flexible rescheduling options.
                </Text>
              </Timeline.Item>

              <Timeline.Item
                bullet={<IconVideo size={16} />}
                title="Attend Meeting"
              >
                <Text c="dimmed" size="sm">
                  Join your video/audio consultation with your assigned lawyer through 
                  our low-bandwidth optimized platform.
                </Text>
              </Timeline.Item>

              <Timeline.Item
                bullet={<IconProgressCheck size={16} />}
                title="Track Progress"
              >
                <Text c="dimmed" size="sm">
                  Monitor case updates, upload additional documents, and communicate 
                  with your lawyer throughout the process.
                </Text>
              </Timeline.Item>
            </Timeline>
          </Grid.Col>

          <Grid.Col span={12} md={6}>
            <Stack spacing="md">
              <Paper p="xl" radius="xl" withBorder>
                <ThemeIcon
                  size={60}
                  radius="xl"
                  variant="gradient"
                  gradient={{ from: PRIMARY_GOLD, to: PRIMARY_BROWN }}
                  mb="md"
                >
                  <IconFileUpload size={30} stroke={1.5} />
                </ThemeIcon>
                <Title order={4} mb="sm">Easy Document Upload</Title>
                <Text c="dimmed" size="sm" lh={1.7}>
                  Take photos or scan documents directly from your mobile device. 
                  Our system supports multiple formats and guides you on required 
                  documentation.
                </Text>
              </Paper>

              <Paper p="xl" radius="xl" withBorder>
                <ThemeIcon
                  size={60}
                  radius="xl"
                  style={{ 
                    backgroundColor: `${PRIMARY_GOLD}20`, 
                    color: PRIMARY_BROWN 
                  }}
                  mb="md"
                >
                  <IconBell size={30} stroke={1.5} />
                </ThemeIcon>
                <Title order={4} mb="sm">Real-Time Notifications</Title>
                <Text c="dimmed" size="sm" lh={1.7}>
                  Stay informed with push notifications for case updates, upcoming 
                  appointments, and messages from your lawyer.
                </Text>
              </Paper>

              <Paper p="xl" radius="xl" withBorder>
                <ThemeIcon
                  size={60}
                  radius="xl"
                  variant="gradient"
                  gradient={{ from: PRIMARY_GOLD, to: PRIMARY_BROWN }}
                  mb="md"
                >
                  <IconShieldCheck size={30} stroke={1.5} />
                </ThemeIcon>
                <Title order={4} mb="sm">Secure & Confidential</Title>
                <Text c="dimmed" size="sm" lh={1.7}>
                  All your information is encrypted and protected. Only you and your 
                  assigned legal professionals have access to your case details.
                </Text>
              </Paper>
            </Stack>
          </Grid.Col>
        </Grid>
      </Container>
    </Box>
  );
}