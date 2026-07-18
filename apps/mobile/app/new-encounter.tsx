import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { api } from '../lib/api';
import { enqueueSync } from '../lib/offline-db';

const ENCOUNTER_TYPES = [
  'outpatient',
  'inpatient',
  'emergency',
  'telemedicine',
  'pharmacy',
  'laboratory',
];

export default function NewEncounterScreen() {
  const { nuhi } = useLocalSearchParams<{ nuhi: string }>();
  const [encounterType, setEncounterType] = useState('outpatient');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!nuhi) {
      Alert.alert('Error', 'Missing patient NUHI');
      return;
    }

    setLoading(true);
    const body = {
      nuhi,
      encounterType,
      reason: reason || undefined,
      notes: notes || undefined,
    };

    try {
      const result = await api.post<{ encounterId: string }>('/encounters', body);
      Alert.alert('Success', `Encounter created: ${result.encounterId.slice(0, 8)}...`);
      router.back();
    } catch {
      const key = `encounter-${Date.now()}`;
      await enqueueSync('POST', '/encounters', body, key);
      Alert.alert('Queued', 'Encounter saved offline. It will sync when connected.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>New Encounter</Text>
      <Text style={styles.nuhi}>Patient: {nuhi}</Text>

      <Text style={styles.label}>Type</Text>
      <View style={styles.typeGrid}>
        {ENCOUNTER_TYPES.map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.typeBtn, encounterType === t && styles.typeBtnActive]}
            onPress={() => setEncounterType(t)}
          >
            <Text style={[styles.typeBtnText, encounterType === t && styles.typeBtnTextActive]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Reason</Text>
      <TextInput
        style={styles.input}
        value={reason}
        onChangeText={setReason}
        placeholder="Chief complaint or reason for visit"
      />

      <Text style={styles.label}>Notes</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={notes}
        onChangeText={setNotes}
        placeholder="Additional notes"
        multiline
        numberOfLines={4}
      />

      <TouchableOpacity
        style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
        onPress={handleCreate}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitBtnText}>Open Encounter</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  heading: { fontSize: 22, fontWeight: 'bold', color: '#075E54' },
  nuhi: { fontSize: 13, color: '#666', marginTop: 4, marginBottom: 16 },
  label: { fontSize: 13, color: '#666', marginTop: 16, marginBottom: 4, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 14, fontSize: 16 },
  textArea: { height: 100, textAlignVertical: 'top' },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeBtn: { paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: '#ddd', borderRadius: 20 },
  typeBtnActive: { backgroundColor: '#075E54', borderColor: '#075E54' },
  typeBtnText: { color: '#333', fontSize: 13 },
  typeBtnTextActive: { color: '#fff', fontWeight: '600' },
  submitBtn: { backgroundColor: '#075E54', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 24, marginBottom: 40 },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
