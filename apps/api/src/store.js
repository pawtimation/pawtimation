export const db = { 
  users:{}, 
  pets:{}, 
  sitters:{
    'demo_s1': { id:'demo_s1', name:'Emma Richardson', tier:'VERIFIED', postcode:'HP20 1AA', bio:'Experienced dog walker with 5 years caring for all breeds. DBS checked, fully insured.', services:['Dog walking','Pet sitting','Home visits'], ratePerDay:3000, rating:4.9, reviews:42, photoUrl:'', reputation:95, totalBookings:87 },
    'demo_s2': { id:'demo_s2', name:'James Taylor', tier:'PREMIUM', postcode:'HP20 2BB', bio:'Professional pet carer with veterinary nursing background. Specialist in senior pets and medication administration.', services:['Dog walking','Pet sitting','Home visits','Overnight care','Medication'], ratePerDay:5000, rating:5.0, reviews:68, photoUrl:'', reputation:100, totalBookings:124 },
    'demo_s3': { id:'demo_s3', name:'Sophie Chen', tier:'TRAINEE', postcode:'HP20 3CC', bio:'Animal lover starting my pet sitting journey. Great with small dogs and cats.', services:['Dog walking','Pet sitting'], ratePerDay:2000, rating:4.7, reviews:12, photoUrl:'', reputation:78, totalBookings:15 },
    'demo_s4': { id:'demo_s4', name:'Marcus Johnson', tier:'VERIFIED', postcode:'HP20 4DD', bio:'Former dog trainer with expertise in behaviour and training. Patient with anxious pets.', services:['Dog walking','Pet sitting','Training support'], ratePerDay:3200, rating:4.8, reviews:35, photoUrl:'', reputation:88, totalBookings:52 },
    'demo_s5': { id:'demo_s5', name:'Lily Patel', tier:'TRAINEE', postcode:'HP20 5EE', bio:'University student who grew up with pets. Available evenings and weekends.', services:['Dog walking','Pet sitting','Home visits'], ratePerDay:1800, rating:4.6, reviews:8, photoUrl:'', reputation:72, totalBookings:9 },
  },
  invites:{}, 
  bookings:{}, 
  updates:{}, 
  agreements:{}, 
  cancellations:{},
  availability:{},
  bookingRequests:{}
};
