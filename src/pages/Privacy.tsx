import { PageShell } from '../components/PageShell/PageShell';
import { PRIVACY, PRIVACY_CONTACT_EMAIL } from '../data/pageCopy';
import styles from './Followup.module.css';

export default function Privacy() {
  return (
    <PageShell>
      <section className={styles.section}>
        <h1>{PRIVACY.heading}</h1>
        <p className={styles.tip}>{PRIVACY.updated}</p>
      </section>
      {PRIVACY.sections.map((s) => (
        <section key={s.heading} className={styles.section}>
          <h2>{s.heading}</h2>
          <p>{s.text}</p>
        </section>
      ))}
      <p>
        {PRIVACY.contactLead} <a href={`mailto:${PRIVACY_CONTACT_EMAIL}`}>{PRIVACY_CONTACT_EMAIL}</a>.
      </p>
    </PageShell>
  );
}
