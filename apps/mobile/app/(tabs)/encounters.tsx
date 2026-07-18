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

interface EncounterResult {
  encounterId: string;
  nuhi: string;
  encounterType: string;
  status: string;
  reason: string | null;
  dateTime: string;
}

const STATUS_COLORS: Record<string, string> = {
  open: '#4CAF50',
  in_progress: '#2196F3',
  closed: '#9E9E9E',
  cancelled: '#F44336',
};

export default function EncountersScreen() {
  const [nuhi, setNuhi] = useState('');
  const [results, setResults] = useState<EncounterResult[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async () => {
    if (!nuhi.trim()) return;
    setLoading(true);
    try {
      const data = await api.get<EncounterResult[]>(
        `/encounters?nuhi=${encodeURIComponent(nuhi)}&limit=20`,
      );
      setResults(Array.isArray(data) ? data : []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [nuhi]);

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.input}
          placeholder="Enter patient NUHI..."
          value={nuhi}
          onChangeText={setNuhi}
          onSubmitEditing={search}
          returnKeyType="search"
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.searchBtn} onPress={search}>
          <Text style={styles.searchBtnText}>Search</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#075E54" style={styles.loader} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.encounterId}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.type}>{item.encounterType}</Text>
                <View style={[styles.badge, { backgroundColor: STATUS_COLORS[item.status] ?? '#999' }]}>
                  <Text style={styles.badgeText}>{item.status}</Text>
                </View>
              </View>
              {item.reason && <Text style={styles.reason}>{item.reason}</Text>}
              <Text style={styles.date}>{new Date(item.dateTime).toLocaleDateString()}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>Search by patient NUHI to view encounters</Text>
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
  loader: { marginTop: 40 },
  card: { backgroundColor: '#fff', padding: 16, marginHorizontal: 12, marginTop: 8, borderRadius: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  type: { fontSize: 16, fontWeight: '600', color: '#333', textTransform: 'capitalize' },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  reason: { fontSize: 14, color: '#666', marginTop: 4 },
  date: { fontSize: 12, color: '#999', marginTop: 4 },
  empty: { textAlign: 'center', color: '#999', marginTop: 40, fontSize: 15 },
});
