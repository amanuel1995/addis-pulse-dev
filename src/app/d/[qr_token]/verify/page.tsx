import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { OtpForm } from "@/components/lead/OtpForm";
import { verifyFlowToken } from "@/lib/passenger-flow/security";

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ qr_token: string }>;
}) {
  const { qr_token } = await params;
  const flow = verifyFlowToken(
    (await cookies()).get("ap_passenger_flow")?.value || "",
  );
  if (!flow || flow.qrToken !== qr_token) {
    redirect(`/d/${encodeURIComponent(qr_token)}`);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6 py-10">
      <section className="w-full rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Check your phone</h1>
        <p className="mt-2 mb-6 text-gray-600">
          Enter the six-digit SMS code. / ባለስድስት አሃዝ ኮዱን ያስገቡ።
        </p>
        <OtpForm />
      </section>
    </main>
  );
}
