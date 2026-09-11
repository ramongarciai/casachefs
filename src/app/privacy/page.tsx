import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 prose prose-neutral">
      <h1>Privacy Policy</h1>
      <p>Last updated: September 2026</p>

      <p>
        Casa Chefs ("we", "us") provides catering, box lunch, and frozen
        food ordering services in the Houston, The Woodlands, and Magnolia,
        TX area. This page explains what information we collect through
        casachefs.vercel.app and how we use it.
      </p>

      <h2>Information we collect</h2>
      <p>
        When you place an order or create an account, we collect your name,
        email address, phone number, delivery address, and order details.
        If you sign in with Google, we receive your name, email address,
        and profile photo from Google. If you sign in with a magic link, we
        only use your email address to verify it's you.
      </p>

      <h2>How we use it</h2>
      <p>
        We use this information to process and fulfill your orders, send
        order confirmations and updates, respond to quote requests, and
        contact you about your account. We do not sell your personal
        information to third parties.
      </p>

      <h2>Service providers</h2>
      <p>
        We use Supabase to store order and account data, Resend to send
        transactional emails, and Google to offer sign-in with Google. Each
        of these providers processes data on our behalf and maintains their
        own security and privacy practices.
      </p>

      <h2>Contact us</h2>
      <p>
        If you have questions about this policy or want your data removed,
        contact us at{" "}
        <a href="mailto:ramon@marketuallc.com">ramon@marketuallc.com</a>.
      </p>
    </main>
  );
}
