// Demo data seeding utility (guarded by localStorage flag)
export function seedDemo() {
  const seeded = localStorage.getItem('pt_seeded');
  if (seeded) {
    console.log('Demo data already seeded');
    return;
  }

  // Seed a demo companion with services and availability
  const demoCompanion = {
    id: 's_demo_seed',
    name: 'Emma Thompson',
    city: 'Beaconsfield',
    postcode: 'HP9',
    rating: 4.8,
    reviews: 12,
    tier: 'PREMIUM',
    bio: 'Experienced pet companion with over 5 years caring for dogs and cats. Certified in pet first aid and insured. I love long walks and playtime!',
    services: [
      { key: 'walk30', label: '30min Walk', at: 'owner', price: '15', per: 'walk', extraPet: '5' },
      { key: 'daycare', label: 'Day Care', at: 'sitter', price: '35', per: 'day', extraPet: '10' }
    ],
    availability: {
      unavailable: [] // All dates available
    },
    verification: { pro: true }
  };

  // Seed a community event
  const demoEvent = {
    id: 'e_demo_seed',
    name: 'Weekend Dog Walk Meetup',
    locality: 'HP9',
    description: 'Join us for a friendly dog walk through the local park! All breeds welcome.',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Next week
    attendees: ['demo@example.com'],
    rsvps: 1
  };

  // Store in appropriate places (this is a stub - actual storage would depend on backend)
  localStorage.setItem('pt_demo_companion', JSON.stringify(demoCompanion));
  localStorage.setItem('pt_demo_event', JSON.stringify(demoEvent));
  localStorage.setItem('pt_seeded', 'true');
  
  console.log('Demo data seeded successfully:', { demoCompanion, demoEvent });
}

export function resetDemoData() {
  localStorage.removeItem('pt_seeded');
  localStorage.removeItem('pt_demo_companion');
  localStorage.removeItem('pt_demo_event');
  console.log('Demo data reset - will reseed on next app load');
  // Force reload to reseed
  window.location.reload();
}
