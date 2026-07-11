import { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { QUIZ_IMAGES } from '../../data/quiz/quizImageMap';
import actorData from '../../data/quiz/actor.json';
import haloData from '../../data/quiz/halo.json';
import memoryData from '../../data/quiz/memory.json';
import miyoziData from '../../data/quiz/miyozi.json';
import birthdayData from '../../data/quiz/birthday.json';
import puData from '../../data/quiz/pu.json';
import statusData from '../../data/quiz/status.json';

type Question = { prompt: string; answer: string; image?: string };

type Category = {
  key: string;
  label: string;
  description: string;
  data: Question[];
};

const CATEGORIES: Category[] = [
  { key: 'actor', label: '声優当て', description: '顔グラからCV担当声優を当てる', data: actorData },
  { key: 'halo', label: 'ヘイロー当て', description: 'ヘイローの形からキャラを当てる', data: haloData },
  { key: 'memory', label: 'メモロビ当て', description: 'メモリアルロビー画像からキャラを当てる', data: memoryData },
  { key: 'miyozi', label: '苗字当て', description: 'キャラクターの名字を当てる', data: miyoziData },
  { key: 'birthday', label: '誕生日当て', description: 'キャラクターの誕生日を当てる', data: birthdayData },
  { key: 'pu', label: 'セリフ当て', description: 'ボイスの決め台詞から誰か当てる', data: puData },
  { key: 'status', label: 'ステータス当て', description: 'ステータス画面の一言から誰か当てる', data: statusData },
];

const ROUND_SIZE = 10;
const CHOICE_COUNT = 4;

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildRound(category: Category) {
  const pool = shuffle(category.data).slice(0, Math.min(ROUND_SIZE, category.data.length));
  const uniqueAnswers = Array.from(new Set(category.data.map((q) => q.answer)));
  return pool.map((q) => {
    const distractors = shuffle(uniqueAnswers.filter((a) => a !== q.answer)).slice(0, CHOICE_COUNT - 1);
    const choices = shuffle([q.answer, ...distractors]);
    return { question: q, choices };
  });
}

function CategoryPicker({ onSelect }: { onSelect: (category: Category) => void }) {
  return (
    <ScrollView contentContainerStyle={styles.categoryList}>
      {CATEGORIES.map((category) => (
        <Pressable key={category.key} style={styles.categoryCard} onPress={() => onSelect(category)}>
          <Text style={styles.categoryLabel}>{category.label}</Text>
          <Text style={styles.categoryDescription}>{category.description}</Text>
          <Text style={styles.categoryCount}>全{category.data.length}問</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function QuizRound({ category, onExit }: { category: Category; onExit: () => void }) {
  const round = useMemo(() => buildRound(category), [category]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);

  const current = round[index];
  const finished = index >= round.length;

  function selectChoice(choice: string) {
    if (selected) return;
    setSelected(choice);
    if (choice === current.question.answer) {
      setScore((s) => s + 1);
    }
  }

  function next() {
    setSelected(null);
    setIndex((i) => i + 1);
  }

  if (finished) {
    return (
      <View style={styles.resultContainer}>
        <Text style={styles.resultTitle}>結果発表</Text>
        <Text style={styles.resultScore}>
          {score} / {round.length} 問正解
        </Text>
        <Pressable style={styles.primaryButton} onPress={() => { setIndex(0); setScore(0); setSelected(null); }}>
          <Text style={styles.primaryButtonLabel}>もう一度</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={onExit}>
          <Text style={styles.secondaryButtonLabel}>カテゴリ選択に戻る</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.quizContainer}>
      <Text style={styles.progress}>
        {index + 1} / {round.length}　正解数: {score}
      </Text>

      {current.question.image && (
        <Image source={QUIZ_IMAGES[current.question.image]} style={styles.quizImage} resizeMode="contain" />
      )}

      <Text style={styles.prompt}>{current.question.prompt}</Text>

      <View style={styles.choices}>
        {current.choices.map((choice) => {
          const isCorrect = choice === current.question.answer;
          const isSelected = choice === selected;
          const showResult = selected !== null;
          return (
            <Pressable
              key={choice}
              style={[
                styles.choiceButton,
                showResult && isCorrect && styles.choiceCorrect,
                showResult && isSelected && !isCorrect && styles.choiceWrong,
              ]}
              onPress={() => selectChoice(choice)}
              disabled={selected !== null}
            >
              <Text style={styles.choiceLabel}>{choice}</Text>
            </Pressable>
          );
        })}
      </View>

      {selected !== null && (
        <Pressable style={styles.primaryButton} onPress={next}>
          <Text style={styles.primaryButtonLabel}>
            {index + 1 === round.length ? '結果を見る' : '次の問題へ'}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

export function QuizApp() {
  const [category, setCategory] = useState<Category | null>(null);

  if (!category) {
    return <CategoryPicker onSelect={setCategory} />;
  }

  return <QuizRound category={category} onExit={() => setCategory(null)} />;
}

const styles = StyleSheet.create({
  categoryList: {
    padding: 24,
    gap: 12,
  },
  categoryCard: {
    backgroundColor: colors.panelOnLight,
    borderWidth: 1,
    borderColor: colors.panelBorderOnLight,
    borderRadius: 14,
    padding: 16,
    gap: 4,
  },
  categoryLabel: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '700',
  },
  categoryDescription: {
    color: colors.inkDim,
    fontSize: 12,
  },
  categoryCount: {
    color: colors.inkDim,
    fontSize: 11,
    marginTop: 4,
  },
  quizContainer: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    gap: 16,
  },
  progress: {
    color: colors.inkDim,
    fontSize: 12,
    letterSpacing: 1,
  },
  quizImage: {
    width: 220,
    height: 220,
    borderRadius: 12,
  },
  prompt: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  choices: {
    width: '100%',
    maxWidth: 420,
    gap: 10,
  },
  choiceButton: {
    backgroundColor: colors.panelOnLight,
    borderWidth: 1,
    borderColor: colors.panelBorderOnLight,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  choiceCorrect: {
    backgroundColor: 'rgba(94, 200, 128, 0.35)',
    borderColor: '#5ec880',
  },
  choiceWrong: {
    backgroundColor: 'rgba(255, 93, 108, 0.25)',
    borderColor: colors.danger,
  },
  choiceLabel: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  primaryButtonLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  secondaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  secondaryButtonLabel: {
    color: colors.inkDim,
    fontSize: 13,
  },
  resultContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
  },
  resultTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '700',
  },
  resultScore: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: '800',
  },
});
