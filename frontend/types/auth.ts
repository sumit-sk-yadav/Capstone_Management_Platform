export interface User {
    id: string;
    email: string;
    username: string;
    first_name: string;
    last_name: string;
    role: 'admin' | 'student' | 'professor';
    auth_provider: 'jwt' | 'google';
    is_verified: boolean;
    date_joined: string;
}

export interface LoginResponse {
    user: User;
    tokens: {
        access: string;
        refresh: string;
    };
}

export interface RegisterData {
    email: string;
    username: string;
    password: string;
    password2: string;
    first_name: string;
    last_name: string;
}

export interface LoginData {
    email: string;
    password: string;
}

export interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (data: LoginData) => Promise<void>;
    registerStudent: (data: RegisterData) => Promise<void>;
    registerProfessor: (data: RegisterData) => Promise<void>;
    registerAdmin: (data: RegisterData) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
}
