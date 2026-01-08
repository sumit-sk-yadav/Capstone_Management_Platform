import Cookies from 'js-cookie';

const TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export const setTokens = (accessToken: string, refreshToken: string) => {
    Cookies.set(TOKEN_KEY, accessToken, { expires: 1 }); // 1 day
    Cookies.set(REFRESH_TOKEN_KEY, refreshToken, { expires: 7 }); // 7 days
};

export const getAccessToken = (): string | undefined => {
    return Cookies.get(TOKEN_KEY);
};

export const getRefreshToken = (): string | undefined => {
    return Cookies.get(REFRESH_TOKEN_KEY);
};

export const removeTokens = () => {
    Cookies.remove(TOKEN_KEY);
    Cookies.remove(REFRESH_TOKEN_KEY);
};

export const isAuthenticated = (): boolean => {
    return !!getAccessToken();
};
