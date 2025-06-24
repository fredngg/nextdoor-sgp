-- Create group_buy_participants table if it doesn't exist
CREATE TABLE IF NOT EXISTS group_buy_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_buy_id UUID NOT NULL REFERENCES group_buys(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    quantity_requested INTEGER NOT NULL DEFAULT 1,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_buy_id, user_id)
);

-- Create group_buy_comments table if it doesn't exist
CREATE TABLE IF NOT EXISTS group_buy_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_buy_id UUID NOT NULL REFERENCES group_buys(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE group_buy_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_buy_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for group_buy_participants
CREATE POLICY "Anyone can view group buy participants" ON group_buy_participants
    FOR SELECT USING (true);

CREATE POLICY "Users can join group buys" ON group_buy_participants
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own participation" ON group_buy_participants
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for group_buy_comments
CREATE POLICY "Anyone can view group buy comments" ON group_buy_comments
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can add comments" ON group_buy_comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON group_buy_comments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON group_buy_comments
    FOR DELETE USING (auth.uid() = user_id);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_group_buy_participants_group_buy_id ON group_buy_participants(group_buy_id);
CREATE INDEX IF NOT EXISTS idx_group_buy_participants_user_id ON group_buy_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_group_buy_comments_group_buy_id ON group_buy_comments(group_buy_id);
CREATE INDEX IF NOT EXISTS idx_group_buy_comments_user_id ON group_buy_comments(user_id);

-- Update group_buys current_quantity based on participants
CREATE OR REPLACE FUNCTION update_group_buy_quantity()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE group_buys 
        SET current_quantity = (
            SELECT COALESCE(SUM(quantity_requested), 0)
            FROM group_buy_participants 
            WHERE group_buy_id = NEW.group_buy_id
        )
        WHERE id = NEW.group_buy_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE group_buys 
        SET current_quantity = (
            SELECT COALESCE(SUM(quantity_requested), 0)
            FROM group_buy_participants 
            WHERE group_buy_id = OLD.group_buy_id
        )
        WHERE id = OLD.group_buy_id;
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE group_buys 
        SET current_quantity = (
            SELECT COALESCE(SUM(quantity_requested), 0)
            FROM group_buy_participants 
            WHERE group_buy_id = NEW.group_buy_id
        )
        WHERE id = NEW.group_buy_id;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update current_quantity
DROP TRIGGER IF EXISTS trigger_update_group_buy_quantity_insert ON group_buy_participants;
DROP TRIGGER IF EXISTS trigger_update_group_buy_quantity_update ON group_buy_participants;
DROP TRIGGER IF EXISTS trigger_update_group_buy_quantity_delete ON group_buy_participants;

CREATE TRIGGER trigger_update_group_buy_quantity_insert
    AFTER INSERT ON group_buy_participants
    FOR EACH ROW EXECUTE FUNCTION update_group_buy_quantity();

CREATE TRIGGER trigger_update_group_buy_quantity_update
    AFTER UPDATE ON group_buy_participants
    FOR EACH ROW EXECUTE FUNCTION update_group_buy_quantity();

CREATE TRIGGER trigger_update_group_buy_quantity_delete
    AFTER DELETE ON group_buy_participants
    FOR EACH ROW EXECUTE FUNCTION update_group_buy_quantity();
