-- Function to update location ad count
CREATE OR REPLACE FUNCTION update_location_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO locations (name, ad_count) 
        VALUES (NEW.location, 1)
        ON CONFLICT (name) 
        DO UPDATE SET ad_count = locations.ad_count + 1;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE locations 
        SET ad_count = ad_count - 1 
        WHERE name = OLD.location;
        DELETE FROM locations WHERE ad_count <= 0;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for location count updates
DROP TRIGGER IF EXISTS trigger_update_location_count ON ads;
CREATE TRIGGER trigger_update_location_count
    AFTER INSERT OR DELETE ON ads
    FOR EACH ROW EXECUTE FUNCTION update_location_count();

-- Function to clean up expired ads
CREATE OR REPLACE FUNCTION cleanup_expired_ads()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM ads WHERE expires_at < CURRENT_TIMESTAMP AND is_active = true;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
