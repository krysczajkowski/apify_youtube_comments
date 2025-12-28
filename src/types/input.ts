/**
 * TypeScript types for Actor input, matching contracts/input-schema.json
 */

/**
 * Single URL entry from the startUrls array
 * Supports both string format and object format for backwards compatibility
 */
export type StartUrlInput = string | { url: string; method?: string };

/**
 * Normalized URL entry (always object format)
 */
export interface StartUrl {
    url: string;
    method?: string;
}

/**
 * Proxy configuration for Apify Proxy
 */
export interface ProxyConfiguration {
    useApifyProxy?: boolean;
    apifyProxyGroups?: string[];
    apifyProxyCountry?: string;
    proxyUrls?: string[];
}

/**
 * Sort order for comments
 * "0" = Top comments (engagement-based)
 * "1" = Newest first (chronological)
 */
export type CommentsSortBy = '0' | '1';

/**
 * Main Actor input schema
 */
export interface ActorInput {
    /** Array of YouTube video URLs to scrape (strings or objects) */
    startUrls: StartUrlInput[];

    /** Maximum comments to extract per video. 0 or undefined = unlimited */
    maxComments?: number;

    /** Sort order: "0" = Top, "1" = Newest first (default) */
    commentsSortBy?: CommentsSortBy;

    /** Proxy configuration */
    proxyConfiguration?: ProxyConfiguration;
}

/**
 * Validated input with defaults applied
 */
export interface ValidatedInput {
    startUrls: StartUrl[];
    maxComments: number;
    commentsSortBy: CommentsSortBy;
    proxyConfiguration: ProxyConfiguration;
}

/**
 * Default values for optional input fields
 */
export const INPUT_DEFAULTS: Omit<ValidatedInput, 'startUrls'> = {
    maxComments: 0,
    commentsSortBy: '1',
    proxyConfiguration: {
        useApifyProxy: true,
        apifyProxyGroups: ['RESIDENTIAL'],
    },
};
