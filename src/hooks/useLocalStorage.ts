import { useState, useEffect } from 'react';

/**
 * Hook para persistir estado no localStorage
 * @param key Chave para armazenar no localStorage
 * @param defaultValue Valor padrão se não existir no localStorage
 * @returns [value, setValue] similar ao useState
 */
export function useLocalStorage<T>(key: string, defaultValue: T): [T, (value: T) => void] {
  // Função para ler o valor do localStorage
  const readValue = (): T => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  };

  // Estado inicial
  const [storedValue, setStoredValue] = useState<T>(readValue);

  // Função para atualizar o valor
  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  // Escutar mudanças no localStorage (para sincronização entre abas)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          console.warn(`Error parsing localStorage key "${key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue];
}

/**
 * Hook específico para persistir a posição do scroll
 */
export function useScrollPosition() {
  useEffect(() => {
    let scrollTimer: NodeJS.Timeout;
    
    const saveScrollPosition = () => {
      localStorage.setItem('daily-dream-scroll-position', window.scrollY.toString());
    };

    const handleScroll = () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(saveScrollPosition, 150); // Debounce de 150ms
    };

    const handleBeforeUnload = () => {
      clearTimeout(scrollTimer);
      saveScrollPosition();
    };

    // Restaurar posição do scroll salva
    const savedScrollPosition = localStorage.getItem('daily-dream-scroll-position');
    if (savedScrollPosition) {
      setTimeout(() => {
        window.scrollTo({
          top: parseInt(savedScrollPosition),
          behavior: 'auto'
        });
      }, 100);
    }

    // Escutar eventos
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearTimeout(scrollTimer);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      saveScrollPosition(); // Salvar uma última vez ao desmontar
    };
  }, []);
}
