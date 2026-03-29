import { useState, useCallback } from 'react';
import * as Clipboard from 'expo-clipboard';

export const useCopyToClipboard = (timeout = 2000) => {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async (text: string) => {
    await Clipboard.setStringAsync(text);
    setCopied(true);
    setTimeout(() => setCopied(false), timeout);
  }, [timeout]);

  return { copied, copy };
};
