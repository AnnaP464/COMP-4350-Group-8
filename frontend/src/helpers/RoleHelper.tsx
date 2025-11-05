export type UserRole = "Organizer" | "Volunteer" | "";

export type AuthChoiceState = {role : UserRole}

export function subtitle(role: UserRole){
  let subtitle = "User Role is Invalid";
  if(role === "Organizer"){
    subtitle = "Manage your events and volunteers";
  } else if (role === "Volunteer"){
    subtitle = "Join and contribute to causes";
  }
  return subtitle;
}

export function textFieldDesc(role: UserRole){
  let textFieldDesc = "User Role is Invalid"
  if(role === "Organizer"){
    textFieldDesc = "Organization name *";
  } else if(role === "Volunteer"){
    textFieldDesc = "Your username *";
  }
  return textFieldDesc;
}