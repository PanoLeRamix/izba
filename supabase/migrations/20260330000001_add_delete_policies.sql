-- Add DELETE policies for users
-- Since this is an anon-based system, we allow deletion if the client knows the ID.

CREATE POLICY "Allow housemate deletion"
  ON users FOR DELETE
  TO anon
  USING (true);
