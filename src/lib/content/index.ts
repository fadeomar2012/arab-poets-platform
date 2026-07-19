import { events, people } from "./mock-data";
import type { Event, Person } from "./types";

export async function getEvents(): Promise<Event[]> {
  return structuredClone(events);
}

export async function getEventBySlug(slug: string): Promise<Event | null> {
  return structuredClone(events.find((event) => event.slug === slug) ?? null);
}

export async function getPeople(): Promise<Person[]> {
  return structuredClone(people.filter((person) => person.visible));
}

export async function getPersonBySlug(slug: string): Promise<Person | null> {
  return structuredClone(people.find((person) => person.slug === slug && person.visible) ?? null);
}

export async function getPeopleBySlugs(slugs: string[]): Promise<Person[]> {
  return structuredClone(people.filter((person) => slugs.includes(person.slug)));
}
