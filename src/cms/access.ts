import type { Access, FieldAccess, Where } from "payload";

type CMSUser = {
  id?: number | string;
  role?: "admin" | "editor";
};

const getUser = (value: unknown): CMSUser | null =>
  value && typeof value === "object" ? (value as CMSUser) : null;

const hasRole = (value: unknown, roles: CMSUser["role"][]): boolean => {
  const role = getUser(value)?.role;
  return Boolean(role && roles.includes(role));
};

export const authenticated: Access = ({ req }) => Boolean(req.user);
export const adminOnly: Access = ({ req }) => hasRole(req.user, ["admin"]);
export const adminOrEditor: Access = ({ req }) =>
  hasRole(req.user, ["admin", "editor"]);
export const adminDeleteOnly: Access = adminOnly;
export const publicCreate: Access = () => true;
export const deny: Access = () => false;

export const fieldAdminOnly: FieldAccess = ({ req }) =>
  hasRole(req.user, ["admin"]);
export const fieldAdminOrEditor: FieldAccess = ({ req }) =>
  hasRole(req.user, ["admin", "editor"]);

export const publishedOrAuthenticated: Access = ({ req }) => {
  if (req.user) return true;
  return {
    _status: {
      equals: "published",
    },
  } satisfies Where;
};

export const publicPeopleOrAuthenticated: Access = ({ req }) => {
  if (req.user) return true;

  const publicProfileQuery: Where = {
    and: [
      {
        _status: {
          equals: "published",
        },
      } as Where,
      {
        showInPublicDirectory: {
          equals: true,
        },
      } as Where,
    ],
  };

  return publicProfileQuery;
};

export const activeOrAuthenticated: Access = ({ req }) => {
  if (req.user) return true;
  return {
    isActive: {
      equals: true,
    },
  } satisfies Where;
};
