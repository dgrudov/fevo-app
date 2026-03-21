import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dcxxzfhmgfwqehirougx.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjeHh6ZmhtZ2Z3cWVoaXJvdWd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MDU0OTMsImV4cCI6MjA4ODM4MTQ5M30.sYc2KN5rB_OsMaAgS0HWAW0cpgIyFVN2NumXgzBB430'

// Capture BEFORE createClient() processes and removes the hash from the URL
export const hadAccessToken = typeof window !== 'undefined' && window.location.hash.includes('access_token')

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { flowType: 'implicit' },
})