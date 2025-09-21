import Image from 'next/image'
import React, { useState, useRef, useEffect, useMemo } from 'react'
import { FaEthereum, FaUser } from 'react-icons/fa'
import { ConnectKitButton } from 'connectkit'
import { Address, formatUnits } from 'viem'

import { useTokenBalance } from '../Game/GiftBox/api/useBalance'
import { useBalance } from 'wagmi'

interface GiftUserMenuProps {
  address: Address
}

function shortenAddress(address?: Address, chars = 4) {
  if (!address) return "";
  return `${address.slice(0, 2 + chars)}...${address.slice(-chars)}`;
}

export const GiftUserMenu: React.FC<GiftUserMenuProps> = ({ address }) => {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const short = useMemo(() => shortenAddress(address, 4), [address])

  const token = useTokenBalance(address) || 0
  const { data } = useBalance({ address })
  const eth = useMemo(() => data ? Number(formatUnits(data.value, data.decimals)).toFixed(5) : '0', [data])

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open])

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
      >
        <FaUser className="mr-2" />
        <span className='font-medium text-sm'>{short}</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded shadow-lg z-10">
          <div className="px-4 py-3 text-sm text-gray-500">
            {/* <div className="text-sm font-medium text-gray-900">{short}</div> */}
            <ConnectKitButton />
            <div className="flex items-center my-2">
              <span className="font-semibold mr-1">&nbsp;{token}</span>
              <Image src='/images/gift/gift-box.webp' width={18} height={18} alt='Gift box' />
            </div>
            <div className="flex items-center">
              <span className="font-semibold mr-1">&nbsp;{eth}</span> <FaEthereum />
            </div>
          </div>
          {/* Add more menu items here if needed */}
        </div>
      )}
    </div>
  )
}
