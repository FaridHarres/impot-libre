import { z } from 'zod';

export const allocationSchema = z.object({
  totalAmount: z
    .number({ invalid_type_error: 'Le montant doit être un nombre.' })
    .min(1, 'Le montant minimum est 1 €.')
    .max(10_000_000, 'Le montant maximum est 10 000 000 €.'),
  allocations: z
    .array(
      z.object({
        ministere_id: z.number().int().min(1),
        percentage: z.number().min(0).max(100),
      })
    )
    .min(1, 'La répartition est requise.'),
});

export const newsletterSchema = z.object({
  email: z
    .string()
    .email("Format d'email invalide.")
    .max(255)
    .transform((v) => v.toLowerCase().trim()),
});
