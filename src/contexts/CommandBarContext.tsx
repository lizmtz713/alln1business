import React, { createContext, useContext, useState, useCallback } from 'react';

type CommandBarContextType = {
  visible: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
};

const CommandBarContext = createContext<CommandBarContextType | undefined>(undefined);

export function CommandBarProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const open = useCallback(() => setVisible(true), []);
  const close = useCallback(() => setVisible(false), []);
  const toggle = useCallback(() => setVisible((v) => !v), []);
  return (
    <CommandBarContext.Provider value={{ visible, open, close, toggle }}>
      {children}
    </CommandBarContext.Provider>
  );
}

export function useCommandBar() {
  const ctx = useContext(CommandBarContext);
  if (!ctx) throw new Error('useCommandBar must be used within CommandBarProvider');
  return ctx;
}
