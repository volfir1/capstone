import React from "react";
import { Box, Title } from "@mantine/core";
import UserManagementTable from "@/components/tables/userManagement/userManagementTable";

export default function UserManagement(){
    return(
        <>
             <Box>
        <Title order={2} size="1.8rem" fw={600} c="#1a1a1a" mb="xs">
          Users Management
        </Title>
        <Box c="dimmed" size="sm">
          Manage and view all users in your system
        </Box>
      </Box>
            <UserManagementTable />
        </>
    )
}