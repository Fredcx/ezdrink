
export const getImageUrl = (url: string | null | undefined) => {
    if (!url) return '/placeholder.png'; // Make sure you have a placeholder
    if (url.startsWith('http')) return url;
    if (url.startsWith('/uploads')) {
        const apiUrl = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
        return `${apiUrl}${url}`;
    }
    return url;
};
