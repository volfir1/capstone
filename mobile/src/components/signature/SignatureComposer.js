import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  PanResponder,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import Svg, { Path, Rect, Text as SvgText } from 'react-native-svg';

const PRIMARY_BROWN = '#7D5A3B';
const PRIMARY_GOLD = '#C4AB7D';
const CHARCOAL = '#2C2C2C';
const MUTED_OLIVE = '#6B6B5A';
const DRAW_WIDTH = 320;
const DRAW_HEIGHT = 180;
const TYPED_WIDTH = 320;
const TYPED_HEIGHT = 120;

const SIGNATURE_STYLES = [
  { value: 'classic', label: 'Classic', fontFamily: 'serif', fontStyle: 'italic' },
  { value: 'formal', label: 'Formal', fontFamily: 'sans-serif', fontStyle: 'italic' },
  { value: 'bold', label: 'Bold', fontFamily: 'sans-serif', fontStyle: 'italic', fontWeight: '700' },
];

const inferMimeFromUri = (uri = '') => {
  const clean = String(uri).split('?')[0].toLowerCase();
  if (clean.endsWith('.png')) return 'image/png';
  if (clean.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
};

const svgRefToDataUrl = (svgRef) =>
  new Promise((resolve, reject) => {
    if (!svgRef?.current || typeof svgRef.current.toDataURL !== 'function') {
      reject(new Error('Signature export is not supported on this device yet.'));
      return;
    }

    try {
      svgRef.current.toDataURL((base64) => {
        if (!base64) {
          reject(new Error('Unable to generate image data from signature.'));
          return;
        }
        resolve(`data:image/png;base64,${base64}`);
      });
    } catch (error) {
      reject(error);
    }
  });

export default function SignatureComposer({
  onSave,
  initialUrl = null,
  defaultTypedName = '',
  onClose,
}) {
  const drawSvgRef = useRef(null);
  const typedSvgRef = useRef(null);
  const activePathRef = useRef('');

  const [isEditing, setIsEditing] = useState(false);
  const [savedUrl, setSavedUrl] = useState(null);
  const [mode, setMode] = useState('draw');
  const [saving, setSaving] = useState(false);

  const [lineWidth, setLineWidth] = useState(2);
  const [drawPaths, setDrawPaths] = useState([]);

  const [typedName, setTypedName] = useState(defaultTypedName);
  const [typedStyle, setTypedStyle] = useState(SIGNATURE_STYLES[0].value);

  const [uploadedDataUrl, setUploadedDataUrl] = useState(null);
  const [uploadedPreviewUrl, setUploadedPreviewUrl] = useState('');

  useEffect(() => {
    setTypedName(defaultTypedName || '');
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

  const currentTypedStyle = useMemo(
    () => SIGNATURE_STYLES.find((item) => item.value === typedStyle) || SIGNATURE_STYLES[0],
    [typedStyle],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => isEditing && mode === 'draw',
        onMoveShouldSetPanResponder: () => isEditing && mode === 'draw',
        onPanResponderGrant: (event) => {
          const { locationX, locationY } = event.nativeEvent;
          const startPath = `M ${locationX.toFixed(2)} ${locationY.toFixed(2)}`;
          activePathRef.current = startPath;
          setDrawPaths((prev) => [...prev, startPath]);
        },
        onPanResponderMove: (event) => {
          if (!activePathRef.current) return;
          const { locationX, locationY } = event.nativeEvent;
          activePathRef.current += ` L ${locationX.toFixed(2)} ${locationY.toFixed(2)}`;
          const currentPath = activePathRef.current;

          setDrawPaths((prev) => {
            if (!prev.length) return prev;
            const next = [...prev];
            next[next.length - 1] = currentPath;
            return next;
          });
        },
        onPanResponderRelease: () => {
          activePathRef.current = '';
        },
        onPanResponderTerminate: () => {
          activePathRef.current = '';
        },
      }),
    [isEditing, mode],
  );

  const clearDrawnSignature = () => {
    setDrawPaths([]);
    activePathRef.current = '';
  };

  const pickUploadedFile = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
        base64: true,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const file = result.assets[0];
      if (file.fileSize && file.fileSize > 5 * 1024 * 1024) {
        Alert.alert('File too large', 'Signature image must be under 5 MB.');
        return;
      }

      const mimeType = file.mimeType || inferMimeFromUri(file.uri);
      let base64 = file.base64;

      if (!base64) {
        base64 = await FileSystem.readAsStringAsync(file.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }

      if (!base64) {
        throw new Error('Could not read the selected image.');
      }

      setUploadedDataUrl(`data:${mimeType};base64,${base64}`);
      setUploadedPreviewUrl(file.uri || '');
    } catch (error) {
      Alert.alert('Upload failed', error.message || 'Could not load the selected image.');
    }
  };

  const getSignatureDataUrl = async () => {
    if (mode === 'draw') {
      if (!drawPaths.length) {
        return null;
      }
      return svgRefToDataUrl(drawSvgRef);
    }

    if (mode === 'type') {
      if (!typedName.trim()) {
        return null;
      }
      return svgRefToDataUrl(typedSvgRef);
    }

    if (mode === 'upload') {
      return uploadedDataUrl;
    }

    return null;
  };

  const handleSave = async () => {
    try {
      const dataUrl = await getSignatureDataUrl();
      if (!dataUrl) {
        Alert.alert('No signature', 'Create, type, or upload a signature first.');
        return;
      }

      setSaving(true);
      let finalUrl = dataUrl;

      if (typeof onSave === 'function') {
        const result = await onSave(dataUrl);
        if (typeof result === 'string' && result.trim()) {
          finalUrl = result;
        }
      }

      setSavedUrl(finalUrl);
      setIsEditing(false);
    } catch (error) {
      Alert.alert('Save failed', error.message || 'Could not save the signature.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (savedUrl) {
      setIsEditing(false);
      return;
    }

    if (typeof onClose === 'function') {
      onClose();
    }
  };

  const renderModeButton = (value, label) => (
    <TouchableOpacity
      key={value}
      style={[styles.modeButton, mode === value && styles.modeButtonActive]}
      onPress={() => setMode(value)}
    >
      <Text style={[styles.modeButtonText, mode === value && styles.modeButtonTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  const renderDrawMode = () => (
    <View style={styles.modePanel}>
      <Text style={styles.helperText}>Draw your signature below.</Text>
      <View style={styles.canvasContainer} {...panResponder.panHandlers}>
        <Svg ref={drawSvgRef} width={DRAW_WIDTH} height={DRAW_HEIGHT}>
          <Rect x="0" y="0" width={DRAW_WIDTH} height={DRAW_HEIGHT} fill="#fff" />
          {drawPaths.map((path, index) => (
            <Path
              key={`${index}-${lineWidth}`}
              d={path}
              fill="none"
              stroke="#1a1a1a"
              strokeWidth={lineWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </Svg>
      </View>
      <View style={styles.rowBetween}>
        <TouchableOpacity style={styles.smallOutlineBtn} onPress={clearDrawnSignature}>
          <Text style={styles.smallOutlineBtnText}>Clear</Text>
        </TouchableOpacity>
        <View style={styles.strokeControl}>
          <Text style={styles.strokeLabel}>Stroke: {lineWidth.toFixed(1)}px</Text>
          <View style={styles.strokeButtons}>
            <TouchableOpacity
              style={styles.strokeBtn}
              onPress={() => setLineWidth((prev) => Math.max(1, Number((prev - 0.5).toFixed(1))))}
            >
              <Text style={styles.strokeBtnText}>-</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.strokeBtn}
              onPress={() => setLineWidth((prev) => Math.min(8, Number((prev + 0.5).toFixed(1))))}
            >
              <Text style={styles.strokeBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  const renderTypeMode = () => (
    <View style={styles.modePanel}>
      <TextInput
        style={styles.textInput}
        placeholder="Enter the name to turn into a signature"
        placeholderTextColor="#999"
        value={typedName}
        onChangeText={setTypedName}
      />
      <View style={styles.modeRow}>
        {SIGNATURE_STYLES.map((style) => (
          <TouchableOpacity
            key={style.value}
            style={[styles.styleBtn, typedStyle === style.value && styles.styleBtnActive]}
            onPress={() => setTypedStyle(style.value)}
          >
            <Text style={[styles.styleBtnText, typedStyle === style.value && styles.styleBtnTextActive]}>{style.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.typedPreviewBox}>
        {typedName.trim() ? (
          <Svg ref={typedSvgRef} width={TYPED_WIDTH} height={TYPED_HEIGHT}>
            <Rect x="0" y="0" width={TYPED_WIDTH} height={TYPED_HEIGHT} fill="#fff" />
            <SvgText
              x={TYPED_WIDTH / 2}
              y={TYPED_HEIGHT / 2 + 16}
              textAnchor="middle"
              fill="#1a1a1a"
              fontSize={64}
              fontFamily={currentTypedStyle.fontFamily}
              fontStyle={currentTypedStyle.fontStyle}
              fontWeight={currentTypedStyle.fontWeight || '400'}
            >
              {typedName.trim()}
            </SvgText>
          </Svg>
        ) : (
          <Text style={styles.emptyText}>Enter a name to generate a signature preview.</Text>
        )}
      </View>
    </View>
  );

  const renderUploadMode = () => (
    <View style={styles.modePanel}>
      <TouchableOpacity style={styles.uploadButton} onPress={pickUploadedFile}>
        <Text style={styles.uploadButtonText}>Choose image</Text>
      </TouchableOpacity>
      <View style={styles.uploadPreviewBox}>
        {uploadedPreviewUrl ? (
          <Image source={{ uri: uploadedPreviewUrl }} style={styles.uploadPreviewImage} resizeMode="contain" />
        ) : (
          <Text style={styles.emptyText}>No uploaded signature yet.</Text>
        )}
      </View>
    </View>
  );

  if (!isEditing) {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Signature</Text>
        <View style={styles.savedPreviewBox}>
          {savedUrl ? (
            <Image source={{ uri: savedUrl }} style={styles.savedPreviewImage} resizeMode="contain" />
          ) : (
            <Text style={styles.emptyText}>No signature yet.</Text>
          )}
        </View>
        <View style={styles.footerButtons}>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => setIsEditing(true)}>
            <Text style={styles.secondaryButtonText}>{savedUrl ? 'Edit Signature' : 'New Signature'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Create your signature</Text>
        <TouchableOpacity onPress={handleCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.modeRow}>
        {renderModeButton('draw', 'Draw')}
        {renderModeButton('type', 'Type')}
        {renderModeButton('upload', 'Upload')}
      </View>

      {mode === 'draw' && renderDrawMode()}
      {mode === 'type' && renderTypeMode()}
      {mode === 'upload' && renderUploadMode()}

      <View style={styles.footerButtons}>
        <Text style={styles.footnote}>Saved signatures are reused for approvals and exported documents.</Text>
        <TouchableOpacity style={[styles.primaryButton, saving && styles.buttonDisabled]} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.primaryButtonText}>Save Signature</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E6E1D7',
    padding: 14,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: CHARCOAL,
  },
  cancelText: {
    fontSize: 13,
    color: MUTED_OLIVE,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  modeButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D8CFBF',
    backgroundColor: '#fff',
  },
  modeButtonActive: {
    backgroundColor: PRIMARY_BROWN,
    borderColor: PRIMARY_BROWN,
  },
  modeButtonText: {
    fontSize: 13,
    color: PRIMARY_BROWN,
    fontWeight: '600',
  },
  modeButtonTextActive: {
    color: '#fff',
  },
  modePanel: {
    gap: 10,
  },
  helperText: {
    fontSize: 12,
    color: MUTED_OLIVE,
  },
  canvasContainer: {
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#DDD4C4',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  smallOutlineBtn: {
    borderWidth: 1,
    borderColor: '#CFC7B8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  smallOutlineBtnText: {
    fontSize: 12,
    color: MUTED_OLIVE,
    fontWeight: '600',
  },
  strokeControl: {
    alignItems: 'flex-end',
    gap: 6,
  },
  strokeLabel: {
    fontSize: 11,
    color: MUTED_OLIVE,
  },
  strokeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  strokeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#D8CFBF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  strokeBtnText: {
    fontSize: 18,
    color: PRIMARY_BROWN,
    fontWeight: '700',
    marginTop: -1,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D8CFBF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: CHARCOAL,
  },
  styleBtn: {
    borderWidth: 1,
    borderColor: '#D8CFBF',
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  styleBtnActive: {
    borderColor: PRIMARY_BROWN,
    backgroundColor: '#F7F1E7',
  },
  styleBtnText: {
    fontSize: 12,
    color: MUTED_OLIVE,
    fontWeight: '600',
  },
  styleBtnTextActive: {
    color: PRIMARY_BROWN,
  },
  typedPreviewBox: {
    borderWidth: 1,
    borderColor: '#E6E1D7',
    borderRadius: 8,
    minHeight: 126,
    backgroundColor: '#FAFAF7',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  uploadButton: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#D8CFBF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  uploadButtonText: {
    fontSize: 13,
    color: PRIMARY_BROWN,
    fontWeight: '600',
  },
  uploadPreviewBox: {
    borderWidth: 1,
    borderColor: '#E6E1D7',
    borderRadius: 8,
    minHeight: 150,
    backgroundColor: '#FAFAF7',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    padding: 8,
  },
  uploadPreviewImage: {
    width: '100%',
    height: 130,
  },
  savedPreviewBox: {
    height: 100,
    borderWidth: 1,
    borderColor: '#E6E1D7',
    borderRadius: 8,
    backgroundColor: '#FAFAF7',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  savedPreviewImage: {
    width: '100%',
    height: '100%',
  },
  emptyText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  footerButtons: {
    gap: 10,
  },
  footnote: {
    fontSize: 11,
    color: MUTED_OLIVE,
  },
  primaryButton: {
    backgroundColor: PRIMARY_BROWN,
    borderRadius: 9,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: PRIMARY_BROWN,
    borderRadius: 9,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    color: PRIMARY_BROWN,
    fontSize: 13,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
