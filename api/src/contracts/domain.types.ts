// Domain types shared between backend 
export type Role = "Volunteer" | "Organization";
export type UserPublic = { username: string; email: string; role: Role };
