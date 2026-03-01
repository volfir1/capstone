import { Box, Container, Title, Text, Button, Group, SimpleGrid, Stack, Badge, Card, ThemeIcon, Divider, Avatar, rem, Image, Burger, Drawer, ScrollArea } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useNavigate, Link } from "react-router";
import { useState, useCallback } from "react";
import {
  IconScale, IconShieldCheck, IconUsers, IconClipboardCheck,
  IconGavel, IconTarget, IconHeart, IconCalendarEvent, IconFileText,
  IconArrowRight, IconCheck, IconBrandLinkedin, IconBrandGithub, IconMail,
  IconBuildingArch, IconHandStop, IconUserCheck,
} from "@tabler/icons-react";
import { PRIMARY_GOLD, PRIMARY_BROWN, MUTED_OLIVE, CHARCOAL } from "@/utils/constants";

/* ───────── smooth-scroll helper ───────── */
const scrollTo = (id) => {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
};

/* ───────── data ───────── */
const NAV = [
  { label: "Features", id: "features" },
  { label: "How It Works", id: "how" },
  { label: "About", id: "about" },
  { label: "Team", id: "team" },
];

const FEATURES = [
  { icon: IconCalendarEvent, title: "Easy Appointment Booking", desc: "Submit a legal aid appointment request anytime — no account or login required. Just fill out the form and you're set." },
  { icon: IconUsers, title: "Free Legal Consultations", desc: "Get connected with verified legal aid lawyers for free professional advice, document drafting, and court representation." },
  { icon: IconClipboardCheck, title: "Guided Appointment Form", desc: "Our step-by-step form walks you through providing the right details so the legal office can assess your concern quickly." },
  { icon: IconHandStop, title: "No Account Needed", desc: "You don't need to create an account or remember a password. Simply submit your appointment and the office takes it from there." },
];

const STEPS = [
  { num: "01", icon: IconClipboardCheck, title: "Submit Appointment", desc: "Fill out the guided appointment form with your personal details and legal concern — no account needed." },
  { num: "02", icon: IconUserCheck, title: "Office Reviews", desc: "The SOLA legal office staff reviews your submission and evaluates your legal concern." },
  { num: "03", icon: IconCalendarEvent, title: "Get Scheduled", desc: "The office confirms your appointment and schedules a consultation date at the legal aid office." },
  { num: "04", icon: IconGavel, title: "Meet at the Office", desc: "Visit the SOLA office for your consultation. All case discussions, updates, and decisions happen in person." },
];

const STATS = [
  { value: "100%", label: "Free legal assistance for qualified individuals" },
  { value: "24/7", label: "Appointment form available anytime" },
  { value: "4-Step", label: "Simple process from request to consultation" },
  { value: "No Login", label: "Book an appointment without an account" },
];

const TEAM = [
  { name: "John Leonard O. Nagallo", role: "Lead Developer & Project Manager", initials: "JN", desc: "Full-stack development and system architecture." },
  { name: "Gwyneth Selwyn Zoe G. Ortiz", role: "UI/UX Designer & Frontend Developer", initials: "GO", desc: "Accessible and intuitive user interface design." },
  { name: "Jade C. Pis-an", role: "Backend Developer & AI Specialist", initials: "JP", desc: "AI integration, data security, and system reliability." },
  { name: "Lester I. Sible", role: "Database Admin & Research Lead", initials: "LS", desc: "Data infrastructure and community-centered research." },
];

/* ───────── section wrapper ───────── */
const Section = ({ id, bg = "white", py = 80, children }) => (
  <Box id={id} style={{ backgroundColor: bg }}>
    <Container size="lg" py={rem(py)}>{children}</Container>
  </Box>
);

const SectionBadge = ({ children }) => (
  <Badge variant="light" color={PRIMARY_BROWN} size="lg" radius="sm" mb="xs" style={{ fontWeight: 600, letterSpacing: 0.5 }}>
    {children}
  </Badge>
);

/* ═══════════════════════════════════════════
   LANDING PAGE
   ═══════════════════════════════════════════ */
export default function LandingPage() {
  const navigate = useNavigate();
  const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] = useDisclosure(false);
  const [hovered, setHovered] = useState(null);

  const goAppointment = useCallback(() => navigate("/appointment"), [navigate]);

  return (
    <Box>
      {/* ─── HEADER ─── */}
      <Box component="header" style={{ position: "sticky", top: 0, zIndex: 100, backgroundColor: "white", borderBottom: "1px solid #e8e8e8", height: 60 }}>
        <Container size="lg" h="100%">
          <Group justify="space-between" align="center" h="100%">
            <Group gap="xs" style={{ cursor: "pointer" }} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
              <Image src="/sola_logo.png" alt="Logo" w={32} h={32} fit="contain" />
              <Text span fw={700} size="lg" c={PRIMARY_GOLD}>SOLA –</Text>
              <Text span fw={700} size="lg" c={PRIMARY_BROWN}>JustReach</Text>
            </Group>

            <Group gap={0} visibleFrom="sm">
              {NAV.map((n) => (
                <Text
                  key={n.id}
                  component="a"
                  href={`#${n.id}`}
                  size="sm"
                  fw={500}
                  px="md"
                  py="xs"
                  style={{
                    cursor: "pointer",
                    textDecoration: "none",
                    color: hovered === n.id ? PRIMARY_BROWN : CHARCOAL,
                    transition: "color .2s",
                  }}
                  onMouseEnter={() => setHovered(n.id)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={(e) => { e.preventDefault(); scrollTo(n.id); }}
                >
                  {n.label}
                </Text>
              ))}
              <Button ml="md" radius="xl" variant="gradient" gradient={{ from: PRIMARY_GOLD, to: PRIMARY_BROWN }} onClick={goAppointment}>
                Get Legal Aid
              </Button>
            </Group>

            <Burger opened={drawerOpened} onClick={toggleDrawer} hiddenFrom="sm" color={PRIMARY_BROWN} />
          </Group>
        </Container>
      </Box>

      {/* Mobile drawer */}
      <Drawer opened={drawerOpened} onClose={closeDrawer} size="70%" padding="md" title="Navigation" hiddenFrom="sm" position="right" zIndex={1000000}>
        <ScrollArea h="calc(100vh - 80px)">
          <Divider my="sm" />
          {NAV.map((n) => (
            <Text key={n.id} component="a" href={`#${n.id}`} display="block" size="sm" fw={500} py="sm" px="md"
              style={{ textDecoration: "none", color: CHARCOAL }} onClick={(e) => { e.preventDefault(); closeDrawer(); setTimeout(() => scrollTo(n.id), 300); }}>
              {n.label}
            </Text>
          ))}
          <Divider my="sm" />
          <Box px="md" pb="xl">
            <Button fullWidth radius="xl" variant="gradient" gradient={{ from: PRIMARY_GOLD, to: PRIMARY_BROWN }} onClick={() => { closeDrawer(); goAppointment(); }}>
              Get Legal Aid
            </Button>
          </Box>
        </ScrollArea>
      </Drawer>

      {/* ─── HERO ─── */}
      <Box style={{
        position: "relative",
        backgroundImage: "url(https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1920&q=80)",
        backgroundSize: "cover", backgroundPosition: "center",
        minHeight: 520,
      }}>
        <Box style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(44,44,44,.88) 0%, rgba(139,69,19,.75) 100%)" }} />
        <Container size="lg" style={{ position: "relative", zIndex: 1 }} py={rem(100)}>
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl" verticalSpacing="xl">
            <Stack gap="lg" justify="center">
              <Badge variant="light" color="yellow" size="lg" radius="sm" w="fit-content" style={{ fontWeight: 600 }}>
                Supporting SDG 16: Peace, Justice &amp; Strong Institutions
              </Badge>
              <Title order={1} c="white" fz={{ base: 32, md: 42 }} lh={1.2}>
                Free Legal Aid for{" "}
                <Text span inherit c={PRIMARY_GOLD}>Filipino Communities</Text>
              </Title>
              <Text c="gray.3" size="lg" maw={520}>
                Book a free legal aid appointment with SOLA — no account needed. Just submit the form and the office handles the rest, from review to consultation.
              </Text>
              <Group mt="sm">
                <Button size="lg" radius="xl" variant="gradient" gradient={{ from: PRIMARY_GOLD, to: PRIMARY_BROWN }}
                  rightSection={<IconArrowRight size={18} />} onClick={goAppointment}>
                  Get Legal Assistance
                </Button>
              </Group>
            </Stack>

            <Box visibleFrom="md" style={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
              <Card w={320} radius="lg" p="xl" style={{ background: `linear-gradient(135deg, ${PRIMARY_GOLD}, ${PRIMARY_BROWN})` }}>
                <ThemeIcon size={48} radius="xl" variant="white" color={PRIMARY_BROWN} mb="md">
                  <IconScale size={24} />
                </ThemeIcon>
                <Text c="white" fw={600} size="lg" mb="sm">Making Justice Accessible</Text>
                <Stack gap={8}>
                  {["Free Legal Consultations", "Easy Appointment Booking", "No Account Required"].map((t) => (
                    <Group key={t} gap={8} wrap="nowrap">
                      <IconCheck size={16} color="white" />
                      <Text c="white" size="sm">{t}</Text>
                    </Group>
                  ))}
                </Stack>
              </Card>
            </Box>
          </SimpleGrid>
        </Container>
      </Box>

      {/* ─── FEATURES ─── */}
      <Section id="features" py={90}>
        <Stack align="center" mb={rem(50)}>
          <SectionBadge>Platform Features</SectionBadge>
          <Title order={2} ta="center" c={CHARCOAL}>Why Choose SOLA</Title>
          <Text c="dimmed" ta="center" maw={600} size="md">
            We make it simple to access free legal aid — just book an appointment and the office takes care of everything else.
          </Text>
        </Stack>
        <SimpleGrid cols={{ base: 1, sm: 2, md: 2 }} spacing="xl">
          {FEATURES.map((f) => (
            <Card key={f.title} radius="md" padding="xl" withBorder style={{ borderColor: "#f0ede8", transition: "box-shadow .2s", cursor: "default" }}
              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 8px 24px rgba(139,69,19,.08)")}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}>
              <ThemeIcon size={48} radius="md" variant="light" color={PRIMARY_BROWN} mb="md">
                <f.icon size={24} stroke={1.8} />
              </ThemeIcon>
              <Text fw={600} size="md" mb={6} c={CHARCOAL}>{f.title}</Text>
              <Text size="sm" c="dimmed" lh={1.6}>{f.desc}</Text>
            </Card>
          ))}
        </SimpleGrid>
      </Section>

      {/* ─── HOW IT WORKS ─── */}
      <Section id="how" bg="#FAFAF8" py={90}>
        <Stack align="center" mb={rem(50)}>
          <SectionBadge>How It Works</SectionBadge>
          <Title order={2} ta="center" c={CHARCOAL}>Get Legal Help in 4 Simple Steps</Title>
          <Text c="dimmed" ta="center" maw={560} size="md">
            We've streamlined the legal assistance process to make it accessible, transparent, and efficient.
          </Text>
        </Stack>
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="xl">
          {STEPS.map((s) => (
            <Card key={s.num} radius="md" padding="xl" withBorder style={{ borderColor: "#f0ede8", textAlign: "center" }}>
              <Text fw={800} fz={28} c={PRIMARY_GOLD} mb="xs">{s.num}</Text>
              <ThemeIcon size={44} radius="xl" variant="light" color={PRIMARY_BROWN} mx="auto" mb="md">
                <s.icon size={22} stroke={1.8} />
              </ThemeIcon>
              <Text fw={600} size="md" mb={6} c={CHARCOAL}>{s.title}</Text>
              <Text size="sm" c="dimmed" lh={1.6}>{s.desc}</Text>
            </Card>
          ))}
        </SimpleGrid>
        <Group justify="center" mt={rem(40)}>
          <Button size="lg" radius="xl" variant="gradient" gradient={{ from: PRIMARY_GOLD, to: PRIMARY_BROWN }}
            rightSection={<IconArrowRight size={18} />} onClick={goAppointment}>
            Start Your Request
          </Button>
        </Group>
      </Section>

      {/* ─── VIDEO DEMO ─── */}
      <Section id="demo" py={90}>
        <Stack align="center" mb={rem(40)}>
          <SectionBadge>Video Demo</SectionBadge>
          <Title order={2} ta="center" c={CHARCOAL}>See SOLA JustReach in Action</Title>
          <Text c="dimmed" ta="center" maw={560} size="md">
            Watch a quick walkthrough of how to book an appointment and what to expect from the legal aid process.
          </Text>
        </Stack>
        <Box mx="auto" maw={800} style={{ borderRadius: 12, overflow: "hidden", boxShadow: "0 8px 32px rgba(44,44,44,.12)", aspectRatio: "16/9" }}>
          <iframe
            width="100%"
            height="100%"
            src="https://www.youtube.com/embed/YOUR_VIDEO_ID"
            title="JustReach Platform Demo"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ border: 0 }}
          />
        </Box>
      </Section>

      {/* ─── IMPACT / STATS ─── */}
      <Section id="impact" py={70}>
        <SimpleGrid cols={{ base: 2, md: 4 }} spacing="xl">
          {STATS.map((s) => (
            <Stack key={s.value} align="center" gap={4}>
              <Text fw={800} fz={36} c={PRIMARY_BROWN}>{s.value}</Text>
              <Text size="sm" c="dimmed" ta="center" maw={180}>{s.label}</Text>
            </Stack>
          ))}
        </SimpleGrid>
      </Section>

      {/* ─── ABOUT SOLA ─── */}
      <Section id="about" bg="#FAFAF8" py={90}>
        <Stack align="center" mb={rem(50)}>
          <SectionBadge>About</SectionBadge>
          <Title order={2} ta="center" c={CHARCOAL}>The Sebastinian Office of Legal Aid</Title>
          <Text c="dimmed" ta="center" maw={680} size="md">
            SOLA was established on August 28, 1992, under the Supreme Court's permit. As the legal aid arm of San Sebastian College–Recoletos, 
            it provides free, accessible, ethical, and quality legal representation to indigent individuals — handling criminal, civil, labor, 
            and administrative cases through its Executive Director, supervising lawyers, and law interns.
          </Text>
        </Stack>

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
          <Card radius="md" padding="xl" withBorder style={{ borderColor: "#f0ede8" }}>
            <ThemeIcon size={44} radius="md" variant="light" color={PRIMARY_BROWN} mb="md">
              <IconTarget size={22} stroke={1.8} />
            </ThemeIcon>
            <Text fw={600} size="lg" mb="xs" c={CHARCOAL}>Our Mission</Text>
            <Text size="sm" c="dimmed" lh={1.7}>
              To democratize access to legal services in the Philippines by creating a technology-driven platform that connects 
              underserved communities with qualified legal professionals, breaking down barriers of cost, distance, and complexity.
            </Text>
          </Card>
          <Card radius="md" padding="xl" withBorder style={{ borderColor: "#f0ede8" }}>
            <ThemeIcon size={44} radius="md" variant="light" color={PRIMARY_GOLD} mb="md">
              <IconHeart size={22} stroke={1.8} />
            </ThemeIcon>
            <Text fw={600} size="lg" mb="xs" c={CHARCOAL}>Our Vision</Text>
            <Text size="sm" c="dimmed" lh={1.7}>
              A Philippines where every citizen, regardless of socioeconomic status or geographic location, can exercise their 
              legal rights and access justice through an inclusive, transparent, and efficient digital platform.
            </Text>
          </Card>
        </SimpleGrid>
      </Section>

      {/* ─── TEAM ─── */}
      <Section id="team" py={90}>
        <Stack align="center" mb={rem(50)}>
          <SectionBadge>The Team</SectionBadge>
          <Title order={2} ta="center" c={CHARCOAL}>The Minds Behind JustReach</Title>
          <Text c="dimmed" ta="center" maw={560} size="md">
            IT students from the Technological University of the Philippines – Taguig, committed to making a difference through technology.
          </Text>
        </Stack>
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="xl">
          {TEAM.map((m) => (
            <Card key={m.initials} radius="md" padding="xl" withBorder style={{ borderColor: "#f0ede8", textAlign: "center" }}>
              <Avatar size={64} radius="xl" mx="auto" mb="md"
                style={{ background: `linear-gradient(135deg, ${PRIMARY_GOLD}, ${PRIMARY_BROWN})`, border: `2px solid ${PRIMARY_GOLD}40` }}>
                <Text fw={700} c="white" size="md">{m.initials}</Text>
              </Avatar>
              <Text fw={600} size="md" c={CHARCOAL}>{m.name}</Text>
              <Text size="xs" c={PRIMARY_BROWN} fw={500} mb={6}>{m.role}</Text>
              <Text size="sm" c="dimmed">{m.desc}</Text>
              <Group justify="center" gap={8} mt="sm">
                <IconBrandLinkedin size={18} color={MUTED_OLIVE} style={{ cursor: "pointer" }} />
                <IconBrandGithub size={18} color={MUTED_OLIVE} style={{ cursor: "pointer" }} />
                <IconMail size={18} color={MUTED_OLIVE} style={{ cursor: "pointer" }} />
              </Group>
            </Card>
          ))}
        </SimpleGrid>
      </Section>

      {/* ─── CTA ─── */}
      <Box style={{ background: `linear-gradient(135deg, ${CHARCOAL} 0%, ${PRIMARY_BROWN} 100%)` }}>
        <Container size="lg" py={rem(80)}>
          <Stack align="center" gap="lg">
            <Title order={2} ta="center" c="white">Ready to Access Justice?</Title>
            <Text c="gray.4" ta="center" maw={520} size="md">
              Take the first step toward resolving your legal concern. Book a free appointment — no account or login needed.
            </Text>
            <Group gap="sm">
              <Badge variant="outline" color={PRIMARY_GOLD} size="lg" style={{ color: "white", borderColor: `${PRIMARY_GOLD}80` }}>No hidden fees</Badge>
              <Badge variant="outline" color={PRIMARY_GOLD} size="lg" style={{ color: "white", borderColor: `${PRIMARY_GOLD}80` }}>No account needed</Badge>
              <Badge variant="outline" color={PRIMARY_GOLD} size="lg" style={{ color: "white", borderColor: `${PRIMARY_GOLD}80` }}>Verified legal aid lawyers</Badge>
            </Group>
            <Button size="lg" radius="xl" variant="white" color={PRIMARY_BROWN}
              rightSection={<IconArrowRight size={18} />} onClick={goAppointment} mt="sm">
              Schedule Free Appointment
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* ─── FOOTER ─── */}
      <Box component="footer" style={{ borderTop: `2px solid`, borderImage: `linear-gradient(90deg, ${PRIMARY_GOLD}, ${PRIMARY_BROWN}) 1`, backgroundColor: "white" }}>
        <Container size="lg" py="xl">
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xl">
            <Box>
              <Group gap="xs" mb="md">
                <Image src="/sola_logo.png" alt="Logo" w={40} h={40} fit="contain" />
                <Title order={4}>
                  <Text span fw={700} c={PRIMARY_GOLD}>Just</Text>
                  <Text span fw={700} c={PRIMARY_BROWN}>Reach</Text>
                </Title>
              </Group>
              <Text c="dimmed" size="sm" mb={4}>Sebastinian Office of Legal Aid</Text>
              <Text c="dimmed" size="xs">Supporting SDG 16: Peace, Justice, and Strong Institutions</Text>
            </Box>
            <Box>
              <Text fw={600} mb="sm">Platform</Text>
              <Stack gap={6}>
                {NAV.map((n) => (
                  <Text key={n.id} component="a" href={`#${n.id}`} size="sm" c="dimmed" style={{ textDecoration: "none", cursor: "pointer" }}
                    onClick={(e) => { e.preventDefault(); scrollTo(n.id); }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = PRIMARY_GOLD)}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "")}>
                    {n.label}
                  </Text>
                ))}
              </Stack>
            </Box>
            <Box>
              <Text fw={600} mb="sm">Legal</Text>
              <Stack gap={6}>
                <Link to="/privacy" style={{ textDecoration: "none" }}>
                  <Group gap={6}><IconShieldCheck size={13} color={PRIMARY_GOLD} /><Text size="sm" c="dimmed">Privacy Policy</Text></Group>
                </Link>
                <Link to="/terms" style={{ textDecoration: "none" }}>
                  <Group gap={6}><IconFileText size={13} color={PRIMARY_GOLD} /><Text size="sm" c="dimmed">Terms of Service</Text></Group>
                </Link>
              </Stack>
              <Group gap={6} mt="lg">
                <IconBuildingArch size={14} color={MUTED_OLIVE} />
                <Text size="xs" c="dimmed">TUP – Taguig Campus</Text>
              </Group>
            </Box>
          </SimpleGrid>
          <Divider my="lg" />
          <Group justify="space-between">
            <Text c="dimmed" size="xs">© 2025 JUSTREACH — Nagallo, Ortiz, Pis-an &amp; Sible</Text>
            <Text c="dimmed" size="xs">Technological University of the Philippines – Taguig</Text>
          </Group>
        </Container>
      </Box>
    </Box>
  );
}