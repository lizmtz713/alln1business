import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../providers/AuthProvider';
import { supabase } from '../services/supabase';
import { hasSupabaseConfig } from '../services/supabase';
import { hasOpenAIKey } from '../services/openai';
import { buildHouseholdContext, makeHouseholdSystemPrompt } from '../services/householdContext';
import {
  chatCompletionWithHouseholdTools,
  type HouseholdToolName,
  type ChatWithToolsResult,
} from '../services/householdChat';
import { format } from 'date-fns';

const QUERY_KEY = 'chat';

export type ChatMessage = {
  id: string;
  user_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokens_used: number | null;
  created_at: string;
};

export type SendMessageResult = { content: string; toolsUsed: ChatWithToolsResult['toolsUsed'] };

export function useChatHistory() {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: [QUERY_KEY, userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(50);
      if (error) throw new Error(error.message ?? 'Failed to load chat');
      return (data ?? []) as ChatMessage[];
    },
    enabled: Boolean(userId) && hasSupabaseConfig,
  });
}

async function executeHouseholdTool(
  userId: string,
  name: HouseholdToolName,
  args: Record<string, unknown>
): Promise<string> {
  try {
    if (name === 'add_reminder') {
      const title = String(args.title ?? '');
      const reminder_date = String(args.reminder_date ?? '');
      const reminder_time = args.reminder_time != null ? String(args.reminder_time) : null;
      if (!title || !reminder_date) return 'Missing title or reminder_date.';
      const { error } = await supabase.from('appointments').insert({
        user_id: userId,
        title: `Reminder: ${title}`,
        appointment_date: reminder_date.slice(0, 10),
        appointment_time: reminder_time?.slice(0, 5) ?? null,
        location: null,
        notes: null,
      });
      if (error) return `Failed: ${error.message}`;
      return `Reminder "${title}" set for ${reminder_date}.`;
    }

    if (name === 'add_to_list') {
      const item = String(args.item ?? '').trim();
      if (!item) return 'Missing item.';
      const { error } = await supabase.from('shopping_list').insert({
        user_id: userId,
        item,
      });
      if (error) return `Failed: ${error.message}`;
      return `Added "${item}" to your shopping list.`;
    }

    if (name === 'mark_paid') {
      const bill_id = args.bill_id != null ? String(args.bill_id) : null;
      const bill_name = args.bill_name != null ? String(args.bill_name).trim() : null;
      let id = bill_id;
      if (!id && bill_name) {
        const term = bill_name.replace(/%/g, '');
        const { data: byName } = await supabase
          .from('bills')
          .select('id')
          .eq('user_id', userId)
          .neq('status', 'cancelled')
          .ilike('bill_name', `%${term}%`)
          .limit(1);
        const first = (byName ?? []) as Array<{ id: string }>;
        if (first[0]) id = first[0].id;
        else {
          const { data: byProvider } = await supabase
            .from('bills')
            .select('id')
            .eq('user_id', userId)
            .neq('status', 'cancelled')
            .ilike('provider_name', `%${term}%`)
            .limit(1);
          const p = (byProvider ?? []) as Array<{ id: string }>;
          if (p[0]) id = p[0].id;
        }
      }
      if (!id) return `Could not find a bill matching "${bill_name ?? 'that'}".`;
      const { data: bill } = await supabase.from('bills').select('amount').eq('id', id).eq('user_id', userId).single();
      if (!bill) return 'Bill not found.';
      const { error } = await supabase
        .from('bills')
        .update({
          status: 'paid',
          paid_date: format(new Date(), 'yyyy-MM-dd'),
          paid_amount: Number(bill.amount),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', userId);
      if (error) return `Failed: ${error.message}`;
      return 'Marked that bill as paid.';
    }

    if (name === 'schedule_appointment') {
      const title = String(args.title ?? '');
      const appointment_date = String(args.appointment_date ?? '').slice(0, 10);
      const appointment_time = args.appointment_time != null ? String(args.appointment_time).slice(0, 5) : null;
      const location = args.location != null ? String(args.location) : null;
      if (!title || !appointment_date) return 'Missing title or appointment_date.';
      const { error } = await supabase.from('appointments').insert({
        user_id: userId,
        title,
        appointment_date,
        appointment_time,
        location,
        notes: null,
      });
      if (error) return `Failed: ${error.message}`;
      return `Scheduled "${title}" for ${appointment_date}${appointment_time ? ' at ' + appointment_time : ''}.`;
    }

    return `Unknown action: ${name}`;
  } catch (e) {
    return (e instanceof Error ? e.message : 'Action failed.');
  }
}

export function useSendChatMessage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (content: string): Promise<SendMessageResult> => {
      if (!user?.id) throw new Error('You must be signed in');

      const trimmed = content.trim();
      if (!trimmed) throw new Error('Message cannot be empty');

      if (hasSupabaseConfig) {
        await supabase.from('chat_messages').insert({
          user_id: user.id,
          role: 'user',
          content: trimmed,
        });
      }

      const context = hasSupabaseConfig ? await buildHouseholdContext(user.id) : null;
      const systemPrompt = context
        ? makeHouseholdSystemPrompt(context)
        : 'You are a helpful household assistant. The user has not connected their data yet—suggest they add bills, pets, vehicles, and appointments so you can help answer questions and take actions.';

      const history = hasSupabaseConfig
        ? (
            await supabase
              .from('chat_messages')
              .select('role, content')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false })
              .limit(14)
          ).data ?? []
        : [];

      const reversed = [...(history as Array<{ role: string; content: string }>)].reverse();
      const recent = reversed.slice(-12).map((m) => ({ role: m.role as 'user' | 'assistant' | 'system', content: m.content }));
      const messages = recent.filter((m) => m.role !== 'system') as Array<{ role: 'user' | 'assistant'; content: string }>;
      if (messages.length === 0 || messages[messages.length - 1]?.content !== trimmed) {
        messages.push({ role: 'user', content: trimmed });
      }

      const executeTool = (name: HouseholdToolName, args: Record<string, unknown>) =>
        executeHouseholdTool(user.id, name, args);

      const { content: assistantText, toolsUsed } = await chatCompletionWithHouseholdTools(
        messages,
        systemPrompt,
        executeTool
      );

      if (hasSupabaseConfig) {
        await supabase.from('chat_messages').insert({
          user_id: user.id,
          role: 'assistant',
          content: assistantText,
        });
      }

      return { content: assistantText, toolsUsed };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      if (data.toolsUsed?.length) {
        queryClient.invalidateQueries({ queryKey: ['bills'] });
        queryClient.invalidateQueries({ queryKey: ['appointments'] });
        queryClient.invalidateQueries({ queryKey: ['shoppingList'] });
      }
    },
  });
}

export function useClearChat() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('You must be signed in');
      if (!hasSupabaseConfig) throw new Error('Connect Supabase to use chat');
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('user_id', user.id);
      if (error) throw new Error(error.message ?? 'Failed to clear chat');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export { hasOpenAIKey };
