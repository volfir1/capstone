import React, { Fragment, useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { ActionIcon, Button, Card, FileInput, Group, Modal, Stack, Table, Text, TextInput, Textarea, Title, Select } from '@mantine/core';
import { IconChevronDown, IconChevronRight, IconDownload, IconEdit, IconPlus, IconTrash, IconX, IconUpload } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import apiClient from '@config/api/apiClient';

const generateId = () => Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

const createAnnex = () => ({
  _id: generateId(),
  annex: '',
  annexSeries: '',
  exhibit: '',
  exhibitSeries: '',
  document: '',
  documentUrl: '',
  driveFileId: '',
  witness: '',
  original: '',
  notes: '',
  seriesRows: [],
  cloudinaryUrl: null,
  cloudinaryPublicId: null,
  cloudinaryResourceType: null,
  isServerFile: false,
  fileName: null,
  fileType: null,
  fileSize: null
});

const createSeries = () => ({
  _id: generateId(),
  annexSeries: '',
  exhibitSeries: '',
  document: '',
  documentUrl: '',
  driveFileId: '',
  witness: '',
  original: '',
  notes: '',
  cloudinaryUrl: null,
  cloudinaryPublicId: null,
  cloudinaryResourceType: null,
  isServerFile: false,
  fileName: null,
  fileType: null,
  fileSize: null
});

const resolveDocumentUrl = (row) => {
  if (!row) return '';
  return row.cloudinaryUrl || row.documentUrl || (row.driveFileId ? `https://drive.google.com/file/d/${row.driveFileId}/view` : '');
};

export const normalizeList = (l) => {
  // Handle nested annexes structure (where annexes objects have their own annexes arrays)
  let annexesToUse = [];

  if (Array.isArray(l.annexes)) {
    // Check if annexes contains objects with nested annexes
    const hasNestedAnnexes = l.annexes.some(item => item.annexes && Array.isArray(item.annexes) && item.annexes.length > 0);

    if (hasNestedAnnexes) {
      // Flatten the nested structure
      l.annexes.forEach(item => {
        if (item.annexes && Array.isArray(item.annexes) && item.annexes.length > 0) {
          // Add the nested annexes
          annexesToUse = annexesToUse.concat(item.annexes);
        } else if (item.annex || item.exhibit || item.document) {
          // This is a regular annex, add it directly
          annexesToUse.push(item);
        }
      });
    } else {
      annexesToUse = l.annexes;
    }
  } else if (l.annexes?.annexes && Array.isArray(l.annexes.annexes)) {
    annexesToUse = l.annexes.annexes;
  }

  return {
    ...l,
    annexes: annexesToUse.map(a => ({
      ...createAnnex(),
      ...a,
      documentUrl: resolveDocumentUrl(a),
      driveFileId: a.driveFileId || '',
      cloudinaryUrl: a.cloudinaryUrl || null,
      cloudinaryPublicId: a.cloudinaryPublicId || null,
      cloudinaryResourceType: a.cloudinaryResourceType || null,
      isServerFile: a.isServerFile || false,
      fileName: a.fileName || null,
      fileType: a.fileType || null,
      fileSize: a.fileSize || null,
      filename: a.filename || null,
      seriesRows: (a.seriesRows || []).map(s => ({
        ...createSeries(),
        ...s,
        documentUrl: resolveDocumentUrl(s),
        driveFileId: s.driveFileId || '',
        cloudinaryUrl: s.cloudinaryUrl || null,
        cloudinaryPublicId: s.cloudinaryPublicId || null,
        cloudinaryResourceType: s.cloudinaryResourceType || null,
        isServerFile: s.isServerFile || false,
        fileName: s.fileName || null,
        fileType: s.fileType || null,
        fileSize: s.fileSize || null,
        filename: s.filename || null,
        _id: s._id || generateId()
      }))
    }))
  };
};

function Form({ value, isSeries, onChange, onUpload, onClearFile, onRemoveServerFile }) {
  const fields = isSeries ? ['annexSeries', 'exhibitSeries'] : ['annex', 'exhibit'];
  const set = (k, x) => onChange({ ...value, [k]: x });

  return (
    <Stack gap="xs">
      {fields.map(f => (
        <TextInput
          key={f}
          label={f.includes('Series') ? 'Series' : f[0].toUpperCase() + f.slice(1)}
          maxLength={10}
          value={value[f] || ''}
          onChange={e => set(f, e.currentTarget.value)}
        />
      ))}
      <TextInput
        label="Document"
        value={value.document || ''}
        onChange={e => set('document', e.currentTarget.value)}
      />
      <Group gap="xs">
        <FileInput
          label="Upload document"
          value={value.pendingFile || null}
          onChange={onUpload}
          style={{ flex: 1 }}
        />
        {value.pendingFile && (
          <ActionIcon onClick={onClearFile} variant="light" color="red" size="input-sm">
            <IconX size={16} />
          </ActionIcon>
        )}
      </Group>
      {(value.cloudinaryUrl || value.documentUrl) && (
        <Group gap="xs">
          <Text size="sm" c="dimmed">File uploaded: {value.fileName || value.document}</Text>
          <ActionIcon onClick={onRemoveServerFile} variant="light" color="red" size="input-sm">
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      )}
      <TextInput
        label="Witness"
        value={value.witness || ''}
        onChange={e => set('witness', e.currentTarget.value)}
      />
      <TextInput
        label="Original"
        value={value.original || ''}
        onChange={e => set('original', e.currentTarget.value)}
      />
      <Textarea
        label="Notes"
        value={value.notes || ''}
        onChange={e => set('notes', e.currentTarget.value)}
      />
    </Stack>
  );
}

const EvidenceListComponent = ({ value = [], onChange, readOnly = false }, ref) => {
  const [lists, setLists] = useState(() => {
    // Check if value is the new structure (array of lists) or old structure (flat array of annexes)
    if (Array.isArray(value) && value.length > 0 && value[0]._id && value[0].name && value[0].annexes) {
      // New structure: array of lists
      return value;
    } else {
      // Old structure: flat array of annexes, wrap in default list
      const normalized = normalizeList({ _id: 'default', name: 'Client Evidence', annexes: Array.isArray(value) ? value : [] });
      return Array.isArray(normalized) ? normalized : [normalized];
    }
  });
  const [expanded, setExpanded] = useState(() => {
    // Initialize expanded state with all list IDs from the initial value
    const initialExpanded = {};
    if (Array.isArray(value) && value.length > 0 && value[0]._id && value[0].name && value[0].annexes) {
      value.forEach(list => {
        initialExpanded[list._id] = true;
      });
    } else {
      initialExpanded.default = true;
    }
    return initialExpanded;
  });
  const [editor, setEditor] = useState(null);
  const [sort, setSort] = useState({ default: { field: 'annex', direction: 1 } });
  const [addingList, setAddingList] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ open: false, onConfirm: null, title: '', message: '' });
  const [uploadingFile, setUploadingFile] = useState(false);
  const first = useRef(true);
  const prevValueRef = useRef(null);
  const prevValueStringRef = useRef('');

  const update = (id, fn) => setLists(x => x.map(l => l._id === id ? fn(l) : l));

  // Helper to safely update a series row
  const updateSeriesRow = (seriesIndex, field, value) => {
    setEditor(current => {
      if (!current || !current.value || !current.value.seriesRows) return current;
      return {
        ...current,
        value: {
          ...current.value,
          seriesRows: current.value.seriesRows.map((row, idx) =>
            idx === seriesIndex ? { ...row, [field]: value } : row
          )
        }
      };
    });
  };

  // Force sync evidence data to parent
  const forceSync = () => {
    const listsData = lists.map(l => ({
      _id: l._id,
      name: l.name,
      annexes: l.annexes
    }));
    onChange(listsData);
  };

  // Expose forceSync method via ref
  useImperativeHandle(ref, () => ({
    forceSync
  }));

  // Sync internal state when value prop changes (e.g., when data loads from server)
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const valueString = JSON.stringify(value);
    // Only update if value has actually changed
    if (prevValueStringRef.current !== valueString) {
      prevValueStringRef.current = valueString;
      // Check if value is the new structure (array of lists) or old structure (flat array of annexes)
      if (Array.isArray(value) && value.length > 0 && value[0]._id && value[0].name && value[0].annexes) {
        // New structure: array of lists
        setLists(value);
        // Update expanded state to include all list IDs and expand them all
        setExpanded(prev => {
          const newExpanded = { ...prev };
          value.forEach(list => {
            newExpanded[list._id] = true; // Expand all lists
          });
          return newExpanded;
        });
      } else {
        // Old structure: flat array of annexes, wrap in default list
        const normalized = normalizeList({ _id: 'default', name: 'Client Evidence', annexes: Array.isArray(value) ? value : [] });
        setLists(Array.isArray(normalized) ? normalized : [normalized]);
        // Ensure default is expanded
        setExpanded(prev => ({ ...prev, default: true }));
      }
    }
  }, [value]);

  const uploadFileToCloudinary = async (file) => {
    if (!file) return null;

    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('document', file);

      const response = await apiClient.post('/upload/document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const serverFile = response?.data?.file;
      if (!serverFile) throw new Error('Upload did not return file metadata');

      return {
        fileName: serverFile.originalName || file.name,
        fileSize: serverFile.size || file.size,
        fileType: serverFile.mimetype || file.type,
        fileUrl: serverFile.url,
        filename: serverFile.filename,
        cloudinaryUrl: serverFile.cloudinaryUrl || null,
        cloudinaryPublicId: serverFile.cloudinaryPublicId || null,
        cloudinaryResourceType: serverFile.cloudinaryResourceType || null,
        isServerFile: true,
      };
    } catch (error) {
      console.error('Error uploading file to Cloudinary:', error);
      notifications.show({ title: 'Error', message: 'Failed to upload file.', color: 'red' });
      return null;
    } finally {
      setUploadingFile(false);
    }
  };

  const deleteFileFromCloudinary = async (attachment) => {
    if (!attachment || !attachment.isServerFile || !attachment.filename) return;

    try {
      await apiClient.delete(`/upload/document/${encodeURIComponent(attachment.filename)}`, {
        params: {
          cloudinaryPublicId: attachment.cloudinaryPublicId,
          cloudinaryResourceType: attachment.cloudinaryResourceType,
        },
      });
    } catch (error) {
      console.error('Error deleting file from Cloudinary:', error);
      notifications.show({ title: 'Error', message: 'Failed to delete file.', color: 'red' });
    }
  };

  // Auto-save on changes (with debouncing to prevent infinite loops)
  useEffect(() => {
    if (first.current) {
      if (lists.length) first.current = false;
      return;
    }
    if (!lists.length) return;

    // Save the full lists structure to preserve multiple lists and their names
    const listsData = lists.map(l => ({
      _id: l._id,
      name: l.name,
      annexes: l.annexes
    }));
    const jsonString = JSON.stringify(listsData);

    // Only call onChange if the value actually changed
    if (prevValueRef.current !== jsonString) {
      prevValueRef.current = jsonString;
      onChange(listsData);
    }
  }, [lists, onChange]);

  useEffect(() => {
    localStorage.setItem('evidenceSort', JSON.stringify(sort));
  }, [sort]);

  const edit = (l, a, s, series) => setEditor({
    list: l._id,
    annex: a?._id,
    series: s?._id,
    isSeries: !!series,
    value: { ...(series ? (s || createSeries()) : (a || createAnnex())), pendingFile: null },
    parentAnnex: a
  });

  const apply = async (nextEditor = editor) => {
    const e = nextEditor?.value ? nextEditor : editor;
    if (!e?.value) return;

    const pendingFile = e.value.pendingFile;
    let value = {
      ...e.value,
      pendingFile: undefined,
      document: (e.value.document || pendingFile?.name || '').trim(),
      documentUrl: resolveDocumentUrl(e.value),
      driveFileId: e.value.driveFileId || ''
    };

    // Handle file upload to Cloudinary
    if (pendingFile) {
      const uploadedFile = await uploadFileToCloudinary(pendingFile);
      if (uploadedFile) {
        value = {
          ...value,
          document: (e.value.document || pendingFile.name || '').trim(),
          fileName: uploadedFile.fileName,
          fileType: uploadedFile.fileType,
          fileSize: uploadedFile.fileSize,
          fileUrl: uploadedFile.fileUrl,
          cloudinaryUrl: uploadedFile.cloudinaryUrl,
          cloudinaryPublicId: uploadedFile.cloudinaryPublicId,
          cloudinaryResourceType: uploadedFile.cloudinaryResourceType,
          isServerFile: true,
          filename: uploadedFile.filename,
        };
      }
    }

    const updatedValue = { ...value, documentUrl: resolveDocumentUrl(value), driveFileId: value.driveFileId || '' };
    const list = lists.find(item => item._id === e.list);
    if (!list) return;

    let updatedSeriesRows = [];
    if (value.seriesRows) {
      for (const s of value.seriesRows) {
        let seriesValue = { ...s, pendingFile: undefined, document: (s.document || s.pendingFile?.name || '').trim(), documentUrl: resolveDocumentUrl(s), driveFileId: s.driveFileId || '' };
        if (s.pendingFile) {
          const uploadedFile = await uploadFileToCloudinary(s.pendingFile);
          if (uploadedFile) {
            seriesValue = {
              ...seriesValue,
              document: (s.document || s.pendingFile.name || '').trim(),
              fileName: uploadedFile.fileName,
              fileType: uploadedFile.fileType,
              fileSize: uploadedFile.fileSize,
              fileUrl: uploadedFile.fileUrl,
              cloudinaryUrl: uploadedFile.cloudinaryUrl,
              cloudinaryPublicId: uploadedFile.cloudinaryPublicId,
              cloudinaryResourceType: uploadedFile.cloudinaryResourceType,
              isServerFile: true,
              filename: uploadedFile.filename,
            };
          }
        }
        updatedSeriesRows.push({ ...seriesValue, documentUrl: resolveDocumentUrl(seriesValue), driveFileId: seriesValue.driveFileId || '' });
      }
    }

    let annexes;
    if (e.isSeries) {
      annexes = list.annexes.map(a => {
        if (a._id === e.annex) {
          let seriesRows;
          if (e.series) {
            seriesRows = a.seriesRows.map(s => s._id === e.series ? { ...s, ...updatedValue } : s);
          } else {
            const parentAnnex = e.parentAnnex || a;
            seriesRows = [...(parentAnnex.seriesRows || []), { ...updatedValue }];
          }
          return { ...a, seriesRows };
        }
        return a;
      });
    } else if (e.annex) {
      annexes = list.annexes.map(a => a._id === e.annex ? { ...a, ...updatedValue, seriesRows: updatedSeriesRows } : a);
    } else {
      annexes = [...list.annexes, { ...updatedValue, seriesRows: updatedSeriesRows }];
    }

    // Close the modal first
    setEditor(null);
    // Then update the state
    update(e.list, x => ({ ...x, annexes }));
  };

  const upload = (f) => {
    setEditor(current => current ? { ...current, value: { ...current.value, pendingFile: f || null, document: f?.name || current.value.document || '' } } : current);
  };

  const clearFile = () => {
    setEditor(current => current ? { ...current, value: { ...current.value, pendingFile: null } } : current);
  };

  const removeServerFile = async () => {
    const currentEditor = editor;
    if (!currentEditor) return;

    const attachment = {
      isServerFile: currentEditor.value.isServerFile,
      filename: currentEditor.value.filename,
      cloudinaryPublicId: currentEditor.value.cloudinaryPublicId,
      cloudinaryResourceType: currentEditor.value.cloudinaryResourceType,
    };

    await deleteFileFromCloudinary(attachment);

    setEditor(current => current ? {
      ...current,
      value: {
        ...current.value,
        cloudinaryUrl: null,
        cloudinaryPublicId: null,
        cloudinaryResourceType: null,
        isServerFile: false,
        filename: null,
        fileName: null,
        fileType: null,
        fileSize: null,
        fileUrl: null,
        documentUrl: null,
      }
    } : current);
  };

  const handleSortChange = (listId, value) => {
    if (value) {
      setSort(x => ({ ...x, [listId]: { field: value, direction: (x[listId]?.field === value ? -x[listId].direction : 1) } }));
    } else {
      setSort(x => { const newState = { ...x }; delete newState[listId]; return newState });
    }
  };

  const remove = (l, a, s) => setConfirmModal({
    open: true,
    title: 'Delete row?',
    message: 'This row will be removed.',
    onConfirm: async () => {
      // Delete file from Cloudinary if it exists
      if (s && s.isServerFile) {
        await deleteFileFromCloudinary(s);
      } else if (a && a.isServerFile && !s) {
        await deleteFileFromCloudinary(a);
      }

      update(l._id, x => ({
        ...x,
        annexes: s ? x.annexes.map(q => q._id === a._id ? { ...q, seriesRows: q.seriesRows.filter(r => r._id !== s._id) } : q) : x.annexes.filter(q => q._id !== a._id)
      }));
      setConfirmModal({ open: false, onConfirm: null, title: '', message: '' });
    }
  });

  const sorted = (items, listId, skipSort = false) => {
    if (skipSort) return items.map(a => ({ ...a, seriesRows: (a.seriesRows || []).map(s => ({ ...s })) }));
    const active = sort[listId];
    if (active) {
      if (active.field === 'document') {
        const sortedItems = [...items].map(a => ({
          ...a,
          seriesRows: (a.seriesRows || []).map(s => ({ ...s })).sort((s1, s2) => String(s1.document || '').localeCompare(String(s2.document || ''), undefined, { sensitivity: 'base' }) * active.direction)
        })).sort((a, b) => String(a.document || '').localeCompare(String(b.document || ''), undefined, { sensitivity: 'base' }) * active.direction);
        return sortedItems;
      } else if (active.field === 'annex' || active.field === 'exhibit') {
        // When sorting by annex or exhibit, sort annexes by their value
        // Series rows always stay with their parent annex
        const sortedItems = [...items].map(a => ({ ...a, seriesRows: (a.seriesRows || []).map(s => ({ ...s })) }))
          .sort((a, b) => String(a[active.field] || '').localeCompare(String(b[active.field] || ''), undefined, { sensitivity: 'base' }) * active.direction);
        return sortedItems;
      } else {
        const sortedItems = [...items].map(a => ({ ...a, seriesRows: (a.seriesRows || []).map(s => ({ ...s })) })).sort((a, b) => String(a[active.field] || '').localeCompare(String(b[active.field] || ''), undefined, { sensitivity: 'base' }) * active.direction);
        return sortedItems;
      }
    }
    return items.map(a => ({ ...a, seriesRows: (a.seriesRows || []).map(s => ({ ...s })) }));
  };

  const getSortedData = (list, listId) => {
    const active = sort[listId];
    if (!active) return { ...list, annexes: list.annexes.map(a => ({ ...a, seriesRows: (a.seriesRows || []).map(s => ({ ...s })) })) };
    const sortedAnnexes = sorted(list.annexes, listId);
    return { ...list, annexes: sortedAnnexes.map(a => ({ ...a, seriesRows: (a.seriesRows || []).map(s => ({ ...s })) })) };
  };

  const doc = x => {
    const url = resolveDocumentUrl(x);
    return url ? <a href={url} target="_blank" rel="noreferrer" style={{ color: '#1971c2', textDecoration: 'none' }}>{x.document || 'Open'} <IconDownload size={13} style={{ marginLeft: 4 }} /></a> : x.document || '-';
  };

  const exportEvidenceList = (list) => {
    const csvContent = [
      ['Annex', 'Exhibit', 'Document', 'Witness', 'Original', 'Notes'].join(','),
      ...list.annexes.flatMap(a => [
        [a.annex || '', a.exhibit || '', a.document || '', a.witness || '', a.original || '', a.notes || ''].join(','),
        ...(a.seriesRows || []).map(s => [s.annexSeries || '', s.exhibitSeries || '', s.document || '', s.witness || '', s.original || '', s.notes || ''].join(','))
      ])
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${list.name.replace(/[^a-z0-9]/gi, '_')}_evidence.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={3}>Evidence</Title>
        <Button
          loading={addingList}
          leftSection={<IconPlus size={16} />}
          onClick={() => {
            setAddingList(true);
            const newList = { _id: generateId(), name: `Evidence List ${lists.length + 1}`, annexes: [] };
            setLists(x => [...x, newList]);
            setExpanded(x => ({ ...x, [newList._id]: true }));
            setAddingList(false);
          }}
        >
          Add List
        </Button>
      </Group>

      {lists.map(l => (
        <Card key={l._id} withBorder padding="0">
          <Group p="md" justify="space-between">
            <Group>
              <ActionIcon onClick={() => setExpanded(x => ({ ...x, [l._id]: !x[l._id] }))}>
                {expanded[l._id] ? <IconChevronDown /> : <IconChevronRight />}
              </ActionIcon>
              <TextInput
                value={l.name}
                onChange={e => { const value = e.target.value; update(l._id, x => ({ ...x, name: value })) }}
              />
              <Select
                placeholder="Sort by"
                data={[{ value: 'annex', label: 'Annex' }, { value: 'exhibit', label: 'Exhibit' }, { value: 'document', label: 'Document' }]}
                value={sort[l._id]?.field || null}
                onChange={(value) => handleSortChange(l._id, value)}
                clearable
                size="xs"
                style={{ width: 120 }}
              />
            </Group>
            <Group gap="xs">
              <Button size="xs" onClick={() => edit(l, null, null, false)}>Add Annex/Exhibit</Button>
              <Button size="xs" leftSection={<IconDownload size={14} />} onClick={() => exportEvidenceList(l)}>Export</Button>
              {lists.length > 1 && (
                <ActionIcon
                  color="red"
                  aria-label="Delete evidence list"
                  onClick={() => {
                    if (window.confirm(`Delete ${l.name} and all its rows?`)) {
                      setLists(x => x.filter(y => y._id !== l._id));
                    }
                  }}
                >
                  <IconTrash size={16} />
                </ActionIcon>
              )}
            </Group>
          </Group>

          {expanded[l._id] && (
            <Table striped withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  {['Annex', 'Exhibit', 'Document', 'Witness', 'Original', 'Notes', 'Actions'].map((h, i) => (
                    <Table.Th key={`${h}${i}`} style={i < 2 ? { width: 138, whiteSpace: 'nowrap' } : i === 2 ? { width: '45%', minWidth: 360 } : undefined}>
                      {h}
                    </Table.Th>
                  ))}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {sorted(l.annexes, l._id, false).map((a, annexIndex) => (
                    <Fragment key={a._id}>
                      <Table.Tr>
                        <Table.Td style={{ whiteSpace: 'nowrap' }}>
                          {a.annex || ''}
                        </Table.Td>
                        <Table.Td style={{ whiteSpace: 'nowrap' }}>
                          {a.exhibit || ''}
                        </Table.Td>
                        <Table.Td>
                          {doc(a)}
                        </Table.Td>
                        <Table.Td>{a.witness || ''}</Table.Td>
                        <Table.Td>{a.original || ''}</Table.Td>
                        <Table.Td>{a.notes || ''}</Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            <ActionIcon size="xs" onClick={() => edit(l, a, null, false)}><IconEdit size={14} /></ActionIcon>
                            <ActionIcon size="xs" color="red" onClick={() => remove(l, a, null)}><IconTrash size={14} /></ActionIcon>
                            <ActionIcon size="xs" onClick={() => edit(l, a, null, true)}><IconPlus size={14} /></ActionIcon>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                      {(a.seriesRows || []).map((s, seriesIndex) => (
                        <Table.Tr key={`series-${s._id}-${seriesIndex}`}>
                          <Table.Td style={{ whiteSpace: 'nowrap' }}>
                            {s.annexSeries || ''}
                          </Table.Td>
                          <Table.Td style={{ whiteSpace: 'nowrap' }}>
                            {s.exhibitSeries || ''}
                          </Table.Td>
                          <Table.Td>
                            {doc(s)}
                          </Table.Td>
                          <Table.Td>{s.witness || ''}</Table.Td>
                          <Table.Td>{s.original || ''}</Table.Td>
                          <Table.Td>{s.notes || ''}</Table.Td>
                          <Table.Td>
                            <Group gap="xs">
                              <ActionIcon size="xs" onClick={() => edit(l, a, s, true)}><IconEdit size={14} /></ActionIcon>
                              <ActionIcon size="xs" color="red" onClick={() => remove(l, a, s)}><IconTrash size={14} /></ActionIcon>
                            </Group>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Fragment>
                  ))}
              </Table.Tbody>
            </Table>
          )}
        </Card>
      ))}

      {editor && (
        <Modal
          opened={!!editor}
          onClose={() => setEditor(null)}
          title={editor.isSeries ? (editor.series ? 'Edit Series' : 'Add Series') : editor.annex ? 'Edit Annex/Exhibit' : 'Add Annex/Exhibit'}
          size="xl"
        >
          {editor.isSeries && <Form value={editor.value} isSeries={editor.isSeries} onChange={x => setEditor(current => current ? { ...current, value: x } : current)} onUpload={upload} onClearFile={clearFile} onRemoveServerFile={removeServerFile} />}
          {!editor.isSeries && <Form value={editor.value} isSeries={editor.isSeries} onChange={x => setEditor(current => current ? { ...current, value: x } : current)} onUpload={upload} onClearFile={clearFile} onRemoveServerFile={removeServerFile} />}
          {!editor.isSeries && (
            <Stack mt="md">
              <Title order={4}>Series</Title>
              {editor.value?.seriesRows?.map((s, i) => (
                s ? (
                  <Card key={`series-card-${s._id}-${i}`} withBorder padding="xs" mb="xs">
                    <Group justify="space-between" mb="xs">
                      <Text size="sm" fw={500}>Series {i + 1}</Text>
                      <ActionIcon size="xs" color="red" onClick={() => setEditor(current => current ? { ...current, value: { ...current.value, seriesRows: current.value.seriesRows.filter((_, idx) => idx !== i) } } : current)}>
                        <IconTrash size={12} />
                      </ActionIcon>
                    </Group>
                    <Stack gap="xs">
                      <Group gap="xs">
                        <TextInput label="Annex Series" maxLength={10} value={s.annexSeries || ''} onChange={e => updateSeriesRow(i, 'annexSeries', e.currentTarget.value)} style={{ flex: 1 }} />
                        <TextInput label="Exhibit Series" maxLength={10} value={s.exhibitSeries || ''} onChange={e => updateSeriesRow(i, 'exhibitSeries', e.currentTarget.value)} style={{ flex: 1 }} />
                      </Group>
                      <TextInput label="Document" value={s.document || ''} onChange={e => updateSeriesRow(i, 'document', e.currentTarget.value)} />
                      <Group gap="xs">
                        <FileInput
                          label="Upload document"
                          value={s.pendingFile || null}
                          onChange={(file) => updateSeriesRow(i, 'pendingFile', file)}
                          style={{ flex: 1 }}
                        />
                        {s.pendingFile && (
                          <ActionIcon onClick={() => updateSeriesRow(i, 'pendingFile', null)} variant="light" color="red" size="input-sm">
                            <IconX size={16} />
                          </ActionIcon>
                        )}
                      </Group>
                      {(s.cloudinaryUrl || s.documentUrl) && (
                        <Group gap="xs">
                          <Text size="sm" c="dimmed">File uploaded: {s.fileName || s.document}</Text>
                          <ActionIcon onClick={() => {
                            // Delete file from Cloudinary
                            if (s.isServerFile && s.filename) {
                              deleteFileFromCloudinary(s);
                            }
                            updateSeriesRow(i, 'cloudinaryUrl', null);
                            updateSeriesRow(i, 'cloudinaryPublicId', null);
                            updateSeriesRow(i, 'cloudinaryResourceType', null);
                            updateSeriesRow(i, 'isServerFile', false);
                            updateSeriesRow(i, 'filename', null);
                            updateSeriesRow(i, 'fileName', null);
                            updateSeriesRow(i, 'fileType', null);
                            updateSeriesRow(i, 'fileSize', null);
                            updateSeriesRow(i, 'fileUrl', null);
                            updateSeriesRow(i, 'documentUrl', null);
                          }} variant="light" color="red" size="input-sm">
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Group>
                      )}
                      <TextInput label="Witness" value={s.witness || ''} onChange={e => updateSeriesRow(i, 'witness', e.currentTarget.value)} />
                      <TextInput label="Original" value={s.original || ''} onChange={e => updateSeriesRow(i, 'original', e.currentTarget.value)} />
                      <Textarea label="Notes" value={s.notes || ''} onChange={e => updateSeriesRow(i, 'notes', e.currentTarget.value)} />
                    </Stack>
                  </Card>
                ) : null
              ))}
              <Button size="xs" leftSection={<IconPlus size={14} />} onClick={() => setEditor(current => current ? { ...current, value: { ...current.value, seriesRows: [...(current.value.seriesRows || []), createSeries()] } } : current)}>Add Series</Button>
            </Stack>
          )}
          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={() => setEditor(null)}>Cancel</Button>
            <Button onClick={() => apply()} loading={uploadingFile}>Save</Button>
          </Group>
        </Modal>
      )}

      {/* Custom Confirm Modal */}
      <Modal opened={confirmModal.open} onClose={() => setConfirmModal({ open: false, onConfirm: null, title: '', message: '' })} title={confirmModal.title} centered>
        <Stack gap="md">
          <Text>{confirmModal.message}</Text>
          <Group justify="flex-end">
            <Button variant="subtle" onClick={() => setConfirmModal({ open: false, onConfirm: null, title: '', message: '' })}>Cancel</Button>
            <Button color="red" onClick={confirmModal.onConfirm}>Delete</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
};

const EvidenceList = forwardRef(EvidenceListComponent);
EvidenceList.displayName = 'EvidenceList';

export default EvidenceList;
