// Seed demo events for Beaconsfield community
import { storage } from './storage.js';

async function seedEvents() {
  console.log('🌱 Seeding community events...');

  const demoEvents = [
    {
      id: 'evt_demo_1',
      title: 'Beaconsfield Dog Walk & Coffee',
      date: '2025-12-12',
      time: '10:00',
      location: 'Beaconsfield Old Town',
      city: 'Beaconsfield',
      postcode: 'HP9',
      description: 'Join us for a relaxed group walk through the old town followed by coffee.',
      createdBy: 'demo_user'
    },
    {
      id: 'evt_demo_2',
      title: 'Puppy Socialisation Hour',
      date: '2025-12-15',
      time: '14:00',
      location: 'Beaconsfield Memorial Park',
      city: 'Beaconsfield',
      postcode: 'HP9',
      description: 'Puppies under 6 months welcome for supervised play and socialisation.',
      createdBy: 'demo_user'
    },
    {
      id: 'evt_demo_3',
      title: 'Pet First Aid Workshop',
      date: '2025-12-20',
      time: '18:30',
      location: 'Beaconsfield Community Centre',
      city: 'Beaconsfield',
      postcode: 'HP9',
      description: 'Learn essential first aid for pets. Vet-led session. £5 donation suggested.',
      createdBy: 'demo_user'
    }
  ];

  for (const eventData of demoEvents) {
    const existing = await storage.getEvent(eventData.id);
    if (!existing) {
      await storage.createEvent(eventData);
      console.log(`✓ Created event: ${eventData.title}`);
      
      // Add some demo RSVPs
      if (eventData.id === 'evt_demo_1') {
        await storage.createEventRsvp(eventData.id, 'user_1');
        await storage.createEventRsvp(eventData.id, 'user_2');
        await storage.createEventRsvp(eventData.id, 'user_3');
      }
      if (eventData.id === 'evt_demo_2') {
        for (let i = 1; i <= 7; i++) {
          await storage.createEventRsvp(eventData.id, `user_${i}`);
        }
      }
      if (eventData.id === 'evt_demo_3') {
        for (let i = 1; i <= 12; i++) {
          await storage.createEventRsvp(eventData.id, `user_${i}`);
        }
      }
    } else {
      console.log(`⏭  Skipped (already exists): ${eventData.title}`);
    }
  }

  console.log('✅ Event seeding complete!');
  process.exit(0);
}

seedEvents().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
