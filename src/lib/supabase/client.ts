function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return !!(
    url &&
    key &&
    url !== "https://your-project.supabase.co" &&
    key !== "your-anon-key"
  )
}

function buildMockChain(result: any) {
  const chain: any = () => chain
  chain.select = () => chain
  chain.insert = () => chain
  chain.update = () => chain
  chain.delete = () => chain
  chain.eq = () => chain
  chain.neq = () => chain
  chain.gt = () => chain
  chain.gte = () => chain
  chain.lt = () => chain
  chain.lte = () => chain
  chain.like = () => chain
  chain.ilike = () => chain
  chain.or = () => chain
  chain.in = () => chain
  chain.order = () => chain
  chain.range = () => chain
  chain.limit = () => chain
  chain.textSearch = () => chain
  chain.single = () => Promise.resolve({ data: null, error: null })
  chain.maybeSingle = () => Promise.resolve({ data: null, error: null })
  chain.then = (resolve: any) => Promise.resolve(result).then(resolve)
  chain.throwOnError = () => chain
  return chain
}

function createMockClient() {
  const emptyResult = { data: [], error: null, count: 0 }

  return {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signInWithPassword: () =>
        Promise.resolve({ data: { session: null }, error: { message: "Supabase sozlanmagan" } }),
      signUp: () =>
        Promise.resolve({ data: { user: null }, error: { message: "Supabase sozlanmagan" } }),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
    },
    from: () => buildMockChain(emptyResult),
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: null, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: "" } }),
      }),
    },
  }
}

export function createClient() {
  if (!isSupabaseConfigured()) {
    return createMockClient() as any
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { createBrowserClient } = require("@supabase/ssr")
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
