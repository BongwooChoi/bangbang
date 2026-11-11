'use client';
import type { MouseEvent, ReactNode } from 'react';
import { browsingEnvironment, reportOutboundClick, type OutboundClick } from '@/lib/outbound';

export function EatplLink({ href, placement, children, ...props }: {
  href: string; placement: OutboundClick['placement']; children: ReactNode;
  className?: string; 'aria-label'?: string; 'aria-describedby'?: string;
}) {
  function record(event: MouseEvent<HTMLAnchorElement>) {
    if (event.defaultPrevented || event.button > 1) return;
    try {
      const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
      reportOutboundClick({
        event: 'eatpl_open', placement,
        page: location.pathname === '/share' ? 'share' : 'home',
        browser: browsingEnvironment(navigator.userAgent, standalone),
        activation: event.button === 1 || event.ctrlKey || event.metaKey || event.shiftKey ? 'new_tab' : 'same_tab',
      });
    } catch { /* Keep the native anchor usable when diagnostics are blocked. */ }
  }
  return <a {...props} href={href} target="_self" rel="noopener" referrerPolicy="strict-origin-when-cross-origin" data-eatpl-link={placement} onClick={record} onAuxClick={event => { if (event.button === 1) record(event); }}>{children}</a>;
}
