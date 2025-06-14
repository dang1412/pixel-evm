import { useCallback } from 'react';
// import {
//   useSignAndExecuteTransaction,
//   useSuiClient,
// } from '@mysten/dapp-kit';
// import { Transaction } from '@mysten/sui/transactions';

// import { useNetworkVariable } from '../networkConfig';
import { useWriteContract } from 'wagmi'
// import { waitForTransactionReceipt } from 'viem/actions'

import { ListenMessageAbi } from './ListenMessageAbi'
import { MSG_CONTRACT_ADDR } from './useListenToMessage';

function useSendMessage() {
  // const rtcPackageId = useNetworkVariable('rtcPackageId');
  // const suiClient = useSuiClient();
  // const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  const { writeContractAsync, data, error } = useWriteContract()

  const sendMessage = useCallback(async (to: string, cid: string) => {
    // const tx = new Transaction();

    // tx.moveCall({
    //   arguments: [tx.pure.address(to), tx.pure.string(cid)],
    //   target: `${rtcPackageId}::rtc_connect::offer_connect`,
    // });

    // const rs = await signAndExecute({
    //   transaction: tx,
    // });

    // console.log('Transaction submitted:', rs.digest);
    // await suiClient.waitForTransaction({ digest: rs.digest });
    // console.log('Transaction confirmed:', rs.effects);

    const rs = await writeContractAsync({
      abi: ListenMessageAbi,
      address: MSG_CONTRACT_ADDR,
      functionName: 'offerConnect',
      args: [
        to,
        cid
      ]
    })

    console.log('Transaction submitted:', rs);
  }, [writeContractAsync]);

  return { sendMessage }
}

export default useSendMessage;