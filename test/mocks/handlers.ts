import { http, HttpResponse } from 'msw';

export const handlers = [
  // Mock Shopify Storefront API GraphQL (Product Variants lookup)
  http.post('https://*.myshopify.com/api/*/graphql.json', async () => {
    return HttpResponse.json({
      data: {
        products: {
          edges: [
            {
              node: {
                id: 'gid://shopify/Product/1001',
                title: 'Whey Isolate Vanille 1kg',
                variants: {
                  edges: [
                    {
                      node: {
                        id: 'gid://shopify/ProductVariant/101',
                        price: { amount: '45.00', currencyCode: 'EUR' },
                        availableForSale: true,
                      },
                    },
                  ],
                },
              },
            },
          ],
        },
      },
    });
  }),

  // Mock Shopify Admin API Price Rules (Discount Creation)
  http.post('https://*.myshopify.com/admin/api/*/price_rules.json', async () => {
    return HttpResponse.json(
      {
        price_rule: {
          id: 987654321,
          title: 'KARIM10',
          value_type: 'percentage',
          value: '-10.0',
          target_type: 'line_item',
          allocation_method: 'across',
        },
      },
      { status: 201 },
    );
  }),
];
