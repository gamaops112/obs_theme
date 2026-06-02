export function generateDemoToken(): string {
  const payload = {
    sub: 'demo_user',
    email: 'demo@obsadmin.io',
    role: 'admin',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400,
  }
  return btoa(JSON.stringify(payload))
}

export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token))
    return payload.exp < Math.floor(Date.now() / 1000)
  } catch {
    return true
  }
}
