DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.schemata
    WHERE schema_name = 'storage'
  ) THEN
    INSERT INTO storage.buckets (
      id,
      name,
      public,
      file_size_limit,
      allowed_mime_types
    )
    VALUES (
      'avatars',
      'avatars',
      false,
      2097152,
      ARRAY['image/jpeg', 'image/png', 'image/webp']
    )
    ON CONFLICT (id) DO UPDATE
    SET
      public = false,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

    EXECUTE 'DROP POLICY IF EXISTS "BonSync avatars insert own folder" ON storage.objects';
    EXECUTE 'DROP POLICY IF EXISTS "BonSync avatars read own folder" ON storage.objects';
    EXECUTE 'DROP POLICY IF EXISTS "BonSync avatars update own folder" ON storage.objects';
    EXECUTE 'DROP POLICY IF EXISTS "BonSync avatars delete own folder" ON storage.objects';

    EXECUTE '
      CREATE POLICY "BonSync avatars insert own folder"
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = ''avatars''
        AND (storage.foldername(name))[1] = auth.uid()::text
      )
    ';

    EXECUTE '
      CREATE POLICY "BonSync avatars read own folder"
      ON storage.objects
      FOR SELECT
      TO authenticated
      USING (
        bucket_id = ''avatars''
        AND (storage.foldername(name))[1] = auth.uid()::text
      )
    ';

    EXECUTE '
      CREATE POLICY "BonSync avatars update own folder"
      ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (
        bucket_id = ''avatars''
        AND (storage.foldername(name))[1] = auth.uid()::text
      )
      WITH CHECK (
        bucket_id = ''avatars''
        AND (storage.foldername(name))[1] = auth.uid()::text
      )
    ';

    EXECUTE '
      CREATE POLICY "BonSync avatars delete own folder"
      ON storage.objects
      FOR DELETE
      TO authenticated
      USING (
        bucket_id = ''avatars''
        AND (storage.foldername(name))[1] = auth.uid()::text
      )
    ';
  END IF;
END $$;
