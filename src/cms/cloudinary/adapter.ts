import type { Adapter, File } from "@payloadcms/plugin-cloud-storage/types";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";

const required = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
};

const configure = () =>
  cloudinary.config({
    cloud_name: required("CLOUDINARY_CLOUD_NAME"),
    api_key: required("CLOUDINARY_API_KEY"),
    api_secret: required("CLOUDINARY_API_SECRET"),
    secure: true,
  });

const uploadBuffer = async (
  file: File,
  folder: string,
): Promise<UploadApiResponse> => {
  configure();

  if (!file.buffer?.length) {
    throw new Error("Cloudinary upload received an empty file buffer.");
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "image",
        folder,
        use_filename: true,
        unique_filename: true,
        overwrite: false,
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed."));
          return;
        }
        resolve(result);
      },
    );

    stream.end(file.buffer);
  });
};

const filenameFromResult = (
  result: UploadApiResponse,
  originalFilename: string,
): string => {
  const publicName = result.public_id.split("/").at(-1) || "image";
  const originalExtension = originalFilename.includes(".")
    ? originalFilename.split(".").at(-1)
    : undefined;
  const extension = result.format || originalExtension || "jpg";
  return `${publicName}.${extension}`;
};

export const cloudinaryAdapter: Adapter = ({ collection, prefix }) => ({
  name: "cloudinary",
  fields: [
    { name: "cloudinaryPublicId", type: "text", admin: { hidden: true } },
    { name: "cloudinarySecureUrl", type: "text", admin: { hidden: true } },
    { name: "cloudinaryAssetId", type: "text", admin: { hidden: true } },
    { name: "cloudinaryVersion", type: "number", admin: { hidden: true } },
  ],
  generateURL: ({ data }) =>
    typeof data?.cloudinarySecureUrl === "string"
      ? data.cloudinarySecureUrl
      : "",
  handleUpload: async ({ file }) => {
    const rootFolder = process.env.CLOUDINARY_FOLDER || "arab-poets";
    const folder = [rootFolder, prefix || collection.slug]
      .filter(Boolean)
      .join("/");
    const result = await uploadBuffer(file, folder);

    return {
      filename: filenameFromResult(result, file.filename),
      filesize: result.bytes,
      mimeType: result.format === "jpg"
        ? "image/jpeg"
        : result.format
          ? `image/${result.format}`
          : file.mimeType,
      width: result.width,
      height: result.height,
      sizes: {},
      url: result.secure_url,
      cloudinaryPublicId: result.public_id,
      cloudinarySecureUrl: result.secure_url,
      cloudinaryAssetId: result.asset_id,
      cloudinaryVersion: result.version,
    };
  },
  handleDelete: async ({ doc }) => {
    const publicID = (doc as typeof doc & { cloudinaryPublicId?: string })
      .cloudinaryPublicId;
    if (!publicID) return;

    configure();
    await cloudinary.uploader.destroy(publicID, {
      invalidate: true,
      resource_type: "image",
    });
  },
  staticHandler: (_req, { doc }) => {
    const url = (doc as { cloudinarySecureUrl?: string } | undefined)
      ?.cloudinarySecureUrl;
    return url
      ? Response.redirect(url, 302)
      : new Response("Not found", { status: 404 });
  },
});
