import React, { useState } from 'react'

/**
 * Component hiển thị một vật phẩm trong cửa hàng
 * @param {object} props
 * @param {string} props.name - Tên vật phẩm
 * @param {number} props.price - Giá vật phẩm
 * @param {string} props.imageUrl - URL hình ảnh hoặc icon
 */

interface ShopItemProps {
  name: string
  price: number
  imageUrl: string
}

const ShopItem: React.FC<ShopItemProps> = ({ name, price, imageUrl }) => {
  // State để lưu trữ số lượng
  const [quantity, setQuantity] = useState(1)

  // Hàm xử lý khi thay đổi số lượng
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10)
    // Đảm bảo số lượng luôn là số dương và ít nhất là 1
    setQuantity(isNaN(value) || value < 1 ? 1 : value)
  }

  // Hàm xử lý khi nhấn nút Mua
  const handleBuyClick = () => {
    // Logic xử lý mua hàng (ví dụ: gọi API, cập nhật state global)
    console.log(`Đã mua ${quantity} x ${name} với tổng giá ${price * quantity} vàng.`)
    // Bạn có thể thêm logic đóng modal hoặc hiển thị thông báo tại đây
  }

  return (
    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white shadow-sm gap-3">
      {/* Phần thông tin item (ảnh, tên, giá) */}
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        <img
          src={imageUrl}
          alt={name}
          className="w-12 h-12 rounded-md object-cover bg-gray-100 flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm sm:text-base font-semibold text-gray-800 truncate">{name}</h3>
          <p className="text-xs text-yellow-600 font-medium">Giá: {price} vàng</p>
        </div>
      </div>

      {/* Phần hành động (số lượng, nút mua) */}
      <div className="flex items-center space-x-2 flex-shrink-0">
        <input
          type="number"
          value={quantity}
          onChange={handleQuantityChange}
          min="1"
          className="w-14 text-center border border-gray-300 rounded-md p-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
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
  isOpen: boolean
  onClose: () => void
}

export const BombShop: React.FC<ShopModalProps> = ({ isOpen, onClose }) => {
  // Dữ liệu giả (mock data) cho các vật phẩm
  const shopItemsData = [
    { id: 1, name: "Bình Máu Nhỏ", price: 50, imageUrl: "https://placehold.co/100x100/red/white?text=HP" },
    { id: 2, name: "Bình Năng Lượng", price: 75, imageUrl: "https://placehold.co/100x100/blue/white?text=MP" },
    { id: 3, name: "Chìa Khóa Vàng", price: 200, imageUrl: "https://placehold.co/100x100/yellow/black?text=Key" },
    { id: 4, name: "Bom", price: 150, imageUrl: "https://placehold.co/100x100/black/white?text=Bomb" },
  ]

  if (!isOpen) {
    return null // Không hiển thị gì nếu modal không mở
  }

  return (
    // Lớp phủ nền (overlay)
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      {/* Box nội dung modal */}
      <div className="bg-gray-100 w-full max-w-2xl rounded-lg shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        
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

        {/* Danh sách vật phẩm */}
        <div className="p-2 sm:p-5 space-y-3 overflow-y-auto flex-1">
          {shopItemsData.map(item => (
            <ShopItem
              key={item.id}
              name={item.name}
              price={item.price}
              imageUrl={item.imageUrl}
            />
          ))}
        </div>

      </div>
    </div>
  )
}
