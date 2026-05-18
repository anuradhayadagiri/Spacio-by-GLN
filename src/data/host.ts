import type { Listing } from "@/data/listings";
import { LISTINGS } from "@/data/listings";

export interface HostListing extends Listing {
  status: "live" | "draft" | "paused";
  monthlyBookings: number;
  monthlyEarnings: number;
  occupancyPct: number;
}

export interface HostBookingRequest {
  id: string;
  listingId: string;
  guestName: string;
  guestAvatar: string;
  date: string;
  duration: string;
  guests: number;
  amount: number;
  status: "pending" | "approved" | "rejected" | "completed";
}

// Pretend the host owns these 4 listings
export const HOST_LISTINGS: HostListing[] = [
  { ...LISTINGS[0], status: "live", monthlyBookings: 38, monthlyEarnings: 51200, occupancyPct: 72 },
  { ...LISTINGS[1], status: "live", monthlyBookings: 12, monthlyEarnings: 96800, occupancyPct: 41 },
  { ...LISTINGS[4], status: "live", monthlyBookings: 84, monthlyEarnings: 134200, occupancyPct: 88 },
  { ...LISTINGS[2], status: "paused", monthlyBookings: 0, monthlyEarnings: 0, occupancyPct: 0 },
];

export const HOST_BOOKINGS: HostBookingRequest[] = [
  {
    id: "BK220914",
    listingId: "l1",
    guestName: "Riya Mehta",
    guestAvatar: "R",
    date: "Sat, 9 May · 4:00 PM",
    duration: "3 hr",
    guests: 6,
    amount: 1350,
    status: "pending",
  },
  {
    id: "BK220915",
    listingId: "l5",
    guestName: "Arjun K.",
    guestAvatar: "A",
    date: "Sun, 10 May · 8:30 PM",
    duration: "2 hr",
    guests: 4,
    amount: 3600,
    status: "pending",
  },
  {
    id: "BK220908",
    listingId: "l1",
    guestName: "Neha S.",
    guestAvatar: "N",
    date: "Wed, 6 May · 11:00 AM",
    duration: "4 hr",
    guests: 3,
    amount: 1800,
    status: "approved",
  },
  {
    id: "BK220877",
    listingId: "l5",
    guestName: "Dev P.",
    guestAvatar: "D",
    date: "Fri, 1 May · 7:00 PM",
    duration: "2 hr",
    guests: 8,
    amount: 7200,
    status: "completed",
  },
];

export const EARNINGS_BY_DAY = [
  { day: "Mon", value: 4200 },
  { day: "Tue", value: 3100 },
  { day: "Wed", value: 5800 },
  { day: "Thu", value: 6200 },
  { day: "Fri", value: 9400 },
  { day: "Sat", value: 12100 },
  { day: "Sun", value: 8800 },
];
