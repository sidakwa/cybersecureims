/// Helper function to get organization display name
// Maps internal org names to user-friendly display names
export const getOrgDisplayName = (orgName: string | null | undefined): string => {
    if (!orgName) return 'No Organization';
    
    // Map internal names to display aliases
    const orgMappings: Record<string, string> = {
        'CyberSecureIMS Default Org': 'Seacom',
        'Default Organization': 'Seacom',
        'seacom-org': 'Seacom',
    };
    
    // Return mapped name if exists, otherwise return original
    return orgMappings[orgName] || orgName;
};

// For organization ID mapping (if needed in the future)
export const getOrgDisplayNameById = (orgId: string | null): string => {
    const idMappings: Record<string, string> = {
        '11111111-1111-1111-1111-111111111111': 'Seacom',
    };
    
    if (orgId && idMappings[orgId]) {
        return idMappings[orgId];
    }
    return 'Organization';
};
