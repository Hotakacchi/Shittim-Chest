import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';
import { colors } from '../theme/colors';
import { useSystemError } from '../lib/systemErrorScreen';
import { useLanguage } from '../i18n';
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
  const { t } = useLanguage();
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
            <Text style={styles.title}>{t('admin.title')}</Text>
            <Pressable onPress={onClose} style={styles.closeButton} hitSlop={10}>
              <Text style={styles.closeLabel}>✕</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body}>
            <Text style={styles.sectionLabel}>{t('admin.appInfoSection')}</Text>
            <InfoRow label={t('admin.version')} value={appConfig.expo.version} />
            <InfoRow label={t('admin.buildNumber')} value={appConfig.expo.ios.buildNumber} />

            <Text style={styles.sectionLabel}>{t('admin.updatesSection')}</Text>
            <InfoRow label={t('admin.enabled')} value={Updates.isEnabled ? t('common.yes') : t('common.no')} />
            <InfoRow
              label={t('admin.runtimeVersion')}
              value={Updates.runtimeVersion ?? t('common.unknown')}
            />
            <InfoRow label={t('admin.channel')} value={Updates.channel ?? t('common.notSet')} />
            <InfoRow
              label={t('admin.launchSource')}
              value={Updates.isEmbeddedLaunch ? t('admin.embeddedLaunch') : t('admin.otaLaunch')}
            />
            {!Updates.isEmbeddedLaunch && (
              <>
                <InfoRow label={t('admin.updateId')} value={Updates.updateId ?? t('common.unknown')} />
                <InfoRow
                  label={t('admin.publishedAt')}
                  value={Updates.createdAt ? formatTimestamp(Updates.createdAt) : t('common.unknown')}
                />
              </>
            )}

            <Text style={styles.sectionLabel}>{t('admin.storageSection')}</Text>
            <InfoRow
              label={t('admin.storedKeys')}
              value={storage ? t('admin.storedKeysUnit', { count: storage.keyCount }) : t('common.loading')}
            />
            <InfoRow
              label={t('admin.storageUsage')}
              value={
                storage
                  ? t('admin.storageUsageValue', { kb: (storage.totalBytes / 1024).toFixed(1) })
                  : t('common.loading')
              }
            />

            <Text style={styles.sectionLabel}>{t('admin.mischiefSection')}</Text>
            <Pressable
              style={styles.dangerButton}
              onPress={() => {
                activateSystemError();
                onClose();
              }}
            >
              <Text style={styles.dangerButtonLabel}>{t('admin.showErrorScreen')}</Text>
            </Pressable>
            <Text style={styles.dangerHint}>{t('admin.dismissHint')}</Text>
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
