//Errors
export const NAME_ERROR = "Name is required.";
export const DUPLICATE_NAME_ERROR = "Username is already taken.";
export const NAME_LENGTH_ERROR = "Username must be between 3 to 32 characters.";

export const EMAIL_ERROR = "Email is required.";
export const DUPLICATE_EMAIL_ERROR = "Email is already taken.";

export const PASSWORD_ERROR = "Password is required.";
export const PASSWORD_LENGTH_ERROR = "Password must be atleast 8 characters.";
export const CONFIRM_PASSWORD_ERROR = "Passwords do not match.";

export const LOG_IN_ERROR = "Invalid email or password.";
export const SERVER_ERROR = "Network Error — Please Try Again Later.";

export const JOB_NAME_ERROR = "Job name is required";
export const START_TIME_ERROR = "Start time is required";
export const END_TIME_ERROR = "End time is required";
export const TIMING_ERROR = "End time must be after start time";
export const CAUSALITY_ERROR = "Start time cannot be in the past";
export const TIME_FORMATTING_ERROR = "Please choose valid start and end times.";
export const LOCATION_ERROR = "Location is required";
export const DESCRIPTION_ERROR = "Description is required";
export const SESSION_EXPIRE_ERROR = "Your session has expired. Please log in again.";

export const TOKEN_MISSING_ERROR = "Please log in.";
export const EVENT_ID_MISSING_ERROR = "Missing event id";
export const EVENT_FETCH_ERROR = "Failed to Fetch Event List";
export const CONFLICTING_EVENT_ERROR = "User has a conflicting accepted event.";
export const PROFILE_FETCH_ERROR = "Failed to load profile.";

//Successes
export const APPLICATION_PROCESSING = "Application submitted! An organizer will review it.";
export const DEREGISTRATION_SUCCESS = "User has been successfully deregistered for the event";