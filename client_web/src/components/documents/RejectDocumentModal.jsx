import { useState } from 'react'
import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, XCircle, X } from 'lucide-react'
import Modal from '../common/Modal'

/**
 * Modal component for rejecting documents with a reason
 */
const RejectDocumentModal = ({ isOpen, onClose, onConfirm, documentTitle }) => {
  const { t } = useTranslation()
  const [rejectionReason, setRejectionReason] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!rejectionReason.trim()) {
      setError(t('documents.rejection.reasonRequired'))
      return
    }

    onConfirm(rejectionReason.trim())
    handleClose()
  }

  const handleClose = () => {
    setRejectionReason('')
    setError('')
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('documents.rejection.title')}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Document Title Summary */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800">
          <span className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">
            {t('documents.title')}
          </span>
          <p className="text-gray-900 dark:text-gray-100 font-semibold truncate">
            {documentTitle}
          </p>
        </div>

        {/* Rejection Reason Input */}
        <div className="space-y-2">
          <label className="form-label font-bold" htmlFor="rejectionReason">
            {t('documents.rejection.reason')} <span className="text-rose-600">*</span>
          </label>
          <textarea
            id="rejectionReason"
            className={`form-input min-h-[120px] resize-none ${error ? 'border-rose-500 ring-rose-500/20' : ''}`}
            value={rejectionReason}
            onChange={(e) => {
              setRejectionReason(e.target.value)
              setError('')
            }}
            placeholder={t('documents.rejection.reasonPlaceholder')}
            autoFocus
          />
          {error && <p className="text-xs font-bold text-rose-600 dark:text-rose-400 ml-1">{error}</p>}
        </div>

        {/* Warning Message */}
        <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-100 dark:border-amber-900/50 flex items-start gap-3">
          <div className="p-1.5 bg-amber-100 dark:bg-amber-900/50 rounded-lg text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-amber-700 dark:text-amber-400 pt-0.5 leading-relaxed">
            {t('documents.rejection.warning')}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-6 border-t border-gray-100 dark:border-gray-800 transition-colors">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleClose}
          >
            {t('common.actions.cancel')}
          </button>
          <button
            type="submit"
            className="px-6 py-2 text-sm font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 shadow-lg shadow-rose-600/20 border border-rose-500/10 flex items-center gap-2 transition-all"
          >
            <XCircle className="w-4 h-4" />
            {t('documents.rejection.confirm')}
          </button>
        </div>
      </form>
    </Modal>
  )
}

RejectDocumentModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  documentTitle: PropTypes.string.isRequired,
}


export default RejectDocumentModal
