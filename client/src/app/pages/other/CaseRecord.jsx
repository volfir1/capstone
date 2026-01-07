import React, { useState } from 'react';
import { Container, Box } from '@mantine/core';
import { CaseInformationSection } from './CaseInformationSection';

const THEMED_LIGHT_BG = '#F7F7F7';

export default function CaseRecord() {
    const [caseInfo, setCaseInfo] = useState({});

    return (
        <Box 
            bg={THEMED_LIGHT_BG} 
            mih="100vh" 
            py="xl"
            style={{
                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"',
            }}
        >
            <Container size="xl">
                <CaseInformationSection value={caseInfo} onChange={setCaseInfo} />
            </Container>
        </Box>
    );
}
