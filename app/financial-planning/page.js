'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Home,
  Save,
  Lock,
  ShieldCheck,
  AlertTriangle,
  Baby,
  Landmark,
  CalendarDays,
  FileDown,
  Shield,
  Wallet,
  Target,
  ChevronDown,
  ChevronRight,
  Scale,
} from 'lucide-react';

const SECTIONS = [
  { id: 'home',       label: 'Home',        icon: Home },
  { id: 'kids',       label: 'Kids',        icon: Baby },
  { id: 'retirement', label: 'Retirement',  icon: Landmark },
  { id: 'monthly',    label: 'Monthly View',icon: CalendarDays },
  { id: 'insurance',  label: 'Insurance',   icon: Shield },
  { id: 'funds',      label: 'Funds',         icon: Wallet },
  { id: 'goals',      label: 'Goals',         icon: Target },
  { id: 'balance',    label: 'Balance Sheet', icon: Scale },
];

const RETIREMENT_SECTIONS = [
  { label: 'EPF',          key: 'epfItems',     accentColor: 'blue' },
  { label: 'NPS',          key: 'npsItems',     accentColor: 'purple' },
  { label: 'Pension Fund', key: 'pensionItems', accentColor: 'emerald' },
  { label: 'FD',           key: 'fdItems',      accentColor: 'amber' },
  { label: 'Other',        key: 'otherItems',   accentColor: 'slate' },
];

const INSURANCE_TYPES = ['Term', 'Life', 'Health', 'Vehicle', 'Property', 'Other'];

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

const DEFAULT_MONTHLY_CATEGORY_LABELS = [
  'Elec+Gas', 'Home', 'Support', 'Personal', 'Kids', 'Equity', 'CC Exp', 'Loan', 'Misc',
];

function defaultMonthData() {
  return {
    categories: DEFAULT_MONTHLY_CATEGORY_LABELS.map((label, i) => ({
      id: i + 1,
      label,
      subs: [],
    })),
  };
}

function currentMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

const DEFAULT_MONTHLY = {
  budgetOpen: true,
  activeMonth: currentMonthKey(),
  months: {},
};

const DEFAULT_RETIREMENT = {
  currentAge: 35,
  retireAge: 60,
  monthlyExpenseToday: 80000,
  inflationPct: 6,
  expectedReturnPct: 9,
  epfItems: [],
  npsItems: [],
  pensionItems: [],
  fdItems: [],
  otherItems: [],
};

const DEFAULT_INSURANCE = { policies: [] };

const DEFAULT_FUNDS = {
  categories: [
    { id: 1, label: 'Travel',   open: true, subs: [] },
    { id: 2, label: 'Equity',   open: true, subs: [] },
    { id: 3, label: 'School',   open: true, subs: [] },
    { id: 4, label: 'Property', open: true, subs: [] },
  ],
};

const DEFAULT_GOALS = { items: [] };

const DEFAULT_BALANCE = {
  assets: [
    { id: 1, label: 'Cash & Bank',  open: true, items: [] },
    { id: 2, label: 'Investments',  open: true, items: [] },
    { id: 3, label: 'Property',     open: true, items: [] },
    { id: 4, label: 'Vehicles',     open: true, items: [] },
    { id: 5, label: 'Other Assets', open: true, items: [] },
  ],
  liabilities: [
    { id: 1, label: 'Home Loan',          open: true, items: [] },
    { id: 2, label: 'Car Loan',           open: true, items: [] },
    { id: 3, label: 'Credit Cards',       open: true, items: [] },
    { id: 4, label: 'Personal Loan',      open: true, items: [] },
    { id: 5, label: 'Other Liabilities',  open: true, items: [] },
  ],
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
  const [loginStep, setLoginStep] = useState('credentials'); // 'credentials' | '2fa'
  const [totpInput, setTotpInput] = useState('');

  // Vault state
  const [vaultLoading, setVaultLoading] = useState(false);
  const [vaultLocked, setVaultLocked] = useState(false);
  const [vaultPassphraseSet, setVaultPassphraseSet] = useState(false);
  const [vaultInput, setVaultInput] = useState('');
  const [vaultError, setVaultError] = useState('');
  const [vaultSubmitting, setVaultSubmitting] = useState(false);

  // Security panel state
  const [securityOpen, setSecurityOpen] = useState(false);
  const [securityStatus, setSecurityStatus] = useState({ totpEnabled: null, vaultSet: null });
  const [totpSetupData, setTotpSetupData] = useState(null); // { secret, qrDataUrl } | null
  const [totpSetupCode, setTotpSetupCode] = useState('');
  const [totpSetupLoading, setTotpSetupLoading] = useState(false);
  const [totpSetupError, setTotpSetupError] = useState('');
  const [totpDisableCode, setTotpDisableCode] = useState('');
  const [totpDisableLoading, setTotpDisableLoading] = useState(false);
  const [vaultSetupPassphrase, setVaultSetupPassphrase] = useState('');
  const [vaultSetupConfirm, setVaultSetupConfirm] = useState('');
  const [vaultSetupLoading, setVaultSetupLoading] = useState(false);
  const [vaultSetupError, setVaultSetupError] = useState('');

  const [activeSection, setActiveSection] = useState('home');

  const [plan, setPlan] = useState(DEFAULT_PLAN);
  const [saveState, setSaveState] = useState({ status: 'idle', message: '' });

  const [kids, setKids] = useState(DEFAULT_KIDS);
  const [kidsSaveState, setKidsSaveState] = useState({ status: 'idle', message: '' });
  const [assetPanel, setAssetPanel] = useState(null); // itemsKey string | null
  const [monthCatPanel, setMonthCatPanel] = useState(null); // category id | null

  const [retirement, setRetirement] = useState(DEFAULT_RETIREMENT);
  const [monthly, setMonthly] = useState(DEFAULT_MONTHLY);
  const [monthlySaveState, setMonthlySaveState] = useState({ status: 'idle', message: '' });
  const [retSaveState, setRetSaveState] = useState({ status: 'idle', message: '' });
  const [insurance, setInsurance] = useState(DEFAULT_INSURANCE);
  const [insuranceSaveState, setInsuranceSaveState] = useState({ status: 'idle', message: '' });
  const [funds, setFunds] = useState(DEFAULT_FUNDS);
  const [fundsSaveState, setFundsSaveState] = useState({ status: 'idle', message: '' });
  const [goals, setGoals] = useState(DEFAULT_GOALS);
  const [goalsSaveState, setGoalsSaveState] = useState({ status: 'idle', message: '' });
  const [balance, setBalance] = useState(DEFAULT_BALANCE);
  const [balanceSaveState, setBalanceSaveState] = useState({ status: 'idle', message: '' });
  const [dataLoading, setDataLoading] = useState(false);
  const [retSectionPanel, setRetSectionPanel] = useState(null); // RETIREMENT_SECTIONS key | null

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

  // Check vault status and TOTP status whenever user authenticates
  useEffect(() => {
    if (!authed) return;
    let alive = true;
    setVaultLoading(true);
    (async () => {
      try {
        const [vaultRes, totpRes] = await Promise.all([
          fetch('/api/auth/vault/check',  { credentials: 'include' }),
          fetch('/api/auth/2fa/setup',    { credentials: 'include' }),
        ]);
        const [vaultJson, totpJson] = await Promise.all([vaultRes.json(), totpRes.json()]);
        if (!alive) return;
        setVaultPassphraseSet(!!vaultJson.passphraseSet);
        setVaultLocked(!vaultJson.unlocked);
        setSecurityStatus({ totpEnabled: !!totpJson.enabled, vaultSet: !!vaultJson.passphraseSet });
      } catch {
        if (alive) setVaultLocked(false);
      } finally {
        if (alive) setVaultLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [authed]);

  useEffect(() => {
    if (!authed) return;
    let alive = true;
    setDataLoading(true);
    (async () => {
      try {
        const [homeRes, kidsRes, retRes, monthlyRes, insRes, fundsRes, goalsRes, balRes] = await Promise.all([
          fetch('/api/plan/home',       { credentials: 'include' }),
          fetch('/api/plan/kids',       { credentials: 'include' }),
          fetch('/api/plan/retirement', { credentials: 'include' }),
          fetch('/api/plan/monthly',    { credentials: 'include' }),
          fetch('/api/plan/insurance',  { credentials: 'include' }),
          fetch('/api/plan/funds',      { credentials: 'include' }),
          fetch('/api/plan/goals',      { credentials: 'include' }),
          fetch('/api/plan/balance',    { credentials: 'include' }),
        ]);
        const [homeJson, kidsJson, retJson, monthlyJson, insJson, fundsJson, goalsJson, balJson] = await Promise.all([
          homeRes.json(), kidsRes.json(), retRes.json(), monthlyRes.json(), insRes.json(), fundsRes.json(), goalsRes.json(), balRes.json(),
        ]);
        if (!alive) return;

        if (homeJson.data)    setPlan((prev)       => ({ ...prev, ...homeJson.data }));
        else { try { const r = localStorage.getItem('bv-financial-plan'); if (r) setPlan((prev) => ({ ...prev, ...JSON.parse(r) })); } catch {} }
        if (kidsJson.data)    setKids((prev)       => ({ ...prev, ...kidsJson.data }));
        else { try { const r = localStorage.getItem('bv-financial-plan-kids'); if (r) setKids((prev) => ({ ...prev, ...JSON.parse(r) })); } catch {} }
        if (retJson.data)     setRetirement((prev) => ({ ...prev, ...retJson.data }));
        else { try { const r = localStorage.getItem('bv-financial-plan-retirement'); if (r) setRetirement((prev) => ({ ...prev, ...JSON.parse(r) })); } catch {} }
        if (monthlyJson.data) setMonthly((prev)    => ({ ...prev, ...monthlyJson.data }));
        else { try { const r = localStorage.getItem('bv-financial-plan-monthly'); if (r) setMonthly((prev) => ({ ...prev, ...JSON.parse(r) })); } catch {} }
        if (insJson.data)     setInsurance((prev)  => ({ ...prev, ...insJson.data }));
        if (fundsJson.data)   setFunds((prev)      => ({ ...prev, ...fundsJson.data }));
        if (goalsJson.data)   setGoals((prev)      => ({ ...prev, ...goalsJson.data }));
        if (balJson.data)     setBalance((prev)    => ({ ...prev, ...balJson.data }));
      } catch {
        if (!alive) return;
        try { const r = localStorage.getItem('bv-financial-plan'); if (r) setPlan((prev) => ({ ...prev, ...JSON.parse(r) })); } catch {}
        try { const r = localStorage.getItem('bv-financial-plan-kids'); if (r) setKids((prev) => ({ ...prev, ...JSON.parse(r) })); } catch {}
        try { const r = localStorage.getItem('bv-financial-plan-retirement'); if (r) setRetirement((prev) => ({ ...prev, ...JSON.parse(r) })); } catch {}
        try { const r = localStorage.getItem('bv-financial-plan-monthly'); if (r) setMonthly((prev) => ({ ...prev, ...JSON.parse(r) })); } catch {}
      } finally {
        if (alive) setDataLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [authed]);

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

  const savePlan = async () => {
    try {
      const res = await fetch('/api/plan/home', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plan),
      });
      if (!res.ok) throw new Error();
      try { localStorage.setItem('bv-financial-plan', JSON.stringify(plan)); } catch {}
      setSaveState({ status: 'saved', message: 'Plan saved.' });
      setTimeout(() => setSaveState({ status: 'idle', message: '' }), 2500);
    } catch {
      setSaveState({ status: 'error', message: 'Could not save plan.' });
    }
  };

  const saveKids = async () => {
    try {
      const res = await fetch('/api/plan/kids', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(kids),
      });
      if (!res.ok) throw new Error();
      try { localStorage.setItem('bv-financial-plan-kids', JSON.stringify(kids)); } catch {}
      setKidsSaveState({ status: 'saved', message: 'Kids plan saved.' });
      setTimeout(() => setKidsSaveState({ status: 'idle', message: '' }), 2500);
    } catch {
      setKidsSaveState({ status: 'error', message: 'Could not save.' });
    }
  };

  const saveRetirement = async () => {
    try {
      const res = await fetch('/api/plan/retirement', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(retirement),
      });
      if (!res.ok) throw new Error();
      try { localStorage.setItem('bv-financial-plan-retirement', JSON.stringify(retirement)); } catch {}
      setRetSaveState({ status: 'saved', message: 'Retirement plan saved.' });
      setTimeout(() => setRetSaveState({ status: 'idle', message: '' }), 2500);
    } catch {
      setRetSaveState({ status: 'error', message: 'Could not save.' });
    }
  };

  const saveMonthly = async () => {
    try {
      const res = await fetch('/api/plan/monthly', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(monthly),
      });
      if (!res.ok) throw new Error();
      try { localStorage.setItem('bv-financial-plan-monthly', JSON.stringify(monthly)); } catch {}
      setMonthlySaveState({ status: 'saved', message: 'Monthly plan saved.' });
      setTimeout(() => setMonthlySaveState({ status: 'idle', message: '' }), 2500);
    } catch {
      setMonthlySaveState({ status: 'error', message: 'Could not save.' });
    }
  };

  const saveInsurance = async () => {
    try {
      const res = await fetch('/api/plan/insurance', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(insurance),
      });
      if (!res.ok) throw new Error();
      setInsuranceSaveState({ status: 'saved', message: 'Insurance data saved.' });
      setTimeout(() => setInsuranceSaveState({ status: 'idle', message: '' }), 2500);
    } catch {
      setInsuranceSaveState({ status: 'error', message: 'Could not save.' });
    }
  };

  const saveFunds = async () => {
    try {
      const res = await fetch('/api/plan/funds', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(funds),
      });
      if (!res.ok) throw new Error();
      setFundsSaveState({ status: 'saved', message: 'Funds saved.' });
      setTimeout(() => setFundsSaveState({ status: 'idle', message: '' }), 2500);
    } catch {
      setFundsSaveState({ status: 'error', message: 'Could not save.' });
    }
  };

  const saveGoals = async () => {
    try {
      const res = await fetch('/api/plan/goals', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goals),
      });
      if (!res.ok) throw new Error();
      setGoalsSaveState({ status: 'saved', message: 'Goals saved.' });
      setTimeout(() => setGoalsSaveState({ status: 'idle', message: '' }), 2500);
    } catch {
      setGoalsSaveState({ status: 'error', message: 'Could not save.' });
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

  const activeMonthData = useMemo(() => {
    const saved = monthly.months[monthly.activeMonth];
    if (saved?.categories) return saved;
    return defaultMonthData();
  }, [monthly]);

  const setActiveMonthCats = (cats) => {
    const month = monthly.activeMonth;
    setMonthly((prev) => ({
      ...prev,
      months: {
        ...prev.months,
        [month]: { ...(prev.months[month] || defaultMonthData()), categories: cats },
      },
    }));
  };

  const addMonthSubcat = (catId) => {
    setActiveMonthCats(activeMonthData.categories.map((cat) =>
      cat.id === catId
        ? { ...cat, subs: [...(cat.subs || []), { id: Date.now(), label: '', budget: 0, runAvail: 0, runSpent: 0 }] }
        : cat
    ));
  };

  const updateMonthSubcat = (catId, subcatId, field, value) => {
    setActiveMonthCats(activeMonthData.categories.map((cat) =>
      cat.id === catId
        ? { ...cat, subs: (cat.subs || []).map((s) => s.id === subcatId ? { ...s, [field]: value } : s) }
        : cat
    ));
  };

  const removeMonthSubcat = (catId, subcatId) => {
    setActiveMonthCats(activeMonthData.categories.map((cat) =>
      cat.id === catId
        ? { ...cat, subs: (cat.subs || []).filter((s) => s.id !== subcatId) }
        : cat
    ));
  };

  const updateMonthCatLabel = (catId, label) => {
    setActiveMonthCats(activeMonthData.categories.map((cat) =>
      cat.id === catId ? { ...cat, label } : cat
    ));
  };

  const addMonthCategory = () => {
    setActiveMonthCats([
      ...activeMonthData.categories,
      { id: Date.now(), label: 'New Category', subs: [] },
    ]);
  };

  const removeMonthCategory = (catId) => {
    setActiveMonthCats(activeMonthData.categories.filter((cat) => cat.id !== catId));
  };

  const navigateMonth = (dir) => {
    const [y, m] = monthly.activeMonth.split('-').map(Number);
    const d = new Date(y, m - 1 + dir, 1);
    setMonthly((prev) => ({
      ...prev,
      activeMonth: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
    }));
  };

  const monthLabel = (key) => {
    const [y, m] = key.split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  };

  const saveBalance = async () => {
    try {
      const res = await fetch('/api/plan/balance', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(balance),
      });
      if (!res.ok) throw new Error();
      setBalanceSaveState({ status: 'saved', message: 'Balance sheet saved.' });
      setTimeout(() => setBalanceSaveState({ status: 'idle', message: '' }), 2500);
    } catch {
      setBalanceSaveState({ status: 'error', message: 'Could not save.' });
    }
  };

  // ── Balance sheet helpers ───────────────────────────────────────────────
  const toggleBalanceCat = (side, catId) => {
    setBalance((prev) => ({ ...prev, [side]: prev[side].map((c) => c.id === catId ? { ...c, open: !c.open } : c) }));
  };
  const addBalanceCat = (side) => {
    const label = side === 'assets' ? 'New Asset Category' : 'New Liability Category';
    setBalance((prev) => ({ ...prev, [side]: [...prev[side], { id: Date.now(), label, open: true, items: [] }] }));
  };
  const removeBalanceCat = (side, catId) => {
    setBalance((prev) => ({ ...prev, [side]: prev[side].filter((c) => c.id !== catId) }));
  };
  const updateBalanceCatLabel = (side, catId, label) => {
    setBalance((prev) => ({ ...prev, [side]: prev[side].map((c) => c.id === catId ? { ...c, label } : c) }));
  };
  const addBalanceItem = (side, catId) => {
    setBalance((prev) => ({ ...prev, [side]: prev[side].map((c) => c.id === catId ? { ...c, items: [...(c.items || []), { id: Date.now(), name: '', value: 0, notes: '' }] } : c) }));
  };
  const updateBalanceItem = (side, catId, itemId, field, value) => {
    setBalance((prev) => ({ ...prev, [side]: prev[side].map((c) => c.id === catId ? { ...c, items: (c.items || []).map((i) => i.id === itemId ? { ...i, [field]: value } : i) } : c) }));
  };
  const removeBalanceItem = (side, catId, itemId) => {
    setBalance((prev) => ({ ...prev, [side]: prev[side].map((c) => c.id === catId ? { ...c, items: (c.items || []).filter((i) => i.id !== itemId) } : c) }));
  };

  // ── Funds helpers ──────────────────────────────────────────────────────
  const toggleFundCat = (catId) => {
    setFunds((prev) => ({ ...prev, categories: prev.categories.map((c) => c.id === catId ? { ...c, open: !c.open } : c) }));
  };
  const addFundCategory = () => {
    setFunds((prev) => ({ ...prev, categories: [...prev.categories, { id: Date.now(), label: 'New Category', open: true, subs: [] }] }));
  };
  const removeFundCategory = (catId) => {
    setFunds((prev) => ({ ...prev, categories: prev.categories.filter((c) => c.id !== catId) }));
  };
  const updateFundCatLabel = (catId, label) => {
    setFunds((prev) => ({ ...prev, categories: prev.categories.map((c) => c.id === catId ? { ...c, label } : c) }));
  };
  const addFundSub = (catId) => {
    setFunds((prev) => ({ ...prev, categories: prev.categories.map((c) => c.id === catId ? { ...c, subs: [...(c.subs || []), { id: Date.now(), label: '', available: 0, spent: 0, notes: '' }] } : c) }));
  };
  const updateFundSub = (catId, subId, field, value) => {
    setFunds((prev) => ({ ...prev, categories: prev.categories.map((c) => c.id === catId ? { ...c, subs: (c.subs || []).map((s) => s.id === subId ? { ...s, [field]: value } : s) } : c) }));
  };
  const removeFundSub = (catId, subId) => {
    setFunds((prev) => ({ ...prev, categories: prev.categories.map((c) => c.id === catId ? { ...c, subs: (c.subs || []).filter((s) => s.id !== subId) } : c) }));
  };

  // ── Goals helpers ───────────────────────────────────────────────────────
  const addGoal = () => {
    setGoals((prev) => ({ ...prev, items: [...(prev.items || []), { id: Date.now(), title: '', targetAmount: 0, savedAmount: 0, targetDate: '', category: '', notes: '' }] }));
  };
  const updateGoal = (id, field, value) => {
    setGoals((prev) => ({ ...prev, items: (prev.items || []).map((g) => g.id === id ? { ...g, [field]: value } : g) }));
  };
  const removeGoal = (id) => {
    setGoals((prev) => ({ ...prev, items: (prev.items || []).filter((g) => g.id !== id) }));
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

  const retirementTotals = useMemo(() => {
    const keys = RETIREMENT_SECTIONS.map((s) => s.key);
    const corpus = keys.reduce((s, k) => s + (retirement[k] || []).reduce((ss, i) => ss + (Number(i.currentValue) || 0), 0), 0);
    const contrib = keys.reduce((s, k) => s + (retirement[k] || []).reduce((ss, i) => ss + (Number(i.monthlyContrib) || 0), 0), 0);
    return { corpus, contrib };
  }, [retirement]);

  const retirementComputed = useMemo(() => {
    const ageNow = Number(retirement.currentAge) || 0;
    const retireAt = Number(retirement.retireAge) || 0;
    const yearsLeft = Math.max(0, retireAt - ageNow);
    const expToday = Number(retirement.monthlyExpenseToday) || 0;
    const infl = (Number(retirement.inflationPct) || 0) / 100;
    const monthlyAtRetire = expToday * (1 + infl) ** yearsLeft;
    const corpusNeeded = (monthlyAtRetire * 12) / 0.04;
    const corpus = retirementTotals.corpus;
    const contrib = retirementTotals.contrib;
    const retR = (Number(retirement.expectedReturnPct) || 0) / 100 / 12;
    const n = yearsLeft * 12;
    let fvCorpus = corpus;
    if (n > 0 && retR !== 0) {
      fvCorpus = corpus * (1 + retR) ** n + (contrib * ((1 + retR) ** n - 1)) / retR;
    } else if (n > 0) {
      fvCorpus = corpus + contrib * n;
    }
    return { yearsLeft, monthlyAtRetire, corpusNeeded, projectedCorpus: fvCorpus, shortfall: Math.max(0, corpusNeeded - fvCorpus) };
  }, [retirement, retirementTotals]);

  const addRetirementItem = (key) => {
    setRetirement((r) => ({ ...r, [key]: [...(r[key] || []), { id: Date.now(), name: '', currentValue: 0, monthlyContrib: 0, notes: '' }] }));
  };
  const updateRetirementItem = (key, id, field, value) => {
    setRetirement((r) => ({ ...r, [key]: (r[key] || []).map((item) => item.id === id ? { ...item, [field]: value } : item) }));
  };
  const removeRetirementItem = (key, id) => {
    setRetirement((r) => ({ ...r, [key]: (r[key] || []).filter((item) => item.id !== id) }));
  };

  const addPolicy = () => {
    setInsurance((prev) => ({ ...prev, policies: [...prev.policies, { id: Date.now(), type: 'Term', insurer: '', sumAssured: 0, premium: 0, policyNo: '', expiryDate: '', notes: '' }] }));
  };
  const updatePolicy = (id, field, value) => {
    setInsurance((prev) => ({ ...prev, policies: prev.policies.map((p) => p.id === id ? { ...p, [field]: value } : p) }));
  };
  const removePolicy = (id) => {
    setInsurance((prev) => ({ ...prev, policies: prev.policies.filter((p) => p.id !== id) }));
  };

  const [exportOpen, setExportOpen] = useState(false);

  const triggerDownload = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    const data = { home: plan, kids, retirement, monthly, insurance, funds, goals, balance, exportedAt: new Date().toISOString() };
    triggerDownload(
      new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
      `financial-plan-${new Date().toISOString().slice(0, 10)}.json`
    );
    setExportOpen(false);
  };

  const exportCSV = () => {
    const rows = [];
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const row = (...cols) => rows.push(cols.map(esc).join(','));
    const blank = () => rows.push('');

    // Home plan
    row('Section', 'Category', 'Value');
    row('Home Plan', 'Monthly Income', plan.monthlyIncome);
    row('Home Plan', 'Essential Expenses', plan.essentialExpenses);
    row('Home Plan', 'Discretionary Expenses', plan.discretionaryExpenses);
    row('Home Plan', 'Emergency Fund Months', plan.emergencyMonths);
    row('Home Plan', 'Invest % of Surplus', plan.investPercent);
    blank();

    // Retirement calculator inputs
    row('Retirement', 'Current Age', retirement.currentAge);
    row('Retirement', 'Retire Age', retirement.retireAge);
    row('Retirement', 'Monthly Expense Today', retirement.monthlyExpenseToday);
    row('Retirement', 'Inflation %', retirement.inflationPct);
    row('Retirement', 'Expected Return %', retirement.expectedReturnPct);
    row('Retirement', 'Total Corpus (computed)', retirementTotals.corpus);
    row('Retirement', 'Total Monthly Contrib (computed)', retirementTotals.contrib);
    blank();
    // Retirement holdings
    for (const sec of RETIREMENT_SECTIONS) {
      const items = retirement[sec.key] || [];
      if (items.length) {
        row(`Retirement ${sec.label}`, 'Name', 'Current Value', 'Monthly Contrib', 'Notes');
        for (const item of items) row(`Retirement ${sec.label}`, item.name, item.currentValue, item.monthlyContrib, item.notes);
        blank();
      }
    }
    // Insurance
    if ((insurance.policies || []).length) {
      row('Insurance', 'Type', 'Insurer', 'Sum Assured', 'Premium', 'Policy No', 'Expiry', 'Notes');
      for (const p of insurance.policies) {
        row('Insurance', p.type, p.insurer, p.sumAssured, p.premium, p.policyNo, p.expiryDate, p.notes);
      }
      blank();
    }

    // Kids — budget + running + holdings
    for (const kidId of ['mannat', 'meher']) {
      const kid = kids[kidId] || {};
      const name = kidId.charAt(0).toUpperCase() + kidId.slice(1);

      row(`Kids ${name}`, 'Budget 2026', kid.budget2026);
      row(`Kids ${name}`, 'Investment Target 2026', kid.investmentBudget2026);
      for (const [label, key] of [['School','school'],['Birthday','birthday'],['Mutual Funds','mutualFunds'],['Classes','classes'],['Shopping','shopping'],['Sukanya','sukanya']]) {
        row(`Kids ${name} Budget`, label, kid[key]);
      }
      row(`Kids ${name} Budget`, kid.customLabel || 'Other', kid.customAmount);
      blank();

      for (const [label, availKey, spentKey] of [
        ['School','runAvailSchool','runSchool'],['Birthday','runAvailBirthday','runBirthday'],
        ['Mutual Funds','runAvailMutualFunds','runMutualFunds'],['Classes','runAvailClasses','runClasses'],
        ['Shopping','runAvailShopping','runShopping'],['Sukanya','runAvailSukanya','runSukanya'],
      ]) {
        row(`Kids ${name} Running`, `${label} Available`, kid[availKey] ?? 0);
        row(`Kids ${name} Running`, `${label} Spent`, kid[spentKey] ?? 0);
      }
      row(`Kids ${name} Running`, `${kid.customLabel || 'Other'} Available`, kid.runAvailCustom ?? 0);
      row(`Kids ${name} Running`, `${kid.customLabel || 'Other'} Spent`, kid.runCustomAmount ?? 0);
      blank();

      // Holdings
      for (const asset of INVESTMENT_ASSETS) {
        const items = kid[asset.itemsKey] || [];
        if (items.length) {
          row(`Kids ${name} ${asset.label}`, 'Name', 'Qty', 'Price', 'Value', 'Notes');
          for (const item of items) row(`Kids ${name} ${asset.label}`, item.name, item.qty, item.price, item.amount, item.notes);
          blank();
        }
      }
      for (const cat of kid.invExtraCategories || []) {
        if (cat.items?.length) {
          row(`Kids ${name} ${cat.label}`, 'Name', 'Qty', 'Price', 'Value', 'Notes');
          for (const item of cat.items) row(`Kids ${name} ${cat.label}`, item.name, item.qty, item.price, item.amount, item.notes);
          blank();
        }
      }
    }

    // Monthly — all saved months
    for (const [monthKey, md] of Object.entries(monthly.months || {})) {
      const [y, m] = monthKey.split('-').map(Number);
      const mlabel = new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
      for (const cat of md.categories || []) {
        for (const sub of cat.subs || []) {
          row(`Monthly ${mlabel}`, cat.label, sub.label, sub.budget ?? 0, sub.runAvail ?? 0, sub.runSpent ?? 0);
        }
      }
      blank();
    }

    // Balance Sheet
    for (const cat of balance.assets || []) {
      for (const item of cat.items || []) row('Balance Sheet Assets', cat.label, item.name, item.value, item.notes);
    }
    blank();
    for (const cat of balance.liabilities || []) {
      for (const item of cat.items || []) row('Balance Sheet Liabilities', cat.label, item.name, item.value, item.notes);
    }
    blank();

    // Funds
    for (const cat of funds.categories || []) {
      for (const sub of cat.subs || []) {
        row(`Funds`, cat.label, sub.label, sub.available ?? 0, sub.spent ?? 0, sub.notes);
      }
      blank();
    }

    // Goals
    if ((goals.items || []).length) {
      row('Goals', 'Title', 'Target (₹)', 'Saved (₹)', 'Target Date', 'Category', 'Notes');
      for (const g of goals.items) row('Goals', g.title, g.targetAmount, g.savedAmount, g.targetDate, g.category, g.notes);
      blank();
    }

    triggerDownload(
      new Blob([rows.join('\n')], { type: 'text/csv' }),
      `financial-plan-${new Date().toISOString().slice(0, 10)}.csv`
    );
    setExportOpen(false);
  };

  const doLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {
      // ignore
    }
    setAuthed(false);
    setLoginPassword('');
    setLoginError('');
    setLoginStep('credentials');
    setTotpInput('');
  };

  const doVerify2FA = async () => {
    setLoginSubmitting(true);
    setLoginError('');
    try {
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: totpInput }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        setLoginError(data?.error || 'Invalid code.');
        return;
      }
      setAuthed(true);
      setLoginStep('credentials');
      setTotpInput('');
    } catch {
      setLoginError('Verification failed. Please try again.');
    } finally {
      setLoginSubmitting(false);
    }
  };

  const doVaultUnlock = async () => {
    setVaultSubmitting(true);
    setVaultError('');
    try {
      const res = await fetch('/api/auth/vault/unlock', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passphrase: vaultInput }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        setVaultError(data?.error || 'Incorrect passphrase.');
        return;
      }
      setVaultLocked(false);
      setVaultInput('');
    } catch {
      setVaultError('Could not unlock. Please try again.');
    } finally {
      setVaultSubmitting(false);
    }
  };

  const loadTotpSetup = async () => {
    setTotpSetupLoading(true);
    setTotpSetupError('');
    try {
      const res = await fetch('/api/auth/2fa/setup', { credentials: 'include' });
      const data = await res.json();
      if (data.enabled) {
        setSecurityStatus((s) => ({ ...s, totpEnabled: true }));
        setTotpSetupData(null);
      } else {
        setTotpSetupData({ secret: data.secret, qrDataUrl: data.qrDataUrl });
      }
    } catch {
      setTotpSetupError('Could not load setup data.');
    } finally {
      setTotpSetupLoading(false);
    }
  };

  const enableTotp = async () => {
    setTotpSetupLoading(true);
    setTotpSetupError('');
    try {
      const res = await fetch('/api/auth/2fa/setup', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: totpSetupCode }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        setTotpSetupError(data?.error || 'Invalid code.');
        return;
      }
      setSecurityStatus((s) => ({ ...s, totpEnabled: true }));
      setTotpSetupData(null);
      setTotpSetupCode('');
    } catch {
      setTotpSetupError('Could not enable 2FA.');
    } finally {
      setTotpSetupLoading(false);
    }
  };

  const disableTotp = async () => {
    setTotpDisableLoading(true);
    setTotpSetupError('');
    try {
      const res = await fetch('/api/auth/2fa/disable', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: totpDisableCode }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        setTotpSetupError(data?.error || 'Invalid code.');
        return;
      }
      setSecurityStatus((s) => ({ ...s, totpEnabled: false }));
      setTotpDisableCode('');
    } catch {
      setTotpSetupError('Could not disable 2FA.');
    } finally {
      setTotpDisableLoading(false);
    }
  };

  const setupVaultPassphrase = async () => {
    if (vaultSetupPassphrase !== vaultSetupConfirm) {
      setVaultSetupError('Passphrases do not match.');
      return;
    }
    setVaultSetupLoading(true);
    setVaultSetupError('');
    try {
      const res = await fetch('/api/auth/vault/setup', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passphrase: vaultSetupPassphrase }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        setVaultSetupError(data?.error || 'Could not set passphrase.');
        return;
      }
      setSecurityStatus((s) => ({ ...s, vaultSet: true }));
      setVaultPassphraseSet(true);
      setVaultSetupPassphrase('');
      setVaultSetupConfirm('');
    } catch {
      setVaultSetupError('Could not save passphrase.');
    } finally {
      setVaultSetupLoading(false);
    }
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
      if (data.requires2FA) {
        setLoginStep('2fa');
        setLoginPassword('');
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

  if (authLoading || (authed && vaultLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  // Vault locked overlay — shown after auth, before data
  if (authed && vaultLocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center">
        <div className="w-full max-w-md mx-4">
          <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-400/20 text-amber-200">
                <Lock size={22} />
              </div>
              <div>
                <h2 className="text-lg font-bold">Vault Locked</h2>
                <p className="text-sm text-gray-400">Enter your secret passphrase to unlock.</p>
              </div>
            </div>
            <div className="space-y-3">
              <input
                type="password"
                value={vaultInput}
                onChange={(e) => setVaultInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && doVaultUnlock()}
                autoFocus
                placeholder="Secret passphrase…"
                className="w-full px-4 py-3 bg-slate-900/60 border border-white/10 rounded-xl text-sm"
              />
              {vaultError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm flex items-center gap-2">
                  <AlertTriangle size={16} /> {vaultError}
                </div>
              )}
              <button type="button" onClick={doVaultUnlock} disabled={vaultSubmitting || !vaultInput}
                className="w-full py-3.5 rounded-xl font-bold text-white bg-amber-500/70 hover:bg-amber-500 disabled:opacity-50 transition-colors">
                {vaultSubmitting ? 'Unlocking…' : 'Unlock'}
              </button>
            </div>
            <button type="button" onClick={doLogout} className="mt-5 w-full text-xs text-gray-500 hover:text-gray-300 transition-colors">
              Log out
            </button>
            <p className="mt-2 text-xs text-gray-600 text-center">Vault auto-locks after 4 hours of inactivity.</p>
          </div>
        </div>
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
                {loginStep === 'credentials' ? (
                  <>
                    <h2 className="text-lg font-semibold mb-2">Please login</h2>
                    <p className="text-sm text-gray-400">Use your user id and password to access your plan.</p>
                    <div className="mt-5 space-y-3">
                      <label className="block">
                        <span className="text-sm text-gray-400">User ID</span>
                        <input
                          value={loginUserId}
                          onChange={(e) => setLoginUserId(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && doLogin()}
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
                          onKeyDown={(e) => e.key === 'Enter' && doLogin()}
                          className="mt-2 w-full px-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-sm"
                          placeholder="••••••••"
                          autoComplete="current-password"
                        />
                      </label>
                      {loginError && (
                        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm flex items-center gap-2">
                          <AlertTriangle size={16} /> {loginError}
                        </div>
                      )}
                      <button type="button" onClick={doLogin} disabled={loginSubmitting}
                        className="w-full py-3.5 rounded-xl font-bold text-white bg-blue-500/70 hover:bg-blue-500 disabled:opacity-50 transition-colors">
                        {loginSubmitting ? 'Signing in...' : 'Sign in'}
                      </button>
                    </div>
                    <p className="mt-4 text-xs text-gray-500">
                      The default user is created from env vars: `FINPLAN_ADMIN_USER_ID` and `FINPLAN_ADMIN_PASSWORD`.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <button type="button" onClick={() => { setLoginStep('credentials'); setLoginError(''); setTotpInput(''); }}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-gray-400">
                        <ArrowLeft size={16} />
                      </button>
                      <h2 className="text-lg font-semibold">Two-Factor Authentication</h2>
                    </div>
                    <p className="text-sm text-gray-400 mb-5">Open your authenticator app and enter the 6-digit code.</p>
                    <div className="space-y-3">
                      <label className="block">
                        <span className="text-sm text-gray-400">Authenticator code</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          value={totpInput}
                          onChange={(e) => setTotpInput(e.target.value.replace(/\D/g, ''))}
                          onKeyDown={(e) => e.key === 'Enter' && doVerify2FA()}
                          autoFocus
                          className="mt-2 w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-xl font-mono tracking-[0.4em] text-center"
                          placeholder="000000"
                        />
                      </label>
                      {loginError && (
                        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm flex items-center gap-2">
                          <AlertTriangle size={16} /> {loginError}
                        </div>
                      )}
                      <button type="button" onClick={doVerify2FA} disabled={loginSubmitting || totpInput.length !== 6}
                        className="w-full py-3.5 rounded-xl font-bold text-white bg-blue-500/70 hover:bg-blue-500 disabled:opacity-50 transition-colors">
                        {loginSubmitting ? 'Verifying...' : 'Verify'}
                      </button>
                    </div>
                    <p className="mt-4 text-xs text-gray-500">The code refreshes every 30 seconds.</p>
                  </>
                )}
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
            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setExportOpen((o) => !o)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <FileDown size={16} />
                  Export
                </button>
                {exportOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setExportOpen(false)} />
                    <div className="absolute right-0 mt-2 w-44 bg-slate-900 border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
                      <button
                        type="button"
                        onClick={exportJSON}
                        className="w-full text-left px-4 py-3 text-sm hover:bg-white/5 transition-colors flex items-center gap-2"
                      >
                        <FileDown size={14} className="text-blue-400" />
                        Download JSON
                      </button>
                      <button
                        type="button"
                        onClick={exportCSV}
                        className="w-full text-left px-4 py-3 text-sm hover:bg-white/5 transition-colors flex items-center gap-2 border-t border-white/5"
                      >
                        <FileDown size={14} className="text-green-400" />
                        Download CSV
                      </button>
                    </div>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSecurityOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                title="Security settings"
              >
                <Lock size={16} />
                {securityStatus.totpEnabled ? <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" /> : null}
              </button>
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
        {dataLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
          </div>
        )}
        {!dataLoading && activeSection === 'home' && (
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

        {!dataLoading && activeSection === 'monthly' && (
          <div className="space-y-6">
            {/* Month selector */}
            <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <CalendarDays size={18} className="text-blue-400" /> Monthly View
                </h2>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => navigateMonth(-1)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <span className="text-base font-semibold text-white min-w-[160px] text-center">{monthLabel(monthly.activeMonth)}</span>
                  <button type="button" onClick={() => navigateMonth(1)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </button>
                  <button type="button" onClick={() => setMonthly((prev) => ({ ...prev, activeMonth: currentMonthKey() }))} className="px-3 py-1.5 text-xs rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 transition-colors">
                    Today
                  </button>
                </div>
              </div>
            </div>

            {/* Categories table */}
            <section className="bg-slate-900/50 border border-white/10 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-blue-200">Budget &amp; Spending</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Click a category to manage sub-categories, budget and running expenses.</p>
                </div>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={addMonthCategory} className="px-3 py-1.5 rounded-lg text-xs border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 transition-colors">
                    + Add Category
                  </button>
                  <button type="button" onClick={saveMonthly} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/20 border border-purple-400/40 text-purple-200 hover:bg-purple-500/25 transition-colors text-sm">
                    <Save size={14} /> Save
                  </button>
                  {monthlySaveState.status !== 'idle' && (
                    <span className={monthlySaveState.status === 'saved' ? 'text-green-300 text-sm' : 'text-red-300 text-sm'}>{monthlySaveState.message}</span>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-400 border-b border-white/10">
                      <th className="py-2 pr-4 w-36">Category</th>
                      <th className="py-2 pr-4 text-right">Budget</th>
                      <th className="py-2 pr-4 text-right">Available</th>
                      <th className="py-2 pr-4 text-right">Spent</th>
                      <th className="py-2 text-right">Left</th>
                      <th className="py-2 w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {activeMonthData.categories.map((cat) => {
                      const subs = cat.subs || [];
                      const budget  = subs.reduce((s, sub) => s + (Number(sub.budget)   || 0), 0);
                      const avail   = subs.reduce((s, sub) => s + (Number(sub.runAvail) || 0), 0);
                      const spent   = subs.reduce((s, sub) => s + (Number(sub.runSpent) || 0), 0);
                      const left    = avail - spent;
                      return (
                        <tr
                          key={cat.id}
                          className="border-b border-white/5 hover:bg-white/[0.02] cursor-pointer transition-colors"
                          onClick={() => setMonthCatPanel(cat.id)}
                        >
                          <td className="py-3 pr-4 font-medium text-gray-200">{cat.label}</td>
                          <td className="py-3 pr-4 text-right text-gray-300">{budget ? formatINR(budget) : <span className="text-gray-600">—</span>}</td>
                          <td className="py-3 pr-4 text-right text-gray-300">{avail ? formatINR(avail) : <span className="text-gray-600">—</span>}</td>
                          <td className="py-3 pr-4 text-right text-gray-300">{spent ? formatINR(spent) : <span className="text-gray-600">—</span>}</td>
                          <td className={`py-3 text-right font-semibold ${left < 0 ? 'text-red-300' : left === 0 && avail === 0 ? 'text-gray-600' : left === 0 ? 'text-gray-400' : 'text-green-300'}`}>
                            {avail === 0 ? '—' : `${left < 0 ? '-' : ''}${formatINR(Math.abs(left))}`}
                          </td>
                          <td className="py-3 text-right">
                            <svg className="w-4 h-4 text-gray-500 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {(() => {
                    const cats = activeMonthData.categories;
                    const totalBudget = cats.reduce((s, c) => s + (c.subs || []).reduce((ss, sub) => ss + (Number(sub.budget) || 0), 0), 0);
                    const totalAvail  = cats.reduce((s, c) => s + (c.subs || []).reduce((ss, sub) => ss + (Number(sub.runAvail) || 0), 0), 0);
                    const totalSpent  = cats.reduce((s, c) => s + (c.subs || []).reduce((ss, sub) => ss + (Number(sub.runSpent) || 0), 0), 0);
                    const totalLeft   = totalAvail - totalSpent;
                    return (
                      <tfoot>
                        <tr className="border-t border-white/10 text-sm font-semibold">
                          <td className="py-3 pr-4 text-gray-400">Total</td>
                          <td className="py-3 pr-4 text-right text-white">{formatINR(totalBudget)}</td>
                          <td className="py-3 pr-4 text-right text-white">{formatINR(totalAvail)}</td>
                          <td className="py-3 pr-4 text-right text-white">{formatINR(totalSpent)}</td>
                          <td className={`py-3 text-right ${totalLeft < 0 ? 'text-red-300' : 'text-green-300'}`}>{totalLeft < 0 ? '-' : ''}{formatINR(Math.abs(totalLeft))}</td>
                          <td />
                        </tr>
                      </tfoot>
                    );
                  })()}
                </table>
              </div>
            </section>

            {/* Running Budget — quick spend entry */}
            {activeMonthData.categories.some((c) => (c.subs || []).length > 0) && (
              <section className="bg-slate-900/50 border border-white/10 rounded-2xl p-5">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-purple-200">Running Budget</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Set Available per sub-category (include carryover) and log what you&apos;ve spent.</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-400 border-b border-white/10">
                        <th className="py-2 pr-3">Sub-category</th>
                        <th className="py-2 pr-2">Available (₹)</th>
                        <th className="py-2 pr-2">Spent (₹)</th>
                        <th className="py-2">Left</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeMonthData.categories.map((cat) => {
                        const subs = (cat.subs || []);
                        if (!subs.length) return null;
                        return (
                          <React.Fragment key={cat.id}>
                            <tr>
                              <td colSpan={4} className="pt-4 pb-1 text-xs font-semibold text-blue-300 uppercase tracking-wider">{cat.label}</td>
                            </tr>
                            {subs.map((sub) => {
                              const avail = Number(sub.runAvail) || 0;
                              const spent = Number(sub.runSpent) || 0;
                              const left  = avail - spent;
                              return (
                                <tr key={sub.id} className="border-b border-white/5">
                                  <td className="py-2 pr-3 text-gray-300">{sub.label || <span className="text-gray-600 italic">Unnamed</span>}</td>
                                  <td className="py-2 pr-2">
                                    <input type="number" min={0} value={sub.runAvail ?? 0}
                                      onChange={(e) => updateMonthSubcat(cat.id, sub.id, 'runAvail', e.target.value)}
                                      className="w-24 px-2 py-1.5 bg-slate-900/50 border border-white/10 rounded-lg text-sm" />
                                  </td>
                                  <td className="py-2 pr-2">
                                    <input type="number" min={0} value={sub.runSpent ?? 0}
                                      onChange={(e) => updateMonthSubcat(cat.id, sub.id, 'runSpent', e.target.value)}
                                      className="w-24 px-2 py-1.5 bg-slate-900/50 border border-white/10 rounded-lg text-sm" />
                                  </td>
                                  <td className={`py-2 font-semibold whitespace-nowrap ${left < 0 ? 'text-red-300' : left === 0 ? 'text-gray-500' : 'text-green-300'}`}>
                                    {left < 0 ? '-' : ''}{formatINR(Math.abs(left))}
                                  </td>
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 flex items-center gap-3 border-t border-white/5 pt-4">
                  <button type="button" onClick={saveMonthly}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500/20 border border-purple-400/40 text-purple-200 hover:bg-purple-500/25 transition-colors text-sm">
                    <Save size={14} /> Save
                  </button>
                  {monthlySaveState.status !== 'idle' && (
                    <span className={monthlySaveState.status === 'saved' ? 'text-green-300 text-sm' : 'text-red-300 text-sm'}>{monthlySaveState.message}</span>
                  )}
                </div>
              </section>
            )}
          </div>
        )}

        {/* Monthly category slide-over panel */}
        {monthCatPanel !== null && (() => {
          const cat = activeMonthData.categories.find((c) => c.id === monthCatPanel);
          if (!cat) return null;
          const subs = cat.subs || [];
          const totalBudget = subs.reduce((s, sub) => s + (Number(sub.budget)   || 0), 0);
          const totalAvail  = subs.reduce((s, sub) => s + (Number(sub.runAvail) || 0), 0);
          const totalSpent  = subs.reduce((s, sub) => s + (Number(sub.runSpent) || 0), 0);
          const totalLeft   = totalAvail - totalSpent;
          return (
            <>
              <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={() => setMonthCatPanel(null)} />
              <div className="fixed top-0 right-0 h-full w-full max-w-lg bg-[#0d1829] border-l border-white/10 z-50 flex flex-col shadow-2xl">
                {/* Header */}
                <div className="p-5 border-b border-white/10 flex items-center justify-between flex-shrink-0">
                  <input
                    value={cat.label}
                    onChange={(e) => updateMonthCatLabel(cat.id, e.target.value)}
                    className="text-lg font-semibold bg-transparent border-b border-transparent hover:border-white/20 focus:border-white/40 focus:outline-none px-0 py-0.5 text-blue-200 w-auto min-w-0"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => { removeMonthCategory(cat.id); setMonthCatPanel(null); }}
                      className="px-3 py-1.5 rounded-lg text-xs border border-red-400/20 bg-red-500/10 text-red-300 hover:bg-red-500/20 transition-colors"
                    >
                      Delete Category
                    </button>
                    <button type="button" onClick={() => setMonthCatPanel(null)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                </div>

                {/* Sub-categories */}
                <div className="flex-1 overflow-y-auto p-5 space-y-3">
                  {subs.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-6">No sub-categories yet. Add one below.</p>
                  )}
                  {subs.map((sub) => (
                    <div key={sub.id} className="flex items-center gap-3 bg-slate-900/60 border border-white/8 rounded-xl px-4 py-3">
                      <input
                        value={sub.label}
                        onChange={(e) => updateMonthSubcat(cat.id, sub.id, 'label', e.target.value)}
                        placeholder="Sub-category name"
                        className="flex-1 px-3 py-1.5 bg-slate-900/50 border border-white/10 rounded-lg text-sm"
                      />
                      <label className="flex items-center gap-2 text-sm text-gray-400 whitespace-nowrap">
                        Budget (₹)
                        <input type="number" min={0} value={sub.budget ?? 0}
                          onChange={(e) => updateMonthSubcat(cat.id, sub.id, 'budget', e.target.value)}
                          className="w-28 px-2 py-1.5 bg-slate-900/50 border border-white/10 rounded-lg text-sm text-white" />
                      </label>
                      <button type="button" onClick={() => removeMonthSubcat(cat.id, sub.id)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-red-300 hover:bg-red-500/10 transition-colors flex-shrink-0">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addMonthSubcat(cat.id)}
                    className="w-full py-2.5 rounded-xl border border-dashed border-white/20 text-gray-400 hover:text-white hover:border-white/40 text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Add sub-category
                  </button>
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-white/10 flex-shrink-0 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Total Budget</span>
                    <span className="font-semibold text-white">{formatINR(totalBudget)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => { saveMonthly(); setMonthCatPanel(null); }}
                    className="w-full py-3 rounded-xl bg-purple-500/20 border border-purple-400/40 text-purple-200 hover:bg-purple-500/30 font-semibold text-sm transition-colors"
                  >
                    Save &amp; Close
                  </button>
                </div>
              </div>
            </>
          );
        })()}

        {!dataLoading && activeSection === 'kids' && (
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

        {!dataLoading && activeSection === 'retirement' && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left: holdings sections + calculator inputs */}
            <div className="lg:col-span-3 space-y-6">
              {/* Holdings by section */}
              <section className="bg-slate-900/50 border border-white/10 rounded-2xl p-5">
                <h2 className="text-lg font-semibold flex items-center gap-2 mb-1">
                  <Landmark size={18} className="text-emerald-300" /> Retirement Holdings
                </h2>
                <p className="text-xs text-gray-500 mb-4">Click a section to add or edit holdings. Corpus and contributions are summed automatically.</p>
                <div className="space-y-2">
                  {RETIREMENT_SECTIONS.map((sec) => {
                    const items = retirement[sec.key] || [];
                    const secCorpus = items.reduce((s, i) => s + (Number(i.currentValue) || 0), 0);
                    const secContrib = items.reduce((s, i) => s + (Number(i.monthlyContrib) || 0), 0);
                    const accent = {
                      blue:    'border-blue-500/30 bg-blue-500/8 hover:bg-blue-500/12',
                      purple:  'border-purple-500/30 bg-purple-500/8 hover:bg-purple-500/12',
                      emerald: 'border-emerald-500/30 bg-emerald-500/8 hover:bg-emerald-500/12',
                      amber:   'border-amber-500/30 bg-amber-500/8 hover:bg-amber-500/12',
                      slate:   'border-slate-500/30 bg-slate-500/8 hover:bg-slate-500/12',
                    }[sec.accentColor] || 'border-white/10 bg-white/3 hover:bg-white/5';
                    const labelColor = {
                      blue: 'text-blue-300', purple: 'text-purple-300', emerald: 'text-emerald-300',
                      amber: 'text-amber-300', slate: 'text-slate-300',
                    }[sec.accentColor] || 'text-white';
                    return (
                      <button
                        key={sec.key}
                        type="button"
                        onClick={() => setRetSectionPanel(sec.key)}
                        className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border transition-colors text-left ${accent}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`font-semibold text-sm ${labelColor}`}>{sec.label}</span>
                          <span className="text-xs text-gray-500">{items.length} {items.length === 1 ? 'holding' : 'holdings'}</span>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                          <div className="text-right">
                            <div className="text-xs text-gray-500">Corpus</div>
                            <div className="font-semibold text-gray-100">{secCorpus ? formatINR(secCorpus) : '—'}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-500">Monthly</div>
                            <div className="font-semibold text-gray-100">{secContrib ? formatINR(secContrib) : '—'}</div>
                          </div>
                          <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {/* Totals row */}
                <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-sm">
                  <span className="text-gray-400 font-medium">Total</span>
                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Corpus</div>
                      <div className="font-bold text-emerald-200 text-base">{formatINR(retirementTotals.corpus)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Monthly contrib</div>
                      <div className="font-bold text-emerald-200 text-base">{formatINR(retirementTotals.contrib)}</div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Calculator inputs */}
              <section className="bg-slate-900/50 border border-white/10 rounded-2xl p-5">
                <h3 className="text-base font-semibold text-gray-300 mb-4">Projection Calculator</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-sm text-gray-400">Current age</span>
                    <input type="number" min={18} max={100} value={retirement.currentAge}
                      onChange={(e) => setRetirement((r) => ({ ...r, currentAge: e.target.value }))}
                      className="mt-2 w-full px-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-sm" />
                  </label>
                  <label className="block">
                    <span className="text-sm text-gray-400">Retirement age</span>
                    <input type="number" min={40} max={75} value={retirement.retireAge}
                      onChange={(e) => setRetirement((r) => ({ ...r, retireAge: e.target.value }))}
                      className="mt-2 w-full px-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-sm" />
                  </label>
                  <label className="block">
                    <span className="text-sm text-gray-400">Monthly expenses today (₹)</span>
                    <input type="number" min={0} value={retirement.monthlyExpenseToday}
                      onChange={(e) => setRetirement((r) => ({ ...r, monthlyExpenseToday: e.target.value }))}
                      className="mt-2 w-full px-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-sm" />
                  </label>
                  <label className="block">
                    <span className="text-sm text-gray-400">Inflation p.a. (%)</span>
                    <input type="number" min={0} step={0.5} value={retirement.inflationPct}
                      onChange={(e) => setRetirement((r) => ({ ...r, inflationPct: e.target.value }))}
                      className="mt-2 w-full px-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-sm" />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="text-sm text-gray-400">Expected portfolio return p.a. (%)</span>
                    <input type="number" min={0} step={0.5} value={retirement.expectedReturnPct}
                      onChange={(e) => setRetirement((r) => ({ ...r, expectedReturnPct: e.target.value }))}
                      className="mt-2 w-full px-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-sm" />
                  </label>
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button type="button" onClick={saveRetirement}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-100 hover:bg-emerald-500/25 transition-colors">
                    <Save size={16} /> Save retirement plan
                  </button>
                  {retSaveState.status !== 'idle' && (
                    <span className={retSaveState.status === 'saved' ? 'text-green-300 text-sm' : 'text-red-300 text-sm'}>{retSaveState.message}</span>
                  )}
                </div>
                <p className="mt-3 text-xs text-gray-500">Illustrative only. Corpus and contributions are auto-populated from your holdings above. Not financial advice.</p>
              </section>
            </div>

            {/* Right: projection results */}
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
                      <span className={retirementComputed.shortfall > 0 ? 'font-semibold text-red-300' : 'font-semibold text-green-300'}>
                        {formatINR(Math.round(retirementComputed.shortfall))}
                      </span>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}

        {!dataLoading && activeSection === 'insurance' && (
          <div className="space-y-6">
            <section className="bg-slate-900/50 border border-white/10 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Shield size={18} className="text-blue-300" /> Insurance Policies
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">Track all your insurance policies in one place.</p>
                </div>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={addPolicy}
                    className="px-3 py-1.5 rounded-lg text-xs border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 transition-colors">
                    + Add Policy
                  </button>
                  <button type="button" onClick={saveInsurance}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/20 border border-blue-400/40 text-blue-200 hover:bg-blue-500/25 transition-colors text-sm">
                    <Save size={14} /> Save
                  </button>
                  {insuranceSaveState.status !== 'idle' && (
                    <span className={insuranceSaveState.status === 'saved' ? 'text-green-300 text-sm' : 'text-red-300 text-sm'}>{insuranceSaveState.message}</span>
                  )}
                </div>
              </div>

              {(insurance.policies || []).length === 0 ? (
                <div className="py-12 text-center text-gray-500 text-sm">
                  No policies yet. Click &quot;+ Add Policy&quot; to get started.
                </div>
              ) : (
                <div className="space-y-3">
                  {(insurance.policies || []).map((policy) => (
                    <div key={policy.id} className="bg-slate-900/60 border border-white/8 rounded-xl p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="flex items-center gap-3 flex-1 flex-wrap">
                          <select
                            value={policy.type}
                            onChange={(e) => updatePolicy(policy.id, 'type', e.target.value)}
                            className="px-3 py-2 bg-slate-900/80 border border-white/10 rounded-lg text-sm text-blue-200 min-w-[100px]"
                          >
                            {INSURANCE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                          </select>
                          <input
                            value={policy.insurer}
                            onChange={(e) => updatePolicy(policy.id, 'insurer', e.target.value)}
                            placeholder="Insurer name"
                            className="flex-1 min-w-[140px] px-3 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-sm"
                          />
                          <input
                            value={policy.policyNo}
                            onChange={(e) => updatePolicy(policy.id, 'policyNo', e.target.value)}
                            placeholder="Policy No."
                            className="flex-1 min-w-[120px] px-3 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-sm"
                          />
                        </div>
                        <button type="button" onClick={() => removePolicy(policy.id)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-3 items-end">
                        <label className="flex flex-col gap-1 min-w-[130px]">
                          <span className="text-xs text-gray-500">Sum Assured (₹)</span>
                          <input type="number" min={0} value={policy.sumAssured ?? 0}
                            onChange={(e) => updatePolicy(policy.id, 'sumAssured', e.target.value)}
                            className="px-3 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-sm" />
                        </label>
                        <label className="flex flex-col gap-1 min-w-[110px]">
                          <span className="text-xs text-gray-500">Annual Premium (₹)</span>
                          <input type="number" min={0} value={policy.premium ?? 0}
                            onChange={(e) => updatePolicy(policy.id, 'premium', e.target.value)}
                            className="px-3 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-sm" />
                        </label>
                        <label className="flex flex-col gap-1 min-w-[130px]">
                          <span className="text-xs text-gray-500">Expiry Date</span>
                          <input type="date" value={policy.expiryDate || ''}
                            onChange={(e) => updatePolicy(policy.id, 'expiryDate', e.target.value)}
                            className="px-3 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-sm text-gray-300" />
                        </label>
                        <label className="flex flex-col gap-1 flex-1 min-w-[160px]">
                          <span className="text-xs text-gray-500">Notes</span>
                          <input value={policy.notes || ''}
                            onChange={(e) => updatePolicy(policy.id, 'notes', e.target.value)}
                            placeholder="Nominee, riders, remarks…"
                            className="px-3 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-sm" />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Summary */}
            {(insurance.policies || []).length > 0 && (
              <section className="bg-slate-900/50 border border-white/10 rounded-2xl p-5">
                <h3 className="text-base font-semibold text-gray-300 mb-3">Summary</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {INSURANCE_TYPES.filter((t) => (insurance.policies || []).some((p) => p.type === t)).map((t) => {
                    const typePolicies = (insurance.policies || []).filter((p) => p.type === t);
                    const totalCover = typePolicies.reduce((s, p) => s + (Number(p.sumAssured) || 0), 0);
                    const totalPremium = typePolicies.reduce((s, p) => s + (Number(p.premium) || 0), 0);
                    return (
                      <div key={t} className="p-3 rounded-xl border border-white/5 bg-slate-900/40">
                        <div className="text-xs text-gray-500 mb-1">{t}</div>
                        <div className="font-semibold text-sm text-blue-200">{formatINR(totalCover)}</div>
                        <div className="text-xs text-gray-500 mt-0.5">₹{(totalPremium).toLocaleString('en-IN')}/yr premium</div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        )}

        {!dataLoading && activeSection === 'funds' && (
          <div className="space-y-4">
            {/* Page header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2"><Wallet size={20} className="text-teal-300" /> Funds</h2>
                <p className="text-sm text-gray-400 mt-0.5">Allocate money pools across major categories and track how they&apos;re distributed.</p>
              </div>
              <div className="flex items-center gap-3">
                <button type="button" onClick={addFundCategory}
                  className="px-3 py-1.5 rounded-lg text-xs border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 transition-colors">
                  + Add Category
                </button>
                <button type="button" onClick={saveFunds}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500/20 border border-teal-400/40 text-teal-200 hover:bg-teal-500/25 transition-colors text-sm">
                  <Save size={14} /> Save
                </button>
                {fundsSaveState.status !== 'idle' && (
                  <span className={fundsSaveState.status === 'saved' ? 'text-green-300 text-sm' : 'text-red-300 text-sm'}>{fundsSaveState.message}</span>
                )}
              </div>
            </div>

            {/* Accordion cards */}
            {(funds.categories || []).map((cat) => {
              const subs = cat.subs || [];
              const totalAvail = subs.reduce((s, sub) => s + (Number(sub.available) || 0), 0);
              const totalSpent = subs.reduce((s, sub) => s + (Number(sub.spent)     || 0), 0);
              const totalLeft  = totalAvail - totalSpent;
              return (
                <div key={cat.id} className="bg-slate-900/50 border border-white/10 rounded-2xl overflow-hidden">
                  {/* Header */}
                  <div
                    className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-white/[0.02] transition-colors select-none"
                    onClick={() => toggleFundCat(cat.id)}
                  >
                    <span className="text-gray-400 flex-shrink-0">
                      {cat.open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </span>
                    <input
                      value={cat.label}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => updateFundCatLabel(cat.id, e.target.value)}
                      className="font-semibold text-base bg-transparent border-b border-transparent hover:border-white/20 focus:border-white/40 focus:outline-none text-white flex-1 min-w-0"
                    />
                    <div className="ml-auto flex items-center gap-6 text-sm flex-shrink-0">
                      <div className="text-right hidden sm:block">
                        <div className="text-xs text-gray-500">Available</div>
                        <div className="font-semibold text-gray-200">{totalAvail ? formatINR(totalAvail) : <span className="text-gray-600">—</span>}</div>
                      </div>
                      <div className="text-right hidden sm:block">
                        <div className="text-xs text-gray-500">Spent</div>
                        <div className="font-semibold text-gray-200">{totalSpent ? formatINR(totalSpent) : <span className="text-gray-600">—</span>}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500">Left</div>
                        <div className={`font-bold ${totalLeft < 0 ? 'text-red-300' : totalAvail === 0 ? 'text-gray-600' : 'text-teal-300'}`}>
                          {totalAvail === 0 ? '—' : `${totalLeft < 0 ? '-' : ''}${formatINR(Math.abs(totalLeft))}`}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeFundCategory(cat.id); }}
                        className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Body */}
                  {cat.open && (
                    <div className="border-t border-white/5 px-5 pb-5">
                      {subs.length > 0 && (
                        <div className="overflow-x-auto mt-3">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-left text-gray-500 text-xs border-b border-white/8">
                                <th className="py-2 pr-3 font-medium">Sub-category</th>
                                <th className="py-2 pr-3 font-medium w-36">Available (₹)</th>
                                <th className="py-2 pr-3 font-medium w-36">Spent (₹)</th>
                                <th className="py-2 pr-3 font-medium w-28 text-right">Left</th>
                                <th className="py-2 pr-3 font-medium">Notes</th>
                                <th className="py-2 w-8" />
                              </tr>
                            </thead>
                            <tbody>
                              {subs.map((sub) => {
                                const avail = Number(sub.available) || 0;
                                const spent = Number(sub.spent) || 0;
                                const left  = avail - spent;
                                return (
                                  <tr key={sub.id} className="border-b border-white/5 group">
                                    <td className="py-2 pr-3">
                                      <input value={sub.label}
                                        onChange={(e) => updateFundSub(cat.id, sub.id, 'label', e.target.value)}
                                        placeholder="Sub-category"
                                        className="w-full px-2 py-1.5 bg-slate-900/50 border border-white/10 rounded-lg text-sm focus:border-teal-400/40 focus:outline-none" />
                                    </td>
                                    <td className="py-2 pr-3">
                                      <input type="number" min={0} value={sub.available ?? 0}
                                        onChange={(e) => updateFundSub(cat.id, sub.id, 'available', e.target.value)}
                                        className="w-full px-2 py-1.5 bg-slate-900/50 border border-white/10 rounded-lg text-sm focus:border-teal-400/40 focus:outline-none" />
                                    </td>
                                    <td className="py-2 pr-3">
                                      <input type="number" min={0} value={sub.spent ?? 0}
                                        onChange={(e) => updateFundSub(cat.id, sub.id, 'spent', e.target.value)}
                                        className="w-full px-2 py-1.5 bg-slate-900/50 border border-white/10 rounded-lg text-sm focus:border-teal-400/40 focus:outline-none" />
                                    </td>
                                    <td className={`py-2 pr-3 text-right font-semibold text-sm ${left < 0 ? 'text-red-300' : avail === 0 ? 'text-gray-600' : 'text-teal-300'}`}>
                                      {avail === 0 ? '—' : `${left < 0 ? '-' : ''}${formatINR(Math.abs(left))}`}
                                    </td>
                                    <td className="py-2 pr-3">
                                      <input value={sub.notes || ''}
                                        onChange={(e) => updateFundSub(cat.id, sub.id, 'notes', e.target.value)}
                                        placeholder="Notes"
                                        className="w-full px-2 py-1.5 bg-slate-900/50 border border-white/10 rounded-lg text-sm text-gray-400 focus:border-teal-400/40 focus:outline-none" />
                                    </td>
                                    <td className="py-2">
                                      <button type="button" onClick={() => removeFundSub(cat.id, sub.id)}
                                        className="p-1.5 rounded text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                      <button type="button" onClick={() => addFundSub(cat.id)}
                        className="mt-3 flex items-center gap-2 text-sm text-gray-500 hover:text-teal-300 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add row
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Overall totals footer */}
            {(funds.categories || []).length > 0 && (() => {
              const allSubs = (funds.categories || []).flatMap((c) => c.subs || []);
              const grandAvail = allSubs.reduce((s, sub) => s + (Number(sub.available) || 0), 0);
              const grandSpent = allSubs.reduce((s, sub) => s + (Number(sub.spent) || 0), 0);
              const grandLeft  = grandAvail - grandSpent;
              return (
                <div className="flex items-center justify-end gap-8 px-5 py-4 bg-slate-900/30 border border-white/5 rounded-2xl text-sm">
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Total Available</div>
                    <div className="font-bold text-white text-base">{formatINR(grandAvail)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Total Spent</div>
                    <div className="font-bold text-white text-base">{formatINR(grandSpent)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Total Left</div>
                    <div className={`font-bold text-base ${grandLeft < 0 ? 'text-red-300' : 'text-teal-300'}`}>{grandLeft < 0 ? '-' : ''}{formatINR(Math.abs(grandLeft))}</div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {!dataLoading && activeSection === 'goals' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2"><Target size={20} className="text-violet-300" /> Goals</h2>
                <p className="text-sm text-gray-400 mt-0.5">Track financial goals with target amounts and progress.</p>
              </div>
              <div className="flex items-center gap-3">
                <button type="button" onClick={addGoal}
                  className="px-3 py-1.5 rounded-lg text-xs border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 transition-colors">
                  + Add Goal
                </button>
                <button type="button" onClick={saveGoals}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-500/20 border border-violet-400/40 text-violet-200 hover:bg-violet-500/25 transition-colors text-sm">
                  <Save size={14} /> Save
                </button>
                {goalsSaveState.status !== 'idle' && (
                  <span className={goalsSaveState.status === 'saved' ? 'text-green-300 text-sm' : 'text-red-300 text-sm'}>{goalsSaveState.message}</span>
                )}
              </div>
            </div>

            {(goals.items || []).length === 0 ? (
              <div className="text-center py-16 text-gray-500 text-sm bg-slate-900/30 border border-white/5 rounded-2xl">
                No goals yet. Click &quot;+ Add Goal&quot; to get started.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(goals.items || []).map((goal) => {
                  const target = Number(goal.targetAmount) || 0;
                  const saved  = Number(goal.savedAmount)  || 0;
                  const pct    = target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0;
                  const left   = Math.max(0, target - saved);
                  return (
                    <div key={goal.id} className="bg-slate-900/50 border border-white/10 rounded-2xl p-5 space-y-4">
                      {/* Title row */}
                      <div className="flex items-start gap-2">
                        <input value={goal.title}
                          onChange={(e) => updateGoal(goal.id, 'title', e.target.value)}
                          placeholder="Goal name"
                          className="flex-1 font-semibold text-base bg-transparent border-b border-transparent hover:border-white/20 focus:border-violet-400/40 focus:outline-none text-white min-w-0 py-0.5" />
                        <button type="button" onClick={() => removeGoal(goal.id)}
                          className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0 mt-0.5">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      {/* Progress bar */}
                      <div>
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-violet-500 rounded-full transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1.5">
                          <span>{formatINR(saved)} saved</span>
                          <span className="font-medium text-violet-300">{pct}%</span>
                          <span>{formatINR(left)} left</span>
                        </div>
                      </div>

                      {/* Fields */}
                      <div className="grid grid-cols-2 gap-3">
                        <label className="flex flex-col gap-1">
                          <span className="text-xs text-gray-500">Target (₹)</span>
                          <input type="number" min={0} value={goal.targetAmount ?? 0}
                            onChange={(e) => updateGoal(goal.id, 'targetAmount', e.target.value)}
                            className="px-3 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-sm focus:border-violet-400/40 focus:outline-none" />
                        </label>
                        <label className="flex flex-col gap-1">
                          <span className="text-xs text-gray-500">Saved so far (₹)</span>
                          <input type="number" min={0} value={goal.savedAmount ?? 0}
                            onChange={(e) => updateGoal(goal.id, 'savedAmount', e.target.value)}
                            className="px-3 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-sm focus:border-violet-400/40 focus:outline-none" />
                        </label>
                        <label className="flex flex-col gap-1">
                          <span className="text-xs text-gray-500">Target date</span>
                          <input type="date" value={goal.targetDate || ''}
                            onChange={(e) => updateGoal(goal.id, 'targetDate', e.target.value)}
                            className="px-3 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-sm text-gray-300 focus:border-violet-400/40 focus:outline-none" />
                        </label>
                        <label className="flex flex-col gap-1">
                          <span className="text-xs text-gray-500">Category</span>
                          <input value={goal.category || ''}
                            onChange={(e) => updateGoal(goal.id, 'category', e.target.value)}
                            placeholder="e.g. Travel, Property"
                            className="px-3 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-sm focus:border-violet-400/40 focus:outline-none" />
                        </label>
                      </div>
                      <input value={goal.notes || ''}
                        onChange={(e) => updateGoal(goal.id, 'notes', e.target.value)}
                        placeholder="Notes"
                        className="w-full px-3 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-sm text-gray-400 focus:border-violet-400/40 focus:outline-none" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {!dataLoading && activeSection === 'balance' && (() => {
          const totalAssets      = (balance.assets || []).flatMap((c) => c.items || []).reduce((s, i) => s + (Number(i.value) || 0), 0);
          const totalLiabilities = (balance.liabilities || []).flatMap((c) => c.items || []).reduce((s, i) => s + (Number(i.value) || 0), 0);
          const netWorth = totalAssets - totalLiabilities;

          const renderSide = (side, sideLabel, accentClass, accentText, accentBorder) => (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className={`text-base font-semibold ${accentText}`}>{sideLabel}</h3>
                <button type="button" onClick={() => addBalanceCat(side)}
                  className="px-3 py-1 rounded-lg text-xs border border-white/10 bg-white/5 hover:bg-white/10 text-gray-400 transition-colors">
                  + Category
                </button>
              </div>
              {(balance[side] || []).map((cat) => {
                const catTotal = (cat.items || []).reduce((s, i) => s + (Number(i.value) || 0), 0);
                return (
                  <div key={cat.id} className={`border rounded-xl overflow-hidden ${accentBorder}`}>
                    {/* Category header */}
                    <div
                      className="flex items-center gap-2 px-4 py-3 cursor-pointer hover:bg-white/[0.02] transition-colors select-none"
                      onClick={() => toggleBalanceCat(side, cat.id)}
                    >
                      <span className="text-gray-500 flex-shrink-0">
                        {cat.open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </span>
                      <input
                        value={cat.label}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => updateBalanceCatLabel(side, cat.id, e.target.value)}
                        className={`flex-1 font-medium text-sm bg-transparent border-b border-transparent hover:border-white/20 focus:border-white/40 focus:outline-none ${accentText} min-w-0`}
                      />
                      <span className="font-semibold text-sm text-gray-100 ml-auto flex-shrink-0">
                        {catTotal ? formatINR(catTotal) : <span className="text-gray-600">—</span>}
                      </span>
                      <button type="button"
                        onClick={(e) => { e.stopPropagation(); removeBalanceCat(side, cat.id); }}
                        className="ml-2 p-1 rounded text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    {/* Items */}
                    {cat.open && (
                      <div className="border-t border-white/5 px-4 pb-3">
                        {(cat.items || []).length > 0 && (
                          <table className="w-full text-sm mt-2">
                            <thead>
                              <tr className="text-left text-gray-600 text-xs border-b border-white/5">
                                <th className="py-1.5 pr-3 font-medium">Name</th>
                                <th className="py-1.5 pr-3 font-medium w-32">Value (₹)</th>
                                <th className="py-1.5 pr-3 font-medium">Notes</th>
                                <th className="py-1.5 w-6" />
                              </tr>
                            </thead>
                            <tbody>
                              {(cat.items || []).map((item) => (
                                <tr key={item.id} className="border-b border-white/5 group">
                                  <td className="py-1.5 pr-3">
                                    <input value={item.name}
                                      onChange={(e) => updateBalanceItem(side, cat.id, item.id, 'name', e.target.value)}
                                      placeholder="Name"
                                      className="w-full px-2 py-1.5 bg-slate-900/50 border border-white/10 rounded-lg text-sm focus:border-white/30 focus:outline-none" />
                                  </td>
                                  <td className="py-1.5 pr-3">
                                    <input type="number" min={0} value={item.value ?? 0}
                                      onChange={(e) => updateBalanceItem(side, cat.id, item.id, 'value', e.target.value)}
                                      className="w-full px-2 py-1.5 bg-slate-900/50 border border-white/10 rounded-lg text-sm focus:border-white/30 focus:outline-none" />
                                  </td>
                                  <td className="py-1.5 pr-3">
                                    <input value={item.notes || ''}
                                      onChange={(e) => updateBalanceItem(side, cat.id, item.id, 'notes', e.target.value)}
                                      placeholder="Notes"
                                      className="w-full px-2 py-1.5 bg-slate-900/50 border border-white/10 rounded-lg text-sm text-gray-400 focus:border-white/30 focus:outline-none" />
                                  </td>
                                  <td className="py-1.5">
                                    <button type="button"
                                      onClick={() => removeBalanceItem(side, cat.id, item.id)}
                                      className="p-1 rounded text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100">
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                        <button type="button" onClick={() => addBalanceItem(side, cat.id)}
                          className="mt-2 flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-300 transition-colors">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Add item
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              {/* Side total */}
              <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${accentBorder} ${accentClass}`}>
                <span className={`font-semibold text-sm ${accentText}`}>Total {sideLabel}</span>
                <span className={`font-bold text-lg ${accentText}`}>{formatINR(side === 'assets' ? totalAssets : totalLiabilities)}</span>
              </div>
            </div>
          );

          return (
            <div className="space-y-6">
              {/* Net Worth header */}
              <div className={`flex items-center justify-between px-6 py-5 rounded-2xl border ${netWorth >= 0 ? 'bg-emerald-500/8 border-emerald-500/25' : 'bg-red-500/8 border-red-500/25'}`}>
                <div className="flex items-center gap-3">
                  <Scale size={22} className={netWorth >= 0 ? 'text-emerald-300' : 'text-red-300'} />
                  <div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Net Worth</div>
                    <div className={`text-2xl font-bold mt-0.5 ${netWorth >= 0 ? 'text-emerald-200' : 'text-red-300'}`}>
                      {netWorth < 0 ? '-' : ''}{formatINR(Math.abs(netWorth))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={saveBalance}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-colors text-sm">
                    <Save size={14} /> Save
                  </button>
                  {balanceSaveState.status !== 'idle' && (
                    <span className={balanceSaveState.status === 'saved' ? 'text-green-300 text-sm' : 'text-red-300 text-sm'}>{balanceSaveState.message}</span>
                  )}
                </div>
              </div>

              {/* Two-column layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {renderSide('assets',      'Assets',      'bg-emerald-500/6', 'text-emerald-300', 'border-emerald-500/20')}
                {renderSide('liabilities', 'Liabilities', 'bg-red-500/6',     'text-red-300',     'border-red-500/20')}
              </div>
            </div>
          );
        })()}
      </main>

      {/* ── Retirement section slide-over panel ──────────────────────────── */}
      {retSectionPanel && (() => {
        const sec = RETIREMENT_SECTIONS.find((s) => s.key === retSectionPanel);
        if (!sec) return null;
        const items = retirement[sec.key] || [];
        const secCorpus  = items.reduce((s, i) => s + (Number(i.currentValue)  || 0), 0);
        const secContrib = items.reduce((s, i) => s + (Number(i.monthlyContrib) || 0), 0);
        return (
          <div className="fixed inset-0 z-50 flex items-stretch justify-end">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setRetSectionPanel(null)} />
            <div className="relative w-full max-w-md bg-slate-900 border-l border-white/10 flex flex-col shadow-2xl">
              <div className="p-5 border-b border-white/10 flex items-center justify-between flex-shrink-0">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Retirement</p>
                  <h3 className="text-lg font-semibold text-emerald-200">{sec.label} Holdings</h3>
                </div>
                <button type="button" onClick={() => setRetSectionPanel(null)}
                  className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {items.length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-10">No entries yet. Click &quot;Add entry&quot; below.</p>
                )}
                {items.map((item) => (
                  <div key={item.id} className="p-3 rounded-xl bg-slate-800/60 border border-white/5 space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateRetirementItem(sec.key, item.id, 'name', e.target.value)}
                        placeholder="Name / Description"
                        className="flex-1 min-w-0 px-3 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-sm"
                      />
                      <button type="button" onClick={() => removeRetirementItem(sec.key, item.id)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <label className="flex-1">
                        <span className="text-xs text-gray-500 mb-1 block">Current Value (₹)</span>
                        <input type="number" min={0} value={item.currentValue ?? 0}
                          onChange={(e) => updateRetirementItem(sec.key, item.id, 'currentValue', e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-sm" />
                      </label>
                      <label className="flex-1">
                        <span className="text-xs text-gray-500 mb-1 block">Monthly Contrib (₹)</span>
                        <input type="number" min={0} value={item.monthlyContrib ?? 0}
                          onChange={(e) => updateRetirementItem(sec.key, item.id, 'monthlyContrib', e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-sm" />
                      </label>
                    </div>
                    <input type="text" value={item.notes || ''}
                      onChange={(e) => updateRetirementItem(sec.key, item.id, 'notes', e.target.value)}
                      placeholder="Notes (account no., bank, maturity date…)"
                      className="w-full px-3 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-xs text-gray-400 placeholder-slate-600" />
                  </div>
                ))}
                <button type="button" onClick={() => addRetirementItem(sec.key)}
                  className="w-full py-2.5 rounded-xl border border-dashed border-white/20 text-gray-400 hover:text-white hover:border-white/40 text-sm transition-colors flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add entry
                </button>
              </div>

              <div className="p-5 border-t border-white/10 flex-shrink-0">
                <div className="flex items-center justify-between mb-2 text-sm">
                  <span className="text-gray-400">Corpus</span>
                  <span className="font-bold text-emerald-200">{formatINR(secCorpus)}</span>
                </div>
                <div className="flex items-center justify-between mb-4 text-sm">
                  <span className="text-gray-400">Monthly contrib</span>
                  <span className="font-bold text-emerald-200">{formatINR(secContrib)}</span>
                </div>
                <button type="button" onClick={() => { saveRetirement(); setRetSectionPanel(null); }}
                  className="w-full py-3 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 hover:bg-emerald-500/30 font-semibold text-sm transition-colors">
                  Save &amp; Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Security settings slide-over ─────────────────────────────────── */}
      {securityOpen && (
        <div className="fixed inset-0 z-50 flex items-stretch justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSecurityOpen(false)} />
          <div className="relative w-full max-w-md bg-slate-900 border-l border-white/10 flex flex-col shadow-2xl overflow-y-auto">
            <div className="p-5 border-b border-white/10 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <Lock size={18} className="text-amber-300" />
                <h3 className="text-lg font-semibold">Security Settings</h3>
              </div>
              <button type="button" onClick={() => setSecurityOpen(false)}
                className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 p-5 space-y-6">
              {/* ── TOTP 2FA ──────────────────────────────── */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-sm">Two-Factor Authentication (TOTP)</h4>
                    <p className="text-xs text-gray-500 mt-0.5">Google Authenticator / Authy / 1Password</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${securityStatus.totpEnabled ? 'bg-green-500/15 border-green-400/30 text-green-300' : 'bg-slate-700/50 border-white/10 text-gray-400'}`}>
                    {securityStatus.totpEnabled ? '● Enabled' : '○ Disabled'}
                  </span>
                </div>

                {!securityStatus.totpEnabled ? (
                  // Setup flow
                  totpSetupData ? (
                    <div className="space-y-3 bg-slate-800/50 border border-white/8 rounded-xl p-4">
                      <p className="text-xs text-gray-400">Scan this QR code with your authenticator app, then enter the 6-digit code to confirm.</p>
                      <div className="flex justify-center">
                        <img src={totpSetupData.qrDataUrl} alt="TOTP QR Code" className="rounded-xl w-64 h-64" />
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-1">Or enter this key manually:</p>
                        <code className="text-xs font-mono text-blue-300 bg-slate-900/60 px-3 py-1.5 rounded-lg break-all">{totpSetupData.secret}</code>
                      </div>
                      <input
                        type="text" inputMode="numeric" maxLength={6}
                        value={totpSetupCode}
                        onChange={(e) => setTotpSetupCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="Enter 6-digit code"
                        className="w-full px-4 py-2.5 bg-slate-900/60 border border-white/10 rounded-xl text-sm font-mono tracking-widest text-center"
                      />
                      {totpSetupError && <p className="text-red-300 text-xs">{totpSetupError}</p>}
                      <div className="flex gap-2">
                        <button type="button" onClick={() => { setTotpSetupData(null); setTotpSetupCode(''); setTotpSetupError(''); }}
                          className="flex-1 py-2 rounded-xl border border-white/10 text-sm text-gray-400 hover:bg-white/5 transition-colors">
                          Cancel
                        </button>
                        <button type="button" onClick={enableTotp} disabled={totpSetupLoading || totpSetupCode.length !== 6}
                          className="flex-1 py-2 rounded-xl bg-green-500/20 border border-green-400/40 text-green-200 hover:bg-green-500/30 text-sm font-semibold disabled:opacity-50 transition-colors">
                          {totpSetupLoading ? 'Verifying…' : 'Enable 2FA'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button type="button" onClick={loadTotpSetup} disabled={totpSetupLoading}
                      className="w-full py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm text-gray-300 transition-colors disabled:opacity-50">
                      {totpSetupLoading ? 'Loading…' : 'Set up 2FA →'}
                    </button>
                  )
                ) : (
                  // Disable flow
                  <div className="space-y-2 bg-slate-800/50 border border-white/8 rounded-xl p-4">
                    <p className="text-xs text-gray-400">Enter a current code from your authenticator app to disable 2FA.</p>
                    <input
                      type="text" inputMode="numeric" maxLength={6}
                      value={totpDisableCode}
                      onChange={(e) => setTotpDisableCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="6-digit code"
                      className="w-full px-4 py-2.5 bg-slate-900/60 border border-white/10 rounded-xl text-sm font-mono tracking-widest text-center"
                    />
                    {totpSetupError && <p className="text-red-300 text-xs">{totpSetupError}</p>}
                    <button type="button" onClick={disableTotp} disabled={totpDisableLoading || totpDisableCode.length !== 6}
                      className="w-full py-2.5 rounded-xl bg-red-500/15 border border-red-400/30 text-red-300 hover:bg-red-500/25 text-sm font-semibold disabled:opacity-50 transition-colors">
                      {totpDisableLoading ? 'Disabling…' : 'Disable 2FA'}
                    </button>
                  </div>
                )}
              </section>

              <div className="border-t border-white/8" />

              {/* ── Vault Passphrase ──────────────────────────────── */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-sm">Vault Passphrase</h4>
                    <p className="text-xs text-gray-500 mt-0.5">A second secret that locks all financial data. Expires every 4 hours.</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${securityStatus.vaultSet ? 'bg-amber-500/15 border-amber-400/30 text-amber-300' : 'bg-slate-700/50 border-white/10 text-gray-400'}`}>
                    {securityStatus.vaultSet ? '● Set' : '○ Not set'}
                  </span>
                </div>
                <div className="space-y-2 bg-slate-800/50 border border-white/8 rounded-xl p-4">
                  <p className="text-xs text-gray-400">{securityStatus.vaultSet ? 'Enter a new passphrase to change it.' : 'Set a passphrase (min. 8 characters). Use a phrase, not just a word.'}</p>
                  <input
                    type="password" value={vaultSetupPassphrase}
                    onChange={(e) => setVaultSetupPassphrase(e.target.value)}
                    placeholder="New passphrase (min. 8 chars)"
                    className="w-full px-3 py-2.5 bg-slate-900/60 border border-white/10 rounded-xl text-sm"
                  />
                  <input
                    type="password" value={vaultSetupConfirm}
                    onChange={(e) => setVaultSetupConfirm(e.target.value)}
                    placeholder="Confirm passphrase"
                    className="w-full px-3 py-2.5 bg-slate-900/60 border border-white/10 rounded-xl text-sm"
                  />
                  {vaultSetupError && <p className="text-red-300 text-xs">{vaultSetupError}</p>}
                  <button type="button" onClick={setupVaultPassphrase}
                    disabled={vaultSetupLoading || vaultSetupPassphrase.length < 8 || vaultSetupPassphrase !== vaultSetupConfirm}
                    className="w-full py-2.5 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-200 hover:bg-amber-500/30 text-sm font-semibold disabled:opacity-50 transition-colors">
                    {vaultSetupLoading ? 'Saving…' : securityStatus.vaultSet ? 'Change Passphrase' : 'Set Passphrase'}
                  </button>
                  {vaultPassphraseSet && !vaultLocked && (
                    <button type="button" onClick={() => { setVaultLocked(true); setSecurityOpen(false); }}
                      className="w-full py-2 rounded-xl border border-white/10 text-xs text-gray-400 hover:bg-white/5 transition-colors">
                      Lock vault now
                    </button>
                  )}
                </div>
              </section>

              <div className="border-t border-white/8" />

              {/* Security summary */}
              <section className="space-y-2 text-xs text-gray-500">
                <p className="font-medium text-gray-400">Security layers active</p>
                <div className="flex items-center gap-2">
                  <span className="text-green-400">✓</span> Password (PBKDF2, 120k iterations)
                </div>
                <div className="flex items-center gap-2">
                  {securityStatus.totpEnabled ? <span className="text-green-400">✓</span> : <span className="text-gray-600">○</span>}
                  TOTP 2FA (authenticator app)
                </div>
                <div className="flex items-center gap-2">
                  {securityStatus.vaultSet ? <span className="text-green-400">✓</span> : <span className="text-gray-600">○</span>}
                  Vault passphrase (4-hour session)
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

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

