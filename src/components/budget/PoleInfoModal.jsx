import { useEffect, useCallback, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { formatCurrency } from '../../utils/formatCurrency';
import polesInfo from '../../data/polesInfo';

function PoleInfoModalContent({ poleId, percentage, taxAmount, onClose }) {
  const info = polesInfo[poleId];
  const overlayRef = useRef(null);
  const bodyRef = useRef(null);
  const [showScrollHint, setShowScrollHint] = useState(true);

  const handleKeyDown = useCallback(
    (e) => { if (e.key === 'Escape') onClose(); },
    [onClose]
  );

  const handleScroll = useCallback(() => {
    if (!bodyRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = bodyRef.current;
    setShowScrollHint(scrollHeight - scrollTop - clientHeight > 20);
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  if (!info) return null;

  const contributionEuros = taxAmount > 0 ? (percentage / 100) * taxAmount : 0;

  return (
    <div
      ref={overlayRef}
      className="pole-modal-overlay"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="pole-modal-container">
        {/* Header */}
        <div className="pole-modal-header">
          <div className="pole-modal-header-content">
            <div className="pole-modal-emoji">{info.emoji}</div>
            <div className="pole-modal-title-wrap">
              <h2 className="pole-modal-title">{info.nom}</h2>
              <span className="pole-modal-badge">{info.budgetTotal} Md€ — LFI 2024</span>
            </div>
          </div>
          <button onClick={onClose} className="pole-modal-close" aria-label="Fermer">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="pole-modal-body" ref={bodyRef} onScroll={handleScroll}>
          {taxAmount > 0 && (
            <div className="pole-modal-contribution">
              <p className="pole-modal-contribution-label">Votre contribution</p>
              <p className="pole-modal-contribution-amount">{formatCurrency(contributionEuros)}</p>
              <p className="pole-modal-contribution-detail">
                Avec vos {percentage.toFixed(1)} % sur un impôt de {formatCurrency(taxAmount)},
                vous contribuez {formatCurrency(contributionEuros)} à ce pôle.
              </p>
            </div>
          )}

          <p className="pole-modal-description">{info.descriptionCourte}</p>

          {info.missions && info.missions.length > 0 && (
            <div className="pole-modal-missions">
              <h3 className="pole-modal-section-title">Missions budgétaires officielles</h3>
              <div className="pole-modal-missions-list">
                {info.missions.map((m, i) => (
                  <div key={i} className="pole-modal-mission-item">
                    <div className="pole-modal-mission-dot" />
                    <span className="pole-modal-mission-name">{m}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {info.note && (
            <div className="pole-modal-note">
              <span className="pole-modal-note-label">Note :</span> {info.note}
            </div>
          )}
        </div>

        {/* Scroll hint */}
        {showScrollHint && <div className="pole-modal-scroll-hint" />}

        {/* Footer */}
        <div className="pole-modal-footer">
          <a href={info.sourceUrl} target="_blank" rel="noopener noreferrer" className="pole-modal-source">
            Source : budget.gouv.fr →
          </a>
          <button onClick={onClose} className="pole-modal-close-btn">Fermer</button>
        </div>
      </div>
    </div>
  );
}

export default function PoleInfoModal(props) {
  return createPortal(
    <PoleInfoModalContent {...props} />,
    document.body
  );
}
