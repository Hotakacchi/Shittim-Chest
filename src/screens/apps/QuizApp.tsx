import { useEffect, useState } from 'react';
import { Alert, BackHandler, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../../theme/colors';
import { QUIZ_IMAGES } from '../../data/quiz/quizImageMap';
import { CHARACTER_IMAGES } from '../../data/characterImageMap';
import { useLanguage } from '../../i18n';
import {
  loadQuizStats,
  recordAnswer,
  loadFullRoundBest,
  recordFullRoundResult,
  QuizStats,
} from '../../lib/quizStats';
import {
  loadCustomQuizPacks,
  addCustomQuizPackFromUrl,
  removeCustomQuizPack,
  CustomQuizPack,
  QuizPackImportError,
} from '../../lib/customQuizPacks';
import { ChoiceQuestion, TextQuestion, DateQuestion, Question } from '../../lib/quizTypes';
import actorData from '../../data/quiz/actor.json';
import haloData from '../../data/quiz/halo.json';
import memoryData from '../../data/quiz/memory.json';
import miyoziData from '../../data/quiz/miyozi.json';
import birthdayData from '../../data/quiz/birthday.json';
import puData from '../../data/quiz/pu.json';
import statusData from '../../data/quiz/status.json';

// actor/halo/memory reference the older quiz-specific asset set; miyozi and
// birthday were regenerated from the character roster's own portraits — the
// two image maps use disjoint filename schemes, so they merge cleanly.
const ALL_IMAGES: Record<string, number> = { ...QUIZ_IMAGES, ...CHARACTER_IMAGES };

// Custom packs carry remote image URLs instead of a local asset key.
function resolveImageSource(image: string) {
  if (/^https?:\/\//i.test(image)) return { uri: image };
  return ALL_IMAGES[image];
}

type Category = {
  key: string;
  data: Question[];
  imageAspect: 'square' | 'wide';
  // Present only for user-imported packs — built-in categories are looked
  // up by key in the translation dictionary instead.
  custom?: { id: string; label: string; description: string };
};

function categoryLabel(t: (key: string, vars?: Record<string, string | number>) => string, category: Category): string {
  return category.custom ? category.custom.label : t(`quiz.categories.${category.key}.label`);
}

function categoryDescription(t: (key: string, vars?: Record<string, string | number>) => string, category: Category): string {
  return category.custom ? category.custom.description : t(`quiz.categories.${category.key}.description`);
}

function withMode<T extends { prompt: string }>(mode: Question['mode'], items: T[]): (T & { mode: Question['mode'] })[] {
  return items.map((item) => ({ ...item, mode }));
}

const CATEGORIES: Category[] = [
  { key: 'actor', data: withMode('choice', actorData) as Question[], imageAspect: 'square' },
  { key: 'halo', data: withMode('choice', haloData) as Question[], imageAspect: 'square' },
  { key: 'memory', data: withMode('choice', memoryData) as Question[], imageAspect: 'wide' },
  { key: 'miyozi', data: withMode('text', miyoziData) as Question[], imageAspect: 'square' },
  { key: 'birthday', data: withMode('date', birthdayData) as Question[], imageAspect: 'square' },
  { key: 'pu', data: withMode('choice', puData) as Question[], imageAspect: 'square' },
  { key: 'status', data: withMode('choice', statusData) as Question[], imageAspect: 'square' },
];

const ROUND_SIZE_OPTIONS = [5, 10, 20];
const CHOICE_COUNT = 4;
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildRound(category: Category, roundSize: number) {
  const pool = shuffle(category.data).slice(0, Math.min(roundSize, category.data.length));
  const uniqueAnswers =
    category.data[0]?.mode === 'choice'
      ? Array.from(new Set((category.data as ChoiceQuestion[]).map((q) => q.answer)))
      : [];
  return pool.map((q) => {
    if (q.mode !== 'choice') return { question: q, choices: [] as string[] };
    const distractors = shuffle(uniqueAnswers.filter((a) => a !== q.answer)).slice(0, CHOICE_COUNT - 1);
    const choices = shuffle([q.answer, ...distractors]);
    return { question: q, choices };
  });
}

function CategoryPicker({
  categories,
  stats,
  fullRoundStats,
  onSelect,
  onAddCustom,
  onRemoveCustom,
}: {
  categories: Category[];
  stats: QuizStats;
  fullRoundStats: QuizStats;
  onSelect: (category: Category) => void;
  onAddCustom: () => void;
  onRemoveCustom: (category: Category) => void;
}) {
  const { t } = useLanguage();
  return (
    <ScrollView contentContainerStyle={styles.categoryList}>
      {categories.map((category) => {
        const stat = stats[category.key];
        const accuracy = stat && stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : null;
        const fullRound = fullRoundStats[category.key];
        return (
          <Pressable key={category.key} style={styles.categoryCard} onPress={() => onSelect(category)}>
            {category.custom && (
              <Pressable
                style={styles.removeCustomButton}
                onPress={() => onRemoveCustom(category)}
                hitSlop={8}
              >
                <Text style={styles.removeCustomButtonLabel}>✕</Text>
              </Pressable>
            )}
            <View style={styles.categoryTitleRow}>
              <Text style={styles.categoryLabel}>{categoryLabel(t, category)}</Text>
              {category.custom && (
                <View style={styles.customBadge}>
                  <Text style={styles.customBadgeLabel}>{t('quiz.customBadge')}</Text>
                </View>
              )}
            </View>
            <Text style={styles.categoryDescription}>{categoryDescription(t, category)}</Text>
            <Text style={styles.categoryCount}>{t('quiz.questionCount', { count: category.data.length })}</Text>
            {accuracy !== null && (
              <Text style={styles.categoryStats}>
                {t('quiz.cumulativeAccuracy', { percent: accuracy, correct: stat.correct, total: stat.total })}
              </Text>
            )}
            {fullRound && (
              <Text style={styles.fullRoundStats}>
                {t('quiz.fullRoundBest', { correct: fullRound.correct, total: fullRound.total })}
              </Text>
            )}
          </Pressable>
        );
      })}
      <Pressable style={styles.addCustomCard} onPress={onAddCustom}>
        <Text style={styles.addCustomLabel}>{t('quiz.addCustomPack')}</Text>
      </Pressable>
    </ScrollView>
  );
}

function AddCustomPackModal({
  visible,
  onClose,
  onAdded,
}: {
  visible: boolean;
  onClose: () => void;
  onAdded: () => void;
}) {
  const { t } = useLanguage();
  const [url, setUrl] = useState('');
  const [importing, setImporting] = useState(false);

  async function handleImport() {
    if (!url.trim() || importing) return;
    setImporting(true);
    try {
      const pack = await addCustomQuizPackFromUrl(url);
      setImporting(false);
      setUrl('');
      onAdded();
      onClose();
      Alert.alert(
        t('quiz.addedTitle'),
        t('quiz.addedMessage', { label: pack.label, count: pack.questions.length }),
      );
    } catch (err) {
      setImporting(false);
      const message =
        err instanceof QuizPackImportError
          ? t(`quiz.customImportError.${err.code}`, err.params)
          : t('quiz.customImportError.unknown');
      Alert.alert(t('quiz.addFailedTitle'), message);
    }
  }

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalPanel}>
          <Text style={styles.modalTitle}>{t('quiz.addCustomPackTitle')}</Text>
          <TextInput
            value={url}
            onChangeText={setUrl}
            placeholder={t('quiz.urlPlaceholder')}
            placeholderTextColor={colors.inkDim}
            style={styles.modalInput}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            editable={!importing}
          />
          <View style={styles.modalButtonRow}>
            <Pressable style={styles.secondaryButton} onPress={onClose} disabled={importing}>
              <Text style={styles.secondaryButtonLabel}>{t('common.cancel')}</Text>
            </Pressable>
            <Pressable
              style={[styles.primaryButton, importing && styles.primaryButtonDisabled]}
              onPress={handleImport}
              disabled={importing}
            >
              <Text style={styles.primaryButtonLabel}>
                {importing ? t('quiz.importing') : t('common.add')}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function RoundSizeSelector({
  category,
  onSelect,
  onBack,
}: {
  category: Category;
  onSelect: (roundSize: number) => void;
  onBack: () => void;
}) {
  const { t } = useLanguage();
  return (
    <View style={styles.sizeContainer}>
      <Text style={styles.categoryLabel}>{categoryLabel(t, category)}</Text>
      <Text style={styles.categoryDescription}>{t('quiz.chooseRoundSize')}</Text>
      <View style={styles.sizeOptions}>
        {ROUND_SIZE_OPTIONS.filter((size) => size < category.data.length).map((size) => (
          <Pressable key={size} style={styles.sizeButton} onPress={() => onSelect(size)}>
            <Text style={styles.sizeButtonLabel}>{t('quiz.roundSizeOption', { count: size })}</Text>
          </Pressable>
        ))}
        <Pressable style={styles.sizeButton} onPress={() => onSelect(category.data.length)}>
          <Text style={styles.sizeButtonLabel}>
            {t('quiz.roundSizeAll', { count: category.data.length })}
          </Text>
        </Pressable>
      </View>
      <Pressable style={styles.secondaryButton} onPress={onBack}>
        <Text style={styles.secondaryButtonLabel}>{t('quiz.backToCategories')}</Text>
      </Pressable>
    </View>
  );
}

function ChoiceAnswer({
  question,
  choices,
  selected,
  onSelect,
}: {
  question: ChoiceQuestion;
  choices: string[];
  selected: string | null;
  onSelect: (choice: string) => void;
}) {
  return (
    <View style={styles.choices}>
      {choices.map((choice) => {
        const isCorrect = choice === question.answer;
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
            onPress={() => onSelect(choice)}
            disabled={selected !== null}
          >
            <Text style={styles.choiceLabel}>{choice}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function TextAnswer({
  question,
  submitted,
  onSubmit,
}: {
  question: TextQuestion;
  submitted: string | null;
  onSubmit: (value: string) => void;
}) {
  const { t } = useLanguage();
  const [draft, setDraft] = useState('');
  const isCorrect = submitted !== null && question.answers.includes(submitted.trim());

  return (
    <View style={styles.textAnswerBlock}>
      <TextInput
        value={draft}
        onChangeText={setDraft}
        editable={submitted === null}
        placeholder={t('quiz.surnamePlaceholder')}
        placeholderTextColor={colors.inkDim}
        style={[styles.textInput, submitted !== null && (isCorrect ? styles.choiceCorrect : styles.choiceWrong)]}
        onSubmitEditing={() => draft.trim() && onSubmit(draft)}
        returnKeyType="done"
      />
      {submitted === null ? (
        <Pressable style={styles.primaryButton} onPress={() => draft.trim() && onSubmit(draft)}>
          <Text style={styles.primaryButtonLabel}>{t('quiz.submitAnswer')}</Text>
        </Pressable>
      ) : (
        <Text style={styles.revealText}>
          {isCorrect ? t('quiz.correct') : t('quiz.incorrectText', { answer: question.answers[0] })}
        </Text>
      )}
    </View>
  );
}

function DateAnswer({
  question,
  submitted,
  onSubmit,
}: {
  question: DateQuestion;
  submitted: { month: number; day: number } | null;
  onSubmit: (value: { month: number; day: number }) => void;
}) {
  const { t } = useLanguage();
  const [month, setMonth] = useState<number | null>(null);
  const [day, setDay] = useState<number | null>(null);
  const isCorrect = submitted !== null && submitted.month === question.month && submitted.day === question.day;

  return (
    <View style={styles.dateAnswerBlock}>
      <Text style={styles.pickerLabel}>{t('quiz.month')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerRow}>
        {MONTHS.map((m) => (
          <Pressable
            key={m}
            style={[styles.pickerCell, month === m && styles.pickerCellActive]}
            onPress={() => submitted === null && setMonth(m)}
            disabled={submitted !== null}
          >
            <Text style={[styles.pickerCellLabel, month === m && styles.pickerCellLabelActive]}>{m}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <Text style={styles.pickerLabel}>{t('quiz.day')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerRow}>
        {DAYS.map((d) => (
          <Pressable
            key={d}
            style={[styles.pickerCell, day === d && styles.pickerCellActive]}
            onPress={() => submitted === null && setDay(d)}
            disabled={submitted !== null}
          >
            <Text style={[styles.pickerCellLabel, day === d && styles.pickerCellLabelActive]}>{d}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {submitted === null ? (
        <Pressable
          style={[styles.primaryButton, (!month || !day) && styles.primaryButtonDisabled]}
          onPress={() => month && day && onSubmit({ month, day })}
          disabled={!month || !day}
        >
          <Text style={styles.primaryButtonLabel}>{t('quiz.submitAnswer')}</Text>
        </Pressable>
      ) : (
        <Text style={styles.revealText}>
          {isCorrect ? t('quiz.correct') : t('quiz.incorrectDate', { month: question.month, day: question.day })}
        </Text>
      )}
    </View>
  );
}

function QuizRound({
  category,
  roundSize,
  onExit,
}: {
  category: Category;
  roundSize: number;
  onExit: () => void;
}) {
  const { t } = useLanguage();
  const [round, setRound] = useState(() => buildRound(category, roundSize));
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [choiceSelected, setChoiceSelected] = useState<string | null>(null);
  const [textSubmitted, setTextSubmitted] = useState<string | null>(null);
  const [dateSubmitted, setDateSubmitted] = useState<{ month: number; day: number } | null>(null);

  const current = round[index];
  const finished = index >= round.length;
  const answered = choiceSelected !== null || textSubmitted !== null || dateSubmitted !== null;
  const isFullRound = roundSize >= category.data.length;

  useEffect(() => {
    if (finished && isFullRound) {
      recordFullRoundResult(category.key, score, round.length);
    }
    // Only fires once per completed round — `finished` flips from false to
    // true exactly once before もう一度/カテゴリ選択に戻る resets or leaves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  function next() {
    setChoiceSelected(null);
    setTextSubmitted(null);
    setDateSubmitted(null);
    setIndex((i) => i + 1);
  }

  function handleChoice(choice: string) {
    if (current.question.mode !== 'choice' || choiceSelected !== null) return;
    setChoiceSelected(choice);
    const isCorrect = choice === current.question.answer;
    if (isCorrect) setScore((s) => s + 1);
    recordAnswer(category.key, isCorrect);
  }

  function handleText(value: string) {
    if (current.question.mode !== 'text') return;
    setTextSubmitted(value);
    const isCorrect = current.question.answers.includes(value.trim());
    if (isCorrect) setScore((s) => s + 1);
    recordAnswer(category.key, isCorrect);
  }

  function handleDate(value: { month: number; day: number }) {
    if (current.question.mode !== 'date') return;
    setDateSubmitted(value);
    const isCorrect = value.month === current.question.month && value.day === current.question.day;
    if (isCorrect) setScore((s) => s + 1);
    recordAnswer(category.key, isCorrect);
  }

  if (finished) {
    return (
      <View style={styles.resultContainer}>
        <Text style={styles.resultTitle}>{t('quiz.resultTitle')}</Text>
        <Text style={styles.resultScore}>
          {t('quiz.resultScore', { score, total: round.length })}
        </Text>
        <Pressable
          style={styles.primaryButton}
          onPress={() => {
            setRound(buildRound(category, roundSize));
            setIndex(0);
            setScore(0);
            setChoiceSelected(null);
            setTextSubmitted(null);
            setDateSubmitted(null);
          }}
        >
          <Text style={styles.primaryButtonLabel}>{t('quiz.retry')}</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={onExit}>
          <Text style={styles.secondaryButtonLabel}>{t('quiz.backToCategories')}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.quizContainer}>
      <Text style={styles.progress}>
        {t('quiz.progress', { current: index + 1, total: round.length, score })}
      </Text>

      {'image' in current.question && current.question.image && (
        <Image
          source={resolveImageSource(current.question.image)}
          style={category.imageAspect === 'wide' ? styles.quizImageWide : styles.quizImageSquare}
          resizeMode="contain"
        />
      )}

      <Text style={styles.prompt}>{current.question.prompt}</Text>

      {current.question.mode === 'choice' && (
        <ChoiceAnswer
          question={current.question}
          choices={current.choices}
          selected={choiceSelected}
          onSelect={handleChoice}
        />
      )}
      {current.question.mode === 'text' && (
        <TextAnswer key={index} question={current.question} submitted={textSubmitted} onSubmit={handleText} />
      )}
      {current.question.mode === 'date' && (
        <DateAnswer key={index} question={current.question} submitted={dateSubmitted} onSubmit={handleDate} />
      )}

      {answered && (
        <Pressable style={styles.primaryButton} onPress={next}>
          <Text style={styles.primaryButtonLabel}>
            {index + 1 === round.length ? t('quiz.seeResults') : t('quiz.nextQuestion')}
          </Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

type Stage =
  | { screen: 'picker' }
  | { screen: 'size'; category: Category }
  | { screen: 'round'; category: Category; roundSize: number };

function packToCategory(pack: CustomQuizPack): Category {
  return {
    key: `custom:${pack.id}`,
    data: pack.questions,
    imageAspect: 'square',
    custom: { id: pack.id, label: pack.label, description: pack.description },
  };
}

export function QuizApp() {
  const { t } = useLanguage();
  const [stage, setStage] = useState<Stage>({ screen: 'picker' });
  const [stats, setStats] = useState<QuizStats>({});
  const [fullRoundStats, setFullRoundStats] = useState<QuizStats>({});
  const [customPacks, setCustomPacks] = useState<CustomQuizPack[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    if (stage.screen === 'picker') {
      loadQuizStats().then(setStats);
      loadFullRoundBest().then(setFullRoundStats);
      loadCustomQuizPacks().then(setCustomPacks);
    }
  }, [stage.screen]);

  const categories: Category[] = [...CATEGORIES, ...customPacks.map(packToCategory)];

  // Steps back one screen instead of exiting the app outright — same
  // destination as the on-screen "カテゴリ選択に戻る" controls already give.
  useEffect(() => {
    if (stage.screen === 'picker') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (stage.screen === 'round') {
        setStage({ screen: 'size', category: stage.category });
      } else {
        setStage({ screen: 'picker' });
      }
      return true;
    });
    return () => sub.remove();
  }, [stage]);

  function handleRemoveCustom(category: Category) {
    if (!category.custom) return;
    const id = category.custom.id;
    const label = category.custom.label;
    Alert.alert(t('quiz.removeConfirmTitle'), t('quiz.removeConfirmMessage', { label }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          removeCustomQuizPack(id).then(setCustomPacks);
        },
      },
    ]);
  }

  if (stage.screen === 'picker') {
    return (
      <>
        <CategoryPicker
          categories={categories}
          stats={stats}
          fullRoundStats={fullRoundStats}
          onSelect={(category) => setStage({ screen: 'size', category })}
          onAddCustom={() => setShowAddModal(true)}
          onRemoveCustom={handleRemoveCustom}
        />
        <AddCustomPackModal
          visible={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAdded={() => loadCustomQuizPacks().then(setCustomPacks)}
        />
      </>
    );
  }

  if (stage.screen === 'size') {
    return (
      <RoundSizeSelector
        category={stage.category}
        onSelect={(roundSize) => setStage({ screen: 'round', category: stage.category, roundSize })}
        onBack={() => setStage({ screen: 'picker' })}
      />
    );
  }

  return (
    <QuizRound
      category={stage.category}
      roundSize={stage.roundSize}
      onExit={() => setStage({ screen: 'picker' })}
    />
  );
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
  categoryStats: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
  },
  fullRoundStats: {
    color: colors.warning,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  categoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 28,
  },
  customBadge: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  customBadgeLabel: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  removeCustomButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 93, 108, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeCustomButtonLabel: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  addCustomCard: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.panelBorderOnLight,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  addCustomLabel: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalPanel: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.panelBorder,
    padding: 20,
    gap: 14,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  modalInput: {
    backgroundColor: colors.panelOnLight,
    borderWidth: 1,
    borderColor: colors.panelBorderOnLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.ink,
    fontSize: 14,
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
  },
  sizeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
  },
  sizeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  sizeButton: {
    backgroundColor: colors.panelOnLight,
    borderWidth: 1,
    borderColor: colors.panelBorderOnLight,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  sizeButtonLabel: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '600',
  },
  quizContainer: {
    flexGrow: 1,
    padding: 24,
    alignItems: 'center',
    gap: 16,
  },
  progress: {
    color: colors.inkDim,
    fontSize: 12,
    letterSpacing: 1,
  },
  quizImageSquare: {
    width: 280,
    height: 280,
    borderRadius: 12,
  },
  quizImageWide: {
    width: 420,
    height: 189,
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
  textAnswerBlock: {
    width: '100%',
    maxWidth: 420,
    gap: 12,
    alignItems: 'center',
  },
  textInput: {
    width: '100%',
    backgroundColor: colors.panelOnLight,
    borderWidth: 1,
    borderColor: colors.panelBorderOnLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: colors.ink,
    fontSize: 15,
    textAlign: 'center',
  },
  dateAnswerBlock: {
    width: '100%',
    maxWidth: 480,
    gap: 8,
    alignItems: 'center',
  },
  pickerLabel: {
    color: colors.inkDim,
    fontSize: 12,
    letterSpacing: 1,
    alignSelf: 'flex-start',
  },
  pickerRow: {
    width: '100%',
    maxHeight: 52,
  },
  pickerCell: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.panelOnLight,
    borderWidth: 1,
    borderColor: colors.panelBorderOnLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  pickerCellActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  pickerCellLabel: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '600',
  },
  pickerCellLabelActive: {
    color: '#ffffff',
  },
  revealText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  primaryButtonDisabled: {
    opacity: 0.4,
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
