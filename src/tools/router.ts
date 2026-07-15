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

  // Google Workspace Matchers
  const gmailMatch = message.match(/(?:send email|send gmail|email|mail)\s+(?:to\s+)?(\S+@\S+)\s+(?:saying|subject|with|body)\s+(.+)/i);
  const driveCreateMatch = message.match(/(?:create|add|make)\s+(?:file|folder|document|doc|sheet|spreadsheet|slide|presentation|form)\s+([^\n\r]+?)\s+(?:in|on|to)\s+(?:drive|google drive)/i);
  const taskCreateMatch = message.match(/(?:add|create|new)\s+(?:google task)\s+(?:to\s+)?([^\n\r]+)/i);
  const calendarCreateMatch = message.match(/(?:schedule|create|add)\s+(?:google calendar|calendar event)\s+([^\n\r]+?)\s+(?:on|at)\s+([^\n\r]+)/i);
  const meetCreateMatch = message.match(/(?:schedule|create|generate|make)\s+(?:google meet|meet call|meet link)\s+([^\n\r]+)/i);
  const sheetsMatch = message.match(/(?:add row|append sheet|write sheet|update sheet)\s+(?:to\s+)?([^\n\r]+)/i);
  const contactMatch = message.match(/(?:add contact|create contact|new contact)\s+([^\n\r]+?)\s+(?:with email|email)\s+(\S+@\S+)/i);
  const keepMatch = message.match(/(?:create keep note|add keep note|new keep note)\s+([^\n\r]+)/i);

  const switchTabMatch = message.match(/(?:switch to|open|go to|show|view|navigate to)\s+(?:the\s+)?(chat|browser|code|cookbook|recipes|files|documents|games|home|dashboard|images|canvas|maps|gps|music|spotify|settings|secrets|sports|scoreboard|utilities|tools|calendar|schedule)/i);

  if (gmailMatch) {
    return {
      id: Math.random().toString(),
      type: 'workspace_gmail_send',
      label: 'GMAIL INBOX: Dispatch Email',
      description: `Send email to ${gmailMatch[1]} saying: "${gmailMatch[2]}"`,
      payload: { to: gmailMatch[1], subject: 'Portal System Auto Dispatch', body: gmailMatch[2] }
    };
  } else if (driveCreateMatch) {
    const rawName = driveCreateMatch[1].trim();
    let mimeType = 'text/plain';
    const lower = message.toLowerCase();
    if (lower.includes('sheet') || lower.includes('spreadsheet')) {
      mimeType = 'application/vnd.google-apps.spreadsheet';
    } else if (lower.includes('doc') || lower.includes('document')) {
      mimeType = 'application/vnd.google-apps.document';
    } else if (lower.includes('slide') || lower.includes('presentation')) {
      mimeType = 'application/vnd.google-apps.presentation';
    } else if (lower.includes('form')) {
      mimeType = 'application/vnd.google-apps.form';
    }
    return {
      id: Math.random().toString(),
      type: 'workspace_drive_create',
      label: 'GOOGLE DRIVE: Create Workspace Asset',
      description: `Create Drive item "${rawName}" of type "${mimeType}"`,
      payload: { name: rawName, mimeType }
    };
  } else if (taskCreateMatch) {
    return {
      id: Math.random().toString(),
      type: 'workspace_task_create',
      label: 'GOOGLE TASKS: Create Task Directive',
      description: `Create task: "${taskCreateMatch[1]}"`,
      payload: { title: taskCreateMatch[1] }
    };
  } else if (calendarCreateMatch) {
    return {
      id: Math.random().toString(),
      type: 'workspace_calendar_create',
      label: 'GOOGLE CALENDAR: Schedule Event',
      description: `Schedule calendar event "${calendarCreateMatch[1]}" on ${calendarCreateMatch[2]}`,
      payload: { summary: calendarCreateMatch[1], dateStr: calendarCreateMatch[2] }
    };
  } else if (meetCreateMatch) {
    return {
      id: Math.random().toString(),
      type: 'workspace_meet_create',
      label: 'GOOGLE MEET: Schedule Video Session',
      description: `Schedule Meet call for event: "${meetCreateMatch[1]}"`,
      payload: { summary: meetCreateMatch[1] }
    };
  } else if (sheetsMatch) {
    return {
      id: Math.random().toString(),
      type: 'workspace_sheets_append',
      label: 'GOOGLE SHEETS: Append Spreadsheet Row',
      description: `Write data row: "${sheetsMatch[1]}"`,
      payload: { content: sheetsMatch[1] }
    };
  } else if (contactMatch) {
    return {
      id: Math.random().toString(),
      type: 'workspace_contact_create',
      label: 'GOOGLE CONTACTS: Save Connection Card',
      description: `Save contact "${contactMatch[1]}" with email "${contactMatch[2]}"`,
      payload: { name: contactMatch[1], email: contactMatch[2] }
    };
  } else if (keepMatch) {
    return {
      id: Math.random().toString(),
      type: 'workspace_keep_create',
      label: 'GOOGLE KEEP: Save Idea Note',
      description: `Save keep note: "${keepMatch[1]}"`,
      payload: { title: keepMatch[1] }
    };
  } else if (noteMatch) {
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
    case 'workspace_gmail_send': {
      const token = localStorage.getItem('google_access_token_temp');
      if (!token) throw new Error('Google Workspace sync is not connected. Please connect in Settings/Sync first.');
      if (token === 'mock-access-token') {
        return { ok: true, mock: true };
      }
      const { sendGmailEmail } = await import('../lib/firebaseWorkspace');
      const res = await sendGmailEmail(token, action.payload.to, action.payload.subject, action.payload.body);
      return { ok: true, data: res };
    }
    case 'workspace_drive_create': {
      const token = localStorage.getItem('google_access_token_temp');
      if (!token) throw new Error('Google Workspace sync is not connected. Please connect in Settings/Sync first.');
      if (token === 'mock-access-token') {
        return { ok: true, mock: true };
      }
      const { createGoogleDriveFile } = await import('../lib/firebaseWorkspace');
      const res = await createGoogleDriveFile(token, action.payload.name, action.payload.mimeType);
      return { ok: true, data: res };
    }
    case 'workspace_task_create': {
      const token = localStorage.getItem('google_access_token_temp');
      if (!token) throw new Error('Google Workspace sync is not connected. Please connect in Settings/Sync first.');
      if (token === 'mock-access-token') {
        return { ok: true, mock: true };
      }
      const { createGoogleTask } = await import('../lib/firebaseWorkspace');
      const res = await createGoogleTask(token, action.payload.title);
      return { ok: true, data: res };
    }
    case 'workspace_calendar_create': {
      const token = localStorage.getItem('google_access_token_temp');
      if (!token) throw new Error('Google Workspace sync is not connected. Please connect in Settings/Sync first.');
      if (token === 'mock-access-token') {
        return { ok: true, mock: true };
      }
      const { createGoogleCalendarEvent } = await import('../lib/firebaseWorkspace');
      const date = new Date(action.payload.dateStr);
      const startIso = isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
      const endIso = new Date(new Date(startIso).getTime() + 3600000).toISOString();
      const res = await createGoogleCalendarEvent(token, action.payload.summary, startIso, endIso, false);
      return { ok: true, data: res };
    }
    case 'workspace_meet_create': {
      const token = localStorage.getItem('google_access_token_temp');
      if (!token) throw new Error('Google Workspace sync is not connected. Please connect in Settings/Sync first.');
      if (token === 'mock-access-token') {
        return { ok: true, mock: true };
      }
      const { createGoogleCalendarEvent } = await import('../lib/firebaseWorkspace');
      const startIso = new Date().toISOString();
      const endIso = new Date(Date.now() + 3600000).toISOString();
      const res = await createGoogleCalendarEvent(token, action.payload.summary, startIso, endIso, true);
      return { ok: true, data: res };
    }
    case 'workspace_sheets_append': {
      const token = localStorage.getItem('google_access_token_temp');
      if (!token) throw new Error('Google Workspace sync is not connected. Please connect in Settings/Sync first.');
      if (token === 'mock-access-token') {
        return { ok: true, mock: true };
      }
      const { appendGoogleSheetRow } = await import('../lib/firebaseWorkspace');
      const res = await appendGoogleSheetRow(token, 'primary', 'Sheet1!A:B', [[action.payload.content, new Date().toLocaleString()]]);
      return { ok: true, data: res };
    }
    case 'workspace_contact_create': {
      const token = localStorage.getItem('google_access_token_temp');
      if (!token) throw new Error('Google Workspace sync is not connected. Please connect in Settings/Sync first.');
      if (token === 'mock-access-token') {
        return { ok: true, mock: true };
      }
      const { createGoogleContact } = await import('../lib/firebaseWorkspace');
      const res = await createGoogleContact(token, action.payload.name, action.payload.email);
      return { ok: true, data: res };
    }
    case 'workspace_keep_create': {
      const token = localStorage.getItem('google_access_token_temp');
      if (!token) throw new Error('Google Workspace sync is not connected. Please connect in Settings/Sync first.');
      if (token === 'mock-access-token') {
        return { ok: true, mock: true };
      }
      const { createGoogleDriveFile } = await import('../lib/firebaseWorkspace');
      const res = await createGoogleDriveFile(token, `Keep Note: ${action.payload.title}`, 'text/plain', 'Saved from Keep');
      return { ok: true, data: res };
    }
    default:
      return { ok: false, error: 'Unknown tool type' };
  }
}
