import client from './client';

export const remindersAPI = {
  async list() {
    const { data } = await client.get('/reminders');
    // Server returns { pending, completed, archived }
    return data;
  },

  async create(reminder) {
    const { data } = await client.post('/reminders', reminder);
    return data;
  },

  async update(id, updates) {
    const { data } = await client.put(`/reminders/${id}`, updates);
    return data;
  },

  async complete(id) {
    const { data } = await client.patch(`/reminders/${id}/complete`);
    return data;
  },

  async archive(id) {
    const { data } = await client.patch(`/reminders/${id}/archive`);
    return data;
  },

  async restore(id) {
    const { data } = await client.patch(`/reminders/${id}/restore`);
    return data;
  },

  async remove(id) {
    const { data } = await client.delete(`/reminders/${id}`);
    return data;
  },
};
