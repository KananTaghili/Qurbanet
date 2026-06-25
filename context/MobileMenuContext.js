'use client';
import { createContext, useContext, useState } from 'react';

const Ctx = createContext({ open: false, openMenu: null, closeMenu: () => {} });

export const useMobileMenu = () => useContext(Ctx);

export function MobileMenuProvider({ children }) {
  const [open, setOpen] = useState(false);
  return (
    <Ctx.Provider value={{ open, openMenu: () => setOpen(true), closeMenu: () => setOpen(false) }}>
      {children}
    </Ctx.Provider>
  );
}
