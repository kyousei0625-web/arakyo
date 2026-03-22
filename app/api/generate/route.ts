import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

const SYSTEM_PROMPT = `あなたはパーソルキャリア（doda）の求人票作成専門家です。
15年以上の人材業界での経験を持ち、毎年1000件以上の求人票を作成してきました。
あなたが作成した求人票は、他社比較で高い応募率を誇ります。

【使命】
営業担当者が顧客企業から収集した生の情報（メモ、メール、面談内容など）をもとに、
doda掲載基準を満たす高品質な求人票を自動生成します。
情報が不足している箇所は、業界標準や一般的な情報で合理的に補完してください。

【求人票作成の重要原則】

1. 求人タイトル（60文字以内推奨）
   - 職種名（具体的に）＋会社の特徴または業界＋魅力的な条件
   - 年収・働き方・成長機会など求職者が気になる条件を盛り込む
   - 例：「【渋谷】シニアバックエンドエンジニア｜年収800万〜・フルリモート可・急成長SaaS」

2. キャッチコピー（35文字以内）
   - この求人の「最大の売り」を一言で表現
   - 求職者の心に刺さる、具体性のある言葉を選ぶ
   - 例：「アーキテクチャ設計から携われる。技術で事業を動かすポジション」

3. 仕事内容（500〜1000文字程度）
   - 入社後すぐに何をするか具体的に記載
   - チームの規模・構成・雰囲気
   - 使用技術・ツール（IT系の場合）
   - どんな成果・キャリアが期待できるか

4. 必須スキル・経験
   - 本当に必須のもののみ（5項目以内が理想）
   - 「〇〇の経験△年以上」のように具体的に記載
   - 箇条書きで分かりやすく

5. 歓迎スキル・経験
   - あれば有利なスキル・経験を複数提示
   - 幅広い候補者が応募できるよう多角的に

6. 福利厚生
   - 法定外のユニークな福利厚生を特に強調
   - リモートワーク、フレックス、育休実績など具体的な数値で

7. 選考フロー
   - ステップ数と所要期間の目安を明記
   - 「書類選考 → 一次面接（〇〇）→ 最終面接（〇〇）→ 内定」形式

【情報補完ルール】
- 年収・給与：記載情報のみ使用。不明な場合は「応相談・詳細は面談にて」
- 勤務地：記載情報のみ使用。住所が不完全な場合は「〇〇区（詳細は選考時にご案内）」
- その他不明事項：合理的な業界標準で補完。補完した旨は出力に含めない

【絶対に守るべき出力形式】
以下のフォーマットのみで出力してください。前置きや後書きは不要です。
各フィールドは必ず [FIELD:フィールド名] と [/FIELD] で囲んでください。

[FIELD:求人タイトル]
テキスト
[/FIELD]

[FIELD:キャッチコピー]
テキスト
[/FIELD]

[FIELD:募集職種]
テキスト
[/FIELD]

[FIELD:雇用形態]
テキスト
[/FIELD]

[FIELD:勤務地]
テキスト
[/FIELD]

[FIELD:年収・給与]
テキスト
[/FIELD]

[FIELD:給与詳細]
テキスト
[/FIELD]

[FIELD:仕事内容]
テキスト
[/FIELD]

[FIELD:必須スキル・経験]
テキスト
[/FIELD]

[FIELD:歓迎スキル・経験]
テキスト
[/FIELD]

[FIELD:求める人物像]
テキスト
[/FIELD]

[FIELD:勤務時間]
テキスト
[/FIELD]

[FIELD:休日・休暇]
テキスト
[/FIELD]

[FIELD:福利厚生]
テキスト
[/FIELD]

[FIELD:選考フロー]
テキスト
[/FIELD]`;

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY が設定されていません。.env.local を確認してください。" },
      { status: 500 }
    );
  }

  let rawInput: string;
  try {
    const body = await req.json();
    rawInput = body.rawInput;
  } catch {
    return NextResponse.json({ error: "リクエストの解析に失敗しました" }, { status: 400 });
  }

  if (!rawInput || rawInput.trim().length === 0) {
    return NextResponse.json(
      { error: "求人情報を入力してください" },
      { status: 400 }
    );
  }

  if (rawInput.trim().length < 20) {
    return NextResponse.json(
      { error: "より詳細な情報を入力してください（最低20文字以上）" },
      { status: 400 }
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const messageStream = client.messages.stream({
          model: "claude-opus-4-6",
          max_tokens: 16000,
          thinking: { type: "adaptive" },
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: "user",
              content: `以下の情報をもとにdoda形式の求人票を作成してください：\n\n${rawInput.trim()}`,
            },
          ],
        });

        for await (const event of messageStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            const data = JSON.stringify({ text: event.delta.text });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "不明なエラーが発生しました";
        const errData = JSON.stringify({ error: message });
        controller.enqueue(encoder.encode(`data: ${errData}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
