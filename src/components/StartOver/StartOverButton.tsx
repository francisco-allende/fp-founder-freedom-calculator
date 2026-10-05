import { useNavigate } from 'react-router-dom';
import { NAV } from '../../data/pageCopy';
import { startOver } from '../../lib/session';
import { Button } from '../Button/Button';

/** Clears the finished run and every wizard answer, then opens step 1. */
export function StartOverButton() {
  const navigate = useNavigate();
  return (
    <Button
      variant="secondary"
      onClick={() => {
        startOver();
        navigate('/calculator');
      }}
    >
      {NAV.startOver}
    </Button>
  );
}
