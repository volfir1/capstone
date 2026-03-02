import React, { useState, useEffect } from 'react';
import { 
    Group, 
    Box, 
    Text, 
    Title, 
    Paper, 
    Stack, 
    Divider, 
    Container, 
    TextInput, 
    Textarea, 
    Grid, 
    Table, 
    Checkbox,
    Radio,
    SimpleGrid,
    Button,
    Stepper,
    Badge,
    FileButton,
    
    Alert,
    Modal,
    Timeline,
    ScrollArea,
    Loader,
    Center
} from '@mantine/core';
import { IconChevronRight, IconChevronLeft, IconCircleCheck, IconFileText, IconArrowLeft, IconUpload, IconFile, IconX, IconDownload, IconEye, IconClock, IconCheck } from '@tabler/icons-react'; // Added icons
import { useAuth } from '@/context/authContext';
import { useLocation, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import { auth as firebaseAuth } from '@/firebase/firebase';

// Configure PDF.js worker â€” try local node_modules first, fall back to CDN
try {
    const pdfWorkerUrl = new URL('../../../../node_modules/pdfjs-dist/legacy/build/pdf.worker.min.js', import.meta.url).href;
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
} catch (err) {
    console.warn('Could not set pdfjs workerSrc via node_modules URL, falling back to CDN:', err);
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

// Normalize server file URLs so client always requests the backend, not the dev server origin
const getServerFileUrl = (pathOrUrl) => {
    if (!pathOrUrl) return pathOrUrl;
    try {
        // If already absolute URL, prefer IPv4 loopback when hostname is localhost
        const parsed = new URL(pathOrUrl);
        if (parsed.hostname === 'localhost') parsed.hostname = '127.0.0.1';
        return parsed.href;
    } catch (e) {
        // Not an absolute URL, treat as relative path (e.g., /uploads/..)
    }

    let apiHost = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/$/, '') : 'http://127.0.0.1:5000';
    // Prefer IPv4 loopback to avoid environments where `localhost` resolves to IPv6 ::1
    try {
        const parsedHost = new URL(apiHost);
        if (parsedHost.hostname === 'localhost') {
            parsedHost.hostname = '127.0.0.1';
            apiHost = parsedHost.href.replace(/\/$/, '');
        }
    } catch (e) {
        // ignore
    }
    if (pathOrUrl.startsWith('/')) return `${apiHost}${pathOrUrl}`;
    return `${apiHost}/${pathOrUrl}`;
};
// Robust fetch helper: tries absolute/relative and retries with 127.0.0.1 if localhost fails,
// and avoids returning HTML pages (dev server 404) which break binary parsers like mammoth.
const fetchArrayBufferFromUrl = async (rawUrl, cloudinaryUrl) => {
    if (!rawUrl && !cloudinaryUrl) throw new Error('No URL provided');

    // Data URL -> convert directly
    if (typeof rawUrl === 'string' && rawUrl.startsWith('data:')) {
        const base64 = rawUrl.split(',')[1];
        const binary = atob(base64);
        const len = binary.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
        return bytes.buffer;
    }

    // Helper: get auth headers for server URLs (not external/Cloudinary)
    const getAuthHeaders = async (url) => {
        try {
            const isServerUrl = typeof url === 'string' && (url.includes('/uploads/') || url.includes('/api/uploads/'));
            if (isServerUrl && firebaseAuth && firebaseAuth.currentUser) {
                const token = await firebaseAuth.currentUser.getIdToken();
                return { Authorization: `Bearer ${token}` };
            }
        } catch (e) { /* ignore */ }
        return {};
    };

    const tried = new Set();
    const candidates = [];
    // Cloudinary persistent URL first (if provided)
    if (cloudinaryUrl && typeof cloudinaryUrl === 'string') candidates.push(cloudinaryUrl);
    if (typeof rawUrl === 'string') {
        // If relative path
        if (rawUrl.startsWith('/')) candidates.push(getServerFileUrl(rawUrl));
        // Always try the raw string as given (could be absolute or blob/object URL)
        candidates.push(rawUrl);
        // If absolute and hostname is localhost, try 127.0.0.1 variant
        try {
            const u = new URL(rawUrl);
            if (u.hostname === 'localhost') {
                u.hostname = '127.0.0.1';
                candidates.push(u.href);
            }
        } catch (e) {
            // not an absolute URL
        }
        // Try decoded/encoded variants
        try {
            const decoded = decodeURIComponent(rawUrl);
            if (decoded !== rawUrl) candidates.push(decoded);
        } catch (e) {}
        try {
            const encoded = encodeURI(rawUrl);
            if (encoded !== rawUrl) candidates.push(encoded);
        } catch (e) {}
        // If rawUrl looks like a path, try constructing from the uploads/documents location using last segment
        try {
            const last = rawUrl.split('/').pop();
            if (last) {
                const decodedLast = decodeURIComponent(last);
                candidates.push(getServerFileUrl(`/uploads/documents/${encodeURIComponent(decodedLast)}`));
                // also try unencoded variant
                candidates.push(getServerFileUrl(`/uploads/documents/${decodedLast}`));
            }
        } catch (e) {}
        // Finally try constructing via getServerFileUrl as fallback
        candidates.push(getServerFileUrl(rawUrl));
    }

    // Diagnostic: log candidate URLs
    console.debug('fetchArrayBufferFromUrl candidates:', candidates);

    for (const c of candidates) {
        if (!c || tried.has(c)) continue;
        tried.add(c);
        try {
            console.debug('Attempting fetch for:', c);
            const headers = await getAuthHeaders(c);
            const resp = await fetch(c, { headers });
            console.debug('Response status for', c, resp.status);
            if (!resp.ok) {
                console.warn('Fetch not ok for', c, resp.status, resp.statusText);
                // If unauthorized, try to refresh the Firebase token once and retry
                if ((resp.status === 401 || resp.status === 403) && firebaseAuth && firebaseAuth.currentUser) {
                    try {
                        console.debug('Attempting token refresh for', c);
                        const token = await firebaseAuth.currentUser.getIdToken(true);
                        const retryHeaders = { ...(await getAuthHeaders(c)), Authorization: `Bearer ${token}` };
                        const retryResp = await fetch(c, { headers: retryHeaders });
                        console.debug('Retry response status for', c, retryResp.status);
                        if (retryResp.ok) {
                            const retryContentType = retryResp.headers.get('content-type') || '';
                            if (retryContentType.includes('text/html')) {
                                const text = await retryResp.text();
                                console.warn('Skipped HTML response on retry for', c, 'snippet:', text.slice(0, 300));
                                continue;
                            }
                            const abRetry = await retryResp.arrayBuffer();
                            return abRetry;
                        }
                    } catch (refreshErr) {
                        console.debug('Token refresh retry failed for', c, refreshErr);
                    }
                }
                continue;
            }
            const contentType = resp.headers.get('content-type') || '';
            // If server returned HTML (dev index/404), log snippet and skip it
            if (contentType.includes('text/html')) {
                try {
                    const text = await resp.text();
                    console.warn('Skipped HTML response for', c, 'snippet:', text.slice(0, 300));
                } catch (e) {
                    console.warn('Skipped HTML response for', c);
                }
                continue;
            }
            const ab = await resp.arrayBuffer();
            console.debug('Successfully fetched binary from', c);
            return ab;
        } catch (err) {
            console.warn('Error fetching candidate', c, err);
            // try next
            continue;
        }
    }
    throw new Error('Failed to fetch binary file from provided URL(s)');
};
import apiClient from '@config/api/apiClient';
import { generateGoogleCalendarUrl } from '@utils/googleCalendar';
import {
    reviewSavedNotif, reviewSaveFailedNotif,
    changesSavedNotif, changesSaveFailedNotif,
    reviewResubmittedNotif, reviewResubmitFailedNotif,
    caseFinalizedNotif, legalAdviceFinalizedNotif,
    statusUpdateFailedNotif, statusUpdateHaltedNotif,
    returnedToInternNotif, returnToInternFailedNotif,
    returnedToSupervisingNotif, returnToSupervisingFailedNotif,
    approvedToDirectorNotif, approveToDirectorFailedNotif,
    noReviewIdNotif, fileRequiredNotif, fileNotUploadedNotif, fileUploadFailedNotif,
} from '@utils/notification';

// --- Consolidated Constants ---
const PRIMARY_GOLD = '#FFD700';
const PRIMARY_BROWN = '#5C4033';
const THEMED_LIGHT_BG = '#F7F7F7';
const MUTED_OLIVE = '#8A8A5C'; // Re-added for button styling
// --- End of Consolidated Constants ---


// Helper component for Evidence Tables (Memoized)
const EMPTY_EVIDENCE_ROW = { type: '', author: '', purpose: '', issues: '' };

const EvidenceRow = React.memo(({ row, index, onBlurRow, readOnly, showPurpose = true }) => {
    // Local state per-row so keystrokes never re-render siblings or the parent form
    const [local, setLocal] = React.useState(() => ({ ...EMPTY_EVIDENCE_ROW, ...row }));

    // Sync inbound prop changes (e.g. initial load) without clobbering active edits
    const prevRowRef = React.useRef(row);
    React.useEffect(() => {
        const prev = prevRowRef.current;
        const changed =
            prev.type !== row.type || prev.author !== row.author ||
            prev.purpose !== row.purpose || prev.issues !== row.issues;
        if (changed) {
            setLocal({ ...EMPTY_EVIDENCE_ROW, ...row });
        }
        prevRowRef.current = row;
    }, [row]);

    const handleChange = (field) => (e) => {
        if (readOnly) return;
        setLocal((prev) => ({ ...prev, [field]: e.target.value }));
    };

    const handleBlur = (field) => (e) => {
        if (readOnly) return;
        const updated = { ...local, [field]: e.target.value };
        setLocal(updated);
        onBlurRow(index, updated);
    };

    const inputStyles = {
        input: {
            backgroundColor: readOnly ? '#F5F5F5' : 'transparent',
            cursor: readOnly ? 'not-allowed' : 'text',
        },
    };

    return (
        <Table.Tr>
            <Table.Td>
                <TextInput placeholder="Type/Desc" size="xs" variant="unstyled"
                    value={local.type}
                    onChange={handleChange('type')}
                    onBlur={handleBlur('type')}
                    readOnly={readOnly} styles={inputStyles} />
            </Table.Td>

            <Table.Td>
                <TextInput placeholder="Author/Custodian" size="xs" variant="unstyled"
                    value={local.author}
                    onChange={handleChange('author')}
                    onBlur={handleBlur('author')}
                    readOnly={readOnly} styles={inputStyles} />
            </Table.Td>

            {showPurpose && (
                <Table.Td>
                    <TextInput placeholder="Purpose" size="xs" variant="unstyled"
                        value={local.purpose}
                        onChange={handleChange('purpose')}
                        onBlur={handleBlur('purpose')}
                        readOnly={readOnly} styles={inputStyles} />
                </Table.Td>
            )}

            <Table.Td>
                <TextInput placeholder="Issues" size="xs" variant="unstyled"
                    value={local.issues}
                    onChange={handleChange('issues')}
                    onBlur={handleBlur('issues')}
                    readOnly={readOnly} styles={inputStyles} />
            </Table.Td>
        </Table.Tr>
    );
});
EvidenceRow.displayName = 'EvidenceRow';

const EvidenceTable = React.memo(({ title, value = [], onChange = () => {}, readOnly = false, showPurpose = true }) => {
    // Ensure we have at least 3 rows
    const rows = value.length >= 3 ? value : [...value, ...Array(3 - value.length).fill(EMPTY_EVIDENCE_ROW)];

    const handleBlurRow = React.useCallback((index, updatedRowData) => {
        const updated = [...rows];
        updated[index] = updatedRowData;
        onChange(updated);
    }, [rows, onChange]);

    const handleAddRow = React.useCallback(() => {
        onChange([...rows, { ...EMPTY_EVIDENCE_ROW }]);
    }, [rows, onChange]);

    return (
        <Stack gap="sm">
            <Title order={4} c={PRIMARY_BROWN}>{title}</Title>
            <ScrollArea type="auto">
            <Table withRowBorders withColumnBorders withTableBorder striped style={{ minWidth: 500 }}>
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th style={{ width: showPurpose ? '30%' : '35%' }}>Type / Description</Table.Th>
                        <Table.Th style={{ width: showPurpose ? '25%' : '30%' }}>Author / Custodian</Table.Th>
                        {showPurpose && <Table.Th style={{ width: '25%' }}>Purpose</Table.Th>}
                        <Table.Th style={{ width: showPurpose ? '20%' : '35%' }}>Admissibility Issues</Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                    {rows.map((row, index) => (
                        <EvidenceRow
                            key={index}
                            row={row}
                            index={index}
                            onBlurRow={handleBlurRow}
                            readOnly={readOnly}
                            showPurpose={showPurpose}
                        />
                    ))}
                </Table.Tbody>
            </Table>
            </ScrollArea>

            {!readOnly && (
                <Button
                    variant="subtle"
                    size="xs"
                    style={{ alignSelf: 'flex-start', color: PRIMARY_BROWN }}
                    onClick={handleAddRow}
                >
                    + Add another row
                </Button>
            )}
        </Stack>
    );
});
EvidenceTable.displayName = 'EvidenceTable';

// Simple PDF viewer using pdfjs-dist
const PdfViewer = ({ url, fileData, cloudinaryUrl }) => {
    const [loading, setLoading] = React.useState(true);
    const containerRef = React.useRef(null);

    React.useEffect(() => {
        let cancelled = false;
        const renderPdf = async () => {
            setLoading(true);
            try {
                // Get ArrayBuffer either from provided fileData (data URL) or fetch url
                let arrayBuffer = null;
                if (fileData && typeof fileData === 'string' && fileData.startsWith('data:')) {
                    // convert base64 data URL to ArrayBuffer
                    const base64 = fileData.split(',')[1];
                    const binary = atob(base64);
                    const len = binary.length;
                    const bytes = new Uint8Array(len);
                    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
                    arrayBuffer = bytes.buffer;
                } else if (fileData && fileData instanceof ArrayBuffer) {
                    arrayBuffer = fileData;
                } else if (url || cloudinaryUrl) {
                    // Use robust fetch helper that retries multiple URL variants
                    // and skips HTML responses from dev server 404s
                    arrayBuffer = await fetchArrayBufferFromUrl(url, cloudinaryUrl);
                }

                if (!arrayBuffer) throw new Error('No PDF data');

                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

                // Clear previous
                if (containerRef.current) containerRef.current.innerHTML = '';

                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const viewport = page.getViewport({ scale: 1.25 });
                    const canvas = document.createElement('canvas');
                    canvas.style.display = 'block';
                    canvas.style.margin = '0 auto 12px';
                    canvas.width = Math.floor(viewport.width);
                    canvas.height = Math.floor(viewport.height);
                    const ctx = canvas.getContext('2d');
                    await page.render({ canvasContext: ctx, viewport }).promise;
                    if (containerRef.current) containerRef.current.appendChild(canvas);
                }
            } catch (err) {
                console.error('PDF render error', err);
                if (containerRef.current) containerRef.current.innerHTML = '<div style="padding:20px;color:red;">Unable to preview PDF. Please download to view.</div>';
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        renderPdf();

        return () => { cancelled = true; };
    }, [url, fileData, cloudinaryUrl]);

    return (
        <div style={{ flex: 1, overflow: 'auto' }}>
            {loading && (
                <div style={{ textAlign: 'center', padding: 40 }}>
                    <Text size="lg" fw={700} c={PRIMARY_BROWN}>Loading PDF...</Text>
                </div>
            )}
            <div ref={containerRef} />
        </div>
    );
};

// ====================================================================================
// 2. Client Interview and Evidence Section (Based on image_588eb7.png)
// ====================================================================================
export const ClientInterviewSection = React.memo(({ value = {}, onChange = () => {}, uploadedFile = null, onFileChange = () => {}, documentVersions = [], onViewDocument = () => {}, onDownloadDocument = () => {}, onRemoveVersion = () => {}, fileInputKey = Date.now(), userRole = '', isViewingExistingReview = false, currentReviewStage = '' }) => {
    // Determine if the section should be read-only based on:
    // 1. Position mismatch (different role created it) - BUT allow supervising lawyers and directors to edit during their review stages
    // 2. Review stage restrictions (intern can't edit when in review stages, EXCEPT when returned for revision)
    // Allow supervising lawyer to edit when at supervising_lawyer stage, director to edit at director stage
    const isReturnedToIntern = currentReviewStage === 'returned_to_intern';
    const isSupervisingLawyerReviewing = userRole === 'supervising_lawyer' && currentReviewStage === 'supervising_lawyer';
    const isDirectorReviewing = userRole === 'director' && currentReviewStage === 'director';
    const isPositionMismatch = value.createdByRole && userRole && value.createdByRole !== userRole && 
        !isReturnedToIntern && !isSupervisingLawyerReviewing && !isDirectorReviewing;
    // Interns can edit when: not submitted yet OR returned to them for revision
    const isInternViewingSubmittedReview = (userRole === 'intern' || userRole === 'secretary') && 
        (currentReviewStage === 'supervising_lawyer' || currentReviewStage === 'director' || currentReviewStage === 'completed');
    const isSupervisingLawyerViewingDirectorReview = userRole === 'supervising_lawyer' && (currentReviewStage === 'director' || currentReviewStage === 'completed');
    
    const isReadOnly = (isPositionMismatch || isInternViewingSubmittedReview || isSupervisingLawyerViewingDirectorReview);
    
    // Determine the alert message based on why it's read-only
    let alertMessage = '';
    if (isPositionMismatch) {
        alertMessage = `This record was created by a ${value.createdByRole?.replace('_', ' ')} and cannot be edited by your role (${userRole?.replace('_', ' ')}).`;
    } else if (isInternViewingSubmittedReview) {
        alertMessage = 'This record has been submitted for review and can no longer be edited by interns.';
    } else if (isSupervisingLawyerViewingDirectorReview) {
        alertMessage = 'This record is currently under director review and cannot be edited by supervising lawyers.';
    }
    
    return (
    <Paper shadow="md" p={{ base: 'sm', sm: 'xl' }} radius="lg" bg="white">
        <Stack gap={{ base: 'md', sm: 'xl' }}>
            <Title order={2} c={PRIMARY_BROWN} style={{ textAlign: 'center', fontSize: 'clamp(16px, 4vw, 24px)' }}>Client Interview and Evidence Record</Title>
            
            {isReadOnly && (
                <Alert color="yellow" title="View Only Mode" radius="md">
                    {alertMessage}
                </Alert>
            )}
            
            <Divider />
            
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                <TextInput label="Date of Interview" type="date" 
                    value={value.dateOfInterview || ''} onChange={(e) => onChange({ ...value, dateOfInterview: e.target.value })} 
                    readOnly
                    styles={{
                        input: {
                            backgroundColor: '#F5F5F5',
                            cursor: 'not-allowed',
                            color: '#000'
                        }
                    }}
                />
                <TextInput label="Date Submitted" type="date"
                    value={value.dateSubmitted || ''} onChange={(e) => onChange({ ...value, dateSubmitted: e.target.value })} 
                    readOnly
                    styles={{
                        input: {
                            backgroundColor: '#F5F5F5',
                            cursor: 'not-allowed',
                            color: '#000'
                        }
                    }}
                />
                <TextInput label="Client's Name" placeholder="Full Name"
                    value={value.clientName || ''} onChange={(e) => onChange({ ...value, clientName: e.target.value })} 
                    readOnly
                    styles={{
                        input: {
                            backgroundColor: '#F5F5F5',
                            cursor: 'not-allowed',
                            color: '#000'
                        }
                    }}
                />
                <TextInput label="Interviewing Intern/s Duty Day" placeholder="Intern Name/s and Duty Day"
                    value={value.interviewingInterns || ''} 
                    onChange={(e) => onChange({ ...value, interviewingInterns: e.target.value })} 
                    readOnly
                    styles={{
                        input: {
                            backgroundColor: '#F5F5F5',
                            cursor: 'not-allowed',
                            color: '#000'
                        }
                    }}
                />
            </SimpleGrid>
            
            <Divider />

            <Title order={4} c={PRIMARY_BROWN}>Fast Facts</Title>
            <Textarea 
                placeholder="A brief summary of the client's story and the core legal issue/s." 
                autosize 
                minRows={4}
                value={value.fastFacts || ''} onChange={(e) => onChange({ ...value, fastFacts: e.target.value })}
                readOnly={isReadOnly}
                styles={{
                    input: {
                        backgroundColor: isReadOnly ? '#F5F5F5' : 'white',
                        cursor: isReadOnly ? 'not-allowed' : 'text',
                        color: '#000'
                    }
                }}
            />

            <Divider />

            <EvidenceTable 
                title="Evidence on Hand / Available for the Client(s)" 
                value={value.clientEvidence || []}
                onChange={(evidence) => onChange({ ...value, clientEvidence: evidence })}
                readOnly={isReadOnly}
            />

            <Divider />
            
            <EvidenceTable 
                title="Evidence on Hand / Available for the Adverse Party(ies)" 
                value={value.adversePartyEvidence || []}
                onChange={(evidence) => onChange({ ...value, adversePartyEvidence: evidence })}
                readOnly={isReadOnly}
                showPurpose={false}
            />
            
            <Divider />
            
            <Title order={4} c={PRIMARY_BROWN}>Interviewing Intern's Initial Advice to the Client(s)</Title>
            <Textarea 
                placeholder="Brief summary of the initial legal advice given to the client."
                autosize
                minRows={3}
                value={value.internAdvice || ''} onChange={(e) => onChange({ ...value, internAdvice: e.target.value })}
                readOnly={isReadOnly}
                styles={{
                    input: {
                        backgroundColor: isReadOnly ? '#F5F5F5' : 'white',
                        cursor: isReadOnly ? 'not-allowed' : 'text',
                        color: '#000'
                    }
                }}
            />
            <Radio.Group
                label="Case Type"
                value={value.caseType || ''}
                onChange={(val) => onChange({ ...value, caseType: val })}
                mt="md"
            >
                <Stack gap="xs" mt="xs">
                    <Radio value="legal-advice" label="For legal advice only" disabled={isReadOnly || isReturnedToIntern || (userRole !== 'intern' && userRole !== 'secretary' && isViewingExistingReview)} />
                    <Radio value="legal-document" label="For drafting of legal document" disabled={isReadOnly || isReturnedToIntern || (userRole !== 'intern' && userRole !== 'secretary' && isViewingExistingReview)} />
                    <Radio value="court-representation" label="For court representation" disabled={isReadOnly || isReturnedToIntern || (userRole !== 'intern' && userRole !== 'secretary' && isViewingExistingReview)} />
                </Stack>
            </Radio.Group>

            {/* Conditional File Upload for Legal Document Drafting */}
            {value.caseType === 'legal-document' && (
                <Box mt="md">
                    <Text size="sm" fw={600} c={PRIMARY_BROWN} mb="xs">
                        Legal Document Management
                    </Text>
                    
                    {/* Upload Button */}
                    {!isReadOnly && (
                    <FileButton
                        key={fileInputKey}
                        onChange={onFileChange}
                        accept=".doc,.docx,.pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf"
                    >
                        {(props) => (
                            <Button
                                {...props}
                                leftSection={<IconUpload size={18} />}
                                variant="outline"
                                style={{ borderColor: PRIMARY_BROWN, color: PRIMARY_BROWN }}
                            >
                                {uploadedFile ? 'Upload New Version' : 'Upload Document'}
                            </Button>
                        )}
                    </FileButton>
                    )}
                    
                    {/* Current Document Display */}
                    {(uploadedFile || value.uploadedDocument) && (
                        <Paper p={{ base: 'sm', sm: 'md' }} mt="sm" radius="md" style={{ backgroundColor: '#F0F8FF', border: '1px solid #B0D4F1' }}>
                            <Group justify="space-between" wrap="wrap" gap="sm">
                                <Group gap="xs">
                                    <IconFile size={20} color={PRIMARY_BROWN} />
                                    <Box>
                                        <Text size="sm" fw={600}>
                                            {uploadedFile ? uploadedFile.name : value.uploadedDocument?.fileName}
                                        </Text>
                                        <Text size="xs" c="dimmed">
                                            {uploadedFile 
                                                ? `${(uploadedFile.size / 1024).toFixed(2)} KB • Latest Version ${uploadedFile.isServerFile ? '(Uploaded)' : '(Uploading...)'}`
                                                : `${((value.uploadedDocument?.fileSize || 0) / 1024).toFixed(2)} KB • Current Version`
                                            }
                                        </Text>
                                        {(uploadedFile?.uploadedBy || value.uploadedDocument?.uploadedBy) && (
                                            <Text size="xs" c="dimmed">
                                                By: {uploadedFile?.uploadedBy || value.uploadedDocument?.uploadedBy} ({uploadedFile?.uploadedByRole || value.uploadedDocument?.uploadedByRole})
                                            </Text>
                                        )}
                                    </Box>
                                </Group>
                                <Group gap="xs">
                                    <Button
                                        size="xs"
                                        variant="light"
                                        color="blue"
                                        leftSection={<IconEye size={16} />}
                                        onClick={() => onViewDocument(uploadedFile, value.uploadedDocument)}
                                    >
                                        View
                                    </Button>
                                    <Button
                                        size="xs"
                                        variant="light"
                                        color="green"
                                        leftSection={<IconDownload size={16} />}
                                        onClick={() => onDownloadDocument(uploadedFile, value.uploadedDocument)}
                                    >
                                        Download
                                    </Button>
                                    {!isReadOnly && (
                                    <Button
                                        size="xs"
                                        variant="subtle"
                                        color="red"
                                        leftSection={<IconX size={16} />}
                                        onClick={() => onFileChange(null)}
                                    >
                                        Remove
                                    </Button>
                                    )}
                                </Group>
                            </Group>
                        </Paper>
                    )}
                    
                    {/* Version History */}
                    {documentVersions && documentVersions.length > 0 && (
                        <Paper p="md" mt="md" radius="md" style={{ backgroundColor: '#FFF9F0', border: '1px solid #FFE0B2' }}>
                            <Group mb="sm">
                                <IconClock size={18} color={PRIMARY_BROWN} />
                                <Text size="sm" fw={600} c={PRIMARY_BROWN}>
                                    Version History ({documentVersions.length})
                                </Text>
                            </Group>
                            <Timeline active={documentVersions.length} bulletSize={20} lineWidth={2}>
                                {documentVersions.map((version, index) => (
                                    <Timeline.Item
                                        key={index}
                                        bullet={index === 0 ? <IconCheck size={12} /> : <IconClock size={12} />}
                                        title={
                                            <Text size="xs" fw={600}>
                                                Version {documentVersions.length - index}
                                            </Text>
                                        }
                                    >
                                        <Text size="xs" c="dimmed" mb={4}>
                                            {version.fileName} • {(version.fileSize / 1024).toFixed(2)} KB
                                        </Text>
                                        {version.uploadedBy && (
                                            <Text size="xs" c="dimmed" mb={4}>
                                                Uploaded by: <Text component="span" fw={600}>{version.uploadedBy}</Text> ({version.uploadedByRole || 'Unknown'})
                                            </Text>
                                        )}
                                        <Text size="xs" c="dimmed" mb={8}>
                                            {new Date(version.uploadedAt).toLocaleString()}
                                        </Text>
                                        <Group gap="xs">
                                            <Button
                                                size="xs"
                                                variant="subtle"
                                                compact
                                                leftSection={<IconEye size={14} />}
                                                onClick={() => onViewDocument(null, version)}
                                            >
                                                View
                                            </Button>
                                            <Button
                                                size="xs"
                                                variant="subtle"
                                                compact
                                                leftSection={<IconDownload size={14} />}
                                                onClick={() => onDownloadDocument(null, version)}
                                            >
                                                Download
                                            </Button>
                                            {!isReadOnly && (
                                            <Button
                                                size="xs"
                                                variant="subtle"
                                                compact
                                                color="red"
                                                leftSection={<IconX size={14} />}
                                                onClick={() => onRemoveVersion(index)}
                                            >
                                                Remove
                                            </Button>
                                            )}
                                        </Group>
                                    </Timeline.Item>
                                ))}
                            </Timeline>
                        </Paper>
                    )}
                    
                    {!uploadedFile && documentVersions.length === 0 && (
                        <Text size="xs" c="dimmed" mt="xs">
                            Please upload a Word document (.doc, .docx) or PDF file
                        </Text>
                    )}
                </Box>
            )}

            <Divider />

            <Title order={4} c={PRIMARY_BROWN}>Legal Opinion</Title>
            <Textarea 
                placeholder="The intern's assessment of the case's merits and possible legal strategy."
                autosize 
                minRows={5}
                value={value.legalOpinion || ''} onChange={(e) => onChange({ ...value, legalOpinion: e.target.value })}
                readOnly={isReadOnly}
                styles={{
                    input: {
                        backgroundColor: isReadOnly ? '#F5F5F5' : 'white',
                        cursor: isReadOnly ? 'not-allowed' : 'text',
                        color: '#000'
                    }
                }}
            />
        </Stack>
    </Paper>
    );
});
ClientInterviewSection.displayName = 'ClientInterviewSection';


// ====================================================================================
// 3. Supervising Lawyer's Comment & Director's Action (Based on image_588e92.png)
// ====================================================================================
export const SupervisingLawyerActionSection = React.memo(({ value = {}, onChange = () => {}, forLegalAdvice = false, userRole = '', userData = null, currentReviewStage = '' }) => {
    // Auto-populate fields based on role
    React.useEffect(() => {
        const currentUserName = userData?.firstName && userData?.lastName 
            ? `${userData.firstName} ${userData.lastName}` 
            : userData?.username || userData?.displayName || 'Unknown User';
        const currentUserId = userData?._id || userData?.id || null;
        
        const today = new Date();
        const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        
        if ((userRole === 'intern' || userRole === 'secretary') && userData) {
            // For interns/secretary: Append name to assignedTo if not already present
            if (!value.assignedTo) {
                onChange({ ...value, assignedTo: currentUserName, assignedToId: currentUserId, signatureDate: formattedDate });
            } else if (!value.assignedTo.includes(currentUserName)) {
                // Append name if different intern/secretary is editing
                onChange({ ...value, assignedTo: value.assignedTo + ', ' + currentUserName, signatureDate: formattedDate });
            } else if (!value.signatureDate) {
                onChange({ ...value, signatureDate: formattedDate });
            }
        } else if (userRole === 'supervising_lawyer' && userData) {
            // For supervising lawyers: Set supervisingLawyer name and ID if not already set
            if (!value.supervisingLawyer) {
                onChange({ ...value, supervisingLawyer: currentUserName, supervisingLawyerId: currentUserId });
            }
        } else if (userRole === 'director' && userData) {
            // For directors: Set directorSignature and ID if not already set
            if (!value.directorSignature) {
                onChange({ ...value, directorSignature: currentUserName, directorId: currentUserId });
            }
        }
    }, [userRole, userData]);

    // Determine if supervising lawyer section should be disabled
    const supervisingLawyerDisabled = userRole === 'intern' || userRole === 'secretary' || userRole === 'director' || currentReviewStage === 'director';
    
    // Determine if director section should be disabled - Only the director can set the decision
    const directorSectionDisabled = userRole !== 'director';

    // Toggle handler for director's action radio buttons
    const handleDecisionChange = (val) => {
      // If clicking the already-selected value, unselect it (toggle off)
      if (value.decision === val) {
        onChange({ ...value, decision: '' });
      } else {
        onChange({ ...value, decision: val });
      }
    };

    return (
        <Paper shadow="md" p={{ base: 'sm', sm: 'xl' }} radius="lg" bg="white">
            <Stack gap={{ base: 'md', sm: 'xl' }}>
                <Title order={2} c={PRIMARY_BROWN} style={{ textAlign: 'center', fontSize: 'clamp(16px, 4vw, 24px)' }}>Supervising Lawyer & Director Action</Title>

                <Divider />
                
                <Title order={3} c={PRIMARY_BROWN}>Supervising Lawyer's Comment</Title>
                <Textarea 
                    placeholder="Comments, corrections, or additional instructions from the Supervising Lawyer." 
                    autosize 
                    minRows={4}
                    value={value.supervisingComment || ''}
                    onChange={(e) => onChange({ ...value, supervisingComment: e.target.value })}
                    readOnly={supervisingLawyerDisabled}
                    styles={{
                        input: {
                            backgroundColor: supervisingLawyerDisabled ? '#F5F5F5' : 'white',
                            cursor: supervisingLawyerDisabled ? 'not-allowed' : 'text',
                            color: '#000',
                        },
                    }}
                />

            <Divider />

            {/* Director's Action - Only the director can set accepted/rejected/pending */}
            <Title order={3} c={PRIMARY_BROWN}>Director's Action</Title>
            <Box>
                <Text size="sm" fw={500} mb={8}>Decision</Text>
                <Group>
                    {['accepted', 'rejected', 'pending'].map((opt) => (
                        <Radio
                            key={opt}
                            value={opt}
                            label={opt.charAt(0).toUpperCase() + opt.slice(1)}
                            checked={value.decision === opt}
                            onChange={() => handleDecisionChange(opt)}
                            onClick={() => handleDecisionChange(opt)}
                            disabled={directorSectionDisabled}
                        />
                    ))}
                </Group>
            </Box>
            
            <Textarea 
                label="If accepted/pending, instruction(s); if rejected, reason(s):" 
                placeholder="Specific instructions or reason for rejection"
                autosize 
                minRows={4}
                value={value.decisionNote || ''}
                onChange={(e) => onChange({ ...value, decisionNote: e.target.value })}
                readOnly={directorSectionDisabled}
                styles={{
                    input: {
                        backgroundColor: directorSectionDisabled ? '#F5F5F5' : 'white',
                        cursor: directorSectionDisabled ? 'not-allowed' : 'text',
                        color: '#000',
                    },
                }}
            />

            <Divider />

            <Divider />

            <Title order={3} c={PRIMARY_BROWN}>Assignment & Signatures</Title>
            <Grid gutter={{ base: 'md', md: 'xl' }}>
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Textarea 
                        label="Assigned to: Law Interns" 
                        placeholder="List of interns assigned to the case" 
                        autosize 
                        minRows={3}
                        value={value.assignedTo || ''}
                        onChange={(e) => onChange({ ...value, assignedTo: e.target.value })}
                        readOnly={userRole === 'intern' || userRole === 'secretary' || userRole === 'supervising_lawyer' || currentReviewStage === 'director'}
                        styles={{
                            input: {
                                backgroundColor: (userRole === 'intern' || userRole === 'secretary' || userRole === 'supervising_lawyer' || currentReviewStage === 'director') ? '#F5F5F5' : 'white',
                                cursor: (userRole === 'intern' || userRole === 'secretary' || userRole === 'supervising_lawyer' || currentReviewStage === 'director') ? 'not-allowed' : 'text',
                                color: '#000',
                            },
                        }}
                    />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Stack>
                        <TextInput 
                            label="Supervising Lawyer" 
                            placeholder="Signature/Name of Supervising Lawyer" 
                            value={value.supervisingLawyer || ''}
                            onChange={(e) => onChange({ ...value, supervisingLawyer: e.target.value })}
                            readOnly={userRole === 'intern' || userRole === 'secretary' || userRole === 'supervising_lawyer' || currentReviewStage === 'director'}
                            styles={{
                                input: {
                                    backgroundColor: (userRole === 'intern' || userRole === 'secretary' || userRole === 'supervising_lawyer' || currentReviewStage === 'director') ? '#F5F5F5' : 'white',
                                    cursor: (userRole === 'intern' || userRole === 'secretary' || userRole === 'supervising_lawyer' || currentReviewStage === 'director') ? 'not-allowed' : 'text',
                                    color: '#000',
                                },
                            }}
                        />
                        <TextInput 
                            label="Director's Signature" 
                            placeholder="Signature/Name of Director" 
                            value={value.directorSignature || ''}
                            onChange={(e) => onChange({ ...value, directorSignature: e.target.value })}
                            readOnly={userRole === 'intern' || userRole === 'secretary' || userRole === 'supervising_lawyer' || currentReviewStage === 'director'}
                            styles={{
                                input: {
                                    backgroundColor: (userRole === 'intern' || userRole === 'secretary' || userRole === 'supervising_lawyer' || currentReviewStage === 'director') ? '#F5F5F5' : 'white',
                                    cursor: (userRole === 'intern' || userRole === 'secretary' || userRole === 'supervising_lawyer' || currentReviewStage === 'director') ? 'not-allowed' : 'text',
                                    color: '#000',
                                },
                            }}
                        />
                        <TextInput 
                            label="Date" 
                            type="date" 
                            value={value.signatureDate || ''}
                            onChange={(e) => onChange({ ...value, signatureDate: e.target.value })}
                            readOnly={userRole === 'intern' || userRole === 'secretary' || userRole === 'supervising_lawyer'}
                            styles={{
                                input: {
                                    backgroundColor: (userRole === 'intern' || userRole === 'secretary' || userRole === 'supervising_lawyer') ? '#F5F5F5' : 'white',
                                    cursor: (userRole === 'intern' || userRole === 'secretary' || userRole === 'supervising_lawyer') ? 'not-allowed' : 'text',
                                    color: '#000',
                                },
                            }}
                        />
                    </Stack>
                </Grid.Col>
            </Grid>
            </Stack>
        </Paper>
    );
});
SupervisingLawyerActionSection.displayName = 'SupervisingLawyerActionSection';


// ====================================================================================
// Main Wrapper Component (Managing Steps and Buttons)
// ====================================================================================
const totalSteps = 2;

export default function CaseRecordFormsDisplay() {
    const { userData } = useAuth();
    const [active, setActive] = useState(0);
    const isIntern = userData?.role === 'intern' || userData?.role === 'secretary';
    const [reviews, setReviews] = useState([])
    const [saving, setSaving] = useState(false)
    const [isFromDashboard, setIsFromDashboard] = useState(false)
    const [isViewingExistingReview, setIsViewingExistingReview] = useState(false)
    const [reviewId, setReviewId] = useState(null)
    const [currentReviewStage, setCurrentReviewStage] = useState('supervising_lawyer') // Track current stage

    // controlled state for interview + action
    const [interviewInfo, setInterviewInfo] = useState({});
    const [actionInfo, setActionInfo] = useState({});
    const [uploadedFile, setUploadedFile] = useState(null);
    const [documentVersions, setDocumentVersions] = useState([]);
    const [viewerModalOpened, setViewerModalOpened] = useState(false);
    const [currentViewingDoc, setCurrentViewingDoc] = useState(null);
    const [wordDocHtml, setWordDocHtml] = useState(null);
    const [wordDocLoading, setWordDocLoading] = useState(false);
    
    const [fileInputKey, setFileInputKey] = useState(Date.now()); // Key to reset file input
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const { caseId: caseIdParam } = useParams();
    const navigate = useNavigate();

    // Client Information Sheet side panel state
    const [showClientInfoPanel, setShowClientInfoPanel] = useState(false);
    const [clientInfoData, setClientInfoData] = useState(null);
    const [clientInfoLoading, setClientInfoLoading] = useState(false);

    const isFromAutoScheduledApproveFlow = Boolean(location?.state?.fromAutoScheduled);

    // Get caseId from URL params, search params, or location state
    const getCaseId = () => {
        if (caseIdParam) return caseIdParam;
        const caseIdFromQuery = searchParams.get('caseId');
        if (caseIdFromQuery) return caseIdFromQuery;
        const caseIdFromState = location?.state?.caseId;
        if (caseIdFromState) return caseIdFromState;
        // Fallback: try to extract from path or use a default
        const pathParts = window?.location?.pathname?.split('/') || [];
        // If path contains a case ID pattern (e.g., /admin/recommendation/:caseId)
        const possibleCaseId = pathParts[pathParts.length - 1];
        return possibleCaseId && possibleCaseId !== 'recommendation' ? possibleCaseId : 'new-case';
    };

    useEffect(() => {
        const review = location?.state?.review;
        const isViewingFlag = location?.state?.isViewingExistingReview;
        const clientInfo = location?.state?.clientInfo; // Get auto-fill data from location state
        const showInfoPanel = location?.state?.showClientInfo;
        
        // Show client info panel when reviewing an existing review or explicitly requested
        if (isViewingFlag || showInfoPanel || review) {
            setShowClientInfoPanel(true);
        }

        if (review && review.content) {
            // Mark that this is opened from dashboard (has review in location state)
            setIsFromDashboard(true);
            setIsViewingExistingReview(isViewingFlag || false);
            setReviewId(review._id || review.id || null);
            setCurrentReviewStage(review.reviewStage || 'supervising_lawyer'); // Load the current stage
            
            // Load review data from location.state
            const ii = review.content.interviewInfo || review.interviewInfo || {};
            
            // Restore uploaded file if exists
            if (ii.uploadedDocument) {
                try {
                    // Check if it's a server-based file or legacy base64 file
                    if (ii.uploadedDocument.isServerFile) {
                        // For server-based files, create a mock File object with metadata
                        // This allows the display logic to work without actually fetching the file
                        const mockFile = {
                            name: ii.uploadedDocument.fileName,
                            size: ii.uploadedDocument.fileSize,
                            type: ii.uploadedDocument.fileType,
                            serverFile: {
                                url: ii.uploadedDocument.fileUrl,
                                filename: ii.uploadedDocument.filename
                            },
                            isServerFile: true,
                            uploadedBy: ii.uploadedDocument.uploadedBy,
                            uploadedByRole: ii.uploadedDocument.uploadedByRole
                        };
                        setUploadedFile(mockFile);
                    } else if (ii.uploadedDocument.fileData) {
                        // Legacy base64 files - convert back to File object
                        const { fileName, fileSize, fileType, fileData } = ii.uploadedDocument;
                        fetch(fileData)
                            .then(res => res.blob())
                            .then(blob => {
                                const file = new File([blob], fileName, { type: fileType });
                                setUploadedFile(file);
                            })
                            .catch(err => console.error('Error restoring file:', err));
                    }
                } catch (error) {
                    console.error('Error processing uploaded document:', error);
                }
            }
            
            // Load version history
            if (ii.documentVersions && Array.isArray(ii.documentVersions)) {
                setDocumentVersions(ii.documentVersions);
            }
            
            // Restore evidence tables if they exist
            if (ii.clientEvidence) {
                setInterviewInfo(prev => ({ ...prev, ...ii }));
            } else {
                setInterviewInfo(ii);
            }
            
            // Load action info if available
            if (review.content?.actionInfo) {
                setActionInfo(review.content.actionInfo);
            }
        } else if (clientInfo) {
            // Auto-fill from clientInfo passed from Recommend button
            setIsFromDashboard(false);
            setIsViewingExistingReview(false);
            setReviewId(null);
            setCurrentReviewStage(''); // Empty string for new review, not yet submitted
            setInterviewInfo({
                clientName: clientInfo.clientName || '',
                dateOfInterview: clientInfo.dateOfInterview || '',
                dateSubmitted: clientInfo.dateSubmitted || '',
                interviewingInterns: clientInfo.interviewingInterns || '',
                interviewingInternsId: clientInfo.interviewingInternsId || null,
            });
            setActionInfo({});
            setUploadedFile(null); // Reset file
        } else {
            // If no review in location state, it's opened from sidebar - reset to clean state
            setIsFromDashboard(false);
            setIsViewingExistingReview(false);
            setReviewId(null);
            setCurrentReviewStage(''); // Empty string for new review, not yet submitted
            setInterviewInfo({});
            setActionInfo({});
            setUploadedFile(null); // Reset file
        }
    }, [location]);

    // When navigating from notification click (caseId in URL but no review in state),
    // fetch the latest review for this caseId and load it into the form.
    // Re-runs when caseIdParam changes (switching between notifications on the same route).
    useEffect(() => {
        const review = location?.state?.review;
        const showInfoPanel = location?.state?.showClientInfo;
        const isViewingFlag = location?.state?.isViewingExistingReview;
        const caseId = getCaseId();

        if (!review && (showInfoPanel || isViewingFlag) && caseId && caseId !== 'new-case') {
            // Reset stale data before fetching new review
            setClientInfoData(null);
            setInterviewInfo({});
            setActionInfo({});
            setUploadedFile(null);
            setDocumentVersions([]);

            (async () => {
                try {
                    const res = await apiClient.get(`/reviews/${caseId}`);
                    const reviews = res.data;
                    if (reviews && reviews.length > 0) {
                        const latestReview = reviews[0]; // sorted by createdAt desc
                        setIsFromDashboard(true);
                        setIsViewingExistingReview(isViewingFlag || true);
                        setReviewId(latestReview._id || latestReview.id || null);
                        setCurrentReviewStage(latestReview.reviewStage || 'supervising_lawyer');

                        const ii = latestReview.content?.interviewInfo || latestReview.interviewInfo || {};

                        // Restore uploaded file if exists
                        if (ii.uploadedDocument) {
                            try {
                                if (ii.uploadedDocument.isServerFile) {
                                    const mockFile = {
                                        name: ii.uploadedDocument.fileName,
                                        size: ii.uploadedDocument.fileSize,
                                        type: ii.uploadedDocument.fileType,
                                        serverFile: { url: ii.uploadedDocument.fileUrl, filename: ii.uploadedDocument.filename },
                                        isServerFile: true,
                                        uploadedBy: ii.uploadedDocument.uploadedBy,
                                        uploadedByRole: ii.uploadedDocument.uploadedByRole,
                                    };
                                    setUploadedFile(mockFile);
                                } else if (ii.uploadedDocument.fileData) {
                                    const { fileName, fileType, fileData } = ii.uploadedDocument;
                                    fetch(fileData)
                                        .then(r => r.blob())
                                        .then(blob => setUploadedFile(new File([blob], fileName, { type: fileType })))
                                        .catch(err => console.error('Error restoring file:', err));
                                }
                            } catch (error) {
                                console.error('Error processing uploaded document:', error);
                            }
                        }

                        if (ii.documentVersions && Array.isArray(ii.documentVersions)) {
                            setDocumentVersions(ii.documentVersions);
                        }
                        if (ii.clientEvidence) {
                            setInterviewInfo(prev => ({ ...prev, ...ii }));
                        } else {
                            setInterviewInfo(ii);
                        }
                        if (latestReview.content?.actionInfo) {
                            setActionInfo(latestReview.content.actionInfo);
                        }
                        setShowClientInfoPanel(true);
                    }
                } catch (err) {
                    console.error('Error fetching review from notification:', err);
                }
            })();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [caseIdParam]);

    // Auto-fill client information when opening from appointment status
    useEffect(() => {
        const fetchClientInfo = async () => {
            const caseId = getCaseId();
            const clientInfo = location?.state?.clientInfo;
            
            // Skip fetching if clientInfo was already passed from Recommend button
            if (clientInfo) {
                return;
            }
            
            // Only fetch if we have a valid caseId, we're not viewing an existing review, 
            // and the form is empty (no client name yet)
            if (caseId && caseId !== 'new-case' && !isViewingExistingReview && !interviewInfo.clientName) {
                try {
                    const { default: apiClient } = await import('@config/api/apiClient');
                    const response = await apiClient.get(`/clientsinfo/${caseId}`);
                    const clientData = response.data;
                    
                    // Format the date to YYYY-MM-DD for date input
                    const formatDate = (date) => {
                        if (!date) return '';
                        const d = new Date(date);
                        const year = d.getFullYear();
                        const month = String(d.getMonth() + 1).padStart(2, '0');
                        const day = String(d.getDate()).padStart(2, '0');
                        return `${year}-${month}-${day}`;
                    };
                    
                    // Get current date for dateSubmitted
                    const today = new Date();
                    const currentDate = formatDate(today);
                    
                    // Get current user's full name and ID (only for interns creating new reviews)
                    const currentUserName = userData?.firstName && userData?.lastName 
                        ? `${userData.firstName} ${userData.lastName}` 
                        : userData?.username || 'Unknown User';
                    const currentUserId = userData?._id || userData?.id || null;
                    
                    // Set interview info with client data
                    // Only set interviewingInterns if this is a new review being created by an intern
                    setInterviewInfo(prev => {
                        const newInterviewInfo = {
                            ...prev,
                            clientName: clientData.fullName || clientData.name || '',
                            dateOfInterview: formatDate(clientData.appointedDate || clientData.createdAt),
                            dateSubmitted: currentDate,
                        };
                        
                        // Only add interviewingInterns and ID if not already set (preserves original intern's name and ID)
                        if (!prev.interviewingInterns) {
                            newInterviewInfo.interviewingInterns = currentUserName;
                            newInterviewInfo.interviewingInternsId = currentUserId;
                        }
                        
                        return newInterviewInfo;
                    });
                } catch (error) {
                    console.error('Error fetching client info for auto-fill:', error);
                }
            }
        };

        fetchClientInfo();
    }, [getCaseId, isViewingExistingReview, interviewInfo.clientName, location]);

    // Fetch full client information for the side panel
    // Re-fetch when caseIdParam changes (switching between notifications)
    useEffect(() => {
        if (!showClientInfoPanel) return;
        const caseId = getCaseId();
        if (!caseId || caseId === 'new-case') return;

        const loadClientInfo = async () => {
            setClientInfoLoading(true);
            try {
                const { default: apiClient } = await import('@config/api/apiClient');
                const response = await apiClient.get(`/clientsinfo/${caseId}`);
                setClientInfoData(response.data);
            } catch (err) {
                console.error('Error fetching client info for panel:', err);
            } finally {
                setClientInfoLoading(false);
            }
        };
        loadClientInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showClientInfoPanel, caseIdParam]);
    

    // Clear uploaded file when switching away from 'legal-document' case type
    useEffect(() => {
        if (interviewInfo.caseType && interviewInfo.caseType !== 'legal-document' && uploadedFile) {
            setUploadedFile(null);
            setFileInputKey(Date.now());
            setDocumentVersions([]);
        }
    }, [interviewInfo.caseType, uploadedFile]);

    const nextStep = () => setActive((current) => (current < totalSteps - 1 ? current + 1 : current));
    const prevStep = () => setActive((current) => (current > 0 ? current - 1 : current));
    
    // Handler for viewing document
    const handleViewDocument = async (file, documentData) => {
        console.log('handleViewDocument called with:', { file, documentData });
        
        // Reset Word doc state
        setWordDocHtml(null);
        setWordDocLoading(false);
        
        let docToView = null;
        
        // Prioritize the passed file object, then documentData, then fallback to interviewInfo
        if (file) {
            // If file object is passed (uploaded but not saved yet)
            if (file.isServerFile && file.serverFile) {
                // Document uploaded to server
                console.log('Viewing server file:', file.serverFile);
                docToView = {
                    fileName: file.name,
                    fileType: file.type,
                    fileUrl: file.serverFile.url,
                    isServerFile: true
                };
            } else {
                // Local file (shouldn't happen with new upload system)
                console.log('Viewing local file');
                docToView = {
                    fileName: file.name,
                    fileType: file.type,
                    fileData: URL.createObjectURL(file),
                    isServerFile: false
                };
            }
        } else if (documentData) {
            // If documentData is passed (version history or saved document)
            console.log('Viewing document data:', documentData);
            docToView = {
                fileName: documentData.fileName,
                fileType: documentData.fileType,
                fileData: documentData.fileData,
                fileUrl: documentData.fileUrl,
                isServerFile: documentData.isServerFile || false
            };
        } else if (interviewInfo.uploadedDocument) {
            // Fallback to saved document in interviewInfo
            console.log('Viewing from interviewInfo:', interviewInfo.uploadedDocument);
            docToView = {
                fileName: interviewInfo.uploadedDocument.fileName,
                fileType: interviewInfo.uploadedDocument.fileType,
                fileData: interviewInfo.uploadedDocument.fileData,
                fileUrl: interviewInfo.uploadedDocument.fileUrl,
                isServerFile: interviewInfo.uploadedDocument.isServerFile || false
            };
        } else {
            console.warn('No document to view');
            return; // Nothing to view
        }
        
        // Normalize server-relative or localhost URLs BEFORE setting state
        // so the component renders with the correct URL on first render
        try {
            if (docToView?.fileUrl && typeof docToView.fileUrl === 'string') {
                // If backend returned a relative path like "/uploads/..." convert it to absolute
                if (docToView.fileUrl.startsWith('/')) {
                    docToView.fileUrl = getServerFileUrl(docToView.fileUrl);
                }

                // Replace localhost with 127.0.0.1 to avoid IPv6 ::1 resolution issues
                if (docToView.fileUrl.includes('localhost')) {
                    docToView.fileUrl = docToView.fileUrl.replace('localhost', '127.0.0.1');
                }

                // If somehow the dev server origin was prepended (vite) adjust to backend API URL
                if (docToView.fileUrl.includes(':5173/uploads')) {
                    const backend = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
                    const path = docToView.fileUrl.split(':5173')[1] || docToView.fileUrl;
                    docToView.fileUrl = `${backend}${path}`;
                }

                console.log('Normalized document URL for preview:', docToView.fileUrl);
            }
        } catch (normalizeErr) {
            console.warn('Error normalizing document URL', normalizeErr);
        }
        
        setCurrentViewingDoc(docToView);
        
        // If it's a Word document, convert to HTML using mammoth
        const isWordDoc = docToView.fileType?.includes('word') || 
                         docToView.fileName?.endsWith('.docx') || 
                         docToView.fileName?.endsWith('.doc');
        
        if (isWordDoc && (docToView.fileUrl || docToView.fileData)) {
            setWordDocLoading(true);
            try {
                // Build candidate URLs to try (order matters)
                const candidates = [];
                if (docToView.fileData) candidates.push(docToView.fileData);
                if (docToView.fileUrl) candidates.push(docToView.fileUrl);
                // serverFile filename may exist
                if (file?.serverFile?.filename) {
                    candidates.push(getServerFileUrl(`/uploads/documents/${encodeURIComponent(file.serverFile.filename)}`));
                }
                if (docToView.filename) {
                    candidates.push(getServerFileUrl(`/uploads/documents/${encodeURIComponent(docToView.filename)}`));
                    candidates.push(getServerFileUrl(`/uploads/documents/${docToView.filename}`));
                }
                // try any documentVersions attached to interviewInfo or documentData
                if (documentData?.fileUrl) candidates.push(documentData.fileUrl);
                if (interviewInfo?.documentVersions && Array.isArray(interviewInfo.documentVersions)) {
                    for (const v of interviewInfo.documentVersions) {
                        if (v?.fileUrl) candidates.push(v.fileUrl);
                        if (v?.filename) candidates.push(getServerFileUrl(`/uploads/documents/${encodeURIComponent(v.filename)}`));
                    }
                }

                let arrayBuffer = null;
                let lastErr = null;
                for (const cand of candidates) {
                    if (!cand) continue;
                    try {
                        arrayBuffer = await fetchArrayBufferFromUrl(cand, docToView?.cloudinaryUrl);
                        if (arrayBuffer) break;
                    } catch (e) {
                        lastErr = e;
                        console.warn('Candidate failed:', cand, e);
                        continue;
                    }
                }
                if (!arrayBuffer) {
                    // Try server-side resolver to find a matching file
                    try {
                        const backend = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
                        const resolveUrl = `${backend}/api/uploads/resolve?path=${encodeURIComponent(docToView.fileUrl || docToView.fileName || '')}`;
                        console.debug('Attempting resolver:', resolveUrl);
                        // Attach auth header for resolver since it's protected in production
                        const resolveHeaders = {};
                        try {
                            if (firebaseAuth.currentUser) {
                                const token = await firebaseAuth.currentUser.getIdToken();
                                resolveHeaders['Authorization'] = `Bearer ${token}`;
                            }
                        } catch (e) { console.debug('No token for resolver fetch', e); }
                        const r = await fetch(resolveUrl, { headers: resolveHeaders });
                        if (r.ok) {
                            const jr = await r.json();
                            if (jr?.found && jr?.url) {
                                console.debug('Resolver returned', jr.url);
                                arrayBuffer = await fetchArrayBufferFromUrl(getServerFileUrl(jr.url), docToView?.cloudinaryUrl);
                            }
                        }
                    } catch (resErr) {
                        console.warn('Resolver attempt failed', resErr);
                    }
                }
                if (!arrayBuffer) throw lastErr || new Error('No candidate URLs worked');

                // Convert to HTML using mammoth
                const result = await mammoth.convertToHtml({ arrayBuffer });

                // Split HTML into pages at Word page-break markers.
                // mammoth outputs: <br clear="all" style="page-break-before:always">
                // or <hr> style breaks. We split on those and wrap each segment
                // in a page-styled container so the preview looks like real pages.
                const raw = result.value || '';
                const PAGE_BREAK_RE = /<br[^>]*page-break[^>]*>|<hr[^>]*page-break[^>]*>/gi;
                const pages = raw.split(PAGE_BREAK_RE).filter(p => p.trim().length > 0);

                if (pages.length > 1) {
                    // Multiple pages detected – wrap each in a page div
                    const pagesHtml = pages.map((pageContent, idx) =>
                        `<div class="word-page" data-page="${idx + 1}">
                            <div class="word-page-number">Page ${idx + 1} of ${pages.length}</div>
                            ${pageContent}
                        </div>`
                    ).join('');
                    setWordDocHtml(pagesHtml);
                } else {
                    // Single page or no explicit breaks – still wrap in page div for consistent styling
                    setWordDocHtml(
                        `<div class="word-page" data-page="1">
                            ${raw}
                        </div>`
                    );
                }

                if (result.messages.length > 0) {
                    console.log('Mammoth conversion messages:', result.messages);
                }
            } catch (error) {
                console.error('Error converting Word document:', error);
                setWordDocHtml('<div style="padding: 20px; color: red;">Error loading document. Please try downloading instead.</div>');
            } finally {
                setWordDocLoading(false);
            }
        }
        
        setViewerModalOpened(true);
    };

    
    
    // Handler for downloading document
    const handleDownloadDocument = async (file, documentData) => {
        const docData = documentData || interviewInfo.uploadedDocument;
        
        // Always use the original filename (never the server-mangled one with random numbers)
        const fileName = file?.name || docData?.fileName || 'document';
        
        // Check if it's a server file first
        let url = null;
        if (file?.isServerFile && file?.serverFile?.url) {
            url = file.serverFile.url;
        } else if (docData?.isServerFile && docData?.fileUrl) {
            url = docData.fileUrl;
        } else if (docData?.fileData) {
            url = docData.fileData;
        } else if (file && !file.isServerFile) {
            url = URL.createObjectURL(file);
        }
        
        // Normalize server-relative URLs to backend absolute URLs
        if (typeof url === 'string' && url.startsWith('/')) {
            url = getServerFileUrl(url);
        }

        if (!url) {
            console.error('No URL available for download');
            return;
        }
        
        try {
                // Prefer Cloudinary persistent copy when available
                const cloudUrl = file?.serverFile?.cloudinaryUrl || docData?.cloudinaryUrl || interviewInfo?.uploadedDocument?.cloudinaryUrl;
                const finalUrl = cloudUrl || url;

                // Build auth headers when fetching from our server endpoints
                const headers = {};
                try {
                    const isServerUrl = typeof finalUrl === 'string' && (finalUrl.includes('/uploads/') || finalUrl.includes('/api/uploads/'));
                    if (isServerUrl && firebaseAuth.currentUser) {
                        const token = await firebaseAuth.currentUser.getIdToken();
                        headers['Authorization'] = `Bearer ${token}`;
                    }
                } catch (e) {
                    console.debug('Could not get auth token for download', e);
                }

                // Fetch as blob so we can force the filename when saving
                const response = await fetch(finalUrl, { headers });
                console.debug('Download response status for', finalUrl, response.status);
                if (!response.ok) {
                    throw new Error(`Download failed: ${response.status} ${response.statusText}`);
                }
                const blob = await response.blob();
                try {
                    const fb = new Uint8Array(await blob.slice(0, Math.min(64, blob.size)).arrayBuffer());
                    const hex = Array.from(fb).map(b => b.toString(16).padStart(2, '0')).join(' ');
                    console.debug('Download blob size:', blob.size, 'firstBytesHex:', hex);
                } catch (e) {/* ignore */}
                const blobUrl = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(blobUrl);
        } catch (err) {
                console.error('Blob download failed, attempting authenticated server download as fallback:', err);
                // If cloudinary failed or cross-origin prevented download, try server URL with auth header
                try {
                    const serverUrl = (url && url.startsWith('/')) ? getServerFileUrl(url) : url;
                    const isServerUrl = typeof serverUrl === 'string' && (serverUrl.includes('/uploads/') || serverUrl.includes('/api/uploads/'));
                    if (isServerUrl) {
                        const headers = {};
                        try {
                            if (firebaseAuth.currentUser) {
                                const token = await firebaseAuth.currentUser.getIdToken();
                                headers['Authorization'] = `Bearer ${token}`;
                            }
                        } catch (e) { console.debug('No auth token for fallback server download', e); }

                        const r = await fetch(serverUrl, { headers });
                        console.debug('Fallback server download response', r.status);
                        if (r.ok) {
                            const b = await r.blob();
                            const blobUrl2 = URL.createObjectURL(b);
                            const link2 = document.createElement('a');
                            link2.href = blobUrl2;
                            link2.download = fileName;
                            document.body.appendChild(link2);
                            link2.click();
                            document.body.removeChild(link2);
                            URL.revokeObjectURL(blobUrl2);
                            return;
                        }
                    }
                } catch (fallbackErr) {
                    console.error('Authenticated server fallback failed', fallbackErr);
                }

                // Last resort: open original URL in new tab so user can manually save
                const link = document.createElement('a');
                link.href = url;
                link.target = '_blank';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
        }
    };
    
    // Handler for file change with version management
    const handleFileChange = async (file) => {
        if (file) {
            // Add current document to version history before replacing
            if (uploadedFile || interviewInfo.uploadedDocument) {
                const currentDoc = {
                    fileName: uploadedFile?.name || interviewInfo.uploadedDocument?.fileName,
                    fileSize: uploadedFile?.size || interviewInfo.uploadedDocument?.fileSize,
                    fileType: uploadedFile?.type || interviewInfo.uploadedDocument?.fileType,
                    fileData: interviewInfo.uploadedDocument?.fileData,
                    fileUrl: uploadedFile?.serverFile?.url || interviewInfo.uploadedDocument?.fileUrl,
                    filename: uploadedFile?.serverFile?.filename || interviewInfo.uploadedDocument?.filename,
                    isServerFile: uploadedFile?.isServerFile || interviewInfo.uploadedDocument?.isServerFile || false,
                    uploadedAt: new Date().toISOString(),
                    // Don't use current userData as fallback - preserve original uploader or mark as Unknown
                    uploadedBy: uploadedFile?.uploadedBy || interviewInfo.uploadedDocument?.uploadedBy || 'Unknown',
                    uploadedByRole: uploadedFile?.uploadedByRole || interviewInfo.uploadedDocument?.uploadedByRole || 'Unknown'
                };
                setDocumentVersions(prev => [currentDoc, ...prev]);
            }
            
            // Upload all documents (Word and PDF) to server
            try {
                const formData = new FormData();
                formData.append('document', file);
                
                const response = await apiClient.post('/upload/document', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                
                const result = response.data;
                console.log('Document uploaded successfully:', result);
                
                // Store file with URL reference - explicitly copy File properties
                setUploadedFile({
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    lastModified: file.lastModified,
                    serverFile: result.file,
                    isServerFile: true,
                    uploadedBy: userData?.firstName && userData?.lastName 
                        ? `${userData.firstName} ${userData.lastName}` 
                        : userData?.username || 'Unknown',
                    uploadedByRole: userData?.role || 'Unknown'
                });
            } catch (error) {
                console.error('Error uploading document:', error);
                fileUploadFailedNotif();
                return;
            }
        } else {
            // When file is removed (null), delete from server if it was uploaded
            if (uploadedFile?.isServerFile && uploadedFile?.serverFile?.filename) {
                try {
                    await apiClient.delete(`/upload/document/${uploadedFile.serverFile.filename}`);
                } catch (error) {
                    console.error('Error deleting file from server:', error);
                }
            }
            // Also delete from server if file exists in interviewInfo
            if (interviewInfo.uploadedDocument?.isServerFile && interviewInfo.uploadedDocument?.filename) {
                try {
                    await apiClient.delete(`/upload/document/${interviewInfo.uploadedDocument.filename}`);
                } catch (error) {
                    console.error('Error deleting file from server:', error);
                }
            }
            setUploadedFile(null);
            // Also clear from interviewInfo to ensure it doesn't show up after removal
            setInterviewInfo(prev => ({
                ...prev,
                uploadedDocument: null
            }));
            setFileInputKey(Date.now());
        }
    };
    
    // Handler for removing a version from history
    const handleRemoveVersion = (index) => {
        if (window.confirm('Are you sure you want to remove this version from history?')) {
            setDocumentVersions(prev => prev.filter((_, i) => i !== index));
        }
    };
    
    const handleSubmit = async () => {
        const caseId = getCaseId();
        
        // Flush any focused evidence row input before reading interviewInfo state
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
            await new Promise(r => setTimeout(r, 0));
        }
        
        // Check if file is required but not uploaded
        if (interviewInfo.caseType === 'legal-document' && !uploadedFile) {
            fileRequiredNotif();
            return;
        }
        
        // Filter out completely empty evidence rows before saving
        const filterEmptyEvidence = (evidenceArray) => {
            if (!evidenceArray || !Array.isArray(evidenceArray)) return [];
            return evidenceArray.filter(row => 
                row && (row.type || row.author || row.purpose || row.issues)
            );
        };
        
        // All documents (Word and PDF) now stored on server with URL references
        let fileData = null;
        if (uploadedFile && interviewInfo.caseType === 'legal-document') {
            if (uploadedFile.isServerFile) {
                // Document already uploaded to server (both Word and PDF)
                fileData = {
                    fileName: uploadedFile.name,
                    fileSize: uploadedFile.size,
                    fileType: uploadedFile.type,
                    fileUrl: uploadedFile.serverFile.url,
                    filename: uploadedFile.serverFile.filename,
                    isServerFile: true,
                    uploadedBy: uploadedFile.uploadedBy || (userData?.firstName && userData?.lastName 
                        ? `${userData.firstName} ${userData.lastName}` 
                        : userData?.username || 'Unknown'),
                    uploadedByRole: uploadedFile.uploadedByRole || userData?.role || 'Unknown'
                };
            } else {
                // Shouldn't happen with current logic, but handle as fallback
                fileNotUploadedNotif();
                return;
            }
        }
        
        // Ensure all interview data is included
        const completeInterviewInfo = {
            ...interviewInfo,
            // Filter out empty evidence rows
            clientEvidence: filterEmptyEvidence(interviewInfo.clientEvidence),
            adversePartyEvidence: filterEmptyEvidence(interviewInfo.adversePartyEvidence),
            uploadedDocument: fileData, // Add file data with URL reference
            documentVersions: documentVersions.length > 0 ? documentVersions : interviewInfo.documentVersions || [],
            createdByRole: interviewInfo.createdByRole || userData?.role || null, // Track who created this interview record
            createdByName: interviewInfo.createdByName || (userData?.firstName && userData?.lastName 
                ? `${userData.firstName} ${userData.lastName}` 
                : userData?.username || 'Unknown User')
        };

        const reviewPayload = {
            caseId: caseId,
            reviewerId: userData?.id || userData?._id || null,
            reviewerRole: userData?.role || null,
            step: active,
            reviewStage: 'supervising_lawyer', // Start with supervising lawyer review
            content: { 
                interviewInfo: completeInterviewInfo,
                actionInfo: actionInfo 
            }
        };

        console.log('Saving review with payload:', reviewPayload);

        // Helper to ensure status updates actually persist before proceeding
        const updateCaseStatus = async (status) => {
            try {
                const resp = await apiClient.put(`/clientsinfo/${caseId}`, { status });
                if (resp?.status >= 200 && resp.status < 300) return true;
                console.error('Primary status update failed', resp?.status, resp?.data);
            } catch (err) {
                console.error('Primary status update error', err);
            }

            try {
                const fallback = await apiClient.put(`/clientsinfo/${caseId}`, { status });
                if (fallback?.status >= 200 && fallback.status < 300) return true;
                console.error('Fallback status update failed', fallback?.status);
            } catch (fallbackErr) {
                console.error('Fallback status update error', fallbackErr);
            }

            return false;
        };

        try {
            setSaving(true);

            // Special flow: opened from Auto-Scheduled "Approve & Recommend"
            // - Save the recommendation form
            // - Record to calendar (create event)
            // - Open pre-filled Google Calendar event
            // - Do NOT redirect to dashboard yet
            // - Do NOT change clientsinfo status here (card must remain in Auto-Scheduled)
            if (isFromAutoScheduledApproveFlow && active === totalSteps - 1) {
                // Pre-open a tab to avoid popup blockers (best-effort).
                const calendarTab = window.open('about:blank', '_blank');
                const resReview = await apiClient.post('/reviews', reviewPayload);
                const saved = resReview.data;
                await fetchReviews(caseId);

                try {
                    const clientResp = await apiClient.get(`/clientsinfo/${caseId}`);
                    const clientData = clientResp?.data;

                    const eventDate = clientData?.appointedDate || clientData?.createdAt;
                    const appointmentTime = clientData?.appointmentTime || '';
                    const clientName = clientData?.fullName || clientData?.name || completeInterviewInfo?.clientName || '';
                    const locationValue = clientData?.caseDetails?.location || '';
                    const purposeValue = clientData?.caseDetails?.purpose || '';

                    if (eventDate) {
                        const title = clientName ? `${clientName} - Interview` : 'Client Interview';
                        const description = [
                            purposeValue ? `Purpose: ${purposeValue}` : '',
                            appointmentTime ? `Time: ${appointmentTime}` : '',
                            'Saved from Recommendation for Action form.'
                        ].filter(Boolean).join('\n');

                        await apiClient.post('/events', {
                            title,
                            description,
                            eventDate,
                            eventType: 'appointment',
                            location: locationValue,
                            clientName,
                            assignedTo: userData?.email || (userData?.firstName && userData?.lastName ? `${userData.firstName} ${userData.lastName}` : ''),
                            priority: 'Medium',
                            status: 'scheduled',
                        });

                        const googleCalendarUrl = generateGoogleCalendarUrl({
                            title,
                            appointmentDate: eventDate,
                            appointmentTime,
                            location: locationValue,
                            description,
                        });
                        if (calendarTab) {
                            calendarTab.location.href = googleCalendarUrl;
                        } else {
                            window.open(googleCalendarUrl, '_blank');
                        }
                    }
                } catch (calendarErr) {
                    console.error('Calendar recording/open failed:', calendarErr);
                }

                reviewSavedNotif();
                console.log('Saved review (auto-scheduled flow)', saved);
                navigate('/admin/clientformstatus', { replace: true });
                return;
            }
            
            // Intern behavior on Step 1 - check which button was clicked via a flag
            // This will be set by the button click handler
            const isInternFinalize = window.__internFinalizeClicked;
            delete window.__internFinalizeClicked; // Clean up flag
            
            if ((userData?.role === 'intern' || userData?.role === 'secretary') && active === totalSteps - 1) {
                if (isInternFinalize && interviewInfo.caseType === 'legal-advice') {
                    // Intern finalizing a legal advice case
                    const statusOk = await updateCaseStatus('legal-advice');
                    if (!statusOk) {
                        statusUpdateFailedNotif();
                        setSaving(false);
                        return;
                    }

                    console.log('Status updated to legal-advice for intern finalize');
                    legalAdviceFinalizedNotif();
                    
                    // Redirect to Client Form Status
                    navigate('/admin/clientformstatus');
                    return;
                } else {
                    // Intern submitting for review (or finalizing non-legal-advice)
                    const statusOk = await updateCaseStatus('confirmed');
                    if (!statusOk) {
                        statusUpdateFailedNotif();
                        setSaving(false);
                        return;
                    }

                    console.log('Status updated to confirmed for intern review');
                }
            }
            
            // If director/attorney finalizes record on last step, create a finalized record
            if ((userData?.role === 'director' || userData?.role === 'attorney' || userData?.role === 'pao_lawyer' || userData?.role === 'legal_volunteer' || userData?.role === 'supervising_lawyer') && active === totalSteps - 1) {
                // Determine final status based on caseType and decision
                const finalDecision = actionInfo.decision || 'accepted'; // default to accepted when finalizing
                let finalStatus = 'confirmed';

                if (interviewInfo.caseType === 'legal-advice') {
                    finalStatus = 'legal-advice';
                } else if (interviewInfo.caseType === 'legal-document') {
                    finalStatus = 'confirmed'; // Document drafting cases remain as confirmed
                } else if (finalDecision === 'rejected') {
                    finalStatus = 'rejected';
                } else if (finalDecision === 'accepted' || finalDecision === 'pending') {
                    finalStatus = 'court-case';
                }

                const statusOk = await updateCaseStatus(finalStatus);
                if (!statusOk) {
                    statusUpdateHaltedNotif();
                    setSaving(false);
                    return;
                }

                console.log('Final status updated to:', finalStatus, 'for caseType:', interviewInfo.caseType);
                
                const finalizePayload = {
                    caseId: caseId,
                    finalizedBy: userData?.id || userData?._id || null,
                    finalizedRole: userData?.role || null,
                    decision: finalDecision,
                    content: { 
                        interviewInfo: completeInterviewInfo, 
                        actionInfo: { ...actionInfo, decision: finalDecision }
                    }
                }
                const resFinalize = await apiClient.post('/finalize', finalizePayload)
                console.log('Saved finalize', resFinalize.data)
                
                // Delete the review record from reviews collection after finalizing
                try {
                    await apiClient.delete(`/reviews/case/${caseId}`)
                    console.log('Review deleted successfully after finalization')
                } catch (deleteErr) {
                    console.error('Error deleting review:', deleteErr)
                    // Don't throw here, finalization was successful
                }
                
                caseFinalizedNotif()
                await fetchReviews(caseId)
                
                // Redirect to dashboard
                navigate('/admin', { replace: true });
                return
            }

            const resReview = await apiClient.post('/reviews', reviewPayload);
            const saved = resReview.data;
            console.log('Successfully saved review:', saved);
            await fetchReviews(caseId);

            reviewSavedNotif();
            console.log('Saved review', saved);
            
            // Redirect to dashboard based on user role
            const getDashboardPath = () => {
                const role = userData?.role;
                // All admin roles use /admin path
                if (role === 'intern' || role === 'secretary' || role === 'attorney' || role === 'pao_lawyer' || role === 'legal_volunteer') {
                    return '/admin';
                }
                return '/user/home'; // Default fallback for clients
            };
            
            navigate(getDashboardPath(), { replace: true });
        } catch (err) {
            console.error('handleSubmit error:', err);
            reviewSaveFailedNotif(err.message);
        } finally {
            setSaving(false);
        }
    };

    const fetchReviews = async (caseIdParam) => {
        const caseId = caseIdParam || getCaseId();
        try {
            const res = await apiClient.get(`/reviews/${caseId}`)
            setReviews(res.data)
            // Only load data if opened from dashboard and data exists
            // (Data from location.state is already loaded in the location useEffect)
            // Don't auto-load data when opened from sidebar - keep it clean
        } catch (err) {
            console.error('fetchReviews error', err)
        }
    }

    const handleSaveChanges = async () => {
        if (!reviewId) {
            noReviewIdNotif();
            return;
        }

        // Flush any focused evidence row input before reading interviewInfo state
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
            await new Promise(r => setTimeout(r, 0));
        }

        // Check if file is required but not uploaded (only if there was never a file)
        if (interviewInfo.caseType === 'legal-document' && !uploadedFile && !interviewInfo.uploadedDocument) {
            fileRequiredNotif();
            return;
        }

        // Filter out completely empty evidence rows before saving
        const filterEmptyEvidence = (evidenceArray) => {
            if (!evidenceArray || !Array.isArray(evidenceArray)) return [];
            return evidenceArray.filter(row => 
                row && (row.type || row.author || row.purpose || row.issues)
            );
        };

        // All documents (Word and PDF) now stored on server with URL references
        let fileData = null;
        
        if (uploadedFile && interviewInfo.caseType === 'legal-document') {
            // New file uploaded
            if (uploadedFile.isServerFile) {
                // Document already uploaded to server (both Word and PDF)
                fileData = {
                    fileName: uploadedFile.name,
                    fileSize: uploadedFile.size,
                    fileType: uploadedFile.type,
                    fileUrl: uploadedFile.serverFile.url,
                    filename: uploadedFile.serverFile.filename,
                    isServerFile: true,
                    uploadedBy: uploadedFile.uploadedBy || (userData?.firstName && userData?.lastName 
                        ? `${userData.firstName} ${userData.lastName}` 
                        : userData?.username || 'Unknown'),
                    uploadedByRole: uploadedFile.uploadedByRole || userData?.role || 'Unknown'
                };
            } else {
                // Shouldn't happen with current logic, but handle as fallback
                fileNotUploadedNotif();
                return;
            }
        } else if (interviewInfo.uploadedDocument) {
            // Keep existing if no new file was uploaded
            fileData = interviewInfo.uploadedDocument;
        }
        // If fileData is still null here and there was no uploadedFile, it means file was removed

        const completeInterviewInfo = {
            ...interviewInfo,
            clientEvidence: filterEmptyEvidence(interviewInfo.clientEvidence),
            adversePartyEvidence: filterEmptyEvidence(interviewInfo.adversePartyEvidence),
            uploadedDocument: fileData,
            documentVersions: documentVersions.length > 0 ? documentVersions : interviewInfo.documentVersions || [],
            createdByRole: interviewInfo.createdByRole || userData?.role || null, // Preserve or set position
            createdByName: interviewInfo.createdByName || (userData?.firstName && userData?.lastName 
                ? `${userData.firstName} ${userData.lastName}` 
                : userData?.username || 'Unknown User')
        };

        const updatePayload = {
            content: { 
                interviewInfo: completeInterviewInfo,
                actionInfo 
            }
        };

        try {
            setSaving(true);
            const response = await apiClient.put(`/reviews/${reviewId}`, updatePayload);
            console.log('Successfully updated review:', response.data);
            changesSavedNotif();
        } catch (err) {
            console.error('handleSaveChanges error:', err);
            changesSaveFailedNotif(err.message);
        } finally {
            setSaving(false);
        }
    };

    // Handler for intern to resubmit review after making revisions
    const handleResubmitForReview = async () => {
        if (!reviewId) {
            noReviewIdNotif();
            return;
        }

        // Filter out completely empty evidence rows before resubmitting
        const filterEmptyEvidence = (evidenceArray) => {
            if (!evidenceArray || !Array.isArray(evidenceArray)) return [];
            return evidenceArray.filter(row => 
                row && (row.type || row.author || row.purpose || row.issues)
            );
        };

        const completeInterviewInfo = {
            ...interviewInfo,
            clientEvidence: filterEmptyEvidence(interviewInfo.clientEvidence),
            adversePartyEvidence: filterEmptyEvidence(interviewInfo.adversePartyEvidence),
            uploadedDocument: uploadedFile ? {
                fileName: uploadedFile.name,
                fileSize: uploadedFile.size,
                fileType: uploadedFile.type,
                fileUrl: uploadedFile.serverFile?.url,
                filename: uploadedFile.serverFile?.filename,
                isServerFile: uploadedFile.isServerFile,
                uploadedBy: uploadedFile.uploadedBy,
                uploadedByRole: uploadedFile.uploadedByRole
            } : interviewInfo.uploadedDocument || null,
            documentVersions: documentVersions.length > 0 ? documentVersions : interviewInfo.documentVersions || [],
            createdByRole: interviewInfo.createdByRole || userData?.role || null,
            createdByName: interviewInfo.createdByName || (userData?.firstName && userData?.lastName 
                ? `${userData.firstName} ${userData.lastName}` 
                : userData?.username || 'Unknown User')
        };

        const updatePayload = {
            reviewStage: 'supervising_lawyer', // Resubmit to supervising lawyer
            content: { 
                interviewInfo: completeInterviewInfo,
                actionInfo 
            }
        };

        try {
            setSaving(true);
            const response = await apiClient.put(`/reviews/${reviewId}`, updatePayload);
            console.log('Successfully resubmitted review:', response.data);
            reviewResubmittedNotif();
            
            // Redirect to dashboard
            navigate('/admin', { replace: true });
        } catch (err) {
            console.error('handleResubmitForReview error:', err);
            reviewResubmitFailedNotif(err.message);
        } finally {
            setSaving(false);
        }
    };

    // Handler for supervising lawyer to return review to intern
    const handleReturnToIntern = async () => {
        if (!reviewId) {
            noReviewIdNotif();
            return;
        }

        // Save changes first
        const filterEmptyEvidence = (evidenceArray) => {
            if (!evidenceArray || !Array.isArray(evidenceArray)) return [];
            return evidenceArray.filter(row => 
                row && (row.type || row.author || row.purpose || row.issues)
            );
        };

        const completeInterviewInfo = {
            ...interviewInfo,
            clientEvidence: filterEmptyEvidence(interviewInfo.clientEvidence),
            adversePartyEvidence: filterEmptyEvidence(interviewInfo.adversePartyEvidence),
            uploadedDocument: uploadedFile ? {
                fileName: uploadedFile.name,
                fileSize: uploadedFile.size,
                fileType: uploadedFile.type,
                fileUrl: uploadedFile.serverFile?.url,
                filename: uploadedFile.serverFile?.filename,
                isServerFile: uploadedFile.isServerFile,
                uploadedBy: uploadedFile.uploadedBy,
                uploadedByRole: uploadedFile.uploadedByRole
            } : interviewInfo.uploadedDocument || null,
            documentVersions: documentVersions.length > 0 ? documentVersions : interviewInfo.documentVersions || [],
            createdByRole: interviewInfo.createdByRole || userData?.role || null,
            createdByName: interviewInfo.createdByName || (userData?.firstName && userData?.lastName 
                ? `${userData.firstName} ${userData.lastName}` 
                : userData?.username || 'Unknown User')
        };

        const updatePayload = {
            reviewStage: 'returned_to_intern', // Move back to intern
            content: { 
                interviewInfo: completeInterviewInfo,
                actionInfo 
            }
        };

        try {
            setSaving(true);
            const response = await apiClient.put(`/reviews/${reviewId}`, updatePayload);
            console.log('Successfully returned to intern:', response.data);
            returnedToInternNotif();
            
            // Redirect to dashboard
            navigate('/admin', { replace: true });
        } catch (err) {
            console.error('handleReturnToIntern error:', err);
            returnToInternFailedNotif(err.message);
        } finally {
            setSaving(false);
        }
    };

    // Handler for director to return review to supervising lawyer
    const handleReturnToSupervisingLawyer = async () => {
        if (!reviewId) {
            noReviewIdNotif();
            return;
        }

        // Save changes first
        const filterEmptyEvidence = (evidenceArray) => {
            if (!evidenceArray || !Array.isArray(evidenceArray)) return [];
            return evidenceArray.filter(row => 
                row && (row.type || row.author || row.purpose || row.issues)
            );
        };

        const completeInterviewInfo = {
            ...interviewInfo,
            clientEvidence: filterEmptyEvidence(interviewInfo.clientEvidence),
            adversePartyEvidence: filterEmptyEvidence(interviewInfo.adversePartyEvidence),
            uploadedDocument: uploadedFile ? {
                fileName: uploadedFile.name,
                fileSize: uploadedFile.size,
                fileType: uploadedFile.type,
                fileUrl: uploadedFile.serverFile?.url,
                filename: uploadedFile.serverFile?.filename,
                isServerFile: uploadedFile.isServerFile,
                uploadedBy: uploadedFile.uploadedBy,
                uploadedByRole: uploadedFile.uploadedByRole
            } : interviewInfo.uploadedDocument || null,
            documentVersions: documentVersions.length > 0 ? documentVersions : interviewInfo.documentVersions || [],
            createdByRole: interviewInfo.createdByRole || userData?.role || null,
            createdByName: interviewInfo.createdByName || (userData?.firstName && userData?.lastName 
                ? `${userData.firstName} ${userData.lastName}` 
                : userData?.username || 'Unknown User')
        };

        const updatePayload = {
            reviewStage: 'supervising_lawyer', // Move back to supervising lawyer
            content: { 
                interviewInfo: completeInterviewInfo,
                actionInfo 
            }
        };

        try {
            setSaving(true);
            const response = await apiClient.put(`/reviews/${reviewId}`, updatePayload);
            console.log('Successfully returned to supervising lawyer:', response.data);
            returnedToSupervisingNotif();
            
            // Redirect to dashboard
            navigate('/admin', { replace: true });
        } catch (err) {
            console.error('handleReturnToSupervisingLawyer error:', err);
            returnToSupervisingFailedNotif(err.message);
        } finally {
            setSaving(false);
        }
    };

    // Handler for supervising lawyer to approve and send to director
    const handleApproveToDirector = async () => {
        if (!reviewId) {
            noReviewIdNotif();
            return;
        }

        // Save changes first
        const filterEmptyEvidence = (evidenceArray) => {
            if (!evidenceArray || !Array.isArray(evidenceArray)) return [];
            return evidenceArray.filter(row => 
                row && (row.type || row.author || row.purpose || row.issues)
            );
        };

        const completeInterviewInfo = {
            ...interviewInfo,
            clientEvidence: filterEmptyEvidence(interviewInfo.clientEvidence),
            adversePartyEvidence: filterEmptyEvidence(interviewInfo.adversePartyEvidence),
            uploadedDocument: uploadedFile ? {
                fileName: uploadedFile.name,
                fileSize: uploadedFile.size,
                fileType: uploadedFile.type,
                fileUrl: uploadedFile.serverFile?.url,
                filename: uploadedFile.serverFile?.filename,
                isServerFile: uploadedFile.isServerFile,
                uploadedBy: uploadedFile.uploadedBy,
                uploadedByRole: uploadedFile.uploadedByRole
            } : interviewInfo.uploadedDocument || null,
            documentVersions: documentVersions.length > 0 ? documentVersions : interviewInfo.documentVersions || [],
            createdByRole: interviewInfo.createdByRole || userData?.role || null,
            createdByName: interviewInfo.createdByName || (userData?.firstName && userData?.lastName 
                ? `${userData.firstName} ${userData.lastName}` 
                : userData?.username || 'Unknown User')
        };

        const updatePayload = {
            reviewStage: 'director', // Move to director review stage
            content: { 
                interviewInfo: completeInterviewInfo,
                actionInfo 
            }
        };

        try {
            setSaving(true);
            const response = await apiClient.put(`/reviews/${reviewId}`, updatePayload);
            console.log('Successfully moved to director review:', response.data);
            approvedToDirectorNotif();
            
            // Redirect to dashboard
            navigate('/admin', { replace: true });
        } catch (err) {
            console.error('handleApproveToDirector error:', err);
            approveToDirectorFailedNotif(err.message);
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        // Only fetch reviews list if opened from dashboard (to populate reviews state)
        // Don't auto-load form data - that should only come from location.state
        if (isFromDashboard) {
            fetchReviews()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isFromDashboard])

    const renderStepContent = () => {
        switch (active) {
            case 0:
                return (
                    <ClientInterviewSection 
                        value={interviewInfo} 
                        onChange={setInterviewInfo}
                        uploadedFile={uploadedFile}
                        onFileChange={handleFileChange}
                        documentVersions={documentVersions}
                        onViewDocument={handleViewDocument}
                        onDownloadDocument={handleDownloadDocument}
                        onRemoveVersion={handleRemoveVersion}
                        fileInputKey={fileInputKey}
                        userRole={userData?.role}
                        isViewingExistingReview={isViewingExistingReview}
                        currentReviewStage={currentReviewStage}
                    />
                );
            case 1:
                return (
                    <SupervisingLawyerActionSection 
                        value={actionInfo} 
                        onChange={setActionInfo} 
                        forLegalAdvice={interviewInfo.forLegalAdvice}
                        userRole={userData?.role}
                        userData={userData}
                        currentReviewStage={currentReviewStage}
                    />
                );
            default:
                return null;
        }
    };
    
    // Step labels for the Stepper component
    const steps = [
        { label: "Interview", description: "Client & Evidence" },
        { label: "Action", description: "Lawyer & Director" },
    ];

    // â”€â”€ Read-only Client Information Sheet side panel â”€â”€
    const ClientInfoSidePanel = () => {
        if (clientInfoLoading) {
            return (
                <Paper shadow="xs" p="xl" radius="lg" bg="white" h="100%">
                    <Center h={300}><Stack align="center" gap="md"><Loader size="sm" color={PRIMARY_BROWN} /><Text size="sm" c={MUTED_OLIVE}>Loading client information...</Text></Stack></Center>
                </Paper>
            );
        }
        if (!clientInfoData) {
            return (
                <Paper shadow="xs" p="xl" radius="lg" bg="white" h="100%">
                    <Center h={200}><Text size="sm" c={MUTED_OLIVE}>No client information available.</Text></Center>
                </Paper>
            );
        }

        const d = clientInfoData;
        const InfoField = ({ label, value, span = 6 }) => (
            <Grid.Col span={span}>
                <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} lts={0.3} mb={2}>{label}</Text>
                <Text size="sm" c="#333" fw={500}>{value || 'N/A'}</Text>
            </Grid.Col>
        );

        const formatDate = (val) => {
            if (!val) return 'N/A';
            try { return new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); } catch { return val; }
        };

        return (
            <Paper shadow="xs" radius="lg" bg="white" style={{ position: 'sticky', top: 20 }}>
                <Box p="md" style={{ backgroundColor: PRIMARY_BROWN, borderRadius: '8px 8px 0 0' }}>
                    <Group gap="sm">
                        <IconFileText size={20} color="white" />
                        <Text fw={700} size="sm" c="white">Client Information Sheet</Text>
                    </Group>
                </Box>
                <ScrollArea h="calc(100vh - 160px)" p="md" offsetScrollbars>
                    <Stack gap="lg">
                        {/* Personal Details */}
                        <Box>
                            <Text size="xs" fw={700} c={PRIMARY_BROWN} tt="uppercase" lts={0.5} mb="xs">Personal Details</Text>
                            <Grid gutter="xs">
                                <InfoField label="Full Name" value={d.fullName || d.name} span={12} />
                                <InfoField label="Age" value={d.age} />
                                <InfoField label="Birthday" value={formatDate(d.birthday)} />
                                <InfoField label="Sex" value={d.sex} />
                                <InfoField label="Civil Status" value={d.civilStatus} />
                                <InfoField label="Citizenship" value={d.citizenship} />
                                <InfoField label="Contact Number" value={d.contactNumber} />
                                <InfoField label="Cellphone" value={d.cellphoneNumber} />
                                <InfoField label="Present Address" value={d.presentAddress} span={12} />
                                <InfoField label="Present Address Tel." value={d.presentAddressTelephone} />
                                <InfoField label="Permanent Address" value={d.permanentAddress} span={12} />
                                <InfoField label="Permanent Address Tel." value={d.permanentAddressTelephone} />
                                <InfoField label="Spouse" value={d.spouseName || d.spouse} span={12} />
                            </Grid>
                        </Box>
                        <Divider />

                        {/* Relator */}
                        {(d.relatorName || d.relationshipToClient) && (
                            <>
                                <Box>
                                    <Text size="xs" fw={700} c={PRIMARY_BROWN} tt="uppercase" lts={0.5} mb="xs">Relator / Representative</Text>
                                    <Grid gutter="xs">
                                        <InfoField label="Name" value={d.relatorName} span={12} />
                                        <InfoField label="Relationship" value={d.relationshipToClient} />
                                    </Grid>
                                </Box>
                                <Divider />
                            </>
                        )}

                        {/* Financial Details */}
                        <Box>
                            <Text size="xs" fw={700} c={PRIMARY_BROWN} tt="uppercase" lts={0.5} mb="xs">Financial Details</Text>
                            <Grid gutter="xs">
                                <InfoField label="Source of Income" value={d.currentSourceOfIncome} span={12} />
                                <InfoField label="Monthly Income" value={d.monthlyIncome} />
                                <InfoField label="Nature of Work" value={d.natureOfWork} />
                                <InfoField label="Employer" value={d.employerName} span={12} />
                                <InfoField label="Employer Address" value={d.employerAddress} span={12} />
                                <InfoField label="Employer Tel." value={d.employerTelephone} />
                            </Grid>
                        </Box>
                        {(d.spouseSourceOfIncome || d.spouseMonthlyIncome) && (
                            <Box>
                                <Text size="xs" fw={700} c={PRIMARY_BROWN} tt="uppercase" lts={0.5} mb="xs">Spouse's Income</Text>
                                <Grid gutter="xs">
                                    <InfoField label="Source of Income" value={d.spouseSourceOfIncome} span={12} />
                                    <InfoField label="Monthly Income" value={d.spouseMonthlyIncome} />
                                    <InfoField label="Employer Address" value={d.spouseEmployerAddress} span={12} />
                                    <InfoField label="Combined Income" value={d.totalCombinedIncome} />
                                </Grid>
                            </Box>
                        )}
                        <Divider />

                        {/* Case Details */}
                        <Box>
                            <Text size="xs" fw={700} c={PRIMARY_BROWN} tt="uppercase" lts={0.5} mb="xs">Case Details</Text>
                            <Grid gutter="xs">
                                <InfoField label="Party Represented" value={d.partyRepresented} span={12} />
                                <InfoField label="Venue" value={d.venue} span={12} />
                                <InfoField label="Case Number" value={d.caseNumber} />
                                <InfoField label="Present Stage" value={d.presentStage} />
                                <InfoField label="Nature of Case" value={d.caseNature || d.natureOfCase} span={12} />
                                <InfoField label="Court Division" value={d.courtDivision} span={12} />
                                <InfoField label="Court Address" value={d.courtAddress} span={12} />
                                <InfoField label="Court Phone" value={d.courtPhoneNumber} />
                                <InfoField label="Presiding Officer" value={d.presidingOfficer} span={12} />
                            </Grid>
                        </Box>

                        {(d.adverseParty || d.adversePartyAddress) && (
                            <>
                                <Divider />
                                <Box>
                                    <Text size="xs" fw={700} c={PRIMARY_BROWN} tt="uppercase" lts={0.5} mb="xs">Adverse Party</Text>
                                    <Grid gutter="xs">
                                        <InfoField label="Adverse Party" value={d.adverseParty} span={12} />
                                        <InfoField label="Address" value={d.adversePartyAddress} span={12} />
                                        <InfoField label="Counsel" value={d.adversePartyCounsel} span={12} />
                                        <InfoField label="Counsel Address" value={d.adversePartyCounselAddress} span={12} />
                                        <InfoField label="Counsel Phone" value={d.adversePartyCounselPhone} />
                                    </Grid>
                                </Box>
                            </>
                        )}

                        {d.caseDescription && (
                            <>
                                <Divider />
                                <Box>
                                    <Text size="xs" fw={700} c={PRIMARY_BROWN} tt="uppercase" lts={0.5} mb="xs">Case Description</Text>
                                    <Text size="sm" c="#333" style={{ whiteSpace: 'pre-wrap' }}>{d.caseDescription}</Text>
                                </Box>
                            </>
                        )}
                    </Stack>
                </ScrollArea>
            </Paper>
        );
    };

    // Main content wrapped for split layout
    const mainContent = (
        <Box 
            bg={THEMED_LIGHT_BG} 
            mih="100vh" 
            py={{ base: 'sm', sm: 'xl' }}
            style={{
                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"',
            }}
        >
            <Container size="xl" px={{ base: 'xs', sm: 'md' }}>
                {/* Header */}
                <Paper 
                    shadow="xs" 
                    p={{ base: 'sm', sm: 'xl' }} 
                    mb={{ base: 'sm', sm: 'xl' }} 
                    radius="lg"
                    style={{ background: PRIMARY_BROWN, border: 'none' }}
                >
                    <Group gap={{ base: 'xs', sm: 'md' }} align="center" justify="space-between" wrap="nowrap">
                        <Group gap={{ base: 'xs', sm: 'md' }} align="center" wrap="nowrap">
                            <Box
                                style={{ width: 40, height: 40, flexShrink: 0, borderRadius: '12px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <IconFileText size={22} color={PRIMARY_BROWN} stroke={2.5} />
                            </Box>
                            <Title order={3} c="white" style={{ fontSize: 'clamp(14px, 3.5vw, 20px)' }}>
                                Recommendation
                            </Title>
                        </Group>
                        <Button
                            variant="white"
                            leftSection={<IconArrowLeft size={16} />}
                            onClick={() => navigate('/admin/clientformstatus')}
                            size='sm'
                            styles={{
                                root: {
                                    color: PRIMARY_BROWN,
                                    fontWeight: 600,
                                    flexShrink: 0,
                                    '&:hover': {
                                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                    },
                                },
                            }}
                        >
                            <Text visibleFrom="xs">Back to Appointments</Text>
                            <Text hiddenFrom="xs">Back</Text>
                        </Button>
                    </Group>
                </Paper>

                {/* Form Content Wrapper */}
                <Paper shadow="xs" p={{ base: 'sm', sm: 'xl' }} radius="lg" bg="white">
                    <Stack gap={{ base: 'md', sm: 'xl' }}>
                        {/* Review Stage Indicator - Only show when viewing existing review */}
                        {isViewingExistingReview && (
                            <Paper 
                                p="md" 
                                radius="md" 
                                style={{ 
                                    backgroundColor: currentReviewStage === 'supervising_lawyer' 
                                        ? '#FFF4E6' 
                                        : currentReviewStage === 'director' 
                                        ? '#F3E5F5' 
                                        : '#E8F5E9',
                                    border: `2px solid ${
                                        currentReviewStage === 'supervising_lawyer' 
                                            ? '#FF8C42' 
                                            : currentReviewStage === 'director' 
                                            ? '#9C27B0' 
                                            : '#4CAF50'
                                    }`
                                }}
                            >
                                <Group justify="space-between" align="center" wrap="wrap" gap="sm">
                                    <Box>
                                        <Text fw={700} size="sm" c={PRIMARY_BROWN}>
                                            Current Review Stage
                                        </Text>
                                        <Text size="xs" c={MUTED_OLIVE} mt={4}>
                                            {currentReviewStage === 'supervising_lawyer' 
                                                ? 'This submission is pending review by the supervising lawyer'
                                                : currentReviewStage === 'director' 
                                                ? 'This submission has been approved by the supervising lawyer and is pending director review'
                                                : 'This submission has been completed'}
                                        </Text>
                                    </Box>
                                    <Badge 
                                        size="lg" 
                                        variant="filled"
                                        style={{ 
                                            backgroundColor: currentReviewStage === 'supervising_lawyer' 
                                                ? '#FF8C42' 
                                                : currentReviewStage === 'director' 
                                                ? '#9C27B0' 
                                                : '#4CAF50',
                                            color: 'white'
                                        }}
                                    >
                                        {currentReviewStage === 'supervising_lawyer' 
                                            ? 'Supervising Lawyer Review'
                                            : currentReviewStage === 'director' 
                                            ? 'Director Review'
                                            : 'Completed'}
                                    </Badge>
                                </Group>
                            </Paper>
                        )}

                        

                        {/* Stepper Display */}
                        <Stepper 
                            active={active} 
                            color={PRIMARY_BROWN}
                            completedIcon={<IconCircleCheck size={20} />}
                            styles={{
                                stepLabel: { fontWeight: 600, fontSize: '14px' },
                                stepDescription: { fontSize: '12px', color: MUTED_OLIVE },
                            }}
                        >
                            {steps.map((step, index) => (
                                <Stepper.Step key={index} label={step.label} description={step.description} />
                            ))}
                        </Stepper>
                        
                        <Divider />
                        
                        {/* Current Step Content */}
                        {renderStepContent()}

                        <Divider color="#F0F0F0" />
                        
                        {/* Navigation Buttons */}
                        <Group justify="space-between" wrap="wrap" gap="sm">
                            {active > 0 ? (
                                <Button 
                                    variant="outline" 
                                    leftSection={<IconChevronLeft size={18} />}
                                    onClick={prevStep}
                                    size='sm'
                                    styles={{
                                        root: { borderColor: '#E0E0E0', color: MUTED_OLIVE, '&:hover': { backgroundColor: THEMED_LIGHT_BG } },
                                    }}
                                >
                                    Previous
                                </Button>
                            ) : (
                                <Box /> // Empty box to maintain spacing
                            )}
                            
                            <Group gap="sm" wrap="wrap">
                                {/* Step 0: Always show Next Step button */}
                                {active === 0 && (
                                    <Button 
                                        rightSection={<IconChevronRight size={18} />}
                                        onClick={nextStep}
                                        size='sm'
                                        style={{ backgroundColor: PRIMARY_BROWN }}
                                    >
                                        Next Step
                                    </Button>
                                )}
                                
                                {/* Step 1: Show role-based buttons */}
                                {active === 1 && (
                                    <>
                                        {isViewingExistingReview ? (
                                            // Viewing existing review - show different buttons based on role and stage
                                            isIntern ? (
                                                // Intern: Save Changes and Resubmit (if returned)
                                                currentReviewStage === 'returned_to_intern' ? (
                                                    <Group gap="sm" wrap="wrap">
                                                        <Button 
                                                            leftSection={<IconCircleCheck size={18} />}
                                                            onClick={handleSaveChanges}
                                                            size='sm'
                                                            variant="outline"
                                                            style={{ borderColor: PRIMARY_GOLD, color: PRIMARY_BROWN }}
                                                            disabled={saving}
                                                        >
                                                            {saving ? 'Saving...' : 'Save Changes'}
                                                        </Button>
                                                        <Button 
                                                            leftSection={<IconCircleCheck size={18} />}
                                                            onClick={handleResubmitForReview}
                                                            size='sm'
                                                            variant="filled"
                                                            style={{ backgroundColor: PRIMARY_GOLD, color: PRIMARY_BROWN }}
                                                            disabled={saving}
                                                        >
                                                            {saving ? 'Resubmitting...' : 'Resubmit for Review'}
                                                        </Button>
                                                    </Group>
                                                ) : (
                                                    // Other stages: View only, no buttons for interns
                                                    <Text size="sm" c={MUTED_OLIVE} fs="italic">
                                                        View only - Pending review by {currentReviewStage === 'supervising_lawyer' ? 'supervising lawyer' : 'director'}
                                                    </Text>
                                                )
                                            ) : userData?.role === 'supervising_lawyer' ? (
                                                // Supervising Lawyer: Can only act on supervising_lawyer stage
                                                currentReviewStage === 'supervising_lawyer' ? (
                                                    <Group gap="sm" wrap="wrap">
                                                        <Button 
                                                            leftSection={<IconCircleCheck size={18} />}
                                                            onClick={handleSaveChanges}
                                                            size='sm'
                                                            variant="outline"
                                                            style={{ borderColor: PRIMARY_GOLD, color: PRIMARY_BROWN }}
                                                            disabled={saving}
                                                        >
                                                            {saving ? 'Saving...' : 'Save Changes'}
                                                        </Button>
                                                        <Button 
                                                            leftSection={<IconCircleCheck size={18} />}
                                                            onClick={handleApproveToDirector}
                                                            size='sm'
                                                            variant="filled"
                                                            style={{ backgroundColor: '#FF8C42' }}
                                                            disabled={saving}
                                                        >
                                                            {saving ? 'Approving...' : 'Approve to Director'}
                                                        </Button>
                                                        <Button 
                                                            leftSection={<IconCircleCheck size={18} />}
                                                            onClick={handleReturnToIntern}
                                                            size='sm'
                                                            variant="filled"
                                                            style={{ backgroundColor: '#DC2626' }}
                                                            disabled={saving}
                                                        >
                                                            {saving ? 'Returning...' : 'Return to Intern'}
                                                        </Button>
                                                    </Group>
                                                ) : currentReviewStage === 'returned_to_intern' ? (
                                                    // Supervising lawyer viewing returned case - view only (intern/secretary must act)
                                                    <Text size="sm" c={MUTED_OLIVE} fs="italic">
                                                        View only - Returned to intern for revision
                                                    </Text>
                                                ) : (
                                                    // Supervising lawyer viewing director stage - view only
                                                    <Text size="sm" c={MUTED_OLIVE} fs="italic">
                                                        View only - Pending director review
                                                    </Text>
                                                )
                                            ) : userData?.role === 'director' ? (
                                                // Director: Can only act on director stage
                                                currentReviewStage === 'director' ? (
                                                    <Group gap="sm" wrap="wrap">
                                                        <Button 
                                                            leftSection={<IconCircleCheck size={18} />}
                                                            onClick={handleSaveChanges}
                                                            size='sm'
                                                            variant="outline"
                                                            style={{ borderColor: PRIMARY_GOLD, color: PRIMARY_BROWN }}
                                                            disabled={saving || actionInfo.decision !== 'pending'}
                                                        >
                                                            {saving ? 'Saving...' : 'Save Changes'}
                                                        </Button>
                                                        <Button 
                                                            leftSection={<IconCircleCheck size={18} />}
                                                            onClick={handleSubmit}
                                                            size='sm'
                                                            variant="filled"
                                                            style={{ backgroundColor: PRIMARY_BROWN }}
                                                            disabled={saving || (actionInfo.decision !== 'accepted' && actionInfo.decision !== 'rejected')}
                                                        >
                                                            {saving ? 'Finalizing...' : 'Finalize Record'}
                                                        </Button>
                                                        <Button 
                                                            leftSection={<IconCircleCheck size={18} />}
                                                            onClick={handleReturnToSupervisingLawyer}
                                                            size='sm'
                                                            variant="filled"
                                                            style={{ backgroundColor: '#DC2626' }}
                                                            disabled={saving || !!actionInfo.decision}
                                                        >
                                                            {saving ? 'Returning...' : 'Return to Supervising Lawyer'}
                                                        </Button>
                                                    </Group>
                                                ) : currentReviewStage === 'returned_to_intern' ? (
                                                    // Director viewing returned case - view only (intern/secretary must act)
                                                    <Text size="sm" c={MUTED_OLIVE} fs="italic">
                                                        View only - Returned to intern for revision
                                                    </Text>
                                                ) : (
                                                    // Director viewing supervising lawyer stage - view only
                                                    <Text size="sm" c={MUTED_OLIVE} fs="italic">
                                                        View only - Pending supervising lawyer review
                                                    </Text>
                                                )
                                            ) : (
                                                // Fallback: Attorney with completed or unknown stage
                                                <Group gap="sm" wrap="wrap">
                                                    <Button 
                                                        leftSection={<IconCircleCheck size={18} />}
                                                        onClick={handleSaveChanges}
                                                        size='sm'
                                                        variant="outline"
                                                        style={{ borderColor: PRIMARY_GOLD, color: PRIMARY_BROWN }}
                                                        disabled={saving}
                                                    >
                                                        {saving ? 'Saving...' : 'Save Changes'}
                                                    </Button>
                                                    <Button 
                                                        leftSection={<IconCircleCheck size={18} />}
                                                        onClick={handleSubmit}
                                                        size='sm'
                                                        variant="filled"
                                                        style={{ backgroundColor: PRIMARY_BROWN }}
                                                        disabled={saving}
                                                    >
                                                        {saving ? 'Finalizing...' : 'Finalize Record'}
                                                    </Button>
                                                </Group>
                                            )
                                        ) : isIntern ? (
                                            // Intern creating new review: Only Submit for Review button
                                            <Button 
                                                leftSection={<IconCircleCheck size={18} />}
                                                onClick={() => {
                                                    window.__internFinalizeClicked = false;
                                                    handleSubmit();
                                                }}
                                                size='sm'
                                                variant="filled"
                                                style={{ backgroundColor: PRIMARY_GOLD, color: PRIMARY_BROWN }}
                                                disabled={saving}
                                            >
                                                {saving ? 'Saving...' : 'Submit for Review'}
                                            </Button>
                                        ) : (
                                            // Attorney creating new: Finalize Record button only
                                            <Button 
                                                leftSection={<IconCircleCheck size={18} />}
                                                onClick={handleSubmit}
                                                size='sm'
                                                style={{ backgroundColor: PRIMARY_BROWN }}
                                                disabled={saving}
                                            >
                                                {saving ? 'Saving...' : 'Finalize Record'}
                                            </Button>
                                        )}
                                    </>
                                )}
                            </Group>
                        </Group>
                    </Stack>
                </Paper>
            </Container>
        </Box>
    );

    return (
        <>
            {showClientInfoPanel ? (
                <Box bg={THEMED_LIGHT_BG} mih="100vh" py={{ base: 'sm', sm: 'xl' }} px={{ base: 'xs', sm: 'md' }}>
                    <Grid gutter={{ base: 'md', sm: 'xl' }}>
                        <Grid.Col span={{ base: 12, lg: 8 }}>
                            {mainContent}
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, lg: 4 }}>
                            <ClientInfoSidePanel />
                        </Grid.Col>
                    </Grid>
                </Box>
            ) : (
                mainContent
            )}
            
            {/* Document Viewer Modal */}
            <Modal
                opened={viewerModalOpened}
                onClose={() => {
                    setViewerModalOpened(false);
                    if (currentViewingDoc?.fileData && !currentViewingDoc.fileData.startsWith('data:')) {
                        URL.revokeObjectURL(currentViewingDoc.fileData);
                    }
                    setCurrentViewingDoc(null);
                    setWordDocHtml(null);
                    setWordDocLoading(false);
                }}
                title={
                    <Group>
                        <IconFileText size={24} color={PRIMARY_BROWN} />
                        <Text fw={600} c={PRIMARY_BROWN}>Document Viewer</Text>
                    </Group>
                }
                size="calc(95vw)"
                fullScreen
                styles={{
                    body: { minHeight: '85vh', height: 'calc(100vh - 120px)' },
                    content: { height: '95vh' }
                }}
            >
                {currentViewingDoc && (
                    <Stack gap="md" style={{ height: '100%' }}>
                        <Paper p="sm" radius="md" style={{ backgroundColor: THEMED_LIGHT_BG }}>
                            <Group justify="space-between">
                                <Box>
                                    <Text size="sm" fw={600}>{currentViewingDoc.fileName}</Text>
                                    <Text size="xs" c="dimmed">
                                        {currentViewingDoc.fileType}
                                    </Text>
                                </Box>
                                <Button
                                    size="sm"
                                    leftSection={<IconDownload size={16} />}
                                    onClick={() => handleDownloadDocument(null, currentViewingDoc)}
                                    style={{ backgroundColor: PRIMARY_BROWN }}
                                >
                                    Download
                                </Button>
                            </Group>
                        </Paper>
                        
                        <Paper p="md" radius="md" style={{ flex: 1, minHeight: '75vh', backgroundColor: '#f5f5f5', display: 'flex', flexDirection: 'column' }}>
                            {currentViewingDoc.fileType?.includes('pdf') || currentViewingDoc.fileName?.endsWith('.pdf') ? (
                                // PDF - use PdfViewer for reliable in-app rendering
                                <PdfViewer url={currentViewingDoc.fileUrl ? getServerFileUrl(currentViewingDoc.fileUrl) : null} fileData={currentViewingDoc.fileData} cloudinaryUrl={currentViewingDoc.cloudinaryUrl || currentViewingDoc.serverFile?.cloudinaryUrl} />
                            ) : (currentViewingDoc.fileType?.includes('word') || currentViewingDoc.fileName?.endsWith('.docx') || currentViewingDoc.fileName?.endsWith('.doc')) ? (
                                // Word Document - Render using mammoth.js
                                <Box style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                    {wordDocLoading ? (
                                        <Box style={{ textAlign: 'center', padding: '40px' }}>
                                            <IconFileText size={64} color={PRIMARY_BROWN} />
                                            <Text size="xl" fw={700} mt="md" c={PRIMARY_BROWN}>
                                                Loading Word Document...
                                            </Text>
                                        </Box>
                                    ) : wordDocHtml ? (
                                        <ScrollArea style={{ flex: 1, height: '100%' }}>
                                            <style>{`
                                                .word-pages-container {
                                                    padding: 20px 0;
                                                    display: flex;
                                                    flex-direction: column;
                                                    align-items: center;
                                                    gap: 24px;
                                                }
                                                .word-pages-container .word-page {
                                                    position: relative;
                                                    background: white;
                                                    width: 100%;
                                                    max-width: 794px; /* A4 width at 96dpi */
                                                    min-height: 1123px; /* A4 height at 96dpi */
                                                    padding: 60px 60px 80px 60px;
                                                    box-shadow: 0 2px 8px rgba(0,0,0,0.15), 0 0 1px rgba(0,0,0,0.1);
                                                    border-radius: 2px;
                                                    box-sizing: border-box;
                                                    overflow-wrap: break-word;
                                                    word-wrap: break-word;
                                                }
                                                .word-pages-container .word-page-number {
                                                    position: absolute;
                                                    bottom: 24px;
                                                    left: 0;
                                                    right: 0;
                                                    text-align: center;
                                                    font-size: 11px;
                                                    color: #999;
                                                    font-family: Arial, sans-serif;
                                                }
                                                .word-pages-container .word-page p {
                                                    margin: 0 0 10px 0;
                                                    line-height: 1.5;
                                                }
                                                .word-pages-container .word-page table {
                                                    border-collapse: collapse;
                                                    width: 100%;
                                                    margin: 10px 0;
                                                }
                                                .word-pages-container .word-page table td,
                                                .word-pages-container .word-page table th {
                                                    border: 1px solid #ccc;
                                                    padding: 6px 8px;
                                                }
                                                .word-pages-container .word-page img {
                                                    max-width: 100%;
                                                    height: auto;
                                                }
                                                @media (max-width: 850px) {
                                                    .word-pages-container .word-page {
                                                        padding: 30px 24px 60px 24px;
                                                        min-height: auto;
                                                    }
                                                }
                                            `}</style>
                                            <Box 
                                                className="word-pages-container"
                                                dangerouslySetInnerHTML={{ __html: wordDocHtml }}
                                            />
                                        </ScrollArea>
                                    ) : (
                                        <Box style={{ textAlign: 'center', padding: '40px' }}>
                                            <IconFileText size={64} color={PRIMARY_BROWN} />
                                            <Text size="xl" fw={700} mt="md" c={PRIMARY_BROWN}>
                                                Word Document
                                            </Text>
                                            <Text size="sm" c="dimmed" mt="xs" mb="md">
                                                {currentViewingDoc.fileName}
                                            </Text>
                                            <Alert color="yellow" title="Preview not available" mb="xl" style={{ maxWidth: 600, margin: '0 auto 2rem' }}>
                                                <Text size="sm">
                                                    Unable to preview this document. Please download it to view.
                                                </Text>
                                            </Alert>
                                            <Group justify="center" gap="md">
                                                <Button
                                                    size="lg"
                                                    leftSection={<IconDownload size={20} />}
                                                    onClick={() => handleDownloadDocument(null, currentViewingDoc)}
                                                    style={{ backgroundColor: PRIMARY_BROWN }}
                                                >
                                                    Download to View/Edit
                                                </Button>
                                            </Group>
                                        </Box>
                                    )}
                                </Box>
                            ) : (
                                // Generic file viewer with download option
                                <Box style={{ textAlign: 'center', padding: '40px' }}>
                                    <IconFileText size={48} color={PRIMARY_BROWN} />
                                    <Text size="lg" fw={600} mt="md" c={PRIMARY_BROWN}>
                                        Document Preview
                                    </Text>
                                    <Text size="sm" c="dimmed" mt="xs" mb="xl">
                                        This file type cannot be previewed in the browser. Please download to view.
                                    </Text>
                                    <Button
                                        size="lg"
                                        leftSection={<IconDownload size={20} />}
                                        onClick={() => handleDownloadDocument(null, currentViewingDoc)}
                                        style={{ backgroundColor: PRIMARY_BROWN }}
                                    >
                                        Download File
                                    </Button>
                                </Box>
                            )}
                        </Paper>
                    </Stack>
                )}
            </Modal>
        </>
    );
}
