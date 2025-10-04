export const db = { 
  users:{}, 
  pets:{}, 
  owners:{
    'test@example.com': { email:'test@example.com', enableFriendJobs: false }
  },
  sitters:{
    'demo_s1': { id:'demo_s1', name:'Emma Richardson', tier:'VERIFIED', postcode:'HP20 1AA', bio:'Experienced dog walker with 5 years caring for all breeds. DBS checked, fully insured.', services:['Dog walking','Pet sitting','Home visits'], ratePerDay:3000, rating:4.9, reviews:42, photoUrl:'', reputation:95, totalBookings:87 },
    'demo_s2': { id:'demo_s2', name:'James Taylor', tier:'PREMIUM', postcode:'HP20 2BB', bio:'Professional pet carer with veterinary nursing background. Specialist in senior pets and medication administration.', services:['Dog walking','Pet sitting','Home visits','Overnight care','Medication'], ratePerDay:5000, rating:5.0, reviews:68, photoUrl:'', reputation:100, totalBookings:124 },
    'demo_s3': { id:'demo_s3', name:'Sophie Chen', tier:'TRAINEE', postcode:'HP20 3CC', bio:'Animal lover starting my pet sitting journey. Great with small dogs and cats.', services:['Dog walking','Pet sitting'], ratePerDay:2000, rating:4.7, reviews:12, photoUrl:'', reputation:78, totalBookings:15 },
    'demo_s4': { id:'demo_s4', name:'Marcus Johnson', tier:'VERIFIED', postcode:'HP20 4DD', bio:'Former dog trainer with expertise in behaviour and training. Patient with anxious pets.', services:['Dog walking','Pet sitting','Training support'], ratePerDay:3200, rating:4.8, reviews:35, photoUrl:'', reputation:88, totalBookings:52 },
    'demo_s5': { id:'demo_s5', name:'Lily Patel', tier:'TRAINEE', postcode:'HP20 5EE', bio:'University student who grew up with pets. Available evenings and weekends.', services:['Dog walking','Pet sitting','Home visits'], ratePerDay:1800, rating:4.6, reviews:8, photoUrl:'', reputation:72, totalBookings:9 },
  },
  invites:{}, 
  bookings:{
    'demo_b1': { id:'demo_b1', ownerEmail:'test@example.com', sitterId:'demo_s1', sitterName:'Emma Thompson', petName:'Max', startDate:'2025-09-15', endDate:'2025-09-20', ratePerDay:2500, total:12500, status:'COMPLETED', completedAt:'2025-09-21T10:00:00Z' },
    'demo_b2': { id:'demo_b2', ownerEmail:'test@example.com', sitterId:'demo_s2', sitterName:'James Wilson', petName:'Max', startDate:'2025-09-01', endDate:'2025-09-08', ratePerDay:4500, total:31500, status:'COMPLETED', completedAt:'2025-09-09T10:00:00Z' },
    'demo_b3': { id:'demo_b3', ownerEmail:'test@example.com', sitterId:'demo_s1', sitterName:'Emma Thompson', petName:'Max', startDate:'2025-08-10', endDate:'2025-08-17', ratePerDay:2500, total:17500, status:'COMPLETED', completedAt:'2025-08-18T10:00:00Z' },
    'demo_b4': { id:'demo_b4', ownerEmail:'test@example.com', sitterId:'demo_s1', sitterName:'Emma Thompson', petName:'Max', startDate:'2025-07-05', endDate:'2025-07-10', ratePerDay:2500, total:12500, status:'COMPLETED', completedAt:'2025-07-11T10:00:00Z' },
    'demo_b5': { id:'demo_b5', ownerEmail:'test@example.com', sitterId:'demo_s2', sitterName:'James Wilson', petName:'Max', startDate:'2025-06-15', endDate:'2025-06-20', ratePerDay:4500, total:22500, status:'COMPLETED', completedAt:'2025-06-21T10:00:00Z' },
    'demo_b6': { id:'demo_b6', ownerEmail:'test@example.com', sitterId:'demo_s1', sitterName:'Emma Thompson', petName:'Max', startDate:'2025-05-10', endDate:'2025-05-15', ratePerDay:2500, total:12500, status:'COMPLETED', completedAt:'2025-05-16T10:00:00Z' },
    'demo_b7': { id:'demo_b7', ownerEmail:'test@example.com', sitterId:'demo_s1', sitterName:'Emma Thompson', petName:'Max', startDate:'2025-04-01', endDate:'2025-04-05', ratePerDay:2500, total:10000, status:'COMPLETED', completedAt:'2025-04-06T10:00:00Z' },
    'demo_b8': { id:'demo_b8', ownerEmail:'test@example.com', sitterId:'demo_s2', sitterName:'James Wilson', petName:'Max', startDate:'2025-03-15', endDate:'2025-03-20', ratePerDay:4500, total:22500, status:'COMPLETED', completedAt:'2025-03-21T10:00:00Z' },
    'demo_b9': { id:'demo_b9', ownerEmail:'test@example.com', sitterId:'demo_s1', sitterName:'Emma Thompson', petName:'Max', startDate:'2025-02-10', endDate:'2025-02-15', ratePerDay:2500, total:12500, status:'COMPLETED', completedAt:'2025-02-16T10:00:00Z' },
    'demo_b10': { id:'demo_b10', ownerEmail:'test@example.com', sitterId:'demo_s1', sitterName:'Emma Thompson', petName:'Max', startDate:'2025-01-05', endDate:'2025-01-10', ratePerDay:2500, total:12500, status:'COMPLETED', completedAt:'2025-01-11T10:00:00Z' },
  }, 
  updates:{
    'demo_b1': [],
    'demo_b2': [],
    'demo_b3': [],
    'demo_b4': [],
    'demo_b5': [],
    'demo_b6': [],
    'demo_b7': [],
    'demo_b8': [],
    'demo_b9': [],
    'demo_b10': []
  }, 
  agreements:{}, 
  cancellations:{},
  availability:{},
  bookingRequests:{},
  ownerPreferences:{},
  incidents:{},
  strikes:{},
  milestones:{},
  addresses:{}
};
