import { store } from '../storage/localStore';

export interface Note {
  id: string;
  title: string;
  content: string;
  time: string;
}

export function saveNote(text: string, currentNotes: Note[]) {
  const title = text.slice(0, 30);
  const newNote: Note = {
    id: Math.random().toString(),
    title,
    content: `# ${title}\n${text}`,
    time: 'Just now'
  };
  const updatedNotes = [newNote, ...currentNotes];
  store.set('pecos_notes', updatedNotes);
  return { ok: true, updatedNotes, newNote };
}
