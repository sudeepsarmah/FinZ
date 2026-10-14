import type { Cadence, Direction, Emotion, Risk, Timeline } from "@/lib/catalog";

export type Profile = {
  name: string;
  takeHomeCents: number;
  cadence: Cadence;
  risk: Risk;
  createdAt: string;
};

export type Dream = {
  id: number;
  name: string;
  targetCents: number;
  why: string;
  timeline: Timeline;
  fundedCents: number;
  createdAt: string;
};

export type Entry = {
  id: number;
  amountCents: number;
  direction: Direction;
  label: string;
  emotion: Emotion;
  note: string;
  rawNote: string | null;
  createdAt: string;
};

export type Summary = {
  profile: Profile;
  period: {
    label: string;
    rangeLabel: string;
    cashInCents: number;
    cashOutCents: number;
    leftCents: number;
    paycheckLogged: boolean;
  };
  allTime: {
    cashInCents: number;
    cashOutCents: number;
    surplusCents: number;
    unassignedCents: number;
  };
  emotions: Array<{ slug: Emotion; count: number }>;
  dreams: Dream[];
  recent: Entry[];
  model: { id: string; online: boolean };
};

export type ParsedNote = {
  amount: number;
  direction: Direction;
  label: string;
  emotion: Emotion;
  note: string;
};

export type Reflection = {
  title: string;
  body: string;
};

export type Allocation = {
  emergencyPercent: number;
  cashPercent: number;
  indexPercent: number;
  headline: string;
  because: string;
};
