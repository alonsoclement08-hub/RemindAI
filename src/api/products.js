import client from './client';

export const productsAPI = {
  async getPriceComparison(productName) {
    const { data } = await client.get('/products/price-comparison', {
      params: { product: productName },
    });
    return data;
  },

  async whereToBuy(productName, lat, lng) {
    const { data } = await client.get('/products/where-to-buy', {
      params: { product: productName, lat, lng },
    });
    return data;
  },
};
