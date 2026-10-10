import { createContext, useContext } from 'react';

/**
 * Scrolls the focused field into view. AuthLayout provides it; every Input calls it on focus, so a
 * field never ends up hidden under the keyboard. Outside a provider it does nothing.
 */
export const RevealContext = createContext<() => void>(() => {});
export const useRevealFocused = () => useContext(RevealContext);
