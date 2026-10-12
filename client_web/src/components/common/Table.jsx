import { useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule, themeQuartz } from 'ag-grid-community';
import Pagination from './Pagination';

ModuleRegistry.registerModules([AllCommunityModule]);

/**
 * Common Table component using AgGridReact
 * Designed to match the premium aesthetic of the application
 */
const Table = ({ 
    rowData = [], 
    columnDefs, 
    // onRowClicked,
    height = 'auto',
    domLayout = 'autoHeight',
    className = "",
    pagination = false,
    currentPage,
    totalPages,
    pageSize,
    onPageChange,
    onPageSizeChange,
    pageSizeOptions
}) => {
    const defaultColDef = useMemo(() => ({
        sortable: true,
        filter: true,
        resizable: true,
        flex: 1,
        minWidth: 100,
        headerClass: 'ag-grid-header-custom',
        cellClass: 'ag-grid-cell-custom',
    }), []);

    const gridStyle = useMemo(() => ({
        width: '100%',
        minHeight: height === 'auto' ? '400px' : height,
    }), [height]);

    return (
        <div className={`w-full custom-table-container ${className}`}>
            <div className="ag-theme-quartz w-full custom-ag-grid" style={gridStyle}>
                <AgGridReact
                    rowData={rowData}
                    columnDefs={columnDefs}
                    defaultColDef={defaultColDef}
                    // onRowClicked={onRowClicked}
                    suppressCellFocus={true}
                    animateRows={true}
                    rowHeight={72}
                    headerHeight={56}
                    theme={themeQuartz}
                    domLayout={domLayout}
                    pagination={false}
                />
            </div>
            
            {pagination && (
                <div className="custom-pagination-wrapper">
                    <Pagination 
                        currentPage={currentPage}
                        totalPages={totalPages}
                        pageSize={pageSize}
                        onPageChange={onPageChange}
                        onPageSizeChange={onPageSizeChange}
                        pageSizeOptions={pageSizeOptions}
                    />
                </div>
            )}
            
            <style dangerouslySetInnerHTML={{ __html: `
                .custom-table-container {
                    display: flex;
                    flex-direction: column;
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 4px 20px -5px rgba(0, 0, 0, 0.05);
                    border: 1px solid #f3f4f6;
                }
                .dark .custom-table-container {
                    border: 1px solid #1f2937;
                    box-shadow: 0 4px 20px -5px rgba(0, 0, 0, 0.3);
                }

                .custom-ag-grid .ag-root-wrapper {
                    border: none !important;
                    background: transparent !important;
                }

                .custom-ag-grid .ag-header {
                    background: linear-gradient(to right, #f9fafb, rgba(243, 244, 246, 0.5)) !important;
                    border-bottom: 1px solid #e5e7eb !important;
                }
                .dark .custom-ag-grid .ag-header {
                    background: linear-gradient(to right, rgba(31, 41, 55, 0.5), rgba(31, 41, 55, 0.3)) !important;
                    border-bottom: 1px solid #374151 !important;
                }
                .custom-ag-grid .ag-header-cell-text {
                    font-size: 11px !important;
                    font-weight: 900 !important;
                    color: #4b5563 !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.05em !important;
                }
                .dark .custom-ag-grid .ag-header-cell-text {
                    color: #9ca3af !important;
                }

                .custom-ag-grid .ag-header-cell.text-center .ag-header-cell-label {
                    justify-content: center !important;
                }

                .custom-ag-grid .ag-row {
                    background-color: #ffffff !important;
                    border-bottom: 1px solid #f3f4f6 !important;
                    transition: all 0.3s !important;
                }
                .dark .custom-ag-grid .ag-row {
                    background-color: #111827 !important;
                    border-bottom: 1px solid rgba(31, 41, 55, 0.2) !important;
                }
                .custom-ag-grid .ag-row:hover {
                    background: linear-gradient(to right, rgba(var(--primary-rgb), 0.05), transparent) !important;
                }
                .dark .custom-ag-grid .ag-row:hover {
                    background: linear-gradient(to right, rgba(var(--primary-rgb), 0.1), transparent) !important;
                }

                .custom-ag-grid .ag-cell {
                    display: flex !important;
                    align-items: center !important;
                    border: none !important;
                }

                /* Custom Scrollbar Styling */
                .custom-ag-grid ::-webkit-scrollbar {
                    width: 6px !important;
                    height: 6px !important;
                }
                .custom-ag-grid ::-webkit-scrollbar-track {
                    background: transparent !important;
                }
                .custom-ag-grid ::-webkit-scrollbar-thumb {
                    background: #e5e7eb !important;
                    border-radius: 10px !important;
                }
                .dark .custom-ag-grid ::-webkit-scrollbar-thumb {
                    background: #374151 !important;
                }
                
                .custom-pagination-wrapper {
                    border-top: 1px solid #f3f4f6;
                }
                .dark .custom-pagination-wrapper {
                    border-top: 1px solid #1f2937;
                }
            `}} />
        </div>
    );
};

export default Table;
