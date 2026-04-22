import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import api from '../../services/api';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

export default function AdminExport() {
  const [preview, setPreview] = useState(null);
  const [previewFormat, setPreviewFormat] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState('');
  const [error, setError] = useState('');

  const downloadFile = async (format) => {
    setDownloadLoading(format);
    setError('');
    try {
      const response = await api.get(`/admin/export/${format}`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], {
        type: format === 'csv' ? 'text/csv;charset=utf-8;' : 'application/json',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `impot-libre-export-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      setError(`Erreur lors du telechargement du fichier ${format.toUpperCase()}.`);
    } finally {
      setDownloadLoading('');
    }
  };

  const loadPreview = async (format) => {
    setPreviewLoading(true);
    setPreviewFormat(format);
    setError('');
    try {
      const response = await api.get(`/admin/export/${format}`);
      if (format === 'csv') {
        setPreview(typeof response.data === 'string' ? response.data : JSON.stringify(response.data));
      } else {
        setPreview(JSON.stringify(response.data, null, 2));
      }
    } catch {
      setError('Impossible de charger l\'apercu.');
      setPreview(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Export des donnees - Administration - Impot Libre</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-texte mb-2">
          Export des donnees
        </h1>
        <p className="text-sm text-gris-texte mb-8">
          Telechargez les donnees d&apos;allocation au format CSV ou JSON.
        </p>

        {error && (
          <div className="mb-6 p-3 bg-rouge-marianne/10 border border-rouge-marianne rounded-sm">
            <p className="text-sm text-rouge-marianne">{error}</p>
          </div>
        )}

        {/* Export cards */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {/* CSV */}
          <div className="bg-white border border-gris-bordure rounded-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-succes/10 rounded-sm flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-succes" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-semibold text-texte">Export CSV</h2>
                <p className="text-xs text-gris-texte">Tableur, Excel, LibreOffice</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => downloadFile('csv')}
                loading={downloadLoading === 'csv'}
                className="flex-1"
              >
                Telecharger
              </Button>
              <Button
                variant="secondary"
                onClick={() => loadPreview('csv')}
              >
                Apercu
              </Button>
            </div>
          </div>

          {/* JSON */}
          <div className="bg-white border border-gris-bordure rounded-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-bleu-republique/10 rounded-sm flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-bleu-republique" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-semibold text-texte">Export JSON</h2>
                <p className="text-xs text-gris-texte">API, developpeurs</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => downloadFile('json')}
                loading={downloadLoading === 'json'}
                className="flex-1"
              >
                Telecharger
              </Button>
              <Button
                variant="secondary"
                onClick={() => loadPreview('json')}
              >
                Apercu
              </Button>
            </div>
          </div>
        </div>

        {/* Preview */}
        {previewLoading && (
          <div className="text-center py-8">
            <div className="inline-block w-6 h-6 border-3 border-bleu-republique border-t-transparent rounded-full animate-spin" />
            <p className="mt-2 text-sm text-gris-texte">Chargement de l&apos;apercu...</p>
          </div>
        )}

        {preview && !previewLoading && (
          <div className="bg-white border border-gris-bordure rounded-sm">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gris-bordure">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium text-texte">Apercu des donnees</h3>
                <Badge variant="info">{previewFormat.toUpperCase()}</Badge>
              </div>
              <button
                onClick={() => { setPreview(null); setPreviewFormat(''); }}
                className="text-xs text-gris-texte hover:text-texte cursor-pointer"
              >
                Fermer
              </button>
            </div>
            <pre className="p-4 text-xs text-gris-texte overflow-auto max-h-96 font-mono whitespace-pre-wrap">
              {preview.length > 5000 ? preview.substring(0, 5000) + '\n\n... (apercu tronque)' : preview}
            </pre>
          </div>
        )}
      </div>
    </>
  );
}
