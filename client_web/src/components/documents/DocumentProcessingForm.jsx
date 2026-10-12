import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * DocumentProcessingForm - A printable A5 component for "Phiếu xử lý công văn đến"
 * @param {Object} props
 * @param {Object} props.document - Document data
 */
const DocumentProcessingForm = React.forwardRef(({ document }, ref) => {
    const { t } = useTranslation();
    const today = new Date();
    const day = today.getDate().toString().padStart(2, '0');
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const year = today.getFullYear();

    if (!document) return null;

    return (
        <div 
            ref={ref} 
            className="print-container bg-white text-black p-8 mx-auto shadow-sm border border-gray-100"
            style={{ 
                width: '210mm', 
                minHeight: '148mm', 
                fontFamily: "'Times New Roman', Times, serif",
                boxSizing: 'border-box'
            }}
        >
            {/* Header section */}
            <div className="flex justify-between items-start mb-6">
                <div className="text-center w-5/12">
                    <h2 className="text-[16px] font-bold uppercase">CÔNG TY CP BỆNH VIỆN ĐA KHOA</h2>
                    <h2 className="text-[16px] font-bold uppercase underline decoration-1 underline-offset-4">TÂM TRÍ CAO LÃNH</h2>
                </div>
                <div className="text-center w-6/12">
                    <h2 className="text-[16px] font-bold uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h2>
                    <h2 className="text-[16px] font-bold underline decoration-1 underline-offset-4">Độc lập - Tự do - Hạnh phúc</h2>
                    <p className="text-[16px] mt-3">P. Cao Lãnh, ngày {day} tháng {month} năm {year}</p>
                </div>
            </div>

            {/* Title */}
            <div className="text-center mb-6 mt-6">
                <h1 className="text-xl font-bold uppercase">PHIẾU XỬ LÝ CÔNG VĂN ĐẾN</h1>
            </div>

            {/* Content fields */}
            <div className="space-y-2 text-[18px] leading-relaxed">
                <div>
                    <span className="font-bold">* Số Công văn:</span>
                    <span className="ml-2">
                        {document.documentNumber || '....................................................................................................'}
                    </span>
                </div>

                <div className="break-words">
                    <span className="font-bold">* Tóm tắt nội dung chính:</span>
                    <span className="ml-2">
                        {document.title || '....................................................................................................'}
                    </span>
                </div>

                <div className="space-y-2">
                    <span className="font-bold">* Ý kiến chỉ đạo của Giám đốc:</span>
                    <div className="mt-2 min-h-[150px] relative">
                        {document.processingInstructions ? (
                            <div className="whitespace-pre-wrap pl-4 italic">
                                {document.processingInstructions || '....................................................................................................'}
                            </div>
                        ) : (
                            <div className="space-y-6 pt-2">
                                <div className="border-b border-dotted border-black w-full h-4"></div>
                                <div className="border-b border-dotted border-black w-full h-4"></div>
                                <div className="border-b border-dotted border-black w-full h-4"></div>
                                <div className="border-b border-dotted border-black w-full h-4"></div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Print styles */}
            <style>{`
                @media print {
                    @page {
                        size: A5 landscape;
                        margin: 0;
                    }
                    body * {
                        visibility: hidden;
                    }
                    .print-container, .print-container * {
                        visibility: visible;
                    }
                    .print-container {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        height: 100% !important;
                        margin: 0 !important;
                        padding: 15mm !important;
                        box-sizing: border-box !important;
                        box-shadow: none !important;
                        overflow: hidden !important;
                        display: flex !important;
                        flex-direction: column !important;
                        justify-content: center !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
});

DocumentProcessingForm.displayName = 'DocumentProcessingForm';

export default DocumentProcessingForm;
