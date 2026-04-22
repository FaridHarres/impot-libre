import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import api from '../../services/api';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';

export default function AdminNewsletter() {
  const [subscribers, setSubscribers] = useState([]);
  const [subscribersLoading, setSubscribersLoading] = useState(true);
  const [subscribersError, setSubscribersError] = useState('');

  const [campaign, setCampaign] = useState({ subject: '', htmlContent: '' });
  const [campaignErrors, setCampaignErrors] = useState({});
  const [sendLoading, setSendLoading] = useState(false);
  const [sendSuccess, setSendSuccess] = useState('');
  const [sendError, setSendError] = useState('');

  const [confirmModal, setConfirmModal] = useState(false);

  // Load subscribers
  useEffect(() => {
    api
      .get('/admin/newsletter/subscribers')
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data?.subscribers || [];
        setSubscribers(data);
      })
      .catch(() => setSubscribersError('Impossible de charger la liste des abonnes.'))
      .finally(() => setSubscribersLoading(false));
  }, []);

  const handleCampaignChange = (e) => {
    const { name, value } = e.target;
    setCampaign((prev) => ({ ...prev, [name]: value }));
    setCampaignErrors((prev) => ({ ...prev, [name]: '' }));
    setSendError('');
    setSendSuccess('');
  };

  const validateCampaign = () => {
    const errs = {};
    if (!campaign.subject.trim()) errs.subject = 'L\'objet est requis.';
    if (!campaign.htmlContent.trim()) errs.htmlContent = 'Le contenu est requis.';
    return errs;
  };

  const handleOpenConfirm = () => {
    const errs = validateCampaign();
    if (Object.keys(errs).length > 0) {
      setCampaignErrors(errs);
      return;
    }
    setConfirmModal(true);
  };

  const handleSend = async () => {
    setConfirmModal(false);
    setSendLoading(true);
    setSendError('');
    setSendSuccess('');
    try {
      await api.post('/admin/newsletter/campaign', {
        subject: campaign.subject,
        htmlContent: campaign.htmlContent,
      });
      setSendSuccess(`Campagne envoyee avec succes a ${subscribers.length} abonne${subscribers.length > 1 ? 's' : ''}.`);
      setCampaign({ subject: '', htmlContent: '' });
    } catch (err) {
      const msg = err.response?.data?.message || 'Erreur lors de l\'envoi de la campagne.';
      setSendError(msg);
    } finally {
      setSendLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Newsletter - Administration - Impot Libre</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-texte mb-2">
          Gestion de la newsletter
        </h1>
        <p className="text-sm text-gris-texte mb-8">
          Gerez vos abonnes et envoyez des campagnes.
        </p>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Subscribers panel */}
          <div>
            <div className="bg-white border border-gris-bordure rounded-sm">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gris-bordure">
                <h2 className="text-base font-semibold text-texte">
                  Abonnes
                </h2>
                <Badge variant="info">
                  {subscribers.length} abonne{subscribers.length > 1 ? 's' : ''}
                </Badge>
              </div>

              <div className="p-5">
                {subscribersLoading && (
                  <div className="text-center py-8">
                    <div className="inline-block w-6 h-6 border-3 border-bleu-republique border-t-transparent rounded-full animate-spin" />
                    <p className="mt-2 text-xs text-gris-texte">Chargement...</p>
                  </div>
                )}

                {subscribersError && (
                  <p className="text-sm text-rouge-marianne">{subscribersError}</p>
                )}

                {!subscribersLoading && !subscribersError && subscribers.length === 0 && (
                  <p className="text-sm text-gris-texte text-center py-4">
                    Aucun abonne pour le moment.
                  </p>
                )}

                {!subscribersLoading && subscribers.length > 0 && (
                  <div className="max-h-96 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gris-bordure">
                          <th className="text-left py-2 font-medium text-gris-texte">E-mail</th>
                          <th className="text-right py-2 font-medium text-gris-texte">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subscribers.map((sub, i) => (
                          <tr key={sub.id || sub.email || i} className="border-b border-gris-bordure/50">
                            <td className="py-2 text-texte truncate max-w-[200px]">
                              {sub.email}
                            </td>
                            <td className="py-2 text-right text-xs text-gris-texte">
                              {sub.createdAt
                                ? new Date(sub.createdAt).toLocaleDateString('fr-FR')
                                : sub.subscribedAt
                                ? new Date(sub.subscribedAt).toLocaleDateString('fr-FR')
                                : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Campaign form */}
          <div>
            <div className="bg-white border border-gris-bordure rounded-sm">
              <div className="px-5 py-4 border-b border-gris-bordure">
                <h2 className="text-base font-semibold text-texte">
                  Nouvelle campagne
                </h2>
              </div>

              <div className="p-5">
                {sendSuccess && (
                  <div className="mb-4 p-3 bg-succes/10 border border-succes rounded-sm">
                    <p className="text-sm text-succes">{sendSuccess}</p>
                  </div>
                )}

                {sendError && (
                  <div className="mb-4 p-3 bg-rouge-marianne/10 border border-rouge-marianne rounded-sm">
                    <p className="text-sm text-rouge-marianne">{sendError}</p>
                  </div>
                )}

                <Input
                  label="Objet du message"
                  name="subject"
                  value={campaign.subject}
                  onChange={handleCampaignChange}
                  error={campaignErrors.subject}
                  placeholder="Ex. : Resultats du mois d'avril"
                  required
                />

                <div className="mb-4">
                  <label
                    htmlFor="htmlContent"
                    className="block text-sm font-medium text-texte mb-1"
                  >
                    Contenu HTML <span className="text-rouge-marianne">*</span>
                  </label>
                  <textarea
                    id="htmlContent"
                    name="htmlContent"
                    value={campaign.htmlContent}
                    onChange={handleCampaignChange}
                    rows={10}
                    placeholder="<h1>Bonjour,</h1><p>Voici les derniers resultats...</p>"
                    className={`w-full px-3 py-2 text-sm text-texte bg-white border rounded-sm font-mono transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-bleu-republique resize-y ${
                      campaignErrors.htmlContent ? 'border-rouge-marianne' : 'border-gris-bordure'
                    }`}
                  />
                  {campaignErrors.htmlContent && (
                    <p className="mt-1 text-xs text-rouge-marianne">{campaignErrors.htmlContent}</p>
                  )}
                </div>

                <Button
                  onClick={handleOpenConfirm}
                  loading={sendLoading}
                  disabled={subscribers.length === 0}
                  className="w-full"
                >
                  Envoyer la campagne
                </Button>

                {subscribers.length === 0 && !subscribersLoading && (
                  <p className="mt-2 text-xs text-gris-texte text-center">
                    Aucun abonne. L&apos;envoi n&apos;est pas possible.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation modal */}
      <Modal
        isOpen={confirmModal}
        onClose={() => setConfirmModal(false)}
        title="Confirmer l'envoi"
      >
        <div className="space-y-4">
          <p className="text-sm text-gris-texte">
            Vous etes sur le point d&apos;envoyer cette campagne a{' '}
            <strong className="text-texte">{subscribers.length}</strong> abonne{subscribers.length > 1 ? 's' : ''}.
          </p>
          <div className="bg-fond rounded-sm p-3">
            <p className="text-xs text-gris-texte mb-1">Objet :</p>
            <p className="text-sm font-medium text-texte">{campaign.subject}</p>
          </div>
          <p className="text-sm text-rouge-marianne font-medium">
            Cette action est irreversible.
          </p>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setConfirmModal(false)}>
              Annuler
            </Button>
            <Button variant="danger" onClick={handleSend}>
              Confirmer l&apos;envoi
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
