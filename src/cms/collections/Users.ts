import type { CollectionConfig } from "payload";
import { adminOnly } from "../access";
import { adminGroups, bilingual, collectionLabels, option } from "../i18n";

export const Users: CollectionConfig = {
  slug: "users",
  labels: collectionLabels("مستخدم", "المستخدمون", "User", "Users"),
  auth: { maxLoginAttempts: 5, lockTime: 600000 },
  admin: { useAsTitle: "name", group: adminGroups.system },
  access: {
    create: async ({ req }) => {
      if (req.user?.role === "admin") return true;
      const result = await req.payload.count({
        collection: "users",
        overrideAccess: true,
      });
      return result.totalDocs === 0;
    },
    read: ({ req }) => {
      if (req.user?.role === "admin") return true;
      if (!req.user) return false;
      return { id: { equals: req.user.id } };
    },
    delete: adminOnly,
    update: ({ req, id }) =>
      req.user?.role === "admin" || String(req.user?.id) === String(id),
  },
  hooks: {
    beforeLogin: [
      ({ user }) => {
        if ((user as { isActive?: boolean }).isActive === false) {
          throw new Error("هذا الحساب معطل / This CMS account is disabled.");
        }
        return user;
      },
    ],
    beforeChange: [
      async ({ data, operation, req }) => {
        if (operation !== "create") return data;
        const result = await req.payload.count({
          collection: "users",
          overrideAccess: true,
        });
        if (result.totalDocs === 0) return { ...data, role: "admin" };
        return data;
      },
    ],
  },
  fields: [
    { name: "name", label: bilingual("الاسم", "Name"), type: "text", required: true },
    {
      name: "role",
      label: bilingual("الدور", "Role"),
      type: "select",
      required: true,
      defaultValue: "editor",
      options: [option("admin", "مدير", "Administrator"), option("editor", "محرر", "Editor")],
      access: { update: ({ req }) => req.user?.role === "admin" },
    },
    {
      name: "isActive",
      label: bilingual("الحساب نشط", "Active account"),
      type: "checkbox",
      defaultValue: true,
      access: { update: ({ req }) => req.user?.role === "admin" },
    },
  ],
};
