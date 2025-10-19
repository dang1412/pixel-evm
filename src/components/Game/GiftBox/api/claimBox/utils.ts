import { Log, parseEventLogs } from 'viem'

import { boxClaimedEventAbi } from './types'

export function getBoxClaimedEventLog(receipt?: { logs: Log<bigint, number, false>[]}) {
  if (!receipt || !receipt.logs) return null

  const parsedLogs = parseEventLogs({
    abi: boxClaimedEventAbi,
    eventName: 'BoxClaimed',
    logs: receipt.logs,
  })

  if (parsedLogs.length === 0) {
    console.log('No BoxClaimed event found in logs')
    return null
  }

  return parsedLogs[0].args
}


