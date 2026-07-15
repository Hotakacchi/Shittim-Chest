import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from './storageKeys';

type ContextValue = {
  active: boolean;
  activate: () => void;
  deactivate: () => void;
};

const SystemErrorContext = createContext<ContextValue>({
  active: false,
  activate: () => {},
  deactivate: () => {},
});

// A locally-triggered "system locked" overlay — no network involved. The
// admin panel flips this on; the same hidden gesture used to reach the
// admin panel flips it back off. Persisted so the lock survives an app
// restart, but only ever affects the device it was triggered on.
export function SystemErrorProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.systemErrorActive).then((value) => {
      setActive(value === 'true');
    });
  }, []);

  function activate() {
    setActive(true);
    AsyncStorage.setItem(STORAGE_KEYS.systemErrorActive, 'true');
  }

  function deactivate() {
    setActive(false);
    AsyncStorage.setItem(STORAGE_KEYS.systemErrorActive, 'false');
  }

  return (
    <SystemErrorContext.Provider value={{ active, activate, deactivate }}>
      {children}
    </SystemErrorContext.Provider>
  );
}

export function useSystemError() {
  return useContext(SystemErrorContext);
}
