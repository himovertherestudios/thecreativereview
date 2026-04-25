import { UserProfile, ReviewRequest, Critique, Vent } from './types';

export const FAKE_USER: UserProfile = {
  id: 'u1',
  displayName: 'Alex Rivers',
  username: 'arivers_clicks',
  role: 'Photographer',
  city: 'Brooklyn, NY',
  experienceLevel: 'Professional',
  bio: 'Chasing light and shadows. Mostly boudoir and street editorial. Here to grow and help others get better.',
  isSupporter: true,
  avatarUrl: 'https://picsum.photos/seed/alex/200/200',
  website: 'https://himoverthere.com',
};

export const FAKE_CREATORS: UserProfile[] = [
  {
    id: 'u1',
    displayName: 'Alex Rivers',
    username: 'arivers_clicks',
    role: 'Photographer',
    city: 'Brooklyn, NY',
    experienceLevel: 'Professional',
    bio: 'Chasing light and shadows. Mostly boudoir and street editorial.',
    isSupporter: true,
    avatarUrl: 'https://picsum.photos/seed/alex/200/200',
  },
  {
    id: 'u2',
    displayName: 'Maya Voss',
    username: 'mayavossmua',
    role: 'Makeup Artist',
    city: 'Chicago, IL',
    experienceLevel: 'Advanced',
    bio: 'Editorial glam, skin work, and dramatic color stories.',
    isSupporter: false,
    avatarUrl: 'https://picsum.photos/seed/maya/200/200',
  },
  {
    id: 'u3',
    displayName: 'Nova Saint',
    username: 'novasaintmodel',
    role: 'Model',
    city: 'Atlanta, GA',
    experienceLevel: 'Intermediate',
    bio: 'Movement, mood, and portfolio building.',
    isSupporter: false,
    avatarUrl: 'https://picsum.photos/seed/nova/200/200',
  },
  {
    id: 'u4',
    displayName: 'Kai Monroe',
    username: 'kaimonroestudios',
    role: 'Other',
    city: 'Los Angeles, CA',
    experienceLevel: 'Professional',
    bio: 'Creative director and set designer building visual worlds.',
    isSupporter: true,
    avatarUrl: 'https://picsum.photos/seed/kai/200/200',
  },
];

export const RECENT_REVIEWS: ReviewRequest[] = [
  {
    id: 'r1',
    creatorId: 'u1',
    creatorName: 'Alex Rivers',
    creatorUsername: 'arivers_clicks',
    creatorRole: 'Photographer',
    imageUrl: 'https://picsum.photos/seed/critique1/800/1000',
    caption: 'Trying a new lighting setup for this boudoir set. Felt a bit too harsh?',
    contentRating: 'Suggestive',
    feedbackCategories: ['Lighting', 'Composition', 'Posing'],
    honestyLevel: 'Cook Me Respectfully',
    allowAnonymous: true,
    createdAt: '2024-03-20T10:00:00Z',
    reviewCount: 12,
  },
  {
    id: 'r2',
    creatorId: 'u2',
    creatorName: 'Maya Voss',
    creatorUsername: 'mayavossmua',
    creatorRole: 'Makeup Artist',
    imageUrl: 'https://picsum.photos/seed/critique2/800/1000',
    caption: 'MUA look for a cyberpunk editorial. Did I overdo the highlights?',
    contentRating: 'Safe',
    feedbackCategories: ['Texture', 'Color Palette', 'Skin Finish'],
    honestyLevel: 'Be Honest',
    allowAnonymous: false,
    createdAt: '2024-03-21T14:30:00Z',
    reviewCount: 4,
  },
  {
    id: 'r3',
    creatorId: 'u3',
    creatorName: 'Nova Saint',
    creatorUsername: 'novasaintmodel',
    creatorRole: 'Model',
    imageUrl: 'https://picsum.photos/seed/critique3/800/1200',
    caption: "Self-portrait from my latest series 'Isolated'.",
    contentRating: 'Explicit',
    feedbackCategories: ['Concept', 'Mood', 'Expression'],
    honestyLevel: 'Be Gentle',
    allowAnonymous: true,
    createdAt: '2024-03-19T08:15:00Z',
    reviewCount: 24,
  },
  {
    id: 'r4',
    creatorId: 'u4',
    creatorName: 'Kai Monroe',
    creatorUsername: 'kaimonroestudios',
    creatorRole: 'Other',
    imageUrl: 'https://picsum.photos/seed/critique4/800/1000',
    caption: 'Built a small set in my living room. Does the concept read or is it doing too much?',
    contentRating: 'Safe',
    feedbackCategories: ['Concept', 'Styling', 'Set Design'],
    honestyLevel: 'Cook Me Respectfully',
    allowAnonymous: true,
    createdAt: '2024-03-22T09:30:00Z',
    reviewCount: 8,
  },
];

export const FAKE_VENTS: Vent[] = [
  {
    id: 'v1',
    userId: 'u4',
    content:
      "When the client says 'I'll know what I want when I see it' after I've already sent 4 moodboards. Eye. Twitch.",
    isAnonymous: false,
    createdAt: '2024-03-22T09:00:00Z',
    upvotes: 42,
  },
  {
    id: 'v2',
    userId: 'anon',
    content:
      "Photographers who don't send individual credits for the whole team when they post. It's 2024, grow up.",
    isAnonymous: true,
    createdAt: '2024-03-22T11:45:00Z',
    upvotes: 89,
  },
];

export const FAKE_CRITIQUES: Critique[] = [
  {
    id: 'c1',
    requestId: 'r1',
    reviewerId: 'u5',
    isAnonymous: false,
    whatWorks:
      'The contrast is actually your strongest asset here. It creates deep mood.',
    whatNeedsWork:
      'The hand placement on the left feels a bit forced, breaking the flow.',
    quickFix:
      'Try cropping in tighter on the torso to hide the awkward hand tension.',
    portfolioReady: 'Almost',
    rating: 4,
    createdAt: '2024-03-20T12:00:00Z',
  },
];