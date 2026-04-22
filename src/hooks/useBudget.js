import { useContext } from 'react';
import { BudgetContext } from '../context/BudgetContext';

export function useBudget() {
  const context = useContext(BudgetContext);
  if (!context) {
    throw new Error('useBudget doit etre utilise dans un BudgetProvider');
  }
  return context;
}

export default useBudget;
