
'use server';

import { promises as fs } from 'fs';
import path from 'path';
import * as C from './constants';

export type LogLevel = 'info' | 'warn' | 'error';

export type LogEntry = {
  id: string;
  timestamp: string;
  level: LogLevel;
  context: string;
  message: string;
};

const dataDir = path.join(process.cwd(), C.DATA_DIR);
const logFilePath = path.join(dataDir, C.LOGS_STORAGE_KEY);


// Function to get all logs from the JSON file
export async function getLogs(): Promise<LogEntry[]> {
  try {
    await fs.access(logFilePath);
    const fileContent = await fs.readFile(logFilePath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    // If the file doesn't exist or is empty, return an empty array
    return [];
  }
}

// Function to add a new log entry
export async function addLog(level: LogLevel, context: string, message: string): Promise<void> {
  const logs = await getLogs();
  const newLog: LogEntry = {
    id: new Date().toISOString() + Math.random(),
    timestamp: new Date().toISOString(),
    level,
    context,
    message,
  };
  
  // Keep the log size manageable, e.g., max 100 entries
  const updatedLogs = [newLog, ...logs].slice(0, 100);

  try {
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(logFilePath, JSON.stringify(updatedLogs, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to save log to file:', error);
  }
}

// Function to clear all logs
export async function clearLogs(): Promise<void> {
  try {
    await fs.writeFile(logFilePath, JSON.stringify([], null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to clear logs file:', error);
  }
}
