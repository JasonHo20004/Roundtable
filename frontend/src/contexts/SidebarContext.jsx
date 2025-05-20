import React, {createContext, useCallback, useState} from 'react';

const initialSidebarState = {
    header: null,
    body: null,
    footer: null
};

const SidebarContext = createContext({
    sidebarParts: initialSidebarState,
    setSidebarParts:
        (parts) => {
            // Default implementation does nothing
        }
});
const SidebarProvider = ({children}) => {
    const [sidebarParts, setSidebarPartsState] = useState(initialSidebarState);

    // Define a stable function to update the parts
    const setSidebarParts = useCallback((parts) => {
        if (parts === null || typeof parts !== 'object') {
            // If null or not an object, clear all parts
            setSidebarPartsState(initialSidebarState);
        } else {
            // Set based on provided parts, defaulting missing keys to null
            setSidebarPartsState({
                header: parts.header || null,
                body: parts.body || null,
                footer: parts.footer || null,
            });
        }
    }, []);

    // Value provided by the context
    const contextValue = {
        sidebarParts,
        setSidebarParts
    };

    return (
        <SidebarContext.Provider value={contextValue}>
            {children}
        </SidebarContext.Provider>
    );
};

export default SidebarProvider;
export {SidebarContext};