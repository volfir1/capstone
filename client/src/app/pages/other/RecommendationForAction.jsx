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
    Badge
} from '@mantine/core';
import { IconChevronRight, IconChevronLeft, IconCircleCheck, IconFileText, IconArrowLeft } from '@tabler/icons-react'; // Added icons
import { useAuth } from '@/context/authContext';
import { useLocation, useParams, useSearchParams, useNavigate } from 'react-router-dom';

// --- Consolidated Constants ---
const PRIMARY_GOLD = '#FFD700';
const PRIMARY_BROWN = '#5C4033';
const THEMED_LIGHT_BG = '#F7F7F7';
const MUTED_OLIVE = '#8A8A5C'; // Re-added for button styling
// --- End of Consolidated Constants ---


// Helper component for Evidence Tables (Memoized)
const EvidenceTable = React.memo(({ title, value = [], onChange = () => {} }) => {
    const updateRow = (index, field, newValue) => {
        const updated = [...value];
        if (!updated[index]) {
            updated[index] = { type: '', author: '', purpose: '', issues: '' };
        }
        updated[index] = { ...updated[index], [field]: newValue };
        onChange(updated);
    };

    // Ensure we have at least 3 rows
    const rows = value.length >= 3 ? value : [...value, ...Array(3 - value.length).fill({ type: '', author: '', purpose: '', issues: '' })];

    return (
        <Stack gap="sm">
            <Title order={4} c={PRIMARY_BROWN}>{title}</Title>
            <Table withRowBorders withColumnBorders withTableBorder striped>
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th style={{ width: '30%' }}>Type / Description</Table.Th>
                        <Table.Th style={{ width: '25%' }}>Author / Custodian</Table.Th>
                        <Table.Th style={{ width: '25%' }}>Purpose</Table.Th>
                        <Table.Th style={{ width: '20%' }}>Admissibility Issues</Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                    {rows.slice(0, 3).map((row, index) => (
                        <Table.Tr key={index}>
                            <Table.Td>
                                <TextInput 
                                    placeholder="Type/Desc" 
                                    size="xs" 
                                    variant="unstyled"
                                    value={row.type || ''}
                                    onChange={(e) => updateRow(index, 'type', e.target.value)}
                                />
                            </Table.Td>
                            <Table.Td>
                                <TextInput 
                                    placeholder="Author/Custodian" 
                                    size="xs" 
                                    variant="unstyled"
                                    value={row.author || ''}
                                    onChange={(e) => updateRow(index, 'author', e.target.value)}
                                />
                            </Table.Td>
                            <Table.Td>
                                <TextInput 
                                    placeholder="Purpose" 
                                    size="xs" 
                                    variant="unstyled"
                                    value={row.purpose || ''}
                                    onChange={(e) => updateRow(index, 'purpose', e.target.value)}
                                />
                            </Table.Td>
                            <Table.Td>
                                <TextInput 
                                    placeholder="Issues" 
                                    size="xs" 
                                    variant="unstyled"
                                    value={row.issues || ''}
                                    onChange={(e) => updateRow(index, 'issues', e.target.value)}
                                />
                            </Table.Td>
                        </Table.Tr>
                    ))}
                </Table.Tbody>
            </Table>
        </Stack>
    );
});
EvidenceTable.displayName = 'EvidenceTable';

// ====================================================================================
// 2. Client Interview and Evidence Section (Based on image_588eb7.png)
// ====================================================================================
export const ClientInterviewSection = React.memo(({ value = {}, onChange = () => {} }) => (
    <Paper shadow="md" p="xl" radius="lg" bg="white">
        <Stack gap="xl">
            <Title order={2} c={PRIMARY_BROWN} style={{ textAlign: 'center' }}>Client Interview and Evidence Record</Title>
            
            <Divider />
            
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                <TextInput label="Date of Interview" type="date" 
                    value={value.dateOfInterview || ''} onChange={(e) => onChange({ ...value, dateOfInterview: e.target.value })} />
                <TextInput label="Date Submitted" type="date"
                    value={value.dateSubmitted || ''} onChange={(e) => onChange({ ...value, dateSubmitted: e.target.value })} />
                <TextInput label="Client's Name" placeholder="Full Name"
                    value={value.clientName || ''} onChange={(e) => onChange({ ...value, clientName: e.target.value })} />
                <TextInput label="Interviewing Intern/s Duty Day" placeholder="Intern Name/s and Duty Day"
                    value={value.interviewingInterns || ''} 
                    onChange={(e) => onChange({ ...value, interviewingInterns: e.target.value })} 
                    readOnly
                    styles={{
                        input: {
                            backgroundColor: '#F5F5F5',
                            cursor: 'not-allowed'
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
            />

            <Divider />

            <EvidenceTable 
                title="Evidence on Hand / Available for the Client(s)" 
                value={value.clientEvidence || []}
                onChange={(evidence) => onChange({ ...value, clientEvidence: evidence })}
            />

            <Divider />
            
            <EvidenceTable 
                title="Evidence on Hand / Available for the Adverse Party(ies)" 
                value={value.adversePartyEvidence || []}
                onChange={(evidence) => onChange({ ...value, adversePartyEvidence: evidence })}
            />
            
            <Divider />
            
            <Title order={4} c={PRIMARY_BROWN}>Interviewing Intern's Initial Advice to the Client(s)</Title>
            <Textarea 
                placeholder="Brief summary of the initial legal advice given to the client."
                autosize
                minRows={3}
                value={value.internAdvice || ''} onChange={(e) => onChange({ ...value, internAdvice: e.target.value })}
            />
            <Group justify="flex-end">
                <Checkbox label="For legal advice only" 
                    checked={!!value.forLegalAdvice} onChange={(e) => onChange({ ...value, forLegalAdvice: e.currentTarget.checked })} />
            </Group>

            <Divider />

            <Title order={4} c={PRIMARY_BROWN}>Legal Opinion</Title>
            <Textarea 
                placeholder="The intern's assessment of the case's merits and possible legal strategy."
                autosize 
                minRows={5}
                value={value.legalOpinion || ''} onChange={(e) => onChange({ ...value, legalOpinion: e.target.value })}
            />
        </Stack>
    </Paper>
));
ClientInterviewSection.displayName = 'ClientInterviewSection';


// ====================================================================================
// 3. Supervising Lawyer's Comment & Director's Action (Based on image_588e92.png)
// ====================================================================================
export const SupervisingLawyerActionSection = React.memo(({ value = {}, onChange = () => {}, forLegalAdvice = false, userRole = '', userData = null }) => {
    // Auto-populate fields based on role
    React.useEffect(() => {
        const currentUserName = userData?.firstName && userData?.lastName 
            ? `${userData.firstName} ${userData.lastName}` 
            : userData?.username || userData?.displayName || 'Unknown User';
        
        const today = new Date();
        const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        
        if (userRole === 'intern' && userData) {
            // For interns: Set assignedTo and date if not already set
            if (!value.assignedTo) {
                onChange({ ...value, assignedTo: currentUserName, signatureDate: formattedDate });
            } else if (!value.signatureDate) {
                onChange({ ...value, signatureDate: formattedDate });
            }
        } else if (userRole === 'supervising_lawyer' && userData) {
            // For supervising lawyers: Set supervisingLawyer name if not already set
            if (!value.supervisingLawyer) {
                onChange({ ...value, supervisingLawyer: currentUserName });
            }
        }
    }, [userRole, userData]);

    return (
        <Paper shadow="md" p="xl" radius="lg" bg="white">
            <Stack gap="xl">
                <Title order={2} c={PRIMARY_BROWN} style={{ textAlign: 'center' }}>Supervising Lawyer & Director Action</Title>

                <Divider />
                
                <Title order={3} c={PRIMARY_BROWN}>Supervising Lawyer's Comment</Title>
                <Textarea 
                    placeholder="Comments, corrections, or additional instructions from the Supervising Lawyer." 
                    autosize 
                    minRows={4}
                    value={value.supervisingComment || ''}
                    onChange={(e) => onChange({ ...value, supervisingComment: e.target.value })}
                    disabled={userRole === 'intern'}
                    styles={{
                        input: {
                            backgroundColor: userRole === 'intern' ? '#F5F5F5' : 'white',
                            cursor: userRole === 'intern' ? 'not-allowed' : 'text',
                        },
                    }}
                />

            <Divider />

            {/* Director's Action - Always visible, disabled for interns */}
            <Title order={3} c={PRIMARY_BROWN}>Director's Action</Title>
            <Radio.Group 
                label="Decision" 
                value={value.decision || ''} 
                onChange={(val) => onChange({ ...value, decision: val })}
                disabled={userRole === 'intern'}
            >
                <Group>
                    <Radio value="accepted" label="Accepted" />
                    <Radio value="rejected" label="Rejected" />
                    <Radio value="pending" label="Pending" />
                </Group>
            </Radio.Group>
            
            <Textarea 
                label="If accepted/pending, instruction(s); if rejected, reason(s):" 
                placeholder="Specific instructions or reason for rejection"
                autosize 
                minRows={4}
                value={value.decisionNote || ''}
                onChange={(e) => onChange({ ...value, decisionNote: e.target.value })}
                disabled={userRole === 'intern'}
            />

            <Divider />

            <Divider />

            <Title order={3} c={PRIMARY_BROWN}>Assignment & Signatures</Title>
            <Grid gutter="xl">
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Textarea 
                        label="Assigned to: Law Interns" 
                        placeholder="List of interns assigned to the case" 
                        autosize 
                        minRows={3}
                        value={value.assignedTo || ''}
                        onChange={(e) => onChange({ ...value, assignedTo: e.target.value })}
                        disabled={userRole === 'intern' || userRole === 'supervising_lawyer'}
                        styles={{
                            input: {
                                backgroundColor: (userRole === 'intern' || userRole === 'supervising_lawyer') ? '#F5F5F5' : 'white',
                                cursor: (userRole === 'intern' || userRole === 'supervising_lawyer') ? 'not-allowed' : 'text',
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
                            disabled={userRole === 'intern' || userRole === 'supervising_lawyer'}
                            styles={{
                                input: {
                                    backgroundColor: (userRole === 'intern' || userRole === 'supervising_lawyer') ? '#F5F5F5' : 'white',
                                    cursor: (userRole === 'intern' || userRole === 'supervising_lawyer') ? 'not-allowed' : 'text',
                                },
                            }}
                        />
                        <TextInput 
                            label="Director's Signature" 
                            placeholder="Signature/Name of Director" 
                            value={value.directorSignature || ''}
                            onChange={(e) => onChange({ ...value, directorSignature: e.target.value })}
                            disabled={userRole === 'intern' || userRole === 'supervising_lawyer'}
                            styles={{
                                input: {
                                    backgroundColor: (userRole === 'intern' || userRole === 'supervising_lawyer') ? '#F5F5F5' : 'white',
                                    cursor: (userRole === 'intern' || userRole === 'supervising_lawyer') ? 'not-allowed' : 'text',
                                },
                            }}
                        />
                        <TextInput 
                            label="Date" 
                            type="date" 
                            value={value.signatureDate || ''}
                            onChange={(e) => onChange({ ...value, signatureDate: e.target.value })}
                            disabled={userRole === 'intern' || userRole === 'supervising_lawyer'}
                            styles={{
                                input: {
                                    backgroundColor: (userRole === 'intern' || userRole === 'supervising_lawyer') ? '#F5F5F5' : 'white',
                                    cursor: (userRole === 'intern' || userRole === 'supervising_lawyer') ? 'not-allowed' : 'text',
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
    const isIntern = userData?.role === 'intern';
    const [reviews, setReviews] = useState([])
    const [saving, setSaving] = useState(false)
    const [isFromDashboard, setIsFromDashboard] = useState(false)
    const [isViewingExistingReview, setIsViewingExistingReview] = useState(false)
    const [reviewId, setReviewId] = useState(null)
    const [currentReviewStage, setCurrentReviewStage] = useState('supervising_lawyer') // Track current stage

    // controlled state for interview + action
    const [interviewInfo, setInterviewInfo] = useState({});
    const [actionInfo, setActionInfo] = useState({});
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const { caseId: caseIdParam } = useParams();
    const navigate = useNavigate();

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
        
        if (review && review.content) {
            // Mark that this is opened from dashboard (has review in location state)
            setIsFromDashboard(true);
            setIsViewingExistingReview(isViewingFlag || false);
            setReviewId(review._id || review.id || null);
            setCurrentReviewStage(review.reviewStage || 'supervising_lawyer'); // Load the current stage
            
            // Load review data from location.state
            const ii = review.content.interviewInfo || review.interviewInfo || {};
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
        } else {
            // If no review in location state, it's opened from sidebar - reset to clean state
            setIsFromDashboard(false);
            setIsViewingExistingReview(false);
            setReviewId(null);
            setCurrentReviewStage('supervising_lawyer');
            setInterviewInfo({});
            setActionInfo({});
        }
    }, [location]);

    // Auto-fill client information when opening from appointment status
    useEffect(() => {
        const fetchClientInfo = async () => {
            const caseId = getCaseId();
            
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
                    
                    // Get current user's full name (only for interns creating new reviews)
                    const currentUserName = userData?.firstName && userData?.lastName 
                        ? `${userData.firstName} ${userData.lastName}` 
                        : userData?.username || 'Unknown User';
                    
                    // Set interview info with client data
                    // Only set interviewingInterns if this is a new review being created by an intern
                    const newInterviewInfo = {
                        ...prev,
                        clientName: clientData.fullName || clientData.name || '',
                        dateOfInterview: formatDate(clientData.appointedDate || clientData.createdAt),
                        dateSubmitted: currentDate,
                    };
                    
                    // Only add interviewingInterns if not already set (preserves original intern's name)
                    if (!prev.interviewingInterns) {
                        newInterviewInfo.interviewingInterns = currentUserName;
                    }
                    
                    setInterviewInfo(newInterviewInfo);
                } catch (error) {
                    console.error('Error fetching client info for auto-fill:', error);
                }
            }
        };

        fetchClientInfo();
    }, [getCaseId, isViewingExistingReview, interviewInfo.clientName]);

    const nextStep = () => setActive((current) => (current < totalSteps - 1 ? current + 1 : current));
    const prevStep = () => setActive((current) => (current > 0 ? current - 1 : current));
    
    const handleSubmit = async () => {
        const caseId = getCaseId();
        
        // Filter out completely empty evidence rows before saving
        const filterEmptyEvidence = (evidenceArray) => {
            if (!evidenceArray || !Array.isArray(evidenceArray)) return [];
            return evidenceArray.filter(row => 
                row && (row.type || row.author || row.purpose || row.issues)
            );
        };
        
        // Ensure all interview data is included
        const completeInterviewInfo = {
            ...interviewInfo,
            // Filter out empty evidence rows
            clientEvidence: filterEmptyEvidence(interviewInfo.clientEvidence),
            adversePartyEvidence: filterEmptyEvidence(interviewInfo.adversePartyEvidence),
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
                const { default: apiClient } = await import('@config/api/apiClient');
                const resp = await apiClient.put(`/clientsinfo/${caseId}`, { status });
                if (resp?.status >= 200 && resp.status < 300) return true;
                console.error('Primary status update failed', resp?.status, resp?.data);
            } catch (err) {
                console.error('Primary status update error', err);
            }

            try {
                const fallback = await fetch(`/api/clientsinfo/${caseId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status }),
                });
                if (fallback.ok) return true;
                const text = await fallback.text();
                console.error('Fallback status update failed', fallback.status, text);
            } catch (fallbackErr) {
                console.error('Fallback status update error', fallbackErr);
            }

            return false;
        };

        try {
            setSaving(true);
            
            // Intern behavior on Step 1 - check which button was clicked via a flag
            // This will be set by the button click handler
            const isInternFinalize = window.__internFinalizeClicked;
            delete window.__internFinalizeClicked; // Clean up flag
            
            if (userData?.role === 'intern' && active === totalSteps - 1) {
                if (isInternFinalize && interviewInfo.forLegalAdvice === true) {
                    // Intern finalizing a legal advice case
                    const statusOk = await updateCaseStatus('legal-advice');
                    if (!statusOk) {
                        alert('Failed to update case status. Please try again.');
                        setSaving(false);
                        return;
                    }

                    console.log('Status updated to legal-advice for intern finalize');
                    alert('Legal advice case finalized successfully!');
                    
                    // Redirect to Client Form Status
                    navigate('/admin/clientformstatus');
                    return;
                } else {
                    // Intern submitting for review (or finalizing non-legal-advice)
                    const statusOk = await updateCaseStatus('confirmed');
                    if (!statusOk) {
                        alert('Failed to update case status. Please try again.');
                        setSaving(false);
                        return;
                    }

                    console.log('Status updated to confirmed for intern review');
                }
            }
            
            // If attorney/secretary finalizes record on last step, create a finalized record
            if ((userData?.role === 'attorney' || userData?.role === 'secretary' || userData?.role === 'pao_lawyer' || userData?.role === 'legal_volunteer') && active === totalSteps - 1) {
                // Determine final status based on forLegalAdvice checkbox and decision
                const finalDecision = actionInfo.decision || 'accepted'; // default to accepted when attorney finalizes
                let finalStatus = 'confirmed';

                if (interviewInfo.forLegalAdvice === true) {
                    finalStatus = 'legal-advice';
                } else if (finalDecision === 'rejected') {
                    finalStatus = 'rejected';
                } else if (finalDecision === 'accepted' || finalDecision === 'pending') {
                    finalStatus = 'court-case';
                }

                const statusOk = await updateCaseStatus(finalStatus);
                if (!statusOk) {
                    alert('Failed to update case status. Finalization halted. Please try again.');
                    setSaving(false);
                    return;
                }

                console.log('Final status updated to:', finalStatus);
                
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
                const resFinalize = await fetch('/api/finalize', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(finalizePayload)
                })
                const finalizeText = await resFinalize.text()
                if (!resFinalize.ok) {
                    console.error('POST /api/finalize failed', resFinalize.status, finalizeText)
                    throw new Error(`Finalize save failed: ${resFinalize.status} ${finalizeText}`)
                }
                const savedFinalize = finalizeText ? JSON.parse(finalizeText) : null
                console.log('Saved finalize', savedFinalize)
                
                // Delete the review record from reviews collection after finalizing
                try {
                    const deleteRes = await fetch(`/api/reviews/case/${caseId}`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' }
                    })
                    if (deleteRes.ok) {
                        console.log('Review deleted successfully after finalization')
                    } else {
                        console.error('Failed to delete review after finalization', deleteRes.status)
                    }
                } catch (deleteErr) {
                    console.error('Error deleting review:', deleteErr)
                    // Don't throw here, finalization was successful
                }
                
                alert('Case finalized and saved successfully!')
                await fetchReviews(caseId)
                
                // Redirect to dashboard
                navigate('/admin');
                return
            }

            const resReview = await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reviewPayload)
            });
            const reviewText = await resReview.text();
            if (!resReview.ok) {
                console.error('POST /api/reviews failed', resReview.status, reviewText);
                throw new Error(`Review save failed: ${resReview.status} ${reviewText}`);
            }
            const saved = reviewText ? JSON.parse(reviewText) : null;
            console.log('Successfully saved review:', saved);
            await fetchReviews(caseId);

            alert('Interview and evidence data saved successfully!');
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
            
            navigate(getDashboardPath());
        } catch (err) {
            console.error('handleSubmit error:', err);
            alert(`Failed to save data: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    const fetchReviews = async (caseIdParam) => {
        const caseId = caseIdParam || getCaseId();
        try {
            const res = await fetch(`/api/reviews/${caseId}`)
            if (!res.ok) {
                // If no reviews found, that's okay - it's a new case
                if (res.status === 404) {
                    console.log('No existing reviews found for case:', caseId);
                    return;
                }
                throw new Error('Failed to fetch reviews')
            }
            const data = await res.json()
            setReviews(data)
            // Only load data if opened from dashboard and data exists
            // (Data from location.state is already loaded in the location useEffect)
            // Don't auto-load data when opened from sidebar - keep it clean
        } catch (err) {
            console.error('fetchReviews error', err)
        }
    }

    const handleSaveChanges = async () => {
        if (!reviewId) {
            alert('No review ID found');
            return;
        }

        // Filter out completely empty evidence rows before saving
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
        };

        const updatePayload = {
            content: { 
                interviewInfo: completeInterviewInfo,
                actionInfo 
            }
        };

        try {
            setSaving(true);
            const response = await fetch(`/api/reviews/${reviewId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatePayload)
            });

            if (!response.ok) {
                throw new Error(`Update failed: ${response.status}`);
            }

            const updated = await response.json();
            console.log('Successfully updated review:', updated);
            alert('Changes saved successfully!');
        } catch (err) {
            console.error('handleSaveChanges error:', err);
            alert(`Failed to save changes: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    // Handler for intern to resubmit review after making revisions
    const handleResubmitForReview = async () => {
        if (!reviewId) {
            alert('No review ID found');
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
            const response = await fetch(`/api/reviews/${reviewId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatePayload)
            });

            if (!response.ok) {
                throw new Error(`Update failed: ${response.status}`);
            }

            const updated = await response.json();
            console.log('Successfully resubmitted review:', updated);
            alert('Review resubmitted successfully!');
            
            // Redirect to dashboard
            navigate('/admin');
        } catch (err) {
            console.error('handleResubmitForReview error:', err);
            alert(`Failed to resubmit review: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    // Handler for supervising lawyer to return review to intern
    const handleReturnToIntern = async () => {
        if (!reviewId) {
            alert('No review ID found');
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
            const response = await fetch(`/api/reviews/${reviewId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatePayload)
            });

            if (!response.ok) {
                throw new Error(`Update failed: ${response.status}`);
            }

            const updated = await response.json();
            console.log('Successfully returned to intern:', updated);
            alert('Review returned to intern successfully!');
            
            // Redirect to dashboard
            navigate('/admin');
        } catch (err) {
            console.error('handleReturnToIntern error:', err);
            alert(`Failed to return review: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    // Handler for director to return review to supervising lawyer
    const handleReturnToSupervisingLawyer = async () => {
        if (!reviewId) {
            alert('No review ID found');
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
            const response = await fetch(`/api/reviews/${reviewId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatePayload)
            });

            if (!response.ok) {
                throw new Error(`Update failed: ${response.status}`);
            }

            const updated = await response.json();
            console.log('Successfully returned to supervising lawyer:', updated);
            alert('Review returned to supervising lawyer successfully!');
            
            // Redirect to dashboard
            navigate('/admin');
        } catch (err) {
            console.error('handleReturnToSupervisingLawyer error:', err);
            alert(`Failed to return review: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    // Handler for supervising lawyer to approve and send to director
    const handleApproveToDirector = async () => {
        if (!reviewId) {
            alert('No review ID found');
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
            const response = await fetch(`/api/reviews/${reviewId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatePayload)
            });

            if (!response.ok) {
                throw new Error(`Update failed: ${response.status}`);
            }

            const updated = await response.json();
            console.log('Successfully moved to director review:', updated);
            alert('Review approved and sent to director successfully!');
            
            // Redirect to dashboard
            navigate('/admin');
        } catch (err) {
            console.error('handleApproveToDirector error:', err);
            alert(`Failed to approve review: ${err.message}`);
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
                return <ClientInterviewSection value={interviewInfo} onChange={setInterviewInfo} />;
            case 1:
                return (
                    <SupervisingLawyerActionSection 
                        value={actionInfo} 
                        onChange={setActionInfo} 
                        forLegalAdvice={interviewInfo.forLegalAdvice}
                        userRole={userData?.role}
                        userData={userData}
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
                {/* Header */}
                <Paper 
                    shadow="xs" 
                    p="xl" 
                    mb="xl" 
                    radius="lg"
                    style={{ background: PRIMARY_BROWN, border: 'none' }}
                >
                    <Group gap="md" align="center" justify="space-between">
                        <Group gap="md" align="center">
                            <Box
                                style={{ width: 48, height: 48, borderRadius: '12px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <IconFileText size={24} color={PRIMARY_BROWN} stroke={2.5} />
                            </Box>
                            <Title order={2} c="white">
                                Case Documentation Process
                            </Title>
                        </Group>
                        <Button
                            variant="white"
                            leftSection={<IconArrowLeft size={18} />}
                            onClick={() => navigate('/admin/clientformstatus')}
                            size="md"
                            styles={{
                                root: {
                                    color: PRIMARY_BROWN,
                                    fontWeight: 600,
                                    '&:hover': {
                                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                    },
                                },
                            }}
                        >
                            Back to Appointments
                        </Button>
                    </Group>
                </Paper>

                {/* Form Content Wrapper */}
                <Paper shadow="xs" p="xl" radius="lg" bg="white">
                    <Stack gap="xl">
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
                                <Group justify="space-between" align="center">
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
                        <Group justify="space-between">
                            {active > 0 ? (
                                <Button 
                                    variant="outline" 
                                    leftSection={<IconChevronLeft size={20} />}
                                    onClick={prevStep}
                                    size="md"
                                    styles={{
                                        root: { borderColor: '#E0E0E0', color: MUTED_OLIVE, '&:hover': { backgroundColor: THEMED_LIGHT_BG } },
                                    }}
                                >
                                    Previous
                                </Button>
                            ) : (
                                <Box /> // Empty box to maintain spacing
                            )}
                            
                            <Group gap="md">
                                {/* Step 0: Always show Next Step button */}
                                {active === 0 && (
                                    <Button 
                                        rightSection={<IconChevronRight size={20} />}
                                        onClick={nextStep}
                                        size="md"
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
                                                    <Group gap="md">
                                                        <Button 
                                                            leftSection={<IconCircleCheck size={20} />}
                                                            onClick={handleSaveChanges}
                                                            size="md"
                                                            variant="outline"
                                                            style={{ borderColor: PRIMARY_GOLD, color: PRIMARY_BROWN }}
                                                            disabled={saving}
                                                        >
                                                            {saving ? 'Saving...' : 'Save Changes'}
                                                        </Button>
                                                        <Button 
                                                            leftSection={<IconCircleCheck size={20} />}
                                                            onClick={handleResubmitForReview}
                                                            size="md"
                                                            variant="filled"
                                                            style={{ backgroundColor: PRIMARY_GOLD, color: PRIMARY_BROWN }}
                                                            disabled={saving}
                                                        >
                                                            {saving ? 'Resubmitting...' : 'Resubmit for Review'}
                                                        </Button>
                                                    </Group>
                                                ) : (
                                                    // Other stages: Only Save Changes
                                                    <Button 
                                                        leftSection={<IconCircleCheck size={20} />}
                                                        onClick={handleSaveChanges}
                                                        size="md"
                                                        variant="filled"
                                                        style={{ backgroundColor: PRIMARY_GOLD, color: PRIMARY_BROWN }}
                                                        disabled={saving}
                                                    >
                                                        {saving ? 'Saving...' : 'Save Changes'}
                                                    </Button>
                                                )
                                            ) : currentReviewStage === 'supervising_lawyer' ? (
                                                // Supervising Lawyer Stage: Save Changes, Approve to Director, and Return to Intern
                                                <Group gap="md">
                                                    <Button 
                                                        leftSection={<IconCircleCheck size={20} />}
                                                        onClick={handleSaveChanges}
                                                        size="md"
                                                        variant="outline"
                                                        style={{ borderColor: PRIMARY_GOLD, color: PRIMARY_BROWN }}
                                                        disabled={saving}
                                                    >
                                                        {saving ? 'Saving...' : 'Save Changes'}
                                                    </Button>
                                                    <Button 
                                                        leftSection={<IconCircleCheck size={20} />}
                                                        onClick={handleApproveToDirector}
                                                        size="md"
                                                        variant="filled"
                                                        style={{ backgroundColor: '#FF8C42' }}
                                                        disabled={saving || !actionInfo.decision || actionInfo.decision === 'rejected'}
                                                    >
                                                        {saving ? 'Approving...' : 'Approve to Director'}
                                                    </Button>
                                                    <Button 
                                                        leftSection={<IconCircleCheck size={20} />}
                                                        onClick={handleReturnToIntern}
                                                        size="md"
                                                        variant="filled"
                                                        style={{ backgroundColor: '#DC2626' }}
                                                        disabled={saving || !actionInfo.decision || actionInfo.decision !== 'rejected'}
                                                    >
                                                        {saving ? 'Returning...' : 'Return to Intern'}
                                                    </Button>
                                                </Group>
                                            ) : currentReviewStage === 'director' ? (
                                                // Director Stage: Save Changes, Finalize Record, and Return to Supervising Lawyer
                                                <Group gap="md">
                                                    <Button 
                                                        leftSection={<IconCircleCheck size={20} />}
                                                        onClick={handleSaveChanges}
                                                        size="md"
                                                        variant="outline"
                                                        style={{ borderColor: PRIMARY_GOLD, color: PRIMARY_BROWN }}
                                                        disabled={saving}
                                                    >
                                                        {saving ? 'Saving...' : 'Save Changes'}
                                                    </Button>
                                                    <Button 
                                                        leftSection={<IconCircleCheck size={20} />}
                                                        onClick={handleSubmit}
                                                        size="md"
                                                        variant="filled"
                                                        style={{ backgroundColor: PRIMARY_BROWN }}
                                                        disabled={saving || !actionInfo.decision || actionInfo.decision === 'rejected'}
                                                    >
                                                        {saving ? 'Finalizing...' : 'Finalize Record'}
                                                    </Button>
                                                    <Button 
                                                        leftSection={<IconCircleCheck size={20} />}
                                                        onClick={handleReturnToSupervisingLawyer}
                                                        size="md"
                                                        variant="filled"
                                                        style={{ backgroundColor: '#DC2626' }}
                                                        disabled={saving || !actionInfo.decision || actionInfo.decision !== 'rejected'}
                                                    >
                                                        {saving ? 'Returning...' : 'Return to Supervising Lawyer'}
                                                    </Button>
                                                </Group>
                                            ) : (
                                                // Fallback: Attorney/Secretary with completed or unknown stage
                                                <Group gap="md">
                                                    <Button 
                                                        leftSection={<IconCircleCheck size={20} />}
                                                        onClick={handleSaveChanges}
                                                        size="md"
                                                        variant="outline"
                                                        style={{ borderColor: PRIMARY_GOLD, color: PRIMARY_BROWN }}
                                                        disabled={saving}
                                                    >
                                                        {saving ? 'Saving...' : 'Save Changes'}
                                                    </Button>
                                                    <Button 
                                                        leftSection={<IconCircleCheck size={20} />}
                                                        onClick={handleSubmit}
                                                        size="md"
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
                                                leftSection={<IconCircleCheck size={20} />}
                                                onClick={() => {
                                                    window.__internFinalizeClicked = false;
                                                    handleSubmit();
                                                }}
                                                size="md"
                                                variant="filled"
                                                style={{ backgroundColor: PRIMARY_GOLD, color: PRIMARY_BROWN }}
                                                disabled={saving}
                                            >
                                                {saving ? 'Saving...' : 'Submit for Review'}
                                            </Button>
                                        ) : (
                                            // Attorney/Secretary creating new: Finalize Record button only
                                            <Button 
                                                leftSection={<IconCircleCheck size={20} />}
                                                onClick={handleSubmit}
                                                size="md"
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
}