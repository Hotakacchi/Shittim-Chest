import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';
import { colors } from '../theme/colors';
import { useSystemError } from '../lib/systemErrorScreen';
import appConfig from '../../app.json';

type StorageSummary = { keyCount: number; totalBytes: number };

async function getStorageSummary(): Promise<StorageSummary> {
  const keys = await AsyncStorage.getAllKeys();
  const pairs = await AsyncStorage.multiGet(keys);
  const totalBytes = pairs.reduce((sum, [, value]) => sum + (value?.length ?? 0), 0);
  return { keyCount: keys.length, totalBytes };
}

function formatTimestamp(date: Date): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const hh = date.getHours().toString().padStart(2, '0');
  const mm = date.getMinutes().toString().padStart(2, '0');
  const ss = date.getSeconds().toString().padStart(2, '0');
  return `${y}年${m}月${d}日 ${hh}:${mm}:${ss}`;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export function AdminPanel({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [storage, setStorage] = useState<StorageSummary | null>(null);
  const { activate: activateSystemError } = useSystemError();

  useEffect(() => {
    if (visible) {
      getStorageSummary().then(setStorage);
    } else {
      setStorage(null);
    }
  }, [visible]);

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.panel}>
          <View style={styles.header}>
            <Text style={styles.title}>管理者画面</Text>
            <Pressable onPress={onClose} style={styles.closeButton} hitSlop={10}>
              <Text style={styles.closeLabel}>✕</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body}>
            <Text style={styles.sectionLabel}>アプリ情報</Text>
            <InfoRow label="バージョン" value={appConfig.expo.version} />
            <InfoRow label="ビルド番号" value={appConfig.expo.ios.buildNumber} />

            <Text style={styles.sectionLabel}>expo-updates</Text>
            <InfoRow label="有効" value={Updates.isEnabled ? 'はい' : 'いいえ'} />
            <InfoRow label="ランタイムバージョン" value={Updates.runtimeVersion ?? '不明'} />
            <InfoRow label="チャンネル" value={Updates.channel ?? '未設定'} />
            <InfoRow label="起動元" value={Updates.isEmbeddedLaunch ? 'ネイティブ内蔵' : 'OTA更新'} />
            {!Updates.isEmbeddedLaunch && (
              <>
                <InfoRow label="Update ID" value={Updates.updateId ?? '不明'} />
                <InfoRow
                  label="公開日時"
                  value={Updates.createdAt ? formatTimestamp(Updates.createdAt) : '不明'}
                />
              </>
            )}

            <Text style={styles.sectionLabel}>ストレージ</Text>
            <InfoRow label="保存キー数" value={storage ? `${storage.keyCount}件` : '読込中…'} />
            <InfoRow
              label="使用量（概算）"
              value={storage ? `約${(storage.totalBytes / 1024).toFixed(1)} KB` : '読込中…'}
            />

            <Text style={styles.sectionLabel}>いたずら</Text>
            <Pressable
              style={styles.dangerButton}
              onPress={() => {
                activateSystemError();
                onClose();
              }}
            >
              <Text style={styles.dangerButtonLabel}>エラー画面を表示</Text>
            </Pressable>
            <Text style={styles.dangerHint}>
              解除するにはこの端末で管理者画面と同じ隠しコマンド（↑↑↓↓→←→←）を入力してください。
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  panel: {
    width: '100%',
    maxWidth: 460,
    maxHeight: '80%',
    backgroundColor: colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.panelBorder,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.panelBorder,
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 2,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.panel,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeLabel: {
    color: colors.text,
    fontSize: 13,
  },
  body: {
    padding: 20,
    gap: 10,
  },
  sectionLabel: {
    color: colors.accentBright,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  rowLabel: {
    color: colors.textDim,
    fontSize: 13,
  },
  rowValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'right',
  },
  dangerButton: {
    backgroundColor: 'rgba(255, 93, 108, 0.25)',
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  dangerButtonLabel: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '700',
  },
  dangerHint: {
    color: colors.textDim,
    fontSize: 11,
    lineHeight: 16,
  },
});
