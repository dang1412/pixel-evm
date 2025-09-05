import { ConnectKitButton } from 'connectkit'
import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'

import { globalState } from '../globalState'
import { GiftUserMenu } from './GiftUserMenu'

const base = 'block py-2 pr-4 pl-3 border-b border-gray-100 hover:bg-gray-50 lg:hover:bg-transparent lg:border-0 lg:p-0'
const normal = 'text-gray-700 dark:text-gray-400'
const hl = 'text-blue-700 dark:text-white'

const links = [
  {
    url: '/gift',
    txt: 'Gift',
  },
  {
    url: '/arena',
    txt: 'Monster',
  },
  // {
  //   url: '/#',
  //   txt: 'Marketplace',
  // },
]

export const Header = () => {
  // const currentPath = window.location.pathname
  const [currentPath, setCurrentPath] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentPath(window.location.pathname)
    }
  }, [])

  const isGiftPage = currentPath.includes('/gift')
  const { address } = useAccount()

  useEffect(() => {
    console.log('Address changed:', address)
    globalState.address = address
  }, [address])

  return (
    <header>
      <nav className="bg-gray-50 border-gray-200 px-4 lg:px-6 py-2.5 dark:bg-gray-800">
        <div className="flex flex-wrap justify-between items-center mx-auto max-w-screen-xl">
          <a href="/" className="flex items-center">
            <img
              src="/images/pixel_logo.png"
              className="mr-3 h-6 sm:h-9"
              alt="PixelGame"
            />
            <span className="self-center text-xl font-semibold whitespace-nowrap dark:text-white">
              PixelGame
            </span>
          </a>
          <div className="flex items-center lg:order-2">
            {/* <ConnectKitButton /> */}
            {isGiftPage && address ?
              <GiftUserMenu address={address} /> :
              <ConnectKitButton />
            }
          </div>
          <div
            className="hidden justify-between items-center w-full lg:flex lg:w-auto lg:order-1"
            id="mobile-menu-2"
          >
            <ul className="flex flex-col mt-4 font-medium lg:flex-row lg:space-x-8 lg:mt-0">
              {links.map((l, i) => (
                <li key={i}>
                  <a
                    href={l.url}
                    className={`${base} ${ currentPath.includes(l.url) ? hl : normal }`}
                    aria-current="page"
                  >
                    {l.txt}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </nav>
    </header>
  )
}
