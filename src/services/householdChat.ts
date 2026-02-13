const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? '';

export type HouseholdToolName = 'add_reminder' | 'add_to_list' | 'mark_paid' | 'schedule_appointment';

export type ExecuteToolFn = (name: HouseholdToolName, args: Record<string, unknown>) => Promise<string>;

const HOUSEHOLD_TOOLS = [
  {
    type: 'function' as const,
    function: {
      name: 'add_reminder',
      description: 'Create a reminder for the user. Use for "remind me to X in Y time" or "don\'t forget to X".',
      parameters: {
        type: 'object' as const,
        properties: {
          title: { type: 'string' as const, description: 'Short reminder text, e.g. Renew car registration' },
          reminder_date: { type: 'string' as const, description: 'Date in YYYY-MM-DD format' },
          reminder_time: { type: 'string' as const, description: 'Optional time, e.g. 09:00' },
        },
        required: ['title', 'reminder_date'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'add_to_list',
      description: 'Add an item to the household shopping list.',
      parameters: {
        type: 'object' as const,
        properties: {
          item: { type: 'string' as const, description: 'The item to add, e.g. milk' },
        },
        required: ['item'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'mark_paid',
      description: 'Mark a bill as paid. Use when the user says they paid a bill.',
      parameters: {
        type: 'object' as const,
        properties: {
          bill_id: { type: 'string' as const, description: 'UUID of the bill if known' },
          bill_name: { type: 'string' as const, description: 'Name of the bill to mark paid, e.g. electric bill or TXU' },
        },
        required: [] as string[],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'schedule_appointment',
      description: 'Schedule an appointment or event (e.g. haircut, dentist, meeting).',
      parameters: {
        type: 'object' as const,
        properties: {
          title: { type: 'string' as const, description: 'Title of the appointment' },
          appointment_date: { type: 'string' as const, description: 'Date YYYY-MM-DD' },
          appointment_time: { type: 'string' as const, description: 'Optional time, e.g. 14:00' },
          location: { type: 'string' as const, description: 'Optional location' },
        },
        required: ['title', 'appointment_date'],
      },
    },
  },
];

type OpenAIMessage =
  | { role: 'system' | 'user' | 'assistant'; content: string }
  | {
      role: 'assistant';
      content: string | null;
      tool_calls?: Array<{ id: string; type: 'function'; function: { name: string; arguments: string } }>;
    }
  | { role: 'tool'; tool_call_id: string; content: string };

export type ChatWithToolsResult = { content: string; toolsUsed: Array<{ name: string; args: Record<string, unknown>; result: string }> };

export async function chatCompletionWithHouseholdTools(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  systemPrompt: string,
  executeTool: ExecuteToolFn
): Promise<ChatWithToolsResult> {
  const toolsUsed: ChatWithToolsResult['toolsUsed'] = [];
  const fullMessages: OpenAIMessage[] = [{ role: 'system', content: systemPrompt }, ...messages];

  let maxRounds = 5;
  while (maxRounds-- > 0) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: fullMessages,
        max_tokens: 600,
        tools: HOUSEHOLD_TOOLS,
        tool_choice: 'auto',
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(err || `OpenAI error: ${res.status}`);
    }

    const data = (await res.json()) as {
      choices?: Array<{
        message?: {
          content?: string | null;
          tool_calls?: Array<{ id: string; function: { name: string; arguments: string } }>;
        };
      }>;
    };

    const choice = data.choices?.[0]?.message;
    if (!choice) throw new Error('No response from assistant');

    const assistantContent = choice.content?.trim() ?? null;
    const toolCalls = choice.tool_calls;

    if (!toolCalls || toolCalls.length === 0) {
      return {
        content: assistantContent || 'Done.',
        toolsUsed,
      };
    }

    fullMessages.push({
      role: 'assistant',
      content: assistantContent,
      tool_calls: toolCalls.map((tc) => ({
        id: tc.id,
        type: 'function' as const,
        function: { name: tc.function.name, arguments: tc.function.arguments },
      })),
    });

    for (const tc of toolCalls) {
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(tc.function.arguments) as Record<string, unknown>;
      } catch {}
      const result = await executeTool(tc.function.name as HouseholdToolName, args);
      toolsUsed.push({ name: tc.function.name, args, result });
      fullMessages.push({
        role: 'tool',
        tool_call_id: tc.id,
        content: result,
      });
    }
  }

  return {
    content: 'I hit a limit on actions. Please try again with a shorter request.',
    toolsUsed,
  };
}
