import {
  reactExtension,
  Banner,
  BlockStack,
  Button,
  Text,
  useApi,
  useSettings,
} from "@shopify/ui-extensions-react/checkout";

export default reactExtension("purchase.thank-you.block.render", () => (
  <Extension />
));

function Extension() {
  const api = useApi();
  const settings = useSettings();
  const storefrontUrl = String(settings.storefront_url || "").replace(/\/$/, "");
  const locale = String(settings.default_locale || "sv");
  const confirmation =
    api.orderConfirmation?.number ||
    api.cost?.totalAmount?.amount ||
    "";
  const total = api.cost?.totalAmount;
  const brand = "Harbor";

  if (!storefrontUrl) {
    return (
      <Banner status="warning">
        Set the storefront URL in the thank-you extension settings.
      </Banner>
    );
  }

  const params = new URLSearchParams();
  if (confirmation) params.set("order", String(confirmation));
  if (total?.amount) params.set("value", String(total.amount));
  if (total?.currencyCode) params.set("currency", String(total.currencyCode));

  const href = `${storefrontUrl}/${locale}/order/confirmed${
    params.toString() ? `?${params.toString()}` : ""
  }`;

  return (
    <Banner status="success" title="Order confirmed">
      <BlockStack spacing="tight">
        <Text>
          Continue on {brand} for order tracking and your account.
        </Text>
        <Button to={href}>{`Continue to store`}</Button>
      </BlockStack>
    </Banner>
  );
}
