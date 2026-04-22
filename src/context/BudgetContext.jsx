import { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import api from '../services/api';

export const BudgetContext = createContext(null);

/**
 * BudgetProvider — charge les pôles depuis l'API (source de vérité = BDD).
 * Chaque pôle contient ses ministères rattachés.
 * L'allocation se fait au niveau des pôles (8 cartes, minimum 3% chacun).
 */
export function BudgetProvider({ children }) {
  const [poles, setPoles] = useState([]);
  const [loadingPoles, setLoadingPoles] = useState(true);
  const [polesError, setPolesError] = useState(null);

  // ─── Chargement initial des pôles depuis la BDD ───
  useEffect(() => {
    api.get('/ministeres/poles')
      .then((res) => {
        const data = res.data;
        if (!Array.isArray(data) || data.length === 0) {
          setPolesError('Aucun pôle retourné par le serveur.');
          return;
        }

        // Initialiser chaque pôle à son minimum (3%)
        const initialized = data.map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          emoji: p.emoji,
          minimum: p.minimum_percentage,
          percentage: p.minimum_percentage,
          ministeres: p.ministeres.map((m) => m.name),
          ministeresDetail: p.ministeres,
        }));

        setPoles(initialized);
      })
      .catch((err) => {
        console.error('[BUDGET] Erreur chargement pôles :', err);
        setPolesError('Impossible de charger les pôles. Vérifiez que le serveur est démarré.');
      })
      .finally(() => setLoadingPoles(false));
  }, []);

  // ─── Calculs dérivés ───

  const total = useMemo(
    () => parseFloat(poles.reduce((sum, p) => sum + p.percentage, 0).toFixed(2)),
    [poles]
  );

  const remaining = useMemo(
    () => parseFloat((100 - total).toFixed(2)),
    [total]
  );

  const isComplete = useMemo(
    () => Math.abs(remaining) < 0.01,
    [remaining]
  );

  const validation = useMemo(() => {
    const errors = [];
    if (poles.length === 0) {
      errors.push('Aucun pôle chargé.');
      return { valid: false, isValid: false, errors, total: 0 };
    }

    const t = poles.reduce((sum, p) => sum + p.percentage, 0);
    if (Math.abs(t - 100) > 0.01) {
      errors.push(`Le total doit être de 100%. Actuellement : ${t.toFixed(2)}%.`);
    }

    for (const p of poles) {
      if (p.percentage < p.minimum - 0.01) {
        errors.push(`« ${p.name} » requiert un minimum de ${p.minimum}%.`);
      }
    }

    return {
      valid: errors.length === 0,
      isValid: errors.length === 0,
      errors,
      total: parseFloat(t.toFixed(2)),
    };
  }, [poles]);

  // ─── Mise à jour d'un slider de pôle avec cap à 100% ───
  const updatePole = useCallback((id, newValue) => {
    setPoles((prev) => {
      const pole = prev.find((p) => p.id === id);
      if (!pole) return prev;

      let val = parseFloat(parseFloat(newValue).toFixed(1));
      if (isNaN(val)) return prev;

      // Respect du plancher minimum
      if (val < pole.minimum) val = pole.minimum;

      // Calcul du total des AUTRES pôles
      const totalAutres = prev
        .filter((p) => p.id !== id)
        .reduce((sum, p) => sum + p.percentage, 0);

      // Cap : ne jamais dépasser 100%
      const maxAutorise = parseFloat((100 - totalAutres).toFixed(1));
      if (val > maxAutorise) val = maxAutorise;

      if (val === pole.percentage) return prev;

      return prev.map((p) =>
        p.id === id ? { ...p, percentage: val } : p
      );
    });
  }, []);

  // ─── Réinitialiser aux minimums ───
  const resetToMinimums = useCallback(() => {
    setPoles((prev) =>
      prev.map((p) => ({ ...p, percentage: p.minimum }))
    );
  }, []);

  // ─── Répartition égale ───
  const resetToEqual = useCallback(() => {
    setPoles((prev) => {
      const count = prev.length;
      if (count === 0) return prev;

      const totalMins = prev.reduce((s, p) => s + p.minimum, 0);
      const surplus = 100 - totalMins;
      const bonusEach = parseFloat((surplus / count).toFixed(1));

      let distributed = 0;
      return prev.map((p, i) => {
        if (i < count - 1) {
          distributed += bonusEach;
          return { ...p, percentage: parseFloat((p.minimum + bonusEach).toFixed(1)) };
        }
        const lastBonus = parseFloat((surplus - distributed).toFixed(1));
        return { ...p, percentage: parseFloat((p.minimum + lastBonus).toFixed(1)) };
      });
    });
  }, []);

  // ─── Données pour envoi à l'API — utilise les ID de pôles ───
  const getAllocationData = useCallback(
    () =>
      poles.map(({ id, percentage }) => ({
        pole_id: id,
        percentage: parseFloat(percentage.toFixed(2)),
      })),
    [poles]
  );

  const value = {
    poles,
    loadingPoles,
    polesError,
    total,
    remaining,
    isComplete,
    validation,
    updatePole,
    resetToMinimums,
    resetToEqual,
    getAllocationData,
    // Aliases pour compatibilité
    ministries: poles,
    loadingMinistries: loadingPoles,
    ministriesError: polesError,
    updateMinistry: updatePole,
  };

  return (
    <BudgetContext.Provider value={value}>
      {children}
    </BudgetContext.Provider>
  );
}

export default BudgetProvider;
