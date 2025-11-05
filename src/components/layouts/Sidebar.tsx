import Image from 'next/image'

interface LinkItem {
  url: string
  txt: string
  img?: string
}

interface SideBarProps {
  isOpen: boolean
  onClose: () => void
  links: LinkItem[]
  currentPath: string
}

export const SideBar: React.FC<SideBarProps> = ({ isOpen, onClose, links, currentPath }) => {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 lg:hidden"
      aria-hidden={!isOpen}
      role="dialog"
      aria-modal="true"
    >
      {/* overlay */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* panel */}
      <aside className="relative z-10 w-64 max-w-full h-full bg-white dark:bg-gray-800 shadow-lg p-4 flex flex-col animate-slide-in-left">
        <div className="flex items-center justify-between mb-4">
          <a className="flex items-center" href="/">
            <img src="/images/pixel_logo.png" className="h-6 mr-2" alt="PixelGame" />
            <span className="text-lg font-semibold text-gray-800 dark:text-white">PixelGame</span>
          </a>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <svg className="w-5 h-5 text-gray-700 dark:text-gray-200" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        <nav className="flex-1 overflow-auto">
          <ul className="space-y-2">
            {links.map((l, i) => {
              // highlight when currentPath includes the link url
              // special-case root ("/") so it only matches exact root
              const isActive = l.url === '/' ? currentPath === '/' : currentPath.includes(l.url)

              const baseClasses = 'flex items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700'
              const activeClasses = 'bg-gray-100 dark:bg-gray-700 font-semibold'

              return (
                <li key={i}>
                  <a
                    href={l.url}
                    className={`${baseClasses} ${isActive ? activeClasses : ''}`}
                    onClick={onClose}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {l.img && (
                      <Image src={l.img} alt={l.txt} width={24} height={24} className="mr-2" />
                    )}
                    <span className="text-gray-700 dark:text-gray-200">{l.txt}</span>
                  </a>
                </li>
              )
            })}
          </ul>
        </nav>
      </aside>
    </div>
  )
}

export default SideBar