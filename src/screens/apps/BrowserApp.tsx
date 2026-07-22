import { useEffect, useRef, useState } from 'react';
import { BackHandler, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { colors } from '../../theme/colors';
import { useLanguage } from '../../i18n';

type Tab = {
  id: string;
  url: string; // '' means the tab is showing the blank/new-tab state
  input: string;
  title: string;
  canGoBack: boolean;
  canGoForward: boolean;
};

const MAX_TABS = 8;

function makeTab(): Tab {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    url: '',
    input: '',
    title: '',
    canGoBack: false,
    canGoForward: false,
  };
}

function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

// Only ever let the WebView actually navigate to http(s) — blocks a
// malicious page from redirecting into file://, javascript:, or other
// schemes that could reach outside the sandboxed web content.
function isAllowedRequestUrl(url: string): boolean {
  return /^https?:\/\//i.test(url) || url === 'about:blank';
}

export function BrowserApp() {
  const { t } = useLanguage();
  const [tabs, setTabs] = useState<Tab[]>(() => [makeTab()]);
  const [activeId, setActiveId] = useState(tabs[0].id);
  const webviewRefs = useRef<Record<string, WebView | null>>({});

  const activeTab = tabs.find((tab) => tab.id === activeId) ?? tabs[0];

  // Mirrors what a normal Android browser does: back first steps through
  // page history, then closes the tab, and only then falls through
  // (returning false) to let OSHomeScreen's own handler close the app window.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (activeTab.canGoBack) {
        webviewRefs.current[activeTab.id]?.goBack();
        return true;
      }
      if (tabs.length > 1) {
        handleCloseTab(activeTab.id);
        return true;
      }
      return false;
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, tabs.length]);

  function updateTab(id: string, patch: Partial<Tab>) {
    setTabs((prev) => prev.map((tab) => (tab.id === id ? { ...tab, ...patch } : tab)));
  }

  function handleAddTab() {
    if (tabs.length >= MAX_TABS) return;
    const tab = makeTab();
    setTabs((prev) => [...prev, tab]);
    setActiveId(tab.id);
  }

  function handleCloseTab(id: string) {
    setTabs((prev) => {
      const rest = prev.filter((tab) => tab.id !== id);
      delete webviewRefs.current[id];
      if (rest.length === 0) {
        const fresh = makeTab();
        setActiveId(fresh.id);
        return [fresh];
      }
      if (id === activeId) {
        setActiveId(rest[rest.length - 1].id);
      }
      return rest;
    });
  }

  function handleGo() {
    const url = normalizeUrl(activeTab.input);
    if (!url) return;
    updateTab(activeTab.id, { url, input: url });
  }

  function handleBack() {
    webviewRefs.current[activeTab.id]?.goBack();
  }

  function handleForward() {
    webviewRefs.current[activeTab.id]?.goForward();
  }

  function handleReload() {
    webviewRefs.current[activeTab.id]?.reload();
  }

  return (
    <View style={styles.container}>
      <FlatList
        horizontal
        data={tabs}
        keyExtractor={(tab) => tab.id}
        style={styles.tabBar}
        contentContainerStyle={styles.tabBarContent}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.tabChip, item.id === activeId && styles.tabChipActive]}
            onPress={() => setActiveId(item.id)}
          >
            <Text
              style={[styles.tabChipLabel, item.id === activeId && styles.tabChipLabelActive]}
              numberOfLines={1}
            >
              {item.title || item.url || t('browser.newTab')}
            </Text>
            <Pressable onPress={() => handleCloseTab(item.id)} hitSlop={8} style={styles.tabCloseButton}>
              <Text style={styles.tabCloseLabel}>✕</Text>
            </Pressable>
          </Pressable>
        )}
        ListFooterComponent={
          tabs.length < MAX_TABS ? (
            <Pressable style={styles.newTabButton} onPress={handleAddTab}>
              <Text style={styles.newTabLabel}>＋</Text>
            </Pressable>
          ) : null
        }
      />

      <View style={styles.addressBar}>
        <Pressable style={styles.navButton} onPress={handleBack} disabled={!activeTab.canGoBack} hitSlop={6}>
          <Text style={[styles.navButtonLabel, !activeTab.canGoBack && styles.navButtonDisabled]}>‹</Text>
        </Pressable>
        <Pressable style={styles.navButton} onPress={handleForward} disabled={!activeTab.canGoForward} hitSlop={6}>
          <Text style={[styles.navButtonLabel, !activeTab.canGoForward && styles.navButtonDisabled]}>›</Text>
        </Pressable>
        <TextInput
          value={activeTab.input}
          onChangeText={(text) => updateTab(activeTab.id, { input: text })}
          onSubmitEditing={handleGo}
          placeholder={t('browser.urlPlaceholder')}
          placeholderTextColor={colors.inkDim}
          style={styles.addressInput}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          returnKeyType="go"
        />
        <Pressable style={styles.goButton} onPress={handleGo}>
          <Text style={styles.goButtonLabel}>{t('browser.go')}</Text>
        </Pressable>
        {activeTab.url !== '' && (
          <Pressable style={styles.navButton} onPress={handleReload} hitSlop={6}>
            <Text style={styles.navButtonLabel}>⟳</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.webviewArea}>
        {(() => {
          const tab = activeTab;
          return (
            <View key={tab.id} style={StyleSheet.absoluteFill}>
              {tab.url ? (
                <WebView
                  // A fresh WebView per tab id — switching tabs unmounts the
                  // previous one instead of keeping every tab's WebView alive
                  // at once, since each live instance is a real memory/GPU
                  // cost on Android. The trade-off is losing scroll position
                  // when switching away and back, which is acceptable here.
                  ref={(ref) => {
                    webviewRefs.current[tab.id] = ref;
                  }}
                  source={{ uri: tab.url }}
                  originWhitelist={['https://*', 'http://*']}
                  onShouldStartLoadWithRequest={(request) => isAllowedRequestUrl(request.url)}
                  onNavigationStateChange={(navState) => {
                    updateTab(tab.id, {
                      canGoBack: navState.canGoBack,
                      canGoForward: navState.canGoForward,
                      title: navState.title,
                      input: navState.url,
                    });
                  }}
                  setSupportMultipleWindows={false}
                  javaScriptCanOpenWindowsAutomatically={false}
                />
              ) : (
                <View style={styles.blankState}>
                  <Text style={styles.blankStateText}>{t('browser.blankState')}</Text>
                </View>
              )}
            </View>
          );
        })()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabBar: {
    flexGrow: 0,
    backgroundColor: colors.panel,
    borderBottomWidth: 1,
    borderBottomColor: colors.panelBorder,
  },
  tabBarContent: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 6,
    alignItems: 'center',
  },
  tabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: 160,
    backgroundColor: colors.panelOnLight,
    borderWidth: 1,
    borderColor: colors.panelBorderOnLight,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  tabChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  tabChipLabel: {
    color: colors.ink,
    fontSize: 12,
    maxWidth: 100,
  },
  tabChipLabelActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  tabCloseButton: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabCloseLabel: {
    color: colors.inkDim,
    fontSize: 11,
  },
  newTabButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.panelOnLight,
    borderWidth: 1,
    borderColor: colors.panelBorderOnLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newTabLabel: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '700',
  },
  addressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: colors.panel,
    borderBottomWidth: 1,
    borderBottomColor: colors.panelBorder,
  },
  navButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonLabel: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '600',
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  addressInput: {
    flex: 1,
    backgroundColor: colors.panelOnLight,
    borderWidth: 1,
    borderColor: colors.panelBorderOnLight,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: colors.ink,
    fontSize: 13,
  },
  goButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.accent,
  },
  goButtonLabel: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  webviewArea: {
    flex: 1,
  },
  blankState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  blankStateText: {
    color: colors.inkDim,
    fontSize: 13,
    letterSpacing: 1,
    textAlign: 'center',
  },
});
