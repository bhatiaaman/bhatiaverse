'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Home,
  Calculator,
  Save,
  Lock,
  ShieldCheck,
  AlertTriangle,
  Percent,
  Baby,
  Landmark,
  CalendarDays,
} from 'lucide-react';

const SECTIONS = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'kids', label: 'Kids', icon: Baby },
  { id: 'retirement', label: 'Retirement', icon: Landmark },
  { id: 'monthly', label: 'Monthly View', icon: CalendarDays },
];

const DEFAULT_KIDS = {
  budgetOpen: true,
  activeKid: 'mannat',
  mannat: {
    budget2026: 27000,
    school: 0,
    birthday: 0,
    mutualFunds: 0,
    classes: 0,
    shopping: 0,
    sukanya: 0,
    customLabel: 'Other',
    customAmount: 0,
    investmentBudget2026: 27000,
    invMutualFunds: 0,
    invStocks: 0,
    invFd: 0,
    invGold: 0,
    invSukanya: 0,
    invCustomLabel: 'Other Investment',
    invCustomAmount: 0,
    invMfItems: [],
    invStocksItems: [],
    invFdItems: [],
    invGoldItems: [],
    invSukanyaItems: [],
    invCustomItems: [],
    invExtraCategories: [],
    runSchool: 0,
    runBirthday: 0,
    runMutualFunds: 0,
    runClasses: 0,
    runShopping: 0,
    runSukanya: 0,
    runCustomAmount: 0,
    runAvailSchool: 0,
    runAvailBirthday: 0,
    runAvailMutualFunds: 0,
    runAvailClasses: 0,
    runAvailShopping: 0,
    runAvailSukanya: 0,
    runAvailCustom: 0,
  },
  meher: {
    budget2026: 36000,
    school: 0,
    birthday: 0,
    mutualFunds: 0,
    classes: 0,
    shopping: 0,
    sukanya: 0,
    customLabel: 'Other',
    customAmount: 0,
    investmentBudget2026: 36000,
    invMutualFunds: 0,
    invStocks: 0,
    invFd: 0,
    invGold: 0,
    invSukanya: 0,
    invCustomLabel: 'Other Investment',
    invCustomAmount: 0,
    invMfItems: [],
    invStocksItems: [],
    invFdItems: [],
    invGoldItems: [],
    invSukanyaItems: [],
    invCustomItems: [],
    invExtraCategories: [],
    runSchool: 0,
    runBirthday: 0,
    runMutualFunds: 0,
    runClasses: 0,
    runShopping: 0,
    runSukanya: 0,
    runCustomAmount: 0,
    runAvailSchool: 0,
    runAvailBirthday: 0,
    runAvailMutualFunds: 0,
    runAvailClasses: 0,
    runAvailShopping: 0,
    runAvailSukanya: 0,
    runAvailCustom: 0,
  },
};

// Asset types for the investment detail panel
const INVESTMENT_ASSETS = [
  { label: 'Mutual Funds', key: 'invMutualFunds', itemsKey: 'invMfItems' },
  { label: 'Stocks',       key: 'invStocks',      itemsKey: 'invStocksItems' },
  { label: 'FD',           key: 'invFd',          itemsKey: 'invFdItems' },
  { label: 'Gold',         key: 'invGold',        itemsKey: 'invGoldItems' },
  { label: 'Sukanya',      key: 'invSukanya',     itemsKey: 'invSukanyaItems' },
];

const DEFAULT_RETIREMENT = {
  currentAge: 35,
  retireAge: 60,
  monthlyExpenseToday: 80000,
  inflationPct: 6,
  currentCorpus: 5000000,
  monthlyContribution: 50000,
  expectedReturnPct: 9,
};

const DEFAULT_PLAN = {
  monthlyIncome: 200000,
  essentialExpenses: 80000,
  discretionaryExpenses: 30000,
  emergencyMonths: 6,
  investPercent: 50,
};

function formatINR(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '₹0';
  return `₹${v.toLocaleString('en-IN')}`;
}

export default function FinancialPlanningPage() {
  const [authLoading, setAuthLoading] = useState(true);
  const [authed, setAuthed] = useState(false);

  const [loginUserId, setLoginUserId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginSubmitting, setLoginSubmitting] = useState(false);

  const [activeSection, setActiveSection] = useState('home');

  const [plan, setPlan] = useState(DEFAULT_PLAN);
  const [saveState, setSaveState] = useState({ status: 'idle', message: '' });

  const [kids, setKids] = useState(DEFAULT_KIDS);
  const [kidsSaveState, setKidsSaveState] = useState({ status: 'idle', message: '' });
  const [assetPanel, setAssetPanel] = useState(null); // itemsKey string | null

  const [retirement, setRetirement] = useState(DEFAULT_RETIREMENT);
  const [retSaveState, setRetSaveState] = useState({ status: 'idle', message: '' });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch('/api/auth/validate', { credentials: 'include' });
        const data = await res.json();
        if (!alive) return;
        setAuthed(!!data?.authenticated);
      } catch {
        if (!alive) return;
        setAuthed(false);
      } finally {
        if (!alive) return;
        setAuthLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('bv-financial-plan');
      if (raw) setPlan((prev) => ({ ...prev, ...JSON.parse(raw) }));
    } catch {
      // ignore
    }
    try {
      const k = localStorage.getItem('bv-financial-plan-kids');
      if (k) setKids((prev) => ({ ...prev, ...JSON.parse(k) }));
    } catch {
      // ignore
    }
    try {
      const r = localStorage.getItem('bv-financial-plan-retirement');
      if (r) setRetirement((prev) => ({ ...prev, ...JSON.parse(r) }));
    } catch {
      // ignore
    }
    setActiveSection('home');
  }, []);

  const computed = useMemo(() => {
    const monthlyIncome = Number(plan.monthlyIncome) || 0;
    const essentialExpenses = Number(plan.essentialExpenses) || 0;
    const discretionaryExpenses = Number(plan.discretionaryExpenses) || 0;
    const emergencyMonths = Number(plan.emergencyMonths) || 0;
    const investPercent = Number(plan.investPercent) || 0;

    const totalExpenses = essentialExpenses + discretionaryExpenses;
    const surplus = monthlyIncome - totalExpenses;

    const emergencyTarget = essentialExpenses * Math.max(0, emergencyMonths);
    const recommendedInvestment = Math.max(0, surplus) * (investPercent / 100);
    const bufferAfterInvestment = Math.max(0, surplus - recommendedInvestment);

    return {
      totalExpenses,
      surplus,
      emergencyTarget,
      recommendedInvestment,
      bufferAfterInvestment,
      investPercent,
    };
  }, [plan]);

  const savePlan = () => {
    try {
      localStorage.setItem('bv-financial-plan', JSON.stringify(plan));
      setSaveState({ status: 'saved', message: 'Plan saved on this device.' });
      setTimeout(() => setSaveState({ status: 'idle', message: '' }), 2500);
    } catch {
      setSaveState({ status: 'error', message: 'Could not save plan.' });
    }
  };

  const saveKids = () => {
    try {
      localStorage.setItem('bv-financial-plan-kids', JSON.stringify(kids));
      setKidsSaveState({ status: 'saved', message: 'Kids plan saved.' });
      setTimeout(() => setKidsSaveState({ status: 'idle', message: '' }), 2500);
    } catch {
      setKidsSaveState({ status: 'error', message: 'Could not save.' });
    }
  };

  const saveRetirement = () => {
    try {
      localStorage.setItem('bv-financial-plan-retirement', JSON.stringify(retirement));
      setRetSaveState({ status: 'saved', message: 'Retirement plan saved.' });
      setTimeout(() => setRetSaveState({ status: 'idle', message: '' }), 2500);
    } catch {
      setRetSaveState({ status: 'error', message: 'Could not save.' });
    }
  };

  const setSection = (id) => {
    setActiveSection(id);
    try {
      localStorage.setItem('bv-financial-plan-tab', id);
    } catch {
      // ignore
    }
  };

  const activeKidData = kids[kids.activeKid] || kids.mannat;
  const kidsTotal = useMemo(() => {
    const values = [
      activeKidData.school,
      activeKidData.birthday,
      activeKidData.mutualFunds,
      activeKidData.classes,
      activeKidData.shopping,
      activeKidData.sukanya,
      activeKidData.customAmount,
    ];
    return values.reduce((sum, value) => sum + (Number(value) || 0), 0);
  }, [activeKidData]);
  const kidsBalance = (Number(activeKidData.budget2026) || 0) - kidsTotal;
  const kidsInvestmentTotal = useMemo(() => {
    const fieldTotal = (itemsKey, fallbackKey) => {
      const items = activeKidData[itemsKey] || [];
      if (items.length > 0) return items.reduce((s, i) => s + (Number(i.amount) || 0), 0);
      return Number(activeKidData[fallbackKey]) || 0;
    };
    const extraTotal = (activeKidData.invExtraCategories || []).reduce(
      (sum, cat) => sum + (cat.items || []).reduce((s, i) => s + (Number(i.amount) || 0), 0),
      0
    );
    return (
      fieldTotal('invMfItems', 'invMutualFunds') +
      fieldTotal('invStocksItems', 'invStocks') +
      fieldTotal('invFdItems', 'invFd') +
      fieldTotal('invGoldItems', 'invGold') +
      fieldTotal('invSukanyaItems', 'invSukanya') +
      fieldTotal('invCustomItems', 'invCustomAmount') +
      extraTotal
    );
  }, [activeKidData]);
  const kidsInvestmentBalance = (Number(activeKidData.investmentBudget2026) || 0) - kidsInvestmentTotal;

  const setActiveKid = (kidId) => {
    setKids((prev) => ({ ...prev, activeKid: kidId }));
  };

  const updateKidField = (field, value) => {
    const kidId = kids.activeKid;
    setKids((prev) => ({
      ...prev,
      [kidId]: {
        ...prev[kidId],
        [field]: value,
      },
    }));
  };
  const toggleKidsBudgetOpen = () => {
    setKids((prev) => ({ ...prev, budgetOpen: !prev.budgetOpen }));
  };

  const addHoldingItem = (itemsKey) => {
    const kidId = kids.activeKid;
    const newItem = { id: Date.now(), name: '', qty: 0, price: 0, amount: 0, notes: '' };
    setKids((prev) => ({
      ...prev,
      [kidId]: {
        ...prev[kidId],
        [itemsKey]: [...(prev[kidId][itemsKey] || []), newItem],
      },
    }));
  };

  const updateHoldingItem = (itemsKey, itemId, field, value) => {
    const kidId = kids.activeKid;
    setKids((prev) => ({
      ...prev,
      [kidId]: {
        ...prev[kidId],
        [itemsKey]: (prev[kidId][itemsKey] || []).map((item) => {
          if (item.id !== itemId) return item;
          const updated = { ...item, [field]: value };
          updated.amount = (Number(updated.qty) || 0) * (Number(updated.price) || 0);
          return updated;
        }),
      },
    }));
  };

  const removeHoldingItem = (itemsKey, itemId) => {
    const kidId = kids.activeKid;
    setKids((prev) => ({
      ...prev,
      [kidId]: {
        ...prev[kidId],
        [itemsKey]: (prev[kidId][itemsKey] || []).filter((item) => item.id !== itemId),
      },
    }));
  };

  const addExtraCategory = () => {
    const kidId = kids.activeKid;
    const newCat = { id: Date.now(), label: 'New Category', items: [] };
    setKids((prev) => ({
      ...prev,
      [kidId]: {
        ...prev[kidId],
        invExtraCategories: [...(prev[kidId].invExtraCategories || []), newCat],
      },
    }));
  };

  const updateExtraCategoryLabel = (catId, label) => {
    const kidId = kids.activeKid;
    setKids((prev) => ({
      ...prev,
      [kidId]: {
        ...prev[kidId],
        invExtraCategories: (prev[kidId].invExtraCategories || []).map((cat) =>
          cat.id === catId ? { ...cat, label } : cat
        ),
      },
    }));
  };

  const removeExtraCategory = (catId) => {
    const kidId = kids.activeKid;
    setKids((prev) => ({
      ...prev,
      [kidId]: {
        ...prev[kidId],
        invExtraCategories: (prev[kidId].invExtraCategories || []).filter((cat) => cat.id !== catId),
      },
    }));
  };

  const addExtraHoldingItem = (catId) => {
    const kidId = kids.activeKid;
    const newItem = { id: Date.now(), name: '', qty: 0, price: 0, amount: 0, notes: '' };
    setKids((prev) => ({
      ...prev,
      [kidId]: {
        ...prev[kidId],
        invExtraCategories: (prev[kidId].invExtraCategories || []).map((cat) =>
          cat.id === catId ? { ...cat, items: [...(cat.items || []), newItem] } : cat
        ),
      },
    }));
  };

  const updateExtraHoldingItem = (catId, itemId, field, value) => {
    const kidId = kids.activeKid;
    setKids((prev) => ({
      ...prev,
      [kidId]: {
        ...prev[kidId],
        invExtraCategories: (prev[kidId].invExtraCategories || []).map((cat) =>
          cat.id === catId
            ? {
                ...cat,
                items: (cat.items || []).map((item) => {
                  if (item.id !== itemId) return item;
                  const updated = { ...item, [field]: value };
                  updated.amount = (Number(updated.qty) || 0) * (Number(updated.price) || 0);
                  return updated;
                }),
              }
            : cat
        ),
      },
    }));
  };

  const removeExtraHoldingItem = (catId, itemId) => {
    const kidId = kids.activeKid;
    setKids((prev) => ({
      ...prev,
      [kidId]: {
        ...prev[kidId],
        invExtraCategories: (prev[kidId].invExtraCategories || []).map((cat) =>
          cat.id === catId
            ? { ...cat, items: (cat.items || []).filter((item) => item.id !== itemId) }
            : cat
        ),
      },
    }));
  };

  const retirementComputed = useMemo(() => {
    const ageNow = Number(retirement.currentAge) || 0;
    const retireAt = Number(retirement.retireAge) || 0;
    const yearsLeft = Math.max(0, retireAt - ageNow);
    const expToday = Number(retirement.monthlyExpenseToday) || 0;
    const infl = (Number(retirement.inflationPct) || 0) / 100;
    const monthlyAtRetire = expToday * (1 + infl) ** yearsLeft;
    const annualNeed = monthlyAtRetire * 12;
    const safeWithdrawal = 0.04;
    const corpusNeeded = annualNeed / safeWithdrawal;
    const corpus = Number(retirement.currentCorpus) || 0;
    const contrib = Number(retirement.monthlyContribution) || 0;
    const retR = (Number(retirement.expectedReturnPct) || 0) / 100 / 12;
    const n = yearsLeft * 12;
    let fvCorpus = corpus;
    if (n > 0 && retR !== 0) {
      fvCorpus = corpus * (1 + retR) ** n + (contrib * ((1 + retR) ** n - 1)) / retR;
    } else if (n > 0) {
      fvCorpus = corpus + contrib * n;
    }
    const shortfall = Math.max(0, corpusNeeded - fvCorpus);
    return {
      yearsLeft,
      monthlyAtRetire,
      corpusNeeded,
      projectedCorpus: fvCorpus,
      shortfall,
    };
  }, [retirement]);

  const doLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {
      // ignore
    }
    setAuthed(false);
    setLoginPassword('');
    setLoginError('');
  };

  const doLogin = async () => {
    setLoginSubmitting(true);
    setLoginError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId: loginUserId, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        setLoginError(data?.error || 'Invalid user id or password.');
        return;
      }
      setAuthed(true);
      setLoginPassword('');
    } catch {
      setLoginError('Login failed. Please try again.');
    } finally {
      setLoginSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
        <header className="sticky top-0 z-40 backdrop-blur-xl bg-gradient-to-r from-slate-900/90 via-slate-800/90 to-slate-900/90 border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                  <ArrowLeft size={20} />
                </Link>
                <div>
                  <h1 className="text-xl font-bold">Financial Planning</h1>
                  <p className="text-sm text-gray-400">Login protected (User ID + Password)</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm bg-red-500/15 border border-red-400/20 text-red-200">
                <Lock size={16} />
                Locked
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/20 text-red-200">
                <Lock size={22} />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold mb-2">Please login</h2>
                <p className="text-sm text-gray-400">Use your user id and password to access your plan.</p>

                <div className="mt-5 space-y-3">
                  <label className="block">
                    <span className="text-sm text-gray-400">User ID</span>
                    <input
                      value={loginUserId}
                      onChange={(e) => setLoginUserId(e.target.value)}
                      className="mt-2 w-full px-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-sm"
                      placeholder="e.g. admin"
                      autoComplete="username"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm text-gray-400">Password</span>
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="mt-2 w-full px-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-sm"
                      placeholder="••••••••"
                      autoComplete="current-password"
                    />
                  </label>

                  {loginError && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm flex items-center gap-2">
                      <AlertTriangle size={16} />
                      {loginError}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={doLogin}
                    disabled={loginSubmitting}
                    className="w-full py-3.5 rounded-xl font-bold text-white bg-blue-500/70 hover:bg-blue-500 disabled:opacity-50 transition-colors"
                  >
                    {loginSubmitting ? 'Signing in...' : 'Sign in'}
                  </button>
                </div>

                <p className="mt-4 text-xs text-gray-500">
                  The default user is created from env vars: `FINPLAN_ADMIN_USER_ID` and `FINPLAN_ADMIN_PASSWORD`.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-gradient-to-r from-slate-900/90 via-slate-800/90 to-slate-900/90 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                <ArrowLeft size={20} />
              </Link>
              <div>
                <h1 className="text-xl font-bold">Financial Planning</h1>
                <p className="text-sm text-gray-400">A simple budgeting + investing plan</p>
              </div>
            </div>
            <button
              type="button"
              onClick={doLogout}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <ShieldCheck size={16} />
              Logout
            </button>
          </div>
        </div>
      </header>

      <nav className="border-b border-white/10 bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-1 py-2">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setSection(id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  activeSection === id
                    ? 'bg-blue-500/25 text-blue-100 border border-blue-400/40'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeSection === 'home' && (
          <div className="space-y-6">
            <section className="bg-slate-900/50 border border-white/10 rounded-2xl p-6">
              <h2 className="text-2xl font-bold mb-2">Financial Planning Home</h2>
              <p className="text-gray-400">
                Welcome to your planning dashboard. Use the sections above to manage monthly cash flow,
                kids planning, and retirement tracking.
              </p>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                type="button"
                onClick={() => setSection('monthly')}
                className="text-left p-5 rounded-2xl bg-slate-900/50 border border-white/10 hover:bg-white/5 transition-colors"
              >
                <div className="text-blue-300 font-semibold mb-1">Monthly View</div>
                <p className="text-sm text-gray-400">Track income, expenses, and monthly surplus.</p>
              </button>
              <button
                type="button"
                onClick={() => setSection('kids')}
                className="text-left p-5 rounded-2xl bg-slate-900/50 border border-white/10 hover:bg-white/5 transition-colors"
              >
                <div className="text-amber-300 font-semibold mb-1">Kids</div>
                <p className="text-sm text-gray-400">Plan budgets and investments for Mannat and Meher.</p>
              </button>
              <button
                type="button"
                onClick={() => setSection('retirement')}
                className="text-left p-5 rounded-2xl bg-slate-900/50 border border-white/10 hover:bg-white/5 transition-colors"
              >
                <div className="text-emerald-300 font-semibold mb-1">Retirement</div>
                <p className="text-sm text-gray-400">Estimate corpus goals and projected shortfall.</p>
              </button>
            </div>
          </div>
        )}

        {activeSection === 'monthly' && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 space-y-6">
              <section className="bg-slate-900/50 border border-white/10 rounded-2xl p-5">
                <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                  <Calculator size={18} className="text-blue-400" /> Monthly Budget Inputs
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-sm text-gray-400">Monthly Income</span>
                    <input
                      type="number"
                      min={0}
                      value={plan.monthlyIncome}
                      onChange={(e) => setPlan((p) => ({ ...p, monthlyIncome: e.target.value }))}
                      className="mt-2 w-full px-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-sm"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm text-gray-400">Emergency Fund (months)</span>
                    <select
                      value={plan.emergencyMonths}
                      onChange={(e) => setPlan((p) => ({ ...p, emergencyMonths: e.target.value }))}
                      className="mt-2 w-full px-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-sm"
                    >
                      <option value={3}>3</option>
                      <option value={6}>6</option>
                      <option value={9}>9</option>
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-sm text-gray-400">Essential Expenses</span>
                    <input
                      type="number"
                      min={0}
                      value={plan.essentialExpenses}
                      onChange={(e) => setPlan((p) => ({ ...p, essentialExpenses: e.target.value }))}
                      className="mt-2 w-full px-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-sm"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm text-gray-400">Discretionary Expenses</span>
                    <input
                      type="number"
                      min={0}
                      value={plan.discretionaryExpenses}
                      onChange={(e) => setPlan((p) => ({ ...p, discretionaryExpenses: e.target.value }))}
                      className="mt-2 w-full px-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-sm"
                    />
                  </label>

                  <label className="block sm:col-span-2">
                    <span className="text-sm text-gray-400">Invest % of Monthly Surplus ({computed.investPercent}%)</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={plan.investPercent}
                      onChange={(e) => setPlan((p) => ({ ...p, investPercent: e.target.value }))}
                      className="mt-3 w-full"
                    />
                    <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                      <span>0%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                  </label>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={savePlan}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500/20 border border-blue-400/40 text-blue-200 hover:bg-blue-500/25 transition-colors"
                  >
                    <Save size={16} />
                    Save Plan
                  </button>
                  {saveState.status !== 'idle' && (
                    <span className={saveState.status === 'saved' ? 'text-green-300 text-sm' : 'text-red-300 text-sm'}>
                      {saveState.message}
                    </span>
                  )}
                </div>

                <p className="mt-4 text-xs text-gray-500">Not financial advice. This is a planning heuristic.</p>
              </section>
            </div>

            <div className="lg:col-span-2 flex flex-col gap-6">
              <section className="bg-slate-900/50 border border-white/10 rounded-2xl p-5">
                <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                  <Percent size={18} className="text-purple-300" /> Computed Plan
                </h2>

                <div className="space-y-3">
                  <div className="p-3 rounded-xl border border-white/5 bg-slate-900/40">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Total Expenses</span>
                      <span className="font-semibold">{formatINR(computed.totalExpenses)}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border border-white/5 bg-slate-900/40">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Monthly Surplus</span>
                      <span className={computed.surplus >= 0 ? 'font-semibold text-green-300' : 'font-semibold text-red-300'}>
                        {formatINR(computed.surplus)}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border border-white/5 bg-slate-900/40">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Emergency Fund Target</span>
                      <span className="font-semibold">{formatINR(computed.emergencyTarget)}</span>
                    </div>
                    <div className="mt-1 text-xs text-gray-500">Based on essentials × {plan.emergencyMonths} months</div>
                  </div>

                  <div className="p-3 rounded-xl border border-white/5 bg-slate-900/40">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Recommended Investment (Monthly)</span>
                      <span className="font-semibold text-blue-200">{formatINR(computed.recommendedInvestment)}</span>
                    </div>
                    <div className="mt-1 text-xs text-gray-500">{plan.investPercent}% of the surplus</div>
                  </div>

                  <div className="p-3 rounded-xl border border-white/5 bg-slate-900/40">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Buffer After Investing</span>
                      <span className="font-semibold">{formatINR(computed.bufferAfterInvestment)}</span>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}

        {activeSection === 'kids' && (
          <div className="space-y-6">
            <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-5">
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <Baby size={18} className="text-amber-300" /> Kids Planner
              </h2>
              <p className="text-sm text-gray-400 mb-4">Sub-menu for each child with budget and investment planning.</p>

              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'mannat', label: 'Mannat' },
                  { id: 'meher', label: 'Meher' },
                ].map((kid) => (
                  <button
                    key={kid.id}
                    type="button"
                    onClick={() => setActiveKid(kid.id)}
                    className={`px-4 py-2 rounded-xl text-sm border transition-colors ${
                      kids.activeKid === kid.id
                        ? 'bg-amber-500/25 border-amber-300/40 text-amber-100'
                        : 'bg-slate-900/40 border-white/10 text-gray-300 hover:text-white'
                    }`}
                  >
                    {kid.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
              <section className="bg-slate-900/50 border border-white/10 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-amber-200">Budget Planning</h3>
                  <button
                    type="button"
                    onClick={toggleKidsBudgetOpen}
                    className="px-3 py-1.5 rounded-lg text-xs border border-white/10 bg-slate-900/40 hover:bg-white/5"
                  >
                    {kids.budgetOpen ? 'Collapse' : 'Expand'}
                  </button>
                </div>
                {kids.budgetOpen && (
                  <>
                    <div className="p-4 rounded-xl border border-amber-400/25 bg-amber-500/10 mb-4 flex items-center justify-between">
                      <div>
                        <div className="text-xs text-gray-400">Budget 2026 - {kids.activeKid === 'mannat' ? 'Mannat' : 'Meher'}</div>
                        <div className="text-xl font-bold text-amber-200">{formatINR(activeKidData.budget2026)}</div>
                      </div>
                      <label className="text-sm text-gray-300">
                        Edit Budget
                        <input
                          type="number"
                          min={0}
                          value={activeKidData.budget2026}
                          onChange={(e) => updateKidField('budget2026', e.target.value)}
                          className="mt-2 block w-36 px-3 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-sm"
                        />
                      </label>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-gray-400 border-b border-white/10">
                            <th className="py-2 pr-3">Category</th>
                            <th className="py-2">Amount (₹)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            ['School', 'school'],
                            ['Birthday', 'birthday'],
                            ['Mutual Funds', 'mutualFunds'],
                            ['Classes', 'classes'],
                            ['Shopping', 'shopping'],
                            ['Sukanya', 'sukanya'],
                          ].map(([label, key]) => (
                            <tr key={key} className="border-b border-white/5">
                              <td className="py-2 pr-3">{label}</td>
                              <td className="py-2">
                                <input
                                  type="number"
                                  min={0}
                                  value={activeKidData[key]}
                                  onChange={(e) => updateKidField(key, e.target.value)}
                                  className="w-full sm:w-52 px-3 py-2 bg-slate-900/50 border border-white/10 rounded-lg"
                                />
                              </td>
                            </tr>
                          ))}
                          <tr className="border-b border-white/5">
                            <td className="py-2 pr-3">
                              <input
                                value={activeKidData.customLabel}
                                onChange={(e) => updateKidField('customLabel', e.target.value)}
                                className="w-full sm:w-52 px-3 py-2 bg-slate-900/50 border border-white/10 rounded-lg"
                                placeholder="Add category later"
                              />
                            </td>
                            <td className="py-2">
                              <input
                                type="number"
                                min={0}
                                value={activeKidData.customAmount}
                                onChange={(e) => updateKidField('customAmount', e.target.value)}
                                className="w-full sm:w-52 px-3 py-2 bg-slate-900/50 border border-white/10 rounded-lg"
                              />
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-3 text-sm text-gray-300">Budget total: <span className="font-semibold">{formatINR(kidsTotal)}</span></div>
                  </>
                )}
              </section>

              <section className="bg-slate-900/50 border border-white/10 rounded-2xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-purple-200">Running Month Budget</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Set &quot;Available&quot; per category — include carryover from last month if any.</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-400 border-b border-white/10">
                        <th className="py-2 pr-2">Category</th>
                        <th className="py-2 pr-2">Available (₹)</th>
                        <th className="py-2 pr-2">Spent (₹)</th>
                        <th className="py-2">Left</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ['School',       'runAvailSchool',      'runSchool'],
                        ['Birthday',     'runAvailBirthday',    'runBirthday'],
                        ['Mutual Funds', 'runAvailMutualFunds', 'runMutualFunds'],
                        ['Classes',      'runAvailClasses',     'runClasses'],
                        ['Shopping',     'runAvailShopping',    'runShopping'],
                        ['Sukanya',      'runAvailSukanya',     'runSukanya'],
                      ].map(([label, availKey, spentKey]) => {
                        const avail = Number(activeKidData[availKey]) || 0;
                        const spent = Number(activeKidData[spentKey]) || 0;
                        const left = avail - spent;
                        return (
                          <tr key={spentKey} className="border-b border-white/5">
                            <td className="py-2 pr-2 text-gray-400 whitespace-nowrap">{label}</td>
                            <td className="py-2 pr-2">
                              <input
                                type="number"
                                min={0}
                                value={activeKidData[availKey] ?? 0}
                                onChange={(e) => updateKidField(availKey, e.target.value)}
                                className="w-24 px-2 py-1.5 bg-slate-900/50 border border-white/10 rounded-lg text-sm"
                              />
                            </td>
                            <td className="py-2 pr-2">
                              <input
                                type="number"
                                min={0}
                                value={activeKidData[spentKey] ?? 0}
                                onChange={(e) => updateKidField(spentKey, e.target.value)}
                                className="w-24 px-2 py-1.5 bg-slate-900/50 border border-white/10 rounded-lg text-sm"
                              />
                            </td>
                            <td className={`py-2 text-sm font-semibold whitespace-nowrap ${left < 0 ? 'text-red-300' : left === 0 ? 'text-gray-500' : 'text-green-300'}`}>
                              {left < 0 ? '-' : ''}{formatINR(Math.abs(left))}
                            </td>
                          </tr>
                        );
                      })}
                      {(() => {
                        const avail = Number(activeKidData.runAvailCustom) || 0;
                        const spent = Number(activeKidData.runCustomAmount) || 0;
                        const left = avail - spent;
                        return (
                          <tr className="border-b border-white/5">
                            <td className="py-2 pr-2 text-gray-400">{activeKidData.customLabel || 'Other'}</td>
                            <td className="py-2 pr-2">
                              <input
                                type="number"
                                min={0}
                                value={activeKidData.runAvailCustom ?? 0}
                                onChange={(e) => updateKidField('runAvailCustom', e.target.value)}
                                className="w-24 px-2 py-1.5 bg-slate-900/50 border border-white/10 rounded-lg text-sm"
                              />
                            </td>
                            <td className="py-2 pr-2">
                              <input
                                type="number"
                                min={0}
                                value={activeKidData.runCustomAmount ?? 0}
                                onChange={(e) => updateKidField('runCustomAmount', e.target.value)}
                                className="w-24 px-2 py-1.5 bg-slate-900/50 border border-white/10 rounded-lg text-sm"
                              />
                            </td>
                            <td className={`py-2 text-sm font-semibold ${left < 0 ? 'text-red-300' : left === 0 ? 'text-gray-500' : 'text-green-300'}`}>
                              {left < 0 ? '-' : ''}{formatINR(Math.abs(left))}
                            </td>
                          </tr>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>
                {(() => {
                  const totalAvail = ['runAvailSchool','runAvailBirthday','runAvailMutualFunds','runAvailClasses','runAvailShopping','runAvailSukanya','runAvailCustom']
                    .reduce((s, k) => s + (Number(activeKidData[k]) || 0), 0);
                  const totalSpent = ['runSchool','runBirthday','runMutualFunds','runClasses','runShopping','runSukanya','runCustomAmount']
                    .reduce((s, k) => s + (Number(activeKidData[k]) || 0), 0);
                  const totalLeft = totalAvail - totalSpent;
                  return (
                    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm border-t border-white/5 pt-3">
                      <span className="text-gray-400">Available: <span className="font-semibold text-white">{formatINR(totalAvail)}</span></span>
                      <span className="text-gray-400">Spent: <span className="font-semibold text-white">{formatINR(totalSpent)}</span></span>
                      <span className={totalLeft < 0 ? 'text-red-300' : 'text-green-300'}>
                        Left: <span className="font-semibold">{totalLeft < 0 ? '-' : ''}{formatINR(Math.abs(totalLeft))}</span>
                      </span>
                    </div>
                  );
                })()}
              </section>
              </div>

              <section className="bg-slate-900/50 border border-white/10 rounded-2xl p-5">
                <h3 className="text-lg font-semibold text-blue-200 mb-4">Investment</h3>
                <div className="p-4 rounded-xl border border-blue-400/25 bg-blue-500/10 mb-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-400">Investment Target 2026 — {kids.activeKid === 'mannat' ? 'Mannat' : 'Meher'}</div>
                    <div className="text-xl font-bold text-blue-200">{formatINR(activeKidData.investmentBudget2026)}</div>
                  </div>
                  <label className="text-sm text-gray-300">
                    Edit Target
                    <input
                      type="number"
                      min={0}
                      value={activeKidData.investmentBudget2026}
                      onChange={(e) => updateKidField('investmentBudget2026', e.target.value)}
                      className="mt-2 block w-36 px-3 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-sm"
                    />
                  </label>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-400 border-b border-white/10">
                        <th className="py-2 pr-3">Category</th>
                        <th className="py-2">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {INVESTMENT_ASSETS.map(({ label, key, itemsKey }) => {
                        const items = activeKidData[itemsKey] || [];
                        const hasItems = items.length > 0;
                        const computedTotal = hasItems
                          ? items.reduce((s, i) => s + (Number(i.amount) || 0), 0)
                          : Number(activeKidData[key]) || 0;
                        return (
                          <tr key={key} className="border-b border-white/5">
                            <td className="py-2 pr-3">
                              <button
                                type="button"
                                onClick={() => setAssetPanel(itemsKey)}
                                className="flex items-center gap-1.5 hover:text-blue-300 transition-colors group text-left"
                              >
                                {label}
                                <svg className="w-3 h-3 opacity-30 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                            </td>
                            <td className="py-2">
                              {hasItems ? (
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold">{formatINR(computedTotal)}</span>
                                  <span className="text-xs text-gray-500">{items.length} {items.length === 1 ? 'entry' : 'entries'}</span>
                                </div>
                              ) : (
                                <input
                                  type="number"
                                  min={0}
                                  value={activeKidData[key]}
                                  onChange={(e) => updateKidField(key, e.target.value)}
                                  className="w-full sm:w-52 px-3 py-2 bg-slate-900/50 border border-white/10 rounded-lg"
                                />
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="border-b border-white/5">
                        <td className="py-2 pr-3">
                          <div className="flex items-center gap-1.5">
                            <input
                              value={activeKidData.invCustomLabel}
                              onChange={(e) => updateKidField('invCustomLabel', e.target.value)}
                              className="w-32 px-2 py-1.5 bg-slate-900/50 border border-white/10 rounded-lg text-sm"
                              placeholder="Other"
                            />
                            <button
                              type="button"
                              onClick={() => setAssetPanel('invCustomItems')}
                              className="text-gray-400 hover:text-blue-300 transition-colors"
                              title="Manage entries"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          </div>
                        </td>
                        <td className="py-2">
                          {(() => {
                            const items = activeKidData.invCustomItems || [];
                            const hasItems = items.length > 0;
                            const total = hasItems
                              ? items.reduce((s, i) => s + (Number(i.amount) || 0), 0)
                              : Number(activeKidData.invCustomAmount) || 0;
                            return hasItems ? (
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">{formatINR(total)}</span>
                                <span className="text-xs text-gray-500">{items.length} {items.length === 1 ? 'entry' : 'entries'}</span>
                              </div>
                            ) : (
                              <input
                                type="number"
                                min={0}
                                value={activeKidData.invCustomAmount}
                                onChange={(e) => updateKidField('invCustomAmount', e.target.value)}
                                className="w-full sm:w-52 px-3 py-2 bg-slate-900/50 border border-white/10 rounded-lg"
                              />
                            );
                          })()}
                        </td>
                      </tr>
                      {(activeKidData.invExtraCategories || []).map((cat) => {
                        const catTotal = (cat.items || []).reduce((s, i) => s + (Number(i.amount) || 0), 0);
                        const hasItems = (cat.items || []).length > 0;
                        return (
                          <tr key={cat.id} className="border-b border-white/5">
                            <td className="py-2 pr-3">
                              <div className="flex items-center gap-1.5">
                                <input
                                  value={cat.label}
                                  onChange={(e) => updateExtraCategoryLabel(cat.id, e.target.value)}
                                  className="w-28 px-2 py-1.5 bg-slate-900/50 border border-white/10 rounded-lg text-sm"
                                  placeholder="Category name"
                                />
                                <button
                                  type="button"
                                  onClick={() => setAssetPanel(`extra:${cat.id}`)}
                                  className="text-gray-400 hover:text-blue-300 transition-colors"
                                  title="Manage entries"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeExtraCategory(cat.id)}
                                  className="text-gray-600 hover:text-red-400 transition-colors"
                                  title="Remove category"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                            <td className="py-2">
                              {hasItems ? (
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold">{formatINR(catTotal)}</span>
                                  <span className="text-xs text-gray-500">{cat.items.length} {cat.items.length === 1 ? 'entry' : 'entries'}</span>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setAssetPanel(`extra:${cat.id}`)}
                                  className="text-xs text-gray-500 hover:text-blue-300 transition-colors"
                                >
                                  Add entries →
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <button
                  type="button"
                  onClick={addExtraCategory}
                  className="mt-2 flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-300 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add category
                </button>
                <div className="mt-3 text-sm text-gray-300">Investment total: <span className="font-semibold">{formatINR(kidsInvestmentTotal)}</span></div>
              </section>
            </div>

            <div className="lg:col-span-3 space-y-6">
              <section className="bg-slate-900/50 border border-white/10 rounded-2xl p-5">
                <h2 className="text-lg font-semibold mb-4 text-amber-200">Summary</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl border border-white/5 bg-slate-900/40">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Budget total</span>
                      <span className="font-semibold">{formatINR(kidsTotal)}</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl border border-white/5 bg-slate-900/40">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Budget remaining</span>
                      <span className={kidsBalance >= 0 ? 'font-semibold text-green-300' : 'font-semibold text-red-300'}>{formatINR(kidsBalance)}</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl border border-white/5 bg-slate-900/40">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Investment total</span>
                      <span className="font-semibold">{formatINR(kidsInvestmentTotal)}</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl border border-white/5 bg-slate-900/40">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Investment remaining</span>
                      <span className={kidsInvestmentBalance >= 0 ? 'font-semibold text-green-300' : 'font-semibold text-red-300'}>
                        {formatINR(kidsInvestmentBalance)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={saveKids}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-100 hover:bg-amber-500/25 transition-colors"
                  >
                    <Save size={16} />
                    Save kids plan
                  </button>
                  {kidsSaveState.status !== 'idle' && (
                    <span className={kidsSaveState.status === 'saved' ? 'text-green-300 text-sm' : 'text-red-300 text-sm'}>
                      {kidsSaveState.message}
                    </span>
                  )}
                </div>
                <p className="mt-4 text-xs text-gray-500">Bottom summary combines budget + investment totals for selected child.</p>
              </section>
            </div>
          </div>
        )}

        {activeSection === 'retirement' && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 space-y-6">
              <section className="bg-slate-900/50 border border-white/10 rounded-2xl p-5">
                <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                  <Landmark size={18} className="text-emerald-300" /> Retirement
                </h2>
                <p className="text-sm text-gray-400 mb-4">
                  Rough corpus need uses 4% rule on inflated monthly expenses at retirement. Projection compounds current corpus + monthly contributions.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-sm text-gray-400">Current age</span>
                    <input
                      type="number"
                      min={18}
                      max={100}
                      value={retirement.currentAge}
                      onChange={(e) => setRetirement((r) => ({ ...r, currentAge: e.target.value }))}
                      className="mt-2 w-full px-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-sm"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm text-gray-400">Retirement age</span>
                    <input
                      type="number"
                      min={40}
                      max={75}
                      value={retirement.retireAge}
                      onChange={(e) => setRetirement((r) => ({ ...r, retireAge: e.target.value }))}
                      className="mt-2 w-full px-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-sm"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm text-gray-400">Monthly expenses today (₹)</span>
                    <input
                      type="number"
                      min={0}
                      value={retirement.monthlyExpenseToday}
                      onChange={(e) => setRetirement((r) => ({ ...r, monthlyExpenseToday: e.target.value }))}
                      className="mt-2 w-full px-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-sm"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm text-gray-400">Inflation p.a. (%)</span>
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      value={retirement.inflationPct}
                      onChange={(e) => setRetirement((r) => ({ ...r, inflationPct: e.target.value }))}
                      className="mt-2 w-full px-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-sm"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm text-gray-400">Current retirement corpus (₹)</span>
                    <input
                      type="number"
                      min={0}
                      value={retirement.currentCorpus}
                      onChange={(e) => setRetirement((r) => ({ ...r, currentCorpus: e.target.value }))}
                      className="mt-2 w-full px-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-sm"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm text-gray-400">Monthly contribution (₹)</span>
                    <input
                      type="number"
                      min={0}
                      value={retirement.monthlyContribution}
                      onChange={(e) => setRetirement((r) => ({ ...r, monthlyContribution: e.target.value }))}
                      className="mt-2 w-full px-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-sm"
                    />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="text-sm text-gray-400">Expected portfolio return p.a. (%)</span>
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      value={retirement.expectedReturnPct}
                      onChange={(e) => setRetirement((r) => ({ ...r, expectedReturnPct: e.target.value }))}
                      className="mt-2 w-full px-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-sm"
                    />
                  </label>
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={saveRetirement}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-100 hover:bg-emerald-500/25 transition-colors"
                  >
                    <Save size={16} />
                    Save retirement plan
                  </button>
                  {retSaveState.status !== 'idle' && (
                    <span className={retSaveState.status === 'saved' ? 'text-green-300 text-sm' : 'text-red-300 text-sm'}>
                      {retSaveState.message}
                    </span>
                  )}
                </div>
                <p className="mt-4 text-xs text-gray-500">Illustrative only. Not financial advice.</p>
              </section>
            </div>
            <div className="lg:col-span-2">
              <section className="bg-slate-900/50 border border-white/10 rounded-2xl p-5">
                <h2 className="text-lg font-semibold mb-4 text-emerald-200">At retirement</h2>
                <div className="space-y-3">
                  <div className="p-3 rounded-xl border border-white/5 bg-slate-900/40">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Years to retire</span>
                      <span className="font-semibold">{retirementComputed.yearsLeft}</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl border border-white/5 bg-slate-900/40">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Monthly need (inflated)</span>
                      <span className="font-semibold">{formatINR(Math.round(retirementComputed.monthlyAtRetire))}</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl border border-white/5 bg-slate-900/40">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Corpus need (4% rule)</span>
                      <span className="font-semibold">{formatINR(Math.round(retirementComputed.corpusNeeded))}</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300 text-sm">Projected corpus</span>
                      <span className="font-bold text-emerald-200">{formatINR(Math.round(retirementComputed.projectedCorpus))}</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl border border-white/5 bg-slate-900/40">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Shortfall (if any)</span>
                      <span
                        className={
                          retirementComputed.shortfall > 0 ? 'font-semibold text-red-300' : 'font-semibold text-green-300'
                        }
                      >
                        {formatINR(Math.round(retirementComputed.shortfall))}
                      </span>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}
      </main>

      {/* ── Asset holdings slide-over panel ─────────────────────────────── */}
      {assetPanel && (() => {
        const isExtra = assetPanel.startsWith('extra:');
        const extraCatId = isExtra ? Number(assetPanel.slice(6)) : null;
        const extraCat = isExtra ? (activeKidData.invExtraCategories || []).find((c) => c.id === extraCatId) : null;
        const assetConfig = !isExtra ? INVESTMENT_ASSETS.find((a) => a.itemsKey === assetPanel) : null;
        const panelLabel = isExtra
          ? (extraCat?.label || 'Category')
          : assetConfig
            ? assetConfig.label
            : activeKidData.invCustomLabel || 'Custom';
        const items = isExtra ? (extraCat?.items || []) : (activeKidData[assetPanel] || []);
        const panelTotal = items.reduce((s, i) => s + (Number(i.amount) || 0), 0);
        const kidName = kids.activeKid === 'mannat' ? 'Mannat' : 'Meher';

        return (
          <div className="fixed inset-0 z-50 flex items-stretch justify-end">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setAssetPanel(null)}
            />
            {/* Panel */}
            <div className="relative w-full max-w-sm bg-slate-900 border-l border-white/10 flex flex-col shadow-2xl">
              {/* Header */}
              <div className="p-5 border-b border-white/10 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">{kidName}</p>
                  <h3 className="text-lg font-semibold">{panelLabel} Holdings</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setAssetPanel(null)}
                  className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Items list */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {items.length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-10">
                    No entries yet. Click &quot;Add entry&quot; below to start.
                  </p>
                )}
                {items.map((item) => {
                  const onField = (field, val) => isExtra
                    ? updateExtraHoldingItem(extraCatId, item.id, field, val)
                    : updateHoldingItem(assetPanel, item.id, field, val);
                  const onRemove = () => isExtra
                    ? removeExtraHoldingItem(extraCatId, item.id)
                    : removeHoldingItem(assetPanel, item.id);
                  return (
                    <div key={item.id} className="p-3 rounded-xl bg-slate-800/60 border border-white/5 space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => onField('name', e.target.value)}
                          placeholder="Name / Description"
                          className="flex-1 min-w-0 px-3 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-sm"
                        />
                        <button
                          type="button"
                          onClick={onRemove}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <label className="flex-1">
                          <span className="text-xs text-gray-500 mb-1 block">Qty</span>
                          <input
                            type="number"
                            min={0}
                            value={item.qty ?? 0}
                            onChange={(e) => onField('qty', e.target.value)}
                            placeholder="0"
                            className="w-full px-3 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-sm"
                          />
                        </label>
                        <label className="flex-1">
                          <span className="text-xs text-gray-500 mb-1 block">Price (₹)</span>
                          <input
                            type="number"
                            min={0}
                            value={item.price ?? 0}
                            onChange={(e) => onField('price', e.target.value)}
                            placeholder="0"
                            className="w-full px-3 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-sm"
                          />
                        </label>
                      </div>
                      <div className="flex items-center justify-between pt-0.5">
                        <span className="text-xs text-gray-500">Value</span>
                        <span className="text-sm font-semibold text-emerald-300">
                          {formatINR((Number(item.qty) || 0) * (Number(item.price) || 0))}
                        </span>
                      </div>
                      <input
                        type="text"
                        value={item.notes || ''}
                        onChange={(e) => onField('notes', e.target.value)}
                        placeholder="Notes (e.g. bank, account no., maturity date)"
                        className="w-full px-3 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-xs text-gray-400 placeholder-slate-600"
                      />
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={() => isExtra ? addExtraHoldingItem(extraCatId) : addHoldingItem(assetPanel)}
                  className="w-full py-2.5 rounded-xl border border-dashed border-white/20 text-gray-400 hover:text-white hover:border-white/40 text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add entry
                </button>
              </div>

              {/* Footer */}
              <div className="p-5 border-t border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-400 text-sm">Total</span>
                  <span className="text-xl font-bold text-blue-200">{formatINR(panelTotal)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => { saveKids(); setAssetPanel(null); }}
                  className="w-full py-3 rounded-xl bg-blue-500/20 border border-blue-400/40 text-blue-200 hover:bg-blue-500/30 font-semibold text-sm transition-colors"
                >
                  Save &amp; Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

