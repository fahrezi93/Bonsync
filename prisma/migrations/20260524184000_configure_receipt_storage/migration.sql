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
      'receipts',
      'receipts',
      false,
      10485760,
      ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
    )
    ON CONFLICT (id) DO UPDATE
    SET
      public = false,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

    EXECUTE 'DROP POLICY IF EXISTS "BonSync receipt images insert own folder" ON storage.objects';
    EXECUTE 'DROP POLICY IF EXISTS "BonSync receipt images read own folder" ON storage.objects';
    EXECUTE 'DROP POLICY IF EXISTS "BonSync receipt images update own folder" ON storage.objects';
    EXECUTE 'DROP POLICY IF EXISTS "BonSync receipt images delete own folder" ON storage.objects';

    EXECUTE '
      CREATE POLICY "BonSync receipt images insert own folder"
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = ''receipts''
        AND (storage.foldername(name))[1] = auth.uid()::text
      )
    ';

    EXECUTE '
      CREATE POLICY "BonSync receipt images read own folder"
      ON storage.objects
      FOR SELECT
      TO authenticated
      USING (
        bucket_id = ''receipts''
        AND (storage.foldername(name))[1] = auth.uid()::text
      )
    ';

    EXECUTE '
      CREATE POLICY "BonSync receipt images update own folder"
      ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (
        bucket_id = ''receipts''
        AND (storage.foldername(name))[1] = auth.uid()::text
      )
      WITH CHECK (
        bucket_id = ''receipts''
        AND (storage.foldername(name))[1] = auth.uid()::text
      )
    ';

    EXECUTE '
      CREATE POLICY "BonSync receipt images delete own folder"
      ON storage.objects
      FOR DELETE
      TO authenticated
      USING (
        bucket_id = ''receipts''
        AND (storage.foldername(name))[1] = auth.uid()::text
      )
    ';
  END IF;
END $$;
