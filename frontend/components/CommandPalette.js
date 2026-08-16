'use client'

import { useState, useEffect, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, Transition } from '@headlessui/react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

const pages = [
  { id: 'dashboard', name: 'Dashboard', shortcut: 'D', url: '/dashboard' },
  { id: 'sales', name: 'Sales Invoices', shortcut: 'S', url: '/sales-invoices' },
  { id: 'sales-new', name: 'New Sales Invoice', shortcut: 'N S', url: '/sales-invoices/new' },
  { id: 'purchases', name: 'Purchase Invoices', shortcut: 'P', url: '/purchase-invoices' },
  { id: 'purchases-new', name: 'New Purchase Invoice', shortcut: 'N P', url: '/purchase-invoices/new' },
  { id: 'customers', name: 'Customers Master', shortcut: 'C', url: '/customers' },
  { id: 'vendors', name: 'Vendors Master', shortcut: 'V', url: '/vendors' },
  { id: 'items', name: 'Items & Inventory', shortcut: 'I', url: '/items' },
  { id: 'production', name: 'Production Entry', shortcut: 'P E', url: '/production/new' },
  { id: 'delivery', name: 'Delivery Challans', shortcut: 'D C', url: '/delivery-challans' },
  { id: 'payroll', name: 'Payroll & HR', shortcut: 'H R', url: '/payroll' },
  { id: 'reports', name: 'Financial Reports', shortcut: 'R', url: '/accounting/profit-loss' },
]

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function CommandPalette() {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const filteredPages = query === ''
    ? []
    : pages.filter((page) => {
        return page.name.toLowerCase().includes(query.toLowerCase())
      })

  return (
    <Transition.Root show={open} as={Fragment} afterLeave={() => setQuery('')} appear>
      <Dialog as="div" className="relative z-[100]" onClose={setOpen}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto p-4 sm:p-6 md:p-20">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="mx-auto max-w-xl transform divide-y divide-white/10 overflow-hidden rounded-2xl bg-black/80 backdrop-blur-xl border border-white/20 shadow-2xl ring-1 ring-white/5 transition-all">
              <div className="relative">
                <MagnifyingGlassIcon
                  className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-white/50"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-white placeholder-white/50 focus:ring-0 sm:text-sm focus:outline-none"
                  placeholder="Search modules... (ex. 'Sales', 'Payroll')"
                  onChange={(e) => setQuery(e.target.value)}
                  value={query}
                  autoFocus
                />
              </div>

              {filteredPages.length > 0 && (
                <ul className="max-h-72 scroll-py-2 overflow-y-auto py-2 text-sm text-white/80" id="options" role="listbox">
                  {filteredPages.map((page) => (
                    <li
                      key={page.id}
                      onClick={() => {
                        router.push(page.url)
                        setOpen(false)
                      }}
                      className="cursor-pointer select-none px-4 py-2 hover:bg-cyan-500/20 hover:text-cyan-400 flex justify-between items-center"
                      role="option"
                    >
                      <span>{page.name}</span>
                      <span className="text-xs text-white/40">{page.shortcut}</span>
                    </li>
                  ))}
                </ul>
              )}

              {query !== '' && filteredPages.length === 0 && (
                <p className="p-4 text-sm text-white/50">No results found.</p>
              )}
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
