import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { api } from '../../lib/api';

interface PatientDetail {
  nuhi: string;
  fullName: string;
  dateOfBirth: string;
  sex: string;
  state: string;
  lga: string | null;
  phone: string | null;
  registrationPath: string;
  ninVerified: boolean;
}

export default function PatientDetailScreen() {
  const { nuhi } = useLocalSearchParams<{ nuhi: string }>();
  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    if (!nuhi) return;
    api.get<PatientDetail>(`/patients/${nuhi}`)
      .then(setPatient)
      .catch(() => setPatient(null))
      .finally(() => setLoading(false));
  }, [nuhi]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#075E54" />
      </View>
    );
  }

  if (!patient) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Patient not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.name}>{patient.fullName}</Text>
        <Text style={styles.nuhi}>NUHI: {patient.nuhi}</Text>
        <View style={styles.badges}>
          <View style={[styles.badge, { backgroundColor: patient.ninVerified ? '#4CAF50' : '#FF9800' }]}>
            <Text style={styles.badgeText}>{patient.ninVerified ? 'NIN Verified' : 'Provisional'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <InfoRow label="Date of Birth" value={patient.dateOfBirth} />
        <InfoRow label="Sex" value={patient.sex} />
        <InfoRow label="State" value={patient.state} />
        {patient.lga && <InfoRow label="LGA" value={patient.lga} />}
        {patient.phone && <InfoRow label="Phone" value={patient.phone} />}
      </View>

      <TouchableOpacity style={styles.qrBtn} onPress={() => setShowQR(!showQR)}>
        <Text style={styles.qrBtnText}>{showQR ? 'Hide QR Code' : 'Show NUHI QR Code'}</Text>
      </TouchableOpacity>

      {showQR && (
        <View style={styles.qrContainer}>
          <QRCode value={patient.nuhi} size={200} backgroundColor="#fff" color="#075E54" />
          <Text style={styles.qrLabel}>Scan to look up patient</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.encounterBtn}
        onPress={() => router.push(`/new-encounter?nuhi=${patient.nuhi}`)}
      >
        <Text style={styles.encounterBtnText}>Open New Encounter</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: '#999' },
  header: { backgroundColor: '#075E54', padding: 20, paddingTop: 12 },
  name: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  nuhi: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  badges: { flexDirection: 'row', marginTop: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  card: { backgroundColor: '#fff', margin: 12, borderRadius: 8, padding: 16 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: '#eee' },
  infoLabel: { fontSize: 14, color: '#666' },
  infoValue: { fontSize: 14, color: '#333', fontWeight: '500' },
  qrBtn: { margin: 12, padding: 14, backgroundColor: '#fff', borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#075E54' },
  qrBtnText: { color: '#075E54', fontWeight: '600' },
  qrContainer: { alignItems: 'center', padding: 24, backgroundColor: '#fff', margin: 12, borderRadius: 8 },
  qrLabel: { marginTop: 12, color: '#666', fontSize: 13 },
  encounterBtn: { margin: 12, padding: 16, backgroundColor: '#075E54', borderRadius: 8, alignItems: 'center' },
  encounterBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
