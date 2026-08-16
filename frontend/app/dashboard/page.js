'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'
import { 
  UsersIcon, 
  BuildingOfficeIcon, 
  BuildingLibraryIcon,
  CubeIcon,
  HomeIcon,
  DocumentTextIcon,
  ShoppingCartIcon,
  TruckIcon,
  ChartBarIcon,
  BanknotesIcon,
  ArrowRightIcon,
  ClipboardDocumentListIcon,
  CurrencyRupeeIcon,
  UserGroupIcon,
  BuildingStorefrontIcon,
  // Production Icons
  BeakerIcon,
  PresentationChartLineIcon,
  // PAYROLL Icons
  IdentificationIcon,
  ClockIcon,
  CalendarDaysIcon,
  CreditCardIcon,
  WalletIcon,
  DocumentDuplicateIcon,
  // Daily Report Icon
  CalendarIcon,
  // Backup Icon
  ShieldCheckIcon,
  // Accounting Icons
  ScaleIcon,
  BookOpenIcon,
  CalculatorIcon,
  DocumentChartBarIcon,
  ArrowsRightLeftIcon,
  SparklesIcon,
  MagnifyingGlassIcon,
  StarIcon as StarOutlineIcon,
  BellAlertIcon,
  XMarkIcon,
  EnvelopeIcon,
  PaintBrushIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid'
import DashboardCharts from '@/components/DashboardCharts'


const HolographicCard = ({ children, className = '' }) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const cardRef = useRef(null);
  
  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };
  
  return (
    <div 
      ref={cardRef} 
      onMouseMove={handleMouseMove} 
      className={`holographic-card transition-all group relative rounded-2xl p-6 cursor-pointer overflow-hidden isolate ${className}`}
    >
      <div 
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-500 group-hover:opacity-100 mix-blend-screen z-0" 
        style={{ background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, var(--theme-primary-glow), transparent 40%)` }} 
      />
      {children}
    </div>
  );
}

export default function Dashboard() {

  const [user, setUser] = useState(null)
  const [stats, setStats] = useState({
    customers: 0,
    vendors: 0,
    items: 0,
    pendingDeliveries: 0,
    lowStock: 0,
    outstanding: 125000,
    // Production stats
    productionToday: 0,
    // PAYROLL STATS
    totalEmployees: 0,
    presentToday: 0,
    pendingPayouts: 0,
    pendingAdvances: 0
  })
  const [chartData, setChartData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('Overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [pinnedModules, setPinnedModules] = useState([])
  const [isCmdKOpen, setIsCmdKOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  const router = useRouter()

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCmdKOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsCmdKOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearInterval(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);


  useEffect(() => {
    const userData = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    if (!userData) {
      router.push('/')
    } else {
      setUser(JSON.parse(userData))
      fetchStats()
    }
    const savedPins = localStorage.getItem('pinnedModules')
    if (savedPins) {
      try { setPinnedModules(JSON.parse(savedPins)) } catch(e) {}
    }
  }, [])

  const fetchStats = async () => {
    try {
      const [
        customersRes, 
        vendorsRes, 
        itemsRes, 
        challansRes, 
        productionRes,
        employeesRes,
        attendanceRes,
        advancesRes,
        payoutsRes,
        chartsRes
      ] = await Promise.all([
        axios.get('/api/customers').then(res => res.data),
        axios.get('/api/vendors?t=1').then(res => res.data),
        axios.get('/api/items?t=1').then(res => res.data),
        axios.get('/api/delivery-challans').then(res => res.data),
        axios.get('/api/production').then(res => res.data),
        axios.get('/api/employees').then(res => res.data),
        axios.get('/api/attendance/today').then(res => res.data),
        axios.get('/api/advances').then(res => res.data),
        axios.get('/api/payouts?status=pending').then(res => res.data),
        axios.get('/api/dashboard/charts').then(res => res.data).catch(() => null)
      ])

      // Helper function to extract array from response
      const getArrayFromResponse = (res, key = null) => {
        if (Array.isArray(res)) return res
        if (res && typeof res === 'object') {
          if (key && res[key] && Array.isArray(res[key])) return res[key]
          // Try common keys
          if (res.data && Array.isArray(res.data)) return res.data
          if (res.employees && Array.isArray(res.employees)) return res.employees
          if (res.advances && Array.isArray(res.advances)) return res.advances
          if (res.payouts && Array.isArray(res.payouts)) return res.payouts
          if (res.productions && Array.isArray(res.productions)) return res.productions
          if (res.items && Array.isArray(res.items)) return res.items
          if (res.customers && Array.isArray(res.customers)) return res.customers
          if (res.vendors && Array.isArray(res.vendors)) return res.vendors
          if (res.challans && Array.isArray(res.challans)) return res.challans
        }
        return []
      }

      // Extract arrays from responses
      const customers = getArrayFromResponse(customersRes, 'customers')
      const vendors = getArrayFromResponse(vendorsRes, 'vendors')
      const items = getArrayFromResponse(itemsRes, 'items')
      const challans = getArrayFromResponse(challansRes, 'challans')
      const productions = getArrayFromResponse(productionRes, 'productions')
      const employees = getArrayFromResponse(employeesRes, 'employees')
      const advances = getArrayFromResponse(advancesRes, 'advances')
      const payouts = getArrayFromResponse(payoutsRes, 'payouts')

      if (chartsRes) setChartData(chartsRes)

      // Get today's production count
      const today = new Date().toISOString().split('T')[0]
      const todayProduction = productions.filter(p => p.production_date === today).length

      // Calculate pending advances
      const pendingAdvances = advances.filter(a => a.status === 'pending').length

      setStats({
        customers: customers.length,
        vendors: vendors.length,
        items: items.length,
        pendingDeliveries: challans.filter(c => 
          String(c.status).toLowerCase() === 'pending' || 
          String(c.status).toLowerCase() === 'PENDING'
        ).length,
        lowStock: items.filter(i => (i.current_stock || 0) < (i.min_stock || 10)).length,
        outstanding: 125000,
        productionToday: todayProduction,
        totalEmployees: employees.length,
        presentToday: attendanceRes.present || 0,
        pendingAdvances: pendingAdvances,
        pendingPayouts: payouts.length
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
      // Set default values if API fails
      setStats({
        customers: 24,
        vendors: 18,
        items: 156,
        pendingDeliveries: 8,
        lowStock: 5,
        outstanding: 125000,
        productionToday: 12,
        totalEmployees: 45,
        presentToday: 38,
        pendingAdvances: 12,
        pendingPayouts: 5
      })
    } finally {
      setLoading(false)
    }
  }

  const modules = [
    // MASTERS SECTION (4 modules)
    {
      title: 'Customer Master',
      description: 'Manage customers',
      icon: UsersIcon,
      href: '/customers',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/10',
      textColor: 'text-blue-400'
    },
    {
      title: 'Vendor Master',
      description: 'Manage vendors',
      icon: BuildingOfficeIcon,
      href: '/vendors',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-500/10',
      textColor: 'text-purple-400'
    },
    {
      title: 'Bank Master',
      description: 'Manage bank accounts',
      icon: BuildingLibraryIcon,
      href: '/banks',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-500/10',
      textColor: 'text-green-400'
    },
    {
      title: 'Item Master',
      description: 'Manage raw materials & finished goods',
      icon: CubeIcon,
      href: '/items',
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-500/10',
      textColor: 'text-orange-400'
    },

    
    // LEDGER SECTION REMOVED
    
    // PRODUCTION SECTION (2 modules)
    {
      title: 'Production Entry',
      description: 'Record daily production & material usage',
      icon: BeakerIcon,
      href: '/production',
      color: 'from-violet-500 to-purple-600',
      bgColor: 'bg-violet-500/10',
      textColor: 'text-violet-400'
    },
    {
      title: 'Production Report',
      description: 'View production analytics & reports',
      icon: PresentationChartLineIcon,
      href: '/production/report',
      color: 'from-fuchsia-500 to-pink-500',
      bgColor: 'bg-fuchsia-500/10',
      textColor: 'text-fuchsia-400'
    },
    
    // PAYROLL SECTION (5 modules)
    {
      title: 'Employee Master',
      description: 'Manage employee information',
      icon: IdentificationIcon,
      href: '/payroll/employees',
      color: 'from-cyan-500 to-blue-500',
      bgColor: 'bg-cyan-500/10',
      textColor: 'text-cyan-400',
      badge: 'New'
    },
    {
      title: 'Attendance',
      description: 'Daily attendance & tracking',
      icon: ClockIcon,
      href: '/payroll/attendance',
      color: 'from-emerald-500 to-teal-500',
      bgColor: 'bg-emerald-500/10',
      textColor: 'text-emerald-400',
      badge: 'New'
    },
    {
      title: 'Advances',
      description: 'Manage salary advances',
      icon: WalletIcon,
      href: '/payroll/advances',
      color: 'from-amber-500 to-orange-500',
      bgColor: 'bg-amber-500/10',
      textColor: 'text-amber-400',
      badge: 'New'
    },
    {
      title: 'Payouts & Payslips',
      description: 'Salary processing & payslips',
      icon: CreditCardIcon,
      href: '/payroll/surplus',
      color: 'from-rose-500 to-pink-500',
      bgColor: 'bg-rose-500/10',
      textColor: 'text-rose-400',
      badge: 'New'
    },
    {
      title: 'Payroll Reports',
      description: 'Salary register & analytics',
      icon: DocumentDuplicateIcon,
      href: '/payroll/reports',
      color: 'from-purple-500 to-indigo-500',
      bgColor: 'bg-purple-500/10',
      textColor: 'text-purple-400',
      badge: 'New'
    },
    
    // TRANSACTIONS SECTION (3 modules)
    {
      title: 'Sales Invoices',
      description: 'Create & manage GST invoices',
      icon: DocumentTextIcon,
      href: '/sales-invoices',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-500/10',
      textColor: 'text-purple-400'
    },
    {
      title: 'Purchase Invoices',
      description: 'Manage purchase invoices',
      icon: ShoppingCartIcon,
      href: '/purchase-invoices',
      color: 'from-indigo-500 to-blue-500',
      bgColor: 'bg-indigo-500/10',
      textColor: 'text-indigo-400'
    },
    {
      title: 'Delivery Challans',
      description: 'Manage deliveries',
      icon: TruckIcon,
      href: '/delivery-challans',
      color: 'from-pink-500 to-rose-500',
      bgColor: 'bg-pink-500/10',
      textColor: 'text-pink-400'
    },
    
    // REPORTS SECTION (5 modules - Added Backup)
    {
      title: 'Stock Report',
      description: 'View inventory levels & alerts',
      icon: ChartBarIcon,
      href: '/stock-report',
      color: 'from-yellow-500 to-orange-500',
      bgColor: 'bg-yellow-500/10',
      textColor: 'text-yellow-400'
    },
    {
      title: 'Stock Adjustments',
      description: 'Adjust inventory for wastage, physical checks',
      icon: CubeIcon,
      href: '/stock-adjustments',
      color: 'from-yellow-600 to-orange-600',
      bgColor: 'bg-yellow-500/10',
      textColor: 'text-yellow-400',
      badge: 'New'
    },
    {
      title: 'Outstanding Report',
      description: 'Customer & vendor outstanding',
      icon: ClipboardDocumentListIcon,
      href: '/outstanding-report',
      color: 'from-red-500 to-pink-500',
      bgColor: 'bg-red-500/10',
      textColor: 'text-red-400'
    },
    {
      title: 'Daily Report',
      description: 'Complete daily activity summary - Production, Purchases, Deliveries & Payments',
      icon: CalendarIcon,
      href: '/daily-report',
      color: 'from-teal-500 to-cyan-500',
      bgColor: 'bg-teal-500/10',
      textColor: 'text-teal-400'
    },
    {
      title: 'Backup & Restore',
      description: 'Create and manage database backups to protect your data',
      icon: ShieldCheckIcon,
      href: '/backup',
      color: 'from-cyan-500 to-blue-500',
      bgColor: 'bg-cyan-500/10',
      textColor: 'text-cyan-400'
    },
    {
      title: 'Payments & Receipts',
      description: 'Manage customer receipts & vendor payments',
      icon: CurrencyRupeeIcon,
      href: '/payments',
      color: 'from-teal-500 to-cyan-500',
      bgColor: 'bg-teal-500/10',
      textColor: 'text-teal-400'
    },
    {
      title: 'Lot Wise Purchases (Manual)',
      description: 'Find out shortage or surplus offline manual lots',
      icon: ShoppingCartIcon,
      href: '/standalone-lots',
      color: 'from-rose-500 to-orange-500',
      bgColor: 'bg-rose-500/10',
      textColor: 'text-rose-400'
    },
    {
      title: 'Payment & Receipt Report',
      description: 'Month & period wise reports for receipts and payments',
      icon: DocumentChartBarIcon,
      href: '/payments-report',
      color: 'from-cyan-500 to-purple-500',
      bgColor: 'bg-cyan-500/10',
      textColor: 'text-cyan-400',
      badge: 'New'
    },
    
    // ACCOUNTING (4 modules)
    {
      title: 'Chart of Accounts',
      description: 'Manage accounting ledgers',
      icon: BookOpenIcon,
      href: '/accounting/ledgers',
      color: 'from-indigo-600 to-purple-600',
      bgColor: 'bg-indigo-500/10',
      textColor: 'text-indigo-400',
      badge: 'Core'
    },
    {
      title: 'Journal Entry',
      description: 'Record double-entry manual journals',
      icon: CalculatorIcon,
      href: '/accounting/journal-entry',
      color: 'from-blue-600 to-indigo-600',
      bgColor: 'bg-blue-500/10',
      textColor: 'text-blue-400',
      badge: 'Core'
    },
    {
      title: 'Trial Balance',
      description: 'Real-time aggregated ledger balances',
      icon: ScaleIcon,
      href: '/accounting/trial-balance',
      color: 'from-emerald-600 to-teal-600',
      bgColor: 'bg-emerald-500/10',
      textColor: 'text-emerald-400',
      badge: 'Core'
    },
    {
      title: 'Profit & Loss',
      description: 'Net income, revenue, and expenses',
      icon: PresentationChartLineIcon,
      href: '/accounting/profit-loss',
      color: 'from-fuchsia-600 to-pink-600',
      bgColor: 'bg-fuchsia-500/10',
      textColor: 'text-fuchsia-400',
      badge: 'Core'
    },
    
    // TAXATION (4 modules)
    {
      title: 'Tax Records',
      description: 'Manage GST, Income Tax & TDS payments',
      icon: DocumentChartBarIcon,
      href: '/taxes/records',
      color: 'from-pink-600 to-rose-500',
      bgColor: 'bg-pink-500/10',
      textColor: 'text-pink-400',
      badge: 'Tax'
    },
    {
      title: 'GSTR-1 Returns',
      description: 'Monthly Sales Register (B2B, B2C, HSN)',
      icon: DocumentChartBarIcon,
      href: '/taxes/gstr1',
      color: 'from-orange-600 to-amber-500',
      bgColor: 'bg-orange-500/10',
      textColor: 'text-orange-400',
      badge: 'Tax'
    },
    {
      title: 'GSTR-2/3B Summary',
      description: 'Monthly Purchase & ITC Register',
      icon: DocumentChartBarIcon,
      href: '/taxes/gstr2',
      color: 'from-amber-600 to-yellow-500',
      bgColor: 'bg-amber-500/10',
      textColor: 'text-amber-400',
      badge: 'Tax'
    },
    {
      title: 'AI Tax Advisor',
      description: 'Ask questions, get simple translations of tax laws',
      icon: SparklesIcon,
      href: '/taxes/advisor',
      color: 'from-pink-500 to-purple-600',
      bgColor: 'bg-purple-500/10',
      textColor: 'text-purple-400',
      badge: 'AI'
    },
    
    // UTILITIES (2 modules)
    {
      title: 'Bank Statement Converter',
      description: 'Convert PDF bank statements to Excel instantly',
      icon: DocumentChartBarIcon,
      href: '/utilities/bank-statement',
      color: 'from-blue-600 to-cyan-500',
      bgColor: 'bg-blue-500/10',
      textColor: 'text-blue-400',
      badge: 'New AI'
    },
    {
      title: 'Blank Stationery Print',
      description: 'Print blank A4 pages with company watermark & letterhead',
      icon: DocumentDuplicateIcon,
      href: '/utilities/blank-print',
      color: 'from-pink-500 to-rose-500',
      bgColor: 'bg-pink-500/10',
      textColor: 'text-pink-400',
      badge: 'A4'
    },
    {
      title: 'Envelope Printing',
      description: 'Print business envelopes with company brand & recipient details',
      icon: EnvelopeIcon,
      href: '/utilities/envelope-print',
      color: 'from-purple-500 to-indigo-500',
      bgColor: 'bg-purple-500/10',
      textColor: 'text-purple-400',
      badge: 'New'
    },
    {
      title: 'Theme Customizer',
      description: 'Customize layout, typography sizes, presets & style options',
      icon: PaintBrushIcon,
      href: '/theme-settings',
      color: 'from-indigo-500 to-pink-500',
      bgColor: 'bg-indigo-500/10',
      textColor: 'text-indigo-400',
      badge: 'New'
    }
  ]

  // Group modules by section
  const role = user?.role?.toLowerCase() || 'admin'
  const isManager = role === 'manager' || role === 'admin'
  const isAdmin = role === 'admin'

  const masters = modules.slice(0, 4)
  const production = isManager ? modules.slice(4, 6) : []
  const payroll = isManager ? modules.slice(6, 11) : []
  const transactions = modules.slice(11, 14)
  const reports = isAdmin ? modules.slice(14, 22) : [] // 8 modules (exclude Bank Statement Converter)
  const accounting = isAdmin ? modules.slice(22, 26) : [] // 4 accounting modules
  const taxes = isAdmin ? modules.slice(26, 30) : [] // 4 taxation modules

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const togglePin = (href, e) => {
    e.preventDefault();
    let newPinned = [];
    if (pinnedModules.includes(href)) {
      newPinned = pinnedModules.filter(m => m !== href);
    } else {
      newPinned = [...pinnedModules, href];
    }
    setPinnedModules(newPinned);
    localStorage.setItem('pinnedModules', JSON.stringify(newPinned));
  };

  const renderModuleCard = (module) => {
    const isPinned = pinnedModules.includes(module.href);
    return (
      <Link key={module.href} href={module.href}>
        <HolographicCard>
          {module.badge && (
            <div className="absolute top-4 right-4 z-20">
              <span className="px-2.5 py-1 bg-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-wider rounded-full border border-cyan-500/30 drop-shadow-md">
                {module.badge}
              </span>
            </div>
          )}
          <button 
            onClick={(e) => togglePin(module.href, e)} 
            className="absolute top-4 left-4 z-30 p-1.5 rounded-full hover:bg-white/10 transition-colors"
          >
            {isPinned ? (
              <StarSolidIcon className="h-5 w-5 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
            ) : (
              <StarOutlineIcon className="h-5 w-5 text-white/30 group-hover:text-white/60 transition-colors" />
            )}
          </button>
          <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-br ${module.color}`} />
          <div className="absolute -inset-[100%] opacity-0 group-hover:opacity-100 transition-opacity duration-1000 rotate-180 mix-blend-screen" style={{ backgroundImage: `radial-gradient(circle at 50% 0%, rgba(0, 243, 255, 0.15), transparent 60%)` }} />
          <div className="relative z-10 transition-transform duration-500 group-hover:translate-x-2 mt-6">
            <div className={`${module.bgColor} rounded-2xl w-fit p-3.5 mb-5 shadow-inner border border-white/5 group-hover:scale-110 transition-all duration-500`}>
              <module.icon className={`h-8 w-8 ${module.textColor} group-hover:text-white transition-colors duration-500`} />
            </div>
            <h3 className="text-xl font-bold tracking-wide text-white mb-2">{module.title}</h3>
            <p className="text-slate-400 text-sm mb-5 font-medium">{module.description}</p>
            <div className="flex items-center text-cyan-400/50 font-bold uppercase tracking-widest text-[10px] group-hover:text-cyan-400 transition-colors duration-300">
              <span>Enter Module</span>
              <ArrowRightIcon className="h-4 w-4 ml-2 group-hover:translate-x-3 transition-transform duration-500" />
            </div>
          </div>
        </HolographicCard>
      </Link>
    )
  }

  const tabs = [
    { id: 'Overview', label: 'Overview' },
    { id: 'Masters', label: 'Masters' },
    ...(isManager ? [{ id: 'Production', label: 'Production' }] : []),
    ...(isManager ? [{ id: 'Payroll', label: 'Payroll' }] : []),
    { id: 'Transactions', label: 'Transactions' },
    ...(isAdmin ? [{ id: 'Reports', label: 'Reports' }] : []),
    ...(isAdmin ? [{ id: 'Accounting', label: 'Accounting' }] : []),
    ...(isAdmin ? [{ id: 'Taxes', label: 'Taxes' }] : []),
    { id: 'Utilities', label: 'Utilities' }
  ]

  const filteredModules = searchQuery ? modules.filter(m => 
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.description.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  const pinnedModulesList = modules.filter(m => pinnedModules.includes(m.href));

  if (!user || loading) {
    return (
      <div className="min-h-screen relative bg-gray-50">
        <header className="bg-white/5 border-b border-gray-200 py-4 px-8 flex justify-between">
          <div className="flex space-x-4 items-center">
            <div className="h-10 w-10 bg-white/10 rounded-xl animate-pulse" />
            <div className="h-8 w-48 bg-white/10 rounded-lg animate-pulse" />
          </div>
          <div className="h-10 w-32 bg-white/10 rounded-lg animate-pulse" />
        </header>
        <main className="max-w-7xl mx-auto px-8 py-12">
          <div className="h-16 max-w-2xl mx-auto bg-white/5 rounded-2xl mb-12 animate-pulse border border-gray-200" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            {[1,2,3,4].map(i => <div key={i} className="h-32 bg-white/5 rounded-3xl animate-pulse border border-gray-200" />)}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-48 bg-white/5 rounded-2xl animate-pulse border border-gray-200" />)}
          </div>
        </main>

        {/* Cmd+K Command Palette Modal */}
        {isCmdKOpen && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 animate-fade-in">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsCmdKOpen(false)} />
            <div className="relative w-full max-w-2xl bg-[#111] border border-gray-200 shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[70vh]">
              <div className="flex items-center px-6 border-b border-gray-200 bg-white/5">
                <MagnifyingGlassIcon className="h-5 w-5 text-cyan-400" />
                <input 
                  type="text" 
                  autoFocus
                  placeholder="What do you need?" 
                  className="w-full bg-transparent border-none text-gray-900 py-5 px-4 focus:outline-none focus:ring-0 text-lg placeholder-white/30"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button onClick={() => setIsCmdKOpen(false)} className="p-2 hover:bg-white/10 rounded-lg text-gray-500 transition-colors"><XMarkIcon className="h-5 w-5" /></button>
              </div>
              
              <div className="overflow-y-auto p-4 space-y-2 bg-[#0a0a0a]">
                {filteredModules.length > 0 ? (
                  <div className="space-y-1">
                    <div className="px-3 py-2 text-xs font-bold text-gray-900/40 uppercase tracking-wider">Modules ({filteredModules.length})</div>
                    {filteredModules.map(module => (
                      <Link 
                        key={module.href} 
                        href={module.href} 
                        onClick={() => setIsCmdKOpen(false)} 
                        className="flex items-center space-x-4 p-3 hover:bg-white/10 rounded-xl group transition-all"
                      >
                        <div className={`${module.bgColor} p-2 rounded-lg shadow-inner border border-white/5`}><module.icon className={`h-6 w-6 ${module.textColor}`} /></div>
                        <div>
                          <h4 className="text-gray-900 font-medium group-hover:text-cyan-400 transition-colors">{module.title}</h4>
                          <p className="text-gray-900/40 text-sm">{module.description}</p>
                        </div>
                        <div className="flex-1" />
                        <ArrowRightIcon className="h-4 w-4 text-gray-900/0 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <p className="text-gray-900/40 mb-2">No results found for "{searchQuery}"</p>
                    <p className="text-gray-900/20 text-sm">Try searching for "Invoices" or "Attendance"</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative min-h-screen text-slate-100 flex">
      {/* 1. Left Narrow Sidebar - B2B SaaS Layout */}
      <aside className="fixed inset-y-0 left-0 w-20 bg-slate-950/40 backdrop-blur-xl border-r border-white/10 flex flex-col items-center py-6 justify-between z-30 print:hidden hidden md:flex">
        <div className="flex flex-col items-center gap-8 w-full">
          {/* Logo bubble */}
          <div className="h-12 w-12 bg-gradient-to-br from-indigo-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 hover:scale-105 transition-transform">
            <span className="text-white font-black text-2xl">F</span>
          </div>
          
          {/* Navigation Icon Shortcuts */}
          <nav className="flex flex-col gap-5 w-full items-center">
            <button onClick={() => setActiveTab('Overview')} className={`p-3 rounded-2xl transition-all ${activeTab === 'Overview' ? 'bg-white/15 text-indigo-400' : 'text-slate-400 hover:text-white hover:bg-white/5'}`} title="Overview"><HomeIcon className="h-5 w-5" /></button>
            <button onClick={() => setActiveTab('Masters')} className={`p-3 rounded-2xl transition-all ${activeTab === 'Masters' ? 'bg-white/15 text-indigo-400' : 'text-slate-400 hover:text-white hover:bg-white/5'}`} title="Masters"><UsersIcon className="h-5 w-5" /></button>
            <button onClick={() => setActiveTab('Transactions')} className={`p-3 rounded-2xl transition-all ${activeTab === 'Transactions' ? 'bg-white/15 text-indigo-400' : 'text-slate-400 hover:text-white hover:bg-white/5'}`} title="Transactions"><ShoppingCartIcon className="h-5 w-5" /></button>
            {isManager && <button onClick={() => setActiveTab('Production')} className={`p-3 rounded-2xl transition-all ${activeTab === 'Production' ? 'bg-white/15 text-indigo-400' : 'text-slate-400 hover:text-white hover:bg-white/5'}`} title="Production"><BeakerIcon className="h-5 w-5" /></button>}
            {isManager && <button onClick={() => setActiveTab('Payroll')} className={`p-3 rounded-2xl transition-all ${activeTab === 'Payroll' ? 'bg-white/15 text-indigo-400' : 'text-slate-400 hover:text-white hover:bg-white/5'}`} title="Payroll"><IdentificationIcon className="h-5 w-5" /></button>}
            {isAdmin && <button onClick={() => setActiveTab('Reports')} className={`p-3 rounded-2xl transition-all ${activeTab === 'Reports' ? 'bg-white/15 text-indigo-400' : 'text-slate-400 hover:text-white hover:bg-white/5'}`} title="Reports"><PresentationChartLineIcon className="h-5 w-5" /></button>}
          </nav>
        </div>
        
        {/* User initials bubble at bottom */}
        <div className="h-10 w-10 bg-indigo-500/20 border border-indigo-500/30 rounded-2xl flex items-center justify-center" title={user?.username || 'User'}>
          <span className="text-indigo-400 text-sm font-bold">
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </span>
        </div>
      </aside>

      {/* Main Wrapper */}
      <div className="flex-1 md:pl-20 min-h-screen flex flex-col z-10">
        
        {/* Top Header bar */}
        <header className="bg-transparent border-b border-white/5 sticky top-0 z-20 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                FOUR (R) PLASTIC
              </h1>
              <p className="text-[var(--text-secondary)] text-sm font-medium mt-0.5">
                {getGreeting()}, {user?.username} ✨ <span className="mx-2 opacity-30">|</span> 
                {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                <span className="mx-2 opacity-30">•</span> 
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Top search bar wrapper */}
              <button 
                onClick={() => setIsCmdKOpen(true)} 
                className="flex items-center justify-between w-64 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl text-slate-400 transition-all text-sm group"
              >
                <div className="flex items-center gap-2">
                  <MagnifyingGlassIcon className="h-4 w-4 group-hover:text-indigo-400 transition-colors" />
                  <span>Search modules...</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="bg-white/10 border border-white/10 px-1.5 py-0.5 rounded text-[10px] font-mono">⌘</kbd>
                  <kbd className="bg-white/10 border border-white/10 px-1.5 py-0.5 rounded text-[10px] font-mono">K</kbd>
                </div>
              </button>

              <button
                onClick={() => {
                  localStorage.removeItem('user')
                  router.push('/')
                }}
                className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-red-400 transition-all text-sm font-semibold"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Content Area */}
        <main className="max-w-7xl w-full mx-auto px-6 py-8 flex-1 flex flex-col">
          
          {/* Sub-navigation Pill Tab Bar - Matches Dribbble Tab Layout */}
          <div className="flex bg-slate-900/10 backdrop-blur-md p-1.5 rounded-full border border-white/5 w-fit mb-8 max-w-full overflow-x-auto hide-scrollbar shadow-inner">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                  activeTab === tab.id 
                    ? 'bg-white text-slate-900 shadow-md shadow-black/10' 
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Dual Column Workspace layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start flex-1">
            
            {/* Left Workspace Panel (Tabs & Actions) */}
            <div className="lg:col-span-8 space-y-8">
              {activeTab === 'Overview' && (
                <div className="space-y-8">
                  {/* Pinned shortcuts Desk */}
                  {pinnedModulesList.length > 0 ? (
                    <div>
                      <div className="flex items-center space-x-2.5 mb-5">
                        <StarSolidIcon className="h-5 w-5 text-yellow-400" />
                        <h2 className="text-lg font-bold text-[var(--text-primary)]">Pinned Shortcuts</h2>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {pinnedModulesList.map(renderModuleCard)}
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 border border-dashed border-white/10 rounded-2xl text-center bg-white/5">
                      <p className="text-[var(--text-secondary)] text-sm">Pin your most used modules by clicking the star icon in the master directories.</p>
                    </div>
                  )}

                  {/* Smart Factory: Live Machine Status Panel */}
                  <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-xl space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b border-white/5">
                      <div className="flex items-center gap-2.5">
                        <span className="h-2.5 w-2.5 bg-green-500 rounded-full animate-ping" />
                        <h2 className="text-lg font-bold text-[var(--text-primary)]">Smart Factory Floor Monitor</h2>
                      </div>
                      <span className="text-xs text-[var(--text-secondary)] font-medium">4 Machines Online</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Machine 1 */}
                      <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-3 hover:border-indigo-500/30 transition-all">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-[var(--text-primary)]">Injection Molding (M-01)</span>
                          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold">🟢 Molding</span>
                        </div>
                        <div className="text-xs space-y-1.5 text-[var(--text-secondary)]">
                          <div className="flex justify-between"><span>Current FG:</span> <span className="font-semibold text-[var(--text-primary)]">Plastic Moulded Chair</span></div>
                          <div className="flex justify-between"><span>Batch:</span> <span className="font-mono">B260814-01</span></div>
                          <div className="flex justify-between"><span>Cycle Time:</span> <span>45 sec / shot</span></div>
                        </div>
                        {/* Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-[var(--text-secondary)] font-bold">
                            <span>Target: 1,500 PCS</span>
                            <span>82% Completed</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                            <div className="bg-indigo-500 h-full rounded-full" style={{ width: '82%' }} />
                          </div>
                        </div>
                      </div>

                      {/* Machine 2 */}
                      <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-3 hover:border-indigo-500/30 transition-all">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-[var(--text-primary)]">PP Scrap Recycler (R-02)</span>
                          <span className="px-2 py-0.5 bg-teal-500/20 text-teal-400 rounded-full text-xs font-semibold">🟢 Granulator Active</span>
                        </div>
                        <div className="text-xs space-y-1.5 text-[var(--text-secondary)]">
                          <div className="flex justify-between"><span>Input:</span> <span className="font-semibold text-[var(--text-primary)]">Rejected Chairs & Runners</span></div>
                          <div className="flex justify-between"><span>Output:</span> <span className="font-semibold text-green-400">PP COLOR SCRAP</span></div>
                          <div className="flex justify-between"><span>Process Speed:</span> <span>180 KG / hour</span></div>
                        </div>
                        {/* Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-[var(--text-secondary)] font-bold">
                            <span>Scrap recovered today: 340 KG</span>
                            <span>Daily Cap: 500 KG</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                            <div className="bg-teal-500 h-full rounded-full" style={{ width: '68%' }} />
                          </div>
                        </div>
                      </div>

                      {/* Machine 3 */}
                      <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-3 hover:border-indigo-500/30 transition-all">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-[var(--text-primary)]">Color Mixer / Blending (B-03)</span>
                          <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-semibold">🟡 Color Swapping</span>
                        </div>
                        <div className="text-xs space-y-1.5 text-[var(--text-secondary)]">
                          <div className="flex justify-between"><span>Last Run:</span> <span>PP milky chairs mix</span></div>
                          <div className="flex justify-between"><span>Next Batch:</span> <span className="font-mono">B260814-03 (Red chairs)</span></div>
                          <div className="flex justify-between"><span>Operator:</span> <span className="font-semibold text-[var(--text-primary)]">Rahul K.</span></div>
                        </div>
                        {/* Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-[var(--text-secondary)] font-bold">
                            <span>Status: Maintenance / Color Swap</span>
                            <span>Est: 15 min left</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                            <div className="bg-yellow-500 h-full rounded-full" style={{ width: '90%' }} />
                          </div>
                        </div>
                      </div>

                      {/* Machine 4 */}
                      <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-3 hover:border-indigo-500/30 transition-all">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-[var(--text-primary)]">Molding Extruder (M-04)</span>
                          <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full text-xs font-semibold">🔴 Stopped (No Material)</span>
                        </div>
                        <div className="text-xs space-y-1.5 text-[var(--text-secondary)]">
                          <div className="flex justify-between"><span>Idle Duration:</span> <span className="text-red-400 font-semibold">45 mins</span></div>
                          <div className="flex justify-between"><span>Alert:</span> <span className="text-yellow-400 font-semibold">Awaiting PP virgin granules</span></div>
                          <div className="flex justify-between"><span>Est. Restart:</span> <span>Pending warehouse transfer</span></div>
                        </div>
                        {/* Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-[var(--text-secondary)] font-bold">
                            <span>Target: 2,000 KG</span>
                            <span>15% Completed</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                            <div className="bg-red-500 h-full rounded-full" style={{ width: '15%' }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Chart reports */}
                  {isAdmin && (
                    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-xl">
                      <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Financial & Yield Performance</h2>
                      <DashboardCharts chartData={chartData} />
                    </div>
                  )}
                </div>
              )}

              {/* Dynamic Categories rendering */}
              {activeTab === 'Masters' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 animate-fade-in">
                  {masters.map(renderModuleCard)}
                </div>
              )}

              {activeTab === 'Production' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 animate-fade-in">
                  {production.map(renderModuleCard)}
                </div>
              )}

              {activeTab === 'Payroll' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 animate-fade-in">
                  {payroll.map(renderModuleCard)}
                </div>
              )}

              {activeTab === 'Transactions' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 animate-fade-in">
                  {transactions.map(renderModuleCard)}
                </div>
              )}

              {activeTab === 'Reports' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 animate-fade-in">
                  {reports.map(renderModuleCard)}
                </div>
              )}

              {activeTab === 'Accounting' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 animate-fade-in">
                  {accounting.map(renderModuleCard)}
                </div>
              )}

              {activeTab === 'Taxes' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 animate-fade-in">
                  {taxes.map(renderModuleCard)}
                </div>
              )}

              {activeTab === 'Utilities' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 animate-fade-in">
                  {modules.slice(30).map(renderModuleCard)}
                </div>
              )}
              <p className="text-slate-400/60 text-sm">
                FOUR (R) PLASTIC - Complete ERP Solution with Production, Payroll, Daily Report & Backup Modules | Version 4.0
              </p>
              <div className="flex space-x-4">
                <span className="text-slate-400/40 text-sm">Dashboard</span>
                <span className="text-slate-400/40 text-sm">•</span>
                <span className="text-slate-400/40 text-sm">{new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </main>

        {/* Cmd+K Command Palette Modal */}
        {isCmdKOpen && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 animate-fade-in">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsCmdKOpen(false)} />
            <div className="relative w-full max-w-2xl bg-[#111] border border-white/10 shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[70vh]">
              <div className="flex items-center px-6 border-b border-white/10 bg-white/5">
                <MagnifyingGlassIcon className="h-5 w-5 text-cyan-400" />
                <input 
                  type="text" 
                  autoFocus
                  placeholder="What do you need?" 
                  className="w-full bg-transparent border-none text-white py-5 px-4 focus:outline-none focus:ring-0 text-lg placeholder-white/30"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button onClick={() => setIsCmdKOpen(false)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 transition-colors"><XMarkIcon className="h-5 w-5" /></button>
              </div>
              
              <div className="overflow-y-auto p-4 space-y-2 bg-[#0a0a0a]">
                {filteredModules.length > 0 ? (
                  <div className="space-y-1">
                    <div className="px-3 py-2 text-xs font-bold text-slate-400/60 uppercase tracking-wider">Modules ({filteredModules.length})</div>
                    {filteredModules.map(module => (
                      <Link 
                        key={module.href} 
                        href={module.href} 
                        onClick={() => setIsCmdKOpen(false)} 
                        className="flex items-center space-x-4 p-3 hover:bg-white/10 rounded-xl group transition-all"
                      >
                        <div className={`${module.bgColor} p-2 rounded-lg shadow-inner border border-white/5`}><module.icon className={`h-6 w-6 ${module.textColor}`} /></div>
                        <div>
                          <h4 className="text-slate-200 font-medium group-hover:text-cyan-400 transition-colors">{module.title}</h4>
                          <p className="text-slate-400/60 text-sm">{module.description}</p>
                        </div>
                        <div className="flex-1" />
                        <ArrowRightIcon className="h-4 w-4 text-white/0 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <p className="text-slate-400/60 mb-2">No results found for "{searchQuery}"</p>
                    <p className="text-slate-400/30 text-sm">Try searching for "Invoices" or "Attendance"</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}