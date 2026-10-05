import { unzipSync, strFromU8 } from 'fflate';

// Google Calendar exports a .zip with one .ics per calendar. Everything stays in memory.

const MAX_FILE_BYTES = 50 * 1024 * 1024;

export class CalendarFileError extends Error {}

export async function readCalendarFile(file: File): Promise<string[]> {
  if (file.size > MAX_FILE_BYTES) throw new CalendarFileError('File is too large.');
  const bytes = new Uint8Array(await file.arrayBuffer());
  const isZip = bytes[0] === 0x50 && bytes[1] === 0x4b; // "PK"

  if (!isZip) {
    const text = strFromU8(bytes);
    if (!text.includes('BEGIN:VCALENDAR')) throw new CalendarFileError('Not a calendar file.');
    return [text];
  }

  const entries = unzipSync(bytes, { filter: (f) => f.name.toLowerCase().endsWith('.ics') });
  const texts = Object.values(entries)
    .map((u8) => strFromU8(u8))
    .filter((t) => t.includes('BEGIN:VCALENDAR'));
  if (texts.length === 0) throw new CalendarFileError('No .ics files in this zip.');
  return texts;
}
