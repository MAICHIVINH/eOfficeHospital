import * as XLSX from 'xlsx'
import { formatDate, formatDocumentType, formatSecurityLevel } from './formatters'

/**
 * Export documents to Excel with beautiful formatting
 * @param {Array} documents - Array of document objects
 * @param {Object} filters - Applied filters (search, type, securityLevel)
 * @param {Object} translations - i18n translation object
 */
export const exportDocumentsToExcel = (documents, filters = {}, translations) => {
    const t = translations

    // Create workbook
    const wb = XLSX.utils.book_new()

    // Prepare header information
    const exportDate = new Date().toLocaleString('vi-VN')
    const totalRecords = documents.length

    // Build filter summary
    let filterSummary = []
    if (filters.search) filterSummary.push(`${t('common.actions.search')}: ${filters.search}`)
    if (filters.documentType) filterSummary.push(`${t('documents.documentType')}: ${formatDocumentType(filters.documentType)}`)
    if (filters.securityLevel) filterSummary.push(`${t('documents.securityLevel')}: ${formatSecurityLevel(filters.securityLevel)}`)

    // Prepare data for Excel
    const excelData = []

    // Title row
    excelData.push([t('documents.exportTitle')])
    excelData.push([]) // Empty row

    // Metadata
    excelData.push([t('documents.exportDate'), exportDate])
    excelData.push([t('documents.exportTotalRecords'), totalRecords])
    if (filterSummary.length > 0) {
        excelData.push([t('documents.exportFilters'), filterSummary.join(' | ')])
    }
    excelData.push([]) // Empty row

    // Column headers
    const headers = [
        t('common.labels.no'),
        t('documents.documentName'),
        t('documents.documentType'),
        t('documents.securityLevel'),
        t('common.labels.createdBy'),
        t('common.labels.createdAt'),
        t('common.labels.description')
    ]
    excelData.push(headers)

    // Data rows
    documents.forEach((doc, index) => {
        excelData.push([
            index + 1,
            doc.name || doc.title || 'N/A',
            doc.documentTypeCode || formatDocumentType(doc.documentType),
            formatSecurityLevel(doc.securityLevel),
            doc.createdByName || 'N/A',
            formatDate(doc.createdAt),
            doc.description || ''
        ])
    })

    // Convert to worksheet
    const ws = XLSX.utils.aoa_to_sheet(excelData)

    // Set column widths
    const colWidths = [
        { wch: 5 },  // No
        { wch: 40 }, // Document Name
        { wch: 20 }, // Document Type
        { wch: 15 }, // Security Level
        { wch: 25 }, // Created By
        { wch: 20 }, // Created At
        { wch: 50 }  // Description
    ]
    ws['!cols'] = colWidths

    // Merge cells for title
    ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } } // Merge title row
    ]

    // Apply styles (note: basic XLSX doesn't support full styling, but we set up the structure)
    // For better styling, you would need xlsx-style or similar libraries
    // Here we're setting up the data structure optimally

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, t('documents.title'))

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `${t('documents.exportFilename')}_${timestamp}.xlsx`

    // Write file
    XLSX.writeFile(wb, filename)

    return filename
}

/**
 * Export documents to Excel with advanced styling
 * @param {Array} documents - Array of document objects
 * @param {Object} filters - Applied filters
 * @param {Object} translations - i18n translation object
 * @param {String} category - 'Incoming' or 'Outgoing'
 */
export const exportDocumentsToExcelStyled = (documents, filters = {}, translations, category = 'Incoming') => {
    const t = translations

    // Create workbook
    const wb = XLSX.utils.book_new()

    // Prepare data
    const exportDate = new Date().toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    })
    const totalRecords = documents.length

    // Build filter summary
    let filterSummary = []
    if (filters.search) filterSummary.push(`${t('common.actions.search')}: ${filters.search}`)
    if (filters.documentType) filterSummary.push(`${t('documents.documentType')}: ${formatDocumentType(filters.documentType)}`)
    if (filters.securityLevel) filterSummary.push(`${t('documents.securityLevel')}: ${formatSecurityLevel(filters.securityLevel)}`)
    if (filters.status) filterSummary.push(`${t('common.labels.status')}: ${filters.status}`)

    const excelData = []

    // Company header
    excelData.push([t('documents.exportCompanyName')])

    // Dynamic report title
    const reportTitle = category === 'Outgoing'
        ? t('documents.exportReportTitleOutgoing') || 'BÁO CÁO DANH SÁCH VĂN BẢN ĐI'
        : t('documents.exportReportTitle') || 'BÁO CÁO DANH SÁCH VĂN BẢN ĐẾN'
    excelData.push([reportTitle])
    excelData.push([]) // Empty row

    // Metadata section
    excelData.push([t('documents.exportDate') + ':', exportDate])
    excelData.push([t('documents.exportTotalRecords') + ':', totalRecords])
    if (filterSummary.length > 0) {
        excelData.push([t('documents.exportFilters') + ':', filterSummary.join(' | ')])
    }
    excelData.push([]) // Empty row

    // Column headers
    const headers = [
        t('common.labels.no'),
        t('documents.documentName'),
        t('outgoingWorkflow.documentNumber') || 'Số văn bản',
        t('documents.documentType'),
        t('documents.securityLevel'),
        t('common.labels.createdBy'),
        t('documents.uploadDate') || t('common.labels.createdAt'),
        t('common.labels.description')
    ]
    excelData.push(headers)

    // Data rows
    documents.forEach((doc, index) => {
        excelData.push([
            index + 1,
            doc.name || doc.title || 'N/A',
            doc.documentNumber || 'N/A',
            doc.documentTypeCode || formatDocumentType(doc.documentType),
            formatSecurityLevel(doc.securityLevel),
            doc.createdByName || 'N/A',
            formatDate(doc.createdAt),
            doc.description || ''
        ])
    })

    // Convert to worksheet
    const ws = XLSX.utils.aoa_to_sheet(excelData)

    // Set column widths for better readability
    ws['!cols'] = [
        { wch: 6 },  // No
        { wch: 45 }, // Document Name
        { wch: 20 }, // Document Number
        { wch: 22 }, // Document Type
        { wch: 18 }, // Security Level
        { wch: 28 }, // Created By
        { wch: 22 }, // Created At
        { wch: 55 }  // Description
    ]

    // Merge cells for headers
    ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }, // Company name
        { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } }  // Report title
    ]

    const sheetName = category === 'Outgoing' ? 'Van Ban Di' : 'Van Ban Den'
    XLSX.utils.book_append_sheet(wb, ws, sheetName)

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]
    const filenamePrefix = category === 'Outgoing' ? 'BaoCao_VanBanDi' : 'BaoCao_VanBanDen'
    const filename = `${filenamePrefix}_${timestamp}.xlsx`

    // Write and download file
    XLSX.writeFile(wb, filename)

    return filename
}

/**
 * Export documents to Registry Book format (Vietnamese Standard)
 * @param {Array} documents - Array of document objects
 * @param {String} category - 'Incoming' or 'Outgoing'
 * @param {Object} translations - i18n translation object
 */
export const exportToRegistryBook = (documents, category = 'Incoming', translations) => {
    const t = translations
    const wb = XLSX.utils.book_new()
    const excelData = []

    // Section 1: Formal Header (Hospital Name & Motto)
    // We add the Hospital name on the left and the National Motto on the right
    if (category === 'Incoming') {
        excelData.push([t('documents.exportCompanyName').toUpperCase(), '', '', '', '', '', t('documents.nationalMotto').toUpperCase()])
        excelData.push(['Số: ......../Sổ-VT', '', '', '', '', '', t('documents.nationalSlogan')])
    } else {
        excelData.push([t('documents.exportCompanyName').toUpperCase(), '', '', '', '', t('documents.nationalMotto').toUpperCase()])
        excelData.push(['Số: ......../Sổ-VT', '', '', '', '', t('documents.nationalSlogan')])
    }
    excelData.push([]) // Spacing row

    // Section 2: Main Title
    const reportTitle = category === 'Outgoing'
        ? 'SỔ ĐĂNG KÝ VĂN BẢN ĐI'
        : 'SỔ ĐĂNG KÝ VĂN BẢN ĐẾN'
    
    // Add some empty space for centering title in the worksheet
    const titlePadding = category === 'Incoming' ? ['', '', '', reportTitle] : ['', '', '', reportTitle]
    excelData.push(titlePadding)
    excelData.push(['', '', '', 'Năm: ' + new Date().getFullYear()])
    excelData.push([]) // Spacing before table

    if (category === 'Incoming') {
        // Headers for Incoming Registry Book (Vietnamese Standard)
        const headers = [
            'STT',
            'Số đến',
            'Ngày đến',
            'Tên văn bản',
            'Đơn vị/Người nhận',
            'Hạn xử lý',
            'Ghi chú'
        ]
        excelData.push(headers)

        // Data rows
        documents.forEach((doc, index) => {
            excelData.push([
                index + 1,
                doc.documentNumber || '', // Arrival number
                formatDate(doc.createdAt),
                doc.title || doc.description,
                doc.assignments?.map(a => a.departmentName || a.assignedToName).join(', ') || 'Văn phòng',
                formatDate(doc.processingDeadline) || '',
                ''
            ])
        })

        // Footer for signatures
        excelData.push([])
        excelData.push(['', '', t('documents.clerkSignature'), '', '', t('documents.directorSignature')])
        excelData.push(['', '', '(Ký, họ tên)', '', '', '(Ký, đóng dấu)'])
    } else {
        // Headers for Outgoing Registry Book (Vietnamese Standard)
        const headers = [
            'STT',
            'Số đi',
            'Ngày ban hành',
            'Số, ký hiệu',
            'Tên loại và trích yếu',
            'Người ký',
            'Nơi nhận',
            'Đơn vị soạn thảo',
            'Ghi chú'
        ]
        excelData.push(headers)

        // Data rows
        documents.forEach((doc, index) => {
            excelData.push([
                index + 1,
                doc.documentNumber || '',
                formatDate(doc.issuedAt || doc.createdAt),
                doc.documentNumber || '',
                `${doc.documentTypeCode || formatDocumentType(doc.documentType)}: ${doc.title}`,
                doc.signedByName || '',
                doc.recipients || 'Nội bộ',
                doc.departmentName || 'Hành chính',
                ''
            ])
        })

        // Footer for signatures
        excelData.push([])
        excelData.push(['', '', t('documents.clerkSignature'), '', '', '', t('documents.directorSignature')])
        excelData.push(['', '', '(Ký, họ tên)', '', '', '', '(Ký, đóng dấu)'])
    }

    const ws = XLSX.utils.aoa_to_sheet(excelData)

    // Column sizing and merging
    if (category === 'Incoming') {
        ws['!cols'] = [
            { wch: 6 },  // STT
            { wch: 12 }, // Số đến
            { wch: 15 }, // Ngày đến
            { wch: 60 }, // Tên văn bản
            { wch: 30 }, // Đơn vị nhận
            { wch: 15 }, // Hạn xử lý
            { wch: 15 }  // Ghi chú
        ]
        ws['!merges'] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }, // Hospital name
            { s: { r: 0, c: 4 }, e: { r: 0, c: 6 } }, // Motto
            { s: { r: 1, c: 4 }, e: { r: 1, c: 6 } }, // Slogan
            { s: { r: 3, c: 2 }, e: { r: 3, c: 4 } }, // Title
            { s: { r: 4, c: 2 }, e: { r: 4, c: 4 } }  // Year
        ]
    } else {
        ws['!cols'] = [
            { wch: 6 },  // STT
            { wch: 10 }, // Số đi
            { wch: 15 }, // Ngày ban hành
            { wch: 18 }, // Số, ký hiệu
            { wch: 65 }, // Trích yếu
            { wch: 25 }, // Người ký
            { wch: 30 }, // Nơi nhận
            { wch: 25 }, // Đơn vị soạn
            { wch: 15 }  // Ghi chú
        ]
        ws['!merges'] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }, // Hospital name
            { s: { r: 0, c: 5 }, e: { r: 0, c: 8 } }, // Motto
            { s: { r: 1, c: 5 }, e: { r: 1, c: 8 } }, // Slogan
            { s: { r: 3, c: 3 }, e: { r: 3, c: 5 } }, // Title
            { s: { r: 4, c: 3 }, e: { r: 4, c: 5 } }  // Year
        ]
    }

    const sheetName = category === 'Outgoing' ? 'So Van Ban Di' : 'So Van Ban Den'
    XLSX.utils.book_append_sheet(wb, ws, sheetName)

    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `${category === 'Outgoing' ? 'So_VanBanDi' : 'So_VanBanDen'}_${timestamp}.xlsx`
    XLSX.writeFile(wb, filename)

    return filename
}
