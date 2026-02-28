import {
  Title,
  Text,
  Container,
  ThemeIcon,
  Card,
  Stack,
  rem,
} from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import { PRIMARY_GOLD, PRIMARY_BROWN } from "../../../../utils/constants";

export default function SOLASection() {
  return (
    <Container size="xl" py={rem(40)}>
      <Card shadow="md" p="xl" radius="xl" withBorder>
        <Stack spacing="md">
          <ThemeIcon
            size={70}
            radius="xl"
            variant="gradient"
            gradient={{ from: PRIMARY_GOLD, to: PRIMARY_BROWN }}
          >
            <IconInfoCircle size={40} stroke={1.5} />
          </ThemeIcon>

          <Title order={2}>About the Sebastinian Office of Legal Aid (SOLA)</Title>

          <Text c="dimmed" size="lg" lh={1.7}>
            The Sebastinian Office of Legal Aid (SOLA) was formally established on
            August 28, 1992, after securing the necessary permit from the Supreme
            Court. The office was founded in honor of Saint Augustine of Hippo and
            serves as the legal aid arm of San Sebastian College-Recoletos.
          </Text>

          <Text c="dimmed" size="lg" lh={1.7}>
            SOLA provides free, accessible, ethical, and quality legal
            representation, assistance, and advice to indigent individuals. The
            office handles selected criminal, civil, labor, and administrative
            cases, ensuring that those who cannot afford legal services still have
            access to justice.
          </Text>

          <Text c="dimmed" size="lg" lh={1.7}>
            The office operates through its Executive Director, supervising
            lawyers, and law interns who are authorized to practice under the Law
            Student Practice Rule (Rule 138-A of the Rules of Court). Through this
            program, law interns apply their legal knowledge by giving legal
            advice, preparing legal documents and pleadings, and representing
            clients in courts and quasi-judicial agencies under proper
            supervision.
          </Text>

          <Text c="dimmed" size="lg" lh={1.7}>
            Currently, SOLA is managed by Executive Director Atty. Edgardo
            Alexander O. Gayos, under the supervision of the Dean of the College
            of Law, Atty. Teodoro A. Pastrana, and Associate Dean Atty. Rolly
            Francis C. Peoro.
          </Text>
        </Stack>
      </Card>
    </Container>
  );
}
