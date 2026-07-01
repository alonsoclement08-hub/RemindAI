import { useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView,
} from 'react-native';

function OptionPill({ label, selected, onPress, multi }) {
  return (
    <Pressable
      style={[styles.pill, selected && (multi ? styles.pillChecked : styles.pillSelected)]}
      onPress={onPress}
    >
      {multi && (
        <View style={[styles.checkBox, selected && styles.checkBoxChecked]}>
          {selected && <Text style={styles.checkMark}>✓</Text>}
        </View>
      )}
      <Text style={[styles.pillText, selected && styles.pillTextSelected]}>{label}</Text>
    </Pressable>
  );
}

export default function QCMForm({ qcm, onSubmit }) {
  const [answers, setAnswers] = useState({});

  const setRadio = (id, value) => setAnswers((prev) => ({ ...prev, [id]: value }));

  const toggleCheckbox = (id, value) => {
    setAnswers((prev) => {
      const current = Array.isArray(prev[id]) ? prev[id] : [];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [id]: next };
    });
  };

  const isValid = () =>
    qcm.questions
      .filter((q) => q.required)
      .every((q) => {
        const val = answers[q.id];
        return val && (Array.isArray(val) ? val.length > 0 : val.trim() !== '');
      });

  return (
    <View style={styles.container}>
      {/* AI intro message */}
      <View style={styles.aiBubbleWrap}>
        <View style={styles.aiAvatar}>
          <Text style={styles.aiAvatarText}>IA</Text>
        </View>
        <View style={styles.aiBubble}>
          <Text style={styles.aiBubbleText}>{qcm.message}</Text>
        </View>
      </View>

      {/* Questions */}
      {qcm.questions.map((question) => {
        const isMulti = question.type === 'checkbox';
        const current = answers[question.id];

        return (
          <View key={question.id} style={styles.questionBlock}>
            <Text style={styles.questionLabel}>
              {question.label}
              {question.required && <Text style={styles.required}> *</Text>}
            </Text>
            <View style={styles.optionsWrap}>
              {question.options.map((opt) => {
                const selected = isMulti
                  ? Array.isArray(current) && current.includes(opt)
                  : current === opt;
                return (
                  <OptionPill
                    key={opt}
                    label={opt}
                    selected={selected}
                    multi={isMulti}
                    onPress={() =>
                      isMulti ? toggleCheckbox(question.id, opt) : setRadio(question.id, opt)
                    }
                  />
                );
              })}
            </View>
          </View>
        );
      })}

      {/* Submit */}
      <Pressable
        style={[styles.submitBtn, !isValid() && styles.submitBtnDisabled]}
        onPress={() => isValid() && onSubmit(answers)}
        disabled={!isValid()}
      >
        <Text style={styles.submitBtnText}>Valider les réponses ✓</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 8 },

  aiBubbleWrap: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 },
  aiAvatar: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#1D9E75',
    alignItems: 'center', justifyContent: 'center', marginRight: 10, marginTop: 2,
  },
  aiAvatarText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  aiBubble: {
    flex: 1, backgroundColor: '#f4f4f8', borderRadius: 16, borderTopLeftRadius: 4,
    padding: 14,
  },
  aiBubbleText: { fontSize: 15, color: '#333', lineHeight: 22 },

  questionBlock: { marginBottom: 20 },
  questionLabel: { fontSize: 14, fontWeight: '700', color: '#333', marginBottom: 10 },
  required: { color: '#E0654A' },
  optionsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

  pill: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#ddd', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#fff',
  },
  pillSelected: { borderColor: '#7F77DD', backgroundColor: '#7F77DD' },
  pillChecked: { borderColor: '#7F77DD', backgroundColor: '#f0efff' },
  pillText: { fontSize: 13, color: '#555', fontWeight: '500' },
  pillTextSelected: { color: '#fff' },

  checkBox: {
    width: 16, height: 16, borderRadius: 4, borderWidth: 1.5, borderColor: '#aaa',
    alignItems: 'center', justifyContent: 'center', marginRight: 6,
  },
  checkBoxChecked: { backgroundColor: '#7F77DD', borderColor: '#7F77DD' },
  checkMark: { color: '#fff', fontSize: 10, fontWeight: '700' },

  submitBtn: {
    backgroundColor: '#7F77DD', padding: 15, borderRadius: 12,
    alignItems: 'center', marginTop: 8,
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
