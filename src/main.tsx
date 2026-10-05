import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Placeholder until the UI lands; keeps `npm run build` (and CI) green.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <main>The Founder Freedom Calculator</main>
  </StrictMode>,
);
