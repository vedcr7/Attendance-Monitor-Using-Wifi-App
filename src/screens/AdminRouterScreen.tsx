/**
 * AdminRouterScreen — Add, edit, delete trusted office routers.
 *
 * Routers saved here are stored in AsyncStorage and take priority over
 * the static STATIC_TRUSTED_ROUTERS list in trustedRouters.ts.
 *
 * The current BSSID (from the dashboard) is passed as a param so the
 * admin can add "this network" in one tap.
 */
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button, Card, Divider, HelperText, Text, TextInput } from 'react-native-paper';
import {
  addTrustedRouter,
  loadTrustedRouters,
  removeTrustedRouter,
  updateTrustedRouter,
} from '../services/storageService';
import {
  getActiveTrustedRouters,
  initTrustedRouters,
  invalidateRouterCache,
  STATIC_TRUSTED_ROUTERS,
} from '../config/trustedRouters';
import type { RootStackParamList } from '../types';
import type { TrustedRouter } from '../config/trustedRouters';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminRouterScreen'>;

export function AdminRouterScreen({ navigation, route }: Props) {
  const { currentBssid = '', currentSsid = '' } = route.params;

  const [routers, setRouters] = useState<TrustedRouter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Add form state
  const [formName, setFormName] = useState('');
  const [formBssid, setFormBssid] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formError, setFormError] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    await initTrustedRouters();
    const stored = await loadTrustedRouters();
    setRouters(stored ?? STATIC_TRUSTED_ROUTERS);
    setIsLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Pre-fill form with current BSSID for one-tap add
  const fillCurrentNetwork = useCallback(() => {
    setFormBssid(currentBssid);
    setFormName(currentSsid ? `${currentSsid} Router` : 'Office Router');
    setFormError('');
    setEditingId(null);
  }, [currentBssid, currentSsid]);

  const validateBssid = (bssid: string): boolean => {
    const pattern = /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/;
    return pattern.test(bssid.trim());
  };

  const handleSave = useCallback(async () => {
    if (!formName.trim()) {
      setFormError('Router name is required');
      return;
    }
    if (!validateBssid(formBssid)) {
      setFormError('Invalid BSSID format — expected AA:BB:CC:DD:EE:FF');
      return;
    }
    setFormError('');

    if (editingId !== null) {
      const updated = await updateTrustedRouter(editingId, {
        name: formName.trim(),
        bssid: formBssid.trim().toUpperCase(),
        location: formLocation.trim() || undefined,
      });
      setRouters(updated);
    } else {
      const nextId = Date.now();
      const updated = await addTrustedRouter({
        id: nextId,
        name: formName.trim(),
        bssid: formBssid.trim().toUpperCase(),
        location: formLocation.trim() || undefined,
      });
      setRouters(updated);
    }

    invalidateRouterCache();
    await initTrustedRouters();
    setFormName('');
    setFormBssid('');
    setFormLocation('');
    setEditingId(null);
  }, [formName, formBssid, formLocation, editingId]);

  const handleEdit = useCallback((router: TrustedRouter) => {
    setEditingId(router.id);
    setFormName(router.name);
    setFormBssid(router.bssid);
    setFormLocation(router.location ?? '');
    setFormError('');
  }, []);

  const handleDelete = useCallback(
    (router: TrustedRouter) => {
      Alert.alert(
        'Remove Router',
        `Remove "${router.name}" from trusted list?\n\nBSSID: ${router.bssid}`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: async () => {
              const updated = await removeTrustedRouter(router.id);
              invalidateRouterCache();
              await initTrustedRouters();
              setRouters(updated.length > 0 ? updated : STATIC_TRUSTED_ROUTERS);
            },
          },
        ],
      );
    },
    [],
  );

  const handleCancel = () => {
    setEditingId(null);
    setFormName('');
    setFormBssid('');
    setFormLocation('');
    setFormError('');
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trusted Routers</Text>
        <View style={{ width: 60 }} />
      </View>

      <FlatList
        data={routers}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            {/* ── Quick-add current network ── */}
            {currentBssid && currentBssid !== 'N/A' && (
              <Card style={styles.quickCard} elevation={1}>
                <Card.Content>
                  <Text style={styles.quickTitle}>📡 Current Network</Text>
                  <Text style={styles.quickBssid}>{currentBssid}</Text>
                  <Text style={styles.quickSsid}>{currentSsid || 'Unknown SSID'}</Text>
                  <Button
                    mode="contained"
                    onPress={fillCurrentNetwork}
                    buttonColor="#3F51B5"
                    style={styles.quickBtn}
                    compact
                  >
                    Add This Network
                  </Button>
                </Card.Content>
              </Card>
            )}

            {/* ── Add / Edit form ── */}
            <Card style={styles.formCard} elevation={2}>
              <Card.Content>
                <Text style={styles.formTitle}>
                  {editingId !== null ? '✏️ Edit Router' : '➕ Add Router'}
                </Text>
                <Divider style={styles.divider} />

                <TextInput
                  label="Router Name *"
                  value={formName}
                  onChangeText={setFormName}
                  mode="outlined"
                  style={styles.input}
                  outlineStyle={styles.inputOutline}
                  placeholder="e.g. Office Router Floor 2"
                />
                <TextInput
                  label="BSSID *"
                  value={formBssid}
                  onChangeText={text => setFormBssid(text.toUpperCase())}
                  mode="outlined"
                  style={styles.input}
                  outlineStyle={styles.inputOutline}
                  autoCapitalize="characters"
                  placeholder="AA:BB:CC:DD:EE:FF"
                />
                <TextInput
                  label="Location (optional)"
                  value={formLocation}
                  onChangeText={setFormLocation}
                  mode="outlined"
                  style={styles.input}
                  outlineStyle={styles.inputOutline}
                  placeholder="e.g. Second Floor, East Wing"
                />
                {formError ? (
                  <HelperText type="error" visible>{formError}</HelperText>
                ) : null}

                <View style={styles.formButtons}>
                  {editingId !== null && (
                    <Button
                      mode="outlined"
                      onPress={handleCancel}
                      style={styles.cancelBtn}
                      textColor="#6B7280"
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    mode="contained"
                    onPress={handleSave}
                    buttonColor="#3F51B5"
                    style={styles.saveBtn}
                  >
                    {editingId !== null ? 'Save Changes' : 'Add Router'}
                  </Button>
                </View>
              </Card.Content>
            </Card>

            <Text style={styles.sectionLabel}>TRUSTED ROUTERS ({routers.length})</Text>
          </>
        }
        renderItem={({ item }) => (
          <Card style={styles.routerCard} elevation={1}>
            <Card.Content>
              <View style={styles.routerRow}>
                <View style={styles.routerInfo}>
                  <Text style={styles.routerName}>{item.name}</Text>
                  <Text style={styles.routerBssid}>{item.bssid}</Text>
                  {item.location ? (
                    <Text style={styles.routerLocation}>📍 {item.location}</Text>
                  ) : null}
                </View>
                <View style={styles.routerActions}>
                  <TouchableOpacity
                    onPress={() => handleEdit(item)}
                    style={styles.actionBtn}
                  >
                    <Text style={styles.editText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDelete(item)}
                    style={[styles.actionBtn, styles.deleteBtn]}
                  >
                    <Text style={styles.deleteText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Card.Content>
          </Card>
        )}
        ListEmptyComponent={
          !isLoading ? (
            <Text style={styles.emptyText}>No trusted routers yet. Add one above.</Text>
          ) : null
        }
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0F2FF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#3F51B5',
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: 20,
  },
  backBtn: { padding: 4 },
  backText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  headerTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  list: { padding: 16, paddingBottom: 40 },
  quickCard: {
    borderRadius: 12,
    backgroundColor: '#E8EAF6',
    marginBottom: 12,
  },
  quickTitle: { fontWeight: '700', color: '#3F51B5', marginBottom: 4 },
  quickBssid: { fontFamily: 'monospace', fontSize: 13, color: '#1A1A2E', fontWeight: '700' },
  quickSsid: { color: '#6B7280', fontSize: 12, marginBottom: 10 },
  quickBtn: { borderRadius: 8 },
  formCard: { borderRadius: 12, backgroundColor: '#FFFFFF', marginBottom: 16 },
  formTitle: { fontWeight: '700', color: '#1A1A2E', fontSize: 15, marginBottom: 4 },
  divider: { marginVertical: 10, backgroundColor: '#E8EAF6' },
  input: { backgroundColor: '#FFFFFF', marginBottom: 8 },
  inputOutline: { borderRadius: 8 },
  formButtons: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: { flex: 1, borderRadius: 8, borderColor: '#E0E0E0' },
  saveBtn: { flex: 2, borderRadius: 8 },
  sectionLabel: {
    fontSize: 10, fontWeight: '700', color: '#9E9E9E',
    letterSpacing: 1.5, textTransform: 'uppercase',
    marginBottom: 8, marginTop: 4,
  },
  routerCard: {
    borderRadius: 10, backgroundColor: '#FFFFFF', marginBottom: 10,
  },
  routerRow: { flexDirection: 'row', alignItems: 'center' },
  routerInfo: { flex: 1 },
  routerName: { fontWeight: '700', color: '#1A1A2E', fontSize: 14 },
  routerBssid: { fontFamily: 'monospace', fontSize: 11, color: '#5C6BC0', marginTop: 2 },
  routerLocation: { fontSize: 11, color: '#9E9E9E', marginTop: 2 },
  routerActions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 6, backgroundColor: '#E8EAF6',
  },
  editText: { color: '#3F51B5', fontWeight: '700', fontSize: 12 },
  deleteBtn: { backgroundColor: '#FFEBEE' },
  deleteText: { color: '#D50000', fontWeight: '700', fontSize: 12 },
  emptyText: { textAlign: 'center', color: '#9E9E9E', marginTop: 24 },
});
