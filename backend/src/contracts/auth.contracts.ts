import { UserPublic, Role } from "./domain.types";

// Inputs to auth service
export type RegisterInput = { username: string; email: string; password: string ; role: Role };
export type LoginInput    = { email: string; password: string };
export type RefreshInput  = { refreshToken: string };
export type MeInput       = { userId: string}
// Outputs from auth service
export type LoginResult = {
  accessToken: string;            // bearer for API calls
  refreshToken: string;           // for HttpOnly cookie
  user: UserPublic;               // what controller can expose
};

export type RegisterResult = LoginResult; // after register, same return as login 
export type RefreshResult  = { 
  accessToken: string; 
  refreshToken: string 
};

//return type for AuthService.me
export type MeResult = {
  id: string;
  username: string;
  email: string;
  role: Role;
  createdAt: Date;
};


// Auth service contract (controller depends on this, not on implementations)
export interface AuthService {
  register(input: RegisterInput): Promise<RegisterResult>;
  login(input: LoginInput): Promise<LoginResult>;
  refresh(input: RefreshInput): Promise<RefreshResult>;
  me(input: MeInput): Promise<MeResult>;
}