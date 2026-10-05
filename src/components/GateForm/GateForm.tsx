import { useEffect, useState } from 'react';
import { WIZARD } from '../../data/copy';
import {
  buildFormSrc,
  formParams,
  HIDDEN_KEYS,
  looksLikeSubmitMessage,
  parentPageParams,
  type GhlHidden,
  type GhlPrefill,
} from '../../lib/ghl';
import { ghlDebugEnabled, runEmbedScript } from '../../lib/ghlEmbed';
import { STORAGE_KEYS, writeJSON, type StoredQualification } from '../../lib/storage';
import { ButtonLink } from '../Button/Button';
import styles from './GateForm.module.css';

const FORM_NAME = 'FP | Francisco Allende | Qualifying Form';

interface Props {
  formId: string | undefined;
  prefill: GhlPrefill;
  hidden: GhlHidden;
}

export function GateForm({ formId, prefill, hidden }: Props) {
  const [stored, setStored] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // SPEC §4: qualification and report URL are stored before the form renders,
  // so /next can route the moment GHL redirects.
  useEffect(() => {
    const record: StoredQualification = {
      qualified: hidden.qualified,
      tier: hidden.tier,
      reportUrl: hidden.reportUrl,
      topTasks: hidden.topTasks.slice(0, 3),
    };
    writeJSON(STORAGE_KEYS.qualification, record);
    setStored(true);
  }, [hidden.qualified, hidden.tier, hidden.reportUrl, hidden.topTasks]);

  // Mirror the fields onto this page's URL while the form is shown (form_embed.js reads it),
  // then put the original URL back when the visitor leaves the step.
  useEffect(() => {
    if (!formId) return;
    const original = window.location.pathname + window.location.search + window.location.hash;
    const params = parentPageParams(prefill, hidden);
    window.history.replaceState(window.history.state, '', `${window.location.pathname}?${params.toString()}`);

    if (ghlDebugEnabled()) {
      const sent = formParams(prefill, hidden);
      console.info('[fft] GHL form src:', buildFormSrc(formId, prefill, hidden));
      console.table(Object.fromEntries(HIDDEN_KEYS.map((k) => [k, sent.get(k) ?? '(missing)'])));
    }
    return () => window.history.replaceState(window.history.state, '', original);
  }, [formId, prefill, hidden]);

  // Only once the iframe is in the DOM: form_embed.js wires up the iframes it finds when it runs.
  useEffect(() => {
    if (formId && stored) runEmbedScript();
  }, [formId, stored]);

  useEffect(() => {
    if (!formId) return;
    // Fallback (SPEC §9): if GHL keeps its redirect inside the iframe, reveal a Continue button.
    const onMessage = (e: MessageEvent) => {
      if (looksLikeSubmitMessage(e.origin, e.data)) setSubmitted(true);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [formId]);

  if (!stored) return null;

  if (!formId) {
    return (
      <div className={styles.missing}>
        <p>{WIZARD.preview.formMissing}</p>
        <ButtonLink to="/next">{WIZARD.preview.continue}</ButtonLink>
      </div>
    );
  }

  const src = buildFormSrc(formId, prefill, hidden);
  return (
    <div className={styles.wrap}>
      <iframe
        src={src}
        className={styles.frame}
        id={`inline-${formId}`}
        title="Where should we send your report?"
        data-layout="{'id':'INLINE'}"
        data-trigger-type="alwaysShow"
        data-trigger-value=""
        data-activation-type="alwaysActivated"
        data-activation-value=""
        data-deactivation-type="neverDeactivate"
        data-deactivation-value=""
        data-form-name={FORM_NAME}
        data-layout-iframe-id={`inline-${formId}`}
        data-form-id={formId}
      />
      {submitted && (
        <div className={styles.continue} role="status">
          <p>{WIZARD.preview.sentHint}</p>
          <ButtonLink to="/next">{WIZARD.preview.continue}</ButtonLink>
        </div>
      )}
    </div>
  );
}
