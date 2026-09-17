import { useSyncExternalStore, useCallback } from 'react';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

let toastId = 0;
let listeners: Array<() => void> = [];
let toasts: Toast[] = [];

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void) {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function getSnapshot() {
  return toasts;
}

function addToast(message: string, type: Toast['type'] = 'info') {
  const id = String(++toastId);
  toasts = [...toasts, { id, message, type }];
  emitChange();

  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    emitChange();
  }, 4000);
}

function removeToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id);
  emitChange();
}

export function useToast() {
  const currentToasts = useSyncExternalStore(subscribe, getSnapshot);

  const success = useCallback((message: string) => addToast(message, 'success'), []);
  const error = useCallback((message: string) => addToast(message, 'error'), []);
  const info = useCallback((message: string) => addToast(message, 'info'), []);

  return { toasts: currentToasts, addToast, removeToast, success, error, info };
}
