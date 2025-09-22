/**
 * Utilitário para gerenciar localStorage da aplicação Daily Dream
 */

// Chaves usadas no localStorage
export const LOCAL_STORAGE_KEYS = {
  ACTIVE_TAB: 'daily-dream-active-tab',
  SEARCH_QUERY: 'daily-dream-search-query',
  SORT_BY: 'daily-dream-sort-by',
  FILTER_BY: 'daily-dream-filter-by',
  IS_GENERATING: 'daily-dream-is-generating',
  SCROLL_POSITION: 'daily-dream-scroll-position',
  GOOGLE_DRIVE_TOKEN: 'google_drive_token',
  GOOGLE_DRIVE_TOKEN_EXPIRY: 'google_drive_token_expiry',
} as const;

/**
 * Limpa dados antigos ou desnecessários do localStorage
 */
export function cleanupLocalStorage() {
  try {
    // Limpar tokens expirados do Google Drive
    const tokenExpiry = localStorage.getItem(LOCAL_STORAGE_KEYS.GOOGLE_DRIVE_TOKEN_EXPIRY);
    if (tokenExpiry) {
      const now = Date.now();
      const expiry = parseInt(tokenExpiry);
      
      if (now >= expiry) {
        localStorage.removeItem(LOCAL_STORAGE_KEYS.GOOGLE_DRIVE_TOKEN);
        localStorage.removeItem(LOCAL_STORAGE_KEYS.GOOGLE_DRIVE_TOKEN_EXPIRY);
      }
    }

    // Resetar estado de geração se a página foi recarregada
    localStorage.setItem(LOCAL_STORAGE_KEYS.IS_GENERATING, 'false');

    // Limpar posição do scroll muito antiga (mais de 1 dia)
    const lastCleanup = localStorage.getItem('daily-dream-last-cleanup');
    const now = Date.now();
    
    if (!lastCleanup || (now - parseInt(lastCleanup)) > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(LOCAL_STORAGE_KEYS.SCROLL_POSITION);
      localStorage.setItem('daily-dream-last-cleanup', now.toString());
    }

  } catch (error) {
    console.warn('Erro ao limpar localStorage:', error);
  }
}

/**
 * Obter tamanho aproximado do localStorage usado pela aplicação
 */
export function getLocalStorageSize(): { totalSize: number, dailyDreamSize: number } {
  let totalSize = 0;
  let dailyDreamSize = 0;

  try {
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        const itemSize = localStorage.getItem(key)?.length || 0;
        totalSize += key.length + itemSize;
        
        if (key.startsWith('daily-dream-') || key.startsWith('google_drive_')) {
          dailyDreamSize += key.length + itemSize;
        }
      }
    }
  } catch (error) {
    console.warn('Erro ao calcular tamanho do localStorage:', error);
  }

  return { totalSize, dailyDreamSize };
}

/**
 * Executar limpeza automática ao inicializar a aplicação
 */
export function initializeLocalStorage() {
  cleanupLocalStorage();
  
  // Log do uso de memória em modo de desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    const { totalSize, dailyDreamSize } = getLocalStorageSize();
    console.log('📦 localStorage usage:', {
      total: `${Math.round(totalSize / 1024)} KB`,
      dailyDream: `${Math.round(dailyDreamSize / 1024)} KB`
    });
  }
}
