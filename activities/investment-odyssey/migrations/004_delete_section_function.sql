-- Create a function to delete a section and update related profiles
CREATE OR REPLACE FUNCTION delete_section(section_id UUID)
RETURNS VOID AS $$
BEGIN
  -- First, update all profiles that reference this section
  UPDATE profiles
  SET section_id = NULL
  WHERE section_id = section_id;
  
  -- Then delete the section
  DELETE FROM sections
  WHERE id = section_id;
END;
$$ LANGUAGE plpgsql;
