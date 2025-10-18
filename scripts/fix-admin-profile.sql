-- Check if profile exists for the admin user
SELECT 
  p.id,
  p.email,
  p.auth_user_id,
  p.role,
  u.id as user_id,
  u.email as user_email
FROM auth.users u
LEFT JOIN public.profiles p ON p.email = u.email
WHERE u.email = 'gulnazpara1432@gmail.com';

-- If profile exists but auth_user_id is NULL, fix it:
UPDATE public.profiles
SET auth_user_id = (
  SELECT id 
  FROM auth.users 
  WHERE email = 'gulnazpara1432@gmail.com'
)
WHERE email = 'gulnazpara1432@gmail.com'
  AND auth_user_id IS NULL;

-- If no profile exists at all, create one:
INSERT INTO public.profiles (auth_user_id, email, role)
SELECT 
  u.id,
  u.email,
  'admin'::user_role
FROM auth.users u
WHERE u.email = 'gulnazpara1432@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.email = u.email
  );

-- Verify the fix:
SELECT 
  p.id,
  p.email,
  p.auth_user_id,
  p.role
FROM public.profiles p
WHERE p.email = 'gulnazpara1432@gmail.com';
