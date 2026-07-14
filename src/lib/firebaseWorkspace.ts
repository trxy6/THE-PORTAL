import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, signOut } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App securely
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// In-memory cache for Google OAuth Access Token
let cachedAccessToken: string | null = null;
let isSigningIn = false;

/**
 * Initializes the auth listener to watch the sign-in state
 */
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      // Check if we already have the token cached in memory
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else {
        // If logged in but token missing from memory (e.g. refresh), check localStorage as fallback or wait for sign-in
        const savedToken = localStorage.getItem('google_access_token_temp');
        if (savedToken) {
          cachedAccessToken = savedToken;
          if (onAuthSuccess) onAuthSuccess(user, savedToken);
        } else if (!isSigningIn) {
          cachedAccessToken = null;
          if (onAuthFailure) onAuthFailure();
        }
      }
    } else {
      cachedAccessToken = null;
      localStorage.removeItem('google_access_token_temp');
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Executes standard popup-based Google Auth with all configured scopes
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  const provider = new GoogleAuthProvider();
  
  // Add required Google Workspace scopes (EXCLUDING the invalid Google Keep scope)
  provider.addScope('https://www.googleapis.com/auth/drive.readonly');
  provider.addScope('https://www.googleapis.com/auth/spreadsheets.readonly');
  provider.addScope('https://www.googleapis.com/auth/documents.readonly');
  provider.addScope('https://www.googleapis.com/auth/gmail.modify');
  provider.addScope('https://www.googleapis.com/auth/chat.spaces.readonly');
  provider.addScope('https://www.googleapis.com/auth/chat.messages.create');
  provider.addScope('https://www.googleapis.com/auth/calendar');
  provider.addScope('https://www.googleapis.com/auth/tasks');
  provider.addScope('https://www.googleapis.com/auth/presentations.readonly');
  provider.addScope('https://www.googleapis.com/auth/forms.body.readonly');
  provider.addScope('https://www.googleapis.com/auth/forms.responses.readonly');
  provider.addScope('https://www.googleapis.com/auth/contacts');

  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to retrieve access token from Google Sign-In.');
    }

    cachedAccessToken = credential.accessToken;
    // We temporary cache in localStorage as secondary fallback during page reload transitions but clear it on sign out
    localStorage.setItem('google_access_token_temp', cachedAccessToken);
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Workspace Authentication Failed:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Returns active cached token
 */
export const getAccessToken = async (): Promise<string | null> => {
  if (cachedAccessToken) return cachedAccessToken;
  return localStorage.getItem('google_access_token_temp');
};

/**
 * Logs out and clears local caches
 */
export const logoutGoogle = async () => {
  await signOut(auth);
  cachedAccessToken = null;
  localStorage.removeItem('google_access_token_temp');
};

// ==========================================
// REAL CLIENT-SIDE GOOGLE WORKSPACE API CALLS
// ==========================================

async function fetchGoogleAPI(endpoint: string, token: string) {
  const response = await fetch(endpoint, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`API Error [${response.status}]: ${errText || response.statusText}`);
  }
  return response.json();
}

/**
 * Google Drive API: List files and folders
 */
export async function fetchGoogleDrive(token: string) {
  // Lists first 20 items (excluding specific internal clutter if possible)
  const url = `https://www.googleapis.com/drive/v3/files?pageSize=20&fields=files(id,name,mimeType,size,modifiedTime)&orderBy=modifiedTime desc`;
  const data = await fetchGoogleAPI(url, token);
  return data.files || [];
}

/**
 * Google Calendar API: Get list of events
 */
export async function fetchGoogleCalendar(token: string) {
  const now = new Date().toISOString();
  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(now)}&maxResults=15&orderBy=startTime&singleEvents=true`;
  const data = await fetchGoogleAPI(url, token);
  return data.items || [];
}

/**
 * Google Tasks API: Fetch user task lists and their tasks
 */
export async function fetchGoogleTasks(token: string) {
  try {
    const listUrl = `https://www.googleapis.com/tasks/v1/users/@me/lists`;
    const listsData = await fetchGoogleAPI(listUrl, token);
    const lists = listsData.items || [];
    
    if (lists.length === 0) return [];
    
    // Fetch items for primary/first list
    const primaryListId = lists[0].id;
    const tasksUrl = `https://www.googleapis.com/tasks/v1/lists/${primaryListId}/tasks?maxResults=20`;
    const tasksData = await fetchGoogleAPI(tasksUrl, token);
    return (tasksData.items || []).map((t: any) => ({
      ...t,
      listName: lists[0].title,
      listId: primaryListId
    }));
  } catch (err) {
    console.error('Error fetching Google Tasks:', err);
    return [];
  }
}

/**
 * Google Contacts (People API): Fetch connections
 */
export async function fetchGoogleContacts(token: string) {
  const url = `https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers&pageSize=30`;
  const data = await fetchGoogleAPI(url, token);
  return (data.connections || []).map((person: any) => {
    const nameObj = person.names?.[0] || {};
    const emailObj = person.emailAddresses?.[0] || {};
    const phoneObj = person.phoneNumbers?.[0] || {};
    return {
      resourceName: person.resourceName,
      displayName: nameObj.displayName || 'Unnamed Connection',
      email: emailObj.value || '',
      phone: phoneObj.value || ''
    };
  });
}

/**
 * Gmail API: Fetch list of recent messages and resolve detail snippets
 */
export async function fetchGmail(token: string) {
  const listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=8`;
  const listData = await fetchGoogleAPI(listUrl, token);
  const messages = listData.messages || [];
  
  const detailedMessages = [];
  for (const msg of messages) {
    try {
      const detailUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=minimal`;
      const detail = await fetchGoogleAPI(detailUrl, token);
      detailedMessages.push({
        id: detail.id,
        snippet: detail.snippet || '',
        threadId: detail.threadId
      });
    } catch (e) {
      console.warn('Skipping message detail error:', e);
    }
  }
  return detailedMessages;
}

/**
 * Google Chat API: Fetch user spaces list
 */
export async function fetchGoogleChatSpaces(token: string) {
  try {
    const url = `https://chat.googleapis.com/v1/spaces?pageSize=15`;
    const data = await fetchGoogleAPI(url, token);
    return data.spaces || [];
  } catch (e) {
    console.warn('Google Chat spaces fetch issue:', e);
    // Return empty array as fallback
    return [];
  }
}

/**
 * Google Sheets (Spreadsheets) & Docs: Fetch Google Drive lists representing spreadsheets & documents
 */
export async function fetchGoogleSheetsAndDocs(token: string) {
  const query = `mimeType = 'application/vnd.google-apps.spreadsheet' or mimeType = 'application/vnd.google-apps.document'`;
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&pageSize=15&fields=files(id,name,mimeType,modifiedTime)`;
  const data = await fetchGoogleAPI(url, token);
  return data.files || [];
}

/**
 * Google Slides, Forms, & Keep: Fetch presentations and forms
 */
export async function fetchGoogleSlidesAndForms(token: string) {
  const query = `mimeType = 'application/vnd.google-apps.presentation' or mimeType = 'application/vnd.google-apps.form'`;
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&pageSize=15&fields=files(id,name,mimeType,modifiedTime)`;
  const data = await fetchGoogleAPI(url, token);
  return data.files || [];
}

/**
 * Sends a message to a real Google Chat Space
 */
export async function sendGoogleChatMessage(token: string, spaceId: string, text: string) {
  const url = `https://chat.googleapis.com/v1/${spaceId}/messages`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ text })
  });
  if (!response.ok) {
    throw new Error(`Failed to send message to Chat Space: ${response.statusText}`);
  }
  return response.json();
}
