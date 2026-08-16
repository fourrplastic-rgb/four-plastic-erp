'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, QrCodeIcon } from '@heroicons/react/24/outline'

export default function BarcodeScanner({ onScanSuccess, buttonText = "Scan Item", className = "" }) {
  const [isOpen, setIsOpen] = useState(false)
  const scannerRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      // Small delay to allow modal to render before mounting scanner
      const timer = setTimeout(() => {
        if (!scannerRef.current) {
          scannerRef.current = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: { width: 250, height: 150 } },
            false
          )

          scannerRef.current.render(
            (decodedText) => {
              // On success
              onScanSuccess(decodedText)
              closeScanner()
            },
            (error) => {
              // ignore errors during scanning as they happen constantly
            }
          )
        }
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [isOpen, onScanSuccess])

  const closeScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(error => console.error("Failed to clear scanner", error))
      scannerRef.current = null
    }
    setIsOpen(false)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center gap-2 ${className}`}
      >
        <QrCodeIcon className="h-5 w-5" />
        {buttonText}
      </button>

      <Transition.Root show={isOpen} as={React.Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeScanner}>
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <Transition.Child
                as={React.Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-xl bg-[#111] border border-white/20 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                  <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                    <button
                      type="button"
                      className="rounded-md bg-transparent text-white/50 hover:text-white focus:outline-none"
                      onClick={closeScanner}
                    >
                      <span className="sr-only">Close</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                    <div className="sm:flex sm:items-start">
                      <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                        <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-white mb-4">
                          Scan Barcode / QR Code
                        </Dialog.Title>
                        <div className="mt-2 w-full bg-white rounded-lg overflow-hidden text-black">
                          <div id="reader" className="w-full"></div>
                        </div>
                        <p className="text-white/50 text-xs mt-4 text-center">
                          Point your camera at a barcode to automatically add the item.
                        </p>
                      </div>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  )
}
