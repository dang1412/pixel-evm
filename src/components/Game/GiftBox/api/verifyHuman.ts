import { Address } from 'viem'

interface VerifyHumanResponse {
  success: boolean;
  signData?: {
    user: Address
    deadline: number
    signature: `0x${string}`
  };
  error?: string;
}

export async function verifyHuman(address: Address, token: string) {
  const response = await fetch('http://localhost:8080/verifyHuman', {
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
