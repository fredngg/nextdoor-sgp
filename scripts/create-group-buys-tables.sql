-- Create group_buys table
CREATE TABLE IF NOT EXISTS group_buys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  community_slug TEXT NOT NULL,
  organizer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_quantity INTEGER NOT NULL,
  current_quantity INTEGER DEFAULT 0,
  price_individual DECIMAL(10,2),
  price_group DECIMAL(10,2) NOT NULL,
  deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  pickup_location TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'successful', 'completed', 'expired')),
  category TEXT DEFAULT 'general' CHECK (category IN ('groceries', 'electronics', 'household', 'clothing', 'books', 'general')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create group_buy_participants table
CREATE TABLE IF NOT EXISTS group_buy_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_buy_id UUID NOT NULL REFERENCES group_buys(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quantity_requested INTEGER NOT NULL DEFAULT 1,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_buy_id, user_id)
);

-- Create group_buy_comments table
CREATE TABLE IF NOT EXISTS group_buy_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_buy_id UUID NOT NULL REFERENCES group_buys(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_group_buys_community_slug ON group_buys(community_slug);
CREATE INDEX IF NOT EXISTS idx_group_buys_status ON group_buys(status);
CREATE INDEX IF NOT EXISTS idx_group_buys_deadline ON group_buys(deadline);
CREATE INDEX IF NOT EXISTS idx_group_buy_participants_group_buy_id ON group_buy_participants(group_buy_id);
CREATE INDEX IF NOT EXISTS idx_group_buy_participants_user_id ON group_buy_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_group_buy_comments_group_buy_id ON group_buy_comments(group_buy_id);

-- Enable RLS (Row Level Security)
ALTER TABLE group_buys ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_buy_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_buy_comments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for group_buys
CREATE POLICY "Anyone can view group buys" ON group_buys FOR SELECT USING (true);
CREATE POLICY "Community members can create group buys" ON group_buys FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Organizers can update their group buys" ON group_buys FOR UPDATE USING (auth.uid() = organizer_id);
CREATE POLICY "Organizers can delete their group buys" ON group_buys FOR DELETE USING (auth.uid() = organizer_id);

-- Create RLS policies for group_buy_participants
CREATE POLICY "Anyone can view participants" ON group_buy_participants FOR SELECT USING (true);
CREATE POLICY "Authenticated users can join group buys" ON group_buy_participants FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);
CREATE POLICY "Users can update their own participation" ON group_buy_participants FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can leave group buys" ON group_buy_participants FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for group_buy_comments
CREATE POLICY "Anyone can view comments" ON group_buy_comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can comment" ON group_buy_comments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);
CREATE POLICY "Users can update their own comments" ON group_buy_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON group_buy_comments FOR DELETE USING (auth.uid() = user_id);

-- Create function to update current_quantity when participants join/leave
CREATE OR REPLACE FUNCTION update_group_buy_quantity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE group_buys 
    SET current_quantity = current_quantity + NEW.quantity_requested,
        updated_at = NOW()
    WHERE id = NEW.group_buy_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE group_buys 
    SET current_quantity = current_quantity - OLD.quantity_requested,
        updated_at = NOW()
    WHERE id = OLD.group_buy_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE group_buys 
    SET current_quantity = current_quantity - OLD.quantity_requested + NEW.quantity_requested,
        updated_at = NOW()
    WHERE id = NEW.group_buy_id;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update quantity
CREATE TRIGGER trigger_update_group_buy_quantity_insert
  AFTER INSERT ON group_buy_participants
  FOR EACH ROW EXECUTE FUNCTION update_group_buy_quantity();

CREATE TRIGGER trigger_update_group_buy_quantity_delete
  AFTER DELETE ON group_buy_participants
  FOR EACH ROW EXECUTE FUNCTION update_group_buy_quantity();

CREATE TRIGGER trigger_update_group_buy_quantity_update
  AFTER UPDATE ON group_buy_participants
  FOR EACH ROW EXECUTE FUNCTION update_group_buy_quantity();

-- Create function to update group buy status based on deadline and quantity
CREATE OR REPLACE FUNCTION update_group_buy_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Mark as successful if target quantity is reached
  IF NEW.current_quantity >= NEW.target_quantity AND NEW.status = 'pending' THEN
    NEW.status = 'successful';
  END IF;
  
  -- Mark as expired if deadline has passed and not successful
  IF NEW.deadline < NOW() AND NEW.status = 'pending' THEN
    NEW.status = 'expired';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update status
CREATE TRIGGER trigger_update_group_buy_status
  BEFORE UPDATE ON group_buys
  FOR EACH ROW EXECUTE FUNCTION update_group_buy_status();
