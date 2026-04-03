
/**
 * @fileOverview Interface de Sincronia com Google Calendar API.
 * Permite que o Arquiteto visualize e agende treinos no mundo real.
 */

export async function listCalendarEvents(accessToken: string) {
  try {
    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=' + new Date().toISOString() + '&maxResults=10&orderBy=startTime&singleEvents=true', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error("Nexus: Erro ao ler agenda:", error);
    return [];
  }
}

export async function createWorkoutEvent(accessToken: string, title: string, description: string, durationMinutes: number) {
  const start = new Date();
  const end = new Date(start.getTime() + durationMinutes * 60000);

  const event = {
    'summary': `AURA SYSTEM: ${title}`,
    'description': description,
    'start': {
      'dateTime': start.toISOString(),
      'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    'end': {
      'dateTime': end.toISOString(),
      'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    'reminders': {
      'useDefault': false,
      'overrides': [
        {'method': 'popup', 'minutes': 10},
      ],
    },
    'colorId': '9' // Blueberry/Blue
  };

  try {
    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    });
    return await response.json();
  } catch (error) {
    console.error("Nexus: Erro ao agendar treino:", error);
    return null;
  }
}
