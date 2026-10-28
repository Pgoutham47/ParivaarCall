// This account is a permanent presentation sandbox. The ID is not a secret.
// Keep its calling block independent of editable profile data and plan settings.
export const DEMO_ACCOUNT_ID = "b4632466-cfd0-48bf-b2bf-b2b828e97ca7";

export function isPresentationDemo(caregiverId?: string | null) {
  return caregiverId === DEMO_ACCOUNT_ID;
}

export const DEMO_CALLING_DISABLED_MESSAGE =
  "This presentation account uses fictional examples. Live and test calls are disabled.";
