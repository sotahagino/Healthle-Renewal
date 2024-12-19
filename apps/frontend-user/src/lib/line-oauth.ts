export async function getLineToken(code: string) {
  const response = await fetch('https://api.line.me/oauth2/v2.1/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: process.env.LINE_CLIENT_ID!,
      client_secret: process.env.LINE_CLIENT_SECRET!,
      redirect_uri: process.env.LINE_REDIRECT_URI!,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error('Failed to get LINE token: ' + error.error);
  }

  return response.json();
}

export async function verifyLineIdToken(idToken: string) {
  const response = await fetch('https://api.line.me/oauth2/v2.1/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      id_token: idToken,
      client_id: process.env.LINE_CLIENT_ID!,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to verify LINE ID token');
  }

  const verifiedToken = await response.json();
  return {
    sub: verifiedToken.sub,
    name: verifiedToken.name,
    picture: verifiedToken.picture
  };
} 