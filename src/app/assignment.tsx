import { useState, useEffect, useCallback } from 'react';
import { ScrollView, View, Pressable, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { SuccessModal } from '@/components/success-modal';
import { Colors, Spacing, MaxContentWidth } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

const colors = Colors.dark;

type AssignmentData = {
  id: string;
  title: string;
  sub: string;
  done: boolean;
  response: string | null;
};

export default function AssignmentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [assignment, setAssignment] = useState<AssignmentData | null>(null);
  const [psychName, setPsychName] = useState('your psychologist');
  const [psychId, setPsychId] = useState<string | null>(null);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [successOpen, setSuccessOpen] = useState(false);

  async function loadData() {
    setLoading(true);
    if (!id) {
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    setPatientId(user.id);

    const { data: assignData, error: assignError } = await supabase
      .from('assignments')
      .select('id, title, sub, done, response')
      .eq('id', id)
      .eq('patient_id', user.id)
      .single();

    if (assignError) console.warn('ASSIGNMENT LOAD ERROR:', assignError.message);
    if (assignData) {
      setAssignment(assignData as AssignmentData);
      setResponse(assignData.response ?? '');
    }

    const { data: patientProfile } = await supabase
      .from('patient_profiles')
      .select('psychologist_id')
      .eq('id', user.id)
      .single();

    if (patientProfile?.psychologist_id) {
      setPsychId(patientProfile.psychologist_id);
      const { data: psychProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', patientProfile.psychologist_id)
        .single();
      if (psychProfile?.full_name) {
        setPsychName(`Dr. ${psychProfile.full_name.split(' ').slice(-1)[0]}`);
      }
    }

    setLoading(false);
  }

  useFocusEffect(useCallback(() => { loadData(); }, [id]));

  async function handleSubmit() {
    if (!assignment || submitting) return;
    setSubmitting(true);
    setSubmitError('');

    const { error } = await supabase
      .from('assignments')
      .update({ response: response.trim(), done: true })
      .eq('id', assignment.id);

    if (error) {
      setSubmitError(error.message);
      setSubmitting(false);
      return;
    }

    setAssignment((prev) => prev ? { ...prev, done: true, response: response.trim() } : prev);

    if (psychId) {
      const { error: notifError } = await supabase.from('notifications').insert({
        user_id: psychId,
        type: 'assignment_completed',
        title: 'Assignment completed',
        body: assignment.title,
        related_id: assignment.id,
      });
      if (notifError) console.warn('COMPLETION NOTIFICATION ERROR:', notifError.message);
    }

    setSubmitting(false);
    setSuccessOpen(true);
  }

  const handleSuccessClose = () => {
    setSuccessOpen(false);
    router.back();
  };

  if (loading) {
    return (
      <ThemedView style={styles.screen}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={24} color={colors.gold} />
          </Pressable>
          <ThemedText style={styles.headerTitle}>Assignment</ThemedText>
          <View style={{ width: 24 }} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={colors.teal} />
        </View>
      </ThemedView>
    );
  }

  if (!assignment) {
    return (
      <ThemedView style={styles.screen}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={24} color={colors.gold} />
          </Pressable>
          <ThemedText style={styles.headerTitle}>Assignment</ThemedText>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.notFound}>
          <ThemedText>Assignment not found.</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.gold} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>{assignment.title}</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.assignTag, { backgroundColor: `${colors.teal}26` }]}>
          <Ionicons name="clipboard-outline" size={12} color={colors.teal} />
          <ThemedText style={[styles.assignTagText, { color: colors.teal }]}>
            {' '}From {psychName}
          </ThemedText>
        </View>

        {assignment.sub ? (
          <ThemedText type="small" themeColor="textTertiary" style={{ marginBottom: 8 }}>
            {assignment.sub}
          </ThemedText>
        ) : null}

        {assignment.done ? (
          <>
            <View style={styles.doneBanner}>
              <Ionicons name="checkmark-circle" size={16} color={colors.green} />
              <ThemedText type="small" style={{ color: colors.green, fontWeight: '600' }}>
                {' '}Submitted
              </ThemedText>
            </View>
            <ThemedText style={styles.responseReadOnly}>
              {assignment.response || 'No response was written.'}
            </ThemedText>
          </>
        ) : (
          <>
            <TextInput
              value={response}
              onChangeText={setResponse}
              placeholder="Write your response here… there are no wrong answers."
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={6}
              style={styles.responseArea}
            />

            {submitError !== '' && (
              <ThemedText type="small" themeColor="error" style={{ marginTop: 8 }}>
                {submitError}
              </ThemedText>
            )}

            <Pressable
              onPress={handleSubmit}
              disabled={submitting}
              style={[styles.submitBtn, submitting && { opacity: 0.6 }]}>
              <ThemedText style={styles.submitText}>
                {submitting ? 'Submitting…' : `Submit to ${psychName}`}
              </ThemedText>
            </Pressable>
            <Pressable onPress={() => router.back()} style={styles.draftBtn}>
              <ThemedText type="small" themeColor="textTertiary">
                Save draft
              </ThemedText>
            </Pressable>
          </>
        )}
      </ScrollView>

      <SuccessModal
        visible={successOpen}
        onClose={handleSuccessClose}
        icon="✅"
        title="Submitted!"
        subtitle={`${psychName} will review your response before your next session.`}
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
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
  doneBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  responseReadOnly: {
    backgroundColor: colors.backgroundElement,
    borderWidth: 0.5,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    fontSize: 13,
    color: colors.text,
    lineHeight: 20,
    fontStyle: 'italic',
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
