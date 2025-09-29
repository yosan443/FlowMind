export interface UserRecord {
    id: string;
    email: string;
    username: string;
    passwordHash: string | null;
    googleSub: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface PublicUser {
    id: string;
    email: string;
    username: string;
    createdAt: string;
    updatedAt: string;
}

export interface RegisterWithEmailRequest {
    email: string;
    username: string;
    password: string;
}

export interface LoginWithEmailRequest {
    email: string;
    password: string;
}

export interface AuthSuccessResponse {
    user: PublicUser;
    tokens: {
        accessToken: string;
        expiresIn: number;
    };
}

export interface LoginWithGoogleRequest {
    idToken: string;
}
