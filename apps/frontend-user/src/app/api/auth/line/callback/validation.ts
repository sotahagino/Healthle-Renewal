interface CallbackRequest {
  code: string
  state: string
}

export function validateCallbackRequest(body: any): CallbackRequest {
  if (!body?.code || typeof body.code !== 'string') {
    throw new Error('code is required')
  }
  if (!body?.state || typeof body.state !== 'string') {
    throw new Error('state is required')
  }

  return {
    code: body.code,
    state: body.state
  }
} 