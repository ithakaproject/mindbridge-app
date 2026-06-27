import { useMemo, useState } from 'react';
import { ScrollView, View, TextInput, Pressable, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TopBar } from '@/components/top-bar';
import { Colors, BottomTabInset, Spacing, MaxContentWidth } from '@/constants/theme';
import { PATIENTS, PATIENT_ORDER, FLAGS } from '@/data/patients';

const colors = Colors.dark;

type FilterKey = 'all' | 'today' | 'pending' | 'watch';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'today', label: 'Today' },
  { key: 'pending', label: 'Pending' },
  { key: 'watch', label: 'Needs attention' },
];

export default function PatientsScreen() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return PATIENT_ORDER.filter((pid) => {
      const p = PATIENTS[pid];
      if (s && !p.name.toLowerCase().includes(s)) return false;
      if (filter === 'today') return p.nextSess.startsWith('Today');
      if (filter === 'pending') return p.assignments.some((a) => !a.done);
      if (filter === 'watch') return p.flag === 'urgent' || p.flag === 'watch';
      return true;
    });
  }, [search, filter]);

  const openPatient = (id: string) => {
    router.push(`/patient/${id}`);
  };

  return (
    <ThemedView style={styles.screen}>
      <TopBar />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: BottomTabInset + Spacing.four },
        ]}>
        <View style={styles.heading}>
          <ThemedText type="small" themeColor="textSecondary">
            Your roster
          </ThemedText>
          <ThemedText style={styles.headingTitle}>Patients</ThemedText>
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={15} color={colors.textTertiary} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search patients…"
            placeholderTextColor={colors.textTertiary}
            style={styles.searchInput}
          />
        </View>

        <View style={styles.chipsRow}>
          {FILTERS.map((f) => (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[styles.chip, filter === f.key && styles.chipOn]}>
              <ThemedText type="small" style={[styles.chipText, filter === f.key && styles.chipTextOn]}>
                {f.label}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyEmoji}>🔍</ThemedText>
            <ThemedText style={styles.emptyTitle}>No patients found</ThemedText>
            <ThemedText type="small" themeColor="textTertiary" style={styles.emptySub}>
              Try adjusting your search or filter.
            </ThemedText>
          </View>
        ) : (
          filtered.map((pid) => {
            const p = PATIENTS[pid];
            const flag = FLAGS[p.flag];
            return (
              <Pressable key={pid} onPress={() => openPatient(pid)}>
                <ThemedView type="backgroundElement" style={styles.patCard}>
                  <View style={[styles.avatar, { backgroundColor: p.color }]}>
                    <ThemedText style={styles.avatarText}>{p.initials}</ThemedText>
                    {p.online && <View style={styles.onlineDot} />}
                  </View>
                  <View style={styles.patInfo}>
                    <View style={styles.patNameRow}>
                      <ThemedText style={styles.patName}>{p.name}</ThemedText>
                      <View style={[styles.flagBadge, { backgroundColor: `${colors[flag.color]}2E` }]}>
                        <ThemedText style={[styles.flagText, { color: colors[flag.color] }]}>
                          {flag.label}
                        </ThemedText>
                      </View>
                    </View>
                    <ThemedText
                      type="small"
                      themeColor="textSecondary"
                      style={styles.patPreview}
                      numberOfLines={1}>
                      {p.preview}
                    </ThemedText>
                  </View>
                  <View style={styles.patRight}>
                    <ThemedText type="small" themeColor="textTertiary" style={styles.patTime}>
                      {p.time}
                    </ThemedText>
                    {p.unread > 0 && (
                      <View style={styles.unreadDot}>
                        <ThemedText style={styles.unreadText}>{p.unread}</ThemedText>
                      </View>
                    )}
                  </View>
                </ThemedView>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.three,
  },
  heading: {
    paddingHorizontal: Spacing.two,
    paddingBottom: Spacing.two,
  },
  headingTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
    color: colors.text,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.backgroundElement,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 0.5,
    borderColor: colors.border,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  chip: {
    paddingVertical: 5,
    paddingHorizontal: 13,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: colors.border,
    backgroundColor: colors.backgroundElement,
  },
  chipOn: {
    backgroundColor: colors.tealDim,
    borderColor: colors.tealDim,
  },
  chipText: {
    fontWeight: '600',
    color: colors.textTertiary,
  },
  chipTextOn: {
    color: '#fff',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  emptyTitle: {
    fontWeight: '700',
    marginBottom: 4,
  },
  emptySub: {
    textAlign: 'center',
  },
  patCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 15,
    borderRadius: 16,
    marginBottom: 7,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: colors.green,
    borderWidth: 2,
    borderColor: colors.backgroundElement,
  },
  patInfo: {
    flex: 1,
    minWidth: 0,
  },
  patNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  patName: {
    fontSize: 13.5,
    fontWeight: '600',
    color: colors.text,
  },
  flagBadge: {
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 8,
  },
  flagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  patPreview: {
    marginTop: 2,
  },
  patRight: {
    alignItems: 'flex-end',
    gap: 5,
  },
  patTime: {},
  unreadDot: {
    backgroundColor: colors.gold,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: {
    color: colors.background,
    fontSize: 10,
    fontWeight: '700',
  },
});
