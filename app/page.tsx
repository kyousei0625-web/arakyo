"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Sparkles,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Trash2,
  FileText,
  AlertCircle,
  Loader2,
  ClipboardPaste,
  Download,
} from "lucide-react";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface JobPosting {
  jobTitle: string;
  catchphrase: string;
  jobType: string;
  employmentType: string;
  location: string;
  salary: string;
  salaryDetail: string;
  jobDescription: string;
  requiredSkills: string;
  preferredSkills: string;
  idealCandidate: string;
  workHours: string;
  holidays: string;
  benefits: string;
  selectionProcess: string;
}

interface FieldDef {
  key: keyof JobPosting;
  label: string;
  fieldName: string; // matches [FIELD:xxx] in stream
  rows: number;
  hint?: string;
  maxChars?: number;
  isShort?: boolean;
}

// ─────────────────────────────────────────────
// Field definitions (order = display order)
// ─────────────────────────────────────────────
const FIELDS: FieldDef[] = [
  {
    key: "jobTitle",
    label: "求人タイトル",
    fieldName: "求人タイトル",
    rows: 2,
    hint: "職種名・会社特徴・魅力的な条件を盛り込む（60文字以内推奨）",
    maxChars: 80,
  },
  {
    key: "catchphrase",
    label: "キャッチコピー",
    fieldName: "キャッチコピー",
    rows: 2,
    hint: "この求人の最大の売りを一言で（35文字以内）",
    maxChars: 50,
    isShort: true,
  },
  {
    key: "jobType",
    label: "募集職種",
    fieldName: "募集職種",
    rows: 1,
    isShort: true,
  },
  {
    key: "employmentType",
    label: "雇用形態",
    fieldName: "雇用形態",
    rows: 1,
    isShort: true,
  },
  {
    key: "location",
    label: "勤務地",
    fieldName: "勤務地",
    rows: 2,
    isShort: true,
  },
  {
    key: "salary",
    label: "年収・給与",
    fieldName: "年収・給与",
    rows: 1,
    hint: "例：年収500万円〜800万円（経験・スキルに応じて決定）",
    isShort: true,
  },
  {
    key: "salaryDetail",
    label: "給与詳細",
    fieldName: "給与詳細",
    rows: 3,
    hint: "月給・賞与・昇給などの詳細",
  },
  {
    key: "jobDescription",
    label: "仕事内容",
    fieldName: "仕事内容",
    rows: 10,
    hint: "入社後の具体的な業務・チーム構成・使用技術・期待される成果",
  },
  {
    key: "requiredSkills",
    label: "必須スキル・経験",
    fieldName: "必須スキル・経験",
    rows: 6,
    hint: "本当に必須のもの5項目以内で箇条書き",
  },
  {
    key: "preferredSkills",
    label: "歓迎スキル・経験",
    fieldName: "歓迎スキル・経験",
    rows: 5,
    hint: "あれば有利なスキル・経験を幅広く",
  },
  {
    key: "idealCandidate",
    label: "求める人物像",
    fieldName: "求める人物像",
    rows: 4,
  },
  {
    key: "workHours",
    label: "勤務時間",
    fieldName: "勤務時間",
    rows: 2,
    isShort: true,
  },
  {
    key: "holidays",
    label: "休日・休暇",
    fieldName: "休日・休暇",
    rows: 3,
    isShort: true,
  },
  {
    key: "benefits",
    label: "福利厚生",
    fieldName: "福利厚生",
    rows: 6,
    hint: "法定外のユニークな福利厚生を特に強調",
  },
  {
    key: "selectionProcess",
    label: "選考フロー",
    fieldName: "選考フロー",
    rows: 3,
    hint: "書類選考 → 面接（回数）→ 内定 の形式で所要期間も記載",
  },
];

const FIELD_NAME_TO_KEY: Record<string, keyof JobPosting> = FIELDS.reduce(
  (acc, f) => ({ ...acc, [f.fieldName]: f.key }),
  {}
);

const DEFAULT_POSTING: JobPosting = {
  jobTitle: "",
  catchphrase: "",
  jobType: "",
  employmentType: "",
  location: "",
  salary: "",
  salaryDetail: "",
  jobDescription: "",
  requiredSkills: "",
  preferredSkills: "",
  idealCandidate: "",
  workHours: "",
  holidays: "",
  benefits: "",
  selectionProcess: "",
};

// ─────────────────────────────────────────────
// Demo output (simulates Claude's streaming response)
// ─────────────────────────────────────────────
const DEMO_OUTPUT = `[FIELD:求人タイトル]
【渋谷】シニアバックエンドエンジニア｜株式会社テクノソリューションズ｜年収700万〜1000万円・フレックス勤務
[/FIELD]

[FIELD:キャッチコピー]
急成長SaaSでアーキテクチャを牽引。技術で事業を動かすポジション
[/FIELD]

[FIELD:募集職種]
バックエンドエンジニア（シニア・テックリード候補）
[/FIELD]

[FIELD:雇用形態]
正社員（試用期間3ヶ月）
[/FIELD]

[FIELD:勤務地]
東京都渋谷区道玄坂2-10-12（渋谷駅・徒歩5分）
※フレックスタイム制によりリモート勤務併用可
[/FIELD]

[FIELD:年収・給与]
年収700万円〜1000万円（経験・スキルに応じて決定）
[/FIELD]

[FIELD:給与詳細]
月給50万円〜70万円（固定残業代含まず）
賞与：年2回（業績連動型、前期実績 平均1.8ヶ月分）
昇給：年1回（4月）
試用期間中の待遇変更なし
[/FIELD]

[FIELD:仕事内容]
■ ポジション概要
急成長中のBtoB SaaSプロダクト「ConnectHub」のバックエンド開発をリードするポジションです。
エンジニア60名体制の中で、5名のチームを率いながら、新機能開発から技術的意思決定まで幅広く担当していただきます。

■ 具体的な業務内容
・新規SaaSプロダクト「ConnectHub」のバックエンドAPI設計・実装（Go / Python）
・マイクロサービスアーキテクチャの設計・移行・最適化
・チームメンバー5名のコードレビュー、技術メンタリング
・アーキテクチャ選定・技術スタックの意思決定への参画
・インフラ（AWS）のコスト最適化・パフォーマンスチューニング
・月1回の技術発表会（LT会）での登壇・ナレッジシェア

■ チーム・開発環境
チーム構成：シニアエンジニア2名、ミドルエンジニア3名
技術スタック：Go / Python / PostgreSQL / Redis / AWS（ECS, RDS, S3）/ Terraform
開発スタイル：スクラム（2週間スプリント）、PR レビュー文化が根付いており品質重視
[/FIELD]

[FIELD:必須スキル・経験]
・バックエンド開発の実務経験5年以上（Go / Java / Python / Rubyいずれか）
・AWS等クラウドインフラを活用したシステム構築・運用経験
・チームリードまたはテックリードとしてのマネジメント経験（3名以上）
・RESTful API またはGraphQL の設計・実装経験
・RDB（MySQL / PostgreSQL）の設計・パフォーマンスチューニング経験
[/FIELD]

[FIELD:歓迎スキル・経験]
・SaaS企業でのプロダクト開発経験
・マイクロサービスアーキテクチャの設計・移行経験
・Terraform / Infrastructure as Code の実務経験
・GraphQL の実務経験
・技術ブログ執筆やOSS コントリビューションの実績
・英語でのビジネスコミュニケーション能力（社内ドキュメントの一部が英語）
[/FIELD]

[FIELD:求める人物像]
・技術的なこだわりを持ちながら、事業成長にコミットできる方
・チームのパフォーマンスを最大化することに喜びを感じる方
・変化の速い環境でも自律的に動き、積極的に課題解決できる方
・エンジニアリング組織のカルチャー作りに興味がある方
[/FIELD]

[FIELD:勤務時間]
フレックスタイム制
コアタイム：11:00〜16:00
標準労働時間：8時間/日（所定労働時間）
時間外労働：月平均10〜15時間程度
[/FIELD]

[FIELD:休日・休暇]
完全週休2日制（土・日）、祝日
年末年始休暇（12/29〜1/3）
年次有給休暇（入社半年後から20日付与、最大40日繰越可）
慶弔休暇、特別休暇
育児休業・介護休業（取得実績あり、男性取得率60%）
[/FIELD]

[FIELD:福利厚生]
■ 社会保険・手当
・各種社会保険完備（健康・厚生年金・雇用・労災）
・通勤手当（全額支給、上限なし）
・時間外手当（固定残業超過分は全額別途支給）

■ キャリア・スキルアップ支援
・書籍購入補助：月1万円（技術書・ビジネス書問わず）
・外部勉強会・カンファレンス参加費全額会社負担（KubeCon、AWS re:Invent等）
・オンライン学習プラットフォーム（Udemy Business）利用可

■ ライフスタイル支援
・リモートワーク可（週3日まで）
・社員食堂完備（昼食補助あり、1食300円負担）
・健康診断（年1回、家族も補助対象）
・インフルエンザ予防接種補助

■ その他
・ストックオプション制度（全社員対象）
・社内表彰制度（四半期MVP）
[/FIELD]

[FIELD:選考フロー]
書類選考（3営業日以内に結果通知）
　↓
コーディングテスト（オンライン・1週間以内提出）
　↓
一次面接：エンジニアチーム（オンライン・60分）
　↓
二次面接：CTO（オンラインまたは対面・60分）
　↓
最終面接：CEO（対面・30分）
　↓
内定・オファー面談

所要期間：通常2〜3週間
※ご状況に応じてスケジュール調整可能です
[/FIELD]`;

// ─────────────────────────────────────────────
// Sample input for demo
// ─────────────────────────────────────────────
const SAMPLE_INPUT = `【顧客情報メモ】
会社名：株式会社テクノソリューションズ
業種：IT/SaaS
所在地：東京都渋谷区道玄坂2-10-12（渋谷駅徒歩5分）

■ 募集ポジション：シニアバックエンドエンジニア

■ 年収：700万〜1000万円（経験・スキルに応じて決定）
　基本給：月給50万〜70万円
　賞与：年2回（業績連動）

■ 仕事内容：
・新規SaaSプロダクト「ConnectHub」のバックエンド開発
・マイクロサービスアーキテクチャの設計・実装
・チームリードとして5名のエンジニアをマネジメント
・技術的意思決定、コードレビュー
・月1回の技術発表会

■ 必須条件：
・バックエンド開発経験5年以上（Go/Java/Python等）
・クラウドインフラ経験（AWS）
・チームリードまたはテックリード経験

■ 歓迎条件：
・SaaS事業会社での経験
・GraphQL経験
・英語でのコミュニケーション能力

■ 勤務時間：フレックスタイム制（コアタイム11:00〜16:00）
■ 休日：完全週休2日制（土日）、祝日、年末年始
■ 有給：入社半年後から20日付与

■ 福利厚生：
・社会保険完備
・通勤手当（全額支給）
・書籍購入補助（月1万円）
・勉強会・カンファレンス参加支援
・リモートワーク可（週3日まで）
・健康診断（年1回）
・社員食堂（昼食補助あり）
・ストックオプション制度

■ 選考フロー：
書類選考 → コーディングテスト → 一次面接（エンジニアチーム）
→ 二次面接（CTO）→ 最終面接（CEO）→ 内定
所要期間：通常2〜3週間

■ 会社メモ：
・2018年創業、急成長中
・現在ユーザー数50万、ARR30億円
・社員100名（エンジニア60名）
・自由な社風、意見が通りやすい
・技術ブログ積極的に書いている`;

// ─────────────────────────────────────────────
// Parse streamed field tags
// ─────────────────────────────────────────────
function parseCompletedFields(text: string): Partial<JobPosting> {
  const regex = /\[FIELD:([^\]]+)\]([\s\S]*?)\[\/FIELD\]/g;
  const result: Partial<JobPosting> = {};
  let match;
  while ((match = regex.exec(text)) !== null) {
    const fieldName = match[1].trim();
    const value = match[2].trim();
    const key = FIELD_NAME_TO_KEY[fieldName];
    if (key) {
      result[key] = value;
    }
  }
  return result;
}

// Detect which field is currently being written (started but not yet closed)
function detectActiveField(text: string): string | null {
  const lastOpen = text.lastIndexOf("[FIELD:");
  if (lastOpen === -1) return null;
  const afterOpen = text.slice(lastOpen);
  if (afterOpen.includes("[/FIELD]")) return null;
  const nameMatch = afterOpen.match(/^\[FIELD:([^\]]+)\]/);
  return nameMatch ? nameMatch[1].trim() : null;
}

// ─────────────────────────────────────────────
// FieldCard component
// ─────────────────────────────────────────────
function FieldCard({
  field,
  value,
  isActive,
  onChange,
}: {
  field: FieldDef;
  value: string;
  isActive: boolean;
  onChange: (v: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const isDone = value.length > 0;

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`bg-white rounded-xl border-2 transition-all duration-300 overflow-hidden ${
        isActive
          ? "border-blue-400 shadow-md shadow-blue-100 field-generating"
          : isDone
          ? "border-green-200 shadow-sm"
          : "border-gray-200"
      }`}
    >
      {/* Field header */}
      <div
        className={`flex items-center justify-between px-4 py-2.5 ${
          isActive
            ? "bg-blue-50"
            : isDone
            ? "bg-green-50"
            : "bg-gray-50"
        }`}
      >
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-bold uppercase tracking-wide ${
              isActive
                ? "text-blue-600"
                : isDone
                ? "text-green-600"
                : "text-gray-400"
            }`}
          >
            {isActive ? "● 生成中" : isDone ? "✓ 完了" : "○ 未生成"}
          </span>
          <h3 className="font-semibold text-gray-700 text-sm">{field.label}</h3>
          {field.maxChars && value && (
            <span
              className={`text-xs ${
                value.length > field.maxChars
                  ? "text-red-500 font-semibold"
                  : "text-gray-400"
              }`}
            >
              {value.length}/{field.maxChars}文字
            </span>
          )}
        </div>
        {isDone && !isActive && (
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 transition-colors px-2 py-1 rounded hover:bg-blue-50"
          >
            {copied ? (
              <Check size={12} className="text-green-500" />
            ) : (
              <Copy size={12} />
            )}
            {copied ? "コピー済み" : "コピー"}
          </button>
        )}
      </div>

      {/* Hint */}
      {field.hint && !isDone && !isActive && (
        <p className="px-4 pt-2 text-xs text-gray-400">{field.hint}</p>
      )}

      {/* Content */}
      <div className="px-4 pb-4 pt-2">
        {isActive && !value ? (
          <div className="space-y-2">
            <div className="skeleton h-4 w-3/4" />
            <div className="skeleton h-4 w-full" />
            {field.rows > 3 && <div className="skeleton h-4 w-5/6" />}
          </div>
        ) : (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={field.rows}
            placeholder={
              isActive
                ? "生成中..."
                : `${field.label}を入力（または生成後に編集）`
            }
            className={`w-full text-sm text-gray-800 leading-relaxed bg-transparent border-0 focus:ring-0 p-0 placeholder-gray-300 ${
              isActive ? "opacity-60" : ""
            }`}
          />
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export default function Page() {
  const [rawInput, setRawInput] = useState("");
  const [jobPosting, setJobPosting] = useState<JobPosting>(DEFAULT_POSTING);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeField, setActiveField] = useState<string | null>(null);
  const [generationDone, setGenerationDone] = useState(false);
  const [allCopied, setAllCopied] = useState(false);
  const [showTips, setShowTips] = useState(true);

  const abortRef = useRef<AbortController | null>(null);
  const outputPanelRef = useRef<HTMLDivElement>(null);
  const accumulatedRef = useRef<string>("");

  const filledCount = Object.values(jobPosting).filter((v) => v.length > 0).length;

  // Demo mode: simulate streaming with pre-built output
  const handleDemoGenerate = useCallback(async () => {
    setIsGenerating(true);
    setError(null);
    setGenerationDone(false);
    setJobPosting(DEFAULT_POSTING);
    setActiveField(null);
    accumulatedRef.current = "";
    if (outputPanelRef.current) {
      outputPanelRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }

    const chunkSize = 8; // chars per tick
    const delay = 18;    // ms between ticks

    for (let i = 0; i < DEMO_OUTPUT.length; i += chunkSize) {
      await new Promise((r) => setTimeout(r, delay));
      accumulatedRef.current += DEMO_OUTPUT.slice(i, i + chunkSize);
      const fields = parseCompletedFields(accumulatedRef.current);
      const current = detectActiveField(accumulatedRef.current);
      setActiveField(current);
      setJobPosting((prev) => ({ ...prev, ...fields }));
    }

    setIsGenerating(false);
    setGenerationDone(true);
    setActiveField(null);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!rawInput.trim()) {
      setError("顧客情報を入力してください");
      return;
    }

    // Abort any ongoing request
    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();

    setIsGenerating(true);
    setError(null);
    setGenerationDone(false);
    setJobPosting(DEFAULT_POSTING);
    setActiveField(null);
    accumulatedRef.current = "";

    // Scroll output panel to top
    if (outputPanelRef.current) {
      outputPanelRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawInput }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("ストリームの取得に失敗しました");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6);
          if (payload === "[DONE]") {
            setIsGenerating(false);
            setGenerationDone(true);
            setActiveField(null);
            return;
          }

          try {
            const parsed = JSON.parse(payload);
            if (parsed.error) {
              throw new Error(parsed.error);
            }
            if (parsed.text) {
              accumulatedRef.current += parsed.text;
              const fields = parseCompletedFields(accumulatedRef.current);
              const current = detectActiveField(accumulatedRef.current);
              setActiveField(current);
              setJobPosting((prev) => ({ ...prev, ...fields }));
            }
          } catch (parseErr) {
            if (parseErr instanceof Error && parseErr.message !== "Unexpected end of JSON input") {
              throw parseErr;
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      const msg = err instanceof Error ? err.message : "不明なエラーが発生しました";
      setError(msg);
    } finally {
      setIsGenerating(false);
    }
  }, [rawInput]);

  // Keyboard shortcut: Ctrl+Enter to generate
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && !isGenerating) {
        handleGenerate();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleGenerate, isGenerating]);

  const handleCopyAll = () => {
    const lines: string[] = [];
    for (const field of FIELDS) {
      const value = jobPosting[field.key];
      if (value) {
        lines.push(`【${field.label}】`);
        lines.push(value);
        lines.push("");
      }
    }
    navigator.clipboard.writeText(lines.join("\n"));
    setAllCopied(true);
    setTimeout(() => setAllCopied(false), 2500);
  };

  const handleClear = () => {
    setJobPosting(DEFAULT_POSTING);
    setGenerationDone(false);
    setActiveField(null);
    setError(null);
    accumulatedRef.current = "";
  };

  const handleFieldChange = (key: keyof JobPosting, value: string) => {
    setJobPosting((prev) => ({ ...prev, [key]: value }));
  };

  // Export as text file
  const handleExport = () => {
    const lines: string[] = ["doda 求人票", "=".repeat(50), ""];
    for (const field of FIELDS) {
      const value = jobPosting[field.key];
      if (value) {
        lines.push(`【${field.label}】`);
        lines.push(value);
        lines.push("");
      }
    }
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `doda_求人票_${new Date().toLocaleDateString("ja-JP").replace(/\//g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* ── Header ── */}
      <header className="flex-shrink-0 bg-[#1A2B4A] text-white shadow-lg z-10">
        <div className="max-w-screen-2xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-orange-500 rounded-lg p-1.5">
              <FileText size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none">doda 求人票ジェネレーター</h1>
              <p className="text-blue-300 text-xs mt-0.5">営業担当向け 高精度求人票自動生成ツール</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-blue-200">
            <span className="hidden sm:block">Powered by Claude Opus</span>
            <kbd className="hidden md:flex items-center gap-1 bg-white/10 rounded px-2 py-1 text-xs">
              <span className="text-xs">⌘</span>+Enter で生成
            </kbd>
          </div>
        </div>
      </header>

      {/* ── Main layout ── */}
      <div className="flex-1 flex overflow-hidden max-w-screen-2xl mx-auto w-full">
        {/* ── Left panel: Input ── */}
        <aside className="w-80 xl:w-96 flex-shrink-0 flex flex-col border-r border-gray-200 bg-white overflow-y-auto scrollbar-thin">
          <div className="p-5 space-y-4">
            {/* Panel title */}
            <div>
              <h2 className="font-bold text-gray-800 flex items-center gap-2">
                <ClipboardPaste size={16} className="text-blue-500" />
                顧客情報を入力
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                面談メモ・メール・資料など何でも貼り付けOK
              </p>
            </div>

            {/* Tips toggle */}
            <div className="bg-blue-50 rounded-lg overflow-hidden">
              <button
                onClick={() => setShowTips((v) => !v)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
              >
                <span>入力のコツ</span>
                {showTips ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {showTips && (
                <ul className="px-3 pb-3 text-xs text-blue-700 space-y-1">
                  {[
                    "職種名・年収レンジ",
                    "仕事内容・使用技術",
                    "必須スキル・歓迎スキル",
                    "勤務地・勤務時間",
                    "休日・福利厚生",
                    "選考フロー",
                  ].map((tip) => (
                    <li key={tip} className="flex items-start gap-1.5">
                      <span className="text-blue-400 mt-0.5">▸</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                  <li className="text-gray-400 mt-2 text-[10px]">
                    ※ 不足情報は業界標準で自動補完されます
                  </li>
                </ul>
              )}
            </div>

            {/* Sample button */}
            <button
              onClick={() => setRawInput(SAMPLE_INPUT)}
              className="w-full text-xs text-gray-500 border border-dashed border-gray-300 rounded-lg py-2 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-all"
            >
              サンプルデータを挿入
            </button>

            {/* Textarea */}
            <textarea
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              rows={16}
              placeholder={`例：\n会社名：〇〇株式会社\n職種：エンジニア\n年収：500〜700万円\n仕事内容：〇〇の開発...\n必須：〇〇の経験3年以上`}
              className="w-full text-sm border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-300 focus:border-blue-400 placeholder-gray-300 resize-none scrollbar-thin bg-gray-50 transition-all"
            />

            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>{rawInput.length.toLocaleString()} 文字</span>
              {rawInput && (
                <button
                  onClick={() => setRawInput("")}
                  className="hover:text-red-400 transition-colors"
                >
                  クリア
                </button>
              )}
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !rawInput.trim()}
              className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95 text-sm"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>求人票を生成中...</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>求人票を自動生成</span>
                </>
              )}
            </button>

            {/* Demo mode button */}
            <button
              onClick={handleDemoGenerate}
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2 border border-gray-300 hover:border-blue-400 hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed text-gray-600 hover:text-blue-600 font-medium py-2.5 px-6 rounded-xl transition-all text-sm"
            >
              <Sparkles size={14} />
              デモデータで動作確認
            </button>

            {isGenerating && (
              <p className="text-center text-xs text-gray-400">
                Claude Opus が生成中です。しばらくお待ちください。
              </p>
            )}
          </div>
        </aside>

        {/* ── Right panel: Output ── */}
        <main
          ref={outputPanelRef}
          className="flex-1 overflow-y-auto scrollbar-thin"
        >
          {/* Sticky action bar */}
          <div className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur-sm border-b border-gray-200 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="font-bold text-gray-700">生成された求人票</h2>
              {generationDone && (
                <span className="text-xs bg-green-100 text-green-700 font-semibold px-2.5 py-1 rounded-full">
                  {filledCount}/{FIELDS.length} フィールド完了
                </span>
              )}
              {isGenerating && (
                <span className="text-xs bg-blue-100 text-blue-600 font-medium px-2.5 py-1 rounded-full animate-pulse">
                  生成中...
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {generationDone && (
                <>
                  <button
                    onClick={handleClear}
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-500 border border-gray-200 hover:border-red-200 rounded-lg px-3 py-1.5 transition-all hover:bg-red-50"
                  >
                    <Trash2 size={13} />
                    クリア
                  </button>
                  <button
                    onClick={handleExport}
                    className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-blue-600 border border-gray-200 hover:border-blue-300 rounded-lg px-3 py-1.5 transition-all hover:bg-blue-50"
                  >
                    <Download size={13} />
                    TXTで保存
                  </button>
                  <button
                    onClick={handleCopyAll}
                    className="flex items-center gap-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded-lg px-3 py-1.5 transition-all shadow-sm"
                  >
                    {allCopied ? (
                      <Check size={13} />
                    ) : (
                      <Copy size={13} />
                    )}
                    {allCopied ? "コピー済み！" : "全フィールドをコピー"}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Fields grid */}
          <div className="p-6">
            {!isGenerating && !generationDone && (
              <div className="flex flex-col items-center justify-center h-96 text-center">
                <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 max-w-md">
                  <Sparkles size={40} className="text-gray-300 mx-auto mb-4" />
                  <h3 className="font-bold text-gray-400 text-lg">まだ生成されていません</h3>
                  <p className="text-gray-400 text-sm mt-2">
                    左パネルに顧客情報を貼り付けて
                    <br />
                    「求人票を自動生成」ボタンを押してください
                  </p>
                </div>
              </div>
            )}

            {(isGenerating || generationDone) && (
              <div className="space-y-4 max-w-4xl">
                {/* Short fields: 2 columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {FIELDS.filter((f) => f.isShort).map((field) => (
                    <FieldCard
                      key={field.key}
                      field={field}
                      value={jobPosting[field.key]}
                      isActive={activeField === field.fieldName}
                      onChange={(v) => handleFieldChange(field.key, v)}
                    />
                  ))}
                </div>

                {/* Long fields: full width */}
                {FIELDS.filter((f) => !f.isShort).map((field) => (
                  <FieldCard
                    key={field.key}
                    field={field}
                    value={jobPosting[field.key]}
                    isActive={activeField === field.fieldName}
                    onChange={(v) => handleFieldChange(field.key, v)}
                  />
                ))}

                {generationDone && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                    <Check size={20} className="text-green-600 flex-shrink-0" />
                    <div>
                      <p className="text-green-800 font-semibold text-sm">
                        求人票の生成が完了しました
                      </p>
                      <p className="text-green-600 text-xs mt-0.5">
                        各フィールドを確認・編集して、doda管理画面に貼り付けてください。
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
