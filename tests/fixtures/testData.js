export const mockUser = {
  name: 'Test Agent',
  email: 'testagent@example.com',
  password: 'Password123',
  role: 'agent',
  phone: '03001234567'
};

export const mockProperty = {
  title: 'Test Villa',
  description: 'A beautiful 10 marla test villa with ample parking, nice views, and great neighborhood for a large family.',
  price: 25000000,
  type: 'House',
  category: 'residential',
  purpose: 'sale',
  bedrooms: 4,
  bathrooms: 4,
  area: { value: 10, unit: 'marla' },
  location: { address: 'Street 1', area: 'DHA', city: 'Lahore' },
  status: 'available',
  images: [{ url: 'http://example.com/img.jpg' }],
  thumbnail: 'http://example.com/img.jpg',
  contactInfo: { name: 'Test Agent', phone: '03001234567', email: 'testagent@example.com' }
};

export const invalidUser = {
  name: '', // missing required
  email: 'not-an-email',
  password: '123' // too short
};
