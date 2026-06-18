import React, { useState, useEffect } from 'react';
import styles from './SearchFilter.module.css';
import { Search, Filter, X } from 'lucide-react';
import useDebounce from '../../hooks/useDebounce';

export default function SearchFilter({ 
  placeholder = "Search...", 
  onSearch, 
  filters = [], 
  onFilterChange,
  activeFilters = {}
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    onSearch(debouncedSearchTerm);
  }, [debouncedSearchTerm, onSearch]);

  const clearSearch = () => {
    setSearchTerm('');
  };

  return (
    <div className={styles.container}>
      <div className={styles.searchWrapper}>
        <Search className={styles.searchIcon} size={18} />
        <input 
          type="text" 
          className={styles.searchInput} 
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button className={styles.clearBtn} onClick={clearSearch}>
            <X size={16} />
          </button>
        )}
      </div>

      {filters.length > 0 && (
        <div className={styles.filtersWrapper}>
          <div className={styles.filterIcon}>
            <Filter size={18} />
          </div>
          {filters.map((filter, index) => (
            <select 
              key={index}
              className={styles.filterSelect}
              value={activeFilters[filter.key] || ''}
              onChange={(e) => onFilterChange(filter.key, e.target.value)}
            >
              <option value="">{filter.label}</option>
              {filter.options.map((opt, i) => (
                <option key={i} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          ))}
        </div>
      )}
    </div>
  );
}
