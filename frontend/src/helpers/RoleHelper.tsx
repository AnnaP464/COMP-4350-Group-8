export const ORG_ROLE = "Organizer";
export const VOL_ROLE = "Volunteer";
export const SIGN_UP = "Sign-up";
export const LOG_IN = "Log-in";
export const LOG_IN_PAGE = "";

export type UserRole = typeof ORG_ROLE | typeof VOL_ROLE | "";

export type AuthChoiceState = {role : UserRole}

export function subtitle(role: UserRole){
  let subtitle = "User Role is Invalid";
  if(role === ORG_ROLE){
    subtitle = "Manage your events and volunteers";
  } else if (role === VOL_ROLE){
    subtitle = "Join and contribute to causes";
  }
  return subtitle;
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