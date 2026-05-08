import client from './client';

export const remindersAPI = {
  async list() {
    const { data } = await client.get('/reminders');
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

  async remove(id) {
    const { data } = await client.delete(`/reminders/${id}`);
    return data;
  },
};
