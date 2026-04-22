import { z } from 'zod';

const NOM_REGEX = /^[a-zA-ZÀ-ÿ\s'-]{2,100}$/;

export const registerSchema = z.object({
  prenom: z
    .string()
    .min(2, 'Le prénom doit contenir au moins 2 caractères.')
    .max(100)
    .regex(NOM_REGEX, 'Le prénom contient des caractères non autorisés.'),
  nom: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères.')
    .max(100)
    .regex(NOM_REGEX, 'Le nom contient des caractères non autorisés.'),
  email: z
    .string()
    .email("Format d'email invalide.")
    .max(255)
    .transform((v) => v.toLowerCase().trim()),
  password: z
    .string()
    .min(12, 'Le mot de passe doit contenir au moins 12 caractères.')
    .max(128)
    .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule.')
    .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre.')
    .regex(/[^a-zA-Z0-9]/, 'Le mot de passe doit contenir au moins un caractère spécial.'),
  // Champs optionnels pour l'anti-doublon
  resolution: z.string().max(50).optional(),
  language: z.string().max(50).optional(),
  fingerprint: z.string().max(256).optional(),
  // Accepter newsletter/rgpd du frontend (non utilisés côté back mais envoyés)
  newsletter: z.boolean().optional(),
  rgpd: z.boolean().optional(),
  confirmPassword: z.string().optional(),
});

export const loginSchema = z.object({
  email: z
    .string()
    .email("Format d'email invalide.")
    .max(255)
    .transform((v) => v.toLowerCase().trim()),
  password: z.string().min(1, 'Mot de passe requis.').max(128),
});

export const resendVerificationSchema = z.object({
  email: z
    .string()
    .email("Format d'email invalide.")
    .max(255)
    .transform((v) => v.toLowerCase().trim()),
});

export const adminLoginSchema = loginSchema;

export const adminVerify2FASchema = z.object({
  email: z
    .string()
    .email()
    .max(255)
    .transform((v) => v.toLowerCase().trim()),
  otp: z
    .string()
    .length(6, 'Le code doit contenir exactement 6 chiffres.')
    .regex(/^\d{6}$/, 'Le code doit être composé de 6 chiffres.'),
});
