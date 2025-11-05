'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { ConnectKitButton } from 'connectkit'

import { globalState } from '../globalState'
import { GiftUserMenu } from './GiftUserMenu'
import SideBar from './Sidebar'

const base = 'block py-2 pr-4 pl-3 hover:bg-gray-50 lg:hover:bg-transparent lg:border-0 lg:p-0'
const normal = 'text-gray-700 dark:text-gray-400'
const hl = 'text-blue-700 dark:text-white'

export const links = [
  {
    url: '/gift',
    txt: 'Gift',
    img: '/images/gift/gift-box.webp'
  },
  {
    url: '/arena',
    txt: 'Monster',
    img: '/images/characters/monster.png'
  },
  {
    url: '/bomb',
    txt: '💣 Bomb',
  },
]

export const Header = () => {
  // const currentPath = window.location.pathname
  const [currentPath, setCurrentPath] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)

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
      <nav className="bg-gray-50 border-gray-200 px-4 lg:px-6 py-1 dark:bg-gray-800">
        <div className="flex flex-wrap justify-between items-center mx-auto max-w-screen-xl h-12">
          <div className="flex items-center">
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="p-2 mr-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 lg:hidden"
            >
              <svg className="w-6 h-6 text-gray-700 dark:text-gray-200" viewBox="0 0 24 24" fill="none">
                <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            <a href="/" className="flex items-center">
              <img
                src="/images/pixel_logo.png"
                className="mr-3 h-6 sm:h-9"
                alt="PixelGame"
              />
              <span className="self-center text-xl font-semibold whitespace-nowrap dark:text-white hidden lg:block">
                PixelGame
              </span>
            </a>
          </div>
          

          {/* mobile menu button */}
          <div className="flex items-center lg:order-2">
            

            {/* <div className="flex items-center"> */}
              {isGiftPage && address ?
                <GiftUserMenu address={address} /> :
                <ConnectKitButton />
              }
            {/* </div> */}
          </div>

          <div
            className="hidden justify-between items-center h-full w-full lg:flex lg:w-auto lg:order-1"
            id="mobile-menu-2"
          >
            <ul className="flex flex-col mt-4 font-medium h-full lg:flex-row lg:space-x-8 lg:mt-0">
              {links.map((l, i) => (
                <li key={i} className={ `flex items-center ${currentPath.includes(l.url) ? 'border-b-2 border-blue-500' : ''}`}>
                  <a
                    href={l.url}
                    className={`flex justify-center ${base} ${ currentPath.includes(l.url) ? hl : normal }`}
                    aria-current="page"
                  >
                    {l.img && <Image src={l.img} alt='img' width={24} height={24} className='mr-1' />}
                    {l.txt}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </nav>

      <SideBar
        isOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        links={links}
        currentPath={currentPath}
        // isGiftPage={isGiftPage}
        // address={address}
      />
    </header>
  )
}