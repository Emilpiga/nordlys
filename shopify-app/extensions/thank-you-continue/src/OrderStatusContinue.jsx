import {
  reactExtension,
  Banner,
  BlockStack,
  Button,
  Text,
  useApi,
  useSettings,
} from "@shopify/ui-extensions-react/checkout";

export default reactExtension(
  "customer-account.order-status.block.render",
  () => <Extension />,
);

function Extension() {
  const api = useApi();
  const settings = useSettings();
  const storefrontUrl = String(settings.storefront_url || "").replace(/\/$/, "");
  const locale = String(settings.default_locale || "sv");
  const orderName = api.order?.name || "";

  if (!storefrontUrl) {
    return null;
  }

  const params = new URLSearchParams();
  if (orderName) params.set("order", String(orderName));

  const href = `${storefrontUrl}/${locale}/order/confirmed${
    params.toString() ? `?${params.toString()}` : ""
  }`;

  return (
    <Banner title="Back to the store">
      <BlockStack spacing="tight">
        <Text>Open your account on the storefront for tracking updates.</Text>
        <Button to={href}>Continue to store</Button>
      </BlockStack>
    </Banner>
  );
}
