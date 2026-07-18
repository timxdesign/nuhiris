import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../lib/auth-store';
import { processQueue } from '../../lib/sync-manager';

export default function SettingsScreen() {
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const handleSync = async () => {
    try {
      const { synced, failed } = await processQueue();
      Alert.alert('Sync Complete', `Synced: ${synced}, Failed: ${failed}`);
    } catch {
      Alert.alert('Sync Error', 'Failed to process sync queue');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.label}>User ID</Text>
        <Text style={styles.value}>{user?.sub ?? 'Unknown'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Roles</Text>
        <Text style={styles.value}>{user?.roles?.join(', ') ?? 'None'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Facility</Text>
        <Text style={styles.value}>{user?.facilityId ?? 'Not assigned'}</Text>
      </View>

      <TouchableOpacity style={styles.syncBtn} onPress={handleSync}>
        <Text style={styles.syncBtnText}>Sync Offline Data</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutBtnText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 8, marginBottom: 8 },
  label: { fontSize: 12, color: '#999', textTransform: 'uppercase', fontWeight: '600' },
  value: { fontSize: 16, color: '#333', marginTop: 4 },
  syncBtn: {
    backgroundColor: '#075E54', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 24,
  },
  syncBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  logoutBtn: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#F44336',
    padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 12,
  },
  logoutBtnText: { color: '#F44336', fontSize: 16, fontWeight: '600' },
});
