import * as bp from "@blueprintjs/core";
import { useEffect, useMemo, useRef } from "react";

import "./Tabs.css";


export default function Tabs({
  className, stickToPageHeader = true, ...rest
}: TabsProps) {

  let pageHeaderOffsets: {
    height: number,
    width: number,
    left: number,
  } | null = null;

  useEffect(() => {
    if (!stickToPageHeader) return;
    const el = document.getElementById("page-header");
    if (el) {
      el.classList.add("app-tabs-tabs-remove-page-header-shadows");
      pageHeaderOffsets = {
        height: el.offsetHeight,
        width: el.offsetWidth,
        left: el.offsetLeft,
      }
    }
  }, [stickToPageHeader]);

  const observerClasses = useMemo(() => {
    const cls = ["app-tabs-tabs-observer"];
    if (stickToPageHeader) cls.push("app-tabs-tabs-sticky");
    return cls.join(' ').trim();
  }, [className]);

  const classes = useMemo(() => {
    const cls = ["app-tabs-tabs"];
    if (className) cls.push(className);
    if (stickToPageHeader) cls.push("app-tabs-tabs-sticky-tab-list");
    return cls.join(' ').trim();
  }, [className]);

  const observedRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (pageHeaderOffsets && observedRef.current) {
      const rtl = document.body.classList.contains('rtl');
      const observedEl = observedRef.current;
      observedEl.style.top = `${pageHeaderOffsets.height - 13}px`;
      const parentEl = observedEl.parentNode! as HTMLElement;
      const tablistEl = parentEl.children[2].children[0] as HTMLElement;
      tablistEl.style.top = `${pageHeaderOffsets.height - 13}px`;
      const panelEl = parentEl.children[1] as HTMLElement;
      let panelMarginStart = pageHeaderOffsets.left - panelEl.offsetLeft;
      if (rtl) panelMarginStart = -1 * (panelMarginStart + pageHeaderOffsets.width);
      panelEl.style.marginInlineStart = `${panelMarginStart}px`
      panelEl.style.width = `${pageHeaderOffsets.width}px`;
      panelEl.style.height = `${pageHeaderOffsets.height + 30}px`;
      const rootMargin = `-${pageHeaderOffsets.height}px`;
      const observer = new IntersectionObserver(([e]) => {
        const stuck = e.intersectionRatio < 1;
        panelEl.toggleAttribute('stuck', stuck);
      }, { threshold: [0], rootMargin });
      observer.observe(observedRef.current);
      return () => {
        observer.disconnect();
      };
    }
  }, [observedRef, pageHeaderOffsets])

  return (
    <>
      <div className={observerClasses} ref={observedRef} />
      <div className={"app-tabs-tabs-panel"} />
      <bp.Tabs className={classes} {...rest} />
    </>
  );
}

export type TabsProps = bp.TabsProps & {
  className?: string;
  stickToPageHeader?: boolean;
}
