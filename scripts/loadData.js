// Temporary script to load data
// Will be replaced with proper data pipeline

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const dataPath = join(__dirname, '../datasets/algerian-revolution/events.json');
const events = JSON.parse(readFileSync(dataPath, 'utf-8'));

console.log(`📚 Loaded ${events.length} events from dataset`);
console.log(`📅 Date range: ${events[0]?.date} to ${events[events.length-1]?.date}`);