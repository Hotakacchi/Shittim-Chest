import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { CHARACTER_IMAGES } from '../data/characterImageMap';

type Student = {
  name: string;
  image: string;
  school?: string;
  club?: string;
  schoolYear?: string;
  age?: string;
  birthday?: string;
  height?: string;
  va?: string;
  illustrator?: string;
  hobby?: string;
  profile?: string;
};

function DetailRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

export function StudentDetailModal({
  student,
  onClose,
}: {
  student: Student | null;
  onClose: () => void;
}) {
  return (
    <Modal visible={student !== null} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.panel}>
          <Pressable onPress={onClose} style={styles.closeButton} hitSlop={10}>
            <Text style={styles.closeLabel}>✕</Text>
          </Pressable>

          {student && (
            <ScrollView contentContainerStyle={styles.body}>
              <Image
                source={CHARACTER_IMAGES[student.image]}
                style={styles.portrait}
                resizeMode="contain"
              />
              <Text style={styles.name}>{student.name}</Text>
              {(student.school || student.club) && (
                <Text style={styles.subtitle}>
                  {[student.school, student.club].filter(Boolean).join(' / ')}
                </Text>
              )}

              <View style={styles.detailGrid}>
                <DetailRow label="学年" value={student.schoolYear} />
                <DetailRow label="年齢" value={student.age} />
                <DetailRow label="誕生日" value={student.birthday} />
                <DetailRow label="身長" value={student.height} />
                <DetailRow label="声優" value={student.va} />
                <DetailRow label="絵師" value={student.illustrator} />
                <DetailRow label="趣味" value={student.hobby} />
              </View>

              {student.profile && <Text style={styles.profile}>{student.profile}</Text>}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  panel: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '85%',
    backgroundColor: colors.gradientTop,
    borderRadius: 18,
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.panelOnLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeLabel: {
    color: colors.ink,
    fontSize: 14,
  },
  body: {
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  portrait: {
    width: 160,
    height: 181,
  },
  name: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 8,
  },
  subtitle: {
    color: colors.inkDim,
    fontSize: 12,
    letterSpacing: 1,
    marginBottom: 8,
  },
  detailGrid: {
    width: '100%',
    gap: 6,
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.panelOnLight,
    borderWidth: 1,
    borderColor: colors.panelBorderOnLight,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  detailLabel: {
    color: colors.inkDim,
    fontSize: 12,
  },
  detailValue: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '600',
  },
  profile: {
    color: colors.ink,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 16,
    alignSelf: 'stretch',
  },
});
