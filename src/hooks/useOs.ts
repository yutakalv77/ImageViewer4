import { useState, useEffect } from 'react';
import { type } from '@tauri-apps/plugin-os';

export type OS = 'windows' | 'macos' | 'linux' | 'other';

export function useOs() {
  const [os, setOs] = useState<OS>('windows');

  useEffect(() => {
    try {
      const platform = type();
      if (platform === 'macos') setOs('macos');
      else if (platform === 'windows') setOs('windows');
      else if (platform === 'linux') setOs('linux');
      else setOs('other');
    } catch (e) {
      console.error('Failed to detect OS:', e);
    }
  }, []);

  return os;
}
