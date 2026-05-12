import client from './client';

export const productsAPI = {
  async getPriceComparison(productName) {
    const { data } = await client.get('/products/price-comparison', {
      params: { product: productName },
    });
    return data;
  },
};
