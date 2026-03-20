import { SecureUploadClient } from "./SecureUploadClient";

export const metadata = {
  title: "Secure Document Upload | Requity Group",
  description: "Upload documents securely to Requity Group.",
};

export default async function SecureUploadPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <SecureUploadClient token={token} />;
}
