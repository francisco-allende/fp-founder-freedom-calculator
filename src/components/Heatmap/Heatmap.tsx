import styles from './Heatmap.module.css';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const FIRST_HOUR = 6;

const hourLabel = (h: number) => (h === 12 ? '12p' : h > 12 ? `${h - 12}p` : `${h}a`);

/** 7 × 17 grid of minutes booked per hour slot (average week). A real table for screen readers. */
export function Heatmap({ data, caption }: { data: number[][]; caption: string }) {
  const slots = data[0]?.length ?? 0;
  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <caption className={styles.caption}>{caption}</caption>
        <thead>
          <tr>
            <td />
            {Array.from({ length: slots }, (_, s) => (
              <th key={s} scope="col" className={styles.hour}>
                <span aria-hidden="true">{(FIRST_HOUR + s) % 3 === 0 ? hourLabel(FIRST_HOUR + s) : ''}</span>
                <span className="visually-hidden">{`${FIRST_HOUR + s}:00`}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, d) => (
            <tr key={DAYS[d]}>
              <th scope="row" className={styles.day}>
                {DAYS[d]}
              </th>
              {row.map((minutes, s) => (
                <td
                  key={s}
                  className={styles.cell}
                  style={{ ['--fill' as string]: Math.min(1, minutes / 60) }}
                >
                  <span className="visually-hidden">{minutes} min</span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
