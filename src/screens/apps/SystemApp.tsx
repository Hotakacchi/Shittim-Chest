import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as Updates from 'expo-updates';
import { colors } from '../../theme/colors';
import { STORAGE_KEYS } from '../../lib/storageKeys';
import appConfig from '../../../app.json';

type UpdateStatus = 'idle' | 'checking' | 'available' | 'downloading' | 'upToDate' | 'error';

function UpdateSection() {
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
          <Text style={styles.rowLabel}>アップデート</Text>
          <Text style={styles.rowDescription}>
            この機能はビルド版でのみ利用できます（Expo Go/開発中は無効）
          </Text>
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
    idle: `チャンネル: ${Updates.channel ?? '未設定'}`,
    checking: '確認中…',
    available: '別バージョンが見つかりました',
    downloading: '更新をダウンロード中…',
    upToDate: '最新の状態です',
    error: `エラー: ${errorMessage}`,
  };

  const busy = status === 'checking' || status === 'downloading';

  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>アップデート</Text>
        <Text style={styles.rowDescription}>{statusLabel[status]}</Text>
      </View>
      <Pressable
        style={styles.updateButton}
        onPress={status === 'available' ? applyUpdate : checkForUpdate}
        disabled={busy}
      >
        <Text style={styles.updateButtonLabel}>
          {status === 'available' ? '適用する' : '確認する'}
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
  if (!Updates.isEnabled) return null;

  const detailLine = Updates.isEmbeddedLaunch
    ? 'ネイティブビルドに内蔵された内容で起動中'
    : Updates.createdAt
      ? `${formatUpdateTimestamp(Updates.createdAt)} 公開分を適用中`
      : '適用中のOTA更新の詳細は不明';

  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>現在の適用状況</Text>
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

export function SystemApp() {
  const [keepAwake, setKeepAwake] = useState(false);
  const [skipBoot, setSkipBoot] = useState(false);
  const [loaded, setLoaded] = useState(false);

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
        label="常時点灯"
        description="画面が自動で消灯しないようにします"
        value={keepAwake}
        onChange={onChangeKeepAwake}
      />
      <SettingRow
        label="起動アニメーションをスキップ"
        description="次回起動時からシッテムの箱の起動演出を省略します"
        value={skipBoot}
        onChange={onChangeSkipBoot}
      />

      <UpdateSection />
      <CurrentUpdateInfo />

      <View style={styles.footer}>
        <Text style={styles.footerText}>シッテムの箱 v{appConfig.expo.version}</Text>
      </View>
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
