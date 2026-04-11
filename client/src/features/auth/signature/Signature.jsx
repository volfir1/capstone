import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Button, FileButton, Group, Paper, Slider, Stack, Tabs, Text, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';

const PEN_CURSOR = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M3 21l6-2L20 8a2 2 0 0 0-3-3L6 16z' fill='%23222' stroke='white' stroke-width='1'/%3E%3Ccircle cx='3' cy='21' r='1.5' fill='%23555'/%3E%3C/svg%3E") 3 21, crosshair`;

const SIGNATURE_STYLES = [
  { value: 'classic', label: 'Classic', font: '"Brush Script MT", "Segoe Script", cursive' },
  { value: 'formal', label: 'Formal', font: '"Lucida Handwriting", "Segoe Script", cursive' },
  { value: 'bold', label: 'Bold', font: '"Segoe Print", "Bradley Hand", cursive' },
];

const createCanvas = (width, height) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
};

const trimCanvas = (canvas) => {
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  const { data } = ctx.getImageData(0, 0, width, height);
  let top = null;
  let left = null;
  let right = null;
  let bottom = null;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[(y * width + x) * 4 + 3] !== 0) {
        if (top === null) top = y;
        if (left === null || x < left) left = x;
        if (right === null || x > right) right = x;
        bottom = y;
      }
    }
  }

  if (top === null) return null;

  const trimmed = createCanvas(right - left + 1, bottom - top + 1);
  trimmed.getContext('2d').drawImage(
    canvas,
    left,
    top,
    right - left + 1,
    bottom - top + 1,
    0,
    0,
    right - left + 1,
    bottom - top + 1,
  );
  return trimmed;
};

const fileToDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(new Error('Failed to read signature file'));
  reader.readAsDataURL(file);
});

export default function Signature({ onSave, initialUrl = null, defaultTypedName = '' }) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const drawing = useRef(false);
  const lastPoint = useRef(null);
  const [lineWidth, setLineWidth] = useState(2);
  const [isEditing, setIsEditing] = useState(false);
  const [savedUrl, setSavedUrl] = useState(null);
  const [mode, setMode] = useState('draw');
  const [saving, setSaving] = useState(false);
  const [typedName, setTypedName] = useState(defaultTypedName);
  const [typedStyle, setTypedStyle] = useState(SIGNATURE_STYLES[0].value);
  const [uploadedDataUrl, setUploadedDataUrl] = useState(null);

  useEffect(() => {
    setTypedName(defaultTypedName);
  }, [defaultTypedName]);

  useEffect(() => {
    if (initialUrl) {
      setSavedUrl(initialUrl);
      setIsEditing(false);
    } else {
      setSavedUrl(null);
      setIsEditing(true);
    }
  }, [initialUrl]);

  useEffect(() => {
    if (!isEditing || mode !== 'draw') return undefined;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;

    const ctx = canvas.getContext('2d');
    ctx.scale(ratio, ratio);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1a1a1a';
    ctx.fillStyle = '#1a1a1a';
    ctx.lineWidth = lineWidth;
    ctxRef.current = ctx;

    const handleResize = () => {
      const snapshot = canvas.toDataURL();
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      ctx.scale(ratio, ratio);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#1a1a1a';
      ctx.fillStyle = '#1a1a1a';
      ctx.lineWidth = lineWidth;
      const image = new Image();
      image.onload = () => ctx.drawImage(image, 0, 0, width, height);
      image.src = snapshot;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isEditing, lineWidth, mode]);

  const activeTypedStyle = useMemo(
    () => SIGNATURE_STYLES.find((item) => item.value === typedStyle) || SIGNATURE_STYLES[0],
    [typedStyle],
  );

  const getPoint = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const src = event.touches?.[0] ?? event;
    return {
      x: src.clientX - rect.left,
      y: src.clientY - rect.top,
    };
  };

  const midPoint = (pointA, pointB) => ({
    x: (pointA.x + pointB.x) / 2,
    y: (pointA.y + pointB.y) / 2,
  });

  const handlePointerDown = (event) => {
    event.preventDefault();
    drawing.current = true;
    const point = getPoint(event);
    lastPoint.current = point;
    const ctx = ctxRef.current;
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    ctx.arc(point.x, point.y, ctx.lineWidth / 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  };

  const handlePointerMove = (event) => {
    if (!drawing.current) return;
    event.preventDefault();
    const ctx = ctxRef.current;
    if (!ctx) return;

    const point = getPoint(event);
    const mid = midPoint(lastPoint.current, point);
    ctx.quadraticCurveTo(lastPoint.current.x, lastPoint.current.y, mid.x, mid.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(mid.x, mid.y);
    lastPoint.current = point;
  };

  const handlePointerUp = () => {
    if (!drawing.current) return;
    drawing.current = false;
    const ctx = ctxRef.current;
    if (!ctx) return;
    if (lastPoint.current) {
      ctx.lineTo(lastPoint.current.x, lastPoint.current.y);
      ctx.stroke();
    }
    ctx.closePath();
    lastPoint.current = null;
  };

  const clearDrawnSignature = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    notifications.show({ title: 'Cleared', message: 'Signature cleared', autoClose: 2000 });
  };

  const buildTypedSignatureDataUrl = () => {
    const name = typedName.trim();
    if (!name) return null;

    const canvas = createCanvas(900, 260);
    const ctx = canvas.getContext('2d');
    const fontFamily = activeTypedStyle.font;
    let fontSize = 120;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#1a1a1a';

    do {
      ctx.font = `${fontSize}px ${fontFamily}`;
      fontSize -= 2;
    } while (fontSize > 48 && ctx.measureText(name).width > 760);

    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.fillText(name, canvas.width / 2, canvas.height / 2);
    const trimmed = trimCanvas(canvas);
    return trimmed ? trimmed.toDataURL('image/png') : null;
  };

  const getSignatureDataUrl = () => {
    if (mode === 'draw') {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const trimmed = trimCanvas(canvas);
      return trimmed ? trimmed.toDataURL('image/png') : null;
    }

    if (mode === 'type') {
      return buildTypedSignatureDataUrl();
    }

    if (mode === 'upload') {
      return uploadedDataUrl;
    }

    return null;
  };

  const handleUploadedFile = async (file) => {
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      notifications.show({ title: 'Invalid file', message: 'Use JPG, PNG, or WebP for signatures.', color: 'red' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      notifications.show({ title: 'File too large', message: 'Signature image must be under 5 MB.', color: 'red' });
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      setUploadedDataUrl(dataUrl);
      notifications.show({ title: 'Loaded', message: 'Signature image ready to save.', autoClose: 2000 });
    } catch (error) {
      notifications.show({ title: 'Upload failed', message: error.message || 'Could not load signature image.', color: 'red' });
    }
  };

  const save = async (download = false) => {
    const dataUrl = getSignatureDataUrl();
    if (!dataUrl) {
      notifications.show({ title: 'No signature', message: 'Create, type, or upload a signature first.', color: 'red' });
      return;
    }

    try {
      setSaving(true);
      let finalUrl = dataUrl;

      if (typeof onSave === 'function') {
        const result = await onSave(dataUrl);
        if (typeof result === 'string' && result.trim()) {
          finalUrl = result;
        }
        notifications.show({ title: 'Saved', message: 'Signature captured', autoClose: 2000 });
      } else if (download) {
        const anchor = Object.assign(document.createElement('a'), {
          href: dataUrl,
          download: 'signature.png',
        });
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        notifications.show({ title: 'Downloaded', message: 'Signature downloaded', autoClose: 2000 });
      } else {
        navigator.clipboard.writeText(dataUrl).catch(() => {});
        notifications.show({ title: 'Copied', message: 'Signature copied to clipboard', autoClose: 2000 });
      }

      setSavedUrl(finalUrl);
      setIsEditing(false);
    } catch (error) {
      // onSave already surfaces a detailed notification in calling contexts.
      if (!onSave) {
        notifications.show({ title: 'Save failed', message: error.message || 'Could not save signature.', color: 'red' });
      }
    } finally {
      setSaving(false);
    }
  };

  const startEditing = () => {
    setIsEditing(true);
  };

  const renderModeContent = () => {
    if (mode === 'draw') {
      return (
        <Stack gap="md">
          <Text size="sm">Draw your signature below</Text>
          <Box
            style={{
              border: '1px solid #dee2e6',
              borderRadius: 6,
              height: 220,
              background: '#fff',
              backgroundImage: 'linear-gradient(transparent calc(100% - 1px), #e9ecef calc(100% - 1px))',
              backgroundSize: '100% 55px',
              overflow: 'hidden',
              touchAction: 'none',
            }}
          >
            <canvas
              ref={canvasRef}
              style={{
                width: '100%',
                height: '100%',
                display: 'block',
                cursor: PEN_CURSOR,
                touchAction: 'none',
              }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              onTouchStart={(event) => event.preventDefault()}
            />
          </Box>
          <Group justify="space-between" align="center">
            <Group>
              <Button color="gray" variant="outline" size="sm" onClick={clearDrawnSignature}>Clear</Button>
            </Group>
            <Box style={{ width: 180 }}>
              <Text size="xs" c="dimmed" mb={4}>Stroke width: {lineWidth}px</Text>
              <Slider min={1} max={8} step={0.5} value={lineWidth} onChange={setLineWidth} />
            </Box>
          </Group>
        </Stack>
      );
    }

    if (mode === 'type') {
      const previewUrl = buildTypedSignatureDataUrl();

      return (
        <Stack gap="md">
          <TextInput
            label="Type your name"
            placeholder="Enter the name to turn into a signature"
            value={typedName}
            onChange={(event) => setTypedName(event.currentTarget.value)}
          />
          <Group gap="xs">
            {SIGNATURE_STYLES.map((style) => (
              <Button
                key={style.value}
                variant={typedStyle === style.value ? 'filled' : 'outline'}
                size="xs"
                onClick={() => setTypedStyle(style.value)}
              >
                {style.label}
              </Button>
            ))}
          </Group>
          <Paper withBorder p="md" radius="md" style={{ minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa' }}>
            {previewUrl ? (
              <img src={previewUrl} alt="Typed signature preview" style={{ maxWidth: '100%', maxHeight: 84, objectFit: 'contain' }} />
            ) : (
              <Text size="sm" c="dimmed">Enter a name to generate a signature preview.</Text>
            )}
          </Paper>
        </Stack>
      );
    }

    return (
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Text size="sm">Upload a transparent signature image or a clean photo of your signature.</Text>
          <FileButton onChange={handleUploadedFile} accept="image/png,image/jpeg,image/webp">
            {(props) => <Button {...props} variant="outline" size="sm">Choose image</Button>}
          </FileButton>
        </Group>
        <Paper withBorder p="md" radius="md" style={{ minHeight: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa' }}>
          {uploadedDataUrl ? (
            <img src={uploadedDataUrl} alt="Uploaded signature preview" style={{ maxWidth: '100%', maxHeight: 100, objectFit: 'contain' }} />
          ) : (
            <Text size="sm" c="dimmed">No uploaded signature yet.</Text>
          )}
        </Paper>
      </Stack>
    );
  };

  if (!isEditing) {
    return (
      <Paper p="md" shadow="sm" style={{ width: '100%', maxWidth: 800 }}>
        <Stack gap="xs">
          <Text size="sm">Signature</Text>
          <Box style={{ border: '1px solid #e9ecef', borderRadius: 4, height: 100, background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {savedUrl
              ? <img src={savedUrl} alt="Saved signature" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
              : <Text size="sm" c="dimmed">No signature yet</Text>}
          </Box>
          <Group justify="flex-end">
            <Button variant="outline" size="xs" onClick={startEditing}>
              {savedUrl ? 'Edit Signature' : '+ New Signature'}
            </Button>
          </Group>
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper p="md" shadow="sm" style={{ width: '100%', maxWidth: 800 }}>
      <Stack gap="md">
        <Group justify="space-between">
          <Text size="sm" fw={600}>Create your signature</Text>
          <Button variant="subtle" size="xs" color="gray" onClick={() => setIsEditing(false)}>
            Cancel
          </Button>
        </Group>

        <Tabs value={mode} onChange={(value) => setMode(value || 'draw')}>
          <Tabs.List>
            <Tabs.Tab value="draw">Draw</Tabs.Tab>
            <Tabs.Tab value="type">Type</Tabs.Tab>
            <Tabs.Tab value="upload">Upload</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value={mode} pt="md">
            {renderModeContent()}
          </Tabs.Panel>
        </Tabs>

        <Group justify="space-between" align="center">
          <Text size="xs" c="dimmed">
            Saved signatures are reused for approvals and exported documents.
          </Text>
          <Group>
            <Button size="sm" onClick={() => save(false)} loading={saving}>
              Save
            </Button>
            <Button size="sm" onClick={() => save(true)} variant="light" loading={saving}>
              Save & Download
            </Button>
          </Group>
        </Group>
      </Stack>
    </Paper>
  );
}
