"use client";

import { engine } from "@/lib/AudioEngine";
import {
  useState,
  useEffect,
  useMemo,
  Suspense,
  useCallback,
  useRef,
} from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
} from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Plus,
  X,
  Trash2,
  Receipt,
  Wallet,
  CreditCard,
  Building2,
  ArrowRight,
  ArrowDownRight,
  ArrowUpRight,
  Activity,
  Coins,
  TrendingDown,
  TrendingUp,
  ArrowLeftRight,
  History,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Briefcase,
  Pencil,
  Layers,
  Link,
  Sparkles,
  Search,
  Download,
  BarChart3,
  Bell,
  AlertTriangle,
  Calendar,
  Repeat,
  Target,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { fmtINR } from "@/lib/utils";
import { getUserSetting, setUserSetting } from "@/lib/userSettings";
import { createPortal } from "react-dom";

// ─── Utilities ───────────────────────────────────────────────────────────────
function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? createPortal(children, document.body) : null;
}

// ─── Types ───────────────────────────────────────────────────────────────────
type TxType = "income" | "expense" | "transfer";

interface Transaction {
  id: string;
  user_id?: string;
  tx_type: TxType;
  amount: number;
  income_type?: string;
  income_source?: string;
  category?: string;
  category_icon?: string;
  payment_mode?: string;
  from_account?: string;
  to_account?: string;
  account: string;
  description?: string;
  date: string;
  created_at: string;
}

const ACCOUNTS = [
  {
    id: "sbi",
    name: "SBI Savings",
    fullName: "SBI Savings A/c ****4218",
    type: "Bank",
    icon: Building2,
    color: "#2563EB", // Bolder blue
    bg: "bg-blue-100 dark:bg-blue-500/10 border-blue-500/50 dark:border-blue-500/30 text-blue-700 dark:text-blue-400",
    creditLimit: null,
  },
  {
    id: "utkarsh",
    name: "Utkarsh CC",
    fullName: "Utkarsh CC ****8812",
    type: "Credit Card",
    icon: CreditCard,
    color: "#7C3AED", // Bolder purple
    bg: "bg-purple-100 dark:bg-purple-500/10 border-purple-500/50 dark:border-purple-500/30 text-purple-800 dark:text-purple-400",
    creditLimit: 900,
  },
  {
    id: "cash",
    name: "Cash Wallet",
    fullName: "Cash / Pocket Wallet",
    type: "Cash",
    icon: Wallet,
    color: "#059669", // Bolder green
    bg: "bg-emerald-100 dark:bg-emerald-500/10 border-emerald-500/50 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-400",
    creditLimit: null,
  },
];

const DEFAULT_CATEGORIES = [
  { name: "Food & Dining", icon: "🍔", color: "#FF3B30" },
  { name: "Groceries", icon: "🛒", color: "#F4C542" },
  { name: "Shopping", icon: "🛍️", color: "#8B5CF6" },
  { name: "Bills & Utilities", icon: "⚡", color: "#FF9500" },
  { name: "Entertainment", icon: "🎬", color: "#EC4899" },
  { name: "Travel & Fuel", icon: "✈️", color: "#06B6D4" },
  { name: "Health", icon: "💊", color: "#14B8A6" },
  { name: "Education", icon: "🎓", color: "#6366F1" },
  { name: "Investment", icon: "📈", color: "#00E676" },
  { name: "Rent", icon: "🏠", color: "#F97316" },
  { name: "Subscriptions", icon: "📱", color: "#A855F7" },
  { name: "Other", icon: "💸", color: "#64748B" },
];

const ICON_OPTIONS = [
  "🍔",
  "🛒",
  "🛍️",
  "⚡",
  "🎬",
  "✈️",
  "💊",
  "🎓",
  "📈",
  "🏠",
  "📱",
  "💸",
  "☕",
  "🍕",
  "🚗",
  "🎮",
  "🎵",
  "📚",
  "🏋️",
  "💇",
  "🐾",
  "🌿",
  "🎁",
  "🍺",
  "🏥",
  "🔧",
  "🎨",
  "🏖️",
  "🌙",
  "⭐",
];

const INCOME_TYPES = [
  { id: "Pocket Money", label: "Pocket Money", icon: Wallet, color: "#10B981" },
  { id: "Salary", label: "Salary", icon: Briefcase, color: "#3B82F6" },
  { id: "Custom", label: "Custom", icon: Plus, color: "#F4C542" },
];

const PAYMENT_MODES = [
  "GPay / UPI",
  "Cash",
  "Credit Card",
  "Net Banking",
  "Debit Card",
];

const STORAGE_KEY = "bun_vault_tracker_v5";
const BUDGET_KEY = "bun_vault_budgets_v1";
const CC_DUE_KEY = "bun_vault_cc_due_v1";
const RECURRING_KEY = "bun_vault_recurring_v1";

// Budget defaults (monthly ₹ limit per category)
const DEFAULT_BUDGETS: Record<string, number> = {
  "Food & Dining": 3000,
  Groceries: 4000,
  Shopping: 2000,
  "Bills & Utilities": 2000,
  Entertainment: 1000,
  "Travel & Fuel": 2000,
  Health: 1500,
  Education: 2000,
  Subscriptions: 500,
  Rent: 10000,
  Other: 1000,
};

// ─── Tab definitions ──────────────────────────────────────────────────────────
const TABS = [
  { id: "dashboard", label: "Dashboard", icon: Activity },
  { id: "income", label: "Add Income", icon: TrendingUp },
  { id: "expense", label: "Add Expense", icon: TrendingDown },
  { id: "transfer", label: "Transfer", icon: ArrowLeftRight },
  { id: "charts", label: "Charts", icon: BarChart3 },
  { id: "budgets", label: "Budgets", icon: Target },
  { id: "history", label: "History", icon: History },
] as const;
type TabId = (typeof TABS)[number]["id"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getLocal(): Transaction[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}
function saveLocal(txs: Transaction[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(txs));
}

function useAccountBalances(transactions: Transaction[]) {
  return useMemo(() => {
    const balances: Record<string, number> = { sbi: 0, utkarsh: 0, cash: 0 };
    // CC used amount (expenses on CC)
    const ccUsed: Record<string, number> = { utkarsh: 0 };

    transactions.forEach((tx) => {
      const accId =
        ACCOUNTS.find((a) => a.fullName === tx.account)?.id || "sbi";

      if (tx.tx_type === "income") {
        balances[accId] = (balances[accId] || 0) + tx.amount;
      } else if (tx.tx_type === "expense") {
        const acc = ACCOUNTS.find((a) => a.fullName === tx.account);
        if (acc?.type === "Credit Card") {
          ccUsed[accId] = (ccUsed[accId] || 0) + tx.amount;
        } else {
          balances[accId] = (balances[accId] || 0) - tx.amount;
        }
      } else if (tx.tx_type === "transfer") {
        const fromId = ACCOUNTS.find((a) => a.fullName === tx.from_account)?.id;
        const toId = ACCOUNTS.find((a) => a.fullName === tx.to_account)?.id;
        if (fromId) balances[fromId] = (balances[fromId] || 0) - tx.amount;
        // Repaying CC: reduce CC used amount
        if (toId) {
          const toAcc = ACCOUNTS.find((a) => a.id === toId);
          if (toAcc?.type === "Credit Card") {
            ccUsed[toId] = Math.max(0, (ccUsed[toId] || 0) - tx.amount);
          } else {
            balances[toId] = (balances[toId] || 0) + tx.amount;
          }
        }
      }
    });
    return { balances, ccUsed };
  }, [transactions]);
}

// ─── Main Component ───────────────────────────────────────────────────────────
function ExpensesContent() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Credit Limit Modal state
  const [showCCLimitModal, setShowCCLimitModal] = useState(false);
  const [editingCCId, setEditingCCId] = useState<string>("");
  const [ccLimitInput, setCCLimitInput] = useState<string>("");
  const [ccLimitsOverride, setCCLimitsOverride] = useState<Record<string, number>>(() => {
    const result: Record<string, number> = {};
    if (typeof window !== "undefined") {
      ACCOUNTS.forEach(acc => {
        if (acc.creditLimit !== null) {
          const saved = localStorage.getItem(`cc_limit_${acc.id}`);
          if (saved && !isNaN(Number(saved))) result[acc.id] = Number(saved);
        }
      });
    }
    return result;
  });

  const [historyFilter, setHistoryFilter] = useState<TxType | "all">("all");
  const [historySearch, setHistorySearch] = useState("");
  const [editingTxId, setEditingTxId] = useState<string | null>(null);

  // Income form
  const [incomeType, setIncomeType] = useState("Salary");
  const [incomeSource, setIncomeSource] = useState("");
  const [incomeAmount, setIncomeAmount] = useState("");
  const [incomeAccount, setIncomeAccount] = useState(ACCOUNTS[0].fullName);
  const [incomeDesc, setIncomeDesc] = useState("");
  const [incomeDate, setIncomeDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  // Expense form
  const [expAmount, setExpAmount] = useState("");
  const [expCategory, setExpCategory] = useState("Food & Dining");
  const [expCategoryIcon, setExpCategoryIcon] = useState("🍔");
  const [expCustomCat, setExpCustomCat] = useState("");
  const [expCustomIcon, setExpCustomIcon] = useState("💸");
  const [isCustomCat, setIsCustomCat] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [expPayMode, setExpPayMode] = useState("GPay / UPI");
  const [expAccount, setExpAccount] = useState(ACCOUNTS[0].fullName);
  const [expDesc, setExpDesc] = useState("");
  const [expDate, setExpDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  // Transfer form
  const [trAmount, setTrAmount] = useState("");
  const [trFrom, setTrFrom] = useState(ACCOUNTS[0].fullName);
  const [trTo, setTrTo] = useState(ACCOUNTS[1].fullName);
  const [trDesc, setTrDesc] = useState("");
  const [trDate, setTrDate] = useState(new Date().toISOString().split("T")[0]);

  // Budgets state
  const [budgets, setBudgets] = useState<Record<string, number>>(() => {
    try {
      return {
        ...DEFAULT_BUDGETS,
        ...JSON.parse(localStorage.getItem(BUDGET_KEY) || "{}"),
      };
    } catch {
      return DEFAULT_BUDGETS;
    }
  });
  const [editingBudget, setEditingBudget] = useState<string | null>(null);
  const [budgetInput, setBudgetInput] = useState("");

  // CC Due Date state
  const [ccDueDay, setCcDueDay] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem(CC_DUE_KEY) || "5");
    } catch {
      return 5;
    }
  });
  const [editingCcDue, setEditingCcDue] = useState(false);

  // Recurring expenses
  const [recurringList, setRecurringList] = useState<
    Array<{
      id: string;
      name: string;
      amount: number;
      category: string;
      icon: string;
      account: string;
      dayOfMonth: number;
    }>
  >(() => {
    try {
      return JSON.parse(localStorage.getItem(RECURRING_KEY) || "[]");
    } catch {
      return [];
    }
  });
  const [showAddRecurring, setShowAddRecurring] = useState(false);
  const [recName, setRecName] = useState("");
  const [recAmount, setRecAmount] = useState("");
  const [recCategory, setRecCategory] = useState("Subscriptions");
  const [recDay, setRecDay] = useState("1");
  const [recAccount, setRecAccount] = useState(ACCOUNTS[0].fullName);

  // Swipe-to-delete state
  const [swipedId, setSwipedId] = useState<string | null>(null);

  // AI SMS/Alert Quick-Parse & Webhook setup states
  const [aiSmsText, setAiSmsText] = useState("");
  const [isAiParsing, setIsAiParsing] = useState(false);
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState(false);

  const handleQuickParseSms = () => {
    if (!aiSmsText.trim()) {
      toast.error("Please paste an SMS or notification text first!");
      return;
    }
    setIsAiParsing(true);
    try {
      const amountPatterns = [
        /(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)/i,
        /(?:debited|spent|paid|sent|amount|debited\s+by|debited\s+for|debited\s+with|transfer\s+of|txn\s+of|by)\s*(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i,
        /([\d,]+(?:\.\d{1,2})?)\s*(?:debited|spent|paid)/i,
      ];
      let amt = 0;
      for (const pat of amountPatterns) {
        const match = aiSmsText.match(pat);
        if (match && (match[1] || match[2])) {
          const raw = match[1] || match[2];
          const parsed = parseFloat(raw.replace(/,/g, ""));
          if (!isNaN(parsed) && parsed > 0) {
            amt = parsed;
            break;
          }
        }
      }
      if (amt <= 0) {
        const fallbackMatch = aiSmsText.match(
          /debited(?:\s+[a-z]+)*\s+([\d,]+(?:\.\d{1,2})?)/i,
        );
        if (fallbackMatch && fallbackMatch[1]) {
          const parsed = parseFloat(fallbackMatch[1].replace(/,/g, ""));
          if (!isNaN(parsed) && parsed > 0) amt = parsed;
        }
      }

      if (amt <= 0) {
        toast.error(
          "Could not find a valid amount in the text. Please check the format.",
        );
        setIsAiParsing(false);
        return;
      }

      let mode = "GPay / UPI";
      let acc = ACCOUNTS[0].fullName;
      if (
        /(?:credit card|card xx|card ending|utkarsh|hdfc cc|icici cc|sbi card|amex)/i.test(
          aiSmsText,
        )
      ) {
        mode = "Credit Card";
        acc =
          ACCOUNTS.find((a) => a.type === "Credit Card")?.fullName ||
          ACCOUNTS[0].fullName;
      } else if (/(?:cash|atm withdrawal)/i.test(aiSmsText)) {
        mode = "Cash";
        acc =
          ACCOUNTS.find((a) => a.type === "Cash")?.fullName ||
          ACCOUNTS[0].fullName;
      }

      let desc = "GPay / Bank Spend";
      const merchantPatterns = [
        /(?:trf\s+to|trfd\s+to|transfer\s+to|paid\s+to|to|at|info:|vpa|merchant|towards)\s+([A-Za-z0-9\s&._-]+?)(?:\s+(?:on|via|ref|refno|upi|avl|from|inr|rs|date|if\s+not|\.|$))/i,
        /(?:trf\s+to|transfer\s+to|paid\s+to|to)\s+([A-Za-z0-9\s&._-]+)/i,
      ];
      for (const mPat of merchantPatterns) {
        const merchantMatch = aiSmsText.match(mPat);
        if (merchantMatch && merchantMatch[1]) {
          const cleaned = merchantMatch[1].replace(/\s+/g, " ").trim();
          if (
            cleaned &&
            cleaned.length > 1 &&
            !/^(?:date|ref|refno|upi|rs|inr|if not)$/i.test(cleaned)
          ) {
            desc = cleaned;
            break;
          }
        }
      }

      let cat = "Other";
      let icon = "💸";
      const lower = (aiSmsText + " " + desc).toLowerCase();
      if (
        /(?:swiggy|zomato|restaurant|cafe|food|starbucks|mcdonalds|dominos|pizza|kfc|chai|bakery|dining)/i.test(
          lower,
        )
      ) {
        cat = "Food & Dining";
        icon = "🍔";
      } else if (
        /(?:blinkit|zepto|instamart|bigbasket|grocery|supermarket|dmart|milk|vegetables|fruits|provisions)/i.test(
          lower,
        )
      ) {
        cat = "Groceries";
        icon = "🛒";
      } else if (
        /(?:amazon|flipkart|myntra|zara|h&m|clothing|mall|shopping|retail|store|decathlon|croma)/i.test(
          lower,
        )
      ) {
        cat = "Shopping";
        icon = "🛍️";
      } else if (
        /(?:uber|ola|rapido|metro|fuel|petrol|diesel|shell|hpcl|bpcl|parking|toll|fastag|cab)/i.test(
          lower,
        )
      ) {
        cat = "Travel & Fuel";
        icon = "✈️";
      } else if (
        /(?:netflix|spotify|prime|hotstar|pvr|movie|cinema|bookmyshow|game|playstation|youtube)/i.test(
          lower,
        )
      ) {
        cat = "Entertainment";
        icon = "🎬";
      } else if (
        /(?:bescom|airtel|jio|vi|vodafone|wifi|broadband|electricity|gas|water|bill|recharge)/i.test(
          lower,
        )
      ) {
        cat = "Bills & Utilities";
        icon = "⚡";
      } else if (
        /(?:pharmacy|apollo|1mg|doctor|hospital|medical|medicine|gym|fitness|clinic)/i.test(
          lower,
        )
      ) {
        cat = "Health";
        icon = "💊";
      }

      setExpAmount(amt.toString());
      setExpCategory(cat);
      setExpCategoryIcon(icon);
      setExpPayMode(mode);
      setExpAccount(acc);
      setExpDesc(desc);
      setActiveTab("expense");
      setAiSmsText("");
      toast.success(
        `⚡ Auto-parsed: ₹${amt} at ${desc} (${cat})! Ready to save.`,
      );
    } catch (e: any) {
      toast.error("Error parsing SMS: " + e.message);
    } finally {
      setIsAiParsing(false);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // Async cloud sync for local user preferences (budgets, due dates, limits)
  useEffect(() => {
    async function syncCloudSettings() {
      const cloudBudgets = await getUserSetting("budgets");
      if (cloudBudgets) setBudgets({ ...DEFAULT_BUDGETS, ...cloudBudgets });

      const cloudDue = await getUserSetting("cc_due_day");
      if (cloudDue) setCcDueDay(Number(cloudDue));

      const cloudRec = await getUserSetting("recurring_expenses");
      if (cloudRec) setRecurringList(cloudRec);

      const overrides: Record<string, number> = {};
      for (const acc of ACCOUNTS) {
        if (acc.creditLimit !== null) {
          const cloudLimit = await getUserSetting(`cc_limit_${acc.id}`);
          if (cloudLimit && !isNaN(Number(cloudLimit))) {
            overrides[acc.id] = Number(cloudLimit);
          }
        }
      }
      if (Object.keys(overrides).length > 0) {
        setCCLimitsOverride(prev => ({ ...prev, ...overrides }));
      }
    }
    syncCloudSettings();
  }, []);

  // ── Load from local first, then fetch from Supabase
  useEffect(() => {
    const local = getLocal();
    if (local.length > 0) setTransactions(local);
    fetchAll();
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    // Fetch expenses (income + expense rows)
    const { data: expData } = await supabase
      .from("expenses")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false });

    // Fetch transfers
    const { data: trData } = await supabase
      .from("transfers")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false });

    const expTxs: Transaction[] = (expData || []).map((r) => ({
      id: r.id,
      user_id: r.user_id,
      tx_type: r.tx_type as TxType,
      amount: r.amount,
      income_type: r.income_type,
      income_source: r.income_source,
      category: r.category,
      category_icon: r.category_icon,
      payment_mode: r.payment_mode,
      account: r.account,
      description: r.description,
      date: r.date,
      created_at: r.created_at,
    }));

    const trTxs: Transaction[] = (trData || []).map((r) => ({
      id: r.id,
      user_id: r.user_id,
      tx_type: "transfer" as TxType,
      amount: r.amount,
      from_account: r.from_account,
      to_account: r.to_account,
      account: r.from_account,
      description: r.description,
      date: r.date,
      created_at: r.created_at,
    }));

    const all = [...expTxs, ...trTxs].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    if (all.length > 0) {
      setTransactions(all);
      saveLocal(all);
    }
    setLoading(false);
  }, []);

  const { balances, ccUsed } = useAccountBalances(transactions);

  // ── Summary stats
  const totalIncome = useMemo(
    () =>
      transactions
        .filter((t) => t.tx_type === "income")
        .reduce((s, t) => s + t.amount, 0),
    [transactions],
  );
  const totalExpense = useMemo(
    () =>
      transactions
        .filter((t) => t.tx_type === "expense")
        .reduce((s, t) => s + t.amount, 0),
    [transactions],
  );
  const totalTransfers = useMemo(
    () =>
      transactions
        .filter((t) => t.tx_type === "transfer")
        .reduce((s, t) => s + t.amount, 0),
    [transactions],
  );

  const categoryBreakdown = useMemo(() => {
    const map: Record<string, { amount: number; icon: string; color: string }> =
      {};
    transactions
      .filter((t) => t.tx_type === "expense")
      .forEach((t) => {
        const cat = t.category || "Other";
        const icon = t.category_icon || "💸";
        const color =
          DEFAULT_CATEGORIES.find((c) => c.name === cat)?.color || "#64748B";
        if (!map[cat]) map[cat] = { amount: 0, icon, color };
        map[cat].amount += t.amount;
      });
    return Object.entries(map)
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  const filteredHistory = useMemo(() => {
    return transactions.filter((t) => {
      const matchType = historyFilter === "all" || t.tx_type === historyFilter;
      const q = historySearch.toLowerCase();
      const matchSearch =
        !q ||
        (t.description || "").toLowerCase().includes(q) ||
        (t.category || "").toLowerCase().includes(q) ||
        (t.income_source || "").toLowerCase().includes(q) ||
        t.account.toLowerCase().includes(q);
      return matchType && matchSearch;
    });
  }, [transactions, historyFilter, historySearch]);

  // ── Monthly Chart Data (last 6 months)
  const monthlyChartData = useMemo(() => {
    const months: Record<
      string,
      { month: string; income: number; expense: number }
    > = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleString("en-IN", {
        month: "short",
        year: "2-digit",
      });
      months[key] = { month: label, income: 0, expense: 0 };
    }
    transactions.forEach((t) => {
      const key = t.date.substring(0, 7);
      if (months[key]) {
        if (t.tx_type === "income") months[key].income += t.amount;
        if (t.tx_type === "expense") months[key].expense += t.amount;
      }
    });
    return Object.values(months);
  }, [transactions]);

  // ── Budget spending this month
  const thisMonthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
  const monthlySpendByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    transactions
      .filter((t) => t.tx_type === "expense" && t.date.startsWith(thisMonthKey))
      .forEach((t) => {
        const cat = t.category || "Other";
        map[cat] = (map[cat] || 0) + t.amount;
      });
    return map;
  }, [transactions, thisMonthKey]);

  // ── CC Due Date info
  const ccDueInfo = useMemo(() => {
    const today = new Date();
    const currentDay = today.getDate();
    let daysLeft = ccDueDay - currentDay;
    if (daysLeft < 0)
      daysLeft += new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        0,
      ).getDate();
    const urgency =
      daysLeft <= 3 ? "critical" : daysLeft <= 7 ? "warning" : "safe";
    return { daysLeft, urgency };
  }, [ccDueDay]);

  // ── Handlers: Budget
  const saveBudget = (cat: string) => {
    const val = parseFloat(budgetInput);
    if (isNaN(val) || val < 0) return;
    const updated = { ...budgets, [cat]: val };
    setBudgets(updated);
    localStorage.setItem(BUDGET_KEY, JSON.stringify(updated));
    setEditingBudget(null);
    toast.success(`Budget updated for ${cat}`);
  };

  // ── Handlers: CC Due Day
  const saveCcDue = (day: number) => {
    setCcDueDay(day);
    setUserSetting("cc_due_day", String(day));
    localStorage.setItem(CC_DUE_KEY, String(day));
    setEditingCcDue(false);
    toast.success(`CC due date set to ${day}th of every month`);
  };

  // ── Handlers: Recurring
  const addRecurring = () => {
    const amt = parseFloat(recAmount);
    if (!recName || isNaN(amt) || amt <= 0) {
      toast.error("Fill all fields");
      return;
    }
    const icon =
      DEFAULT_CATEGORIES.find((c) => c.name === recCategory)?.icon || "🔁";
    const newRec = {
      id: crypto.randomUUID(),
      name: recName,
      amount: amt,
      category: recCategory,
      icon,
      account: recAccount,
      dayOfMonth: parseInt(recDay),
    };
    const updated = [...recurringList, newRec];
    setRecurringList(updated);
    setUserSetting("recurring_expenses", updated);
    localStorage.setItem(RECURRING_KEY, JSON.stringify(updated));
    setShowAddRecurring(false);
    setRecName("");
    setRecAmount("");
    toast.success(`Recurring expense "${recName}" added`);
  };
  const deleteRecurring = (id: string) => {
    const updated = recurringList.filter((r) => r.id !== id);
    setRecurringList(updated);
    setUserSetting("recurring_expenses", updated);
    localStorage.setItem(RECURRING_KEY, JSON.stringify(updated));
    engine.playTrash();
    toast.success("Recurring expense removed");
  };
  const logRecurringNow = async (rec: (typeof recurringList)[0]) => {
    const newTx: Transaction = {
      id: crypto.randomUUID(),
      tx_type: "expense",
      amount: rec.amount,
      category: rec.category,
      category_icon: rec.icon,
      payment_mode: "GPay / UPI",
      account: rec.account,
      description: rec.name,
      date: new Date().toISOString().split("T")[0],
      created_at: new Date().toISOString(),
    };
    const updated = [newTx, ...transactions];
    setTransactions(updated);
    saveLocal(updated);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      try {
        await supabase
          .from("expenses")
          .insert([
            {
              user_id: user.id,
              tx_type: "expense",
              amount: rec.amount,
              category: rec.category,
              category_icon: rec.icon,
              payment_mode: "GPay / UPI",
              account: rec.account,
              description: rec.name,
              date: newTx.date,
            },
          ]);
      } catch (_) {}
    }
    toast.success(`₹${fmtINR(rec.amount)} logged for "${rec.name}"`);
  };

  // ── CSV Export
  const exportCSV = () => {
    const rows = [
      [
        "Date",
        "Type",
        "Amount",
        "Category/Source",
        "Account",
        "Payment Mode",
        "Description",
      ],
      ...transactions.map((t) => [
        t.date,
        t.tx_type,
        t.amount,
        t.tx_type === "income"
          ? t.income_source || t.income_type || ""
          : t.tx_type === "transfer"
            ? `${t.from_account} → ${t.to_account}`
            : t.category || "",
        t.account,
        t.payment_mode || "",
        t.description || "",
      ]),
    ];
    const csv = rows
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bun-vault-expenses-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported to CSV successfully!");
  };

  const handleAddIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(incomeAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setSaving(true);

    const newTx: Transaction = {
      id: editingTxId || crypto.randomUUID(),
      tx_type: "income",
      amount: amt,
      income_type: incomeType,
      income_source: incomeType === "Custom" ? incomeSource : incomeType,
      account: incomeAccount,
      description: incomeDesc || incomeType,
      date: incomeDate,
      created_at: new Date().toISOString(),
    };

    const updated = editingTxId
      ? transactions.map((t) =>
          t.id === editingTxId ? { ...newTx, id: editingTxId } : t,
        )
      : [newTx, ...transactions];
    setTransactions(updated);
    saveLocal(updated);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      try {
        if (editingTxId && !editingTxId.startsWith("demo-")) {
          await supabase
            .from("expenses")
            .update({
              amount: amt,
              income_type: incomeType,
              income_source: newTx.income_source,
              account: incomeAccount,
              description: newTx.description,
              date: incomeDate,
            })
            .eq("id", editingTxId);
        } else if (!editingTxId) {
          await supabase.from("expenses").insert([
            {
              user_id: user.id,
              tx_type: "income",
              amount: amt,
              income_type: incomeType,
              income_source: newTx.income_source,
              account: incomeAccount,
              description: newTx.description,
              date: incomeDate,
            },
          ]);
        }
      } catch (_) {}
    }

    engine.playCash();
    toast.success(
      editingTxId
        ? "Income updated!"
        : `₹${fmtINR(amt)} income added to ${ACCOUNTS.find((a) => a.fullName === incomeAccount)?.name}`,
    );
    setIncomeAmount("");
    setIncomeDesc("");
    setIncomeSource("");
    setEditingTxId(null);
    setActiveTab("dashboard");
    setSaving(false);
  };

  // ── Add Expense
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(expAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    const finalCat = isCustomCat ? expCustomCat || "Custom" : expCategory;
    const finalIcon = isCustomCat
      ? expCustomIcon
      : DEFAULT_CATEGORIES.find((c) => c.name === expCategory)?.icon || "💸";
    setSaving(true);

    const newTx: Transaction = {
      id: editingTxId || crypto.randomUUID(),
      tx_type: "expense",
      amount: amt,
      category: finalCat,
      category_icon: finalIcon,
      payment_mode: expPayMode,
      account: expAccount,
      description: expDesc || finalCat,
      date: expDate,
      created_at: new Date().toISOString(),
    };

    const updated = editingTxId
      ? transactions.map((t) =>
          t.id === editingTxId ? { ...newTx, id: editingTxId } : t,
        )
      : [newTx, ...transactions];
    setTransactions(updated);
    saveLocal(updated);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      try {
        if (editingTxId && !editingTxId.startsWith("demo-")) {
          await supabase
            .from("expenses")
            .update({
              amount: amt,
              category: finalCat,
              category_icon: finalIcon,
              payment_mode: expPayMode,
              account: expAccount,
              description: newTx.description,
              date: expDate,
            })
            .eq("id", editingTxId);
        } else if (!editingTxId) {
          await supabase.from("expenses").insert([
            {
              user_id: user.id,
              tx_type: "expense",
              amount: amt,
              category: finalCat,
              category_icon: finalIcon,
              payment_mode: expPayMode,
              account: expAccount,
              description: newTx.description,
              date: expDate,
            },
          ]);
        }
      } catch (_) {}
    }

    engine.playSuccess();
    toast.success(
      editingTxId ? "Expense updated!" : `₹${fmtINR(amt)} expense logged`,
    );
    window.dispatchEvent(
      new CustomEvent("bun-notify", {
        detail: {
          title: editingTxId ? "📝 Expense Updated" : "💸 Expense Logged",
          message: `₹${fmtINR(amt)} — ${finalCat} via ${expPayMode}`,
          type: "warning",
        },
      }),
    );
    setExpAmount("");
    setExpDesc("");
    setExpCustomCat("");
    setEditingTxId(null);
    setActiveTab("dashboard");
    setSaving(false);
  };

  // ── Add Transfer
  const handleAddTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(trAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (trFrom === trTo) {
      toast.error("From and To accounts must be different");
      return;
    }
    setSaving(true);

    const newTx: Transaction = {
      id: editingTxId || crypto.randomUUID(),
      tx_type: "transfer",
      amount: amt,
      from_account: trFrom,
      to_account: trTo,
      account: trFrom,
      description:
        trDesc ||
        `Transfer to ${ACCOUNTS.find((a) => a.fullName === trTo)?.name}`,
      date: trDate,
      created_at: new Date().toISOString(),
    };

    const updated = editingTxId
      ? transactions.map((t) =>
          t.id === editingTxId ? { ...newTx, id: editingTxId } : t,
        )
      : [newTx, ...transactions];
    setTransactions(updated);
    saveLocal(updated);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      try {
        if (editingTxId && !editingTxId.startsWith("demo-")) {
          await supabase
            .from("transfers")
            .update({
              from_account: trFrom,
              to_account: trTo,
              amount: amt,
              description: newTx.description,
              date: trDate,
            })
            .eq("id", editingTxId);
        } else if (!editingTxId) {
          await supabase.from("transfers").insert([
            {
              user_id: user.id,
              from_account: trFrom,
              to_account: trTo,
              amount: amt,
              description: newTx.description,
              date: trDate,
            },
          ]);
        }
      } catch (_) {}
    }

    const fromName = ACCOUNTS.find((a) => a.fullName === trFrom)?.name;
    const toName = ACCOUNTS.find((a) => a.fullName === trTo)?.name;
    engine.playSuccess();
    toast.success(
      editingTxId
        ? "Transfer updated!"
        : `₹${fmtINR(amt)} transferred from ${fromName} → ${toName}`,
    );
    window.dispatchEvent(
      new CustomEvent("bun-notify", {
        detail: {
          title: editingTxId ? "📝 Transfer Updated" : "↔ Transfer Recorded",
          message: `₹${fmtINR(amt)} from ${fromName} to ${toName}`,
          type: "info",
        },
      }),
    );
    setTrAmount("");
    setTrDesc("");
    setEditingTxId(null);
    setActiveTab("dashboard");
    setSaving(false);
  };

  // ── Edit
  const handleEdit = (tx: Transaction) => {
    setEditingTxId(tx.id);
    if (tx.tx_type === "expense") {
      setExpAmount(tx.amount.toString());
      setExpCategory(tx.category || "Food & Dining");
      setExpCategoryIcon(tx.category_icon || "🍔");
      setExpPayMode(tx.payment_mode || "GPay / UPI");
      setExpAccount(tx.account || ACCOUNTS[0].fullName);
      setExpDesc(tx.description || "");
      setExpDate(tx.date || new Date().toISOString().split("T")[0]);
      setActiveTab("expense");
    } else if (tx.tx_type === "income") {
      setIncomeAmount(tx.amount.toString());
      setIncomeType(tx.income_type || "Salary");
      setIncomeSource(tx.income_source || "");
      setIncomeAccount(tx.account || ACCOUNTS[0].fullName);
      setIncomeDesc(tx.description || "");
      setIncomeDate(tx.date || new Date().toISOString().split("T")[0]);
      setActiveTab("income");
    } else if (tx.tx_type === "transfer") {
      setTrAmount(tx.amount.toString());
      setTrFrom(tx.from_account || ACCOUNTS[0].fullName);
      setTrTo(tx.to_account || ACCOUNTS[1].fullName);
      setTrDesc(tx.description || "");
      setTrDate(tx.date || new Date().toISOString().split("T")[0]);
      setActiveTab("transfer");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast.info(
      `Editing entry: ${tx.description || tx.category || tx.income_type}`,
    );
  };

  // ── Delete
  const handleDelete = async (tx: Transaction) => {
    const updated = transactions.filter((t) => t.id !== tx.id);
    setTransactions(updated);
    saveLocal(updated);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      try {
        const table = tx.tx_type === "transfer" ? "transfers" : "expenses";
        await supabase.from(table).delete().eq("id", tx.id);
      } catch (_) {}
    }
    engine.playTrash();
    toast.success("Entry removed");
  };

  if (!mounted) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <div className="relative h-16 w-16 rounded-2xl gold-gradient-bg p-[2px] shadow-xl animate-pulse">
          <div className="flex items-center justify-center h-full w-full bg-[#08090B] rounded-[14px]">
            <img
              src="/logo.png"
              alt="Bun Vault"
              className="h-8 w-8 object-contain"
            />
          </div>
        </div>
        <div className="text-center space-y-1">
          <span className="text-xs font-mono font-bold text-[#F4C542] tracking-widest uppercase animate-pulse">
            INITIALIZING FINANCIAL ENGINE...
          </span>
          <p className="text-[11px] font-mono text-slate-500">
            Syncing cloud ledger via Supabase
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 pb-20 w-full max-w-full min-w-0 overflow-x-hidden">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest bg-amber-500/10 text-[#F4C542] border border-amber-500/30">
              <Receipt className="h-3.5 w-3.5" /> Personal Cash Flow Ledger
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground font-sans">
            Expense Tracker
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground font-semibold mt-1 max-w-2xl">
            Effortlessly monitor your daily spending, track income streams, and
            keep your bank accounts synced across devices.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap justify-end">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <span className="h-2 w-2 rounded-full bg-[#00E676] animate-pulse" />
            <span className="text-[10px] font-bold text-[#00E676] uppercase tracking-wider">
              Cloud Synced
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowWebhookModal(true)}
            className="h-9 px-3.5 rounded-xl gap-1.5 text-xs font-bold bg-white dark:bg-[#151A21] hover:border-[#F4C542]/50 text-foreground border-border/60 shadow-sm transition-all"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#F4C542]" /> ⚡ SMS
            Auto-Track
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportCSV}
            className="h-9 px-3 rounded-xl gap-1.5 text-xs font-bold bg-white dark:bg-[#151A21] hover:border-[#00E676]/40 hover:text-[#00E676] transition-all"
          >
            <Download className="h-3.5 w-3.5" /> Export Spreadsheet
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAll}
            disabled={loading}
            className="h-9 px-3 rounded-xl gap-1.5 text-xs font-bold bg-white dark:bg-[#151A21] hover:border-amber-500/40 transition-all"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? "animate-spin text-[#F4C542]" : ""}`}
            />
            Sync
          </Button>
        </div>
      </div>

      {/* ── CC DUE DATE ALERT BANNER ── */}
      {ccDueInfo.urgency !== "safe" && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center gap-3 p-4 rounded-2xl border shadow-md ${
            ccDueInfo.urgency === "critical"
              ? "bg-[#FF3B30]/10 border-[#FF3B30]/40 text-[#FF3B30]"
              : "bg-[#F4C542]/10 border-[#F4C542]/40 text-[#F4C542]"
          }`}
        >
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <div className="flex-1">
            <div className="font-bold text-sm">
              {ccDueInfo.urgency === "critical"
                ? "🚨 CC Bill Due Very Soon!"
                : "⚠️ CC Bill Due Soon"}
            </div>
            <div className="text-xs font-semibold opacity-80 mt-0.5">
              Utkarsh CC ****8812 bill is due in{" "}
              <strong>
                {ccDueInfo.daysLeft} day{ccDueInfo.daysLeft !== 1 ? "s" : ""}
              </strong>{" "}
              (every {ccDueDay}th). Go to Budgets tab to adjust settings.
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setActiveTab("transfer")}
            className={`text-xs font-bold rounded-xl ${ccDueInfo.urgency === "critical" ? "bg-[#FF3B30] hover:bg-[#FF3B30]/80 text-white" : "gold-gradient-bg text-slate-950"}`}
          >
            Pay Card ↔
          </Button>
        </motion.div>
      )}

      {/* ── COMPACT SMART AI LOG BAR (ONE-LINE CLEAN SEARCH/PASTE) ── */}
      <div className="glass-panel p-3 sm:p-4 rounded-2xl border border-border/60 shadow-lg bg-gradient-to-r from-amber-500/10 via-slate-100/40 to-emerald-500/10 dark:from-[#F4C542]/10 dark:via-[#121721] dark:to-[#00E676]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="p-2 rounded-xl gold-gradient-bg text-slate-950 shadow-sm">
            <Sparkles className="h-4 w-4 animate-pulse" />
          </div>
          <div className="hidden md:block">
            <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
              Instant AI Quick-Log
            </span>
          </div>
        </div>

        <div className="flex-1 flex items-center gap-2 w-full">
          <input
            type="text"
            value={aiSmsText}
            onChange={(e) => setAiSmsText(e.target.value)}
            placeholder='✨ Paste any bank SMS or GPay alert here (e.g. "Rs 450 paid to Swiggy via UPI")...'
            className="flex-1 rounded-xl bg-white/80 dark:bg-[#080A0F]/80 border border-slate-300 dark:border-slate-800 px-4 py-2.5 text-xs font-mono font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#F4C542] shadow-inner"
            onKeyDown={(e) => e.key === "Enter" && handleQuickParseSms()}
          />
          <Button
            onClick={handleQuickParseSms}
            disabled={isAiParsing}
            className="gold-gradient-bg text-slate-950 font-bold rounded-xl text-xs px-5 h-10 shadow-md hover:brightness-105 shrink-0 gap-1.5"
          >
            {isAiParsing ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            Auto-Fill
          </Button>
        </div>

        <button
          onClick={() => setShowWebhookModal(true)}
          className="text-center sm:text-right text-[10px] font-extrabold text-amber-600 dark:text-[#F4C542] hover:underline flex items-center justify-center sm:justify-end gap-1 shrink-0"
        >
          Setup 24/7 background mobile tracking{" "}
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      {/* ── FLOATING QUICK ACTION BAR ── */}
      <div className="fixed bottom-20 md:bottom-6 left-0 right-0 z-40 px-4 pointer-events-none flex justify-center">
        <div className="flex items-center gap-2 p-2 bg-slate-900/90 dark:bg-[#0D1117]/90 backdrop-blur-xl border border-slate-700 rounded-[2rem] shadow-2xl pointer-events-auto">
          <Button
            onClick={() => setActiveTab("income")}
            className="rounded-full bg-emerald-500/20 text-[#00E676] hover:bg-emerald-500/30 font-bold px-5"
          >
            + Income
          </Button>
          <Button
            onClick={() => setActiveTab("expense")}
            className="rounded-full bg-red-500/20 text-[#FF3B30] hover:bg-red-500/30 font-bold px-5"
          >
            - Expense
          </Button>
          <Button
            onClick={() => setActiveTab("transfer")}
            className="rounded-full bg-amber-500/20 text-[#F4C542] hover:bg-amber-500/30 font-bold px-5"
          >
            ↔ Transfer
          </Button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* ══════════════════════════════════════════════════════
            UNIFIED DASHBOARD VIEW
        ══════════════════════════════════════════════════════ */}
        <div className="space-y-6">
          {/* Summary KPI Cards */}
          <div className="grid gap-4 sm:gap-5 sm:grid-cols-3">
            {/* TOTAL INCOME CARD */}
            <Card
              onClick={() => {
                setHistoryFilter("income");
                setActiveTab("history");
              }}
              className="border-0 bg-gradient-to-br from-emerald-100 via-emerald-50 to-emerald-100 dark:from-emerald-900/40 dark:via-[#0D1813] dark:to-emerald-950/30 p-5 sm:p-6 rounded-2xl space-y-3 relative overflow-hidden shadow-lg dark:shadow-xl cursor-pointer hover:scale-[1.02] hover:shadow-emerald-200 dark:hover:shadow-none transition-all duration-300 group border border-emerald-400 dark:border-emerald-500/30 hover:border-emerald-600 dark:hover:border-[#00E676]"
            >
              <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-emerald-500/30 dark:bg-emerald-500/10 blur-2xl group-hover:bg-emerald-500/50 dark:group-hover:bg-emerald-500/20 transition-all" />
              <div className="flex items-center justify-between relative z-10">
                <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-700 dark:text-muted-foreground group-hover:text-emerald-800 dark:group-hover:text-foreground transition-colors flex items-center gap-1.5">
                  Total Income
                </span>
                <div className="p-2.5 rounded-xl bg-emerald-500/20 dark:bg-[#00E676]/20 text-emerald-600 dark:text-[#00E676] shadow-sm group-hover:scale-110 transition-transform">
                  <ArrowUpRight className="h-4 w-4" />
                </div>
              </div>
              <div className="text-3xl sm:text-4xl font-bold font-mono text-emerald-800 dark:text-[#00E676] tracking-tight relative z-10">
                ₹{fmtINR(totalIncome)}
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-emerald-400/40 dark:border-emerald-500/20 relative z-10">
                <p className="text-xs text-emerald-600 dark:text-muted-foreground font-semibold flex items-center gap-1">
                  🟢 {transactions.filter((t) => t.tx_type === "income").length}{" "}
                  income entries logged
                </p>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-[#00E676] flex items-center gap-0.5 opacity-80 group-hover:opacity-100 transition-opacity">
                  View List <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Card>

            {/* TOTAL EXPENSES CARD */}
            <Card
              onClick={() => {
                setHistoryFilter("expense");
                setActiveTab("history");
              }}
              className="border-0 bg-gradient-to-br from-red-100 via-red-50 to-red-100 dark:from-red-900/40 dark:via-[#1C0D11] dark:to-red-950/30 p-5 sm:p-6 rounded-2xl space-y-3 relative overflow-hidden shadow-lg dark:shadow-xl cursor-pointer hover:scale-[1.02] hover:shadow-red-200 dark:hover:shadow-none transition-all duration-300 group border border-red-400 dark:border-red-500/30 hover:border-red-600 dark:hover:border-[#FF3B30]"
            >
              <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-red-500/30 dark:bg-red-500/10 blur-2xl group-hover:bg-red-500/50 dark:group-hover:bg-red-500/20 transition-all" />
              <div className="flex items-center justify-between relative z-10">
                <span className="text-[11px] font-bold uppercase tracking-widest text-red-700 dark:text-muted-foreground group-hover:text-red-800 dark:group-hover:text-foreground transition-colors flex items-center gap-1.5">
                  Total Expenses
                </span>
                <div className="p-2.5 rounded-xl bg-red-500/20 dark:bg-[#FF3B30]/20 text-red-600 dark:text-[#FF3B30] shadow-sm group-hover:scale-110 transition-transform">
                  <ArrowDownRight className="h-4 w-4" />
                </div>
              </div>
              <div className="text-3xl sm:text-4xl font-bold font-mono text-red-800 dark:text-[#FF3B30] tracking-tight relative z-10">
                ₹{fmtINR(totalExpense)}
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-red-400/40 dark:border-red-500/20 relative z-10">
                <p className="text-xs text-red-600 dark:text-muted-foreground font-semibold flex items-center gap-1">
                  🔴{" "}
                  {transactions.filter((t) => t.tx_type === "expense").length}{" "}
                  spending items recorded
                </p>
                <span className="text-[11px] font-bold text-red-600 dark:text-[#FF3B30] flex items-center gap-0.5 opacity-80 group-hover:opacity-100 transition-opacity">
                  View List <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Card>

            {/* NET CASH BALANCE CARD */}
            <Card
              onClick={() => {
                setHistoryFilter("all");
                setActiveTab("history");
              }}
              className={`border p-5 sm:p-6 rounded-2xl space-y-3 relative overflow-hidden shadow-lg dark:shadow-xl cursor-pointer hover:scale-[1.02] transition-all duration-300 group ${
                totalIncome - totalExpense >= 0
                  ? "bg-gradient-to-br from-[#FFFADF] via-[#FFFEF0] to-[#FFF4C0] dark:from-amber-900/30 dark:via-[#12100A] dark:to-amber-950/20 border-amber-300/80 dark:border-amber-500/30 hover:border-amber-500 dark:hover:border-[#F4C542] hover:shadow-amber-200 dark:hover:shadow-none"
                  : "bg-gradient-to-br from-[#FFE5E5] via-[#FFF0F0] to-[#FFD9D9] dark:from-red-900/40 dark:via-[#1C0D11] dark:to-red-950/30 border-red-300/80 dark:border-red-500/30 hover:border-red-500 dark:hover:border-[#FF3B30] hover:shadow-red-200 dark:hover:shadow-none"
              }`}
            >
              <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl transition-all ${
                totalIncome - totalExpense >= 0 ? "bg-amber-400/20 dark:bg-amber-500/10 group-hover:bg-amber-400/40 dark:group-hover:bg-amber-500/20" : "bg-red-400/20 dark:bg-red-500/10 group-hover:bg-red-400/40 dark:group-hover:bg-red-500/20"
              }`} />
              <div className="flex items-center justify-between relative z-10">
                <span className={`text-[11px] font-bold uppercase tracking-widest transition-colors flex items-center gap-1.5 ${
                  totalIncome - totalExpense >= 0 ? "text-amber-700 dark:text-muted-foreground group-hover:text-amber-800 dark:group-hover:text-foreground" : "text-red-700 dark:text-muted-foreground group-hover:text-red-800 dark:group-hover:text-foreground"
                }`}>
                  Net Cash Balance
                </span>
                <div className={`p-2.5 rounded-xl shadow-sm group-hover:scale-110 transition-transform ${
                  totalIncome - totalExpense >= 0 ? "bg-amber-500/20 dark:bg-[#F4C542]/20 text-amber-600 dark:text-[#F4C542]" : "bg-red-500/20 dark:bg-[#FF3B30]/20 text-red-600 dark:text-[#FF3B30]"
                }`}>
                  <Coins className="h-4 w-4" />
                </div>
              </div>
              <div className={`text-3xl sm:text-4xl font-bold font-mono tracking-tight relative z-10 ${
                totalIncome - totalExpense >= 0 ? "text-amber-700 dark:text-[#F4C542]" : "text-red-600 dark:text-[#FF3B30]"
              }`}>
                ₹{fmtINR(Math.abs(totalIncome - totalExpense))}
              </div>
              <div className={`flex items-center justify-between pt-2 border-t relative z-10 ${
                totalIncome - totalExpense >= 0 ? "border-amber-400/40 dark:border-amber-500/20" : "border-red-400/40 dark:border-red-500/20"
              }`}>
                <p className={`text-xs font-semibold ${
                  totalIncome - totalExpense >= 0 ? "text-amber-700 dark:text-muted-foreground" : "text-red-600 dark:text-muted-foreground"
                }`}>
                  {totalIncome - totalExpense >= 0
                    ? "✅ Healthy Surplus"
                    : "⚠️ Monthly Deficit"}{" "}
                  · Transfers: ₹{fmtINR(totalTransfers)}
                </p>
                <span className={`text-[11px] font-bold flex items-center gap-0.5 opacity-80 group-hover:opacity-100 transition-opacity ${
                  totalIncome - totalExpense >= 0 ? "text-amber-600 dark:text-[#F4C542]" : "text-red-600 dark:text-[#FF3B30]"
                }`}>
                  All Entries <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Card>
          </div>

          {/* Premium Account Balance Cards */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
                <Wallet className="h-4 w-4 text-[#F4C542]" /> Connected Accounts
                & Cards
              </h3>
              <span className="text-xs text-muted-foreground font-semibold">
                Live balances synced automatically
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {ACCOUNTS.map((acc) => {
                const Icon = acc.icon;
                const bal = balances[acc.id] || 0;
                const isCredit = acc.type === "Credit Card";
                const activeLimit = ccLimitsOverride[acc.id] ?? acc.creditLimit;
                const ccSpent = ccUsed[acc.id] || 0;
                const available =
                  isCredit && activeLimit !== null ? activeLimit - ccSpent : null;
                return (
                  <Card
                    key={acc.id}
                    className="p-6 rounded-3xl bg-gradient-to-br from-white via-slate-50 to-slate-100 dark:from-[#121721] dark:via-[#0D1117] dark:to-[#080A0F] border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden group hover:border-[#D4A017]/60 dark:hover:border-[#F4C542]/50 hover:shadow-amber-100 dark:hover:shadow-none transition-all duration-300"
                  >
                    <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-amber-500/5 dark:bg-amber-500/5 blur-3xl group-hover:bg-amber-500/10 dark:group-hover:bg-amber-500/15 transition-all" />

                    <div className="flex items-start justify-between relative z-10">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-2xl border shadow-md ${acc.bg}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-bold text-base text-foreground tracking-tight">
                            {acc.name}
                          </div>
                          <div className="text-[11px] text-muted-foreground font-mono font-bold mt-0.5">
                            {acc.type}
                          </div>
                        </div>
                      </div>
                      {activeLimit !== null && (
                        <div className="flex flex-col items-end gap-1.5">
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-purple-200 dark:bg-purple-500/20 text-purple-900 dark:text-purple-300 border border-purple-400 dark:border-purple-500/40">
                            LIMIT ₹{fmtINR(activeLimit)}
                          </span>
                          <button
                            onClick={() => {
                              setEditingCCId(acc.id);
                              setCCLimitInput(String(activeLimit));
                              setShowCCLimitModal(true);
                            }}
                            className="text-[9px] font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors flex items-center gap-0.5 underline underline-offset-2"
                          >
                            ✏ Edit Limit
                          </button>
                        </div>
                      )}
                    </div>

                    {activeLimit !== null ? (
                      <div className="space-y-3 pt-3 relative z-10">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-600 dark:text-muted-foreground">Used Credit</span>
                          <span className="text-red-600 dark:text-[#FF3B30] font-mono font-bold text-sm">₹{fmtINR(ccSpent)}</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-slate-300/60 dark:border-slate-700/60">
                          <motion.div
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, (ccSpent / activeLimit) * 100)}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                          />
                        </div>
                        <div className="flex justify-between text-xs font-bold pt-1 border-t border-slate-200 dark:border-slate-800/80">
                          <span className="text-slate-600 dark:text-muted-foreground">Available Credit</span>
                          <span className="text-emerald-600 dark:text-[#00E676] font-mono font-bold text-sm">₹{fmtINR(Math.max(0, activeLimit - ccSpent))}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1.5 pt-4 relative z-10 border-t border-slate-200 dark:border-slate-800/80 mt-2">
                        <div className="text-[11px] text-slate-500 dark:text-muted-foreground font-bold uppercase tracking-wider">
                          Available Balance
                        </div>
                        <div className={`text-3xl font-bold font-mono tracking-tight ${bal >= 0 ? "text-slate-800 dark:text-white" : "text-red-600 dark:text-[#FF3B30]"}`}>
                          ₹{fmtINR(Math.abs(bal))}
                        </div>
                        {bal < 0 && (
                          <p className="text-xs text-red-600 dark:text-[#FF3B30] font-bold">⚠ Overspent Account</p>
                        )}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Category Breakdown Section */}
          {categoryBreakdown.length > 0 && (
            <Card className="glass-panel border-border/40 shadow-xl overflow-hidden">
              <CardHeader className="p-5 border-b border-border/40">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#F4C542]" /> Expense
                  Breakdown by Category
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="h-52 w-52 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryBreakdown}
                          cx="50%"
                          cy="50%"
                          innerRadius={52}
                          outerRadius={76}
                          paddingAngle={4}
                          dataKey="amount"
                        >
                          {categoryBreakdown.map((entry, i) => (
                            <Cell
                              key={i}
                              fill={entry.color}
                              stroke="transparent"
                            />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          formatter={(v: any) => [
                            `₹${fmtINR(Number(v))}`,
                            "Amount",
                          ]}
                          contentStyle={{
                            backgroundColor: "#08090B",
                            borderColor: "#F4C542",
                            borderRadius: "12px",
                            color: "#fff",
                            fontSize: "12px",
                            fontWeight: "800",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-3 w-full">
                    {categoryBreakdown.slice(0, 6).map((cat, i) => {
                      const pct =
                        totalExpense > 0
                          ? Math.round((cat.amount / totalExpense) * 100)
                          : 0;
                      return (
                        <div key={i} className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="flex items-center gap-2">
                              <span className="text-base">{cat.icon}</span>
                              <span className="text-foreground">
                                {cat.name}
                              </span>
                            </span>
                            <span className="font-mono font-bold text-foreground private-value">
                              ₹{fmtINR(cat.amount)}{" "}
                              <span className="text-muted-foreground font-bold">
                                ({pct}%)
                              </span>
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 dark:bg-[#151A21] rounded-full overflow-hidden">
                            <motion.div
                              className="h-full rounded-full"
                              style={{ backgroundColor: cat.color }}
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.7, delay: i * 0.05 }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Premium Quick Action Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {[
              {
                tab: "income" as TabId,
                label: "+ Record New Income",
                desc: "Salary, Dividends, Pocket Money",
                icon: TrendingUp,
                color:
                  "border-emerald-500/40 bg-emerald-500/10 text-[#00E676] hover:bg-emerald-500/20 hover:border-emerald-400",
              },
              {
                tab: "expense" as TabId,
                label: "- Log New Expense",
                desc: "Food, Bills, Shopping & Groceries",
                icon: TrendingDown,
                color:
                  "border-red-500/40 bg-red-500/10 text-[#FF3B30] hover:bg-red-500/20 hover:border-red-400",
              },
              {
                tab: "transfer" as TabId,
                label: "↔ Transfer / Pay Bill",
                desc: "Move between Bank, CC & Cash",
                icon: ArrowLeftRight,
                color:
                  "border-amber-500/40 bg-amber-500/10 text-[#F4C542] hover:bg-amber-500/20 hover:border-amber-400",
              },
            ].map((a) => {
              const Icon = a.icon;
              return (
                <button
                  key={a.tab}
                  onClick={() => setActiveTab(a.tab)}
                  className={`flex items-center gap-4 p-5 rounded-2xl border transition-all duration-300 group text-left shadow-lg hover:scale-[1.02] ${a.color}`}
                >
                  <div className="p-3 rounded-xl bg-white/10 dark:bg-black/20 group-hover:scale-110 transition-transform shrink-0 shadow-inner">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm tracking-tight text-foreground">
                      {a.label}
                    </div>
                    <div className="text-[11px] font-semibold opacity-80 truncate mt-0.5">
                      {a.desc}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all shrink-0" />
                </button>
              );
            })}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            TAB: ADD INCOME
        ══════════════════════════════════════════════════════ */}
        {activeTab === "income" && (
          <Portal>
            <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-xl overflow-y-auto p-4 md:p-8 flex items-start justify-center">
              <motion.div
                key="income"
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-2xl mt-12 mb-20"
            >
              <button
                onClick={() => setActiveTab("dashboard")}
                className="absolute -top-12 right-0 md:-right-12 p-2 bg-white/15 hover:bg-white/25 text-white rounded-full transition-colors backdrop-blur-sm border border-white/20"
              >
                <X className="h-6 w-6" />
              </button>

              <Card className="glass-panel border-[#00E676]/30 shadow-2xl overflow-hidden max-w-lg mx-auto">
                <div className="h-1.5 bg-gradient-to-r from-[#00E676] to-[#00C853]" />
                <CardHeader className="p-6 border-b border-border/40">
                  <CardTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
                    <TrendingUp className="h-5 w-5 text-[#00E676]" /> Add Income
                  </CardTitle>
                  <CardDescription className="text-xs font-semibold">
                    Record money coming into your account
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleAddIncome}>
                  <CardContent className="p-6 space-y-5">
                    {/* Income Type Selection */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                        Income Type
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {INCOME_TYPES.map((t) => {
                          const Icon = t.icon;
                          const isActive = incomeType === t.id;
                          return (
                            <button
                              type="button"
                              key={t.id}
                              onClick={() => setIncomeType(t.id)}
                              className={`flex flex-col items-center gap-2 p-3.5 rounded-2xl border text-xs font-bold transition-all duration-200 ${
                                isActive
                                  ? "border-[#00C853] dark:border-[#00E676] bg-[#00E676]/10 dark:bg-[#00E676]/15 text-[#00C853] dark:text-[#00E676] shadow-md scale-[1.02]"
                                  : "border-border/50 text-muted-foreground hover:text-foreground hover:border-border bg-slate-100 dark:bg-[#151A21]"
                              }`}
                            >
                              <Icon className="h-5 w-5" />
                              {t.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Custom Source Name */}
                    {incomeType === "Custom" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="space-y-1.5"
                      >
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                          Source Name
                        </label>
                        <input
                          type="text"
                          value={incomeSource}
                          onChange={(e) => setIncomeSource(e.target.value)}
                          placeholder="e.g. Freelance, Gift, Bonus..."
                          className="w-full h-11 px-3.5 rounded-xl bg-slate-100 dark:bg-[#151A21] border border-slate-200 dark:border-slate-800 text-foreground font-bold text-sm focus:outline-none focus:border-[#00E676]"
                        />
                      </motion.div>
                    )}

                    {/* Amount */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                        Amount (₹)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#00E676] font-bold text-lg">
                          ₹
                        </span>
                        <input
                          type="number"
                          step="any"
                          required
                          value={incomeAmount}
                          onChange={(e) => setIncomeAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full h-13 pl-8 pr-3.5 py-3 rounded-xl bg-slate-100 dark:bg-[#151A21] border border-slate-200 dark:border-slate-800 text-foreground font-mono font-bold text-xl focus:outline-none focus:border-[#00E676]"
                        />
                      </div>
                    </div>

                    {/* Account */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                        Credited To Account
                      </label>
                      <div className="grid gap-2">
                        {ACCOUNTS.map((acc) => {
                          const Icon = acc.icon;
                          const isActive = incomeAccount === acc.fullName;
                          return (
                            <button
                              type="button"
                              key={acc.id}
                              onClick={() => setIncomeAccount(acc.fullName)}
                              className={`flex items-center gap-3 p-3.5 rounded-xl border text-sm font-bold transition-all ${
                                isActive
                                  ? `border-[#00C853] dark:border-[#00E676] bg-[#00E676]/10 text-[#00C853] dark:text-foreground shadow-sm`
                                  : "border-border/50 text-muted-foreground hover:text-foreground bg-slate-100 dark:bg-[#151A21]"
                              }`}
                            >
                              <div
                                className={`p-2 rounded-lg border ${acc.bg}`}
                              >
                                <Icon className="h-3.5 w-3.5" />
                              </div>
                              <div className="text-left">
                                <div className="font-bold text-xs">
                                  {acc.name}
                                </div>
                                <div className="text-[10px] text-muted-foreground font-mono">
                                  {acc.fullName}
                                </div>
                              </div>
                              {isActive && (
                                <CheckCircle2 className="h-4 w-4 text-[#00E676] ml-auto" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Date + Note */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                          Date
                        </label>
                        <input
                          type="date"
                          required
                          value={incomeDate}
                          onChange={(e) => setIncomeDate(e.target.value)}
                          className="w-full h-11 px-3.5 rounded-xl bg-slate-100 dark:bg-[#151A21] border border-slate-200 dark:border-slate-800 text-foreground font-bold text-xs focus:outline-none focus:border-[#00E676]"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                          Note
                        </label>
                        <input
                          type="text"
                          value={incomeDesc}
                          onChange={(e) => setIncomeDesc(e.target.value)}
                          placeholder="Optional note"
                          className="w-full h-11 px-3.5 rounded-xl bg-slate-100 dark:bg-[#151A21] border border-slate-200 dark:border-slate-800 text-foreground font-bold text-xs focus:outline-none focus:border-[#00E676]"
                        />
                      </div>
                    </div>
                  </CardContent>
                  <div className="p-6 border-t border-border/40 bg-slate-50 dark:bg-[#151A21]/60 flex justify-end gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditingTxId(null);
                        setActiveTab("dashboard");
                      }}
                      className="rounded-xl font-bold"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={saving}
                      className="rounded-xl font-bold px-8 h-11 bg-[#00E676] hover:bg-[#00C853] text-slate-950 shadow-lg shadow-green-500/25 transition-all"
                    >
                      {saving
                        ? "Saving..."
                        : editingTxId
                          ? "📝 Update Income ↑"
                          : "Add Income ↑"}
                    </Button>
                  </div>
                </form>
              </Card>
            </motion.div>
            </div>
          </Portal>
        )}

        {/* ══════════════════════════════════════════════════════
            TAB: ADD EXPENSE
        ══════════════════════════════════════════════════════ */}
        {activeTab === "expense" && (
          <Portal>
            <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-xl overflow-y-auto p-4 md:p-8 flex items-start justify-center">
              <motion.div
                key="expense"
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-2xl mt-12 mb-20"
            >
              <button
                onClick={() => setActiveTab("dashboard")}
                className="absolute -top-12 right-0 md:-right-12 p-2 bg-white/15 hover:bg-white/25 text-white rounded-full transition-colors backdrop-blur-sm border border-white/20"
              >
                <X className="h-6 w-6" />
              </button>

              <Card className="glass-panel border-[#FF3B30]/30 shadow-2xl overflow-hidden max-w-lg mx-auto">
                <div className="h-1.5 bg-gradient-to-r from-[#FF3B30] to-[#FF6B6B]" />
                <CardHeader className="p-6 border-b border-border/40">
                  <CardTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
                    <TrendingDown className="h-5 w-5 text-[#FF3B30]" /> Log
                    Expense
                  </CardTitle>
                  <CardDescription className="text-xs font-semibold">
                    Track spending with custom categories & icons
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleAddExpense}>
                  <CardContent className="p-6 space-y-5 overflow-y-auto max-h-[65vh]">
                    {/* Amount */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                        Amount (₹)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#FF3B30] font-bold text-lg">
                          ₹
                        </span>
                        <input
                          type="number"
                          step="any"
                          required
                          value={expAmount}
                          onChange={(e) => setExpAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full pl-8 pr-3.5 py-3 rounded-xl bg-slate-100 dark:bg-[#151A21] border border-slate-200 dark:border-slate-800 text-foreground font-mono font-bold text-xl focus:outline-none focus:border-[#FF3B30]"
                        />
                      </div>
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                          Category
                        </label>
                        <button
                          type="button"
                          onClick={() => setIsCustomCat(!isCustomCat)}
                          className="text-[10px] font-bold text-[#F4C542] hover:text-[#F4C542]/80 transition-colors flex items-center gap-1"
                        >
                          <Plus className="h-3 w-3" />{" "}
                          {isCustomCat ? "Use Built-in" : "Custom Category"}
                        </button>
                      </div>

                      {isCustomCat ? (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="space-y-3"
                        >
                          <input
                            type="text"
                            value={expCustomCat}
                            onChange={(e) => setExpCustomCat(e.target.value)}
                            placeholder="Category name (e.g. Gym, Pet Food...)"
                            className="w-full h-11 px-3.5 rounded-xl bg-slate-100 dark:bg-[#151A21] border border-slate-200 dark:border-slate-800 text-foreground font-bold text-sm focus:outline-none focus:border-[#F4C542]"
                          />
                          <div className="space-y-1.5">
                            <button
                              type="button"
                              onClick={() => setShowIconPicker(!showIconPicker)}
                              className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <span className="text-2xl">{expCustomIcon}</span>
                              <span>
                                Select Icon{" "}
                                <ChevronDown className="inline h-3 w-3" />
                              </span>
                            </button>
                            {showIconPicker && (
                              <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-3 rounded-xl bg-slate-100 dark:bg-[#151A21] border border-slate-200 dark:border-slate-800 grid grid-cols-10 gap-1"
                              >
                                {ICON_OPTIONS.map((ico) => (
                                  <button
                                    type="button"
                                    key={ico}
                                    onClick={() => {
                                      setExpCustomIcon(ico);
                                      setShowIconPicker(false);
                                    }}
                                    className={`text-xl p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors ${expCustomIcon === ico ? "bg-slate-200 dark:bg-slate-800" : ""}`}
                                  >
                                    {ico}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </div>
                        </motion.div>
                      ) : (
                        <div className="grid grid-cols-3 gap-2">
                          {DEFAULT_CATEGORIES.map((c) => {
                            const isActive = expCategory === c.name;
                            return (
                              <button
                                type="button"
                                key={c.name}
                                onClick={() => {
                                  setExpCategory(c.name);
                                  setExpCategoryIcon(c.icon);
                                }}
                                className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                                  isActive
                                    ? "border-[#D32F2F] dark:border-[#FF3B30] bg-[#FF3B30]/10 dark:bg-[#FF3B30]/15 text-[#D32F2F] dark:text-[#FF3B30] font-bold shadow-sm"
                                    : "border-border/50 text-muted-foreground hover:text-foreground bg-slate-100 dark:bg-[#151A21]"
                                }`}
                              >
                                <span className="text-base">{c.icon}</span>
                                <span className="truncate">{c.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Payment Mode */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                        Payment Mode
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {PAYMENT_MODES.map((m) => (
                          <button
                            type="button"
                            key={m}
                            onClick={() => {
                              setExpPayMode(m);
                              if (m === "Cash")
                                setExpAccount(ACCOUNTS[2].fullName);
                              else if (m === "Credit Card")
                                setExpAccount(ACCOUNTS[1].fullName);
                              else setExpAccount(ACCOUNTS[0].fullName);
                            }}
                            className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all ${
                              expPayMode === m
                                ? "gold-gradient-bg text-slate-950 font-bold shadow-sm border-transparent"
                                : "border-border/50 text-muted-foreground hover:text-foreground bg-slate-100 dark:bg-[#151A21]"
                            }`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Account */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                        Debit From Account
                      </label>
                      <div className="grid gap-2">
                        {ACCOUNTS.map((acc) => {
                          const Icon = acc.icon;
                          const isActive = expAccount === acc.fullName;
                          return (
                            <button
                              type="button"
                              key={acc.id}
                              onClick={() => setExpAccount(acc.fullName)}
                              className={`flex items-center gap-3 p-3 rounded-xl border text-sm font-bold transition-all ${
                                isActive
                                  ? `border-[#FF3B30] bg-[#FF3B30]/10 text-foreground shadow-sm`
                                  : "border-border/50 text-muted-foreground hover:text-foreground bg-slate-100 dark:bg-[#151A21]"
                              }`}
                            >
                              <div
                                className={`p-1.5 rounded-lg border ${acc.bg}`}
                              >
                                <Icon className="h-3.5 w-3.5" />
                              </div>
                              <div className="text-left">
                                <div className="font-bold text-xs">
                                  {acc.name}
                                </div>
                                <div className="text-[10px] text-muted-foreground font-mono">
                                  {acc.type}
                                </div>
                              </div>
                              {acc.creditLimit !== null && (
                                <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400 font-bold">
                                  CC ₹{fmtINR(acc.creditLimit)}
                                </span>
                              )}
                              {isActive && (
                                <CheckCircle2 className="h-4 w-4 text-[#FF3B30] ml-auto" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Date + Description */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                          Date
                        </label>
                        <input
                          type="date"
                          required
                          value={expDate}
                          onChange={(e) => setExpDate(e.target.value)}
                          className="w-full h-11 px-3.5 rounded-xl bg-slate-100 dark:bg-[#151A21] border border-slate-200 dark:border-slate-800 text-foreground font-bold text-xs focus:outline-none focus:border-[#FF3B30]"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                          Description
                        </label>
                        <input
                          type="text"
                          value={expDesc}
                          onChange={(e) => setExpDesc(e.target.value)}
                          placeholder="Optional note"
                          className="w-full h-11 px-3.5 rounded-xl bg-slate-100 dark:bg-[#151A21] border border-slate-200 dark:border-slate-800 text-foreground font-bold text-xs focus:outline-none focus:border-[#FF3B30]"
                        />
                      </div>
                    </div>
                  </CardContent>
                  <div className="p-6 border-t border-border/40 bg-slate-50 dark:bg-[#151A21]/60 flex justify-end gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditingTxId(null);
                        setActiveTab("dashboard");
                      }}
                      className="rounded-xl font-bold"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={saving}
                      className="rounded-xl font-bold px-8 h-11 bg-[#FF3B30] hover:bg-[#FF3B30]/85 text-white shadow-lg shadow-red-500/25"
                    >
                      {saving
                        ? "Saving..."
                        : editingTxId
                          ? "📝 Update Expense ↓"
                          : "Log Expense ↓"}
                    </Button>
                  </div>
                </form>
              </Card>
            </motion.div>
            </div>
          </Portal>
        )}

        {/* ══════════════════════════════════════════════════════
            TAB: TRANSFER
        ══════════════════════════════════════════════════════ */}
        {activeTab === "transfer" && (
          <Portal>
            <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-xl overflow-y-auto p-4 md:p-8 flex items-start justify-center">
              <motion.div
                key="transfer"
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-2xl mt-12 mb-20"
            >
              <button
                onClick={() => setActiveTab("dashboard")}
                className="absolute -top-12 right-0 md:-right-12 p-2 bg-white/15 hover:bg-white/25 text-white rounded-full transition-colors backdrop-blur-sm border border-white/20"
              >
                <X className="h-6 w-6" />
              </button>

              <Card className="glass-panel border-[#F4C542]/30 shadow-2xl overflow-hidden max-w-lg mx-auto">
                <div className="h-1.5 gold-gradient-bg" />
                <CardHeader className="p-6 border-b border-border/40">
                  <CardTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
                    <ArrowLeftRight className="h-5 w-5 text-[#F4C542]" />{" "}
                    Transfer Funds
                  </CardTitle>
                  <CardDescription className="text-xs font-semibold">
                    Move money between accounts — including CC repayments from
                    your bank
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleAddTransfer}>
                  <CardContent className="p-6 space-y-5">
                    {/* Amount */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                        Transfer Amount (₹)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#F4C542] font-bold text-lg">
                          ₹
                        </span>
                        <input
                          type="number"
                          step="any"
                          required
                          value={trAmount}
                          onChange={(e) => setTrAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full pl-8 pr-3.5 py-3 rounded-xl bg-slate-100 dark:bg-[#151A21] border border-slate-200 dark:border-slate-800 text-foreground font-mono font-bold text-xl focus:outline-none focus:border-[#F4C542]"
                        />
                      </div>
                    </div>

                    {/* From → To visual */}
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                        From Account
                      </label>
                      <div className="grid gap-2">
                        {ACCOUNTS.map((acc) => {
                          const Icon = acc.icon;
                          const isActive = trFrom === acc.fullName;
                          return (
                            <button
                              type="button"
                              key={acc.id}
                              onClick={() => {
                                setTrFrom(acc.fullName);
                                if (acc.fullName === trTo)
                                  setTrTo(
                                    ACCOUNTS.find(
                                      (a) => a.fullName !== acc.fullName,
                                    )?.fullName || ACCOUNTS[1].fullName,
                                  );
                              }}
                              className={`flex items-center gap-3 p-3 rounded-xl border text-sm font-bold transition-all ${
                                isActive
                                  ? "border-amber-500 dark:border-[#F4C542] bg-amber-100 dark:bg-[#F4C542]/10 text-amber-800 dark:text-foreground shadow-sm"
                                  : "border-slate-300 dark:border-border/50 text-slate-600 dark:text-muted-foreground hover:text-slate-800 dark:hover:text-foreground bg-white dark:bg-[#151A21] hover:bg-amber-50 dark:hover:bg-[#151A21]"
                              }`}
                            >
                              <div
                                className={`p-1.5 rounded-lg border ${acc.bg}`}
                              >
                                <Icon className="h-3.5 w-3.5" />
                              </div>
                              <span className="font-bold text-xs">
                                {acc.fullName}
                              </span>
                              {isActive && (
                                <CheckCircle2 className="h-4 w-4 text-[#F4C542] ml-auto" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-px bg-border/50" />
                      <div className="p-2 rounded-full gold-gradient-bg shadow-md">
                        <ArrowRight className="h-4 w-4 text-slate-950" />
                      </div>
                      <div className="flex-1 h-px bg-border/50" />
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                        To Account
                      </label>
                      <div className="grid gap-2">
                        {ACCOUNTS.filter((a) => a.fullName !== trFrom).map(
                          (acc) => {
                            const Icon = acc.icon;
                            const isActive = trTo === acc.fullName;
                            return (
                              <button
                                type="button"
                                key={acc.id}
                                onClick={() => setTrTo(acc.fullName)}
                                className={`flex items-center gap-3 p-3 rounded-xl border text-sm font-bold transition-all ${
                                  isActive
                                    ? "border-amber-500 dark:border-[#F4C542] bg-amber-100 dark:bg-[#F4C542]/10 text-amber-800 dark:text-foreground shadow-sm"
                                    : "border-slate-300 dark:border-border/50 text-slate-600 dark:text-muted-foreground hover:text-slate-800 dark:hover:text-foreground bg-white dark:bg-[#151A21] hover:bg-amber-50 dark:hover:bg-[#151A21]"
                                }`}
                              >
                                <div
                                  className={`p-1.5 rounded-lg border ${acc.bg}`}
                                >
                                  <Icon className="h-3.5 w-3.5" />
                                </div>
                                <div className="text-left">
                                  <div className="font-bold text-xs">
                                    {acc.fullName}
                                  </div>
                                  {acc.type === "Credit Card" && (
                                    <div className="text-[10px] text-purple-400 font-bold mt-0.5">
                                      💳 CC Repayment — reduces outstanding
                                      balance
                                    </div>
                                  )}
                                </div>
                                {isActive && (
                                  <CheckCircle2 className="h-4 w-4 text-[#F4C542] ml-auto" />
                                )}
                              </button>
                            );
                          },
                        )}
                      </div>
                    </div>

                    {/* Date + Description */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                          Date
                        </label>
                        <input
                          type="date"
                          required
                          value={trDate}
                          onChange={(e) => setTrDate(e.target.value)}
                          className="w-full h-11 px-3.5 rounded-xl bg-slate-100 dark:bg-[#151A21] border border-slate-200 dark:border-slate-800 text-foreground font-bold text-xs focus:outline-none focus:border-[#F4C542]"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                          Note
                        </label>
                        <input
                          type="text"
                          value={trDesc}
                          onChange={(e) => setTrDesc(e.target.value)}
                          placeholder="e.g. CC Bill Payment"
                          className="w-full h-11 px-3.5 rounded-xl bg-slate-100 dark:bg-[#151A21] border border-slate-200 dark:border-slate-800 text-foreground font-bold text-xs focus:outline-none focus:border-[#F4C542]"
                        />
                      </div>
                    </div>

                    {/* Preview */}
                    {parseFloat(trAmount) > 0 && (
                      <div className="p-4 rounded-2xl bg-[#F4C542]/10 border border-[#F4C542]/30 flex items-center justify-between">
                        <div className="text-xs font-bold text-muted-foreground">
                          Transfer Summary
                        </div>
                        <div className="text-sm font-bold text-[#F4C542] font-mono">
                          ₹{fmtINR(parseFloat(trAmount))} ·{" "}
                          {ACCOUNTS.find((a) => a.fullName === trFrom)?.name} →{" "}
                          {ACCOUNTS.find((a) => a.fullName === trTo)?.name}
                        </div>
                      </div>
                    )}
                  </CardContent>
                  <div className="p-6 border-t border-border/40 bg-slate-50 dark:bg-[#151A21]/60 flex justify-end gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditingTxId(null);
                        setActiveTab("dashboard");
                      }}
                      className="rounded-xl font-bold"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={saving}
                      className="rounded-xl font-bold px-8 h-11 gold-gradient-bg text-slate-950 shadow-lg shadow-amber-500/25"
                    >
                      {saving
                        ? "Processing..."
                        : editingTxId
                          ? "📝 Update Transfer ↔"
                          : "Confirm Transfer ↔"}
                    </Button>
                  </div>
                </form>
              </Card>
            </motion.div>
            </div>
          </Portal>
        )}

        {/* ══════════════════════════════════════════════════════
            TAB: CHARTS
        ══════════════════════════════════════════════════════ */}
        {activeTab === "charts" && (
          <Portal>
            <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-xl overflow-y-auto p-4 md:p-8 flex items-start justify-center">
              <motion.div
                key="charts"
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-2xl mt-12 mb-20"
            >
              <button
                onClick={() => setActiveTab("dashboard")}
                className="absolute -top-12 right-0 md:-right-12 p-2 bg-white/15 hover:bg-white/25 text-white rounded-full transition-colors backdrop-blur-sm border border-white/20"
              >
                <X className="h-6 w-6" />
              </button>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="glass-panel border-border/40 shadow-xl overflow-hidden p-6 space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-[#F4C542]" /> 6-Month
                      Income vs Expense Trend
                    </h3>
                    <p className="text-xs text-muted-foreground font-semibold">
                      Comparative monthly cashflow velocity across all accounts
                    </p>
                  </div>

                  <div className="h-72 w-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={monthlyChartData}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#262626"
                          opacity={0.4}
                          vertical={false}
                        />
                        <XAxis
                          dataKey="month"
                          stroke="#64748B"
                          fontSize={11}
                          fontWeight={800}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          stroke="#64748B"
                          fontSize={11}
                          fontWeight={800}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v) => `₹${Math.round(v / 1000)}k`}
                        />
                        <RechartsTooltip
                          contentStyle={{
                            backgroundColor: "#08090B",
                            borderColor: "rgba(244,197,66,0.3)",
                            borderRadius: "14px",
                            boxShadow: "0 14px 40px -5px rgba(0,0,0,0.6)",
                            color: "#fff",
                          }}
                          formatter={(val: number, name: string) => [
                            `₹${fmtINR(val)}`,
                            name === "income"
                              ? "Total Income"
                              : "Total Expense",
                          ]}
                        />
                        <Legend
                          iconType="circle"
                          wrapperStyle={{
                            fontSize: "11px",
                            fontWeight: "800",
                            paddingTop: "10px",
                          }}
                        />
                        <Bar
                          dataKey="income"
                          name="Income ↑"
                          fill="#00E676"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={32}
                        />
                        <Bar
                          dataKey="expense"
                          name="Expense ↓"
                          fill="#FF3B30"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={32}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border/30">
                    <div className="p-3 rounded-xl bg-slate-100 dark:bg-[#151A21]">
                      <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                        6M Income
                      </span>
                      <span className="text-sm font-bold font-mono text-[#00E676] mt-0.5 block">
                        ₹
                        {fmtINR(
                          monthlyChartData.reduce((s, m) => s + m.income, 0),
                        )}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-100 dark:bg-[#151A21]">
                      <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                        6M Expense
                      </span>
                      <span className="text-sm font-bold font-mono text-[#FF3B30] mt-0.5 block">
                        ₹
                        {fmtINR(
                          monthlyChartData.reduce((s, m) => s + m.expense, 0),
                        )}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-100 dark:bg-[#151A21]">
                      <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                        Savings Rate
                      </span>
                      <span className="text-sm font-bold font-mono text-[#F4C542] mt-0.5 block">
                        {monthlyChartData.reduce((s, m) => s + m.income, 0) > 0
                          ? `${Math.max(0, Math.round(((monthlyChartData.reduce((s, m) => s + m.income, 0) - monthlyChartData.reduce((s, m) => s + m.expense, 0)) / monthlyChartData.reduce((s, m) => s + m.income, 0)) * 100))}%`
                          : "0%"}
                      </span>
                    </div>
                  </div>
                </Card>

                <Card className="glass-panel border-border/40 shadow-xl overflow-hidden p-6 space-y-4 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-[#F4C542]" /> Expense
                      Allocation by Category
                    </h3>
                    <p className="text-xs text-muted-foreground font-semibold">
                      Distribution across {categoryBreakdown.length} spending
                      vectors
                    </p>
                  </div>

                  {categoryBreakdown.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-center p-8 text-muted-foreground text-xs font-bold">
                      No expense data available to visualize.
                    </div>
                  ) : (
                    <>
                      <div className="h-56 w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={categoryBreakdown}
                              dataKey="amount"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={85}
                              paddingAngle={4}
                            >
                              {categoryBreakdown.map((c, i) => (
                                <Cell key={c.name} fill={c.color} />
                              ))}
                            </Pie>
                            <RechartsTooltip
                              contentStyle={{
                                backgroundColor: "#08090B",
                                borderColor: "rgba(244,197,66,0.3)",
                                borderRadius: "14px",
                                boxShadow: "0 14px 40px -5px rgba(0,0,0,0.6)",
                                color: "#fff",
                              }}
                              formatter={(val: number) => [
                                `₹${fmtINR(val)} (${totalExpense > 0 ? ((val / totalExpense) * 100).toFixed(1) : 0}%)`,
                                "Amount",
                              ]}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1 pt-2 border-t border-border/30">
                        {categoryBreakdown.map((cat) => {
                          const pct =
                            totalExpense > 0
                              ? ((cat.amount / totalExpense) * 100).toFixed(1)
                              : "0";
                          return (
                            <div
                              key={cat.name}
                              className="flex items-center justify-between text-xs font-bold p-2 rounded-xl bg-slate-100 dark:bg-[#151A21]/70"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-base">{cat.icon}</span>
                                <span className="truncate text-foreground">
                                  {cat.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                <span className="font-mono text-muted-foreground">
                                  {pct}%
                                </span>
                                <span className="font-mono font-bold text-foreground private-value">
                                  ₹{fmtINR(cat.amount)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </Card>
              </div>
            </motion.div>
            </div>
          </Portal>
        )}

        {/* ══════════════════════════════════════════════════════
            TAB: BUDGETS
        ══════════════════════════════════════════════════════ */}
        {activeTab === "budgets" && (
          <Portal>
            <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-xl overflow-y-auto p-4 md:p-8 flex items-start justify-center">
              <motion.div
                key="budgets"
                initial={{ opacity: 0, scale: 0.96, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 20 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-full max-w-2xl mt-12 mb-20"
              >
                <button
                  onClick={() => setActiveTab("dashboard")}
                  className="absolute -top-12 right-0 md:-right-12 p-2 bg-white/15 hover:bg-white/25 text-white rounded-full transition-colors backdrop-blur-sm border border-white/20"
                >
                  <X className="h-6 w-6" />
                </button>

                <div className="grid gap-6 md:grid-cols-2">
                  <Card className="glass-panel border-purple-500/30 p-6 space-y-4 relative overflow-hidden shadow-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2.5 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30">
                          <CreditCard className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-base text-foreground">
                            Credit Card Due Date Tracker
                          </h4>
                          <p className="text-xs text-muted-foreground font-semibold">
                            Utkarsh Small Finance CC ****8812
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingCcDue(!editingCcDue);
                          setBudgetInput(String(ccDueDay));
                        }}
                        className="text-xs font-bold h-8 rounded-xl"
                      >
                        {editingCcDue ? "Cancel" : "Change Day"}
                      </Button>
                    </div>

                    {editingCcDue ? (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-100 dark:bg-[#151A21] border border-border/50">
                        <span className="text-xs font-bold text-muted-foreground">
                          Day of month:
                        </span>
                        <input
                          type="number"
                          min="1"
                          max="31"
                          value={ccDueDay}
                          onChange={(e) =>
                            setCcDueDay(parseInt(e.target.value) || 1)
                          }
                          className="w-16 h-9 px-2 rounded-lg bg-white dark:bg-slate-900 border text-center font-mono font-bold text-sm"
                        />
                        <Button
                          size="sm"
                          onClick={() => saveCcDue(ccDueDay)}
                          className="gold-gradient-bg text-slate-950 font-bold h-9 px-4 rounded-lg ml-auto"
                        >
                          Save Day
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-slate-100 dark:bg-[#151A21] border border-border/40">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                            Billing Cycle Due
                          </span>
                          <span className="text-lg font-bold font-mono text-purple-400 mt-0.5 block">
                            Every {ccDueDay}th of month
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                            Days Remaining
                          </span>
                          <span
                            className={`text-lg font-bold font-mono mt-0.5 block ${ccDueInfo.urgency === "critical" ? "text-[#FF3B30] animate-pulse" : ccDueInfo.urgency === "warning" ? "text-[#F4C542]" : "text-[#00E676]"}`}
                          >
                            {ccDueInfo.daysLeft} Day
                            {ccDueInfo.daysLeft !== 1 ? "s" : ""} left
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs font-bold pt-1">
                      <span className="text-muted-foreground">
                        Outstanding CC Balance:{" "}
                        <strong className="text-foreground font-mono">
                          ₹{fmtINR(ccUsed["utkarsh"] || 0)}
                        </strong>{" "}
                        / ₹900
                      </span>
                      <Button
                        size="sm"
                        onClick={() => setActiveTab("transfer")}
                        className="gold-gradient-bg text-slate-950 font-bold rounded-xl h-8 text-xs px-3"
                      >
                        Repay Card ↔
                      </Button>
                    </div>
                  </Card>

                  <Card className="glass-panel border-amber-500/30 p-6 space-y-4 relative overflow-hidden shadow-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          <Repeat className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-base text-foreground">
                            Recurring Expenses (Auto-Log)
                          </h4>
                          <p className="text-xs text-muted-foreground font-semibold">
                            Netflix, Rent, SIPs & subscriptions
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => setShowAddRecurring(!showAddRecurring)}
                        className="gold-gradient-bg text-slate-950 font-bold h-8 rounded-xl text-xs px-3 gap-1"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add New
                      </Button>
                    </div>

                    {showAddRecurring && (
                      <div className="p-4 rounded-xl bg-slate-100 dark:bg-[#151A21] border border-border/50 space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Name (e.g. Netflix)"
                            value={recName}
                            onChange={(e) => setRecName(e.target.value)}
                            className="h-9 px-3 rounded-lg bg-white dark:bg-slate-900 border text-xs font-bold"
                          />
                          <input
                            type="number"
                            placeholder="Amount (₹)"
                            value={recAmount}
                            onChange={(e) => setRecAmount(e.target.value)}
                            className="h-9 px-3 rounded-lg bg-white dark:bg-slate-900 border text-xs font-mono font-bold"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <select
                            value={recCategory}
                            onChange={(e) => setRecCategory(e.target.value)}
                            className="h-9 px-2 rounded-lg bg-white dark:bg-slate-900 border text-xs font-bold"
                          >
                            {DEFAULT_CATEGORIES.map((c) => (
                              <option key={c.name} value={c.name}>
                                {c.icon} {c.name}
                              </option>
                            ))}
                          </select>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-muted-foreground">
                              Due Day:
                            </span>
                            <input
                              type="number"
                              min="1"
                              max="31"
                              value={recDay}
                              onChange={(e) => setRecDay(e.target.value)}
                              className="w-14 h-9 px-2 rounded-lg bg-white dark:bg-slate-900 border text-center font-mono font-bold text-xs"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setShowAddRecurring(false)}
                            className="h-8 text-xs font-bold"
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={addRecurring}
                            className="gold-gradient-bg text-slate-950 font-bold h-8 text-xs px-4"
                          >
                            Save Recurring
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2 max-h-44 overflow-y-auto custom-scrollbar pr-1">
                      {recurringList.length === 0 ? (
                        <div className="py-6 text-center text-muted-foreground text-xs font-bold">
                          No recurring bills scheduled. Click "+ Add New" above!
                        </div>
                      ) : (
                        recurringList.map((rec) => (
                          <div
                            key={rec.id}
                            className="flex items-center justify-between p-3 rounded-xl bg-slate-100 dark:bg-[#151A21] border border-border/30 hover:border-amber-500/40 transition-all"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="text-lg">{rec.icon}</span>
                              <div className="min-w-0">
                                <div className="font-bold text-xs text-foreground truncate">
                                  {rec.name}
                                </div>
                                <div className="text-[10px] text-muted-foreground font-semibold">
                                  Due {rec.dayOfMonth}th of month · {rec.category}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="font-mono font-bold text-sm text-[#FF3B30]">
                                ₹{fmtINR(rec.amount)}
                              </span>
                              <Button
                                size="sm"
                                onClick={() => logRecurringNow(rec)}
                                className="h-7 px-2.5 rounded-lg bg-[#00E676]/15 hover:bg-[#00E676] text-[#00E676] hover:text-slate-950 font-bold text-[10px] transition-all"
                              >
                                Log Now ↑
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteRecurring(rec.id)}
                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </Card>
                </div>

                <Card className="glass-panel border-border/40 shadow-xl p-6 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <Target className="h-5 w-5 text-[#F4C542]" /> Monthly
                        Category Budgets & Overspend Alerts
                      </h3>
                      <p className="text-xs text-muted-foreground font-semibold">
                        Real-time tracking against your monthly budget limits (
                        {new Date().toLocaleString("en-IN", { month: "long" })})
                      </p>
                    </div>
                    <div className="text-xs font-bold text-muted-foreground font-mono">
                      Total Budget: ₹
                      {fmtINR(Object.values(budgets).reduce((s, b) => s + b, 0))}{" "}
                      / mo
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {DEFAULT_CATEGORIES.map((cat) => {
                      const limit =
                        budgets[cat.name] || DEFAULT_BUDGETS[cat.name] || 2000;
                      const spent = monthlySpendByCategory[cat.name] || 0;
                      const pct = Math.round((spent / limit) * 100);
                      const isEditing = editingBudget === cat.name;
                      const isOver = pct >= 100;
                      const isWarning = pct >= 80 && !isOver;

                      return (
                        <div
                          key={cat.name}
                          className={`p-4 rounded-2xl border transition-all space-y-3 ${
                            isOver
                              ? "bg-[#FF3B30]/5 border-[#FF3B30]/20"
                              : isWarning
                                ? "bg-[#F4C542]/5 border-[#F4C542]/20"
                                : "bg-white/5 border-white/10 hover:border-white/20"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{cat.icon}</span>
                              <span className="font-bold text-sm text-foreground">
                                {cat.name}
                              </span>
                            </div>
                            {isEditing ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  value={budgetInput}
                                  onChange={(e) =>
                                    setBudgetInput(e.target.value)
                                  }
                                  className="w-20 h-7 px-2 rounded-md bg-slate-100 dark:bg-slate-900 border text-xs font-mono font-bold focus:outline-none focus:border-[#F4C542]"
                                  autoFocus
                                />
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    saveBudget(cat.name)
                                  }
                                  className="h-7 px-2 text-[10px] gold-gradient-bg text-slate-950 font-bold"
                                >
                                  ✓
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setEditingBudget(null)}
                                  className="h-7 px-1 text-[10px]"
                                >
                                  ✕
                                </Button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingBudget(cat.name);
                                  setBudgetInput(String(limit));
                                }}
                                className="text-muted-foreground hover:text-[#F4C542] font-mono underline decoration-dotted transition-colors"
                              >
                                Limit: ₹{fmtINR(limit)}
                              </button>
                            )}
                          </div>

                          {/* Progress Bar */}
                          <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-border/30">
                            <motion.div
                              className={`h-full rounded-full transition-all duration-700 ${
                                isOver
                                  ? "bg-[#FF3B30]"
                                  : isWarning
                                    ? "bg-[#F4C542]"
                                    : "bg-[#00E676]"
                              }`}
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(100, pct)}%` }}
                            />
                          </div>
                        </div>
                    );
                  })}
                </div>
              </Card>
            </motion.div>
            </div>
          </Portal>
        )}

        {/* ══════════════════════════════════════════════════════
            TAB: HISTORY (WITH SWIPE-TO-DELETE MOBILE & INSTITUTIONAL UX)
        ══════════════════════════════════════════════════════ */}
        {activeTab === "history" && (
          <Portal>
            <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-xl overflow-y-auto p-4 md:p-8 flex items-start justify-center">
            <motion.div
              key="history"
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-2xl mt-12 mb-20"
            >
              <button
                onClick={() => setActiveTab("dashboard")}
                className="absolute -top-12 right-0 md:-right-12 p-2 bg-white/15 hover:bg-white/25 text-white rounded-full transition-colors backdrop-blur-sm border border-white/20"
              >
                <X className="h-6 w-6" />
              </button>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
                  {(["all", "income", "expense", "transfer"] as const).map(
                    (f) => (
                      <button
                        key={f}
                        onClick={() => setHistoryFilter(f)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all capitalize whitespace-nowrap ${
                          historyFilter === f
                            ? "gold-gradient-bg text-slate-950 shadow-sm"
                            : "bg-slate-100 dark:bg-[#151A21] text-muted-foreground hover:text-foreground border border-border/50"
                        }`}
                      >
                        {f === "all" ? "All Entries" : f}
                      </button>
                    ),
                  )}
                </div>
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    placeholder="Search transactions..."
                    className="w-full h-10 pl-9 pr-3.5 rounded-xl bg-slate-100 dark:bg-[#151A21] border border-slate-200 dark:border-slate-800 text-xs font-bold text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#F4C542]"
                  />
                </div>
              </div>

              <Card className="glass-panel border-border/40 shadow-xl overflow-hidden">
                <CardContent className="p-0">
                  {loading ? (
                    <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground text-xs font-bold">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#F4C542] border-t-transparent" />
                      Syncing from cloud...
                    </div>
                  ) : filteredHistory.length === 0 ? (
                    <div className="py-16 text-center text-muted-foreground text-xs font-bold">
                      No transactions found. Start by adding income or logging
                      an expense.
                    </div>
                  ) : (
                    <div className="divide-y divide-border/30">
                      {filteredHistory.map((tx, i) => {
                        const isIncome = tx.tx_type === "income";
                        const isTransfer = tx.tx_type === "transfer";
                        const icon = isIncome
                          ? "💰"
                          : isTransfer
                            ? "↔️"
                            : tx.category_icon || "💸";
                        const accName =
                          ACCOUNTS.find((a) => a.fullName === tx.account)
                            ?.name || tx.account;
                        const isSwiped = swipedId === tx.id;

                        return (
                          <motion.div
                            key={tx.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.02 }}
                            onClick={() => setSwipedId(isSwiped ? null : tx.id)}
                            className="relative flex items-center justify-between px-5 py-4 hover:bg-slate-50 dark:hover:bg-[#151A21]/50 transition-colors group select-none cursor-pointer sm:cursor-default overflow-hidden"
                          >
                            <div className="flex items-center gap-4 min-w-0 flex-1">
                              <div
                                className={`h-10 w-10 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-sm ${
                                  isIncome
                                    ? "bg-[#00E676]/15 text-[#00E676]"
                                    : isTransfer
                                      ? "bg-[#F4C542]/15 text-[#F4C542]"
                                      : "bg-[#FF3B30]/15 text-[#FF3B30]"
                                }`}
                              >
                                {icon}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="font-bold text-sm text-foreground truncate">
                                  {isIncome
                                    ? tx.income_source || tx.income_type
                                    : isTransfer
                                      ? `${ACCOUNTS.find((a) => a.fullName === tx.from_account)?.name} → ${ACCOUNTS.find((a) => a.fullName === tx.to_account)?.name}`
                                      : tx.description || tx.category}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span
                                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                      isIncome
                                        ? "bg-[#00E676]/15 text-[#00E676]"
                                        : isTransfer
                                          ? "bg-[#F4C542]/15 text-[#F4C542]"
                                          : "bg-[#FF3B30]/15 text-[#FF3B30]"
                                    }`}
                                  >
                                    {tx.tx_type}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground font-mono">
                                    {tx.date}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground font-bold">
                                    {accName}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0 ml-3">
                              <div className="text-right">
                                <div
                                  className={`text-base font-bold font-mono ${isIncome ? "text-[#00E676]" : isTransfer ? "text-[#F4C542]" : "text-[#FF3B30]"}`}
                                >
                                  {isIncome ? "+" : isTransfer ? "↔" : "−"}₹
                                  {fmtINR(tx.amount)}
                                </div>
                                {!isIncome &&
                                  !isTransfer &&
                                  tx.payment_mode && (
                                    <div className="text-[10px] text-muted-foreground font-bold">
                                      {tx.payment_mode}
                                    </div>
                                  )}
                              </div>

                              {/* Edit & Delete buttons */}
                              <div
                                className={`flex items-center gap-1.5 transition-all ${
                                  isSwiped
                                    ? "opacity-100 scale-100"
                                    : "opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                                }`}
                              >
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEdit(tx);
                                  }}
                                  title="Edit entry"
                                  className="h-9 w-9 rounded-xl text-muted-foreground hover:text-[#F4C542] hover:bg-[#F4C542]/10 transition-all"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(tx);
                                  }}
                                  title="Delete entry"
                                  className={`h-9 w-9 rounded-xl transition-all ${
                                    isSwiped
                                      ? "bg-destructive text-white shadow-md shadow-red-500/25"
                                      : "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                  }`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
          </Portal>
        )}
      </AnimatePresence>

      {/* ── 24/7 AUTOMATED MOBILE TRACKING SETUP MODAL ── */}
      <AnimatePresence>
        {showWebhookModal && (
          <Portal>
            <div
              className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
            onClick={() => setShowWebhookModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-[#0C1017] border border-amber-500/30 shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto no-scrollbar text-foreground"
            >
              <div className="flex items-center justify-between border-b border-border/40 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl gold-gradient-bg text-slate-950 shadow-md">
                    <Sparkles className="h-6 w-6 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground tracking-tight">
                      24/7 Automated Mobile SMS & GPay Tracking
                    </h3>
                    <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                      Connect your Android or iPhone to log transactions
                      continuously in the background
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowWebhookModal(false)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Webhook Endpoint Box */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-amber-400">
                  Your Cloud Webhook Endpoint URL
                </label>
                <div className="flex items-center gap-2 p-3 rounded-2xl bg-black/60 border border-slate-800 font-mono text-xs text-emerald-400 shadow-inner overflow-x-auto">
                  <span className="truncate flex-1">
                    {typeof window !== "undefined"
                      ? `${window.location.origin}/api/webhook/expense`
                      : "/api/webhook/expense"}
                  </span>
                  <Button
                    size="sm"
                    onClick={() => {
                      const url =
                        typeof window !== "undefined"
                          ? `${window.location.origin}/api/webhook/expense`
                          : "";
                      navigator.clipboard.writeText(url);
                      setCopiedUrl(true);
                      toast.success("Webhook URL copied to clipboard!");
                      setTimeout(() => setCopiedUrl(false), 3000);
                    }}
                    className="h-8 px-3 rounded-xl gold-gradient-bg text-slate-950 font-bold text-[11px] shrink-0 gap-1.5"
                  >
                    {copiedUrl ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-slate-950" />
                    ) : (
                      <Link className="h-3.5 w-3.5" />
                    )}
                    {copiedUrl ? "Copied!" : "Copy URL"}
                  </Button>
                </div>
              </div>

              {/* Setup Guide Cards */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="p-5 rounded-2xl bg-white/5 border border-slate-800/80 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-emerald-400">
                    <span className="p-1.5 rounded-lg bg-emerald-500/20">
                      📱
                    </span>{" "}
                    Android Automation Setup
                  </div>
                  <ol className="text-xs text-muted-foreground space-y-2 list-decimal list-inside font-medium leading-relaxed">
                    <li>
                      Install a free automation app like{" "}
                      <strong className="text-foreground">MacroDroid</strong> or{" "}
                      <strong className="text-foreground">Tasker</strong>.
                    </li>
                    <li>
                      Create a trigger for{" "}
                      <strong className="text-foreground">Incoming SMS</strong>{" "}
                      or{" "}
                      <strong className="text-foreground">
                        GPay Notification
                      </strong>{" "}
                      from bank sender IDs.
                    </li>
                    <li>
                      Add action{" "}
                      <strong className="text-foreground">
                        HTTP POST Request
                      </strong>{" "}
                      to your copied Webhook URL above.
                    </li>
                    <li>
                      Set JSON Body:{" "}
                      <code className="bg-black/60 px-1.5 py-0.5 rounded text-amber-300">
                        {'{"text":"[SMS_Text]"'}
                      </code>
                      .
                    </li>
                  </ol>
                </div>

                <div className="p-5 rounded-2xl bg-white/5 border border-slate-800/80 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-purple-400">
                    <span className="p-1.5 rounded-lg bg-purple-500/20">
                      🍏
                    </span>{" "}
                    iPhone Shortcuts Setup
                  </div>
                  <ol className="text-xs text-muted-foreground space-y-2 list-decimal list-inside font-medium leading-relaxed">
                    <li>
                      Open Apple{" "}
                      <strong className="text-foreground">Shortcuts App</strong>{" "}
                      → Automation → New Personal Automation.
                    </li>
                    <li>
                      Choose trigger{" "}
                      <strong className="text-foreground">
                        Message Received
                      </strong>{" "}
                      or{" "}
                      <strong className="text-foreground">
                        GPay / Apple Pay
                      </strong>{" "}
                      alert.
                    </li>
                    <li>
                      Add action{" "}
                      <strong className="text-foreground">
                        Get Contents of URL
                      </strong>{" "}
                      pointing to your Webhook URL.
                    </li>
                    <li>
                      Set method to{" "}
                      <strong className="text-foreground">POST</strong>, Request
                      Body to <strong className="text-foreground">JSON</strong>,
                      and add key{" "}
                      <code className="bg-black/60 px-1 rounded text-amber-300">
                        text
                      </code>{" "}
                      with value{" "}
                      <strong className="text-foreground">
                        Shortcut Input
                      </strong>
                      .
                    </li>
                  </ol>
                </div>
              </div>

              {/* Live Test Trigger Bar */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-slate-900/60 to-amber-500/15 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <div className="font-bold text-xs text-foreground flex items-center gap-1.5">
                    🧪 Test Your Webhook Engine Right Now
                  </div>
                  <p className="text-[11px] text-muted-foreground font-semibold mt-0.5">
                    Click to simulate an instant UPI debit alert arriving from a
                    phone in the background.
                  </p>
                </div>
                <Button
                  onClick={async () => {
                    setTestingWebhook(true);
                    try {
                      const res = await fetch("/api/webhook/expense", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          text: `Rs 520 debited from A/c XX4218 on ${new Date().toISOString().split("T")[0]} to Starbucks Coffee via UPI Ref 901283`,
                        }),
                      });
                      const data = await res.json();
                      if (data.success) {
                        toast.success(
                          "🎉 Background Webhook Test Passed! Logged ₹520 at Starbucks.",
                        );
                        fetchAll();
                      } else {
                        toast.error(
                          "Webhook test failed: " +
                            (data.message || data.error),
                        );
                      }
                    } catch (e: any) {
                      toast.error("Error triggering test: " + e.message);
                    } finally {
                      setTestingWebhook(false);
                    }
                  }}
                  disabled={testingWebhook}
                  className="h-10 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shrink-0 gap-1.5"
                >
                  {testingWebhook ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  Simulate Live SMS Alert →
                </Button>
              </div>

              <div className="flex justify-end pt-2 border-t border-border/30">
                <Button
                  onClick={() => setShowWebhookModal(false)}
                  className="h-10 px-6 rounded-xl gold-gradient-bg text-slate-950 font-bold text-xs shadow-md"
                >
                  Got It, Done! ✓
                </Button>
              </div>
            </motion.div>
            </div>
          </Portal>
        )}
      </AnimatePresence>

      {/* ── PREMIUM CREDIT LIMIT MODAL ── */}
      <AnimatePresence>
        {showCCLimitModal && (
          <Portal>
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative w-full max-w-sm glass-panel border-purple-500/30 overflow-hidden shadow-2xl"
            >
              <div className="h-1.5 bg-gradient-to-r from-purple-500 to-pink-500" />
              <div className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-foreground">Update Credit Limit</h3>
                  <button
                    onClick={() => setShowCCLimitModal(false)}
                    className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    New Limit (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-500 font-bold text-lg">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="any"
                      required
                      autoFocus
                      value={ccLimitInput}
                      onChange={(e) => setCCLimitInput(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-3.5 py-3 rounded-xl bg-slate-100 dark:bg-[#151A21] border border-slate-200 dark:border-slate-800 text-foreground font-mono font-bold text-xl focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <Button
                  onClick={() => {
                    const parsed = Number(ccLimitInput);
                    if (!isNaN(parsed) && parsed > 0 && editingCCId) {
                      const key = `cc_limit_${editingCCId}`;
                      setUserSetting(key, String(parsed));
                      localStorage.setItem(key, String(parsed));
                      setCCLimitsOverride(prev => ({ ...prev, [editingCCId]: parsed }));
                      setShowCCLimitModal(false);
                      toast.success(`Credit limit updated to ₹${fmtINR(parsed)}`);
                    } else {
                      toast.error("Please enter a valid amount");
                    }
                  }}
                  className="w-full rounded-xl font-bold h-11 bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white shadow-lg shadow-purple-500/25"
                >
                  Save Limit ✓
                </Button>
              </div>
            </motion.div>
            </div>
          </Portal>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ExpensesPage() {
  return (
    <Suspense
      fallback={
        <div className="p-10 text-center font-bold">
          Loading Financial Engine...
        </div>
      }
    >
      <ExpensesContent />
    </Suspense>
  );
}
