import { useId, useState, type FormEvent } from 'react';
import { WIZARD } from '../../data/copy';
import { MAX_NAME_LENGTH } from '../../engine/constants';
import { sanitizeName } from '../../engine/sanitize';
import { Button } from '../Button/Button';
import styles from './AddTask.module.css';

export function AddTask({ onAdd }: { onAdd: (name: string) => void }) {
  const id = useId();
  const [name, setName] = useState('');
  const clean = sanitizeName(name);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!clean) return;
    onAdd(clean);
    setName('');
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <h3 className={styles.heading}>{WIZARD.tasks.addHeading}</h3>
      <div className={styles.fields}>
        <label htmlFor={id} className="visually-hidden">
          {WIZARD.tasks.addName}
        </label>
        <input
          id={id}
          className={styles.input}
          value={name}
          maxLength={MAX_NAME_LENGTH}
          placeholder="e.g. Preparing board updates"
          onChange={(e) => setName(e.target.value)}
        />
        <Button type="submit" variant="secondary" disabled={!clean}>
          {WIZARD.tasks.addButton}
        </Button>
      </div>
    </form>
  );
}
