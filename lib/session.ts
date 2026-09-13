export const ADMIN_COOKIE = "midnight_admin";
export const ADMIN_COOKIE_VALUE = "authenticated";
export const ADMIN_USERNAME = "admin";
export const ADMIN_PASSWORD = "admin1234";

export const isAdmin = (request: Request): boolean => {
  const header = request.headers.get("cookie") ?? "";
  return header
    .split(";")
    .map((part) => part.trim())
    .some((part) => part === `${ADMIN_COOKIE}=${ADMIN_COOKIE_VALUE}`);
};
