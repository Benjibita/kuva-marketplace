'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

//Login
export async function login(formData: FormData) {
  const supabase = createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return redirect('/login?message=Incorrect email or password')
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

//Signup
export async function signup(formData: FormData) {
  const supabase = createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const role = formData.get('role') as string
  const name = formData.get('name') as string
  const businessName = formData.get('business_name') as string

  if (role === 'vendor' && businessName) {
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('business_name', businessName)
      .maybeSingle()

    if (existingProfile) {
      return redirect('/signup?message=Business name already exists. Please choose another.')
    }
  }

  const { data: signUpData, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role,
        name,
        business_name: businessName,
      },
    },
  })

  if (error) {
    return redirect('/signup?message=Could not create user. Please try again.')
  }

  // Insert the profile row so vendor_id FK on products is satisfied
  if (signUpData.user) {
    await supabase.from('profiles').upsert({
      id: signUpData.user.id,
      role: role as 'vendor' | 'buyer',
      business_name: businessName || null,
    })
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function deleteAccount() {
  const supabase = createClient()
  const { error } = await supabase.rpc('delete_user')

  if (error) {
    console.error('Error deleting user:', error)
    return redirect('/?message=Failed to delete account. Please ensure RPC is set up.')
  }

  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}

export async function logout() {
  const supabase = createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}
