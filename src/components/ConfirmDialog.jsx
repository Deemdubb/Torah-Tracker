// The app's own "Are you sure?" dialog. The browser's built-in popup is unreliable inside
// home-screen apps on iPhone, so every confirmation goes through this instead.
import { createContext, useCallback, useContext, useState } from 'react';
import Modal from './Modal';
import { Button } from './ui';
import { useLang } from '@/lib/LanguageContext';

const ConfirmContext = createContext(() => Promise.resolve(false));

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null); // { title, text, okLabel, danger, resolve }
  const confirm = useCallback((opts = {}) => new Promise((resolve) => setState({ ...opts, resolve })), []);
  const close = (answer) => { state?.resolve(answer); setState(null); };
  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <ConfirmModal state={state} onClose={close} />
    </ConfirmContext.Provider>
  );
}

function ConfirmModal({ state, onClose }) {
  const { t } = useLang();
  return (
    <Modal open={!!state} title={state?.title || t('areYouSure')} onClose={() => onClose(false)}
      footer={<>
        <Button variant={state?.danger ? 'destructive' : 'primary'} className="flex-1" onClick={() => onClose(true)}>{state?.okLabel || t('yes')}</Button>
        <Button variant="outline" onClick={() => onClose(false)}>{t('cancel')}</Button>
      </>}>
      {state?.text && <p className="text-sm">{state.text}</p>}
    </Modal>
  );
}

export const useConfirm = () => useContext(ConfirmContext);
