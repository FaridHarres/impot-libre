import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

export default function MentionsLegales() {
  return (
    <>
      <Helmet>
        <title>Mentions legales - Impot Libre</title>
        <meta
          name="description"
          content="Mentions legales, politique de confidentialite et politique de cookies du site impot-libre.fr."
        />
        <link rel="canonical" href="https://impot-libre.fr/mentions-legales" />
      </Helmet>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-2xl md:text-3xl font-bold text-texte mb-8">
          Mentions legales
        </h1>

        {/* Editeur */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-texte mb-3 pb-2 border-b border-gris-bordure">
            1. Editeur du site
          </h2>
          <div className="text-sm text-gris-texte leading-relaxed space-y-2">
            <p>Le site <strong>impot-libre.fr</strong> est un projet citoyen a but non lucratif.</p>
            <p>Editeur : Association Impot Libre (a completer)</p>
            <p>Adresse : (a completer)</p>
            <p>E-mail : contact@impot-libre.fr</p>
            <p>Directeur de la publication : (a completer)</p>
          </div>
        </section>

        {/* Hebergement */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-texte mb-3 pb-2 border-b border-gris-bordure">
            2. Hebergement
          </h2>
          <div className="text-sm text-gris-texte leading-relaxed space-y-2">
            <p>Hebergeur : (a completer)</p>
            <p>Adresse : (a completer)</p>
            <p>Telephone : (a completer)</p>
            <p>
              Conformement a la loi n&deg; 2004-575 du 21 juin 2004 pour la confiance dans
              l&apos;economie numerique, les elements d&apos;identification de l&apos;hebergeur
              sont communiques sur demande aupres de l&apos;editeur.
            </p>
          </div>
        </section>

        {/* RGPD */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-texte mb-3 pb-2 border-b border-gris-bordure">
            3. Protection des donnees personnelles (RGPD)
          </h2>
          <div className="text-sm text-gris-texte leading-relaxed space-y-3">
            <p>
              Conformement au Reglement (UE) 2016/679 du Parlement europeen et du Conseil
              du 27 avril 2016 (Reglement General sur la Protection des Donnees), vous
              disposez d&apos;un droit d&apos;acces, de rectification, de suppression et de
              portabilite de vos donnees personnelles.
            </p>

            <h3 className="font-semibold text-texte mt-4">Donnees collectees</h3>
            <p>Les donnees suivantes sont collectees lors de l&apos;utilisation du service :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Adresse e-mail (pour l&apos;authentification)</li>
              <li>Mot de passe (stocke sous forme hashee et salee)</li>
              <li>Empreinte numerique anonyme (pour la prevention des doublons)</li>
              <li>Allocations budgetaires saisies</li>
              <li>Adresse IP (journaux de connexion)</li>
            </ul>

            <h3 className="font-semibold text-texte mt-4">Finalite du traitement</h3>
            <p>
              Les donnees collectees sont traitees dans le but exclusif de permettre le
              fonctionnement du service de repartition budgetaire citoyenne, d&apos;en produire
              des statistiques agregees et anonymes, et de prevenir les abus (inscriptions
              multiples).
            </p>

            <h3 className="font-semibold text-texte mt-4">Base legale</h3>
            <p>
              Le traitement repose sur le consentement de l&apos;utilisateur (article 6.1.a du RGPD),
              recueilli lors de l&apos;inscription via l&apos;acceptation explicite de la politique
              de confidentialite.
            </p>

            <h3 className="font-semibold text-texte mt-4">Destinataires</h3>
            <p>
              Les donnees personnelles ne sont transmises a aucun tiers. Seules les statistiques
              agregees et anonymes sont rendues publiques. Aucune donnee n&apos;est transmise a
              l&apos;administration fiscale ou a quelque organisme gouvernemental que ce soit.
            </p>

            <h3 className="font-semibold text-texte mt-4">Exercice des droits</h3>
            <p>
              Vous pouvez exercer vos droits en adressant un e-mail a{' '}
              <a href="mailto:contact@impot-libre.fr" className="text-bleu-republique underline">
                contact@impot-libre.fr
              </a>
              . Une reponse vous sera adressee dans un delai de 30 jours. En cas de
              reclamation, vous pouvez saisir la CNIL (Commission Nationale de l&apos;Informatique
              et des Libertes).
            </p>
          </div>
        </section>

        {/* Cookies */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-texte mb-3 pb-2 border-b border-gris-bordure">
            4. Politique de cookies
          </h2>
          <div className="text-sm text-gris-texte leading-relaxed space-y-3">
            <p>
              Le site impot-libre.fr utilise uniquement des cookies strictement necessaires
              au fonctionnement du service :
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Cookie d&apos;authentification :</strong> jeton de session (JWT) stocke dans
                le localStorage du navigateur, permettant de maintenir votre connexion.
              </li>
              <li>
                <strong>Cookie technique :</strong> empreinte anonyme utilisee pour la prevention
                des doublons.
              </li>
            </ul>
            <p>
              Aucun cookie publicitaire, de tracking ou de mesure d&apos;audience
              n&apos;est utilise sur ce site.
            </p>
          </div>
        </section>

        {/* Conservation */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-texte mb-3 pb-2 border-b border-gris-bordure">
            5. Duree de conservation des donnees
          </h2>
          <div className="text-sm text-gris-texte leading-relaxed space-y-2">
            <p>Les donnees personnelles sont conservees pour les durees suivantes :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Compte utilisateur :</strong> pendant toute la duree d&apos;utilisation du
                service, puis supprime a la demande de l&apos;utilisateur ou 3 ans apres la
                derniere connexion.
              </li>
              <li>
                <strong>Allocations budgetaires :</strong> conservees de maniere anonymisee sans
                limitation de duree a des fins statistiques.
              </li>
              <li>
                <strong>Journaux de connexion :</strong> conserves 12 mois conformement aux
                obligations legales (LCEN).
              </li>
              <li>
                <strong>Donnees de la newsletter :</strong> conservees jusqu&apos;a la desinscription
                de l&apos;utilisateur.
              </li>
            </ul>
          </div>
        </section>

        {/* Contact */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-texte mb-3 pb-2 border-b border-gris-bordure">
            6. Contact
          </h2>
          <div className="text-sm text-gris-texte leading-relaxed space-y-2">
            <p>
              Pour toute question relative au site ou a vos donnees personnelles, vous pouvez
              nous contacter :
            </p>
            <p>
              E-mail :{' '}
              <a href="mailto:contact@impot-libre.fr" className="text-bleu-republique underline">
                contact@impot-libre.fr
              </a>
            </p>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-texte mb-3 pb-2 border-b border-gris-bordure">
            7. Avertissement
          </h2>
          <div className="text-sm text-gris-texte leading-relaxed space-y-3">
            <div className="bg-avertissement/10 border border-avertissement rounded-sm p-4">
              <p className="font-semibold text-texte mb-2">
                Ce site n&apos;est pas affilie a l&apos;Etat francais.
              </p>
              <p>
                Impot-libre.fr est un outil citoyen independant a titre informatif uniquement.
                Il ne constitue ni une declaration fiscale, ni un acte administratif, ni une
                recommandation officielle. Les resultats presentes n&apos;engagent pas l&apos;Etat
                et n&apos;ont aucune valeur juridique.
              </p>
            </div>
            <p>
              Le site et ses contenus sont fournis &laquo; en l&apos;etat &raquo;, sans garantie
              d&apos;exactitude ou d&apos;exhaustivite. L&apos;editeur ne saurait etre tenu
              responsable des eventuelles erreurs, omissions ou resultats obtenus suite a
              l&apos;utilisation du service.
            </p>
          </div>
        </section>

        {/* Propriete intellectuelle */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-texte mb-3 pb-2 border-b border-gris-bordure">
            8. Propriete intellectuelle
          </h2>
          <div className="text-sm text-gris-texte leading-relaxed">
            <p>
              L&apos;ensemble des contenus du site (textes, graphiques, logiciels, base de donnees)
              est protege par le droit de la propriete intellectuelle. Toute reproduction,
              representation ou diffusion, totale ou partielle, du contenu de ce site sans
              autorisation est interdite et constituerait une contrefacon sanctionnee par les
              articles L.335-2 et suivants du Code de la propriete intellectuelle.
            </p>
          </div>
        </section>

        <p className="text-xs text-gris-texte text-center mt-12">
          Derniere mise a jour : avril 2026
        </p>
      </div>
    </>
  );
}
