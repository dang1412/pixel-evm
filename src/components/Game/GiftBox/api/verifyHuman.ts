import { Address } from 'viem'

import { TurnstileRef } from '@/components/Turnstile'

interface VerifyHumanResponse {
  success: boolean;
  signData?: {
    user: Address
    deadline: number
    signature: `0x${string}`
  };
  error?: string;
}

const apiUrl = 'https://api.pixelonbase.com'

export async function verifyHuman(address: Address, token: string) {
  const response = await fetch(`${apiUrl}/verifyHuman`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ address, token }),
  });

  if (!response.ok) {
    throw new Error('Network response was not ok');
  }

  const data = await response.json();
  return data as VerifyHumanResponse;
}

export async function generateTurnstileAndVerify(ref: TurnstileRef, address: Address) {
  const token = await ref.execute()
  const rs = await verifyHuman(address, token)

  return rs.signData
}
