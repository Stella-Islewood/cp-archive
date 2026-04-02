-- ========================================
-- 安全修复 profiles 表（确保 user_id 是主键）
-- ========================================

-- 1. 查看当前表结构
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns 
-- WHERE table_name = 'profiles' 
-- ORDER BY ordinal_position;

-- 2. 如果需要重建 profiles 表（当 id 列存在但 user_id 不是主键时）

-- 首先备份现有数据（如果有的话）
-- CREATE TABLE IF NOT EXISTS profiles_backup AS SELECT * FROM profiles;

-- 3. 删除错误的约束和列
-- ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_pkey;
-- ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
-- ALTER TABLE profiles DROP COLUMN IF EXISTS id;

-- 4. 确保 user_id 是主键
-- ALTER TABLE profiles ADD PRIMARY KEY (user_id);

-- 5. 恢复 RLS 策略
DROP POLICY IF EXISTS "profiles_select" ON profiles;
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "profiles_insert" ON profiles;
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "profiles_update" ON profiles;
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = user_id);

-- 6. 添加 username 列（如果不存在）
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT;

-- 7. 确保 username 是唯一的
-- ALTER TABLE profiles ALTER COLUMN username SET NOT NULL;
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- ========================================
-- 修复完成
-- ========================================
