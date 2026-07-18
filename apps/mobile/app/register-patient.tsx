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
import { router } from 'expo-router';
import { api } from '../lib/api';
import { enqueueSync } from '../lib/offline-db';
import { v4 as uuid } from 'react-native-uuid' ;

export default function RegisterPatientScreen() {
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [sex, setSex] = useState('');
  const [state, setState] = useState('');
  const [phone, setPhone] = useState('');
  const [nin, setNin] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!fullName.trim() || !dateOfBirth.trim() || !sex.trim() || !state.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    const body = {
      fullName,
      dateOfBirth,
      sex,
      state,
      phone: phone || undefined,
      nin: nin || undefined,
    };

    try {
      const result = await api.post<{ nuhi: string }>('/patients/register', body);
      Alert.alert('Success', `Patient registered. NUHI: ${result.nuhi}`, [
        { text: 'View', onPress: () => router.push(`/patient/${result.nuhi}`) },
      ]);
    } catch {
      const key = `register-${Date.now()}`;
      await enqueueSync('POST', '/patients/register', body, key);
      Alert.alert('Queued', 'Registration saved offline. It will sync when connected.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const sexOptions = ['male', 'female', 'intersex'];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>Register Patient</Text>

      <Text style={styles.label}>Full Name *</Text>
      <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="e.g. Adaeze Okafor" />

      <Text style={styles.label}>Date of Birth *</Text>
      <TextInput style={styles.input} value={dateOfBirth} onChangeText={setDateOfBirth} placeholder="YYYY-MM-DD" />

      <Text style={styles.label}>Sex *</Text>
      <View style={styles.sexRow}>
        {sexOptions.map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.sexBtn, sex === s && styles.sexBtnActive]}
            onPress={() => setSex(s)}
          >
            <Text style={[styles.sexBtnText, sex === s && styles.sexBtnTextActive]}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>State *</Text>
      <TextInput style={styles.input} value={state} onChangeText={setState} placeholder="e.g. Lagos" />

      <Text style={styles.label}>Phone</Text>
      <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="+234..." keyboardType="phone-pad" />

      <Text style={styles.label}>NIN (National Identification Number)</Text>
      <TextInput style={styles.input} value={nin} onChangeText={setNin} placeholder="11-digit NIN" keyboardType="number-pad" maxLength={11} />

      <TouchableOpacity
        style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
        onPress={handleRegister}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitBtnText}>Register</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  heading: { fontSize: 22, fontWeight: 'bold', color: '#075E54', marginBottom: 20 },
  label: { fontSize: 13, color: '#666', marginTop: 12, marginBottom: 4, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 14, fontSize: 16 },
  sexRow: { flexDirection: 'row', gap: 8 },
  sexBtn: { flex: 1, padding: 12, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, alignItems: 'center' },
  sexBtnActive: { backgroundColor: '#075E54', borderColor: '#075E54' },
  sexBtnText: { color: '#333', fontSize: 14 },
  sexBtnTextActive: { color: '#fff', fontWeight: '600' },
  submitBtn: { backgroundColor: '#075E54', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 24, marginBottom: 40 },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
