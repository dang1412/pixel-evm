import React, { useCallback, useState } from 'react'
import { FaBomb, FaRocket, FaBolt } from 'react-icons/fa'
import { BombMap } from './BombMap'
import { BombType, PlayerState } from './types'
import { bombPrices } from './constant'

/**
 * Component hiển thị một vật phẩm trong cửa hàng
 * @param {object} props
 * @param {string} props.name - Tên vật phẩm
 * @param {number} props.price - Giá vật phẩm
 * @param {React.ElementType} props.icon - Icon component for the item
 */

interface ShopItemProps {
  name: string
  price: number
  icon: React.ElementType
  onBuyClick?: () => void
}

const ShopItem: React.FC<ShopItemProps> = ({ name, price, icon: Icon, onBuyClick }) => {
  // Hàm xử lý khi nhấn nút Mua
  const handleBuyClick = useCallback(() => {
    // Logic xử lý mua hàng (ví dụ: gọi API, cập nhật state global)
    // Bạn có thể thêm logic đóng modal hoặc hiển thị thông báo tại đây
    onBuyClick?.()
  }, [name, price, onBuyClick])

  return (
    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white shadow-sm gap-3">
      {/* Phần thông tin item (ảnh, tên, giá) */}
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        <div className="w-12 h-12 rounded-md bg-gray-100 flex-shrink-0 flex items-center justify-center">
          <Icon className="w-8 h-8 text-gray-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm sm:text-base font-semibold text-gray-800 truncate">{name}</h3>
          <p className="text-xs text-yellow-600 font-medium flex items-center">
            <FaBolt className="mr-1" /> {price}
          </p>
        </div>
      </div>

      {/* Phần hành động (số lượng, nút mua) */}
      <div className="flex items-center space-x-2 flex-shrink-0">
        {/* <input
          type="number"
          value={quantity}
          onChange={handleQuantityChange}
          min="1"
          className="w-14 text-center border border-gray-300 rounded-md p-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        /> */}
        <button
          onClick={handleBuyClick}
          className="px-3 py-1.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors duration-200"
        >
          Mua
        </button>
      </div>
    </div>
  )
}

/**
 * Component Modal Cửa Hàng
 * @param {object} props
 * @param {boolean} props.isOpen - Trạng thái đóng/mở modal
 * @param {function} props.onClose - Hàm để đóng modal
 */

interface ShopModalProps {
  bombMapRef: React.RefObject<BombMap | undefined>
  playerState: PlayerState
  onClose: () => void
}

export const BombShop: React.FC<ShopModalProps> = ({ bombMapRef, playerState, onClose }) => {
  // Dữ liệu giả (mock data) cho các vật phẩm
  const shopItemsData = [
    { id: BombType.Standard, name: "Normal", price: bombPrices[BombType.Standard], icon: FaBomb },
    { id: BombType.Atomic, name: "Atomic", price: bombPrices[BombType.Atomic], icon: FaRocket },
  ]

  const doBuyItem = useCallback((type: BombType) => {
    // Logic xử lý sau khi mua hàng (ví dụ: cập nhật số dư vàng, thông báo thành công, v.v.)
    console.log('Đã mua vật phẩm thành công!')
    bombMapRef.current?.bombNetwork.buyBomb(type)
  }, [onClose])

  return (
    // Lớp phủ nền (overlay)
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Box nội dung modal */}
      <div
        className="bg-gray-100 w-full max-w-2xl rounded-lg shadow-xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header Modal */}
        <div className="flex justify-between items-center p-4 sm:p-5 border-b border-gray-300 bg-white flex-shrink-0">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Cửa Hàng Vật Phẩm</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 active:text-gray-900 text-2xl font-bold w-8 h-8 flex items-center justify-center"
            aria-label="Đóng"
          >
            &times;
          </button>
        </div>

        {/* Player State Info */}
        <div className="px-4 sm:px-5 py-3 bg-gray-50 border-b border-gray-300">
          <div className="flex gap-6 text-sm sm:text-base">
            <div className="flex items-center">
              <FaBolt className="text-yellow-500 mr-1" />
              <span className="text-gray-900 font-bold">{playerState.score}</span>
            </div>
            <div className="flex items-center">
              <FaBomb className="mr-1" />
              <span className="text-gray-900 font-bold">
                {playerState.bombs[BombType.Standard] || 0}
              </span>
            </div>
            <div className="flex items-center">
              <FaRocket className="mr-1" />
              <span className="text-gray-900 font-bold">
                {playerState.bombs[BombType.Atomic] || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Danh sách vật phẩm */}
        <div className="p-2 sm:p-5 space-y-3 overflow-y-auto flex-1">
          {shopItemsData.map(item => (
            <ShopItem
              key={item.id}
              name={item.name}
              price={item.price}
              icon={item.icon}
              onBuyClick={() => doBuyItem(item.id)}
            />
          ))}
        </div>

      </div>
    </div>
  )
}
