const TOLERANCE = 0.01;

export function validateAllocation(ministries) {
  const errors = [];

  if (!ministries || !Array.isArray(ministries) || ministries.length === 0) {
    errors.push('Aucun ministere fourni.');
    return { valid: false, errors };
  }

  const total = ministries.reduce((sum, m) => sum + (m.percentage || 0), 0);

  if (Math.abs(total - 100) > TOLERANCE) {
    errors.push(
      `Le total des allocations doit etre egal a 100 %. Actuellement : ${total.toFixed(2)} %.`
    );
  }

  for (const ministry of ministries) {
    if (ministry.percentage < 0) {
      errors.push(
        `Le pourcentage pour "${ministry.name}" ne peut pas etre negatif.`
      );
    }

    if (
      ministry.minimum !== undefined &&
      ministry.percentage < ministry.minimum - TOLERANCE
    ) {
      errors.push(
        `Le ministere "${ministry.name}" requiert un minimum de ${ministry.minimum} %. Actuellement : ${ministry.percentage.toFixed(2)} %.`
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

export function getRemainingPercentage(ministries) {
  if (!ministries || !Array.isArray(ministries)) return 100;
  const total = ministries.reduce((sum, m) => sum + (m.percentage || 0), 0);
  return parseFloat((100 - total).toFixed(2));
}

export default validateAllocation;
