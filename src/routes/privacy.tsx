import { createFileRoute } from "@tanstack/react-router";
import { InfoPage, infoHead } from "@/components/InfoPage";

export const Route = createFileRoute("/privacy")({
  head: () => infoHead("Privacy Policy", "How ShopSphere collects, uses and protects your personal information."),
  component: () => (
    <InfoPage eyebrow="Legal" title="Privacy Policy" intro="Your privacy matters. This policy explains what we collect and why.">
      <h2>Information we collect</h2>
      <ul>
        <li>Account details: name, email address and mobile number.</li>
        <li>Delivery addresses you save or enter at checkout.</li>
        <li>Order history, cart and wishlist contents.</li>
      </ul>
      <h2>How we use it</h2>
      <p>We use your information to process and deliver orders, provide customer support and keep your account secure. We never sell your personal data.</p>
      <h2>Security</h2>
      <p>Passwords are stored only as salted one-way hashes. All connections between our services are encrypted with TLS.</p>
      <h2>Your choices</h2>
      <p>You can update your profile and addresses at any time from your account page, or contact us to delete your account.</p>
    </InfoPage>
  ),
});
