// app/login/page.tsx
import LoginForm from "./LoginForm";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const params = await searchParams;
  const callbackUrl = params?.callbackUrl ?? "/events";
  return <LoginForm callbackUrl={callbackUrl} />;
}
