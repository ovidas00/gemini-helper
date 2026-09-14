import { Type, type FunctionDeclaration } from '@google/genai';

export const chatTools: FunctionDeclaration[] = [
  {
    name: 'get_categories',
    description:
      'Fetches the product categories from the ecommerce API. Use this when the user asks about available categories, product categories, category names, or wants to know what categories exist.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: 'get_products',
    description: `
Fetches products from the ecommerce API.

Use this tool when the user asks about:
- products
- product details
- product availability
- stock
- price
- discount
- product images
- product categories
- comparing products

Each product may contain:
- id
- name
- sku
- description
- short_description
- regular_price
- discount_price
- total_stock
- category
- images
- variants
- delivery methods

Product image paths are relative paths.

The public storage base URL is:
https://admin.sohojkroy.com/storage

To construct a complete product image URL, append the image_path
to the storage base URL.

Example:
image_path:
products/gallery/example.png

Full image URL:
https://admin.sohojkroy.com/storage/products/gallery/example.png

If the user asks to see, view, show, or send product images,
use the product images returned by this tool.

Do not invent image paths or image URLs.
Only use image URLs constructed from image paths returned by this tool.
  `.trim(),
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: 'get_current_time',
    description: 'Returns the current server date and time.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },

  {
    name: 'get_server_info',
    description: 'Returns basic information about the server.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
];

export async function executeTool(name: string, args: Record<string, any>) {
  switch (name) {
    case 'get_categories': {
      const response = await fetch(
        'https://admin.sohojkroy.com/api/categories',
      );

      if (!response.ok) {
        throw new Error(`Categories API returned ${response.status}`);
      }

      const data = await response.json();

      return data;
    }

    case 'get_products': {
      const response = await fetch('https://admin.sohojkroy.com/api/products');

      if (!response.ok) {
        throw new Error(`Products API returned ${response.status}`);
      }

      const result = await response.json();

      return {
        products:
          result.data?.data?.map((product: any) => ({
            id: product.id,
            sku: product.sku,
            name: product.name,
            slug: product.slug,
            description: product.description,
            shortDescription: product.short_description,

            category: product.category
              ? {
                  id: product.category.id,
                  name: product.category.name,
                  slug: product.category.slug,
                }
              : null,

            stock: product.total_stock,
            regularPrice: product.regular_price,
            discountPrice: product.discount_price,

            isFeatured: product.is_featured,
            isOffer: product.is_offer,
            isCampaign: product.is_campaign,
            status: product.status,

            mainImage: product.main_image,

            keywordTags: product.keyword_tags,

            reviews: {
              count: product.reviews_count,
              averageRating: product.reviews_avg_rating,
            },

            variants: product.variants,

            deliveryMethods: product.delivery_methods?.map((delivery: any) => ({
              name: delivery.name,
              charge: delivery.charge,
              active: delivery.is_active,
            })),
          })) ?? [],
      };
    }

    case 'get_current_time':
      return {
        iso: new Date().toISOString(),
        local: new Date().toString(),
      };

    case 'get_server_info':
      return {
        platform: process.platform,
        nodeVersion: process.version,
        architecture: process.arch,
      };

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
