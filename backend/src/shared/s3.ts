import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getEnv } from "../config/env.js";
import { badRequest } from "./errors.js";

function isS3Configured() {
  const env = getEnv();
  return Boolean(env.S3_BUCKET && env.S3_REGION && env.S3_ACCESS_KEY && env.S3_SECRET_KEY);
}

function getS3Client() {
  const env = getEnv();
  if (!isS3Configured()) {
    throw badRequest("S3 is not configured");
  }

  return new S3Client({
    region: env.S3_REGION!,
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY!,
      secretAccessKey: env.S3_SECRET_KEY!,
    },
  });
}

export function getAvatarPublicUrl(key: string) {
  const env = getEnv();
  return `https://${env.S3_BUCKET}.s3.${env.S3_REGION}.amazonaws.com/${key}`;
}

export async function createAvatarUploadUrl(userId: string, contentType: string) {
  const env = getEnv();
  const client = getS3Client();
  const extension = contentType.split("/")[1] ?? "jpg";
  const key = `avatars/${userId}/${Date.now()}.${extension}`;

  const command = new PutObjectCommand({
    Bucket: env.S3_BUCKET!,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 300 });

  return {
    uploadUrl,
    avatarUrl: getAvatarPublicUrl(key),
    key,
  };
}
