import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Container, Title, Text, Paper, Stack, Group, Button, Divider, Loader, Center, ActionIcon, Tooltip, ScrollArea, Tabs, Table, TextInput, Modal, FileButton,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconArrowLeft, IconDeviceFloppy, IconFileText, IconDownload, IconHistory, IconChecklist, IconFileDescription, IconFolder, IconEdit, IconTrash, IconEye, IconPaperclip, IconX,
} from '@tabler/icons-react';
import { PRIMARY_BROWN, MUTED_OLIVE, BG, CHARCOAL } from '@utils/constants';
import { CaseInformationSection } from '@/app/pages/other/CaseInformationSection';
import apiClient from '@config/api/apiClient';
import { useAuth } from '@/context/authContext';
import jsPDF from 'jspdf';

export default function CaseRecordView() {
  const { finalizeId } = useParams();
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [caseRecordData, setCaseRecordData] = useState({});
  const [originalData, setOriginalData] = useState({});
  const [activeTab, setActiveTab] = useState('case-record');

  // History tab state
  const [historyRecords, setHistoryRecords] = useState([]);
  const [editHistoryModalOpened, setEditHistoryModalOpened] = useState(false);
  const [editingHistory, setEditingHistory] = useState(null);
  const [viewFileModalOpened, setViewFileModalOpened] = useState(false);
  const [viewingFile, setViewingFile] = useState(null);

  useEffect(() => {
    const fetchCaseRecord = async () => {
      try {
        setLoading(true);
        const resp = await apiClient.get(`/caserecords/finalize/${finalizeId}`);
        if (resp.data) {
          setCaseRecordData(resp.data);
          setOriginalData(resp.data);
          // Load history records from server
          if (resp.data.historyRecords && Array.isArray(resp.data.historyRecords)) {
            setHistoryRecords(resp.data.historyRecords);
          }
        } else {
          notifications.show({ 
            title: 'Not Found', 
            message: 'Case record not found for this case.', 
            color: 'yellow' 
          });
        }
      } catch (err) {
        console.error('Error fetching case record:', err);
        notifications.show({ 
          title: 'Error', 
          message: 'Failed to load case record. Please try again.', 
          color: 'red' 
        });
      } finally {
        setLoading(false);
      }
    };

    if (finalizeId) fetchCaseRecord();
  }, [finalizeId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Convert any File objects to base64 before saving
      const historyRecordsToSave = await Promise.all(historyRecords.map(async (h) => {
        if (h.file instanceof File) {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              const base64 = reader.result.split(',')[1];
              resolve({
                ...h,
                file: base64,
                fileType: h.file.type
              });
            };
            reader.readAsDataURL(h.file);
          });
        }
        return h;
      }));
      
      const payload = {
        ...caseRecordData,
        historyRecords: historyRecordsToSave
      };
      await apiClient.put(`/caserecords/finalize/${finalizeId}`, payload);
      setOriginalData(caseRecordData);
      setEditMode(false);
      notifications.show({ 
        title: 'Success', 
        message: 'Case record updated successfully.', 
        color: 'green' 
      });
    } catch (err) {
      console.error('Error saving case record:', err);
      notifications.show({ 
        title: 'Error', 
        message: 'Failed to save case record. Please try again.', 
        color: 'red' 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setCaseRecordData(originalData);
    setEditMode(false);
  };

  // History functions
  const handleEditHistory = (historyItem) => {
    setEditingHistory(historyItem);
    setEditHistoryModalOpened(true);
  };

  const handleDeleteHistory = async (historyId) => {
    if (window.confirm('Are you sure you want to delete this history record?')) {
      const updatedHistoryRecords = historyRecords.filter(h => h.id !== historyId);
      setHistoryRecords(updatedHistoryRecords);
      
      // Convert any File objects to base64 before saving
      const historyRecordsToSave = await Promise.all(updatedHistoryRecords.map(async (h) => {
        if (h.file instanceof File) {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              const base64 = reader.result.split(',')[1];
              resolve({
                ...h,
                file: base64,
                fileType: h.file.type
              });
            };
            reader.readAsDataURL(h.file);
          });
        }
        return h;
      }));
      
      // Save to server
      try {
        await apiClient.put(`/caserecords/finalize/${finalizeId}`, {
          ...caseRecordData,
          historyRecords: historyRecordsToSave
        });
        notifications.show({ 
          title: 'Deleted', 
          message: 'History record deleted successfully.', 
          color: 'green' 
        });
      } catch (err) {
        console.error('Error deleting history record:', err);
        notifications.show({ 
          title: 'Error', 
          message: 'Failed to delete history record.', 
          color: 'red' 
        });
        // Revert on error
        setHistoryRecords(historyRecords);
      }
    }
  };

  const handleViewFile = (historyItem) => {
    // Check if the file is a File object (local) or base64 string (from server)
    if (historyItem.file instanceof File) {
      // Convert File object to base64 for viewing
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        setViewingFile({
          ...historyItem,
          file: base64,
          fileType: historyItem.file.type
        });
        setViewFileModalOpened(true);
      };
      reader.readAsDataURL(historyItem.file);
    } else {
      // Already in base64 format
      setViewingFile(historyItem);
      setViewFileModalOpened(true);
    }
  };

  const handleDownloadFile = (historyItem) => {
    if (historyItem.file && historyItem.fileName) {
      try {
        let fileData = historyItem.file;
        let fileType = historyItem.fileType || 'application/octet-stream';
        
        // Check if file is a File object (local) or base64 string (from server)
        if (historyItem.file instanceof File) {
          // Use the File object directly
          const url = URL.createObjectURL(historyItem.file);
          const link = document.createElement('a');
          link.href = url;
          link.download = historyItem.fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        } else {
          // Convert base64 to blob and download
          const byteCharacters = atob(fileData);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: fileType });
          
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = historyItem.fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
        
        notifications.show({ 
          title: 'Download', 
          message: `Downloading ${historyItem.fileName}...`, 
          color: 'blue' 
        });
      } catch (err) {
        console.error('Error downloading file:', err);
        notifications.show({ 
          title: 'Error', 
          message: 'Failed to download file.', 
          color: 'red' 
        });
      }
    } else {
      notifications.show({ 
        title: 'No File', 
        message: 'No file attached to this record.', 
        color: 'yellow' 
      });
    }
  };

  const handleDeleteFile = async (historyId) => {
    if (window.confirm('Are you sure you want to delete the attached file?')) {
      const updatedHistoryRecords = historyRecords.map(h => 
        h.id === historyId ? { ...h, file: null, fileName: null, fileType: null } : h
      );
      setHistoryRecords(updatedHistoryRecords);
      
      // Convert any File objects to base64 before saving
      const historyRecordsToSave = await Promise.all(updatedHistoryRecords.map(async (h) => {
        if (h.file instanceof File) {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              const base64 = reader.result.split(',')[1];
              resolve({
                ...h,
                file: base64,
                fileType: h.file.type
              });
            };
            reader.readAsDataURL(h.file);
          });
        }
        return h;
      }));
      
      // Save to server
      try {
        await apiClient.put(`/caserecords/finalize/${finalizeId}`, {
          ...caseRecordData,
          historyRecords: historyRecordsToSave
        });
        notifications.show({ 
          title: 'File Deleted', 
          message: 'Attached file deleted successfully.', 
          color: 'green' 
        });
      } catch (err) {
        console.error('Error deleting file:', err);
        notifications.show({ 
          title: 'Error', 
          message: 'Failed to delete attached file.', 
          color: 'red' 
        });
        // Revert on error
        setHistoryRecords(historyRecords);
      }
    }
  };

  const handleSaveHistory = async () => {
    if (editingHistory) {
      let updatedHistoryRecords;
      
      // Convert File object to base64 if needed
      let historyToSave = { ...editingHistory };
      if (historyToSave.file instanceof File) {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result.split(',')[1];
          historyToSave = {
            ...historyToSave,
            file: base64,
            fileType: historyToSave.file.type
          };
          saveHistoryRecord(historyToSave);
        };
        reader.readAsDataURL(historyToSave.file);
        return;
      }
      
      saveHistoryRecord(historyToSave);
    }
  };

  const saveHistoryRecord = async (historyToSave) => {
    let updatedHistoryRecords;
    
    // Check if this is a new record or an existing one
    const existingIndex = historyRecords.findIndex(h => h.id === historyToSave.id);
    
    if (existingIndex >= 0) {
      // Update existing record
      updatedHistoryRecords = historyRecords.map(h => 
        h.id === historyToSave.id ? historyToSave : h
      );
    } else {
      // Add new record
      updatedHistoryRecords = [...historyRecords, historyToSave];
    }
    
    setHistoryRecords(updatedHistoryRecords);
    setEditHistoryModalOpened(false);
    setEditingHistory(null);
    
    // Save to server
    try {
      await apiClient.put(`/caserecords/finalize/${finalizeId}`, {
        ...caseRecordData,
        historyRecords: updatedHistoryRecords
      });
      notifications.show({ 
        title: 'Success', 
        message: 'History record saved successfully.', 
        color: 'green' 
      });
    } catch (err) {
      console.error('Error saving history record:', err);
      notifications.show({ 
        title: 'Error', 
        message: 'Failed to save history record.', 
        color: 'red' 
      });
      // Revert on error
      setHistoryRecords(historyRecords);
    }
  };

  const formatText = (v) => (v == null ? '' : String(v));

  const drawCaseRecordHistoryRemarksPage = (doc, data = {}) => {
    const PDF_FONT_SIZE = 10;
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 10;
    const w = pageW - margin * 2;

    const setFont = (_size = PDF_FONT_SIZE, style = 'normal') => {
      doc.setFont('times', style);
      doc.setFontSize(PDF_FONT_SIZE);
    };

    const safeText = (v) => (v == null ? '' : String(v));

    const mmPerPt = 0.3528;
    const lineHeightMm = (_fontSize = PDF_FONT_SIZE) => PDF_FONT_SIZE * mmPerPt * (doc.getLineHeightFactor?.() || 1.15);

    const drawMultilineInRect = (text, x, y, w, h, fontSize = 9) => {
      setFont(fontSize, 'normal');
      const padding = 2;
      const maxW = Math.max(1, w - padding * 2);
      const maxH = Math.max(1, h - padding * 2);
      const lh = lineHeightMm(fontSize);
      const maxLines = Math.max(1, Math.floor(maxH / lh));
      const lines = doc.splitTextToSize(safeText(text), maxW).slice(0, maxLines);
      doc.text(lines, x + padding, y + padding + lh * 0.75);
    };

    const drawRuledRect = (x, y, w, h, gap = 6) => {
      doc.rect(x, y, w, h);
      for (let yy = y + gap; yy < y + h; yy += gap) {
        doc.line(x, yy, x + w, yy);
      }
    };

    const drawLabeledLine = (label, value, x, y, colW, labelW = 36) => {
      setFont(9, 'normal');
      doc.text(label, x + 2, y);
      const lineX = x + labelW;
      doc.line(lineX, y + 0.6, x + colW - 2, y + 0.6);
      const maxW = Math.max(1, colW - labelW - 4);
      const lines = doc.splitTextToSize(safeText(value), maxW).slice(0, 1);
      if (lines.length) {
        doc.text(lines[0], lineX + 1, y);
      }
    };

    const x0 = margin;
    let y = margin;

    // Header block (two columns)
    const headerH = 58;
    doc.rect(x0, y, w, headerH);
    const midX = x0 + w / 2;
    doc.line(midX, y, midX, y + headerH);

    const colW = w / 2;
    const rowGap = 6;
    const leftX = x0;
    const rightX = midX;

    // Left column fields
    setFont(9, 'normal');
    const leftFields = [
      { label: 'Title of the Case:', value: data.title },
      { label: 'Nature of the Case:', value: data.nature },
      { label: 'Tribunal:', value: data.tribunal },
      { label: 'Branch:', value: data.branch },
      { label: 'Presiding Judge:', value: data.presidingJudge },
      { label: 'Tel/Email:', value: data.telEmail },
    ];
    leftFields.forEach((f, i) => {
      drawLabeledLine(f.label, f.value, leftX, y + 6 + i * rowGap, colW, 44);
    });

    // Parties (multi-line) in left column
    setFont(9, 'normal');
    const partiesY = y + 6 + leftFields.length * rowGap;
    doc.text('Party/ies:', leftX + 2, partiesY);
    doc.line(leftX + 44, partiesY + 0.6, leftX + colW - 2, partiesY + 0.6);
    drawMultilineInRect(data.parties, leftX + 44, partiesY - 4, colW - 46, 14, 9);

    // Right column fields
    const rightFields = [
      { label: 'Contact Details:', value: data.contactDetails },
      { label: 'Counsel/s on Record:', value: data.counsels },
      { label: 'Public Prosecutor:', value: data.publicProsecutor },
      { label: 'Opposing Counsel:', value: data.opposingCounsel },
    ];
    rightFields.forEach((f, i) => {
      drawLabeledLine(f.label, f.value, rightX, y + 6 + i * rowGap, colW, 52);
    });

    // Client address (multi-line)
    const addressY = y + 6 + rightFields.length * rowGap;
    setFont(9, 'normal');
    doc.text("Client/s Address:", rightX + 2, addressY);
    doc.line(rightX + 52, addressY + 0.6, rightX + colW - 2, addressY + 0.6);
    drawMultilineInRect(data.clientAddress, rightX + 52, addressY - 4, colW - 54, 14, 9);

    // Others (multi-line)
    const othersY = addressY + 2 * rowGap;
    doc.text('Others:', rightX + 2, othersY);
    doc.line(rightX + 52, othersY + 0.6, rightX + colW - 2, othersY + 0.6);
    drawMultilineInRect(data.others, rightX + 52, othersY - 4, colW - 54, 14, 9);

    y += headerH;

    // Bottom sections
    const sectionY = y;
    const sectionH = pageH - sectionY - margin;
    const leftSectionW = (w - 2) / 2;
    const rightSectionW = leftSectionW;
    const leftSectionX = x0;
    const rightSectionX = x0 + leftSectionW + 2;

    // Section header line
    doc.line(x0, sectionY, x0 + w, sectionY);

    setFont(10, 'bold');
    doc.text('CASE HISTORY', leftSectionX + leftSectionW / 2, sectionY + 7, { align: 'center' });
    setFont(8, 'normal');
    doc.text('(in reverse chronological order)', leftSectionX + leftSectionW / 2, sectionY + 12, { align: 'center' });

    setFont(10, 'bold');
    doc.text('REMARKS / REMINDERS / NOTES', rightSectionX + rightSectionW / 2, sectionY + 7, { align: 'center' });
    setFont(8, 'normal');
    doc.text('(deadlines/material dates, etc.)', rightSectionX + rightSectionW / 2, sectionY + 12, { align: 'center' });

    const boxY = sectionY + 14;
    const availableH = sectionH - 14;

    // Measure text to make dynamic boxes (use at least half remaining space, up to full)
    const measureBoxText = (text, boxW, fontSize = 9) => {
      setFont(fontSize, 'normal');
      const padding = 2;
      const maxW = Math.max(1, boxW - padding * 2);
      const lh = lineHeightMm(fontSize);
      const lines = doc.splitTextToSize(safeText(text), maxW);
      return lines.length * lh + padding * 2 + 4;
    };

    const historyTextH = measureBoxText(data.caseHistory, leftSectionW);
    const remarksTextH = measureBoxText(data.remarks, rightSectionW);
    const boxH = Math.max(Math.max(historyTextH, remarksTextH), Math.min(availableH, 40));

    doc.rect(leftSectionX, boxY, leftSectionW, boxH);
    doc.rect(rightSectionX, boxY, rightSectionW, boxH);

    drawMultilineInRect(data.caseHistory, leftSectionX, boxY, leftSectionW, boxH, 9);
    drawMultilineInRect(data.remarks, rightSectionX, boxY, rightSectionW, boxH, 9);
  };

  const addDateTimeHeaderToAllPages = (doc) => {
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const now = new Date();
      const dateTimeStr = now.toLocaleString();
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated: ${dateTimeStr}`, pageWidth - 10, pageHeight - 10, { align: 'right' });
    }
  };

  const buildClientPdfFileName = (clientName) => {
    const sanitizedName = (clientName || 'case').replace(/[^a-zA-Z0-9\s-_]/g, '').trim();
    const timestamp = new Date().toISOString().slice(0, 10);
    return `${sanitizedName}_case_record_${timestamp}.pdf`;
  };

  const exportCaseRecordPdf = () => {
    if (!caseRecordData || Object.keys(caseRecordData).length === 0) {
      notifications.show({ title: 'Nothing to export', message: 'No case record data loaded.', color: 'yellow' });
      return;
    }

    // Only landscape form page layout
    const doc = new jsPDF({ orientation: 'l', unit: 'mm', format: 'a4' });
    drawCaseRecordHistoryRemarksPage(doc, {
      title: formatText(caseRecordData.title),
      caseId: formatText(caseRecordData.caseId),
      nature: formatText(caseRecordData.nature),
      tribunal: formatText(caseRecordData.tribunal),
      branch: formatText(caseRecordData.branch),
      presidingJudge: formatText(caseRecordData.presidingJudge),
      telEmail: formatText(caseRecordData.contactDetails || caseRecordData.telEmail),
      parties: formatText(caseRecordData.parties),
      contactDetails: formatText(caseRecordData.contactDetails),
      counsels: formatText(caseRecordData.counsels),
      publicProsecutor: formatText(caseRecordData.publicProsecutor),
      opposingCounsel: formatText(caseRecordData.opposingCounsel),
      clientAddress: formatText(caseRecordData.clientAddress),
      others: formatText(caseRecordData.others),
      caseHistory: formatText(caseRecordData.caseHistory),
      remarks: formatText(caseRecordData.remarks),
    });

    const caseRecordClientName = caseRecordData?.clientName || caseRecordData?.fullName || '';

    addDateTimeHeaderToAllPages(doc);
    doc.save(buildClientPdfFileName(caseRecordClientName));
    notifications.show({ 
      title: 'Success', 
      message: 'Case record exported as PDF.', 
      color: 'green' 
    });
  };

  if (loading) {
    return (
      <Box bg={BG} mih="100vh" py="xl">
        <Center h="80vh"><Loader color={PRIMARY_BROWN} size="lg" /></Center>
      </Box>
    );
  }

  return (
    <Box bg={BG} mih="100vh" py="xl">
      <style>
        {`
          ::-webkit-scrollbar { width: 8px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: ${MUTED_OLIVE}; border-radius: 4px; }
          ::-webkit-scrollbar-thumb:hover { background: ${PRIMARY_BROWN}; }
          * { scrollbar-width: thin; scrollbar-color: ${MUTED_OLIVE} transparent; }
        `}
      </style>
      <Container size="xl">
        {/* Page Header */}
        <Group justify="space-between" align="flex-start" mb="lg">
          <Group gap="sm" align="center">
            <Tooltip label="Back to Finalized Cases">
              <ActionIcon variant="light" color={PRIMARY_BROWN} size="lg" radius="md" onClick={() => navigate('/admin/finalized')}>
                <IconArrowLeft size={18} />
              </ActionIcon>
            </Tooltip>
            <Box style={{
              width: 36, height: 36, borderRadius: 9,
              background: PRIMARY_BROWN,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <IconFileText size={18} color="white" stroke={2.5} />
            </Box>
            <Box>
              <Title order={3} c={CHARCOAL} lh={1.2}>
                Case Record
              </Title>
              <Text size="sm" c={MUTED_OLIVE} mt={2}>
                {caseRecordData.title || 'Untitled Case'}
              </Text>
            </Box>
          </Group>

          <Group gap="xs">
            {!editMode ? (
              <>
                <Button 
                  variant="outline" 
                  color={PRIMARY_BROWN} 
                  fw={600} 
                  onClick={() => setEditMode(true)}
                >
                  Edit
                </Button>
                <Button 
                  variant="subtle" 
                  color={PRIMARY_BROWN} 
                  fw={600} 
                  leftSection={<IconDownload size={16} />} 
                  onClick={exportCaseRecordPdf}
                >
                  Export PDF
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="subtle" 
                  color="gray" 
                  fw={600} 
                  onClick={handleCancelEdit}
                >
                  Cancel
                </Button>
                <Button 
                  color={PRIMARY_BROWN} 
                  radius="md" 
                  fw={600} 
                  leftSection={<IconDeviceFloppy size={16} />} 
                  onClick={handleSave} 
                  loading={saving}
                >
                  Save Changes
                </Button>
              </>
            )}
          </Group>
        </Group>

        <ScrollArea h="calc(100vh - 140px)">
          <Tabs value={activeTab} onChange={setActiveTab} variant="outline" radius="md">
            <Tabs.List>
              <Tabs.Tab value="case-record" leftSection={<IconFileText size={16} />}>
                Case Record
              </Tabs.Tab>
              <Tabs.Tab value="history" leftSection={<IconHistory size={16} />}>
                History
              </Tabs.Tab>
              <Tabs.Tab value="tasks" leftSection={<IconChecklist size={16} />}>
                Tasks
              </Tabs.Tab>
              <Tabs.Tab value="evidence" leftSection={<IconFolder size={16} />}>
                Evidence
              </Tabs.Tab>
              <Tabs.Tab value="drafts" leftSection={<IconFileDescription size={16} />}>
                Drafts
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="case-record" pt="md">
              <CaseInformationSection
                value={caseRecordData}
                onChange={setCaseRecordData}
                readOnly={!editMode}
              />
            </Tabs.Panel>

            <Tabs.Panel value="history" pt="md">
              <Paper p="xl" radius="lg" bg="white" style={{ border: '1px solid #F0F0F0' }}>
                <Stack gap="md">
                  <Group justify="space-between" align="center">
                    <Title order={3} c={PRIMARY_BROWN}>History</Title>
                    <Button 
                      size="sm" 
                      color={PRIMARY_BROWN}
                      onClick={() => {
                        const newHistory = {
                          id: Date.now(),
                          date: new Date().toISOString().split('T')[0],
                          dateReceived: new Date().toISOString().split('T')[0],
                          remarks: '',
                          file: null,
                          fileName: null,
                          fileType: null
                        };
                        setEditingHistory(newHistory);
                        setEditHistoryModalOpened(true);
                      }}
                    >
                      Add History
                    </Button>
                  </Group>

                  {historyRecords.length === 0 ? (
                    <Text c={MUTED_OLIVE} ta="center" py="xl">No history records available yet.</Text>
                  ) : (
                    <Table striped highlightOnHover>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Date</Table.Th>
                          <Table.Th>Date Received</Table.Th>
                          <Table.Th>Remarks</Table.Th>
                          <Table.Th>Attached File</Table.Th>
                          <Table.Th>Actions</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {historyRecords.map((history) => (
                          <Table.Tr key={history.id}>
                            <Table.Td>{history.date}</Table.Td>
                            <Table.Td>{history.dateReceived}</Table.Td>
                            <Table.Td>{history.remarks}</Table.Td>
                            <Table.Td>
                              {history.fileName ? (
                                <Group gap="xs">
                                  <IconPaperclip size={16} color={PRIMARY_BROWN} />
                                  <Text size="sm">{history.fileName}</Text>
                                </Group>
                              ) : (
                                <Text size="sm" c="dimmed">No file</Text>
                              )}
                            </Table.Td>
                            <Table.Td>
                              <Group gap="xs">
                                <Tooltip label="Edit History">
                                  <ActionIcon 
                                    size="sm" 
                                    variant="light" 
                                    color={PRIMARY_BROWN}
                                    onClick={() => handleEditHistory(history)}
                                  >
                                    <IconEdit size={16} />
                                  </ActionIcon>
                                </Tooltip>
                                <Tooltip label="Delete History">
                                  <ActionIcon 
                                    size="sm" 
                                    variant="light" 
                                    color="red"
                                    onClick={() => handleDeleteHistory(history.id)}
                                  >
                                    <IconTrash size={16} />
                                  </ActionIcon>
                                </Tooltip>
                                {history.file && (
                                  <>
                                    <Tooltip label="View Attached File">
                                      <ActionIcon 
                                        size="sm" 
                                        variant="light" 
                                        color="blue"
                                        onClick={() => handleViewFile(history)}
                                      >
                                        <IconEye size={16} />
                                      </ActionIcon>
                                    </Tooltip>
                                    <Tooltip label="Download Attached File">
                                      <ActionIcon 
                                        size="sm" 
                                        variant="light" 
                                        color="green"
                                        onClick={() => handleDownloadFile(history)}
                                      >
                                        <IconDownload size={16} />
                                      </ActionIcon>
                                    </Tooltip>
                                    <Tooltip label="Delete File Only">
                                      <ActionIcon 
                                        size="sm" 
                                        variant="light" 
                                        color="orange"
                                        onClick={() => handleDeleteFile(history.id)}
                                      >
                                        <IconX size={16} />
                                      </ActionIcon>
                                    </Tooltip>
                                  </>
                                )}
                              </Group>
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  )}
                </Stack>
              </Paper>
            </Tabs.Panel>

            <Tabs.Panel value="tasks" pt="md">
              <Paper p="xl" radius="lg" bg="white" style={{ border: '1px solid #F0F0F0' }}>
                <Stack gap="md">
                  <Title order={3} c={PRIMARY_BROWN}>Tasks</Title>
                  <Text c={MUTED_OLIVE}>No tasks available yet.</Text>
                </Stack>
              </Paper>
            </Tabs.Panel>

            <Tabs.Panel value="evidence" pt="md">
              <Paper p="xl" radius="lg" bg="white" style={{ border: '1px solid #F0F0F0' }}>
                <Stack gap="md">
                  <Title order={3} c={PRIMARY_BROWN}>Evidence</Title>
                  <Text c={MUTED_OLIVE}>No evidence records available yet.</Text>
                </Stack>
              </Paper>
            </Tabs.Panel>

            <Tabs.Panel value="drafts" pt="md">
              <Paper p="xl" radius="lg" bg="white" style={{ border: '1px solid #F0F0F0' }}>
                <Stack gap="md">
                  <Title order={3} c={PRIMARY_BROWN}>Drafts</Title>
                  <Text c={MUTED_OLIVE}>No drafts available yet.</Text>
                </Stack>
              </Paper>
            </Tabs.Panel>
          </Tabs>
        </ScrollArea>
      </Container>

      {/* Edit History Modal */}
      <Modal
        opened={editHistoryModalOpened}
        onClose={() => {
          setEditHistoryModalOpened(false);
          setEditingHistory(null);
        }}
        title="Edit History Record"
        centered
      >
        {editingHistory && (
          <Stack gap="md">
            <TextInput
              label="Date"
              type="date"
              value={editingHistory.date}
              onChange={(e) => setEditingHistory({ ...editingHistory, date: e.target.value })}
            />
            <TextInput
              label="Date Received"
              type="date"
              value={editingHistory.dateReceived}
              onChange={(e) => setEditingHistory({ ...editingHistory, dateReceived: e.target.value })}
            />
            <TextInput
              label="Remarks"
              value={editingHistory.remarks}
              onChange={(e) => setEditingHistory({ ...editingHistory, remarks: e.target.value })}
            />
            <FileButton
              onChange={(file) => {
                if (file) {
                  const reader = new FileReader();
                  reader.onload = () => {
                    const base64 = reader.result.split(',')[1]; // Remove data URL prefix
                    setEditingHistory({ 
                      ...editingHistory, 
                      file: base64, 
                      fileName: file.name,
                      fileType: file.type
                    });
                  };
                  reader.readAsDataURL(file);
                }
              }}
              accept="*/*"
            >
              {(props) => (
                <Button {...props} variant="outline" size="sm">
                  {editingHistory.fileName ? `Change: ${editingHistory.fileName}` : 'Attach File'}
                </Button>
              )}
            </FileButton>
            {editingHistory.fileName && (
              <Text size="sm" c={PRIMARY_BROWN}>
                Current file: {editingHistory.fileName}
              </Text>
            )}
            <Group justify="flex-end" mt="md">
              <Button
                variant="subtle"
                onClick={() => {
                  setEditHistoryModalOpened(false);
                  setEditingHistory(null);
                }}
              >
                Cancel
              </Button>
              <Button color={PRIMARY_BROWN} onClick={handleSaveHistory}>
                Save
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* View File Modal */}
      <Modal
        opened={viewFileModalOpened}
        onClose={() => {
          setViewFileModalOpened(false);
          setViewingFile(null);
        }}
        title="View Attached File"
        size="xl"
        centered
      >
        {viewingFile && (
          <Stack gap="md">
            <Group>
              <IconPaperclip size={20} color={PRIMARY_BROWN} />
              <Text fw={600}>{viewingFile.fileName || 'Unknown File'}</Text>
            </Group>
            <Paper p="md" bg="#F5F5F5" radius="md" style={{ minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {viewingFile.file && viewingFile.fileType && viewingFile.fileType.startsWith('image/') ? (
                <img 
                  src={`data:${viewingFile.fileType};base64,${viewingFile.file}`} 
                  alt={viewingFile.fileName}
                  style={{ maxWidth: '100%', maxHeight: '500px', objectFit: 'contain' }}
                />
              ) : viewingFile.file ? (
                <Text c="dimmed" ta="center">
                  File preview not available for this file type. 
                  Please download to view the content.
                </Text>
              ) : (
                <Text c="dimmed" ta="center">
                  No file attached.
                </Text>
              )}
            </Paper>
            <Group justify="flex-end">
              <Button
                variant="outline"
                onClick={() => handleDownloadFile(viewingFile)}
                leftSection={<IconDownload size={16} />}
              >
                Download
              </Button>
              <Button
                color={PRIMARY_BROWN}
                onClick={() => {
                  setViewFileModalOpened(false);
                  setViewingFile(null);
                }}
              >
                Close
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Box>
  );
}