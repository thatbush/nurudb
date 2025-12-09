/**
 * Supabase Proxy Client
 * Use this instead of direct Supabase client in your Next.js app
 */

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL || 'https://api.stridecampus.com';

interface QueryOptions {
  select?: string;
  filter?: Record<string, any>;
  order?: string;
  limit?: number;
  offset?: number;
  single?: boolean;
  range?: { from: number; to: number };
}

interface SupabaseResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

class SupabaseProxyClient {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor(baseUrl: string = WORKER_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Set authentication token
   */
  setAuth(token: string) {
    this.authToken = token;
  }

  /**
   * Clear authentication token
   */
  clearAuth() {
    this.authToken = null;
  }

  /**
   * Get headers for requests
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      // 'Content-Type': 'application/json',
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  /**
   * Build query string from options
   */
  private buildQueryString(options: QueryOptions): string {
    const params = new URLSearchParams();

    if (options.select) params.append('select', options.select);
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.offset) params.append('offset', options.offset.toString());
    if (options.order) params.append('order', options.order);
    if (options.range) params.append('range', `${options.range.from}-${options.range.to}`);
    if (options.single) params.append('single', 'true');

    // Add filters in the format your worker expects
    if (options.filter) {
      for (const [key, value] of Object.entries(options.filter)) {
        if (typeof value === 'object' && value !== null) {
          const { op, value: filterValue } = value;
          params.append(key, `${op}.${filterValue}`);
        } else {
          params.append(key, `eq.${value}`);
        }
      }
    }

    const queryString = params.toString();
    return queryString ? `?${queryString}` : '';
  }

  /**
   * SELECT - Get records from a table
   */
  async select<T = any>(
    table: string,
    options: QueryOptions = {}
  ): Promise<T | T[] | null> {
    const queryString = this.buildQueryString(options);
    const url = `${this.baseUrl}/db/${table}${queryString}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    const result: SupabaseResponse<T> = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch data');
    }

    return result.data || null;
  }

  /**
   * SELECT with ID - Get a single record by ID
   */
  async selectById<T = any>(
    table: string,
    id: string,
    select?: string
  ): Promise<T | null> {
    const queryString = select ? `?select=${select}` : '';
    const url = `${this.baseUrl}/db/${table}/${id}${queryString}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    const result: SupabaseResponse<T> = await response.json();

    if (!result.success) {
      if (response.status === 404) return null;
      throw new Error(result.error || 'Failed to fetch data');
    }

    return result.data || null;
  }

  /**
   * INSERT - Create new record(s)
   */
  async insert<T = any>(
    table: string,
    data: T | T[]
  ): Promise<T | T[]> {
    const url = `${this.baseUrl}/db/${table}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    const result: SupabaseResponse = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to insert data');
    }

    return result.data?.data || result.data;
  }

  /**
   * UPDATE - Update a record by ID
   */
  async update<T = any>(
    table: string,
    id: string,
    data: Partial<T>
  ): Promise<T> {
    const url = `${this.baseUrl}/db/${table}/${id}`;

    const response = await fetch(url, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    const result: any = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to update data');
    }

    return result.data?.data || result.data;
  }

  /**
   * DELETE - Delete a record by ID
   */
  async delete(table: string, id: string): Promise<boolean> {
    const url = `${this.baseUrl}/db/${table}/${id}`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    const result: SupabaseResponse = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to delete data');
    }

    return true;
  }

  /**
   * Helper: Get user by email
   */
  async getUserByEmail(email: string) {
    return this.select('users', {
      filter: { email: { op: 'eq', value: email } },
      single: true,
    });
  }

  /**
   * Helper: Update user credits
   */
  async updateUserCredits(userId: string, credits: number) {
    return this.update('users', userId, { credits });
  }

  /**
   * Helper: Increment login streak
   */
  async incrementLoginStreak(userId: string) {
    const user = await this.selectById('users', userId, 'login_streak');
    if (!user) throw new Error('User not found');

    return this.update('users', userId, {
      login_streak: (user.login_streak || 0) + 1,
      last_login_date: new Date().toISOString(),
    });
  }
}

// Create and export a singleton instance
export const supabaseProxy = new SupabaseProxyClient();

// Export the class for custom instances
export { SupabaseProxyClient };

// Type-safe table helpers
export const db = {
  users: {
    select: (options?: QueryOptions) => supabaseProxy.select('users', options),
    selectById: (id: string) => supabaseProxy.selectById('users', id),
    selectByEmail: (email: string) => supabaseProxy.getUserByEmail(email),
    insert: (data: any) => supabaseProxy.insert('users', data),
    update: (id: string, data: any) => supabaseProxy.update('users', id, data),
    delete: (id: string) => supabaseProxy.delete('users', id),
  },
  spaces: {
    select: (options?: QueryOptions) => supabaseProxy.select('spaces', options),
    selectById: (id: string) => supabaseProxy.selectById('spaces', id),
    insert: (data: any) => supabaseProxy.insert('spaces', data),
    update: (id: string, data: any) => supabaseProxy.update('spaces', id, data),
    delete: (id: string) => supabaseProxy.delete('spaces', id),
  },
  events: {
    select: (options?: QueryOptions) => supabaseProxy.select('events', options),
    selectById: (id: string) => supabaseProxy.selectById('events', id),
    insert: (data: any) => supabaseProxy.insert('events', data),
    update: (id: string, data: any) => supabaseProxy.update('events', id, data),
    delete: (id: string) => supabaseProxy.delete('events', id),
  },
  posts: {
    select: (options?: QueryOptions) => supabaseProxy.select('posts', options),
    selectById: (id: string) => supabaseProxy.selectById('posts', id),
    insert: (data: any) => supabaseProxy.insert('posts', data),
    update: (id: string, data: any) => supabaseProxy.update('posts', id, data),
    delete: (id: string) => supabaseProxy.delete('posts', id),
  },
  comments: {
    select: (options?: QueryOptions) => supabaseProxy.select('comments', options),
    selectById: (id: string) => supabaseProxy.selectById('comments', id),
    insert: (data: any) => supabaseProxy.insert('comments', data),
    update: (id: string, data: any) => supabaseProxy.update('comments', id, data),
    delete: (id: string) => supabaseProxy.delete('comments', id),
  },
  post_votes: {
    select: (options?: QueryOptions) => supabaseProxy.select('post_votes', options),
    selectById: (id: string) => supabaseProxy.selectById('post_votes', id),
    insert: (data: any) => supabaseProxy.insert('post_votes', data),
    update: (id: string, data: any) => supabaseProxy.update('post_votes', id, data),
    delete: (id: string) => supabaseProxy.delete('post_votes', id),
  },
  comment_votes: {
    select: (options?: QueryOptions) => supabaseProxy.select('comment_votes', options),
    selectById: (id: string) => supabaseProxy.selectById('comment_votes', id),
    insert: (data: any) => supabaseProxy.insert('comment_votes', data),
    update: (id: string, data: any) => supabaseProxy.update('comment_votes', id, data),
    delete: (id: string) => supabaseProxy.delete('comment_votes', id),
  },
  post_shares: {
    select: (options?: QueryOptions) => supabaseProxy.select('post_shares', options),
    selectById: (id: string) => supabaseProxy.selectById('post_shares', id),
    insert: (data: any) => supabaseProxy.insert('post_shares', data),
    update: (id: string, data: any) => supabaseProxy.update('post_shares', id, data),
    delete: (id: string) => supabaseProxy.delete('post_shares', id),
  },
  space_memberships: {
    select: (options?: QueryOptions) => supabaseProxy.select('space_memberships', options),
    selectById: (id: string) => supabaseProxy.selectById('space_memberships', id),
    insert: (data: any) => supabaseProxy.insert('space_memberships', data),
    update: (id: string, data: any) => supabaseProxy.update('space_memberships', id, data),
    delete: (id: string) => supabaseProxy.delete('space_memberships', id),
  },
  schools: {
    select: (options?: QueryOptions) => supabaseProxy.select('schools', options),
    selectById: (id: string) => supabaseProxy.selectById('schools', id),
    insert: (data: any) => supabaseProxy.insert('schools', data),
    update: (id: string, data: any) => supabaseProxy.update('schools', id, data),
    delete: (id: string) => supabaseProxy.delete('schools', id),
  },
  school_status: {
    select: (options?: QueryOptions) => supabaseProxy.select('school_status', options),
    selectById: (id: string) => supabaseProxy.selectById('school_status', id),
    insert: (data: any) => supabaseProxy.insert('school_status', data),
    update: (id: string, data: any) => supabaseProxy.update('school_status', id, data),
    delete: (id: string) => supabaseProxy.delete('school_status', id),
  },
  notifications: {
    select: (options?: QueryOptions) => supabaseProxy.select('notifications', options),
    selectById: (id: string) => supabaseProxy.selectById('notifications', id),
    insert: (data: any) => supabaseProxy.insert('notifications', data),
    update: (id: string, data: any) => supabaseProxy.update('notifications', id, data),
    delete: (id: string) => supabaseProxy.delete('notifications', id),
  },
  notification_queue: {
    select: (options?: QueryOptions) => supabaseProxy.select('notification_queue', options),
    selectById: (id: string) => supabaseProxy.selectById('notification_queue', id),
    insert: (data: any) => supabaseProxy.insert('notification_queue', data),
    update: (id: string, data: any) => supabaseProxy.update('notification_queue', id, data),
    delete: (id: string) => supabaseProxy.delete('notification_queue', id),
  },
  notification_history: {
    select: (options?: QueryOptions) => supabaseProxy.select('notification_history', options),
    selectById: (id: string) => supabaseProxy.selectById('notification_history', id),
    insert: (data: any) => supabaseProxy.insert('notification_history', data),
    update: (id: string, data: any) => supabaseProxy.update('notification_history', id, data),
    delete: (id: string) => supabaseProxy.delete('notification_history', id),
  },
  user_push_tokens: {
    select: (options?: QueryOptions) => supabaseProxy.select('user_push_tokens', options),
    selectById: (id: string) => supabaseProxy.selectById('user_push_tokens', id),
    insert: (data: any) => supabaseProxy.insert('user_push_tokens', data),
    update: (id: string, data: any) => supabaseProxy.update('user_push_tokens', id, data),
    delete: (id: string) => supabaseProxy.delete('user_push_tokens', id),
  },
  credit_transactions: {
    select: (options?: QueryOptions) => supabaseProxy.select('credit_transactions', options),
    selectById: (id: string) => supabaseProxy.selectById('credit_transactions', id),
    insert: (data: any) => supabaseProxy.insert('credit_transactions', data),
    update: (id: string, data: any) => supabaseProxy.update('credit_transactions', id, data),
    delete: (id: string) => supabaseProxy.delete('credit_transactions', id),
  },
  referrals: {
    select: (options?: QueryOptions) => supabaseProxy.select('referrals', options),
    selectById: (id: string) => supabaseProxy.selectById('referrals', id),
    insert: (data: any) => supabaseProxy.insert('referrals', data),
    update: (id: string, data: any) => supabaseProxy.update('referrals', id, data),
    delete: (id: string) => supabaseProxy.delete('referrals', id),
  },
  leaderboards: {
    select: (options?: QueryOptions) => supabaseProxy.select('leaderboards', options),
    selectById: (id: string) => supabaseProxy.selectById('leaderboards', id),
    insert: (data: any) => supabaseProxy.insert('leaderboards', data),
    update: (id: string, data: any) => supabaseProxy.update('leaderboards', id, data),
    delete: (id: string) => supabaseProxy.delete('leaderboards', id),
  },
  library: {
    select: (options?: QueryOptions) => supabaseProxy.select('library', options),
    selectById: (id: string) => supabaseProxy.selectById('library', id),
    insert: (data: any) => supabaseProxy.insert('library', data),
    update: (id: string, data: any) => supabaseProxy.update('library', id, data),
    delete: (id: string) => supabaseProxy.delete('library', id),
  },
  user_archive: {
    select: (options?: QueryOptions) => supabaseProxy.select('user_archive', options),
    selectById: (id: string) => supabaseProxy.selectById('user_archive', id),
    insert: (data: any) => supabaseProxy.insert('user_archive', data),
    update: (id: string, data: any) => supabaseProxy.update('user_archive', id, data),
    delete: (id: string) => supabaseProxy.delete('user_archive', id),
  },
  marketplace: {
    select: (options?: QueryOptions) => supabaseProxy.select('marketplace', options),
    selectById: (id: string) => supabaseProxy.selectById('marketplace', id),
    insert: (data: any) => supabaseProxy.insert('marketplace', data),
    update: (id: string, data: any) => supabaseProxy.update('marketplace', id, data),
    delete: (id: string) => supabaseProxy.delete('marketplace', id),
  },
  chats: {
    select: (options?: QueryOptions) => supabaseProxy.select('chats', options),
    selectById: (id: string) => supabaseProxy.selectById('chats', id),
    insert: (data: any) => supabaseProxy.insert('chats', data),
    update: (id: string, data: any) => supabaseProxy.update('chats', id, data),
    delete: (id: string) => supabaseProxy.delete('chats', id),
  },
  messages: {
    select: (options?: QueryOptions) => supabaseProxy.select('messages', options),
    selectById: (id: string) => supabaseProxy.selectById('messages', id),
    insert: (data: any) => supabaseProxy.insert('messages', data),
    update: (id: string, data: any) => supabaseProxy.update('messages', id, data),
    delete: (id: string) => supabaseProxy.delete('messages', id),
  },
  chat_participants: {
    select: (options?: QueryOptions) => supabaseProxy.select('chat_participants', options),
    selectById: (id: string) => supabaseProxy.selectById('chat_participants', id),
    insert: (data: any) => supabaseProxy.insert('chat_participants', data),
    update: (id: string, data: any) => supabaseProxy.update('chat_participants', id, data),
    delete: (id: string) => supabaseProxy.delete('chat_participants', id),
  },
  followers: {
    select: (options?: QueryOptions) => supabaseProxy.select('followers', options),
    selectById: (id: string) => supabaseProxy.selectById('followers', id),
    insert: (data: any) => supabaseProxy.insert('followers', data),
    update: (id: string, data: any) => supabaseProxy.update('followers', id, data),
    delete: (id: string) => supabaseProxy.delete('followers', id),
  },
  hashtags: {
    select: (options?: QueryOptions) => supabaseProxy.select('hashtags', options),
    selectById: (id: string) => supabaseProxy.selectById('hashtags', id),
    insert: (data: any) => supabaseProxy.insert('hashtags', data),
    update: (id: string, data: any) => supabaseProxy.update('hashtags', id, data),
    delete: (id: string) => supabaseProxy.delete('hashtags', id),
  },
  post_hashtags: {
    select: (options?: QueryOptions) => supabaseProxy.select('post_hashtags', options),
    selectById: (id: string) => supabaseProxy.selectById('post_hashtags', id),
    insert: (data: any) => supabaseProxy.insert('post_hashtags', data),
    update: (id: string, data: any) => supabaseProxy.update('post_hashtags', id, data),
    delete: (id: string) => supabaseProxy.delete('post_hashtags', id),
  },
  post_mentions: {
    select: (options?: QueryOptions) => supabaseProxy.select('post_mentions', options),
    selectById: (id: string) => supabaseProxy.selectById('post_mentions', id),
    insert: (data: any) => supabaseProxy.insert('post_mentions', data),
    update: (id: string, data: any) => supabaseProxy.update('post_mentions', id, data),
    delete: (id: string) => supabaseProxy.delete('post_mentions', id),
  },
  resource_tags: {
    select: (options?: QueryOptions) => supabaseProxy.select('resource_tags', options),
    selectById: (id: string) => supabaseProxy.selectById('resource_tags', id),
    insert: (data: any) => supabaseProxy.insert('resource_tags', data),
    update: (id: string, data: any) => supabaseProxy.update('resource_tags', id, data),
    delete: (id: string) => supabaseProxy.delete('resource_tags', id),
  },
  editor_access: {
    select: (options?: QueryOptions) => supabaseProxy.select('editor_access', options),
    selectById: (id: string) => supabaseProxy.selectById('editor_access', id),
    insert: (data: any) => supabaseProxy.insert('editor_access', data),
    update: (id: string, data: any) => supabaseProxy.update('editor_access', id, data),
    delete: (id: string) => supabaseProxy.delete('editor_access', id),
  },
  waitlist: {
    select: (options?: QueryOptions) => supabaseProxy.select('waitlist', options),
    selectById: (id: string) => supabaseProxy.selectById('waitlist', id),
    insert: (data: any) => supabaseProxy.insert('waitlist', data),
    update: (id: string, data: any) => supabaseProxy.update('waitlist', id, data),
    delete: (id: string) => supabaseProxy.delete('waitlist', id),
  },
  user_subscriptions: {
    select: (options?: QueryOptions) => supabaseProxy.select('user_subscriptions', options),
    selectById: (id: string) => supabaseProxy.selectById('user_subscriptions', id),
    insert: (data: any) => supabaseProxy.insert('user_subscriptions', data),
    update: (id: string, data: any) => supabaseProxy.update('user_subscriptions', id, data),
    delete: (id: string) => supabaseProxy.delete('user_subscriptions', id),
  },
  ai_chat_sessions: {
    select: (options?: QueryOptions) => supabaseProxy.select('ai_chat_sessions', options),
    selectById: (id: string) => supabaseProxy.selectById('ai_chat_sessions', id),
    insert: (data: any) => supabaseProxy.insert('ai_chat_sessions', data),
    update: (id: string, data: any) => supabaseProxy.update('ai_chat_sessions', id, data),
    delete: (id: string) => supabaseProxy.delete('ai_chat_sessions', id),
  },
  ai_chat_messages: {
    select: (options?: QueryOptions) => supabaseProxy.select('ai_chat_messages', options),
    selectById: (id: string) => supabaseProxy.selectById('ai_chat_messages', id),
    insert: (data: any) => supabaseProxy.insert('ai_chat_messages', data),
    update: (id: string, data: any) => supabaseProxy.update('ai_chat_messages', id, data),
    delete: (id: string) => supabaseProxy.delete('ai_chat_messages', id),
  },
};