export type CategorySlug =
  | "play"
  | "study"
  | "pro-spaces"
  | "party"
  | "experiences"
  | "parking"
  | "wellness"
  | "stays"
  | "dining";

export type BookingType = "hourly" | "daily" | "ticket" | "package";

export interface Listing {
  id: string;
  hostId?: string;
  title: string;
  category: CategorySlug;
  categoryLabel: string;
  location: string;
  approximateLocation?: string;
  distanceKm: number;
  rating: number;
  reviews: number;
  price: number;
  priceUnit: string;
  bookingType: BookingType;
  instantBook: boolean;
  amenities: string[];
  host: { name: string; rating: number; superhost: boolean };
  images: string[];
  description: string;
  latitude?: number;
  longitude?: number;
}

export const CATEGORIES: { slug: CategorySlug; label: string; emoji: string }[] = [
  { slug: "play", label: "Play", emoji: "🎮" },
  { slug: "study", label: "Study", emoji: "📚" },
  { slug: "pro-spaces", label: "Pro Spaces", emoji: "💼" },
  { slug: "party", label: "Party", emoji: "🎉" },
  { slug: "experiences", label: "Experiences", emoji: "🎟️" },
  { slug: "parking", label: "Parking", emoji: "🅿️" },
  { slug: "wellness", label: "Wellness", emoji: "🧘" },
  { slug: "stays", label: "Stays", emoji: "🛏️" },
  { slug: "dining", label: "Dining", emoji: "🍽️" },
];

const img = (id: string, w = 800) =>
  `https://images.unsplash.com/${id}?w=${w}&q=70&auto=format&fit=crop`;

export const LISTINGS: Listing[] = [
  {
    id: "l1",
    title: "The Glasshouse Studio",
    category: "pro-spaces",
    categoryLabel: "Pro Space",
    location: "Indiranagar, Bengaluru",
    distanceKm: 1.2,
    rating: 4.8,
    reviews: 214,
    price: 450,
    priceUnit: "hour",
    bookingType: "hourly",
    instantBook: true,
    amenities: ["Wi-Fi", "Whiteboard", "Coffee", "Projector", "AC"],
    host: { name: "Aarav", rating: 4.9, superhost: true },
    images: [
      img("photo-1497366216548-37526070297c"),
      img("photo-1524758631624-e2822e304c36"),
      img("photo-1497366811353-6870744d04b2"),
    ],
    description:
      "A bright glass-walled studio perfect for shoots, workshops, or focused team offsites.",
  },
  {
    id: "l2",
    title: "Skyline Rooftop",
    category: "party",
    categoryLabel: "Party",
    location: "MG Road, Bengaluru",
    distanceKm: 3.8,
    rating: 4.9,
    reviews: 432,
    price: 2200,
    priceUnit: "hour",
    bookingType: "hourly",
    instantBook: false,
    amenities: ["Bar", "Sound system", "Lounge", "Lights"],
    host: { name: "Skyline Co.", rating: 4.8, superhost: true },
    images: [
      img("photo-1519167758481-83f550bb49b3"),
      img("photo-1530103862676-de8c9debad1d"),
      img("photo-1492684223066-81342ee5ff30"),
    ],
    description:
      "An open-air rooftop with panoramic city views — ideal for birthdays and launch parties.",
  },
  {
    id: "l3",
    title: "Quiet Corner Library",
    category: "study",
    categoryLabel: "Study Room",
    location: "Koramangala, Bengaluru",
    distanceKm: 0.6,
    rating: 4.7,
    reviews: 178,
    price: 120,
    priceUnit: "hour",
    bookingType: "hourly",
    instantBook: true,
    amenities: ["Wi-Fi", "Power outlets", "Silent zone", "Coffee"],
    host: { name: "Quiet Co.", rating: 4.7, superhost: false },
    images: [
      img("photo-1521587760476-6c12a4b040da"),
      img("photo-1568667256549-094345857637"),
      img("photo-1481627834876-b7833e8f5570"),
    ],
    description:
      "A serene library with private cubicles, perfect for deep work and exam prep.",
  },
  {
    id: "l4",
    title: "Coastal Villa Retreat",
    category: "stays",
    categoryLabel: "Stay",
    location: "Gokarna, Karnataka",
    distanceKm: 540,
    rating: 4.95,
    reviews: 88,
    price: 8400,
    priceUnit: "night",
    bookingType: "daily",
    instantBook: false,
    amenities: ["Sea view", "Pool", "Breakfast", "Wi-Fi", "AC"],
    host: { name: "Maya", rating: 5.0, superhost: true },
    images: [
      img("photo-1499793983690-e29da59ef1c2"),
      img("photo-1507089947368-19c1da9775ae"),
      img("photo-1505691938895-1758d7feb511"),
    ],
    description:
      "A private villa overlooking the Arabian Sea — your weekend escape with full breakfast.",
  },
  {
    id: "l5",
    title: "Asado Wood-Fire Kitchen",
    category: "dining",
    categoryLabel: "Dining",
    location: "HSR Layout, Bengaluru",
    distanceKm: 4.4,
    rating: 4.6,
    reviews: 612,
    price: 1800,
    priceUnit: "for 2",
    bookingType: "package",
    instantBook: true,
    amenities: ["Outdoor seating", "Bar", "Vegan options", "Live music"],
    host: { name: "Asado", rating: 4.6, superhost: false },
    images: [
      img("photo-1517248135467-4c7edcad34c4"),
      img("photo-1414235077428-338989a2e8c0"),
      img("photo-1466978913421-dad2ebd01d17"),
    ],
    description:
      "Argentinian-inspired wood-fire dining. Reserve a table, split the bill, skip the queue.",
  },
  {
    id: "l6",
    title: "Sunday Sound Bath",
    category: "wellness",
    categoryLabel: "Wellness",
    location: "Jayanagar, Bengaluru",
    distanceKm: 5.1,
    rating: 4.85,
    reviews: 96,
    price: 800,
    priceUnit: "ticket",
    bookingType: "ticket",
    instantBook: true,
    amenities: ["Mats provided", "Tea", "Guided"],
    host: { name: "Calm Studio", rating: 4.9, superhost: true },
    images: [
      img("photo-1545205597-3d9d02c29597"),
      img("photo-1544367567-0f2fcb009e0b"),
      img("photo-1506126613408-eca07ce68773"),
    ],
    description:
      "A 75-minute guided sound bath with crystal bowls and herbal tea after the session.",
  },
  {
    id: "l7",
    title: "MG Road Secure Parking",
    category: "parking",
    categoryLabel: "Parking",
    location: "MG Road, Bengaluru",
    distanceKm: 3.6,
    rating: 4.5,
    reviews: 51,
    price: 60,
    priceUnit: "hour",
    bookingType: "hourly",
    instantBook: true,
    amenities: ["CCTV", "24/7", "Covered"],
    host: { name: "ParkRight", rating: 4.4, superhost: false },
    images: [
      img("photo-1506521781263-d8422e82f27a"),
      img("photo-1573348722427-f1d6819fdf98"),
    ],
    description: "Covered, CCTV-monitored parking right next to MG Road metro.",
  },
  {
    id: "l8",
    title: "Indie Comedy Night",
    category: "experiences",
    categoryLabel: "Experience",
    location: "Church Street, Bengaluru",
    distanceKm: 3.2,
    rating: 4.75,
    reviews: 304,
    price: 499,
    priceUnit: "ticket",
    bookingType: "ticket",
    instantBook: true,
    amenities: ["Bar", "Reserved seating"],
    host: { name: "OpenMic Co.", rating: 4.8, superhost: true },
    images: [
      img("photo-1527224538127-2104bb71c51b"),
      img("photo-1516280440614-37939bbacd81"),
    ],
    description:
      "Six rising comics, one packed house. Doors at 8, show at 8:30. Ticketed entry.",
  },
  {
    id: "l9",
    title: "Turf Arena 5-a-side",
    category: "play",
    categoryLabel: "Play",
    location: "Whitefield, Bengaluru",
    distanceKm: 9.2,
    rating: 4.7,
    reviews: 189,
    price: 1100,
    priceUnit: "hour",
    bookingType: "hourly",
    instantBook: true,
    amenities: ["Floodlights", "Changing rooms", "Parking"],
    host: { name: "TurfPro", rating: 4.6, superhost: false },
    images: [
      img("photo-1556056504-5c7696c4c28d"),
      img("photo-1459865264687-595d652de67e"),
    ],
    description: "FIFA-grade turf with floodlights — book by the hour for your squad.",
  },
];

export const getListing = (id: string) => LISTINGS.find((l) => l.id === id);
export const getListingsByCategory = (slug: CategorySlug) =>
  LISTINGS.filter((l) => l.category === slug);
