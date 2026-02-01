-- Fix RLS DELETE Policy for Appointments Table
-- Run this in your Supabase SQL Editor to allow DELETE operations

-- First, check if RLS is enabled (should return rowsecurity = true)
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'appointments';

-- Check existing policies on appointments table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'appointments';

-- Option 1: Allow DELETE for all authenticated users (if using auth)
-- Uncomment and modify if you're using Supabase Auth
/*
CREATE POLICY "Allow delete appointments for authenticated users" 
ON appointments 
FOR DELETE 
TO authenticated
USING (true);
*/

-- Option 2: Allow DELETE for anon/public access (for development/testing)
-- Use this if you're using the anon key and want to allow all deletes
CREATE POLICY "Allow delete appointments" 
ON appointments 
FOR DELETE 
USING (true);

-- Option 3: More restrictive - only allow delete if appointment exists and matches client_id
-- Uncomment and modify if you want more control
/*
CREATE POLICY "Allow delete own appointments" 
ON appointments 
FOR DELETE 
USING (
  -- Add your conditions here, for example:
  -- auth.uid() = client_id  -- if you have user_id in clients table
  true  -- For now, allow all (modify as needed)
);
*/

-- Verify the policy was created
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'appointments' AND cmd = 'DELETE';

