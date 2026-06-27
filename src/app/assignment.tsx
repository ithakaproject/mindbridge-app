import { useState } from 'react';
import { ScrollView, View, Pressable, TextInput, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { SuccessModal } from '@/components/success-modal';
import { Colors, Spacing, MaxContentWidth } from '@/constants/theme';

const colors = Colors.dark;

type TagColor = 'rose' | 'teal' | 'gold' | 'amber' | 'green';

export default function AssignmentScreen() {
  const params = useLocalSearchParams<{
    title?: string;
    desc?: string;
    sub?: string;
    tagColor?: TagColor;
  }>();
  const [response, setResponse] = useState('');
  const [successOpen, setSuccessOpen] = useState(false);

  const tagColor: TagColor = params.tagColor ?? 'teal';

  // TODO (Supabase): actually persist this response against the assignment record
  const handleSubmit = () => {
    setSuccessOpen(true);
  };

  const handleSuccessClose = () => {
    setSuccessOpen(false);
    router.back();
  };

  return (
    <ThemedView style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.gold} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>{params.title ?? 'Assignment'}</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.assignTag, { backgroundColor: `${colors[tagColor]}26` }]}>
          <Ionicons name="clipboard-outline" size={12} color={colors[tagColor]} />
          <ThemedText style={[styles.assignTagText, { color: colors[tagColor] }]}>
            {' '}From Dr. Patel
          </ThemedText>
        </View>

        {params.sub ? (
          <ThemedText type="small" themeColor="textTertiary" style={{ marginBottom: 8 }}>
            {params.sub}
          </ThemedText>
        ) : null}

        <ThemedText style={styles.desc}>{params.desc}</ThemedText>

        <TextInput
          value={response}
          onChangeText={setResponse}
          placeholder="Write your response here… there are no wrong answers."
          placeholderTextColor={colors.textTertiary}
          multiline
          numberOfLines={6}
          style={styles.responseArea}
        />

        <Pressable onPress={handleSubmit} style={styles.submitBtn}>
          <ThemedText style={styles.submitText}>Submit to Dr. Patel</ThemedText>
        </Pressable>
        <Pressable onPress={() => router.back()} style={styles.draftBtn}>
          <ThemedText type="small" themeColor="textTertiary">
            Save draft
          </ThemedText>
        </Pressable>
      </ScrollView>

      <SuccessModal
        visible={successOpen}
        onClose={handleSuccessClose}
        icon="✅"
        title="Submitted!"
        subtitle="Dr. Patel will review your response before your next session."
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingTop: 13,
    paddingBottom: 10,
    backgroundColor: colors.backgroundElement,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  scroll: { flex: 1 },
  scrollContent: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.three,
    paddingTop: 14,
    paddingBottom: 24,
  },
  assignTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  assignTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  desc: {
    fontSize: 13.5,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 14,
  },
  responseArea: {
    backgroundColor: colors.backgroundElement,
    borderWidth: 0.5,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    fontSize: 13,
    color: colors.text,
    minHeight: 140,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: colors.gold,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 14,
  },
  submitText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '700',
  },
  draftBtn: {
    alignItems: 'center',
    paddingVertical: 9,
  },
});
