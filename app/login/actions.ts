'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { ensureProfileRowExists } from '@/lib/ensureProfile'

const UGANDA_PHONE_HELPER_TEXT = 'Use a valid Uganda number: 07XXXXXXXX, 2567XXXXXXXX, or +2567XXXXXXXX.'

function normalizeErrorMessage(message: string | undefined): string {
  return (message || '').toLowerCase()
}

function getLoginErrorMessage(errorMessage: string | undefined, status?: number): string {
  const normalizedMessage = normalizeErrorMessage(errorMessage)

  if (
    normalizedMessage.includes('invalid login credentials') ||
    normalizedMessage.includes('invalid credentials') ||
    normalizedMessage.includes('email not confirmed')
  ) {
    return 'Incorrect email or password.'
  }

  if (status === 429 || normalizedMessage.includes('rate limit') || normalizedMessage.includes('too many requests')) {
    return 'Too many attempts. Please wait a moment and try again.'
  }

  return 'Could not sign in right now. Please try again.'
}

function getSignupErrorMessage(errorMessage: string | undefined, status?: number): string {
  const normalizedMessage = normalizeErrorMessage(errorMessage)

  if (normalizedMessage.includes('already registered') || normalizedMessage.includes('user already registered')) {
    return 'An account with this email already exists. Please log in instead.'
  }

  if (normalizedMessage.includes('invalid email')) {
    return 'Please enter a valid email address.'
  }

  if (status === 429 || normalizedMessage.includes('rate limit') || normalizedMessage.includes('too many requests')) {
    return 'Too many sign-up attempts. Please wait a moment and try again.'
  }

  return 'Could not create your account right now. Please try again.'
}

function redirectWithMessage(path: string, message: string) {
  return redirect(`${path}?message=${encodeURIComponent(message)}`)
}

function normalizeUgandaPhoneNumber(rawPhone: string): string | null {
  const trimmed = rawPhone.trim()
  if (!trimmed) return null

  const normalized = trimmed.replace(/[\s()-]/g, '')
  if (!/^\+?\d+$/.test(normalized)) return null

  if (/^07\d{8}$/.test(normalized)) {
    return `+256${normalized.slice(1)}`
  }

  if (/^2567\d{8}$/.test(normalized)) {
    return `+${normalized}`
  }

  if (/^\+2567\d{8}$/.test(normalized)) {
    return normalized
  }

  if (/^7\d{8}$/.test(normalized)) {
    return `+256${normalized}`
  }

  return null
}

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
    return redirectWithMessage('/login', getLoginErrorMessage(error.message, error.status))
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) {
    const { error: profileEnsureError } = await ensureProfileRowExists(supabase, user)
    if (profileEnsureError) {
      console.error('[login] ensureProfileRowExists:', profileEnsureError)
    }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

//Signup
export async function signup(formData: FormData) {
  const supabase = createClient()

  const nextPath = formData.get('next') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const role = formData.get('role') as string
  const name = formData.get('name') as string
  const businessName = formData.get('business_name') as string
  const phoneNumber = formData.get('phone_number') as string
  const normalizedPhoneNumber = normalizeUgandaPhoneNumber(phoneNumber)

  if (!normalizedPhoneNumber) {
    return redirectWithMessage('/signup', UGANDA_PHONE_HELPER_TEXT)
  }

  if (role === 'vendor' && businessName) {
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('business_name', businessName)
      .maybeSingle()

    if (existingProfile) {
      return redirectWithMessage('/signup', 'Business name already exists. Please choose another.')
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
        phone_number: normalizedPhoneNumber,
      },
    },
  })

  if (error) {
    return redirectWithMessage('/signup', getSignupErrorMessage(error.message, error.status))
  }

  // Insert the profile row so vendor_id FK on products is satisfied (requires profiles INSERT RLS policy).
  if (signUpData.user) {
    const { error: profileError } = await supabase.from('profiles').upsert(
      {
        id: signUpData.user.id,
        role: role as 'vendor' | 'buyer',
        business_name: businessName || null,
        phone_number: normalizedPhoneNumber,
      },
      { onConflict: 'id' }
    )
    if (profileError) {
      console.error('[signup] profile upsert:', profileError)
      return redirectWithMessage(
        '/signup',
        'Account was created but your profile could not be saved. Please log in — we will retry automatically — or contact support.'
      )
    }
  }

  revalidatePath('/', 'layout')
  if (nextPath && nextPath.startsWith('/')) {
    redirect(nextPath)
  }
  redirect('/')
}

export async function updateProfile(formData: FormData) {
  const supabase = createClient()
  const fullName = (formData.get('name') as string)?.trim()
  const businessNameInput = (formData.get('business_name') as string)?.trim()
  const phoneNumber = formData.get('phone_number') as string
  const normalizedPhoneNumber = normalizeUgandaPhoneNumber(phoneNumber)

  if (!normalizedPhoneNumber) {
    return redirect(`/settings/edit?message=${encodeURIComponent(UGANDA_PHONE_HELPER_TEXT)}`)
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return redirect('/login')
  }

  if (!fullName) {
    return redirect('/settings/edit?message=Full name is required.')
  }

  const role = user.user_metadata?.role as 'vendor' | 'buyer' | undefined
  const businessName = role === 'vendor' ? businessNameInput : null

  if (role === 'vendor' && !businessName) {
    return redirect('/settings/edit?message=Business name is required for vendor accounts.')
  }

  if (role === 'vendor' && businessName) {
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('business_name', businessName)
      .neq('id', user.id)
      .maybeSingle()

    if (existingProfile) {
      return redirect('/settings/edit?message=Business name already exists. Please choose another.')
    }
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      phone_number: normalizedPhoneNumber,
      business_name: businessName,
    })
    .eq('id', user.id)

  if (profileError) {
    return redirect('/settings/edit?message=Could not save profile details.')
  }

  const { error: authError } = await supabase.auth.updateUser({
    data: {
      ...user.user_metadata,
      name: fullName,
      business_name: businessName,
      phone_number: normalizedPhoneNumber,
    },
  })

  if (authError) {
    return redirect('/settings/edit?message=Profile saved, but metadata sync failed.')
  }

  revalidatePath('/settings')
  revalidatePath('/settings/edit')
  revalidatePath('/', 'layout')
  revalidatePath('/vendor/dashboard')
  redirect('/settings/edit?message=Profile updated successfully.')
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
