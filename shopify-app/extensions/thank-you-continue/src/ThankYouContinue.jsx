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
  const orderId = api.orderConfirmation?.id;
  const total = api.cost?.totalAmount;
  const brand = "Vardagsstil";

  if (!storefrontUrl) {
    return (
      <Banner status="warning">
        Set the storefront URL in the thank-you extension settings.
      </Banner>
    );
  }

  const params = new URLSearchParams();
  if (confirmation) params.set("order", String(confirmation));
  if (orderId) params.set("txid", String(orderId));
  if (total?.amount) params.set("value", String(total.amount));
  if (total?.currencyCode) params.set("currency", String(total.currencyCode));

  const href = `${storefrontUrl}/${locale}/order/confirmed${
    params.toString() ? `?${params.toString()}` : ""
  }`;

  return (
    <Banner status="success" title="Ordern är mottagen">
      <BlockStack spacing="tight">
        <Text>
          Fortsätt till {brand} för orderstatus och konto.
        </Text>
        <Button to={href}>Fortsätt till butiken</Button>
      </BlockStack>
    </Banner>
  );
}
