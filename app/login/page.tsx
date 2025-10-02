// app/login/page.tsx
import LoginForm from "./LoginForm";

export default function Page({
  searchParams,
}: {
  searchParams: { callbackUrl?: string };
}) {
  const callbackUrl = searchParams?.callbackUrl ?? "/events";
  return <LoginForm callbackUrl={callbackUrl} />;
}
