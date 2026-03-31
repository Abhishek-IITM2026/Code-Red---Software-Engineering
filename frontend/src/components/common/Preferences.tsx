import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiSettings, FiX, FiCheck, FiMoon, FiSun, FiMonitor, FiBox, FiSquare, FiLayers } from 'react-icons/fi';
import type { RootState, AppDispatch } from '../../app/store';
import { 
  setTheme, 
  setFontSize,
  setCardRadius,
  setButtonRadius,
  setInputRadius,
  setContainerPadding,
  setShadowIntensity,
  setCardBg
} from '../../theme/themeSlice';
import type { ThemeType } from '../../theme/themes';
import { 
  themeLabels, 
  fontSizeOptions,
  borderRadiusOptions,
  containerPaddingOptions,
  shadowIntensityOptions,
  cardBgOptions
} from '../../theme/themes';

interface PreferencesProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'theme' | 'fontSize' | 'appearance';

const Preferences: React.FC<PreferencesProps> = ({ isOpen, onClose }) => {
  const dispatch = useDispatch<AppDispatch>();
  const currentTheme = useSelector((state: RootState) => state.theme.theme);
  const currentFontSize = useSelector((state: RootState) => state.theme.fontSize);
  
  // UI Customization states
  const cardRadius = useSelector((state: RootState) => state.theme.cardRadius);
  const buttonRadius = useSelector((state: RootState) => state.theme.buttonRadius);
  const inputRadius = useSelector((state: RootState) => state.theme.inputRadius);
  const containerPadding = useSelector((state: RootState) => state.theme.containerPadding);
  const shadowIntensity = useSelector((state: RootState) => state.theme.shadowIntensity);
  const cardBg = useSelector((state: RootState) => state.theme.cardBg);
  
  const [activeTab, setActiveTab] = useState<TabType>('theme');

  if (!isOpen) return null;

  const themeIcons: Record<ThemeType, React.ReactNode> = {
    light: <FiSun className="w-5 h-5" />,
    dark: <FiMoon className="w-5 h-5" />,
    ocean: <FiMonitor className="w-5 h-5" />,
    professional: <FiMonitor className="w-5 h-5" />,
    modern: <FiMonitor className="w-5 h-5" />,
    classic: <FiMonitor className="w-5 h-5" />
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative mx-auto flex min-h-full items-center justify-center py-2 sm:py-6">
        <div className="relative bg-[var(--card-bg)] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <FiSettings className="w-5 h-5 text-[var(--primary)]" />
            <h2 className="text-xl font-semibold text-[var(--text)]">Preferences</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--secondary)] transition"
          >
            <FiX className="w-5 h-5 text-[var(--text)]" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--border)] px-2">
          <button
            onClick={() => setActiveTab('theme')}
            className={`flex-1 py-3 text-sm font-medium transition ${
              activeTab === 'theme'
                ? 'text-[var(--primary)] border-b-2 border-[var(--primary)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
            }`}
          >
            Theme
          </button>
          <button
            onClick={() => setActiveTab('fontSize')}
            className={`flex-1 py-3 text-sm font-medium transition ${
              activeTab === 'fontSize'
                ? 'text-[var(--primary)] border-b-2 border-[var(--primary)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
            }`}
          >
            Font Size
          </button>
          <button
            onClick={() => setActiveTab('appearance')}
            className={`flex-1 py-3 text-sm font-medium transition flex items-center justify-center gap-1 ${
              activeTab === 'appearance'
                ? 'text-[var(--primary)] border-b-2 border-[var(--primary)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
            }`}
          >
            <FiLayers className="w-4 h-4" />
            Appearance
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'theme' && (
            <div className="space-y-3">
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                Choose your preferred color theme
              </p>
              {Object.entries(themeLabels).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => dispatch(setTheme(value as ThemeType))}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition ${
                    currentTheme === value
                      ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                      : 'border-[var(--border)] hover:border-[var(--primary)]/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`p-2 rounded-lg ${
                      value === 'light' ? 'bg-yellow-100' :
                      value === 'dark' ? 'bg-slate-700' :
                      value === 'ocean' ? 'bg-cyan-100' :
                      value === 'professional' ? 'bg-teal-100' :
                      value === 'modern' ? 'bg-purple-100' :
                      'bg-amber-100'
                    }`}>
                      {themeIcons[value as ThemeType]}
                    </span>
                    <span className="font-medium text-[var(--text)]">{label}</span>
                  </div>
                  {currentTheme === value && (
                    <FiCheck className="w-5 h-5 text-[var(--primary)]" />
                  )}
                </button>
              ))}
            </div>
          )}

          {activeTab === 'fontSize' && (
            <div className="space-y-3">
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                Select your preferred font size
              </p>
              {fontSizeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => dispatch(setFontSize(option.value))}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition ${
                    currentFontSize === option.value
                      ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                      : 'border-[var(--border)] hover:border-[var(--primary)]/50'
                  }`}
                >
                  <span 
                    className="font-medium text-[var(--text)]"
                    style={{ fontSize: `${option.value}px` }}
                  >
                    {option.label}
                  </span>
                  {currentFontSize === option.value && (
                    <FiCheck className="w-5 h-5 text-[var(--primary)]" />
                  )}
                </button>
              ))}
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-6">
              {/* Card Radius */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <FiBox className="w-4 h-4 text-[var(--primary)]" />
                  <p className="text-sm font-medium text-[var(--text)]">Card Border Radius</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {borderRadiusOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => dispatch(setCardRadius(option.value))}
                      className={`p-3 rounded-lg border-2 transition ${
                        cardRadius === option.value
                          ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                          : 'border-[var(--border)] hover:border-[var(--primary)]/50'
                      }`}
                    >
                      <div 
                        className="w-full h-8 bg-[var(--primary)] mx-auto"
                        style={{ borderRadius: option.value }}
                      />
                      <p className="text-xs text-[var(--text-secondary)] mt-1 text-center">{option.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Button Radius */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <FiSquare className="w-4 h-4 text-[var(--primary)]" />
                  <p className="text-sm font-medium text-[var(--text)]">Button Border Radius</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {borderRadiusOptions.slice(1).map((option) => (
                    <button
                      key={option.value}
                      onClick={() => dispatch(setButtonRadius(option.value))}
                      className={`p-3 rounded-lg border-2 transition ${
                        buttonRadius === option.value
                          ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                          : 'border-[var(--border)] hover:border-[var(--primary)]/50'
                      }`}
                    >
                      <div 
                        className="w-full h-8 bg-[var(--primary)] mx-auto flex items-center justify-center"
                        style={{ borderRadius: option.value }}
                      >
                        <span className="text-white text-xs">Btn</span>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] mt-1 text-center">{option.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Radius */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <FiSquare className="w-4 h-4 text-[var(--primary)]" />
                  <p className="text-sm font-medium text-[var(--text)]">Input Border Radius</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {borderRadiusOptions.slice(1).map((option) => (
                    <button
                      key={option.value}
                      onClick={() => dispatch(setInputRadius(option.value))}
                      className={`p-3 rounded-lg border-2 transition ${
                        inputRadius === option.value
                          ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                          : 'border-[var(--border)] hover:border-[var(--primary)]/50'
                      }`}
                    >
                      <input 
                        type="text"
                        placeholder="Input"
                        className="w-full h-8 bg-[var(--input-bg)] border border-[var(--border)] text-[var(--text)] text-xs px-2"
                        style={{ borderRadius: option.value }}
                        readOnly
                      />
                      <p className="text-xs text-[var(--text-secondary)] mt-1 text-center">{option.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Container Padding */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <FiLayers className="w-4 h-4 text-[var(--primary)]" />
                  <p className="text-sm font-medium text-[var(--text)]">Container Padding</p>
                </div>
                <div className="space-y-2">
                  {containerPaddingOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => dispatch(setContainerPadding(option.value))}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition ${
                        containerPadding === option.value
                          ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                          : 'border-[var(--border)] hover:border-[var(--primary)]/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="bg-[var(--secondary)] border border-[var(--border)]"
                          style={{ padding: option.value }}
                        >
                          <div className="w-4 h-4 bg-[var(--primary)] rounded" />
                        </div>
                        <span className="font-medium text-[var(--text)]">{option.label}</span>
                      </div>
                      {containerPadding === option.value && (
                        <FiCheck className="w-5 h-5 text-[var(--primary)]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Shadow Intensity */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <FiBox className="w-4 h-4 text-[var(--primary)]" />
                  <p className="text-sm font-medium text-[var(--text)]">Shadow Intensity</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {shadowIntensityOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => dispatch(setShadowIntensity(option.value))}
                      className={`p-4 rounded-xl border-2 transition ${
                        shadowIntensity === option.value
                          ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                          : 'border-[var(--border)] hover:border-[var(--primary)]/50'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div 
                          className="w-12 h-12 bg-[var(--card-bg)] rounded-lg"
                          style={{
                            boxShadow: option.value === 'none' ? 'none' :
                                      option.value === 'light' ? '0 2px 4px rgba(0,0,0,0.1)' :
                                      option.value === 'medium' ? '0 4px 8px rgba(0,0,0,0.15)' :
                                      '0 8px 16px rgba(0,0,0,0.2)'
                          }}
                        />
                        <span className="font-medium text-[var(--text)] text-sm">{option.label}</span>
                      </div>
                      {shadowIntensity === option.value && (
                        <FiCheck className="w-4 h-4 text-[var(--primary)] mt-2" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Card Background Color */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <FiBox className="w-4 h-4 text-[var(--primary)]" />
                  <p className="text-sm font-medium text-[var(--text)]">Card Background</p>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {cardBgOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => dispatch(setCardBg(option.value))}
                      className={`p-3 rounded-xl border-2 transition flex flex-col items-center gap-2 ${
                        cardBg === option.value
                          ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                          : 'border-[var(--border)] hover:border-[var(--primary)]/50'
                      }`}
                    >
                      <div 
                        className="w-10 h-10 rounded-lg border border-[var(--border)]"
                        style={{ 
                          backgroundColor: option.color || 'var(--card-bg)',
                          border: option.value === 'default' ? '2px dashed var(--border)' : '1px solid var(--border)'
                        }}
                      />
                      <span className="font-medium text-[var(--text)] text-xs text-center">{option.label}</span>
                      {cardBg === option.value && (
                        <FiCheck className="w-4 h-4 text-[var(--primary)]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="p-4 border-t border-[var(--border)] bg-[var(--secondary)]">
          <p className="text-xs text-[var(--text-secondary)] mb-2">Preview</p>
          <div 
            className="p-4 bg-[var(--card-bg)] border border-[var(--border)]"
            style={{ 
              borderRadius: cardRadius,
              padding: containerPadding,
              boxShadow: shadowIntensity === 'none' ? 'none' :
                        shadowIntensity === 'light' ? '0 2px 4px rgba(0,0,0,0.1)' :
                        shadowIntensity === 'medium' ? '0 4px 8px rgba(0,0,0,0.15)' :
                        '0 8px 16px rgba(0,0,0,0.2)'
            }}
          >
            <h4 className="font-medium text-[var(--text)] mb-2" style={{ fontSize: `${currentFontSize}px` }}>
              Card Preview
            </h4>
            <p className="text-[var(--text-secondary)] mb-3" style={{ fontSize: `${currentFontSize - 2}px` }}>
              Sample text with current settings
            </p>
            <div className="flex gap-2">
              <button
                className="px-4 py-2 bg-[var(--primary)] text-white font-medium"
                style={{ borderRadius: buttonRadius }}
              >
                Button
              </button>
              <input
                type="text"
                placeholder="Input"
                className="px-3 py-2 bg-[var(--input-bg)] border border-[var(--border)] text-[var(--text)]"
                style={{ borderRadius: inputRadius }}
                readOnly
              />
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export type { PreferencesProps };
export default Preferences;
