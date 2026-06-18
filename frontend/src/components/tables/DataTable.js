import React from 'react';
import styles from './DataTable.module.css';
import EmptyState from '../layout/EmptyState';
import { Search, ChevronLeft, ChevronRight, FileX } from 'lucide-react';

export default function DataTable({ 
  columns, 
  data, 
  isLoading, 
  onRowClick, 
  pagination, 
  onPageChange,
  emptyTitle = 'No data found',
  emptyDescription = 'There is no data to display here.',
  emptyAction
}) {
  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading data...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <EmptyState icon={FileX} title={emptyTitle} description={emptyDescription} action={emptyAction} />;
  }

  return (
    <div className={styles.tableWrapper}>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map((col, index) => (
                <th key={index} style={{ width: col.width || 'auto' }}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr 
                key={row.id || rowIndex} 
                onClick={() => onRowClick && onRowClick(row)}
                className={onRowClick ? styles.clickableRow : ''}
              >
                {columns.map((col, colIndex) => (
                  <td key={colIndex}>
                    {col.render ? col.render(row) : row[col.accessor]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className={styles.paginationContainer}>
          <div className={styles.paginationInfo}>
            Showing <span>{(pagination.currentPage - 1) * pagination.perPage + 1}</span> to 
            <span>{Math.min(pagination.currentPage * pagination.perPage, pagination.totalItems)}</span> of 
            <span>{pagination.totalItems}</span> entries
          </div>
          <div className={styles.paginationControls}>
            <button 
              className={styles.pageBtn}
              disabled={!pagination.hasPrev}
              onClick={() => onPageChange(pagination.currentPage - 1)}
            >
              <ChevronLeft size={16} />
            </button>
            <div className={styles.pageNumbers}>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(pageNum => {
                
                if (
                  pageNum === 1 || 
                  pageNum === pagination.totalPages || 
                  (pageNum >= pagination.currentPage - 1 && pageNum <= pagination.currentPage + 1)
                ) {
                  return (
                    <button 
                      key={pageNum}
                      className={`${styles.pageNumber} ${pageNum === pagination.currentPage ? styles.activePage : ''}`}
                      onClick={() => onPageChange(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                } else if (
                  pageNum === pagination.currentPage - 2 || 
                  pageNum === pagination.currentPage + 2
                ) {
                  return <span key={pageNum} className={styles.ellipsis}>...</span>;
                }
                return null;
              })}
            </div>
            <button 
              className={styles.pageBtn}
              disabled={!pagination.hasNext}
              onClick={() => onPageChange(pagination.currentPage + 1)}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
