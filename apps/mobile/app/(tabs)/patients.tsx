import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { api } from '../../lib/api';
import { searchCachedPatients, cachePatient } from '../../lib/offline-db';

interface PatientResult {
  nuhi: string;
  fullName: string;
  dateOfBirth: string;
  sex: string;
  state: string;
  phone: string | null;
}

export default function PatientsScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PatientResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  const search = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setIsOffline(false);

    try {
      const data = await api.get<{ data: PatientResult[] }>(
        `/patients?firstName=${encodeURIComponent(query)}&limit=20`,
      );
      const patients = data.data ?? (data as unknown as PatientResult[]);
      setResults(Array.isArray(patients) ? patients : []);

      for (const p of (Array.isArray(patients) ? patients : [])) {
        await cachePatient(p);
      }
    } catch {
      setIsOffline(true);
      const cached = await searchCachedPatients(query);
      setResults(cached.map((c) => ({ ...c, phone: null })));
    } finally {
      setLoading(false);
    }
  }, [query]);

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.input}
          placeholder="Search by name or NUHI..."
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={search}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchBtn} onPress={search}>
          <Text style={styles.searchBtnText}>Search</Text>
        </TouchableOpacity>
      </View>

      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>Offline — showing cached results</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.registerBtn}
        onPress={() => router.push('/register-patient')}
      >
        <Text style={styles.registerBtnText}>+ Register New Patient</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size="large" color="#075E54" style={styles.loader} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.nuhi}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/patient/${item.nuhi}`)}
            >
              <Text style={styles.name}>{item.fullName}</Text>
              <Text style={styles.detail}>
                {item.sex} · {item.dateOfBirth} · {item.state}
              </Text>
              <Text style={styles.nuhi}>NUHI: {item.nuhi.slice(0, 8)}...</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            !loading ? (
              <Text style={styles.empty}>
                {query ? 'No patients found' : 'Enter a name or NUHI to search'}
              </Text>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  searchBar: { flexDirection: 'row', padding: 12, gap: 8, backgroundColor: '#fff' },
  input: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16 },
  searchBtn: { backgroundColor: '#075E54', borderRadius: 8, paddingHorizontal: 16, justifyContent: 'center' },
  searchBtnText: { color: '#fff', fontWeight: '600' },
  offlineBanner: { backgroundColor: '#FFF3E0', padding: 8, alignItems: 'center' },
  offlineText: { color: '#E65100', fontSize: 13 },
  registerBtn: { margin: 12, padding: 14, backgroundColor: '#075E54', borderRadius: 8, alignItems: 'center' },
  registerBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  loader: { marginTop: 40 },
  card: { backgroundColor: '#fff', padding: 16, marginHorizontal: 12, marginTop: 8, borderRadius: 8 },
  name: { fontSize: 16, fontWeight: '600', color: '#333' },
  detail: { fontSize: 13, color: '#666', marginTop: 4 },
  nuhi: { fontSize: 12, color: '#999', marginTop: 4 },
  empty: { textAlign: 'center', color: '#999', marginTop: 40, fontSize: 15 },
});
