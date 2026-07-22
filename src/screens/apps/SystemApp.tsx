import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as Updates from 'expo-updates';
import { colors } from '../../theme/colors';
import { STORAGE_KEYS } from '../../lib/storageKeys';
import { HiddenGestureZone } from '../../components/HiddenGestureZone';
import { AdminPanel } from '../../components/AdminPanel';
import { useLanguage, LANGUAGE_NAMES, Language } from '../../i18n';
import appConfig from '../../../app.json';

type UpdateStatus = 'idle' | 'checking' | 'available' | 'downloading' | 'upToDate' | 'error';

function UpdateSection() {
  const { t } = useLanguage();
  const [status, setStatus] = useState<UpdateStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (Updates.isEnabled) {
      checkForUpdate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!Updates.isEnabled) {
    return (
      <View style={styles.row}>
        <View style={styles.rowText}>
          <Text style={styles.rowLabel}>{t('system.updateLabel')}</Text>
          <Text style={styles.rowDescription}>{t('system.updateUnavailable')}</Text>
        </View>
      </View>
    );
  }

  async function checkForUpdate() {
    setStatus('checking');
    setErrorMessage('');
    try {
      const result = await Updates.checkForUpdateAsync();
      setStatus(result.isAvailable ? 'available' : 'upToDate');
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : String(error));
    }
  }

  async function applyUpdate() {
    setStatus('downloading');
    setErrorMessage('');
    try {
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : String(error));
    }
  }

  const statusLabel: Record<UpdateStatus, string> = {
    idle: t('system.updateIdle', { channel: Updates.channel ?? t('common.notSet') }),
    checking: t('system.updateChecking'),
    available: t('system.updateAvailable'),
    downloading: t('system.updateDownloading'),
    upToDate: t('system.updateUpToDate'),
    error: t('system.updateError', { message: errorMessage }),
  };

  const busy = status === 'checking' || status === 'downloading';

  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{t('system.updateLabel')}</Text>
        <Text style={styles.rowDescription}>{statusLabel[status]}</Text>
      </View>
      <Pressable
        style={styles.updateButton}
        onPress={status === 'available' ? applyUpdate : checkForUpdate}
        disabled={busy}
      >
        <Text style={styles.updateButtonLabel}>
          {status === 'available' ? t('system.updateApply') : t('system.updateCheck')}
        </Text>
      </Pressable>
    </View>
  );
}

function formatUpdateTimestamp(date: Date): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const hh = date.getHours().toString().padStart(2, '0');
  const mm = date.getMinutes().toString().padStart(2, '0');
  return `${y}年${m}月${d}日 ${hh}:${mm}`;
}

function CurrentUpdateInfo() {
  const { t } = useLanguage();
  if (!Updates.isEnabled) return null;

  const detailLine = Updates.isEmbeddedLaunch
    ? t('system.currentStatusEmbedded')
    : Updates.createdAt
      ? t('system.currentStatusPublished', { date: formatUpdateTimestamp(Updates.createdAt) })
      : t('system.currentStatusUnknown');

  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{t('system.currentStatusLabel')}</Text>
        <Text style={styles.rowDescription}>{detailLine}</Text>
        {!Updates.isEmbeddedLaunch && Updates.updateId && (
          <Text style={styles.rowDescription}>ID: {Updates.updateId.slice(0, 8)}</Text>
        )}
      </View>
    </View>
  );
}

function SettingRow({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: 'rgba(30,58,82,0.2)', true: colors.accent }}
        thumbColor="#ffffff"
      />
    </View>
  );
}

const LANGUAGE_OPTIONS: Language[] = ['ja', 'en', 'ko', 'zh'];

function LanguageRow() {
  const { language, setLanguage, t } = useLanguage();
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{t('system.languageLabel')}</Text>
        <Text style={styles.rowDescription}>{t('system.languageDesc')}</Text>
      </View>
      <View style={styles.languageOptions}>
        {LANGUAGE_OPTIONS.map((option) => (
          <Pressable
            key={option}
            style={[styles.languageChip, language === option && styles.languageChipActive]}
            onPress={() => setLanguage(option)}
          >
            <Text
              style={[
                styles.languageChipLabel,
                language === option && styles.languageChipLabelActive,
              ]}
            >
              {LANGUAGE_NAMES[option]}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export function SystemApp() {
  const { t } = useLanguage();
  const [keepAwake, setKeepAwake] = useState(false);
  const [skipBoot, setSkipBoot] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.keepAwake),
      AsyncStorage.getItem(STORAGE_KEYS.skipBootAnimation),
    ]).then(([keepAwakeRaw, skipBootRaw]) => {
      setKeepAwake(keepAwakeRaw === 'true');
      setSkipBoot(skipBootRaw === 'true');
      setLoaded(true);
    });
  }, []);

  function onChangeKeepAwake(value: boolean) {
    setKeepAwake(value);
    AsyncStorage.setItem(STORAGE_KEYS.keepAwake, value ? 'true' : 'false');
    if (value) {
      activateKeepAwakeAsync();
    } else {
      deactivateKeepAwake();
    }
  }

  function onChangeSkipBoot(value: boolean) {
    setSkipBoot(value);
    AsyncStorage.setItem(STORAGE_KEYS.skipBootAnimation, value ? 'true' : 'false');
  }

  if (!loaded) return null;

  return (
    <View style={styles.container}>
      <SettingRow
        label={t('system.keepAwakeLabel')}
        description={t('system.keepAwakeDesc')}
        value={keepAwake}
        onChange={onChangeKeepAwake}
      />
      <SettingRow
        label={t('system.skipBootLabel')}
        description={t('system.skipBootDesc')}
        value={skipBoot}
        onChange={onChangeSkipBoot}
      />
      <LanguageRow />

      <UpdateSection />
      <HiddenGestureZone onUnlock={() => setShowAdmin(true)}>
        <CurrentUpdateInfo />
      </HiddenGestureZone>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {t('system.footer', { version: appConfig.expo.version })}
        </Text>
      </View>

      <AdminPanel visible={showAdmin} onClose={() => setShowAdmin(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.panelOnLight,
    borderWidth: 1,
    borderColor: colors.panelBorderOnLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowText: {
    flex: 1,
    marginRight: 12,
    gap: 4,
  },
  rowLabel: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '600',
  },
  rowDescription: {
    color: colors.inkDim,
    fontSize: 12,
  },
  updateButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.accent,
  },
  updateButtonLabel: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  languageOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'flex-end',
  },
  languageChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.panelBorderOnLight,
  },
  languageChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  languageChipLabel: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: '600',
  },
  languageChipLabelActive: {
    color: '#ffffff',
  },
  footer: {
    marginTop: 'auto',
    alignItems: 'center',
    paddingVertical: 12,
  },
  footerText: {
    color: colors.inkDim,
    fontSize: 12,
    letterSpacing: 1,
  },
});
