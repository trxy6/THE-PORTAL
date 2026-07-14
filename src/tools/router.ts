import { saveNote } from './notes';
import { scheduleEvent, createReminder } from './calendar';
import { chooseFile } from './files';
import { openBrowserSearch } from './browser';
import { githubCommit } from './github';

export function detectToolRequest(message: string, calendarSelectedDate: string): any | null {
  const noteMatch = message.match(/(?:save|add|make|create).*?\b(note|ante|nte|not)\b.*?(?:that says|saying|:)?\s*(.+)/i);
  const scheduleMatch = message.match(/schedule\s+(.+)/i) || message.match(/calendar\s+(.+)/i);
  const remindMatch = message.match(/remind me.*?to\s+(.+)/i) || message.match(/add task\s+(.+)/i);
  const searchMatch = message.match(/(?:search for|search|google)\s+(.+)/i);
  const fileMatch = message.match(/(?:choose|select|open|pick)\s+(?:file|folder|document)/i);
  const commitMatch = message.match(/(?:commit|push|github|git\s+commit)/i);

  const switchTabMatch = message.match(/(?:switch to|open|go to|show|view|navigate to)\s+(?:the\s+)?(chat|browser|code|cookbook|recipes|files|documents|games|home|dashboard|images|canvas|maps|gps|music|spotify|settings|secrets|sports|scoreboard|utilities|tools|calendar|schedule)/i);

  if (noteMatch) {
    return {
      id: Math.random().toString(),
      type: 'create_note',
      label: 'ADD TO LOCAL MEMORY: Save Note',
      description: `Save on-device note: "${noteMatch[2]}"`,
      payload: { title: noteMatch[2].slice(0, 30), content: noteMatch[2] }
    };
  } else if (scheduleMatch) {
    return {
      id: Math.random().toString(),
      type: 'schedule_event',
      label: 'SCHEDULING PROTOCOL: Add Event to Calendar',
      description: `Schedule calendar event: "${scheduleMatch[1]}"`,
      payload: { date: calendarSelectedDate, text: scheduleMatch[1] }
    };
  } else if (remindMatch) {
    return {
      id: Math.random().toString(),
      type: 'create_reminder',
      label: 'ALARM TRIGGERS: Create Reminder / Task',
      description: `Add item to Today's Plan: "${remindMatch[1]}"`,
      payload: { text: remindMatch[1] }
    };
  } else if (searchMatch) {
    return {
      id: Math.random().toString(),
      type: 'open_browser_search',
      label: 'NETWORK BRIDGE: Search Web',
      description: `Open Google Search for: "${searchMatch[1]}"`,
      payload: { query: searchMatch[1] }
    };
  } else if (fileMatch) {
    return {
      id: Math.random().toString(),
      type: 'choose_file',
      label: 'FILE SYSTEM ACCESS: Open Local File Picker',
      description: 'Request device storage picker authorization.',
      payload: {}
    };
  } else if (commitMatch) {
    return {
      id: Math.random().toString(),
      type: 'github_commit',
      label: 'VERSION CONTROL: Commit & Push to GitHub',
      description: 'Compile and push current local database payload to active GitHub Portal.',
      payload: { commitMessage: 'Portal System Auto Sync' }
    };
  } else if (switchTabMatch) {
    const rawTab = switchTabMatch[1].toLowerCase();
    const tabMap: Record<string, string> = {
      chat: 'chat',
      browser: 'browser',
      code: 'code',
      cookbook: 'cookbook',
      recipes: 'cookbook',
      files: 'files',
      documents: 'files',
      games: 'games',
      home: 'home',
      dashboard: 'home',
      images: 'images',
      canvas: 'images',
      maps: 'maps',
      gps: 'maps',
      music: 'music',
      spotify: 'music',
      settings: 'settings',
      secrets: 'settings',
      sports: 'sports',
      scoreboard: 'sports',
      utilities: 'utilities',
      tools: 'utilities',
      calendar: 'calendar',
      schedule: 'calendar'
    };
    const targetTab = tabMap[rawTab] || 'home';
    return {
      id: Math.random().toString(),
      type: 'switch_tab',
      label: 'NAVIGATION: Switch Workspace View',
      description: `Switch active workspace tab to: ${targetTab.toUpperCase()}`,
      payload: { tab: targetTab }
    };
  }

  return null;
}

export async function runTool(action: any, context: {
  notes: any[];
  tasks: any[];
  calEvents: Record<string, string[]>;
}) {
  switch (action.type) {
    case 'create_note':
      return saveNote(action.payload.content, context.notes);
    case 'schedule_event':
      return scheduleEvent(action.payload.date, action.payload.text, context.calEvents);
    case 'create_reminder':
      return createReminder(action.payload.text, context.tasks);
    case 'open_browser_search':
      return openBrowserSearch(action.payload.query);
    case 'choose_file':
      return await chooseFile();
    case 'github_commit':
      return await githubCommit(action.payload.commitMessage);
    case 'switch_tab':
      return { ok: true, tab: action.payload.tab };
    default:
      return { ok: false, error: 'Unknown tool type' };
  }
}
