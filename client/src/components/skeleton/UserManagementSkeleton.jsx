import {
	Box,
	Container,
	Group,
	Paper,
	Skeleton,
	Title,
	Text,
	Select,
	Table,
	Stack,
} from "@mantine/core";
import {
	BG,
	MUTED_OLIVE,
	PRIMARY_BROWN,
	CHARCOAL,
} from "@/utils/constants";

export default function UserManagementSkeleton() {
	const ROWS = 6;

	return (
		<Box bg={BG} mih="100vh" py="xl">
			<Container size="xl">
				<Group justify="space-between" align="center" mb="lg">
					<div>
						<Title order={3} style={{ color: CHARCOAL, lineHeight: 1.2 }}>
							<Skeleton height={20} width={220} />
						</Title>
						<Text size="sm" style={{ color: MUTED_OLIVE, marginTop: 8 }}>
							<Skeleton height={12} width={320} />
						</Text>
					</div>
					<Skeleton height={36} width={36} radius="md" />
				</Group>

				<Paper shadow="xs" p="lg" mb="lg" radius="lg" bg="white" style={{ border: '1px solid #F0F0F0' }}>
					<Stack gap="md">
						<div style={{ maxWidth: 400 }}>
							<Skeleton height={40} />
						</div>

						<Group>
							<Skeleton height={36} width={120} radius="sm" />
							<Skeleton height={36} width={120} radius="sm" />
							<Skeleton height={36} width={120} radius="sm" />
						</Group>
					</Stack>
				</Paper>

				<Paper shadow="xs" radius="lg" style={{ backgroundColor: "white", border: "1px solid #E5E7EB", overflow: "hidden" }}>
					<div style={{ overflowX: "auto" }}>
						<Table>
							<thead>
								<tr style={{ backgroundColor: "#F9FAFB" }}>
									<th style={{ padding: "12px 20px" }}><Skeleton height={14} width={120} /></th>
									<th style={{ padding: "12px 20px" }}><Skeleton height={14} width={160} /></th>
									<th style={{ padding: "12px 20px" }}><Skeleton height={14} width={80} /></th>
									<th style={{ padding: "12px 20px" }}><Skeleton height={14} width={80} /></th>
									<th style={{ padding: "12px 20px" }}><Skeleton height={14} width={100} /></th>
									<th style={{ padding: "12px 20px", textAlign: 'right' }}><Skeleton height={14} width={80} /></th>
								</tr>
							</thead>
							<tbody>
								{Array.from({ length: ROWS }).map((_, i) => (
									<tr key={i} style={{ borderBottom: '1px solid #E5E7EB' }}>
										<td style={{ padding: "14px 20px" }}><Skeleton height={16} width={200} /></td>
										<td style={{ padding: "14px 20px" }}><Skeleton height={16} width={220} /></td>
										<td style={{ padding: "14px 20px" }}><Skeleton height={20} width={100} /></td>
										<td style={{ padding: "14px 20px" }}><Skeleton height={16} width={80} /></td>
										<td style={{ padding: "14px 20px" }}><Skeleton height={16} width={120} /></td>
										<td style={{ padding: "14px 20px", textAlign: 'right' }}><Skeleton height={36} width={80} radius="md" /></td>
									</tr>
								))}
							</tbody>
						</Table>
					</div>
				</Paper>

				<Paper shadow="xs" p="sm" px="lg" mt="lg" radius="lg" bg="white" style={{ border: '1px solid #F0F0F0' }}>
					<Group justify="space-between" align="center">
						<Group gap="sm" align="center">
							<Text size="sm" style={{ color: MUTED_OLIVE }}>
								<Skeleton height={12} width={220} />
							</Text>
							<Select data={[]} styles={{ input: { border: '1px solid #E5E7EB' } }} disabled />
						</Group>
						<div>
							<Skeleton height={36} width={160} radius="md" />
						</div>
					</Group>
				</Paper>
			</Container>
		</Box>
	);
}

