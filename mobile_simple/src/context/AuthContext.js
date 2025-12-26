import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [password, setPassword] = useState(null); // Keep in memory while unlocked

    const unlockWallet = (pwd) => {
        setPassword(pwd);
        setIsUnlocked(true);
    };

    const lockWallet = () => {
        setPassword(null);
        setIsUnlocked(false);
    };

    return (
        <AuthContext.Provider value={{ isUnlocked, password, unlockWallet, lockWallet }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
