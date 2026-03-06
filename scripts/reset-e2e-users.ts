import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const users = [
  { id: 'ca57ec62-0bf0-41b0-8c3c-110625f992ca', email: 'e2e-admin@requitygroup.com' },
  { id: 'c0d72130-d970-4739-a742-79bf8c550887', email: 'e2e-borrower@requitygroup.com' },
  { id: '5eceb345-953b-4d11-8279-b5de542f14e1', email: 'e2e-investor@requitygroup.com' },
]

async function run() {
  for (const user of users) {
    const { error } = await supabase.auth.admin.updateUserById(user.id, {
      password: 'E2eTestPass123!',
      email_confirm: true,
    })
    console.log(user.email, error ? `ERROR: ${error.message}` : '✓ updated')
  }
}

run()
