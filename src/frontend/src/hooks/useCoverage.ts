import { useEffect, useState } from 'react';
import { loadCoverage, COVERAGE_ERROR, type Coverage } from '../services/coverage';
export function useCoverage() {
  const [coverage, setCoverage] = useState<Coverage | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    loadCoverage().then(value => { if (active) setCoverage(value); }).catch(() => { if (active) setError(COVERAGE_ERROR); });
    return () => { active = false; };
  }, []);
  return { coverage, error };
}
