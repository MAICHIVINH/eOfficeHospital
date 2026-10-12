import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useReactToPrint } from 'react-to-print';
import { Printer, X, Eye } from 'lucide-react';
import Modal from '../common/Modal';
import DocumentProcessingForm from './DocumentProcessingForm';

/**
 * DocumentProcessingPreviewModal - Preview and Print the Form
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal open state
 * @param {Function} props.onClose - Close callback
 * @param {Object} props.document - Document data
 */
const DocumentProcessingPreviewModal = ({ isOpen, onClose, document }) => {
    const { t } = useTranslation();
    const componentRef = useRef();

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Phieu_Xu_Ly_${document?.documentNumber || document?.id}`,
        pageStyle: "@page { size: A5 landscape; margin: 10mm; }",
    });

    if (!document) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('documents.viewProcessingInstructions') || 'Xem chỉ đạo xử lý công văn đến'}
            maxWidth="max-w-4xl"
        >
            <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 transition-colors">
                {/* Fixed controls bar */}
                <div className="flex items-center justify-between p-3 sm:p-4 bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800 transition-colors">
                    <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-primary-500 shrink-0" />
                        <span className="text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 truncate">
                            {t('common.labels.preview') || 'Xem trước bản in'}
                        </span>
                    </div>
                    <div className="flex gap-2 shrink-0">
                        <button
                            onClick={onClose}
                            className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition-all"
                        >
                            <span className="hidden xs:inline">{t('common.actions.close') || 'Đóng'}</span>
                            <X className="w-4 h-4 xs:hidden" />
                        </button>
                        <button
                            onClick={handlePrint}
                            className="bg-primary-600 hover:bg-primary-700 text-white px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-bold shadow-lg shadow-primary-500/30 flex items-center gap-1.5 sm:gap-2 transition-all"
                        >
                            <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span>{t('common.actions.print') || 'In phiếu'}</span>
                        </button>
                    </div>
                </div>

                {/* Preview content */}
                <div className="p-2 sm:p-4 md:p-8 overflow-auto max-h-[60vh] sm:max-h-[70vh] flex justify-center bg-gray-200/50 dark:bg-gray-950/50 custom-scrollbar">
                    <div className="bg-white shadow-2xl rounded-sm scale-[0.45] xs:scale-[0.55] sm:scale-[0.75] md:scale-90 lg:scale-100 origin-top transform-gpu my-4 sm:my-8">
                        <DocumentProcessingForm 
                            document={document} 
                            ref={componentRef} 
                        />
                    </div>
                </div>
            </div>
            
            <div className="mt-4 p-2.5 sm:p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg flex items-start sm:items-center gap-2.5 sm:gap-3 text-[10px] sm:text-xs text-blue-800 dark:text-blue-300 transition-colors">
                <div className="p-1 sm:p-1.5 bg-blue-100 dark:bg-blue-800 rounded-full shrink-0 mt-0.5 sm:mt-0">
                    <Printer className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                </div>
                <p className="leading-normal">{t('documents.printFormTip') || 'Mẹo: Khi cửa sổ in hiện ra, hãy chọn khổ giấy A5 và hướng ngang (Landscape) để có kết quả tốt nhất.'}</p>
            </div>
        </Modal>
    );
};

export default DocumentProcessingPreviewModal;
