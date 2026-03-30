-- Add UPDATE policies for houses and users
-- Since this is an anon-based system, we allow updates if the client knows the ID.

CREATE POLICY "Allow house updates"
  ON houses FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow housemate updates"
  ON users FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);
