import { useState } from 'react'

interface ImageGalleryModalProps {
  images: { id: string; url: string }[]
  isOpen: boolean
  onClose: () => void
}

export function ImageGalleryModal({ images, isOpen, onClose }: ImageGalleryModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  if (!isOpen || images.length === 0) return null

  const current = images[currentIndex]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="font-semibold">Image Gallery</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center bg-gray-100 p-4 overflow-auto">
          {current && (
            <img
              src={current.url}
              alt="Food"
              className="max-w-full max-h-full object-contain"
            />
          )}
        </div>

        <div className="p-4 border-t border-gray-200">
          <div className="flex gap-2 overflow-x-auto mb-4">
            {images.map((img, idx) => (
              <button
                key={img.id}
                onClick={() => setCurrentIndex(idx)}
                className={`flex-shrink-0 w-20 h-20 rounded border-2 overflow-hidden ${
                  idx === currentIndex ? 'border-blue-600' : 'border-gray-300'
                }`}
              >
                <img
                  src={img.url}
                  alt="Thumbnail"
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>

          <div className="flex justify-between items-center">
            <button
              onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              {currentIndex + 1} / {images.length}
            </span>
            <button
              onClick={() => setCurrentIndex(Math.min(images.length - 1, currentIndex + 1))}
              disabled={currentIndex === images.length - 1}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
