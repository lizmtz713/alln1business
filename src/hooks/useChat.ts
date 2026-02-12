import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../providers/AuthProvider';
import { supabase } from '../services/supabase';
import { hasSupabaseConfig } from '../services/supabase';
import { chatCompletion, hasOpenAIKey } from '../services/openai';
import { buildBusinessContext, makeSystemPrompt } from '../services/aiContext';

const QUERY_KEY = 'chat';

export type ChatMessage = {
  id: string;
  user_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokens_used: number | null;
  created_at: string;
};

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

export function useSendChatMessage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (content: string) => {
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

      const context = hasSupabaseConfig ? await buildBusinessContext(user.id) : null;
      const systemPrompt = context ? makeSystemPrompt(context) : 'You are a helpful business assistant. Be concise. If asked about business data, explain that the user needs to connect their account.';

      const history = hasSupabaseConfig
        ? (
            await supabase
              .from('chat_messages')
              .select('role, content')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false })
              .limit(12)
          ).data ?? []
        : [];

      const reversed = [...(history as Array<{ role: string; content: string }>)].reverse();
      const recent = reversed.slice(-10).map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));
      const messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [
        { role: 'system', content: systemPrompt },
        ...recent,
      ];
      if (recent.length === 0 || recent[recent.length - 1]?.content !== trimmed) {
        messages.push({ role: 'user', content: trimmed });
      }

      const assistantText = await chatCompletion(messages);

      if (hasSupabaseConfig) {
        await supabase.from('chat_messages').insert({
          user_id: user.id,
          role: 'assistant',
          content: assistantText,
        });
      }

      return assistantText;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
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
