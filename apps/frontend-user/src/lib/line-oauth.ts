export async function getLineToken(code: string) {
  console.log('Getting LINE token with code:', code)
  console.log('Using client_id:', process.env.LINE_CLIENT_ID)
  console.log('Using redirect_uri:', process.env.LINE_REDIRECT_URI)

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: process.env.LINE_CLIENT_ID!,
    client_secret: process.env.LINE_CLIENT_SECRET!,
    redirect_uri: process.env.LINE_REDIRECT_URI!,
  })

  const response = await fetch('https://api.line.me/oauth2/v2.1/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('LINE token error:', {
      status: response.status,
      statusText: response.statusText,
      error,
      params: Object.fromEntries(params)
    });
    throw new Error(`Failed to get LINE token: ${error.error} (${error.error_description || 'no description'})`);
  }

  const data = await response.json();
  console.log('LINE token response:', {
    hasIdToken: !!data.id_token,
    hasAccessToken: !!data.access_token
  });
  return data;
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
    }).toString(),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('LINE verify error:', error);
    throw new Error('Failed to verify LINE ID token');
  }

  const verifiedToken = await response.json();
  return {
    sub: verifiedToken.sub,
    name: verifiedToken.name,
    picture: verifiedToken.picture,
    email: verifiedToken.email
  };
} 