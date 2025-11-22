export const NAME_ERROR = "Name is required.";
export const DUPLICATE_NAME_ERROR = "Username is already taken.";
export const NAME_LENGTH_ERROR = "Username must be between 3 to 32 characters.";

export const EMAIL_ERROR = "Email is required.";
export const DUPLICATE_EMAIL_ERROR = "Email is already taken.";
// i know that were not supposed to give people a chance to try
// out enumeration attacks but A) we arent a target, and B) i gotta 
// give an error of some sort and itll mean the same thing with an extra 
// step if we do obfuscate it with something vauge.

export const PASSWORD_ERROR = "Password is required.";
export const PASSWORD_LENGTH_ERROR = "Password must be atleast 8 characters.";
export const CONFIRM_PASSWORD_ERROR = "Passwords do not match.";

export const LOG_IN_ERROR = "Invalid email or password.";
export const SERVER_ERROR = "Network Error — Please Try Again Later.";


export const JOB_NAME_ERROR = "Job name is required";
export const START_TIME_ERROR = "Start time is required";
export const END_TIME_ERROR = "End time is required";
export const TIMING_ERROR = "End time must be after start time";
export const LOCATION_ERROR = "Location is required";
export const DESCRIPTION_ERROR = "Description is required";

export const SESSION_EXPIRE_ERROR = "Your session has expired. Please log in again.";
