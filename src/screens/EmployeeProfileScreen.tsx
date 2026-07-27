/**
 * EmployeeProfileScreen — Add and manage employee profiles.
 * Profiles are stored locally in AsyncStorage.
 * Admin-only screen.
 */
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button, Card, Chip, Divider, HelperText, Text, TextInput } from 'react-native-paper';
import { useEmployeeProfiles } from '../hooks/useEmployeeProfiles';
import type { RootStackParamList, UserRole } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'EmployeeProfileScreen'>;

export function EmployeeProfileScreen({ navigation }: Props) {
  const { profiles, isLoading, add, remove } = useEmployeeProfiles();

  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('EMPLOYEE');
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const validate = (): boolean => {
    let ok = true;
    if (!formName.trim()) { setNameError('Name is required'); ok = false; }
    else setNameError('');
    if (!formEmail.trim() || !formEmail.includes('@')) {
      setEmailError('Valid email is required'); ok = false;
    } else setEmailError('');
    return ok;
  };

  const handleAdd = async () => {
    if (!validate()) return;
    setIsSaving(true);
    await add(formName, formEmail, formRole);
    setFormName('');
    setFormEmail('');
    setFormRole('EMPLOYEE');
    setIsSaving(false);
  };

  const handleRemove = (id: string, name: string) => {
    Alert.alert('Remove Employee', `Remove "${name}" from profiles?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => remove(id) },
    ]);
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
        <Text style={styles.headerTitle}>Employee Profiles</Text>
        <View style={{ width: 60 }} />
      </View>

      <FlatList
        data={profiles}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            {/* ── Add form ── */}
            <Card style={styles.formCard} elevation={2}>
              <Card.Content>
                <Text style={styles.formTitle}>➕ Add Employee</Text>
                <Divider style={styles.divider} />

                <TextInput
                  label="Full Name *"
                  value={formName}
                  onChangeText={t => { setFormName(t); setNameError(''); }}
                  mode="outlined"
                  style={styles.input}
                  outlineStyle={styles.inputOutline}
                />
                {nameError ? <HelperText type="error" visible>{nameError}</HelperText> : null}

                <TextInput
                  label="Email Address *"
                  value={formEmail}
                  onChangeText={t => { setFormEmail(t); setEmailError(''); }}
                  mode="outlined"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                  outlineStyle={styles.inputOutline}
                />
                {emailError ? <HelperText type="error" visible>{emailError}</HelperText> : null}

                {/* Role selector */}
                <Text style={styles.roleLabel}>Role</Text>
                <View style={styles.roleRow}>
                  {(['EMPLOYEE', 'ADMIN'] as UserRole[]).map(role => (
                    <TouchableOpacity
                      key={role}
                      style={[
                        styles.roleOption,
                        formRole === role && styles.roleOptionSelected,
                      ]}
                      onPress={() => setFormRole(role)}
                    >
                      <Text
                        style={[
                          styles.roleOptionText,
                          formRole === role && styles.roleOptionTextSelected,
                        ]}
                      >
                        {role === 'ADMIN' ? '👔 ADMIN' : '👤 EMPLOYEE'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Button
                  mode="contained"
                  onPress={handleAdd}
                  loading={isSaving}
                  disabled={isSaving}
                  buttonColor="#3F51B5"
                  style={styles.addBtn}
                >
                  Add Employee
                </Button>
              </Card.Content>
            </Card>

            <Text style={styles.sectionLabel}>
              EMPLOYEES ({profiles.length})
            </Text>
          </>
        }
        renderItem={({ item }) => (
          <Card style={styles.profileCard} elevation={1}>
            <Card.Content>
              <View style={styles.profileRow}>
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>{item.name}</Text>
                  <Text style={styles.profileEmail}>{item.email}</Text>
                  <Text style={styles.profileDate}>
                    Added {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.profileRight}>
                  <Chip
                    compact
                    style={{
                      backgroundColor:
                        item.role === 'ADMIN' ? '#E8EAF6' : '#E8F5E9',
                    }}
                    textStyle={{
                      color: item.role === 'ADMIN' ? '#3F51B5' : '#2E7D32',
                      fontSize: 10,
                      fontWeight: '700',
                    }}
                  >
                    {item.role}
                  </Chip>
                  <TouchableOpacity
                    onPress={() => handleRemove(item.id, item.name)}
                    style={styles.removeBtn}
                  >
                    <Text style={styles.removeText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Card.Content>
          </Card>
        )}
        ListEmptyComponent={
          !isLoading ? (
            <Text style={styles.emptyText}>
              No employees added yet. Add one above.
            </Text>
          ) : null
        }
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0F2FF' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', backgroundColor: '#3F51B5',
    paddingHorizontal: 16, paddingVertical: 14, paddingTop: 20,
  },
  backBtn: { padding: 4 },
  backText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  headerTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  list: { padding: 16, paddingBottom: 40 },
  formCard: { borderRadius: 12, backgroundColor: '#FFFFFF', marginBottom: 16 },
  formTitle: { fontWeight: '700', color: '#1A1A2E', fontSize: 15, marginBottom: 4 },
  divider: { marginVertical: 10, backgroundColor: '#E8EAF6' },
  input: { backgroundColor: '#FFFFFF', marginBottom: 4 },
  inputOutline: { borderRadius: 8 },
  roleLabel: { color: '#6B7280', fontSize: 12, fontWeight: '600', marginTop: 8, marginBottom: 6 },
  roleRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  roleOption: {
    flex: 1, paddingVertical: 10, borderRadius: 8,
    borderWidth: 2, borderColor: '#E0E0E0',
    alignItems: 'center', backgroundColor: '#FAFAFA',
  },
  roleOptionSelected: { borderColor: '#3F51B5', backgroundColor: '#E8EAF6' },
  roleOptionText: { color: '#6B7280', fontWeight: '600', fontSize: 13 },
  roleOptionTextSelected: { color: '#3F51B5' },
  addBtn: { borderRadius: 8, marginTop: 4 },
  sectionLabel: {
    fontSize: 10, fontWeight: '700', color: '#9E9E9E',
    letterSpacing: 1.5, textTransform: 'uppercase',
    marginBottom: 8, marginTop: 4,
  },
  profileCard: { borderRadius: 10, backgroundColor: '#FFFFFF', marginBottom: 10 },
  profileRow: { flexDirection: 'row', alignItems: 'center' },
  profileInfo: { flex: 1 },
  profileName: { fontWeight: '700', color: '#1A1A2E', fontSize: 14 },
  profileEmail: { color: '#5C6BC0', fontSize: 12, marginTop: 2 },
  profileDate: { color: '#9E9E9E', fontSize: 11, marginTop: 2 },
  profileRight: { alignItems: 'flex-end', gap: 8 },
  removeBtn: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 6, backgroundColor: '#FFEBEE',
  },
  removeText: { color: '#D50000', fontWeight: '700', fontSize: 12 },
  emptyText: { textAlign: 'center', color: '#9E9E9E', marginTop: 24 },
});
