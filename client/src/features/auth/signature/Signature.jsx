import React, { useRef, useState, useEffect } from 'react';
import { Button, Group, Paper, Stack, Text, Slider } from '@mantine/core';
import { notifications } from '@mantine/notifications';

// Smooth cursor SVG as a data URL — a clean pen nib
const PEN_CURSOR = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M3 21l6-2L20 8a2 2 0 0 0-3-3L6 16z' fill='%23222' stroke='white' stroke-width='1'/%3E%3Ccircle cx='3' cy='21' r='1.5' fill='%23555'/%3E%3C/svg%3E") 3 21, crosshair`;

export default function Signature({ onSave, initialUrl = null }) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const drawing = useRef(false);
  // Store last two points for bezier smoothing
  const lastPoint = useRef(null);
  const lastMidPoint = useRef(null);
  const [lineWidth, setLineWidth] = useState(2);
  const [isEditing, setIsEditing] = useState(false);
  const [savedUrl, setSavedUrl] = useState(null);

  useEffect(() => {
    if (initialUrl) {
      setSavedUrl(initialUrl);
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  }, [initialUrl]);

  useEffect(() => {
    if (!isEditing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const ctx = canvas.getContext('2d');
    ctx.scale(ratio, ratio);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = lineWidth;
    ctxRef.current = ctx;

    const handleResize = () => {
      const data = canvas.toDataURL();
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = w * ratio;
      canvas.height = h * ratio;
      ctx.scale(ratio, ratio);
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, w, h);
      img.src = data;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isEditing, lineWidth]);

  const getPoint = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const src = e.touches?.[0] ?? e;
    return {
      x: src.clientX - rect.left,
      y: src.clientY - rect.top,
    };
  };

  const midPoint = (p1, p2) => ({
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  });

  const handlePointerDown = (e) => {
    e.preventDefault();
    drawing.current = true;
    const pt = getPoint(e);
    lastPoint.current = pt;
    lastMidPoint.current = pt;
    const ctx = ctxRef.current;
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(pt.x, pt.y);
    // Draw a dot for single taps/clicks
    ctx.arc(pt.x, pt.y, ctx.lineWidth / 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(pt.x, pt.y);
  };

  const handlePointerMove = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = ctxRef.current;
    if (!ctx) return;

    const pt = getPoint(e);
    const mid = midPoint(lastPoint.current, pt);

    // Quadratic bezier through midpoints = smooth, no jagged corners
    ctx.quadraticCurveTo(
      lastPoint.current.x,
      lastPoint.current.y,
      mid.x,
      mid.y
    );
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(mid.x, mid.y);

    lastMidPoint.current = mid;
    lastPoint.current = pt;
  };

  const handlePointerUp = (e) => {
    if (!drawing.current) return;
    drawing.current = false;
    const ctx = ctxRef.current;
    if (!ctx) return;
    // Finish stroke to last point
    if (lastPoint.current) {
      ctx.lineTo(lastPoint.current.x, lastPoint.current.y);
      ctx.stroke();
    }
    ctx.closePath();
    lastPoint.current = null;
    lastMidPoint.current = null;
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    notifications.show({ title: 'Cleared', message: 'Signature cleared', autoClose: 2000 });
  };

  const getTrimmedCanvas = (canvas) => {
    const { width: w, height: h } = canvas;
    const { data } = canvas.getContext('2d').getImageData(0, 0, w, h);
    let top = null, left = null, right = null, bottom = null;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (data[(y * w + x) * 4 + 3] !== 0) {
          if (top === null) top = y;
          if (left === null || x < left) left = x;
          if (right === null || x > right) right = x;
          bottom = y;
        }
      }
    }
    if (top === null) return null;
    const trimW = right - left + 1;
    const trimH = bottom - top + 1;
    const trimmed = document.createElement('canvas');
    trimmed.width = trimW;
    trimmed.height = trimH;
    trimmed.getContext('2d').drawImage(canvas, left, top, trimW, trimH, 0, 0, trimW, trimH);
    return trimmed;
  };

  const save = (download = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const trimmed = getTrimmedCanvas(canvas);
    if (!trimmed) {
      notifications.show({ title: 'No signature', message: 'Please sign before saving', color: 'red' });
      return;
    }
    const dataUrl = trimmed.toDataURL('image/png');
    setSavedUrl(dataUrl);
    setIsEditing(false);

    if (typeof onSave === 'function') {
      onSave(dataUrl);
      notifications.show({ title: 'Saved', message: 'Signature captured', autoClose: 2000 });
    } else if (download) {
      const a = Object.assign(document.createElement('a'), { href: dataUrl, download: 'signature.png' });
      document.body.appendChild(a);
      a.click();
      a.remove();
      notifications.show({ title: 'Downloaded', message: 'Signature downloaded', autoClose: 2000 });
    } else {
      navigator.clipboard.writeText(dataUrl).catch(() => {});
      notifications.show({ title: 'Copied', message: 'Signature copied to clipboard', autoClose: 2000 });
    }
  };

  const startEditing = () => {
    setSavedUrl(null);
    setIsEditing(true);
  };

  // ── Collapsed view ──
  if (!isEditing) {
    return (
      <Paper p="md" shadow="sm" style={{ width: '100%', maxWidth: 800 }}>
        <Stack gap="xs">
          <Text size="sm">Signature</Text>
          <div style={{ border: '1px solid #e9ecef', borderRadius: 4, height: 100, background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {savedUrl
              ? <img src={savedUrl} alt="Saved signature" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
              : <Text size="sm" c="dimmed">No signature yet</Text>
            }
          </div>
          <Group position="right">
            <Button variant="outline" size="xs" onClick={startEditing}>
              {savedUrl ? 'Edit Signature' : '+ New Signature'}
            </Button>
          </Group>
        </Stack>
      </Paper>
    );
  }

  // ── Drawing view ──
  return (
    <Paper p="md" shadow="sm" style={{ width: '100%', maxWidth: 800 }}>
      <Stack>
        <Group position="apart">
          <Text size="sm">Draw your signature below</Text>
          <Button variant="subtle" size="xs" color="gray" onClick={() => setIsEditing(false)}>
            Cancel
          </Button>
        </Group>

        <div
          style={{
            border: '1px solid #dee2e6',
            borderRadius: 6,
            height: 220,
            background: '#fff',
            // Subtle ruled-line feel for signature context
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
            onTouchStart={(e) => e.preventDefault()}
          />
        </div>

        <Group position="apart" align="center">
          <Group>
            <Button color="gray" variant="outline" size="sm" onClick={clear}>Clear</Button>
            <Button size="sm" onClick={() => save(false)}>Save</Button>
            <Button size="sm" onClick={() => save(true)} variant="light">Save & Download</Button>
          </Group>
          <div style={{ width: 180 }}>
            <Text size="xs" c="dimmed" mb={4}>Stroke width: {lineWidth}px</Text>
            <Slider min={1} max={8} step={0.5} value={lineWidth} onChange={setLineWidth} />
          </div>
        </Group>
      </Stack>
    </Paper>
  );
}