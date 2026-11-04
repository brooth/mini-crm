import {
  AlertProps, Icon as BlueprintIcon, InputGroup, MaybeElement
} from "@blueprintjs/core";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Alert, Button, Icon } from "app/components";
import { useI18nText } from "i18n/hooks";
import { type ExtendedIconName } from "utils";

import { Row } from "../flex";
import "./Header.css";


export default function PageHeader({
  className, hidden, children, left, icon, title, onTitleChanged,
  backButtonPath, backButtonState, backButtonConfirmProps, callouts = [],
  onSearchQueryChange, onSearchQueryCommit, recentSearches,
  searchQueryValue, searchPlaceholder, tag,
  ...rest
}: PageHeaderProps) {
  if (hidden) return null;

  const rtl = document.body.classList.contains('rtl');
  const navigate = useNavigate();
  const [expandedCallouts, expandCallouts] = useState<JSX.Element[]>([]);
  const [searchPlaceholderValue, setSearchPlaceholderValue] = useState('...');
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchInput, setSearchInput] = useState(searchQueryValue || '');

  const classes = ["app-page-header", className].join(" ");
  const titleText = useI18nText(title);
  const searchPlaceholderText = useI18nText(searchPlaceholder);

  const [goBackConfirmProps, setGoBackConfirmProps] =
    useState(null as GoBackConfirmProps | null);

  const goBack = useCallback((confirmProps?: GoBackConfirmProps | null) => {
    if (confirmProps) {
      setGoBackConfirmProps(confirmProps);
    } else {
      navigate(backButtonPath!, { state: backButtonState });
    }
  }, [backButtonPath]);

  const startEditing = useCallback(() => {
    setTitleInput(titleText || '');
    setEditingTitle(true);
    setTimeout(() => titleInputRef.current?.select(), 0);
  }, [titleText]);

  const cancelEditing = useCallback(() => {
    setEditingTitle(false);
    setTitleInput('');
  }, []);

  const approveEditing = useCallback(() => {
    const trimmed = titleInput.trim();
    if (trimmed && trimmed !== titleText) {
      onTitleChanged!(trimmed);
    }
    setEditingTitle(false);
    setTitleInput('');
  }, [titleInput, titleText, onTitleChanged]);

  const filteredSuggestions = useMemo(() => {
    if (!recentSearches?.length) return [];
    const q = searchInput.trim().toLowerCase();
    if (!q) return recentSearches;
    return recentSearches.filter((s) => s !== q && s.includes(q));
  }, [recentSearches, searchInput]);

  const showSuggestions = searchFocused && filteredSuggestions.length > 0;

  const applySuggestion = useCallback((s: string) => {
    if (searchInputRef.current) {
      searchInputRef.current.value = s;
    }
    setSearchInput(s);
    onSearchQueryChange?.(s);
    onSearchQueryCommit?.(s);
    setSearchFocused(false);
    searchInputRef.current?.blur();
  }, [onSearchQueryChange, onSearchQueryCommit]);

  const observedRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (observedRef.current) {
      const observer = new IntersectionObserver(([e]) => {
        e.target.toggleAttribute('stuck', e.intersectionRatio < 1);
      }, { threshold: [1] });
      observer.observe(observedRef.current);
    }
  }, [observedRef])

  return (
    <>
      <Row id="page-header" innerRef={observedRef} className={classes} {...rest}>
        {left}
        {backButtonPath && (
          <Button
            className='back'
            variant="minimal"
            icon="chevron-left"
            onClick={() => goBack(backButtonConfirmProps)} />
        )}
        {icon && <div className="app-page-header-icon"><Icon icon={icon} /></div>}
        {onTitleChanged && editingTitle ? (
          <div className="app-page-header-title-edit">
            <input
              ref={titleInputRef}
              className="app-page-header-title-input"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') approveEditing();
                if (e.key === 'Escape') cancelEditing();
              }}
            />
            <Button variant="minimal" icon="cross" intent="danger" onClick={cancelEditing} />
            <Button variant="minimal" icon="tick" intent="success" onClick={approveEditing} />
          </div>
        ) : onTitleChanged ? (
          <h1
            className="app-page-header-title-editable"
            onClick={startEditing}
            title="Click to edit"
          >{titleText}</h1>
        ) : (
          <h1>{titleText}</h1>
        )}
        {tag}
        {onSearchQueryChange ? (
          <div className="app-page-header-search-wrapper">
            <InputGroup
              type='search'
              inputRef={searchInputRef}
              leftElement={rtl ? undefined : <BlueprintIcon icon='search' size={12} />}
              rightElement={rtl ? <BlueprintIcon icon='search' size={12} /> : undefined}
              className="app-page-header-search-input"
              defaultValue={searchQueryValue}
              placeholder={searchPlaceholderValue}
              onFocus={() => {
                setSearchFocused(true);
                if (searchPlaceholder)
                  setSearchPlaceholderValue(searchPlaceholderText!);
              }}
              onBlur={() => {
                setTimeout(() => setSearchFocused(false), 150);
                onSearchQueryCommit?.(searchInput);
                if (searchPlaceholder)
                  setSearchPlaceholderValue('...');
              }}
              onChange={({ target: { value } }) => {
                const lowered = value.toLowerCase();
                setSearchInput(lowered);
                onSearchQueryChange(lowered);
              }}
              onKeyDown={(event) => {
                if (event.code === 'Enter') {
                  (event.target as HTMLInputElement).blur();
                }
              }}
            />
            {showSuggestions && (
              <ul className="app-page-header-search-suggestions">
                {filteredSuggestions.map((s) => (
                  <li
                    key={s}
                    className="app-page-header-search-suggestion"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      applySuggestion(s);
                    }}>
                    <BlueprintIcon icon="history" size={12} />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : <div className='searchInputPlaceholder' />}
        {callouts
          .filter((callout) => expandedCallouts.includes(callout) === false)
          .map((callout) => (
            <div
              key={`calloutIcon_${callout.key}`}
              className="app-page-header-callout-icon"
              onClick={() => expandCallouts([...expandedCallouts, callout])} >
              <BlueprintIcon
                icon={callout.props.icon}
                intent={callout.props.intent}
              />
            </div>
          ))}
        {children}
        <Alert
          confirmButtonText={['yes']}
          cancelButtonText={['nope']}
          intent="danger"
          isOpen={goBackConfirmProps != null}
          onClose={() => setGoBackConfirmProps(null)}
          onConfirm={() => goBack()}
          {...goBackConfirmProps}>
          <p>{goBackConfirmProps?.message}</p>
        </Alert>
      </Row>
      <div className="app-page-header-callouts">
        {callouts.map((callout) => (
          <div
            key={`calloutWrapper_${callout.key}`}
            className={[
              "app-page-header-callout-wrapper",
              expandedCallouts.includes(callout) ? undefined : "collapsed"
            ].join(" ")}>
            {callout}
          </div>
        ))}
      </div>
    </>
  );
}

export type GoBackConfirmProps = {
  message: string,
} & Omit<AlertProps, "isOpen" | "onClose" | "onConfirm">;

export type PageHeaderProps = {
  className?: string,
  hidden?: boolean,
  children?: React.ReactNode,
  icon?: ExtendedIconName | MaybeElement,
  title?: string | [string, object?, string?],
  onTitleChanged?: (title: string) => void,
  backButtonPath?: string | null,
  backButtonState?: any,
  backButtonConfirmProps?: GoBackConfirmProps | null,
  onSearchQueryChange?: (query: string) => void,
  onSearchQueryClear?: () => void,
  onSearchQueryCommit?: (query: string) => void,
  recentSearches?: string[],
  searchQueryValue?: string,
  searchPlaceholder?: string | [string, object?, string?],
  callouts?: JSX.Element[],
  left?: JSX.Element,
  tag?: JSX.Element,
}
