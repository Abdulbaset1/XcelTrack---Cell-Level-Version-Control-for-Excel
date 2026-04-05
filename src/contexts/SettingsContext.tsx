import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

interface SettingsState {
    autoSaveInterval: string;
    versionHistoryLimit: number;
    emailAlerts: boolean;
    collaborationInvites: boolean;
    publicProfile: boolean;
}

interface SettingsContextType {
    settings: SettingsState;
    updateSettings: (newSettings: Partial<SettingsState>) => void;
    resetSettings: () => void;
}

const defaultSettings: SettingsState = {
    autoSaveInterval: '10',
    versionHistoryLimit: 50,
    emailAlerts: true,
    collaborationInvites: true,
    publicProfile: true,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<SettingsState>(() => {
        const saved = localStorage.getItem('xceltrack_settings');
        if (saved) {
            try {
                return { ...defaultSettings, ...JSON.parse(saved) };
            } catch (e) {
                console.error('Failed to parse settings', e);
            }
        }
        return defaultSettings;
    });

    const updateSettings = useCallback((newSettings: Partial<SettingsState>) => {
        setSettings(prev => {
            const updated = { ...prev, ...newSettings };
            localStorage.setItem('xceltrack_settings', JSON.stringify(updated));
            return updated;
        });
    }, []);

    const resetSettings = useCallback(() => {
        setSettings(defaultSettings);
        localStorage.setItem('xceltrack_settings', JSON.stringify(defaultSettings));
    }, []);

    const contextValue = useMemo(
        () => ({ settings, updateSettings, resetSettings }),
        [settings, updateSettings, resetSettings]
    );

    return (
        <SettingsContext.Provider value={contextValue}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
