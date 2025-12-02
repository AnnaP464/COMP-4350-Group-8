export function getUser(){
  return localStorage.getItem("user");
}

export function getToken(){
  return localStorage.getItem("access_token");
}

export function setToken(access_token: string){
  localStorage.setItem("access_token", access_token);
}

export function logout(){
  localStorage.removeItem("user");
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

export function login(access_token: string, user: string) {
  setToken(access_token);
  localStorage.setItem("user", user);
}

export function getHourGoal() {
  return localStorage.getItem("hoursGoal");
}

export function setHourGoal(n: Number) {
  localStorage.setItem("hoursGoal", String(n));
}

export function clearLocalStorage() {
  localStorage.clear();
}