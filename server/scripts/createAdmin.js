/**
 * Script de création du compte administrateur.
 * À exécuter UNE SEULE FOIS en ligne de commande :
 *
 *   node scripts/createAdmin.js
 *
 * Les identifiants sont lus depuis le fichier .env :
 *   ADMIN_PRENOM, ADMIN_NOM, ADMIN_EMAIL, ADMIN_PASSWORD
 */

import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcrypt';
import pool from '../db.js';

const PRENOM  = process.env.ADMIN_PRENOM;
const NOM     = process.env.ADMIN_NOM;
const EMAIL   = process.env.ADMIN_EMAIL;
const PASSWORD = process.env.ADMIN_PASSWORD;

if (!PRENOM || !NOM || !EMAIL || !PASSWORD) {
  console.error('❌ Variables manquantes dans le .env :');
  console.error('   ADMIN_PRENOM, ADMIN_NOM, ADMIN_EMAIL, ADMIN_PASSWORD');
  process.exit(1);
}

async function createAdmin() {
  try {
    const existing = await pool.query(
      "SELECT id, email FROM users WHERE role = 'admin'"
    );

    if (existing.rows.length > 0) {
      console.log(`⚠️  Un compte admin existe déjà : ${existing.rows[0].email}`);
      console.log("   Supprimez-le d'abord si vous souhaitez en recréer un.");
      process.exit(1);
    }

    const hash = await bcrypt.hash(PASSWORD, 12);

    const result = await pool.query(
      `INSERT INTO users (prenom, nom, email, password_hash, role, email_verified)
       VALUES ($1, $2, $3, $4, 'admin', TRUE)
       RETURNING id, email, role`,
      [PRENOM.trim(), NOM.trim(), EMAIL.toLowerCase().trim(), hash]
    );

    const admin = result.rows[0];
    console.log('✅ Compte administrateur créé avec succès :');
    console.log(`   ID    : ${admin.id}`);
    console.log(`   Email : ${admin.email}`);
    console.log(`   Rôle  : ${admin.role}`);
    console.log('');
    console.log("   Connectez-vous via l'URL secrète /gestion-[ADMIN_URL_SECRET]");
    console.log('   La connexion nécessite un code 2FA envoyé par email.');

    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur lors de la création du compte admin :', err.message);
    process.exit(1);
  }
}

createAdmin();
