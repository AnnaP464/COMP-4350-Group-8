// Domain types shared between backend 
export type Role = "Volunteer" | "Organizer";
export type UserPublic = { username: string; email: string; role: Role };
