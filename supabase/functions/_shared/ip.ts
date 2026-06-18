import { getServiceClient } from './supabase.ts'

export async function checkIpWhitelist(
  clientIp: string
): Promise<{ allowed: boolean; message?: string }> {
  const supabase = getServiceClient()

  const { data: whitelist } = await supabase
    .from('ip_whitelist')
    .select('ip_range')
    .eq('is_active', true)

  if (!whitelist || whitelist.length === 0) {
    return { allowed: true }
  }

  for (const entry of whitelist) {
    if (ipInCidr(clientIp, entry.ip_range)) {
      return { allowed: true }
    }
  }

  return {
    allowed: false,
    message: 'Check-in is restricted to approved office networks.',
  }
}

function ipInCidr(ip: string, cidr: string): boolean {
  try {
    const [rangeIp, bitsStr] = cidr.split('/')
    const bits = parseInt(bitsStr, 10)

    const ipInt = ipToInt(ip)
    const rangeInt = ipToInt(rangeIp)

    if (ipInt === null || rangeInt === null) return false

    const mask = bits === 0 ? 0 : ~0 << (32 - bits)
    return (ipInt & mask) === (rangeInt & mask)
  } catch {
    return false
  }
}

function ipToInt(ip: string): number | null {
  const parts = ip.split('.').map(Number)
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return null
  }
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0
}
