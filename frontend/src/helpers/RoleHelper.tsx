export const ORG_ROLE = "Organizer";
export const VOL_ROLE = "Volunteer";
export const SIGN_UP = "Sign-up";
export const LOG_IN = "Log-in";
export const LOG_IN_PAGE = "";

export type UserRole = typeof ORG_ROLE | typeof VOL_ROLE | "";

export type StoredUser = {
  email: string;
  role: string;
};

export function subtitle(role: UserRole){
  let subtitle = "User Role is Invalid";
  if(role === ORG_ROLE){
    subtitle = "Manage your events and volunteers";
  } else if (role === VOL_ROLE){
    subtitle = "Join and contribute to causes";
  }
  return subtitle;
}

export function getAuthPath(authChoice: string){
  let authChoicePage = "/";
  if(authChoice === LOG_IN){
    authChoicePage = "/User-login";
  } else if (authChoice === SIGN_UP){
    authChoicePage = "/User-signup";
  }
  return authChoicePage;
}

export function textFieldDesc(role: UserRole){
  let textFieldDesc = "User Role is Invalid"
  if(role === ORG_ROLE){
    textFieldDesc = "Organization name *";
  } else if(role === VOL_ROLE){
    textFieldDesc = "Your username *";
  }
  return textFieldDesc;
}

export function getStoredUser(): StoredUser | null {
  const raw = localStorage.getItem("user");
  if (!raw) 
    return null;
  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}