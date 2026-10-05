import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { captureUtm } from './lib/utm';
import Landing from './pages/Landing';

const Calculator = lazy(() => import('./pages/Calculator'));
const Next = lazy(() => import('./pages/Next'));
const Book = lazy(() => import('./pages/Book'));
const Thanks = lazy(() => import('./pages/Thanks'));
const Report = lazy(() => import('./pages/Report'));

function UtmCapture() {
  const { search } = useLocation();
  useEffect(() => {
    captureUtm(search);
  }, [search]);
  return null;
}

export function AppRoutes() {
  return (
    <>
      <UtmCapture />
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/calculator" element={<Calculator />} />
          <Route path="/next" element={<Next />} />
          <Route path="/book" element={<Book />} />
          <Route path="/thanks" element={<Thanks />} />
          <Route path="/report" element={<Report />} />
          <Route path="*" element={<Landing />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
