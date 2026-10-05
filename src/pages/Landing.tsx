import { ButtonLink } from '../components/Button/Button';
import { BRAND, PROOF } from '../data/copy';
import { Placeholder } from './Placeholder';

export default function Landing() {
  return (
    <Placeholder title={BRAND.title}>
      <p>{BRAND.subtitle}</p>
      <p className="num">
        {PROOF.foundersServed} · {PROOF.retention} · {PROOF.rating}
      </p>
      <p>
        <ButtonLink to="/calculator">Start the calculator</ButtonLink>
      </p>
    </Placeholder>
  );
}
