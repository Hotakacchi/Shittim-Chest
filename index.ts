import { registerRootComponent } from 'expo';
import { Alert } from 'react-native';

import App from './App';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { createElement } from 'react';

// A production build has no redbox and no console — without this, a fatal
// JS exception thrown outside of React's render (e.g. in an async callback)
// just silently kills the JS thread with no crash log and no on-screen sign
// of what happened. Alert.alert is imperative, so it works even though
// nothing here is a rendered component.
//
// Deliberately NOT forwarding to the previous/default handler here: for a
// fatal error, the default handler reports back to native and terminates the
// app, which raced with (and appears to have won against) the Alert actually
// being shown. Swallowing it keeps the JS runtime alive long enough to see
// the real error — this is diagnostic-only, not how a shipped build should
// behave long-term.
(global as any).ErrorUtils?.setGlobalHandler?.((error: Error, isFatal?: boolean) => {
  Alert.alert(
    isFatal ? '致命的なエラー' : 'エラー',
    `${error.message}\n\n${error.stack ?? ''}`,
  );
});

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(() => createElement(ErrorBoundary, null, createElement(App)));
