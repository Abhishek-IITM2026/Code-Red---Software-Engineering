import React, { useState, useCallback } from 'react';
import { FiSearch, FiX, FiFilter, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import Input from './Input';
import Select, { type SelectOption } from './Select';


interface SearchField {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'number' | 'daterange';
  placeholder?: string;
  options?: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
}

interface SearchConfig {
  fields: SearchField[];
  placeholder?: string;
  onSearch: (values: Record<string, string>) => void;
  showAdvancedToggle?: boolean;
  defaultActiveFields?: string[];
}

interface SearchProps {
  config: SearchConfig;
  onClear?: () => void;
  className?: string;
  variant?: 'default' | 'minimal';
}

const Search: React.FC<SearchProps> = ({
  config,
  onClear,
  className = '',
  variant = 'default'
}) => {
  const [searchValues, setSearchValues] = useState<Record<string, string>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeFields, setActiveFields] = useState<string[]>(
    config.defaultActiveFields || []
  );

  const mainField = config.fields[0];
  const advancedFields = config.fields.slice(1);

  const handleSearchChange = useCallback((key: string, value: string) => {
    const newValues = { ...searchValues, [key]: value };
    setSearchValues(newValues);
    config.onSearch(newValues);
  }, [searchValues, config]);

  const handleClear = useCallback(() => {
    setSearchValues({});
    setActiveFields(config.defaultActiveFields || []);
    onClear?.();
    config.onSearch({});
  }, [config, onClear]);

  const toggleAdvancedField = (fieldKey: string) => {
    setActiveFields(prev => 
      prev.includes(fieldKey)
        ? prev.filter(k => k !== fieldKey)
        : [...prev, fieldKey]
    );
  };

  const hasActiveSearch = Object.values(searchValues).some(v => v && v.trim() !== '');

  if (variant === 'minimal') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="relative flex-1">
          <Input
            type={mainField.type}
            placeholder={config.placeholder || `Search ${mainField.label}...`}
            value={searchValues[mainField.key] || ''}
            onChange={(e) => handleSearchChange(mainField.key, e.target.value)}
            icon={<FiSearch className="w-4 h-4" />}
            iconPosition="left"
          />
          {hasActiveSearch && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-[var(--secondary)] rounded"
            >
              <FiX className="w-3 h-3 text-[var(--text-secondary)]" />
            </button>
          )}
        </div>
        {config.showAdvancedToggle && advancedFields.length > 0 && (
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`p-2 rounded-lg border border-[var(--border)] hover:bg-[var(--secondary)] transition ${
              showAdvanced ? 'bg-[var(--primary)] text-white' : ''
            }`}
          >
            <FiFilter className="w-4 h-4" />
          </button>
        )}
        {showAdvanced && (
          <div className="absolute top-full right-0 mt-2 w-[min(20rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] p-4 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl shadow-lg z-10">
            <div className="space-y-3">
              {advancedFields.map(field => (
                <div key={field.key}>
                  {field.type === 'select' ? (
                    <Select
                      label={field.label}
                      options={field.options || []}
                      value={searchValues[field.key] || ''}
                      onChange={(e) => handleSearchChange(field.key, e.target.value)}
                      placeholder={field.placeholder || `Select ${field.label}`}
                    />
                  ) : (
                    <Input
                      type={field.type}
                      label={field.label}
                      placeholder={field.placeholder}
                      value={searchValues[field.key] || ''}
                      onChange={(e) => handleSearchChange(field.key, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Input
            type={mainField.type}
            placeholder={config.placeholder || `Search by ${mainField.label.toLowerCase()}...`}
            value={searchValues[mainField.key] || ''}
            onChange={(e) => handleSearchChange(mainField.key, e.target.value)}
            icon={<FiSearch className="w-4 h-4" />}
            iconPosition="left"
          />
          {hasActiveSearch && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-[var(--secondary)] rounded"
            >
              <FiX className="w-3 h-3 text-[var(--text-secondary)]" />
            </button>
          )}
        </div>
        
        {config.showAdvancedToggle && advancedFields.length > 0 && (
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition ${
              showAdvanced 
                ? 'bg-[var(--primary)] text-white border-[var(--primary)]' 
                : 'bg-[var(--card-bg)] text-[var(--text)] border-[var(--border)] hover:bg-[var(--secondary)]'
            }`}
          >
            <FiFilter className="w-4 h-4" />
            <span className="text-sm font-medium">Filters</span>
            {showAdvanced ? (
              <FiChevronUp className="w-4 h-4" />
            ) : (
              <FiChevronDown className="w-4 h-4" />
            )}
          </button>
        )}

        {hasActiveSearch && (
          <button
            onClick={handleClear}
            className="px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text)] transition"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Active Filter Tags */}
      {activeFields.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {config.fields.slice(1).map(field => {
            const isActive = activeFields.includes(field.key);
            return (
              <button
                key={field.key}
                onClick={() => toggleAdvancedField(field.key)}
                className={`px-3 py-1.5 text-sm rounded-full border transition ${
                  isActive
                    ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                    : 'bg-[var(--card-bg)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--primary)]'
                }`}
              >
                {field.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Advanced Filters Panel */}
      {showAdvanced && advancedFields.length > 0 && (
        <div className="p-4 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {advancedFields.map(field => (
              <div key={field.key}>
                {field.type === 'select' ? (
                  <Select
                    label={field.label}
                    options={field.options || []}
                    value={searchValues[field.key] || ''}
                    onChange={(e) => handleSearchChange(field.key, e.target.value)}
                    placeholder={field.placeholder || `Select ${field.label}`}
                  />
                ) : (
                  <Input
                    type={field.type}
                    label={field.label}
                    placeholder={field.placeholder}
                    value={searchValues[field.key] || ''}
                    onChange={(e) => handleSearchChange(field.key, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Search;
export type { SearchProps, SearchField, SearchConfig };
