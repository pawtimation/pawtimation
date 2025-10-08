// Feature gating utility based on localStorage plan
// Plans: free, plus, premium

export function getUserPlan() {
  try {
    const plan = localStorage.getItem('pt_plan');
    return plan || 'free';
  } catch {
    return 'free';
  }
}

export function canAccessFeature(feature) {
  const plan = getUserPlan();
  
  const featureRequirements = {
    'ai-match': ['plus', 'premium'],
    'vet-chat': ['premium'],
    'live-tracking': ['plus', 'premium'],
    'unlimited-pets': ['plus', 'premium']
  };

  const requiredPlans = featureRequirements[feature] || [];
  return requiredPlans.includes(plan);
}

export function setUserPlan(plan) {
  if (['free', 'plus', 'premium'].includes(plan)) {
    localStorage.setItem('pt_plan', plan);
    // Dispatch custom event for same-tab reactivity
    window.dispatchEvent(new CustomEvent('planChanged', { detail: { plan } }));
  }
}
