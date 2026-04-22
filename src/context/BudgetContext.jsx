import { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { validateAllocation } from '../utils/validateAllocation';
import api from '../services/api';

export const BudgetContext = createContext(null);

/**
 * BudgetProvider — charge les ministères depuis l'API (source de vérité = BDD).
 * Plus AUCUN hardcode de noms, slugs ou minimums côté frontend.
 * Toutes les clés sont des ID numériques PostgreSQL.
 */
export function BudgetProvider({ children }) {
  // Liste des ministères chargée depuis /api/ministeres
  const [ministries, setMinistries] = useState([]);
  const [loadingMinistries, setLoadingMinistries] = useState(true);
  const [ministriesError, setMinistriesError] = useState(null);

  // ─── Chargement initial depuis la BDD ───
  useEffect(() => {
    api.get('/ministeres')
      .then((res) => {
        const data = res.data;
        if (!Array.isArray(data) || data.length === 0) {
          setMinistriesError('Aucun ministère retourné par le serveur.');
          return;
        }

        // Initialiser chaque allocation à son minimum
        const initialized = data.map((m) => ({
          id: m.id,                                        // ID numérique BDD
          name: m.name,                                    // Nom complet depuis la BDD
          slug: m.slug,                                    // Slug pour affichage/URL
          minimum: parseFloat(m.minimum_percentage),       // Plancher minimum
          percentage: parseFloat(m.minimum_percentage),    // Valeur initiale = minimum
        }));

        setMinistries(initialized);
      })
      .catch((err) => {
        console.error('[BUDGET] Erreur chargement ministères :', err);
        setMinistriesError('Impossible de charger les ministères. Vérifiez que le serveur est démarré.');
      })
      .finally(() => setLoadingMinistries(false));
  }, []);

  // ─── Calculs dérivés ───

  const total = useMemo(
    () => parseFloat(ministries.reduce((sum, m) => sum + m.percentage, 0).toFixed(2)),
    [ministries]
  );

  const remaining = useMemo(
    () => parseFloat((100 - total).toFixed(2)),
    [total]
  );

  const isComplete = useMemo(
    () => Math.abs(remaining) < 0.01,
    [remaining]
  );

  const validation = useMemo(
    () => validateAllocation(ministries),
    [ministries]
  );

  // ─── Mise à jour d'un slider avec cap à 100% ───
  const updateMinistry = useCallback((id, newValue) => {
    setMinistries((prev) => {
      const ministere = prev.find((m) => m.id === id);
      if (!ministere) return prev;

      let val = parseFloat(parseFloat(newValue).toFixed(1));
      if (isNaN(val)) return prev;

      // Respect du plancher minimum
      if (val < ministere.minimum) val = ministere.minimum;

      // Calcul du total des AUTRES ministères
      const totalAutres = prev
        .filter((m) => m.id !== id)
        .reduce((sum, m) => sum + m.percentage, 0);

      // Cap : ne jamais dépasser 100%
      const maxAutorise = parseFloat((100 - totalAutres).toFixed(1));
      if (val > maxAutorise) val = maxAutorise;

      if (val === ministere.percentage) return prev;

      return prev.map((m) =>
        m.id === id ? { ...m, percentage: val } : m
      );
    });
  }, []);

  // ─── Réinitialiser aux minimums ───
  const resetToMinimums = useCallback(() => {
    setMinistries((prev) =>
      prev.map((m) => ({ ...m, percentage: m.minimum }))
    );
  }, []);

  // ─── Répartition égale (surplus distribué équitablement au-dessus des minimums) ───
  const resetToEqual = useCallback(() => {
    setMinistries((prev) => {
      const count = prev.length;
      if (count === 0) return prev;

      const totalMins = prev.reduce((s, m) => s + m.minimum, 0);
      const surplus = 100 - totalMins;
      const bonusEach = parseFloat((surplus / count).toFixed(1));

      let distributed = 0;
      return prev.map((m, i) => {
        if (i < count - 1) {
          distributed += bonusEach;
          return { ...m, percentage: parseFloat((m.minimum + bonusEach).toFixed(1)) };
        }
        const lastBonus = parseFloat((surplus - distributed).toFixed(1));
        return { ...m, percentage: parseFloat((m.minimum + lastBonus).toFixed(1)) };
      });
    });
  }, []);

  const getMinistryById = useCallback(
    (id) => ministries.find((m) => m.id === id),
    [ministries]
  );

  // ─── Données pour envoi à l'API — utilise les ID numériques BDD ───
  const getAllocationData = useCallback(
    () =>
      ministries.map(({ id, percentage }) => ({
        ministere_id: id,                                 // ← ID numérique, jamais un slug
        percentage: parseFloat(percentage.toFixed(2)),
      })),
    [ministries]
  );

  const value = {
    ministries,
    loadingMinistries,
    ministriesError,
    total,
    remaining,
    isComplete,
    validation,
    updateMinistry,
    resetToMinimums,
    resetToEqual,
    getMinistryById,
    getAllocationData,
  };

  return (
    <BudgetContext.Provider value={value}>
      {children}
    </BudgetContext.Provider>
  );
}

export default BudgetProvider;
