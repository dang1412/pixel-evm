import React, { useState, useRef, useEffect, useMemo } from 'react'
import { FaUser } from 'react-icons/fa'
import { ConnectKitButton } from 'connectkit'
import { Address } from 'viem'

import { useBalance } from '../Game/GiftBox/api/useBalance'

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

  const balance = useBalance(address) || 0

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
          <div className="px-4 py-3">
            {/* <div className="text-sm font-medium text-gray-900">{short}</div> */}
            <ConnectKitButton />
            <div className="text-sm text-gray-500">Balance: <span className="font-semibold">{balance}</span></div>
          </div>
          {/* Add more menu items here if needed */}
        </div>
      )}
    </div>
  )
}
