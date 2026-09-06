import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey)

const missingConfig = [
  !supabaseUrl ? '在线数据库地址' : null,
  !supabaseKey ? '可公开使用的访问密钥' : null,
].filter((item): item is string => Boolean(item))

export const supabaseConfigIssue = missingConfig.length
  ? `当前无法登录：系统尚未配置${missingConfig.join('和')}。请联系系统管理员完成配置。`
  : null

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null
