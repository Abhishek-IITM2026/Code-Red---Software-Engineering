import React, { useState, useMemo } from 'react';
import { FiChevronLeft, FiChevronRight, FiChevronUp, FiChevronDown, FiSearch } from 'react-icons/fi';
import Input from './Input';

export interface TableColumn<T> {
  key: string;
  title: string;
  dataIndex?: keyof T;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  filterable?: boolean;
  filterOptions?: { label: string; value: string }[];
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  emptyText?: string;
  rowKey?: keyof T;
  onRowClick?: (record: T) => void;
  pagination?: boolean;
  pageSize?: number;
  searchable?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  filterable?: boolean;
  onFilter?: (filters: Record<string, string>) => void;
}

function Table<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  emptyText = 'No data available',
  rowKey = 'id' as keyof T,
  onRowClick,
  pagination = true,
  pageSize = 10,
  searchable = false,
  searchPlaceholder = 'Search...',
  onSearch,
  filterable = false,
  onFilter
}: TableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});

  // Filter data based on search and filters
  const filteredData = useMemo(() => {
    let result = [...data];
    
    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((item) =>
        Object.values(item).some((value) =>
          String(value).toLowerCase().includes(query)
        )
      );
    }
    
    // Apply column filters
    if (Object.keys(filters).length > 0) {
      result = result.filter((item) => {
        return Object.entries(filters).every(([key, value]) => {
          if (!value) return true;
          return String(item[key]).toLowerCase() === value.toLowerCase();
        });
      });
    }
    
    return result;
  }, [data, searchQuery, filters]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize, pagination]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev?.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
    onSearch?.(value);
  };

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    setCurrentPage(1);
    onFilter?.(newFilters);
  };

  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  };

  // Get unique values for filter dropdown
  const getFilterOptions = (column: TableColumn<T>) => {
    if (!column.filterable) return [];
    const uniqueValues = [...new Set(data.map(item => String(item[column.key])))];
    return uniqueValues.map(value => ({ label: value, value }));
  };

  if (loading) {
    return (
      <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border)] overflow-hidden">
        <div className="p-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[var(--primary)] border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border)] overflow-hidden">
      {/* Search and Filter Bar */}
      {(searchable || filterable) && (
        <div className="p-4 border-b border-[var(--border)] flex flex-wrap gap-4 items-center">
          {searchable && (
            <div className="w-64">
              <Input
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                icon={<FiSearch className="w-4 h-4" />}
                iconPosition="left"
              />
            </div>
          )}
          {filterable && columns.filter(col => col.filterable).map(column => (
            <div key={column.key} className="w-40">
              <select
                value={filters[column.key] || ''}
                onChange={(e) => handleFilterChange(column.key, e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--input-bg)] text-[var(--text)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              >
                <option value="">All {column.title}</option>
                {getFilterOptions(column).map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-[var(--secondary)]">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`
                    px-6 py-4 text-sm font-semibold text-[var(--text)]
                    ${alignClasses[column.align || 'left']}
                    ${column.sortable ? 'cursor-pointer hover:bg-[var(--secondary-hover)]' : ''}
                  `}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    <span>{column.title}</span>
                    {column.sortable && (
                      <span className="text-[var(--text-secondary)]">
                        {sortConfig?.key === column.key ? (
                          sortConfig.direction === 'asc' ? (
                            <FiChevronUp className="w-4 h-4" />
                          ) : (
                            <FiChevronDown className="w-4 h-4" />
                          )
                        ) : (
                          <FiChevronUp className="w-4 h-4 opacity-30" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-[var(--text-secondary)]">
                  {emptyText}
                </td>
              </tr>
            ) : (
              paginatedData.map((record, index) => (
                <tr
                  key={String(record[rowKey])}
                  className={`
                    hover:bg-[var(--secondary)] transition-colors
                    ${onRowClick ? 'cursor-pointer' : ''}
                  `}
                  onClick={() => onRowClick?.(record)}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`
                        px-6 py-4 text-sm text-[var(--text)]
                        ${alignClasses[column.align || 'left']}
                      `}
                    >
                      {column.render
                        ? column.render(record[column.dataIndex || column.key], record, index)
                        : record[column.dataIndex || column.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border)]">
          <div className="text-sm text-[var(--text-secondary)]">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} entries
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-[var(--border)] hover:bg-[var(--secondary)] disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <FiChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`
                  w-10 h-10 rounded-lg text-sm font-medium transition
                  ${currentPage === page
                    ? 'bg-[var(--primary)] text-white'
                    : 'hover:bg-[var(--secondary)] text-[var(--text)]'
                  }
                `}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-[var(--border)] hover:bg-[var(--secondary)] disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <FiChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Table;
