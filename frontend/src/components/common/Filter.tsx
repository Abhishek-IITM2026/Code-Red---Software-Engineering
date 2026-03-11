import React, { useState } from 'react';
import { FiFilter, FiX, FiChevronDown } from 'react-icons/fi';
import Input from './Input';
import Select from './Select';
import Button from './Button';

export interface FilterOption {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'number' | 'range';
  placeholder?: string;
  options?: { value: string; label: string }[];
}

interface FilterProps {
  options: FilterOption[];
  onFilter: (filters: Record<string, any>) => void;
  onReset?: () => void;
}

const Filter: React.FC<FilterProps> = ({ options, onFilter, onReset }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    setActiveFilters(filters);
    onFilter(filters);
    setIsOpen(false);
  };

  const handleReset = () => {
    setFilters({});
    setActiveFilters({});
    onReset?.();
    onFilter({});
    setIsOpen(false);
  };

  const removeFilter = (key: string) => {
    const newActiveFilters = { ...activeFilters };
    delete newActiveFilters[key];
    setActiveFilters(newActiveFilters);
    onFilter(newActiveFilters);
  };

  const activeFilterCount = Object.keys(activeFilters).filter(k => activeFilters[k] !== '' && activeFilters[k] !== undefined).length;

  return (
    <div className="relative">
      {/* Filter Toggle Button */}
      <Button
        variant="secondary"
        icon={<FiFilter className="w-4 h-4" />}
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        Filter
        {activeFilterCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--primary)] text-white text-xs rounded-full flex items-center justify-center">
            {activeFilterCount}
          </span>
        )}
      </Button>

      {/* Filter Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Content */}
          <div className="absolute right-0 top-12 w-80 bg-[var(--card-bg)] rounded-xl shadow-xl border border-[var(--border)] z-50 overflow-hidden">
            <div className="p-4 border-b border-[var(--border)]">
              <h3 className="font-semibold text-[var(--text)]">Filter Options</h3>
            </div>
            
            <div className="p-4 space-y-4 max-h-80 overflow-y-auto">
              {options.map((option) => (
                <div key={option.key}>
                  {option.type === 'text' && (
                    <Input
                      label={option.label}
                      placeholder={option.placeholder}
                      value={filters[option.key] || ''}
                      onChange={(e) => handleFilterChange(option.key, e.target.value)}
                    />
                  )}
                  {option.type === 'number' && (
                    <Input
                      type="number"
                      label={option.label}
                      placeholder={option.placeholder}
                      value={filters[option.key] || ''}
                      onChange={(e) => handleFilterChange(option.key, e.target.value)}
                    />
                  )}
                  {option.type === 'select' && option.options && (
                    <Select
                      label={option.label}
                      options={option.options}
                      placeholder={option.placeholder || `Select ${option.label}`}
                      value={filters[option.key] || ''}
                      onChange={(e) => handleFilterChange(option.key, e.target.value)}
                    />
                  )}
                  {option.type === 'date' && (
                    <Input
                      type="date"
                      label={option.label}
                      value={filters[option.key] || ''}
                      onChange={(e) => handleFilterChange(option.key, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-[var(--border)] flex gap-2">
              <Button variant="ghost" size="small" onClick={handleReset}>
                Reset
              </Button>
              <Button variant="primary" size="small" onClick={handleApply} className="flex-1">
                Apply
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Active Filters Display */}
      {activeFilterCount > 0 && !isOpen && (
        <div className="flex flex-wrap gap-2 mt-2">
          {Object.entries(activeFilters).filter(([_, v]) => v !== '' && v !== undefined).map(([key, value]) => {
            const option = options.find(o => o.key === key);
            return (
              <span 
                key={key}
                className="inline-flex items-center gap-1 px-2 py-1 bg-[var(--secondary)] text-[var(--text)] text-sm rounded-lg"
              >
                {option?.label}: {value}
                <button 
                  onClick={() => removeFilter(key)}
                  className="p-0.5 hover:bg-[var(--secondary-hover)] rounded"
                >
                  <FiX className="w-3 h-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Filter;
