/**
 * @fileOverview Fitbit API Integration Interface.
 * Handles OAuth2 flow and biometric data retrieval for the Aura System.
 */

const FITBIT_CLIENT_ID = '23SHTR'; // Placeholder Client ID
const REDIRECT_URI = typeof window !== 'undefined' ? `${window.location.origin}/` : '';

export function getFitbitAuthUrl() {
  const scope = 'activity heartrate profile sleep weight';
  return `https://www.fitbit.com/oauth2/authorize?response_type=token&client_id=${FITBIT_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(scope)}&expires_in=604800`;
}

export async function fetchFitbitActivity(accessToken: string, userId: string) {
  try {
    const response = await fetch(`https://api.fitbit.com/1/user/${userId}/activities/date/today.json`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    return await response.json();
  } catch (error) {
    console.error("Nexus: Error fetching Fitbit activity:", error);
    return null;
  }
}

export function parseFitbitTokenFromUrl() {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  const accessToken = params.get('access_token');
  const userId = params.get('user_id');
  
  if (accessToken && userId) {
    return { accessToken, userId };
  }
  return null;
}