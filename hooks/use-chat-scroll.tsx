// hooks/use-chat-scroll.ts
'use client';

import { useEffect, useRef, useCallback } from 'react';

export function useChatScroll<T = HTMLDivElement>() {
  const containerRef = useRef<T>(null);

  const scrollToBottom = useCallback(() => {
    if (containerRef.current) {
      const element = containerRef.current as unknown as HTMLElement;
      element.scrollTop = element.scrollHeight;
    }
  }, []);

  return { containerRef, scrollToBottom };
}
