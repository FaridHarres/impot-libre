const TOLERANCE = 0.01;

export function validateAllocation(poles) {
  const errors = [];

  if (!poles || !Array.isArray(poles) || poles.length === 0) {
    errors.push('Aucun pôle fourni.');
    return { valid: false, isValid: false, errors };
  }

  const total = poles.reduce((sum, p) => sum + (p.percentage || 0), 0);

  if (Math.abs(total - 100) > TOLERANCE) {
    errors.push(
      `Le total des allocations doit être égal à 100%. Actuellement : ${total.toFixed(2)}%.`
    );
  }

  for (const pole of poles) {
    if (pole.percentage < 0) {
      errors.push(
        `Le pourcentage pour « ${pole.name} » ne peut pas être négatif.`
      );
    }

    if (
      pole.minimum !== undefined &&
      pole.percentage < pole.minimum - TOLERANCE
    ) {
      errors.push(
        `Le pôle « ${pole.name} » requiert un minimum de ${pole.minimum}%. Actuellement : ${pole.percentage.toFixed(2)}%.`
      );
    }
  }

  return {
    valid: errors.length === 0,
    isValid: errors.length === 0,
    errors,
    total: parseFloat(total.toFixed(2)),
  };
}

export function getRemainingPercentage(poles) {
  if (!poles || !Array.isArray(poles)) return 100;
  const total = poles.reduce((sum, p) => sum + (p.percentage || 0), 0);
  return parseFloat((100 - total).toFixed(2));
}

export default validateAllocation;
