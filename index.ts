import { registerRootComponent } from 'expo';
import { Alert } from 'react-native';

import App from './App';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { createElement } from 'react';

// A production build has no redbox and no console — without this, a fatal
// JS exception thrown outside of React's render (e.g. in an async callback)
// just silently kills the JS thread with no crash log and no on-screen sign
// of what happened. Not forwarding to the previous/default handler: for a
// fatal error, the default handler reports back to native and terminates
// the app, which otherwise races with (and beats) the Alert actually being
// shown.
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
